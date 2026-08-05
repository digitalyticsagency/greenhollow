/* =====================================================================
   SYSTEMS — upgrade tiers, living animals, husbandry & soil, automation
   ===================================================================== */

/* ---------------------------------------------------------------
   1. UPGRADE TIERS  — every building has 4 marks, so the catalogue
      of 44 buildings becomes 176 distinct, visibly different variants.
   --------------------------------------------------------------- */
const TIERS = [
  {n:'Mk I',   sub:'basic',      col:'#a7b79a'},
  {n:'Mk II',  sub:'improved',   col:'#7cc24f'},
  {n:'Mk III', sub:'commercial', col:'#6fb6d8'},
  {n:'Mk IV',  sub:'automated',  col:'#f0c14b'},
];
const MAXTIER = 3;

function tOf(o){ return o.tier||0; }
function upCost(o){ const bp=BPMAP[o.bp]; return Math.round((bp.cost||60)*(0.9+tOf(o)*0.85)+40); }
function canUpgrade(o){ return tOf(o) < MAXTIER && BPMAP[o.bp].kind!=='home'; }

/* effective stats, tier-scaled */
const E = {
  slots:  o=> (BPMAP[o.bp].slots||1) + tOf(o),
  speed:  o=> (BPMAP[o.bp].speed||1) * (1 + tOf(o)*0.16),
  qty:    o=> Math.round((BPMAP[o.bp].qty||0) * (1 + tOf(o)*0.42)),
  cycle:  o=> Math.max(1, +(BPMAP[o.bp].cycle / (1 + tOf(o)*0.2)).toFixed(2)),
  cap:    o=> Math.round((BPMAP[o.bp].cap||0) * (1 + tOf(o)*0.5)),
  per:    o=> +((BPMAP[o.bp].per||0) * (1 + tOf(o)*0.32)).toFixed(2),
  income: o=> Math.round((BPMAP[o.bp].income||0) * (1 + tOf(o)*0.5)),
  rate:   o=> +((BPMAP[o.bp].rate||0) * (1 + tOf(o)*0.45)).toFixed(2),
  gen:    o=> +((BPMAP[o.bp].power>0?BPMAP[o.bp].power:0) * (1 + tOf(o)*0.5)).toFixed(1),
  wcap:   o=> Math.round((BPMAP[o.bp].cap||0) * (1 + tOf(o)*0.6)),
  gain:   o=> Math.round((BPMAP[o.bp].gain||0) * (1 + tOf(o)*0.5)),
  charm:  o=> Math.round((BPMAP[o.bp].charm||0) * (1 + tOf(o)*0.35)),
  feed:   o=> +((BPMAP[o.bp].feed||0) * (1 + tOf(o)*0.5)).toFixed(1),
};

function upgrade(id){
  const o = S.objs.find(z=>z.id===id); if(!o) return;
  if(!canUpgrade(o)) return toast('Already at Mk IV','bad'), sfx('error');
  const c = upCost(o);
  if(S.cash < c) return toast(`Need ${fmt(c-S.cash)} more`,'bad'), sfx('error');
  S.cash -= c; o.tier = tOf(o)+1;
  addXP(Math.round(c/12)+6);
  sfx('upgrade');
  toast(`${BPMAP[o.bp].name} → ${TIERS[o.tier].n}`,'gold');
  log(`Upgraded ${BPMAP[o.bp].name} to ${TIERS[o.tier].n} for ${fmt(c)}.`,'gold');
  render(); ui(); G.save();
}

