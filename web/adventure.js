(function(root){"use strict";
const QUESTS=[
{id:"lost-map",title:"🗺️ The Missing Map",area:"🌲 Whisperwood",task:"Search the old trail markers for a missing explorer's map.",choices:[{label:"Inspect the mossy stones",skill:"nature",reward:12,success:"You spot a map symbol beneath the moss."},{label:"Follow the stream",skill:"water",reward:10,success:"The stream leads you to a waterproof map case."}]},
{id:"river-lights",title:"💧 Lights on the River",area:"🌊 Silverstream",task:"Discover why friendly lights are appearing along the riverbank.",choices:[{label:"Study the ripples",skill:"water",reward:14,success:"The lights are reflections from glowing river crystals."},{label:"Ask the Brooklet guide",skill:"friendship",reward:11,success:"A local guide explains the crystal pattern."}]},
{id:"quiet-ruins",title:"🏛️ The Quiet Ruins",area:"🪨 Sunken Archive",task:"Solve the archive's symbol sequence to open its history room.",choices:[{label:"Match the ancient symbols",skill:"puzzle",reward:18,success:"The symbols align and reveal the archive's story."},{label:"Ask Mossling to inspect the carvings",skill:"nature",reward:13,success:"Mossling finds the repeating leaf pattern."}]}
];
const AREAS=[{id:"whisperwood",name:"🌲 Whisperwood",unlock:0,quest:"lost-map"},{id:"silverstream",name:"🌊 Silverstream",unlock:1,quest:"river-lights"},{id:"archive",name:"🏛️ Sunken Archive",unlock:2,quest:"quiet-ruins"}];
function initialState(){return {completed:[],coins:0,experience:0,unlocked:["whisperwood"],log:["Your adventure begins at Whisperwood."],activeQuest:null}}
function availableQuests(s){return QUESTS.filter(q=>!s.completed.includes(q.id)&&AREAS.find(a=>a.quest===q.id&&s.unlocked.includes(a.id)))}
function choose(s,id,index){const q=QUESTS.find(x=>x.id===id);if(!q||s.completed.includes(id)||!AREAS.some(a=>a.quest===id&&s.unlocked.includes(a.id)))throw new Error("Quest is unavailable.");const option=q.choices[index];if(!option)throw new RangeError("Unknown quest choice.");const n={...s,completed:s.completed.concat(id),coins:s.coins+option.reward,experience:s.experience+10,log:s.log.concat(q.title+": "+option.success+" (+"+option.reward+" coins, +10 XP)")};const next=AREAS.find(a=>a.unlock===n.completed.length);if(next&&!n.unlocked.includes(next.id)){n.unlocked=n.unlocked.concat(next.id);n.log=n.log.concat("Unlocked "+next.name+"!")}return n}
const api={QUESTS,AREAS,initialState,availableQuests,choose};
root.PokellmAdventure=api;
if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof globalThis!=="undefined"?globalThis:this);
