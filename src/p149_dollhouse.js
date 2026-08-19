/* =====================================================================
   THE HOUSE, IN CROSS-SECTION

   Lift the roof and you can see the rooms, the beds, the oven and the
   bunks. p33 already stops hiding people when the roof is up, so the
   household is in there — but standing bolt upright in their own beds at
   two in the morning, with nothing to say what any of them is doing.

   Three things make it a dollhouse rather than a cutaway.

   THEY LIE DOWN. p36 gave you a sleeping pose and nobody else got one, so
   you were the only person in the valley who went to bed properly. The
   same rotation now applies to the partner, the children and the
   farmhands, and only when the roof is up — asleep with the roof on is
   still simply hidden, because you cannot see through a roof.

   THEY SAY WHAT THEY ARE DOING. Everyone already carries an act — 'asleep',
   'having breakfast', 'working in the dairy', 'carrying it into the shed'
   — set by the routine and by the shift system. With the roof up it is
   written under them, so a glance across the farm reads as a set of
   simultaneous activities rather than a set of figures.

   AND YOU CAN READ THE WHOLE HOUSEHOLD AT ONCE. A roster, live, of every
   person on the place: which room or which building they are in, what
   they are doing, and whether they are asleep. Sorted by building so the
   dairy shows you its two hands together. Click anyone and the camera
   goes to them.

   Nothing here is new simulation. Every fact on the panel is one the farm
   was already keeping and had no way of telling you.
   ===================================================================== */

/* ---------- where is this person, in words ---------- */
function whereIs(p){
  if(!p) return { place:'—', indoors:false };
  /* the house first, because it has rooms and everything else does not */
  const H = (typeof houseRect === 'function') ? houseRect() : null;
  if(H && p.x >= H.x && p.x <= H.x + H.w && p.y >= H.y && p.y <= H.y + H.h){
    let room = 'the house';
    try{
      const { plan, map } = roomOwners();
      const key = map[p.id];
      const r = key && plan.rooms.find(x=>x.k === key);
      if(r && r.label) room = r.label;
      else {
        /* not their own room — find whichever room they are standing in */
        const hit = plan.rooms.find(x=>{
          const rx = H.x + x.x*H.w, ry = H.y + x.y*H.h;
          return p.x >= rx && p.x <= rx + x.w*H.w && p.y >= ry && p.y <= ry + x.h*H.h;
        });
        if(hit && hit.label) room = hit.label;
      }
    }catch(e){}
    return { place:room, indoors:true, home:true };
  }
  /* otherwise, whichever building they are standing in */
  const o = (S.objs || []).find(ob=>{
    const bp = BPMAP[ob.bp]; if(!bp) return false;
    const f = footprint(bp, ob.rot);
    return p.x >= ob.tx*T && p.x <= (ob.tx+f.w)*T && p.y >= ob.ty*T && p.y <= (ob.ty+f.h)*T;
  });
  if(o) return { place:(BPMAP[o.bp] || {}).name || o.bp, indoors:true, obj:o };
  return { place:'outside', indoors:false };
}

/* NOT household() — p86_meals declares that and expects a number, 1 + the
   family. Declaring a second household() here silently replaced it, and
   p86's `bill = 14 * want` became 14 * an array, which is NaN, which went
   straight into S.cash the first evening the barn was empty. That was the
   A$NaN on the cash pill. Function declarations are not covered by the
   build guard, so nothing caught it. */
function dollFolk(){
  const rows = [];
  if(S.you) rows.push({ id:'__you', name:'You', role:'you', p:S.you });
  (S.family || []).forEach(f=>rows.push({ id:f.id, name:f.name, role:f.role, p:f }));
  (S.workers || []).forEach(w=>rows.push({ id:w.id, name:w.name, role:'farmhand', p:w }));
  (S.guests || []).forEach(g=>rows.push({ id:g.id, name:g.name, role:'guest', p:g }));
  return rows.map(r=>{
    const w = whereIs(r.p);
    /* p42 parks a guest with the act 'inside', which is true at any hour and
       reads oddly at two in the morning. After dark, inside means asleep. */
    let night = false;
    try{ night = (typeof isNight === 'function') && isNight(); }catch(e){}
    const guestAbed = r.role === 'guest' && night && (r.p.act === 'inside' || r.p.inside);
    const asleep = r.p.state === 'sleep' || r.p.act === 'asleep' || guestAbed;
    return { ...r, where:w.place, indoors:w.indoors,
      act: asleep ? 'asleep' : (r.p.act || 'about the place'),
      asleep };
  });
}

