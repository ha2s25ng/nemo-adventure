const NEMO_CHARACTERS=Object.freeze([
 {id:'nemo',name:'니모',price:0,portrait:'./assets/wardrobe-portraits-v5122/nemo-default.webp',thumbnail:'./assets/wardrobe-portraits-v5122/nemo-default-thumb.webp',atlas:'./assets/wardrobe-rig-v5121/nemo-default-walk.png',starter:'star',description:'스타 샷 · 빠른 별 탄막'},
 {id:'dori',name:'도리',price:2000,portrait:'./assets/wardrobe-portraits-v5122/dori-default.webp',thumbnail:'./assets/wardrobe-portraits-v5122/dori-default-thumb.webp',atlas:'./assets/wardrobe-rig-v5121/dori-default-walk.png',starter:'cannon',description:'삑삑이 공 · 묵직한 직격과 폭발'}
]);
const DORI_CANNON={name:'삑삑이 공',icon:'●',coef:1.18,cd:1.12,range:13.2,up:[],
 break:'공 +1 · 한 번에 총 3발 발사',steps:{
  2:['공 하나 더','공 +1 · 한 번에 총 2발 발사'],
  3:['통통한 공','모든 공의 피해 +25%'],
  5:['정확한 앞발','치명타 확률 +15%p'],
  6:['신나는 놀이','치명타 피해 1.5배 → 2배']
 },evos:[
  ['통통 관통','직격 피해 +15% · 적 1마리 추가 관통 · 관통 후 피해 35% 감소 · 폭발 반경 +15%'],
  ['왕삑삑 폭발','직격 피해 +10% · 폭발 피해 35% → 55% · 폭발 반경 +25%']
 ]};
const DORI_WARDROBE=Object.fromEntries(['forest','rain','redhood','student','halloween','starlight','royal','legend','patisserie','captain','dreamstar','victory-gold','victory-silver','victory-bronze'].map(id=>[id,{
 portrait:'./assets/wardrobe-portraits-v5122/dori-'+id+'.webp',thumbnail:'./assets/wardrobe-portraits-v5122/dori-'+id+'-thumb.webp',atlas:'./assets/wardrobe-rig-v5121/dori-'+id+'-walk.png'
}]));
