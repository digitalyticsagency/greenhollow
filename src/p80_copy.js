/* =====================================================================
   DUPLICATE, AND SAVED LAYOUTS

   The played save has 157 land and decor items out of 201 buildings. Every
   one of them was picked from the menu and placed on its own. There was no
   way to copy the thing you just made, and no way to repeat an arrangement
   you liked - which is the single most repetitive thing a decorator does
   in this game.

   Two additions:

   DUPLICATE puts a fresh copy of the selected object on the cursor, at the
   same rotation. It is the same placement ghost the build menu uses, so it
   costs the same, snaps the same and is refused in the same places. Bound
   to the panel button and to D.

   LAYOUTS let you drag a box around something you built - a corner with a
   bench and a hedge, an orchard block, a run of fencing - and keep it. A
   saved layout can then be stamped anywhere, as many times as you can pay
   for. Stored on the save, so they survive between sessions.

   Both go through place() and overlaps(), so nothing about cost, collision
   or lot boundaries is special-cased. A stamp that would land on something,
   or half off the lot, is refused as a whole rather than partly placed.
   ===================================================================== */

function layoutsInit(){
  if(!Array.isArray(S.layouts)) S.layouts = [];
  return S.layouts;
}

/* ---------- 1. duplicate the selected object ---------- */

G.duplicate = function(id){
  const o = S.objs.find(z=>z.id === (id === undefined ? sel : id));
  if(!o) return toast('Nothing selected','bad');
  const bp = BPMAP[o.bp];
  if(!bp) return;
  if(S.lvl < bp.lvl)  return toast(`Unlocks at level ${bp.lvl}`,'bad');
  if(S.cash < bp.cost) return toast(`You need ${fmt(bp.cost - S.cash)} more`,'bad');
  /* the build menu's own path, so cost, snapping and refusals are identical */
  G.pick(o.bp);
  if(typeof ghost === 'object' && ghost){
    ghost.rot = o.rot || 0;          /* a copy faces the way the original does */
    ghost.tx = o.tx; ghost.ty = o.ty + (footprint(bp, o.rot).h);
    render();
  }
  toast(`Copy of ${bp.name} — place it`,'good');
};

/* the button, next to Rotate and Move */
(function duplicateButton(){
  if(typeof ui !== 'function') return;
  const paint = ()=>{
    document.querySelectorAll('button.act').forEach(b=>{
      if(!/Rotate/.test(b.textContent) || b.dataset.dupAdded) return;
      b.dataset.dupAdded = '1';
      const m = (b.getAttribute('onclick')||'').match(/G\.rotate\((\d+)\)/);
      if(!m) return;
      const dup = document.createElement('button');
      dup.className = 'act';
      dup.textContent = '⧉ Duplicate';
      dup.setAttribute('onclick', `G.duplicate(${m[1]})`);
      dup.dataset.tip = '<b>Duplicate</b>Another one of these, same way round, on the cursor. Shortcut: <kbd>D</kbd>.';
      b.parentNode.insertBefore(dup, b.nextSibling);
    });
  };
  const _uiDup = ui;
  ui = function(){ const r = _uiDup.apply(this, arguments); try{ paint(); }catch(e){} return r; };
})();

/* ---------- 2. saved layouts ---------- */

/* the drag-box, only live while arming a save */
const MARQ = { on:false, sx:0, sy:0, tx:0, ty:0, dragging:false };

G.startLayoutCapture = function(){
  MARQ.on = true; MARQ.dragging = false;
  document.body.classList.add('marq');
  toast('Drag a box around what you want to keep','good');
  paintMarquee();
};
G.cancelLayoutCapture = function(){
  MARQ.on = false; MARQ.dragging = false;
  document.body.classList.remove('marq');
  paintMarquee();
};

function marqRect(){
  return { x:Math.min(MARQ.sx, MARQ.tx), y:Math.min(MARQ.sy, MARQ.ty),
           w:Math.abs(MARQ.tx - MARQ.sx) + 1, h:Math.abs(MARQ.ty - MARQ.sy) + 1 };
}
function paintMarquee(){
  let el = document.getElementById('marqbox');
  const fg = document.getElementById('fg');
  if(!MARQ.on || !MARQ.dragging){ if(el) el.remove(); return; }
  const r = marqRect();
  if(!el && fg){
    el = document.createElementNS('http://www.w3.org/2000/svg','rect');
    el.id = 'marqbox';
    el.setAttribute('fill','rgba(240,193,75,.14)');
    el.setAttribute('stroke','#f0c14b');
    el.setAttribute('stroke-width','2');
    el.setAttribute('stroke-dasharray','7 5');
    el.setAttribute('pointer-events','none');
    fg.appendChild(el);
  }
  if(el){
    el.setAttribute('x', r.x*T); el.setAttribute('y', r.y*T);
    el.setAttribute('width', r.w*T); el.setAttribute('height', r.h*T);
  }
}

