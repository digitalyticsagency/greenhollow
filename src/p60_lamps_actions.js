/* =====================================================================
   STREET LAMPS, A FENCE THAT HOLDS, AND TEN THINGS TO DO

   Three things.

   1. Lamp posts down the western boundary, dark by day and lit at night,
      each throwing a warm pool on the track. They run on the farm's own
      power, so a night with a flat battery is a dark night.

   2. The escape rule is cancelled. Nothing gets out any more. Stock are
      held inside their pen at all times and the random escape roll is
      gone; anything already loose when this build loads is walked home
      on the first tick rather than stranded.

   3. Ten actions, one for each thing the farm is made of - growing,
      water, power, animals, craft, trade, land, home, AI and leisure.
      Each costs something, each has a cooldown measured in days, and
      each does something you can see happen.
   ===================================================================== */

/* ---------- 1. nothing gets out ---------- */
/* The stray machinery stays in the file: the pick-up, the carry and the
   put-back are still the right behaviour if anything ever does get out
   (the UFO, a future event). What is switched off is the farm rolling
   dice to release one on its own. */
if(typeof tickStrayChance === 'function'){
  tickStrayChance = function(){ /* escapes are off - the fence holds */ };
}

/* walk home anything that was already loose when this build loaded */
(function bringThemAllIn(){
  const doIt = ()=>{
    if(typeof S === 'undefined' || !S) return;
    const st = (S.strays || []);
    if(!st.length && !S.carry) return;
    st.forEach(s=>{
      const m = (typeof MINDS !== 'undefined') ? MINDS.get(s.pen) : null;
      if(m && m.list[s.i]) m.list[s.i].away = false;
    });
    if(S.carry){
      const m = (typeof MINDS !== 'undefined') ? MINDS.get(S.carry.pen) : null;
      if(m && m.list[S.carry.i]) m.list[S.carry.i].away = false;
    }
    S.strays = []; S.carry = null;
    if(typeof updateStrayHud === 'function') updateStrayHud();
    if(typeof updateCarryBadge === 'function') updateCarryBadge();
    if(typeof render === 'function') render();
    if(typeof log === 'function') log('The fences have been made good. Nothing is getting out now.', 'good', 'farm');
  };
  setTimeout(doIt, 900);
})();

/* ---------- 2. lamp posts along the western boundary ---------- */
const LAMP_GAP = 5;                     /* tiles between posts */

function lampPositions(){
  const out = [];
  if(typeof FARM === 'undefined') return out;
  const x = (FARM.x + 0.55) * T;        /* just inside the western fence */
  for(let ty = FARM.y + 2; ty < FARM.y + FARM.h - 1; ty += LAMP_GAP){
    out.push({ x, y: (ty + 0.5) * T });
  }
  return out;
}

function lampsLit(){
  const night = (typeof isNight === 'function') ? isNight() : false;
  if(!night) return false;
  /* they are on the farm's own supply - no power, no light */
  if(typeof S !== 'undefined' && S && typeof S.powerBal === 'number' && S.powerBal < -4) return false;
  return true;
}

function lampArt(){
  const ps = lampPositions();
  if(!ps.length) return '';
  const lit = lampsLit();
  let s = `<g id="lamps" class="${lit ? 'lit' : ''}">`;
  ps.forEach((p, i)=>{
    s += `<g class="lamp" transform="translate(${n(p.x)},${n(p.y)})" style="--d:${(i*0.7).toFixed(1)}s">`;
    /* the pool on the ground goes down first so the post sits in it */
    s += `<ellipse class="lamp-pool" cx="2" cy="6" rx="30" ry="12" fill="#ffd98a" opacity="0"/>`;
    s += `<ellipse class="lamp-pool2" cx="2" cy="6" rx="17" ry="7" fill="#fff0c4" opacity="0"/>`;
    /* base and post, lit from the upper left as everything else is */
    s += `<ellipse cx="1.5" cy="5" rx="4.4" ry="1.8" fill="#16240c" opacity=".3"/>`;
    s += `<rect x="-2.4" y="0" width="4.8" height="3" rx="1.2" fill="#3f4a52"/>`;
    s += `<rect x="-1.1" y="-26" width="2.2" height="27" rx="1.1" fill="#55616b"/>`;
    s += `<rect x="-1.1" y="-26" width="0.9" height="27" rx="0.45" fill="#7d8994"/>`;
    /* the arm and the head */
    s += `<path d="M0 -26 q0 -5 6 -5" fill="none" stroke="#55616b" stroke-width="2.1"/>`;
    s += `<path d="M2.6 -31.4 h7.2 l-1.5 4.6 h-4.2 Z" fill="#46525c"/>`;
    s += `<ellipse class="lamp-bulb" cx="6.2" cy="-26.4" rx="3.1" ry="1.5" fill="#ffe9a8" opacity=".25"/>`;
    /* the cone of light down to the ground */
    s += `<path class="lamp-cone" d="M3.4 -26 L9 -26 L26 6 L-16 6 Z" fill="#ffd98a" opacity="0"/>`;
    s += `</g>`;
  });
  return s + '</g>';
}

