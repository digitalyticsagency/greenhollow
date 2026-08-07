/* =====================================================================
   NEGLECT, PESTS, AND THE LAND GOING BACK

   Automation was free: switch the modules on and the farm ran itself
   forever. This gives it a cost.

   The machines do what machines do — water, harvest, sow, feed. What
   they cannot do is weed a bed or deal with an infestation, and those
   are the jobs that decide whether a farm holds. Let the weeds go and
   pests build; let pests build and the crops go backwards, the animals
   sicken, the household's mood drops; leave it long enough and the
   paddocks stop being paddocks.

   It is deliberately slow and recoverable. You get warned at every
   stage, and one afternoon of work pulls it all back. The point is
   that the afternoon has to happen.
   ===================================================================== */

/* weeding and spraying are real jobs, not incidental clicks - give them
   their own hours rather than letting spendHours fall back to a default */
if(typeof TASK_HOURS === 'object' && TASK_HOURS){
  if(TASK_HOURS.weed === undefined) TASK_HOURS.weed = 1.2;
  if(TASK_HOURS.pest === undefined) TASK_HOURS.pest = 1.4;
}

function neglectInit(){
  if(S.pests === undefined)  S.pests = 0;
  if(S.decay === undefined)  S.decay = 0;
  (S.objs||[]).forEach(o=>{ if(o.weeds === undefined) o.weeds = 0; });
}

/* how hard pests come on, from the existing difficulty setting */
function pestRate(){
  const v = (typeof SET === 'function') ? SET('pestRate') : 50;
  return (v === undefined ? 50 : v) / 50;      // 1.0 at the default
}

/* ---------- 1. neglect accrues where machines cannot reach ---------- */
function tickNeglect(days){
  neglectInit();
  const plots = (S.objs||[]).filter(o=>BPMAP[o.bp] && BPMAP[o.bp].kind==='plot' && o.crop);
  const pens  = (S.objs||[]).filter(o=>BPMAP[o.bp] && BPMAP[o.bp].kind==='animal');

  /* weeds grow in any planted bed. Irrigation and sowing modules do not
     touch them - that is the gap the player has to cover. */
  plots.forEach(o=>{
    o.weeds = Math.min(1, (o.weeds||0) + 0.055*days*pestRate());
  });
  /* pens get dirty; the livestock module slows it but does not stop it */
  const stockAuto = (typeof autoOn === 'function') && autoOn('livestock');
  pens.forEach(o=>{
    o.care = Math.max(0, (o.care===undefined?1:o.care) - (stockAuto ? 0.02 : 0.05)*days);
  });

  /* pests feed on weedy beds and dirty pens */
  const weedy = plots.reduce((a,o)=>a + (o.weeds||0), 0);
  const dirty = pens.reduce((a,o)=>a + (1 - (o.care===undefined?1:o.care)), 0);
  const pressure = (weedy*7 + dirty*5) * pestRate();
  /* predators keep them down: bees, ponds and flowers all help */
  const helpers = (S.objs||[]).filter(o=>/apiary|pond|flowers|hedge|tree_/.test((BPMAP[o.bp]||{}).art||'')).length;
  const suppress = 3 + helpers*1.6;
  S.pests = Math.max(0, S.pests + (pressure - suppress)*days);

  /* ---------- 2. what pests actually do ---------- */
  if(S.pests > 100){
    const bite = Math.min(0.5, (S.pests-100)/400);
    plots.forEach(o=>{ if(o.crop && o.stage > 0 && Math.random() < bite*0.5) o.stage = Math.max(0, o.stage - 1); });
    pens.forEach(o=>{ if(Math.random() < bite*0.28) o.care = Math.max(0, (o.care||1) - 0.2); });
    S.morale = Math.max(0, (S.morale===undefined?0.6:S.morale) - 0.05*days);
    if(!S._pestWarned || S.day - S._pestWarned > 4){
      S._pestWarned = S.day;
      log(`Infestation — ${Math.round(S.pests)} pests. Crops are going backwards and the animals are off.`, 'bad', 'alert');
      toast('Infestation on the farm','bad');
      if(typeof sfx==='function') sfx('error');
    }
  } else if(S.pests > 55 && (!S._pestNote || S.day - S._pestNote > 6)){
    S._pestNote = S.day;
    log(`Pests are building — ${Math.round(S.pests)}. Weed the beds and muck out before it turns.`, 'warn', 'alert');
  }

  /* ---------- 3. the land follows ---------- */
  const avgWeeds = plots.length ? weedy/plots.length : 0;
  const avgDirty = pens.length ? dirty/pens.length : 0;
  const bad = (S.pests > 100 ? 1 : S.pests/100) * 0.5 + avgWeeds*0.3 + avgDirty*0.2;
  if(bad > 0.55) S.decay = Math.min(1, S.decay + (bad-0.55)*0.16*days);
  else           S.decay = Math.max(0, S.decay - (0.55-bad)*0.22*days);

  const stage = decayStage();
  if(stage !== S._decayStage){
    S._decayStage = stage;
    if(stage >= 1){
      const msg = ['','The grass is thinning and the soil is showing through.',
                   'The paddocks are going. Bare ground where the sward was.',
                   'This is turning to wasteland. Very little will grow here now.'][stage];
      log(msg, stage >= 2 ? 'bad' : 'warn', 'alert');
      toast(['','Land is thinning','Paddocks failing','Wasteland'][stage], 'bad');
    } else {
      log('The land has come back — green through the paddocks again.', 'good', 'farm');
    }
    applyDecay();
  }
}
function decayStage(){
  neglectInit();
  return S.decay > 0.75 ? 3 : S.decay > 0.45 ? 2 : S.decay > 0.18 ? 1 : 0;
}

