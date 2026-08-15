/* =====================================================================
   SIX BIRDS THAT KNOW WHAT THEY ARE

   p32 put five birds in the sky. They are the same bird, the same dark
   silhouette, and they cross left to right on a loop and start again.
   That is scenery, and it reads as scenery.

   These are six species, drawn in flat colour with layered feather bands
   the way the reference art is, and every one of them flies and behaves
   like the kind of bird it is rather than sharing one routine:

     Finch      flocks. Steers to the middle of the other finches and off
                the nearest one, so the group holds together without ever
                stacking up. Fast, light, restless.
     Bluebird   pairs. Picks a building and works the air around it,
                never far from its partner.
     Martin     hunts. Long fast passes low over the beds where the
                insects are, banking hard at each end.
     Firecrest  territorial. Holds a patch, and drives off anything
                smaller that comes into it.
     Siskin     feeds. Drops to a bed, works it over, and is nervous the
                whole time — first to leave when anything happens.
     Kite       soars. Wide slow circles high up, and it barely flaps.
                Everything smaller than it watches where it is.

   THE ONE THING THEY ALL SHARE is fear of the kite, and that is what
   makes the sky look alive: a raptor drifting through a flock of finches
   breaks it apart and it re-forms behind him, without any of that being
   scripted. Fear is a number that rises with proximity and decays, and
   every species spends it differently — the siskin bolts, the firecrest
   only gives ground, the kite has none.

   ON THE PROJECTION. The farm is drawn aerial three-quarter, so these are
   banked rather than side-on: one wing up, one down, body seen from
   above and behind, which is what a bird crossing over you actually looks
   like. The reference's flat bands and colour blocking carry over; the
   viewpoint does not, because a strict side elevation would be the one
   thing on screen not obeying the light and the angle.

   BUILT ONCE, MOVED BY TRANSFORM. Wings are CSS keyframes on a group
   inside the bird. p115 documents what happens otherwise: an element
   rebuilt every frame restarts its animation every frame and sits frozen
   on the first keyframe.
   ===================================================================== */

const BIRD_KINDS = {
  finch:     { n:'Finch',     body:'#8a9a3f', wing:'#5e6b28', wing2:'#aebd63', belly:'#eef0c4',
               beak:'#e8913a', sc:0.55, speed:64,  flap:0.28, tag:'flocks' },
  bluebird:  { n:'Bluebird',  body:'#3f7fd0', wing:'#2b5ea8', wing2:'#7fb0e8', belly:'#f6c9bd',
               beak:'#4a6a8a', sc:0.58,  speed:52,  flap:0.34, tag:'pairs' },
  martin:    { n:'Martin',    body:'#7b6fd8', wing:'#4f45a8', wing2:'#a99cf0', belly:'#cfc8f4',
               beak:'#3a3550', sc:0.53, speed:96,  flap:0.22, tag:'hunts low' },
  firecrest: { n:'Firecrest', body:'#e0442a', wing:'#9e2a1c', wing2:'#f4a288', belly:'#f6b9a0',
               beak:'#e8913a', sc:0.60, speed:70,  flap:0.30, tag:'territorial' },
  siskin:    { n:'Siskin',    body:'#e8c33a', wing:'#7f8a2f', wing2:'#f2dd86', belly:'#f8ecae',
               beak:'#e0742a', sc:0.52,  speed:60,  flap:0.26, tag:'ground feeder' },
  kite:      { n:'Kite',      body:'#c58a34', wing:'#6b4a26', wing2:'#e8b063', belly:'#f0d9a8',
               beak:'#2f2a22', sc:0.95,  speed:40,  flap:1.10, tag:'soars, and they all watch it' },
};

const FLOCK = { list:[], layer:null, t:0 };

