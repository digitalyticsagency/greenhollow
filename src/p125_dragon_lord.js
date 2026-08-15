/* =====================================================================
   A DRAGON LORD OVER THE ARENA

   From the screenshot: the arena sky is two thirds of the frame and there
   is nothing in it. The fighters stand on a line at the bottom, the
   mountains sit behind them, and the whole upper half is empty grey with
   rain falling through it. The helper dragon is one small shape in the
   corner. The staging has no scale to it.

   So the sky gets an occupant. A serpent dragon — long ribbon body, no
   wings, antlers, whiskers, a mane down its back, four short clawed legs
   — coiling across the arena behind the fight and breathing fire as it
   goes. It is scenery with presence rather than a participant: it never
   touches the beats, never wrecks a building, and the outcome of the duel
   is exactly what it was.

   ON THE LIKENESS, same rule this file's neighbours already follow. p104
   says it plainly: the champions are original characters in the shared
   vocabulary of the genre because copying protected designs is the one
   part of this that would put the author at risk. The same applies here.
   The long four-legged sky serpent is a traditional East Asian form that
   predates every cartoon by a thousand years and belongs to nobody — that
   is what this is built from. It is not the specific wish-granting dragon
   from any particular series, it is not that character's colouring or
   proportions, and it has no name from one. It gets its own palette,
   drawn from traditional dragon colours, and a different one each fight.

   HOW IT MOVES. The head travels a slow lissajous across the sky, so it
   wanders rather than crossing in a straight line, and the body is the
   head's own recent history sampled backwards. That is what gives a
   serpent its undulation for free — no per-segment physics, and the body
   can never tie itself in a knot, because it is literally where the head
   has already been.

   WHERE IT SITS. arenaArt is prepended to the duel layer by p107, and the
   fighters are in the layer's own content after it. Appending to the
   arena's output rather than to the layer puts the lord in the one gap
   that reads correctly: in front of the peaks, behind the fight.
   ===================================================================== */

/* traditional dragon colourways, one picked per fight */
/* Lifted a couple of stops from the first pass — these sit against five
   different arena skies, and the muted versions disappeared on two of
   them. Bright body, pale horn and mane, dark contour underneath. */
const LORD_SKINS = [
  { n:'jade',     body:'#3fa86c', lit:'#7fd6a0', deep:'#1d5236', horn:'#f4ebc8', mane:'#f0d878', belly:'#cfe4c8' },
  { n:'vermilion',body:'#d4553c', lit:'#f5876a', deep:'#71241c', horn:'#f8e6bc', mane:'#f6c65c', belly:'#f0cfb4' },
  { n:'indigo',   body:'#5563c8', lit:'#8f9cf0', deep:'#1f2752', horn:'#eef2ff', mane:'#b9c6ff', belly:'#c8cfe8' },
  { n:'gold',     body:'#c9902f', lit:'#f0bf63', deep:'#5c3f18', horn:'#fbf3d6', mane:'#ffd97a', belly:'#e6d2a8' },
];

let LORD = null;

function lordSky(){
  /* the same box arenaArt builds its backdrop in */
  const x = -T*2, y = -T*2, w = WPX + T*4, h = HPX + T*4;
  return { x, y, w, h, horizon: y + h*0.46 };
}

function lordInit(){
  const sk = lordSky();
  LORD = {
    skin: LORD_SKINS[Math.floor(Math.random()*LORD_SKINS.length)],
    t: Math.random()*10,
    trail: [],
    fire: 0, fireT: 0, next: 1.2 + Math.random()*1.6,
    cx: sk.x + sk.w*0.5, cy: sk.y + (sk.horizon - sk.y)*0.46,
    ax: sk.w*0.34, ay: (sk.horizon - sk.y)*0.30,
    head: { x:0, y:0, a:0 },
  };
}

/* head on a slow lissajous, body is where the head has already been */
function lordTick(dt){
  if(!LORD) return;
  const L = LORD;
  L.t += dt;
  const px = L.head.x, py = L.head.y;
  /* the slow wander, plus a faster weave — the weave is what the body
     inherits as undulation, because the body is the head's own history */
  L.head.x = L.cx + Math.cos(L.t*0.23) * L.ax + Math.cos(L.t*1.9) * 16;
  L.head.y = L.cy + Math.sin(L.t*0.37) * L.ay + Math.sin(L.t*2.3) * 12;
  if(px || py) L.head.a = Math.atan2(L.head.y - py, L.head.x - px);

  L.trail.unshift({ x:L.head.x, y:L.head.y });
  if(L.trail.length > 300) L.trail.length = 300;

  /* it breathes a great deal, which is the point of it */
  if(L.fire > 0){
    L.fire -= dt;
    if(L.fire <= 0){ L.fire = 0; L.next = 1.4 + Math.random()*2.0; }
  } else {
    L.next -= dt;
    if(L.next <= 0){
      L.fire = 0.85 + Math.random()*0.5;
      L.fireT = 0;
      if(typeof G.bang === 'function') try{ G.bang('roar'); }catch(e){}
    }
  }
  if(L.fire > 0) L.fireT += dt;
}

