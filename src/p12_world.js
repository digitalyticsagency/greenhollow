/* =====================================================================
   WORLD — wind, land selection, homes, and the settings panel
   ===================================================================== */

/* ---------------------------------------------------------------
   1. WIND — one number the whole world leans to
   --------------------------------------------------------------- */
function windNow(){
  const w = WEATHERS[S.weather];
  const base = {sun:0.25, cloud:0.5, rain:0.7, storm:1.55, frost:0.35, heat:0.4}[S.weather] || 0.4;
  const land = LANDMAP[S.landId] || {};
  return clamp(base * (1 + (land.wind||0)), 0.1, 2.2);
}
function applyWind(){
  if(S.settings && S.settings.motion === false){
    document.documentElement.style.setProperty('--wind-a','0deg');
    document.documentElement.style.setProperty('--wind-t','0s');
    return;
  }
  const w = windNow();
  document.documentElement.style.setProperty('--wind-a', (w*3.4).toFixed(2)+'deg');
  document.documentElement.style.setProperty('--wind-t', (5.6/Math.max(0.25,w)).toFixed(2)+'s');
  document.documentElement.style.setProperty('--wind-s', (1+w*0.02).toFixed(3));
  const world = document.getElementById('world');
  if(world) world.dataset.wx = S.weather;
}

/* weather particles: rain streaks, sand haze, snow */
function weatherLayer(){
  const w = S.weather;
  if(S.settings && S.settings.particles === false) return '';
  const land = LANDMAP[S.landId] || {};
  const dusty = land.dust;
  let s = '';
  if(w==='rain' || w==='storm'){
    const n0 = w==='storm' ? 150 : 80;
    for(let i=0;i<n0;i++){
      const x = hash(i*1.7)*WPX, y = hash(i*3.3)*HPX, len = w==='storm'?16:11;
      s += `<line class="rainline" x1="${n(x)}" y1="${n(y)}" x2="${n(x-4)}" y2="${n(y+len)}"
        stroke="#cfe6f5" stroke-width="1" opacity=".5" style="animation-delay:${(hash(i)*1.2).toFixed(2)}s"/>`;
    }
  }
  if(w==='frost'){
    for(let i=0;i<70;i++)
      s += `<circle class="snowflake" cx="${n(hash(i*2.1)*WPX)}" cy="${n(hash(i*4.4)*HPX)}" r="${(1+hash(i)*1.4).toFixed(1)}"
        fill="#fff" opacity=".7" style="animation-delay:${(hash(i*3)*3).toFixed(2)}s"/>`;
  }
  if(dusty && (w==='sun'||w==='heat')){
    for(let i=0;i<26;i++)
      s += `<ellipse class="dust" cx="${n(hash(i*5.1)*WPX)}" cy="${n(hash(i*2.7)*HPX)}"
        rx="${n(30+hash(i)*70)}" ry="${n(8+hash(i+2)*14)}" fill="#d8c9a0" opacity=".13"
        style="animation-delay:${(hash(i)*6).toFixed(2)}s"/>`;
  }
  return s ? `<g id="wxlayer" pointer-events="none">${s}</g>` : '';
}

/* ---------------------------------------------------------------
   2. LAND — 144 places to farm, each with its own climate
   --------------------------------------------------------------- */