/* ---------- they lie down, and they say what they are doing ---------- */
let DOLL_DIRTY = false;
function dollTick(){
  const roofOff = (typeof SET === 'function') && SET('roofOff');
  /* With the roof on there is nothing to pose and nothing to caption, so
     skip the per-person querySelector entirely; one flag says whether
     there is anything left to clean up from the last time the roof was
     off. Worth being straight about the size of this: the whole dollhouse
     costs 0.064ms of a 0.88ms tick, measured by neutralising dollTick and
     re-running the same farm. The tick got slower than the old 0.38ms
     baseline because the test farm grew, not because of this. */
  if(!roofOff && !DOLL_DIRTY) return;
  DOLL_DIRTY = roofOff;
  const all = (S.family || []).concat(S.workers || []);
  all.forEach(p=>{
    const el = document.querySelector(`[data-p="${p.id}"]`);
    if(!el) return;
    const asleep = p.state === 'sleep' || p.act === 'asleep';
    /* the pose only makes sense when you can see in */
    el.classList.toggle('lying', !!(roofOff && asleep));

    let lab = el.querySelector('.dollact');
    if(roofOff && p.act){
      if(!lab){
        lab = document.createElementNS('http://www.w3.org/2000/svg','text');
        lab.setAttribute('class','dollact');
        lab.setAttribute('y','16');
        lab.setAttribute('text-anchor','middle');
        el.appendChild(lab);
      }
      const t = p.act.length > 26 ? p.act.slice(0, 25) + '…' : p.act;
      if(lab.textContent !== t) lab.textContent = t;
    } else if(lab) lab.remove();
  });
}
if(typeof paintPeople === 'function'){
  const _paintDoll = paintPeople;
  paintPeople = function(){
    const r = _paintDoll.apply(this, arguments);
    try{ dollTick(); }catch(e){}
    return r;
  };
}

/* ---------- the roster ---------- */
let DOLL_TIMER = null;
G.openHousehold = function(){
  modal(`<h2>Who is where</h2>
    <p class="sub">Everyone on the place, and what they are doing right now.
      ${(typeof SET === 'function' && SET('roofOff')) ? 'The roof is up, so you can see them.'
        : 'Turn the roof off to see them indoors.'}</p>
    <div id="dollrows" class="rows"></div>
    <div class="mfoot">
      <button class="btn ghost" onclick="G.closeHousehold()">Close</button>
      <button class="btn" onclick="G.toggleRoofForDoll()">${
        (typeof SET === 'function' && SET('roofOff')) ? 'Put the roof back' : 'Take the roof off'}</button>
    </div>`);
  dollRows();
  if(DOLL_TIMER) clearInterval(DOLL_TIMER);
  DOLL_TIMER = setInterval(()=>{
    if(!document.getElementById('dollrows')){ clearInterval(DOLL_TIMER); DOLL_TIMER = null; return; }
    dollRows();
  }, 700);
};
G.closeHousehold = function(){
  if(DOLL_TIMER){ clearInterval(DOLL_TIMER); DOLL_TIMER = null; }
  G.closeModal();
};
G.toggleRoofForDoll = function(){
  try{
    settingsInit();
    S.settings.roofOff = !S.settings.roofOff;
    if(typeof render === 'function') render();
    if(typeof paintPeople === 'function') paintPeople();
  }catch(e){}
  G.openHousehold();
};
G.goToPerson = function(id){
  const row = dollFolk().find(r=>r.id === id);
  if(!row || !row.p) return;
  try{
    if(typeof G.focusAt === 'function') G.focusAt(row.p.x, row.p.y);
    else if(typeof cam === 'object'){
      cam.x = -row.p.x*cam.z + (window.innerWidth || 900)/2;
      cam.y = -row.p.y*cam.z + (window.innerHeight || 600)/2;
      if(typeof applyCam === 'function') applyCam();
    }
  }catch(e){}
};

