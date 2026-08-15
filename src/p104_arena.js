/* =====================================================================
   TWO FIGHTERS OVER THE FARM, AND SWITCHES FOR BOTH BUTTONS

   Asked for: a settings toggle for the fox button, and a second button
   that stages a fight between two powerful characters - flight, energy
   attacks, a beam finisher, a building or two levelled, and points
   towards summoning a dragon.

   ON THE LIKENESS. The fighters here are original: six characters of my
   own in the shared vocabulary of the genre - spiky hair, coloured aura,
   ki blasts, a beam struggle, a named finishing move. They are not drawn
   as recognisable versions of anybody's characters, and the finisher has
   its own name, because this game is published on a public site and
   copying protected character designs is the one part of this that would
   put the author at risk. Everything else asked for is here.

   THE FIGHT IS STAGED, NOT SIMULATED, AND THAT IS DELIBERATE. A duel
   nobody can influence is a cutscene, and a cutscene wants choreography
   rather than physics. It runs as a sequence of beats with real timing -
   stare-down, clash, a knockback that lands somewhere, blasts traded,
   the beam struggle, the finish - so it reads the same every time while
   the fighters, colours and the building that gets flattened change.

   WHAT IT COSTS THE FARM. The loser goes through one or two buildings on
   the way down, and they are genuinely destroyed - refunded at half, and
   never the house, never the hub. That is the price of the spectacle and
   it is why the button is a choice rather than free entertainment.

   No filters are used anywhere in this: feGaussianBlur in the scene layer
   took this game from 121fps to 15 once. Auras and beams are stacked
   translucent shapes and animated with CSS transforms only.
   ===================================================================== */

/* ---------- the switches ---------- */
(function arenaSettings(){
  if(typeof SETTINGS === 'undefined') return;
  const add = (k, n, d, def)=>{
    if(SETTINGS.some(o=>o.k===k)) return;
    const i = SETTINGS.findIndex(o=>o.g==='Display');
    SETTINGS.splice(i < 0 ? 0 : i+1, 0, { g:'Display', k, n, t:'bool', def, d });
  };
  add('foxBtn',   'Wildlife button',
      'Shows the fox button by the zoom controls, for calling wildlife onto the land.', true);
  add('duelBtn',  'Champions button',
      'Shows the duel button. Two champions fight over your land — spectacular, and it costs you a building or two.', false);
})();

/* the buttons obey the switches, and appear the moment one is turned on */
function syncWorldButtons(){
  const host = document.getElementById('zoomctl');
  if(!host) return;
  const fox = document.getElementById('summonbtn');
  if(fox) fox.style.display = SET('foxBtn') ? '' : 'none';

  let duel = document.getElementById('duelbtn');
  if(!duel){
    duel = document.createElement('button');
    duel.id = 'duelbtn';
    duel.textContent = '⚡';
    duel.title = 'Two champions fight over your land';
    duel.setAttribute('data-tip','<b>Champions</b>Two fighters come down over the farm and settle it. Spectacular — and one or two buildings will not survive it. Earns dragon marks.');
    duel.onclick = ()=>G.startDuel();
    host.insertBefore(duel, host.firstChild);
  }
  duel.style.display = SET('duelBtn') ? '' : 'none';
}
if(typeof setOpt === 'function'){
  const _setOptArena = setOpt;
  setOpt = function(){ const r = _setOptArena.apply(this, arguments);
    try{ syncWorldButtons(); }catch(e){} return r; };
}
setTimeout(syncWorldButtons, 700);
setTimeout(syncWorldButtons, 2200);
if(typeof ui === 'function'){
  const _uiArena = ui;
  ui = function(){ const r = _uiArena.apply(this, arguments);
    try{ syncWorldButtons(); }catch(e){} return r; };
}