/* visible tier dressing drawn over any building's base art */
function tierSkin(w,h,tier,bp){
  if(!tier) return '';
  let s = '';
  /* Mk II — steel trim and a service light */
  if(tier>=1){
    s += `<rect x="1" y="1" width="${n(w-2)}" height="${n(h-2)}" rx="3" fill="none"
      stroke="#c3ccd2" stroke-width="1.1" opacity=".55"/>`;
    s += `<circle class="twinkle" cx="${n(w-5)}" cy="${n(h-5)}" r="1.7" fill="#ffd97a"/>`;
  }
  /* Mk III — extra plant: tanks, vents, a service annex */
  if(tier>=2){
    s += `<rect x="${n(w*0.06)}" y="${n(h*0.06)}" width="${n(w*0.16)}" height="${n(h*0.16)}" rx="2"
      fill="#8d979d" stroke="#5f696f" stroke-width="0.8"/>`;
    s += `<circle cx="${n(w*0.14)}" cy="${n(h*0.14)}" r="${n(Math.min(w,h)*0.035)}" fill="#c9d2d7"/>`;
    for(let i=0;i<3;i++)
      s += `<rect x="${n(w*0.72+i*w*0.075)}" y="${n(h*0.05)}" width="${n(w*0.045)}" height="${n(h*0.1)}" rx="1" fill="#98a2a8"/>`;
  }
  /* Mk IV — automation mast, sensors and a status readout */
  if(tier>=3){
    const mx = w*0.5;
    s += `<rect x="${n(mx-0.9)}" y="${n(-h*0.14)}" width="1.8" height="${n(h*0.3)}" fill="#b9c2c7"/>`;
    s += `<circle class="pulse" cx="${n(mx)}" cy="${n(-h*0.14)}" r="2.2" fill="#6fb6d8"/>`;
    s += `<path d="M${n(mx-6)} ${n(-h*0.09)} a 6 6 0 0 1 12 0" stroke="#6fb6d8" stroke-width="0.9" fill="none" opacity=".7"/>`;
    s += `<rect x="${n(w*0.3)}" y="${n(h*0.82)}" width="${n(w*0.4)}" height="${n(h*0.1)}" rx="1.5" fill="#12202a" opacity=".9"/>`;
    for(let i=0;i<4;i++)
      s += `<rect class="twinkle" style="animation-delay:${(i*0.35).toFixed(2)}s" x="${n(w*0.33+i*w*0.09)}" y="${n(h*0.845)}"
        width="${n(w*0.05)}" height="${n(h*0.05)}" fill="#7cc24f"/>`;
  }
  return s;
}

/* ---------------------------------------------------------------
   2. LIVING ANIMALS — each beast has a position and wanders or runs
      around its pen, updated on its own light timer.
   --------------------------------------------------------------- */
const SPECIES = {
  chicken:{sc:0.95, walk:5.5, run:17, restless:0.9, sound:'cluck'},
  duck   :{sc:0.95, walk:4.5, run:12, restless:0.7, sound:'cluck'},
  goat   :{sc:1.0,  walk:4.0, run:13, restless:0.6, sound:'bleat'},
  sheep  :{sc:1.0,  walk:3.0, run:10, restless:0.4, sound:'bleat'},
  rabbit :{sc:0.85, walk:6.0, run:20, restless:1.0, sound:'cluck'},
  hive   :{sc:0.6,  walk:0,   run:0,  restless:0,   sound:'bee'},
};

