/* =====================================================================
   WINGS THAT ACTUALLY BEAT IN FLIGHT, AND SOMETHING TO BREATHE

   Reported: the wings do not animate on the ride. Two separate causes,
   both measured rather than guessed.

   1. THE ANIMATION WAS NEVER MATCHING. The keyframes are selected as
      `#dragonlay .flying .dwing.near` - scoped to the farm's dragon
      layer. On the ride the dragon is drawn inside #ridelay, so the
      selector missed it entirely. Computed animation-name came back as
      an empty string.

   2. AND IT WAS BEING REBUILT SIXTY TIMES A SECOND. paintRide composes
      the whole scene into one string and assigns it to innerHTML every
      frame, dragon included. A CSS animation on an element that is
      destroyed and recreated each frame restarts from zero every frame,
      so even with the selector fixed the wings would have sat frozen at
      the first keyframe. Checked directly: the .dragon node before and
      after a tick are different objects.

      So the rider now lives in its own element beside the scene rather
      than inside it. The scene can be rebuilt as often as it likes; the
      dragon is created once and moved.

   THE BREATH. Three of them on 1, 2 and 3 - fire, water and air - each
   with its own shape, colour, sound and effect on the people below. Fire
   is a jet and it frightens everybody. Water is a heavy arc that lands.
   Air is a near-invisible pressure wave that knocks hats off and delights
   the bold. Each has a cooldown so it is a decision rather than a key to
   hold down.

   THE SCENERY was also drawing as flat blocks. band() built its path from
   x0-900 to x0+900 in 100px steps - 1800px of geometry - and then relied
   on a 900px modulo to tile it. On any viewport wider than 900px that
   leaves bare gaps, which is exactly the hard vertical edge and flat
   colour in the report. It is built to the actual width now with a margin
   either side.
   ===================================================================== */

/* ---------- 1. the wing CSS has to reach the ride ---------- */
(function wingCssEverywhere(){
  const s = document.createElement('style');
  s.textContent = `
  .dwing{ transform-origin: 0px -12px; }
  .dragon.flying .dwing.near{ animation: dbeat .52s cubic-bezier(.35,0,.55,1) infinite; }
  .dragon.flying .dwing.far { animation: dbeat .52s cubic-bezier(.35,0,.55,1) infinite;
    animation-delay:-.06s; opacity:.72; }
  @keyframes dbeat{
    0%   { transform: rotate(-34deg) scaleY(.74) }
    20%  { transform: rotate(16deg)  scaleY(1.16) }
    32%  { transform: rotate(26deg)  scaleY(1.04) }
    100% { transform: rotate(-34deg) scaleY(.74) }
  }
  #ridedragon{ position:absolute; inset:0; width:100%; height:100%;
    z-index:41; pointer-events:none; }
  @media (prefers-reduced-motion: reduce){
    .dragon.flying .dwing.near, .dragon.flying .dwing.far{ animation:none } }
  `;
  document.head.appendChild(s);
})();

/* ---------- 2. the rider gets its own element ---------- */
function rideDragonEl(){
  let el = document.getElementById('ridedragon');
  if(!el){
    const host = document.getElementById('world') || document.body;
    el = document.createElementNS('http://www.w3.org/2000/svg','svg');
    el.id = 'ridedragon';
    el.setAttribute('preserveAspectRatio','none');
    host.appendChild(el);
  }
  return el;
}
function rideDragonBody(el){
  let g = el.querySelector('#riderbody');
  if(!g){
    g = document.createElementNS('http://www.w3.org/2000/svg','g');
    g.id = 'riderbody';
    const d = S.dragon || { hue:20, state:'fly' };
    g.innerHTML = (typeof dragonArt === 'function')
      ? dragonArt({ ...d, state:'fly' })
      : `<ellipse rx="20" ry="8" fill="#8a4a3a"/>`;
    /* the rider on its back */
    g.innerHTML += `<g transform="translate(-2,-16)">
      <rect x="-2.6" y="-8" width="5.2" height="8" rx="2" fill="#c8583f"/>
      <circle cx="0" cy="-10.4" r="2.8" fill="#efc9a4"/>
      <path d="M-2 -6 L-6 -10 M2 -6 L6 -10" stroke="#c8583f" stroke-width="1.6" stroke-linecap="round"/></g>`;
    el.appendChild(g);
  }
  return g;
}