const BIOMES = [
  {k:'lake',   n:'Lakeside',        rain:0.30, wind:0.15, warm:0.05, sun:-0.05, charm:22, mul:1.35,
   d:'Still water on the boundary. Humid, generous rain, beautiful.'},
  {k:'pond',   n:'Pond country',    rain:0.20, wind:0.00, warm:0.00, sun:0.00,  charm:14, mul:1.15,
   d:'Gentle low country dotted with farm dams.'},
  {k:'river',  n:'River bend',      rain:0.25, wind:0.05, warm:0.05, sun:0.00,  charm:18, mul:1.28,
   d:'Rich alluvial soil in the crook of a river. Floods occasionally.'},
  {k:'hill',   n:'Hillside',        rain:0.10, wind:0.45, warm:-0.10, sun:0.10, charm:16, mul:1.10,
   d:'Sloped ground with a long view. Windy, well drained.'},
  {k:'mount',  n:'Mountain top',    rain:0.05, wind:0.95, warm:-0.35, sun:0.25, charm:30, mul:1.55,
   d:'Above the treeline. Brutal weather, staggering views, premium stays.'},
  {k:'plateau',n:'Highland plateau',rain:0.00, wind:0.55, warm:-0.20, sun:0.15, charm:19, mul:1.20,
   d:'Wide flat highland. Cold nights, big sky, strong sun.'},
  {k:'valley', n:'Valley floor',    rain:0.15, wind:-0.35, warm:0.15, sun:-0.05,charm:15, mul:1.18,
   d:'Sheltered and warm. Frost pools on still winter mornings.'},
  {k:'coast',  n:'Coastal',         rain:0.20, wind:0.65, warm:0.10, sun:0.05,  charm:26, mul:1.42,
   d:'Salt air and sea wind. Mild winters, tourists in summer.'},
  {k:'forest', n:'Forest edge',     rain:0.20, wind:-0.30, warm:-0.05, sun:-0.15,charm:20, mul:1.16,
   d:'Bush on two sides. Sheltered, shaded, full of birds.'},
  {k:'moor',   n:'Moorland',        rain:0.30, wind:0.60, warm:-0.20, sun:-0.10, charm:12, mul:0.88,
   d:'Open, acid, wind-scoured. Cheap land for a reason.'},
  {k:'orchard',n:'Orchard country',  rain:0.10, wind:-0.10, warm:0.10, sun:0.10, charm:24, mul:1.38,
   d:'Established fruit country. Everything grows, everyone visits.'},
  {k:'oasis',  n:'Desert oasis',    rain:-0.35, wind:0.25, warm:0.40, sun:0.40, charm:21, mul:1.05, dust:1,
   d:'Spring-fed green in dry country. Blazing sun, precious water.'},
];
const SHAPES = [
  {k:'rect',  n:'Rectangular', w:21, h:14, mul:1.00, d:'A straightforward block. Easy to plan.'},
  {k:'wide',  n:'Wide',        w:26, h:11, mul:1.05, d:'Broad and shallow. Long runs, short walks.'},
  {k:'deep',  n:'Deep',        w:15, h:19, mul:1.02, d:'Narrow frontage, long back paddock.'},
  {k:'square',n:'Square',      w:17, h:17, mul:1.08, d:'Compact and even. Everything close to home.'},
];
const SIZES = [
  {k:'small', n:'Smallholding', s:0.78, mul:0.62, d:'Enough to feed a family and sell the surplus.'},
  {k:'farm',  n:'Working farm', s:1.00, mul:1.00, d:'Room for stock, crops and visitors.'},
  {k:'estate',n:'Estate',       s:1.28, mul:1.75, d:'Serious acreage. Serious rates bill.'},
];
const LANDS = [];
BIOMES.forEach(b=> SHAPES.forEach(sh=> SIZES.forEach(sz=>{
  LANDS.push({
    id:`${b.k}_${sh.k}_${sz.k}`,
    name:`${b.n} ${sz.n.toLowerCase()}`,
    biome:b.k, bn:b.n, shape:sh.n, size:sz.n,
    w:Math.max(11,Math.round(sh.w*sz.s)), h:Math.max(9,Math.round(sh.h*sz.s)),
    rain:b.rain, wind:b.wind, warm:b.warm, sun:b.sun, dust:b.dust||0,
    charm:b.charm, d:b.d, shapeD:sh.d, sizeD:sz.d,
    price: Math.round(2600*b.mul*sh.mul*sz.mul),
  });
})));
const LANDMAP = {}; LANDS.forEach(l=>LANDMAP[l.id]=l);

