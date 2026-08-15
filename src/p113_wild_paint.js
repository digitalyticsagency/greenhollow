/* =====================================================================
   THE FOX WAS THERE. NOTHING DREW IT.

   Reported as the fox not being visible — not the button, the animal.
   Correct, and it is the same class of fault as the dog earlier in this
   project: the thing exists, it moves, it gets chased, and no element on
   the page represents it.

   paintWild() finds an animal's element with

       layer.querySelector(`[data-w="${w.id}"]`)

   and moves it. It never creates one. The elements come from render(),
   which emits the whole wildlife layer along with the rest of the scene.
   Summoning does not call render(), and on a farm that is sitting still
   render() may not run for minutes — so pressing the button spawned a
   badger into S.wild, the chase drove it around, the dog gave chase, the
   log narrated all of it, and the screen showed an empty field.

   Measured: one animal in state, `#wildlife` layer absent entirely, zero
   elements, so paintWild's lookup returned null on every frame.

   THE FIX IS THE ONE THE REST OF THIS CODEBASE ALREADY USES. The ghost
   layer, the chase layer, the dragon layer and the dog all build
   themselves on demand and paint by moving what they built. Wildlife now
   does the same: the layer is created if missing, an element is created
   for any animal that lacks one, and elements for animals that have gone
   are removed. It no longer depends on a full scene redraw ever
   happening, which is what made it invisible.
   ===================================================================== */

function wildLayerEl(){
  let g = document.getElementById('wildlife');
  if(!g){
    const fg = document.getElementById('fg');
    if(!fg) return null;
    g = document.createElementNS('http://www.w3.org/2000/svg','g');
    g.id = 'wildlife';
    g.setAttribute('pointer-events','none');
    fg.appendChild(g);
  }
  return g;
}

/* build or drop elements so the layer matches what is actually out there */
function syncWildElements(){
  const g = wildLayerEl(); if(!g) return null;
  const list = (typeof wildList === 'function') ? wildList() : (S.wild || []);
  const want = {};
  list.forEach(w=>{ want[w.id] = w; });

  /* remove anything that has gone home */
  [...g.children].forEach(el=>{
    const id = el.getAttribute('data-w');
    if(!want[id]) el.remove();
  });

  /* create anything new */
  list.forEach(w=>{
    if(g.querySelector(`[data-w="${w.id}"]`)) return;
    const sp = WILD[w.k]; if(!sp) return;
    const el = document.createElementNS('http://www.w3.org/2000/svg','g');
    el.setAttribute('data-w', w.id);
    el.setAttribute('class', `wild ${w.k} ${w.state||''}`);
    /* the inner group carries the facing flip, which is what paintWild
       reaches for with querySelector('g') */
    let art = '';
    try{ art = wildArt(w); }catch(e){ art = `<circle r="6" fill="#a8663a"/>`; }
    el.innerHTML = `<g>${art}</g>`;
    g.appendChild(el);
  });
  return g;
}

/* paintWild moves elements; it now also makes sure they exist */
if(typeof paintWild === 'function'){
  const _paintWildBase = paintWild;
  paintWild = function(){
    try{ syncWildElements(); }catch(e){}
    return _paintWildBase.apply(this, arguments);
  };
}

/* and paint the moment something arrives, rather than waiting for a frame */
if(typeof spawnWild === 'function'){
  const _spawnWildPaint = spawnWild;
  spawnWild = function(){
    const w = _spawnWildPaint.apply(this, arguments);
    try{ paintWild(); }catch(e){}
    return w;
  };
}
if(typeof G.summonWildlife === 'function'){
  const _summonPaint = G.summonWildlife;
  G.summonWildlife = function(){
    const r = _summonPaint.apply(this, arguments);
    try{ paintWild(); }catch(e){}
    return r;
  };
}

/* ---------- handle ---------- */
G.wildPaintAudit = function(){
  const g = document.getElementById('wildlife');
  const list = (typeof wildList === 'function') ? wildList() : (S.wild || []);
  return {
    animalsInState: list.length,
    layerExists: !!g,
    elementsDrawn: g ? g.children.length : 0,
    everyAnimalDrawn: list.every(w=>g && g.querySelector(`[data-w="${w.id}"]`)),
    each: list.map(w=>{
      const el = g && g.querySelector(`[data-w="${w.id}"]`);
      return `${WILD[w.k].n}: ${el ? 'drawn at ' + (el.getAttribute('transform')||'0,0') : 'MISSING'}`;
    }),
    wasBefore: 'elements only ever came from a full render(); summoning never triggered one',
  };
};
