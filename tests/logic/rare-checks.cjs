'use strict';
const assert=require('node:assert/strict'),{createHarness}=require('./harness.cjs');
module.exports=()=>{
 const results=[],check=(name,fn)=>{try{fn();results.push({name,pass:true});}catch(error){results.push({name,pass:false,error:error.stack});}};
 check('legacy rare enhancements are not offered alongside new awakenings',()=>{
  const {game}=createHarness();game.begin();game.g.weapons=Object.fromEntries(Object.keys(game.W).map(id=>[id,{lv:7,up:[0,0,0],evo:null,break:false}]));
  for(const reason of ['level','bonus']){game.g.cardReason=reason;for(let i=0;i<100;i++){assert.equal(game.rollRareCard(),null);assert(!game.rollCards(null).some(c=>c.type==='rare'||c.type==='evo'||c.type==='break'||c.type==='mastery'));}}
 });
 check('stale legacy rare cards cannot apply an overlapping enhancement',()=>{
  const {game}=createHarness();game.begin();for(const [id,card] of Object.entries(game.RARE_CARDS)){game.g.cards=[{type:'rare',id,...card}];game.setScreen('cards');game.selectCard(0);assert.equal(game.g.rareCard,null);assert(!game.g.bookFamiliar);}
 });
 const failures=results.filter(r=>!r.pass);return {passed:results.length-failures.length,total:results.length,failures,detail:'no old rare, breakthrough, branch-evolution or mastery offers; stale rare selection rejected'};
};
