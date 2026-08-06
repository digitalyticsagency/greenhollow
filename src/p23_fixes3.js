/* =====================================================================
   Weather you can see, lightning, save controls, a path brush,
   visible AI work, and the jitter fix.
   ===================================================================== */

/* ---------------------------------------------------------------
   1. WEATHER — the .wx-* rules that switch the layer on never made it
      into the stylesheet, so rain has been invisible all along.
      Rebuilt here as one self-contained sheet.
   --------------------------------------------------------------- */
(function weatherCss(){
  const old = document.getElementById('wxcss'); if(old) old.remove();
  const st = document.createElement('style'); st.id='wxcss';
  st.textContent = `
#wxfx{position:absolute;inset:0;pointer-events:none;z-index:21;opacity:0;transition:opacity 1.2s ease;}
#wxfx.on{opacity:1;}

@keyframes wxRainFall{from{background-position:0 0,0 0;}to{background-position:-120px 780px,-60px 900px;}}
#wxfx.rain{
  background-image:
    repeating-linear-gradient(101deg, rgba(210,232,246,0) 0 6px, rgba(210,232,246,.40) 6px 7px, rgba(210,232,246,0) 7px 14px),
    repeating-linear-gradient(99deg, rgba(190,220,240,0) 0 11px, rgba(190,220,240,.22) 11px 12px, rgba(190,220,240,0) 12px 26px);
  animation:wxRainFall 1s linear infinite;}
#wxfx.storm{
  background-image:
    repeating-linear-gradient(104deg, rgba(214,236,250,0) 0 4px, rgba(214,236,250,.55) 4px 6px, rgba(214,236,250,0) 6px 11px),
    repeating-linear-gradient(101deg, rgba(190,220,240,0) 0 8px, rgba(190,220,240,.34) 8px 10px, rgba(190,220,240,0) 10px 19px);
  animation:wxRainFall .48s linear infinite;}

@keyframes wxSnowFall{from{background-position:0 0,0 0;}to{background-position:70px 620px,-40px 760px;}}
#wxfx.frost{
  background-image:
    radial-gradient(circle at 25% 25%, #fff 0 1.7px, transparent 2.2px),
    radial-gradient(circle at 70% 60%, #fff 0 1.3px, transparent 1.8px);
  background-size:110px 110px, 150px 150px; animation:wxSnowFall 8s linear infinite;}

@keyframes wxDust{0%,100%{background-position:0 0;opacity:.5}50%{background-position:180px 0;opacity:1}}
#wxfx.dust{
  background-image:linear-gradient(92deg, rgba(214,196,150,0) 0%, rgba(214,196,150,.55) 50%, rgba(214,196,150,0) 100%);
  background-size:55% 100%; animation:wxDust 15s ease-in-out infinite;}

/* the flash sits above everything in the world */
#wxflash{position:absolute;inset:0;pointer-events:none;z-index:23;background:#dfeaff;opacity:0;}
@keyframes wxStrike{
  0%{opacity:0}4%{opacity:.85}9%{opacity:.10}14%{opacity:.70}22%{opacity:0}
  30%{opacity:.35}36%{opacity:0}100%{opacity:0}}
#wxflash.strike{animation:wxStrike 1.1s ease-out;}
#wxbolt{position:absolute;inset:0;pointer-events:none;z-index:24;opacity:0;}
#wxbolt.strike{animation:wxStrike 1.1s ease-out;}
@media(prefers-reduced-motion:reduce){#wxfx,#wxflash,#wxbolt{animation:none!important}}
`;
  document.head.appendChild(st);
})();

syncWeatherFx = function(){
  const world = document.getElementById('world');
  if(!world) return;
  let fx = document.getElementById('wxfx');
  if(!fx){ fx = document.createElement('div'); fx.id='wxfx'; world.appendChild(fx); }
  const w = S.weather;
  const on = (!S.settings || S.settings.particles !== false);
  const land = LANDMAP[S.landId] || {};
  let kind = '';
  if(on){
    if(w==='storm') kind='storm';
    else if(w==='rain') kind='rain';
    else if(w==='frost') kind='frost';
    else if(land.dust && (w==='sun'||w==='heat')) kind='dust';
  }
  const want = kind ? kind+' on' : '';
  if(fx.className !== want) fx.className = want;
};

/* ---------------------------------------------------------------
   2. LIGHTNING — a real strike you can see and hear, and a rod that
      protects the stock. Without one, a storm can kill an animal.
   --------------------------------------------------------------- */
