'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {createHarness}=require('./harness.cjs');
module.exports=function(){
 const results=[],check=(name,fn)=>{try{fn(createHarness());results.push({name,pass:true});}catch(error){results.push({name,pass:false,error:error.stack});}};
 check('old saves start as Nemo; a forged equipped Dori does not grant ownership',({game})=>{
  assert.equal(game.activeCharacter().id,'nemo');const old=game.normalizeSave({version:1,gold:4000,characterEquipped:'dori'});assert.equal(old.characterEquipped,'nemo');assert.deepEqual(Array.from(old.charactersOwned),['nemo']);
 });
 check('Dori costs exactly 2000 once; selection and save reload keep ownership',({game})=>{
  game.saved.gold=1999;assert.equal(game.selectCharacter('dori'),false);assert.equal(game.saved.gold,1999);
  game.saved.gold=2500;assert.equal(game.selectCharacter('dori'),true);assert.equal(game.saved.gold,500);assert(game.saved.charactersOwned.includes('dori'));
  game.selectCharacter('nemo');game.selectCharacter('dori');assert.equal(game.saved.gold,500);
  const restored=game.readSave();assert.equal(restored.characterEquipped,'dori');assert(restored.charactersOwned.includes('dori'));
 });
 check('failed persistence rolls back purchase and selection',({game,storage})=>{
  game.saved.gold=2500;storage.set=()=>{throw Error('Storage full');};assert.equal(game.selectCharacter('dori'),false);assert.equal(game.saved.gold,2500);assert.equal(game.saved.characterEquipped,'nemo');assert(!game.saved.charactersOwned.includes('dori'));
 });
 check('all costumes share IDs and bonuses but resolve to separate Dori art',({game})=>{
  for(const outfit of game.COSTUMES){const dori=game.costumeForCharacter(outfit,'dori');assert.equal(dori.id,outfit.id);assert.equal(dori.hp,outfit.hp);assert.equal(dori.attack,outfit.attack);assert.notEqual(dori.portrait,outfit.portrait);assert.notEqual(dori.atlas,outfit.atlas);
   for(const file of [outfit.atlas,outfit.portrait,dori.atlas,dori.portrait])assert(fs.existsSync(path.resolve(__dirname,'../..',file)),file);
   for(const atlas of [outfit.atlas,dori.atlas]){const png=fs.readFileSync(path.resolve(__dirname,'../..',atlas));assert.equal(png.readUInt32BE(16),384,atlas);assert.equal(png.readUInt32BE(20),480,atlas);}
   if(outfit.id!=='default')assert(!outfit.name.includes('니모'));
  }
 });
 check('each character starts with its own weapon and cannot switch during a run',({game})=>{
  game.saved.gold=2000;game.selectCharacter('dori');game.begin();assert.equal(game.g.runCharacter,'dori');assert(game.g.weapons.cannon);assert(!game.g.weapons.star);assert.equal(game.selectCharacter('nemo'),false);assert.equal(game.g.runCharacter,'dori');
  assert.equal(game.fireWeapon('star'),false);for(let i=0;i<200;i++)assert(!game.rollCards(null).some(c=>c.type==='new'&&c.id==='star'));
  game.menu();game.selectCharacter('nemo');game.begin();assert(game.g.weapons.star);assert(!game.g.weapons.cannon);
  assert.equal(game.fireWeapon('cannon'),false);for(let i=0;i<200;i++)assert(!game.rollCards(null).some(c=>c.type==='new'&&c.id==='cannon'));
 });
 check('cannon has a heavier hit and restrained single-target DPS advantage',({game})=>{
  game.begin();const w={lv:1,up:[0,0,0],evo:null},star=game.weaponPower('star',game.W.star.coef,w),cannon=game.weaponPower('cannon',game.W.cannon.coef,w);
  assert(cannon>star*1.8);assert(game.cooldown('cannon',w)>game.cooldown('star',w));const ratio=(cannon/game.cooldown('cannon',w))/(star/game.cooldown('star',w));assert(ratio>1.1&&ratio<1.25);
 });
 check('cannon splash hits each nearby enemy once per volley, far enemies stay safe',({game})=>{
  game.saved.gold=2000;game.selectCharacter('dori');game.begin();const g=game.g,p=g.player;p.crit=0;
  const a=game.spawn('green',{x:p.x+4,y:p.y}),b=game.spawn('green',{x:p.x+4.5,y:p.y}),far=game.spawn('green',{x:p.x+8,y:p.y});
  for(const enemy of [a,b,far])enemy.hp=enemy.maxHp=10000;
  assert(game.fireWeapon('cannon'));assert.equal(p.cannonRecoil,.18);const shot=g.shots[0];assert.equal(shot.kind,'cannon');assert.equal(shot.r,.26);
  game.impactCannon(shot,a);assert.equal(a.hp,10000-shot.damage);assert.equal(b.hp,10000-Math.round(shot.damage*.35*100)/100);assert.equal(far.hp,10000);
  const before=b.hp;game.impactCannon({...shot},a);assert.equal(b.hp,before);
 });
 check('ranking loadouts retain character and the cannon without changing old records',({game})=>{
  const value=game.normalizeRankLoadout({character:'dori',costume:'rain',weapons:[{id:'cannon',level:7}]});assert.equal(value.character,'dori');assert.equal(value.weapons[0].id,'cannon');assert.equal(game.normalizeRankLoadout({costume:'default',weapons:[]}).character,'nemo');
 });
 check('every lobby and shop portrait has native high-resolution art and separate thumbnails',({game})=>{
  const metadata=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../../assets/wardrobe-portraits-v5122/resolution.json'),'utf8'));
  assert.equal(Object.keys(metadata).length,30);
  for(const character of ['nemo','dori'])for(const raw of game.COSTUMES){
   const art=game.costumeForCharacter(raw,character),detail=metadata[character+':'+raw.id];
   assert(detail.nativeBodyHeight>=600);assert(detail.scale<=1);assert(art.thumbnail);assert.notEqual(art.thumbnail,art.portrait);
   for(const [file,size] of [[art.portrait,768],[art.thumbnail,384]]){
    const bytes=fs.readFileSync(path.resolve(__dirname,'../..',file));assert.equal(bytes.toString('ascii',12,16),'VP8X',file);assert.equal(bytes.readUIntLE(24,3)+1,size,file);assert.equal(bytes.readUIntLE(27,3)+1,size,file);
   }
  }
 });
 check('squeaky ball preserves old cannon saves and renders every costume and direction',({game})=>{
  game.saved.gold=2000;game.selectCharacter('dori');game.begin();
  assert.equal(game.W.cannon.name,'삑삑이 공');
  const old=game.normalizeRankLoadout({character:'dori',weapons:[{id:'cannon',level:7}]});
  assert.equal(game.W[old.weapons[0].id].name,'삑삑이 공');
  const g=game.g,p=g.player,e=game.spawn('green',{x:p.x+4,y:p.y});e.hp=e.maxHp=100000;
  for(const outfit of game.COSTUMES)for(const dir of ['down','down-right','right','up-right','up','up-left','left','down-left']){
   g.runCostume=outfit.id;p.direction=dir;p.castFacing=dir;p.castTimer=0;p.cannonRecoil=0;
   game.drawBattle();game.fireWeapon('cannon');game.impactCannon(g.shots[g.shots.length-1],e);
   for(const progress of [0,.08,.18,.30,.41]){
    p.cannonRecoil=Math.max(0,.18-progress);
    for(const effect of g.effects)if(effect.kind==='cannonBlast')effect.life=.42-progress;
    game.drawBattle();
   }
   g.effects.length=0;g.shots.length=0;
  }
 });
 const failures=results.filter(x=>!x.pass);return {total:results.length,passed:results.length-failures.length,failures,detail:'2000G unlock, persistence rollback, shared costumes, starter combat and rankings'};
};
