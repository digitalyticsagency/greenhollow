/* =====================================================================
   AN ARENA TO FIGHT IN, AND NO TWO FIGHTS THE SAME

   Two things asked for. The farm showed through underneath the duel,
   which made it look like two men scrapping over a vegetable patch
   rather than a battle; and every fight ran the identical eleven beats,
   so the second one you watched had nothing left to show you.

   THE ARENA. A backdrop is drawn over the whole world for the duration -
   sky, a horizon of jagged peaks, a cracked ground plane, floating
   rubble - so the farm is hidden while they are at it and comes back
   untouched afterwards. Five of them, picked at random: a scorched
   wasteland, a night sky over cloud, a lava field, an ice shelf, and a
   ruined city. It is drawn first inside the duel layer, which puts it
   above the farm and below the fighters without touching either.

   Nothing is destroyed to make this happen. The arena is a picture laid
   over the top; the buildings the fight actually wrecks are wrecked by
   p104 as before.

   NO TWO FIGHTS THE SAME. Three things vary now:

     the arena     five, each with its own palette and sky
     the sequence  a fixed opening and finish with a middle drawn from a
                   pool of eight exchanges, shuffled, four or five taken
     the moves     each fighter is dealt a special - barrage, disc, wave,
                   meteor, grapple - and it is drawn differently

   The opening and the finish stay fixed on purpose. A fight needs to
   arrive and it needs to end on the beam, or it stops reading as a
   fight; it is the middle that wants to surprise you.
   ===================================================================== */

const ARENAS = [
  { id:'waste', n:'scorched flats',
    sky:['#f0a860','#c8553a','#5a2a2a'], ground:'#7a4a34', rock:'#5a3628', dust:'#e8b070' },
  { id:'night', n:'night sky',
    sky:['#1a2a4a','#2f4a72','#0e1626'], ground:'#22304a', rock:'#182338', dust:'#8fb0d0' },
  { id:'lava',  n:'lava field',
    sky:['#2a1414','#7a2a1a','#1a0e0e'], ground:'#3a1e18', rock:'#24120e', dust:'#ff7a3a' },
  { id:'ice',   n:'ice shelf',
    sky:['#cfe4f0','#8fb6cf','#4a6a86'], ground:'#d8e8f0', rock:'#a8c4d4', dust:'#ffffff' },
  { id:'ruin',  n:'ruined city',
    sky:['#8a8a92','#6a6a72','#2a2a32'], ground:'#5a5a62', rock:'#3a3a44', dust:'#b0b0b8' },
];

/* the pool the middle of a fight is drawn from */
const EXCHANGES = [
  {k:'clash',    t:1.5},
  {k:'knock',    t:1.2},
  {k:'blasts',   t:2.0},
  {k:'barrage',  t:1.8},
  {k:'grapple',  t:1.6},
  {k:'disc',     t:1.6},
  {k:'meteor',   t:1.8},
  {k:'vanish',   t:1.4},
];

function shuffled(a){
  const b = a.slice();
  for(let i=b.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); const t=b[i]; b[i]=b[j]; b[j]=t; }
  return b;
}

