/* =====================================================================
   WIRING — new panels, Apple-style chrome, and hooks into the engine
   ===================================================================== */

/* ---------------- Apple-flavoured chrome ---------------- */
const UI2CSS = `
:root{
  --acc:#7cc24f; --acc2:#6fb6d8; --warn:#ffb03a; --bad:#ff6b5a;
  --g1:rgba(255,255,255,.07); --g2:rgba(255,255,255,.11);
  --hair:rgba(255,255,255,.10); --hair2:rgba(255,255,255,.18);
  --txt:#f2f5ee; --txt2:#a9b6a0; --txt3:#78876f;
  --blur:saturate(180%) blur(22px);
  --ease:cubic-bezier(.32,.72,0,1);
}
body{ font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","SF Pro Display","Helvetica Neue",Inter,sans-serif;
  letter-spacing:-0.01em; }
body.hc{ --txt2:#d6e0cf; --txt3:#b4c2ad; }
body.noblur *{ backdrop-filter:none!important; }

/* frosted panels */
#top{ background:linear-gradient(180deg, rgba(30,40,24,.86), rgba(20,28,14,.82));
  backdrop-filter:var(--blur); -webkit-backdrop-filter:var(--blur);
  border-bottom:.5px solid var(--hair2); box-shadow:0 1px 0 rgba(255,255,255,.05), 0 8px 30px rgba(0,0,0,.35); }
.panel{ background:linear-gradient(180deg, rgba(28,37,22,.92), rgba(22,30,17,.94));
  backdrop-filter:var(--blur); -webkit-backdrop-filter:var(--blur); }
#left{ border-right:.5px solid var(--hair2); }
#right{ border-left:.5px solid var(--hair2); }

/* pill controls */
.stat{ border-radius:980px; border:.5px solid var(--hair2); background:var(--g1);
  padding:5px 11px; transition:transform .22s var(--ease), background .22s var(--ease); }
.stat:hover{ background:var(--g2); transform:translateY(-1px); }
.tbtn{ border-radius:980px; border:.5px solid var(--hair2); background:var(--g1);
  transition:transform .2s var(--ease), background .2s var(--ease); }
.tbtn:hover{ background:var(--g2); transform:translateY(-1px); }
.tbtn.on{ background:linear-gradient(180deg,#67ad45,#4a8b34); border-color:#7cc24f;
  box-shadow:0 2px 10px rgba(124,194,79,.35); }
.tbtn:active,.stat:active{ transform:scale(.96); }

/* segmented tab strip */
.ptabs{ gap:2px; padding:5px; background:rgba(0,0,0,.26); border-bottom:.5px solid var(--hair);
  overflow-x:auto; scrollbar-width:none; }
.ptabs::-webkit-scrollbar{ display:none; }
.ptab{ border-radius:9px; border:0; padding:6px 11px; font-size:11px; font-weight:600;
  letter-spacing:0; text-transform:none; white-space:nowrap; flex:0 0 auto;
  transition:background .2s var(--ease), color .2s var(--ease); }
.ptab.on{ background:var(--g2); color:var(--txt); border:0;
  box-shadow:0 1px 3px rgba(0,0,0,.3), inset 0 .5px 0 rgba(255,255,255,.15); }

/* cards */
.card{ margin:9px 10px; padding:11px 12px; border-radius:14px; background:var(--g1);
  border:.5px solid var(--hair); }
.cardhead{ display:flex; justify-content:space-between; align-items:flex-start; gap:10px; margin-bottom:7px; }
.eyebrow{ font-size:10px; text-transform:uppercase; letter-spacing:.07em; color:var(--txt3); font-weight:600; }
.big{ font-size:19px; font-weight:700; letter-spacing:-.02em; display:block;
  font-variant-numeric:tabular-nums; }
.big.bad{ color:var(--bad); }
.muted{ color:var(--txt3); font-size:11px; display:block; line-height:1.4; }
.statrow{ display:flex; justify-content:space-between; font-size:12px; margin-bottom:4px; }
.statrow b{ font-variant-numeric:tabular-nums; }
.statrow b.bad{ color:var(--bad); }
.warnbox{ margin-top:7px; padding:7px 9px; border-radius:10px; font-size:11px;
  background:rgba(255,176,58,.13); border:.5px solid rgba(255,176,58,.4); color:#ffd591; }
.ledger{ margin-top:6px; border-top:.5px solid var(--hair); }
.ledrow{ display:flex; justify-content:space-between; font-size:11.5px; padding:5px 0;
  border-bottom:.5px solid rgba(255,255,255,.05); }
.ledrow b{ font-variant-numeric:tabular-nums; color:var(--txt2); }

/* chips & buttons */
.chip{ padding:5px 11px; border-radius:980px; font-size:11px; font-weight:600;
  background:var(--g1); border:.5px solid var(--hair2); color:var(--txt);
  transition:transform .18s var(--ease), background .18s var(--ease); }
.chip:hover:not(:disabled){ background:var(--g2); transform:translateY(-1px); }
.chip:active{ transform:scale(.95); }
.chip:disabled{ opacity:.35; cursor:not-allowed; }
.chip.on{ background:linear-gradient(180deg,#67ad45,#4a8b34); border-color:#7cc24f; }
.chip.go{ background:linear-gradient(180deg,#67ad45,#4a8b34); border-color:#7cc24f; }
.btn{ padding:9px 16px; border-radius:12px; font-weight:650; font-size:13px;
  background:linear-gradient(180deg,#67ad45,#4a8b34); border:.5px solid #7cc24f; color:#fff;
  transition:transform .18s var(--ease), filter .18s var(--ease); }
.btn:hover{ filter:brightness(1.08); transform:translateY(-1px); }
.btn:active{ transform:scale(.97); }
.btn.ghost{ background:var(--g1); border-color:var(--hair2); color:var(--txt); }
.btn.wide{ width:100%; }

/* jobs */
.job{ display:flex; align-items:center; gap:9px; margin:6px 10px; padding:9px 11px;
  border-radius:13px; background:var(--g1); border:.5px solid var(--hair); }
.job.off{ opacity:.45; }
.jm{ flex:1; min-width:0; } .jm b{ font-size:12.5px; display:block; }
.jp{ font-size:14px; font-weight:700; color:var(--acc); font-variant-numeric:tabular-nums; }

/* coach */
.tipcard{ display:flex; gap:10px; margin:7px 10px; padding:10px 11px; border-radius:13px;
  background:var(--g1); border:.5px solid var(--hair); }
/* urgency lives in the badge, and the card tints only when it is genuinely urgent */
.tipcard.p1{ background:rgba(255,107,90,.09); border-color:rgba(255,107,90,.26); }
.tipn{ width:20px; height:20px; border-radius:50%; background:var(--g2); color:var(--txt2); flex:none;
  display:flex; align-items:center; justify-content:center; font-size:10.5px; font-weight:700;
  font-variant-numeric:tabular-nums; }
.tipcard.p1 .tipn{ background:var(--bad);  color:#2b0e09; }
.tipcard.p2 .tipn{ background:var(--warn); color:#2b1d06; }
.tipcard.p3 .tipn{ background:var(--acc2); color:#06212c; }
.tipcard b{ font-size:12.5px; display:block; margin-bottom:2px; }

/* settings */
.setrow{ display:flex; justify-content:space-between; align-items:center; gap:10px;
  padding:8px 12px; font-size:12px; border-bottom:.5px solid rgba(255,255,255,.05); }
.setrow.col{ display:block; }
.sl{ display:flex; justify-content:space-between; font-size:12px; margin-bottom:5px; }
.sl b{ font-variant-numeric:tabular-nums; color:var(--txt2); }
.segs{ display:flex; gap:3px; background:rgba(0,0,0,.3); padding:3px; border-radius:10px; }
.seg{ flex:1; padding:5px; border-radius:7px; font-size:11px; font-weight:600; color:var(--txt3); }
.seg.on{ background:var(--g2); color:var(--txt); box-shadow:0 1px 3px rgba(0,0,0,.3); }
input[type=range]{ -webkit-appearance:none; height:4px; border-radius:2px;
  background:rgba(255,255,255,.16); width:100%; }
input[type=range]::-webkit-slider-thumb{ -webkit-appearance:none; width:17px; height:17px;
  border-radius:50%; background:#fff; box-shadow:0 1px 4px rgba(0,0,0,.5); cursor:pointer; }

/* land / home chooser */
.filters{ display:flex; flex-wrap:wrap; gap:5px; margin-bottom:9px; }
.landgrid{ display:grid; grid-template-columns:repeat(auto-fill,minmax(148px,1fr)); gap:9px;
  max-height:52vh; overflow-y:auto; padding:2px; }
.landcard{ display:flex; flex-direction:column; gap:3px; padding:9px; border-radius:14px;
  background:var(--g1); border:.5px solid var(--hair); text-align:left;
  transition:transform .2s var(--ease), background .2s var(--ease); }
.landcard:hover{ background:var(--g2); transform:translateY(-2px);
  box-shadow:0 8px 22px rgba(0,0,0,.4); }
.landcard b{ font-size:12px; } .lminimap svg{ width:100%; height:auto; border-radius:8px; display:block; }
.lprice{ font-size:12px; font-weight:700; color:var(--acc); font-variant-numeric:tabular-nums; }

/* sun arc */
#sunarc{ position:absolute; left:0; right:0; top:0; height:46px; z-index:18; pointer-events:none;
  border-bottom:.5px solid rgba(0,0,0,.35); overflow:hidden; }
#sunarc .clock{ position:absolute; right:10px; bottom:5px; font-size:11px; font-weight:650;
  color:#fff; text-shadow:0 1px 4px rgba(0,0,0,.7); font-variant-numeric:tabular-nums; }
#world.hasarc .wbadge{ top:56px; }

/* wind + weather motion */
.sway{ animation:swayW var(--wind-t,5.5s) ease-in-out infinite!important; }
@keyframes swayW{ 0%,100%{transform:rotate(calc(var(--wind-a,3deg) * -1))}
  50%{transform:rotate(var(--wind-a,3deg))} }
.cropsway{ transform-box:fill-box; transform-origin:center bottom;
  animation:swayW calc(var(--wind-t,5.5s) * .7) ease-in-out infinite; }
@keyframes rainfall{ from{transform:translate(0,-40px);opacity:0} 12%{opacity:.55}
  to{transform:translate(-26px,190px);opacity:0} }
.rainline{ animation:rainfall 1.05s linear infinite; }
@keyframes snowfall{ from{transform:translate(0,-30px);opacity:0} 15%{opacity:.8}
  to{transform:translate(28px,220px);opacity:0} }
.snowflake{ animation:snowfall 7s linear infinite; }
@keyframes dustdrift{ 0%,100%{transform:translateX(-30px);opacity:.05} 50%{opacity:.16} }
.dust{ animation:dustdrift 14s ease-in-out infinite; }

/* the character */
@keyframes youwalk{ 0%,100%{transform:translateY(0) rotate(-2deg)} 50%{transform:translateY(-2px) rotate(2deg)} }
@keyframes youwork{ 0%,100%{transform:translateY(0) rotate(0)} 50%{transform:translateY(2px) rotate(-7deg)} }
.youbob{ transform-box:fill-box; transform-origin:center bottom; }
.youbob.walking{ animation:youwalk .38s ease-in-out infinite; }
.youbob.working{ animation:youwork .45s ease-in-out infinite; }
#you{ pointer-events:none; filter:drop-shadow(1px 3px 3px rgba(0,0,0,.5)); }

@media(prefers-reduced-motion:reduce){ .sway,.cropsway,.rainline,.snowflake,.dust,.youbob{ animation:none!important; } }
`;