/* biome bends the weather table */
function landWeatherTable(){
  const l = LANDMAP[S.landId];
  const base = [
    ['sun','sun','sun','heat','cloud','rain'],
    ['sun','cloud','cloud','rain','rain','storm'],
    ['cloud','rain','rain','frost','frost','storm'],
    ['sun','sun','cloud','rain','cloud','rain'],
  ][S.season].slice();
  if(!l) return base;
  if(l.rain > 0.2) base.push('rain');
  if(l.rain < -0.2){ for(let i=base.length-1;i>=0;i--) if(base[i]==='rain') base.splice(i,1); base.push('sun','heat'); }
  if(l.wind > 0.5) base.push('storm');
  if(l.warm < -0.2) base.push('frost');
  if(l.warm > 0.2) base.push('heat');
  if(l.sun > 0.2) base.push('sun');
  return base;
}

/* ---------------------------------------------------------------
   3. HOMES — 126 to choose from
   --------------------------------------------------------------- */
const HSTYLE = [
  {k:'cottage', n:'Cottage',         roof:'url(#gRoofRed)', charm:12, d:'Timber and weatherboard, wisteria on the porch.'},
  {k:'farmhouse',n:'Farmhouse',      roof:'url(#gRoof)',    charm:11, d:'The classic. Big kitchen, wide verandah.'},
  {k:'villa',   n:'Villa',           roof:'url(#gRoof)',    charm:16, d:'High ceilings and bay windows.'},
  {k:'barn',    n:'Barn conversion', roof:'url(#gRoofRed)', charm:18, d:'Vast open volume under an old roof.'},
  {k:'aframe',  n:'A-frame',         roof:'url(#gRoof)',    charm:15, d:'Steep pitch, glass gable, alpine feel.'},
  {k:'earth',   n:'Earth house',     roof:'url(#gLawn)',    charm:20, d:'Bermed into the slope. Almost no heating bill.'},
  {k:'long',    n:'Longhouse',       roof:'url(#gRoof)',    charm:13, d:'One long spine, rooms off a corridor.'},
  {k:'cabin',   n:'Log cabin',       roof:'url(#gRoofRed)', charm:14, d:'Stacked timber, stone chimney.'},
  {k:'modern',  n:'Modern box',      roof:'url(#gRoof)',    charm:17, d:'Flat roof, floor-to-ceiling glass.'},
  {k:'passive', n:'Passive house',   roof:'url(#gRoof)',    charm:19, d:'Airtight, triple glazed, barely uses power.'},
  {k:'tiny',    n:'Tiny home',       roof:'url(#gRoof)',    charm:8,  d:'Everything you need and nothing you do not.'},
  {k:'container',n:'Container home', roof:'url(#gRoof)',    charm:10, d:'Stacked shipping containers, cut and clad.'},
  {k:'croft',   n:'Stone croft',     roof:'url(#gStone)',   charm:16, d:'Thick stone walls, small deep windows.'},
  {k:'domeh',   n:'Dome house',      roof:'url(#gGlass)',   charm:22, d:'Geodesic shell, extraordinary light.'},
];
const HSIZE = [
  {k:'s', n:'One bedroom',   sc:0.78, mul:0.6,  power:4},
  {k:'m', n:'Three bedroom', sc:1.00, mul:1.0,  power:8},
  {k:'l', n:'Five bedroom',  sc:1.24, mul:1.7,  power:13},
];
const HFINISH = [
  {k:'std',  n:'Standard',     mul:1.0,  charm:0,  power:0, d:'Solid, honest, unremarkable.'},
  {k:'solar',n:'Solar &amp; battery', mul:1.35, charm:4,  power:10, d:'Roof array and storage — the farm runs off it.'},
  {k:'lux',  n:'Architectural',mul:1.9,  charm:14, power:6,  d:'Bespoke everything. Guests photograph it.'},
];
const HOMES = [];
HSTYLE.forEach(st=> HSIZE.forEach(sz=> HFINISH.forEach(fi=>{
  HOMES.push({
    id:`${st.k}_${sz.k}_${fi.k}`,
    name:`${sz.n} ${st.n.toLowerCase()}${fi.k==='std'?'':' · '+fi.n.replace('&amp;','&')}`,
    style:st.k, roof:st.roof, sc:sz.sc,
    charm: st.charm + fi.charm + (sz.k==='l'?4:sz.k==='s'?-2:0),
    power: sz.power + fi.power,
    price: Math.round(38000*sz.mul*fi.mul*(1+st.charm/60)),
    d: st.d, fd: fi.d, size: sz.n, finish: fi.n,
  });
})));
const HOMEMAP = {}; HOMES.forEach(h=>HOMEMAP[h.id]=h);

