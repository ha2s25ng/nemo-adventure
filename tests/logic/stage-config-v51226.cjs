'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
module.exports=function stageConfigChecks(){
try{
const root=path.resolve(__dirname,'../..');
const context=vm.createContext({});
function run(relative){vm.runInContext(fs.readFileSync(path.join(root,relative),'utf8'),context,{filename:relative});}
run('assets/campaign-v573/stages.js');
const before=vm.runInContext('JSON.stringify(NEMO_STAGES)',context);
run('assets/stage-v51226/campaign.js');
const campaign=vm.runInContext('NEMO_CAMPAIGN_RENEWAL',context);
const old=vm.runInContext('NEMO_STAGES',context);
assert.equal(vm.runInContext('JSON.stringify(NEMO_STAGES)',context),before,'base stage registry must remain untouched');
assert.equal(campaign.stages.length,30);
assert.equal(campaign.chapters.length,8);
assert.equal(campaign.chapterRewards.length,8);
assert.equal(Object.isFrozen(campaign.stages),true);

let previousPressure=0;
for(const stage of campaign.stages){
 const original=old[stage.id-1];
 assert.equal(stage.id,original.id,'save-compatible stage IDs');
 assert.equal(stage.boss,original.boss,'boss mechanics and art identifiers are preserved');
 assert.equal(stage.chapter,original.chapter,'chapter grouping remains save-compatible');
 assert.equal(stage.reward,original.reward,'first-clear gold must not be silently inflated');
 assert.equal(stage.replayGold,original.replayGold,'replay economy remains intact');
 assert.equal(stage.firstClearTickets,1);
 assert.ok(stage.pressure>=previousPressure,'campaign pressure must rise gradually');
 assert.ok(stage.pressure-previousPressure<=.12||stage.id===1,'no sudden campaign pressure spike');
 previousPressure=stage.pressure;
 assert.equal(stage.bossTimes.length,3);
 assert.ok(stage.bossTimes[0]<stage.bossTimes[1]&&stage.bossTimes[1]<stage.bossTimes[2]);
 assert.equal(stage.bossAt,stage.bossTimes[2]);
 assert.equal(stage.frenzyAt,stage.bossAt-stage.frenzyDuration-8);
 assert.equal(stage.bossEnrageSeconds,75);
 assert.ok(stage.objective&&stage.tactic&&campaign.profiles[stage.profile]);
 assert.equal(stage.scoutTitles.length,2);
 const base=stage.id<=3?[75,150,240]:stage.id<=10?[90,190,300]:stage.id<=20?[100,220,330]:[110,235,360];
 stage.bossTimes.forEach((time,index)=>assert.ok(time>=base[index]&&time<=base[index]+6));
 for(const weights of [stage.enemies,stage.openingEnemies]){
  assert.ok(Object.values(weights).every(weight=>Number.isFinite(weight)&&weight>0));
  const total=Object.values(weights).reduce((sum,value)=>sum+value,0);
  assert.ok(Math.abs(total-100)<.06,'roster weights should form a normalized distribution');
  assert.ok(Object.keys(weights).length>=3,'a profile must preserve mixed encounters');
 }
 assert.ok(['hits','awakening','xp'].includes(stage.challenge.type));
 if(stage.id>=5)assert.equal(stage.hp,original.hp,'later-stage HP remains unchanged');
}
for(const reward of campaign.chapterRewards){
 assert.equal(reward.gold,200+reward.id*100);
 assert.equal(reward.tickets,2);
 assert.equal(campaign.stages.filter(stage=>stage.chapterId===reward.id).length,reward.lastStage-reward.firstStage+1);
 assert.equal(campaign.stages[reward.lastStage-1].chapter,reward.name);
}
assert.equal(campaign.stages[0].hp/old[0].hp<.86,true,'shorter early stages account for less build time');
assert.equal(campaign.xpChallengeMinimumEarned>0,true,'zero dropped XP cannot count as collected');
assert.ok(!JSON.stringify(campaign.stages.slice(0,10)).includes('얼음 풍경의 서리곰'));
assert.ok(new Set(campaign.stages.map(stage=>stage.profile)).size>=4);
return {passed:1,total:1,failures:[],detail:'30 save-compatible stages, 8 chapter rewards, valid schedules, mixed rosters and gradual pressure'};
}catch(error){return {passed:0,total:1,failures:[{name:'campaign registry invariants',error:error.stack}],detail:'campaign data validation'};}
};
if(require.main===module){const result=module.exports();console.log(`${result.failures.length?'FAIL':'PASS'} ${result.detail}`);for(const failure of result.failures)console.error(failure.error);process.exitCode=result.failures.length?1:0;}
