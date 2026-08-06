/* =====================================================================
   PERFORMANCE — the scene was rebuilt whole on every change: terrain,
   horizon, every tuft of grass, re-serialised and re-parsed each time.
   Now the static backdrop is built once and only the moving parts are
   redrawn, and every ticker shares one animation frame.
   ===================================================================== */

/* ---------- 1. split the scene: a static backdrop, a live foreground ---------- */
let bgToken = '';
function sceneSize(){ return {w:WPX, h:HPX}; }

function ensureBackdrop(){
  const scene = document.getElementById('scene');
  if(!scene) return null;
  const token = `${WPX}x${HPX}:${S.landId}:${S.expansions||0}`;
  let bg = document.getElementById('bg');
  if(bg && bgToken === token) return bg;
  /* the backdrop only changes when the land itself does */
  const bgSvg = `<svg id="bg" width="${WPX}" height="${HPX}" viewBox="0 0 ${WPX} ${HPX}"
      xmlns="http://www.w3.org/2000/svg">${DEFS()}${terrain()}</svg>`;
  const fgSvg = `<svg id="fg" width="${WPX}" height="${HPX}" viewBox="0 0 ${WPX} ${HPX}"
      xmlns="http://www.w3.org/2000/svg">${DEFS()}</svg>`;
  scene.innerHTML = bgSvg + fgSvg;
  bgToken = token;
  return document.getElementById('bg');
}

/* the whole render, rebuilt to touch only the foreground */
render = function(){
  if(!S) return;
  ensureBackdrop();
  const fg = document.getElementById('fg');
  if(!fg) return;

  const order = {access:0, water:1, garden:2, trees:3, animals:4, energy:5, build:6, tourism:7, people:8, markers:9};
  const objs = S.objs.slice().sort((a,b)=>{
    const A=BPMAP[a.bp], B=BPMAP[b.bp];
    const ra = A.cat==='land'&&(A.art==='path'||A.art==='ring'||A.art==='parking') ? 0 : 1;
    const rb = B.cat==='land'&&(B.art==='path'||B.art==='ring'||B.art==='parking') ? 0 : 1;
    if(ra!==rb) return ra-rb;
    return (a.ty+BPMAP[a.bp].h) - (b.ty+BPMAP[b.bp].h);
  });

  let ghostSvg = '';
  if(ghost){
    const f = footprint(ghost.bp, ghost.rot);
    if((typeof SET!=='function') || SET('grid')){
      ghostSvg += `<g class="gridlay">`;
      for(let x=FARM.x;x<=FARM.x+FARM.w;x++)
        ghostSvg += `<line x1="${x*T}" y1="${FARM.y*T}" x2="${x*T}" y2="${(FARM.y+FARM.h)*T}" stroke="#fff" stroke-opacity=".13" stroke-width="1"/>`;
      for(let y=FARM.y;y<=FARM.y+FARM.h;y++)
        ghostSvg += `<line x1="${FARM.x*T}" y1="${y*T}" x2="${(FARM.x+FARM.w)*T}" y2="${y*T}" stroke="#fff" stroke-opacity=".13" stroke-width="1"/>`;
      ghostSvg += `</g>`;
    }
    const bad = overlaps(ghost.tx, ghost.ty, f, ghost.moving) || S.cash < (ghost.moving?0:ghost.bp.cost);
    const fake = {id:-1, bp:ghost.bp.id, tx:ghost.tx, ty:ghost.ty, rot:ghost.rot, tier:0,
      crop:null, stage:0.6, water:.6, animals:2, ready:0, store:(ghost.bp.cap||0)*0.6, cap:ghost.bp.cap};
    ghostSvg += `<g opacity=".72">${drawObj(fake)}</g>`;
    ghostSvg += `<rect x="${ghost.tx*T}" y="${ghost.ty*T}" width="${f.w*T}" height="${f.h*T}" rx="4"
      fill="${bad?'#e2705c':'#7cc24f'}" fill-opacity=".2" stroke="${bad?'#e2705c':'#7cc24f'}" stroke-width="2.5"/>`;
  }

  let selRing = '';
  if(sel){
    const o = S.objs.find(z=>z.id===sel);
    if(o){ const f = footprint(BPMAP[o.bp], o.rot);
      selRing = `<rect x="${o.tx*T-2}" y="${o.ty*T-2}" width="${f.w*T+4}" height="${f.h*T+4}" rx="5"
        fill="none" stroke="#f0c14b" stroke-width="2.5" stroke-dasharray="7 5" class="selring"/>`; }
  }

  fg.innerHTML = DEFS()
    + (typeof roadLayer==='function' ? roadLayer() : '')
    + `<g id="obs">${objs.map(drawObj).join('')}</g>`
    + (typeof herdLayer==='function' ? herdLayer() : '')
    + (typeof peopleLayer==='function' ? peopleLayer() : '')
    + (typeof youLayer==='function' ? youLayer() : '')
    + selRing + ghostSvg
    + (typeof weatherLayer==='function' ? weatherLayer() : '');

  nodeCache.clear();
  renderLabels();
  if(typeof applyWind==='function') applyWind();
  const cnt = document.getElementById('layoutCount');
  if(cnt) cnt.textContent = S.objs.length + ' pieces';
};

