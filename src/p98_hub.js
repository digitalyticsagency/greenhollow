/* =====================================================================
   THE HUB DOES NOT COLLECT EVERYTHING, AND IT NEVER TIRES

   Two things, found by running a farm with every module switched on.

   1. IT SKIPS THE CRAFT BUILDINGS ENTIRELY.

   runAutomation services plot, perennial and animal. Nothing in it looks
   at kind 'process' - the jam kitchen, dairy room, honey lab and packing
   shed. Their output lands in o.ready and sits there.

   That is not a cosmetic gap, because p5_engine:450 gates crafting on
   `o.ready===0`. A building with uncollected output does not just hold
   it; it stops working. Measured with all six modules running and the
   store full of fruit: the kitchen made one batch of 3 jam on day 3 and
   then did nothing at all for eleven days. The entire craft economy -
   the most valuable goods in the game - halts the moment you stop
   clicking, on a farm you have paid to automate.

   Fixed by collecting from process buildings too. The household can do
   it as well, through p97's ordering, because carrying jars in from the
   kitchen does not require a robot.

   2. IT HAS NO LIMIT OF ANY KIND.

   Every module loops the whole of S.objs and services all of it, every
   day, for a flat fee of $12-18 a month. A partner clears about four
   jobs a day; the hub clears four hundred if you have them. That is why
   nobody ever hires anybody - a farmhand competes with something that
   has infinite throughput and costs less than they do.

   So the hub gets a capacity, by Mark, and that is what upgrading buys.
   Work beyond it waits for tomorrow, exactly as it does for the family.

   COUNTED IN VISITS, NOT ACTIONS. A trip out to a pen collects the eggs
   and mucks it out; a trip to a bed waters and harvests it. Charging a
   robot twice for one journey would be the wrong model, and it also
   avoids pretending to a precision this does not have.

   It works the list in the order the household set in Family, so the two
   agree: if you have told the house the animals come first, the machines
   go to the animals first too.

   IMPLEMENTED BY WITHHOLDING, NOT REWRITING. Rather than reimplement six
   modules and let them drift from the originals, the overflow objects are
   held out of S.objs for the duration of the base call. The base then
   does precisely what it always did, to a smaller list. Everything is put
   back immediately afterwards - nothing is deleted, and a save that
   somehow interrupts mid-call still has every object in the array.
   ===================================================================== */

/* jobs a day by Mark - deliberately generous, so it bites on a farm that
   has genuinely outgrown its hub rather than on an ordinary one */
const HUB_JOBS = [12, 22, 36, 55];

function hubCapacity(){
  const h = (typeof hub === 'function') ? hub() : null;
  if(!h) return 0;
  const t = Math.max(0, Math.min(HUB_JOBS.length-1, (typeof tOf === 'function') ? tOf(h) : 0));
  return HUB_JOBS[t];
}
function hubMark(){
  const h = (typeof hub === 'function') ? hub() : null;
  if(!h) return 0;
  return (typeof tOf === 'function' ? tOf(h) : 0) + 1;
}

/* is there anything here the hub would do today? */
function hubNeeds(o){
  const bp = BPMAP[o.bp]; if(!bp) return null;
  const th = (S.autoCfg && S.autoCfg.moist) || 0.5;
  const jobs = [];
  if(bp.kind === 'plot'){
    if(o.crop && o.water < th)  jobs.push('water');
    if(o.crop && o.stage >= 1)  jobs.push('harvest');
    if(!o.crop)                 jobs.push('sow');
  }
  if(bp.kind === 'perennial' && o.stage >= 1) jobs.push('pick');
  if(bp.kind === 'animal'){
    if(o.ready > 0)                                  jobs.push('collect');
    if(o.care !== undefined && o.care < 0.9)         jobs.push('clean');
  }
  if(bp.kind === 'process' && o.ready > 0)           jobs.push('fetch');
  return jobs.length ? jobs : null;
}

/* which group in the household's priority list a visit belongs to, so
   the machines and the family work to the same order */
function hubGroupOf(jobs){
  if(jobs.indexOf('collect') >= 0 || jobs.indexOf('clean') >= 0) return 'animals';
  if(jobs.indexOf('harvest') >= 0 || jobs.indexOf('pick') >= 0 ||
     jobs.indexOf('fetch')   >= 0) return 'harvest';
  if(jobs.indexOf('water') >= 0) return 'water';
  return 'tidy';
}

