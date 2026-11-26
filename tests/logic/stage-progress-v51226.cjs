'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
module.exports=()=>{
 const scope=vm.createContext({});vm.runInContext(fs.readFileSync(path.join(__dirname,'../../assets/stage-v51226/progress.js'),'utf8')+'\nglobalThis.progress=NEMO_CAMPAIGN_PROGRESS;',scope);
 const P=scope.progress,plain=value=>JSON.parse(JSON.stringify(value));
 const stages=Array.from({length:5},(_,index)=>({id:index+1,reward:100+index*10,replayGold:35,firstClearTickets:1,bossEnrageSeconds:75,challenge:{type:'hits',target:8}}));
 const chapters=[{id:1,firstStage:1,lastStage:5,name:'정원',gold:300,tickets:2}];
 const successful=(extra={})=>({victory:true,debugUsed:false,time:250,hits:5,bossKills:[{seconds:30,swift:true},{seconds:45,swift:true},{seconds:70,swift:true}],awakenings:0,xp:70,earnedXP:100,...extra});
 const results=[],check=(name,fn)=>{try{fn();results.push({name,pass:true});}catch(error){results.push({name,pass:false,error:error.stack});}};
 check('legacy clears migrate without retroactive tickets, and the normalizer round-trips',()=>{
  const old={stagesCleared:3,gold:500,costumeEquipped:'rain'},p=plain(P.normalize(old,stages,chapters));
  assert.equal(p.capsuleTickets,0);assert.equal(Object.keys(p.stageRecords).length,3);
  for(const record of Object.values(p.stageRecords)){assert.equal(record.medals,1);assert.equal(record.clears,1);assert.equal(record.claimedClearTicket,true);}
  assert.deepEqual(plain(P.normalize({...old,...p},stages,chapters)),p);assert.equal(old.stageRecords,undefined);
 });
 check('invalid imported records and tickets remain bounded and registered',()=>{
  const p=plain(P.normalize({stagesCleared:0,capsuleTickets:Infinity,chapterRewardsClaimed:[1,1,99,'1'],stageRecords:{1:{medals:99,clears:1e20,bestTime:NaN,bestHits:-2,bestBossSeconds:3.8},999:{medals:7}}},stages,chapters));
  assert.equal(p.capsuleTickets,0);assert.deepEqual(p.chapterRewardsClaimed,[1]);assert.equal(p.stageRecords[999],undefined);
  assert.equal(p.stageRecords[1].medals,7);assert.equal(p.stageRecords[1].clears,99999999);assert.equal(p.stageRecords[1].bestTime,null);assert.equal(p.stageRecords[1].bestHits,null);assert.equal(p.stageRecords[1].bestBossSeconds,3);
 });
 check('failed and debug runs preserve save and award nothing',()=>{
  const old={gold:500,stagesCleared:0,capsuleTickets:2,stats:{plays:3,wins:0},photosOwned:['nemo']};
  for(const run of [successful({victory:false}),successful({debugUsed:true})]){
   const output=plain(P.complete(old,stages[0],run,chapters));assert.deepEqual(output.save,old);assert.equal(output.result.gold,0);assert.equal(output.result.tickets,0);
  }
 });
 check('first clear and new medals pay once; replays preserve fields and never credit wallet directly',()=>{
  const old={gold:500,stagesCleared:0,stats:{plays:3,wins:2},photosOwned:['nemo'],upgrades:{hp:2}};
  const a=plain(P.complete(old,stages[0],successful(),chapters));assert.equal(a.result.gold,166);assert.equal(a.result.tickets,1);assert.equal(a.result.newMedals,7);assert.equal(a.save.gold,500);assert.equal(a.save.stats.wins,3);assert.deepEqual(a.save.upgrades,old.upgrades);
  const b=plain(P.complete(a.save,stages[0],successful({time:260,hits:6}),chapters));assert.equal(b.result.gold,35);assert.equal(b.result.medalGold,0);assert.equal(b.result.tickets,0);assert.equal(b.result.first,false);assert.equal(b.save.stageRecords[1].clears,2);assert.equal(b.save.stageRecords[1].bestTime,250);assert.equal(b.save.stageRecords[1].bestHits,5);assert.equal(old.stageRecords,undefined);
 });
 check('optional seals can be earned on different replays without repeated bonuses',()=>{
  const a=plain(P.complete({},stages[0],successful({hits:12,bossKills:[]}),chapters));assert.equal(a.result.medals,1);assert.equal(a.result.gold,100);
  const b=plain(P.complete(a.save,stages[0],successful({hits:12}),chapters));assert.equal(b.result.newMedals,2);assert.equal(b.result.gold,68);assert.equal(b.result.tickets,0);
  const c=plain(P.complete(b.save,stages[0],successful({bossKills:[]}),chapters));assert.equal(c.result.newMedals,4);assert.equal(c.result.gold,68);
  const d=plain(P.complete(c.save,stages[0],successful(),chapters));assert.equal(d.result.newMedals,0);assert.equal(d.result.gold,35);assert.equal(d.save.stageRecords[1].medals,7);
 });
 check('swift seal needs all three kills, their windup deadline, and no enraged flag',()=>{
  for(const kills of [[{seconds:1,swift:true}],successful().bossKills.map((kill,i)=>i===1?{seconds:76,swift:true}:kill),successful().bossKills.map((kill,i)=>i===1?{seconds:20,swift:false}:kill)]){
   assert.equal(P.complete({},stages[0],successful({bossKills:kills}),chapters).result.medals&2,0);
  }
  const all=successful().bossKills.map(()=>({seconds:75,swift:true}));assert.equal(P.complete({},stages[0],successful({bossKills:all}),chapters).result.medals&2,2);
 });
 check('challenge seals validate actual XP denominator, threshold, hits and awakenings',()=>{
  const xp={...stages[0],challenge:{type:'xp',target:70}},awake={...stages[0],challenge:{type:'awakening',target:1}};
  for(const run of [successful({xp:0,earnedXP:0}),successful({xp:69,earnedXP:100}),successful({xp:-1,earnedXP:100})])assert.equal(P.complete({},xp,run,chapters).result.medals&4,0);
  assert.equal(P.complete({},xp,successful(),chapters).result.medals&4,4);
  assert.equal(P.complete({},awake,successful({awakenings:1}),chapters).result.medals&4,4);
  assert.equal(P.complete({},stages[0],successful({hits:9}),chapters).result.medals&4,0);
  assert.equal(P.complete({},stages[0],successful({hits:-1}),chapters).result.medals&4,0);
 });
 check('chapter reward is claimed on endpoint victory once, including a legacy player replay',()=>{
  const legacy={gold:50,stagesCleared:5,stats:{wins:4}},a=plain(P.complete(legacy,stages[4],successful(),chapters));
  assert.equal(a.result.first,false);assert.equal(a.result.chapterGold,300);assert.equal(a.result.tickets,2);assert.equal(a.result.chapterReward.id,1);assert.deepEqual(a.save.chapterRewardsClaimed,[1]);assert.equal(a.save.gold,50);
  const b=plain(P.complete(a.save,stages[4],successful(),chapters));assert.equal(b.result.chapterGold,0);assert.equal(b.result.tickets,0);
  assert.equal(P.complete(legacy,stages[3],successful(),chapters).result.chapterGold,0);
 });
 check('ticket quotes preserve bulk pricing and reject unsupported counts',()=>{
  assert.deepEqual(plain(P.drawQuote({gold:810,capsuleTickets:1},10)),{count:10,ticketsUsed:1,cost:900,goldCost:810,discount:90,canAfford:true});
  assert.equal(P.drawQuote({gold:809,capsuleTickets:1},10).canAfford,false);assert.equal(P.drawQuote({gold:0,capsuleTickets:10},10).goldCost,0);
  assert.equal(P.drawQuote({gold:0,capsuleTickets:1000},1).ticketsUsed,1);assert.equal(P.drawQuote({gold:0,capsuleTickets:-1},1).goldCost,100);
  for(const count of [0,-1,2,11,1e20,NaN,'10'])assert.equal(P.drawQuote({gold:1e9,capsuleTickets:1e9},count),null);
 });
 const failures=results.filter(result=>!result.pass);return {passed:results.length-failures.length,total:results.length,failures,detail:'legacy migration, idempotent seals and chapter claims, strict three-boss deadlines, zero-XP safety, ticket pricing and wallet ownership'};
};
