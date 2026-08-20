/* =====================================================================
   THE WYRMS HAD NO SKY, AND NOT ENOUGH TEMPER

   Reported: the farm is still visible behind the two wyrms. It was, and
   the reason is a single line in p109.

   p109 replaced p107's arena backdrop with one that draws the mountain
   range, and it opens `if(!DUEL) return ''` — DUEL being the champions'
   fight. The wyrm duel is its own state and never sets that, so every
   call to arenaArt from p141 returned an empty string. Measured: zero
   bytes. There has been no sky, no ground and no horizon behind the
   dragons since the day they were added — only the farm, showing through
   a fight that was drawing nothing behind itself.

   So the wyrms get their own backdrop, built from the same pieces: a
   graded sky, the peak range they are allowed to knock down, and a ground
   plane. And because #bg is a sibling of #fg rather than a child, the
   shroud that hides the farm layers never covered the terrain either —
   that is hidden for the duration now as well.

   THEN THE FIGHT ITSELF. Four elements that were a colour and a name are
   now four ways of fighting, each with a signature nobody else has:

     fire    a firestorm — meteors come down across the whole arena
     frost   the air freezes; shards form in a ring and fire inward
     storm   lightning, struck from above, with the flash before the bolt
     venom   a corrosive cloud that spreads and eats what it touches

   Plus a shockwave on every heavy landing, a stagger when a blow really
   lands, a last stand where a wyrm under a quarter health flares and
   fights harder, and the finish held in slow motion.

   The abilities are not decoration: the signature costs the user real
   damage and the last stand really does raise the damage of the wyrm
   that is losing, which is what makes the fifth fight in five worth
   watching.
   ===================================================================== */

/* ---------- 1. a sky of their own ---------- */
function wyrmBackdrop(){
  if(!DD || !DD.arena) return '';
  const A = DD.arena;
  const x = -T*2, y = -T*2, w = WPX + T*4, h = HPX + T*4;
  const gid = 'gWyrmSky';
  const k = DD.fade;
  let s = `<g opacity="${k.toFixed(3)}">`;
  s += `<defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${A.sky[0]}"/>
    <stop offset="0.52" stop-color="${A.sky[1]}"/>
    <stop offset="1" stop-color="${A.sky[2]}"/></linearGradient></defs>`;
  s += `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" fill="url(#${gid})"/>`;
  /* the range, with whatever has already been knocked out of it */
  if(DD.peaks && typeof peaksArt === 'function'){
    try{ s += peaksArt(DD.peaks, A); }catch(e){}
  }
  /* ground plane, cracked */
  const hz = y + h*0.46;
  s += `<rect x="${n(x)}" y="${n(hz)}" width="${n(w)}" height="${n(h - (hz - y))}" fill="${A.ground}"/>`;
  s += `<rect x="${n(x)}" y="${n(hz)}" width="${n(w)}" height="3" fill="#000" opacity=".25"/>`;
  for(let i=0;i<9;i++){
    const cx = x + w*hash(i*4.1), cy = hz + (h-(hz-y))*hash(i*7.7)*0.9;
    s += `<path d="M${n(cx)} ${n(cy)} l${n(24+hash(i)*40)} ${n(6-hash(i*2)*12)}"
      stroke="${A.rock}" stroke-width="1.4" opacity=".5" fill="none"/>`;
  }
  return s + `</g>`;
}

/* ---------- 2. supernatural abilities ---------- */
const WYRM_ABIL = {
  fire:  { n:'Firestorm',    say:'The sky opens and comes down burning.' },
  frost: { n:'Rimefall',     say:'The air goes hard and turns to blades.' },
  storm: { n:'Skybreak',     say:'It pulls the lightning down on top of them.' },
  venom: { n:'Blightcloud',  say:'Everything the cloud touches goes black.' },
};
function ddFx(){ if(!DD.fx) DD.fx = []; return DD.fx; }

