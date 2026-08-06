/* =====================================================================
   In-game confirms, discoverability, idle rules, navigation, themes,
   country presets and a gentler weather bed.
   ===================================================================== */

/* ---------------------------------------------------------------
   1. window.confirm() is swallowed in embedded contexts — it returned
      false without ever showing, so Move out / Remove / New farm all
      silently did nothing. Everything now uses an in-game dialog.
   --------------------------------------------------------------- */
function ask(title, body, okLabel, onOk, danger){
  const m = document.getElementById('modal');
  document.getElementById('modalBody').innerHTML = `
    <h2>${title}</h2><p class="sub">${body}</p>
    <div class="mfoot">
      <button class="mbtn ghost" id="askNo">Cancel</button>
      <button class="mbtn" id="askYes" ${danger?'style="background:linear-gradient(180deg,#c05540,#94402f);border-color:#e2705c"':''}>${okLabel}</button>
    </div>`;
  m.classList.add('show');
  document.getElementById('askNo').onclick = ()=>{ G.closeModal(); sfx('click'); };
  document.getElementById('askYes').onclick = ()=>{ G.closeModal(); onOk(); };
}

removeFamily = function(id){
  peopleInit();
  const f = S.family.find(z=>z.id===id);
  if(!f) return;
  const go = ()=>{
    S.family = S.family.filter(z=>z.id!==id);
    S.morale = clamp((S.morale||0.6) - 0.08, 0, 1);
    sfx('remove'); toast(`${f.name} has moved away`,'');
    log(`${f.name} moved away.`);
    render(); ui(); G.save();
  };
  if(!SET('confirmSell')) return go();
  ask(`${f.name} moves away?`,
      `They leave the household and its costs. Morale takes a knock.`,
      'Yes, move out', go, true);
};

(function fixConfirms(){
  const _sellObj = G.sellObj;
  G.sellObj = function(id){
    const o = S.objs.find(z=>z.id===id); if(!o) return;
    const bp = BPMAP[o.bp];
    if(bp.kind==='home') return toast('You cannot remove the house','bad');
    const go = ()=>{
      const refund = Math.round(bp.cost*0.55);
      S.cash += refund; S.objs = S.objs.filter(z=>z.id!==id); sel = null; sfx('remove');
      toast(`Removed — ${fmt(refund)} back`,'');
      render(); ui(); G.save();
    };
    if(!SET('confirmSell')) return go();
    ask(`Remove the ${bp.name}?`, `You get ${fmt(Math.round(bp.cost*0.55))} back — 55% of what you paid.`,
        'Remove it', go, true);
  };
  G.confirmReset = function(){
    ask('Start a new farm?', 'This clears everything you have built here.', 'Start over', ()=>G.reset(), true);
  };
  if(typeof fireWorker === 'function'){
    const _fire = fireWorker;
    fireWorker = function(id){
      const w = S.workers.find(z=>z.id===id); if(!w) return;
      if(!SET('confirmSell')) return _fire(id);
      ask(`Let ${w.name} go?`, `They leave the farm and stop drawing wages.`, 'Let them go', ()=>_fire(id), true);
    };
  }
})();

/* ---------------------------------------------------------------
   2. Tabs that tell you there is something to do
   --------------------------------------------------------------- */
function tabBadges(){
  const counts = {
    work : (S.career && S.career.jobs) ? S.career.jobs.filter(j=>S.career.hours>=j.hrs).length : 0,
    jobs : S.contracts ? S.contracts.filter(c=>(S.store[c.gid]||0) >= c.qty).length : 0,
    market: Object.keys(S.store||{}).length,
    insp : 0, home:0, coach:0, set:0, auto:0,
  };
  document.querySelectorAll('.ptab').forEach(b=>{
    const k = b.dataset.rt, c = counts[k]||0;
    let dot = b.querySelector('.tbadge');
    if(c > 0){
      if(!dot){ dot = document.createElement('i'); dot.className='tbadge'; b.appendChild(dot); }
      dot.textContent = c > 9 ? '9+' : c;
    } else if(dot) dot.remove();
  });
}

/* ---------------------------------------------------------------
   3. Idle rules — the farm does not run itself for free
   --------------------------------------------------------------- */
