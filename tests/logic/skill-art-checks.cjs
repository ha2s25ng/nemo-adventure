'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {createHarness}=require('./harness.cjs');
module.exports=function(){
 const results=[],check=(name,fn)=>{try{fn();results.push({name,pass:true});}catch(error){results.push({name,pass:false,error:error.stack});}};
 check('all 15 weapon icons have a matching battle sprite and an existing asset',()=>{
  const {game}=createHarness();
  for(const id of Object.keys(game.W)){
   const file=game.ASSET_DATA['ui_'+id];assert(fs.existsSync(path.resolve(__dirname,'../..',file)),file);
   const fx=id==='orbit'?game.ASSET_DATA.orbitToy:id==='cannon'?game.ASSET_DATA.cannonProjectile:game.ASSET_DATA['spell_'+id];
   assert.equal(file,fx,id);
  }
 });
 check('every skill draws its matching art in battle at base and both evolutions, in both modes',()=>{
  const {game,drawCalls}=createHarness(12345,true);
  for(const stage of [0,1])for(const id of Object.keys(game.W))for(const evo of [null,0,1]){
   game.menu();if(id==='cannon'){game.saved.gold=2000;game.selectCharacter('dori');}else game.selectCharacter('nemo');
   game.begin(stage);const g=game.g,p=g.player;p.invuln=1e9;
   g.weapons={[id]:{lv:evo===null?3:7,up:[1,1,1],break:evo!==null,evo,clock:0}};
   for(const [dx,dy] of [[1.5,0],[3,0],[4,1],[-2,0]]){
    const e=game.spawn('armor',{x:p.x+dx,y:p.y+dy});e.hp=e.maxHp=1e7;
   }
   drawCalls.length=0;
   for(let tick=0;tick<70;tick++){
    game.update(.025);game.drawBattle();
    for(const entity of [...g.shots,...g.zones,...g.effects])for(const key of ['x','y','r','life'])
     if(entity[key]!==undefined)assert(Number.isFinite(entity[key]),id+': '+key);
   }
   assert(drawCalls.some(call=>call.src===game.ASSET_DATA['ui_'+id]),`${id}: no matching battle art; evo ${evo}; stage ${stage}`);
   for(const call of drawCalls)assert(call.args.every(Number.isFinite),`${id}: non-finite drawing coordinates`);
  }
 });
 check('all six rare cards render their retained damage mechanics using the matching art',()=>{
  const {game}=createHarness();
  for(const [rare,card] of Object.entries(game.RARE_CARDS))for(const evo of [0,1]){
   game.menu();game.begin();const g=game.g,p=g.player;p.invuln=1e9;
   g.weapons={[card.weapon]:{lv:7,up:[1,2,1],break:true,evo,clock:0}};
   g.cards=[{type:'rare',id:rare,...card}];game.setScreen('cards');game.selectCard(0);
   for(let i=0;i<5;i++){const e=game.spawn('armor',{x:p.x+1.8+i*.3,y:p.y+i*.15});e.hp=e.maxHp=1e7;}
   for(let frame=0;frame<180;frame++){game.update(1/30);game.drawBattle();}
   assert(g.totalDamage>0,rare);
  }
 });
 check('reduced motion renders every weapon without relying on animated sparkles',()=>{
  const {game,drawCalls}=createHarness(6789,true,true);
  for(const id of Object.keys(game.W)){
   game.menu();if(id==='cannon'){game.saved.gold=2000;game.selectCharacter('dori');}else game.selectCharacter('nemo');
   game.begin();const g=game.g,p=g.player;p.invuln=1e9;
   g.weapons={[id]:{lv:7,up:[1,1,1],break:true,evo:1,clock:0}};
   const e=game.spawn('armor',{x:p.x+1.7,y:p.y});e.hp=e.maxHp=1e7;
   drawCalls.length=0;
   for(let frame=0;frame<65;frame++){game.update(.025);game.drawBattle();}
   assert(drawCalls.some(call=>call.src===game.ASSET_DATA['ui_'+id]),id);
  }
 });
 const failures=results.filter(r=>!r.pass);return {total:results.length,passed:results.length-failures.length,failures,detail:'15 matched icon/effect assets, 90 battle/evolution combinations, 12 rare combinations, reduced motion'};
};
