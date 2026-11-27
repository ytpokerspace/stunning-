(function(root){
"use strict";
const MAGIC=[80,75,76,77,73,77,71,49]; // PKLMIMG1
const VERSION=1, HEADER_SIZE=32, WIDTH=256, MAX_HEIGHT=4096;
const PNG=[137,80,78,71,13,10,26,10];
const encoder=new TextEncoder(),decoder=new TextDecoder("utf-8",{fatal:true});
class CartridgeError extends Error{constructor(message,code){super(message);this.name="CartridgeError";this.code=code||"CARTRIDGE_ERROR"}}
function crc32(bytes){let c=0xffffffff;for(const b of bytes){c^=b;for(let k=0;k<8;k++)c=(c>>>1)^((c&1)?0xedb88320:0)}return (c^0xffffffff)>>>0}
function u32(n){return [(n>>>24)&255,(n>>>16)&255,(n>>>8)&255,n&255]}
function read32(b,o){return ((b[o]*0x1000000)+(b[o+1]<<16)+(b[o+2]<<8)+b[o+3])>>>0}
function u16(n){return [(n>>>8)&255,n&255]}
function read16(b,o){return (b[o]<<8)|b[o+1]}
function concat(parts){const size=parts.reduce((n,p)=>n+p.length,0),out=new Uint8Array(size);let at=0;for(const p of parts){out.set(p,at);at+=p.length}return out}
async function transform(bytes,kind){
 const C=kind==="compress"?root.CompressionStream:root.DecompressionStream;
 if(typeof C!=="function")throw new CartridgeError("This browser does not support PNG compression. Use a current version of Chrome or another compatible browser.","COMPRESSION_UNAVAILABLE");
 try{return new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new C("deflate"))).arrayBuffer())}
 catch(e){throw new CartridgeError("PNG compression or decompression failed.","COMPRESSION_FAILED")}
}
function chunk(type,data){
 const t=encoder.encode(type),body=concat([t,data]);
 return concat([u32(data.length),body,new Uint8Array(u32(crc32(body)))]);
}
function makeHeader(width,height,payload,sequence){
 const h=new Uint8Array(HEADER_SIZE);h.set(MAGIC,0);h.set(u16(VERSION),8);h.set(u16(0),10);
 h.set(u32(width),12);h.set(u32(height),16);h.set(u32(payload.length),20);h.set(u32(sequence>>>0),24);
 h.set(u32(crc32(payload)),28-4); // payload CRC at byte 24? overwritten below with explicit layout
 // Header layout: magic[0..7], version[8..9], flags[10..11], width[12..15], height[16..19], payloadLength[20..23], sequence[24..27], payloadCRC[28..31]
 h.set(u32(sequence>>>0),24);h.set(u32(crc32(payload)),28);
 return h;
}
function parseHeader(h,rgb){
 if(h.length<HEADER_SIZE||MAGIC.some((v,i)=>h[i]!==v))throw new CartridgeError("This image is not a POKÉLLM pixel cartridge.","NOT_CARTRIDGE");
 const version=read16(h,8),width=read32(h,12),height=read32(h,16),length=read32(h,20),sequence=read32(h,24),sum=read32(h,28);
 if(version!==VERSION)throw new CartridgeError("This cartridge uses an unsupported format version.","UNSUPPORTED_VERSION");
 if(width!==WIDTH||height<1||height>MAX_HEIGHT||length>width*height*3-HEADER_SIZE)throw new CartridgeError("Cartridge dimensions or payload length are invalid.","INVALID_HEADER");
 const payload=rgb.slice(HEADER_SIZE,HEADER_SIZE+length);
 if(crc32(payload)!==sum)throw new CartridgeError("Cartridge data integrity check failed.","CHECKSUM_MISMATCH");
 return {payload,sequence,width,height};
}
function pngScanlines(rgb,width,height){
 const rowBytes=width*4,out=new Uint8Array(height*(rowBytes+1));
 for(let y=0;y<height;y++){const dst=y*(rowBytes+1);out[dst]=0;out.set(rgb.subarray(y*rowBytes,(y+1)*rowBytes),dst+1)}
 return out;
}
async function encode(state,options){
 options=options||{};
 if(!state||typeof state!=="object"||Array.isArray(state))throw new CartridgeError("Game state must be a plain object.","INVALID_STATE");
 let json;try{json=JSON.stringify(state)}catch(_){throw new CartridgeError("Game state cannot be serialized.","INVALID_STATE")}
 if(typeof json!=="string")throw new CartridgeError("Game state cannot be serialized.","INVALID_STATE");
 const payload=encoder.encode(json),height=Math.max(1,Math.ceil((HEADER_SIZE+payload.length)/(WIDTH*3)));
 if(height>MAX_HEIGHT)throw new CartridgeError("Game save is too large for this cartridge format.","SAVE_TOO_LARGE");
 const rgbData=new Uint8Array(WIDTH*height*3);rgbData.set(makeHeader(WIDTH,height,payload,Number.isSafeInteger(options.sequence)?options.sequence:0));rgbData.set(payload,HEADER_SIZE);
 const rgba=new Uint8Array(WIDTH*height*4);
 for(let p=0,j=0;p<rgbData.length;p+=3,j+=4){rgba[j]=rgbData[p];rgba[j+1]=rgbData[p+1];rgba[j+2]=rgbData[p+2];rgba[j+3]=255}
 const compressed=await transform(pngScanlines(rgba,WIDTH,height),"compress");
 const ihdr=concat([u32(WIDTH),u32(height),new Uint8Array([8,6,0,0,0])]);
 return concat([new Uint8Array(PNG),chunk("IHDR",ihdr),chunk("sRGB",new Uint8Array([0])),chunk("IDAT",compressed),chunk("IEND",new Uint8Array(0))]);
}
function unfilter(raw,width,height){
 const stride=width*4,bpp=4,out=new Uint8Array(height*stride);let src=0;
 for(let y=0;y<height;y++){
  const filter=raw[src++],row=y*stride;
  if(filter>4)throw new CartridgeError("PNG uses an unsupported row filter.","INVALID_PNG");
  for(let x=0;x<stride;x++){
   const v=raw[src++],a=x>=bpp?out[row+x-bpp]:0,b=y?out[row-stride+x]:0,c=(y&&x>=bpp)?out[row-stride+x-bpp]:0;
   let predictor=0;
   if(filter===1)predictor=a;
   else if(filter===2)predictor=b;
   else if(filter===3)predictor=Math.floor((a+b)/2);
   else if(filter===4){const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);predictor=pa<=pb&&pa<=pc?a:pb<=pc?b:c}
   out[row+x]=(v+predictor)&255;
  }
 }
 if(src!==raw.length)throw new CartridgeError("PNG pixel data has an unexpected length.","INVALID_PNG");
 return out;
}
async function decode(input){
 const bytes=input instanceof Uint8Array?input:new Uint8Array(input);
 if(bytes.length<8||PNG.some((v,i)=>bytes[i]!==v))throw new CartridgeError("File is not a PNG image.","INVALID_PNG");
 let offset=8,width=0,height=0,seenHeader=false,seenEnd=false;const idats=[];
 while(offset+12<=bytes.length){
  const len=read32(bytes,offset);if(len>bytes.length-offset-12)throw new CartridgeError("PNG chunk length is invalid.","INVALID_PNG");
  const typeBytes=bytes.subarray(offset+4,offset+8),type=new TextDecoder().decode(typeBytes),data=bytes.subarray(offset+8,offset+8+len),stored=read32(bytes,offset+8+len);
  if(crc32(concat([typeBytes,data]))!==stored)throw new CartridgeError("PNG chunk checksum failed.","PNG_CHECKSUM");
  if(type==="IHDR"){
   if(seenHeader||len!==13)throw new CartridgeError("PNG header is invalid.","INVALID_PNG");
   width=read32(data,0);height=read32(data,4);
   if(data[8]!==8||data[9]!==6||data[12]!==0||width!==WIDTH||height<1||height>MAX_HEIGHT)throw new CartridgeError("Only standard 8-bit RGBA POKÉLLM cartridge PNGs are supported.","UNSUPPORTED_PNG");
   seenHeader=true;
  }else if(type==="IDAT"){if(!seenHeader)throw new CartridgeError("PNG data appears before its header.","INVALID_PNG");idats.push(data)}
  else if(type==="IEND"){seenEnd=true;offset+=12+len;break}
  offset+=12+len;
 }
 if(!seenHeader||!seenEnd||!idats.length)throw new CartridgeError("PNG is incomplete.","INVALID_PNG");
 const raw=await transform(concat(idats),"decompress"),expected=height*(width*4+1);
 if(raw.length!==expected)throw new CartridgeError("PNG decompressed size is invalid.","INVALID_PNG");
 const rgba=unfilter(raw,width,height),rgb=new Uint8Array(width*height*3);
 for(let p=0,j=0;p<rgba.length;p+=4,j+=3){if(rgba[p+3]!==255)throw new CartridgeError("Cartridge pixels must be fully opaque.","INVALID_PIXEL_DATA");rgb[j]=rgba[p];rgb[j+1]=rgba[p+1];rgb[j+2]=rgba[p+2]}
 const header=rgb.slice(0,HEADER_SIZE),meta=parseHeader(header,rgb);
 let state;try{state=JSON.parse(decoder.decode(meta.payload))}catch(_){throw new CartridgeError("Cartridge game data is not valid UTF-8 JSON.","INVALID_PAYLOAD")}
 if(!state||typeof state!=="object"||Array.isArray(state))throw new CartridgeError("Cartridge game state has an invalid structure.","INVALID_STATE");
 return {state,sequence:meta.sequence,formatVersion:VERSION,dimensions:{width,height}};
}
const api={VERSION,WIDTH,MAX_HEIGHT,CartridgeError,crc32,encode,decode};
root.PokellmPixelCartridge=api;
if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof globalThis!=="undefined"?globalThis:this);
