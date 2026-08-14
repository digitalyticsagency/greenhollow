/* =====================================================================
   A SECOND LOT, ACROSS THE LANE

   Expansion until now stretched the one rectangle: the property got
   wider and taller and the hedge moved out. That runs out - and it also
   stops looking like a farm and starts looking like a field.

   This adds separate lots. You buy the block across the lane or over the
   back fence, it gets its own hedge and its own gateway, and a gravel
   track joins it to the home block. Everything works on it: you can
   build there, the family and the animals walk there, the gravel brush
   paints there.

   HOW IT HOOKS IN WITHOUT REWRITING THE ENGINE

   Three functions define "inside the farm", and all three test the single
   FARM rectangle:

       overlaps()    - can this be built here
       layTile()     - can the gravel brush paint here
       blockedTile() - can a person or animal walk here

   Rather than duplicate their object-collision logic, each is wrapped to
   find the lot that contains the target, point FARM at that lot for the
   length of the base call, and put it back. The base function then does
   exactly what it always did, against the right boundary. A footprint
   must fit entirely within ONE lot - you cannot bridge two lots with a
   barn, which is also true of real title boundaries.
   ===================================================================== */

/* ---------- state ---------- */
function lotsInit(){
  if(!Array.isArray(S.lots)) S.lots = [];
  return S.lots;
}
/* every block you own, home block first */
function estateRects(){
  lotsInit();
  return [{x:FARM.x, y:FARM.y, w:FARM.w, h:FARM.h}].concat(S.lots);
}
/* the rect that fully contains this footprint, or null */
function rectFor(tx, ty, w, h){
  w = w||1; h = h||1;
  return estateRects().find(r =>
    tx >= r.x && ty >= r.y && tx + w <= r.x + r.w && ty + h <= r.y + r.h) || null;
}
function estateTiles(){
  return estateRects().reduce((a,r)=>a + r.w*r.h, 0);
}

/* run fn with FARM temporarily pointed at `r` */
function withRect(r, fn){
  const save = {x:FARM.x, y:FARM.y, w:FARM.w, h:FARM.h};
  FARM.x = r.x; FARM.y = r.y; FARM.w = r.w; FARM.h = r.h;
  try { return fn(); }
  finally { FARM.x = save.x; FARM.y = save.y; FARM.w = save.w; FARM.h = save.h; }
}

/* ---------- the three boundary functions ---------- */

if(typeof overlaps === 'function'){
  const _overlapsBase = overlaps;
  overlaps = function(tx, ty, f, skipId){
    if(!lotsInit().length) return _overlapsBase.apply(this, arguments);
    const r = rectFor(tx, ty, f.w, f.h);
    if(!r) return true;                      /* outside every block, or straddling two */
    return withRect(r, ()=> _overlapsBase.call(this, tx, ty, f, skipId));
  };
}

if(typeof layTile === 'function'){
  const _layTileBase = layTile;
  layTile = function(tx, ty){
    if(!lotsInit().length) return _layTileBase.apply(this, arguments);
    const r = rectFor(tx, ty, 1, 1);
    if(!r) return false;
    return withRect(r, ()=> _layTileBase.call(this, tx, ty));
  };
}

if(typeof blockedTile === 'function'){
  const _blockedBase = blockedTile;
  blockedTile = function(x, y){
    if(!lotsInit().length) return _blockedBase.apply(this, arguments);
    const r = rectFor(x, y, 1, 1);
    if(!r) return true;                      /* off the estate entirely */
    return withRect(r, ()=> _blockedBase.call(this, x, y));
  };
}

/* ---------- buying one ---------- */

const LOT_MAX = 6;
function lotCost(){
  /* starts where the last stretch-expansion leaves off and climbs, so a
     lot is a real decision rather than pocket change on a big farm */
  return Math.round(60000 * Math.pow(1.7, lotsInit().length));
}
function canBuyLot(){ return lotsInit().length < LOT_MAX; }

/* Lots alternate east and south of the home block with a two-tile lane
   between, so each one reads as its own paddock reached by a track
   rather than as the farm simply getting bigger. */
