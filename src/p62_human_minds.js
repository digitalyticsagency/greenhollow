/* =====================================================================
   PEOPLE WITH SOMETHING GOING ON

   The family had a routine - a clock that said where to stand at what
   hour - and a personality that decided how they phrased things. What
   they did not have was any reason for any of it.

   Now each person carries five needs that drift on their own, a mood
   that comes out of them, and a memory of the last thing that actually
   happened on the farm. A need that gets loud enough overrides the
   timetable and sends them somewhere specific: a tired adult to the
   bench, a lonely one to the fire circle, a child that has had enough of
   being sensible to the play area, where it genuinely plays - on the
   swing, down the slide, in and out of the cubby, each with its own
   movement rather than the standing-about-shuffle everyone shares.

   And in spring and autumn a fisherman walks up from the road, sits on
   the bank of your pond for the day, and fishes. He is not yours and he
   does not work for you. He just likes the pond.
   ===================================================================== */

/* ---------- 1. needs ---------- */
const H_NEEDS = ['food','rest','social','purpose','play'];
const H_DRIFT_ADULT = { food:0.0038, rest:0.0030, social:0.0026, purpose:0.0032, play:0.0009 };
const H_DRIFT_CHILD = { food:0.0046, rest:0.0038, social:0.0034, purpose:0.0006, play:0.0075 };
const H_EASE = 0.22;

function isChild(p){ return p && p.role === 'child'; }

function seedPerson(p){
  if(p.need) return;
  p.need = {};
  H_NEEDS.forEach(k=>{ p.need[k] = Math.random()*0.35; });
  p.mood = 0.65;
  p.memory = null;
}

function topHumanNeed(p){
  let best = null, v = 0.42;                 /* below this nothing is pressing */
  H_NEEDS.forEach(k=>{ if(p.need[k] > v){ v = p.need[k]; best = k; } });
  return best;
}

/* what object in the world answers a given need */
function placeFor(need, p){
  const find = (arts)=> (S.objs||[]).filter(o=>arts.indexOf((BPMAP[o.bp]||{}).art) >= 0);
  let pool = [];
  if(need === 'play')   pool = find(['playground']);
  if(need === 'rest')   pool = find(['bench','deck','firepit']);
  if(need === 'social') pool = find(['firepit','deck','bench']);
  if(!pool.length) return null;
  const o = pool[Math.floor(hash((p.id||'x').length * 3.1 + (S.day||0)) * pool.length)] || pool[0];
  const f = footprint(BPMAP[o.bp], o.rot);
  return { o, x:(o.tx + f.w/2)*T, y:(o.ty + f.h*0.62)*T, f };
}

/* the play area is big enough to have places in it, so a child heading
   there picks a piece of equipment rather than the middle of the lawn */
const PLAY_SPOTS = [
  { k:'swing',  dx:0.22, dy:0.40, act:'on the swing' },
  { k:'slide',  dx:0.62, dy:0.34, act:'down the slide' },
  { k:'cubby',  dx:0.84, dy:0.58, act:'in the cubby' },
  { k:'run',    dx:0.45, dy:0.70, act:'tearing about' },
];

/* which piece of equipment, and where it is. Rotates every nine seconds
   so a child works through the swing, the slide and the cubby rather
   than standing on one of them all afternoon. */
function playSpotFor(p, spot){
  const pick = PLAY_SPOTS[Math.floor(hash((p.id||'c').length*7.7 + Math.floor(Date.now()/9000)) * PLAY_SPOTS.length)];
  p.playKind = pick.k;
  return { x:(spot.o.tx + spot.f.w*pick.dx)*T,
           y:(spot.o.ty + spot.f.h*pick.dy)*T,
           act:pick.act };
}

/* ---------- 2. needs steer the routine ---------- */
if(typeof routine === 'function'){
  const _routineBase = routine;
  routine = function(p){
    seedPerson(p);
    const base = _routineBase.apply(this, arguments);
    /* the clock still wins for sleeping and eating - a child does not
       get to skip bedtime because it fancies the swing */
    if(base && /asleep|breakfast|dinner|lunch|pyjamas|being read/.test(base.act || '')) return base;
    if(S.weather === 'storm') return base;

    const need = topHumanNeed(p);
    p.topNeed = need;

    /* The routine already sends children to the play area in the
       afternoon with a generic 'playing' act, which satisfied the need
       on the spot - so they never actually used the equipment. If there
       is a play area, that act becomes a specific piece of it. */
    if(isChild(p) && base && base.act === 'playing'){
      const pg = placeFor('play', p);
      if(pg) return playSpotFor(p, pg);
    }

    if(!need) return base;

    const spot = placeFor(need, p);
    if(!spot) return base;

    if(need === 'play' && isChild(p)) return playSpotFor(p, spot);
    p.playKind = null;
    return { x:spot.x, y:spot.y, act: need === 'rest' ? 'sitting a while' : 'sitting together' };
  };
}

