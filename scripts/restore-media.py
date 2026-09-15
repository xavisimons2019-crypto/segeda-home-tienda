#!/usr/bin/env python3
"""Restore the original public media, verifying each file before it can be committed.

Uses only Python's standard library and the public migration bucket. Run with
--verify-only to check an existing checkout without downloads or file changes.
"""

import argparse
import concurrent.futures
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re
import sys
import tempfile
import threading
import time
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import HTTPRedirectHandler, Request, build_opener


ROOT = Path(__file__).resolve().parent.parent
MANIFEST = ROOT / "data/media-manifest.json"
RECEIPT = ROOT / "data/media-verification.json"
SOURCE = "https://hzvvawjohdplenohpcnd.supabase.co/storage/v1/object/public/segeda-media/"
EXPECTED_COUNT = 751
WORKERS = 8
TIMEOUT = 30
DEADLINE_SECONDS = 600


class RestoreError(Exception):
    pass


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def validate_manifest(raw):
    records = json.loads(raw)
    if not isinstance(records, list) or len(records) != EXPECTED_COUNT:
        raise RestoreError(f"Expected exactly {EXPECTED_COUNT} media records.")
    seen = set()
    for record in records:
        if not isinstance(record, dict):
            raise RestoreError("Invalid media record.")
        name = record.get("path")
        if not isinstance(name, str) or not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9._/-]*", name):
            raise RestoreError("Invalid media path.")
        path = PurePosixPath(name)
        if path.is_absolute() or path.as_posix() != name or ".." in path.parts:
            raise RestoreError(f"Unsafe media path: {name}")
        is_asset = len(path.parts) == 2 and path.parts[0] == "assets"
        if not is_asset and name not in {"favicon.svg", "file.svg", "globe.svg", "window.svg"}:
            raise RestoreError(f"Unexpected media path: {name}")
        if name in seen:
            raise RestoreError(f"Duplicate media path: {name}")
        seen.add(name)
        if type(record.get("bytes")) is not int or not 0 < record["bytes"] <= 8_000_000:
            raise RestoreError(f"Invalid media size: {name}")
        if not isinstance(record.get("sha256"), str) or not re.fullmatch(r"[0-9a-f]{64}", record["sha256"]):
            raise RestoreError(f"Invalid media checksum: {name}")
    return records


def target_path(name):
    target = ROOT / "public" / name
    for item in (target, *target.parents):
        if item == ROOT:
            break
        if item.is_symlink():
            raise RestoreError(f"Refusing a symbolic link in public/{name}")
    if not target.resolve().is_relative_to((ROOT / "public").resolve()):
        raise RestoreError(f"Media path leaves public/: {name}")
    return target


def verify_bytes(record, body):
    if len(body) != record["bytes"] or hashlib.sha256(body).hexdigest() != record["sha256"]:
        raise RestoreError(f"Size or SHA-256 mismatch: {record['path']}")
    header = f"blob {len(body)}\0".encode("ascii")
    return {
        "path": f"public/{record['path']}",
        "bytes": len(body),
        "sha256": record["sha256"],
        "git_blob_sha": hashlib.sha1(header + body).hexdigest(),
    }


def atomic_write(target, body):
    target.parent.mkdir(parents=True, exist_ok=True)
    temporary = None
    try:
        with tempfile.NamedTemporaryFile(dir=target.parent, prefix=".restore-media-", delete=False) as stream:
            temporary = Path(stream.name)
            stream.write(body)
        os.chmod(temporary, 0o644)
        os.replace(temporary, target)
    finally:
        if temporary is not None:
            temporary.unlink(missing_ok=True)


def restore_one(record, verify_only, stopped, deadline):
    if stopped.is_set() or time.monotonic() >= deadline:
        raise RestoreError("Restoration stopped or exceeded its time limit.")
    target = target_path(record["path"])
    if target.exists():
        if not target.is_file() or target.stat().st_size != record["bytes"]:
            raise RestoreError(f"Existing file differs from the manifest: {record['path']}")
        return verify_bytes(record, target.read_bytes()), False
    if verify_only:
        raise RestoreError(f"Missing media: {record['path']}")
    url = SOURCE + quote(record["path"], safe="/")
    for attempt in range(3):
        if stopped.is_set() or time.monotonic() >= deadline:
            raise RestoreError("Restoration stopped or exceeded its time limit.")
        try:
            request = Request(url, headers={"User-Agent": "SegedaMediaRestore/1.0"})
            with build_opener(NoRedirect()).open(request, timeout=TIMEOUT) as response:
                body = response.read(record["bytes"] + 1)
            receipt = verify_bytes(record, body)
            if target.exists():
                raise RestoreError(f"File appeared during restoration: {record['path']}")
            atomic_write(target_path(record["path"]), body)
            return receipt, True
        except HTTPError as error:
            if error.code != 429 and not 500 <= error.code <= 599:
                raise RestoreError(f"Download failed for {record['path']}: HTTP {error.code}") from None
            reason = f"HTTP {error.code}"
        except (URLError, TimeoutError, OSError):
            reason = "network error"
        if attempt < 2:
            if stopped.wait(2 ** attempt):
                raise RestoreError("Restoration stopped.")
    raise RestoreError(f"Download failed for {record['path']} after 3 attempts: {reason}")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--verify-only", action="store_true", help="Verify existing files; never download or write a receipt.")
    args = parser.parse_args()
    raw = MANIFEST.read_bytes()
    records = validate_manifest(raw)
    stopped = threading.Event()
    deadline = time.monotonic() + DEADLINE_SECONDS
    verified = {}
    downloaded = 0
    with concurrent.futures.ThreadPoolExecutor(max_workers=WORKERS) as pool:
        futures = [pool.submit(restore_one, item, args.verify_only, stopped, deadline) for item in records]
        try:
            for future in concurrent.futures.as_completed(futures):
                item, was_downloaded = future.result()
                verified[item["path"]] = item
                downloaded += was_downloaded
                if len(verified) % 100 == 0 or len(verified) == EXPECTED_COUNT:
                    print(f"Verified {len(verified)}/{EXPECTED_COUNT} media files.", flush=True)
        except Exception:
            stopped.set()
            for future in futures:
                future.cancel()
            raise
    if len(verified) != EXPECTED_COUNT:
        raise RestoreError("Incomplete media verification; no receipt will be written.")
    if not args.verify_only:
        if RECEIPT.is_symlink() or RECEIPT.parent.is_symlink():
            raise RestoreError("Refusing a symbolic link at the verification receipt.")
        receipt = {
            "format": "segeda-media-verification-v1",
            "status": "success",
            "count": len(verified),
            "downloaded": downloaded,
            "verified_existing": len(verified) - downloaded,
            "total_bytes": sum(item["bytes"] for item in verified.values()),
            "manifest_sha256": hashlib.sha256(raw).hexdigest(),
            "run_id": os.environ.get("GITHUB_RUN_ID", "local"),
            "run_attempt": os.environ.get("GITHUB_RUN_ATTEMPT", "local"),
            "source_commit": os.environ.get("GITHUB_SHA", "local"),
            "files": [verified[f"public/{item['path']}"] for item in records],
        }
        atomic_write(RECEIPT, (json.dumps(receipt, indent=2) + "\n").encode("utf-8"))
    print(f"Success: {EXPECTED_COUNT} verified, {downloaded} downloaded, {EXPECTED_COUNT - downloaded} existing files unchanged.")


if __name__ == "__main__":
    try:
        main()
    except (RestoreError, OSError, ValueError) as error:
        print(f"Media restoration failed: {error}", file=sys.stderr)
        sys.exit(1)
