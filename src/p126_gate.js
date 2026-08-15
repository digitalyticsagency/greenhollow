/* =====================================================================
   THE FRONT DOOR

   index.html is the GitHub Pages landing page, so the first thing a
   stranger sees is a hundred and twenty-five modules' worth of farm with
   a land chooser already open on top of it. This puts a door in front of
   that, with the two ways through that were asked for:

     Play now      the homestead game — growing, animals, selling, the
                   household. Everything a farm needs and nothing that
                   needs explaining first.

     Full version  every system in the build, behind the code.

   IT DOES NOT INVENT A SECOND LOCK. The game already had all of this
   machinery, just with no front on it: p40 owns UNLOCK_CODE and
   G.tryUnlock, and p34 owns the thirty-minute trial, the PayPal link and
   PLAY.unlocked. A parallel gate with its own key and its own copy of the
   code would be two things to keep in step and one of them would drift.
   So the full-version door routes through G.tryUnlock — the same call the
   existing Code button in the top bar makes — and inherits everything it
   does, including the cash and level it grants and the trial it lifts.
   Change the code in p40 and this door changes with it.

   WHAT "BASIC" MEANS HERE, and why it is what it is. The instinct is to
   cut content, which makes a demo. The real problem for somebody arriving
   cold is not too much farm — it is that the spectacle systems have no
   context on day one. A button that summons two champions to level your
   buildings is a poor first impression when you own two beds and a shed.
   So the starter door keeps the whole farming game intact, at Relaxed,
   and holds back only what needs a farm to make sense against: the
   champions and wildlife buttons, the automation category, and the two
   reference panels. Nothing is removed from the build and nothing is
   capped. A starter save is a real save, and entering the code later
   picks it up exactly where it was.

   ON THE CODE, plainly. This is one static HTML file served to the
   browser, so the code is in the source and always was — p40 says so
   itself in a comment above UNLOCK_CODE. Hashing my own copy while the
   original sits in plaintext three files earlier would be theatre. This
   is a soft gate that keeps the full version out of a casual visitor's
   way; it is not security, and nothing behind it should be anything you
   would mind a stranger seeing.
   ===================================================================== */

const DOOR_KEY = 'greenhollow_door';         /* distinct from p34's GATE_KEY */

/* what the starter door holds back */
const DOOR_TABS = ['AI', 'Almanac'];         /* right-hand reference panels */
const DOOR_CATS = ['auto'];                  /* build categories */

function doorMode(){
  try{ return localStorage.getItem(DOOR_KEY); }catch(e){ return null; }
}
function doorSet(m){
  try{ localStorage.setItem(DOOR_KEY, m); }catch(e){}
  applyDoorMode();
}

function applyDoorMode(){
  /* anyone who has entered the code is on the full version regardless of
     which door they came through, so the unlock wins */
  const unlocked = (typeof S === 'object' && S && S.unlocked)
    || (typeof PLAY !== 'undefined' && PLAY && PLAY.unlocked);
  const starter = !unlocked && doorMode() === 'starter';
  document.body.classList.toggle('gh-starter', starter);
  const pill = document.getElementById('doorpill');
  if(pill) pill.style.display = starter ? '' : 'none';

  if(!starter){
    /* Put back anything the starter door hid. The build categories come
       back on their own because renderBuild rebuilds those buttons from
       scratch, but the panel tabs are created once and kept — so entering
       the code left AI and Almanac hidden on the full version until
       something happened to recreate them. */
    try{
      document.querySelectorAll('.ptab').forEach(b=>{
        if(DOOR_TABS.includes((b.textContent||'').trim())) b.style.display = '';
      });
      document.querySelectorAll('.cat').forEach(b=>{
        const oc = b.getAttribute('onclick') || '';
        if(DOOR_CATS.some(c=>oc.indexOf(`'${c}'`) >= 0)) b.style.display = '';
      });
    }catch(e){}
    return;
  }

  try{
    document.querySelectorAll('.ptab').forEach(b=>{
      if(DOOR_TABS.includes((b.textContent||'').trim())) b.style.display = 'none';
    });
    document.querySelectorAll('.cat').forEach(b=>{
      const oc = b.getAttribute('onclick') || '';
      if(DOOR_CATS.some(c=>oc.indexOf(`'${c}'`) >= 0)) b.style.display = 'none';
    });
    /* if they were parked on something now hidden, move them somewhere real */
    if(typeof rightTab !== 'undefined' && rightTab === 'almanac'){
      const t = [...document.querySelectorAll('.ptab')].find(b=>(b.textContent||'').trim()==='Info');
      if(t) t.click();
    }
    if(typeof curCat !== 'undefined' && DOOR_CATS.includes(curCat) && typeof G.cat === 'function')
      G.cat('grow');
  }catch(e){}
}