function nextLotRect(){
  const n0 = lotsInit().length;
  const w = 12 + Math.floor(n0/2)*4;
  const h = 9  + Math.floor(n0/2)*3;
  const LANE = 2;
  const east = (n0 % 2) === 0;
  /* stack each new lot beyond the furthest one on that side */
  const sameSide = S.lots.filter((_,i)=> (i % 2 === 0) === east);
  if(east){
    const startX = sameSide.length
      ? Math.max(...sameSide.map(r=>r.x + r.w)) + LANE
      : FARM.x + FARM.w + LANE;
    return {x:startX, y:FARM.y, w, h};
  }
  const startY = sameSide.length
    ? Math.max(...sameSide.map(r=>r.y + r.h)) + LANE
    : FARM.y + FARM.h + LANE;
  return {x:FARM.x, y:startY, w, h};
}

function buyLot(){
  lotsInit();
  if(!canBuyLot()) return toast('There is no more land for sale nearby','bad'), sfx('error');
  const c = lotCost();
  if(S.cash < c) return toast(`That block is ${fmt(c)}`,'bad'), sfx('error');
  const r = nextLotRect();
  /* grow the world so the new block and its lane are inside it */
  if(r.x + r.w + 3 > WT){ WT = r.x + r.w + 3; WPX = WT*T; }
  if(r.y + r.h + 3 > HT){ HT = r.y + r.h + 3; HPX = HT*T; }
  S.cash -= c;
  S.lots.push(r);
  terrainCache = '';
  sfx('upgrade');
  toast(`Bought the ${r.w}×${r.h} block — ${estateTiles()} tiles now`,'gold');
  log(`Bought a separate ${r.w}×${r.h} lot for ${fmt(c)}. A track runs over to it.`,'gold','money');
  render(); ui(); G.save();
}
G.buyLot = buyLot;

/* ---------- drawing: hedge, gateway and the track over ---------- */

function lotArt(r, i){
  const px = r.x*T, py = r.y*T, pw = r.w*T, ph = r.h*T;
  let s = `<rect x="${px}" y="${py}" width="${pw}" height="${ph}" rx="6" fill="url(#gLawn)"/>`;
  for(let k=0;k<Math.floor(pw/48);k++)
    s += `<rect x="${n(px+k*48)}" y="${py}" width="24" height="${ph}" fill="#fff" opacity=".035"/>`;
  /* the same scattered tufts the home block gets, at the same density */
  const tufts = Math.round(r.w*r.h*0.8);
  for(let k=0;k<tufts;k++){
    const gx = px+2+hash(k*1.31+i*97)*(pw-4), gy = py+2+hash(k*2.77+9+i*97)*(ph-4);
    const len = 2.4+hash(k*3.7)*3.4, lean = (hash(k*5.1)-0.5)*2.6;
    const c = k%9===0 ? '#9dc46a' : k%5===0 ? '#5b8438' : '#79a44e';
    s += `<path d="M${n(gx)} ${n(gy)} q ${n(lean)} ${n(-len*0.6)} ${n(lean*1.7)} ${n(-len)}"
      stroke="${c}" stroke-width="${(0.6+hash(k)*0.5).toFixed(1)}" fill="none" stroke-linecap="round" opacity=".75"/>`;
  }
  /* boundary hedge, with a gap left for the gateway facing the home block */
  const hb = 15;
  const east = r.x > FARM.x;
  s += `<g transform="translate(${px-hb/2},${py-hb/2})">${hedge(pw+hb, hb)}</g>`;
  s += `<g transform="translate(${px-hb/2},${py+ph-hb/2})">${hedge(pw+hb, hb)}</g>`;
  if(east){
    /* gateway on the near (west) side: hedge above and below the gap */
    const gapY = py + ph*0.42, gapH = T*1.6;
    s += `<g transform="translate(${px-hb/2},${py-hb/2})">${hedge(hb, gapY-py+hb/2)}</g>`;
    s += `<g transform="translate(${px-hb/2},${n(gapY+gapH-hb/2)})">${hedge(hb, py+ph-gapY-gapH+hb)}</g>`;
    s += `<g transform="translate(${px+pw-hb/2},${py-hb/2})">${hedge(hb, ph+hb)}</g>`;
    /* the track across the lane, through both gateways */
    s += `<rect x="${n(px - T*2.2)}" y="${n(gapY)}" width="${n(T*2.4)}" height="${n(gapH)}" fill="#9d9276"/>`;
    s += `<rect x="${n(px - T*2.2)}" y="${n(gapY+2)}" width="${n(T*2.4)}" height="${n(gapH-4)}" fill="url(#gGravel)"/>`;
  } else {
    const gapX = px + pw*0.42, gapW = T*1.6;
    s += `<g transform="translate(${px-hb/2},${py-hb/2})">${hedge(hb, ph+hb)}</g>`;
    s += `<g transform="translate(${px+pw-hb/2},${py-hb/2})">${hedge(hb, ph+hb)}</g>`;
    s += `<rect x="${n(gapX)}" y="${n(py - T*2.2)}" width="${n(gapW)}" height="${n(T*2.4)}" fill="#9d9276"/>`;
    s += `<rect x="${n(gapX+2)}" y="${n(py - T*2.2)}" width="${n(gapW-4)}" height="${n(T*2.4)}" fill="url(#gGravel)"/>`;
  }
  /* a sign so it is obvious the block is yours */
  s += `<g transform="translate(${n(px+pw*0.5-18)},${n(py+8)})">${ART.sign ? ART.sign(36,26,null) : ''}</g>`;
  return s;
}