/* drawn under the people layer so the family walk through the light */
if(typeof peopleLayer === 'function'){
  const _peopleLayerLamps = peopleLayer;
  peopleLayer = function(){ return lampArt() + _peopleLayerLamps.apply(this, arguments); };
}

/* flip them at dusk and dawn without a full redraw */
let LAMP_STATE = null;
function tickLamps(){
  const el = document.getElementById('lamps');
  if(!el) return;
  const lit = lampsLit();
  if(lit === LAMP_STATE) return;
  LAMP_STATE = lit;
  el.classList.toggle('lit', lit);
  if(typeof log === 'function')
    log(lit ? 'The lamps along the west track came on.' : 'The lamps went out with the sunrise.', '', 'home');
}

/* ---------- 3. ten actions ---------- */
/* One for each part of the farm. Every one costs something real, has a
   cooldown in days so it cannot be spammed, and states plainly what it
   did. Nothing here is a no-op button. */
function cdLeft(id){
  S.actCd = S.actCd || {};
  const until = S.actCd[id] || 0;
  return Math.max(0, until - (S.day || 0));
}
function setCd(id, days){ S.actCd = S.actCd || {}; S.actCd[id] = (S.day || 0) + days; }

const ACTIONS = [
{ id:'compost_tea', cat:'Grow', name:'Brew compost tea', cost:60, cd:4,
  desc:'A barrel of steeped compost, watered onto every bed. Crops come on faster for a few days.',
  can:()=> S.objs.some(o=>BPMAP[o.bp].kind==='plot'),
  why:'No beds to water.',
  run(){ let k=0; S.objs.forEach(o=>{ if(BPMAP[o.bp].kind==='plot' && o.crop){ o.stage=Math.min(1,o.stage+0.18); k++; } });
         S.growBoost=(S.day||0)+4;
         return `Fed ${k} bed${k===1?'':'s'}. Everything growing has come on a stage.`; } },

{ id:'divert_roof', cat:'Water', name:'Divert the roof runoff', cost:120, cd:6,
  desc:'Re-plumb the downpipes into the tanks. A one-off catch now, and rain fills faster afterwards.',
  can:()=> true,
  run(){ const cap = 297 + (S.waterCap||0); const add = Math.min(90, Math.max(0, cap - S.water));
         S.water = Math.min(cap, S.water + add); S.rainBonus = 1.35;
         return `Caught ${Math.round(add)}L off the roofs. Rain fills the tanks faster from now on.`; } },

{ id:'shed_load', cat:'Power', name:'Shed the non-essential load', cost:0, cd:2,
  desc:'Drop everything that is not keeping food cold or water moving. Buys you a night on a flat battery.',
  can:()=> true,
  run(){ S.powerBal = (S.powerBal||0) + 6; S.loadShed=(S.day||0)+1;
         return 'Non-essential circuits off. Six kilowatts back on the balance until tomorrow.'; } },

{ id:'vet_round', cat:'Animals', name:'Call the vet out', cost:180, cd:5,
  desc:'A proper health round. Clears illness and puts condition back on every animal you own.',
  can:()=> (typeof stockPens==='function') && stockPens().length>0,
  why:'You have no stock.',
  run(){ let cured=0, seen=0;
         S.objs.forEach(o=>{ if(BPMAP[o.bp].kind!=='animal' || !o.animals) return;
           seen += o.animals; if(o.sick){ o.sick=0; cured++; }
           o.care=Math.min(1,(o.care||0.5)+0.3);
           (o.herd||[]).forEach(a=>{ a.health=Math.min(1,a.health+0.35); a.happy=Math.min(1,a.happy+0.2); }); });
         return `${seen} head seen${cured?`, ${cured} pen${cured===1?'':'s'} treated`:''}. Condition is up across the farm.`; } },

{ id:'workshop_day', cat:'Craft', name:'A day in the workshop', cost:0, cd:3,
  desc:'Turn raw produce into something worth more. Uses whatever is in the store.',
  can:()=> Object.keys(S.store||{}).some(k=>(S.store[k]||0) >= 4),
  why:'Nothing in the store worth working up.',
  run(){ let made=0, val=0;
         Object.keys(S.store).forEach(k=>{ const q=S.store[k]||0; if(q<4) return;
           const use=Math.min(q, 12); S.store[k]=q-use;
           const gain=Math.round(use*sellPrice(k)*0.85); val+=gain; made+=use; });
         if(!made) return 'Nothing worth working up today.';
         earn(val, Math.round(val/25));
         return `Worked up ${made} units into finished goods. ${fmt(val)} on the books.`; } },

{ id:'standing_order', cat:'Trade', name:'Take a standing order', cost:0, cd:7,
  desc:'A buyer commits to a fixed price for a week. Steady money, whatever the market does.',
  can:()=> true,
  run(){ const pay = 120 + Math.round((S.lvl||1)*45);
         S.standing = { until:(S.day||0)+7, pay };
         return `Signed for seven days at ${fmt(pay)} a day, paid each morning.`; } },

{ id:'survey', cat:'Land', name:'Survey the ground', cost:90, cd:10,
  desc:'Walk the property with a soil probe. Finds the good ground, and sometimes something else.',
  can:()=> true,
  run(){ let msg = 'Soil mapped. The beds you already have are on the best of it.';
         S.objs.forEach(o=>{ if(BPMAP[o.bp].kind==='plot'){ o.soil=Math.min(1,(o.soil||0.5)+0.15); } });
         if(Math.random() < 0.35){ const find = 200 + Math.round(Math.random()*500);
           earn(find, 8); msg += ` Turned up an old cache while you were at it — ${fmt(find)}.`; }
         return msg; } },

{ id:'sunday_lunch', cat:'Home', name:'Put on a proper lunch', cost:70, cd:5,
  desc:'Everyone at the table at the same time. It matters more than it sounds.',
  can:()=> (S.family||[]).length > 0,
  why:'Nobody home.',
  run(){ (S.family||[]).forEach(p=>{ p.mood=Math.min(1,(p.mood||0.6)+0.3); p.act='having lunch'; });
         S.morale=Math.min(1,(S.morale||0.6)+0.25);
         if(typeof speak==='function' && S.family[0]) speak(S.family[0], 'Everyone in!');
         return 'The whole house sat down together. Spirits are up.'; } },

{ id:'retrain_ai', cat:'AI', name:'Retrain the hub', cost:250, cd:6,
  desc:'Feed the season\'s data back into the control hub. It makes better calls afterwards.',
  can:()=> S.objs.some(o=>o.bp==='ai_hub'),
  why:'You need a control hub first.',
  run(){ S.aiTuned = Math.min(3, (S.aiTuned||0) + 1);
         return `Hub retrained (tuning ${S.aiTuned}/3). Automation wastes less water and power.`; } },

{ id:'day_off', cat:'Leisure', name:'Take the day off', cost:0, cd:6,
  desc:'Down tools. Nothing gets done and everyone is better for it.',
  can:()=> true,
  run(){ (S.family||[]).forEach(p=>{ p.mood=Math.min(1,(p.mood||0.6)+0.4); });
         S.morale=Math.min(1,(S.morale||0.6)+0.35); S.restDay=(S.day||0)+1;
         (typeof stockPens==='function' ? stockPens() : []).forEach(o=>{
           const m=MINDS.get(o.id); if(m) m.list.forEach(a=>{ if(a.need) a.need.company=Math.max(0,a.need.company-0.4); }); });
         return 'Tools down. Everyone spent the day out on the land instead of working it.'; } },
];

