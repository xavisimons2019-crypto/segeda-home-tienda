#!/usr/bin/env python3
"""Expand the three large migration source files with exact byte verification."""
import base64
import gzip
import hashlib
import io
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ALLOWED = {"data/catalog-supabase-backup.json", "data/catalog.json", "pnpm-lock.yaml"}


def restore():
    pack = json.loads((ROOT / ".github/migration/source-files.json").read_text())
    records = pack["files"]
    if pack.get("version") != 1 or len(records) != 3 or {r["path"] for r in records} != ALLOWED:
        raise ValueError("Unexpected source transfer manifest")
    prepared = []
    for item in records:
        size = item["bytes"]
        if type(size) is not int or not 0 < size <= 2_000_000:
            raise ValueError("Invalid source file size")
        compressed = base64.b64decode(item["gzip_base64"], validate=True)
        with gzip.GzipFile(fileobj=io.BytesIO(compressed)) as stream:
            body = stream.read(size + 1)
        blob = hashlib.sha1(b"blob " + str(len(body)).encode() + b"\0" + body).hexdigest()
        if len(body) != size or hashlib.sha256(body).hexdigest() != item["sha256"] or blob != item["git_blob_sha"]:
            raise ValueError("Source file checksum mismatch: " + item["path"])
        target = ROOT / item["path"]
        if target.is_symlink() or target.parent.is_symlink():
            raise ValueError("Source destination cannot be a symbolic link")
        if target.exists() and target.read_bytes() != body:
            raise ValueError("Existing source file differs: " + item["path"])
        prepared.append((target, body))
    for target, body in prepared:
        if not target.exists():
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(body)
    print("Verified 3 source files, preserving their original bytes.")


if __name__ == "__main__":
    restore()