/* ---------- the wasteland, drawn rather than filtered ---------- */
/* A CSS filter over the whole world costs a full offscreen pass every
   frame. This is an overlay instead: dust colour, bare scrapes, dead
   timber and blowing grit, all scaled by how far gone the land is. */
function decayLayer(){
  neglectInit();
  if(S.decay <= 0.05) return '';
  const d = S.decay;
  const X = FARM.x*T, Y = FARM.y*T, W = FARM.w*T, H = FARM.h*T;
  let s = `<g id="decaylayer" aria-hidden="true">`;
  /* the ground losing its colour */
  s += `<rect x="${n(X)}" y="${n(Y)}" width="${n(W)}" height="${n(H)}" rx="6"
    fill="#8a7a52" opacity="${(d*0.42).toFixed(3)}"/>`;
  s += `<rect x="${n(X)}" y="${n(Y)}" width="${n(W)}" height="${n(H)}" rx="6"
    fill="#5c4a30" opacity="${(d*d*0.28).toFixed(3)}"/>`;
  /* bare scrapes where the sward has gone */
  const scrapes = Math.round(d*22);
  for(let i=0;i<scrapes;i++){
    const sx = X + hash(i*2.7)*W, sy = Y + hash(i*4.3)*H;
    const rx = 10 + hash(i*5.1)*26, ry = 6 + hash(i*6.7)*16;
    s += `<ellipse cx="${n(sx)}" cy="${n(sy)}" rx="${n(rx)}" ry="${n(ry)}"
      fill="#9c8558" opacity="${(0.18 + d*0.22).toFixed(2)}"/>`;
    if(d > 0.5)
      s += `<ellipse cx="${n(sx+2)}" cy="${n(sy+1)}" rx="${n(rx*0.55)}" ry="${n(ry*0.5)}"
        fill="#6f5c3a" opacity="${(d*0.3).toFixed(2)}"/>`;
  }
  /* cracked earth once it is properly gone */
  if(d > 0.6){
    for(let i=0;i<Math.round((d-0.6)*40);i++){
      const cx = X + hash(i*3.3)*W, cy = Y + hash(i*7.1)*H;
      const a = hash(i*9.7)*Math.PI;
      const L = 16 + hash(i*2.2)*30;
      s += `<path d="M${n(cx)} ${n(cy)} l ${n(Math.cos(a)*L*0.5)} ${n(Math.sin(a)*L*0.5)}
        l ${n(Math.cos(a+0.5)*L*0.4)} ${n(Math.sin(a+0.5)*L*0.4)}"
        stroke="#4a3a24" stroke-width="0.9" fill="none" opacity="${((d-0.6)*1.4).toFixed(2)}"/>`;
    }
  }
  /* dead standing timber */
  if(d > 0.45){
    for(let i=0;i<Math.round((d-0.45)*14);i++){
      const tx = X + hash(i*11.3)*W, ty = Y + hash(i*13.7)*H;
      s += `<path d="M${n(tx)} ${n(ty)} l 0 ${n(-14-hash(i)*10)}" stroke="#5b4a35" stroke-width="1.6"/>`;
      s += `<path d="M${n(tx)} ${n(ty-10)} l ${n(-6)} ${n(-5)} M${n(tx)} ${n(ty-13)} l ${n(7)} ${n(-4)}"
        stroke="#5b4a35" stroke-width="1.1" fill="none"/>`;
    }
  }
  /* grit blowing across */
  if(d > 0.3){
    for(let i=0;i<Math.round(d*9);i++)
      s += `<ellipse class="dk-dust" cx="${n(X + hash(i*17.1)*W)}" cy="${n(Y + hash(i*19.3)*H)}"
        rx="${n(26+hash(i)*40)}" ry="${n(10+hash(i*3)*16)}" fill="#c4ab7a"
        opacity="${(0.06+d*0.10).toFixed(3)}" style="animation-delay:-${(hash(i*5)*14).toFixed(1)}s"/>`;
  }
  return s + '</g>';
}