/* what is inside the box, positioned relative to its top-left */
function captureLayout(r){
  const items = [];
  S.objs.forEach(o=>{
    const bp = BPMAP[o.bp]; if(!bp) return;
    const f = footprint(bp, o.rot);
    /* wholly inside, so a stamp never contains half a barn */
    if(o.tx >= r.x && o.ty >= r.y && o.tx + f.w <= r.x + r.w && o.ty + f.h <= r.y + r.h)
      items.push({ bp:o.bp, dx:o.tx - r.x, dy:o.ty - r.y, rot:o.rot||0 });
  });
  return items;
}

function layoutCost(items){
  return items.reduce((a,it)=>a + ((BPMAP[it.bp]||{}).cost||0), 0);
}

/* capture is finished by the pointer handlers below */
function finishCapture(){
  const r = marqRect();
  const items = captureLayout(r);
  G.cancelLayoutCapture();
  if(!items.length) return toast('Nothing whole inside the box','bad');
  layoutsInit();
  const name = `Layout ${S.layouts.length + 1}`;
  S.layouts.push({ id:'L'+Date.now(), name, w:r.w, h:r.h, items });
  sfx('build');
  toast(`Saved “${name}” — ${items.length} pieces`,'gold');
  log(`Saved a layout of ${items.length} pieces, ${fmt(layoutCost(items))} to stamp.`,'gold');
  ui(); G.save();
};

/* ---------- stamping one down ---------- */

let STAMP = null;      /* {layout, tx, ty} while placing */

G.stampLayout = function(lid){
  const L = layoutsInit().find(x=>x.id===lid);
  if(!L) return;
  const c = layoutCost(L.items);
  if(S.cash < c) return toast(`That layout costs ${fmt(c)}`,'bad'), sfx('error');
  STAMP = { L, tx:FARM.x+2, ty:FARM.y+2 };
  document.body.classList.add('marq');
  toast(`Placing “${L.name}” — ${fmt(c)}. Click to drop, Esc to stop.`,'good');
  paintStamp();
};
G.cancelStamp = function(){ STAMP = null; document.body.classList.remove('marq'); paintStamp(); };

function stampFits(){
  if(!STAMP) return false;
  return STAMP.L.items.every(it=>{
    const bp = BPMAP[it.bp]; if(!bp) return false;
    const f = footprint(bp, it.rot);
    return !overlaps(STAMP.tx + it.dx, STAMP.ty + it.dy, f, 0);
  });
}
function paintStamp(){
  let g = document.getElementById('stampghost');
  const fg = document.getElementById('fg');
  if(!STAMP){ if(g) g.remove(); return; }
  if(!g && fg){
    g = document.createElementNS('http://www.w3.org/2000/svg','g');
    g.id = 'stampghost'; g.setAttribute('pointer-events','none');
    fg.appendChild(g);
  }
  if(!g) return;
  const ok = stampFits();
  g.setAttribute('opacity', ok ? '0.75' : '0.4');
  g.innerHTML = STAMP.L.items.map(it=>{
    const bp = BPMAP[it.bp]; if(!bp) return '';
    const f = footprint(bp, it.rot);
    return `<rect x="${(STAMP.tx+it.dx)*T}" y="${(STAMP.ty+it.dy)*T}"
      width="${f.w*T}" height="${f.h*T}" rx="4"
      fill="${ok?'rgba(157,196,106,.45)':'rgba(200,88,63,.45)'}"
      stroke="${ok?'#9dc46a':'#c8583f'}" stroke-width="2"/>`;
  }).join('');
}

function dropStamp(){
  if(!STAMP) return;
  const c = layoutCost(STAMP.L.items);
  if(S.cash < c) { toast('Not enough cash','bad'); return G.cancelStamp(); }
  if(!stampFits()) return toast('It will not fit there','bad'), sfx('error');
  /* place() already deducts each blueprint's cost unless it is passed
     `free`, so the stamp must NOT subtract the total as well - doing both
     charged $308 for a $154 layout. The affordability check above uses the
     same total, so the guard stays honest. */
  STAMP.L.items.forEach(it=> place(it.bp, STAMP.tx + it.dx, STAMP.ty + it.dy, it.rot));
  sfx('build');
  addXP(Math.round(c/16) + 4);
  log(`Stamped “${STAMP.L.name}” — ${STAMP.L.items.length} pieces for ${fmt(c)}.`,'gold');
  toast(`Placed ${STAMP.L.items.length} pieces`,'gold');
  /* stay armed so a hedge run can be laid in one go */
  if(S.cash < c) G.cancelStamp();
  render(); ui(); G.save();
  paintStamp();
}