/* ---------- the backdrop ---------- */
function arenaArt(A, k){
  /* k is how far in the fade is, 0..1 */
  const x = -T*2, y = -T*2, w = WPX + T*4, h = HPX + T*4;
  const gid = 'gArena_' + A.id;
  let s = `<g opacity="${k.toFixed(3)}">`;
  s += `<defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${A.sky[0]}"/>
    <stop offset="0.52" stop-color="${A.sky[1]}"/>
    <stop offset="1" stop-color="${A.sky[2]}"/></linearGradient></defs>`;
  s += `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" fill="url(#${gid})"/>`;

  /* a horizon of peaks, seeded so one arena always looks like itself */
  const hz = y + h*0.46;
  let ridge = `M${n(x)} ${n(hz+40)} L${n(x)} ${n(hz)}`;
  const steps = 22;
  for(let i=0;i<=steps;i++){
    const px = x + w*i/steps;
    const py = hz - (hash(i*3.1 + A.id.length)*0.5 + hash(i*1.7)*0.5) * h*0.16;
    ridge += ` L${n(px)} ${n(py)}`;
  }
  ridge += ` L${n(x+w)} ${n(hz+40)} Z`;
  s += `<path d="${ridge}" fill="${A.rock}" opacity=".85"/>`;

  /* the ground plane, cracked */
  s += `<rect x="${n(x)}" y="${n(hz)}" width="${n(w)}" height="${n(h - (hz - y))}" fill="${A.ground}"/>`;
  for(let i=0;i<14;i++){
    const cx0 = x + w*hash(i*5.3), cy0 = hz + (h-(hz-y))*hash(i*2.9);
    let d = `M${n(cx0)} ${n(cy0)}`;
    for(let j=1;j<4;j++)
      d += ` L${n(cx0 + (hash(i*7+j)-0.5)*160)} ${n(cy0 + hash(i*3+j)*70)}`;
    s += `<path d="${d}" fill="none" stroke="${A.rock}" stroke-opacity=".55" stroke-width="${n(1+hash(i)*2)}"/>`;
  }
  /* boulders */
  for(let i=0;i<10;i++){
    const bx = x + w*hash(i*4.7+1), by = hz + (h-(hz-y))*hash(i*6.1) * 0.9;
    const r0 = 10 + hash(i*2.3)*26;
    s += `<ellipse cx="${n(bx)}" cy="${n(by)}" rx="${n(r0)}" ry="${n(r0*0.62)}" fill="${A.rock}"/>`;
    s += `<ellipse cx="${n(bx-r0*0.2)}" cy="${n(by-r0*0.2)}" rx="${n(r0*0.6)}" ry="${n(r0*0.34)}" fill="#ffffff" opacity=".10"/>`;
  }
  /* rubble hanging in the air, which is the shorthand for "there is a lot
     of power in the room" */
  for(let i=0;i<16;i++){
    const rx = x + w*hash(i*8.3+2), ry = y + h*hash(i*3.7)*0.62;
    const r0 = 3 + hash(i*5.9)*7;
    s += `<path class="arubble" d="M${n(rx)} ${n(ry)} l${n(r0)} ${n(r0*0.5)} l${n(-r0*0.4)} ${n(r0)} l${n(-r0*0.8)} ${n(-r0*0.3)} Z"
      fill="${A.rock}" opacity=".9" style="--i:${i%6}"/>`;
  }
  s += `</g>`;
  return s;
}