function idleInit(){ if(S.idleSecs===undefined) S.idleSecs = 0; }
function noteActivity(){ idleInit(); S.idleSecs = 0; if(S.idlePaused){ S.idlePaused=false; S.speed = S._preIdle||1; ui(); } }
['pointerdown','keydown','wheel','touchstart'].forEach(ev=>
  window.addEventListener(ev, ()=>{ if(S) noteActivity(); }, {passive:true}));

function tickIdleRules(dt){
  idleInit();
  if(!SET('idleRules')) return;
  if(S.speed === 0 && !S.idlePaused) return;      // deliberately paused, leave alone
  S.idleSecs += dt;
  const limit = (SET('idleMins')||10) * 60;
  if(!S.idlePaused && S.idleSecs > limit){
    S.idlePaused = true; S._preIdle = S.speed || 1; S.speed = 0;
    /* neglect costs exactly a tenth, rounded up, so it is always felt */
    let lostCrops = 0, lostStock = 0;
    const planted = S.objs.filter(o=>BPMAP[o.bp].kind==='plot' && o.crop);
    for(let i=planted.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [planted[i],planted[j]]=[planted[j],planted[i]]; }
    planted.slice(0, Math.ceil(planted.length*0.10)).forEach(o=>{
      o.crop=null; o.stage=0; o.weeds=0; lostCrops++;
    });
    const herd = S.objs.filter(o=>BPMAP[o.bp].kind==='animal' && o.animals>0);
    let toLose = Math.ceil(herd.reduce((a,o)=>a+o.animals,0) * 0.10);
    while(toLose > 0){
      const pen = herd.filter(o=>o.animals>0);
      if(!pen.length) break;
      const o = pen[Math.floor(Math.random()*pen.length)];
      o.animals--; syncHerd(o); lostStock++; toLose--;
    }
    S.morale = clamp((S.morale||0.6) - 0.1, 0, 1);
    const bits = [];
    if(lostCrops) bits.push(`${lostCrops} bed${lostCrops>1?'s':''} of crops failed`);
    if(lostStock) bits.push(`${lostStock} animal${lostStock>1?'s':''} lost`);
    log(`Left unattended for ${SET('idleMins')} minutes — ${bits.length?bits.join(' and '):'no losses this time'}. Clock paused.`, 'bad');
    toast(bits.length ? `Neglect: ${bits.join(', ')}` : 'Farm paused — you were away', 'bad');
    sfx('error');
    render(); ui();
  }
}

/* ---------------------------------------------------------------
   4. Getting around a big farm
   --------------------------------------------------------------- */
function buildMinimap(){
  const world = document.getElementById('world');
  if(!world || document.getElementById('minimap')) return;
  const d = document.createElement('div');
  d.id = 'minimap';
  d.innerHTML = `<canvas id="mmCanvas" width="150" height="110"></canvas><div id="mmView"></div>`;
  world.appendChild(d);
  const canvas = d.querySelector('canvas');
  const jump = e=>{
    const r = canvas.getBoundingClientRect();
    const fx = (e.clientX - r.left)/r.width, fy = (e.clientY - r.top)/r.height;
    const wx = (FARM.x + fx*FARM.w)*T, wy = (FARM.y + fy*FARM.h)*T;
    const vw = world.clientWidth, vh = world.clientHeight;
    cam.x = vw/2 - wx*cam.z; cam.y = vh/2 - wy*cam.z;
    applyCam(); noteActivity();
  };
  let down=false;
  canvas.addEventListener('pointerdown', e=>{ down=true; jump(e); });
  window.addEventListener('pointermove', e=>{ if(down) jump(e); });
  window.addEventListener('pointerup', ()=> down=false);
}
function paintMinimap(){
  const c = document.getElementById('mmCanvas');
  if(!c || !SET('minimap')) return;
  const g = c.getContext('2d');
  const sx = c.width/(FARM.w*T), sy = c.height/(FARM.h*T);
  g.clearRect(0,0,c.width,c.height);
  g.fillStyle = '#6f9f45'; g.fillRect(0,0,c.width,c.height);
  S.objs.forEach(o=>{
    const bp = BPMAP[o.bp], f = footprint(bp, o.rot);
    const col = {plot:'#8a6a4a', perennial:'#4f8a35', animal:'#c9a06a', water:'#4f93b5',
      power:'#26365c', process:'#a98fd6', shop:'#e2603a', tourism:'#dd6f9c', rec:'#efb43c',
      housing:'#c8583f', home:'#c3ccd2', hub:'#6fb6d8'}[bp.kind] || '#9aa88a';
    g.fillStyle = col;
    g.fillRect((o.tx-FARM.x)*T*sx, (o.ty-FARM.y)*T*sy, f.w*T*sx, f.h*T*sy);
  });
  /* where the camera is looking */
  const world = document.getElementById('world');
  const vx = (-cam.x/cam.z - FARM.x*T)*sx, vy = (-cam.y/cam.z - FARM.y*T)*sy;
  const vw = (world.clientWidth/cam.z)*sx, vh = (world.clientHeight/cam.z)*sy;
  g.strokeStyle = '#fff'; g.lineWidth = 1.5;
  g.strokeRect(Math.max(0,vx), Math.max(0,vy), Math.min(vw,c.width), Math.min(vh,c.height));
}