BP.push({id:'lightning_rod', name:'Lightning rod', art:'lightning_rod', cat:'land',
  w:1, h:2, cost:150, lvl:2, kind:'bonus', charm:2, protects:1,
  desc:'An earthed mast. Takes the strike so your stock does not.',
  tip:'Without one, a storm has a real chance of killing an animal. One rod covers the whole farm.'});
BPMAP.lightning_rod = BP[BP.length-1];

ART.lightning_rod = (w,h)=>{
  let s = `<ellipse cx="${n(w/2+2)}" cy="${n(h-3)}" rx="${n(w*0.42)}" ry="3" fill="#16240c" opacity=".3"/>`;
  s += `<rect x="${n(w/2-1.6)}" y="${n(h*0.14)}" width="3.2" height="${n(h*0.82)}" rx="1.6" fill="#9aa5ab"/>`;
  s += `<rect x="${n(w/2-1.6)}" y="${n(h*0.14)}" width="1.3" height="${n(h*0.82)}" fill="#cdd5d9"/>`;
  s += `<path d="M${n(w/2)} ${n(h*0.02)} l ${n(w*0.1)} ${n(h*0.1)} l ${n(-w*0.1)} ${n(h*0.03)} z" fill="#e8eef0"/>`;
  s += `<circle class="twinkle" cx="${n(w/2)}" cy="${n(h*0.05)}" r="1.8" fill="#bfe3ff"/>`;
  s += `<rect x="${n(w/2-4)}" y="${n(h*0.94)}" width="8" height="2.4" rx="1.2" fill="#6d5b44"/>`;
  return s;
};
function hasRod(){ return S.objs.some(o=>o.bp==='lightning_rod'); }

function lightningStrike(){
  const world = document.getElementById('world');
  if(!world) return;
  let flash = document.getElementById('wxflash');
  if(!flash){ flash = document.createElement('div'); flash.id='wxflash'; world.appendChild(flash); }
  let bolt = document.getElementById('wxbolt');
  if(!bolt){ bolt = document.createElement('div'); bolt.id='wxbolt'; world.appendChild(bolt); }
  /* draw a jagged bolt somewhere across the sky */
  const W = world.clientWidth, H = world.clientHeight;
  let x = 60 + Math.random()*(W-120), y = 0, d = `M${x} 0`;
  while(y < H*0.62){ y += 18 + Math.random()*26; x += (Math.random()-0.5)*54; d += ` L${x.toFixed(0)} ${y.toFixed(0)}`; }
  bolt.innerHTML = `<svg width="100%" height="100%" style="display:block">
    <path d="${d}" stroke="#eaf3ff" stroke-width="3" fill="none" stroke-linejoin="round"
      style="filter:drop-shadow(0 0 8px #9fd0ff)"/>
    <path d="${d}" stroke="#fff" stroke-width="1.2" fill="none" stroke-linejoin="round"/></svg>`;
  flash.classList.remove('strike'); bolt.classList.remove('strike');
  void flash.offsetWidth;
  flash.classList.add('strike'); bolt.classList.add('strike');
  if(typeof SND!=='undefined') SND.play('thunder');
  setTimeout(()=>{ bolt.innerHTML=''; }, 1200);
}

function stormLightning(){
  if(S.weather !== 'storm') return;
  if(S.settings && S.settings.particles === false) return;
  lightningStrike();
  /* an unprotected farm can lose an animal — 40% of strikes that find stock */
  if(hasRod()){
    if(Math.random() < 0.3) log('Lightning struck the rod. Everything is fine.','good');
    return;
  }
  const pens = S.objs.filter(o=>BPMAP[o.bp].kind==='animal' && o.animals>0 && BPMAP[o.bp].animal!=='hive');
  if(!pens.length) return;
  if(Math.random() < 0.40){
    const pen = pens[Math.floor(Math.random()*pens.length)];
    pen.animals--; syncHerd(pen);
    S.morale = clamp((S.morale||0.6)-0.06, 0, 1);
    log(`Lightning struck the ${BPMAP[pen.bp].name} — one ${BPMAP[pen.bp].animal} killed. A lightning rod would have stopped it.`,'bad');
    toast(`A ${BPMAP[pen.bp].animal} was killed by lightning`,'bad');
    render(); ui();
  } else {
    log('Lightning came down close to the stock. No losses this time.','bad');
  }
}

