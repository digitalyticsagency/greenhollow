/* =====================================================================
   BLOW UP A MOUNTAIN, NOT MY SHED

   The duel was levelling one or two of your buildings per fight. That was
   the wrong price. You watch it for the spectacle; charging a hay barn
   for it turns a thing you want to look at into a thing you avoid
   clicking, and the button was already off by default because of it.

   So nothing on the farm is touched now, and the destruction moves into
   the arena where it costs nothing and can be far bigger. The horizon is
   a row of real peaks rather than a decorative silhouette: each one has a
   position, a height and a state, and when a fighter goes through one it
   comes down.

   A COLLAPSE, NOT A DISAPPEARANCE. The difference between a mountain
   being destroyed and a mountain being deleted is all in the middle
   second, so it is done in four stages that overlap:

     impact    a white flash at the point of contact
     shear     the peak splits and the top half slides
     fall      the upper mass drops and breaks into chunks that carry
               their own velocity and gravity, and bounce once
     settle    a dust wall rolls out along the ground and thins

   The stump is left standing afterwards - a mountain that has been hit
   does not vanish, it becomes a broken tooth - so by the end of a long
   fight the skyline has a history.

   Everything is stacked translucent shapes and transforms. No filters:
   feGaussianBlur in the scene layer took this game from 121fps to 15.
   ===================================================================== */

/* ---------- 1. the farm is off limits ---------- */
if(typeof duelTargets === 'function'){
  duelTargets = function(){ return []; };     /* nothing is ever doomed */
}
if(typeof wreck === 'function'){
  const _wreckBase = wreck;
  wreck = function(o){
    /* belt and braces: even if something reaches here it is refused, so a
       later change upstream cannot quietly start eating buildings again */
    return;
  };
}

/* ---------- 2. the horizon is made of real peaks ---------- */
function makePeaks(A){
  const x = -T*2, w = WPX + T*4, y = -T*2, h = HPX + T*4;
  const hz = y + h*0.46;
  const count = 9;
  const peaks = [];
  for(let i=0;i<count;i++){
    const cx = x + w*(i+0.5)/count + (hash(i*3.7)-0.5)*w*0.04;
    const pw = w/count * (0.9 + hash(i*2.1)*0.5);
    const ph = h*0.10 + hash(i*5.3)*h*0.11;
    peaks.push({ cx, pw, ph, base:hz, state:'intact', t:0, chunks:[], dust:0 });
  }
  return { peaks, hz, x, y, w, h };
}

function peakPath(p, hFrac){
  const hh = p.ph * hFrac;
  return `M${n(p.cx - p.pw/2)} ${n(p.base)} L${n(p.cx - p.pw*0.12)} ${n(p.base - hh)} `
       + `L${n(p.cx + p.pw*0.08)} ${n(p.base - hh*0.92)} L${n(p.cx + p.pw/2)} ${n(p.base)} Z`;
}

/* start one coming down */
function breakPeak(P, i, colour){
  const p = P.peaks[i];
  if(!p || p.state !== 'intact') return null;
  p.state = 'falling'; p.t = 0; p.flash = 1;
  /* the upper mass breaks into chunks with their own velocity */
  const n0 = 7 + Math.floor(Math.random()*5);
  for(let k=0;k<n0;k++){
    const a0 = -Math.PI*0.15 - Math.random()*Math.PI*0.7;
    const sp = 60 + Math.random()*150;
    p.chunks.push({
      x: p.cx + (Math.random()-0.5)*p.pw*0.5,
      y: p.base - p.ph*(0.5 + Math.random()*0.5),
      vx: Math.cos(a0)*sp, vy: Math.sin(a0)*sp,
      r: 5 + Math.random()*13, spin:(Math.random()-0.5)*300, a:0, bounced:0,
    });
  }
  return p;
}

function tickPeaks(P, dt){
  if(!P) return;
  P.peaks.forEach(p=>{
    if(p.state === 'intact') return;
    p.t += dt;
    p.flash = Math.max(0, (p.flash||0) - dt*4);
    if(p.state === 'falling' && p.t > 1.5){ p.state = 'broken'; }
    p.dust = p.state === 'falling' ? Math.min(1, p.t/0.5) : Math.max(0, p.dust - dt*0.4);
    p.chunks.forEach(c=>{
      c.vy += 520*dt;                     /* gravity */
      c.x += c.vx*dt; c.y += c.vy*dt; c.a += c.spin*dt;
      if(c.y > p.base && !c.bounced){ c.y = p.base; c.vy *= -0.34; c.vx *= 0.6; c.bounced = 1; }
      else if(c.y > p.base){ c.y = p.base; c.vy = 0; c.vx *= 0.86; }
    });
    if(p.t > 3.2) p.chunks.length = 0;
  });
}