/* ---------- the champions ---------- */
const FIGHTERS = [
  {id:'kaide',  n:'Kaide',   hair:'#f2d24b', aura:'#ffd84a', gi:'#e2603a', trim:'#2f5fa8', beam:'#7fd4ff', cry:'HAAAA!'},
  {id:'vorrin', n:'Vorrin',  hair:'#2b2f3a', aura:'#6f4ad8', gi:'#2f3a4a', trim:'#c9a24a', beam:'#b07cff', cry:'ENOUGH!'},
  {id:'senna',  n:'Senna',   hair:'#e05a8a', aura:'#ff6fa8', gi:'#f0e6e0', trim:'#8a4a6a', beam:'#ff8fc4', cry:'HYAA!'},
  {id:'gral',   n:'Gral',    hair:'#4ad2c0', aura:'#38e0c4', gi:'#2a4a52', trim:'#d8e8e4', beam:'#7fffe4', cry:'RRAAH!'},
  {id:'okane',  n:'Okane',   hair:'#f0f0f0', aura:'#eaf4ff', gi:'#3a3f52', trim:'#9fb6d8', beam:'#dff0ff', cry:'HAH!'},
  {id:'zubaal', n:'Zubaal',  hair:'#c8442f', aura:'#ff6a3a', gi:'#4a2a2a', trim:'#e8c24a', beam:'#ff9a4a', cry:'BURN!'},
];

/* ---------- state ---------- */
let DUEL = null;
function duelActive(){ return !!(DUEL && !DUEL.over); }

function duelInit(){ if(S.marks === undefined) S.marks = 0; }

/* buildings that may be flattened: never the house, never the hub */
function duelTargets(){
  return (S.objs || []).filter(o=>{
    const bp = BPMAP[o.bp]; if(!bp) return false;
    if(['home','hub'].includes(bp.kind)) return false;
    if(bp.kind === 'decor') return false;
    return true;
  });
}

/* ---------- the beats ----------
   Each is a duration and what happens when it starts. Timing is what
   makes a staged fight read, so these are tuned rather than random. */
const BEATS = [
  {k:'arrive',  t:1.6},
  {k:'stare',   t:1.1},
  {k:'clash',   t:1.5},
  {k:'knock',   t:1.2},
  {k:'blasts',  t:2.0},
  {k:'rise',    t:1.2},
  {k:'charge',  t:2.2},
  {k:'beam',    t:2.4},
  {k:'struggle',t:2.0},
  {k:'finish',  t:1.8},
  {k:'settle',  t:1.6},
];

G.startDuel = function(){
  if(duelActive()){ if(typeof toast==='function') toast('They are already at it', 'bad'); return; }
  duelInit();
  const pool = FIGHTERS.slice();
  const a = pool.splice(Math.floor(Math.random()*pool.length), 1)[0];
  const b = pool.splice(Math.floor(Math.random()*pool.length), 1)[0];
  const cx = (FARM.x + FARM.w/2)*T, cy = (FARM.y + FARM.h/2)*T;
  const hero = Math.random() < 0.5 ? a : b;
  const villain = hero === a ? b : a;

  const wrecks = duelTargets();
  const doomed = [];
  const howMany = wrecks.length > 3 ? (Math.random() < 0.5 ? 1 : 2) : Math.min(1, wrecks.length);
  for(let i=0;i<howMany && wrecks.length;i++)
    doomed.push(wrecks.splice(Math.floor(Math.random()*wrecks.length), 1)[0]);

  DUEL = {
    hero, villain, doomed, over:false,
    beat:0, bt:0, t:0,
    cx, cy,
    hx: cx - 110, hy: cy - 40, vx: cx + 110, vy: cy - 40,
    hpow:0, vpow:0, shake:0, flash:0, beamK:0, push:0,
    fx: [],
  };
  if(typeof log === 'function')
    log(`${hero.n} and ${villain.n} came down over the farm.`, 'bad', 'farm');
  if(typeof toast === 'function') toast(`${hero.n} vs ${villain.n}`, 'bad');
  if(S.speed === 0 && typeof G.setSpeed === 'function') try{ G.setSpeed(1); }catch(e){}
  duelLayer();
};

/* ---------- layers ---------- */
function duelLayer(){
  let g = document.getElementById('duellay');
  if(!g){
    const fg = document.getElementById('fg');
    if(!fg) return null;
    g = document.createElementNS('http://www.w3.org/2000/svg','g');
    g.id = 'duellay';
    g.setAttribute('pointer-events','none');
    fg.appendChild(g);
  }
  return g;
}