if(typeof terrain === 'function'){
  const _terrainLots = terrain;
  terrain = function(){
    const base = _terrainLots.apply(this, arguments);
    if(!lotsInit().length) return base;
    /* clouds are appended by p30, so the lots go in front of the returned
       string rather than being spliced into the middle of it */
    return base + S.lots.map((r,i)=>lotArt(r,i)).join('');
  };
}

/* ---------- the buy button, next to the existing land panel ---------- */
(function lotPanel(){
  if(typeof ui !== 'function') return;
  const paint = ()=>{
    const host = document.querySelector('.mkgive') ? null : null;
    /* the land panel is rebuilt each ui() pass; find it by its heading */
    const eyebrows = [...document.querySelectorAll('.eyebrow')].filter(e=>e.textContent.trim()==='Land');
    eyebrows.forEach(e=>{
      const card = e.parentElement;
      if(!card || card.dataset.lotbtn) return;
      card.dataset.lotbtn = '1';
      const c = lotCost();
      const div = document.createElement('div');
      div.style.marginTop = '8px';
      div.innerHTML = canBuyLot()
        ? `<div class="muted" style="margin:6px 0">There is a separate block ${(lotsInit().length%2===0)?'across the lane':'over the back fence'}
             — ${nextLotRect().w}×${nextLotRect().h} tiles, its own gate, a track over to it.</div>
           <button class="btn wide" ${S.cash<c?'disabled':''} onclick="G.buyLot()"
             data-tip="${esc(`<b>Buy the neighbouring block</b>A separate lot joined to yours by a track.<hr><div class="tl"><span>Price</span><span class="tk">${fmt(c)}</span></div><div class="tl"><span>Lots owned</span><b>${lotsInit().length} of ${LOT_MAX}</b></div>`)}">
             Buy the next block — ${fmt(c)}</button>`
        : `<div class="muted" style="margin:6px 0">You own every block the neighbours will part with.</div>`;
      card.appendChild(div);
    });
  };
  const _uiLots = ui;
  ui = function(){ const r = _uiLots.apply(this, arguments); try{ paint(); }catch(e){} return r; };
})();

/* ---------- handle ---------- */
G.lotAudit = function(){
  return {
    lots: estateRects().map((r,i)=>`${i?'lot '+i:'home block'}: ${r.w}x${r.h} at (${r.x},${r.y}) = ${r.w*r.h} tiles`),
    totalTiles: estateTiles(),
    nextCost: canBuyLot() ? lotCost() : 'sold out',
    nextRect: canBuyLot() ? nextLotRect() : null,
    world: `${WT}x${HT}`,
    costCurve: Array.from({length:LOT_MAX}, (_,i)=>'$'+Math.round(60000*Math.pow(1.7,i)).toLocaleString()),
  };
};
