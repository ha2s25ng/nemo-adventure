function createNemoCapsule(doc){
 const $=id=>doc.getElementById(id),stage=$('capsule-stage'),capsule=$('capsule-open');
 const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
 const wait=ms=>new Promise(resolve=>setTimeout(resolve,reduced()?20:ms));
 let page=0,photos=[],owned=[],turning=false;
 const phase=value=>{stage.dataset.phase=value;};
 const rank=photo=>photo.rank||'R';
 function reset(){phase('idle');capsule.hidden=true;capsule.disabled=true;$('draw-reward').hidden=true;$('capsule-hint').textContent='작은 캡슐 속, 니모의 선물';}
 function ready(){phase('ready');capsule.hidden=false;capsule.disabled=false;$('capsule-hint').textContent='캡슐을 눌러 열어 보세요';capsule.focus({preventScroll:true});}
 async function dispense(){reset();phase('coin');$('capsule-hint').textContent='코인을 넣고…';await wait(620);phase('turn');$('capsule-hint').textContent='손잡이를 돌리면…';await wait(1050);phase('drop');capsule.hidden=false;$('capsule-hint').textContent='선물이 나왔어요!';await wait(720);ready();}
 async function reveal(tier){if(stage.dataset.phase!=='ready')return;capsule.disabled=true;stage.dataset.tier=tier;phase('opening');$('capsule-hint').textContent='반짝, 어떤 선물일까요?';await wait(650);phase('revealed');$('capsule-hint').textContent=tier==='costume'?'특별한 코스튬을 발견했어요!':'니모의 순간을 발견했어요!';}
 function render(){
  const count=Math.max(1,Math.ceil(photos.length/2));page=Math.max(0,Math.min(count-1,page));
  $('album-pages').innerHTML=[0,1].map(offset=>{const photo=photos[page*2+offset];if(!photo)return '<section class="book-page book-blank"><span>다음 추억을 기다리며</span></section>';
   const collected=owned.includes(photo.id);
   return `<section class="book-page"><span class="photo-grade" data-rank="${rank(photo)}">${rank(photo)}</span>${collected?`<button type="button" class="book-photo" data-album-photo="${photo.id}" aria-label="${photo.name} 크게 보기"><img src="${photo.thumb||photo.art}" alt="${photo.name}" loading="lazy" decoding="async"><span>눌러서 크게 보기</span></button>`:'<div class="book-photo book-locked"><b>?</b><span>아직 만나지 못한 순간</span></div>'}<h3>${collected?photo.name:'미수집 사진'}</h3><small>${String(page*2+offset+1).padStart(2,'0')}</small></section>`;
  }).join('');
  $('album-page-count').textContent=`${page+1} / ${count}`;$('album-prev').disabled=page===0||turning;$('album-next').disabled=page===count-1||turning;
 }
 function openAlbum(list,collection){photos=list;owned=collection;page=0;turning=false;$('draw-album').hidden=false;$('album-book').classList.remove('is-open');render();requestAnimationFrame(()=>requestAnimationFrame(()=>$('album-book').classList.add('is-open')));$('album-close').focus({preventScroll:true});}
 function closeAlbum(){if($('draw-album').hidden)return false;closePhoto(false);$('draw-album').hidden=true;$('album-book').classList.remove('is-open');$('draw-album-open').focus({preventScroll:true});return true;}
 async function turn(direction){if(turning||page+direction<0||page+direction>=Math.ceil(photos.length/2))return;turning=true;render();const flip=$('album-flip');flip.innerHTML=$('album-pages').children[direction>0?1:0].innerHTML;flip.dataset.direction=direction>0?'next':'prev';flip.classList.add('turning');await wait(430);page+=direction;flip.classList.remove('turning');flip.innerHTML='';turning=false;render();}
 function photo(id){const item=photos.find(p=>p.id===id);if(!item||!owned.includes(id))return;$('photo-full').src=item.full||item.art;$('photo-full').alt=item.name;$('photo-title').textContent=item.name;$('photo-rank').textContent=rank(item);$('photo-rank').className='photo-grade';$('photo-rank').dataset.rank=rank(item);$('photo-scroll').classList.remove('zoomed');$('photo-zoom').textContent='확대하기';$('photo-lightbox').hidden=false;$('photo-close').focus({preventScroll:true});}
 function closePhoto(focus=true){if($('photo-lightbox').hidden)return false;$('photo-lightbox').hidden=true;$('photo-full').removeAttribute('src');if(focus)$('album-close').focus({preventScroll:true});return true;}
 function zoom(){const active=$('photo-scroll').classList.toggle('zoomed');$('photo-zoom').textContent=active?'전체 보기':'확대하기';}
 // Keep nested dialogs keyboard accessible, independently of the game's screen trap.
 doc.addEventListener('keydown',event=>{const dialog=!$('photo-lightbox').hidden?$('photo-lightbox'):!$('draw-album').hidden?$('draw-album'):null;if(!dialog)return;if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();closeTop();}else if(event.key==='Tab'){const buttons=[...dialog.querySelectorAll('button:not(:disabled)')];const first=buttons[0],last=buttons.at(-1);if(event.shiftKey&&doc.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&doc.activeElement===last){event.preventDefault();first.focus();}}},true);
 function closeTop(){return closePhoto()||closeAlbum();}
 return {reset,dispense,ready,reveal,canOpen:()=>stage.dataset.phase==='ready',openAlbum,closeAlbum,turn,photo,closePhoto,zoom,closeTop};
}