function dollRows(){
  const box = document.getElementById('dollrows');
  if(!box) return;
  const rows = dollFolk();
  /* grouped by where they are, so the dairy shows its two hands together */
  const by = {};
  rows.forEach(r=>{ (by[r.where] = by[r.where] || []).push(r); });
  const order = Object.keys(by).sort((a,b)=>{
    if(a === 'outside') return 1; if(b === 'outside') return -1;
    return by[b].length - by[a].length || a.localeCompare(b);
  });
  let h = '';
  order.forEach(place=>{
    h += `<div class="dollplace">${place}<span>${by[place].length}</span></div>`;
    by[place].forEach(r=>{
      h += `<div class="row dollrow" onclick="G.goToPerson('${r.id}')">
        <span><b>${r.name}</b> <span class="muted">${r.role}</span></span>
        <b class="${r.asleep ? 'dollsleep' : ''}">${r.asleep ? 'asleep' : r.act}</b></div>`;
    });
  });
  box.innerHTML = h || `<p class="sub">Nobody is about.</p>`;
}

/* a button by the others */
if(typeof syncWorldButtons === 'function'){
  const _syncDoll = syncWorldButtons;
  syncWorldButtons = function(){
    const r = _syncDoll.apply(this, arguments);
    try{
      const host = document.getElementById('zoomctl');
      if(host && !document.getElementById('dollbtn')){
        const b = document.createElement('button');
        b.id = 'dollbtn'; b.textContent = '👥';
        b.title = 'Who is where';
        b.setAttribute('data-tip','<b>Who is where</b>Everyone on the place and what they are doing, room by room.');
        b.onclick = ()=>G.openHousehold();
        host.insertBefore(b, host.firstChild);
      }
    }catch(e){}
    return r;
  };
}

(function dollCss(){
  const s = document.createElement('style');
  s.textContent = `
  #dollbtn{ font-size:15px; line-height:1 }
  /* the same lie-down p36 gave you, for everybody else */
  .npc.lying .youbob{ transform: rotate(-82deg) translateY(-3px) scale(.94); transform-origin:50% 70%; }
  .dollact{ font-size:7px; fill:#cfe0ea; opacity:.85; paint-order:stroke;
    stroke:#0d1410; stroke-width:2px; stroke-linejoin:round; pointer-events:none }
  .dollplace{ display:flex; justify-content:space-between; align-items:baseline;
    margin:12px 0 4px; font-size:11px; letter-spacing:.12em; text-transform:uppercase;
    opacity:.7; border-bottom:1px solid var(--line2,#33402c); padding-bottom:4px }
  .dollplace span{ opacity:.6 }
  .dollrow{ cursor:pointer; border-radius:5px; padding-left:4px; padding-right:4px }
  .dollrow:hover{ background:rgba(255,255,255,.05) }
  .dollsleep{ opacity:.55; font-style:italic }
  @media (prefers-reduced-motion: reduce){ .npc.lying .youbob{ transition:none } }
  `;
  document.head.appendChild(s);
})();

/* ---------- handle ---------- */
G.dollhouseAudit = function(){
  const rows = dollFolk();
  const roofOff = (typeof SET === 'function') && SET('roofOff');
  const lying = document.querySelectorAll('.npc.lying').length;
  const labels = document.querySelectorAll('.dollact').length;
  const byPlace = {};
  rows.forEach(r=>{ byPlace[r.where] = (byPlace[r.where] || 0) + 1; });
  return {
    roofOff,
    peopleTracked: rows.length,
    indoors: rows.filter(r=>r.indoors).length,
    asleep: rows.filter(r=>r.asleep).length,
    lyingDownNow: lying,
    activityLabelsDrawn: labels,
    byPlace,
    sample: rows.slice(0, 6).map(r=>`${r.name} — ${r.where} — ${r.asleep ? 'asleep' : r.act}`),
    rosterOpen: !!document.getElementById('dollrows'),
  };
};