function hubUrgency(o, jobs){
  let u = 0;
  if(jobs.indexOf('fetch') >= 0)   u = Math.max(u, 1);      /* it is blocking a build */
  if(jobs.indexOf('collect') >= 0){
    const cap = (typeof penCapacity === 'function') ? penCapacity(o) : 40;
    u = Math.max(u, Math.min(1, (o.ready||0) / (cap && isFinite(cap) ? cap : 40)));
  }
  if(jobs.indexOf('harvest') >= 0 || jobs.indexOf('pick') >= 0) u = Math.max(u, 0.8);
  if(jobs.indexOf('water') >= 0)   u = Math.max(u, Math.min(1, (0.5 - (o.water||0)) / 0.5));
  if(jobs.indexOf('clean') >= 0)   u = Math.max(u, Math.min(1, (0.9 - (o.care===undefined?1:o.care)) / 0.9));
  if(jobs.indexOf('sow') >= 0)     u = Math.max(u, 0.3);
  return u;
}

/* the visits the hub can make today, best first */
function hubPlan(){
  const cap = hubCapacity();
  const all = [];
  (S.objs || []).forEach(o=>{
    const jobs = hubNeeds(o);
    if(jobs) all.push({ o, jobs, g:hubGroupOf(jobs), u:hubUrgency(o, jobs) });
  });
  const rank = (g)=> (typeof prioRankOf === 'function' && typeof PRIO === 'object')
    ? (function(){ const order = prioOrder(); const i = order.indexOf(g); return i < 0 ? order.length : i; })()
    : 0;
  all.sort((a,b)=>{
    const r = rank(a.g) - rank(b.g);
    return r !== 0 ? r : b.u - a.u;
  });
  return { cap, all, doing: all.slice(0, cap), waiting: Math.max(0, all.length - cap) };
}

/* ---------- collecting from the craft buildings, which nothing did ---------- */
function hubFetchCrafts(list){
  let got = 0, where = 0;
  list.forEach(({o})=>{
    const bp = BPMAP[o.bp];
    if(!bp || bp.kind !== 'process' || !(o.ready > 0)) return;
    /* outKeep records what the finished batch actually was, so a shed
       that made veg boxes does not pay out as jam */
    const out = o.outKeep;
    if(out && typeof out === 'object'){
      Object.keys(out).forEach(k=>{ give(k, out[k]); got += out[k]; });
    } else if(bp.good){
      give(bp.good, o.ready); got += o.ready;
    } else return;
    o.ready = 0; where++;                 /* which lets it start the next batch */
    if(typeof addXP === 'function') addXP(1);
  });
  return { got, where };
}

/* ---------- the cap ---------- */
if(typeof runAutomation === 'function'){
  const _runAutoBase = runAutomation;
  runAutomation = function(){
    if(typeof hub !== 'function' || !hub()) return _runAutoBase.apply(this, arguments);

    const plan = hubPlan();
    const doing = new Set(plan.doing.map(d=>d.o));
    const held = S.objs;

    /* Everything that is not an overflow job stays in the list - the hub
       itself, power, water, housing, shops - so stat() still sees the
       farm it is actually standing on. Only objects with work the hub
       cannot reach today are withheld, and withholding a greenhouse can
       only lower the power draw, never raise it, so this cannot cause a
       throttle that would not otherwise have happened. */
    const overflow = plan.all.slice(plan.cap).map(d=>d.o);
    if(overflow.length){
      const drop = new Set(overflow);
      S.objs = held.filter(o=>!drop.has(o));
    }

    let r;
    try{ r = _runAutoBase.apply(this, arguments); }
    finally{ S.objs = held; }

    /* the craft buildings, which the base has never touched */
    let fetched = { got:0, where:0 };
    try{ if(autoOn('livestock') || autoOn('harvest')) fetched = hubFetchCrafts(plan.doing); }catch(e){}

    try{
      if(fetched.where)
        log(`The hub brought in ${fetched.got} from ${fetched.where} craft building${fetched.where>1?'s':''}.`, 'good');
      if(plan.waiting > 0)
        log(`Mk ${hubMark()} hub is at capacity — ${plan.waiting} job${plan.waiting>1?'s':''} waiting for tomorrow.`,
            plan.waiting > plan.cap*0.5 ? 'bad' : '', 'farm');
    }catch(e){}
    return r;
  };
}

