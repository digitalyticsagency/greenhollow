/* =====================================================================
   THE DRAGON DOES NOT WATCH A FIGHT ON ITS OWN LAND

   Two champions come down over the farm, level a building each and leave
   you the marks — and the dragon you spent twelve of those marks on sits
   on its roost through the whole thing. It has a mind, it has three
   breaths it uses on the ride, and it has never once been part of the one
   event on this farm that is actually a fight.

   IT COMES IN AT THE STRUGGLE, which is the only moment worth arriving
   at. The staged beats already build to a beam lock the hero is losing;
   that is where a third party changes an outcome rather than decorating
   one. It crosses in during the charge, holds station off the hero's
   shoulder through the beam, and breathes on the villain through the
   struggle. The hero pushes through faster and harder than he ever does
   alone, and the numbers say so: push climbs at roughly two and a half
   times the unaided rate while the breath is on the villain.

   THREE BREATHS, AND THEY ARE NOT RESKINS.

     fire    a jet, and the hardest shove of the three. Embers.
     frost   a cone of shards. It does less pushing and instead holds the
             villain — his aura is smothered to almost nothing while the
             rime is on him, so the lock breaks because he stops pushing
             back rather than because he is overpowered.
     water   a heavy torrent with a droop on it, and a splash that throws
             him downward.

   Which one you get is the dragon's own temperature, not a dice roll: a
   dragon running hot breathes fire, a cold one frost, and one in between
   reaches for water. Feed it and fly it and you will notice it changes.

   IT HAS TO RATE YOU FIRST. Below a bond of 0.5 it stays on the roost and
   the fight goes exactly as it always did. That is the same trust that
   gates riding, one notch higher, because carrying you is a favour and
   fighting for you is a bigger one. The log says so when it refuses,
   because a mechanic nobody is told about is a bug.

   No filters here either — the breaths are stacked translucent shapes
   drawn per frame into the duel layer, the same way the beams are.
   ===================================================================== */

const DUEL_BREATHS = {
  fire:  { n:'fire',  c:['#ff4a12','#ff9a2a','#ffe07a'], push:0.62, smother:0.25, sound:'blast' },
  frost: { n:'frost', c:['#5fa8d8','#bfe4f4','#ffffff'], push:0.34, smother:0.85, sound:'heavy' },
  water: { n:'water', c:['#1f6aa8','#4a9ed0','#cfeaf8'], push:0.48, smother:0.45, sound:'whoosh' },
};

/* the bond it will fight for — one notch above the 0.35 that gets you a ride */
const DRAGON_FIGHT_BOND = 0.5;

function dragonWillFight(){
  const d = S.dragon;
  return !!(d && (d.bond || 0) >= DRAGON_FIGHT_BOND);
}

/* its own temperature picks the breath */
function dragonBreathChoice(){
  const m = (S.dragon && S.dragon.mind) || {};
  const heat = (m.heat === undefined) ? 0.5 : m.heat;
  return heat > 0.66 ? 'fire' : heat < 0.34 ? 'frost' : 'water';
}

function beatIndex(k){ return BEATS.findIndex(b=>b.k === k); }

/* ---------- set up when the champions arrive ---------- */
if(typeof G.startDuel === 'function'){
  const _startDuelDragon = G.startDuel;
  G.startDuel = function(){
    const r = _startDuelDragon.apply(this, arguments);
    try{
      if(!DUEL || DUEL.over) return r;
      const d = S.dragon;
      if(!d){ DUEL.dg = null; return r; }
      if(!dragonWillFight()){
        DUEL.dg = null;
        if(typeof log === 'function')
          log(`${d.name} watched from the roost and did not move. It does not rate you enough to fight for you.`,
              '', 'farm');
        return r;
      }
      DUEL.dg = {
        phase:'wait', t:0, fired:0, said:0,
        kind: dragonBreathChoice(),
        x: (FARM.x - 4)*T, y: DUEL.cy - 150,
      };
    }catch(e){}
    return r;
  };
}

