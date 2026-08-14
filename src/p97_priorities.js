/* =====================================================================
   SET THE HOUSEHOLD'S PRIORITIES

   partnerHelps() gathers every outstanding job on the farm and then hands
   them out in the order S.objs happens to be in - which is build order,
   meaning it is effectively arbitrary. A partner clears about four jobs a
   day and a relative two, so on any farm past the first few weeks there
   are far more jobs than hands, and which ones get done is decided by
   which shed you happened to put up first.

   That is the whole feature. The household has limited hands; the player
   should be the one deciding what they spend them on. Nothing here makes
   the family faster or the farm richer - it only decides what the same
   four jobs are spent on, which is a real choice precisely because it
   costs something. Putting the animals first means the beds go unwatered.

   Four groups, because they map onto how someone actually thinks about a
   smallholding rather than onto the internal chore types:

     Animals    collecting produce and mucking out
     Harvest    bringing in ripe beds and the orchard
     Water      keeping the beds watered
     Tidy       weeding

   Within a group the most urgent goes first - the driest bed, the fullest
   pen - so ordering the groups never means watching someone weed while a
   crop dies.

   IMPLEMENTED BY STANDING IN FOR partnerHelps RATHER THAN PATCHING IT.
   The base builds its list inside a closure that cannot be reached from
   out here, so the order cannot be influenced from outside. It early
   returns when nobody is available to help, so the base runs with an
   empty household - doing nothing - and the real pass runs after with the
   list in the player's order. Same shape as the fix in p95 for the
   logistics reserve, and for the same reason.
   ===================================================================== */

const PRIO = {
  animals: { n:'The animals', types:['collect','clean'],
             d:'Collecting eggs and milk, and mucking out.' },
  harvest: { n:'The harvest', types:['harvest','pick'],
             d:'Bringing in ripe beds, orchards and berries.' },
  water:   { n:'Watering',    types:['water'],
             d:'Keeping the beds watered before they wilt.' },
  tidy:    { n:'Weeding',     types:['weed'],
             d:'Staying on top of the weeds.' },
};
const PRIO_DEFAULT = ['harvest','animals','water','tidy'];

function prioOrder(){
  if(!Array.isArray(S.priorities)) S.priorities = PRIO_DEFAULT.slice();
  /* survive a save written before this existed, or a bad edit */
  S.priorities = S.priorities.filter(k=>PRIO[k]);
  PRIO_DEFAULT.forEach(k=>{ if(S.priorities.indexOf(k) < 0) S.priorities.push(k); });
  return S.priorities;
}
function prioRankOf(type){
  const order = prioOrder();
  for(let i=0;i<order.length;i++)
    if(PRIO[order[i]].types.indexOf(type) >= 0) return i;
  return order.length;
}

/* How badly this particular job needs doing. Every type is normalised to
   the same 0..1 scale - how far past its own trigger the thing has gone -
   because these are compared against each other inside a group. A first
   version scored collecting as ready/40 and mucking out as 1-care, which
   are not the same units at all: a pen holding 20 scored 0.5 against 0.8
   for a bit of muck, so a household told to put the animals first spent
   every hand mucking out and collected nothing. A pen full enough to
   stall production is the urgent one. */
function choreUrgency(c){
  const o = c.o;
  if(c.t === 'water')   return Math.min(1, (0.4 - (o.water || 0)) / 0.4);
  if(c.t === 'clean')   return Math.min(1, (0.5 - (o.care === undefined ? 1 : o.care)) / 0.5);
  if(c.t === 'collect'){
    const cap = (typeof penCapacity === 'function') ? penCapacity(o) : 40;
    return Math.min(1, (o.ready || 0) / (cap && isFinite(cap) ? cap : 40));
  }
  if(c.t === 'weed')    return Math.min(1, ((o.weeds || 0) - 0.5) / 0.5);
  return Math.min(1, ((o.stage || 0) - 1) / 0.6 * 0.5 + 0.5);  /* ripe, then overripe */
}

function choreList(){
  const out = [];
  (S.objs || []).forEach(o=>{
    const bp = BPMAP[o.bp]; if(!bp) return;
    if(bp.kind==='plot' && o.crop && o.water < 0.4) out.push({o, t:'water'});
    if(bp.kind==='plot' && o.crop && o.stage >= 1)  out.push({o, t:'harvest'});
    if(bp.kind==='plot' && (o.weeds||0) > 0.5)      out.push({o, t:'weed'});
    if(bp.kind==='animal' && o.ready > 0)           out.push({o, t:'collect'});
    if(bp.kind==='animal' && (o.care||1) < 0.5)     out.push({o, t:'clean'});
    if(bp.kind==='perennial' && o.stage >= 1)       out.push({o, t:'pick'});
  });
  return out.sort((a,b)=>{
    const r = prioRankOf(a.t) - prioRankOf(b.t);
    return r !== 0 ? r : choreUrgency(b) - choreUrgency(a);
  });
}