function penBounds(o){
  const f = footprint(BPMAP[o.bp], o.rot);
  return {x0:o.tx*T+10, y0:o.ty*T+10, x1:(o.tx+f.w)*T-10, y1:(o.ty+f.h)*T-10};
}
function syncHerd(o){
  const bp = BPMAP[o.bp];
  if(bp.kind!=='animal' || bp.animal==='hive') return;
  if(!o.herd) o.herd = [];
  const b = penBounds(o);
  while(o.herd.length < o.animals){
    o.herd.push({
      x: b.x0 + Math.random()*(b.x1-b.x0), y: b.y0 + Math.random()*(b.y1-b.y0),
      tx:0, ty:0, dir:1, run:0, wait:Math.random()*3,
      age:0, health:1, happy:0.8
    });
    const a = o.herd[o.herd.length-1]; a.tx=a.x; a.ty=a.y;
  }
  while(o.herd.length > o.animals) o.herd.pop();
}
function tickLife(dt){
  if(!S || S.speed===0) return;
  S.objs.forEach(o=>{
    const bp = BPMAP[o.bp];
    if(bp.kind!=='animal' || bp.animal==='hive' || !o.herd) return;
    const sp = SPECIES[bp.animal] || SPECIES.chicken;
    const b = penBounds(o);
    const crowd = o.animals / Math.max(1, E.cap(o));
    o.herd.forEach(a=>{
      a.wait -= dt;
      if(a.wait <= 0){
        /* pick somewhere new; sometimes bolt for it */
        a.tx = b.x0 + Math.random()*Math.max(1,(b.x1-b.x0));
        a.ty = b.y0 + Math.random()*Math.max(1,(b.y1-b.y0));
        a.run = Math.random() < (0.18 + sp.restless*0.12 + crowd*0.1) ? 1 : 0;
        a.wait = a.run ? 0.7+Math.random()*1.2 : 1.6+Math.random()*3.4;
        if(Math.random()<0.02 && !SND.isMuted()) sfx(sp.sound);
      }
      const dx = a.tx-a.x, dy = a.ty-a.y, d = Math.hypot(dx,dy);
      if(d > 1.5){
        const v = (a.run ? sp.run : sp.walk) * (0.6+a.health*0.4) * dt;
        a.x += dx/d*v; a.y += dy/d*v;
        if(Math.abs(dx) > 0.4) a.dir = dx > 0 ? 1 : -1;
        a.moving = 1;
      } else a.moving = 0;
      a.x = clamp(a.x, b.x0, b.x1); a.y = clamp(a.y, b.y0, b.y1);
    });
  });
  paintHerd();
}
/* the herd lives in its own SVG layer so movement never re-renders the scene */
function herdLayer(){
  let s = '';
  S.objs.forEach(o=>{
    const bp = BPMAP[o.bp];
    if(bp.kind!=='animal' || bp.animal==='hive') return;
    syncHerd(o);
    (o.herd||[]).forEach((a,i)=>{
      const sp = SPECIES[bp.animal] || SPECIES.chicken;
      s += `<g class="beast" data-b="${o.id}_${i}" transform="translate(${n(a.x)},${n(a.y)})">
        <g class="bwalk"><g transform="scale(${a.dir},1)">${beast(bp.animal, 0, 0, sp.sc, false)}</g></g></g>`;
    });
  });
  return `<g id="herd">${s}</g>`;
}
function paintHerd(){
  S.objs.forEach(o=>{
    if(!o.herd) return;
    o.herd.forEach((a,i)=>{
      const el = document.querySelector(`[data-b="${o.id}_${i}"]`);
      if(!el) return;
      el.setAttribute('transform', `translate(${n(a.x)},${n(a.y)})`);
      const inner = el.firstElementChild;
      if(inner){
        inner.setAttribute('class', 'bwalk' + (a.moving ? (a.run ? ' running' : ' walking') : ''));
        const flip = inner.firstElementChild;
        if(flip) flip.setAttribute('transform', `scale(${a.dir},1)`);
      }
    });
  });
}

/* ---------------------------------------------------------------
   3. HUSBANDRY & SOIL — cleanliness, health, breeding, fertility, weeds
   --------------------------------------------------------------- */
function initCare(o){
  const bp = BPMAP[o.bp];
  if(bp.kind==='animal'){ if(o.care===undefined) o.care=1; if(o.sick===undefined) o.sick=0; }
  if(bp.kind==='plot'){ if(o.fert===undefined) o.fert=1; if(o.weeds===undefined) o.weeds=0; if(o.last===undefined) o.last=null; }
}
function herdHealth(o){
  if(!o.herd||!o.herd.length) return 1;
  return o.herd.reduce((a,b)=>a+b.health,0)/o.herd.length;
}
function herdHappy(o){
  if(!o.herd||!o.herd.length) return 1;
  return o.herd.reduce((a,b)=>a+b.happy,0)/o.herd.length;
}
/* how productive this pen is right now, 0..1.4 */
function yieldMul(o){
  const bp = BPMAP[o.bp];
  if(bp.animal==='hive') return 1 + tOf(o)*0.1;
  const crowd = o.animals / Math.max(1, E.cap(o));
  const space = crowd > 0.85 ? 0.78 : crowd > 0.6 ? 0.92 : 1.05;
  return clamp((0.35 + herdHealth(o)*0.45 + herdHappy(o)*0.3) * space * (o.sick?0.5:1), 0.15, 1.45);
}
function dailyHusbandry(o){
  const bp = BPMAP[o.bp];
  if(bp.kind!=='animal' || !o.animals) return;
  initCare(o);
  const crowd = o.animals / Math.max(1, E.cap(o));
  /* bedding gets dirty faster when the pen is full */
  o.care = clamp(o.care - (0.1 + crowd*0.16), 0, 1);
  const fed = !o.hungry;
  const watered = S.water > 5;
  if(watered) S.water -= Math.min(S.water, o.animals*0.6);
  (o.herd||[]).forEach(a=>{
    a.age += 1;
    const good = (fed?0.5:-0.5) + (o.care>0.45?0.3:-0.4) + (watered?0.2:-0.3) + (crowd>0.85?-0.2:0.1);
    a.happy  = clamp(a.happy  + good*0.22, 0, 1);
    a.health = clamp(a.health + (good>0 ? 0.1 : -0.16) - (o.sick?0.12:0), 0, 1);
  });
  /* disease risk climbs with filth and crowding */
  if(!o.sick && Math.random() < (1-o.care)*0.14 + crowd*0.05){
    o.sick = 1; log(`Illness in the ${bp.name}. Treat it before it spreads.`,'bad');
  }
  /* healthy, happy, uncrowded stock breeds */
  if(!o.sick && o.animals < E.cap(o) && herdHappy(o) > 0.7 && o.care > 0.55 && Math.random() < 0.1){
    o.animals++; syncHerd(o);
    log(`A ${bp.animal} was born in the ${bp.name}.`,'good');
    toast(`New ${bp.animal} born!`,'good');
  }
}
function dailySoil(o){
  const bp = BPMAP[o.bp];
  if(bp.kind!=='plot') return;
  initCare(o);
  if(o.crop){
    o.weeds = clamp(o.weeds + 0.13, 0, 1);
    if(o.weeds > 0.55) o.stage = Math.max(0, o.stage - 0.02);
  }
}
function cropMul(o){
  initCare(o);
  const rot = (o.crop && o.last && o.last !== o.crop) ? 1.15 : 1;
  return clamp((0.45 + o.fert*0.55) * rot * (1 - o.weeds*0.3), 0.3, 1.6);
}