/* ---------- the art ---------- */
function lordArt(k){
  if(!LORD || !LORD.trail.length) return '';
  const L = LORD, S1 = L.skin;
  const op = Math.max(0, Math.min(1, k === undefined ? 1 : k));
  if(op < 0.02) return '';

  const SEGS = 34, SPACING = 9;
  let s = `<g opacity="${(op*0.96).toFixed(3)}">`;

  /* --- body ---
     Sampled by distance travelled, not by frame count. Spacing the
     segments every N trail entries made the body a string of loose beads
     whenever the frame rate dropped, because the head covers more ground
     per frame — the gaps were plainly visible in a 20fps capture. Walking
     the trail by arc length gives the same serpent at any frame rate. */
  const pts = [];
  let acc = 0;
  const push = (p, i)=>pts.push({ p, i });
  push(L.trail[0], 0);
  for(let j=1; j<L.trail.length && pts.length < SEGS; j++){
    acc += Math.hypot(L.trail[j].x - L.trail[j-1].x, L.trail[j].y - L.trail[j-1].y);
    if(acc >= SPACING){ acc = 0; push(L.trail[j], pts.length); }
  }
  pts.reverse();                       /* tail first, so the head overlaps */
  pts.forEach(({p,i})=>{
    const f = 1 - i/SEGS;                     /* 1 at the head, 0 at the tail */
    /* the tail stays fat enough that its diameter still exceeds SPACING,
       or the body comes apart at the thin end */
    const r = 5.5 + f*f*11;
    /* A dark contour under every segment. The arenas run from pale ice to
       near-black lava, and a bronze serpent on a lava sky was invisible in
       testing — the rim is what makes it read on all five of them. */
    s += `<circle cx="${n(p.x)}" cy="${n(p.y)}" r="${n(r+1.8)}" fill="#120d08" opacity=".5"/>`;
    s += `<circle cx="${n(p.x)}" cy="${n(p.y+2.2)}" r="${n(r)}" fill="${S1.deep}" opacity=".55"/>`;
    s += `<circle cx="${n(p.x)}" cy="${n(p.y)}" r="${n(r)}" fill="${S1.body}"/>`;
    s += `<circle cx="${n(p.x-r*0.26)}" cy="${n(p.y-r*0.30)}" r="${n(r*0.58)}" fill="${S1.lit}" opacity=".75"/>`;
    /* the mane runs the length of the spine */
    if(i % 2 === 0 && i < SEGS-2)
      s += `<path d="M${n(p.x)} ${n(p.y-r*0.9)} l${n(-r*0.5)} ${n(-r*0.9)} l${n(r*1.0)} ${n(r*0.25)} Z"
        fill="${S1.mane}" opacity=".9"/>`;
    /* four short legs, spaced along it */
    if(i === 5 || i === 11 || i === 17 || i === 22){
      const lx = p.x - r*0.2, ly = p.y + r*0.8;
      s += `<path d="M${n(lx)} ${n(ly)} q${n(-r*0.5)} ${n(r*0.8)} ${n(-r*0.15)} ${n(r*1.5)}"
        stroke="${S1.deep}" stroke-width="${n(r*0.42)}" fill="none" stroke-linecap="round"/>`;
      for(let c=0;c<3;c++)
        s += `<circle cx="${n(lx - r*0.15 + (c-1)*r*0.22)}" cy="${n(ly + r*1.6)}" r="${n(r*0.16)}"
          fill="${S1.horn}"/>`;
    }
  });

  /* --- head --- */
  const h = L.head, deg = h.a*180/Math.PI;
  s += `<g transform="translate(${n(h.x)},${n(h.y)}) rotate(${deg.toFixed(1)})">`;
  /* snout */
  s += `<ellipse cx="9" cy="0" rx="15" ry="8.4" fill="${S1.body}"/>`;
  s += `<ellipse cx="9" cy="-2.4" rx="12" ry="4.6" fill="${S1.lit}" opacity=".7"/>`;
  s += `<ellipse cx="19" cy="2.2" rx="6.4" ry="4" fill="${S1.deep}"/>`;
  s += `<ellipse cx="-2" cy="0" rx="12" ry="10.5" fill="${S1.body}"/>`;
  s += `<ellipse cx="-3.5" cy="-3" rx="8.6" ry="6" fill="${S1.lit}" opacity=".6"/>`;
  /* antlers, branched */
  [-1,1].forEach(sd=>{
    s += `<path d="M-4 ${n(sd*7)} q-7 ${n(sd*9)} -14 ${n(sd*10)} m7 ${n(sd*-5)} q-3 ${n(sd*6)} -9 ${n(sd*7)}"
      stroke="${S1.horn}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
  });
  /* whiskers streaming back */
  [-1,1].forEach(sd=>{
    const w1 = Math.sin(L.t*3 + sd)*4;
    s += `<path d="M17 ${n(sd*4)} q-14 ${n(sd*10 + w1)} -32 ${n(sd*7 + w1)}"
      stroke="${S1.horn}" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".95"/>`;
  });
  /* mane behind the skull */
  s += `<path d="M-10 -9 l-9 -8 l4 10 l-9 -2 l6 9 Z" fill="${S1.mane}" opacity=".95"/>`;
  /* eye and brow */
  s += `<circle cx="2" cy="-4.2" r="3.4" fill="#f6f1e2"/>`;
  s += `<circle cx="3.2" cy="-4.2" r="1.7" fill="#1a1410"/>`;
  s += `<path d="M-2 -8.6 q5 -3 9 -1" stroke="${S1.horn}" stroke-width="1.8" fill="none" stroke-linecap="round"/>`;
  /* the mouth opens while it breathes */
  if(L.fire > 0){
    s += `<path d="M15 2 q7 5 11 1 q-5 6 -12 4 Z" fill="#2a1109"/>`;
    /* the gout: layered tapered jets, the same trick the ride breaths use */
    const k2 = Math.min(1, L.fireT*2.2);
    const reach = 150 * Math.sin(Math.min(1, k2) * Math.PI) + 40;
    const sp = 10 + 15*Math.sin(Math.min(1,k2)*Math.PI);
    const jet = (r0, s0, col, o0)=>`<path d="M24 2 Q${n(24+r0*0.5)} ${n(2-s0)} ${n(24+r0)} 2
      Q${n(24+r0*0.5)} ${n(2+s0)} 24 2 Z" fill="${col}" opacity="${o0}"/>`;
    s += jet(reach, sp*1.15, '#ff4a12', 0.5);
    s += jet(reach*0.76, sp*0.76, '#ff9a2a', 0.75);
    s += jet(reach*0.48, sp*0.44, '#ffe07a', 0.9);
    for(let i=0;i<6;i++){
      const ex = 24 + reach*(0.5 + (i/6)*0.55), ey = 2 + (hash(i*4.1+Math.floor(L.t))-0.5)*sp*2.4;
      s += `<circle cx="${n(ex)}" cy="${n(ey)}" r="${(1.2+hash(i*3)*2).toFixed(1)}" fill="#ffd27a" opacity=".85"/>`;
    }
  } else {
    s += `<path d="M16 3 q6 3 10 1" stroke="${S1.deep}" stroke-width="1.6" fill="none" stroke-linecap="round"/>`;
  }
  s += `</g></g>`;
  return s;
}

/* ---------- wire it in ---------- */
if(typeof G.startDuel === 'function'){
  const _startDuelLord = G.startDuel;
  G.startDuel = function(){
    const r = _startDuelLord.apply(this, arguments);
    try{
      if(DUEL && !DUEL.over){
        lordInit();
        if(typeof log === 'function')
          log(`Something long and ${LORD.skin.n} is turning over the peaks. It is not here for you.`,
              '', 'farm');
      }
    }catch(e){}
    return r;
  };
}

if(typeof duelTick === 'function'){
  const _duelTickLord = duelTick;
  duelTick = function(dt){
    const r = _duelTickLord.apply(this, arguments);
    try{
      if(DUEL && !DUEL.over) lordTick(typeof dt === 'number' ? dt : 0.05);
      else LORD = null;
    }catch(e){}
    return r;
  };
}

/* in front of the peaks, behind the fight — see the header */
if(typeof arenaArt === 'function'){
  const _arenaArtLord = arenaArt;
  arenaArt = function(A, k){
    const base = _arenaArtLord.apply(this, arguments);
    try{ return base + lordArt(k); }catch(e){ return base; }
  };
}

/* ---------- the helper dragon was too small to read ----------
   In the report screenshot it is one small shape against a full-screen
   arena. It is the player's own dragon and the reason the fight turns, so
   it is drawn up at the scale the staging is working at. */
if(typeof duelPaint === 'function'){
  const _duelPaintScale = duelPaint;
  duelPaint = function(){
    const r = _duelPaintScale.apply(this, arguments);
    try{
      const el = document.getElementById('duellay');
      if(!el || !DUEL || DUEL.over || !DUEL.dg) return r;
      const g = el.querySelector('.dragon');
      const wrap = g && g.parentElement;
      if(wrap && wrap.getAttribute('transform') && !wrap.dataset.scaled){
        wrap.setAttribute('transform', wrap.getAttribute('transform') + ' scale(1.7)');
        wrap.dataset.scaled = '1';
      }
    }catch(e){}
    return r;
  };
}

/* ---------- handle ---------- */
G.dragonLordAudit = function(){
  if(!LORD) return { inTheSky:false, note:'only during a champions duel',
    colourways: LORD_SKINS.map(s=>s.n) };
  const sk = lordSky();
  return {
    inTheSky:true,
    colourway: LORD.skin.n,
    at: `${Math.round(LORD.head.x)},${Math.round(LORD.head.y)}`,
    skyBand: `${Math.round(sk.y)} to ${Math.round(sk.horizon)}`,
    aboveTheHorizon: LORD.head.y < sk.horizon,
    bodyLength: LORD.trail.length,
    breathingNow: LORD.fire > 0,
    secondsToNextBreath: LORD.fire > 0 ? 0 : +LORD.next.toFixed(1),
    affectsTheFight: false,
  };
};