function peaksArt(P, A){
  if(!P) return '';
  let s = '';
  /* the peaks themselves, back to front */
  P.peaks.forEach(p=>{
    if(p.state === 'intact'){
      s += `<path d="${peakPath(p,1)}" fill="${A.rock}" opacity=".92"/>`;
      s += `<path d="M${n(p.cx - p.pw*0.12)} ${n(p.base - p.ph)} L${n(p.cx + p.pw*0.08)} ${n(p.base - p.ph*0.92)} L${n(p.cx + p.pw*0.16)} ${n(p.base - p.ph*0.62)} Z"
        fill="#ffffff" opacity=".10"/>`;
    } else {
      /* the stump: a broken tooth, and it stays that way */
      const k = p.state === 'falling' ? Math.max(0.34, 1 - p.t*0.9) : 0.34;
      s += `<path d="${peakPath(p,k)}" fill="${A.rock}" opacity=".92"/>`;
      /* a jagged shear line across the break */
      const sy = p.base - p.ph*k;
      s += `<path d="M${n(p.cx-p.pw*0.30)} ${n(sy+2)} L${n(p.cx-p.pw*0.10)} ${n(sy-3)}
        L${n(p.cx+p.pw*0.06)} ${n(sy+1)} L${n(p.cx+p.pw*0.22)} ${n(sy-2)}"
        fill="none" stroke="#ffffff" stroke-opacity=".18" stroke-width="2"/>`;
    }
    /* chunks */
    p.chunks.forEach(c=>{
      s += `<g transform="translate(${n(c.x)},${n(c.y)}) rotate(${n(c.a)})">
        <path d="M${n(-c.r)} 0 L${n(-c.r*0.3)} ${n(-c.r)} L${n(c.r*0.8)} ${n(-c.r*0.4)}
          L${n(c.r*0.5)} ${n(c.r*0.7)} Z" fill="${A.rock}"/>
        <path d="M${n(-c.r*0.3)} ${n(-c.r)} L${n(c.r*0.8)} ${n(-c.r*0.4)} L${n(c.r*0.1)} ${n(-c.r*0.2)} Z"
          fill="#ffffff" opacity=".14"/></g>`;
    });
    /* the dust wall, rolling out along the ground */
    if(p.dust > 0.01){
      const spread = 40 + p.t*150;
      for(let i=0;i<5;i++){
        const dx0 = (i-2)*spread*0.34;
        s += `<ellipse cx="${n(p.cx + dx0)}" cy="${n(p.base - 6 - i*2)}"
          rx="${n(spread*0.45)}" ry="${n(20 + p.t*16)}" fill="${A.dust}"
          opacity="${(0.26*p.dust*(1-i*0.14)).toFixed(3)}"/>`;
      }
    }
    /* the impact flash */
    if(p.flash > 0.01){
      s += `<circle cx="${n(p.cx)}" cy="${n(p.base - p.ph*0.7)}" r="${n(26 + (1-p.flash)*90)}"
        fill="#ffffff" opacity="${(p.flash*0.75).toFixed(3)}"/>`;
    }
  });
  return s;
}

