/* =====================================================================
   HOUSEHOLD — add and remove the people who live with you
   ===================================================================== */

const FAM_LIMITS = {partner:1, adult:2, child:5};
const FAM_COST   = {partner:380, adult:340, child:240};   // per month, per head
const FAM_NAMES  = {
  partner:['Rina','Sofia','Amara','Noor','Elin','Maya','Tara','Iris'],
  adult  :['Dad','Mum','Uncle Ray','Aunt Bea','Nana','Grandad','Kaya','Milo'],
  child  :['Arjun','Lila','Sam','Zara','Theo','Anya','Rafi','Nina','Ivo','Suri'],
};
const FAM_SHIRT = {
  partner:'#8f6fc4', adult:'#4f8a9c',
  child:['#e8a33d','#5fb0d4','#dd6f9c','#7cc24f','#e2705c'],
};

function famCount(role){ peopleInit(); return S.family.filter(f=>f.role===role).length; }
function canAdd(role){ return famCount(role) < FAM_LIMITS[role]; }
function householdCost(){
  peopleInit();
  return S.family.reduce((a,f)=> a + (FAM_COST[f.role]||0), 0);
}

function addFamily(role){
  peopleInit();
  if(!canAdd(role)){
    const limit = FAM_LIMITS[role];
    return toast(`Room for ${limit} ${role}${limit>1?'s':''} at most`,'bad'), sfx('error');
  }
  const used = S.family.map(f=>f.name);
  const pool = FAM_NAMES[role].filter(n=>!used.includes(n));
  const name = pool.length ? pool[Math.floor(Math.random()*pool.length)]
                           : role.charAt(0).toUpperCase()+role.slice(1)+' '+(famCount(role)+1);
  const kids = famCount('child');
  const f = {
    id:'f'+Date.now()+Math.floor(Math.random()*999),
    role, name,
    shirt: role==='child' ? FAM_SHIRT.child[kids % FAM_SHIRT.child.length] : FAM_SHIRT[role],
    sc: role==='child' ? (0.66 + Math.random()*0.16) : (1.02 + Math.random()*0.1),
    x:(FARM.x+4)*T, y:(FARM.y+4)*T, path:[], state:'idle', dir:1, t:0, act:'', helped:0
  };
  S.family.push(f);
  sfx('collect');
  toast(`${name} joined the household`,'good');
  log(`${name} moved in. Household costs are now ${fmt(householdCost())}/month.`,'gold');
  render(); ui(); G.save();
}

function removeFamily(id){
  peopleInit();
  const f = S.family.find(z=>z.id===id);
  if(!f) return;
  if(SET('confirmSell') && !confirm(`${f.name} moves away from the farm?`)) return;
  S.family = S.family.filter(z=>z.id!==id);
  S.morale = clamp((S.morale||0.6) - 0.08, 0, 1);
  sfx('remove');
  toast(`${f.name} has moved away`,'');
  log(`${f.name} moved away.`);
  render(); ui(); G.save();
}

/* household costs join the monthly ledger */
if(typeof outgoings === 'function'){
  const _out18 = outgoings;
  outgoings = function(){
    const o = _out18();
    if(!o.total && !SET('billsOn')) return o;
    o.household = householdCost();
    o.total += o.household;
    return o;
  };
}