/* the gentler defaults, applied once when they choose the starter door */
function doorStarterSettings(){
  if(typeof setOpt !== 'function') return;
  try{
    setOpt('difficulty', 'Relaxed');
    setOpt('dayLen', 60);
    setOpt('autoSave', true);
    setOpt('confirmSell', true);
    setOpt('foxBtn', false);
    setOpt('duelBtn', false);
  }catch(e){}
}

/* ---------- what this browser already has ----------
   The door greets everybody, so it has to know the difference between
   somebody arriving for the first time and somebody coming back to a farm
   they have been keeping for a hundred days. Choosing a door never
   touches the save — it only decides which systems are on show. */
function doorSave(){
  try{
    const raw = localStorage.getItem('greenhollow');
    if(!raw) return null;
    const d = JSON.parse(raw);
    if(!d || d.day === undefined) return null;
    return { day:d.day, cash:d.cash, land:d.landId,
             objs:Array.isArray(d.objs) ? d.objs.length : 0 };
  }catch(e){ return null; }
}
/* A farm past day one is somebody's farm. boot() writes a save row before
   this door ever opens, so the row existing proves nothing. */
function doorReturning(){
  const s = doorSave();
  return !!(s && (s.day || 1) > 1);
}
function doorUnlocked(){
  return !!((typeof S === 'object' && S && S.unlocked)
    || (typeof PLAY !== 'undefined' && PLAY && PLAY.unlocked));
}

/* ---------- the door itself ---------- */
function doorHTML(){
  const save = doorReturning() ? doorSave() : null;
  const unlocked = doorUnlocked();
  const money = (v)=>{ try{ return typeof fmt === 'function' ? fmt(Math.round(v||0)) : '$'+Math.round(v||0); }
                       catch(e){ return ''; } };

  const playCard = save
    ? `<div class="door-kicker">Welcome back</div>
       <div class="door-title">Continue</div>
       <p>Your homestead is on <b>day ${save.day}</b>${save.objs ? ` with ${save.objs} things built` : ''}${
          save.cash !== undefined ? `, ${money(save.cash)} in hand` : ''}. Picking up where you left off.</p>
       <span class="door-btn">Back to the farm</span>`
    : `<div class="door-kicker">Start here</div>
       <div class="door-title">Play now</div>
       <p>The farming game — beds, water, animals, the market and the household,
          at a relaxed pace. Saved in this browser as you go.</p>
       <span class="door-btn">Begin your homestead</span>`;

  const fullCard = unlocked
    ? `<div class="door-kicker">For the author</div>
       <div class="door-title">Full version</div>
       <p>This browser is already unlocked — every system in the build, and no trial.</p>
       <button class="door-btn ghost" id="doorfull">Continue in full</button>`
    : `<div class="door-kicker">For the author</div>
       <div class="door-title">Full version</div>
       <p>Every system in the build — automation, the valley, the champions,
          the dragon and the almanac.</p>
       <div class="door-row">
         <input id="doorpass" type="password" inputmode="numeric" autocomplete="off"
                maxlength="12" placeholder="Code" aria-label="Access code"/>
         <button class="door-btn ghost" id="doorunlock">Enter</button>
       </div>
       <div class="door-err" id="doorerr" role="alert"></div>`;

  return `
  <div class="door-inner">
    <div class="door-head">
      <div class="door-mark">🌱</div>
      <h1>Greenhollow</h1>
      <p class="door-sub">A homestead you plan, plant and live on. Every tree, animal and
        building here is drawn by the page as you play — there are no images in this file,
        only instructions for making them.</p>
    </div>

    <div class="door-cards">
      <button class="door-card door-go" id="doorplay">${playCard}</button>
      <div class="door-card">${fullCard}</div>
    </div>

    <p class="door-foot">Runs entirely in your browser. Nothing is uploaded and there are
      no accounts.${save ? ' Your farm is saved here and is not affected by this choice.' : ''}</p>
  </div>`;
}