/* ---------- special moves, drawn differently ---------- */
function specialArt(kind, from, to, colour, p){
  const dx = to.x-from.x, dy = to.y-from.y;
  let s = '';
  if(kind === 'barrage'){
    for(let i=0;i<9;i++){
      const f = ((p*2.2 + i*0.11) % 1);
      const jx = (hash(i*3.1)-0.5)*34, jy = (hash(i*5.7)-0.5)*30;
      s += `<circle cx="${n(from.x + dx*f + jx*f)}" cy="${n(from.y - 14 + dy*f + jy*f)}"
        r="${n(4+hash(i)*3)}" fill="${colour}" opacity=".85"/>`;
    }
  } else if(kind === 'disc'){
    const cx0 = from.x + dx*p, cy0 = from.y - 20 + dy*p;
    s += `<ellipse cx="${n(cx0)}" cy="${n(cy0)}" rx="20" ry="5" fill="none" stroke="${colour}" stroke-width="4" opacity=".9"/>`;
    s += `<ellipse cx="${n(cx0)}" cy="${n(cy0)}" rx="13" ry="3.2" fill="none" stroke="#ffffff" stroke-width="1.6"/>`;
  } else if(kind === 'meteor'){
    for(let i=0;i<5;i++){
      const f = ((p*1.5 + i*0.2) % 1);
      const mx = from.x + dx*f, my = from.y - 120 + (dy+120)*f;
      s += `<circle cx="${n(mx)}" cy="${n(my)}" r="${n(9+i)}" fill="${colour}" opacity=".8"/>`;
      s += `<path d="M${n(mx)} ${n(my)} L${n(mx-6)} ${n(my-26)} L${n(mx+6)} ${n(my-26)} Z" fill="${colour}" opacity=".4"/>`;
    }
  } else if(kind === 'grapple'){
    const mx = (from.x+to.x)/2, my = (from.y+to.y)/2 - 16;
    s += `<circle cx="${n(mx)}" cy="${n(my)}" r="${n(16+8*Math.sin(p*Math.PI*6))}" fill="${colour}" opacity=".30"/>`;
    for(let i=0;i<8;i++){
      const a0 = i*Math.PI/4 + p*4;
      s += `<line x1="${n(mx+Math.cos(a0)*10)}" y1="${n(my+Math.sin(a0)*10)}"
        x2="${n(mx+Math.cos(a0)*(26+10*Math.sin(p*9)))}" y2="${n(my+Math.sin(a0)*(26+10*Math.sin(p*9)))}"
        stroke="${colour}" stroke-width="2" stroke-opacity=".7" stroke-linecap="round"/>`;
    }
  } else if(kind === 'vanish'){
    const gh = 3;
    for(let i=0;i<gh;i++){
      const f = i/gh;
      s += `<circle cx="${n(from.x + dx*p*f)}" cy="${n(from.y - 18 + dy*p*f)}" r="${n(12-i*3)}"
        fill="${colour}" opacity="${(0.22*(1-f)).toFixed(2)}"/>`;
    }
  }
  return s;
}

/* ---------- hook into the duel ---------- */
if(typeof G.startDuel === 'function'){
  const _startDuelStage = G.startDuel;
  G.startDuel = function(){
    const r = _startDuelStage.apply(this, arguments);
    try{
      if(!DUEL) return r;
      DUEL.arena = ARENAS[Math.floor(Math.random()*ARENAS.length)];
      DUEL.arenaK = 0;
      /* fixed opening, shuffled middle, fixed finish */
      const mid = shuffled(EXCHANGES).slice(0, 4 + Math.floor(Math.random()*2));
      const seq = [{k:'arrive',t:1.6},{k:'stare',t:1.1}]
        .concat(mid)
        .concat([{k:'rise',t:1.2},{k:'charge',t:2.2},{k:'beam',t:2.4},
                 {k:'struggle',t:2.0},{k:'finish',t:1.8},{k:'settle',t:1.6}]);
      BEATS.length = 0; seq.forEach(b=>BEATS.push(b));
      /* a special each, and a colour shift so no two nights look alike */
      const specials = ['barrage','disc','meteor','grapple','vanish'];
      DUEL.heroSpecial = specials[Math.floor(Math.random()*specials.length)];
      DUEL.vilSpecial  = specials[Math.floor(Math.random()*specials.length)];
      const hue = Math.floor(Math.random()*360);
      DUEL.tint = `hsl(${hue} 90% 62%)`;
      DUEL.tint2 = `hsl(${(hue+150)%360} 90% 62%)`;
      if(typeof log === 'function')
        log(`They squared up on the ${DUEL.arena.n}.`, '', 'farm');
    }catch(e){}
    return r;
  };
}

