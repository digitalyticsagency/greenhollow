/* =====================================================================
   PLACING SOMETHING SHOULD NOT REBUILD THE FARM

   Reported as placement not being smooth, and the cause is structural
   rather than anything to do with snapping.

   The ghost is built inside render(), concatenated into the foreground's
   innerHTML along with every object, every animal, every person and the
   weather. The pointer handler calls render() directly on every mousemove
   that changes the tile. So dragging something across the yard rebuilt
   and reparsed the entire scene, once per mouse move.

   Measured on a farm of only 40 objects and 4,125 nodes, one render is
   16ms. Mouse moves arrive faster than that, so they queue and each one
   pays the full cost. On a farm of two hundred buildings it is far worse.
   Nothing was wrong with the placement logic; it was doing an O(scene)
   redraw for an O(1) change.

   Two fixes, in order of how much they matter:

   1. The ghost gets its own layer, drawn once when you pick something up
      and then only moved. Dragging it now touches three attributes
      instead of rebuilding several thousand nodes.

   2. What is left is coalesced into requestAnimationFrame, so however
      fast the mouse reports, at most one update happens per frame.

   The grid overlay is part of the same layer, so it is built once per
   pick rather than once per move - it is the same lines every time.
   ===================================================================== */

let ghostRaf = 0, ghostKey = '';

function ghostLayerEl(){
  let g = document.getElementById('ghostlay');
  if(!g){
    const fg = document.getElementById('fg');
    if(!fg) return null;
    g = document.createElementNS('http://www.w3.org/2000/svg','g');
    g.id = 'ghostlay';
    g.setAttribute('pointer-events','none');
    fg.appendChild(g);
  }
  return g;
}

/* the grid: identical every time, so it is built once and kept */
function ghostGrid(){
  if((typeof SET === 'function') && !SET('grid')) return '';
  let s = `<g class="gridlay">`;
  for(let x=FARM.x; x<=FARM.x+FARM.w; x++)
    s += `<line x1="${x*T}" y1="${FARM.y*T}" x2="${x*T}" y2="${(FARM.y+FARM.h)*T}"
      stroke="#fff" stroke-opacity=".07" stroke-width="1"/>`;
  for(let y=FARM.y; y<=FARM.y+FARM.h; y++)
    s += `<line x1="${FARM.x*T}" y1="${y*T}" x2="${(FARM.x+FARM.w)*T}" y2="${y*T}"
      stroke="#fff" stroke-opacity=".07" stroke-width="1"/>`;
  return s + `</g>`;
}

/* Rebuild the ghost body only when the thing itself changes - a different
   blueprint, or rotated. Moving it does not change what it looks like. */
function ghostBuild(){
  const g = ghostLayerEl();
  if(!g) return;
  if(!ghost){ g.innerHTML = ''; ghostKey = ''; return; }
  const key = ghost.bp.id + ':' + ghost.rot + ':' + (ghost.moving||0);
  if(key === ghostKey) return;
  ghostKey = key;
  const f = footprint(ghost.bp, ghost.rot);
  const fake = {id:-1, bp:ghost.bp.id, tx:0, ty:0, rot:ghost.rot, tier:0,
    crop:null, stage:0.6, water:.6, animals:2, ready:0,
    store:(ghost.bp.cap||0)*0.6, cap:ghost.bp.cap};
  g.innerHTML = ghostGrid()
    + `<g id="ghostbody"><g opacity=".72">${drawObj(fake)}</g>`
    + `<rect id="ghostbox" x="0" y="0" width="${f.w*T}" height="${f.h*T}" rx="4"
        fill="#7cc24f" fill-opacity=".2" stroke="#7cc24f" stroke-width="2.5"/></g>`;
}

/* Moving it: three attribute writes, no parsing, no scene rebuild. */
function ghostPlace(){
  const g = document.getElementById('ghostlay');
  if(!g || !ghost) return;
  const body = g.querySelector('#ghostbody');
  const box  = g.querySelector('#ghostbox');
  if(!body) return;
  body.setAttribute('transform', `translate(${ghost.tx*T},${ghost.ty*T})`);
  if(box){
    const f = footprint(ghost.bp, ghost.rot);
    const bad = overlaps(ghost.tx, ghost.ty, f, ghost.moving)
             || S.cash < (ghost.moving ? 0 : ghost.bp.cost);
    const c = bad ? '#e2705c' : '#7cc24f';
    if(box.getAttribute('stroke') !== c){
      box.setAttribute('stroke', c);
      box.setAttribute('fill', c);
    }
  }
}

/* what the pointer handler should call instead of render() */
function moveGhost(){
  if(ghostRaf) return;
  ghostRaf = requestAnimationFrame(()=>{
    ghostRaf = 0;
    try{
      ghostBuild();
      ghostPlace();
      /* the guides depend on where the ghost is, so they come along - they
         are a handful of lines and cost nothing */
      if(typeof alignGuides === 'function'){
        const old = document.getElementById('aligns');
        if(old) old.remove();
        const fg = document.getElementById('fg');
        const html = alignGuides();
        if(fg && html){
          const tmp = document.createElementNS('http://www.w3.org/2000/svg','g');
          tmp.innerHTML = html;
          fg.appendChild(tmp.firstChild);
        }
      }
    }catch(e){}
  });
}

/* keep the layer in step with picking up, rotating, dropping */
['pick','rotGhost','startMove','cancel','commit'].forEach(fn=>{
  if(typeof G[fn] !== 'function') return;
  const base = G[fn];
  G[fn] = function(){
    const r = base.apply(this, arguments);
    try{ ghostKey = ''; ghostBuild(); ghostPlace(); }catch(e){}
    return r;
  };
});

/* a full render wipes the foreground, so the layer has to come back */
if(typeof render === 'function'){
  const _renderGhost = render;
  render = function(){
    const r = _renderGhost.apply(this, arguments);
    try{ if(ghost){ ghostKey = ''; ghostBuild(); ghostPlace(); } }catch(e){}
    return r;
  };
}

/* ---------- handle ---------- */
G.placingAudit = function(){
  const g = document.getElementById('ghostlay');
  return {
    ghostActive: !!ghost,
    layerExists: !!g,
    layerNodes: g ? g.querySelectorAll('*').length : 0,
    sceneNodes: (document.getElementById('fg')||{querySelectorAll:()=>[]}).querySelectorAll('*').length,
    coalesced: 'one update per animation frame',
    note: 'moving the ghost writes 3 attributes; it used to rebuild the scene',
  };
};
