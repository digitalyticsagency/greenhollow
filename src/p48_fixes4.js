/* =====================================================================
   FOUR FIXES: BUYING LAND, REACHING THE MARKET, A ROUND MARKET, ALL TREES

   1. "Buying land does nothing" was not the expansion code - that works.
      The card carrying the button only rendered once the farm was over
      55% built, so on a normal farm there was no button on screen at all.

   2. "The market is not visible" - the fairground sits below the farm
      boundary, outside FARM, and the camera clamp will not pan outside
      FARM. You could never scroll to it.

   3. The market is now laid out as a ring around a central green, which
      is both how a fair actually works and stops the far row falling off
      the bottom of the ground.

   4. tree_native was the one tree that never moved: conifer() had no
      sway, while canopy() has had it all along.
   ===================================================================== */

/* ---------- 1. the land card is always there ---------- */
if(typeof renderBuild === 'function'){
  const _renderBuildLand = renderBuild;
  renderBuild = function(){
    const r = _renderBuildLand.apply(this, arguments);
    const list = document.getElementById('buildList');
    if(!list || list.querySelector('.landcard2')) return r;
    /* drop the old conditional card if it rendered, so there is only one */
    [...list.querySelectorAll('.card')].forEach(c=>{
      if(/Buy adjoining land|the neighbours will part with/.test(c.textContent)) c.remove();
    });
    const u = (typeof farmUsage === 'function') ? farmUsage() : {pct:0};
    const can = (typeof canExpand === 'function') ? canExpand() : false;
    const c = (typeof expandCost === 'function') ? expandCost() : 0;
    const afford = S.cash >= c;
    const div = document.createElement('div');
    div.className = 'card landcard2';
    div.style.margin = '10px';
    div.innerHTML = can
      ? `<div class="eyebrow">Land</div>
         <div class="statrow"><span>Your land is</span><b>${Math.round(u.pct*100)}% built</b></div>
         <div class="bar"><i style="transform:scaleX(${Math.min(1,u.pct).toFixed(3)});
           background:linear-gradient(90deg,#8a6a4a,#c9a06a)"></i></div>
         <div class="muted" style="margin:6px 0">${FARM.w}×${FARM.h} tiles. The neighbour will sell
         you the adjoining paddock — 4×3 more. Rates rise with everything you own.</div>
         <button class="btn wide" onclick="G.buyLand()">
           Buy adjoining land — ${fmt(c)}</button>
         ${afford ? '' : `<div class="muted" style="margin-top:6px;color:#f0a24b">
           ${fmt(c - S.cash)} short. Sell some produce or take a job first.</div>`}`
      : `<div class="eyebrow">Land</div>
         <div class="muted">${FARM.w}×${FARM.h} tiles — you own everything the neighbours will part with.</div>`;
    list.appendChild(div);
    return r;
  };
}

/* clicking it always says something, rather than sitting there disabled */
G.buyLand = function(){
  const c = expandCost();
  if(!canExpand()) return toast('No more adjoining land for sale','bad'), sfx('error');
  if(S.cash < c){
    toast(`${fmt(c - S.cash)} short of the asking price`,'bad');
    if(typeof sfx==='function') sfx('error');
    return;
  }
  expandFarm();
  if(typeof renderBuild === 'function') renderBuild();
};

/* ---------- 2. the camera can reach the market ---------- */
/* The clamp keeps the farm on screen, which is right day to day and wrong
   while a market is running on the common below the boundary. */
G.goToMarket = function(){
  marketInit();
  if(!S.market.active){ return G.openMarket(); }
  const g = S.market.ground;
  if(!g) return;
  const stage = document.getElementById('stage');
  if(!stage || typeof cam !== 'object') return;
  const cx = (g.tx + g.w/2)*T, cy = (g.ty + g.h/2)*T;
  /* frame the whole ground with a margin */
  const z = Math.min(2.2, Math.max(0.5,
    Math.min(stage.clientWidth/(g.w*T*1.15), stage.clientHeight/(g.h*T*1.3))));
  cam.z = z;
  cam.x = stage.clientWidth/2  - cx*z;
  cam.y = stage.clientHeight/2 - cy*z;
  MARKET_VIEW = true;                 /* let the clamp know where we are */
  applyCam();
  toast('At the market','good');
};
let MARKET_VIEW = false;