function unleash(w, target){
  const fx = ddFx();
  const ab = WYRM_ABIL[w.elem];
  DD.flash = 1; DD.shake = 1.2;
  if(w.elem === 'fire'){
    for(let i=0;i<14;i++)
      fx.push({ k:'meteor', t:0, life:1.6, d:i*0.06,
        x: WPX*0.1 + Math.random()*WPX*0.8, y: -60 - Math.random()*120,
        vx: 40 + Math.random()*60, vy: 320 + Math.random()*180, c:w.el.c, c2:w.el.c2 });
  }
  if(w.elem === 'frost'){
    for(let i=0;i<16;i++){
      const a = (i/16)*Math.PI*2;
      fx.push({ k:'shard', t:0, life:1.5, d:i*0.03, a,
        x: target.x + Math.cos(a)*230, y: target.y + Math.sin(a)*150,
        tx: target.x, ty: target.y, c:w.el.c, c2:w.el.c2 });
    }
  }
  if(w.elem === 'storm'){
    for(let i=0;i<6;i++)
      fx.push({ k:'bolt', t:0, life:1.3, d:i*0.16,
        x: target.x + (Math.random()-0.5)*300, y: target.y + (Math.random()-0.5)*120,
        c:w.el.c, c2:w.el.c2 });
  }
  if(w.elem === 'venom'){
    for(let i=0;i<10;i++)
      fx.push({ k:'blight', t:0, life:2.4, d:i*0.08,
        x: target.x + (Math.random()-0.5)*180, y: target.y + (Math.random()-0.5)*110,
        r: 14 + Math.random()*26, c:w.el.c, c2:w.el.c2 });
  }
  /* it is a real hit, not a light show */
  const dmg = 16 + Math.max(0, (w.power - target.power)/6);
  target.hp = Math.max(0, target.hp - dmg);
  target.hurt = 0.8;
  if(typeof log === 'function')
    log(`${w.name}: ${ab.n}. ${ab.say}`, 'bad', 'farm');
  try{ sfx('quake'); }catch(e){}
  return ab;
}

function fxTick(dt){
  const fx = ddFx();
  fx.forEach(f=>{
    if(f.d > 0){ f.d -= dt; return; }
    f.t += dt;
    if(f.k === 'meteor'){ f.x += f.vx*dt; f.y += f.vy*dt; }
    if(f.k === 'shard'){
      const p = Math.min(1, f.t/0.5);
      f.x += (f.tx - f.x) * p * 0.28;
      f.y += (f.ty - f.y) * p * 0.28;
    }
  });
  DD.fx = fx.filter(f=>f.d > 0 || f.t < f.life);
}
function fxArt(){
  const fx = ddFx();
  let s = '';
  fx.forEach(f=>{
    if(f.d > 0) return;
    const k = Math.min(1, f.t/f.life);
    const fade = (1 - k).toFixed(2);
    if(f.k === 'meteor'){
      s += `<path d="M${n(f.x)} ${n(f.y)} l${n(-f.vx*0.13)} ${n(-f.vy*0.13)}"
        stroke="${f.c2}" stroke-width="3.4" opacity="${fade}" stroke-linecap="round"/>`;
      s += `<circle cx="${n(f.x)}" cy="${n(f.y)}" r="${n(5+k*3)}" fill="${f.c}" opacity="${fade}"/>`;
      s += `<circle cx="${n(f.x)}" cy="${n(f.y)}" r="2.4" fill="#fff" opacity="${fade}"/>`;
    }
    if(f.k === 'shard'){
      const ang = (f.a*180/Math.PI).toFixed(0);
      s += `<g transform="translate(${n(f.x)},${n(f.y)}) rotate(${ang})" opacity="${fade}">
        <path d="M-14 0 L2 -4 L14 0 L2 4 Z" fill="${f.c2}"/>
        <path d="M-8 0 L2 -2 L10 0 L2 2 Z" fill="#fff" opacity=".7"/></g>`;
    }
    if(f.k === 'bolt'){
      if(f.t < 0.12){
        s += `<rect x="${n(-T*2)}" y="${n(-T*2)}" width="${n(WPX+T*4)}" height="${n(HPX+T*4)}"
          fill="${f.c2}" opacity="${(0.30*(1-f.t/0.12)).toFixed(2)}"/>`;
      } else {
        let d = `M${n(f.x)} ${n(-T*2)}`;
        let yy = -T*2;
        while(yy < f.y){ yy += 40 + Math.random()*30;
          d += ` L${n(f.x + (Math.random()-0.5)*44)} ${n(Math.min(yy, f.y))}`; }
        s += `<path d="${d}" stroke="${f.c2}" stroke-width="4" fill="none" opacity="${fade}"/>`;
        s += `<path d="${d}" stroke="#fff" stroke-width="1.6" fill="none" opacity="${fade}"/>`;
        s += `<circle cx="${n(f.x)}" cy="${n(f.y)}" r="${n(16+k*40)}" fill="${f.c}"
          opacity="${(0.4*(1-k)).toFixed(2)}"/>`;
      }
    }
    if(f.k === 'blight'){
      const r = f.r * (1 + k*1.5);
      s += `<circle cx="${n(f.x)}" cy="${n(f.y)}" r="${n(r)}" fill="${f.c}"
        opacity="${(0.34*(1-k)).toFixed(2)}"/>`;
      s += `<circle cx="${n(f.x)}" cy="${n(f.y)}" r="${n(r*0.55)}" fill="${f.c2}"
        opacity="${(0.26*(1-k)).toFixed(2)}"/>`;
    }
  });
  /* shockwave rings from heavy landings */
  (DD.rings || []).forEach(r=>{
    const k = r.t/r.life;
    s += `<ellipse cx="${n(r.x)}" cy="${n(r.y)}" rx="${n(r.r)}" ry="${n(r.r*0.34)}"
      fill="none" stroke="#fff" stroke-width="${n(3*(1-k))}" opacity="${(0.5*(1-k)).toFixed(2)}"/>`;
  });
  return s;
}
function ringAt(x, y){
  if(!DD.rings) DD.rings = [];
  DD.rings.push({ x, y, r:8, life:0.9, t:0 });
}

