/* =====================================================================
   PHASE 4, TIERS 1 AND 2 — SITTING DOWN, AND READING

   Bench sitting half-existed already. p62 routes a 'rest' need to
   ['bench','deck','firepit'] and produces the act 'sitting a while', and
   there is a .pl-sit rule. What it did not have was seats: everyone
   aimed at the same centre point of the footprint and the idle shuffle
   scattered them +/-26px around it, so on an 80px bench two people
   visibly intersected. And .pl-sit was a squash - translateY(3px)
   scale(1,.9) - with the bob animation switched off, so a seated person
   was a slightly squat standing person, frozen.

   Tier 1: real seats. Two per bench at 27% and 73% of the footprint,
   claimed one person each, released when they get up, when they are
   removed, or when the bench is demolished. A third person who wants to
   sit finds another bench or does something else - no queueing, because
   somebody standing beside a bench waiting for it reads as broken.

   Tier 2: an actual seated pose (legs folded forward at the knee, torso
   dropped onto the seat, arms in), a sixth optional prop argument on
   person(), and a book with a page that turns. Whether someone reads or
   just sits comes from their trait: the dreamer and the curious one
   bring a book, the practical one does not.
   ===================================================================== */

/* ---------- 1. seats ---------- */
/* Runtime only. Persisting a seat claim would outlive the person or the
   bench and leak - and there is nothing worth restoring about who was
   sitting where three sessions ago. */
const SEATS = new Map();                    /* objId -> [personId|null, ...] */

/* which objects can be sat on, and how many can sit */
const SEATABLE = { bench:2, deck:3, firepit:4 };

function seatCount(o){
  const art = (BPMAP[o.bp] || {}).art;
  return SEATABLE[art] || 0;
}
function seatsOf(o){
  const nSeats = seatCount(o);
  if(!nSeats) return null;
  let arr = SEATS.get(o.id);
  if(!arr || arr.length !== nSeats){ arr = new Array(nSeats).fill(null); SEATS.set(o.id, arr); }
  return arr;
}
/* where each seat physically is, in world pixels */
function seatPos(o, i){
  const f = footprint(BPMAP[o.bp], o.rot);
  const nSeats = seatCount(o);
  const art = (BPMAP[o.bp] || {}).art;
  if(art === 'firepit'){
    /* round the fire, facing in */
    const a = (i / nSeats) * Math.PI * 2 - Math.PI/2;
    return { x:(o.tx + f.w/2 + Math.cos(a)*f.w*0.32)*T,
             y:(o.ty + f.h/2 + Math.sin(a)*f.h*0.32)*T, face: Math.cos(a) < 0 ? 1 : -1 };
  }
  /* a bench or a deck: along the long axis, evenly, facing the viewer */
  const t = (i + 0.5) / nSeats;
  return { x:(o.tx + f.w*(0.10 + t*0.80))*T,
           y:(o.ty + f.h*0.62)*T, face: 1 };
}

function seatHolder(pid){
  let found = null;
  SEATS.forEach((arr, id)=>{ const i = arr.indexOf(pid); if(i >= 0) found = {id, i}; });
  return found;
}
function releaseSeat(pid){
  const h = seatHolder(pid);
  if(h){ const arr = SEATS.get(h.id); if(arr) arr[h.i] = null; }
}
function claimSeat(o, pid){
  const arr = seatsOf(o); if(!arr) return -1;
  const mine = arr.indexOf(pid);
  if(mine >= 0) return mine;                 /* already sitting here */
  const free = arr.indexOf(null);
  if(free < 0) return -1;
  releaseSeat(pid);                          /* never hold two seats */
  arr[free] = pid;
  return free;
}

/* A seat must not outlive its bench or its person. Both are cheap to
   check and expensive to get wrong - a leaked claim makes a bench look
   permanently full. */
function sweepSeats(){
  const alive = new Set((S.family||[]).concat(S.workers||[]).map(p=>p.id));
  SEATS.forEach((arr, id)=>{
    const still = (S.objs||[]).some(o=>o.id === id);
    if(!still){ SEATS.delete(id); return; }
    arr.forEach((pid, i)=>{ if(pid && !alive.has(pid)) arr[i] = null; });
  });
}

/* ---------- 2. who reads ---------- */
/* Not everyone brings a book. The trait decides, so it is consistent for
   a given character rather than a coin flip each time they sit. */
