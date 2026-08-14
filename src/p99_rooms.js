/* =====================================================================
   A FLOORPLAN THAT IS ACTUALLY THE HOUSE YOU BOUGHT

   The cutaway has always drawn one plan: kitchen, living, hall, a double
   bedroom, a room with two children's beds, a bathroom. Hardcoded
   proportions, identical in every game.

   Two things wrong with that, and they are both things the game already
   knows and was throwing away.

   THE HOUSE HAS A SIZE. HSIZE offers "One bedroom", "Three bedroom" and
   "Five bedroom" and charges up to 1.7x for the difference. All three
   drew two bedrooms. You could pay for a five bedroom house and look
   inside at the same two rooms.

   THE HOUSE HAS A STYLE. A stone croft has thick walls and small deep
   windows; a passive house is airtight and triple glazed; a container
   home is a set of boxes. All ten styles drew the same 1.2px partitions.

   And the household was ignored too - two children's beds whether you
   had none or three.

   So the plan is now generated: bedrooms from the size you bought, walls
   from the style, and the rooms assigned to the people actually living
   there. Bedrooms nobody needs become an office, a guest room, a store,
   in that order, because that is what spare rooms become.

   ARCHITECTURAL, AS ASKED. Exterior walls are drawn at a real thickness
   and rendered as a filled shell rather than a stroke, so corners meet
   properly. Interior partitions are thinner than exterior. Doorways are
   openings in the wall with a leaf and a swing arc. Skirting runs round
   each room. Furniture is drawn to plan scale against the wall it would
   actually stand against.

   ROOMS is mutated rather than replaced. p33's roomPoint(), homeSpot()
   and isIndoors() all index it by name, so the six original keys keep
   pointing at real rooms in the new plan and every caller keeps working.
   ===================================================================== */

/* ---------- what the house is ---------- */
function homeInfo(){
  const h = (typeof HOMEMAP === 'object') ? HOMEMAP[S.homeId] : null;
  return h || { style:'barn', size:'Three bedroom', sc:1, finish:'Standard' };
}
function homeBedrooms(){
  const h = homeInfo();
  const sz = (h.size || '').toLowerCase();
  if(sz.indexOf('one') === 0)  return 1;
  if(sz.indexOf('five') === 0) return 5;
  return 3;
}
/* how the walls are built, by style */
const WALLSPEC = {
  croft:     { ext:4.2, int:2.0, c:'#cfc6b4', s:'#a2967f', d:'thick stone' },
  passive:   { ext:3.4, int:1.8, c:'#f2ece0', s:'#c3b9a6', d:'airtight, triple glazed' },
  container: { ext:2.4, int:1.5, c:'#e6e8ea', s:'#a8b0b6', d:'clad steel box' },
  tiny:      { ext:2.0, int:1.3, c:'#f1e6d4', s:'#c0ad92', d:'compact timber' },
  domeh:     { ext:3.0, int:1.6, c:'#eef2f4', s:'#b6c2c8', d:'geodesic shell' },
};
function wallSpec(){
  return WALLSPEC[homeInfo().style] || { ext:3.0, int:1.7, c:'#f1e8d9', s:'#b9ab95', d:'timber frame' };
}

/* ---------- the plan ----------
   Hand-authored per size rather than packed by an algorithm: a generated
   plan gets the areas right and the proportions wrong, and a floorplan
   that reads badly is worse than one that is merely simple. */
