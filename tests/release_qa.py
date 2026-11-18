"""Exercise real game screens in isolated browsers; never contact live rankings.

The development-only server adds test hooks to its HTML response. The checked-in
game and deployed HTML never contain those hooks.
"""
import argparse
import functools
import json
import os
from pathlib import Path
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "qa-results"
HOOK = """
window.__QA={begin,menu,pause,resume,setScreen,renderCards,renderEvo,chooseEvo,
 selectCard,rollCards,makeGrowth,openForestChoice,finish,stageOpen,shopOpen,
 updateSchool,openCodex,rankOpen,showNicknameSetup,openSaveTransfer,updateHUD,
 get g(){return g},get saved(){return saved},get screen(){return screen},
 DATA,W,RARE_CARDS,COSTUMES,NEMO_STAGES};
"""


class TestServer(SimpleHTTPRequestHandler):
    def log_message(self, *_):
        pass

    def do_GET(self):
        path = self.path.split("?", 1)[0]
        if path in ("/", "/index.html"):
            data = (ROOT / "index.html").read_text()
            marker = "window.__NEMO_SAFE_UPDATE__=()=>screen==='menu';"
            assert data.count(marker) == 1, "Test hook insertion point changed"
            data = data.replace(marker, HOOK + marker).encode()
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.end_headers()
            self.wfile.write(data)
        elif path == "/ranking-config.json":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(b'{}')
        else:
            super().do_GET()


GEOMETRY = """(mode)=>{
 const box=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,right:r.right,bottom:r.bottom}};
 const visible=e=>!!(e&&e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden');
 const app=document.getElementById('app'),screen=document.getElementById(mode);
 const cardMode=['cards','evolution'].includes(mode);
 const panel=cardMode?screen.querySelector(mode==='cards'?'.choice-board':'.card-wrap'):screen.firstElementChild;
 const problems=[];const v={x:0,y:0,right:innerWidth,bottom:innerHeight};
 const inside=(a,b)=>a.x>=b.x-1&&a.y>=b.y-1&&a.right<=b.right+1&&a.bottom<=b.bottom+1;
 if(!visible(screen)||!visible(panel))problems.push('screen/panel invisible');
 const p=box(panel),a=box(app);
 if(!inside(p,v)||!inside(p,a))problems.push('panel outside viewport/app');
 if(panel.scrollWidth>panel.clientWidth+2)problems.push('panel horizontal overflow');
 const cards=[...screen.querySelectorAll(mode==='cards'?'.choice-card':mode==='evolution'?'.skill-card':'[data-no-match]')];
 const details=cards.map((c,i)=>{
   const r=box(c),cta=c.querySelector('.choice-cta,.card-select-label'),cr=box(cta);
   if(!inside(r,p)||!inside(r,v))problems.push('card '+i+' clipped');
   if(!inside(cr,r))problems.push('card '+i+' action outside card');
   if(c.scrollWidth>c.clientWidth+2||c.scrollHeight>c.clientHeight+2)problems.push('card '+i+' content overflow');
   for(const el of c.querySelectorAll('.choice-name,.choice-effect,.evo-variant-name,.evo-effect-copy,.choice-copy,.choice-meta')){
     if(!visible(el))continue;
     const range=document.createRange();range.selectNodeContents(el);
     for(const tr of range.getClientRects()){
       if(!inside(tr,r))problems.push('card '+i+' text outside: '+el.className);
     }
   }
   return {text:c.innerText,box:r,action:cr};
 });
 if(cardMode&&panel.scrollHeight>panel.clientHeight+2)problems.push('card panel needs scrolling');
 if(mode==='cards'){
   const list=document.getElementById('card-options');
   if(list.scrollHeight>list.clientHeight+2)problems.push('card list needs scrolling');
   const reroll=document.getElementById('reroll');
   if(reroll.hidden&&visible(reroll))problems.push('hidden reroll is visible');
 }
 if(mode==='evolution'&&matchMedia('(any-pointer:coarse)').matches&&visible(panel.querySelector('.folio')))problems.push('mobile folio still visible');
 if(mode==='codex'){
   const detail=document.getElementById('codex-details');
   if(detail.clientHeight<72)problems.push('codex reading area too short: '+detail.clientHeight);
 }
 for(const el of screen.querySelectorAll('button,input,select,textarea')){
   if(!visible(el))continue;
   const r=box(el);
   if(r.x<p.x-2||r.right>p.right+2)problems.push('control extends horizontally: '+(el.id||el.innerText.slice(0,30)));
 }
 return {mode,viewport:[innerWidth,innerHeight],coarse:matchMedia('(any-pointer:coarse)').matches,
  panel:p,scroll:[panel.scrollHeight,panel.clientHeight],problems:[...new Set(problems)],cards:details};
}"""

