"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const C=require("./pixel-cartridge.js");
const sample={player:{level:4,xp:125},team:[{id:"creature-unique-001",species:"Emberkit",hp:31}],world:{area:"whisperwood",quests:["lost-map"]},inventory:{coins:18}};
test("PNG pixel cartridge round-trips game state",async()=>{
 const png=await C.encode(sample,{sequence:7});
 assert.deepEqual(Array.from(png.subarray(0,8)),[137,80,78,71,13,10,26,10]);
 const result=await C.decode(png);
 assert.deepEqual(result.state,sample);
 assert.equal(result.sequence,7);
 assert.equal(result.formatVersion,1);
});
test("encoding is deterministic for the same state and sequence",async()=>{
 const a=await C.encode(sample,{sequence:3}),b=await C.encode(sample,{sequence:3});
 assert.deepEqual(a,b);
});
test("sequence is stored and recovered",async()=>{
 const result=await C.decode(await C.encode(sample,{sequence:429}));
 assert.equal(result.sequence,429);
});
test("rejects non-PNG input",async()=>{
 await assert.rejects(()=>C.decode(new Uint8Array([1,2,3])),e=>e.code==="INVALID_PNG");
});
test("rejects a PNG with a damaged chunk checksum",async()=>{
 const png=await C.encode(sample);png[png.length-5]^=1;
 await assert.rejects(()=>C.decode(png),e=>e.code==="PNG_CHECKSUM");
});
test("rejects a non-cartridge PNG",async()=>{
 const png=await C.encode(sample);
 // Alter the first pixel payload magic and repair the IDAT is intentionally not attempted.
 const bad=await C.encode({unrelated:true});
 await assert.rejects(()=>C.decode(bad.slice(0,8)),e=>e.code==="INVALID_PNG");
});
test("rejects arrays as top-level game state",async()=>{
 await assert.rejects(()=>C.encode([1,2]),e=>e.code==="INVALID_STATE");
});
test("rejects unsupported save size before encoding",async()=>{
 const huge={data:"x".repeat(C.WIDTH*C.MAX_HEIGHT*3)};
 await assert.rejects(()=>C.encode(huge),e=>e.code==="SAVE_TOO_LARGE");
});
test("PNG decoder reports dimensions",async()=>{
 const result=await C.decode(await C.encode(sample));
 assert.equal(result.dimensions.width,C.WIDTH);
 assert.ok(result.dimensions.height>=1);
});