function planFor(beds){
  if(beds === 1) return {
    rooms: [
      {k:'kitchen', x:0.04, y:0.05, w:0.40, h:0.34, t:'kitchen'},
      {k:'living',  x:0.46, y:0.05, w:0.50, h:0.34, t:'living'},
      {k:'hall',    x:0.04, y:0.42, w:0.92, h:0.11, t:'hall'},
      {k:'bed1',    x:0.04, y:0.56, w:0.48, h:0.39, t:'bed'},
      {k:'bath',    x:0.54, y:0.56, w:0.20, h:0.39, t:'bath'},
      {k:'util',    x:0.76, y:0.56, w:0.20, h:0.39, t:'util'},
    ]};
  /* Two sleeping bands need two corridors. The first version stacked the
     second band straight under the first, so those three rooms opened
     into other people's bedrooms - which is not a house, it is a train.
     A landing runs between them. */
  if(beds === 5) return {
    rooms: [
      {k:'kitchen', x:0.04, y:0.04, w:0.32, h:0.21, t:'kitchen'},
      {k:'living',  x:0.38, y:0.04, w:0.34, h:0.21, t:'living'},
      {k:'pantry',  x:0.74, y:0.04, w:0.22, h:0.21, t:'pantry'},
      {k:'hall',    x:0.04, y:0.27, w:0.92, h:0.07, t:'hall'},
      {k:'bed1',    x:0.04, y:0.36, w:0.29, h:0.24, t:'bed'},
      {k:'bed2',    x:0.35, y:0.36, w:0.29, h:0.24, t:'bed'},
      {k:'bath',    x:0.66, y:0.36, w:0.30, h:0.24, t:'bath'},
      {k:'landing', x:0.04, y:0.62, w:0.92, h:0.06, t:'hall'},
      {k:'bed3',    x:0.04, y:0.70, w:0.29, h:0.26, t:'bed'},
      {k:'bed4',    x:0.35, y:0.70, w:0.29, h:0.26, t:'bed'},
      {k:'bed5',    x:0.66, y:0.70, w:0.30, h:0.26, t:'bed'},
    ]};
  return {
    rooms: [
      {k:'kitchen', x:0.04, y:0.05, w:0.36, h:0.32, t:'kitchen'},
      {k:'living',  x:0.42, y:0.05, w:0.54, h:0.32, t:'living'},
      {k:'hall',    x:0.04, y:0.40, w:0.92, h:0.10, t:'hall'},
      {k:'bed1',    x:0.04, y:0.53, w:0.28, h:0.42, t:'bed'},
      {k:'bed2',    x:0.34, y:0.53, w:0.24, h:0.42, t:'bed'},
      {k:'bed3',    x:0.60, y:0.53, w:0.19, h:0.42, t:'bed'},
      {k:'bath',    x:0.81, y:0.53, w:0.15, h:0.42, t:'bath'},
    ]};
}

/* ---------- who sleeps where ----------
   The main bedroom is yours. Children take rooms of their own until they
   run out and then share. Whatever is left over is not a bedroom at all:
   a spare room becomes an office first, because you work from home. */
function assignRooms(){
  const plan = planFor(homeBedrooms());
  const beds = plan.rooms.filter(r=>r.t === 'bed');
  const kids = (S.family || []).filter(f=>f.role === 'child');
  const grownups = (S.family || []).filter(f=>f.role === 'partner' || f.role === 'adult');

  if(beds[0]){ beds[0].use = 'main'; beds[0].label = grownups.length ? 'Main bedroom' : 'Your room'; beds[0].sleeps = 1 + (grownups.some(g=>g.role==='partner')?1:0); }

  let bi = 1, spare = [];
  const rooms = beds.slice(1);
  if(kids.length){
    if(kids.length <= rooms.length){
      kids.forEach((k,i)=>{ if(rooms[i]){ rooms[i].use='child'; rooms[i].kids=[k]; rooms[i].label=`${k.name}'s room`; } });
      spare = rooms.slice(kids.length);
    } else {
      /* more children than rooms: share them out evenly */
      rooms.forEach(r=>{ r.use='child'; r.kids=[]; });
      kids.forEach((k,i)=>{ const r = rooms[i % rooms.length]; if(r) r.kids.push(k); });
      rooms.forEach(r=>{ r.label = r.kids.length>1 ? "Children's room" : `${r.kids[0].name}'s room`; });
    }
  } else spare = rooms;

  /* extra adults take a spare room before it becomes anything else.
     owner is recorded so the person can actually be sent to it - without
     it the plan knew whose room it was and nothing else did. */
  const extra = grownups.filter(g=>g.role === 'adult');
  extra.forEach((g,i)=>{ if(spare[i]){ spare[i].use='adult'; spare[i].owner=g.id; spare[i].label=`${g.name}'s room`; } });
  spare = spare.slice(extra.length);

  const roles = ['office','guest','store'];
  spare.forEach((r,i)=>{
    r.use = roles[Math.min(i, roles.length-1)];
    r.t   = r.use;
    r.label = r.use === 'office' ? 'Office' : r.use === 'guest' ? 'Guest room' : 'Store';
  });

  /* keyed off k for the circulation spaces, because a five bed house has
     two of them and calling both "Hall" made the furnishing list read as
     a duplicate rather than two different rooms */
  plan.rooms.forEach(r=>{ if(!r.label) r.label =
    r.k==='landing'?'Landing':
    r.t==='kitchen'?'Kitchen':r.t==='living'?'Living room':r.t==='hall'?'Hall':
    r.t==='bath'?'Bathroom':r.t==='pantry'?'Pantry':r.t==='util'?'Utility':''; });
  return plan;
}