/* ---------------- extend G ---------------- */
Object.assign(G, {
  filterLand(k,v){ chooseFilter[k]=v; modal(landChooser()); },
  openLandChooser(){ modal(landChooser()); },
  pickLand(id){ S.pendingLand = id; sfx('click'); modal(homeChooser()); },
  pickHome(id){
    const l = LANDMAP[S.pendingLand] || LANDS[0], hm = HOMEMAP[id] || HOMES[0];
    startFarm(l, hm);
    G.closeModal(); sfx('build');
  },
  openProfs(){
    const byField = {};
    PROFS.forEach(p=>{ (byField[p.field] = byField[p.field]||[]).push(p); });
    modal(`<h2>Choose your work</h2>
      <p class="sub">${PROFS.length} professions you can do from the farm. Pay is monthly and rises with
      skill; every billable hour is an hour you did not spend on the land.
      Retraining costs about 60% of a month's pay and knocks your skill back.</p>
      ${Object.keys(byField).map(f=>`<h4>${f}</h4>
        <div class="landgrid" style="max-height:none;grid-template-columns:repeat(auto-fill,minmax(190px,1fr))">
        ${byField[f].map(p=>`<button class="landcard" onclick="switchProf('${p.id}')"
          data-tip="${esc(`<b>${p.name}</b><div class="tl"><span>Base pay</span><span class="tk">${fmt(p.pay)}/mo</span></div><div class="tl"><span>Typical week</span><b>${p.hrs}h</b></div><div class="tl"><span>Skill ceiling</span><b>level ${p.ceil}</b></div><div class="tl"><span>Retrain cost</span><span class="tk">${fmt(Math.round(p.pay*0.6))}</span></div>`)}">
          <b>${p.name}</b><span class="muted">${p.hrs}h/wk · ceiling ${p.ceil}</span>
          <span class="lprice">${fmt(p.pay)}/mo</span></button>`).join('')}</div>`).join('')}
      <div class="mfoot"><button class="btn ghost" onclick="G.closeModal()">Close</button></div>`);
  },
  openSettings(){ rightTab='set'; syncTabs(); renderRight(); },
  resetSettings(){ S.settings = {}; settingsInit(); renderRight(); toast('Settings restored','good'); G.save(); },
  newGame(){ modal(landChooser()); },
});

