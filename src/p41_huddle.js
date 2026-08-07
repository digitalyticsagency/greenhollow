/* =====================================================================
   EVERYONE JUMPS, THEN EVERYONE HUDDLES

   A lightning strike used to be scenery: the sky flashed and the family
   carried on drying the dishes. Now the whole household reacts to it —
   they startle, they say so, they gather in one room, and once they are
   all together the fright turns into something warmer.

   Three beats, and the timing matters more than any one of them:
     flash → fright (everyone reacts at once, badly)
            → gather (they converge on the same room)
            → together (relief, and the tune that goes with it)
   ===================================================================== */

const FEAR_LINES = [
  '😨 Eek!', '😱 That was close!', '😰 Right overhead!',
  '😨 Mum!', '😧 Did you hear that?', '😖 I hate that noise',
];
const KID_FEAR = ['😱 Aaah!', '😨 I want Mum', '😰 Was that the barn?', '😢 Too loud!'];
const CALM_LINES = [
  '😊 We are all here', '🤍 Nothing hit', '😌 It is going over',
  '☺️ Alright now', '🫂 Come here', '😄 Told you it was far off',
];

/* who counts as a person we can move and speak for */
function everyone(){
  const out = (S.family || []).concat(S.workers || []);
  return out;
}

function huddleSpot(){
  const H = (typeof houseRect === 'function') ? houseRect() : null;
  if(H && typeof ROOMS !== 'undefined' && ROOMS.living){
    const r = ROOMS.living;
    return { x: H.x + (r.x + r.w*0.5)*H.w, y: H.y + (r.y + r.h*0.62)*H.h };
  }
  if(typeof homeSpot === 'function') return homeSpot();
  return { x:(FARM.x+4)*T, y:(FARM.y+4)*T };
}

/* ---------- the reaction ---------- */
function startleAll(){
  if(S.huddle && S.huddle.phase) return;      /* already jumping */
  const spot = huddleSpot();
  S.huddle = { phase:'fear', t:0, spot, sang:false };

  const folk = everyone();
  folk.forEach((p, i)=>{
    const pool = p.role === 'child' ? KID_FEAR : FEAR_LINES;
    const line = pool[Math.floor(Math.random()*pool.length)];
    /* stagger by a fraction of a second so it reads as a room reacting,
       not a chorus */
    setTimeout(()=>{
      if(typeof speak === 'function') speak(p, line);
      const el = document.querySelector(`[data-p="${p.id}"]`);
      if(el){ el.classList.remove('startled'); void el.offsetWidth; el.classList.add('startled'); }
    }, 40 + i*130);
  });

  /* you jump too */
  if(S.you){
    setTimeout(()=>{
      if(typeof speak === 'function') speak(S.you, FEAR_LINES[Math.floor(Math.random()*FEAR_LINES.length)]);
      const y = document.getElementById('you');
      if(y){ y.classList.remove('startled'); void y.offsetWidth; y.classList.add('startled'); }
    }, 30);
  }

  if(typeof SND !== 'undefined') SND.play('fright');
  if(typeof log === 'function') log('The whole house jumped at that one.', '', 'home');
}