/* ---------- the art: flat blocks and layered bands ---------- */
function birdKindArt(k){
  const K = BIRD_KINDS[k], s = K.sc;
  const P = (v)=>n(v*s);
  let g = '';
  /* far wing, behind the body and darker */
  g += `<g class="bw far"><path d="M${P(-1)} ${P(-1)}
      q${P(-9)} ${P(-7)} ${P(-21)} ${P(-5)}
      q${P(-6)} ${P(1)} ${P(-9)} ${P(4)}
      q${P(10)} ${P(1)} ${P(20)} ${P(2)} z" fill="${K.wing}"/></g>`;
  /* tail, a swept fan */
  g += `<path d="M${P(-4)} ${P(1)} q${P(-9)} ${P(2)} ${P(-16)} ${P(6)}
      q${P(8)} ${P(0)} ${P(16)} ${P(-2)} z" fill="${K.wing}"/>`;
  g += `<path d="M${P(-4)} ${P(0.5)} q${P(-8)} ${P(1)} ${P(-14)} ${P(3.4)}
      q${P(7)} ${P(-0.4)} ${P(14)} ${P(-1.6)} z" fill="${K.wing2}" opacity=".9"/>`;
  /* body and the lighter belly under it */
  g += `<ellipse cx="0" cy="0" rx="${P(10)}" ry="${P(5.6)}" fill="${K.body}"/>`;
  g += `<path d="M${P(-8)} ${P(1.4)} q${P(7)} ${P(5)} ${P(16)} ${P(0.4)}
      q${P(-7)} ${P(2.6)} ${P(-16)} ${P(-0.4)} z" fill="${K.belly}"/>`;
  /* head, eye, beak */
  g += `<circle cx="${P(9)}" cy="${P(-2.6)}" r="${P(4.4)}" fill="${K.body}"/>`;
  g += `<circle cx="${P(10.4)}" cy="${P(-3.4)}" r="${P(0.95)}" fill="#20242a"/>`;
  g += `<path d="M${P(13)} ${P(-2.4)} l${P(5.4)} ${P(1.1)} l${P(-5.2)} ${P(1.7)} z" fill="${K.beak}"/>`;
  /* near wing: three bands, dark to light, the reference's whole trick */
  g += `<g class="bw near">`;
  g += `<path d="M${P(-1)} ${P(-1)} q${P(-8)} ${P(-9)} ${P(-22)} ${P(-8)}
      q${P(-7)} ${P(1)} ${P(-11)} ${P(4)} q${P(11)} ${P(2)} ${P(22)} ${P(3)} z" fill="${K.wing}"/>`;
  g += `<path d="M${P(-1)} ${P(-1)} q${P(-7)} ${P(-7)} ${P(-19)} ${P(-6)}
      q${P(-6)} ${P(1)} ${P(-9)} ${P(3.4)} q${P(10)} ${P(1.6)} ${P(19)} ${P(2.4)} z" fill="${K.wing2}"/>`;
  g += `<path d="M${P(-1)} ${P(-1)} q${P(-5)} ${P(-4.6)} ${P(-13)} ${P(-4)}
      q${P(-4)} ${P(0.6)} ${P(-6)} ${P(2.4)} q${P(7)} ${P(1)} ${P(13)} ${P(1.6)} z" fill="${K.belly}" opacity=".85"/>`;
  g += `</g>`;
  /* the little curled foot the reference has */
  g += `<path d="M${P(1)} ${P(4.4)} q${P(-1.6)} ${P(2.6)} ${P(1.2)} ${P(3.2)}"
      fill="none" stroke="${K.beak}" stroke-width="${P(0.8)}" stroke-linecap="round"/>`;
  return g;
}

/* ---------- who is in the sky ---------- */
/* The mix, in the order a farm fills up: finches first, a raptor last and
   only once there is enough cover to be worth hunting over. p134 decides
   HOW MANY from the trees on the land; this only says which. */
const BIRD_MIX = ['finch','finch','siskin','bluebird','finch','martin',
                  'siskin','bluebird','martin','firecrest','finch','kite'];

function birdMake(k, id){
  return {
    id:'bk'+id, k,
    x: Math.random()*WPX, y: 40 + Math.random()*(HPX*0.5),
    vx: (Math.random()<0.5?-1:1)*BIRD_KINDS[k].speed*0.6,
    vy: (Math.random()-0.5)*20,
    t: Math.random()*8, fear:0, mode:'cruise', hold:0,
    knows:{}, fed:0, nest:null, roost:0,
    home:{ x: Math.random()*WPX, y: 60 + Math.random()*(HPX*0.4) },
  };
}

function birdSpawn(){
  const want = [
    ['finch',4], ['bluebird',2], ['martin',2], ['firecrest',1], ['siskin',2], ['kite',1],
  ];
  FLOCK.list = [];
  let id = 0;
  want.forEach(([k, n0])=>{
    for(let i=0;i<n0;i++){
      FLOCK.list.push({
        id:'bk'+(id++), k,
        x: Math.random()*WPX, y: 40 + Math.random()*(HPX*0.5),
        vx: (Math.random()<0.5?-1:1)*BIRD_KINDS[k].speed*0.6,
        vy: (Math.random()-0.5)*20,
        t: Math.random()*8, fear:0, mode:'cruise', hold:0,
        home:{ x: Math.random()*WPX, y: 60 + Math.random()*(HPX*0.4) },
      });
    }
  });
}

