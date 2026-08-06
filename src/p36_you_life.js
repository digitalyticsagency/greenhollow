/* =====================================================================
   YOUR OWN DAY, AND A ROOM TO WORK IN

   The family had a timetable; you did not. S.you only ever held idle,
   walk and work, and all three were driven by clicking something — so
   while the partner went to bed you stood in the paddock all night.

   Now you keep the same hours they do: bed at night beside your
   partner, breakfast in the kitchen, dinner with everyone, indoors in a
   storm. It only takes over when you are idle, so the moment you click
   a job it hands control straight back.

   And since the career is done from home, the house now has a study —
   desk, monitor, chair, the lot — and billable work actually happens
   in it.
   ===================================================================== */

/* ---------- carve a study out of the top-right of the plan ---------- */
ROOMS.living.w = 0.29;                       // was 0.51, ending at 0.97
ROOMS.study    = {x:0.77, y:0.05, w:0.20, h:0.34};

/* the study's furniture, drawn over the base interior */
function studyArt(w, h){
  const r = ROOMS.study;
  const S0 = {x:r.x*w, y:r.y*h, w:r.w*w, h:r.h*h};
  let s = '';
  /* partition wall separating it from the living room */
  s += `<line x1="${n(w*0.755)}" y1="2" x2="${n(w*0.755)}" y2="${n(h*0.40)}"
    stroke="#f1e8d9" stroke-width="2.6" stroke-linecap="round"/>`;
  /* desk against the outer wall, with its shadow */
  const dx = S0.x + S0.w*0.10, dy = S0.y + S0.h*0.16, dw = S0.w*0.80, dh = S0.h*0.26;
  s += `<rect x="${n(dx+1)}" y="${n(dy+1.4)}" width="${n(dw)}" height="${n(dh)}" rx="1.6" fill="#000" opacity=".16"/>`;
  s += `<rect x="${n(dx)}" y="${n(dy)}" width="${n(dw)}" height="${n(dh)}" rx="1.6" fill="#a9764a"/>`;
  s += `<rect x="${n(dx)}" y="${n(dy)}" width="${n(dw)}" height="${n(dh*0.30)}" rx="1.6" fill="#c08f5c"/>`;
  /* monitor, seen from above: a thin bright slab on a stand */
  s += `<rect x="${n(dx+dw*0.18)}" y="${n(dy+dh*0.14)}" width="${n(dw*0.64)}" height="${n(dh*0.22)}" rx="0.8" fill="#2f3a45"/>`;
  s += `<rect x="${n(dx+dw*0.20)}" y="${n(dy+dh*0.17)}" width="${n(dw*0.60)}" height="${n(dh*0.15)}" rx="0.6"
    fill="#6fb6d8" class="studyScreen"/>`;
  s += `<rect x="${n(dx+dw*0.44)}" y="${n(dy+dh*0.38)}" width="${n(dw*0.12)}" height="${n(dh*0.14)}" fill="#3f4a52"/>`;
  /* keyboard and mug */
  s += `<rect x="${n(dx+dw*0.24)}" y="${n(dy+dh*0.60)}" width="${n(dw*0.52)}" height="${n(dh*0.20)}" rx="1" fill="#cbd3d8"/>`;
  s += `<circle cx="${n(dx+dw*0.90)}" cy="${n(dy+dh*0.70)}" r="${n(dh*0.13)}" fill="#f0f4f6"/>`;
  s += `<circle cx="${n(dx+dw*0.90)}" cy="${n(dy+dh*0.70)}" r="${n(dh*0.07)}" fill="#6b4f36"/>`;
  /* chair */
  s += `<ellipse cx="${n(S0.x+S0.w*0.50)}" cy="${n(dy+dh*1.5)}" rx="${n(S0.w*0.17)}" ry="${n(S0.h*0.09)}" fill="#4d5a63"/>`;
  s += `<ellipse cx="${n(S0.x+S0.w*0.50)}" cy="${n(dy+dh*1.44)}" rx="${n(S0.w*0.12)}" ry="${n(S0.h*0.06)}" fill="#63727d"/>`;
  /* shelf of files, and a plant for the corner */
  s += `<rect x="${n(S0.x+S0.w*0.08)}" y="${n(S0.y+S0.h*0.76)}" width="${n(S0.w*0.48)}" height="${n(S0.h*0.12)}" rx="1.2" fill="#8a6a45"/>`;
  for(let i=0;i<5;i++)
    s += `<rect x="${n(S0.x+S0.w*(0.10+i*0.088))}" y="${n(S0.y+S0.h*0.775)}" width="${n(S0.w*0.055)}" height="${n(S0.h*0.09)}"
      fill="${['#b45b4a','#4f7f96','#c8a44e','#6b8b72','#9c7fb0'][i]}"/>`;
  s += `<circle cx="${n(S0.x+S0.w*0.80)}" cy="${n(S0.y+S0.h*0.84)}" r="${n(S0.h*0.09)}" fill="#7a5a3c"/>`;
  s += `<circle cx="${n(S0.x+S0.w*0.80)}" cy="${n(S0.y+S0.h*0.80)}" r="${n(S0.h*0.10)}" fill="#5f9a3c"/>`;
  return s;
}

const _interiorBase = interiorArt;
interiorArt = function(w, h){ return _interiorBase(w, h) + studyArt(w, h); };

/* ---------- your own timetable ---------- */
/* Mirrors the family's hours so the household moves together. Returns a
   target and a label, or null when you should be left alone. */