/* every adult in the house pitches in; the partner most of all */
if(typeof partnerHelps === 'function'){
  partnerHelps = function(){
    if(!SET('familyLife')) return;
    peopleInit();
    const helpers = S.family.filter(f=>f.role==='partner' || f.role==='adult');
    if(!helpers.length) return;

    const chores = [];
    S.objs.forEach(o=>{
      const bp = BPMAP[o.bp];
      if(bp.kind==='plot' && o.crop && o.water < 0.4) chores.push({o, t:'water'});
      if(bp.kind==='plot' && o.crop && o.stage >= 1)  chores.push({o, t:'harvest'});
      if(bp.kind==='plot' && (o.weeds||0) > 0.5)      chores.push({o, t:'weed'});
      if(bp.kind==='animal' && o.ready > 0)           chores.push({o, t:'collect'});
      if(bp.kind==='animal' && (o.care||1) < 0.5)     chores.push({o, t:'clean'});
      if(bp.kind==='perennial' && o.stage >= 1)       chores.push({o, t:'pick'});
    });
    if(!chores.length){ helpers.forEach(h=>h.helped=0); return; }

    let idx = 0, picked = 0;
    helpers.forEach(p=>{
      /* a partner gives about a third of the list; another adult about half that */
      const rate = p.role==='partner' ? 0.30 : 0.15;
      const cap  = p.role==='partner' ? 4 : 2;
      const share = Math.min(cap, Math.max(1, Math.round(chores.length * rate)));
      let did = 0;
      while(idx < chores.length && did < share){
        const c = chores[idx++], o = c.o, bp = BPMAP[o.bp];
        if(c.t==='water' && S.water >= 8){ S.water -= 8; o.water = 1; did++; }
        else if(c.t==='harvest'){
          const cr = CROPS[o.crop];
          const q = Math.max(1, Math.round(cr.yield*E.slots(o)*cropMul(o)));
          give(o.crop, q); picked += q;
          o.fert = clamp(o.fert-0.16, 0.15, 1); o.last = o.crop;
          o.crop = null; o.stage = 0; o.weeds = 0; did++;
        }
        else if(c.t==='pick'){ const q=E.qty(o); give(bp.good,q); picked+=q; o.stage=0; did++; }
        else if(c.t==='collect'){ give(bp.good,o.ready); picked+=o.ready; o.ready=0; did++; }
        else if(c.t==='clean'){ o.care = 1; did++; }
        else if(c.t==='weed'){ o.weeds = 0; did++; }
      }
      p.helped = did;
    });
    const total = helpers.reduce((a,h)=>a+(h.helped||0),0);
    if(total){
      S.morale = clamp((S.morale||0.6) + 0.02, 0, 1);
      const who = helpers.filter(h=>h.helped).map(h=>h.name).join(' and ');
      log(`${who} got through ${total} job${total>1?'s':''} around the farm${picked?` and brought in ${picked}`:''}.`, 'good');
    }
  };
}

/* children need somewhere to sleep — too many for the house costs morale */
function housingStrain(){
  peopleInit();
  const home = HOMEMAP[S.homeId];
  const beds = home ? (home.size==='One bedroom' ? 2 : home.size==='Three bedroom' ? 4 : 6) : 4;
  return Math.max(0, S.family.length + 1 - beds);
}
if(typeof recreationDay === 'function'){
  const _rec = recreationDay;
  recreationDay = function(){
    _rec();
    const over = housingStrain();
    if(over > 0){
      S.morale = clamp((S.morale||0.6) - 0.03*over, 0, 1);
      if(Math.random() < 0.15)
        log(`The house is crowded — ${over} more ${over>1?'people':'person'} than it sleeps. A bigger home would help.`,'bad');
    }
  };
}

