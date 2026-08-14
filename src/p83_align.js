/* =====================================================================
   ALIGNMENT GUIDES AND MIRRORED LAYOUTS

   Placing by eye on a 40px grid means a row of six things is six chances
   to be one tile out, and you only notice once it is all down. Two aids:

   GUIDES. While something is on the cursor, any existing object whose
   edge lines up with the ghost's draws a dashed line through both. That
   is all they do - they tell you when you are lined up and otherwise stay
   out of the way.

   THERE WAS ALSO POSITIONAL SNAPPING HERE, AND IT WAS A MISTAKE. It moved
   the ghost onto any edge within one tile. But placement is already
   snapped - the pointer maps to whole tiles - so "within one tile" is not
   a tolerance, it is the next square along. The effect was that you could
   not leave a one-tile gap beside anything, which is a completely normal
   thing to want, and because it ran on every render it pulled the ghost
   back every time you nudged it off. Removed. The grid is the snap; the
   guides are the feedback.

   MIRROR. A saved layout can be flipped left-to-right or top-to-bottom
   before it is stamped, which is what you want for the far side of a
   drive or the opposite corner of a yard. Press F while stamping, or use
   the buttons in the Layouts panel.

   ===================================================================== */

/* kept so alignEdges() reads the same, but nothing is disabled any more:
   the guides never take control, so there is nothing to hold a key for */

/* every edge worth lining up with: the sides of things already placed */
function alignEdges(skipId){
  const xs = [], ys = [];
  (S.objs || []).forEach(o=>{
    if(o.id === skipId) return;
    const bp = BPMAP[o.bp]; if(!bp) return;
    const f = footprint(bp, o.rot);
    xs.push({v:o.tx, o}, {v:o.tx + f.w, o});
    ys.push({v:o.ty, o}, {v:o.ty + f.h, o});
  });
  return {xs, ys};
}

/* the dashed lines, drawn through everything that now lines up */
function alignGuides(){
  if(!ghost) return '';
  const f = footprint(ghost.bp, ghost.rot);
  const {xs, ys} = alignEdges(ghost.moving);
  const gx = [ghost.tx, ghost.tx + f.w], gy = [ghost.ty, ghost.ty + f.h];
  let s = '';
  const seen = new Set();
  xs.forEach(e=>{ if(gx.includes(e.v) && !seen.has('x'+e.v)){ seen.add('x'+e.v);
    s += `<line x1="${e.v*T}" y1="${FARM.y*T}" x2="${e.v*T}" y2="${(FARM.y+FARM.h)*T}"
      stroke="#f0c14b" stroke-width="1.4" stroke-dasharray="6 6" opacity=".8"/>`; }});
  ys.forEach(e=>{ if(gy.includes(e.v) && !seen.has('y'+e.v)){ seen.add('y'+e.v);
    s += `<line x1="${FARM.x*T}" y1="${e.v*T}" x2="${(FARM.x+FARM.w)*T}" y2="${e.v*T}"
      stroke="#f0c14b" stroke-width="1.4" stroke-dasharray="6 6" opacity=".8"/>`; }});
  return s ? `<g id="aligns" pointer-events="none">${s}</g>` : '';
}

if(typeof render === 'function'){
  const _renderAlign = render;
  render = function(){
    const r = _renderAlign.apply(this, arguments);
    try{
      const old = document.getElementById('aligns');
      if(old) old.remove();
      const fg = document.getElementById('fg');
      if(fg && ghost){
        const html = alignGuides();
        if(html){
          const tmp = document.createElementNS('http://www.w3.org/2000/svg','g');
          tmp.innerHTML = html;
          fg.appendChild(tmp.firstChild);
        }
      }
    }catch(e){}
    return r;
  };
}

/* ---------- mirroring a saved layout ---------- */

/* Flip the offsets, not the art. A piece at dx with width w ends up at
   (layoutWidth - dx - w), which keeps the arrangement's outer edges where
   they were and reverses the order of everything inside it. */
function flipLayout(L, axis){
  const items = L.items.map(it=>{
    const bp = BPMAP[it.bp]; if(!bp) return it;
    const f = footprint(bp, it.rot);
    return axis === 'h'
      ? { ...it, dx: L.w - it.dx - f.w }
      : { ...it, dy: L.h - it.dy - f.h };
  });
  return { ...L, items };
}

G.flipStamp = function(axis){
  if(typeof STAMP === 'undefined' || !STAMP) return toast('Nothing being stamped','bad');
  STAMP.L = flipLayout(STAMP.L, axis || 'h');
  if(typeof paintStamp === 'function') paintStamp();
  toast(axis === 'v' ? 'Flipped top to bottom' : 'Flipped left to right','good');
};
G.flipLayoutSaved = function(lid, axis){
  const L = (S.layouts||[]).find(x=>x.id===lid); if(!L) return;
  const f = flipLayout(L, axis);
  L.items = f.items;
  G.save();
  if(typeof G.openLayouts === 'function') G.openLayouts();
  toast('Layout flipped','good');
};

window.addEventListener('keydown', e=>{
  if(e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) return;
  if(e.key.toLowerCase() === 'f' && typeof STAMP !== 'undefined' && STAMP){
    G.flipStamp(e.shiftKey ? 'v' : 'h');
  }
});

/* flip buttons in the Layouts panel */
if(typeof G.openLayouts === 'function'){
  const _openLayouts = G.openLayouts;
  G.openLayouts = function(){
    const r = _openLayouts.apply(this, arguments);
    try{
      document.querySelectorAll('button').forEach(b=>{
        if(b.textContent.trim() !== 'Stamp' || b.dataset.flipAdded) return;
        b.dataset.flipAdded = '1';
        const m = (b.getAttribute('onclick')||'').match(/G\.stampLayout\('([^']+)'\)/);
        if(!m) return;
        const mk = (label, axis, tip)=>{
          const f = document.createElement('button');
          f.className = 'btn ghost'; f.textContent = label;
          f.style.cssText = 'padding:6px 9px';
          f.dataset.tip = tip;
          f.setAttribute('onclick', `G.flipLayoutSaved('${m[1]}','${axis}')`);
          return f;
        };
        b.parentNode.insertBefore(mk('⇋','h','<b>Flip left to right</b>Mirrors the arrangement.'), b);
        b.parentNode.insertBefore(mk('⇅','v','<b>Flip top to bottom</b>Mirrors the arrangement.'), b);
      });
    }catch(e){}
    return r;
  };
}

/* ---------- handle ---------- */
G.alignAudit = function(){
  const e = alignEdges(0);
  return {
    edgesTracked: { x:e.xs.length, y:e.ys.length },
    positionalSnapping: 'removed - it prevented one-tile gaps',
    ghostActive: !!ghost,
    guidesDrawn: ghost ? (alignGuides().match(/<line/g)||[]).length : 0,
    stampFlipBound: typeof G.flipStamp === 'function',
  };
};
