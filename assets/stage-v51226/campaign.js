// Load after campaign-v573/stages.js. This registry changes campaign data only;
// save migration, reward claims, and leaderboard submission remain in the engine.
const NEMO_CAMPAIGN_RENEWAL = (() => {
 'use strict';

 const profiles = Object.freeze({
  swarms:Object.freeze({name:'무리의 행진',tactic:'작은 무리를 돌며 빈 길을 만들어요.'}),
  chargers:Object.freeze({name:'달려오는 발소리',tactic:'달려드는 적을 옆으로 흘려보내요.'}),
  ranged:Object.freeze({name:'엇갈리는 마법',tactic:'탄환 사이를 지나 원거리 적부터 정리해요.'}),
  guardians:Object.freeze({name:'단단한 파수꾼',tactic:'단단한 적을 모아 한쪽 길을 열어요.'})
 });
 const profileOrder = [
  'swarms','ranged','chargers','ranged','guardians',
  'ranged','guardians','chargers','ranged','guardians',
  'swarms','ranged','guardians','chargers','ranged','guardians',
  'swarms','chargers','guardians','ranged','swarms','guardians',
  'chargers','ranged','guardians','swarms','chargers','ranged','guardians','ranged'
 ];
 const categories = {
  swarms:new Set(['green','blue','petal']),
  chargers:new Set(['blue','spark','firefly','frost-hare','ash-viper','tide-ray']),
  ranged:new Set(['spore','moth','webcap','shardling','moonbloom','prism-wisp','snow-moth','kelp-spirit','star-jelly']),
  guardians:new Set(['fat','armor','bramble','crystal-crab','ember-beetle','clock-scarab'])
 };
 const firstTen = [
  ['새싹이 깨어난 길','꽃봉오리 왕관 슬라임','모종 사이로 첫 길을 열어요.'],
  ['꿀빛 울타리','꿀잎 덩굴지기','울타리 너머의 마법을 지나가요.'],
  ['씨앗 풍차 언덕','씨앗 주머니 멧돼지','풍차 언덕의 돌격대를 막아요.'],
  ['나비가 쉬는 뜰','꽃바람 달날개','나비 뜰의 날갯짓을 따라가요.'],
  ['햇살 정원문','정원의 유리 사슴','정원문을 지키는 파수꾼을 넘어요.'],
  ['반딧불 산책로','등불 망루 부엉이','반딧불을 따라 밤숲으로 들어가요.'],
  ['달이 잠든 그루터기','달그늘 숲곰','큰 그루터기 주위에 빈 길을 만들어요.'],
  ['반짝이는 뿌리골','등불 뿌리용','뿌리골을 달리는 적을 돌파해요.'],
  ['달물결 연못가','달물결 해오라기','연못을 돌아 마법의 흐름을 피해요.'],
  ['달그늘 성림','황혼의 그림자 여우','달그늘 숲의 마지막 문을 열어요.']
 ];
 // Keep early garden/forest rosters visually coherent. Later chapters retain
 // their regional monsters, so arriving in a new biome introduces new threats.
 const earlyRosters = [
  [{green:64,blue:24,bramble:12},{green:38,blue:24,bramble:20,fat:12,spore:6}],
  [{green:45,blue:24,spore:19,moth:12},{green:22,blue:22,spore:24,bramble:18,moth:14}],
  [{green:26,blue:30,bramble:24,fat:20},{blue:27,bramble:25,fat:22,armor:16,spore:10}],
  [{green:23,blue:23,moth:32,firefly:22},{moth:30,firefly:23,blue:22,spore:15,bramble:10}],
  [{green:22,blue:34,bramble:24,armor:20},{blue:26,armor:24,bramble:22,fat:16,spore:12}],
  [{blue:30,firefly:30,moth:25,spore:15},{firefly:30,moth:24,moonbloom:12,blue:22,spore:12}],
  [{blue:28,bramble:25,moth:22,armor:25},{blue:22,bramble:24,fat:20,armor:22,moonbloom:12}],
  [{blue:22,firefly:28,bramble:24,spark:12,moth:14},{firefly:22,spark:16,bramble:20,blue:22,moth:20}],
  [{blue:24,moth:24,moonbloom:22,spore:18,firefly:12},{moonbloom:22,webcap:10,moth:22,spore:18,blue:18,firefly:10}],
  [{blue:24,moth:24,firefly:22,armor:18,moonbloom:12},{moonbloom:18,moth:20,firefly:18,armor:20,blue:14,webcap:10}]
 ];
 const chapterThemes = ['garden','twilight','crystal','frost','ember','tide','clock','astral'];
 const chapterCrests = ['seed-crown','moon-lantern','prism-bloom','snow-bell','ember-leaf','tide-shell','clock-petal','astral-paw'];
 const chapterGoals = [
  '정원의 길을 이어 세 파수꾼을 물리쳐요.',
  '달그늘 사이로 길을 열고 밤숲의 파수꾼을 물리쳐요.',
  '수정 사이의 틈을 찾아 프리즘 문을 열어요.',
  '눈고개의 돌진과 탄막을 피해 관측소에 도착해요.',
  '잿불 무리의 빈틈을 뚫고 제단의 파수꾼을 물리쳐요.',
  '물결의 흐름을 읽고 잠긴 유적을 지나가요.',
  '태엽의 박자를 피해 기계탑의 문을 열어요.',
  '별길의 마지막 파수꾼들을 넘어 왕좌에 도착해요.'
 ];

 function themedWeights(roster,profile){
  // Reweight existing kinds only; per-enemy windups, caps, and attacks stay intact.
  const entries=Object.entries(roster).filter(([,weight])=>Number.isFinite(weight)&&weight>0);
  const weighted=entries.map(([kind,weight])=>[kind,weight*(categories[profile].has(kind)?1.24:.94)]);
  const total=weighted.reduce((sum,[,weight])=>sum+weight,0);
  return Object.freeze(Object.fromEntries(weighted.map(([kind,weight])=>[kind,Math.round(weight/total*10000)/100])));
 }
 function bossSchedule(id){
  const first=id<=3?1:id<=10?4:id<=20?11:21;
  const base=id<=3?[75,150,240]:id<=10?[90,190,300]:id<=20?[100,220,330]:[110,235,360];
  const offset=(id-first)%7;
  return Object.freeze(base.map(time=>time+offset));
 }
 function challengeFor(id){
  const slot=(id-1)%5;
  if(slot<3){
   const target=[12,10,8][slot];
   return Object.freeze({type:'hits',target,label:`피격 ${target}회 이내로 클리어`});
  }
  if(slot===3)return Object.freeze({type:'awakening',target:1,label:'무기를 한 번 각성하고 클리어'});
  return Object.freeze({type:'xp',target:70,label:'떨어진 경험치 70% 이상 회수하고 클리어'});
 }
 const chapters = NEMO_CHAPTERS.map(([lastStage,name],index)=>Object.freeze({
  id:index+1,name,firstStage:index?NEMO_CHAPTERS[index-1][0]+1:1,lastStage,
  theme:chapterThemes[index],crest:chapterCrests[index],objective:chapterGoals[index]
 }));
 const chapterRewards = chapters.map(chapter=>Object.freeze({
  ...chapter,gold:200+chapter.id*100,tickets:2
 }));
 const stages = NEMO_STAGES.map(original=>{
  const {id}=original;
  const chapter=chapters.find(entry=>id<=entry.lastStage);
  const profile=profileOrder[id-1];
  const identity=firstTen[id-1];
  const roster=earlyRosters[id-1];
  const bossTimes=bossSchedule(id);
  const bossAt=bossTimes[2];
  const hpScale=id<=3?.85:id===4?.94:1;
  return Object.freeze({
   ...original,
   name:identity?.[0]??original.name,
   title:identity?.[1]??original.title,
   hp:Math.round(original.hp*hpScale/50)*50,
   pressure:id<=4?[1,1.04,1.08,1.10][id-1]:original.pressure,
   chapter:chapter.name,chapterId:chapter.id,theme:chapter.theme,crest:chapter.crest,
   profile,profileName:profiles[profile].name,
   objective:identity?.[2]??chapter.objective,
   tactic:profiles[profile].tactic,
   challenge:challengeFor(id),
   openingEnemies:themedWeights(roster?.[0]??original.openingEnemies,profile),
   enemies:themedWeights(roster?.[1]??original.enemies,profile),
   bossTimes,bossAt,bossEnrageSeconds:75,
   frenzyAt:bossAt-original.frenzyDuration-8,
   firstClearTickets:1,
   scoutTitles:Object.freeze([`${chapter.name}의 길목지기`,`${chapter.name}의 수문장`])
  });
 });

 return Object.freeze({
  version:'5.13.0',stages:Object.freeze(stages),chapters:Object.freeze(chapters),
  chapterRewards:Object.freeze(chapterRewards),profiles,
  firstClearTickets:1,bossEnrageSeconds:75,
  // XP recovery requires an actual dropped-XP denominator; an empty run must
  // not satisfy the challenge by treating 0 / 0 as a complete collection.
  xpChallengeMinimumEarned:1
 });
})();
