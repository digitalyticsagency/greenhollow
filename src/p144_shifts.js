/* =====================================================================
   SOMEBODY HAS TO BE IN THE DAIRY

   routine() sends farmhands to three kinds of thing: plot, animal and
   perennial. Nothing else is a job. So the kitchen, the dairy, the honey
   lab, the packing shed and the cellar — the buildings that actually
   convert your produce into money — were never staffed by anyone. Cheese
   was made by bookkeeping. Measured on a farm of 24 buildings with six
   people over 200 simulated seconds, half of the buildings were never
   entered once, and every one of the process buildings was in that half.

   This gives them shifts.

   A JOB BOARD, NOT A ROTA. Every tick the working buildings publish what
   they need: a batch running wants somebody minding it, a finished batch
   wants carrying, a shop with stock wants somebody behind the counter.
   People claim the nearest open job and hold it, so two farmhands do not
   walk to the same churn and nobody thrashes between two buildings a
   field apart.

   THEY GO INSIDE. The existing goal for a job stands a person half a tile
   below the building. For a plot that is right — you work a bed from the
   path. For a dairy it is wrong, so a building job aims at the middle of
   the footprint and the person is drawn inside it, which is also what
   makes the interiors worth having the roof off for.

   IT PAYS. An attended batch runs faster — a third again — and that is
   the whole economic point: the building was already wired into the
   nineteen stat channels, but nothing you could see decided how well it
   did. Now the answer is whether anybody is in there. Nothing is made
   slower than it was: an unstaffed building runs at exactly the rate it
   ran before, so this is a bonus for paying attention rather than a tax
   for not.

   THE PARTNER AND THE CHILDREN ARE LEFT ALONE. They have their own day
   and it reads well. This is farmhands, and you.
   ===================================================================== */

const SHIFT_KINDS = ['process', 'shop', 'tourism'];
function shiftState(){
  if(!S.shifts) S.shifts = { claims:{}, held:{}, last:{} };
  if(!S.shifts.held) S.shifts.held = {};       /* personId -> seconds on this job */
  if(!S.shifts.last) S.shifts.last = {};       /* objectId -> when last worked */
  return S.shifts;
}
/* A shift ends. Three farmhands cannot stand in ten buildings at once, so
   without this they claim the three nearest and the other seven are never
   entered — which is the bug this module exists to fix, only smaller.
   A hand works a building for a while, then the job is released and the
   next pick prefers whatever has gone longest without anybody in it. */
const SHIFT_LEN = 26;

/* what each working building wants doing, most urgent first */
function jobBoard(){
  const out = [];
  (S.objs || []).forEach(o=>{
    const bp = BPMAP[o.bp]; if(!bp) return;
    if(!SHIFT_KINDS.includes(bp.kind)) return;
    if(bp.kind === 'process'){
      if(o.ready > 0)                      out.push({ o, bp, need:'carry',  pri:3, act:'carrying a batch out of the ' + bp.name.toLowerCase() });
      else if(o.recipe >= 0 && o.prog > 0) out.push({ o, bp, need:'mind',   pri:2, act:'working in the ' + bp.name.toLowerCase() });
      else if(o.recipe >= 0)               out.push({ o, bp, need:'start',  pri:1, act:'setting up in the ' + bp.name.toLowerCase() });
    } else if(bp.kind === 'shop'){
      if(S.store && Object.keys(S.store).length) out.push({ o, bp, need:'serve', pri:2, act:'serving at the ' + bp.name.toLowerCase() });
    } else if(bp.kind === 'tourism'){
      if((S.guests || []).length)          out.push({ o, bp, need:'host',   pri:1, act:'looking after the ' + bp.name.toLowerCase() });
    }
  });
  return out.sort((a,b)=>b.pri - a.pri);
}

/* somewhere to put a finished batch: the storage buildings, which were
   also never entered by anybody, because owning a barn was book-keeping
   too. A carry job ends at one of these rather than at the churn. */
function storeSpots(){
  return (S.objs || []).filter(o=>{
    const bp = BPMAP[o.bp];
    return bp && bp.kind === 'bonus' && /shed|store|barn|cellar|workshop|root/.test(bp.id);
  });
}

/* the middle of the building, so they are inside it and not loitering
   at the back door the way a plot job wants */
function insideSpot(o, bp){
  const f = footprint(bp, o.rot);
  return { x:(o.tx + f.w/2)*T, y:(o.ty + f.h*0.55)*T };
}

function claimJob(p){
  const S1 = shiftState();
  const board = jobBoard();
  if(!board.length) return null;
  /* keep the one already held if it is still on the board */
  const held = board.find(j=>S1.claims[j.o.id] === p.id);
  if(held && (S1.held[p.id] || 0) < SHIFT_LEN) return held;
  if(held){                                   /* shift over: hand it on */
    S1.last[held.o.id] = (S.tsec || 0);
    delete S1.claims[held.o.id];
    S1.held[p.id] = 0;
  }
  const taken = new Set(Object.keys(S1.claims).filter(k=>S1.claims[k] && S1.claims[k] !== p.id));
  const open = board.filter(j=>!taken.has(j.o.id));
  if(!open.length) return null;
  /* nearest of the most urgent, so a farmhand does not cross the farm
     past two idle churns to reach a third */
  const top = open.filter(j=>j.pri === open[0].pri);
  /* longest neglected first, distance only as the tie-break, so the round
     goes round instead of orbiting the two nearest churns */
  let best = null, bs = -Infinity;
  top.forEach(j=>{
    const sp = insideSpot(j.o, j.bp);
    const d = Math.hypot(sp.x - p.x, sp.y - p.y);
    const since = (S.tsec || 0) - (S1.last[j.o.id] || -9999);
    const score = Math.min(600, since) - d/40;
    if(score > bs){ bs = score; best = j; }
  });
  if(best){
    Object.keys(S1.claims).forEach(k=>{ if(S1.claims[k] === p.id) delete S1.claims[k]; });
    S1.claims[best.o.id] = p.id;
  }
  return best;
}