/* keyboard panning, and a much more forgiving grab */
(function navigation(){
  const keys = {};
  window.addEventListener('keydown', e=>{
    if(e.target.tagName==='INPUT') return;
    const k = e.key.toLowerCase();
    if(['arrowup','arrowdown','arrowleft','arrowright'].includes(k)){ keys[k]=1; e.preventDefault(); }
  });
  window.addEventListener('keyup', e=> keys[e.key.toLowerCase()]=0);
  setInterval(()=>{
    if(!S) return;
    const sp = 26;
    let dx=0, dy=0;
    if(keys['arrowleft']) dx += sp;
    if(keys['arrowright']) dx -= sp;
    if(keys['arrowup']) dy += sp;
    if(keys['arrowdown']) dy -= sp;
    if(dx||dy){ cam.x += dx; cam.y += dy; applyCam(); noteActivity(); }
  }, 16);
})();

/* ---------------------------------------------------------------
   5. Colour themes
   --------------------------------------------------------------- */
const THEMES = {
  greenhollow:{n:'Greenhollow', acc:'#7cc24f', acc2:'#6fb6d8', bg:'#12180f', panel:'#1e2718', lawn:['#88b25c','#74a04b','#5d8a3c']},
  slate      :{n:'Slate',       acc:'#6fb6d8', acc2:'#a98fd6', bg:'#101418', panel:'#1a2027', lawn:['#7fa06a','#6b8c58','#557046']},
  ember      :{n:'Ember',       acc:'#e8a33d', acc2:'#e2705c', bg:'#171208', panel:'#241c10', lawn:['#9db35c','#879c4b','#6d803c']},
  orchid     :{n:'Orchid',      acc:'#dd6f9c', acc2:'#a98fd6', bg:'#150f16', panel:'#221a24', lawn:['#8ab167','#749b53','#5d8043']},
  nordic     :{n:'Nordic',      acc:'#8fd0c4', acc2:'#9db4d8', bg:'#0e1416', panel:'#171f22', lawn:['#8fae7a','#7a9866','#627c52']},
  paper      :{n:'Daylight',    acc:'#4d8f3c', acc2:'#3f7f9c', bg:'#e8e6dd', panel:'#f5f3ea', lawn:['#9dc46a','#87b055','#6f9645'], light:1},
};
function applyTheme(){
  const t = THEMES[SET('theme')] || THEMES.greenhollow;
  const r = document.documentElement;
  r.style.setProperty('--acc', t.acc);
  r.style.setProperty('--acc2', t.acc2);
  r.style.setProperty('--bg', t.bg);
  r.style.setProperty('--panel', t.panel);
  r.style.setProperty('--green', t.acc);
  document.body.classList.toggle('lighttheme', !!t.light);
  /* the lawn gradient lives in the SVG defs, so the backdrop must be rebuilt */
  const g = document.getElementById('gLawn');
  if(g){
    const stops = g.querySelectorAll('stop');
    t.lawn.forEach((c,i)=>{ if(stops[i]) stops[i].setAttribute('stop-color', c); });
  }
}

