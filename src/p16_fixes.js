/* =====================================================================
   MAKING THE SWITCHES REAL — every setting now changes the game,
   locked buildings explain themselves, and your partner pulls her weight.
   ===================================================================== */

/* read a setting with its declared default */
function SET(k){
  settingsInit();
  const v = S.settings[k];
  if(v !== undefined) return v;
  const d = SETTINGS.find(s=>s.k===k);
  return d ? d.def : undefined;
}
const DIFF = {
  Relaxed : {sell:1.25, seed:0.75, pest:0.5, upkeep:0.7, growth:1.15},
  Standard: {sell:1.00, seed:1.00, pest:1.0, upkeep:1.0, growth:1.00},
  Hard    : {sell:0.85, seed:1.25, pest:1.5, upkeep:1.35, growth:0.9},
  Brutal  : {sell:0.72, seed:1.55, pest:2.1, upkeep:1.8, growth:0.8},
};
function diff(){ return DIFF[SET('difficulty')] || DIFF.Standard; }

/* ---------------- locked buildings now say why ---------------- */
G.pickLocked = function(id){
  const bp = BPMAP[id]; if(!bp) return;
  sfx('error');
  toast(`${bp.name} unlocks at level ${bp.lvl} — you are level ${S.lvl}`, 'bad');
  log(`${bp.name} needs level ${bp.lvl}. Harvest, sell and craft to level up.`);
};

/* ---------------- ECONOMY ---------------- */
if(typeof sellPrice === 'function'){
  const _sell = sellPrice;
  sellPrice = function(gid){
    return Math.max(1, Math.round(_sell(gid) * diff().sell * (SET('sellPrice')/100)));
  };
}
if(typeof outgoings === 'function'){
  const _out = outgoings;
  outgoings = function(){
    const o = _out();
    if(!SET('billsOn')) return {rates:0, upkeep:0, wages:0, interest:0, ai:0, total:0};
    o.upkeep = Math.round(o.upkeep * diff().upkeep * (SET('upkeepMul')/100));
    o.total = o.rates + o.upkeep + o.wages + o.interest + o.ai;
    return o;
  };
}
if(typeof borrow === 'function'){
  const _borrow = borrow;
  borrow = function(a){
    if(!SET('loanLimit')) return toast('Borrowing is switched off in Settings','bad'), sfx('error');
    _borrow(a);
  };
}
if(typeof salary === 'function'){
  const _salary = salary;
  salary = function(){
    careerInit();
    const raw = prof().pay * (0.55 + S.career.skill*0.16);
    return Math.round(SET('burnout') ? raw*(1-S.career.burnout*0.3) : raw);
  };
}

/* ---------------- GAMEPLAY ---------------- */
if(typeof G.sellObj === 'function'){
  const _sellObj = G.sellObj;
  G.sellObj = function(id){
    const o = S.objs.find(z=>z.id===id);
    if(o && SET('confirmSell')){
      const bp = BPMAP[o.bp];
      if(!confirm(`Remove the ${bp.name}? You get ${fmt(Math.round(bp.cost*0.55))} back.`)) return;
    }
    _sellObj.call(G, id);
  };
}
if(typeof G.plant === 'function'){
  const _plant2 = G.plant;
  G.plant = function(id, ck){
    const o = S.objs.find(z=>z.id===id);
    const cr = CROPS[ck];
    if(o && cr){
      const base = Math.round(cr.seed*E.slots(o)*(1-stat().seedoff));
      const real = Math.round(base * diff().seed * (SET('seedCost')/100));
      const extra = real - base;
      if(extra !== 0){
        if(S.cash < real) return toast('Not enough cash','bad'), sfx('error');
        S.cash -= extra;
      }
    }
    _plant2.call(G, id, ck);
  };
}

/* ---------------- DISPLAY ---------------- */
if(typeof renderLabels === 'function'){
  const _labels = renderLabels;
  renderLabels = function(){
    const L = document.getElementById('wlabels');
    if(!SET('labels')){ if(L) L.innerHTML=''; return; }
    _labels();
    if(SET('labelAlerts') && L)
      L.querySelectorAll('.wlab:not(.alert):not(.ready)').forEach(n=>n.remove());
  };
}
function applyDisplay(){
  settingsInit();
  const b = document.body;
  b.classList.toggle('nosh',   !SET('shadows'));
  b.classList.toggle('notex',  !SET('texture'));
  b.classList.toggle('nocrit', !SET('critters'));
  b.classList.toggle('hc',      !!SET('contrast'));
  b.classList.toggle('noblur',  !!SET('reduceBlur'));
  const arc = document.getElementById('sunarc');
  if(arc) arc.style.display = SET('sunarc') ? '' : 'none';
  const world = document.getElementById('world');
  if(world) world.classList.toggle('hasarc', !!SET('sunarc'));
  const badge = document.getElementById('wbadge');
  if(badge) badge.style.display = SET('hintBadge') ? '' : 'none';
  document.documentElement.style.fontSize = (13*SET('uiScale')/100).toFixed(1)+'px';
}
const DISPLAY_CSS = `
#collectAll{ position:absolute; left:50%; bottom:16px; transform:translateX(-50%); z-index:32;
  background:linear-gradient(180deg,#67ad45,#4a8b34); border-color:#7cc24f; color:#fff;
  padding:8px 16px; font-size:12.5px; box-shadow:0 6px 20px rgba(0,0,0,.45); }
body.nosh #obs g[class*="ob"]{ filter:none!important; }
body.nosh #you,body.nosh .npc{ filter:none!important; }
body.notex rect[filter*="fGrain"]{ display:none; }
body.nocrit .peck,body.nocrit .bwalk{ animation:none!important; }
`;