/* ---------- farmhands take building work ---------- */
if(typeof routine === 'function'){
  const _routineShift = routine;
  routine = function(p){
    const base = _routineShift.apply(this, arguments);
    try{
      if(!p || p.role === 'child' || p.role === 'partner') return base;
      if(base && base.act === 'asleep') return base;
      const f = (typeof dayFrac === 'function') ? dayFrac() : 0.5;
      if(f < 0.30 || f > 0.82) return base;            /* working hours only */
      const job = claimJob(p);
      if(!job) return base;
      let spot = insideSpot(job.o, job.bp);
      let act = job.act;
      /* a finished batch gets walked to a barn once it has been picked up,
         so the second half of a carry job happens somewhere else */
      if(job.need === 'carry' && (shiftState().held[p.id] || 0) > SHIFT_LEN*0.45){
        const barns = storeSpots();
        if(barns.length){
          /* least recently used, not hash(id.length) — every farmhand id is
             three characters long, so that picked the same barn for all of
             them and the other barns were never entered either */
          const S2 = shiftState();
          let b = barns[0], bs = Infinity;
          barns.forEach(x=>{ const t = S2.last[x.id] || -9999; if(t < bs){ bs = t; b = x; } });
          spot = insideSpot(b, BPMAP[b.bp]);
          act = 'carrying it into the ' + BPMAP[b.bp].name.toLowerCase();
          shiftState().last[b.id] = S.tsec || 0;
        }
      }
      return { x:spot.x, y:spot.y, act, job:job.need, at:job.o.id };
    }catch(e){}
    return base;
  };
}

/* ---------- being there does something ---------- */
const SHIFT_BONUS = 0.33;                  /* an attended batch runs a third faster */
function shiftTick(dt){
  const S1 = shiftState();
  S.tsec = (S.tsec || 0) + dt;
  const here = {};
  (S.workers || []).concat(S.family || []).forEach(p=>{
    if(!p.act) return;
    Object.keys(S1.claims).forEach(id=>{
      if(S1.claims[id] !== p.id) return;
      const o = (S.objs || []).find(x=>x.id === id);
      if(!o) { delete S1.claims[id]; return; }
      const bp = BPMAP[o.bp]; if(!bp) return;
      const spot = insideSpot(o, bp);
      /* actually standing in it, not merely on the way */
      if(Math.hypot(p.x - spot.x, p.y - spot.y) < T*0.9){
        here[id] = p.id;
        S1.held[p.id] = (S1.held[p.id] || 0) + dt;
        S1.last[id] = S.tsec;
      }
    });
  });
  /* drop claims for people who wandered off or objects that were sold */
  Object.keys(S1.claims).forEach(id=>{
    if(!(S.objs || []).some(x=>x.id === id)) delete S1.claims[id];
  });

  (S.objs || []).forEach(o=>{
    const bp = BPMAP[o.bp]; if(!bp) return;
    const staffed = !!here[o.id];
    o.staffed = staffed ? 1 : 0;
    if(!staffed) return;
    if(bp.kind === 'process' && o.recipe >= 0 && o.ready === 0 && o.prog > 0){
      /* the extra only, on top of whatever p5 already did this tick, so an
         empty building runs at exactly the speed it always did */
      const rc = bp.recipes && bp.recipes[o.recipe];
      if(rc) o.prog = Math.min(1, o.prog + (dt/60) * (1/rc.days) * SHIFT_BONUS);
    }
  });
}

if(typeof tickPeople === 'function'){
  const _tickShift = tickPeople;
  tickPeople = function(dt){
    const r = _tickShift.apply(this, arguments);
    try{ shiftTick(typeof dt === 'number' ? dt : 1/30); }catch(e){}
    return r;
  };
}

/* ---------- handle ---------- */
G.shiftAudit = function(){
  const S1 = shiftState();
  const board = jobBoard();
  const staffedIds = (S.objs || []).filter(o=>o.staffed).map(o=>o.bp);
  return {
    jobsOnBoard: board.length,
    board: board.slice(0, 8).map(j=>`${j.bp.name}: ${j.need}`),
    claims: Object.keys(S1.claims).length,
    claimedBy: Object.entries(S1.claims).map(([id, pid])=>{
      const o = (S.objs || []).find(x=>x.id === id);
      return (o ? BPMAP[o.bp].name : id) + ' <- ' + pid;
    }),
    actuallyStaffedNow: staffedIds,
    attendedBonus: Math.round(SHIFT_BONUS*100) + '% faster while somebody is in it',
    farmhands: (S.workers || []).length,
    wasBefore: 'process, shop and tourism were not jobs; half of all buildings were never entered',
  };
};