/* ---------- drawing a fighter ---------- */
function fighterArt(f, powr, pose){
  const a = f.aura;
  let s = '';
  /* aura: stacked translucent shapes, no filters */
  if(powr > 0.05){
    const k = Math.min(1, powr);
    s += `<ellipse cx="0" cy="-9" rx="${n(13+10*k)}" ry="${n(19+14*k)}" fill="${a}" opacity="${(0.13*k).toFixed(3)}"/>`;
    s += `<ellipse cx="0" cy="-9" rx="${n(9+7*k)}" ry="${n(14+10*k)}" fill="${a}" opacity="${(0.20*k).toFixed(3)}"/>`;
    /* flame tongues licking upward */
    for(let i=0;i<5;i++){
      const dx0 = (i-2)*4.2, h0 = 12 + 12*k + (i%2)*6;
      s += `<path class="aflame" d="M${n(dx0-2.4)} -6 Q${n(dx0)} ${n(-6-h0*0.6)} ${n(dx0)} ${n(-6-h0)}
        Q${n(dx0)} ${n(-6-h0*0.6)} ${n(dx0+2.4)} -6 Z" fill="${a}" opacity="${(0.30*k).toFixed(2)}"
        style="--i:${i}"/>`;
    }
  }
  /* shadow */
  s += `<ellipse cx="1" cy="2" rx="7" ry="2.6" fill="#16240c" opacity=".26"/>`;
  /* legs */
  s += `<path d="M-3.2 -1 L-3.6 -10 M3.2 -1 L3.6 -10" stroke="${f.gi}" stroke-width="4.2" stroke-linecap="round" fill="none"/>`;
  s += `<rect x="-5.4" y="-2.6" width="10.8" height="2.6" rx="1" fill="#2a2f36"/>`;
  /* gi */
  s += `<path d="M-6 -22 Q0 -25 6 -22 L5 -9 Q0 -7.4 -5 -9 Z" fill="${f.gi}"/>`;
  s += `<path d="M-6 -22 Q0 -25 6 -22 L4.4 -18 Q0 -20.4 -4.4 -18 Z" fill="#ffffff" opacity=".18"/>`;
  s += `<path d="M-2.2 -24 L0 -12 L2.2 -24" stroke="${f.trim}" stroke-width="1.5" fill="none"/>`;
  s += `<rect x="-5.6" y="-11.4" width="11.2" height="2.8" rx="1" fill="${f.trim}"/>`;
  /* arms, by pose */
  if(pose === 'charge' || pose === 'beam'){
    s += `<path d="M-5.6 -20 L-13 -14 M5.6 -20 L13 -14" stroke="${f.gi}" stroke-width="4" stroke-linecap="round" fill="none"/>`;
    s += `<circle cx="-13.6" cy="-13.6" r="2.6" fill="#e8c9a8"/><circle cx="13.6" cy="-13.6" r="2.6" fill="#e8c9a8"/>`;
  } else if(pose === 'punch'){
    s += `<path d="M-5.6 -20 L-11 -22 M5.6 -20 L15 -19" stroke="${f.gi}" stroke-width="4" stroke-linecap="round" fill="none"/>`;
    s += `<circle cx="16" cy="-19" r="3" fill="#e8c9a8"/>`;
  } else {
    s += `<path d="M-5.6 -20 L-10.4 -12 M5.6 -20 L10.4 -12" stroke="${f.gi}" stroke-width="4" stroke-linecap="round" fill="none"/>`;
    s += `<circle cx="-10.8" cy="-11.4" r="2.5" fill="#e8c9a8"/><circle cx="10.8" cy="-11.4" r="2.5" fill="#e8c9a8"/>`;
  }
  /* head */
  s += `<circle cx="0" cy="-28" r="5.6" fill="#f0cfae"/>`;
  s += `<path d="M-5.6 -29 Q0 -31.6 5.6 -29 L5.2 -31 Q0 -33.4 -5.2 -31 Z" fill="#e0bb96"/>`;
  /* eyes, sharper the angrier */
  s += `<path d="M-3.4 -28.4 L-1.2 -27.8 M3.4 -28.4 L1.2 -27.8" stroke="#2a2118" stroke-width="1.1" stroke-linecap="round"/>`;
  /* spiked hair, the genre's one unmistakable silhouette */
  const spikes = [[-6.2,-30,-9.6,-40],[-3.4,-32.6,-4.6,-44],[0,-33.4,0.4,-46],
                  [3.4,-32.6,5.2,-44],[6.2,-30,9.8,-39.4]];
  let hp = `M-6.4 -28.6 `;
  spikes.forEach(([x1,y1,x2,y2])=>{ hp += `L${n(x1)} ${n(y1)} L${n(x2)} ${n(y2)} `; });
  hp += `L6.4 -28.6 Q0 -34.4 -6.4 -28.6 Z`;
  s += `<path d="${hp}" fill="${f.hair}"/>`;
  s += `<path d="${hp}" fill="#ffffff" opacity="${powr>0.4?'.30':'.12'}"/>`;
  return s;
}