/* keep the six original keys pointing at real rooms so every existing
   caller of ROOMS - roomPoint, homeSpot, isIndoors - keeps working */
function syncROOMS(){
  if(typeof ROOMS !== 'object') return null;
  const plan = assignRooms();
  const by = {}; plan.rooms.forEach(r=>by[r.k] = r);
  const pick = (k, fb)=> by[k] || by[fb] || plan.rooms[0];
  const set = (name, r)=>{ if(r) ROOMS[name] = {x:r.x, y:r.y, w:r.w, h:r.h}; };
  set('kitchen', pick('kitchen'));
  set('living',  pick('living'));
  set('hall',    pick('hall'));
  set('bath',    pick('bath'));
  set('bedMain', pick('bed1'));
  const kidRoom = plan.rooms.find(r=>r.use === 'child');
  set('bedKids', kidRoom || pick('bed2','bed1'));
  plan.rooms.forEach(r=>{ ROOMS[r.k] = {x:r.x, y:r.y, w:r.w, h:r.h}; });
  return plan;
}

/* ---------- drawing ---------- */
/* A door in plan is three things: a gap cut through the wall, the leaf
   standing open, and the arc it sweeps. The first version drew the gap in
   a fixed board colour, so a door into the tiled bathroom was patched
   with floorboards, and the arc was #00000022 at 0.5 wide - invisible at
   any zoom the player actually uses. `into` is the floor colour of the
   room it opens onto, so the opening reads as a hole rather than a smear. */
function doorGap(x, y, len, horiz, sw, into){
  const g = Math.min(len*0.42, 11);
  const fill = into || '#c39a6b';
  const cx = horiz ? x + len/2 : x, cy = horiz ? y : y + len/2;
  let s = '';
  if(horiz){
    s += `<rect x="${n(cx-g/2)}" y="${n(cy-sw/2-0.6)}" width="${n(g)}" height="${n(sw+1.2)}" fill="${fill}"/>`;
    /* the reveals either side, so the opening has depth */
    s += `<line x1="${n(cx-g/2)}" y1="${n(cy-sw/2-0.6)}" x2="${n(cx-g/2)}" y2="${n(cy+sw/2+0.6)}" stroke="#00000055" stroke-width="0.4"/>`;
    s += `<line x1="${n(cx+g/2)}" y1="${n(cy-sw/2-0.6)}" x2="${n(cx+g/2)}" y2="${n(cy+sw/2+0.6)}" stroke="#00000055" stroke-width="0.4"/>`;
    s += `<path d="M${n(cx+g/2)} ${n(cy)} A${n(g)} ${n(g)} 0 0 1 ${n(cx-g/2)} ${n(cy+g)}"
      fill="none" stroke="#6b563c" stroke-opacity=".45" stroke-width="0.7" stroke-dasharray="1.6 1.4"/>`;
    s += `<line x1="${n(cx-g/2)}" y1="${n(cy)}" x2="${n(cx-g/2)}" y2="${n(cy+g)}" stroke="#7a5c3a" stroke-width="1.5" stroke-linecap="round"/>`;
  } else {
    s += `<rect x="${n(cx-sw/2-0.6)}" y="${n(cy-g/2)}" width="${n(sw+1.2)}" height="${n(g)}" fill="${fill}"/>`;
    s += `<line x1="${n(cx-sw/2-0.6)}" y1="${n(cy-g/2)}" x2="${n(cx+sw/2+0.6)}" y2="${n(cy-g/2)}" stroke="#00000055" stroke-width="0.4"/>`;
    s += `<line x1="${n(cx-sw/2-0.6)}" y1="${n(cy+g/2)}" x2="${n(cx+sw/2+0.6)}" y2="${n(cy+g/2)}" stroke="#00000055" stroke-width="0.4"/>`;
    s += `<path d="M${n(cx)} ${n(cy+g/2)} A${n(g)} ${n(g)} 0 0 1 ${n(cx+g)} ${n(cy-g/2)}"
      fill="none" stroke="#6b563c" stroke-opacity=".45" stroke-width="0.7" stroke-dasharray="1.6 1.4"/>`;
    s += `<line x1="${n(cx)}" y1="${n(cy-g/2)}" x2="${n(cx+g)}" y2="${n(cy-g/2)}" stroke="#7a5c3a" stroke-width="1.5" stroke-linecap="round"/>`;
  }
  return s;
}

