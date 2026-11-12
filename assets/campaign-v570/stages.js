const NEMO_STAGES = [
  {id:1, name:'새싹의 오솔길', boss:'crown', title:'새싹 왕관 슬라임', hp:12500, reward:120, patterns:['dash','fan'], enemies:{green:48,blue:29,fat:15,bramble:8}},
  {id:2, name:'버섯의 안개', boss:'thorn', title:'포자숲 수호자', hp:15500, reward:155, patterns:['fan','ring'], enemies:{green:25,blue:21,fat:23,spore:21,bramble:10}},
  {id:3, name:'반딧불 계곡', boss:'moon', title:'반딧불의 여왕', hp:18500, reward:190, patterns:['fan','cross','ring'], enemies:{blue:22,fat:13,spore:12,firefly:30,moth:23}},
  {id:4, name:'뿌리 엉킨 숲', boss:'boar', title:'이끼뿌리 멧돼지', hp:22000, reward:225, patterns:['dash','hedge','fan'], enemies:{blue:16,fat:17,bramble:33,armor:22,spark:12}},
  {id:5, name:'달가루 습지', boss:'moon', title:'달날개 여왕', hp:25500, reward:260, patterns:['cross','spiral','ring','dash'], enemies:{blue:12,spore:16,moth:30,firefly:19,spark:23}},
  {id:6, name:'별빛 절벽', boss:'owl', title:'별바람 부엉이', hp:29000, reward:300, patterns:['wing','fan','dash','ring'], enemies:{bramble:15,spark:29,firefly:17,moth:21,armor:18}},
  {id:7, name:'가시의 미궁', boss:'thorn', title:'가시숲의 파수꾼', hp:33500, reward:340, patterns:['hedge','ring','dash','spiral'], enemies:{bramble:26,armor:27,spore:17,moth:13,spark:17}},
  {id:8, name:'붉은 달의 사냥터', boss:'boar', title:'붉은뿌리 멧돼지', hp:38000, reward:385, patterns:['dash','hedge','spiral','dash'], enemies:{armor:25,bramble:23,firefly:19,spark:21,moth:12}},
  {id:9, name:'폭풍의 능선', boss:'owl', title:'폭풍 부엉이', hp:43000, reward:430, patterns:['wing','spiral','dash','ring','fan'], enemies:{moth:27,spark:25,firefly:19,armor:19,spore:10}},
  {id:10,name:'숲의 심장', boss:'crown', title:'숲의 심장 · 왕관 슬라임', hp:49000, reward:500, patterns:['dash','ring','spiral','fan','dash'], enemies:{bramble:20,armor:23,moth:18,spark:22,spore:17}}
].map(stage=>Object.freeze({
  ...stage,
  bossAt: 540,
  frenzyAt: 432,
  frenzyDuration: 22+stage.id*2,
  minuteGold: 14+stage.id,
  replayGold: Math.round(stage.reward*.32),
  weaponSlots: stage.id>=6?5:4
}));