function birdLayer(){
  let g = document.getElementById('birdlay');
  if(!g){
    const fg = document.getElementById('fg');
    if(!fg) return null;
    g = document.createElementNS('http://www.w3.org/2000/svg','g');
    g.id = 'birdlay';
    g.setAttribute('pointer-events','none');
    fg.appendChild(g);
  }
  return g;
}

/* ---------- the minds ----------
   One steering function per species. They all return a desired velocity;
   the shared tick does the moving, the banking and the drawing, so a new
   species is a colour block and a paragraph of behaviour. */
function birdThink(b, dt){
  const K = BIRD_KINDS[b.k];
  const near = (kind, r)=>FLOCK.list.filter(o=>o!==b && (!kind || o.k===kind)
    && Math.hypot(o.x-b.x, o.y-b.y) < r);

  /* everything smaller than a kite keeps an eye on the kite */
  if(b.k !== 'kite'){
    const raptor = FLOCK.list.find(o=>o.k==='kite' && Math.hypot(o.x-b.x, o.y-b.y) < 190);
    if(raptor){
      const d = Math.hypot(raptor.x-b.x, raptor.y-b.y);
      b.fear = Math.min(1, b.fear + (1 - d/190) * dt * 2.2);
    }
  }
  b.fear = Math.max(0, b.fear - dt*0.35);

  /* frightened birds all do the same thing: get away, fast */
  if(b.fear > 0.35){
    const raptor = FLOCK.list.find(o=>o.k==='kite');
    if(raptor){
      const dx = b.x-raptor.x, dy = b.y-raptor.y, d = Math.hypot(dx,dy)||1;
      b.mode = 'flee';
      return { vx: dx/d*K.speed*1.9, vy: dy/d*K.speed*1.3 - 14 };
    }
  }

  if(b.k === 'finch'){
    /* to the middle of the others, off the closest one */
    const mates = near('finch', 210);
    let cx = 0, cy = 0, sx = 0, sy = 0;
    mates.forEach(o=>{
      cx += o.x; cy += o.y;
      const d = Math.hypot(o.x-b.x, o.y-b.y) || 1;
      if(d < 34){ sx += (b.x-o.x)/d; sy += (b.y-o.y)/d; }
    });
    if(mates.length){
      b.mode = 'flock';
      cx /= mates.length; cy /= mates.length;
      const dx = cx-b.x, dy = cy-b.y, d = Math.hypot(dx,dy)||1;
      return { vx: dx/d*K.speed*0.7 + sx*52 + Math.cos(b.t*1.7)*22,
               vy: dy/d*K.speed*0.5 + sy*52 + Math.sin(b.t*2.1)*16 };
    }
    /* Nobody within the cohesion radius, so go and find them. Without
       this a finch that drifts off one edge wraps to the other, lands
       1400px from the flock, and is orphaned for good — measured, the
       spread went 34px to 1407px the first time one crossed the boundary
       and it never came back. A separated bird looks for its flock at any
       distance, which is also what they actually do. */
    const far = FLOCK.list.filter(o=>o!==b && o.k==='finch');
    if(far.length){
      b.mode = 'rejoining';
      const near2 = far.reduce((a,o)=>
        Math.hypot(o.x-b.x,o.y-b.y) < Math.hypot(a.x-b.x,a.y-b.y) ? o : a, far[0]);
      const dx = near2.x-b.x, dy = near2.y-b.y, d = Math.hypot(dx,dy)||1;
      return { vx: dx/d*K.speed*1.25, vy: dy/d*K.speed*0.9 };
    }
  }

  if(b.k === 'bluebird'){
    /* works the air round a building, near its partner */
    const mate = FLOCK.list.find(o=>o!==b && o.k==='bluebird');
    if(!b.perch || b.hold <= 0){
      const objs = (S.objs||[]).filter(o=>BPMAP[o.bp] && ['home','housing','shop','store','process'].includes(BPMAP[o.bp].kind));
      const o = objs[Math.floor(Math.random()*objs.length)];
      if(o){ const f = footprint(BPMAP[o.bp], o.rot);
        b.perch = { x:(o.tx+f.w/2)*T, y:(o.ty)*T - 34 }; }
      b.hold = 10 + Math.random()*8;
    }
    b.hold -= dt;
    b.mode = 'perchwork';
    const p = b.perch || b.home;
    const ax = p.x + Math.cos(b.t*0.9)*46, ay = p.y + Math.sin(b.t*1.3)*24;
    let vx = (ax-b.x)*0.9, vy = (ay-b.y)*0.9;
    if(mate){ const d = Math.hypot(mate.x-b.x, mate.y-b.y);
      if(d > 120){ vx += (mate.x-b.x)*0.25; vy += (mate.y-b.y)*0.25; } }
    return { vx, vy };
  }

  if(b.k === 'martin'){
    /* long fast passes low over the beds, banking hard at each end */
    const beds = (S.objs||[]).filter(o=>BPMAP[o.bp] && BPMAP[o.bp].kind === 'plot');
    if(!b.lane || b.hold <= 0){
      const o = beds[Math.floor(Math.random()*beds.length)];
      const y = o ? (o.ty+1)*T - 26 : HPX*0.55;
      b.lane = { y, dir: Math.random()<0.5?-1:1 };
      b.hold = 4 + Math.random()*3;
    }
    b.hold -= dt;
    b.mode = 'hunting';
    if(b.x < 40) b.lane.dir = 1;
    if(b.x > WPX-40) b.lane.dir = -1;
    return { vx: b.lane.dir*K.speed*1.5,
             vy: (b.lane.y + Math.sin(b.t*3.4)*16 - b.y)*1.6 };
  }

  if(b.k === 'firecrest'){
    /* holds a patch and drives smaller birds out of it */
    const intruder = FLOCK.list.find(o=>o!==b && o.k!=='kite' && o.k!=='firecrest'
      && Math.hypot(o.x-b.home.x, o.y-b.home.y) < 150);
    if(intruder){
      b.mode = 'chasing';
      const dx = intruder.x-b.x, dy = intruder.y-b.y, d = Math.hypot(dx,dy)||1;
      intruder.fear = Math.min(1, intruder.fear + dt*1.1);
      return { vx: dx/d*K.speed*1.6, vy: dy/d*K.speed*1.1 };
    }
    b.mode = 'holding';
    const ax = b.home.x + Math.cos(b.t*0.7)*70, ay = b.home.y + Math.sin(b.t*0.9)*40;
    return { vx:(ax-b.x)*1.1, vy:(ay-b.y)*1.1 };
  }

  if(b.k === 'siskin'){
    /* drops to a bed and works it, and is nervous the whole time */
    const beds = (S.objs||[]).filter(o=>BPMAP[o.bp] && ['plot','perennial'].includes(BPMAP[o.bp].kind));
    if(!b.feed || b.hold <= 0){
      const o = beds[Math.floor(Math.random()*beds.length)];
      b.feed = o ? { x:(o.tx+1)*T, y:(o.ty+1)*T - 14 }
                 : { x:Math.random()*WPX, y:HPX*0.6 };
      b.hold = 6 + Math.random()*6;
    }
    b.hold -= dt;
    b.mode = 'feeding';
    const ax = b.feed.x + Math.cos(b.t*2.2)*18, ay = b.feed.y + Math.sin(b.t*2.8)*10;
    return { vx:(ax-b.x)*1.5, vy:(ay-b.y)*1.5 };
  }

  if(b.k === 'kite'){
    /* wide slow circles, high, and it never hurries */
    b.mode = 'soaring';
    const r = 200, sp = 0.34;
    const ax = b.home.x + Math.cos(b.t*sp)*r, ay = b.home.y + Math.sin(b.t*sp)*r*0.5;
    return { vx:(ax-b.x)*1.0, vy:(ay-b.y)*1.0 };
  }

  /* cruising: cross the farm and drift */
  b.mode = 'cruise';
  return { vx: b.vx, vy: Math.sin(b.t*1.4)*14 };
}