/* ---------- 3. the needs move, and the mood follows ---------- */
let H_T = 0;
function tickHumanNeeds(dt){
  H_T += dt;
  if(H_T < 0.5) return;
  const step = H_T; H_T = 0;
  const all = (S.family||[]).concat(S.workers||[]);
  all.forEach(p=>{
    seedPerson(p);
    const drift = isChild(p) ? H_DRIFT_CHILD : H_DRIFT_ADULT;
    H_NEEDS.forEach(k=>{ p.need[k] = Math.min(1, p.need[k] + drift[k]*step); });

    const a = p.act || '';
    if(/breakfast|dinner|lunch|eating/.test(a))       p.need.food    = Math.max(0, p.need.food - H_EASE*step);
    if(/asleep|sitting|resting|fire/.test(a))         p.need.rest    = Math.max(0, p.need.rest - H_EASE*step);
    if(/together|read|dinner|fire/.test(a))           p.need.social  = Math.max(0, p.need.social - H_EASE*step);
    if(/working|mending|feeding|watering|harvest/.test(a)) p.need.purpose = Math.max(0, p.need.purpose - H_EASE*step);
    if(/swing|slide|cubby|tearing about/.test(a))     p.need.play    = Math.max(0, p.need.play - H_EASE*1.4*step);

    /* mood is the inverse of how much is going unmet, nudged by morale */
    let unmet = 0; H_NEEDS.forEach(k=>{ unmet += p.need[k]; });
    const target = Math.max(0, Math.min(1, 1 - unmet/H_NEEDS.length)) * 0.7 + (S.morale || 0.6) * 0.3;
    p.mood = p.mood + (target - p.mood) * Math.min(1, 0.25*step);
  });
}

/* what a person is thinking about shows up in the log the same way the
   animals' needs do, so you can tell why they wandered off */
if(typeof ACT_WORDING === 'object'){
  ACT_WORDING['on the swing']    = p => `${p.name} got on the swing.`;
  ACT_WORDING['down the slide']  = p => `${p.name} went down the slide, repeatedly.`;
  ACT_WORDING['in the cubby']    = p => `${p.name} disappeared into the cubby.`;
  ACT_WORDING['tearing about']   = p => `${p.name} is tearing about the play area.`;
  ACT_WORDING['sitting a while'] = p => `${p.name} sat down for a bit.`;
  ACT_WORDING['sitting together']= p => `${p.name} went to sit with the others.`;
}

/* ---------- 4. children actually play ---------- */
/* A class per piece of equipment, so a swing swings and a slide slides
   instead of everyone doing the same idle shuffle. */
function paintPlay(){
  const all = (S.family||[]).concat(S.workers||[]);
  all.forEach(p=>{
    const el = document.querySelector(`[data-p="${p.id}"]`);
    if(!el) return;
    const a = p.act || '';
    el.classList.toggle('pl-swing',  a === 'on the swing');
    el.classList.toggle('pl-slide',  a === 'down the slide');
    el.classList.toggle('pl-cubby',  a === 'in the cubby');
    el.classList.toggle('pl-run',    a === 'tearing about');
    el.classList.toggle('pl-sit',    a === 'sitting a while' || a === 'sitting together');
  });
}

/* ---------- 5. the fisherman ---------- */
/* Spring and autumn, on a farm that has a pond. He arrives after dawn,
   sits on the bank all day and goes home at dusk. */
const FISH_SEASONS = [0, 2];              /* spring, autumn */

function pondObj(){
  return (S.objs||[]).find(o=>(BPMAP[o.bp]||{}).art === 'pond');
}
function fishingDay(){
  if(FISH_SEASONS.indexOf(S.season) < 0) return false;
  if(!pondObj()) return false;
  /* he does not come every day - roughly one day in three, but the same
     days for a given save rather than flickering */
  return hash((S.day||0) * 1.7 + 4.2) < 0.34;
}

