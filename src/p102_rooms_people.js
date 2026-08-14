/* =====================================================================
   PEOPLE GO TO THEIR OWN ROOMS, AND THE PLAN IS DRAWN PROPERLY

   THE BUG. p99 works out a plan in which every child has a room and a
   relative has one of their own. Nothing told the people. bedPoint() in
   p33_indoors sends every child to ROOMS.bedKids and every adult to
   ROOMS.bedMain, and those two keys point at one room each - so with
   three children and two relatives:

     Tara    432,314        <- partner, main bedroom
     Grandad 457,314        <- main bedroom
     Dad     432,314        <- main bedroom, on top of Tara
     Sam     499,314   \
     Ivo     519,314    >   all three in the one children's room
     Rafi    538,314   /

   Everyone on one line, two of them in exactly the same place, while the
   plan said they had five separate rooms. bedPoint has to read the plan
   rather than two hardcoded keys, and that is what this does.

   Sharing is handled honestly rather than by stacking: when a room really
   does hold two people - more children than rooms - they get a bed each,
   at opposite ends. Anyone the plan could not house at all (six people in
   a five bedroom house) is put in the main bedroom rather than dropped,
   and told to be there, which is what actually happens in a full house.

   THE DRAWING. A relative's room drew an empty single bed because fRoom
   only knew about 'main' and children. Rooms now draw the beds their
   occupants need and show whoever is asleep in them.

   And a general pass on the interior for every house: rooms carry their
   name, beds have headboards and turned-down corners, the kitchen gets
   a worktop edge and splashback, windows are cut into the exterior wall
   where each room meets the outside, and the whole plan gets a soft
   inner shadow so the walls read as walls rather than as gaps.
   ===================================================================== */

/* ---------- who belongs where ----------
   Keyed by room name, not by the room object. assignRooms() builds a
   fresh plan on every call, so two calls never return the same objects
   and an identity comparison silently matched nothing: every room
   reported "nobody" in it, and because that made the occupant count 1,
   the partner and a relative were still placed on the same square. */
function roomOwners(){
  const plan = assignRooms();
  const map = {};                                  /* personId -> room key */
  const main = plan.rooms.find(r=>r.use === 'main');
  plan.rooms.forEach(r=>{
    if(r.use === 'main'){
      map.__you = r.k;
      (S.family || []).filter(f=>f.role === 'partner').forEach(f=>map[f.id] = r.k);
    }
    if(r.kids) r.kids.forEach(k=>{ if(k) map[k.id] = r.k; });
    if(r.use === 'adult' && r.owner) map[r.owner] = r.k;
  });
  /* nobody sleeps in the garden: anyone unplaced shares the main room */
  (S.family || []).forEach(f=>{ if(!map[f.id] && main) map[f.id] = main.k; });
  return { plan, map, main, roomByKey:(k)=>plan.rooms.find(r=>r.k === k) };
}

/* everyone sleeping in a given room, in a stable order */
function roomSleepers(r){
  const { map } = roomOwners();
  const out = [];
  if(r.use === 'main' && S.you) out.push(S.you);
  (S.family || []).forEach(f=>{ if(map[f.id] === r.k) out.push(f); });
  return out;
}

/* ---------- bedPoint, reading the plan ---------- */
if(typeof bedPoint === 'function'){
  bedPoint = function(p, idx){
    const H = houseRect(); if(!H) return null;
    const { map, main, roomByKey } = roomOwners();
    const r = (p && roomByKey(map[p.id])) || main;
    if(!r) return null;
    /* which bed in that room is theirs */
    const here = roomSleepers(r);
    const i = Math.max(0, here.findIndex(q=>q && p && q.id === p.id));
    const nn = Math.max(1, here.length);
    const fx = nn === 1 ? 0.42 : (0.26 + (i % 2) * 0.42);
    const fy = nn > 2 && i >= 2 ? 0.66 : 0.40;
    return { x: H.x + (r.x + r.w*fx)*H.w,
             y: H.y + (r.y + r.h*fy)*H.h };
  };
}

/* ---------- the drawing pass ---------- */