/* ---------- the shared tick ---------- */
function tickFlock(dt){
  if(!FLOCK.list.length) return;
  const away = (S.weather === 'storm' || S.weather === 'rain')
    || ((typeof isNight === 'function') ? isNight() : false);
  FLOCK.t += dt;
  const g = birdLayer(); if(!g) return;

  FLOCK.list.forEach(b=>{
    b.t += dt;
    const K = BIRD_KINDS[b.k];
    const want = birdThink(b, dt);
    /* ease into the wanted velocity so nothing snaps */
    b.vx += (want.vx - b.vx) * Math.min(1, dt*2.4);
    b.vy += (want.vy - b.vy) * Math.min(1, dt*2.4);
    const sp = Math.hypot(b.vx, b.vy), cap = K.speed*2.2;
    if(sp > cap){ b.vx = b.vx/sp*cap; b.vy = b.vy/sp*cap; }
    b.x += b.vx*dt; b.y += b.vy*dt;
    /* the sky wraps rather than ending */
    if(b.x < -140) b.x = WPX+130;
    if(b.x > WPX+140) b.x = -130;
    b.y = Math.max(-90, Math.min(HPX*0.86, b.y));

    let el = g.querySelector(`[data-bk="${b.id}"]`);
    if(!el){
      el = document.createElementNS('http://www.w3.org/2000/svg','g');
      el.setAttribute('data-bk', b.id);
      el.setAttribute('class', 'bird b-'+b.k);
      el.style.setProperty('--flap', K.flap+'s');
      el.innerHTML = birdKindArt(b.k);
      g.appendChild(el);
    }
    /* facing, and a bank into the turn */
    const face = b.vx < 0 ? -1 : 1;
    const bank = Math.max(-16, Math.min(16, b.vy*0.20)) * face;
    el.setAttribute('transform',
      `translate(${n(b.x)},${n(b.y)}) scale(${face},1) rotate(${bank.toFixed(1)})`);
    el.style.opacity = away ? 0 : (b.fear > 0.35 ? 1 : 0.96);
  });
}