function fisherInit(){
  const on = fishingDay();
  const f = (typeof dayFrac === 'function') ? dayFrac() : 0.5;
  const daytime = f > 0.26 && f < 0.82;
  if(!on || !daytime){ S.fisher = null; return; }
  if(S.fisher) return;
  const p = pondObj(); if(!p) return;
  const ft = footprint(BPMAP[p.bp], p.rot);
  /* on the bank, south-west corner, facing the water */
  S.fisher = {
    x:(p.tx + ft.w*0.18)*T, y:(p.ty + ft.h*0.86)*T,
    pond:p.id, t:0, bite:0, caught:0, said:0,
    fx:(p.tx + ft.w*0.42)*T, fy:(p.ty + ft.h*0.52)*T,   /* where the float sits */
  };
  if(typeof log === 'function')
    log('Someone has walked up from the road and settled on the pond bank with a rod.', '', 'home');
}

const FISH_LINES = ['Morning.','Not biting yet.','Lovely spot, this.','Had a big one here last year.',
                    'Mind if I stop a while?','Water is clear today.'];
const FISH_CATCH = ['Got one!','There we are.','That is a keeper.'];

function tickFisher(dt){
  fisherInit();
  const fr = S.fisher; if(!fr) return;
  fr.t += dt;
  /* the float sits, then dips */
  fr.bite -= dt;
  if(fr.bite <= 0 && Math.random() < dt*0.06){
    fr.bite = 2.2;
    fr.caught++;
    const el = document.getElementById('fisher');
    if(el){ el.classList.remove('biting'); void el.offsetWidth; el.classList.add('biting'); }
    if(typeof speak === 'function') speak({x:fr.x, y:fr.y}, FISH_CATCH[Math.floor(Math.random()*FISH_CATCH.length)]);
    if(typeof SND !== 'undefined') SND.play('water');
  }
  fr.said -= dt;
  if(fr.said <= 0 && Math.random() < dt*0.05){
    fr.said = 22 + Math.random()*20;
    if(typeof speak === 'function') speak({x:fr.x, y:fr.y}, FISH_LINES[Math.floor(Math.random()*FISH_LINES.length)]);
  }
  const el = document.getElementById('fisher');
  if(el) el.setAttribute('transform', `translate(${n(fr.x)},${n(fr.y)})`);
}

function fisherLayer(){
  const fr = S.fisher; if(!fr) return '';
  const dx = fr.fx - fr.x, dy = fr.fy - fr.y;
  let s = `<g id="fisher" class="npc" transform="translate(${n(fr.x)},${n(fr.y)})">`;
  /* the line and float go down first so he sits in front of them */
  s += `<g class="fish-tackle">`;
  s += `<line x1="3" y1="-14" x2="${n(dx)}" y2="${n(dy)}" stroke="#e8e2cf" stroke-width="0.7" opacity=".85"/>`;
  s += `<ellipse class="fish-ripple" cx="${n(dx)}" cy="${n(dy)}" rx="5" ry="2" fill="none" stroke="#dff3ff" stroke-width="1" opacity=".5"/>`;
  s += `<circle class="fish-float" cx="${n(dx)}" cy="${n(dy)}" r="1.9" fill="#e8543f"/>`;
  s += `</g>`;
  /* the rod, angled out over the water */
  s += `<g class="fish-rod"><line x1="0" y1="-6" x2="4" y2="-16" stroke="#8a6a42" stroke-width="1.3"/></g>`;
  /* him: sitting, so shorter than a standing figure, with a hat */
  s += `<ellipse cx="1" cy="3" rx="5" ry="2" fill="#16240c" opacity=".3"/>`;
  s += `<rect x="-4" y="-9" width="8" height="9" rx="3" fill="#5b6f52"/>`;
  s += `<rect x="-5.5" y="-2" width="4" height="4" rx="1.6" fill="#3f4a5a"/>`;
  s += `<circle cx="0" cy="-12" r="2.9" fill="#e2b98f"/>`;
  s += `<ellipse cx="0" cy="-14" rx="5.2" ry="1.5" fill="#8a7c4e"/>`;
  s += `<ellipse cx="0" cy="-15.2" rx="2.6" ry="1.6" fill="#8a7c4e"/>`;
  s += `<text class="nlab" y="-22" text-anchor="middle">Fisherman</text>`;
  s += `</g>`;
  return s;
}

