(function(root){
"use strict";
const VERSION=1;
const STORAGE_KEY="pokellm.adventure.save";
const MAX_LOG_ENTRIES=500;
const QUEST_IDS=new Set(["lost-map","river-lights","quiet-ruins"]);
const AREA_IDS=new Set(["whisperwood","silverstream","archive"]);
class SaveError extends Error{
  constructor(message,code){super(message);this.name="SaveError";this.code=code||"SAVE_ERROR";}
}
function checksum(value){
  let hash=2166136261;
  for(let i=0;i<value.length;i++){
    hash^=value.charCodeAt(i);
    hash=Math.imul(hash,16777619);
  }
  return (hash>>>0).toString(16).padStart(8,"0");
}
function validateState(state){
  if(!state||typeof state!=="object"||Array.isArray(state))throw new SaveError("Save data must be an object.","INVALID_STATE");
  if(!Array.isArray(state.completed)||!Array.isArray(state.unlocked)||!Array.isArray(state.log))throw new SaveError("Save data is missing required lists.","INVALID_STATE");
  if(!Number.isSafeInteger(state.coins)||state.coins<0||!Number.isSafeInteger(state.experience)||state.experience<0)throw new SaveError("Coins and experience must be non-negative whole numbers.","INVALID_STATE");
  if(state.completed.some(id=>typeof id!=="string"||!QUEST_IDS.has(id))||new Set(state.completed).size!==state.completed.length)throw new SaveError("Save contains an unknown or repeated quest.","INVALID_STATE");
  if(state.unlocked.some(id=>typeof id!=="string"||!AREA_IDS.has(id))||new Set(state.unlocked).size!==state.unlocked.length||!state.unlocked.includes("whisperwood"))throw new SaveError("Save contains invalid area unlocks.","INVALID_STATE");
  const orderedQuests=["lost-map","river-lights","quiet-ruins"];
  if(state.completed.some((id,index)=>id!==orderedQuests[index]))throw new SaveError("Quest completion order is invalid.","INVALID_STATE");
  const orderedAreas=["whisperwood","silverstream","archive"];
  const expectedAreaCount=Math.min(state.completed.length+1,orderedAreas.length);
  if(state.unlocked.length!==expectedAreaCount||state.unlocked.some((id,index)=>id!==orderedAreas[index]))throw new SaveError("Quest progress and unlocked areas do not match.","INVALID_STATE");
  if(state.log.length>MAX_LOG_ENTRIES||state.log.some(line=>typeof line!=="string"||line.length>2000))throw new SaveError("Adventure journal is invalid or too large.","INVALID_STATE");
  if(state.activeQuest!==null&&typeof state.activeQuest!=="string")throw new SaveError("Active quest value is invalid.","INVALID_STATE");
  return {
    completed:state.completed.slice(),
    coins:state.coins,
    experience:state.experience,
    unlocked:state.unlocked.slice(),
    log:state.log.slice(),
    activeQuest:state.activeQuest
  };
}
function envelope(state,now){
  const payload=validateState(state);
  const canonical=JSON.stringify(payload);
  return {schemaVersion:VERSION,savedAt:now,payload,checksum:checksum(canonical)};
}
function decode(raw){
  let parsed;
  try{parsed=JSON.parse(raw);}catch(_){throw new SaveError("Save file is not valid JSON.","CORRUPT_JSON");}
  if(!parsed||typeof parsed!=="object"||Array.isArray(parsed))throw new SaveError("Save envelope is invalid.","INVALID_ENVELOPE");
  if(parsed.schemaVersion!==VERSION)throw new SaveError("This save uses an unsupported version.","UNSUPPORTED_VERSION");
  if(typeof parsed.checksum!=="string"||!parsed.payload||typeof parsed.payload!=="object")throw new SaveError("Save envelope is incomplete.","INVALID_ENVELOPE");
  const payload=validateState(parsed.payload);
  if(checksum(JSON.stringify(payload))!==parsed.checksum)throw new SaveError("Save integrity check failed.","CHECKSUM_MISMATCH");
  return {state:payload,savedAt:Number.isFinite(parsed.savedAt)?parsed.savedAt:null};
}
function requireStorage(storage){
  if(!storage||typeof storage.getItem!=="function"||typeof storage.setItem!=="function"||typeof storage.removeItem!=="function")throw new SaveError("A compatible storage provider is required.","STORAGE_UNAVAILABLE");
  return storage;
}
function save(state,storage,now){
  const target=requireStorage(storage);
  const record=envelope(state,Number.isFinite(now)?now:Date.now());
  try{target.setItem(STORAGE_KEY,JSON.stringify(record));}
  catch(error){throw new SaveError("Could not save progress. Check available device storage.","STORAGE_WRITE_FAILED");}
  return {savedAt:record.savedAt,bytes:JSON.stringify(record).length};
}
function load(storage){
  const target=requireStorage(storage);
  let raw;
  try{raw=target.getItem(STORAGE_KEY);}
  catch(_){return {status:"unavailable",state:null,error:new SaveError("Could not read device storage.","STORAGE_READ_FAILED")};}
  if(raw===null||raw===undefined||raw==="")return {status:"missing",state:null,error:null};
  try{const result=decode(raw);return {status:"loaded",state:result.state,savedAt:result.savedAt,error:null};}
  catch(error){return {status:error.code==="UNSUPPORTED_VERSION"?"unsupported":"invalid",state:null,error};}
}
function remove(storage){
  const target=requireStorage(storage);
  try{target.removeItem(STORAGE_KEY);return true;}
  catch(_){throw new SaveError("Could not remove the saved progress.","STORAGE_REMOVE_FAILED");}
}
function exportSave(state,now){return JSON.stringify(envelope(state,Number.isFinite(now)?now:Date.now()),null,2);}
function importSave(raw,storage){
  const target=requireStorage(storage);
  if(typeof raw!=="string")throw new SaveError("Imported save must be text.","INVALID_IMPORT");
  const decoded=decode(raw);
  save(decoded.state,target,decoded.savedAt===null?Date.now():decoded.savedAt);
  return decoded.state;
}
const api={VERSION,STORAGE_KEY,SaveError,validateState,save,load,remove,exportSave,importSave};
root.PokellmAdventureSave=api;
if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof globalThis!=="undefined"?globalThis:this);