/* pests, when there are enough of them to see */
function pestLayer(){
  neglectInit();
  if(S.pests < 100) return '';
  const swarms = Math.min(7, Math.round((S.pests-100)/45) + 2);
  const plots = (S.objs||[]).filter(o=>BPMAP[o.bp] && BPMAP[o.bp].kind==='plot' && o.crop);
  if(!plots.length) return '';
  let s = `<g id="pestlayer" aria-hidden="true">`;
  for(let i=0;i<swarms;i++){
    const o = plots[i % plots.length];
    const f = footprint(BPMAP[o.bp], o.rot);
    const cx = (o.tx + f.w*0.5)*T, cy = (o.ty + f.h*0.4)*T;
    s += `<g class="pt-swarm" transform="translate(${n(cx)},${n(cy)})"
      style="animation-delay:-${(i*0.7).toFixed(1)}s">`;
    for(let k=0;k<7;k++){
      const a = (k/7)*Math.PI*2;
      s += `<circle class="pt-bug" cx="${n(Math.cos(a)*7)}" cy="${n(Math.sin(a)*5)}" r="1.1"
        fill="#3a3020" style="animation-delay:-${(k*0.18).toFixed(2)}s"/>`;
    }
    s += `</g>`;
  }
  return s + '</g>';
}

const _peopleLayerNeglect = peopleLayer;
peopleLayer = function(){ return decayLayer() + _peopleLayerNeglect.apply(this, arguments) + pestLayer(); };

function applyDecay(){ if(typeof render === 'function') render(); }

/* ---------- 4. the work that fixes it ---------- */
G.weedAll = function(){
  neglectInit();
  const plots = (S.objs||[]).filter(o=>BPMAP[o.bp] && BPMAP[o.bp].kind==='plot' && (o.weeds||0) > 0.05);
  if(!plots.length) return toast('Nothing needs weeding','');
  if(typeof hoursLeft === 'function' && hoursLeft() < 1)
    return toast('No hours left today','bad'), sfx('error');
  plots.forEach(o=>{ o.weeds = 0; });
  S.pests = Math.max(0, S.pests - 18 - plots.length*4);
  if(typeof spendHours === 'function') spendHours('weed');
  log(`Weeded ${plots.length} bed${plots.length>1?'s':''}. Pests down to ${Math.round(S.pests)}.`, 'good', 'farm');
  toast('Beds weeded','good');
  if(typeof sfx==='function') sfx('water');
  render(); ui(); G.save();
};

