// Clean campaign maps. Every coordinate below is an offset from world center
// (80, 80), using the same raw tuple format as campaign-v573/maps.js.
const NEMO_WORLD_RENEWAL = (() => {
 'use strict';
 const root='./assets/world-v51226-art/';
 const palettes=Object.freeze({
  garden:Object.freeze({ground:'#dfeac8',trail:'#f4e5c4',water:'#93c9b8',fleck:'#b2c394'}),
  twilight:Object.freeze({ground:'#d8d6e9',trail:'#eee0df',water:'#a1afd0',fleck:'#b6afcb'}),
  crystal:Object.freeze({ground:'#d9e9eb',trail:'#f1e5ef',water:'#9acbd8',fleck:'#abc9cb'}),
  frost:Object.freeze({ground:'#e7f0ef',trail:'#f6eee0',water:'#a5cddd',fleck:'#bfd5d4'}),
  ember:Object.freeze({ground:'#ead7c8',trail:'#f6e5cc',water:'#d6a28f',fleck:'#cfb4a1'}),
  tide:Object.freeze({ground:'#d6ebe0',trail:'#f5e8c9',water:'#8fc9c5',fleck:'#a8cbb9'}),
  clock:Object.freeze({ground:'#e9e1c9',trail:'#f8e9c7',water:'#aec9bd',fleck:'#cabb95'}),
  astral:Object.freeze({ground:'#dedcf0',trail:'#f2e5f0',water:'#afb9df',fleck:'#bcb6d3'})
 });
 const assetPaths=Object.freeze({
  renewalOak:root+'oak.webp',renewalBlossom:root+'blossom.webp',renewalPond:root+'pond.webp'
 });
 // Three routes share the central junction and reach four sides of the world.
 // Gentle bends distinguish maps without creating narrow obstacle corridors.
 const routeLayouts=[
  [
   [[0,0],[-12,1],[-28,4],[-50,2],[-69,8]],
   [[0,0],[13,1],[27,5],[46,2],[69,10]],
   [[-7,68],[-5,43],[1,24],[0,0],[-3,-20],[2,-43],[3,-68]]
  ],
  [
   [[0,0],[-12,-2],[-28,-6],[-48,-4],[-69,-12]],
   [[0,0],[13,2],[29,6],[48,4],[69,12]],
   [[6,68],[3,45],[-2,22],[0,0],[1,-23],[-4,-46],[-8,-68]]
  ],
  [
   [[0,0],[-12,3],[-29,6],[-49,2],[-69,5]],
   [[0,0],[13,-2],[28,-5],[48,-1],[69,-7]],
   [[-4,68],[-1,46],[3,23],[0,0],[-2,-22],[3,-45],[7,-68]]
  ]
 ];
 const freezeTuples=items=>Object.freeze(items.map(tuple=>Object.freeze([...tuple])));
 const freezeRoutes=routes=>Object.freeze(routes.map(freezeTuples));
 const pathWidths=Object.freeze([3.1,2.9,3.0]);
 const commonTrees=Object.freeze([
  Object.freeze({key:'renewalOak',x:-12,y:-10,h:3.1,w:2.6,rx:.42,ry:.28}),
  Object.freeze({key:'renewalBlossom',x:-15,y:12,h:2.9,w:2.7,rx:.40,ry:.27}),
  Object.freeze({key:'renewalOak',x:18,y:11,h:3.2,w:2.7,rx:.44,ry:.29})
 ]);
 const extraTree=Object.freeze({key:'renewalBlossom',x:29,y:-19,h:3.0,w:2.7,rx:.42,ry:.28});
 const pondRegions=new Set(['garden','twilight','crystal','frost','tide']);

 function makeMap(stage,survival=false){
  const region=stage.theme??'garden';
  const palette=palettes[region];
  const layout=routeLayouts[(Math.max(1,stage.id)-1)%routeLayouts.length];
  const hasPond=pondRegions.has(region)&&(survival||stage.id%2===0);
  return Object.freeze({
   id:survival?0:stage.id,region,theme:region,name:survival?'마법의 산책 숲':stage.name,
   ...palette,
   art:root+region+'.webp',
   cleanGround:true,worldSize:160,centralClearing:8,
   paths:freezeRoutes(layout),pathWidths,
   // One regional silhouette gives each map identity without repeating it.
   landmarks:freezeTuples([[11,-9,3.8,1.1,.65]]),
   pools:freezeTuples(hasPond?[[-21,14,5.0,2.9,1.9,.9]]:[]),
   poolArt:'renewalPond',landmarkPool:false,
   dressing:Object.freeze(survival?[...commonTrees,extraTree]:[...commonTrees]),
   sparseDecor:true
  });
 }
 const maps=NEMO_CAMPAIGN_RENEWAL.stages.map(stage=>makeMap(stage));
 const survivalMap=makeMap({id:1,theme:'garden'},true);
 return Object.freeze({
  version:'5.13.0',worldSize:160,centralClearing:8,
  palettes,assetPaths,maps:Object.freeze(maps),survivalMap
 });
})();
