const NEMO_FOREST_STAGES = [
  {id:1, name:'봄잠 깬 모종길', boss:'crown', title:'유리화분 왕관 슬라임', hp:11250, reward:132, pressure:.86, frenzyDuration:16, patterns:['dash','fan'], openingEnemies:{green:69,blue:16,'crystal-crab':15}, enemies:{green:45,blue:22,'crystal-crab':14,bramble:13,fat:6}},
  {id:2, name:'꿀빛 덩굴길', boss:'thorn', title:'꿀가시 덩굴지기', hp:14550, reward:179, pressure:.94, frenzyDuration:19, patterns:['hedge','fan','ring'], openingEnemies:{green:47,blue:20,'prism-wisp':19,spore:14}, enemies:{'prism-wisp':25,bramble:22,spore:21,green:21,moonbloom:11}},
  {id:3, name:'씨앗 방앗간', boss:'boar', title:'씨앗통 멧돼지', hp:18500, reward:226, pressure:1, frenzyDuration:22, patterns:['dash','hedge','fan'], openingEnemies:{green:33,blue:30,bramble:16,'ember-beetle':21}, enemies:{'ember-beetle':28,blue:23,bramble:20,fat:16,armor:13}},
  {id:4, name:'떠다니는 꽃밭', boss:'moon', title:'꽃바람 달날개', hp:22650, reward:273, pressure:1.06, frenzyDuration:22, patterns:['cross','spiral','ring'], openingEnemies:{green:28,blue:24,moth:25,'prism-wisp':23}, enemies:{'prism-wisp':30,moth:24,firefly:19,'snow-moth':17,blue:10}},
  {id:5, name:'유약을 입힌 정원문', boss:'mirror-stag', title:'정원문을 지키는 색유리 사슴', hp:27450, reward:320, pressure:1.12, frenzyDuration:23, openingEnemies:{blue:40,green:22,'crystal-crab':23,'prism-wisp':15}, enemies:{'crystal-crab':28,'prism-wisp':21,shardling:8,blue:29,armor:14}},
  {id:6, name:'등불 숲의 망루', boss:'owl', title:'황혼 망루의 등불 부엉이', hp:32600, reward:372, pressure:1.19, frenzyDuration:25, patterns:['wing','fan','dash','ring'], openingEnemies:{blue:32,firefly:28,moth:25,'prism-wisp':15}, enemies:{firefly:25,moth:17,'prism-wisp':14,moonbloom:10,blue:22,armor:12}},
  {id:7, name:'얼어붙은 풍경 소리', boss:'rime-bear', title:'얼음 풍경의 서리곰', hp:39500, reward:424, pressure:1.28, frenzyDuration:26, openingEnemies:{blue:31,'frost-hare':27,'snow-moth':23,moth:19}, enemies:{'frost-hare':29,'snow-moth':20,shardling:12,bramble:16,blue:23}},
  {id:8, name:'촛불 뿌리골', boss:'ember-wyrm', title:'뿌리에서 깨어난 초롱용', hp:46500, reward:481, pressure:1.38, frenzyDuration:28, openingEnemies:{blue:30,bramble:25,'ember-beetle':24,firefly:21}, enemies:{'ember-beetle':28,'ash-viper':16,firefly:15,bramble:16,blue:25}},
  {id:9, name:'검은 연못의 물결', boss:'tide-heron', title:'밤물결 해오라기', hp:55000, reward:538, pressure:1.49, frenzyDuration:30, openingEnemies:{blue:33,'kelp-spirit':23,moth:23,'tide-ray':21}, enemies:{'kelp-spirit':26,'tide-ray':25,webcap:19,moonbloom:17,moth:13}},
  {id:10,name:'황혼의 해시계', boss:'void-fox', title:'해시계 뒤편의 그림자 여우', hp:65000, reward:620, pressure:1.60, frenzyDuration:32, openingEnemies:{blue:32,moth:24,'prism-wisp':23,'ash-viper':21}, enemies:{'prism-wisp':22,'ash-viper':20,moonbloom:14,'crystal-crab':17,moth:10,blue:17}}
];