/* ---------------------------------------------------------------
   4. SETTINGS — 50 controls
   --------------------------------------------------------------- */
const SETTINGS = [
  {g:'Gameplay', k:'dayLen',     n:'Day length',            t:'range', min:20, max:120, def:45, unit:'s'},
  {g:'Gameplay', k:'difficulty', n:'Difficulty',            t:'pick', opts:['Relaxed','Standard','Hard','Brutal'], def:'Standard'},
  {g:'Gameplay', k:'startCash',  n:'Starting cash',         t:'range', min:200, max:3000, def:520, unit:'$'},
  {g:'Gameplay', k:'instant',    n:'Instant actions',       t:'bool', def:false, d:'Skip walking to the job.'},
  {g:'Gameplay', k:'walkFast',   n:'Brisk walking',         t:'bool', def:false},
  {g:'Gameplay', k:'autoSave',   n:'Autosave',              t:'bool', def:true},
  {g:'Gameplay', k:'pauseBlur',  n:'Pause when tab hidden', t:'bool', def:true},
  {g:'Gameplay', k:'confirmSell',n:'Confirm before removing',t:'bool', def:true},
  {g:'Gameplay', k:'seasonLen',  n:'Days per season',       t:'range', min:7, max:60, def:28, unit:'d'},
  {g:'Gameplay', k:'weatherVol', n:'Weather volatility',    t:'range', min:0, max:100, def:50, unit:'%'},
  {g:'Gameplay', k:'pestRate',   n:'Pest frequency',        t:'range', min:0, max:100, def:50, unit:'%'},
  {g:'Gameplay', k:'breedRate',  n:'Breeding frequency',    t:'range', min:0, max:100, def:50, unit:'%'},

  {g:'Economy',  k:'salaryOn',   n:'Receive salary',        t:'bool', def:true},
  {g:'Economy',  k:'billsOn',    n:'Pay bills &amp; rates',     t:'bool', def:true},
  {g:'Economy',  k:'priceSwing', n:'Market volatility',     t:'range', min:0, max:100, def:50, unit:'%'},
  {g:'Economy',  k:'contractRate',n:'Order frequency',      t:'range', min:0, max:100, def:60, unit:'%'},
  {g:'Economy',  k:'loanLimit',  n:'Allow borrowing',       t:'bool', def:true},
  {g:'Economy',  k:'hoursDay',   n:'Working hours per day', t:'range', min:4, max:16, def:10, unit:'h'},
  {g:'Economy',  k:'burnout',    n:'Burnout enabled',       t:'bool', def:true},
  {g:'Economy',  k:'seedCost',   n:'Seed price',            t:'range', min:25, max:200, def:100, unit:'%'},
  {g:'Economy',  k:'sellPrice',  n:'Sale price',            t:'range', min:50, max:200, def:100, unit:'%'},
  {g:'Economy',  k:'upkeepMul',  n:'Upkeep cost',           t:'range', min:0, max:200, def:100, unit:'%'},

  {g:'Display',  k:'labels',     n:'Building labels',       t:'bool', def:true},
  {g:'Display',  k:'labelAlerts',n:'Alert labels only',     t:'bool', def:false},
  {g:'Display',  k:'grid',       n:'Show grid when placing',t:'bool', def:true},
  {g:'Display',  k:'daynight',   n:'Day / night lighting',  t:'bool', def:true},
  {g:'Display',  k:'sunarc',     n:'Sun arc strip',         t:'bool', def:true},
  {g:'Display',  k:'particles',  n:'Weather particles',     t:'bool', def:true},
  {g:'Display',  k:'motion',     n:'Wind &amp; sway',           t:'bool', def:true},
  {g:'Display',  k:'critters',   n:'Animate animals',       t:'bool', def:true},
  {g:'Display',  k:'shadows',    n:'Shadows',               t:'bool', def:true},
  {g:'Display',  k:'texture',    n:'Ground texture',        t:'bool', def:true},
  {g:'Display',  k:'zoomWheel',  n:'Scroll wheel zooms',    t:'bool', def:true},
  {g:'Display',  k:'edgePan',    n:'Edge panning',          t:'bool', def:false},
  {g:'Display',  k:'uiScale',    n:'Interface scale',       t:'range', min:80, max:130, def:100, unit:'%'},
  {g:'Display',  k:'contrast',   n:'High contrast text',    t:'bool', def:false},
  {g:'Display',  k:'reduceBlur', n:'Reduce blur effects',   t:'bool', def:false},

  {g:'Audio',    k:'sfx',        n:'Action sounds',         t:'bool', def:true},
  {g:'Audio',    k:'amb',        n:'Farm ambience',         t:'bool', def:true},
  {g:'Audio',    k:'wx',         n:'Weather audio',         t:'bool', def:true},
  {g:'Audio',    k:'mus',        n:'Music',                 t:'bool', def:true},
  {g:'Audio',    k:'animalSfx',  n:'Animal calls',          t:'bool', def:true},
  {g:'Audio',    k:'volMaster',  n:'Master volume',         t:'range', min:0, max:100, def:75, unit:'%'},
  {g:'Audio',    k:'volMusic',   n:'Music volume',          t:'range', min:0, max:100, def:22, unit:'%'},
  {g:'Audio',    k:'volWeather', n:'Weather volume',        t:'range', min:0, max:100, def:45, unit:'%', d:'Rain and storm loudness.'},

  {g:'Assist',   k:'aiHints',    n:'AI coach',              t:'bool', def:true, d:'Unlocks at level 2.'},
  {g:'Assist',   k:'hintBadge',  n:'Task badge on the land',t:'bool', def:true},
  {g:'Assist',   k:'tooltips',   n:'Tooltips',              t:'bool', def:true},
  {g:'Assist',   k:'toasts',     n:'Pop-up messages',       t:'bool', def:true},
  {g:'Assist',   k:'logLines',   n:'Farm log length',       t:'range', min:10, max:120, def:60, unit:''},
  {g:'Assist',   k:'autoCollect',n:'Click to collect all',  t:'bool', def:false},
  {g:'Assist',   k:'familyLife', n:'Family &amp; idle life',     t:'bool', def:true, d:'Your character seeks out the family when idle.'},
  {g:'Assist',   k:'carry',      n:'Carry harvests home',    t:'bool', def:true, d:'Haul the crate to the house instead of teleporting goods.'},
];
function settingsInit(){
  if(!S.settings) S.settings = {};
  SETTINGS.forEach(o=>{ if(S.settings[o.k]===undefined) S.settings[o.k]=o.def; });
}
function setOpt(k,v){
  settingsInit();
  S.settings[k] = v;
  if(k==='dayLen') DAY_MS_OVERRIDE = v*1000;
  if(k==='motion' || k==='particles') { applyWind(); render(); }
  if(k==='labels' || k==='labelAlerts' || k==='shadows' || k==='texture') render();
  if(k==='uiScale') document.documentElement.style.fontSize = (13*v/100).toFixed(1)+'px';
  if(k==='contrast') document.body.classList.toggle('hc', !!v);
  if(k==='reduceBlur') document.body.classList.toggle('noblur', !!v);
  if(['sfx','amb','wx','mus','volMaster','volMusic'].includes(k)) SND.applyMix();
  renderRight(); G.save();
}
let DAY_MS_OVERRIDE = 0;

