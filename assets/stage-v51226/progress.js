// Pure campaign accounting. The engine credits result.gold together with run
// earnings; complete never credits save.gold, avoiding duplicate clear rewards.
const NEMO_CAMPAIGN_PROGRESS = (() => {
 'use strict';
 const MAX=99999999;
 const object=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
 const integer=(value,max=MAX)=>Number.isFinite(value)&&value>=0?Math.min(max,Math.floor(value)):0;
 const best=value=>Number.isFinite(value)&&value>=0?Math.min(MAX,Math.floor(value)):null;
 const positiveId=value=>Number.isInteger(value)&&value>0&&value<=MAX;
 const stageIds=stages=>new Set((Array.isArray(stages)?stages:[]).map(stage=>stage?.id).filter(positiveId));
 const chapterRows=chapters=>(Array.isArray(chapters)?chapters:[]).filter(chapter=>positiveId(chapter?.id)&&positiveId(chapter?.lastStage));
 const emptyRecord=()=>({medals:0,clears:0,bestTime:null,bestHits:null,bestBossSeconds:null,claimedClearTicket:false});

 function normalize(old,stages,chapters){
  const source=object(old)?old:{};
  const ids=stageIds(stages),records={},cleared=integer(source.stagesCleared);
  const previous=object(source.stageRecords)?source.stageRecords:{};
  for(const id of ids){
   const raw=object(previous[id])?previous[id]:null;
   if(!raw&&id>cleared)continue;
   const legacy=id<=cleared;
   let medals=integer(raw?.medals,7),clears=integer(raw?.clears);
   if(legacy||medals||clears){medals|=1;clears=Math.max(1,clears);}
   records[id]={
    medals,clears,bestTime:best(raw?.bestTime),bestHits:best(raw?.bestHits),
    bestBossSeconds:best(raw?.bestBossSeconds),
    claimedClearTicket:legacy||raw?.claimedClearTicket===true
   };
  }
  const validChapters=new Set(chapterRows(chapters).map(chapter=>chapter.id));
  const claimed=Array.isArray(source.chapterRewardsClaimed)?source.chapterRewardsClaimed:[];
  return {
   stageRecords:records,
   chapterRewardsClaimed:[...new Set(claimed.filter(id=>positiveId(id)&&validChapters.has(id)))].sort((a,b)=>a-b),
   capsuleTickets:integer(source.capsuleTickets)
  };
 }

 const emptyResult=medals=>({clearGold:0,medalGold:0,chapterGold:0,gold:0,tickets:0,newMedals:0,medals,first:false,chapterReward:null});
 const lowerBest=(before,value)=>value===null?before:before===null?value:Math.min(before,value);
 function complete(old,stage,run,chapters){
  const source=object(old)?old:{};
  const rows=chapterRows(chapters),last=Math.max(positiveId(stage?.id)?stage.id:0,...rows.map(chapter=>chapter.lastStage));
  // Stage ids are contiguous in the campaign registry. Keeping this bounded
  // prevents imported save data from making normalization allocate huge arrays.
  const count=Math.min(1000,last),stages=Array.from({length:count},(_,index)=>({id:index+1}));
  const progress=normalize(source,stages,rows);
  const previous=progress.stageRecords[stage?.id]??emptyRecord();
  if(!positiveId(stage?.id)||stage.id>count||!run||run.victory!==true||run.debugUsed===true)
   return {save:{...source},result:emptyResult(previous.medals)};

  const first=!(previous.medals&1),kills=Array.isArray(run.bossKills)?run.bossKills:[];
  const validKills=kills.length===3&&kills.every(kill=>Number.isFinite(kill?.seconds)&&kill.seconds>=0);
  const enrage=Number.isFinite(stage.bossEnrageSeconds)&&stage.bossEnrageSeconds>0?stage.bossEnrageSeconds:75;
  const swift=validKills&&kills.every(kill=>kill.swift===true&&kill.seconds<=enrage);
  const challenge=stage.challenge;
  let achieved=false;
  if(challenge?.type==='hits')achieved=Number.isFinite(run.hits)&&run.hits>=0&&run.hits<=challenge.target;
  if(challenge?.type==='awakening')achieved=Number.isFinite(run.awakenings)&&run.awakenings>=challenge.target;
  if(challenge?.type==='xp')achieved=Number.isFinite(run.xp)&&run.xp>=0&&Number.isFinite(run.earnedXP)&&run.earnedXP>0&&run.xp/run.earnedXP>=challenge.target/100;
  const medals=previous.medals|1|(swift?2:0)|(achieved?4:0),newMedals=medals&~previous.medals;
  const clearGold=integer(first?stage.reward:stage.replayGold);
  const medalCount=((newMedals&2)?1:0)+((newMedals&4)?1:0),medalGold=integer(medalCount*(30+stage.id*3));
  const ticket=first&&!previous.claimedClearTicket?integer(stage.firstClearTickets??1):0;
  const record={
   medals,clears:integer(previous.clears+1),
   bestTime:lowerBest(previous.bestTime,best(run.time)),
   bestHits:lowerBest(previous.bestHits,best(run.hits)),
   bestBossSeconds:lowerBest(previous.bestBossSeconds,validKills?best(kills.reduce((sum,kill)=>sum+kill.seconds,0)):null),
   claimedClearTicket:previous.claimedClearTicket||first
  };
  const save={...source,...progress,
   stagesCleared:Math.max(integer(source.stagesCleared,count),stage.id),
   stageRecords:{...progress.stageRecords,[stage.id]:record},
   stats:{...(object(source.stats)?source.stats:{}),wins:integer(integer(source.stats?.wins)+1)}
  };
  const chapter=rows.find(row=>row.lastStage===stage.id);
  const chapterReward=chapter&&save.stagesCleared>=chapter.lastStage&&!save.chapterRewardsClaimed.includes(chapter.id)?chapter:null;
  const chapterGold=chapterReward?integer(chapterReward.gold):0;
  const chapterTickets=chapterReward?integer(chapterReward.tickets??2):0;
  if(chapterReward)save.chapterRewardsClaimed=[...save.chapterRewardsClaimed,chapterReward.id].sort((a,b)=>a-b);
  const tickets=integer(ticket+chapterTickets);
  save.capsuleTickets=integer(progress.capsuleTickets+tickets);
  return {save,result:{clearGold,medalGold,chapterGold,gold:integer(clearGold+medalGold+chapterGold),tickets,newMedals,medals,first,chapterReward}};
 }

 function drawQuote(save,count=1){
  if(count!==1&&count!==10)return null;
  const cost=count===10?900:100,ticketsUsed=Math.min(count,integer(save?.capsuleTickets));
  const discount=ticketsUsed*(count===10?90:100),goldCost=cost-discount;
  return {count,ticketsUsed,cost,goldCost,discount,canAfford:integer(save?.gold)>=goldCost};
 }
 return Object.freeze({normalize,complete,drawQuote});
})();