/* strikes happen through a storm, not just at day rollover */
(function lightningTimer(){
  let next = 0;
  setInterval(()=>{
    if(!S || S.speed===0) return;
    if(S.weather !== 'storm'){ next = 0; return; }
    next -= 1;
    if(next <= 0){ stormLightning(); next = 6 + Math.floor(Math.random()*14); }
  }, 1000);
})();

/* ---------------------------------------------------------------
   3. THE JITTER — parallax ran on every camera move, writing SVG
      transforms mid-pan. It now rides the animation frame instead.
   --------------------------------------------------------------- */
(function steadyCamera(){
  let pending = false, lastPx = 0, lastPy = 0;
  const realParallax = (typeof parallax==='function') ? parallax : null;
  parallax = function(){
    if(!realParallax || pending) return;
    pending = true;
    requestAnimationFrame(()=>{
      pending = false;
      /* only move the backdrop when the camera has actually moved a bit */
      if(Math.abs(cam.x-lastPx) < 2 && Math.abs(cam.y-lastPy) < 2) return;
      lastPx = cam.x; lastPy = cam.y;
      realParallax();
    });
  };
  /* snap camera values so sub-pixel transforms stop shimmering */
  const _applyCam = applyCam;
  applyCam = function(){
    cam.x = Math.round(cam.x*2)/2;
    cam.y = Math.round(cam.y*2)/2;
    _applyCam();
  };
})();

/* ---------------------------------------------------------------
   4. THE PANELS SWALLOWING THE SCREEN — at narrow widths they are
      absolute overlays. They now only ever open from the tab bar,
      never on hover, and never cover the whole world.
   --------------------------------------------------------------- */
(function panelGuard(){
  const st = document.createElement('style');
  st.textContent = `
  @media(max-width:980px){
    #left,#right{max-height:46vh;box-shadow:0 -14px 40px rgba(0,0,0,.55);}
    #left:not(.open),#right:not(.open){display:none!important;pointer-events:none;}
    #world{pointer-events:auto;}
  }
  /* nothing in the chrome may expand on hover over the land */
  #left,#right{transition:none!important;}
  `;
  document.head.appendChild(st);
})();

/* ---------------------------------------------------------------
   5. SAVE CONTROLS IN THE TOP BAR, and a clear warning when the
      browser will not keep a save (which is what makes a refresh
      start over).
   --------------------------------------------------------------- */
function storageWorks(){
  try{ localStorage.setItem('__gh','1'); localStorage.removeItem('__gh'); return true; }
  catch(e){ return false; }
}
(function saveControls(){
  const tools = document.querySelector('#top .tools');
  if(!tools || document.getElementById('saveMenu')) return;
  const wrap = document.createElement('span');
  wrap.id='saveMenu'; wrap.style.cssText='display:inline-flex;gap:5px;align-items:center';
  wrap.innerHTML = `
    <button class="tbtn" onclick="G.save(1)" data-tip="<b>Save now</b>Writes the farm to this browser.">Save</button>
    <button class="tbtn" onclick="G.exportSave()" data-tip="<b>Download a save file</b>Keeps a copy you can reload later or on another machine.">⤓</button>
    <button class="tbtn" onclick="G.importSave()" data-tip="<b>Load a save file</b>Replaces the current farm with one from a file.">⤒</button>
    <button class="tbtn danger" onclick="G.deleteSave()" data-tip="<b>Delete the save</b>Wipes the stored farm. You keep playing until you refresh.">Delete</button>
    <button class="tbtn" onclick="G.newGame()" data-tip="<b>New farm</b>Pick fresh land and start again.">New</button>`;
  tools.appendChild(wrap);

  G.deleteSave = function(){
    ask('Delete the saved farm?',
        'The stored save is removed. What is on screen keeps playing until you refresh.',
        'Delete it', ()=>{
          try{ localStorage.removeItem('greenhollow'); }catch(e){}
          toast('Saved farm deleted','');
          log('Saved farm deleted.','bad');
        }, true);
  };

  /* if the browser will not persist anything, say so once, clearly */
  if(!storageWorks()){
    setTimeout(()=>{
      modal(`<h2>This browser will not keep your farm</h2>
        <p class="sub">Storage is blocked here, which is why a refresh starts a new farm.
        It usually means private browsing, blocked site data, or an embedded frame.</p>
        <h4>What still works</h4>
        <ul>
          <li>Everything in the game plays normally for this session.</li>
          <li><b>⤓ Download</b> in the top bar saves a file you can keep.</li>
          <li><b>⤒ Load</b> brings that file back any time.</li>
        </ul>
        <h4>For saving that just works</h4>
        <p>Open the downloaded <b>greenhollow-homestead.html</b> file directly in your browser
        rather than through an embedded frame.</p>
        <div class="mfoot"><button class="mbtn" onclick="G.closeModal()">Understood</button></div>`);
    }, 900);
  }
})();