/* ---------- gathering, then relief ---------- */
function tickHuddle(dt){
  const h = S.huddle;
  if(!h || !h.phase) return;
  h.t += dt;

  if(h.phase === 'fear' && h.t > 1.4){ h.phase = 'gather'; h.t = 0; }

  if(h.phase === 'gather'){
    /* are they all in? the player counts too */
    const folk = everyone();
    const near = folk.filter(p => Math.hypot(p.x - h.spot.x, p.y - h.spot.y) < 42).length;
    const youIn = !S.you || Math.hypot(S.you.x - h.spot.x, S.you.y - h.spot.y) < 46;
    if((folk.length === 0 || near >= folk.length) && youIn){ h.phase = 'together'; h.t = 0; }
    /* do not wait forever if someone is stuck out in a paddock */
    else if(h.t > 14){ h.phase = 'together'; h.t = 0; }
  }

  if(h.phase === 'together'){
    if(!h.sang){
      h.sang = true;
      if(typeof SND !== 'undefined') SND.play('huddle');
      const folk = everyone();
      folk.slice(0, 3).forEach((p, i)=>{
        setTimeout(()=>{
          if(typeof speak === 'function')
            speak(p, CALM_LINES[Math.floor(Math.random()*CALM_LINES.length)]);
        }, 300 + i*700);
      });
      if(S.you) setTimeout(()=>{
        if(typeof speak === 'function') speak(S.you, '🫂 Everyone in?');
      }, 200);
      /* being together after a fright is genuinely good for them */
      S.morale = Math.min(1, (S.morale === undefined ? 0.6 : S.morale) + 0.08);
      if(typeof log === 'function')
        log('Everyone huddled in the front room until it passed.', 'good', 'home');
      const w = document.getElementById('world');
      if(w){ w.classList.add('huddle-warm'); setTimeout(()=>w.classList.remove('huddle-warm'), 5200); }
    }
    if(h.t > 6){ S.huddle = null; }
  }
}

/* while the huddle is on, it overrides where people would otherwise be */
if(typeof routine === 'function'){
  const _routineHuddle = routine;
  routine = function(p){
    const h = S.huddle;
    if(h && h.phase){
      const act = h.phase === 'fear' ? 'startled'
                : h.phase === 'gather' ? 'hurrying inside' : 'huddled together';
      /* spread them slightly so three people are not one person */
      const list = everyone();
      const i = Math.max(0, list.findIndex(q => q.id === p.id));
      const a = (i / Math.max(1, list.length)) * Math.PI * 2;
      return { x: h.spot.x + Math.cos(a)*16, y: h.spot.y + Math.sin(a)*12, act };
    }
    return _routineHuddle.apply(this, arguments);
  };
}
if(typeof youRoutine === 'function'){
  const _youRoutineHuddle = youRoutine;
  youRoutine = function(){
    const h = S.huddle;
    if(h && h.phase){
      return { x: h.spot.x, y: h.spot.y + 20,
               act: h.phase === 'together' ? 'huddled together' : 'getting everyone in',
               state: 'idle' };
    }
    return _youRoutineHuddle.apply(this, arguments);
  };
}

/* drive it from the people ticker */
if(typeof tickPeople === 'function'){
  const _tickPeopleHuddle = tickPeople;
  tickPeople = function(dt){
    const r = _tickPeopleHuddle.apply(this, arguments);
    if(S && S.speed !== 0) tickHuddle(dt);
    return r;
  };
}

/* the trigger */
if(typeof lightningStrike === 'function'){
  const _strikeHuddle = lightningStrike;
  lightningStrike = function(){
    const r = _strikeHuddle.apply(this, arguments);
    /* the follow-up stroke should not restart the whole sequence */
    if(!S.huddle || !S.huddle.phase) startleAll();
    return r;
  };
}

(function huddleCss(){
  const s = document.createElement('style');
  s.textContent = `
  /* a short shock: they flinch and shrink, then settle */
  .startled .youbob, #you.startled .youbob{ animation: flinch .55s ease-out 1; }
  @keyframes flinch{
    0%   { transform: translateY(0)    scale(1); }
    18%  { transform: translateY(-3px) scale(1.06); }
    42%  { transform: translateY(1px)  scale(.94); }
    100% { transform: translateY(0)    scale(1); } }
  /* the room warms for a moment once they are all in */
  #world.huddle-warm::after{
    content:''; position:absolute; inset:0; pointer-events:none; z-index:25;
    background:radial-gradient(ellipse at 50% 55%, rgba(255,196,120,.16), transparent 62%);
    animation: warmGlow 5.2s ease-in-out 1; }
  @keyframes warmGlow{ 0%,100%{opacity:0} 22%,70%{opacity:1} }
  @media (prefers-reduced-motion: reduce){
    .startled .youbob, #you.startled .youbob{ animation:none !important; }
    #world.huddle-warm::after{ animation:none !important; opacity:0; } }
  `;
  document.head.appendChild(s);
})();