/* the dominant floor colour of a room, for patching a doorway through */
function floorTone(t){
  if(t === 'bath' || t === 'util') return '#dfe7ea';
  if(t === 'kitchen' || t === 'pantry') return '#cbb59a';
  return '#c39a6b';
}

function roomFloor(R, t){
  /* each room gets the floor it would really have */
  if(t === 'bath' || t === 'util'){
    let s = `<rect x="${n(R.x)}" y="${n(R.y)}" width="${n(R.w)}" height="${n(R.h)}" fill="#dfe7ea"/>`;
    const c = Math.max(3, Math.round(R.w/7));
    for(let i=0;i<=c;i++) s += `<line x1="${n(R.x+R.w*i/c)}" y1="${n(R.y)}" x2="${n(R.x+R.w*i/c)}" y2="${n(R.y+R.h)}" stroke="#c3d2d8" stroke-width="0.4"/>`;
    const rws = Math.max(3, Math.round(R.h/7));
    for(let i=0;i<=rws;i++) s += `<line x1="${n(R.x)}" y1="${n(R.y+R.h*i/rws)}" x2="${n(R.x+R.w)}" y2="${n(R.y+R.h*i/rws)}" stroke="#c3d2d8" stroke-width="0.4"/>`;
    return s;
  }
  if(t === 'kitchen' || t === 'pantry'){
    let s = `<rect x="${n(R.x)}" y="${n(R.y)}" width="${n(R.w)}" height="${n(R.h)}" fill="#cbb59a"/>`;
    const c = Math.max(3, Math.round(R.w/9));
    for(let i=0;i<=c;i++) s += `<line x1="${n(R.x+R.w*i/c)}" y1="${n(R.y)}" x2="${n(R.x+R.w*i/c)}" y2="${n(R.y+R.h)}" stroke="#b09a80" stroke-width="0.4"/>`;
    return s;
  }
  /* boards, running the long way, with staggered joints */
  let s = `<rect x="${n(R.x)}" y="${n(R.y)}" width="${n(R.w)}" height="${n(R.h)}" fill="#c39a6b"/>`;
  const rows = Math.max(3, Math.round(R.h/6));
  for(let i=0;i<rows;i++){
    const by = R.y + R.h*i/rows;
    s += `<rect x="${n(R.x)}" y="${n(by)}" width="${n(R.w)}" height="${n(R.h/rows)}" fill="${i%2?'#c9a273':'#bd9265'}"/>`;
    s += `<line x1="${n(R.x)}" y1="${n(by)}" x2="${n(R.x+R.w)}" y2="${n(by)}" stroke="#a37e52" stroke-width="0.4" opacity=".6"/>`;
    const j = 0.25 + hash(i*2.7 + R.x)*0.5;
    s += `<line x1="${n(R.x+R.w*j)}" y1="${n(by)}" x2="${n(R.x+R.w*j)}" y2="${n(by+R.h/rows)}" stroke="#a37e52" stroke-width="0.4" opacity=".5"/>`;
  }
  return s;
}

/* skirting: a light inner line round the room, which is what sells a plan */
function skirting(R){
  return `<rect x="${n(R.x+0.7)}" y="${n(R.y+0.7)}" width="${n(R.w-1.4)}" height="${n(R.h-1.4)}"
    fill="none" stroke="#ffffff" stroke-opacity=".22" stroke-width="0.8"/>`;
}

G.roomsAudit = function(){
  const plan = assignRooms();
  return {
    home: homeInfo().name || S.homeId,
    size: homeInfo().size,
    bedroomsBought: homeBedrooms(),
    bedroomsDrawn: plan.rooms.filter(r=>r.t==='bed').length,
    walls: wallSpec().d,
    household: (S.family||[]).map(f=>`${f.name} (${f.role})`),
    rooms: plan.rooms.map(r=>`${r.label} [${r.t}]${r.kids?` — ${r.kids.map(k=>k.name).join(', ')}`:''}`),
    wasBefore: 'six fixed rooms, two children’s beds, at every size and style',
  };
};