/* ---------------------------------------------------------------
   4. AUTOMATION — modules run from the control hub. Each costs power
      and a daily service fee, and only works if the hub can carry it.
   --------------------------------------------------------------- */
const AUTOS = [
  {id:'irrigation', n:'Irrigation controller', hub:0, power:2, fee:6,  ic:'💧',
   d:'Waters any bed whose moisture drops below your threshold, every morning.',
   tip:'Ends hand-watering. Needs water in storage to actually do anything.'},
  {id:'harvest',    n:'Harvest drone',         hub:1, power:3, fee:14, ic:'🚁',
   d:'Picks every bed and orchard the moment it is ripe and stores the crop.',
   tip:'Nothing sits ripe and rotting while you are looking elsewhere.'},
  {id:'livestock',  n:'Livestock robot',       hub:1, power:3, fee:12, ic:'🤖',
   d:'Collects eggs, milk and honey, and mucks out every pen daily.',
   tip:'Cleanliness is what keeps animals healthy and breeding.'},
  {id:'agronomy',   n:'Agronomy AI',           hub:2, power:2, fee:16, ic:'🌱',
   d:'Replants every empty bed with the most profitable crop for the season.',
   tip:'It reads season, price and growth time, then picks the best margin.'},
  {id:'logistics',  n:'Logistics AI',          hub:2, power:3, fee:18, ic:'📦',
   d:'Fills any order it can, then sells surplus above your reserve.',
   tip:'Orders are always paid first — they beat market price.'},
  {id:'agrivoltaic',n:'Grid optimiser',        hub:3, power:0, fee:10, ic:'⚡',
   d:'Balances generation and storage. Adds 25% to everything you generate.',
   tip:'Worth it once greenhouses and processing are eating your power.'},
];
const AUTOMAP = {}; AUTOS.forEach(a=>AUTOMAP[a.id]=a);

function hub(){ return S.objs.find(o=>o.bp==='ai_hub'); }
function hubTier(){ const h = hub(); return h ? tOf(h) : -1; }
function autoOn(id){
  const h = hub();
  return !!(h && S.auto && S.auto[id] && hubTier() >= AUTOMAP[id].hub);
}
function autoList(){ return AUTOS.filter(a=>autoOn(a.id)); }
function autoPower(){ return autoList().reduce((a,b)=>a+b.power,0); }
function autoFees(){ return autoList().reduce((a,b)=>a+b.fee,0); }

function bestCropFor(o){
  const bp = BPMAP[o.bp];
  let best=null, bestScore=-1;
  Object.keys(CROPS).forEach(k=>{
    const cr = CROPS[k];
    const inS = cr.seasons.includes(S.season) || bp.shelter;
    const days = cr.days / (E.speed(o));
    const cost = Math.round(cr.seed*E.slots(o)*(1-stat().seedoff));
    const worth = cr.yield*E.slots(o)*sellPrice(k);
    const score = (worth - cost) / Math.max(0.6, days) * (inS?1:0.45);
    if(score > bestScore && S.cash > cost*2){ bestScore=score; best=k; }
  });
  return best;
}