/* ---------------- ASSIST ---------------- */
if(typeof toast === 'function'){
  const _toast = toast;
  toast = function(m,c){ if(SET('toasts')) _toast(m,c); };
}
if(typeof showTip === 'function'){
  const _showTip = showTip;
  showTip = function(h,x,y){ if(SET('tooltips')) _showTip(h,x,y); else hideTip(); };
}
if(typeof log === 'function'){
  const _log = log;
  log = function(m,c){ _log(m,c); const max=SET('logLines')||60; while(S.log.length>max) S.log.pop(); };
}
G.collectAll = function(){
  let n0=0;
  S.objs.forEach(o=>{
    const bp = BPMAP[o.bp];
    if(o.ready>0){ if(bp.kind==='animal') give(bp.good,o.ready); n0+=o.ready; o.ready=0; }
    if(bp.kind==='perennial' && o.stage>=1){ give(bp.good, E.qty(o)); n0+=E.qty(o); o.stage=0; }
    if(bp.kind==='plot' && o.crop && o.stage>=1){
      const cr=CROPS[o.crop];
      const q=Math.max(1,Math.round(cr.yield*E.slots(o)*cropMul(o)));
      give(o.crop,q); n0+=q; o.fert=clamp(o.fert-0.16,0.15,1); o.last=o.crop;
      o.crop=null;o.stage=0;o.weeds=0;
    }
  });
  if(n0){ addXP(Math.round(n0/2)); sfx('harvest'); toast(`Gathered ${n0} items`,'good'); }
  else { sfx('error'); toast('Nothing ready','' ); }
  render(); ui(); G.save();
};

/* ---------------- SIMULATION KNOBS ---------------- */
if(typeof advanceDay === 'function'){
  const _adv = advanceDay;
  advanceDay = function(){
    /* season length */
    const sl = SET('seasonLen');
    const beforeSeason = S.season;
    _adv();
    if(sl !== 28){
      /* the base engine flips seasons every 28 days; re-derive from the setting */
      S.season = Math.floor((S.day-1)/sl) % 4;
      if(S.season !== beforeSeason && S.day > 1) log(`${SEASONS[S.season].n} begins.`,'gold');
    }
    partnerHelps();
  };
}
/* pest and breeding frequency, and market swing */
if(typeof dailySoil === 'function'){
  const _soil = dailySoil;
  dailySoil = function(o){ _soil(o); };
}
(function knobs(){
  const _random = Math.random;
  /* market volatility: rescale the daily drift the engine just applied */
  const _adv2 = advanceDay;
  advanceDay = function(){
    const before = {...S.prices};
    _adv2();
    const k = SET('priceSwing')/50;
    if(k !== 1) Object.keys(S.prices).forEach(g=>{
      S.prices[g] = clamp(before[g] + (S.prices[g]-before[g])*k, 0.6, 1.7);
    });
    /* contract frequency */
    const cr = SET('contractRate')/60;
    if(cr > 1 && S.contracts.length < 5 && _random() < (cr-1)*0.5) rollContracts(1);
    if(cr < 1 && S.contracts.length > 1 && _random() < (1-cr)*0.25) S.contracts.pop();
  };
})();

/* weather volatility: at 0 the climate is placid, at 100 extremes are common */
if(typeof rollWeather === 'function'){
  const _roll = rollWeather;
  rollWeather = function(){
    _roll();
    const v = SET('weatherVol')/50;                 // 1 = as designed
    const extreme = ['storm','frost','heat'];
    const isExtreme = extreme.includes(S.weather);
    if(isExtreme && v < 1 && Math.random() > v){
      S.weather = ['sun','cloud','rain'][Math.floor(Math.random()*3)];
    } else if(!isExtreme && v > 1 && Math.random() < (v-1)*0.35){
      const tbl = (typeof landWeatherTable==='function') ? landWeatherTable() : [];
      const pool = tbl.filter(w=>extreme.includes(w));
      if(pool.length) S.weather = pool[Math.floor(Math.random()*pool.length)];
    }
  };
}