G.dealWithPests = function(){
  neglectInit();
  if(S.pests < 20) return toast('Pests are under control','');
  if(typeof hoursLeft === 'function' && hoursLeft() < 2)
    return toast('That needs a couple of hours you have not got','bad'), sfx('error');
  const cost = Math.round(30 + S.pests*0.8);
  if(S.cash < cost) return toast(`Needs ${fmt(cost)} for materials`,'bad'), sfx('error');
  S.cash -= cost;
  S.pests = Math.max(0, S.pests * 0.25);
  if(typeof spendHours === 'function'){ spendHours('pest'); spendHours('pest'); }   /* 2.8h all up */
  log(`Treated the farm for pests — ${fmt(cost)}. Down to ${Math.round(S.pests)}.`, 'good', 'farm');
  toast('Pests knocked back','good');
  if(typeof sfx==='function') sfx('build');
  render(); ui(); G.save();
};

/* ---------- 5. surface it ---------- */
function neglectPanel(){
  neglectInit();
  const plots = (S.objs||[]).filter(o=>BPMAP[o.bp] && BPMAP[o.bp].kind==='plot' && o.crop);
  const weedy = plots.filter(o=>(o.weeds||0) > 0.4).length;
  const pens  = (S.objs||[]).filter(o=>BPMAP[o.bp] && BPMAP[o.bp].kind==='animal');
  const dirty = pens.filter(o=>(o.care===undefined?1:o.care) < 0.5).length;
  const st = decayStage();
  const pestCol = S.pests > 100 ? '#e0664f' : S.pests > 55 ? '#f0a24b' : '#7cc24f';
  const landTxt = ['Healthy','Thinning','Failing','Wasteland'][st];
  const landCol = ['#7cc24f','#f0d79a','#f0a24b','#e0664f'][st];
  return `<div class="pcard">
    <h3>Condition</h3>
    <p class="sub">Machines water, harvest, sow and feed. They do not weed a bed or
    deal with an infestation — those stay yours.</p>
    <div class="tl"><span>Pests</span><b style="color:${pestCol}">${Math.round(S.pests)}${S.pests>100?' — infested':''}</b></div>
    <div class="tl"><span>Beds needing weeding</span><b>${weedy} of ${plots.length}</b></div>
    <div class="tl"><span>Pens needing mucking out</span><b>${dirty} of ${pens.length}</b></div>
    <div class="tl"><span>The land</span><b style="color:${landCol}">${landTxt}</b></div>
    <div class="bar" style="margin-top:6px"><i style="transform:scaleX(${(1-S.decay).toFixed(3)});
      background:linear-gradient(90deg,${landCol},#9ad06f)"></i></div>
    <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">
      <button class="btn ghost" onclick="G.weedAll()">Weed the beds</button>
      <button class="btn ghost" onclick="G.dealWithPests()">Treat for pests</button>
    </div>
  </div>`;
}

const _renderRightNeglect = renderRight;
renderRight = function(){
  const r = _renderRightNeglect.apply(this, arguments);
  if(rightTab === 'owner'){
    const b = document.getElementById('rightBody');
    if(b) b.insertAdjacentHTML('afterbegin', neglectPanel());
  }
  return r;
};

/* one pass per game day */
let neglectLastDay = -1;
setInterval(()=>{
  if(typeof S === 'undefined' || !S || S.speed === 0) return;
  neglectInit();
  if(S.day !== neglectLastDay){
    if(neglectLastDay >= 0) tickNeglect(1);
    neglectLastDay = S.day;
  }
}, 900);

