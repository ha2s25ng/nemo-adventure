(function(root){
 'use strict';
 function valid(recipe){return !!recipe&&typeof recipe.id==='string'&&typeof recipe.weapon==='string'&&typeof recipe.passive==='string'&&typeof recipe.apply==='function';}
 function eligible(run,recipe){return valid(recipe)&&run.weapons[recipe.weapon]?.lv===7&&(run.passives[recipe.passive]||0)>=5&&!run.weapons[recipe.weapon].awakened;}
 function sync(run,recipes){
  const available=new Map(recipes.filter(recipe=>eligible(run,recipe)).map(recipe=>[recipe.id,recipe]));
  const queue=(run.awakeningQueue||[]).filter((id,index,all)=>available.has(id)&&all.indexOf(id)===index);
  for(const recipe of recipes)if(available.has(recipe.id)&&!queue.includes(recipe.id))queue.push(recipe.id);
  run.awakeningQueue=queue;return queue;
 }
 function next(run,recipes,reason){
  const queue=sync(run,recipes);if(reason!=='level'||!queue.length)return null;
  const recipe=recipes.find(recipe=>recipe.id===queue[0]);
  return {type:'awakening',id:recipe.id,weapon:recipe.weapon,name:recipe.name,desc:recipe.summary,ico:'✦',meta:'각성'};
 }
 function apply(run,recipes,id){
  const recipe=recipes.find(recipe=>recipe.id===id);if(!eligible(run,recipe))return null;
  recipe.apply(run);run.weapons[recipe.weapon].awakened=recipe.id;sync(run,recipes);return recipe;
 }
 const api={eligible,sync,next,apply};
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.NEMO_AWAKENING=Object.freeze(api);
})(typeof globalThis==='object'?globalThis:this);