function runAutomation(){
  if(!hub()) return;
  const acts = [];
  const st = stat();
  const powered = st.power >= st.use;
  S.autoPowered = powered;
  if(!powered && autoList().some(a=>a.power>0)){
    log('AI modules throttled — not enough power. Add solar or a turbine.','bad');
  }

  if(autoOn('irrigation')){
    const th = (S.autoCfg && S.autoCfg.moist) || 0.5;
    let cnt=0;
    S.objs.forEach(o=>{
      if(BPMAP[o.bp].kind==='plot' && o.crop && o.water < th && S.water >= 8){ S.water-=8; o.water=1; cnt++; }
    });
    if(cnt) acts.push(`watered ${cnt} bed${cnt>1?'s':''}`);
  }
  if(autoOn('harvest') && powered){
    let cnt=0, gained=0;
    S.objs.forEach(o=>{
      const bp = BPMAP[o.bp];
      if(bp.kind==='plot' && o.crop && o.stage>=1){
        const cr=CROPS[o.crop];
        const q = Math.max(1, Math.round(cr.yield*E.slots(o)*(1+st.workbonus)*cropMul(o)));
        give(o.crop,q); o.fert=clamp(o.fert-0.16,0.15,1); o.last=o.crop;
        o.crop=null; o.stage=0; o.weeds=0; cnt++; gained+=q; addXP(2);
      } else if(bp.kind==='perennial' && o.stage>=1){
        give(bp.good, E.qty(o)); o.stage=0; cnt++; gained+=E.qty(o); addXP(2);
      }
    });
    if(cnt) acts.push(`harvested ${cnt} plot${cnt>1?'s':''} (${gained} units)`);
  }
  if(autoOn('livestock') && powered){
    let col=0, cleaned=0;
    S.objs.forEach(o=>{
      const bp = BPMAP[o.bp];
      if(bp.kind!=='animal') return;
      if(o.ready>0){ give(bp.good, o.ready); col+=o.ready; o.ready=0; addXP(1); }
      if(o.care!==undefined && o.care<0.9){ o.care=1; cleaned++; }
    });
    if(col) acts.push(`collected ${col} product${col>1?'s':''}`);
    if(cleaned) acts.push(`cleaned ${cleaned} pen${cleaned>1?'s':''}`);
  }
  if(autoOn('agronomy') && powered){
    let cnt=0;
    S.objs.forEach(o=>{
      if(BPMAP[o.bp].kind!=='plot' || o.crop) return;
      const k = bestCropFor(o); if(!k) return;
      const cost = Math.round(CROPS[k].seed*E.slots(o)*(1-st.seedoff));
      if(S.cash < cost) return;
      S.cash-=cost; o.crop=k; o.stage=0; o.pest=0; o.weeds=0; o.water=Math.max(o.water,0.7); cnt++;
    });
    if(cnt) acts.push(`sowed ${cnt} bed${cnt>1?'s':''}`);
  }
  if(autoOn('logistics')){
    let filled=0, sold=0, made=0;
    S.contracts.slice().forEach(c=>{
      if((S.store[c.gid]||0) >= c.qty){
        S.store[c.gid]-=c.qty; if(S.store[c.gid]<=0) delete S.store[c.gid];
        S.cash+=c.pay; S.totalEarned+=c.pay; made+=c.pay; addXP(Math.round(c.pay/14));
        S.contracts = S.contracts.filter(z=>z.id!==c.id); filled++;
      }
    });
    const reserve = (S.autoCfg && S.autoCfg.reserve) || 10;
    Object.keys(S.store).forEach(k=>{
      const over = S.store[k] - reserve;
      if(over > 0){
        const v = over*sellPrice(k);
        S.store[k] = reserve; S.cash += v; S.totalEarned += v; made += v; sold += over;
      }
    });
    if(filled) acts.push(`filled ${filled} order${filled>1?'s':''}`);
    if(sold) acts.push(`sold ${sold} surplus for ${fmt(made)}`);
  }

  const fee = autoFees();
  if(fee){ S.cash -= fee; }
  S.autoLog = acts;
  if(acts.length){
    log(`AI: ${acts.join(', ')}. Service ${fmt(fee)}.`, 'good');
  } else if(fee){
    S.autoLog = [powered ? 'nothing needed doing' : 'throttled — not enough power'];
    log(`AI on standby, nothing to do. Service ${fmt(fee)}.`);
  }
}