/* ---------------------------------------------------------------
   6. Where in the world — units, currency and local limits.
      These are game rules chosen for balance, not legal advice.
   --------------------------------------------------------------- */
const COUNTRIES = {
  au:{n:'Australia',    cur:'A$', area:'hectares', ha:1, maxStock:120, waterCap:1.35, rates:1.15,
      note:'Big blocks, tight water. Generous stock limits, higher council rates, tank storage encouraged.'},
  nz:{n:'New Zealand',  cur:'NZ$',area:'hectares', ha:1, maxStock:100, waterCap:1.2,  rates:1.05,
      note:'Wet and green. Good rainfall, moderate rates, strong dairy and horticulture.'},
  uk:{n:'United Kingdom',cur:'£', area:'acres',    ha:2.47,maxStock:70, waterCap:1.0,  rates:1.25,
      note:'Small fields, high rates, reliable rain. Smallholdings and farm shops do well.'},
  ie:{n:'Ireland',      cur:'€',  area:'acres',    ha:2.47,maxStock:80, waterCap:1.15, rates:1.1,
      note:'Mild and damp. Grass grows nearly year round.'},
  ca:{n:'Canada',       cur:'C$', area:'acres',    ha:2.47,maxStock:110,waterCap:1.1,  rates:0.95,
      note:'Long hard winters, big acreage, cheap land outside the cities.'},
  us:{n:'United States',cur:'US$',area:'acres',    ha:2.47,maxStock:130,waterCap:1.0,  rates:0.9,
      note:'Large holdings, low rates, weak safety net. Scale pays.'},
  za:{n:'South Africa', cur:'R',  area:'hectares', ha:1,  maxStock:100, waterCap:0.8,  rates:0.85,
      note:'Hot and dry. Water is the binding constraint.'},
};
function country(){ return COUNTRIES[SET('country')] || COUNTRIES.au; }
function stockLimit(){ return Math.round(country().maxStock * (1 + (S.expansions||0)*0.25)); }
function totalStock(){ return S.objs.reduce((a,o)=>a+(o.animals||0),0); }

/* currency symbol follows the country */
(function localiseMoney(){
  const _fmt = fmt;
  fmt = function(v){ return country().cur + Math.round(v).toLocaleString(); };
})();

/* the stock limit actually binds */
if(typeof G.buyAnimal === 'function'){
  const _buy = G.buyAnimal;
  G.buyAnimal = function(id){
    if(totalStock() >= stockLimit()){
      toast(`Stock limit reached — ${stockLimit()} head for ${country().n}`,'bad'); sfx('error');
      log(`You are at the ${stockLimit()}-head limit. Buy adjoining land to raise it.`,'bad');
      return;
    }
    _buy.call(G, id);
  };
}
/* and water storage scales with the climate */
if(typeof stat === 'function'){
  const _stat = stat;
  stat = function(){
    const s = _stat();
    s.waterCap = Math.round(s.waterCap * country().waterCap);
    return s;
  };
}
if(typeof outgoings === 'function'){
  const _out21 = outgoings;
  outgoings = function(){
    const o = _out21();
    if(!o.total) return o;
    const before = o.rates;
    o.rates = Math.round(o.rates * country().rates);
    o.total += (o.rates - before);
    return o;
  };
}

/* ---------------------------------------------------------------
   7. New settings
   --------------------------------------------------------------- */
SETTINGS.push(
  {g:'Gameplay', k:'idleRules', n:'Pause &amp; penalise when idle', t:'bool', def:true,
   d:'If you walk away, the clock stops and neglect costs you stock.'},
  {g:'Gameplay', k:'idleMins',  n:'Idle before pausing', t:'range', min:2, max:60, def:10, unit:' min'},
  {g:'Gameplay', k:'country',   n:'Where you farm', t:'pick',
   opts:['au','nz','uk','ie','ca','us','za'], def:'au',
   d:'Sets currency, stock limits, water and rates.'},
  {g:'Display',  k:'theme',     n:'Colour theme', t:'pick',
   opts:['greenhollow','slate','ember','orchid','nordic','paper'], def:'greenhollow'},
  {g:'Display',  k:'minimap',   n:'Minimap', t:'bool', def:true, d:'Click or drag it to jump around a big farm.'},
  {g:'Display',  k:'bigHit',    n:'Easier object grabbing', t:'bool', def:true,
   d:'Widens the clickable area around every building.'},
);