/* ---------- 2. stop querying the DOM for every creature every tick ---------- */
const nodeCache = new Map();
function node(sel2){
  let el = nodeCache.get(sel2);
  if(el && el.isConnected) return el;
  el = document.querySelector(sel2);
  if(el) nodeCache.set(sel2, el);
  return el;
}
if(typeof paintHerd === 'function'){
  paintHerd = function(){
    S.objs.forEach(o=>{
      if(!o.herd) return;
      o.herd.forEach((a,i)=>{
        const el = node(`[data-b="${o.id}_${i}"]`);
        if(!el) return;
        el.setAttribute('transform', `translate(${n(a.x)},${n(a.y)})`);
        const inner = el.firstElementChild;
        if(inner){
          const want = 'bwalk' + (a.moving ? (a.run ? ' running' : ' walking') : '');
          if(inner.getAttribute('class') !== want) inner.setAttribute('class', want);
          const flip = inner.firstElementChild;
          if(flip && a.dir !== a._d){ flip.setAttribute('transform', `scale(${a.dir},1)`); a._d = a.dir; }
        }
      });
    });
  };
}
if(typeof paintPeople === 'function'){
  paintPeople = function(){
    const upd = p=>{
      const el = node(`[data-p="${p.id}"]`);
      if(!el) return;
      el.setAttribute('transform', `translate(${n(p.x)},${n(p.y)})`);
      const op = p.state==='sleep' ? '0' : '1';
      if(el.style.opacity !== op) el.style.opacity = op;
      const bob = el.firstElementChild;
      if(bob){
        const want = 'youbob' + (p.state==='walk'?' walking':p.state==='busy'?' working':'');
        if(bob.getAttribute('class') !== want) bob.setAttribute('class', want);
        const fl = bob.firstElementChild;
        if(fl && p.dir !== p._d){ fl.setAttribute('transform',`scale(${p.dir},1)`); p._d = p.dir; }
      }
    };
    S.family.forEach(upd); S.workers.forEach(upd);
  };
}
if(typeof paintYou === 'function'){
  paintYou = function(){
    const el = node('#you');
    if(!el) return;
    const y = S.you;
    el.setAttribute('transform', `translate(${n(y.x)},${n(y.y)})`);
    const bob = el.firstElementChild;
    if(bob){
      const want = 'youbob' + (y.state==='walk'?' walking':y.state==='work'?' working':'');
      if(bob.getAttribute('class') !== want) bob.setAttribute('class', want);
      const flip = bob.firstElementChild;
      if(flip && y.dir !== y._d){ flip.setAttribute('transform', `scale(${y.dir},1)`); y._d = y.dir; }
    }
  };
}

/* ---------- 3. one animation frame drives everything ---------- */
window.__perfLoop = true;
(function unifyTickers(){
  /* the old per-system timers are removed at source; this frame drives them all */
  let last = performance.now(), sunAcc = 0, uiAcc = 0, saveAcc = 0, collectAcc = 0;
  function frame(now){
    requestAnimationFrame(frame);
    const dtms = Math.min(120, now - last);
    last = now;
    if(!S) return;
    const dt = dtms/1000;

    /* the world clock */
    if(S.speed > 0){
      if(S.settings && S.settings.dayLen) DAY_MS = S.settings.dayLen*1000;
      acc += dtms*S.speed;
      if(acc >= DAY_MS){ acc -= DAY_MS; advanceDay(); }
      if(typeof tickLife==='function')   tickLife(dt);
      if(typeof tickPeople==='function') tickPeople(dt);
    }
    if(typeof tickYou==='function')  tickYou(dt);
    if(typeof tickIdle==='function') tickIdle(dt);

    /* the day badge fill */
    const badge = document.getElementById('wbadge');
    if(badge){
      const pct = Math.round(acc/DAY_MS*100);
      badge.style.background = `linear-gradient(90deg, rgba(124,194,79,.28) ${pct}%, rgba(10,16,8,.86) ${pct}%)`;
    }

    sunAcc += dtms; uiAcc += dtms; saveAcc += dtms; collectAcc += dtms;
    if(sunAcc > 500){ sunAcc = 0;
      if(typeof paintSun==='function' && (!S.settings || S.settings.sunarc !== false)) paintSun(); }
    if(uiAcc > 3000){ uiAcc = 0;
      if(S.speed>0){ renderStats(); const b=document.getElementById('wbadge'); if(b) b.innerHTML = hint(); } }
    if(collectAcc > 1500){ collectAcc = 0;
      if(typeof syncWeatherFx==='function') syncWeatherFx();
      if(typeof syncCollectAll==='function') syncCollectAll(); }
    if(saveAcc > 20000){ saveAcc = 0;
      if(typeof SET!=='function' || SET('autoSave')) G.save(); }

    /* edge panning, only while it is switched on */
    if(typeof SET==='function' && SET('edgePan') && edge.on && !ghost){
      let dx=0, dy=0; const m=48, sp=520*dt;
      if(edge.x < m) dx = sp; else if(edge.x > edge.w-m) dx = -sp;
      if(edge.y < m) dy = sp; else if(edge.y > edge.h-m) dy = -sp;
      if(dx||dy){ cam.x += dx; cam.y += dy; applyCam(); }
    }
  }
  requestAnimationFrame(frame);
  if(typeof syncWeatherFx==='function') setTimeout(syncWeatherFx, 300);

  /* pointer position for edge panning, tracked passively */
  const edge = {on:false, x:0, y:0, w:0, h:0};
  const world = document.getElementById('world');
  if(world){
    world.addEventListener('mousemove', e=>{
      const r = world.getBoundingClientRect();
      edge.x = e.clientX-r.left; edge.y = e.clientY-r.top;
      edge.w = r.width; edge.h = r.height; edge.on = true;
    }, {passive:true});
    world.addEventListener('mouseleave', ()=>{ edge.on = false; }, {passive:true});
  }
})();