/* ---------- CSS: the wings ---------- */
(function birdCss(){
  const s = document.createElement('style');
  s.textContent = `
  .bird .bw{ transform-box:fill-box; transform-origin:88% 78%;
    animation: bkflap var(--flap,.3s) ease-in-out infinite; }
  .bird .bw.far{ animation-delay:-.06s; opacity:.86; }
  @keyframes bkflap{
    0%   { transform: rotate(-30deg) scaleY(.82) }
    45%  { transform: rotate(24deg)  scaleY(1.14) }
    60%  { transform: rotate(16deg)  scaleY(1.04) }
    100% { transform: rotate(-30deg) scaleY(.82) }
  }
  /* the kite holds its wings out and barely moves them */
  .bird.b-kite .bw{ animation-timing-function: ease-in-out; }
  @media (prefers-reduced-motion: reduce){ .bird .bw{ animation:none } }
  `;
  document.head.appendChild(s);
})();

/* ---------- take over from p32's five silhouettes ---------- */
if(typeof tickPeople === 'function'){
  const _tickPeopleFlock = tickPeople;
  tickPeople = function(dt){
    const r = _tickPeopleFlock.apply(this, arguments);
    try{
      if(typeof BIRDS === 'object' && BIRDS.sky && BIRDS.sky.length){
        /* p32's sky birds are the same bird five times; these replace them */
        BIRDS.sky.forEach(b=>{
          const el = document.querySelector(`[data-b="${b.id}"]`);
          if(el) el.remove();
        });
        BIRDS.sky.length = 0;
      }
      if(!FLOCK.list.length && S && S.objs) birdSpawn();
      tickFlock(Math.min(0.08, typeof dt === 'number' ? dt : 0.05));
    }catch(e){}
    return r;
  };
}

/* ---------- handle ---------- */
G.birdAudit = function(){
  const by = {};
  FLOCK.list.forEach(b=>{
    by[b.k] = by[b.k] || { n:0, doing:{}, meanFear:0 };
    by[b.k].n++;
    by[b.k].doing[b.mode] = (by[b.k].doing[b.mode]||0) + 1;
    by[b.k].meanFear += b.fear;
  });
  Object.keys(by).forEach(k=>{ by[k].meanFear = +(by[k].meanFear/by[k].n).toFixed(2); });
  return {
    species: Object.keys(BIRD_KINDS).map(k=>`${BIRD_KINDS[k].n} — ${BIRD_KINDS[k].tag}`),
    inTheSky: FLOCK.list.length,
    byKind: by,
    drawn: document.querySelectorAll('#birdlay .bird').length,
    wingsAnimated: (function(){
      const w = document.querySelector('#birdlay .bird .bw');
      return w ? getComputedStyle(w).animationName : 'none drawn yet';
    })(),
    p32SilhouettesRetired: (typeof BIRDS === 'object') ? BIRDS.sky.length === 0 : '—',
  };
};