/* while a market runs, the clamp has to allow the common as well as the farm */
(function widenClamp(){
  /* The clamp in p24 measures against FARM. Rather than rewrite it, grow the
     bounds it measures while a market is on, then put them back. */
  const _apply = applyCam;
  applyCam = function(){
    marketInit();
    const g = S.market && S.market.active ? S.market.ground : null;
    if(!g){ return _apply.apply(this, arguments); }
    const save = {x:FARM.x, y:FARM.y, w:FARM.w, h:FARM.h};
    /* union of the farm and the market ground */
    const x0 = Math.min(FARM.x, g.tx), y0 = Math.min(FARM.y, g.ty);
    const x1 = Math.max(FARM.x+FARM.w, g.tx+g.w), y1 = Math.max(FARM.y+FARM.h, g.ty+g.h);
    FARM.x = x0; FARM.y = y0; FARM.w = x1-x0; FARM.h = y1-y0;
    const r = _apply.apply(this, arguments);
    FARM.x = save.x; FARM.y = save.y; FARM.w = save.w; FARM.h = save.h;
    return r;
  };
})();

/* a button so you do not have to find it by dragging */
setTimeout(()=>{
  const bar = document.querySelector('.tbtn') && document.querySelector('.tbtn').parentElement;
  if(!bar || document.getElementById('gotomkt')) return;
  const b = document.createElement('button');
  b.id = 'gotomkt'; b.className = 'tbtn';
  b.textContent = '⇢ Market';
  b.dataset.tip = '<b>Go to the market</b>Pans the view to the market ground.';
  b.style.display = 'none';
  b.addEventListener('click', ()=>G.goToMarket());
  bar.appendChild(b);
  setInterval(()=>{
    marketInit();
    b.style.display = S.market.active ? '' : 'none';
  }, 1200);
}, 640);

/* the market opens with the view already on it */
if(typeof marketStart === 'function'){
  const _startView = marketStart;
  marketStart = function(){
    const r = _startView.apply(this, arguments);
    if(S.market && S.market.active) setTimeout(()=>G.goToMarket(), 200);
    return r;
  };
}

/* ---------- 3. a round market ---------- */
/* A fair is a ring: buildings on the circumference facing in, the green
   and the bandstand at the centre. It also means nothing sits at the very
   bottom edge of the ground where it used to get clipped. */
if(typeof fairPlan === 'function'){
  fairPlan = function(){
    marketInit();
    const g = S.market.ground;
    if(!g) return null;
    const X = g.tx*T, Y = g.ty*T, W = g.w*T, H = g.h*T;
    const cx = X + W/2, cy = Y + H/2;
    /* keep the ring inside the ground with room for the building itself */
    const bw = Math.min(W*0.15, 92), bh = Math.min(H*0.22, 64);
    const rx = W/2 - bw*0.75, ry = H/2 - bh*0.75;
    const kinds = ['hall','bakery','cider','forge','flowers','tearoom','store','pens','cottage','cottage'];
    const ring = kinds.map((kind, i)=>{
      const a = (i/kinds.length)*Math.PI*2 - Math.PI/2;
      return { kind,
        x: cx + Math.cos(a)*rx - bw/2,
        y: cy + Math.sin(a)*ry - bh/2,
        w: bw, h: bh, a };
    });
    return { X, Y, W, H, cx, cy, rx, ry, ring,
      top: ring.slice(0,5), bot: ring.slice(5),
      green:     {x:cx - W*0.16, y:cy - H*0.15, w:W*0.32, h:H*0.30},
      bandstand: {x:cx - W*0.10, y:cy - H*0.11, w:W*0.20, h:H*0.22} };
  };
}

if(typeof fairLayer === 'function'){
  fairLayer = function(){
    marketInit();
    if(!S.market.active || !S.market.onCommon) return '';
    const p = fairPlan();
    if(!p) return '';
    let s = `<g id="fairground" aria-hidden="true">`;
    /* the common, and the ring of trodden ground people walk */
    s += `<ellipse cx="${n(p.cx)}" cy="${n(p.cy)}" rx="${n(p.W*0.49)}" ry="${n(p.H*0.47)}"
      fill="#8fae5c" opacity=".55"/>`;
    s += `<ellipse cx="${n(p.cx)}" cy="${n(p.cy)}" rx="${n(p.rx*0.82)}" ry="${n(p.ry*0.82)}"
      fill="none" stroke="url(#gGravel)" stroke-width="${n(Math.min(p.W,p.H)*0.10)}" opacity=".85"/>`;
    /* the buildings, standing on the ring facing the middle */
    p.ring.forEach((b,i)=>{
      s += `<g transform="translate(${n(b.x)},${n(b.y)})">${fairBuilding(b.kind, b.w, b.h, i*2.7)}</g>`;
    });
    /* the green and the bandstand at the centre */
    s += `<ellipse cx="${n(p.cx)}" cy="${n(p.cy)}" rx="${n(p.W*0.17)}" ry="${n(p.H*0.16)}"
      fill="#9cc06a" opacity=".7"/>`;
    s += `<g transform="translate(${n(p.bandstand.x)},${n(p.bandstand.y)})">
      ${fairBuilding('bandstand', p.bandstand.w, p.bandstand.h, 3)}</g>`;
    /* bunting from the bandstand out to each building */
    p.ring.forEach((b,i)=>{
      if(i % 2) return;
      s += `<line x1="${n(p.cx)}" y1="${n(p.cy - p.H*0.10)}"
        x2="${n(b.x + b.w/2)}" y2="${n(b.y + b.h*0.4)}"
        stroke="#7c6f5a" stroke-width="0.6" opacity=".7"/>`;
    });
    return s + '</g>';
  };
}