/* ---------- what it does, beat by beat ---------- */
function dragonDuelTick(dt){
  if(!DUEL || DUEL.over) return;
  const D = DUEL, g = D.dg;
  if(!g) return;
  const d = S.dragon; if(!d) return;
  g.t += dt;

  /* station: off the hero's shoulder, high and behind */
  const hoverX = D.hx - 52, hoverY = D.hy - 82;
  const glide = (tx, ty, rate)=>{
    g.x += (tx - g.x) * Math.min(1, dt*rate);
    g.y += (ty - g.y) * Math.min(1, dt*rate);
  };

  if(g.phase === 'wait'){
    /* it crosses in as the hero starts charging */
    if(D.beat >= beatIndex('charge')){
      g.phase = 'incoming';
      if(typeof G.bang === 'function') try{ G.bang('roar'); }catch(e){}
      if(typeof log === 'function')
        log(`${d.name} came in over the ridge.`, 'gold', 'farm');
      if(typeof toast === 'function') toast(`${d.name} is coming in`, 'gold');
    }
    return;
  }

  if(g.phase === 'incoming'){
    glide(hoverX, hoverY, 1.9);
    if(Math.hypot(g.x - hoverX, g.y - hoverY) < 26 || D.beat >= beatIndex('beam')) g.phase = 'hold';
    return;
  }

  if(g.phase === 'hold'){
    glide(hoverX, hoverY, 3.2);
    if(D.beat >= beatIndex('struggle')) g.phase = 'breathe';
    return;
  }

  if(g.phase === 'breathe'){
    glide(hoverX, hoverY, 3.2);
    const B = DUEL_BREATHS[g.kind] || DUEL_BREATHS.fire;
    if(!g.fired){
      g.fired = 1;
      if(typeof G.bang === 'function') try{ G.bang(B.sound); }catch(e){}
      if(typeof log === 'function')
        log(`${d.name} breathed ${B.n} across the lock. ${D.villain.n} could not hold it.`, 'gold', 'farm');
    }
    /* The help, and the reason to have a dragon at all.
       Note it drives the beat clock rather than D.push. The struggle beat
       recomputes push from its own progress on every frame, so adding to
       push directly is overwritten within one tick — measured at 0.910 vs
       0.941 at the end of the lock, which is nothing. Pushing the clock
       forward runs the hero along the game's own curve faster and
       shortens the lock, which is what winning sooner actually looks
       like. */
    D.bt += B.push * dt;
    D.vpow = Math.max(0, (D.vpow || 0) - B.smother * dt);
    D.shake = Math.max(D.shake || 0, 0.55);
    if(Math.random() < dt*7)
      boom(D.vx + (Math.random()-0.5)*30, D.vy - 14 + (Math.random()-0.5)*24, B.c[1]);
    D.dragonHelped = 1;
    if(D.beat >= beatIndex('finish')) g.phase = 'pull';
    return;
  }

  if(g.phase === 'pull'){
    /* it lifts away from the blast rather than sitting in it */
    glide(hoverX - 20, hoverY - 46, 2.4);
    if(D.beat >= beatIndex('settle')){
      g.phase = 'leave';
      if(typeof G.bang === 'function') try{ G.bang('roar'); }catch(e){}
    }
    return;
  }

  if(g.phase === 'leave') glide((FARM.x + FARM.w + 6)*T, D.cy - 210, 1.3);
}

/* ---------- the breaths ----------
   Drawn along +x inside a rotated group, so each one is authored straight
   and aimed by the transform rather than by trigonometry per shape. */
