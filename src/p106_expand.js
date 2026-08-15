/* =====================================================================
   LAND ON WHICHEVER SIDE YOU WANT

   Reported as: the adjoining paddock always arrives on the right and
   below. That is exactly what expandFarm() does - `FARM.w += addW;
   FARM.h += addH;` and nothing else. FARM.x and FARM.y never move, so
   every parcel you will ever buy is bolted onto the same two edges. Over
   ten expansions the property grows away from the house in one direction
   and the house ends up in a corner.

   And yes, it should be all four. A neighbour's paddock is not always to
   the south-east, and where you extend is one of the few genuinely
   spatial decisions the game offers.

   NORTH AND WEST NEED THE CONTENT MOVED, WHICH IS THE WHOLE DIFFICULTY.
   Growing east or south only changes FARM.w/FARM.h and nothing already
   placed is affected. Growing north or west means FARM.y or FARM.x has to
   come down, and if there is not enough clear ground before the edge of
   the world, everything on the map has to shift to make room: every
   object's tile, every person, the dog, the wildlife, the worn-ground
   grid, and the saved lot rectangles from p77. Miss one of those and the
   farm quietly tears in half.

   So the shift is done in one place, applied to every list that holds a
   position, and the audit below reports what moved. Nothing is destroyed
   at any point - a shift is addition only.
   ===================================================================== */

/* move everything on the map by whole tiles */
function shiftWorld(dtx, dty){
  if(!dtx && !dty) return { moved:0 };
  const dx = dtx*T, dy = dty*T;
  let moved = 0;

  (S.objs || []).forEach(o=>{ o.tx += dtx; o.ty += dty; moved++; });

  const people = [].concat(S.family || [], S.workers || [], S.guests || [],
                           S.you ? [S.you] : [], S.dog ? [S.dog] : [], S.wild || []);
  people.forEach(p=>{ if(p && p.x !== undefined){ p.x += dx; p.y += dy; moved++; }
    if(p && p.path) p.path.forEach(q=>{ if(q){ q.x += dx; q.y += dy; } }); });

  /* the worn-ground map is keyed by tile, so its keys are positions too */
  if(S.ground){
    const g2 = {};
    Object.keys(S.ground).forEach(k=>{
      const [x,y] = k.split(',').map(Number);
      g2[(x+dtx) + ',' + (y+dty)] = S.ground[k];
    });
    S.ground = g2;
  }
  /* the separate lots bought in p77 */
  if(Array.isArray(S.lots)) S.lots.forEach(r=>{ if(r){ r.x += dtx; r.y += dty; } });

  FARM.x += dtx; FARM.y += dty;
  return { moved };
}

/* is there clear ground before the edge of the world on that side? */
function roomOn(dir, sz){
  if(dir === 'W') return FARM.x - sz.w >= 1;
  if(dir === 'N') return FARM.y - sz.h >= 1;
  return true;                      /* east and south grow the canvas */
}

G.expandTo = function(dir){
  if(typeof canExpand === 'function' && !canExpand())
    return toast('No more adjoining land for sale','bad'), sfx('error');
  const c = expandCost();
  if(S.cash < c) return toast(`The neighbour wants ${fmt(c)} for it`,'bad'), sfx('error');
  const sz = expandSize();

  /* make room first if it is needed, then take the money */
  if(dir === 'W' && !roomOn('W', sz)){
    const need = sz.w - FARM.x + 1;
    if(FARM.x + FARM.w + need > WT-2){ WT += need+2; WPX = WT*T; }
    shiftWorld(need, 0);
  }
  if(dir === 'N' && !roomOn('N', sz)){
    const need = sz.h - FARM.y + 1;
    if(FARM.y + FARM.h + need > HT-2){ HT += need+2; HPX = HT*T; }
    shiftWorld(0, need);
  }

  S.cash -= c;
  S.expansions = (S.expansions||0) + 1;

  if(dir === 'E'){
    if(FARM.x + FARM.w + sz.w > WT-2){ WT += sz.w+2; WPX = WT*T; }
    FARM.w += sz.w;
  } else if(dir === 'S'){
    if(FARM.y + FARM.h + sz.h > HT-2){ HT += sz.h+2; HPX = HT*T; }
    FARM.h += sz.h;
  } else if(dir === 'W'){
    FARM.x -= sz.w; FARM.w += sz.w;
  } else if(dir === 'N'){
    FARM.y -= sz.h; FARM.h += sz.h;
  }

  terrainCache = '';
  try{ bgToken = ''; }catch(e){}
  sfx('upgrade');
  const side = {N:'north', S:'south', E:'east', W:'west'}[dir] || dir;
  toast(`Bought the paddock to the ${side} — ${FARM.w}×${FARM.h} now`,'gold');
  log(`Bought ${sz.w}×${sz.h} tiles to the ${side} for ${fmt(c)}. Rates will rise.`,'gold','money');
  render(); if(typeof fitView === 'function') fitView(); ui(); G.save();
};

