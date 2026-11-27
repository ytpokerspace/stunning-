(function(root){"use strict";
const SUITS=["♠","♥","♦","♣"],RANKS=[2,3,4,5,6,7,8,9,10,11,12,13,14];
const NAMES={2:"2",3:"3",4:"4",5:"5",6:"6",7:"7",8:"8",9:"9",10:"10",11:"J",12:"Q",13:"K",14:"A"};
function deck(){return SUITS.flatMap(s=>RANKS.map(r=>({rank:r,suit:s,label:NAMES[r]+s})))}
function shuffle(cards,rng=Math.random){const a=cards.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function evaluateFive(cards){
 if(!Array.isArray(cards)||cards.length!==5)throw new RangeError("Select exactly five cards.");
 const ranks=cards.map(c=>c.rank).sort((a,b)=>b-a),counts={};ranks.forEach(r=>counts[r]=(counts[r]||0)+1);
 const groups=Object.entries(counts).map(([r,n])=>({rank:Number(r),count:n})).sort((a,b)=>b.count-a.count||b.rank-a.rank);
 const flush=cards.every(c=>c.suit===cards[0].suit);
 const unique=[...new Set(ranks)].sort((a,b)=>b-a);
 let straightHigh=0;
 if(unique.length===5){if(unique[0]-unique[4]===4)straightHigh=unique[0];else if(unique.join(",")==="14,5,4,3,2")straightHigh=5}
 let category,tie;
 if(flush&&straightHigh){category=8;tie=[straightHigh]}
 else if(groups[0].count===4){category=7;tie=[groups[0].rank,groups[1].rank]}
 else if(groups[0].count===3&&groups[1].count===2){category=6;tie=[groups[0].rank,groups[1].rank]}
 else if(flush){category=5;tie=ranks}
 else if(straightHigh){category=4;tie=[straightHigh]}
 else if(groups[0].count===3){category=3;tie=[groups[0].rank,...groups.slice(1).map(g=>g.rank).sort((a,b)=>b-a)]}
 else if(groups[0].count===2&&groups[1].count===2){category=2;tie=[Math.max(groups[0].rank,groups[1].rank),Math.min(groups[0].rank,groups[1].rank),groups[2].rank]}
 else if(groups[0].count===2){category=1;tie=[groups[0].rank,...groups.slice(1).map(g=>g.rank).sort((a,b)=>b-a)]}
 else {category=0;tie=ranks}
 return {category,tie,name:["High card","One pair","Two pair","Three of a kind","Straight","Flush","Full house","Four of a kind","Straight flush"][category]};
}
function compare(a,b){if(a.category!==b.category)return Math.sign(a.category-b.category);for(let i=0;i<Math.max(a.tie.length,b.tie.length);i++){const d=(a.tie[i]||0)-(b.tie[i]||0);if(d)return Math.sign(d)}return 0}
function bestOfSeven(cards){if(cards.length!==7)throw new RangeError("Seven cards are required.");let best=null;for(let a=0;a<3;a++)for(let b=a+1;b<4;b++)for(let c=b+1;c<5;c++)for(let d=c+1;d<6;d++)for(let e=d+1;e<7;e++){const v=evaluateFive([cards[a],cards[b],cards[c],cards[d],cards[e]]);if(!best||compare(v,best)>0)best=v}return best}
function deal(rng=Math.random){const cards=shuffle(deck(),rng);return {player:cards.slice(0,2),rival:cards.slice(2,4),community:cards.slice(4,9),score:0}}
const api={deck,shuffle,evaluateFive,compare,bestOfSeven,deal};
if(typeof module!=="undefined"&&module.exports)module.exports=api;root.PokellmPoker=api;
})(typeof globalThis!=="undefined"?globalThis:this);