/* ---------------- the Family panel, rebuilt ---------------- */
homeLifeHTML = function(){
  peopleInit();
  const beds = workerBeds(), used = S.workers.length;
  const morale = S.morale===undefined ? 0.6 : S.morale;
  const home = HOMEMAP[S.homeId];
  const over = housingStrain();

  let h = `<div class="card">
    <div class="eyebrow">Household morale</div>
    <div class="bar"><i style="transform:scaleX(${morale.toFixed(3)});background:linear-gradient(90deg,#c47fa8,#f0a8c8)"></i></div>
    <div class="muted" style="margin-top:5px">Time together lifts morale, morale pulls back burnout, and
    burnout is what your salary is scaled by.</div>
    <div class="ledrow" style="margin-top:7px"><span>Household costs</span><b>${fmt(householdCost())}/mo</b></div>
    ${over>0?`<div class="warnbox">The ${home?home.size.toLowerCase():'house'} sleeps
      ${S.family.length+1-over}. You are ${over} over — morale is suffering.</div>`:''}
  </div>

  <div class="ph">Who lives here
    <span style="color:var(--txt3);font-weight:500">${S.family.length+1} including you</span></div>`;

  h += `<div class="person" data-tip="${esc('<b>You</b>The one doing the walking. Farm jobs and client work come out of the same ten hours.')}">
    <span class="pav" style="background:#c8583f"></span>
    <span class="pm"><b>You</b><span class="muted">${prof().name}</span></span></div>`;

  S.family.forEach(f=>{
    const role = f.role==='partner' ? 'Partner' : f.role==='adult' ? 'Family' : 'Child';
    const helps = (f.role==='partner'||f.role==='adult');
    h += `<div class="person" data-tip="${esc(`<b>${f.name}</b>${helps?'Works the farm alongside you — a partner clears about 30% of the daily chores, another adult about 15%.':'Studies in the morning, plays in the afternoon, and uses whatever you build in Leisure.'}<hr><div class="tl"><span>Right now</span><b>${f.act||'at home'}</b></div><div class="tl"><span>Costs</span><b>${fmt(FAM_COST[f.role])}/mo</b></div>${helps?`<div class="tl"><span>Jobs yesterday</span><b>${f.helped||0}</b></div>`:''}`)}">
      <span class="pav" style="background:${f.shirt}"></span>
      <span class="pm">
        <input class="pname" value="${f.name}" onchange="G.renameFamily('${f.id}', this.value)" aria-label="Name">
        <span class="muted">${role} · ${f.act||'at home'}</span></span>
      <button class="chip" onclick="removeFamily('${f.id}')"
        data-tip="${esc(`<b>${f.name} moves away</b>Removes them from the household and its costs. Morale takes a knock.`)}">Move out</button>
    </div>`;
  });

  h += `<div style="padding:8px 11px;display:flex;gap:6px;flex-wrap:wrap">
    <button class="chip" ${canAdd('partner')?'':'disabled'} onclick="addFamily('partner')"
      data-tip="${esc(`<b>Add a partner</b>Works the farm with you — about 30% of the daily chores.<hr><div class="tl"><span>Costs</span><b>${fmt(FAM_COST.partner)}/mo</b></div><div class="tl"><span>Limit</span><b>${FAM_LIMITS.partner}</b></div>`)}">
      + Partner ${famCount('partner')}/${FAM_LIMITS.partner}</button>
    <button class="chip" ${canAdd('child')?'':'disabled'} onclick="addFamily('child')"
      data-tip="${esc(`<b>Add a child</b>Studies, plays, and uses everything in the Leisure category.<hr><div class="tl"><span>Costs</span><b>${fmt(FAM_COST.child)}/mo</b></div><div class="tl"><span>Limit</span><b>${FAM_LIMITS.child}</b></div>`)}">
      + Child ${famCount('child')}/${FAM_LIMITS.child}</button>
    <button class="chip" ${canAdd('adult')?'':'disabled'} onclick="addFamily('adult')"
      data-tip="${esc(`<b>Add a relative</b>Another pair of hands — about 15% of the daily chores.<hr><div class="tl"><span>Costs</span><b>${fmt(FAM_COST.adult)}/mo</b></div><div class="tl"><span>Limit</span><b>${FAM_LIMITS.adult}</b></div>`)}">
      + Relative ${famCount('adult')}/${FAM_LIMITS.adult}</button>
  </div>`;

  h += `<div class="ph">Farmhands <span style="color:var(--txt3);font-weight:500">${used} of ${beds} beds</span></div>`;
  if(!beds) h += `<div class="empty">No worker housing yet.<div style="margin-top:6px">Build a
    <b>worker cottage</b> from the Home category — it sleeps two, and one more per upgrade.</div></div>`;
  S.workers.forEach(w=>{
    h += `<div class="person" data-tip="${esc(`<b>${w.name}</b>Skill ${w.skill} — does ${2+w.skill} jobs a day.<hr><div class="tl"><span>Wage</span><span class="tk">${fmt(w.wage)}/month</span></div><div class="tl"><span>Jobs yesterday</span><b>${w.done||0}</b></div>`)}">
      <span class="pav" style="background:#4f8a9c"></span>
      <span class="pm"><b>${w.name}</b><span class="muted">skill ${w.skill} · ${fmt(w.wage)}/mo · ${w.done||0} jobs yesterday</span></span>
      <button class="chip" onclick="fireWorker('${w.id}')">Let go</button></div>`;
  });
  const canHire = used < beds;
  h += `<div style="padding:9px 11px">
    <button class="btn wide ${canHire?'':'ghost'}" ${canHire?'':'disabled'} onclick="hireWorker()">
      ${canHire?'Hire a farmhand':'Build a cottage first'}</button>
    <div class="muted" style="margin-top:6px">Wages ${fmt(workerWages())}/mo ·
    household ${fmt(householdCost())}/mo</div></div>`;
  return h;
};

/* relatives follow the partner's timetable */
if(typeof routine === 'function'){
  const _rt18 = routine;
  routine = function(p){
    if(p.role === 'adult') return _rt18({...p, role:'partner'});
    return _rt18(p);
  };
}