/* ---------- effects ---------- */
function boom(x, y, c, big){
  if(!DUEL) return;
  DUEL.fx.push({ t:0, life: big?0.9:0.5, x, y, c, r: big?18:8, big:!!big });
}
function fxArt(){
  if(!DUEL) return '';
  let s = '';
  DUEL.fx.forEach(f=>{
    const k = f.t / f.life;
    if(k > 1) return;
    const r = f.r * (0.4 + k*1.9);
    const o = (1-k);
    s += `<circle cx="${n(f.x)}" cy="${n(f.y)}" r="${n(r)}" fill="${f.c}" opacity="${(0.42*o).toFixed(3)}"/>`;
    s += `<circle cx="${n(f.x)}" cy="${n(f.y)}" r="${n(r*0.6)}" fill="#ffffff" opacity="${(0.55*o).toFixed(3)}"/>`;
    if(f.big){
      for(let i=0;i<8;i++){
        const a0 = i*Math.PI/4, rr = r*1.5;
        s += `<line x1="${n(f.x+Math.cos(a0)*r*0.5)}" y1="${n(f.y+Math.sin(a0)*r*0.5)}"
          x2="${n(f.x+Math.cos(a0)*rr)}" y2="${n(f.y+Math.sin(a0)*rr)}"
          stroke="${f.c}" stroke-opacity="${(0.5*o).toFixed(2)}" stroke-width="${n(3*o+0.6)}" stroke-linecap="round"/>`;
      }
    }
  });
  return s;
}

/* the beam: layered strokes, brightest in the middle */
function beamArt(x1, y1, x2, y2, colour, k, push){
  const w0 = 4 + 26*k;
  let s = '';
  s += `<line x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}" stroke="${colour}"
    stroke-opacity=".26" stroke-width="${n(w0*1.9)}" stroke-linecap="round"/>`;
  s += `<line x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}" stroke="${colour}"
    stroke-opacity=".55" stroke-width="${n(w0)}" stroke-linecap="round"/>`;
  s += `<line x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}" stroke="#ffffff"
    stroke-opacity=".92" stroke-width="${n(w0*0.42)}" stroke-linecap="round"/>`;
  /* the collision ball where the two meet */
  if(push !== undefined){
    const mx = x1 + (x2-x1)*push, my = y1 + (y2-y1)*push;
    s += `<circle cx="${n(mx)}" cy="${n(my)}" r="${n(12+18*k)}" fill="${colour}" opacity=".34"/>`;
    s += `<circle cx="${n(mx)}" cy="${n(my)}" r="${n(7+11*k)}" fill="#ffffff" opacity=".85"/>`;
    for(let i=0;i<10;i++){
      const a0 = (i/10)*Math.PI*2, rr = 18+26*k;
      s += `<line x1="${n(mx+Math.cos(a0)*(9+9*k))}" y1="${n(my+Math.sin(a0)*(9+9*k))}"
        x2="${n(mx+Math.cos(a0)*rr)}" y2="${n(my+Math.sin(a0)*rr)}"
        stroke="${colour}" stroke-opacity=".55" stroke-width="2" stroke-linecap="round"/>`;
    }
  }
  return s;
}