function runAction(id){
  const a = ACTIONS.find(x=>x.id===id); if(!a) return;
  if(cdLeft(id) > 0){ toast(`Not for another ${cdLeft(id)} day${cdLeft(id)===1?'':'s'}`,'bad'); return; }
  if(a.can && !a.can()){ toast(a.why || 'Cannot do that yet','bad'); return; }
  if(a.cost > (S.cash||0)){ toast('Not enough in the account','bad'); return; }
  if(a.cost){ S.cash -= a.cost; }
  const msg = a.run();
  setCd(id, a.cd);
  if(typeof log === 'function') log(msg, 'good', 'farm');
  if(typeof toast === 'function') toast(a.name + ' — done', 'good');
  if(typeof sfx === 'function') sfx('build');
  if(typeof ui === 'function') ui();
  if(typeof render === 'function') render();
  G.save();
  G.openActions();
}

G.runAction = runAction;
G.openActions = function(){
  const rows = ACTIONS.map(a=>{
    const cd = cdLeft(a.id);
    const blocked = (a.can && !a.can());
    const poor = a.cost > (S.cash||0);
    const off = cd > 0 || blocked || poor;
    /* the reason goes in the tooltip - putting the whole sentence on the
       button made it wide enough to sit on top of the description */
    const note = cd > 0 ? `${cd}d` : blocked ? 'not yet' : poor ? 'too dear' : '';
    const why  = cd > 0 ? `Ready in ${cd} day${cd===1?'':'s'}`
               : blocked ? (a.why || 'Not available yet')
               : poor ? `Costs ${fmt(a.cost)}` : '';
    return `<div class="actrow${off?' off':''}">
      <div class="actmain">
        <div class="acttop"><span class="actcat">${a.cat}</span><b>${a.name}</b></div>
        <div class="actdesc">${a.desc}</div>
      </div>
      <div class="actside">
        <div class="actcost">${a.cost ? fmt(a.cost) : 'free'}</div>
        <button class="btn sm" ${off?'disabled':''} title="${why}"
          onclick="G.runAction('${a.id}')">${off ? note : 'Do it'}</button>
        ${off && why ? `<div class="actwhy">${why}</div>` : ''}
      </div>
    </div>`;
  }).join('');
  modal(`<h2>Things you can do</h2>
    <p class="sub">One for each part of the place. Each has a cooldown, so pick what the farm needs this week.</p>
    <div class="actlist">${rows}</div>
    <div class="mfoot"><button class="btn ghost" onclick="G.closeModal()">Close</button></div>`);
};