/* the new beats need to do something, and the arena needs painting */
if(typeof duelTick === 'function'){
  const _duelTickStage = duelTick;
  duelTick = function(dt){
    const before = DUEL ? DUEL.beat : -1;
    const r = _duelTickStage.apply(this, arguments);
    try{
      if(!DUEL || DUEL.over) return r;
      const D = DUEL, beat = BEATS[D.beat];
      /* the arena fades in over the arrival and out at the end */
      const last = BEATS.length - 1;
      const target = (D.beat >= last) ? 0 : 1;
      D.arenaK = D.arenaK + (target - D.arenaK) * Math.min(1, dt*1.8);
      /* drive the exchanges p104 does not know about */
      if(beat && ['barrage','grapple','disc','meteor','vanish'].includes(beat.k)){
        const p = Math.min(1, D.bt / beat.t);
        D.special = { kind:beat.k, p };
        D.hpow = D.vpow = 0.55 + 0.25*Math.sin(p*Math.PI);
        /* they circle each other rather than standing still */
        const a0 = p*Math.PI*2, rr = 108;
        D.hx = D.cx - Math.cos(a0)*rr; D.hy = D.cy - 46 + Math.sin(a0)*22;
        D.vx = D.cx + Math.cos(a0)*rr; D.vy = D.cy - 46 - Math.sin(a0)*22;
        if(Math.random() < dt*6){ D.shake = 0.4; }
      } else D.special = null;
    }catch(e){}
    return r;
  };
}

/* paint the arena under everything the duel draws, and the specials over */
if(typeof duelPaint === 'function'){
  const _duelPaintStage = duelPaint;
  duelPaint = function(){
    const r = _duelPaintStage.apply(this, arguments);
    try{
      const g = document.getElementById('duellay');
      if(!g || !DUEL) return r;
      let extra = '';
      if(DUEL.arena && DUEL.arenaK > 0.01) extra = arenaArt(DUEL.arena, DUEL.arenaK);
      if(extra) g.innerHTML = extra + g.innerHTML;
      if(DUEL.special){
        const sp = DUEL.special;
        const from = {x:DUEL.hx, y:DUEL.hy}, to = {x:DUEL.vx, y:DUEL.vy};
        g.innerHTML += specialArt(sp.kind, from, to, DUEL.tint || DUEL.hero.beam, sp.p);
        g.innerHTML += specialArt(sp.kind, to, from, DUEL.tint2 || DUEL.villain.beam, (sp.p+0.5)%1);
      }
    }catch(e){}
    return r;
  };
}

/* The world labels live in their own layer above the scene, so they
   floated over the arena — "Chicken coop" hanging in the sky above a
   ruined city. They go away for the duration and come straight back. */
function labelsDuringDuel(){
  const L = document.getElementById('wlabels');
  if(!L) return;
  const hide = (typeof duelActive === 'function') && duelActive();
  if(hide && L.style.opacity !== '0'){ L.style.transition='opacity .5s ease'; L.style.opacity='0'; }
  else if(!hide && L.style.opacity === '0'){ L.style.opacity=''; }
}
if(typeof tickPeople === 'function'){
  const _tickPeopleLabels = tickPeople;
  tickPeople = function(dt){
    const r = _tickPeopleLabels.apply(this, arguments);
    try{ labelsDuringDuel(); }catch(e){}
    return r;
  };
}

(function stageCss(){
  const s = document.createElement('style');
  s.textContent = `
  #duellay .arubble{ animation: arub 2.6s ease-in-out infinite alternate;
    animation-delay: calc(var(--i) * .3s); }
  @keyframes arub{ from{ transform: translateY(3px) rotate(0deg) } to{ transform: translateY(-7px) rotate(14deg) } }
  @media (prefers-reduced-motion: reduce){ #duellay .arubble{ animation:none } }
  `;
  document.head.appendChild(s);
})();

/* ---------- handle ---------- */
G.arenaAudit = function(){
  return {
    arenas: ARENAS.map(a=>a.n),
    exchangePool: EXCHANGES.map(e=>e.k),
    thisFight: DUEL ? {
      arena: DUEL.arena ? DUEL.arena.n : '—',
      sequence: BEATS.map(b=>b.k).join(' → '),
      specials: `${DUEL.heroSpecial} vs ${DUEL.vilSpecial}`,
      tint: DUEL.tint,
    } : 'no fight running',
    variety: 'opening and finish fixed; middle is 4-5 drawn from 8 and shuffled',
  };
};