SET_CARDS = """kind=>{
 const q=window.__QA;q.begin();q.g.debugUsed=true;
 q.g.weapons.vortex={lv:6,up:[2,1,1],break:true,evo:null,clock:0};
 if(kind==='blessing'){q.openForestChoice(1);return;}
 if(kind==='rare'){
  const [id,r]=Object.entries(q.RARE_CARDS).find(([,x])=>x.weapon==='book')||Object.entries(q.RARE_CARDS)[0];
  q.g.cards=[{type:'rare',id,...r,ico:q.W[r.weapon].icon,meta:'모험당 희귀 카드 1장'},
    {type:'new',id:'feather',name:q.W.feather.name,ico:q.W.feather.icon,desc:'연쇄 투사체',meta:'무기 슬롯 사용 · Lv.1'},
    q.makeGrowth('vortex')];
 }else{
  q.g.cards=[{type:'new',id:'vortex',name:q.W.vortex.name,ico:q.W.vortex.icon,desc:'광역 둔화',meta:'무기 슬롯 사용 · Lv.1'},
   {type:'new',id:'feather',name:q.W.feather.name,ico:q.W.feather.icon,desc:'연쇄 투사체',meta:'무기 슬롯 사용 · Lv.1'},
   {type:'heal',id:'heal',name:'달콤한 간식',ico:'🍰',desc:'최대 체력 20% 회복',meta:'대체 카드'}];
 }
 q.renderCards();q.setScreen('cards');
}"""

SET_EVO = """id=>{const q=window.__QA;q.begin();q.g.debugUsed=true;
 q.g.weapons[id]={lv:6,up:[2,1,1],break:true,evo:null,clock:0};
 q.g.currentEvo=id;q.renderEvo(id);q.setScreen('evolution');}"""