function syncTabs(){
  $$('.ptab').forEach(b=> b.classList.toggle('on', b.dataset.rt===rightTab));
}

/* ---------------- starting a farm on chosen land ---------------- */
function startFarm(land, home){
  const st = {
    v:5, day:1, season:3, weather:'sun', cash:(S&&S.settings&&S.settings.startCash)||520,
    xp:0, lvl:1, objs:[], nid:1, store:{}, water:60, feed:24, powerBal:0,
    contracts:[], log:[], speed:1, auto:{}, autoCfg:{moist:0.5,reserve:10}, autoLog:[],
    snd:{amb:true,mus:true}, muted:(S&&S.muted)||false, settings:(S&&S.settings)||{},
    seen:{}, totalEarned:0, harvests:0, seedsPlanted:0, prices:{}, tut:0,
    landId: land.id, homeId: home.id,
  };
  Object.keys(GOODS).forEach(k=> st.prices[k]=1);
  S = st;
  settingsInit(); careerInit();
  resizeLand(land);
  terrainCache = '';
  /* the house you picked, then a starter kit */
  const cx = FARM.x + Math.floor(FARM.w/2) - 3, cy = FARM.y + Math.floor(FARM.h/2) - 2;
  place('cabin', cx, cy, 0, true);
  place('bed', FARM.x+2, FARM.y+FARM.h-4, 0, true);
  place('bed', FARM.x+6, FARM.y+FARM.h-4, 0, true);
  place('tank', FARM.x+2, FARM.y+2, 0, true);
  place('tree_native', FARM.x+FARM.w-4, FARM.y+2, 0, true);
  place('tree_shade', FARM.x+1, FARM.y+FARM.h-8, 0, true);
  S.you = null; youInit();
  rollContracts(); rollJobs();
  sel=null; ghost=null;
  render(); fitView(); ui();
  log(`Settled at a ${land.name.toLowerCase()} — ${home.name}.`,'gold');
  toast(`Welcome to your ${land.bn.toLowerCase()} farm`,'gold');
}
function resizeLand(land){
  WT = land.w + 8; HT = land.h + 6;
  WPX = WT*T; HPX = HT*T;
  FARM.x = 3; FARM.y = 3; FARM.w = land.w; FARM.h = land.h;
  terrainCache = '';
}