function doChore(c){
  const o = c.o, bp = BPMAP[o.bp];
  if(c.t === 'water'){
    if(S.water < 8) return 0;
    S.water -= 8; o.water = 1; return 1;
  }
  if(c.t === 'harvest'){
    const cr = CROPS[o.crop];
    const q = Math.max(1, Math.round(cr.yield * E.slots(o) * cropMul(o)));
    give(o.crop, q);
    o.fert = clamp(o.fert - 0.16, 0.15, 1); o.last = o.crop;
    o.crop = null; o.stage = 0; o.weeds = 0;
    return q;
  }
  if(c.t === 'pick'){    const q = E.qty(o); give(bp.good, q); o.stage = 0; return q; }
  if(c.t === 'collect'){ const q = o.ready; give(bp.good, q); o.ready = 0; return q; }
  if(c.t === 'clean'){ o.care = 1; return 1; }
  if(c.t === 'weed'){  o.weeds = 0; return 1; }
  return 0;
}

function helpersRun(){
  const helpers = (S.family || []).filter(f=>f.role === 'partner' || f.role === 'adult');
  if(!helpers.length) return;
  const chores = choreList();
  if(!chores.length){ helpers.forEach(h=>h.helped = 0); return; }

  let idx = 0, picked = 0;
  const byGroup = {};
  helpers.forEach(p=>{
    const rate = p.role === 'partner' ? 0.30 : 0.15;
    const cap  = p.role === 'partner' ? 4 : 2;
    const share = Math.min(cap, Math.max(1, Math.round(chores.length * rate)));
    let did = 0;
    while(idx < chores.length && did < share){
      const c = chores[idx++];
      /* a job it cannot do - no water in the tank - is skipped, not
         counted, so it does not silently eat someone's day */
      const n0 = doChore(c);
      if(!n0) continue;
      did++;
      if(c.t === 'harvest' || c.t === 'pick' || c.t === 'collect') picked += n0;
      const g = prioOrder().find(k=>PRIO[k].types.indexOf(c.t) >= 0);
      if(g) byGroup[g] = (byGroup[g] || 0) + 1;
    }
    p.helped = did;
  });

  const total = helpers.reduce((a,h)=>a + (h.helped || 0), 0);
  if(total){
    S.morale = clamp((S.morale || 0.6) + 0.02, 0, 1);
    const who = helpers.filter(h=>h.helped).map(h=>h.name).join(' and ');
    const focus = Object.keys(byGroup).sort((a,b)=>byGroup[b]-byGroup[a])[0];
    log(`${who} got through ${total} job${total>1?'s':''}${focus?`, mostly ${PRIO[focus].n.toLowerCase()}`:''}`
      + `${picked?` — brought in ${picked}`:''}.`, 'good');
    /* what they did NOT get to is the point of the feature, so say it */
    const left = choreList().length;
    if(left > 3) log(`${left} jobs are still waiting. Set the household's priorities in Family.`, '', 'farm');
  }
}

/* stand in for the base: run it with nobody available so it does nothing,
   then do the same work in the player's order */
if(typeof partnerHelps === 'function'){
  const _partnerBase = partnerHelps;
  partnerHelps = function(){
    if(typeof SET === 'function' && !SET('familyLife')) return;
    const held = S.family;
    S.family = [];
    try{ _partnerBase.apply(this, arguments); }
    finally{ S.family = held; }
    try{ peopleInit(); helpersRun(); }catch(e){}
  };
}

/* ---------- what they are seen doing follows the top priority ----------
   Ordering the list is invisible if the family still wander to whatever
   the clock says. When someone is doing farm work rather than resting or
   eating, send them to the kind of thing the household has put first. */
