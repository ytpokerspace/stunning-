"use strict";const test=require("node:test");const assert=require("node:assert/strict");const A=require("./adventure.js");
test("starts with first area and no rewards",()=>{const s=A.initialState();assert.deepEqual(s.unlocked,["whisperwood"]);assert.equal(s.coins,0);assert.equal(A.availableQuests(s).length,1)});
test("quest rewards coins and experience",()=>{const s=A.choose(A.initialState(),"lost-map",0);assert.equal(s.coins,12);assert.equal(s.experience,10);assert.deepEqual(s.completed,["lost-map"])});
test("completing first quest unlocks second area",()=>{const s=A.choose(A.initialState(),"lost-map",0);assert.ok(s.unlocked.includes("silverstream"));assert.equal(A.availableQuests(s)[0].id,"river-lights")});
test("cannot claim same quest twice",()=>{const s=A.choose(A.initialState(),"lost-map",0);assert.throws(()=>A.choose(s,"lost-map",0),/unavailable/)});
test("cannot access locked quest",()=>assert.throws(()=>A.choose(A.initialState(),"quiet-ruins",0),/unavailable/));
test("invalid choice is rejected",()=>assert.throws(()=>A.choose(A.initialState(),"lost-map",8),RangeError));
test("original state is not mutated",()=>{const s=A.initialState();A.choose(s,"lost-map",1);assert.equal(s.coins,0);assert.deepEqual(s.completed,[])});