/* ---------------- hooks into the running game ---------------- */
(function wire(){
  const st = document.createElement('style'); st.id='ui2css'; st.textContent = UI2CSS;
  document.head.appendChild(st);

  /* extra right-panel tabs */
  const tabs = document.querySelector('.ptabs');
  if(tabs){
    tabs.querySelectorAll('.ptab').forEach((b,i)=>{
      b.textContent = ['Info','Barn','Orders','AI'][i] || b.textContent;
    });
    [['work','Work','<b>Your career</b>Salary, client work, bills and debt.'],
     ['coach','Coach','<b>AI coach</b>Reads the farm and tells you what to fix. Unlocks at level 2.'],
     ['set','Settings','<b>Settings</b>50 controls for gameplay, economy, display, audio and assistance.']
    ].forEach(t=>{
      const b = document.createElement('button');
      b.className='ptab'; b.dataset.rt=t[0]; b.textContent=t[1]; b.dataset.tip=t[2];
      b.addEventListener('click', ()=>{ rightTab=t[0]; syncTabs(); renderRight(); sfx('click'); });
      tabs.appendChild(b);
    });
  }
  /* sun arc strip */
  const world = document.getElementById('world');
  if(world && !document.getElementById('sunarc')){
    const a = document.createElement('div'); a.id='sunarc';
    world.insertBefore(a, world.firstChild);
    world.classList.add('hasarc');
  }
  /* a New farm button that opens the land chooser */
  const reset = document.querySelector('.tbtn.danger');
  if(reset) reset.setAttribute('onclick','G.newGame()');
})();