/* ---------- 4. fewer things animating, and cheaper compositing ---------- */
(function trimWork(){
  const css = document.createElement('style');
  css.textContent = `
  /* promote the moving layers so panning does not repaint the world */
  /* the two layers must overlap, not stack */
  #scene{will-change:transform;position:relative;}
  #scene > svg{position:absolute;left:0;top:0;}
  #bg{pointer-events:none;z-index:0;}
  #fg{z-index:1;}
  #world{contain:layout paint;}
  #wlabels{will-change:transform;contain:layout;}
  /* distant scenery does not need to sway — it is 200m away */
  #horizon .sway{animation:none!important;}
  /* anything that moves gets its own compositor layer, so its repaint
     never drags the rest of the scene with it */
  .sway,.bwalk,.youbob,.ripple,.twinkle,.pulse,.flame,.spin,.bee,.swingy,.steam{
    will-change:transform,opacity;}
  #obs,#herd,#people{contain:paint;}
  /* weather as one composited layer rather than dozens of animated nodes */
  #wxfx{position:absolute;inset:0;pointer-events:none;z-index:19;opacity:0;transition:opacity 1.4s;}
  #wxfx.wx-rain,#wxfx.wx-storm,#wxfx.wx-snow,#wxfx.wx-dust{opacity:1;}
  @keyframes wxfall{from{background-position:0 0}to{background-position:-140px 900px}}
  #wxfx.wx-rain{background-image:repeating-linear-gradient(105deg,
    rgba(207,230,245,0) 0 7px, rgba(207,230,245,.34) 7px 8px, rgba(207,230,245,0) 8px 15px);
    animation:wxfall 1.1s linear infinite;}
  #wxfx.wx-storm{background-image:repeating-linear-gradient(108deg,
    rgba(207,230,245,0) 0 5px, rgba(207,230,245,.46) 5px 7px, rgba(207,230,245,0) 7px 12px);
    animation:wxfall .55s linear infinite;}
  @keyframes wxsnow{from{background-position:0 0}to{background-position:60px 700px}}
  #wxfx.wx-snow{background-image:radial-gradient(circle at 20% 30%, #fff 0 1.6px, transparent 2px),
    radial-gradient(circle at 70% 60%, #fff 0 1.3px, transparent 2px);
    background-size:90px 90px, 130px 130px; opacity:.55; animation:wxsnow 9s linear infinite;}
  @keyframes wxdust{0%,100%{background-position:0 0;opacity:.16}50%{background-position:120px 0;opacity:.3}}
  #wxfx.wx-dust{background-image:linear-gradient(92deg, rgba(216,201,160,0) 0%, rgba(216,201,160,.5) 50%, rgba(216,201,160,0) 100%);
    background-size:60% 100%; animation:wxdust 16s ease-in-out infinite;}
  @media(prefers-reduced-motion:reduce){#wxfx{animation:none!important}}
  /* nothing animates while the tab is in the background */
  body.hidden *{animation-play-state:paused!important;}
  `;
  document.head.appendChild(css);
  document.addEventListener('visibilitychange', ()=>{
    document.body.classList.toggle('hidden', document.hidden);
  });
})();

/* the backdrop must be rebuilt when the land changes shape */
if(typeof resizeLand === 'function'){
  const _resize = resizeLand;
  resizeLand = function(l){ _resize(l); bgToken = ''; };
}
if(typeof expandFarm === 'function'){
  const _expand = expandFarm;
  expandFarm = function(){ _expand(); bgToken = ''; render(); };
}
