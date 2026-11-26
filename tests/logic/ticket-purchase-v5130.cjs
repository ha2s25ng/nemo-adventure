'use strict';
const assert=require('node:assert/strict');
const {createHarness}=require('./harness.cjs');
module.exports=async function(){
 const results=[];
 async function check(name,fn){try{await fn();results.push({name,pass:true});}catch(error){results.push({name,pass:false,error:error.stack});}}
 function ready(gold,tickets){
  const h=createHarness();
  h.game.saved=h.game.normalizeSave({version:1,gold,capsuleTickets:tickets});
  h.storage.set(h.game.DATA.saveKey,JSON.stringify(h.game.saved));
  h.game.setScreen('lucky-draw');return h;
 }
 await check('single pull spends a clear ticket without spending any gold and persists once',async()=>{
  const {game,element}=ready(0,1);game.updateDrawWallet();assert.equal(element('draw-buy').disabled,false);
  await game.buyLuckyDraw(1);
  assert.equal(game.saved.gold,0);assert.equal(game.saved.capsuleTickets,0);assert.equal(game.saved.drawCount,1);
  assert.equal(game.readSave().drawCount,1);assert.equal(game.saved.photosOwned.length+game.saved.costumesOwned.length-1,1);
  await game.buyLuckyDraw(1);assert.equal(game.saved.drawCount,1,'unopened capsule prevents a repeated purchase');
 });
 await check('bulk purchase combines three tickets with 630 gold for ten actual rewards',async()=>{
  const {game}=ready(630,3);await game.buyLuckyDraw(10);
  assert.equal(game.saved.capsuleTickets,0);assert.equal(game.saved.drawCount,10);assert.equal(game.saved.gold,0);
  assert.equal(game.readSave().capsuleTickets,0);assert.equal(game.saved.photosOwned.length+game.saved.costumesOwned.length-1,10);
 });
 await check('insufficient mixed payment spends neither tickets nor gold',async()=>{
  const {game,element}=ready(629,3);game.updateDrawWallet();assert.equal(element('draw-buy-ten').disabled,true);
  await game.buyLuckyDraw(10);assert.equal(game.saved.drawCount,0);assert.equal(game.saved.gold,629);assert.equal(game.saved.capsuleTickets,3);
 });
 await check('storage failure rolls back the wallet, ticket and reward together',async()=>{
  const {game,storage}=ready(100,1);const original=storage.get(game.DATA.saveKey);
  storage.set=()=>{throw new Error('simulated storage quota');};
  await game.buyLuckyDraw(1);
  assert.equal(game.saved.gold,100);assert.equal(game.saved.capsuleTickets,1);assert.equal(game.saved.drawCount,0);
  assert.equal(storage.get(game.DATA.saveKey),original);assert.equal(game.saved.photosOwned.length,0);
 });
 const failures=results.filter(r=>!r.pass);
 return {passed:results.length-failures.length,total:results.length,failures,detail:'real single/bulk purchases, insufficient funds, duplicate-click guard and failed-save rollback'};
};
if(require.main===module)module.exports().then(result=>{console.log(`${result.failures.length?'FAIL':'PASS'} ${result.passed}/${result.total}: ${result.detail}`);for(const f of result.failures)console.error(f.name+'\n'+f.error);process.exitCode=result.failures.length?1:0;});