/* ---------- 3. the breaths ---------- */
const BREATHS = {
  fire:  { n:'fire',  cool:1.6, c:['#ff5a1a','#ffa03a','#ffe07a'], reach:150, sound:'roar' },
  water: { n:'water', cool:1.4, c:['#2f7ab0','#5fb0d8','#bfe4f4'], reach:130, sound:'whoosh' },
  air:   { n:'air',   cool:1.0, c:['#dfe9f0','#eef4f8','#ffffff'], reach:180, sound:'whoosh' },
};

function fireBreath(kind){
  const R = (typeof RIDE !== 'undefined') ? RIDE : null;
  if(!R || R.over) return;
  const B = BREATHS[kind]; if(!B) return;
  if((R.breathCool||0) > 0) return;
  R.breath = { kind, t:0, dur:0.9 };
  R.breathCool = B.cool;
  if(typeof G.bang === 'function') try{ G.bang(B.sound); }catch(e){}
  /* it reaches the people in front of you */
  const reach = R.x + 260 + B.reach;
  (R.folk||[]).forEach(f=>{
    if(f.x < R.x + 240 || f.x > reach) return;
    if(kind === 'fire'){ f.state = 'flee'; if(!f.scored){ f.scored=1; R.scares++; } }
    else if(kind === 'air'){
      if(f.temper === 'timid'){ f.state='watch'; }
      else { f.state='cheer'; if(!f.scored){ f.scored=1; R.cheers++; } }
    } else {
      /* water: everybody looks up, and nobody minds */
      f.state = f.temper === 'timid' ? 'watch' : 'wave';
    }
    f.react = 0;
  });
}
G.rideBreath = fireBreath;

function breathArt(R, W, H){
  if(!R.breath) return '';
  const B = BREATHS[R.breath.kind];
  const k = R.breath.t / R.breath.dur;
  const reach = B.reach * Math.sin(Math.min(1,k*1.4) * Math.PI);
  if(reach < 3) return '';
  const x0 = W*0.30 + 26, y0 = R.y*H - 26;
  const spread = 8 + 16*Math.sin(k*Math.PI);
  const jet = (r, sp, col, op)=>`<path d="M${n(x0)} ${n(y0)}
    Q${n(x0+r*0.5)} ${n(y0-sp)} ${n(x0+r)} ${n(y0+(B.n==='water'?sp*1.6:0))}
    Q${n(x0+r*0.5)} ${n(y0+sp)} ${n(x0)} ${n(y0)} Z" fill="${col}" opacity="${op}"/>`;
  let s = '';
  s += jet(reach, spread, B.c[0], 0.55);
  s += jet(reach*0.74, spread*0.66, B.c[1], 0.8);
  s += jet(reach*0.46, spread*0.4, B.c[2], 0.95);
  if(R.breath.kind === 'air'){
    for(let i=0;i<3;i++)
      s += `<ellipse cx="${n(x0+reach*(0.4+i*0.25))}" cy="${n(y0)}"
        rx="${n(6+i*4)}" ry="${n(spread*(0.7+i*0.3))}" fill="none"
        stroke="#ffffff" stroke-opacity="${(0.5-i*0.13).toFixed(2)}" stroke-width="1.6"/>`;
  }
  if(R.breath.kind === 'water'){
    for(let i=0;i<7;i++)
      s += `<circle cx="${n(x0+reach*(0.3+i*0.1))}" cy="${n(y0+spread*1.4+i*4)}"
        r="${n(2+ (i%3))}" fill="${B.c[1]}" opacity=".7"/>`;
  }
  return s;
}