function youRoutine(){
  const H = (typeof houseRect === 'function') ? houseRect() : null;
  if(!H) return null;
  const f = dayFrac();
  const storm = S.weather === 'storm';
  const at = (room, fx, fy, act, state) => {
    const r = ROOMS[room];
    return { x: H.x + (r.x + r.w*(fx||0.5))*H.w,
             y: H.y + (r.y + r.h*(fy||0.5))*H.h, act, state: state || 'idle' };
  };

  /* asleep, on your side of the bed */
  if(f < 0.24 || f > 0.90) return at('bedMain', 0.68, 0.42, 'asleep', 'sleep');

  if(f < 0.30) return at('kitchen', 0.55, 0.62, 'having breakfast');

  /* billable work happens at the desk, and only if there is work to do */
  if(typeof wfhOn === 'function' && wfhOn() && f > 0.34 && f < 0.52){
    const left = (typeof hoursLeft === 'function') ? hoursLeft() : 0;
    if(left > 1) return at('study', 0.5, 0.55, 'at the desk', 'desk');
  }

  if(f > 0.78 && f < 0.84) return at('living', 0.5, 0.5, 'having dinner');
  if(f > 0.84)             return at('living', 0.35, 0.6, 'sitting by the fire');

  if(storm) return at('living', 0.65, 0.4, 'waiting out the storm');

  return null;      /* the rest of the day is yours */
}

/* Autopilot only drives when you are idle and have queued nothing, so any
   click you make takes the wheel back immediately. */
let youAuto = null;
function tickYouLife(dt){
  youInit();
  const y = S.you;
  if(y.job || y.state === 'walk' || y.state === 'work'){ youAuto = null; return; }

  const goal = youRoutine();
  if(!goal){ if(y.state === 'sleep' || y.state === 'desk') y.state = 'idle'; youAuto = null; return; }

  const d = Math.hypot(goal.x - y.x, goal.y - y.y);
  if(d > 6){
    const spd = 150 * dt;
    y.x += (goal.x - y.x)/d * Math.min(d, spd);
    y.y += (goal.y - y.y)/d * Math.min(d, spd);
    if(Math.abs(goal.x - y.x) > 0.5) y.dir = goal.x > y.x ? 1 : -1;
    y.state = 'auto';
  } else {
    y.state = goal.state;
  }
  /* narrate it once per change, same as the family */
  if(youAuto !== goal.act){
    youAuto = goal.act;
    if(typeof log === 'function'){
      const line = goal.act === 'asleep' ? 'You turned in for the night.'
                 : goal.act === 'at the desk' ? 'You sat down at the desk to work.'
                 : 'You were ' + goal.act + '.';
      log(line, '', 'home');
    }
  }
  if(typeof paintYou === 'function') paintYou();
}

const _tickYouBase = tickYou;
tickYou = function(dt){
  const r = _tickYouBase.apply(this, arguments);
  if(S && S.speed !== 0) tickYouLife(dt);
  return r;
};

/* asleep and at-the-desk need to look different from standing about */
const _paintYouBase = paintYou;
paintYou = function(){
  const r = _paintYouBase.apply(this, arguments);
  const el = document.getElementById('you');
  if(!el) return r;
  const st = S.you && S.you.state;
  el.classList.toggle('you-sleep', st === 'sleep');
  el.classList.toggle('you-desk',  st === 'desk');
  /* one small z above your head while you sleep */
  let z = el.querySelector('.zzz');
  if(st === 'sleep' && !z){
    z = document.createElementNS('http://www.w3.org/2000/svg','text');
    z.setAttribute('class','zzz'); z.setAttribute('y','-22');
    z.setAttribute('text-anchor','middle'); z.setAttribute('font-size','10');
    z.setAttribute('fill','#cfe0ea'); z.textContent = 'z';
    el.appendChild(z);
  } else if(st !== 'sleep' && z){ z.remove(); }
  return r;
};

/* taking a client job should walk you to the desk, not teleport the money */
if(typeof takeJob === 'function'){
  const _takeJob = takeJob;
  takeJob = function(id){
    const H = (typeof houseRect === 'function') ? houseRect() : null;
    if(H && S.you){
      const r = ROOMS.study;
      S.you.x = H.x + (r.x + r.w*0.5)*H.w;
      S.you.y = H.y + (r.y + r.h*0.55)*H.h;
      S.you.state = 'desk';
      if(typeof paintYou === 'function') paintYou();
    }
    return _takeJob.apply(this, arguments);
  };
}

(function youCss(){
  const s = document.createElement('style');
  s.textContent = `
  /* lying down: flattened and tipped onto one side */
  #you.you-sleep .youbob{ transform: rotate(-82deg) translateY(-3px) scale(.94); transform-origin:50% 70%; }
  #you.you-sleep .zzz{ animation: zzzFloat 2.6s ease-in-out infinite; }
  @keyframes zzzFloat{
    0%,100%{ opacity:.25; transform:translateY(0); }
    50%    { opacity:.9;  transform:translateY(-4px); } }
  /* leaning in at the desk */
  #you.you-desk .youbob{ transform: translateY(-2px) scale(.97); }
  #cutaway .studyScreen{ animation: screenFlicker 4.2s ease-in-out infinite; }
  @keyframes screenFlicker{ 0%,100%{opacity:.85} 50%{opacity:1} }
  @media (prefers-reduced-motion: reduce){
    #you.you-sleep .zzz, #cutaway .studyScreen{ animation:none !important; } }
  `;
  document.head.appendChild(s);
})();