function duelBreathArt(kind, x0, y0, x1, y1, k){
  const B = DUEL_BREATHS[kind] || DUEL_BREATHS.fire;
  const dx = x1 - x0, dy = y1 - y0;
  const len = Math.max(24, Math.hypot(dx, dy));
  const deg = Math.atan2(dy, dx) * 180 / Math.PI;
  const reach = len * Math.min(1, k*1.5);
  if(reach < 8) return '';
  const spread = 9 + 13*Math.sin(Math.min(1,k)*Math.PI);
  let s = `<g transform="translate(${n(x0)},${n(y0)}) rotate(${deg.toFixed(1)})">`;

  if(kind === 'frost'){
    /* a cone, and shards riding down it */
    const cone = (r, sp, col, op)=>`<path d="M0 0 L${n(r)} ${n(-sp)} L${n(r)} ${n(sp)} Z"
      fill="${col}" opacity="${op}"/>`;
    s += cone(reach, spread*1.15, B.c[0], 0.42);
    s += cone(reach*0.82, spread*0.78, B.c[1], 0.62);
    s += cone(reach*0.55, spread*0.42, B.c[2], 0.85);
    for(let i=0;i<7;i++){
      const px = reach*(0.16 + (i/7)*0.82), py = (hash(i*3.7)-0.5)*spread*1.5;
      s += `<path d="M${n(px)} ${n(py-3)} L${n(px+3.4)} ${n(py)} L${n(px)} ${n(py+3)} L${n(px-3.4)} ${n(py)} Z"
        fill="#ffffff" opacity=".8"/>`;
    }
  } else if(kind === 'water'){
    /* a heavy stream with a droop, and droplets under it */
    const arc = (r, sp, col, op)=>`<path d="M0 ${n(-sp*0.5)} Q${n(r*0.55)} ${n(-sp*0.2)} ${n(r)} ${n(sp*0.9)}
      L${n(r)} ${n(sp*2.0)} Q${n(r*0.55)} ${n(sp*1.2)} 0 ${n(sp*0.5)} Z" fill="${col}" opacity="${op}"/>`;
    s += arc(reach, spread, B.c[0], 0.55);
    s += arc(reach*0.86, spread*0.72, B.c[1], 0.7);
    s += arc(reach*0.6, spread*0.44, B.c[2], 0.85);
    for(let i=0;i<8;i++){
      const px = reach*(0.3 + (i/8)*0.7), py = spread*(1.0 + hash(i*5.1)*1.4);
      s += `<circle cx="${n(px)}" cy="${n(py)}" r="${(1.4 + hash(i)*1.8).toFixed(1)}" fill="${B.c[2]}" opacity=".7"/>`;
    }
  } else {
    /* fire: a tapered jet, brightest at the core, with embers */
    const jet = (r, sp, col, op)=>`<path d="M0 0 Q${n(r*0.5)} ${n(-sp)} ${n(r)} 0
      Q${n(r*0.5)} ${n(sp)} 0 0 Z" fill="${col}" opacity="${op}"/>`;
    s += jet(reach, spread*1.1, B.c[0], 0.55);
    s += jet(reach*0.78, spread*0.72, B.c[1], 0.78);
    s += jet(reach*0.5, spread*0.42, B.c[2], 0.92);
    for(let i=0;i<6;i++){
      const px = reach*(0.55 + (i/6)*0.5), py = (hash(i*2.3)-0.5)*spread*2.2;
      s += `<circle cx="${n(px)}" cy="${n(py)}" r="${(1 + hash(i*7)*1.7).toFixed(1)}" fill="#ffd27a" opacity=".85"/>`;
    }
  }
  s += `</g>`;
  return s;
}

/* frost keeps hold of him after the cone lands */
function rimeArt(x, y, k){
  let s = `<circle cx="${n(x)}" cy="${n(y)}" r="${n(16 + 5*Math.sin(k*7))}" fill="none"
    stroke="#cfeaf8" stroke-width="2" opacity=".55"/>`;
  for(let i=0;i<6;i++){
    const a = (i/6)*Math.PI*2 + k;
    s += `<path d="M${n(x + Math.cos(a)*13)} ${n(y + Math.sin(a)*13)}
      l${n(Math.cos(a)*7)} ${n(Math.sin(a)*7)}" stroke="#ffffff" stroke-width="2"
      stroke-linecap="round" opacity=".7"/>`;
  }
  return s;
}

/* ---------- drawn into the duel layer ---------- */
if(typeof duelPaint === 'function'){
  const _duelPaintDragon = duelPaint;
  duelPaint = function(){
    const r = _duelPaintDragon.apply(this, arguments);
    try{
      if(!DUEL || DUEL.over) return r;
      const D = DUEL, g = D.dg;
      if(!g || g.phase === 'wait') return r;
      const el = document.getElementById('duellay'); if(!el) return r;
      const d = S.dragon; if(!d) return r;

      let s = '';
      /* the breath first, so the dragon sits on top of its own jet */
      if(g.phase === 'breathe'){
        const k = Math.min(1, g.t*0.9);
        s += duelBreathArt(g.kind, g.x + 26, g.y - 12, D.vx, D.vy - 14, k);
        if(g.kind === 'frost') s += rimeArt(D.vx, D.vy - 14, g.t*2);
      }
      /* it beats its wings the whole time it is up there */
      const lift = Math.sin(g.t*11) * 3;
      s += `<g transform="translate(${n(g.x)},${n(g.y + lift)})">`;
      s += (typeof dragonArt === 'function')
        ? dragonArt({ ...d, state:'fly' })
        : `<ellipse cx="0" cy="0" rx="20" ry="8" fill="#8a4a3a"/>`;
      s += `</g>`;

      el.innerHTML += s;
      const body = el.querySelector('.dragon');
      if(body) body.classList.add('flying');
    }catch(e){}
    return r;
  };
}

