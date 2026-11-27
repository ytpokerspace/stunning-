"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const A=require("./adventure.js");
const S=require("./adventure-save.js");
function memoryStorage(seed){
  const data=new Map(Object.entries(seed||{}));
  return {getItem:key=>data.has(key)?data.get(key):null,setItem:(key,value)=>data.set(key,String(value)),removeItem:key=>data.delete(key),data};
}
function completedState(){
  let state=A.initialState();
  state=A.choose(state,"lost-map",0);
  state=A.choose(state,"river-lights",1);
  state=A.choose(state,"quiet-ruins",0);
  return state;
}
test("missing save is reported without inventing progress",()=>{
  const result=S.load(memoryStorage());
  assert.equal(result.status,"missing");
  assert.equal(result.state,null);
});
test("save and load preserve a partial adventure",()=>{
  const state=A.choose(A.initialState(),"lost-map",1);
  const storage=memoryStorage();
  S.save(state,storage,123456);
  const result=S.load(storage);
  assert.equal(result.status,"loaded");
  assert.deepEqual(result.state,state);
  assert.equal(result.savedAt,123456);
});
test("fully completed adventure remains valid",()=>{
  const state=completedState();
  const storage=memoryStorage();
  S.save(state,storage,99);
  assert.deepEqual(S.load(storage).state,state);
});
test("save does not mutate the game state",()=>{
  const state=A.initialState();
  const before=JSON.stringify(state);
  S.save(state,memoryStorage(),10);
  assert.equal(JSON.stringify(state),before);
});
test("corrupt JSON is reported and not overwritten",()=>{
  const storage=memoryStorage({[S.STORAGE_KEY]:"{not-json"});
  const result=S.load(storage);
  assert.equal(result.status,"invalid");
  assert.equal(result.error.code,"CORRUPT_JSON");
  assert.equal(storage.getItem(S.STORAGE_KEY),"{not-json");
});
test("checksum detects accidental save modification",()=>{
  const storage=memoryStorage();
  S.save(A.initialState(),storage,1);
  const record=JSON.parse(storage.getItem(S.STORAGE_KEY));
  record.payload.coins=999;
  storage.setItem(S.STORAGE_KEY,JSON.stringify(record));
  assert.equal(S.load(storage).error.code,"CHECKSUM_MISMATCH");
});
test("unsupported schema version is reported separately",()=>{
  const storage=memoryStorage({[S.STORAGE_KEY]:JSON.stringify({schemaVersion:999})});
  assert.equal(S.load(storage).status,"unsupported");
});
test("invalid quest identifiers are rejected",()=>{
  const state=A.initialState();
  state.completed=["made-up-quest"];
  assert.throws(()=>S.validateState(state),/unknown or repeated quest/);
});
test("out-of-order quest completion is rejected",()=>{
  const state=A.initialState();
  state.completed=["river-lights"];
  assert.throws(()=>S.validateState(state),/completion order/);
});
test("mismatched unlocked areas are rejected",()=>{
  const state=A.initialState();
  state.unlocked.push("archive");
  assert.throws(()=>S.validateState(state),/progress and unlocked areas/);
});
test("exported save can be imported into another storage provider",()=>{
  const state=A.choose(A.initialState(),"lost-map",0);
  const exported=S.exportSave(state,500);
  const storage=memoryStorage();
  const imported=S.importSave(exported,storage);
  assert.deepEqual(imported,state);
  assert.deepEqual(S.load(storage).state,state);
});
test("invalid import never replaces existing progress",()=>{
  const storage=memoryStorage();
  const original=A.initialState();
  S.save(original,storage,1);
  assert.throws(()=>S.importSave("bad json",storage),/valid JSON/);
  assert.deepEqual(S.load(storage).state,original);
});
test("remove clears the saved progress",()=>{
  const storage=memoryStorage();
  S.save(A.initialState(),storage,1);
  assert.equal(S.remove(storage),true);
  assert.equal(S.load(storage).status,"missing");
});
test("storage write failures produce a clear error",()=>{
  const storage={getItem(){return null},setItem(){throw Error("quota")},removeItem(){}};
  assert.throws(()=>S.save(A.initialState(),storage),error=>error.code==="STORAGE_WRITE_FAILED");
});
test("invalid negative and fractional balances are rejected",()=>{
  for(const coins of [-1,1.5]){
    const state=A.initialState();state.coins=coins;
    assert.throws(()=>S.validateState(state),/non-negative whole numbers/);
  }
});
