function nemoAlbumOrder(photos,owned,dates={},order='owned'){
 const collected=new Set(owned),ranks={R:1,SR:2,SSR:3};
 return photos.map((photo,index)=>({photo,index})).sort((a,b)=>{
  const hasA=collected.has(a.photo.id),hasB=collected.has(b.photo.id);
  if(hasA!==hasB)return Number(hasB)-Number(hasA);
  if(order==='rank'){const delta=(ranks[b.photo.rank]||1)-(ranks[a.photo.rank]||1);if(delta)return delta;}
  if(order==='date'&&hasA){const delta=(dates[b.photo.id]||0)-(dates[a.photo.id]||0);if(delta)return delta;}
  return a.index-b.index;
 }).map(entry=>entry.photo);
}
function createNemoCapsule(doc){
 const $=id=>doc.getElementById(id),stage=$('capsule-stage'),capsule=$('capsule-open'),PAGE_SIZE=12;
 const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
 const wait=ms=>new Promise(resolve=>setTimeout(resolve,reduced()?20:ms));
 const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let page=0,photos=[],allPhotos=[],owned=[],dates={},albumExit=null,selected=null,returnCard=null,characterFilter='all';
 const phase=value=>{stage.dataset.phase=value;};
 const rank=photo=>photo.rank||'R';
 const dateLabel=id=>dates[id]?'획득일 '+new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(dates[id]):'획득일 기록 없음';
 function reset(){phase('idle');capsule.hidden=true;capsule.disabled=true;$('draw-reward').hidden=true;$('capsule-hint').textContent='작은 캡슐 속, 니모의 선물';}
 function ready(){phase('ready');capsule.hidden=false;capsule.disabled=false;$('capsule-hint').textContent='캡슐을 눌러 열어 보세요';capsule.focus({preventScroll:true});}
 async function dispense(){reset();phase('coin');$('capsule-hint').textContent='코인을 넣고…';await wait(620);phase('turn');$('capsule-hint').textContent='손잡이를 돌리면…';await wait(1050);phase('drop');capsule.hidden=false;$('capsule-hint').textContent='선물이 나왔어요!';await wait(720);ready();}
 async function reveal(tier){if(stage.dataset.phase!=='ready')return;capsule.disabled=true;stage.dataset.tier=tier;phase('opening');$('capsule-hint').textContent='반짝, 어떤 선물일까요?';await wait(650);phase('revealed');$('capsule-hint').textContent=tier==='costume'?'특별한 코스튬을 발견했어요!':'니모의 포토카드를 발견했어요!';}
 function render(){
  const filtered=allPhotos.filter(photo=>characterFilter==='all'||(photo.character||'nemo')===characterFilter);
  $('album-owned-count').textContent=`수집 ${filtered.filter(item=>owned.includes(item.id)).length} / ${filtered.length}`;
  const count=Math.max(1,Math.ceil(photos.length/PAGE_SIZE));page=Math.max(0,Math.min(count-1,page));
  $('album-pages').innerHTML=photos.slice(page*PAGE_SIZE,(page+1)*PAGE_SIZE).map(photo=>{
   const has=owned.includes(photo.id),number=photo.number||allPhotos.indexOf(photo)+1,isDori=photo.character==='dori';
   return `<button type="button" class="collection-card${has?'':' is-locked'}" data-rank="${rank(photo)}" data-character="${isDori?'dori':'nemo'}" ${has?`data-album-photo="${escape(photo.id)}"`:'disabled'} aria-label="${has?escape(photo.name)+' 포토카드 보기':'미수집 포토카드 '+number}"><span class="collection-card-top"><span class="photo-grade" data-rank="${rank(photo)}">${rank(photo)}</span><small>${isDori?'도리':'니모'} · ${String(number).padStart(3,'0')}</small></span>${has?`<span class="collection-image"><img src="${escape(photo.thumb||photo.art)}" alt="${escape(photo.name)}" loading="lazy" decoding="async"></span>`:`<span class="collection-card-back" aria-hidden="true"><i>✦</i><b>${isDori?'DORI':'NEMO'}</b><small>아직 만나지 못한 순간</small></span>`}<strong>${has?escape(photo.name):'미수집 카드'}</strong><span class="collection-date">${has?escape(dateLabel(photo.id)):'캡슐에서 만나요'}</span></button>`;
  }).join('');
  $('album-sort').disabled=false;$('album-prev').disabled=page===0;$('album-next').disabled=page===count-1;
  $('album-page-count').textContent=`${page+1} / ${count}`;$('album-pages').scrollTop=0;
 }
 function sort(order){photos=nemoAlbumOrder(allPhotos.filter(photo=>characterFilter==='all'||(photo.character||'nemo')===characterFilter),owned,dates,order);page=0;render();}
 function filter(character){characterFilter=['nemo','dori'].includes(character)?character:'all';$('album-character').value=characterFilter;sort($('album-sort').value||'owned');}
 function openAlbum(list,collection,obtained={},onClose=null){
  closePhoto(false);albumExit=onClose;allPhotos=list;owned=collection;dates=obtained||{};
  characterFilter='all';$('album-character').value='all';photos=nemoAlbumOrder(list,collection,dates,'owned');page=0;$('album-sort').value='owned';
  $('album-owned-count').textContent=`수집 ${list.filter(item=>owned.includes(item.id)).length} / ${list.length}`;
  render();$('draw-album').hidden=false;$('album-close').focus({preventScroll:true});
 }
 function closeAlbum(){if($('draw-album').hidden)return false;closePhoto(false);$('draw-album').hidden=true;const exit=albumExit;albumExit=null;if(exit)exit();else $('draw-album-open').focus({preventScroll:true});return true;}
 function turn(direction){if($('draw-album').hidden||page+direction<0||page+direction>=Math.ceil(photos.length/PAGE_SIZE))return;page+=direction;render();}
 function setBack(back){
  $('photocard-detail').classList.toggle('is-flipped',back);
  $('photocard-front').inert=back;$('photocard-back').inert=!back;
  $('photocard-front').setAttribute('aria-hidden',String(back));$('photocard-back').setAttribute('aria-hidden',String(!back));
  $('photo-flip').textContent=back?'사진 보기':'뒷면 보기';$('photo-flip').setAttribute('aria-pressed',String(back));
 }
 function photo(id){
  const item=allPhotos.find(p=>p.id===id);if($('draw-album').hidden||!item||!owned.includes(id))return;
  selected=item;returnCard=doc.activeElement;
  // Remove the old source before presenting another card; only one photo exists in the detail view.
  const image=$('photo-full');image.removeAttribute('src');image.style.visibility='hidden';image.alt=item.name;
  image.onload=()=>{if(selected?.id===item.id)image.style.visibility='visible';};
  image.onerror=()=>{if(selected?.id===item.id){image.style.visibility='visible';image.alt=item.name+' · 사진을 불러오지 못했어요';}};
  image.src=item.full||item.art;
  $('photo-title').textContent=item.name;$('photo-caption').textContent=item.name;$('photo-back-title').textContent=item.name;
  $('photo-date').textContent=dateLabel(item.id);$('photo-number').textContent=(item.characterName||'니모')+' · No. '+String(item.number||allPhotos.indexOf(item)+1).padStart(3,'0');
  $('photo-brand').textContent=item.character==='dori'?'DORI MEMORIES':'NEMO MEMORIES';
  $('photo-character-art').src=item.characterArt||'./assets/adventure-v5100/dreamstar-portrait.webp';
  $('photo-memory').textContent=(item.characterName||'니모')+'와 함께한 작은 순간';
  for(const id of ['photo-rank','photo-back-rank']){$(id).textContent=rank(item);$(id).className='photo-grade';$(id).dataset.rank=rank(item);}
  $('photocard-detail').dataset.rank=rank(item);$('photo-scroll').classList.remove('zoomed');$('photo-zoom').textContent='크게 보기';
  setBack(false);$('photo-lightbox').hidden=false;$('photo-close').focus({preventScroll:true});
 }
 function closePhoto(focus=true){if($('photo-lightbox').hidden)return false;$('photo-lightbox').hidden=true;$('photo-full').onload=null;$('photo-full').onerror=null;$('photo-full').removeAttribute('src');selected=null;setBack(false);if(focus)(returnCard?.isConnected?returnCard:$('album-close')).focus({preventScroll:true});returnCard=null;return true;}
 function flip(){if(!selected||$('photo-lightbox').hidden)return;$('photo-scroll').classList.remove('zoomed');$('photo-zoom').textContent='크게 보기';setBack(!$('photocard-detail').classList.contains('is-flipped'));}
 function zoom(){if(!selected)return;setBack(false);const active=$('photo-scroll').classList.toggle('zoomed');$('photo-zoom').textContent=active?'카드로 보기':'크게 보기';}
 function closeTop(){return closePhoto()||closeAlbum();}
 doc.addEventListener('keydown',event=>{
  const dialog=!$('photo-lightbox').hidden?$('photo-lightbox'):!$('draw-album').hidden?$('draw-album'):null;if(!dialog)return;
  if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();closeTop();}
  else if(event.key==='Tab'){
   const buttons=[...dialog.querySelectorAll('button:not(:disabled),select:not(:disabled)')].filter(el=>!el.closest('[inert]'));
   const first=buttons[0],last=buttons.at(-1);if(!first)return;
   if(event.shiftKey&&doc.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&doc.activeElement===last){event.preventDefault();first.focus();}
  }
 },true);
 return {reset,dispense,ready,reveal,canOpen:()=>stage.dataset.phase==='ready',openAlbum,closeAlbum,sort,filter,turn,photo,closePhoto,zoom,flip,closeTop};
}