/* the picker rows need friendly labels for these two */
const PICK_LABEL = {
  au:'Australia', nz:'New Zealand', uk:'UK', ie:'Ireland', ca:'Canada', us:'USA', za:'South Africa',
  greenhollow:'Greenhollow', slate:'Slate', ember:'Ember', orchid:'Orchid', nordic:'Nordic', paper:'Daylight',
};
if(typeof settingsHTML === 'function'){
  const _setHtml = settingsHTML;
  settingsHTML = function(){
    let h = _setHtml();
    Object.keys(PICK_LABEL).forEach(k=>{
      h = h.split(`>${k}</button>`).join(`>${PICK_LABEL[k]}</button>`);
    });
    return h + `<div class="card"><div class="eyebrow">About the country setting</div>
      <div class="muted">${country().note}</div>
      <div class="muted" style="margin-top:6px">Stock limit ${stockLimit()} head ·
      water ×${country().waterCap} · rates ×${country().rates}. These are balance rules for the
      game, not a guide to real agricultural regulation.</div></div>`;
  };
}

/* ---------------------------------------------------------------
   8. Wire-up
   --------------------------------------------------------------- */
(function wire21(){
  const css = document.createElement('style');
  css.textContent = `
  .tbadge{display:inline-flex;align-items:center;justify-content:center;min-width:15px;height:15px;
    margin-left:5px;padding:0 4px;border-radius:8px;background:var(--acc);color:#0d1409;
    font-size:9.5px;font-weight:800;font-style:normal;vertical-align:1px;}
  #minimap{position:absolute;right:12px;top:58px;z-index:34;border-radius:10px;overflow:hidden;
    border:1px solid rgba(255,255,255,.22);box-shadow:0 6px 20px rgba(0,0,0,.45);
    background:rgba(10,16,8,.75);backdrop-filter:blur(8px);cursor:crosshair;}
  #minimap canvas{display:block;}
  body.lighttheme{--txt:#1b2417;--txt2:#4a5a42;--txt3:#6d7d64;--hair:rgba(0,0,0,.10);--hair2:rgba(0,0,0,.18);
    --g1:rgba(0,0,0,.045);--g2:rgba(0,0,0,.08);}
  body.lighttheme #top,body.lighttheme .panel{background:linear-gradient(180deg,#f7f5ec,#eceadf);}
  body.lighttheme .wlab{background:rgba(255,255,255,.9);color:#1b2417;border-color:rgba(0,0,0,.2);}
  /* a forgiving grab area around every building */
  body.bighit .ob{stroke:transparent;stroke-width:14px;paint-order:stroke;}
  `;
  document.head.appendChild(css);

  buildMinimap();
  applyTheme();

  const _setOpt21 = setOpt;
  setOpt = function(k,v){
    _setOpt21(k,v);
    if(k==='theme'){ applyTheme(); bgToken=''; render(); }
    if(k==='country'){ ui(); render(); }
    if(k==='minimap'){ const m=document.getElementById('minimap'); if(m) m.style.display = v?'':'none'; }
    if(k==='bigHit') document.body.classList.toggle('bighit', !!v);
  };
  document.body.classList.toggle('bighit', !!SET('bigHit'));
  const mm=document.getElementById('minimap'); if(mm) mm.style.display = SET('minimap')?'':'none';

  /* fold the new per-frame work into the existing loop */
  let mmAcc = 0, badgeAcc = 0;
  const _raf = window.requestAnimationFrame.bind(window);
  let last = performance.now();
  (function extra(now){
    _raf(extra);
    const dt = Math.min(0.2, (now-last)/1000); last = now;
    if(!S) return;
    tickIdleRules(dt);
    mmAcc += dt; badgeAcc += dt;
    if(mmAcc > 0.5){ mmAcc = 0; paintMinimap(); }
    if(badgeAcc > 2){ badgeAcc = 0; tabBadges(); }
  })(performance.now());

  setTimeout(()=>{ tabBadges(); paintMinimap(); }, 600);
})();
