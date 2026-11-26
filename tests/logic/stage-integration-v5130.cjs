'use strict';
const assert=require('node:assert/strict');
const {createHarness}=require('./harness.cjs');

module.exports=function stageIntegrationChecks(){
 const results=[];
 const check=(name,fn)=>{try{fn();results.push({name,pass:true});}catch(error){results.push({name,pass:false,error:error.stack});}};
 const fresh=()=>{
  const harness=createHarness();
  harness.game.saved=harness.game.normalizeSave({gold:0});
  return harness;
 };
 function defeatNextBoss(game,seconds,{enraged=false}={}){
  const [,at]=game.nextBossEncounter();
  game.g.t=at;game.g.worldClock=at;game.g.bossRestUntil=0;
  game.updateBossEncounter(0);
  const boss=game.g.boss;
  assert.ok(boss,'scheduled encounter must spawn an actual engine boss');
  game.g.t=at+seconds;game.g.worldClock=game.g.t;game.g.bossTime=seconds;
  boss.enraged=enraged;
  game.kill(boss);
  return boss;
 }
 check('engine uses the renewed registries for campaign and survival',()=>{
  const {game}=fresh();
  assert.equal(game.NEMO_STAGES.length,30);assert.equal(game.CAMPAIGN_MAPS.length,30);
  assert.equal(game.NEMO_STAGES[0].bossAt,240);
  game.begin(1);
  assert.equal(game.g.stage,game.NEMO_STAGES[0]);assert.equal(game.g.map,game.CAMPAIGN_MAPS[0]);
  assert.equal(game.g.map.cleanGround,true);assert.equal(game.g.map.texture,undefined);
  assert.equal(game.g.map.structures.length,1);assert.equal(game.g.map.structures[0].x,91);assert.equal(game.g.map.structures[0].y,71);
  assert.ok(game.ASSET_DATA.renewalOak&&game.ASSET_DATA.renewalBlossom&&game.ASSET_DATA.renewalPond);
  game.begin();assert.equal(game.g.stage,null);assert.equal(game.g.map,game.SURVIVAL_MAP);assert.equal(game.g.map.cleanGround,true);
  for(const item of game.g.map.landmarks){
   assert.ok(Number.isFinite(item.x)&&Number.isFinite(item.y));
   assert.ok(Math.hypot(item.x-80,item.y-80)>8,'authored obstacles keep spawn clearing open');
  }
 });
 check('legacy saves preserve purchased progress and receive no retroactive clear tickets',()=>{
  const {game}=fresh();
  const migrated=game.normalizeSave({...game.saved,gold:775,stagesCleared:4,capsuleTickets:2,charactersOwned:['nemo','dori'],characterEquipped:'dori',upgrades:{hp:2}});
  assert.equal(migrated.gold,775);assert.equal(migrated.upgrades.hp,2);assert.equal(migrated.characterEquipped,'dori');assert.equal(migrated.capsuleTickets,2);
  for(let id=1;id<=4;id++){assert.equal(migrated.stageRecords[id].medals,1);assert.equal(migrated.stageRecords[id].claimedClearTicket,true);}
  assert.equal(migrated.stageRecords[5],undefined);
  game.saved=migrated;game.begin(2);game.g.hitCount=99;game.finish(true);
  assert.equal(game.g.stageResult.first,false);assert.equal(game.g.stageResult.clearGold,game.NEMO_STAGES[1].replayGold);assert.equal(game.g.stageResult.tickets,0);
  assert.equal(game.saved.capsuleTickets,2);assert.equal(game.readSave().upgrades.hp,2);
 });
 check('all three actual boss kills are snapshotted before final-boss finish and persisted once',()=>{
  const {game,element}=fresh();game.begin(1);
  defeatNextBoss(game,10);defeatNextBoss(game,20);const final=defeatNextBoss(game,30);
  assert.equal(game.screen,'result');assert.equal(game.g.done,true);assert.equal(game.g.stageBossKills.length,3);
  assert.deepEqual(Array.from(game.g.stageBossKills,kill=>kill.seconds),[10,20,30]);
  assert.equal(game.g.stageResult.medals,7,'last boss must be included in the swift seal');
  assert.equal(game.saved.stageRecords[1].bestBossSeconds,60);assert.equal(game.saved.stageRecords[1].clears,1);
  assert.equal(game.saved.stageRecords[1].bestTime,270);assert.equal(game.saved.stagesCleared,1);assert.equal(game.saved.capsuleTickets,1);
  assert.equal(game.readSave().stageRecords[1].bestBossSeconds,60);assert.ok(element('result-grid').innerHTML.includes('캡슐 교환권'));
  const gold=game.saved.gold,tickets=game.saved.capsuleTickets,wins=game.saved.stats.wins;
  game.kill(final);game.finish(true);
  assert.equal(game.saved.gold,gold);assert.equal(game.saved.capsuleTickets,tickets);assert.equal(game.saved.stats.wins,wins);
 });
 check('an enraged boss does not receive swift credit even if a recorded duration is short',()=>{
  const {game}=fresh();game.begin(1);game.g.hitCount=99;
  defeatNextBoss(game,10);defeatNextBoss(game,20,{enraged:true});defeatNextBoss(game,30);
  assert.equal(game.g.stageBossKills[1].swift,false);assert.equal(game.g.stageResult.medals,1);assert.equal(game.g.stageResult.medalGold,0);
 });
 check('chapter endpoint awards its ticket and regional reward only on the first claim',()=>{
  const {game}=fresh();game.saved=game.normalizeSave({...game.saved,stagesCleared:4});
  game.begin(5);game.g.hitCount=99;game.finish(true);
  assert.equal(game.g.stageResult.clearGold,320);assert.equal(game.g.stageResult.chapterGold,300);assert.equal(game.g.stageResult.tickets,3);
  assert.equal(game.saved.gold,620);assert.equal(game.saved.capsuleTickets,3);assert.deepEqual(Array.from(game.saved.chapterRewardsClaimed),[1]);
  game.begin(5);game.g.hitCount=99;game.finish(true);
  assert.equal(game.g.stageResult.clearGold,115);assert.equal(game.g.stageResult.chapterGold,0);assert.equal(game.g.stageResult.tickets,0);
  assert.equal(game.saved.gold,735);assert.equal(game.saved.capsuleTickets,3);assert.equal(game.saved.stageRecords[5].clears,2);
 });
 check('failed or debug victories never advance campaign records or award campaign bonuses',()=>{
  for(const debug of [false,true]){
   const {game}=fresh();game.begin(1);game.g.debugUsed=debug;
   game.g.gold=7;game.g.achievedMinutes=1;
   game.finish(debug);
   assert.equal(game.saved.stagesCleared,0);assert.equal(game.saved.capsuleTickets,0);assert.equal(Object.keys(game.saved.stageRecords).length,0);
   assert.equal(game.saved.stats.wins,0);assert.equal(game.saved.gold,30,'only the already-earned run gold is retained');
   if(!debug){assert.equal(game.g.stageResult.gold,0);assert.equal(game.g.stageResult.tickets,0);}
  }
 });
 check('campaign runs remain outside survival ranking while survival still stores a run',()=>{
  const {game,storage}=fresh();const key='nemo_forest_local_runs_v1';
  game.begin(1);game.finish(false);assert.equal(storage.get(key),undefined);
  game.begin();game.g.t=123.4;game.g.player.level=8;game.finish(false);
  const ranks=JSON.parse(storage.get(key));assert.equal(ranks.length,1);assert.equal(ranks[0].survival_seconds,123.4);assert.equal(ranks[0].level,8);
  assert.equal(ranks[0].loadout.character,'nemo');assert.equal(game.saved.stagesCleared,0);
 });
 const failures=results.filter(result=>!result.pass);
 return {passed:results.length-failures.length,total:results.length,failures,detail:'actual boss timestamps, persisted medals, legacy saves, one-time chapter rewards, debug/failure isolation, renewed survival map and ranking boundary'};
};
if(require.main===module){const result=module.exports();console.log(`${result.failures.length?'FAIL':'PASS'} ${result.passed}/${result.total}: ${result.detail}`);for(const failure of result.failures)console.error(failure.name+'\n'+failure.error);process.exitCode=result.failures.length?1:0;}