const READERS = ['dreamer','curious','tender'];
function isReader(p){
  if(typeof traitOf !== 'function') return false;
  return READERS.indexOf(traitOf(p).n) >= 0;
}

/* ---------- 3. the routine sends them to a specific seat ---------- */
if(typeof routine === 'function'){
  const _routineSeat = routine;
  routine = function(p){
    const base = _routineSeat.apply(this, arguments);
    if(!base) return base;

    /* p62 already decided they want to sit; this turns "somewhere near
       the bench" into "this seat, facing this way" */
    const wantsSeat = base.act === 'sitting a while' || base.act === 'sitting together';
    if(!wantsSeat){ releaseSeat(p.id); p.seatAt = null; return base; }

    /* find the object p62 picked, then a seat on it */
    const cands = (S.objs||[]).filter(o=>seatCount(o) > 0);
    if(!cands.length) return base;
    /* nearest to the goal p62 already computed, so we honour its choice */
    let best = null, bestD = 1e9;
    cands.forEach(o=>{
      const f = footprint(BPMAP[o.bp], o.rot);
      const cx = (o.tx + f.w/2)*T, cy = (o.ty + f.h/2)*T;
      const d = Math.hypot(cx - base.x, cy - base.y);
      const arr = seatsOf(o);
      const free = arr && (arr.indexOf(null) >= 0 || arr.indexOf(p.id) >= 0);
      if(free && d < bestD){ bestD = d; best = o; }
    });
    /* Every seat taken. Returning `base` unchanged left them with the act
       'sitting a while' and no seat, so paintSeated posed them and they
       sat on thin air beside a full bench - measured as posedCount 3 on a
       two-seat bench. They stand near it instead, which is what a person
       does when the bench is full. */
    const standing = { x:base.x, y:base.y, act:'stretching their legs' };
    if(!best){ releaseSeat(p.id); p.seatAt = null; return standing; }

    const idx = claimSeat(best, p.id);
    if(idx < 0){ releaseSeat(p.id); p.seatAt = null; return standing; }

    const sp = seatPos(best, idx);
    p.seatAt = { obj:best.id, i:idx };
    p.dir = sp.face;
    const reading = isReader(p) && base.act === 'sitting a while';
    return { x:sp.x, y:sp.y, act: reading ? 'reading' : base.act };
  };
}

/* ---------- 4. the book ---------- */
function bookArt(){
  return `<g class="pr-book" transform="translate(4.6,0.6)">
    <rect x="-3.4" y="-1.6" width="6.8" height="4.6" rx="0.7" fill="#8a5a34"/>
    <rect x="-3.0" y="-1.2" width="3.0" height="3.8" rx="0.4" fill="#f4efe1"/>
    <rect class="pr-page" x="0.1" y="-1.2" width="3.0" height="3.8" rx="0.4" fill="#e8e2cf"/>
    <line x1="0.05" y1="-1.4" x2="0.05" y2="2.8" stroke="#6b4526" stroke-width="0.5"/>
  </g>`;
}

/* The book is inserted into the drawn group rather than passed through
   person()'s prop slot. The slot is the right shape for a prop that
   belongs to a *kind* of character, but this one comes and goes with an
   activity, and threading it through every caller of peopleLayer to
   change on an act would be worse than one insertAdjacentHTML here. */

/* paint pass: set the pose class and hand the book to whoever is reading */
function paintSeated(){
  const all = (S.family||[]).concat(S.workers||[]);
  all.forEach(p=>{
    const el = document.querySelector(`[data-p="${p.id}"]`);
    if(!el) return;
    const a = p.act || '';
    const seated = a === 'sitting a while' || a === 'sitting together' || a === 'reading';
    el.classList.toggle('pr-seated', seated);
    el.classList.toggle('pr-reading', a === 'reading');
    /* the book is markup, not a class, so it is added and removed here */
    const has = el.querySelector('.pr-book');
    if(a === 'reading' && !has){
      const holder = el.querySelector('.youbob > g') || el.querySelector('.youbob');
      if(holder) holder.insertAdjacentHTML('beforeend', bookArt());
    } else if(a !== 'reading' && has){
      has.remove();
    }
  });
}