def run():
    parser = argparse.ArgumentParser()
    parser.add_argument("--engine", choices=["chromium", "webkit"], default="chromium")
    args = parser.parse_args()
    OUT.mkdir(exist_ok=True)
    server = ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(TestServer, directory=str(ROOT)))
    threading.Thread(target=server.serve_forever, daemon=True).start()
    url = f"http://127.0.0.1:{server.server_port}/"
    results = []
    cases = [
        ("desktop", 1280, 720, False), ("desktop-wide", 1920, 1080, False),
        ("phone-small", 320, 568, True), ("phone-android", 360, 640, True),
        ("phone-iphone", 390, 844, True), ("tablet", 768, 1024, True),
        ("landscape", 844, 390, True), ("landscape-short", 640, 240, True),
        ("landscape-tiny", 568, 220, True),
    ]
    if args.engine == "webkit":
        cases = [cases[i] for i in (0, 2, 4, 6, 7, 8)]
    with sync_playwright() as pw:
        browser = getattr(pw, args.engine).launch()
        for label, width, height, touch in cases:
            context = browser.new_context(viewport={"width": width, "height": height},
                is_mobile=touch, has_touch=touch, device_scale_factor=1,
                user_agent=(pw.devices["iPhone 13"]["user_agent"] if args.engine == "webkit" and touch
                            else pw.devices["Pixel 5"]["user_agent"] if touch else None))
            context.route("**/*", lambda route: route.continue_() if route.request.url.startswith(url)
                or route.request.url.startswith("data:") else route.abort())
            page = context.new_page()
            errors = []
            page.on("pageerror", lambda error: errors.append(str(error)))
            page.goto(url, wait_until="load")
            page.wait_for_function("!!window.__QA")
            page.locator("#nemo-name-input").fill("가나다라마바사아자차카타파하니모")
            page.locator(".nemo-name-continue").click()
            page.wait_for_function("window.__QA.screen==='menu'")
            page.evaluate("()=>{window.__QA.saved.stagesCleared=30;window.__QA.saved.gold=999999999;}")

            def inspect(name, mode, capture=False):
                page.evaluate("()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))")
                data = page.evaluate(GEOMETRY, mode)
                data.update(case=label, name=name, engine=args.engine)
                results.append(data)
                if data["problems"] or capture:
                    path = OUT / f"{args.engine}-{label}-{name}.png"
                    page.screenshot(path=str(path), animations="disabled")
                    data["screenshot"] = path.name
                print(json.dumps({k: data[k] for k in ("engine", "case", "name", "problems", "scroll")}, ensure_ascii=False), flush=True)

            for name, js in [
                ("menu", "q.menu()"), ("stages", "q.menu();q.stageOpen()"),
                ("costume-shop", "q.menu();q.shopOpen()"),
                ("school", "q.menu();q.updateSchool();q.setScreen('school')"),
                ("codex", "q.menu();q.openCodex()"),
                ("settings", "q.menu();document.getElementById('settings-btn').click()"),
                ("leaderboard", "q.menu();q.rankOpen()"),
                ("pause", "q.begin();q.g.debugUsed=true;for(const id of Object.keys(q.W).slice(0,4))q.g.weapons[id]={lv:7,up:[2,2,1],break:true,evo:1,clock:0};for(const id of Object.keys(q.DATA.passives).slice(0,4))q.g.passives[id]=3;q.updateHUD();q.pause()"),
                ("result", "q.begin();q.g.debugUsed=true;q.g.t=9999;q.g.totalKills=99999;q.finish(false)"),
            ]:
                try:
                    page.evaluate("()=>{const q=window.__QA;" + js + ";}")
                    inspect(name, name, name == "codex" and height < 300)
                except Exception as error:
                    results.append(dict(engine=args.engine,case=label,name=name,problems=[str(error)]))

            for kind in ("ordinary", "rare", "blessing"):
                page.evaluate(SET_CARDS, kind)
                inspect("cards-" + kind, "cards", kind == "ordinary")
            for i in range(3):
                page.evaluate(SET_CARDS, "ordinary")
                box = page.locator(".choice-card .choice-cta").nth(i).bounding_box()
                x, y = box["x"] + box["width"] / 2, box["y"] + box["height"] / 2
                (page.touchscreen.tap if touch else page.mouse.click)(x,y)
                ok = page.evaluate("window.__QA.screen==='playing'")
                results.append(dict(engine=args.engine,case=label,name=f"card-tap-{i}",problems=[] if ok else ["card tap did not select"]))
                page.evaluate("window.__QA.pause()")
            for weapon in page.evaluate("Object.keys(window.__QA.W)"):
                page.evaluate(SET_EVO, weapon)
                inspect("evo-" + weapon, "evolution", weapon == "vortex")
            for i in range(2):
                page.evaluate(SET_EVO, "vortex")
                box = page.locator("#evo-options .card-select-label").nth(i).bounding_box()
                x,y=box["x"]+box["width"]/2,box["y"]+box["height"]/2
                (page.touchscreen.tap if touch else page.mouse.click)(x,y)
                ok=page.evaluate("window.__QA.screen==='playing'&&window.__QA.g.weapons.vortex.lv===7")
                results.append(dict(engine=args.engine,case=label,name=f"evo-tap-{i}",problems=[] if ok else ["evolution tap did not select"]))
                page.evaluate("window.__QA.pause()")
            if errors:
                results.append(dict(engine=args.engine,case=label,name="runtime-errors",problems=list(set(errors))))
            context.close()
        browser.close()
    server.shutdown()
    output=OUT / f"{args.engine}.json"
    output.write_text(json.dumps(results, ensure_ascii=False, indent=2))
    failed=[r for r in results if r["problems"]]
    print(f"QA_SUMMARY {args.engine} {len(results)} checks; {len(failed)} failures",flush=True)
    if failed and os.environ.get("NEMO_QA_STRICT", "1") == "1":
        raise SystemExit(1)


if __name__ == "__main__":
    run()