/* ---------- the tick ---------- */
function duelTick(dt){
  if(!duelActive()) return;
  const D = DUEL;
  D.t += dt; D.bt += dt;
  const beat = BEATS[D.beat];
  if(!beat){ duelEnd(); return; }
  const p = Math.min(1, D.bt / beat.t);            /* progress within the beat */

  D.fx.forEach(f=>f.t += dt);
  D.fx = D.fx.filter(f=>f.t < f.life);
  D.shake = Math.max(0, D.shake - dt*2.2);
  D.flash = Math.max(0, D.flash - dt*3.2);

  const cx = D.cx, cy = D.cy;
  switch(beat.k){
    case 'arrive':
      D.hy = cy - 40 - (1-p)*260; D.vy = cy - 40 - (1-p)*260;
      D.hpow = D.vpow = 0.25*p;
      break;
    case 'stare':
      D.hpow = D.vpow = 0.3 + 0.1*Math.sin(D.t*7);
      break;
    case 'clash': {
      /* they meet in the middle repeatedly */
      const k = Math.sin(p*Math.PI*3);
      D.hx = cx - 110 + k*95; D.vx = cx + 110 - k*95;
      D.pose = 'punch';
      if(Math.random() < dt*9){
        boom((D.hx+D.vx)/2, cy-46, '#ffffff');
        D.shake = 0.5;
      }
      break;
    }
    case 'knock': {
      /* the loser is driven back and through something */
      const tgt = D.doomed[0];
      if(tgt && !D.wrecked1){
        const f = footprint(BPMAP[tgt.bp], tgt.rot);
        const tx = (tgt.tx + f.w/2)*T, ty = (tgt.ty + f.h/2)*T;
        D.vx += (tx - D.vx) * Math.min(1, dt*3.4);
        D.vy += (ty - 30 - D.vy) * Math.min(1, dt*3.4);
        if(p > 0.75){ wreck(tgt); D.wrecked1 = 1; D.shake = 1; D.flash = 0.6; }
      }
      D.pose = null;
      break;
    }
    case 'blasts': {
      D.hx += ((cx-120) - D.hx)*Math.min(1,dt*3);
      D.vx += ((cx+120) - D.vx)*Math.min(1,dt*3);
      D.vy += ((cy-46) - D.vy)*Math.min(1,dt*3);
      D.hy += ((cy-46) - D.hy)*Math.min(1,dt*3);
      if(Math.random() < dt*7){
        const fromH = Math.random() < 0.5;
        const sx = fromH ? D.hx+14 : D.vx-14;
        const ex = fromH ? D.vx-10 : D.hx+10;
        boom(ex + (Math.random()-0.5)*26, cy-46+(Math.random()-0.5)*22,
             fromH ? D.hero.beam : D.villain.beam);
        D.shake = 0.35;
      }
      D.hpow = D.vpow = 0.5;
      break;
    }
    case 'rise':
      D.hpow = 0.5 + 0.5*p; D.vpow = 0.5 + 0.4*p;
      D.hy = cy - 46 - p*26; D.vy = cy - 46 - p*20;
      break;
    case 'charge':
      D.hpow = 1; D.vpow = 0.9;
      D.pose = 'charge';
      if(p > 0.5 && !D.cried){
        D.cried = 1;
        if(typeof log === 'function') log(`${D.hero.n}: "${D.hero.cry}"`, '', 'farm');
      }
      break;
    case 'beam':
      D.pose = 'beam';
      D.beamK = p;
      D.push = 0.5;
      break;
    case 'struggle':
      D.pose = 'beam';
      D.beamK = 1;
      /* the hero pushes through, with a wobble so it is not a slide */
      D.push = 0.5 + p*0.42 + Math.sin(p*Math.PI*5)*0.05*(1-p);
      D.shake = 0.4;
      break;
    case 'finish': {
      D.pose = 'beam'; D.beamK = 1; D.push = 0.96;
      if(!D.finished && p > 0.25){
        D.finished = 1;
        boom(D.vx, D.vy - 14, D.hero.beam, true);
        D.shake = 1.2; D.flash = 1;
        const tgt = D.doomed[1];
        if(tgt) wreck(tgt);
        if(typeof log === 'function')
          log(`${D.hero.n} finished it — ${D.villain.n} is gone.`, 'good', 'farm');
      }
      break;
    }
    case 'settle':
      D.beamK = Math.max(0, D.beamK - dt*2);
      D.hpow = Math.max(0, D.hpow - dt*0.7);
      D.hy += ((cy-30) - D.hy)*Math.min(1,dt*2.4);
      break;
  }

  if(D.bt >= beat.t){ D.beat++; D.bt = 0; if(D.beat >= BEATS.length){ duelEnd(); return; } }
  duelPaint();
}

/* levelling a building, for real */
function wreck(o){
  if(!o) return;
  const bp = BPMAP[o.bp]; if(!bp) return;
  const f = footprint(bp, o.rot);
  const x = (o.tx + f.w/2)*T, y = (o.ty + f.h/2)*T;
  boom(x, y, '#ffb46a', true);
  for(let i=0;i<10;i++) boom(x + (Math.random()-0.5)*f.w*T, y + (Math.random()-0.5)*f.h*T, '#c9a882');
  const back = Math.round((bp.cost||0) * 0.5);
  S.cash += back;
  S.objs = (S.objs||[]).filter(z=>z !== o);
  if(typeof log === 'function')
    log(`The ${bp.name.toLowerCase()} was levelled. Salvage ${fmt(back)}.`, 'bad', 'money');
  if(typeof render === 'function') try{ render(); }catch(e){}
}