/* ---------- 5. wire in ---------- */
const _tickPeopleSeat = tickPeople;
tickPeople = function(dt){
  const r = _tickPeopleSeat.apply(this, arguments);
  try{ sweepSeats(); paintSeated(); }catch(e){}
  return r;
};
/* a redraw wipes the pose classes and the book, so re-apply */
if(typeof render === 'function'){
  const _renderSeat = render;
  render = function(){ const r = _renderSeat.apply(this, arguments);
    try{ paintSeated(); }catch(e){} return r; };
}

if(typeof ACT_WORDING === 'object'){
  ACT_WORDING['reading']              = p => `${p.name} sat down with a book.`;
  ACT_WORDING['stretching their legs']= p => `${p.name} stood about — the bench was full.`;
}

/* the bench says how many it seats */
if(BPMAP.bench){
  BPMAP.bench.desc = 'Somewhere to sit and look at what you built. Seats two.';
  BPMAP.bench.tip  = 'Two people will actually sit on it, and some of them bring a book.';
}

(function seatCss(){
  const s = document.createElement('style');
  s.textContent = `
  /* A real seated pose, not a squash. The legs fold forward at the hip,
     the body drops onto the seat, the arms come in. The old rule turned
     the bob off and left the figure frozen; this keeps a slow breath. */
  .npc.pr-seated .youbob{ animation: prBreathe 5.2s ease-in-out infinite; }
  @keyframes prBreathe{ 0%,100%{ transform:translateY(2px); } 50%{ transform:translateY(1.2px); } }

  .npc.pr-seated .pr-leg{ transform-box:fill-box; transform-origin:50% 0%;
    transform: rotate(-72deg) scaleY(.72); }
  .npc.pr-seated .pr-leg-l{ transform: rotate(-72deg) scaleY(.72) translateX(0.6px); }
  .npc.pr-seated .pr-torso{ transform: translateY(2.2px); }
  .npc.pr-seated .pr-head,.npc.pr-seated .pr-hair,.npc.pr-seated .pr-hat{ transform: translateY(2.2px); }
  .npc.pr-seated .pr-arm{ transform-box:fill-box; transform-origin:50% 0%;
    transform: translateY(2px) rotate(8deg); }
  /* sitting on a bench, the ground shadow is under the bench, not the feet */
  .npc.pr-seated .pr-shadow{ opacity:.16; }

  /* reading: head tips down to the page, near arm comes up to hold it */
  .npc.pr-reading .pr-head,.npc.pr-reading .pr-hair,.npc.pr-reading .pr-hat{
    transform: translateY(3px) rotate(9deg); transform-box:fill-box; transform-origin:50% 100%; }
  .npc.pr-reading .pr-arm-r{ transform: translateY(1.4px) rotate(-26deg); }
  .pr-book{ transform-box:fill-box; transform-origin:0% 50%; }
  .npc.pr-reading .pr-page{ transform-box:fill-box; transform-origin:0% 50%;
    animation: prPage 7s ease-in-out infinite; }
  @keyframes prPage{
    0%,86%  { transform: rotateY(0deg);   opacity:1; }
    93%     { transform: rotateY(-72deg); opacity:.75; }
    100%    { transform: rotateY(0deg);   opacity:1; } }

  @media (prefers-reduced-motion: reduce){
    .npc.pr-seated .youbob,.npc.pr-reading .pr-page{ animation:none !important; } }
  `;
  document.head.appendChild(s);
})();

/* ---------- handles ---------- */
G.benchCheck = function(){
  const out = [];
  (S.objs||[]).forEach(o=>{
    if(!seatCount(o)) return;
    const arr = seatsOf(o);
    out.push({ obj:BPMAP[o.bp].art, id:o.id, seats:arr.length,
               taken:arr.filter(Boolean).length, who:arr.slice() });
  });
  const people = (S.family||[]).concat(S.workers||[]).map(p=>({
    name:p.name, act:p.act, seatAt:p.seatAt || null,
    trait:(typeof traitOf==='function')?traitOf(p).n:'?',
    reader:isReader(p),
    posed: !!document.querySelector(`[data-p="${p.id}"].pr-seated`),
    hasBook: !!document.querySelector(`[data-p="${p.id}"] .pr-book`),
  }));
  return { benches:out, people };
};
G.sitEveryone = function(){
  /* force the rest need high so they head for a seat */
  (S.family||[]).forEach(p=>{ if(p.need) p.need.rest = 0.95; });
  return 'rest need raised — they should go and sit';
};