function openDoor(){
  let el = document.getElementById('door');
  if(!el){ el = document.createElement('div'); el.id = 'door'; document.body.appendChild(el); }
  el.innerHTML = doorHTML();
  el.style.display = '';
  document.body.classList.add('gh-doored');

  const shut = ()=>{
    el.style.display = 'none';
    document.body.classList.remove('gh-doored');
    try{ if(typeof ui === 'function') ui(); if(typeof renderBuild === 'function') renderBuild(); }catch(e){}
    applyDoorMode();
  };

  el.querySelector('#doorplay').onclick = ()=>{
    /* The gentle defaults are for somebody who has never played. A farm
       that already exists carries the player's own difficulty and day
       length, and quietly resetting those to Relaxed and 60s because they
       clicked Continue would be taking something off them.

       Judged on the day, not on whether a save row exists. boot() writes
       one before this door ever opens — and so does any setOpt — so
       "there is a save" is true for a first-time visitor too, and testing
       for it meant nobody ever got the gentle defaults. Day one is new. */
    if(!doorReturning()) doorStarterSettings();
    doorSet('starter');
    shut();
  };

  /* already unlocked in this browser: straight back in, no retyping */
  const cont = el.querySelector('#doorfull');
  if(cont) cont.onclick = ()=>{ doorSet('full'); shut(); };

  const pass = el.querySelector('#doorpass');
  const err  = el.querySelector('#doorerr');
  if(!pass) return;
  const tryIt = ()=>{
    const v = (pass.value || '').trim();
    if(typeof UNLOCK_CODE === 'string' && v === UNLOCK_CODE){
      doorSet('full');
      /* Routed through the existing unlock rather than reimplemented, so
         there is one place that knows what unlocking means. It lifts the
         trial, sets PLAY.unlocked and S.unlocked, and grants the starting
         cash and level the Code button in the top bar always has. */
      try{
        if(typeof G.tryUnlock === 'function'){
          const tmp = document.createElement('input');
          tmp.id = 'unlockin'; tmp.value = v; tmp.style.display = 'none';
          document.body.appendChild(tmp);
          G.tryUnlock();
          tmp.remove();
        }
      }catch(e){}
      shut();
      return;
    }
    err.textContent = v ? 'That code is not right.' : 'Enter the code.';
    pass.classList.add('bad');
    setTimeout(()=>pass.classList.remove('bad'), 520);
    pass.select();
  };
  el.querySelector('#doorunlock').onclick = tryIt;
  pass.addEventListener('keydown', e=>{ if(e.key === 'Enter'){ e.preventDefault(); tryIt(); } });
}
G.openDoor = openDoor;

/* a way back to the door for anyone who wants the other one */
function doorPill(){
  if(document.getElementById('doorpill')) return;
  const b = document.createElement('button');
  b.id = 'doorpill';
  b.textContent = 'Full version';
  b.title = 'Enter the code for every system in the build';
  b.onclick = ()=>openDoor();
  b.style.display = 'none';
  document.body.appendChild(b);
}