const NEMO_EXPEDITION_STAGES = [
  {name:'분홍 수정 오솔길', boss:'mirror-stag', title:'빗살 수정 사슴', enemies:{'crystal-crab':28,'prism-wisp':21,blue:24,bramble:17,moth:10}},
  {name:'거울 협곡', boss:'moon', title:'거울빛 달날개', patterns:['cross','spiral','wing','ring'], enemies:{'crystal-crab':24,'prism-wisp':23,shardling:11,blue:30,bramble:12}},
  {name:'프리즘의 문', openingEnemies:{blue:34,green:17,'crystal-crab':25,'prism-wisp':24}, boss:'mirror-stag', title:'프리즘 성주 · 거울 사슴', enemies:{'crystal-crab':30,'prism-wisp':21,shardling:15,blue:24,armor:10}},
  {name:'서릿발 침엽길', boss:'rime-bear', title:'눈고개 서리곰', enemies:{'frost-hare':32,'snow-moth':21,blue:18,fat:15,'crystal-crab':14}},
  {name:'빙벽의 메아리', openingEnemies:{blue:29,moth:21,'frost-hare':27,'snow-moth':23}, boss:'owl', title:'눈보라 부엉이', patterns:['wing','cross','dash','spiral'], enemies:{'snow-moth':24,'frost-hare':28,'prism-wisp':12,moth:10,blue:26}},
  {name:'백야 관측소', boss:'rime-bear', title:'백야의 파수꾼 · 서리곰', enemies:{'frost-hare':29,'snow-moth':24,shardling:13,'prism-wisp':11,blue:23}},
  {name:'잿빛 화구', boss:'ember-wyrm', title:'불씨 굴의 용', enemies:{'ember-beetle':30,'ash-viper':20,bramble:18,firefly:18,'frost-hare':14}},
  {name:'용암이 흐른 다리', boss:'boar', title:'잿불엄니 멧돼지', patterns:['dash','ring','hedge','spiral'], enemies:{'ash-viper':25,'ember-beetle':27,'crystal-crab':15,spark:8,blue:25}},
  {name:'심화의 제단', openingEnemies:{blue:28,firefly:22,'ember-beetle':28,'ash-viper':22}, boss:'ember-wyrm', title:'심화의 군주 · 잿불용', enemies:{'ember-beetle':33,'ash-viper':26,'prism-wisp':11,firefly:17,blue:13}},
  {name:'산호 물결길', boss:'tide-heron', title:'미명 해오라기', enemies:{'kelp-spirit':27,'tide-ray':23,blue:27,'snow-moth':13,moonbloom:10}},
  {name:'침몰한 초록 성문', boss:'thorn', title:'해초 성문의 파수꾼', patterns:['hedge','cross','ring','spiral'], enemies:{'kelp-spirit':28,'tide-ray':25,webcap:8,'frost-hare':14,firefly:12,blue:13}},
  {name:'파수꾼의 해등', openingEnemies:{blue:29,bramble:18,'kelp-spirit':28,'tide-ray':25}, boss:'tide-heron', title:'만조의 사자 · 해오라기', enemies:{'tide-ray':31,'kelp-spirit':26,'ash-viper':15,moonbloom:11,blue:17}},
  {name:'태엽이 감긴 계단', boss:'clockwork-mantis', title:'황동 시계 사마귀', enemies:{'clock-scarab':31,'ember-beetle':24,'prism-wisp':14,shardling:9,blue:22}},
  {name:'초침의 골짜기', boss:'mirror-stag', title:'초침의 거울 사슴', enemies:{'clock-scarab':31,'crystal-crab':25,'prism-wisp':15,'ash-viper':12,firefly:17}},
  {name:'정오의 기계탑', openingEnemies:{blue:30,bramble:20,'clock-scarab':30,'prism-wisp':20}, boss:'clockwork-mantis', title:'정오를 지키는 시계 사마귀', enemies:{'clock-scarab':34,'ember-beetle':20,'tide-ray':16,'prism-wisp':10,blue:20}},
  {name:'뒤집힌 별길', boss:'void-fox', title:'그림자 샛길의 여우', enemies:{'star-jelly':33,'tide-ray':18,'prism-wisp':15,'snow-moth':14,blue:20}},
  {name:'유성이 잠든 고개', boss:'rime-bear', title:'유성의 유리 서리곰', enemies:{'star-jelly':28,'frost-hare':27,'snow-moth':18,'clock-scarab':11,blue:16}},
  {name:'은하수의 두 강', boss:'tide-heron', title:'은하를 가르는 해오라기', enemies:{'star-jelly':29,'tide-ray':23,'kelp-spirit':18,'crystal-crab':14,firefly:16}},
  {name:'일식의 뒤편', boss:'void-fox', title:'일식의 인도자 · 그림자 여우', enemies:{'star-jelly':30,'ash-viper':22,'clock-scarab':19,'prism-wisp':13,blue:16}},
  {name:'별심장의 왕좌', boss:'astral-dragon', title:'별심장의 용', openingEnemies:{blue:35,firefly:16,'star-jelly':26,'clock-scarab':23}, enemies:{'star-jelly':26,'clock-scarab':20,'tide-ray':17,'ember-beetle':14,'frost-hare':12,blue:11}}
];

const NEMO_CHAPTERS = [
  [5,'새벽 정원'], [10,'황혼 성림'], [13,'수정 협곡'], [16,'서리 고원'],
  [19,'잿불 화산'], [22,'만조 유적'], [25,'태엽 계곡'], [30,'별의 경계']
];

const NEMO_STAGES = [
  ...NEMO_FOREST_STAGES,
  ...NEMO_EXPEDITION_STAGES.map((stage,index)=>{
    const depth=index+1;
    return {
      ...stage, id:depth+10,
      hp:Math.round((65000+2100*depth+38*depth*depth)/100)*100,
      reward:620+50*depth+Math.round(1.2*depth*depth),
      pressure:1.60+.035*depth,
      frenzyDuration:32+Math.ceil(depth*.4)
    };
  })
].map(stage=>{
  const {id,reward,frenzyDuration}=stage;
  const depth=id-10;
  const bossTimes=id<=10?[108+Math.ceil(id*1.2),218+Math.ceil(id*2.2),330+id*3]:[
    119+Math.ceil(depth*.45),
    239+Math.ceil(depth*.95),
    360+Math.ceil(depth*1.5)
  ];
  const bossAt=bossTimes[2];
  const openingEnemies=stage.openingEnemies??{
    ...Object.fromEntries(Object.entries(stage.enemies).map(([kind,weight])=>[kind,weight*.55])),
    green:(stage.enemies.green??0)*.55+20,
    blue:(stage.enemies.blue??0)*.55+25
  };
  return Object.freeze({
    ...stage,
    openingEnemies,
    chapter:NEMO_CHAPTERS.find(([end])=>id<=end)[1],
    patterns:stage.patterns??[],
    bossTimes:Object.freeze(bossTimes),
    bossAt,
    frenzyAt:bossAt-frenzyDuration-8,
    minuteGold:21+id*2,
    replayGold:Math.round(reward*.36),
    recommended:id<=3?'기본 장비':id<=6?'공격력 · 체력 강화 권장':id<=13?'공격력 · 수호 훈련 권장':'시전 · 체력 · 수호 훈련 권장',
    weaponSlots:5
  });
});
