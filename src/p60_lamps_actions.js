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

   The "Things you can do" modal that used to live here has been removed
   in full - the sparkle button, the modal, the ten action definitions,
   their cooldown tracking and the standing-order payout. See the commit
   for what was exclusive to it and what was left alone because other
   parts of the game share it.
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

  @media (prefers-reduced-motion: reduce){ #lamps.lit .lamp-pool{ animation:none } }
  `;
  document.head.appendChild(s);
})();

/* Existing saves carry keys that only the removed modal ever wrote.
   A one-shot timer was the wrong hook: at 1.2s S is not yet the loaded
   save, so the delete hit a throwaway object and the load replaced it
   afterwards - verified by reloading with the keys seeded and finding
   all five still present. Stripping inside save() instead means the
   persisted copy is clean the next time anything writes it, whenever
   that is, with no ordering assumption at all. */
const DEAD_ACTION_KEYS = ['actCd','standing','growBoost','rainBonus',
                          'loadShed','aiTuned','restDay','waterCap'];
if(typeof G !== 'undefined' && typeof G.save === 'function'){
  const _saveDrop = G.save;
  G.save = function(){
    if(typeof S !== 'undefined' && S) DEAD_ACTION_KEYS.forEach(k=>{ delete S[k]; });
    return _saveDrop.apply(this, arguments);
  };
}

/* ---------- handles ---------- */
G.lamps = function(){ return { posts:lampPositions().length, lit:lampsLit(), night:isNight() }; };