if(typeof peopleLayer === 'function'){
  const _peopleLayerFish = peopleLayer;
  peopleLayer = function(){ return _peopleLayerFish.apply(this, arguments) + fisherLayer(); };
}

/* ---------- 6. wire in ---------- */
const _tickPeopleHuman = tickPeople;
tickPeople = function(dt){
  const r = _tickPeopleHuman.apply(this, arguments);
  if(S && S.speed !== 0){
    try{ tickHumanNeeds(dt); tickFisher(dt); paintPlay(); }catch(e){}
  }
  return r;
};

(function playCss(){
  const s = document.createElement('style');
  s.textContent = `
  /* each piece of equipment moves differently - that is the whole point */
  .npc.pl-swing .youbob{ transform-box:fill-box; transform-origin:50% 0%;
    animation: plSwing 2.1s ease-in-out infinite; }
  @keyframes plSwing{ 0%,100%{ transform:rotate(-15deg) } 50%{ transform:rotate(15deg) } }

  .npc.pl-slide .youbob{ animation: plSlide 2.6s ease-in infinite; }
  @keyframes plSlide{
    0%   { transform:translate(0,-13px) rotate(-8deg); }
    45%  { transform:translate(11px,7px) rotate(10deg); }
    55%  { transform:translate(11px,7px) rotate(10deg); opacity:1 }
    70%  { transform:translate(11px,7px) rotate(0deg); opacity:0 }
    71%  { transform:translate(0,-13px) rotate(-8deg); opacity:0 }
    100% { transform:translate(0,-13px) rotate(-8deg); opacity:1 } }

  .npc.pl-cubby .youbob{ animation: plPeek 3.4s ease-in-out infinite; }
  @keyframes plPeek{ 0%,38%{ transform:translateY(0); opacity:1 }
                     50%,84%{ transform:translateY(7px); opacity:.15 }
                     100%{ transform:translateY(0); opacity:1 } }

  .npc.pl-run .youbob{ animation: plRun .5s ease-in-out infinite; }
  @keyframes plRun{ 0%,100%{ transform:translateY(0) rotate(-4deg) }
                    50%    { transform:translateY(-4px) rotate(4deg) } }

  .npc.pl-sit .youbob{ animation:none; transform:translateY(3px) scale(1,.9); }

  /* the fisherman */
  #fisher .fish-float{ animation: fishBob 3.1s ease-in-out infinite; }
  @keyframes fishBob{ 0%,100%{ transform:translateY(0) } 50%{ transform:translateY(1.4px) } }
  #fisher .fish-ripple{ animation: fishRipple 3.4s ease-out infinite; }
  @keyframes fishRipple{ 0%{ transform:scale(.4); opacity:.55 } 100%{ transform:scale(2.4); opacity:0 } }
  #fisher.biting .fish-float{ animation: fishBite .5s ease-in-out 3; }
  @keyframes fishBite{ 0%,100%{ transform:translateY(0) } 50%{ transform:translateY(4px) } }
  #fisher.biting .fish-rod{ transform-box:fill-box; transform-origin:0 100%;
    animation: fishStrike .5s ease-out 1; }
  @keyframes fishStrike{ 0%{ transform:rotate(0) } 40%{ transform:rotate(-22deg) } 100%{ transform:rotate(0) } }

  @media (prefers-reduced-motion: reduce){
    .npc.pl-swing .youbob,.npc.pl-slide .youbob,.npc.pl-cubby .youbob,.npc.pl-run .youbob,
    #fisher .fish-float,#fisher .fish-ripple{ animation:none !important; } }
  `;
  document.head.appendChild(s);
})();

/* ---------- handles ---------- */
G.people = function(){
  return (S.family||[]).concat(S.workers||[]).map(p=>({
    name:p.name, role:p.role, act:p.act, wants:p.topNeed,
    mood:+(p.mood||0).toFixed(2), trait:(typeof traitOf==='function')?traitOf(p).n:'?',
    needs:Object.keys(p.need||{}).reduce((z,k)=>(z[k]=+p.need[k].toFixed(2),z),{}),
  }));
};
G.fisher = function(){ return { season:S.season, isFishingDay:fishingDay(), pond:!!pondObj(), fisher:S.fisher }; };
G.callFisher = function(){
  const p = pondObj(); if(!p) return 'no pond on the farm';
  S.fisher = null; S.season = FISH_SEASONS[0];
  fisherInit(); render();
  return S.fisher ? 'he is on the bank' : 'not a fishing hour - try midday';
};