/* windows, cut where a room touches the outside wall */
function roomWindows(r, R, W, w, h){
  let s = '';
  const pane = (x, y, ww, hh)=>
    `<rect x="${n(x)}" y="${n(y)}" width="${n(ww)}" height="${n(hh)}" fill="#cfe2ea"/>` +
    `<rect x="${n(x)}" y="${n(y)}" width="${n(ww)}" height="${n(hh)}" fill="none" stroke="#8fa8b4" stroke-width="0.4"/>`;
  const t = W.ext;
  if(r.t === 'hall' || r.t === 'store') return '';
  if(r.y < 0.02)            s += pane(R.x + R.w*0.30, 0.6, R.w*0.40, t-1.2);          /* top    */
  if(r.y + r.h > 0.98)      s += pane(R.x + R.w*0.30, h-t+0.6, R.w*0.40, t-1.2);      /* bottom */
  if(r.x < 0.05)            s += pane(0.6, R.y + R.h*0.32, t-1.2, R.h*0.36);          /* left   */
  if(r.x + r.w > 0.95)      s += pane(w-t+0.6, R.y + R.h*0.32, t-1.2, R.h*0.36);      /* right  */
  return s;
}

/* a room's name, small and quiet, so a plan reads as a plan */
function roomLabelArt(r, R){
  if(!r.label || R.w < 26) return '';
  return `<text x="${n(R.x + R.w/2)}" y="${n(R.y + R.h - 2.4)}" text-anchor="middle"
    font-size="${n(Math.min(4.6, R.w*0.13))}" fill="#5b4a33" fill-opacity=".42"
    style="font-family:inherit;letter-spacing:.04em">${r.label}</text>`;
}

/* beds for whoever actually lives in the room */
if(typeof fRoom === 'function'){
  const _fRoomPeople = fRoom;
  fRoom = function(r, R, W){
    /* main and children are already handled; this covers a relative's
       room, which drew an empty single bed, and rooms holding two people */
    if(r.t === 'bed' && (r.use === 'adult' || r.use === 'guest')){
      const who = roomSleepers(r);
      let s = fBed(R, r.use === 'guest', who);
      s += `<rect x="${n(R.x+R.w*0.74)}" y="${n(R.y+R.h*0.16)}" width="${n(R.w*0.18)}" height="${n(R.h*0.13)}" rx="1" fill="#8a6a45"/>`;
      s += `<circle cx="${n(R.x+R.w*0.83)}" cy="${n(R.y+R.h*0.225)}" r="${n(R.h*0.04)}" fill="#f5d98a"/>`;
      return s;
    }
    return _fRoomPeople.apply(this, arguments);
  };
}

/* the visual pass, layered over whatever p100/p101 produced */
if(typeof interiorArt === 'function'){
  const _interiorBase = interiorArt;
  interiorArt = function(w, h){
    let s = _interiorBase.apply(this, arguments);
    try{
      const plan = assignRooms();
      const W = wallSpec();
      const R = (r)=>({ x:r.x*w, y:r.y*h, w:r.w*w, h:r.h*h });
      let extra = '';
      plan.rooms.forEach(r=>{ extra += roomWindows(r, R(r), W, w, h); });
      plan.rooms.forEach(r=>{ extra += roomLabelArt(r, R(r)); });
      /* an inner shadow round the shell, so the walls have weight */
      extra += `<rect x="${n(W.ext)}" y="${n(W.ext)}" width="${n(w-W.ext*2)}" height="${n(h-W.ext*2)}"
        fill="none" stroke="#000" stroke-opacity=".13" stroke-width="2.4"/>`;
      /* insert before the night wash so lighting still sits on top */
      const cut = s.lastIndexOf('<rect x="0" y="0"');
      s = cut < 0 ? s + extra : s.slice(0, cut) + extra + s.slice(cut);
    }catch(e){}
    return s;
  };
}

/* ---------- handle ---------- */
G.sleepAudit = function(){
  const { plan, map } = roomOwners();
  const spots = (S.family||[]).map((f,i)=>{
    const b = bedPoint(f, i);
    const r = plan.rooms.find(x=>x.k === map[f.id]);
    return { who:`${f.name} (${f.role})`, room:(r && r.label) || '—',
             at: b ? `${Math.round(b.x)},${Math.round(b.y)}` : 'none' };
  });
  const seen = {}; let clashes = 0;
  spots.forEach(s=>{ if(seen[s.at]) clashes++; seen[s.at] = 1; });
  return {
    household: spots,
    distinctSpots: Object.keys(seen).length,
    peopleOnTopOfEachOther: clashes,
    rooms: plan.rooms.filter(r=>r.t==='bed').map(r=>
      `${r.label}: ${roomSleepers(r).map(p=>p.name||'you').join(', ') || 'nobody'}`),
    wasBefore: 'every child in one room, every adult in the main bedroom',
  };
};
