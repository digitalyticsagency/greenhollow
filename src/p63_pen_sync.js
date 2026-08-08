/* =====================================================================
   THE ANIMALS WERE NEVER WHERE THE SIMULATION THOUGHT

   This is the actual cause of "the animals are outside their boundary",
   and I missed it three times because every audit I wrote measured a.x -
   the simulated position - which was always clean.

   An animal is drawn at a base point and then moved with a CSS
   translate of (a.x - a.bx). paddock() picked the base with
   baseSpot(i, SEED) using the artwork's seed - 7 for a coop, 15 for
   sheep, 23 for an apiary. mindFor() picked a.bx with
   baseSpot(i, o.id*3.7). Two different seeds, two different points, so
   the delta was measured from an origin the element does not have.

   Measured across seven pens: 39 of 40 animals rendered more than 10px
   from their simulated position, worst case 140px in a pasture 200px
   wide. That is an animal standing most of a pen away from where the
   containment logic believes it is, which is exactly what it looked
   like.

   The fix is to stop guessing. Each drawn animal now carries the base it
   was actually drawn at, and the position writer reads that instead of
   assuming. Ducks and bees get the same treatment - their art never used
   baseSpot at all.
   ===================================================================== */

/* ---------- 1. every drawn animal declares its own base ---------- */
if(typeof paddock === 'function'){
  paddock = function(w, h, kind, cnt, seed, sc){
    const b = shelterBox(w, h);
    let s = patch(w,h,'#84ad57',seed,1);
    s += `<rect x="1.5" y="1.5" width="${n(w-3)}" height="${n(h-3)}" rx="2.5" fill="none" stroke="#00000033" stroke-width="2.6"/>`;
    s += `<rect x="1.5" y="1.5" width="${n(w-3)}" height="${n(h-3)}" rx="2.5" fill="none" stroke="#a8814f" stroke-width="1.3"/>`;
    for(let x=2;x<w-2;x+=11){ s += `<rect x="${n(x-1)}" y="0" width="2" height="4" rx="1" fill="#7d5931"/>`;
                              s += `<rect x="${n(x-1)}" y="${n(h-4)}" width="2" height="4" rx="1" fill="#7d5931"/>`; }
    for(let y=2;y<h-2;y+=11){ s += `<rect x="0" y="${n(y-1)}" width="4" height="2" rx="1" fill="#7d5931"/>`;
                              s += `<rect x="${n(w-4)}" y="${n(y-1)}" width="4" height="2" rx="1" fill="#7d5931"/>`; }
    s += `<g class="shed-in">${shedFittings(kind, b)}</g>`;

    const cx = w/2, cy = h/2;
    for(let i=0;i<cnt;i++){
      const p = baseSpot(i, seed, w, h);
      const dx = (cx - p.x) * 0.82, dy = (cy - p.y) * 0.82;
      /* data-bx / data-by are the whole point: the position writer reads
         these rather than recomputing a base from a different seed */
      s += `<g class="pen-animal a3 a3-graze" data-ai="${i}" data-bx="${n(p.x)}" data-by="${n(p.y)}"
        style="--hx:${n(dx)}px; --hy:${n(dy)}px;
        animation-delay:-${(hash(i*7.1+seed)*3).toFixed(1)}s">${beast(kind, p.x, p.y, sc||1)}</g>`;
    }
    s += shedRoof(b);
    return s;
  };
}

/* ducks: their art placed them on the water and never used baseSpot */
if(typeof ART === 'object' && ART.duck_pond){
  ART.duck_pond = (w,h,ob)=>{
    const cnt = ob ? Math.min(8, ob.animals||0) : 3;
    const p = pondRect(w,h), b = shelterBox(w,h);
    let s = patch(w,h,'#84ad57',19,1);
    s += `<g transform="translate(${n(p.x)},${n(p.y)})">${water(p.w, p.h, 19)}</g>`;
    s += `<ellipse cx="${n(p.x+p.w*0.5)}" cy="${n(p.y)}" rx="${n(p.w*0.34)}" ry="4" fill="#9c8557" opacity=".55"/>`;
    s += `<g class="shed-in">${duckHouseFittings(b)}</g>`;
    const cx = w/2, cy = h/2;
    for(let i=0;i<cnt;i++){
      /* on the water, and declared, so the mind and the drawing agree */
      const t  = hash(i*2.9+19)*Math.PI*2, r = Math.sqrt(hash(i*4.3+19));
      const bx = p.x + p.w/2 + Math.cos(t)*(p.w/2)*0.78*r;
      const by = p.y + p.h/2 + Math.sin(t)*(p.h/2)*0.74*r;
      const hx = (cx - bx)*0.82, hy = (cy - by)*0.82;
      s += `<g class="pen-animal a3" data-ai="${i}" data-bx="${n(bx)}" data-by="${n(by)}"
        style="--hx:${n(hx)}px; --hy:${n(hy)}px;
        animation-delay:-${(hash(i*7.1+19)*3).toFixed(1)}s">${beast('duck', bx, by, 0.9)}</g>`;
    }
    s += shedRoof(b);
    if(ob && ob.ready>0) s += `<circle class="pulse" cx="${n(w-6)}" cy="6" r="3.4" fill="#f0c14b"/>`;
    return s;
  };
}