/* the old single button keeps working, and means south-east */
if(typeof expandFarm === 'function'){
  expandFarm = function(){ return G.expandTo('E'); };
}

/* ---------- four buttons instead of one ----------
   The expansion card is injected into #buildList by a renderBuild wrapper
   in p17 rather than returned by any panel function, so there is nothing
   to wrap that returns markup — the buttons are appended to the card
   after it has been built. */
function addDirButtons(){
  try{
    const list = document.getElementById('buildList');
    if(!list) return;

    /* When the neighbours have sold you everything, p17 stops drawing the
       card at all — so the option to extend simply vanished with no word
       about why, which reads as broken. It was reported as exactly that.
       Say so, and point at the route that is still open. */
    if(typeof canExpand === 'function' && !canExpand()){
      if(list.querySelector('.dirpad-none')) return;
      const more = (typeof canBuyLot === 'function') && canBuyLot();
      const div = document.createElement('div');
      div.className = 'card dirpad-none';
      div.style.margin = '10px';
      div.innerHTML = `<b style="font-size:12px">The neighbours have no more land</b>
        <div class="muted" style="margin-top:4px">All ${typeof EXPAND_MAX!=='undefined'?EXPAND_MAX:'the'} adjoining
        parcels are yours — the property is ${FARM.w}×${FARM.h}.</div>` +
        (more ? `<div class="muted" style="margin-top:5px">There is still a separate block to buy in the Land tab.</div>`
              : `<div class="muted" style="margin-top:5px">Every block is bought. This is as big as the valley gets.</div>`);
      list.appendChild(div);
      return;
    }

    const card = [...list.querySelectorAll('.card')]
      .find(c=>/Buy adjoining land/.test(c.textContent));
    if(!card || card.querySelector('.dirpad')) return;
    const c = expandCost(), sz = expandSize();
    const afford = S.cash >= c;
    const pad = document.createElement('div');
    pad.className = 'dirpad';
    pad.style.cssText = 'margin-top:8px';
    pad.innerHTML = `<div class="muted" style="font-size:11px;margin-bottom:4px">Which side?</div>
      <div style="display:flex;gap:4px;flex-wrap:wrap">` +
      [['N','North'],['W','West'],['E','East'],['S','South']].map(([d,label])=>{
        const room = roomOn(d, sz);
        const note = room ? '' : ' \u2014 the farm shifts to make room';
        return `<button class="chip" ${afford?'':'disabled'} onclick="G.expandTo('${d}')"
          data-tip="${esc(`<b>Buy to the ${label.toLowerCase()}</b>Adds a ${sz.w}\u00d7${sz.h} strip on that side${note}.<hr><div class="tl"><span>Price</span><span class="tk">${fmt(c)}</span></div>`)}">${label}</button>`;
      }).join('') + `</div>` +
      (afford ? '' : `<div class="muted" style="font-size:11px;margin-top:5px">You have ${fmt(S.cash)} — the next parcel is ${fmt(c)}.</div>`);
    card.appendChild(pad);
  }catch(e){}
}
if(typeof renderBuild === 'function'){
  const _renderBuildDir = renderBuild;
  renderBuild = function(){
    const r = _renderBuildDir.apply(this, arguments);
    try{ addDirButtons(); }catch(e){}
    return r;
  };
}

/* ---------- handle ---------- */
G.expandAudit = function(){
  const sz = (typeof expandSize === 'function') ? expandSize() : {w:0,h:0};
  return {
    farm: `${FARM.w}×${FARM.h} at (${FARM.x},${FARM.y})`,
    world: `${WT}×${HT}`,
    parcel: `${sz.w}×${sz.h}`,
    expansions: `${S.expansions||0} of ${typeof EXPAND_MAX!=='undefined'?EXPAND_MAX:'?'}`,
    roomWithoutShifting: ['N','S','E','W'].filter(d=>roomOn(d, sz)),
    wasBefore: 'every parcel bolted onto the right and bottom edges only',
  };
};
