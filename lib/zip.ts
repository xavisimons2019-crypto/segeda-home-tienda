// ZIP with stored entries: portable and dependency-free. Images are already compressed.
export function makeZip(files:{name:string;bytes:Uint8Array}[]):Blob{
  const encoder=new TextEncoder(),parts:BlobPart[]=[],central:BlobPart[]=[];
  let position=0,centralSize=0;
  const crc=(bytes:Uint8Array)=>{let c=0xffffffff;for(const b of bytes){c^=b;for(let i=0;i<8;i++)c=(c>>>1)^((c&1)?0xedb88320:0);}return (c^0xffffffff)>>>0;};
  for(const file of files){
    const name=encoder.encode(file.name),checksum=crc(file.bytes),header=new Uint8Array(30+name.length),h=new DataView(header.buffer);
    h.setUint32(0,0x04034b50,true);h.setUint16(4,20,true);h.setUint16(6,0x800,true);h.setUint32(14,checksum,true);h.setUint32(18,file.bytes.length,true);h.setUint32(22,file.bytes.length,true);h.setUint16(26,name.length,true);header.set(name,30);
    const entry=new Uint8Array(46+name.length),e=new DataView(entry.buffer);e.setUint32(0,0x02014b50,true);e.setUint16(4,20,true);e.setUint16(6,20,true);e.setUint16(8,0x800,true);e.setUint32(16,checksum,true);e.setUint32(20,file.bytes.length,true);e.setUint32(24,file.bytes.length,true);e.setUint16(28,name.length,true);e.setUint32(42,position,true);entry.set(name,46);
    parts.push(header,file.bytes as Uint8Array<ArrayBuffer>);central.push(entry);position+=header.length+file.bytes.length;centralSize+=entry.length;
  }
  const end=new Uint8Array(22),e=new DataView(end.buffer);e.setUint32(0,0x06054b50,true);e.setUint16(8,files.length,true);e.setUint16(10,files.length,true);e.setUint32(12,centralSize,true);e.setUint32(16,position,true);
  return new Blob([...parts,...central,end],{type:'application/zip'});
}