(function neglectCss(){
  const s = document.createElement('style');
  s.textContent = `
  #decaylayer, #pestlayer{ pointer-events:none; }
  .dk-dust{ animation: dkDrift 22s ease-in-out infinite; transform-box:fill-box; }
  @keyframes dkDrift{
    0%,100%{ transform: translateX(-10px); opacity:.5; }
    50%    { transform: translateX(14px);  opacity:1; } }
  .pt-swarm{ animation: ptSwarm 3.4s ease-in-out infinite; transform-box:fill-box; transform-origin:center; }
  @keyframes ptSwarm{
    0%,100%{ transform: translate(-3px,-2px) rotate(0deg); }
    50%    { transform: translate(4px,3px)   rotate(180deg); } }
  .pt-bug{ animation: ptBug .5s ease-in-out infinite; }
  @keyframes ptBug{ 0%,100%{ opacity:.5 } 50%{ opacity:1 } }
  @media (prefers-reduced-motion: reduce){
    .dk-dust,.pt-swarm,.pt-bug{ animation:none !important; } }
  `;
  document.head.appendChild(s);
})();

/* ---------- the unlock code ---------- */
/* This lives in the page source, so anyone who opens devtools can read
   it. It is a convenience for people you hand the link to, not a
   security control. */
const UNLOCK_CODE = '122133';

G.openUnlock = function(){
  modal(`<h2>Enter a code</h2>
    <p class="sub">If you were given a code, it unlocks the full game — no trial limit,
    every option available, and a farm with enough behind it to actually play.</p>
    <div class="mkguess">
      <input id="unlockin" class="mkinput" style="width:150px;letter-spacing:3px;text-align:center"
        placeholder="------" maxlength="12"/>
    </div>
    <div class="mfoot">
      <button class="btn" onclick="G.tryUnlock()">Unlock</button>
      <button class="btn ghost" onclick="G.closeModal()">Close</button>
    </div>`);
  setTimeout(()=>{ const i=document.getElementById('unlockin'); if(i) i.focus(); }, 60);
};

G.tryUnlock = function(){
  const v = ((document.getElementById('unlockin')||{}).value || '').trim();
  if(v !== UNLOCK_CODE){
    toast('That code is not right','bad');
    if(typeof sfx==='function') sfx('error');
    return;
  }
  /* no trial limit */
  if(typeof PLAY !== 'undefined'){ PLAY.unlocked = true; if(typeof savePlay==='function') savePlay(); }
  const g = document.getElementById('gateWrap'); if(g) g.remove();
  if(S) S.speed = S.speed || 1;
  /* a farm worth playing rather than an empty paddock */
  S.cash = Math.max(S.cash, 8000);
  S.level = Math.max(S.level || 1, 4);
  settingsInit();
  S.unlocked = true;
  if(typeof S.fame === 'number') S.fame = Math.max(S.fame, 20);
  log('Full version unlocked. Everything is available.', 'gold', 'farm');
  toast('Unlocked — full game', 'gold');
  if(typeof sfx==='function') sfx('level');
  G.closeModal(); ui(); renderRight(); G.save();
};

/* offer it on the trial gate, and from the top bar */
setTimeout(()=>{
  const bar = document.querySelector('.tbtn') && document.querySelector('.tbtn').parentElement;
  if(bar && !document.getElementById('codebtn')){
    const b = document.createElement('button');
    b.id = 'codebtn'; b.className = 'tbtn';
    b.textContent = 'Code';
    b.dataset.tip = '<b>Enter a code</b>Unlocks the full game if you were given one.';
    b.addEventListener('click', ()=>G.openUnlock());
    bar.appendChild(b);
  }
}, 580);

/* add the code route to the trial lock as well */
if(typeof showGate === 'function'){
  const _showGate = showGate;
  showGate = function(){
    const r = _showGate.apply(this, arguments);
    const card = document.querySelector('#gateWrap .gateCard');
    if(card && !card.querySelector('.gateCode')){
      const b = document.createElement('button');
      b.className = 'gateBtn ghost gateCode';
      b.textContent = 'I have a code';
      b.addEventListener('click', ()=>G.openUnlock());
      card.insertBefore(b, card.querySelector('.gateFine'));
    }
    return r;
  };
}