/* ---------------------------------------------------------------
   5. AI COACH — unlocks at level 2
   --------------------------------------------------------------- */
function coachTips(){
  const st = stat(), tips = [];
  const beds = S.objs.filter(o=>BPMAP[o.bp].kind==='plot');
  const empty = beds.filter(b=>!b.crop);
  const dry = beds.filter(b=>b.crop && b.water<0.25);
  const ripe = S.objs.filter(o=>['plot','perennial'].includes(BPMAP[o.bp].kind) && o.stage>=1);
  const pens = S.objs.filter(o=>BPMAP[o.bp].kind==='animal');
  const barn = Object.keys(S.store).reduce((a,k)=>a+S.store[k]*sellPrice(k),0);
  const out = typeof outgoings==='function' ? outgoings() : {total:0};

  if(dry.length) tips.push({p:1, t:`${dry.length} bed${dry.length>1?'s are':' is'} too dry to grow`,
    w:'A bed below 16% moisture makes no progress at all — you are paying rates on idle land.'});
  if(ripe.length) tips.push({p:1, t:`${ripe.length} crop${ripe.length>1?'s are':' is'} ready`,
    w:'Ripe crops sit there earning nothing. Harvest, then replant the same day.'});
  if(!S.objs.some(o=>BPMAP[o.bp].kind==='water')) tips.push({p:1, t:'You have no water storage',
    w:'Without a tank, rain runs straight off your land and your beds stall in the first dry spell.'});
  if(empty.length > 2) tips.push({p:2, t:`${empty.length} beds are empty`,
    w:'Idle beds still cost rates. Sow anything — even lettuce turns a profit in two days.'});
  if(st.short) tips.push({p:1, t:'You are short of power',
    w:'Greenhouses, pumps and AI modules all run at reduced output until you add generation.'});
  if(S.feed < 6 && pens.some(p=>p.animals>0)) tips.push({p:1, t:'Feed is nearly out',
    w:'Hungry animals stop producing entirely. A fodder patch grows feed free, forever.'});
  const dirty = pens.filter(p=>(p.care||1) < 0.4);
  if(dirty.length) tips.push({p:2, t:`${dirty.length} pen${dirty.length>1?'s need':' needs'} mucking out`,
    w:'Filthy bedding causes illness, which halves output and stops breeding.'});
  if(barn > 400) tips.push({p:2, t:`${fmt(barn)} sitting in the barn`,
    w:'Produce does not appreciate. Sell it, or hold only what your recipes and orders need.'});
  if(st.charm < 40 && S.objs.some(o=>BPMAP[o.bp].kind==='tourism')) tips.push({p:2,
    t:'Your tourism buildings are underperforming', w:'Charm multiplies every visitor dollar. Flowers and a pond are the cheapest charm you can buy.'});
  if(S.career && S.career.loan > 0) tips.push({p:2, t:`${fmt(S.career.loan)} of debt at 4.5% a month`,
    w:'Interest compounds against you every payday. Clear it before you expand again.'});
  if(out.total > 0 && S.cash < out.total) tips.push({p:1, t:'You cannot cover this month’s bills',
    w:`Bills come to ${fmt(out.total)}. Take client work or sell stock before payday.`});
  if(!S.objs.some(o=>o.bp==='compost')) tips.push({p:3, t:'No compost bays yet',
    w:'A flat 18% growth bonus on every crop, forever, for $110. It pays back in days.'});
  if(!S.objs.some(o=>o.bp==='ai_hub') && S.lvl>=5) tips.push({p:3, t:'Consider a control hub',
    w:'Automation removes the daily chores so you can play the economy instead of the checklist.'});
  if(!tips.length) tips.push({p:3, t:'The farm is in good order',
    w:'Nothing urgent. Good time to expand, upgrade a building, or take on client work.'});
  return tips.sort((a,b)=>a.p-b.p).slice(0,5);
}
