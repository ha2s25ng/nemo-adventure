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
 updateSchool,openCodex,rankOpen,rankRow,showNicknameSetup,openSaveTransfer,updateHUD,showToast,
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
 const app=document.getElementById('app'),screen=document.getElementById(mode==='playing'?'hud':mode);
 const cardMode=['cards','evolution'].includes(mode);
 const panel=cardMode?screen.querySelector(mode==='cards'?'.choice-board':'.card-wrap'):mode==='playing'?screen.querySelector('.hud-top'):screen.firstElementChild;
 const problems=[];const v={x:0,y:0,right:innerWidth,bottom:innerHeight};
 const inside=(a,b)=>a.x>=b.x-1&&a.y>=b.y-1&&a.right<=b.right+1&&a.bottom<=b.bottom+1;
 if(!visible(screen)||!visible(panel))problems.push('screen/panel invisible');
 for(const el of screen.querySelectorAll('[hidden]'))if(visible(el))problems.push('hidden element visible: '+el.id);
 const p=box(panel),a=box(app);
 if(!inside(p,v)||!inside(p,a))problems.push('panel outside viewport/app');
 if(panel.scrollWidth>panel.clientWidth+2)problems.push('panel horizontal overflow');
 const cards=[...screen.querySelectorAll(mode==='cards'?'.choice-card':mode==='evolution'?'.skill-card':'[data-no-match]')];
 const details=cards.map((c,i)=>{
   const r=box(c),cta=c.querySelector('.choice-cta,.card-select-label'),cr=box(cta);
   if(!inside(r,p)||!inside(r,v))problems.push('card '+i+' clipped');
   if(!inside(cr,r))problems.push('card '+i+' action outside card');
   // Rare cards intentionally clip an oversized decorative pseudo-element.
   if(c.dataset.kind!=='rare'&&(c.scrollWidth>c.clientWidth+2||c.scrollHeight>c.clientHeight+2))problems.push('card '+i+' content overflow');
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
 for(const [selector,parent] of [['.school-row strong','.school-row'],['.codex-heading h3','.codex-heading'],
   ['.pause-loadout li > span','li'],['.settings-line > span','.settings-line'],
   ['.result-stat b','.result-stat'],['.choice-heading h2','.choice-heading'],
   ['.folio-title','.menu-board'],['#hp','.hud-health'],['#time','#survival-timer'],
   ['.rank-name','.rank-identity'],['.rank-spell > span','.rank-spell'],
   ['.rank-time','.rank-record'],['.rank-stats','.rank-record']]){
   for(const el of screen.querySelectorAll(selector)){
     const bound=el.closest(parent);if(!visible(el)||!visible(bound))continue;
     const b=box(bound),range=document.createRange();range.selectNodeContents(el);
     for(const r of range.getClientRects())if(r.left<b.x-1||r.right>b.right+1)problems.push('text exceeds container: '+selector);
   }
 }
 if(mode==='playing'){
   const toast=document.getElementById('toast');
   if(visible(toast)){
     const tr=box(toast),range=document.createRange();range.selectNodeContents(toast);
     if(!inside(tr,v))problems.push('toast outside viewport');
     for(const r of range.getClientRects())if(!inside(r,tr))problems.push('toast text outside bubble');
   }
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

FRAMES = """n=>new Promise(done=>{
 const step=()=>--n<=0?done():requestAnimationFrame(step);
 requestAnimationFrame(step);
})"""

CHOICE_STATE = """()=>{const q=window.__QA,g=q.g;return {
 screen:q.screen,t:g.t,worldClock:g.worldClock,level:g.player.level,
 rerolls:g.rerolls,cards:g.cards.map(c=>[c.type,c.id]),
 currentEvo:g.currentEvo??null,vortexLevel:g.weapons.vortex?.lv};}"""


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
        print(f"QA_BROWSER {args.engine} {browser.version}",flush=True)
        for label, width, height, touch in cases:
            context = browser.new_context(viewport={"width": width, "height": height},
                is_mobile=touch, has_touch=touch, device_scale_factor=1, reduced_motion="reduce",
                user_agent=(pw.devices["iPhone 13"]["user_agent"] if args.engine == "webkit" and touch
                            else pw.devices["Pixel 5"]["user_agent"] if touch else None))
            context.route("**/*", lambda route: route.continue_() if route.request.url.startswith((url,
                "data:", "https://fonts.googleapis.com/", "https://fonts.gstatic.com/")) else route.abort())
            page = context.new_page()
            errors = []
            resource_errors = []
            page.on("pageerror", lambda error: errors.append(str(error)))
            page.on("response", lambda response: resource_errors.append(f"{response.status} {response.url}")
                if response.status >= 400 and response.url.startswith(url)
                and response.request.resource_type in ("script", "stylesheet", "image") else None)
            page.goto(url, wait_until="load")
            page.wait_for_function("!!window.__QA")
            page.locator("#nemo-name-input").fill("가나다라마바사아자차카타파하니모")
            page.locator(".nemo-name-continue").click()
            page.wait_for_function("window.__QA.screen==='menu'")
            page.evaluate("()=>{window.__QA.saved.stagesCleared=30;window.__QA.saved.gold=99999999;}")

            def inspect(name, mode, capture=False):
                page.evaluate("()=>document.fonts.ready")
                page.evaluate("()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))")
                data = page.evaluate(GEOMETRY, mode)
                data.update(case=label, name=name, engine=args.engine,
                    jua_loaded=page.evaluate("document.fonts.check('16px Jua','니모')"))
                results.append(data)
                if data["problems"] or capture or (label in ("desktop", "phone-iphone", "landscape") and not name.startswith("evo-")):
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
                ("settings-import", "q.menu();document.getElementById('settings-btn').click();q.openSaveTransfer('import')"),
                ("settings-export", "q.menu();document.getElementById('settings-btn').click();q.openSaveTransfer('export')"),
                ("leaderboard", "q.menu();q.rankOpen()"),
                ("leaderboard-populated", "q.menu();q.rankOpen();document.getElementById('rank-online').innerHTML=['가나다라마바사아자차카타파하니모','ABCDEFGHIJKLMNOP','숲속의니모'].map((nickname,i)=>q.rankRow({nickname,player_id:'qa-'+i,survival_seconds:5999-i,kills:99999,level:99,loadout:{costume:q.COSTUMES[0].id,weapons:['vortex','book','comet','feather'].map(id=>({id,level:7}))}},i)).join('')"),
                # Long-run HUD fixture: its earlier timed rewards have already been claimed.
                ("playing", "q.begin();q.g.debugUsed=true;q.g.totalKills=99999;q.g.t=9999;q.g.gold=99999;q.g.milestones={first:true,second:true,mastery:true};q.g.rushFired={sporeRush:true,finalRush:true};q.g.lateWave=Math.floor((q.g.t-480)/90);q.g.bossRestUntil=10030;q.g.nextForestEvent=10030;q.g.player.invuln=60;for(const id of Object.keys(q.W).slice(0,4))q.g.weapons[id]={lv:7,up:[2,2,1],break:true,evo:1,clock:0};for(const id of Object.keys(q.DATA.passives).slice(0,4))q.g.passives[id]=3;q.updateHUD();q.showToast('스테이지 30 · 솜사탕 소용돌이 최종 진화! 경험치 획득량이 증가하고 주변의 모든 적에게 강력한 마법 피해를 줘요.',30)"),
                ("pause", "q.begin();q.g.debugUsed=true;for(const id of Object.keys(q.W).slice(0,4))q.g.weapons[id]={lv:7,up:[2,2,1],break:true,evo:1,clock:0};for(const id of Object.keys(q.DATA.passives).slice(0,4))q.g.passives[id]=3;q.updateHUD();q.pause()"),
                ("result", "q.begin();q.g.debugUsed=true;q.g.t=9999;q.g.totalKills=99999;q.finish(false)"),
            ]:
                try:
                    page.evaluate("()=>{const q=window.__QA;" + js + ";}")
                    mode = "settings" if name.startswith("settings-") else "leaderboard" if name.startswith("leaderboard-") else name
                    inspect(name, mode, name == "codex" and height < 300)
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
                ok=page.evaluate("i=>window.__QA.screen==='playing'&&window.__QA.g.weapons.vortex.lv===7&&window.__QA.g.weapons.vortex.evo===i", i)
                results.append(dict(engine=args.engine,case=label,name=f"evo-tap-{i}",problems=[] if ok else ["evolution tap did not select"]))
                page.evaluate("window.__QA.pause()")

            def check_action(name, action):
                problems = []
                try:
                    action()
                except Exception as error:
                    problems.append(str(error) or type(error).__name__)
                    page.screenshot(path=str(OUT / f"{args.engine}-{label}-{name}.png"))
                results.append(dict(engine=args.engine,case=label,name=name,problems=problems))

            def pause_controls():
                page.evaluate("()=>{window.__QA.begin();window.__QA.g.player.invuln=60;}")
                getattr(page.locator("#pause-btn"), "tap" if touch else "click")()
                page.wait_for_function("window.__QA.screen==='pause'")
                state="()=>{const g=window.__QA.g,p=g.player;return {t:g.t,clock:g.worldClock,x:p.x,y:p.y,hp:p.hp};}"
                before=page.evaluate(state)
                page.evaluate(FRAMES, 12)
                assert page.evaluate(state)==before, "game advanced while paused"
                getattr(page.locator("#resume"), "tap" if touch else "click")()
                page.wait_for_function("t=>window.__QA.screen==='playing'&&window.__QA.g.t>t",arg=before["t"],timeout=3000)
                if not touch:
                    page.keyboard.press("Escape")
                    assert page.evaluate("window.__QA.screen")=="pause"
                    page.keyboard.press("Escape")
                    assert page.evaluate("window.__QA.screen")=="playing"
                page.evaluate("window.__QA.pause()")
            check_action("pause-resume-controls", pause_controls)

            if label == "desktop":
                def keyboard_movement():
                    page.evaluate("()=>{window.__QA.begin();window.__QA.g.player.invuln=60;document.activeElement?.blur();}")
                    for key,axis,direction in [("d","x",1),("ArrowUp","y",-1)]:
                        before=page.evaluate("window.__QA.g.player."+axis)
                        page.keyboard.down(key)
                        try:
                            page.wait_for_function("a=>(window.__QA.g.player[a.axis]-a.before)*a.direction>.2",
                                arg=dict(axis=axis,before=before,direction=direction),timeout=3000)
                        finally:
                            page.keyboard.up(key)
                        page.wait_for_function("()=>{const p=window.__QA.g.player;return p.moveX===0&&p.moveY===0;}",timeout=3000)
                        state="({x:window.__QA.g.player.x,y:window.__QA.g.player.y})"
                        stopped=page.evaluate(state)
                        page.evaluate(FRAMES,12)
                        assert page.evaluate(state)==stopped, "movement continued after releasing key"
                    page.evaluate("window.__QA.pause()")
                check_action("keyboard-movement-release", keyboard_movement)
                def compact_desktop_codex():
                    try:
                        page.set_viewport_size(dict(width=844,height=390))
                        page.evaluate("()=>{window.__QA.menu();window.__QA.openCodex();}")
                        inspect("codex-compact-desktop","codex",True)
                    finally:
                        page.set_viewport_size(dict(width=width,height=height))
                check_action("codex-compact-desktop-open",compact_desktop_codex)

            if args.engine == "chromium" and label == "phone-android":
                def touch_movement():
                    page.evaluate("()=>{window.__QA.begin();window.__QA.g.player.invuln=60;}")
                    box=page.locator("#canvas").bounding_box()
                    x,y=box["x"]+box["width"]*.4,box["y"]+box["height"]*.6
                    assert page.evaluate("p=>document.elementFromPoint(p.x,p.y)?.id==='canvas'",dict(x=x,y=y)), "canvas touch blocked"
                    before=page.evaluate("window.__QA.g.player.x")
                    cdp=context.new_cdp_session(page)
                    try:
                        cdp.send("Input.dispatchTouchEvent",dict(type="touchStart",touchPoints=[dict(id=7,x=x,y=y)]))
                        cdp.send("Input.dispatchTouchEvent",dict(type="touchMove",touchPoints=[dict(id=7,x=x+48,y=y)]))
                        page.wait_for_function("before=>document.getElementById('touch-pad').dataset.active==='true'&&window.__QA.g.player.x>before+.2",arg=before,timeout=3000)
                    finally:
                        cdp.send("Input.dispatchTouchEvent",dict(type="touchEnd",touchPoints=[]))
                        cdp.detach()
                    page.wait_for_function("()=>{const p=window.__QA.g.player;return document.getElementById('touch-pad').dataset.active!=='true'&&p.moveX===0&&p.moveY===0;}",timeout=3000)
                    page.evaluate("window.__QA.pause()")
                check_action("native-touch-drag-release", touch_movement)

            if label == "phone-iphone":
                for mode,setup,value,selector in [("cards",SET_CARDS,"ordinary",".choice-card .choice-cta"),
                    ("evolution",SET_EVO,"vortex","#evo-options .card-select-label")]:
                    def rotate_choice():
                        try:
                            page.set_viewport_size(dict(width=390,height=844))
                            page.evaluate(setup,value)
                            before=page.evaluate(CHOICE_STATE)
                            page.set_viewport_size(dict(width=844,height=390))
                            inspect(mode+"-rotated",mode,True)
                            assert page.evaluate(CHOICE_STATE)==before, "choice changed on rotation"
                            page.set_viewport_size(dict(width=390,height=844))
                            inspect(mode+"-rotated-back",mode,True)
                            assert page.evaluate(CHOICE_STATE)==before, "choice changed on reverse rotation"
                            box=page.locator(selector).nth(1).bounding_box()
                            page.touchscreen.tap(box["x"]+box["width"]/2,box["y"]+box["height"]/2)
                            assert page.evaluate("window.__QA.screen")=="playing", "rotated choice could not be selected"
                            if mode=="evolution":
                                assert page.evaluate("window.__QA.g.weapons.vortex.evo")==1
                        finally:
                            page.set_viewport_size(dict(width=width,height=height))
                    check_action(mode+"-rotation-state-and-tap",rotate_choice)
            if errors:
                results.append(dict(engine=args.engine,case=label,name="runtime-errors",problems=list(set(errors))))
            if resource_errors:
                results.append(dict(engine=args.engine,case=label,name="resource-errors",problems=list(set(resource_errors))))
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