/* ---------- input ---------- */
(function wireInput(){
  const world = document.getElementById('world') || document.body;
  world.addEventListener('pointerdown', e=>{
    if(MARQ.on){
      const p = screenToTile(e.clientX, e.clientY);
      MARQ.sx = MARQ.tx = p.tx; MARQ.sy = MARQ.ty = p.ty;
      MARQ.dragging = true; paintMarquee();
      e.stopPropagation();
    } else if(STAMP){
      dropStamp();
      e.stopPropagation();
    }
  }, true);
  window.addEventListener('pointermove', e=>{
    if(MARQ.on && MARQ.dragging){
      const p = screenToTile(e.clientX, e.clientY);
      MARQ.tx = p.tx; MARQ.ty = p.ty; paintMarquee();
    } else if(STAMP){
      const p = screenToTile(e.clientX, e.clientY);
      if(p.tx !== STAMP.tx || p.ty !== STAMP.ty){ STAMP.tx = p.tx; STAMP.ty = p.ty; paintStamp(); }
    }
  });
  window.addEventListener('pointerup', ()=>{
    if(MARQ.on && MARQ.dragging) finishCapture();
  });
  window.addEventListener('keydown', e=>{
    if(e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) return;
    const k = e.key.toLowerCase();
    if(k === 'd' && typeof sel !== 'undefined' && sel && !STAMP && !MARQ.on){ G.duplicate(sel); }
    if(e.key === 'Escape'){ if(STAMP) G.cancelStamp(); if(MARQ.on) G.cancelLayoutCapture(); }
  });
  /* a redraw wipes the overlays, so re-apply them after one */
  if(typeof render === 'function'){
    const _renderCopy = render;
    render = function(){ const r = _renderCopy.apply(this, arguments);
      try{ paintMarquee(); paintStamp(); }catch(e){} return r; };
  }
})();

/* ---------- the panel ---------- */
G.openLayouts = function(){
  layoutsInit();
  let h = `<h2>Layouts</h2>
    <p class="sub">Drag a box around something you have built and keep it, then stamp it
    anywhere. Useful for the arrangement you keep making by hand.</p>
    <div class="mfoot" style="margin:0 0 10px"><button class="btn"
      onclick="G.closeModal(); G.startLayoutCapture();">Capture a new layout</button></div>`;
  if(!S.layouts.length){
    h += `<div class="empty">Nothing saved yet.</div>`;
  } else {
    S.layouts.forEach(L=>{
      const c = layoutCost(L.items);
      h += `<div style="display:flex;gap:8px;align-items:center;padding:9px 0;border-top:1px solid var(--line)">
        <div style="flex:1;min-width:0">
          <input class="pname" value="${L.name}" onchange="G.renameLayout('${L.id}', this.value)"
            style="background:none;border:none;color:var(--ink);font:inherit;font-weight:700;width:100%"/>
          <div class="muted" style="font-size:12px">${L.items.length} pieces · ${L.w}×${L.h} · ${fmt(c)} to stamp</div>
        </div>
        <button class="btn" ${S.cash<c?'disabled':''} onclick="G.closeModal(); G.stampLayout('${L.id}')">Stamp</button>
        <button class="btn ghost" onclick="G.deleteLayout('${L.id}')">✕</button>
      </div>`;
    });
  }
  h += `<div class="mfoot"><button class="btn ghost" onclick="G.closeModal()">Close</button></div>`;
  modal(h);
};
G.renameLayout = function(lid, v){
  const L = layoutsInit().find(x=>x.id===lid); if(!L) return;
  L.name = (v||'').trim() || L.name; G.save();
};
G.deleteLayout = function(lid){
  S.layouts = layoutsInit().filter(x=>x.id!==lid);
  G.save(); G.openLayouts();
};

setTimeout(()=>{
  const bar = document.querySelector('.tbtn') && document.querySelector('.tbtn').parentElement;
  if(!bar || document.getElementById('laybtn')) return;
  const b = document.createElement('button');
  b.id = 'laybtn'; b.className = 'tbtn';
  b.textContent = '⧉ Layouts';
  b.dataset.tip = '<b>Layouts</b>Save an arrangement you like and stamp it again anywhere.';
  b.addEventListener('click', ()=>G.openLayouts());
  bar.appendChild(b);
}, 640);

(function copyCss(){
  const s = document.createElement('style');
  s.textContent = `body.marq #viewport{ cursor:crosshair; }`;
  document.head.appendChild(s);
})();

/* ---------- handle ---------- */
G.copyAudit = function(){
  layoutsInit();
  return {
    layouts: S.layouts.map(L=>`${L.name}: ${L.items.length} pieces, ${L.w}x${L.h}, ${fmt(layoutCost(L.items))}`),
    capturing: MARQ.on, stamping: !!STAMP,
    duplicateBound: typeof G.duplicate === 'function',
  };
};
