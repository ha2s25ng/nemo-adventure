'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
module.exports=function(){
 const nodes=new Map(),listeners={};let focused=null;
 function node(id){if(nodes.has(id))return nodes.get(id);const classes=new Set(),attrs={};const el={id,hidden:true,disabled:false,dataset:{},style:{},innerHTML:'',textContent:'',scrollTop:0,isConnected:true,
  classList:{add:c=>classes.add(c),remove:c=>classes.delete(c),contains:c=>classes.has(c),toggle(c,state){const next=state===undefined?!classes.has(c):state;if(next)classes.add(c);else classes.delete(c);return next;}},
  setAttribute:(key,value)=>{attrs[key]=value;},getAttribute:key=>attrs[key],removeAttribute:key=>{delete attrs[key];if(key==='src')delete el.src;},focus:()=>{focused=el;},querySelectorAll:()=>[],closest:()=>null};nodes.set(id,el);return el;}
 const doc={getElementById:node,get activeElement(){return focused;},addEventListener:(type,fn)=>{listeners[type]=fn;}};
 const context={Intl,Date,matchMedia:()=>({matches:false}),setTimeout};vm.createContext(context);
 vm.runInContext(fs.readFileSync(path.resolve(__dirname,'../../assets/photocards-v5102/cards.js'),'utf8')+';this.create=createNemoCapsule;this.order=nemoAlbumOrder;',context);
 const ui=context.create(doc),photos=Array.from({length:25},(_,n)=>({id:'card'+n,name:'추억 '+n,thumb:n+'-thumb.webp',full:n+'-full.webp',rank:n%3===0?'SSR':n%3===1?'SR':'R'})),owned=['card0','card1','card13'],dates={card0:1000,card1:2000,card13:3000};
 node('photo-lightbox').hidden=true;node('draw-album').hidden=true;
 const results=[],check=(name,fn)=>{try{fn();results.push({name,pass:true});}catch(error){results.push({name,pass:false,error:error.stack});}};
 check('collection preserves owned-first and date/rank sorting',()=>{
  ui.openAlbum(photos,owned,dates);assert.equal(node('album-page-count').textContent,'1 / 3');assert.equal(node('album-owned-count').textContent,'수집 3 / 25');
  const order=Array.from(context.order(photos,owned,dates,'date'),p=>p.id);assert.deepEqual(order.slice(0,3),['card13','card1','card0']);
  assert.equal(context.order(photos,owned,dates,'rank')[0].id,'card0');
 });
 check('grid loads only current collected thumbnails; page changes replace content synchronously',()=>{
  const before=node('album-pages').innerHTML;assert.equal((before.match(/<button /g)||[]).length,12);assert.equal((before.match(/<img /g)||[]).length,3);
  ui.turn(1);assert.equal(node('album-page-count').textContent,'2 / 3');assert.equal((node('album-pages').innerHTML.match(/<img /g)||[]).length,0);
  ui.turn(1);assert.equal(node('album-next').disabled,true);assert.equal((node('album-pages').innerHTML.match(/<button /g)||[]).length,1);
  ui.turn(1);assert.equal(node('album-page-count').textContent,'3 / 3');ui.sort('date');assert.equal(node('album-page-count').textContent,'1 / 3');
 });
 check('unowned card cannot open, front/back and zoom reset correctly',()=>{
  ui.photo('card2');assert(node('photo-lightbox').hidden);ui.photo('card0');assert.equal(node('photo-full').src,'0-full.webp');assert(!node('photo-lightbox').hidden);
  ui.flip();assert.equal(node('photo-flip').getAttribute('aria-pressed'),'true');assert(node('photocard-front').inert);assert(!node('photocard-back').inert);
  ui.zoom();assert(!node('photocard-front').inert);assert(node('photo-scroll').classList.contains('zoomed'));
  ui.closePhoto();assert(!node('photo-full').src);ui.photo('card1');assert.equal(node('photo-title').textContent,'추억 1');assert(!node('photo-scroll').classList.contains('zoomed'));
 });
 check('stale image load cannot reveal previous photo; close clears source and handlers',()=>{
  const image=node('photo-full'),oldLoad=image.onload;ui.photo('card13');oldLoad();assert.equal(image.style.visibility,'hidden');image.onload();assert.equal(image.style.visibility,'visible');
  ui.closePhoto();assert(!image.src);assert.equal(image.onload,null);assert.equal(image.onerror,null);
 });
 check('character filter keeps separate counts and the correct card-back identity',()=>{
  const dori=photos[24];Object.assign(dori,{character:'dori',characterName:'도리',characterArt:'dori-portrait.webp',number:1});
  ui.filter('dori');assert.equal(node('album-owned-count').textContent,'수집 0 / 1');assert.equal(node('album-page-count').textContent,'1 / 1');
  assert(node('album-pages').innerHTML.includes('DORI'));assert.equal((node('album-pages').innerHTML.match(/<img /g)||[]).length,0);
  ui.photo('card24');assert(node('photo-lightbox').hidden);
  owned.push('card24');ui.filter('dori');assert.equal(node('album-owned-count').textContent,'수집 1 / 1');ui.photo('card24');
  assert.equal(node('photo-brand').textContent,'DORI MEMORIES');assert.equal(node('photo-character-art').src,'dori-portrait.webp');assert.equal(node('photo-number').textContent,'No. 001');ui.closePhoto();
  ui.filter('nemo');assert.equal(node('album-owned-count').textContent,'수집 3 / 24');
  ui.filter('all');assert.equal(node('album-owned-count').textContent,'수집 3 / 24');
  ui.filter('dori');ui.openAlbum(photos,owned,dates);assert.equal(node('album-owned-count').textContent,'수집 3 / 24');assert(!node('album-pages').innerHTML.includes('DORI'));
 });
 check('Escape closes detail first, then collection; callback fires once',()=>{
  let exits=0;ui.openAlbum(photos,owned,dates,()=>exits++);ui.photo('card0');
  const event={key:'Escape',preventDefault(){},stopImmediatePropagation(){}};listeners.keydown(event);assert(node('photo-lightbox').hidden);assert(!node('draw-album').hidden);listeners.keydown(event);assert(node('draw-album').hidden);assert.equal(exits,1);ui.closeAlbum();assert.equal(exits,1);
 });
 const failures=results.filter(x=>!x.pass);return {total:results.length,passed:results.length-failures.length,failures,detail:'sorting, paging, thumbnail loading, flip/zoom, stale images and Escape'};
};
