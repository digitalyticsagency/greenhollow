/* =====================================================================
   THE DRAGON SLEEPS IN THE ROOST, AND SAYS GOOD MORNING

   Asked for: it should sleep inside, and with the roof lifted you should
   be able to see it in there; and once a day it should wake, breathe fire,
   and greet you.

   SLEEPING INSIDE. At night the dragon goes to the roost and curls up in
   it — coiled, nose under tail, the whole animal inside the footprint
   rather than perched on the ridge. With Roof off it is drawn in the
   roost's cutaway, breathing slowly, one eye occasionally open. With the
   roof on you get what you would actually see: a shape in the doorway and
   the glow of it.

   THE MORNING. Once a day, at first light, it wakes up properly. It
   uncoils, stands, stretches one wing at a time, throws a column of fire
   straight up — which is the loudest thing that will happen to you all
   day — and then finds you and says good morning in its own way. Once,
   and then it gets on with whatever it was going to do. The whole point
   of "once a day" is that it stays an event, so the flag is stamped with
   the day number and cleared when the day rolls.

   It will not do any of this while something else is using the screen —
   waking up to a dawn fire salute in the middle of a duel would be a
   fine way to lose track of both.
   ===================================================================== */

const MORNING = { stage:null, t:0, said:false };
const MORNING_STAGES = [
  { k:'stir',    t:1.6 },
  { k:'uncoil',  t:1.4 },
  { k:'stretch', t:2.0 },
  { k:'pillar',  t:2.4 },
  { k:'greet',   t:2.6 },
];

function dragonState(){ return (typeof S === 'object' && S.dragon) || null; }
function roostOf(){ return (S.objs||[]).find(o=>o.bp === 'dragon_roost'); }
function roostBox(){
  const r = roostOf(); if(!r) return null;
  const bp = BPMAP[r.bp]; const f = footprint(bp, r.rot);
  return { o:r, x:r.tx*T, y:r.ty*T, w:f.w*T, h:f.h*T,
           cx:(r.tx+f.w/2)*T, cy:(r.ty+f.h/2)*T };
}
function morningState(){
  if(!S.dragonday) S.dragonday = { day:-1, done:false };
  if(S.dragonday.day !== S.day){ S.dragonday.day = S.day; S.dragonday.done = false; }
  return S.dragonday;
}

/* ---------- asleep in the roost ---------- */
function dragonShouldSleep(){
  const d = dragonState(); if(!d) return false;
  if(MORNING.stage !== null && MORNING.stage !== undefined) return false;  /* 0 is a stage */
  if(typeof isNight !== 'function') return false;
  return isNight() && !!roostBox();
}

/* the dragon's own goal function is wrapped so the roost wins after dark */
if(typeof dragonGoal === 'function'){
  const _goalBase = dragonGoal;
  dragonGoal = function(){
    const box = roostBox();
    if(dragonShouldSleep() && box)
      return { mode:'asleep', x:box.cx, y:box.cy + box.h*0.18, say:'' };
    return _goalBase.apply(this, arguments);
  };
}

/* ---------- the wake-up ---------- */
function morningTick(dt){
  const d = dragonState(); if(!d) return;
  const box = roostBox(); if(!box) return;
  const M = morningState();

  /* not while a scene owns the screen */
  let busy = false;
  try{ busy = (typeof sceneRunning === 'function') && !!sceneRunning(); }catch(e){}

  /* Stage 0 is a real stage. `if(!MORNING.stage)` is true for it, so the
     routine re-entered the not-yet-started branch every frame, found the
     day already stamped, and returned — freezing the dragon on its first
     beat for good. Test for absence, not for truth; the same trap that
     hatched every chick fully grown. */
  if(MORNING.stage === null || MORNING.stage === undefined){
    if(M.done || busy) return;
    if(typeof dayFrac !== 'function') return;
    const f = dayFrac();
    /* first light: after the sun is properly up, not at the stroke of dawn */
    if(f > 0.27 && f < 0.40){
      MORNING.stage = 0; MORNING.t = 0; MORNING.said = false;
      M.done = true;
      if(typeof G.wakeTheWorld === 'function') G.wakeTheWorld();
      if(typeof log === 'function')
        log(`${d.name} is awake.`, '', 'farm');
    }
    return;
  }

  MORNING.t += dt;
  const st = MORNING_STAGES[MORNING.stage];
  if(!st){ MORNING.stage = null; return; }

  if(st.k === 'pillar' && MORNING.t > 0.4 && !MORNING.fired){
    MORNING.fired = true;
    try{ sfx('roar'); }catch(e){ try{ sfx('quake'); }catch(e2){} }
    if(typeof log === 'function')
      log(`${d.name} put a column of fire straight up over the roost. Everything within a
        field of it stopped what it was doing.`, 'gold', 'farm');
  }
  if(st.k === 'greet' && !MORNING.said){
    MORNING.said = true;
    const lines = ['Good morning to you.','You are up early.','It is a good sky today.',
                   'I have been awake since the light.','Come here. Look at it.'];
    d.say = lines[Math.floor(Math.random()*lines.length)];
    d.sayT = 3.2;
    if(typeof toast === 'function') toast(`${d.name}: ${d.say}`, 'gold');
    if(typeof log === 'function') log(`${d.name}: "${d.say}"`, 'gold', 'farm');
    /* it is pleased to see you, and that is worth a little */
    d.bond = Math.min(1, (d.bond || 0) + 0.02);
  }

  if(MORNING.t >= st.t){
    MORNING.t = 0; MORNING.stage++;
    if(MORNING.stage >= MORNING_STAGES.length){
      MORNING.stage = null; MORNING.fired = false;
    }
  }
}