if(typeof routine === 'function'){
  const _routinePrio = routine;
  routine = function(p){
    const base = _routinePrio.apply(this, arguments);
    try{
      if(!base || !/tending the beds|feeding the animals|house chores|working/.test(base.act || ''))
        return base;
      const top = prioOrder()[0];
      const want = top === 'animals' ? ['animal']
                 : top === 'water' || top === 'harvest' || top === 'tidy' ? ['plot','perennial'] : null;
      if(!want) return base;
      const pool = (S.objs || []).filter(o=>BPMAP[o.bp] && want.indexOf(BPMAP[o.bp].kind) >= 0);
      if(!pool.length) return base;
      const o = pool[Math.floor(hash((p.id||'x').length*2.3 + (S.day||0)) * pool.length)] || pool[0];
      const f = footprint(BPMAP[o.bp], o.rot);
      return { x:(o.tx + f.w/2)*T, y:(o.ty + f.h*0.62)*T,
               act: top === 'animals' ? 'feeding the animals'
                  : top === 'water'   ? 'watering the beds'
                  : top === 'tidy'    ? 'weeding'
                  : 'tending the beds' };
    }catch(e){ return base; }
  };
}

/* ---------- the panel ---------- */
G.prioMove = function(k, dir){
  const order = prioOrder();
  const i = order.indexOf(k);
  const j = i + dir;
  if(i < 0 || j < 0 || j >= order.length) return;
  order[i] = order[j]; order[j] = k;
  S.priorities = order;
  if(typeof save === 'function') try{ save(); }catch(e){}
  if(typeof ui === 'function') ui();
  if(typeof toast === 'function') toast(`${PRIO[k].n} is now ${j===0?'first':`#${j+1}`}`, 'good');
};

function prioHTML(){
  const order = prioOrder();
  const waiting = choreList();
  const byGroup = {};
  waiting.forEach(c=>{
    const g = order.find(k=>PRIO[k].types.indexOf(c.t) >= 0);
    if(g) byGroup[g] = (byGroup[g] || 0) + 1;
  });
  const hands = (S.family||[]).filter(f=>f.role==='partner'||f.role==='adult')
    .reduce((a,f)=>a + (f.role==='partner'?4:2), 0);

  let h = `<div class="ph">The household's priorities</div>
    <div class="card">
      <div class="muted">There are more jobs than hands most days. This is the order
      they get worked through — whatever is left over waits until tomorrow.</div>
      <div class="ledrow" style="margin-top:7px"><span>Jobs waiting</span><b>${waiting.length}</b></div>
      <div class="ledrow"><span>The household clears</span><b>about ${hands} a day</b></div>
      ${hands === 0 ? `<div class="warnbox">Nobody in the house helps with the farm yet.
        A partner or a relative would.</div>` : ''}
    </div>`;

  order.forEach((k,i)=>{
    const p = PRIO[k], n0 = byGroup[k] || 0;
    const reached = i === 0 ? true : null;
    h += `<div class="person" data-tip="${esc(`<b>${p.n}</b>${p.d}<hr><div class="tl"><span>Waiting now</span><b>${n0}</b></div><span class="tg">Within a group the most urgent is done first — the driest bed, the fullest pen.</span>`)}">
      <span class="pav" style="background:${['#7cc24f','#e8a33d','#5f9cc4','#a98fd0'][i]};
        display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;color:#12210a">${i+1}</span>
      <span class="pm"><b>${p.n}</b><span class="muted">${n0} waiting${n0 && i>1 ? ' · may not get done' : ''}</span></span>
      <button class="chip" ${i===0?'disabled':''} onclick="G.prioMove('${k}',-1)" aria-label="Move up">▲</button>
      <button class="chip" ${i===order.length-1?'disabled':''} onclick="G.prioMove('${k}',1)" aria-label="Move down">▼</button>
    </div>`;
  });
  return h;
}

/* into the Family panel, above the household list */
if(typeof homeLifeHTML === 'function'){
  const _homeLifePrio = homeLifeHTML;
  homeLifeHTML = function(){
    const base = _homeLifePrio.apply(this, arguments);
    let mine = '';
    try{ mine = prioHTML(); }catch(e){ return base; }
    /* after the morale card, before "Who lives here" */
    const key = `<div class="ph">Who lives here`;
    const i = base.indexOf(key);
    return i < 0 ? base + mine : base.slice(0,i) + mine + base.slice(i);
  };
}

/* ---------- handle ---------- */
G.prioAudit = function(){
  const order = prioOrder();
  const chores = choreList();
  return {
    order: order.map((k,i)=>`${i+1}. ${PRIO[k].n}`),
    jobsWaiting: chores.length,
    firstTen: chores.slice(0,10).map(c=>`${c.t} (${BPMAP[c.o.bp].name}, urgency ${choreUrgency(c).toFixed(2)})`),
    handsPerDay: (S.family||[]).filter(f=>f.role==='partner'||f.role==='adult')
      .reduce((a,f)=>a + (f.role==='partner'?4:2), 0),
    note: 'the base pass is run with an empty household so it does nothing; this ordering replaces it',
  };
};