/* ---------- 3. hook it into the fight ---------- */
if(typeof ddBeatStart === 'function'){
  const _beatBase = ddBeatStart;
  ddBeatStart = function(k){
    const r = _beatBase.apply(this, arguments);
    try{
      const A = DD.a, B = DD.b;
      /* each unleashes its signature once, on the burn and on the slam */
      if(k === 'burn'){ DD.abilA = unleash(A, B); }
      if(k === 'slam'){ DD.abilB = unleash(B, A); ringAt(A.x, A.y + 60); ringAt(B.x, B.y + 60); }
      if(k === 'fall'){ ringAt((A.x+B.x)/2, (A.y+B.y)/2 + 40); }
      /* a wyrm on its last legs stops being careful */
      [A, B].forEach(w=>{
        if(w.hp < 25 && !w.lastStand){
          w.lastStand = 1;
          w.power = Math.round(w.power * 1.22);
          DD.flash = Math.max(DD.flash, 0.8);
          if(typeof log === 'function')
            log(`${w.name} is badly hurt and has stopped being careful.`, 'bad', 'farm');
        }
      });
    }catch(e){}
    return r;
  };
}
if(typeof ddTick === 'function'){
  const _tickBase = ddTick;
  ddTick = function(dt){
    const r = _tickBase.apply(this, arguments);
    try{
      if(!DD || DD.over) return r;
      /* the finish runs slow, because it should */
      const beat = DD_BEATS[DD.bi] ? DD_BEATS[DD.bi].k : '';
      const scale = beat === 'finish' ? 0.45 : 1;
      fxTick(dt*scale);
      (DD.rings || []).forEach(x=>{ x.t += dt; x.r += dt*260; });
      DD.rings = (DD.rings || []).filter(x=>x.t < x.life);
    }catch(e){}
    return r;
  };
}
/* the backdrop and the effects go in around p141's own drawing */
if(typeof ddPaint === 'function'){
  const _paintBase = ddPaint;
  ddPaint = function(){
    const r = _paintBase.apply(this, arguments);
    try{
      const g = document.getElementById('ddlay');
      if(!g || !DD || DD.over) return r;
      const inner = g.innerHTML;
      const sh = DD.shake;
      const ox = (Math.random()-0.5)*14*sh, oy = (Math.random()-0.5)*10*sh;
      g.innerHTML = `<g transform="translate(${n(ox)},${n(oy)})">${wyrmBackdrop()}</g>`
        + inner
        + `<g transform="translate(${n(ox)},${n(oy)})">${fxArt()}</g>`;
    }catch(e){}
    return r;
  };
}

/* ---------- 4. the ground itself is hidden too ---------- */
if(typeof FARM_LAYERS !== 'undefined' && FARM_LAYERS.indexOf('bg') < 0){
  /* #bg is a sibling of #fg holding the terrain — 376 nodes of it — so the
     shroud that hides the farm's layers never touched the ground it all
     stands on. */
  FARM_LAYERS.push('bg');
}

/* ---------- handle ---------- */
G.wyrmSpectacleAudit = function(){
  if(!DD) return { running:false, note:'no wyrm duel called' };
  return {
    running: dragonDuelOn(),
    beat: DD_BEATS[DD.bi] ? DD_BEATS[DD.bi].k : 'done',
    backdropBytes: wyrmBackdrop().length,
    p109ArenaArtReturns: (()=>{ try{ return arenaArt(DD.arena,1).length; }catch(e){ return 'threw'; } })(),
    groundHidden: (()=>{ const b=document.getElementById('bg');
      return b ? b.style.display === 'none' : 'no bg'; })(),
    abilities: { a:DD.a.elem + ' — ' + WYRM_ABIL[DD.a.elem].n,
                 b:DD.b.elem + ' — ' + WYRM_ABIL[DD.b.elem].n },
    unleashed: { a:!!DD.abilA, b:!!DD.abilB },
    effectsInFlight: (DD.fx || []).length,
    shockwaves: (DD.rings || []).length,
    lastStand: [DD.a, DD.b].filter(w=>w.lastStand).map(w=>w.name),
    hp: { [DD.a.name]:Math.round(DD.a.hp), [DD.b.name]:Math.round(DD.b.hp) },
  };
};