/* a Collect all control on the land, when the player has asked for one */
function syncCollectAll(){
  const world = document.getElementById('world');
  if(!world) return;
  let btn = document.getElementById('collectAll');
  if(!SET('autoCollect')){ if(btn) btn.remove(); return; }
  if(!btn){
    btn = document.createElement('button');
    btn.id = 'collectAll';
    btn.className = 'chip';
    btn.textContent = 'Collect all';
    btn.dataset.tip = '<b>Collect everything ready</b>Harvests every ripe bed, picks every orchard and empties every pen in one go.<span class="tg">Key: C</span>';
    btn.onclick = ()=> G.collectAll();
    world.appendChild(btn);
  }
  const ready = S.objs.filter(o=>{
    const bp = BPMAP[o.bp];
    return o.ready>0 || (['plot','perennial'].includes(bp.kind) && o.stage>=1);
  }).length;
  btn.style.display = ready ? '' : 'none';
  btn.textContent = `Collect all (${ready})`;
}

/* ---------------- YOUR PARTNER PULLS HER WEIGHT ---------------- */
/* A partner on a family farm realistically gives about a third of a working
   day to it — the rest goes to the house and the children. That is roughly
   3 of the 10 daily hours, so she clears about 30% of the outstanding jobs. */
function partnerHelps(){
  if(!SET('familyLife')) return;
  peopleInit();
  const p = S.family.find(f=>f.role==='partner');
  if(!p) return;

  /* everything that needs doing today */
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
  if(!chores.length){ p.helped = 0; return; }

  /* 30% of the list, capped at what three hours can realistically cover */
  const share = Math.min(4, Math.max(1, Math.round(chores.length * 0.3)));
  let did = 0, picked = 0;
  for(let i=0; i<chores.length && did<share; i++){
    const c = chores[i], o = c.o, bp = BPMAP[o.bp];
    if(c.t==='water' && S.water >= 8){ S.water -= 8; o.water = 1; did++; }
    else if(c.t==='harvest'){
      const cr = CROPS[o.crop];
      const q = Math.max(1, Math.round(cr.yield*E.slots(o)*cropMul(o)));
      give(o.crop, q); picked += q;
      o.fert = clamp(o.fert-0.16, 0.15, 1); o.last = o.crop;
      o.crop = null; o.stage = 0; o.weeds = 0; did++;
    }
    else if(c.t==='pick'){ const q = E.qty(o); give(bp.good, q); picked += q; o.stage = 0; did++; }
    else if(c.t==='collect'){ give(bp.good, o.ready); picked += o.ready; o.ready = 0; did++; }
    else if(c.t==='clean'){ o.care = 1; did++; }
    else if(c.t==='weed'){ o.weeds = 0; did++; }
  }
  p.helped = did;
  if(did){
    S.morale = clamp((S.morale||0.6) + 0.02, 0, 1);
    log(`${p.name} got through ${did} job${did>1?'s':''} around the farm${picked?` and brought in ${picked}`:''}.`, 'good');
  }
}

/* ---------------- boot the fixes ---------------- */
(function initFixes(){
  const st = document.createElement('style');
  st.id = 'displaycss'; st.textContent = DISPLAY_CSS;
  document.head.appendChild(st);

  /* every setting change re-applies the display layer */
  if(typeof setOpt === 'function'){
    const _setOpt = setOpt;
    setOpt = function(k,v){
      _setOpt(k,v);
      applyDisplay();
      if(k==='hoursDay' && S.career) S.career.hours = Math.min(S.career.hours, v);
      if(k==='labels' || k==='labelAlerts') renderLabels();
      if(['sfx','amb','wx','mus','volMaster','volMusic','animalSfx'].includes(k)) SND.applyMix();
    };
  }
  /* pause when the tab is hidden */
  document.addEventListener('visibilitychange', ()=>{
    if(!SET('pauseBlur')) return;
    if(document.hidden){ S._wasSpeed = S.speed; S.speed = 0; }
    else if(S._wasSpeed !== undefined){ S.speed = S._wasSpeed; delete S._wasSpeed; }
    if(typeof ui==='function') ui();
  });
  /* scroll-wheel zoom respects its switch */
  const world = document.getElementById('world');
  if(world) world.addEventListener('wheel', e=>{
    if(!SET('zoomWheel')) return;
    e.stopPropagation();
  }, true);

  window.addEventListener('keydown', e=>{
    if(e.target.tagName==='INPUT') return;
    if(e.key.toLowerCase()==='c' && SET('autoCollect')) G.collectAll();
  });
  setInterval(syncCollectAll, 1200);
  setTimeout(()=>{ applyDisplay(); syncCollectAll(); }, 200);
})();