/* ---------- it cannot be in two places ----------
   The farm layer goes on painting the dragon at S.dragon.x/y for the whole
   duel, so there were two of them on screen — one hovering over the fight
   and one still sat on the roost. Confirmed by counting: one .dragon node
   before the duel, two during.

   The suppression goes in paintDragon, which is the roost copy's own
   per-frame painter, rather than on the layer element. render() destroys
   and rebuilds #dragonlay — a style set anywhere else is wiped the first
   time a building gets levelled. */
function dragonIsAtTheDuel(){
  return !!(typeof DUEL !== 'undefined' && DUEL && !DUEL.over
            && DUEL.dg && DUEL.dg.phase !== 'wait');
}
if(typeof paintDragon === 'function'){
  const _paintDragonDuel = paintDragon;
  paintDragon = function(){
    const r = _paintDragonDuel.apply(this, arguments);
    try{
      const g = document.getElementById('dragonlay');
      if(g) g.style.display = dragonIsAtTheDuel() ? 'none' : '';
    }catch(e){}
    return r;
  };
}

/* ---------- the tick, after the beats have moved ---------- */
if(typeof duelTick === 'function'){
  const _duelTickDragon = duelTick;
  duelTick = function(dt){
    const r = _duelTickDragon.apply(this, arguments);
    try{ dragonDuelTick(typeof dt === 'number' ? dt : 0.05); }catch(e){}
    return r;
  };
}

/* ---------- it earned its share ---------- */
if(typeof duelEnd === 'function'){
  const _duelEndDragon = duelEnd;
  duelEnd = function(){
    let helped = false, name = '';
    try{ helped = !!(DUEL && DUEL.dragonHelped); name = (S.dragon && S.dragon.name) || ''; }catch(e){}
    const r = _duelEndDragon.apply(this, arguments);
    try{
      if(helped && S.dragon){
        S.marks = (S.marks || 0) + 1;
        S.dragon.bond = Math.min(1, (S.dragon.bond || 0) + 0.04);
        if(S.dragon.mind) S.dragon.mind.pride = Math.min(1, (S.dragon.mind.pride || 0) + 0.3);
        if(typeof log === 'function')
          log(`${name} took a mark for itself, and thought rather well of the whole business.`, 'gold', 'farm');
        if(typeof save === 'function') try{ save(); }catch(e){}
      }
    }catch(e){}
    return r;
  };
}

/* ---------- handle ---------- */
G.dragonDuelAudit = function(){
  const d = S.dragon;
  if(!d) return { haveDragon:false, needsBond:DRAGON_FIGHT_BOND };
  const base = {
    dragon:d.name, bond:+(d.bond||0).toFixed(2), needsBond:DRAGON_FIGHT_BOND,
    willFight: dragonWillFight(),
    breathItWouldUse: dragonBreathChoice(),
    heat: d.mind ? +(d.mind.heat === undefined ? 0.5 : d.mind.heat).toFixed(2) : '—',
    breaths: Object.keys(DUEL_BREATHS),
  };
  if(!DUEL || DUEL.over) return Object.assign(base, { duelRunning:false });
  const g = DUEL.dg;
  return Object.assign(base, {
    duelRunning:true,
    beat: BEATS[DUEL.beat] ? BEATS[DUEL.beat].k : 'done',
    dragonPhase: g ? g.phase : 'staying on the roost',
    usingBreath: g ? g.kind : '—',
    push: +(DUEL.push||0).toFixed(2),
    villainPower: +(DUEL.vpow||0).toFixed(2),
    helpedYet: !!DUEL.dragonHelped,
  });
};