/* ---------- style, in the game's own palette ---------- */
(function doorCss(){
  const s = document.createElement('style');
  s.textContent = `
  #door{ position:fixed; inset:0; z-index:99999; overflow:auto;
    background:radial-gradient(120% 90% at 50% 0%, #24301c 0%, #12180f 62%, #0c110a 100%);
    display:flex; align-items:center; justify-content:center; padding:22px;
    font-family:var(--font); color:var(--ink); animation:doorin .45s ease; }
  @keyframes doorin{ from{ opacity:0 } to{ opacity:1 } }
  .door-inner{ width:100%; max-width:760px; }
  .door-head{ text-align:center; margin-bottom:22px; }
  .door-mark{ font-size:34px; line-height:1; margin-bottom:8px; }
  #door h1{ font-size:34px; margin:0 0 8px; letter-spacing:-.4px; font-weight:800; }
  .door-sub{ margin:0 auto; max-width:54ch; color:var(--ink2); font-size:13.5px; line-height:1.55; }
  .door-cards{ display:grid; grid-template-columns:1fr 1fr; gap:14px; align-items:start; }
  @media (max-width:640px){ .door-cards{ grid-template-columns:1fr } #door h1{ font-size:27px } }
  .door-card{ display:block; width:100%; text-align:left; background:var(--panel);
    border:1px solid var(--line); border-radius:var(--r); padding:16px 16px 18px;
    box-shadow:var(--shadow); }
  .door-go{ cursor:pointer; border-color:rgba(124,194,79,.42); font:inherit;
    background:linear-gradient(180deg,#22301a,#1b2415);
    transition:transform .16s ease, border-color .16s ease; }
  .door-go:hover{ transform:translateY(-2px); border-color:var(--green); }
  .door-kicker{ font-size:10.5px; letter-spacing:.10em; text-transform:uppercase;
    color:var(--ink3); font-weight:700; }
  .door-title{ font-size:19px; font-weight:750; margin:3px 0 6px; color:var(--ink); }
  .door-card p{ margin:0 0 13px; color:var(--ink2); font-size:12.5px; line-height:1.55; }
  .door-btn{ display:inline-block; background:linear-gradient(180deg,#7cc24f,#4d8f3c);
    color:#0e1a09; font-weight:750; font-size:13px; padding:9px 15px; border-radius:9px; }
  .door-btn.ghost{ background:var(--panel2); color:var(--ink); border:1px solid var(--line2);
    cursor:pointer; font-family:inherit; }
  .door-btn.ghost:hover{ border-color:var(--green); }
  .door-row{ display:flex; gap:7px; }
  #doorpass{ flex:1; min-width:0; background:#141b10; border:1px solid var(--line2);
    color:var(--ink); border-radius:9px; padding:9px 11px; font-size:13px; font-family:inherit;
    letter-spacing:.22em; }
  #doorpass:focus{ outline:none; border-color:var(--green); }
  #doorpass.bad{ border-color:var(--red); animation:doorshake .38s; }
  @keyframes doorshake{ 0%,100%{ transform:translateX(0) } 25%{ transform:translateX(-5px) }
    75%{ transform:translateX(5px) } }
  .door-err{ color:var(--red); font-size:11.5px; min-height:15px; margin-top:6px; }
  .door-foot{ text-align:center; color:var(--ink3); font-size:11px; margin:18px 0 0; }
  body.gh-doored{ overflow:hidden; }

  #doorpill{ position:fixed; left:10px; bottom:10px; z-index:60; font-family:var(--font);
    font-size:11px; font-weight:650; color:var(--ink2); background:rgba(20,27,16,.82);
    border:1px solid var(--line); border-radius:999px; padding:6px 12px; cursor:pointer;
    opacity:.5; transition:opacity .18s ease, border-color .18s ease; }
  #doorpill:hover{ opacity:1; border-color:var(--green); color:var(--ink); }

  @media (prefers-reduced-motion: reduce){
    #door, #doorpass.bad{ animation:none } .door-go:hover{ transform:none } }
  `;
  document.head.appendChild(s);
})();

/* ---------- keep the mode applied through repaints ---------- */
if(typeof ui === 'function'){
  const _uiDoor = ui;
  ui = function(){ const r = _uiDoor.apply(this, arguments); try{ applyDoorMode(); }catch(e){} return r; };
}
if(typeof renderBuild === 'function'){
  const _renderBuildDoor = renderBuild;
  renderBuild = function(){
    const r = _renderBuildDoor.apply(this, arguments);
    try{ applyDoorMode(); }catch(e){}
    return r;
  };
}

/* ---------- open it for everybody, every time ----------
   It greets returning players and unlocked browsers as well as first
   visits — asked for explicitly, and it is the right call for a page
   people land on from a link: the door is the front of the game rather
   than a one-off consent box. It reads the save and offers to continue,
   and it never writes to the save, so a hundred-day farm is exactly where
   it was whichever card you click. */
setTimeout(function doorBoot(){
  try{ doorPill(); openDoor(); }catch(e){ try{ applyDoorMode(); }catch(e2){} }
}, 80);

/* ---------- handle ---------- */
G.doorAudit = function(){
  const shown = (sel)=>[...document.querySelectorAll(sel)]
    .filter(b=>b.style.display !== 'none').map(b=>(b.textContent||'').trim());
  const el = document.getElementById('door');
  return {
    doorChosen: doorMode() || 'not yet — the door is up',
    unlocked: !!((typeof S === 'object' && S && S.unlocked)
      || (typeof PLAY !== 'undefined' && PLAY && PLAY.unlocked)),
    starterHoldsBack: { tabs:DOOR_TABS, buildCategories:DOOR_CATS,
      buttons:['champions', 'wildlife'] },
    tabsVisible: shown('.ptab'),
    buildCategoriesVisible: shown('.cat'),
    doorOpen: !!(el && el.style.display !== 'none'),
    codeComesFrom: (typeof UNLOCK_CODE === 'string') ? 'p40 UNLOCK_CODE' : 'MISSING',
    trialStillApplies: (typeof gateApplies === 'function') ? gateApplies() : 'unknown',
    honestly: 'client-side only — a soft gate, not security. See the file header.',
  };
};