/* ---------- 4. wire it into the ride ---------- */
if(typeof tickRide === 'function'){
  const _tickRideFx = tickRide;
  tickRide = function(dt){
    const r = _tickRideFx.apply(this, arguments);
    try{
      const R = RIDE; if(!R || R.over) return r;
      R.breathCool = Math.max(0, (R.breathCool||0) - dt);
      if(R.breath){ R.breath.t += dt; if(R.breath.t > R.breath.dur) R.breath = null; }
      /* the dragon in its own element, created once and moved */
      const el = rideDragonEl();
      const box = el.getBoundingClientRect();
      const W = Math.max(320, box.width), H = Math.max(240, box.height);
      el.setAttribute('viewBox', `0 0 ${Math.round(W)} ${Math.round(H)}`);
      const g = rideDragonBody(el);
      const lift = Math.sin((R.t||0)*11) * 2.6;
      g.setAttribute('transform', `translate(${n(W*0.30)},${n(R.y*H + lift)})`);
      const body = g.querySelector('.dragon');
      if(body) body.classList.add('flying');
      /* the breath, drawn beside it */
      let bl = el.querySelector('#riderbreath');
      if(!bl){ bl = document.createElementNS('http://www.w3.org/2000/svg','g');
        bl.id='riderbreath'; el.insertBefore(bl, g); }
      bl.innerHTML = breathArt(R, W, H);
    }catch(e){}
    return r;
  };
}

/* the scene must stop drawing its own dragon, or there are two */
if(typeof paintRide === 'function'){
  const _paintRideFx = paintRide;
  paintRide = function(){
    const r = _paintRideFx.apply(this, arguments);
    try{
      const el = document.getElementById('ridelay');
      if(!el) return r;
      /* the scene's copy is inert and now duplicated by the live one */
      const stale = el.querySelector('.dragon');
      if(stale && stale.parentElement) stale.parentElement.remove();
    }catch(e){}
    return r;
  };
}

/* keys */
document.addEventListener('keydown', (e)=>{
  if(typeof RIDE === 'undefined' || !RIDE || RIDE.over) return;
  if(e.key === '1' || e.key === 'f'){ fireBreath('fire');  e.preventDefault(); }
  if(e.key === '2' || e.key === 'r'){ fireBreath('water'); e.preventDefault(); }
  if(e.key === '3' || e.key === 'e'){ fireBreath('air');   e.preventDefault(); }
});

/* clean the extra element up on landing */
if(typeof endRide === 'function'){
  const _endRideFx = endRide;
  endRide = function(){
    try{ const el = document.getElementById('ridedragon'); if(el) el.remove(); }catch(e){}
    return _endRideFx.apply(this, arguments);
  };
}

/* ---------- 5. the bands were narrower than the screen ---------- */
if(typeof band === 'function'){
  band = function(scrollX, rate, baseY, amp, fill, W, H, seed){
    /* Built to the real width plus a margin either side. The old version
       laid down 1800px of geometry and tiled it on a 900px modulo, so any
       viewport wider than 900px showed bare flat gaps — the hard vertical
       edge in the report. */
    const step = 90;
    const span = W + step*4;
    const off = -((scrollX*rate) % step);
    const cols = Math.ceil(span/step) + 2;
    let d = `M${n(off - step*2)} ${n(H)}`;
    for(let i=0;i<=cols;i++){
      const px = off - step*2 + i*step;
      const idx = Math.floor((scrollX*rate)/step) + i;
      const py = baseY*H - (hash(idx*3.1+seed)*0.62 + hash(idx*1.7+seed)*0.38) * amp*H;
      d += ` L${n(px)} ${n(py)}`;
    }
    d += ` L${n(off - step*2 + cols*step)} ${n(H)} Z`;
    return `<path d="${d}" fill="${fill}"/>`;
  };
}

/* ---------- handle ---------- */
G.rideFxAudit = function(){
  const R = (typeof RIDE !== 'undefined') ? RIDE : null;
  const el = document.getElementById('ridedragon');
  const wing = el && el.querySelector('.dwing.near');
  return {
    riding: !!R && !R.over,
    dragonInOwnElement: !!el,
    wingAnimation: wing ? getComputedStyle(wing).animationName + ' ' + getComputedStyle(wing).animationDuration : '—',
    breaths: Object.keys(BREATHS),
    keys: '1 or F fire · 2 or R water · 3 or E air',
    cooling: R ? +(R.breathCool||0).toFixed(2) : '—',
    breathing: R && R.breath ? R.breath.kind : 'none',
  };
};