/* ---------------------------------------------------------------
   6. A PATH BRUSH — hold and drag to lay gravel in any shape
   --------------------------------------------------------------- */
const BRUSH = {on:false, painting:false, laid:0, last:null};
G.pathBrush = function(){
  BRUSH.on = !BRUSH.on;
  if(BRUSH.on) G.cancel();
  document.body.classList.toggle('brushing', BRUSH.on);
  const b = document.getElementById('brushBtn');
  if(b) b.classList.toggle('on', BRUSH.on);
  toast(BRUSH.on ? 'Path brush on — drag to lay gravel' : 'Path brush off', BRUSH.on?'good':'');
  sfx('click');
  ui();
};
let brushRenderQueued = false;
function queueBrushRender(){
  if(brushRenderQueued) return;
  brushRenderQueued = true;
  requestAnimationFrame(()=>{ brushRenderQueued = false; render(); });
}
function layTile(tx, ty){
  const bp = BPMAP.path1;
  if(!bp) return false;
  if(tx<FARM.x || ty<FARM.y || tx>=FARM.x+FARM.w || ty>=FARM.y+FARM.h) return false;
  if(overlaps(tx, ty, {w:1,h:1}, 0)) return false;
  if(S.cash < bp.cost){
    if(BRUSH.painting){ BRUSH.painting = false; toast('Out of cash for gravel','bad'); sfx('error'); }
    return false;
  }
  place('path1', tx, ty, 0);
  BRUSH.laid++;
  return true;
}
/* Walk every tile between the last point and this one, so a fast drag
   leaves an unbroken path instead of dots. */
function paintPathAt(clientX, clientY){
  const t = screenToTile(clientX, clientY);
  const from = BRUSH.last;
  let painted = false;
  if(from && (from.tx !== t.tx || from.ty !== t.ty)){
    const dx = t.tx-from.tx, dy = t.ty-from.ty;
    const steps = Math.max(Math.abs(dx), Math.abs(dy));
    for(let i=1; i<=steps; i++){
      const x = Math.round(from.tx + dx*i/steps);
      const y = Math.round(from.ty + dy*i/steps);
      if(layTile(x, y)) painted = true;
    }
  } else if(!from){
    if(layTile(t.tx, t.ty)) painted = true;
  }
  BRUSH.last = {tx:t.tx, ty:t.ty};
  if(painted) queueBrushRender();
}
/* a single-tile path piece, so the brush can draw any shape */
BP.push({id:'path1', name:'Gravel (single)', art:'path', cat:'land', w:1, h:1,
  cost:6, lvl:1, kind:'decor', charm:1,
  desc:'One tile of gravel. Use the brush to draw a path in any shape.',
  tip:'Turn on the brush, then drag across the land.'});
BPMAP.path1 = BP[BP.length-1];
MERGE_ROAD.path1 = 1;

(function brushInput(){
  const world = document.getElementById('world');
  if(!world) return;
  world.addEventListener('pointerdown', e=>{
    if(!BRUSH.on || e.button!==0) return;
    e.stopPropagation();
    BRUSH.painting = true; BRUSH.laid = 0; BRUSH.last = null;
    paintPathAt(e.clientX, e.clientY);
  }, true);
  window.addEventListener('pointermove', e=>{
    if(!BRUSH.on || !BRUSH.painting) return;
    paintPathAt(e.clientX, e.clientY);
  });
  window.addEventListener('pointerup', ()=>{
    if(!BRUSH.painting) return;
    BRUSH.painting = false; BRUSH.last = null;
    render();
    if(BRUSH.laid){ sfx('place'); log(`Laid ${BRUSH.laid} tiles of gravel.`); G.save(); ui(); }
  });
  window.addEventListener('keydown', e=>{
    if(e.target.tagName==='INPUT') return;
    if(e.key.toLowerCase()==='b') G.pathBrush();
    if(e.key==='Escape' && BRUSH.on) G.pathBrush();
  });
  /* the toggle lives next to the zoom controls */
  const z = document.getElementById('zoomctl');
  if(z && !document.getElementById('brushBtn')){
    const b = document.createElement('button');
    b.id='brushBtn'; b.textContent='✎';
    b.dataset.tip = '<b>Path brush</b>Hold and drag across the land to lay gravel in any shape.<span class="tg">Key: B</span>';
    b.onclick = ()=>G.pathBrush();
    z.insertBefore(b, z.firstChild);
  }
})();