/* right panel: route the new tabs */
const _renderRight = renderRight;
renderRight = function(){
  const b = $('#rightBody');
  if(rightTab==='work')  return void(b.innerHTML = careerHTML());
  if(rightTab==='coach') return void(b.innerHTML = coachHTML());
  if(rightTab==='set')   return void(b.innerHTML = settingsHTML());
  _renderRight();
};

/* scene: weather particles, the character, wind */
const _render = render;
render = function(){
  _render();
  const svg = document.querySelector('#scene svg');
  if(svg){
    svg.insertAdjacentHTML('beforeend', youLayer());
    const wl = weatherLayer();
    if(wl) svg.insertAdjacentHTML('beforeend', wl);
  }
  applyWind();
};

/* daily: career, land-specific weather */
const _advanceDay = advanceDay;
advanceDay = function(){
  _advanceDay();
  if(typeof careerDay==='function' && S.settings && S.settings.salaryOn!==false) careerDay();
  else if(typeof careerInit==='function'){ careerInit(); S.career.hours = HOURS_PER_DAY; rollJobs(); }
  applyWind();
};
const _rollWeather = rollWeather;
rollWeather = function(){
  const tbl = (typeof landWeatherTable==='function' && S.landId) ? landWeatherTable() : null;
  if(tbl && tbl.length) S.weather = tbl[Math.floor(Math.random()*tbl.length)];
  else _rollWeather();
};

/* actions walk there first */
['harvest','water','collect','clean','weed','manure','vet'].forEach(k=>{
  const orig = G[k];
  G[k] = function(id){
    const o = S.objs.find(z=>z.id===id);
    if(!o || !S.you) return orig.call(G, id);
    if(typeof spendHours==='function') spendHours(k);
    goDo(o, k, ()=> orig.call(G, id));
    ui();
  };
});
const _plant = G.plant;
G.plant = function(id, ck){
  const o = S.objs.find(z=>z.id===id);
  if(!o) return _plant.call(G, id, ck);
  if(typeof spendHours==='function') spendHours('plant');
  goDo(o, 'plant', ()=> _plant.call(G, id, ck));
  ui();
};

/* the character and the sun tick along with everything else */
let _sunT = 0;
setInterval(()=>{
  const dt = 0.12;
  if(typeof tickYou==='function') tickYou(dt);
  _sunT++;
  if(_sunT % 4 === 0 && typeof paintSun==='function' &&
     (!S.settings || S.settings.sunarc !== false)) paintSun();
}, 120);
