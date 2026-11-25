const NEMO_DRAW = Object.freeze({
 cost:100,
 costumeChance:.05,
 photoRefund:25,
 costumeRefund:50,
 bulkCost:900,
 photoPool(save,photos){
  const owned=new Set(save.photosOwned||[]),remaining=photos.filter(photo=>!owned.has(photo.id));
  const counts={};for(const photo of remaining){const rank=photo.rank||'R';counts[rank]=(counts[rank]||0)+1;}
  return remaining.map(photo=>({...photo,weight:({R:65,SR:28,SSR:7}[photo.rank||'R']||65)/counts[photo.rank||'R']}));
 },
 purchaseMany(save,photos,costumes,count=1,random=Math.random,now=Date.now()){
  if(count!==1&&count!==10)return null;
  const cost=count===10?this.bulkCost:this.cost;if(save.gold<cost)return null;
  let state={...save,gold:save.gold+count*this.cost-cost};const rewards=[];
  for(let i=0;i<count;i++){
   const result=this.purchase(state,photos,costumes,random,now);
   if(!result)return null;state=result.save;rewards.push(result.reward);
  }
  return {save:state,rewards,cost,count};
 },
 purchase(save,photos,costumes,random=Math.random,now=Date.now()){
  if(save.gold<this.cost||!photos.length||!costumes.length)return null;
  const type=random()<this.costumeChance?'costume':'photo';
  const pool=type==='costume'?costumes:this.photoPool(save,photos);
  if(type==='photo'&&!pool.length)return {
   save:{...save,gold:save.gold-this.cost+this.photoRefund,drawCount:(save.drawCount??0)+1,
    photosOwned:[...(save.photosOwned||[])],photosObtainedAt:{...save.photosObtainedAt}},
   reward:{type:'gold',item:{name:'포토카드 수집 완료',art:'./assets/pastel-ui-v5619/coin.webp'},duplicate:false,refund:this.photoRefund,amount:this.photoRefund}
  };
  const total=pool.reduce((sum,item)=>sum+(type==='photo'?(item.weight||1):(item.drawWeight||1)),0);
  let cursor=Math.max(0,Math.min(.999999999,random()))*total;
  const item=pool.find(item=>{cursor-=type==='photo'?(item.weight||1):(item.drawWeight||1);return cursor<0;})||pool.at(-1);
  const field=type==='costume'?'costumesOwned':'photosOwned';
  const owned=save[field]??[];
  const duplicate=owned.includes(item.id);
  const refund=duplicate?(type==='costume'?this.costumeRefund:this.photoRefund):0;
  return {
   save:{...save,gold:save.gold-this.cost+refund,drawCount:(save.drawCount??0)+1,
    [field]:duplicate?[...owned]:[...owned,item.id],
    photosObtainedAt:type==='photo'&&!duplicate?{...save.photosObtainedAt,[item.id]:now}:{...save.photosObtainedAt}},
   reward:{type,item,duplicate,refund}
  };
 }
});