/* bees: same problem, same fix */
if(typeof ART === 'object' && ART.apiary){
  const _apiaryPrev = ART.apiary;
  ART.apiary = (w,h,ob)=>{
    let s = _apiaryPrev(w,h,ob);
    /* strip the bees the previous wrapper added and re-emit them with a
       declared base */
    s = s.replace(/<g class="pen-animal"[\s\S]*?<\/g><\/g>/g, '');
    const head = ob ? Math.min(8, ob.animals || 0) : 3;
    const row = (typeof hiveRow === 'function') ? hiveRow(w,h) : {x:3,y:h/2-7,w:w-6,h:14};
    for(let i=0;i<head;i++){
      const bx = row.x + 4 + hash(i*2.9+23)*Math.max(4, row.w-8);
      const by = row.y + row.h/2 + (hash(i*4.3+23)-0.5)*h*0.5;
      s += `<g class="pen-animal" data-ai="${i}" data-bx="${n(bx)}" data-by="${n(by)}"
        style="--hx:0px; --hy:0px; animation-delay:-${(hash(i*7.1+23)*3).toFixed(1)}s">${
        beeBody(bx, by, 1)}</g>`;
    }
    return s;
  };
}

/* ---------- 2. the mind adopts the base that was drawn ---------- */
/* Read once per element, then cached on the animal. If the element is
   not in the DOM yet the old value stands until the next sync, which is
   at most one frame. */
function syncAnimalTransforms(){
  if(typeof MINDS === 'undefined') return;
  MINDS.forEach((m, id)=>{
    const el = document.querySelector(`.ob[data-id="${id}"]`);
    if(!el) return;
    m.list.forEach(a=>{
      const g = el.querySelector(`.pen-animal[data-ai="${a.i}"]`);
      if(!g) return;
      const bx = parseFloat(g.dataset.bx), by = parseFloat(g.dataset.by);
      if(!isNaN(bx) && !isNaN(by)){
        /* first sight of the real base: move the animal there rather than
           teleporting it, so a reload does not scatter the pen */
        if(a.bx !== bx || a.by !== by){
          if(a._based){ a.x += (bx - a.bx); a.y += (by - a.by); }
          else { a.x = bx; a.y = by; a._based = true; }
          a.bx = bx; a.by = by;
        }
      }
      g.style.translate = `${n(a.x - a.bx)}px ${n(a.y - a.by)}px`;
      g.classList.toggle('a-inside', !!a.inside);
      g.classList.toggle('a-away', !!a.away);
    });
  });
}

if(typeof reapplyAnimalPositions === 'function'){
  reapplyAnimalPositions = function(){ syncAnimalTransforms(); };
}

const _tickPeopleSync = tickPeople;
tickPeople = function(dt){
  const r = _tickPeopleSync.apply(this, arguments);
  if(S && S.speed !== 0){ try{ syncAnimalTransforms(); }catch(e){} }
  return r;
};

/* ---------- 3. an audit that measures what is on screen ---------- */
/* The old one compared a.x against the ellipse and always passed. This
   one reads the rendered rectangle, which is the only number that
   matters. */
G.penCheck = function(){
  const out = [];
  (typeof stockPens === 'function' ? stockPens() : []).forEach(o=>{
    const m = MINDS.get(o.id); if(!m) return;
    const el = document.querySelector(`.ob[data-id="${o.id}"]`);
    if(!el){ out.push({pen:o.bp, note:'not drawn'}); return; }
    const pr = el.getBoundingClientRect();
    const f  = footprint(BPMAP[o.bp], o.rot);
    const scale = pr.width / (f.w*T);
    let worstErr = 0, outsidePen = 0;
    m.list.forEach(a=>{
      const g = el.querySelector(`.pen-animal[data-ai="${a.i}"]`);
      if(!g || a.away) return;
      const r = g.getBoundingClientRect();
      const lx = (r.left + r.width/2 - pr.left)/scale;
      const ly = (r.top  + r.height/2 - pr.top )/scale;
      worstErr = Math.max(worstErr, Math.hypot(lx-a.x, ly-a.y));
      if(lx < 0 || ly < 0 || lx > f.w*T || ly > f.h*T) outsidePen++;
    });
    out.push({ pen:o.bp, head:m.list.length,
               worstDrawErrPx: Math.round(worstErr),
               renderedOutsidePen: outsidePen });
  });
  return out;
};