/* ---------- drawing: curled up, and the morning ---------- */
function morningPaint(){
  const d = dragonState();
  const box = roostBox();
  let g = document.getElementById('dmornlay');
  const asleep = d && dragonShouldSleep();
  const busyStage = MORNING.stage !== null && MORNING.stage !== undefined;
  if(!d || !box || (!asleep && !busyStage)){ if(g) g.remove(); return; }
  if(!g){
    const fg = document.getElementById('fg'); if(!fg) return;
    g = document.createElementNS('http://www.w3.org/2000/svg','g');
    g.id = 'dmornlay'; g.setAttribute('pointer-events','none');
    fg.appendChild(g);
  }
  const now = performance.now()/1000;
  const hue = (d.hue || 30);
  const body = `hsl(${hue} 46% 42%)`, lit = `hsl(${hue} 52% 58%)`, deep = `hsl(${hue} 44% 24%)`;
  const roofOff = (typeof SET === 'function') && SET('roofOff');
  let s = '';

  if(asleep){
    const cx = box.cx, cy = box.cy + box.h*0.16;
    const br = 1 + Math.sin(now*0.9)*0.035;                /* slow breathing */
    if(roofOff){
      /* the whole animal, coiled inside the walls */
      s += `<g transform="translate(${n(cx)},${n(cy)}) scale(${br.toFixed(3)})">`;
      s += `<ellipse cx="0" cy="6" rx="${n(box.w*0.40)}" ry="${n(box.h*0.16)}" fill="#000" opacity=".28"/>`;
      /* the coil: three loops of tapering body */
      for(let i=0;i<3;i++){
        const rr = box.w*0.34 - i*box.w*0.07;
        s += `<ellipse cx="${n(-i*3)}" cy="${n(i*2)}" rx="${n(rr)}" ry="${n(rr*0.42)}"
          fill="none" stroke="${i?body:deep}" stroke-width="${n(8-i*1.6)}" opacity="${(0.95-i*0.12).toFixed(2)}"/>`;
      }
      /* the head, laid on the coil, nose tucked under */
      s += `<g transform="translate(${n(box.w*0.16)},${n(-box.h*0.04)})">`;
      s += `<ellipse cx="0" cy="0" rx="11" ry="7" fill="${body}"/>`;
      s += `<ellipse cx="-2" cy="-2" rx="7" ry="4" fill="${lit}" opacity=".7"/>`;
      s += `<path d="M-4 -6 l-7 -8 l9 3 Z" fill="${deep}"/>`;
      /* an eye that opens now and then */
      const blink = (Math.sin(now*0.31) > 0.94) ? 1 : 0;
      s += blink
        ? `<circle cx="4" cy="-1.4" r="1.7" fill="#ffd27a"/>`
        : `<path d="M2 -1.4 q2.2 1.4 4.4 0" stroke="${deep}" stroke-width="1.4" fill="none"/>`;
      /* breath, drifting up */
      for(let i=0;i<3;i++){
        const t = ((now*0.4 + i*0.33) % 1);
        s += `<circle cx="${n(9 + t*7)}" cy="${n(-2 - t*16)}" r="${n(1.6 + t*3)}"
          fill="#cfe0ea" opacity="${(0.30*(1-t)).toFixed(2)}"/>`;
      }
      s += `</g></g>`;
      s += `<text x="${n(cx)}" y="${n(box.y - 6)}" text-anchor="middle" fill="#cfe0ea"
        font-size="10" opacity=".75" style="font-family:inherit">z z z</text>`;
    } else {
      /* roof on: what you would really see — a shape in the doorway, lit */
      const gy = box.y + box.h*0.72;
      s += `<ellipse cx="${n(cx)}" cy="${n(gy)}" rx="${n(box.w*0.26)}" ry="${n(box.h*0.12)}"
        fill="#ffb46a" opacity="${(0.16 + 0.05*Math.sin(now*0.9)).toFixed(3)}"/>`;
      s += `<path d="M${n(cx-box.w*0.13)} ${n(gy)} q${n(box.w*0.13)} ${n(-box.h*0.20)} ${n(box.w*0.26)} 0 Z"
        fill="${deep}" opacity=".85"/>`;
      s += `<circle cx="${n(cx - box.w*0.03)}" cy="${n(gy - box.h*0.07)}" r="1.6"
        fill="#ffd27a" opacity="${(0.5 + 0.4*Math.sin(now*1.7)).toFixed(2)}"/>`;
    }
  }

  if(busyStage){
    const st = MORNING_STAGES[MORNING.stage];
    const k = MORNING.t / st.t;
    const cx = box.cx, cy = box.cy;
    if(st.k === 'stretch'){
      /* one wing at a time */
      const which = k < 0.5 ? -1 : 1;
      const kk = (k < 0.5 ? k*2 : (k-0.5)*2);
      const sp = Math.sin(kk*Math.PI);
      s += `<path d="M${n(cx)} ${n(cy)} q${n(which*40*sp)} ${n(-34*sp)} ${n(which*74*sp)} ${n(-8*sp)}
        q${n(-which*26*sp)} ${n(14*sp)} ${n(-which*74*sp)} ${n(8*sp)} Z"
        fill="${deep}" opacity="${(0.8*sp).toFixed(2)}"/>`;
    }
    if(st.k === 'pillar'){
      /* a column of fire, straight up */
      const up = Math.sin(Math.min(1,k*1.4)*Math.PI);
      const H = box.h*0.4 + 260*up;
      s += `<path d="M${n(cx-13)} ${n(cy)} L${n(cx-5)} ${n(cy-H)} L${n(cx+5)} ${n(cy-H)}
        L${n(cx+13)} ${n(cy)} Z" fill="#ff8a3a" opacity="${(0.75*up).toFixed(2)}"/>`;
      s += `<path d="M${n(cx-7)} ${n(cy)} L${n(cx-2.5)} ${n(cy-H*0.94)} L${n(cx+2.5)} ${n(cy-H*0.94)}
        L${n(cx+7)} ${n(cy)} Z" fill="#ffd27a" opacity="${(0.9*up).toFixed(2)}"/>`;
      for(let i=0;i<9;i++){
        const t = ((now*1.6 + i*0.11) % 1);
        s += `<circle cx="${n(cx + (Math.sin(i*3+now*4))*14*t)}" cy="${n(cy - H*t)}"
          r="${n(1.6 + t*4)}" fill="#ffb46a" opacity="${(0.7*(1-t)*up).toFixed(2)}"/>`;
      }
      s += `<ellipse cx="${n(cx)}" cy="${n(cy+4)}" rx="${n(40*up)}" ry="${n(12*up)}"
        fill="#ffd27a" opacity="${(0.30*up).toFixed(2)}"/>`;
    }
    if(st.k === 'greet' && d.say){
      s += `<text x="${n(cx)}" y="${n(box.y - 16)}" text-anchor="middle" fill="#ffe6ad"
        font-size="12" opacity=".95" style="font-family:inherit">${d.say}</text>`;
    }
  }
  g.innerHTML = s;
}

if(typeof tickPeople === 'function'){
  const _tickMorn = tickPeople;
  tickPeople = function(dt){
    const r = _tickMorn.apply(this, arguments);
    try{ morningTick(typeof dt === 'number' ? dt : 1/30); morningPaint(); }catch(e){}
    return r;
  };
}

/* ---------- handle ---------- */
G.dragonMorningAudit = function(){
  const d = dragonState();
  const M = morningState();
  return {
    dragon: d ? d.name : 'none',
    roost: roostBox() ? 'built' : 'none',
    night: typeof isNight === 'function' ? isNight() : 'unknown',
    hour: typeof dayFrac === 'function' ? +dayFrac().toFixed(3) : '?',
    sleepingInRoost: !!(d && dragonShouldSleep()),
    roofOff: (typeof SET === 'function') && SET('roofOff'),
    morningStage: MORNING.stage === null || MORNING.stage === undefined
      ? 'not this morning' : MORNING_STAGES[MORNING.stage].k,
    greetedToday: M.done,
    saidToday: d ? (d.say || '') : '',
    drawn: !!document.getElementById('dmornlay'),
  };
};