/* ---------- 3. replace the backdrop with the peak-aware one ---------- */
if(typeof arenaArt === 'function'){
  arenaArt = function(A, k){
    if(!DUEL) return '';
    if(!DUEL.peakset) DUEL.peakset = makePeaks(A);
    const P = DUEL.peakset;
    const gid = 'gArena_' + A.id;
    let s = `<g opacity="${k.toFixed(3)}">`;
    s += `<defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${A.sky[0]}"/>
      <stop offset="0.52" stop-color="${A.sky[1]}"/>
      <stop offset="1" stop-color="${A.sky[2]}"/></linearGradient></defs>`;
    s += `<rect x="${n(P.x)}" y="${n(P.y)}" width="${n(P.w)}" height="${n(P.h)}" fill="url(#${gid})"/>`;
    s += peaksArt(P, A);
    /* ground */
    s += `<rect x="${n(P.x)}" y="${n(P.hz)}" width="${n(P.w)}" height="${n(P.h - (P.hz - P.y))}" fill="${A.ground}"/>`;
    for(let i=0;i<12;i++){
      const cx0 = P.x + P.w*hash(i*5.3), cy0 = P.hz + (P.h-(P.hz-P.y))*hash(i*2.9);
      let d = `M${n(cx0)} ${n(cy0)}`;
      for(let j=1;j<4;j++) d += ` L${n(cx0 + (hash(i*7+j)-0.5)*160)} ${n(cy0 + hash(i*3+j)*70)}`;
      s += `<path d="${d}" fill="none" stroke="${A.rock}" stroke-opacity=".55" stroke-width="${n(1+hash(i)*2)}"/>`;
    }
    for(let i=0;i<8;i++){
      const bx = P.x + P.w*hash(i*4.7+1), by = P.hz + (P.h-(P.hz-P.y))*hash(i*6.1)*0.9;
      const r0 = 10 + hash(i*2.3)*26;
      s += `<ellipse cx="${n(bx)}" cy="${n(by)}" rx="${n(r0)}" ry="${n(r0*0.62)}" fill="${A.rock}"/>`;
    }
    for(let i=0;i<14;i++){
      const rx = P.x + P.w*hash(i*8.3+2), ry = P.y + P.h*hash(i*3.7)*0.62;
      const r0 = 3 + hash(i*5.9)*7;
      s += `<path class="arubble" d="M${n(rx)} ${n(ry)} l${n(r0)} ${n(r0*0.5)} l${n(-r0*0.4)} ${n(r0)} l${n(-r0*0.8)} ${n(-r0*0.3)} Z"
        fill="${A.rock}" opacity=".9" style="--i:${i%6}"/>`;
    }
    s += `</g>`;
    return s;
  };
}

/* ---------- 4. bring one down on the right beats ---------- */
if(typeof duelTick === 'function'){
  const _duelTickPeak = duelTick;
  duelTick = function(dt){
    const r = _duelTickPeak.apply(this, arguments);
    try{
      if(!DUEL || DUEL.over) return r;
      const P = DUEL.peakset;
      if(P) tickPeaks(P, dt);
      const beat = BEATS[DUEL.beat];
      if(!beat || !P) return r;
      const p = Math.min(1, DUEL.bt / beat.t);

      /* Knocked through one. Any heavy exchange will do it, not just
         'knock' — the middle of a fight is shuffled from a pool now, so
         gating on one beat meant most fights never brought a peak down
         until the very last blast. */
      if(['knock','clash','meteor','disc'].includes(beat.k) && p > 0.55 && !DUEL.peakHitA){
        DUEL.peakHitA = 1;
        const i = 1 + Math.floor(Math.random()*(P.peaks.length-2));
        if(breakPeak(P, i)){
          DUEL.shake = 1.1; DUEL.flash = 0.7;
          /* throw the loser at it, so the collapse has a cause on screen */
          DUEL.vx = P.peaks[i].cx; DUEL.vy = P.peaks[i].base - P.peaks[i].ph*0.5;
          if(typeof log === 'function')
            log(`${DUEL.villain.n} went through the ridge. The peak came down.`, 'bad', 'farm');
        }
      }
      /* and the beam takes the big one */
      if(beat.k === 'finish' && p > 0.30 && !DUEL.peakHitB){
        DUEL.peakHitB = 1;
        const intact = P.peaks.map((q,i)=>({q,i})).filter(o=>o.q.state==='intact');
        if(intact.length){
          const pick = intact.sort((a,b)=>b.q.ph-a.q.ph)[0];
          breakPeak(P, pick.i);
          DUEL.shake = 1.4; DUEL.flash = 1;
          if(typeof log === 'function')
            log(`The blast took the mountain with it.`, 'bad', 'farm');
        }
      }
    }catch(e){}
    return r;
  };
}

/* the fight no longer costs you anything but the noise */
if(typeof duelEnd === 'function'){
  const _duelEndPeak = duelEnd;
  duelEnd = function(){
    try{
      if(DUEL && !DUEL.over && typeof log === 'function'){
        const P = DUEL.peakset;
        const gone = P ? P.peaks.filter(q=>q.state !== 'intact').length : 0;
        if(gone) log(`${gone} peak${gone>1?'s are':' is'} missing from the skyline. Your farm is untouched.`, 'good', 'farm');
      }
    }catch(e){}
    return _duelEndPeak.apply(this, arguments);
  };
}

/* ---------- handle ---------- */
G.mountainAudit = function(){
  const P = DUEL && DUEL.peakset;
  return {
    farmDamage: 'none — duelTargets() returns nothing and wreck() is refused',
    peaks: P ? P.peaks.map((p,i)=>`${i}: ${p.state}${p.chunks.length?` (${p.chunks.length} chunks in the air)`:''}`) : 'no fight running',
    stages: 'impact flash, shear, fall with gravity and one bounce, dust wall, stump left standing',
  };
};