/* traders stand outside their own building, facing the green */
if(typeof traderGoal === 'function'){
  const _traderGoalRing = traderGoal;
  traderGoal = function(tr){
    const base = _traderGoalRing.apply(this, arguments);
    if(!S.market.onCommon || !base || base.cheer || base.inside) return base;
    const p = fairPlan();
    if(!p || !p.ring) return base;
    const b = p.ring[tr.idx % p.ring.length];
    /* a step in from the building, toward the middle */
    const dx = p.cx - (b.x + b.w/2), dy = p.cy - (b.y + b.h/2);
    const d = Math.hypot(dx,dy) || 1;
    return { x: b.x + b.w/2 + dx/d*26 + (tr.wx||0),
             y: b.y + b.h/2 + dy/d*26 + (tr.wy||0), act:'working the stall' };
  };
}

/* the ground wants to be squarer now that it is a ring */
if(typeof fairGround === 'function'){
  fairGround = function(){
    const w = 22, h = 14;
    return { tx: FARM.x, ty: FARM.y + FARM.h + 2,
             w: Math.min(w, Math.max(12, WT - FARM.x - 1)), h };
  };
}

/* ---------- 4. the last tree that never moved ---------- */
if(typeof conifer === 'function'){
  const _coniferBase = conifer;
  conifer = function(cx, cy, r, seed){
    const out = _coniferBase.apply(this, arguments);
    /* the shadow is drawn first and must stay still; everything from the
       first <g> on is the tree itself */
    const i = out.indexOf('<g>');
    if(i < 0) return out;
    return out.slice(0, i)
      + `<g class="sway" style="transform-origin:${n(cx)}px ${n(cy + r*0.7)}px">`
      + out.slice(i + 3);
  };
}

/* =====================================================================
   BOUGHT LAND HAS TO SURVIVE A RELOAD

   The save records S.expansions but not FARM's size, and load() calls
   resizeLand() which resets FARM to the land type's base dimensions.
   Nothing put the expansions back. So every parcel you paid for vanished
   on the next reload while still counting against your limit of four -
   which is the real reason buying land looked like it did nothing.
   ===================================================================== */
function applyExpansions(){
  const n0 = S.expansions || 0;
  if(!n0) return;
  if(S._expApplied === n0) return;        /* already sized for this count */
  const addW = 4, addH = 3;
  FARM.w += addW * n0;
  FARM.h += addH * n0;
  /* grow the world canvas to hold it, the same way expandFarm does */
  if(FARM.x + FARM.w > WT - 3){ WT = FARM.x + FARM.w + 3; WPX = WT*T; }
  if(FARM.y + FARM.h > HT - 3){ HT = FARM.y + FARM.h + 3; HPX = HT*T; }
  S._expApplied = n0;
  terrainCache = '';
}

/* resizeLand is what wipes it, so re-apply immediately afterwards */
if(typeof resizeLand === 'function'){
  const _resizeLand = resizeLand;
  resizeLand = function(){
    const r = _resizeLand.apply(this, arguments);
    S._expApplied = 0;                    /* the base size is back */
    applyExpansions();
    return r;
  };
}

/* expandFarm has already grown FARM itself, so keep the marker in step */
if(typeof expandFarm === 'function'){
  const _expandFarm = expandFarm;
  expandFarm = function(){
    const r = _expandFarm.apply(this, arguments);
    S._expApplied = S.expansions || 0;
    return r;
  };
}

/* and catch the case where the save loaded before this ran */
setTimeout(()=>{
  if(typeof S === 'undefined' || !S) return;
  applyExpansions();
  if(typeof terrainCache !== 'undefined') terrainCache = '';
  if(typeof render === 'function') render();
  if(typeof fitView === 'function') fitView();
}, 700);