/* ---------- the household can carry jars in too ---------- */
if(typeof PRIO === 'object' && PRIO.harvest && PRIO.harvest.types.indexOf('fetch') < 0){
  PRIO.harvest.types.push('fetch');
  PRIO.harvest.d = 'Bringing in ripe beds, orchards, berries and finished craft goods.';
}
if(typeof choreList === 'function'){
  const _choreListCraft = choreList;
  choreList = function(){
    const base = _choreListCraft.apply(this, arguments);
    try{
      (S.objs || []).forEach(o=>{
        const bp = BPMAP[o.bp];
        if(bp && bp.kind === 'process' && o.ready > 0) base.push({o, t:'fetch'});
      });
      base.sort((a,b)=>{
        const r = prioRankOf(a.t) - prioRankOf(b.t);
        return r !== 0 ? r : choreUrgency(b) - choreUrgency(a);
      });
    }catch(e){}
    return base;
  };
}
if(typeof doChore === 'function'){
  const _doChoreCraft = doChore;
  doChore = function(c){
    if(c && c.t === 'fetch'){
      const f = hubFetchCrafts([{o:c.o}]);
      return f.got;
    }
    return _doChoreCraft.apply(this, arguments);
  };
}
if(typeof choreUrgency === 'function'){
  const _choreUrgCraft = choreUrgency;
  choreUrgency = function(c){
    if(c && c.t === 'fetch') return 1;      /* it is blocking the next batch */
    return _choreUrgCraft.apply(this, arguments);
  };
}

/* ---------- say what the hub can carry, in its own panel ---------- */
if(typeof autoHTML === 'function'){
  const _autoHTMLCap = autoHTML;
  autoHTML = function(){
    const base = _autoHTMLCap.apply(this, arguments);
    let card = '';
    try{
      if(!hub()) return base;
      const plan = hubPlan();
      const used = plan.doing.length;
      const pct = plan.cap ? Math.min(1, used/plan.cap) : 0;
      card = `<div class="card">
        <div class="eyebrow">Mk ${hubMark()} capacity</div>
        <div class="bar"><i style="transform:scaleX(${pct.toFixed(3)});
          background:${plan.waiting?'#e8a33d':'#7cc24f'}"></i></div>
        <div class="ledrow" style="margin-top:6px"><span>Jobs today</span><b>${used} of ${plan.cap}</b></div>
        ${plan.waiting?`<div class="warnbox">${plan.waiting} job${plan.waiting>1?'s':''} beyond what this hub
          can reach in a day. Upgrade the hub, or take on a farmhand.</div>`
        :`<div class="muted" style="margin-top:5px">It is keeping up with the farm.</div>`}
        <div class="muted" style="margin-top:5px">A visit does everything that thing needs — a pen is
        collected and mucked out in one trip. It works in the order you set in Family.</div>
      </div>`;
    }catch(e){ return base; }
    return card + base;
  };
}

/* ---------- handle ---------- */
G.hubAudit = function(){
  if(typeof hub !== 'function' || !hub()) return { hub:'not built' };
  const plan = hubPlan();
  return {
    mark: `Mk ${hubMark()}`,
    capacityPerDay: plan.cap,
    jobsPending: plan.all.length,
    doingToday: plan.doing.length,
    waitingForTomorrow: plan.waiting,
    order: (typeof prioOrder === 'function') ? prioOrder() : 'n/a',
    firstSix: plan.doing.slice(0,6).map(d=>
      `${BPMAP[d.o.bp].name}: ${d.jobs.join('+')} (${d.g}, urgency ${d.u.toFixed(2)})`),
    craftBuildingsHolding: (S.objs||[]).filter(o=>BPMAP[o.bp] &&
      BPMAP[o.bp].kind==='process' && o.ready>0).length,
    wasBefore: 'unlimited jobs a day, and craft buildings never collected at all',
  };
};