function duelPaint(){
  const g = duelLayer(); if(!g || !DUEL) return;
  const D = DUEL;
  const sh = D.shake > 0 ? `translate(${n((Math.random()-0.5)*D.shake*5)},${n((Math.random()-0.5)*D.shake*5)})` : '';
  let s = `<g transform="${sh}">`;

  /* ground glare under a big power-up */
  if(D.hpow > 0.6)
    s += `<ellipse cx="${n(D.hx)}" cy="${n(D.hy+2)}" rx="${n(40*D.hpow)}" ry="${n(15*D.hpow)}"
      fill="${D.hero.aura}" opacity="${(0.16*D.hpow).toFixed(3)}"/>`;

  /* the beam, hero to villain */
  if(D.beamK > 0.02){
    s += beamArt(D.hx+16, D.hy-14, D.vx-16, D.vy-14, D.hero.beam, D.beamK,
                 D.push !== undefined ? D.push : undefined);
    if(D.beat < BEATS.findIndex(b=>b.k==='finish'))
      s += beamArt(D.vx-16, D.vy-14, D.hx+16, D.hy-14, D.villain.beam, D.beamK*0.8);
  }

  s += fxArt();

  const dead = D.finished;
  s += `<g transform="translate(${n(D.hx)},${n(D.hy)})">${fighterArt(D.hero, D.hpow, D.pose)}</g>`;
  if(!dead)
    s += `<g transform="translate(${n(D.vx)},${n(D.vy)}) scale(-1,1)">${fighterArt(D.villain, D.vpow, D.pose==='beam'?'beam':D.pose)}</g>`;

  s += `</g>`;
  if(D.flash > 0.01)
    s += `<rect x="${n((FARM.x-2)*T)}" y="${n((FARM.y-2)*T)}" width="${n((FARM.w+4)*T)}" height="${n((FARM.h+4)*T)}"
      fill="#ffffff" opacity="${(D.flash*0.55).toFixed(3)}"/>`;
  g.innerHTML = s;
}

function duelEnd(){
  if(!DUEL || DUEL.over) return;
  DUEL.over = true;
  const g = document.getElementById('duellay'); if(g) g.innerHTML = '';
  duelInit();
  const won = 3 + Math.floor(Math.random()*3);
  S.marks = (S.marks || 0) + won;
  if(typeof log === 'function')
    log(`${DUEL.hero.n} left you ${won} dragon mark${won>1?'s':''}. You have ${S.marks}.`, 'good', 'farm');
  if(typeof toast === 'function') toast(`+${won} dragon marks (${S.marks})`, 'good');
  if(typeof save === 'function') try{ save(); }catch(e){}
  if(typeof ui === 'function') try{ ui(); }catch(e){}
  DUEL = null;
}

/* ---------- run it off the shared tick ---------- */
if(typeof tickPeople === 'function'){
  const _tickPeopleDuel = tickPeople;
  tickPeople = function(dt){
    const r = _tickPeopleDuel.apply(this, arguments);
    try{ duelTick(typeof dt === 'number' ? Math.min(0.08, dt) : 0.05); }catch(e){}
    return r;
  };
}

(function duelCss(){
  const s = document.createElement('style');
  s.textContent = `
  #duellay .aflame{ animation: aflick .42s ease-in-out infinite alternate;
    animation-delay: calc(var(--i) * .07s); transform-origin: center bottom; }
  @keyframes aflick{ from{ transform: scaleY(.82) } to{ transform: scaleY(1.16) } }
  @media (prefers-reduced-motion: reduce){ #duellay .aflame{ animation:none } }
  `;
  document.head.appendChild(s);
})();

/* ---------- handle ---------- */
G.duelAudit = function(){
  return {
    foxButton: SET('foxBtn') ? 'on' : 'off',
    duelButton: SET('duelBtn') ? 'on' : 'off',
    marks: S.marks || 0,
    running: duelActive(),
    beat: duelActive() ? BEATS[DUEL.beat].k : '—',
    fighters: duelActive() ? `${DUEL.hero.n} vs ${DUEL.villain.n}` : '—',
    roster: FIGHTERS.map(f=>f.n),
    destructible: duelTargets().length + ' buildings could be hit (never the house or hub)',
  };
};
