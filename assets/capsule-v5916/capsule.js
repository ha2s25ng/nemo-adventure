function nemoAlbumOrder(photos,owned,dates={},order='owned'){
 const collected=new Set(owned),ranks={R:1,SR:2,SSR:3};
 return photos.map((photo,index)=>({photo,index})).sort((a,b)=>{
  const hasA=collected.has(a.photo.id),hasB=collected.has(b.photo.id);
  if(hasA!==hasB)return Number(hasB)-Number(hasA);
  if(order==='rank'){const difference=(ranks[b.photo.rank]||1)-(ranks[a.photo.rank]||1);if(difference)return difference;}
  if(order==='date'&&hasA){const difference=(dates[b.photo.id]||0)-(dates[a.photo.id]||0);if(difference)return difference;}
  return a.index-b.index;
 }).map(entry=>entry.photo);
}
function createNemoCapsule(doc){
 const $=id=>doc.getElementById(id),stage=$('capsule-stage'),capsule=$('capsule-open');
 const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
 const wait=ms=>new Promise(resolve=>setTimeout(resolve,reduced()?20:ms));
 let page=0,photos=[],allPhotos=[],owned=[],dates={},turning=false,albumExit=null,albumSession=0;
 const phase=value=>{stage.dataset.phase=value;};
 const rank=photo=>photo.rank||'R';
 const dateLabel=id=>dates[id]?'획득일 '+new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(dates[id]):'획득일 기록 없음';
 function reset(){phase('idle');capsule.hidden=true;capsule.disabled=true;$('draw-reward').hidden=true;$('capsule-hint').textContent='작은 캡슐 속, 니모의 선물';}
 function ready(){phase('ready');capsule.hidden=false;capsule.disabled=false;$('capsule-hint').textContent='캡슐을 눌러 열어 보세요';capsule.focus({preventScroll:true});}
 async function dispense(){reset();phase('coin');$('capsule-hint').textContent='코인을 넣고…';await wait(620);phase('turn');$('capsule-hint').textContent='손잡이를 돌리면…';await wait(1050);phase('drop');capsule.hidden=false;$('capsule-hint').textContent='선물이 나왔어요!';await wait(720);ready();}
 async function reveal(tier){if(stage.dataset.phase!=='ready')return;capsule.disabled=true;stage.dataset.tier=tier;phase('opening');$('capsule-hint').textContent='반짝, 어떤 선물일까요?';await wait(650);phase('revealed');$('capsule-hint').textContent=tier==='costume'?'특별한 코스튬을 발견했어요!':'니모의 순간을 발견했어요!';}
 function render(){
  $('album-sort').disabled=turning;
  const count=Math.max(1,Math.ceil(photos.length/2));page=Math.max(0,Math.min(count-1,page));
  $('album-pages').innerHTML=[0,1].map(offset=>{const photo=photos[page*2+offset];if(!photo)return '<section class="book-page book-blank"><span>다음 추억을 기다리며</span></section>';
   const collected=owned.includes(photo.id);
   return `<section class="book-page"><span class="photo-grade" data-rank="${rank(photo)}">${rank(photo)}</span>${collected?`<button type="button" class="book-photo" data-album-photo="${photo.id}" aria-label="${photo.name} 크게 보기"><img src="${photo.thumb||photo.art}" alt="${photo.name}" loading="lazy" decoding="async"><span>눌러서 크게 보기</span></button>`:'<div class="book-photo book-locked"><b>?</b><span>아직 만나지 못한 순간</span></div>'}<h3>${collected?photo.name:'미수집 사진'}</h3>${collected?`<span class="photo-date">${dateLabel(photo.id)}</span>`:''}<small>${String(page*2+offset+1).padStart(2,'0')}</small></section>`;
  }).join('');
  $('album-page-count').textContent=`${page+1} / ${count}`;$('album-prev').disabled=page===0||turning;$('album-next').disabled=page===count-1||turning;
 }
 function sort(order){if(turning)return;photos=nemoAlbumOrder(allPhotos,owned,dates,order);page=0;render();}
 function openAlbum(list,collection,obtained={},onClose=null){albumExit=onClose;albumSession++;allPhotos=list;owned=collection;dates=obtained||{};photos=nemoAlbumOrder(list,owned,dates,'owned');$('album-sort').value='owned';$('album-owned-count').textContent=`수집 ${owned.length} / ${list.length}`;page=0;turning=false;$('draw-album').hidden=false;$('album-book').classList.remove('is-open');render();requestAnimationFrame(()=>requestAnimationFrame(()=>$('album-book').classList.add('is-open')));$('album-close').focus({preventScroll:true});}
 function closeAlbum(){if($('draw-album').hidden)return false;albumSession++;closePhoto(false);$('draw-album').hidden=true;$('album-book').classList.remove('is-open');$('album-flip').replaceChildren();turning=false;const exit=albumExit;albumExit=null;if(exit)exit();else $('draw-album-open').focus({preventScroll:true});return true;}
 // Each strip follows a continuous curved sheet, with its own front and back.
 async function turn(direction){
  if(turning||page+direction<0||page+direction>=Math.ceil(photos.length/2))return;
  turning=true;const session=albumSession,panels=$('album-pages'),flip=$('album-flip');
  const old=[...panels.children].map(el=>el.outerHTML),next=page+direction;
  page=next;render();
  if(reduced()){turning=false;render();return;}
  const newer=[...panels.children].map(el=>el.outerHTML),width=panels.getBoundingClientRect().width/2,height=panels.getBoundingClientRect().height;
  const forward=direction>0,front=old[forward?1:0],back=newer[forward?0:1],fixed=old[forward?0:1];
  const strips=width<250?12:20,step=width/strips;
  flip.dataset.direction=forward?'next':'prev';flip.classList.add('curved-turn');flip.style.setProperty('--leaf-height',height+'px');
  flip.innerHTML='<div class="leaf-stationary" style="left:'+(forward?'0':'50%')+'">'+fixed+'</div><div class="leaf-shadow"></div>';
  const pieces=[];
  for(let i=0;i<strips;i++){
   const slice=doc.createElement('div');slice.className='leaf-slice';slice.style.width=(step+.35)+'px';slice.style.height=height+'px';slice.style.transformOrigin=forward?'0 50%':'100% 50%';
   const frontIndex=forward?i:strips-1-i,backIndex=strips-1-frontIndex;
   slice.innerHTML='<div class="leaf-face leaf-front"><div class="leaf-content" style="width:'+width+'px;height:'+height+'px;left:'+(-frontIndex*step)+'px">'+front+'</div></div><div class="leaf-face leaf-back"><div class="leaf-content" style="width:'+width+'px;height:'+height+'px;left:'+(-backIndex*step)+'px">'+back+'</div></div>';
   for(const button of slice.querySelectorAll('button'))button.tabIndex=-1;
   flip.appendChild(slice);pieces.push(slice);
  }
  const shadow=flip.querySelector('.leaf-shadow');
  await new Promise(resolve=>{
   const begin=performance.now();
   function frame(now){
    if(session!==albumSession){resolve();return;}
    const t=Math.min(1,(now-begin)/900),ease=t*t*(3-2*t),theta=Math.PI*ease,bend=.58*Math.sin(Math.PI*ease);
    let x=0,z=0;
    for(let i=0;i<strips;i++){
     const angle=(forward?-1:1)*(theta+bend*(i/(strips-1)-.5)),deg=angle*180/Math.PI;
     pieces[i].style.transform='translate3d('+(width+x-(forward?0:step))+'px,0,'+z+'px) rotateY('+deg+'deg)';
     pieces[i].style.filter='brightness('+(1-.14*Math.sin(theta)*Math.abs(i/strips-.35))+')';
     const distance=(forward?1:-1)*step;x+=distance*Math.cos(angle);z-=distance*Math.sin(angle);
    }
    shadow.style.opacity=String(.38*Math.sin(theta));shadow.style.transform='translateX('+(forward?-ease*30:ease*30)+'%) scaleX('+(1+.4*Math.sin(theta))+')';
    if(t<1)requestAnimationFrame(frame);else resolve();
   }
   requestAnimationFrame(frame);
  });
  if(session!==albumSession)return;
  flip.classList.remove('curved-turn');flip.replaceChildren();turning=false;render();
 }

 function photo(id){if(turning)return;const item=photos.find(p=>p.id===id);if(!item||!owned.includes(id))return;$('photo-full').src=item.full||item.art;$('photo-full').alt=item.name;$('photo-title').textContent=item.name;$('photo-date').textContent=dateLabel(item.id);$('photo-rank').textContent=rank(item);$('photo-rank').className='photo-grade';$('photo-rank').dataset.rank=rank(item);$('photo-scroll').classList.remove('zoomed');$('photo-zoom').textContent='확대하기';$('photo-lightbox').hidden=false;$('photo-close').focus({preventScroll:true});}
 function closePhoto(focus=true){if($('photo-lightbox').hidden)return false;$('photo-lightbox').hidden=true;$('photo-full').removeAttribute('src');if(focus)$('album-close').focus({preventScroll:true});return true;}
 function zoom(){const active=$('photo-scroll').classList.toggle('zoomed');$('photo-zoom').textContent=active?'전체 보기':'확대하기';}
 // Keep nested dialogs keyboard accessible, independently of the game's screen trap.
 doc.addEventListener('keydown',event=>{const dialog=!$('photo-lightbox').hidden?$('photo-lightbox'):!$('draw-album').hidden?$('draw-album'):null;if(!dialog)return;if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();closeTop();}else if(event.key==='Tab'){const buttons=[...dialog.querySelectorAll('button:not(:disabled),select:not(:disabled)')];const first=buttons[0],last=buttons.at(-1);if(event.shiftKey&&doc.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&doc.activeElement===last){event.preventDefault();first.focus();}}},true);
 function closeTop(){return closePhoto()||closeAlbum();}
 return {reset,dispense,ready,reveal,canOpen:()=>stage.dataset.phase==='ready',openAlbum,closeAlbum,sort,turn,photo,closePhoto,zoom,closeTop};
}