/* ---------------------------------------------------------------
   7. SEEING THE AI WORK — when a module acts, show it happening
   --------------------------------------------------------------- */
function aiPulse(o, colour, label){
  const fg = document.getElementById('fg');
  if(!fg || !o) return;
  const f = footprint(BPMAP[o.bp], o.rot);
  const cx = (o.tx + f.w/2)*T, cy = (o.ty + f.h/2)*T;
  const g = document.createElementNS('http://www.w3.org/2000/svg','g');
  g.setAttribute('class','aiwork');
  g.innerHTML =
    `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(Math.max(f.w,f.h)*T*0.55)}" fill="none"
       stroke="${colour}" stroke-width="2.5" opacity=".9"/>
     <circle cx="${n(cx)}" cy="${n(cy)}" r="6" fill="${colour}" opacity=".85"/>
     <text x="${n(cx)}" y="${n(cy - Math.max(f.w,f.h)*T*0.55 - 6)}" text-anchor="middle"
       font-size="10" font-weight="700" fill="${colour}"
       style="paint-order:stroke;stroke:rgba(8,14,6,.8);stroke-width:3px">${label}</text>`;
  fg.appendChild(g);
  setTimeout(()=>g.remove(), 1600);
}
const AI_COLOUR = {irrigation:'#6fb6d8', harvest:'#7cc24f', livestock:'#e8a33d',
                   agronomy:'#a98fd6', logistics:'#f0c14b'};
function showAiWork(kind, objs, label){
  if(!objs || !objs.length) return;
  if(S.settings && S.settings.aiVisuals === false) return;
  objs.slice(0,8).forEach((o,i)=> setTimeout(()=> aiPulse(o, AI_COLOUR[kind]||'#7cc24f', label), i*140));
}
SETTINGS.push({g:'Display', k:'aiVisuals', n:'Show AI at work', t:'bool', def:true,
  d:'Marks each building as an automation module acts on it.'});

/* wrap the automation so each module reports what it touched */
if(typeof runAutomation === 'function'){
  const _run = runAutomation;
  runAutomation = function(){
    const before = {
      dry:  S.objs.filter(o=>BPMAP[o.bp].kind==='plot' && o.crop && o.water<0.5).slice(),
      ripe: S.objs.filter(o=>['plot','perennial'].includes(BPMAP[o.bp].kind) && o.stage>=1).slice(),
      full: S.objs.filter(o=>BPMAP[o.bp].kind==='animal' && (o.ready>0 || (o.care||1)<0.6)).slice(),
      bare: S.objs.filter(o=>BPMAP[o.bp].kind==='plot' && !o.crop).slice(),
    };
    _run();
    if(!hub()) return;
    if(autoOn('irrigation')) showAiWork('irrigation', before.dry,  '💧');
    if(autoOn('harvest'))    showAiWork('harvest',    before.ripe, '🚁');
    if(autoOn('livestock'))  showAiWork('livestock',  before.full, '🤖');
    if(autoOn('agronomy'))   showAiWork('agronomy',   before.bare, '🌱');
  };
}

(function fixCss(){
  const st = document.createElement('style');
  st.textContent = `
  @keyframes aiwork{0%{opacity:0;transform:scale(.6)}25%{opacity:1;transform:scale(1.05)}
    70%{opacity:.9;transform:scale(1)}100%{opacity:0;transform:scale(1.15)}}
  .aiwork{transform-box:fill-box;transform-origin:center;animation:aiwork 1.5s ease-out forwards;pointer-events:none;}
  body.brushing #world{cursor:cell;}
  body.brushing #viewport{cursor:cell;}
  #brushBtn.on{background:linear-gradient(180deg,#67ad45,#4a8b34)!important;border-color:#7cc24f!important;}
  `;
  document.head.appendChild(st);
})();

/* keep the weather layer in step immediately, not just on the slow tick */
(function weatherPump(){
  let lastW = '';
  setInterval(()=>{
    if(!S) return;
    if(S.weather !== lastW){ lastW = S.weather; syncWeatherFx(); }
  }, 400);
  setTimeout(syncWeatherFx, 300);
})();
