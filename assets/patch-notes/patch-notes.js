(() => {
  const trigger = document.getElementById('patch-notes-btn');
  if (!trigger) return;
  const style = document.createElement('style');
  style.textContent = `
    #patch-notes-dialog{width:min(680px,94vw);max-height:88dvh;padding:0;border:4px solid #805b96;border-radius:24px;background:#fff8ee;color:#684879;font:700 16px/1.6 'Apple SD Gothic Neo',system-ui,sans-serif;box-shadow:0 12px 60px #3f285860}
    #patch-notes-dialog::backdrop{background:#3f285890}
    #patch-notes-dialog header{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:16px 20px;border-bottom:1px solid #dcc1e7}
    #patch-notes-dialog h2{margin:0;font-size:24px}
    #patch-notes-content{overflow:auto;max-height:62dvh;padding:4px 20px 20px;overscroll-behavior:contain}
    #patch-notes-content article{padding:16px 0;border-bottom:1px solid #dcc1e7}
    #patch-notes-content h3{margin:0 0 8px;font-size:18px}
    #patch-notes-content p{margin:0;white-space:pre-line;overflow-wrap:anywhere}
    #patch-notes-dialog button{font:inherit;border:2px solid #805b96;border-radius:12px;background:#ffefdc;color:#684879;padding:6px 14px;cursor:pointer}
  `;
  document.head.append(style);
  const dialog = document.createElement('dialog');
  dialog.id = 'patch-notes-dialog';
  dialog.setAttribute('aria-labelledby', 'patch-notes-title');
  dialog.innerHTML = '<header><h2 id="patch-notes-title">패치노트</h2><button type="button" autofocus>닫기</button></header><div id="patch-notes-content" aria-live="polite"></div>';
  document.body.append(dialog);
  const content = dialog.querySelector('#patch-notes-content');
  dialog.querySelector('button').onclick = () => dialog.close();
  dialog.addEventListener('keydown', event => event.stopPropagation());
  dialog.addEventListener('keyup', event => event.stopPropagation());
  let loaded = false;
  trigger.onclick = async () => {
    dialog.showModal();
    if (loaded) return;
    content.textContent = '변경 내용을 불러오는 중이에요…';
    try {
      const response = await fetch('./assets/patch-notes/history.json?v=5.13.1');
      if (!response.ok) throw new Error('history');
      const history = await response.json();
      if (!Array.isArray(history) || !history.length) throw new Error('empty history');
      const articles = history.map((entry, index) => {
        const article = document.createElement('article');
        const title = document.createElement('h3');
        title.textContent = `v${entry.version}${index === 0 ? ' · 최신 업데이트' : ''}`;
        const text = document.createElement('p');
        text.textContent = entry.notes;
        article.append(title, text);
        return article;
      });
      content.replaceChildren(...articles);
      loaded = true;
    } catch {
      content.textContent = '패치노트를 불러오지 못했어요. 창을 닫고 다시 열어주세요.';
    }
  };
})();