/* the standing order pays each morning while it runs */
if(typeof advanceDay === 'function'){
  const _advDayAct = advanceDay;
  advanceDay = function(){
    const r = _advDayAct.apply(this, arguments);
    const so = S.standing;
    if(so && (S.day||0) <= so.until){
      earn(so.pay, 3);
      log(`Standing order paid ${fmt(so.pay)}.`, 'gold', 'money');
      if((S.day||0) === so.until) log('The standing order has run its course.', '', 'money');
    }
    return r;
  };
}

/* ---------- the button that opens it ---------- */
(function actionsButton(){
  const make = ()=>{
    if(document.getElementById('actbtn')) return;
    const b = document.createElement('button');
    b.id = 'actbtn'; b.type = 'button';
    b.title = 'Things you can do';
    b.innerHTML = '<span>✦</span>';
    b.addEventListener('click', (e)=>{ e.preventDefault(); e.stopPropagation(); G.openActions(); });
    document.body.appendChild(b);
  };
  setTimeout(make, 700);
})();

const _tickPeopleLamps = tickPeople;
tickPeople = function(dt){
  const r = _tickPeopleLamps.apply(this, arguments);
  try{ tickLamps(); }catch(e){}
  return r;
};

(function lampCss(){
  const s = document.createElement('style');
  s.textContent = `
  #lamps .lamp-pool,#lamps .lamp-pool2,#lamps .lamp-cone,#lamps .lamp-bulb{
    transition: opacity .9s ease; }
  #lamps.lit .lamp-pool { opacity:.20; animation: lampFlicker 6s ease-in-out infinite; animation-delay:var(--d); }
  #lamps.lit .lamp-pool2{ opacity:.30; }
  #lamps.lit .lamp-cone { opacity:.09; }
  #lamps.lit .lamp-bulb { opacity:1; }
  @keyframes lampFlicker{ 0%,100%{ opacity:.20 } 47%{ opacity:.24 } 52%{ opacity:.17 } }

  #actbtn{ position:fixed; left:14px; bottom:74px; width:44px; height:44px; border-radius:50%;
    border:0; cursor:pointer; z-index:8500; background:#3f6d3a; color:#eaf7e2;
    font-size:19px; line-height:1; box-shadow:0 3px 10px rgba(0,0,0,.4); }
  #actbtn:hover{ filter:brightness(1.12); }

  .actlist{ max-height:56vh; overflow:auto; margin:10px 0 4px; }
  .actrow{ display:flex; gap:12px; align-items:flex-start; padding:10px 4px;
    border-bottom:1px solid rgba(255,255,255,.07); }
  .actrow.off{ opacity:.5; }
  .actmain{ flex:1; min-width:0; }
  .acttop{ display:flex; gap:8px; align-items:baseline; }
  .actcat{ font-size:10px; letter-spacing:.08em; text-transform:uppercase; opacity:.65; }
  .actdesc{ font-size:12px; opacity:.78; margin-top:2px; line-height:1.35; }
  .actside{ text-align:right; flex:0 0 auto; }
  .actcost{ font-size:12px; opacity:.8; margin-bottom:4px; }
  .actside{ max-width:132px; }
  .actwhy{ font-size:10.5px; opacity:.62; margin-top:4px; line-height:1.25; }
  .btn.sm{ padding:5px 10px; font-size:12px; }
  @media (prefers-reduced-motion: reduce){ #lamps.lit .lamp-pool{ animation:none } }
  `;
  document.head.appendChild(s);
})();

/* ---------- handles ---------- */
G.lamps = function(){ return { posts:lampPositions().length, lit:lampsLit(), night:isNight() }; };
G.actions = function(){ return ACTIONS.map(a=>({id:a.id, cat:a.cat, cost:a.cost, cd:cdLeft(a.id), ok:!a.can||a.can()})); };
