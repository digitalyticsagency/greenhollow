/* =====================================================================
   EVERY BIRD IS A DIFFERENT BIRD, AND SOME OF THEM ARE SOMEBODY'S CHICK

   p134 gave the flock a species and a job. Two finches were still the
   same finch. This gives each one a temperament of its own, a life cycle,
   and somewhere it will not go.

   THEY KEEP OFF THE HOUSE. Nothing flies through the roof any more —
   every building pushes birds out of its footprint, and the bluebird that
   used to work "the air around a building" now holds station off the
   gable rather than inside the loft.

   A SOUL EACH. Five numbers rolled per bird — bold, curious, social,
   greedy, patient — and they bend whatever the species already does. A
   bold finch strays to the edge of the flock and a timid one will not
   leave the middle. A greedy siskin raids more and forgives you less. A
   patient bird sits its nest through weather that sends the others up.
   Two finches now fly differently, which is the whole point.

   THEY BREED. A bird with a nest, no fear and enough food lays. The egg
   sits for a while, rocks, cracks along a seam and a chick comes out —
   drawn in the nest, half the size, wings that do not work yet. It grows
   over about a week, follows a parent about, and then it is simply
   another bird in the sky with a soul of its own. Fell the tree and you
   lose the nest and whatever was in it, which is the sharpest version of
   the point p134 was already making.

   WHEN THEY ARE HAPPY THEY PLAY TOGETHER. Not scripted and not per
   species: when four or more are fed, unafraid and settled at once they
   find each other and turn a wheel over the farm together, and then break
   up again. It is the only thing in here that needs several birds to be
   content at the same time, so it is a reward for the whole system
   working rather than for one action.

   AND THEY DO NOT FOLLOW YOU EVERYWHERE. p134's tame birds tailed you
   permanently, which was charming for a minute and then odd. They come
   when the mood takes them — a cooldown and a roll against their own
   sociability — so a bird arriving to fly loops around you is an event.

   FEEDING IS A MENU NOW: scatter grain, fill a water bath they will
   actually bathe in, put up a nest box that raises the population past
   what your trees allow, and a roster of everyone you have got to know.
   ===================================================================== */

/* ---------- a soul, rolled once per bird ---------- */
const BIRD_NAMES = ['Pip','Tuck','Sorrel','Wisp','Bramble','Fen','Rook','Clover',
                    'Nettle','Ash','Sprig','Mote','Quill','Hazel','Dart','Puff'];
function soulOf(b){
  if(!b.soul){
    const h = (x)=>hash((b.id||'').length*7.7 + x*3.1 + (b.x||0)*0.013);
    b.soul = {
      bold:    +h(1).toFixed(2),
      curious: +h(2).toFixed(2),
      social:  +h(3).toFixed(2),
      greedy:  +h(4).toFixed(2),
      patient: +h(5).toFixed(2),
    };
    const taken = new Set((typeof FLOCK==='object'&&FLOCK.list?FLOCK.list:[]).map(o=>o.name).filter(Boolean));
    let ni = Math.floor(h(6)*BIRD_NAMES.length);
    for(let i=0;i<BIRD_NAMES.length && taken.has(BIRD_NAMES[ni]);i++)
      ni = (ni+1) % BIRD_NAMES.length;
    b.name = BIRD_NAMES[ni];
    /* a chick's age is 0, which is falsy — `b.age || 1` hatched every chick
       fully grown, and a grown chick has no nest, so the population cull
       ate it within seconds. Check for absence, not for truth. */
    if(b.age === undefined) b.age = 1;   /* 0..1 while a chick, 1 once grown */
  }
  return b.soul;
}

/* ---------- nothing flies through the roof ---------- */
function birdSolids(){
  return (S.objs||[]).filter(o=>{
    const bp = BPMAP[o.bp];
    return bp && ['home','housing','process','shop','store','hub','power'].includes(bp.kind);
  });
}
/* a push out of any footprint the bird is over */
function keepOffBuildings(b){
  let px = 0, py = 0;
  birdSolids().forEach(o=>{
    const f = footprint(BPMAP[o.bp], o.rot);
    const x0 = o.tx*T, x1 = (o.tx+f.w)*T, y0 = o.ty*T, y1 = (o.ty+f.h)*T;
    const m = 14;
    if(b.x > x0-m && b.x < x1+m && b.y > y0-m && b.y < y1+m){
      const cx = (x0+x1)/2, cy = (y0+y1)/2;
      const dx = b.x-cx, dy = b.y-cy, d = Math.hypot(dx,dy)||1;
      px += dx/d; py += dy/d;
    }
  });
  return { px, py, over: !!(px || py) };
}

/* ---------- nest boxes raise the ceiling ---------- */
(function nestBoxBlueprint(){
  if(typeof BP === 'undefined' || BPMAP.nestbox) return;
  const bp = { id:'nestbox', name:'Nest box', art:'nestbox', cat:'land',
    w:1, h:1, cost:38, lvl:1, kind:'decor', charm:2,
    desc:'A box on a post. Somewhere to raise a brood that is not a tree.',
    tip:'Holds two more birds than your trees allow, and they will nest and lay in it.' };
  BP.push(bp); BPMAP[bp.id] = bp;
})();
if(typeof ART === 'object' && !ART.nestbox){
  ART.nestbox = (w,h)=>{
    const cx = w/2;
    let s = patch(w, h, '#96ab5e', 63, 2);
    s += ao(cx-6, h*0.30, 12, h*0.58, 0.28);
    s += `<rect x="${n(cx-1.8)}" y="${n(h*0.42)}" width="3.6" height="${n(h*0.46)}" rx="1.4" fill="#7a5c3a"/>`;
    s += `<rect x="${n(cx-8)}" y="${n(h*0.24)}" width="16" height="17" rx="2" fill="#a07d52"/>`;
    s += `<rect x="${n(cx-8)}" y="${n(h*0.24)}" width="16" height="4" rx="2" fill="#c39d5c"/>`;
    s += `<path d="M${n(cx-10)} ${n(h*0.25)} l10 -7 l10 7 z" fill="#8a5f3a"/>`;
    s += `<circle cx="${n(cx)}" cy="${n(h*0.33)}" r="3.4" fill="#2a1f14"/>`;
    s += `<rect x="${n(cx-0.9)}" y="${n(h*0.38)}" width="1.8" height="5" rx="0.9" fill="#6b5335"/>`;
    return s;
  };
}
function nestBoxes(){ return (S.objs||[]).filter(o=>o.bp === 'nestbox'); }
if(typeof birdCapacity === 'function'){
  const _capBase = birdCapacity;
  birdCapacity = function(){
    const base = _capBase.apply(this, arguments);
    const boxes = nestBoxes().length;
    if(!base && !boxes) return 0;
    return Math.min(BIRD_MIX.length + 4, base + boxes*2);
  };
}

/* p134 keeps the flock at capacity by ejecting the first bird with no nest
   of its own — which is precisely a newly hatched chick, every time. A chick
   lives with its parent and does not hold a nest, so it neither counts
   against the ceiling nor queues for eviction until it has grown. */
if(typeof birdPopTick === 'function'){
  const _popBase = birdPopTick;
  birdPopTick = function(dt){
    const chicks = FLOCK.list.filter(b=>b.age !== undefined && b.age < 1);
    if(!chicks.length) return _popBase.apply(this, arguments);
    FLOCK.list = FLOCK.list.filter(b=>!(b.age !== undefined && b.age < 1));
    let r;
    try{ r = _popBase.apply(this, arguments); }
    finally{ chicks.forEach(c=>FLOCK.list.push(c)); }
    return r;
  };
}

/* ---------- the life cycle ---------- */
function broodState(){
  if(!S.brood) S.brood = { eggs:[], day:-1 };
  return S.brood;
}
function eggAt(b){
  const B = broodState();
  return B.eggs.find(e=>e.owner === b.id);
}
function tryLay(b, dt){
  const B = broodState();
  const s = soulOf(b);
  if(b.age < 1 || !b.nest || b.fear > 0.2) return;
  if(eggAt(b)) return;
  if(B.eggs.length >= 4) return;                 /* the farm is not an aviary */
  const fed = (b.fed || 0) > 2 || birdBestTrust(b) > 0.4;
  if(!fed) return;
  if(Math.random() < dt * 0.004 * (0.5 + s.patient)){
    B.eggs.push({ id:'eg'+Date.now()+Math.floor(Math.random()*99),
      owner:b.id, kind:b.k, x:b.nest.x, y:b.nest.y, t:0, hatched:0 });
    if(typeof log === 'function')
      log(`${b.name} the ${BIRD_KINDS[b.k].n.toLowerCase()} has laid in the nest.`, 'good', 'farm');
  }
}
const EGG_TIME = 40, CHICK_TIME = 70;
function tickBrood(dt){
  const B = broodState();
  if(!B.eggs.length) return;
  B.eggs.forEach(e=>{
    e.t += dt;
    if(!e.hatched && e.t > EGG_TIME){
      e.hatched = 1; e.t = 0;
      try{ sfx('chirp'); }catch(err){}
      /* the chick joins the flock as a real bird, only smaller and useless */
      const c = birdMake(e.kind, 'c'+Date.now()+Math.floor(Math.random()*99));
      c.x = e.x; c.y = e.y; c.age = 0; c.nestId = null; c.chickOf = e.owner;
      soulOf(c);
      FLOCK.list.push(c);
      e.chick = c.id;
      if(typeof log === 'function')
        log(`An egg hatched. ${c.name} is very small and extremely loud.`, 'good', 'farm');
    }
  });
  B.eggs = B.eggs.filter(e=>!(e.hatched && e.t > 12));
  /* chicks grow */
  FLOCK.list.forEach(b=>{
    if(b.age === undefined) b.age = 1;
    if(b.age < 1){
      b.age = Math.min(1, b.age + dt/CHICK_TIME);
      if(b.age >= 1 && !b.grown){
        b.grown = 1;
        if(typeof log === 'function')
          log(`${b.name} has got its full feathers.`, 'good', 'farm');
      }
    }
  });
}

/* ---------- happiness, and playing together ---------- */
function contentment(b){
  const s = soulOf(b);
  let c = 0.3;
  c += Math.min(0.3, (b.fed || 0) * 0.06);
  c += birdBestTrust(b) * 0.3;
  if(b.nest) c += 0.15;
  c -= b.fear * 0.8;
  c -= (1 - s.patient) * 0.05;
  return Math.max(0, Math.min(1, c));
}
const TOGETHER = { on:0, x:0, y:0, t:0, cool:0 };
function tickTogether(dt){
  TOGETHER.cool = Math.max(0, TOGETHER.cool - dt);
  const happy = FLOCK.list.filter(b=>b.age >= 1 && contentment(b) > 0.72 && b.fear < 0.15);
  if(!TOGETHER.on){
    if(happy.length >= 4 && TOGETHER.cool <= 0 && Math.random() < dt*0.25){
      TOGETHER.on = 1; TOGETHER.t = 0;
      happy.forEach(b=>{ b.life = null; });
      TOGETHER.x = happy.reduce((a,b)=>a+b.x,0)/happy.length;
      TOGETHER.y = Math.max(60, happy.reduce((a,b)=>a+b.y,0)/happy.length - 50);
      if(typeof log === 'function')
        log('The birds have got up together over the farm. Nobody is going anywhere in particular.',
            'good', 'farm');
      try{ sfx('chirp'); }catch(e){}
    }
    return;
  }
  TOGETHER.t += dt;
  /* p134 drives any bird with a `life` errand itself and never consults
     birdThink, so a bird stays on the seed pile through the whole display.
     Joining the flock means dropping the errand. */
  FLOCK.list.forEach(b=>{
    if(b.age >= 1 && b.fear < 0.2 && contentment(b) > 0.6 && b.life) b.life = null;
  });
  if(TOGETHER.t > 14 || happy.length < 3){ TOGETHER.on = 0; TOGETHER.cool = 90; }
}

/* ---------- the mind, on top of everything below it ---------- */
if(typeof birdThink === 'function'){
  const _thinkLives = birdThink;
  birdThink = function(b, dt){
    const s = soulOf(b);
    const K = BIRD_KINDS[b.k];

    /* a chick stays by its parent and cannot go far */
    if(b.age < 1){
      const mum = FLOCK.list.find(o=>o.id === b.chickOf);
      const tgt = mum || { x:b.x, y:b.y };
      b.mode = 'chick';
      const dx = tgt.x-b.x + Math.cos(b.t*2)*22, dy = tgt.y-b.y + Math.sin(b.t*2.4)*14;
      const d = Math.hypot(dx,dy)||1;
      return { vx: dx/d*K.speed*0.55, vy: dy/d*K.speed*0.45 };
    }

    /* everybody up together */
    if(TOGETHER.on && b.fear < 0.2 && contentment(b) > 0.6){
      b.mode = 'playing together';
      const a = b.t*1.9 + (s.social*6);
      const r = 60 + s.bold*70;
      const tx = TOGETHER.x + Math.cos(a)*r, ty = TOGETHER.y + Math.sin(a)*r*0.55;
      const dx = tx-b.x, dy = ty-b.y, d = Math.hypot(dx,dy)||1;
      return { vx: dx/d*K.speed*1.2, vy: dy/d*K.speed*0.95 };
    }

    /* p134 steers only the life modes it knows about, so a bird that had
       decided to bathe simply carried on cruising and never reached the
       water. The bath is ours, so we fly it ourselves. */
    if(b.life === 'bathing'){
      b.mode = 'bathing';
      const dx = (b.lx ?? b.x) - b.x, dy = (b.ly ?? b.y) - b.y;
      const d = Math.hypot(dx,dy) || 1;
      if(d < 8) return { vx: Math.cos(b.t*7)*7, vy: Math.sin(b.t*11)*5 };
      return { vx: dx/d*K.speed*0.9, vy: dy/d*K.speed*0.8 };
    }

    let want = _thinkLives.apply(this, arguments);

    /* the soul bends whatever it was going to do */
    if(want){
      const zip = 0.85 + s.bold*0.4;
      want = { vx: want.vx*zip, vy: want.vy*zip };
    }
    /* and nothing goes through a roof */
    const off = keepOffBuildings(b);
    if(off.over){
      b.mode = 'over a roof';
      want = { vx: (want?want.vx:0) + off.px*K.speed*2.2,
               vy: (want?want.vy:0) + off.py*K.speed*1.6 };
    }
    return want;
  };
}

/* they come to you sometimes, not always */
if(typeof tickBirdLife === 'function'){
  const _lifeBase = tickBirdLife;
  tickBirdLife = function(dt){
    const r = _lifeBase.apply(this, arguments);
    try{
      FLOCK.list.forEach(b=>{
        const s = soulOf(b);
        /* p134 sets life='playing' whenever a tame bird is within range,
           which had them tailing you permanently. It is a mood now: a
           cooldown, and a roll against how sociable this particular bird
           is. One coming over is meant to be an event. */
        b.noVisit = Math.max(0, (b.noVisit || 0) - dt);
        if(b.life === 'playing'){
          if(b.visit > 0){
            b.visit -= dt;                       /* mid-visit: let it finish */
            if(b.visit <= 0){ b.life = null; b.noVisit = 25 + (1-s.social)*70; }
          } else if(b.noVisit > 0){
            b.life = null;                       /* had its turn recently */
          } else if(Math.random() < dt * (0.04 + s.social*0.14)){
            b.visit = 5 + s.social*7;            /* it has decided to come over */
          } else {
            b.life = null;
          }
        }
        tryLay(b, dt);
      });
      tickBrood(dt);
      tickTogether(dt);
      tickBath(dt);
    }catch(e){}
    return r;
  };
}

/* ---------- the bath ---------- */
function tickBath(dt){
  const L = birdLifeState();
  if(!(L.bath > 0)) return;
  L.bath -= dt;
  FLOCK.list.forEach(b=>{
    if(b.age < 1 || b.fear > 0.3) return;
    const s = soulOf(b);
    const d = Math.hypot(L.bathX - b.x, L.bathY - b.y);
    if(b.life === 'bathing'){
      if(d < 26){ b.splash = (b.splash || 0) + dt; b.fear = 0; }
      if(b.splash > 5 + s.patient*6){ b.life = null; b.splash = 0; b.fed = (b.fed||0) + 0.5; }
      return;
    }
    /* the bold and the curious try the water first */
    if(d < 300 && Math.random() < dt * 0.05 * (0.4 + s.curious + s.bold*0.5)){
      b.life = 'bathing'; b.splash = 0;
      b.lx = L.bathX + (hash(b.id.length*5.1)-0.5)*26;
      b.ly = L.bathY + (hash(b.id.length*9.3)-0.5)*12;
    }
  });
  if(L.bath <= 0) FLOCK.list.forEach(b=>{ if(b.life === 'bathing'){ b.life = null; b.splash = 0; } });
}

/* ---------- eggs and chicks in the nest ---------- */
if(typeof paintNests === 'function'){
  const _nestBase = paintNests;
  paintNests = function(){
    const r = _nestBase.apply(this, arguments);
    try{
      const B = broodState();
      const L = birdLifeState();
      if(!B.eggs.length && !(L.bath > 0)) return r;
      let g = document.getElementById('nestlay');
      if(!g){
        const fg = document.getElementById('fg'); if(!fg) return r;
        g = document.createElementNS('http://www.w3.org/2000/svg','g');
        g.id = 'nestlay'; g.setAttribute('pointer-events','none');
        fg.appendChild(g);
      }
      const now = performance.now()/1000;
      let s = '';
      if(L.bath > 0){
        const k = Math.min(1, L.bath/40);
        s += `<ellipse cx="${n(L.bathX)}" cy="${n(L.bathY)}" rx="17" ry="9" fill="#6f5a44"/>`;
        s += `<ellipse cx="${n(L.bathX)}" cy="${n(L.bathY-1)}" rx="14" ry="7"
          fill="#7fb6cc" opacity="${(0.55+0.35*k).toFixed(2)}"/>`;
        for(let i=0;i<3;i++){
          const rr = 3 + ((now*7 + i*3) % 11);
          s += `<ellipse cx="${n(L.bathX)}" cy="${n(L.bathY-1)}" rx="${n(rr)}" ry="${n(rr*0.5)}"
            fill="none" stroke="#dff2fb" stroke-width="0.7"
            opacity="${(0.5*(1-rr/14)).toFixed(2)}"/>`;
        }
        FLOCK.list.filter(b=>b.life === 'bathing' && b.splash > 0).forEach((b,i)=>{
          const j = Math.abs(Math.sin(now*9 + i))*4;
          for(let d=0;d<3;d++)
            s += `<circle cx="${n(b.x + (d-1)*5)}" cy="${n(b.y + 4 - j - d*2)}" r="1.1"
              fill="#dff2fb" opacity="${(0.8 - d*0.2).toFixed(2)}"/>`;
        });
      }
      B.eggs.forEach(e=>{
        if(!e.hatched){
          const k = e.t / EGG_TIME;
          /* it rocks more the closer it is */
          const rock = Math.sin(now*(2 + k*7)) * (0.6 + k*5);
          s += `<g transform="translate(${n(e.x)},${n(e.y+1)}) rotate(${rock.toFixed(1)})">`;
          s += `<ellipse cx="0" cy="0" rx="3.2" ry="4.1" fill="#f2ead6"/>`;
          s += `<ellipse cx="-0.9" cy="-1.2" rx="1.4" ry="1.8" fill="#fffaf0" opacity=".8"/>`;
          for(let i=0;i<3;i++)
            s += `<circle cx="${n((hash(i*3.1)-0.5)*4)}" cy="${n((hash(i*7.7)-0.5)*5)}"
              r="0.5" fill="#c9b48c"/>`;
          /* the shell splits before it goes */
          if(k > 0.85)
            s += `<path d="M-3 0 l2 -1.4 l1.6 1.4 l2 -1.2" stroke="#c9b48c"
              stroke-width="0.7" fill="none"/>`;
          s += `</g>`;
        } else if(e.t < 12){
          /* shell halves left in the nest for a moment */
          const k = 1 - e.t/12;
          s += `<path d="M${n(e.x-4)} ${n(e.y+2)} q2 -3 4 0 z" fill="#f2ead6" opacity="${k.toFixed(2)}"/>`;
          s += `<path d="M${n(e.x+1)} ${n(e.y+2)} q2 -3 4 0 z" fill="#efe4cc" opacity="${k.toFixed(2)}"/>`;
        }
      });
      g.innerHTML += s;
    }catch(e){}
    return r;
  };
}

/* a chick is drawn small and its wings do not work yet */
if(typeof tickFlock === 'function'){
  const _flockLives = tickFlock;
  tickFlock = function(dt){
    const r = _flockLives.apply(this, arguments);
    try{
      FLOCK.list.forEach(b=>{
        if(b.age === undefined) return;
        const el = document.querySelector(`#birdlay [data-bk="${b.id}"]`);
        if(!el) return;
        const grow = 0.45 + 0.55*b.age;
        if(el.dataset.grow !== grow.toFixed(2)){
          el.dataset.grow = grow.toFixed(2);
          const t = el.getAttribute('transform') || '';
          if(!/scale\([^)]*\)\s*$/.test(t)) el.setAttribute('transform', t + ` scale(${grow.toFixed(2)})`);
        }
        el.classList.toggle('chick', b.age < 1);
      });
    }catch(e){}
    return r;
  };
}

/* ---------- feeding is a menu now ---------- */
G.openBirdCare = function(){
  const L = birdLifeState();
  const B = broodState();
  const known = FLOCK.list.filter(b=>birdTrust(b,'you') > 0.15);
  modal(`<h2>The birds</h2>
    <p class="sub">${birdTrees().length} tree${birdTrees().length===1?'':'s'} and
      ${nestBoxes().length} nest box${nestBoxes().length===1?'':'es'} between them hold
      ${birdCapacity()}. There are ${FLOCK.list.length} about at the moment${
      B.eggs.length ? `, and ${B.eggs.length} egg${B.eggs.length>1?'s':''} in the nests` : ''}.</p>
    <div class="mkgrid">
      <button class="mkcard" ${(S.feed||0) < 2 || L.fedToday >= 3 ? 'disabled':''}
        onclick="G.feedBirds();G.openBirdCare()"><b>Scatter grain</b>
        <span class="muted">Two feed. They learn who you are.</span>
        <span class="lprice">${L.fedToday >= 3 ? 'Enough for today' : (S.feed||0) < 2 ? 'No feed' : 'Scatter'}</span></button>
      <button class="mkcard" ${(S.water||0) < 20 ? 'disabled':''}
        onclick="G.birdBath();G.openBirdCare()"><b>Fill the bath</b>
        <span class="muted">20L. They will bathe, and it settles them.</span>
        <span class="lprice">${(S.water||0) < 20 ? 'No water' : 'Fill it'}</span></button>
      <button class="mkcard" onclick="G.closeModal();G.buildNestBox()"><b>Put up a nest box</b>
        <span class="muted">Two more birds than the trees allow.</span>
        <span class="lprice">${fmt(38)}</span></button>
      <button class="mkcard" onclick="G.birdRoster()"><b>Who you know</b>
        <span class="muted">${known.length} of them have decided about you.</span>
        <span class="lprice">Look</span></button>
    </div>
    <div class="mfoot"><button class="btn ghost" onclick="G.closeModal()">Leave them be</button></div>`);
};

G.birdBath = function(){
  if((S.water||0) < 20) return toast('Not enough water','bad');
  S.water -= 20;
  const L = birdLifeState();
  L.bathX = S.you ? S.you.x : (FARM.x+4)*T;
  L.bathY = S.you ? S.you.y + 16 : (FARM.y+4)*T;
  L.bath = 40;
  FLOCK.list.forEach(b=>{ b.fear = Math.max(0, b.fear - 0.3); });
  if(typeof toast === 'function') toast('Bath filled', 'good');
  if(typeof log === 'function') log('You put water out. Half of them were in it before you straightened up.', 'good', 'farm');
};

G.buildNestBox = function(){
  if(typeof G.pick === 'function'){ try{ G.pick('nestbox'); return; }catch(e){} }
  if(typeof toast === 'function') toast('Nest box is in Build → Land', '');
};

G.birdRoster = function(){
  const known = FLOCK.list.filter(b=>birdTrust(b,'you') > 0.15)
    .sort((a,b)=>birdTrust(b,'you')-birdTrust(a,'you'));
  modal(`<h2>Who you know</h2>
    ${known.length ? known.map(b=>{
      const s = soulOf(b), t = birdTrust(b,'you');
      const temper = s.bold>0.66?'bold':s.bold<0.34?'timid':'steady';
      const soc = s.social>0.6?'sociable':'keeps to itself';
      return `<div class="ledrow"><span>${b.name} — ${BIRD_KINDS[b.k].n.toLowerCase()}${
        b.age<1?' (chick)':''}<br><span class="muted" style="font-size:11px">${temper}, ${soc}${
        b.nest?', has a nest':''}</span></span>
        <b>${Math.round(t*100)}%</b></div>`;
    }).join('') : `<p class="sub">None of them have made their minds up about you yet.
      Scatter some grain and stand still.</p>`}
    <div class="mfoot"><button class="btn" onclick="G.openBirdCare()">Back</button></div>`);
};

/* the button opens the menu rather than scattering straight away */
if(typeof syncWorldButtons === 'function'){
  const _syncCare = syncWorldButtons;
  syncWorldButtons = function(){
    const r = _syncCare.apply(this, arguments);
    try{
      const b = document.getElementById('feedbirdbtn');
      if(b){
        b.onclick = ()=>G.openBirdCare();
        b.setAttribute('data-tip','<b>The birds</b>Grain, water, nest boxes, and who has made their mind up about you.');
        /* p134 showed this only when birds were already about, which was
           right for a scatter-grain button and wrong for a menu: putting up
           a nest box is how you get birds in the first place. Anywhere with
           somewhere to nest gets the button. */
        b.style.display = (FLOCK.list.length || birdTrees().length || nestBoxes().length) ? '' : 'none';
      }
    }catch(e){}
    return r;
  };
}

(function livesCss(){
  const s = document.createElement('style');
  s.textContent = `
  .bird.chick .bw{ animation-duration:.16s; }
  `;
  document.head.appendChild(s);
})();

/* ---------- handle ---------- */
G.birdLivesAudit = function(){
  const B = broodState();
  const souls = FLOCK.list.map(b=>{ const s=soulOf(b); return {
    name:b.name, kind:b.k, age:b.age<1?Math.round(b.age*100)+'% grown':'adult',
    bold:s.bold, social:s.social, greedy:s.greedy,
    content:+contentment(b).toFixed(2), doing:b.mode }; });
  const inHouse = FLOCK.list.filter(b=>keepOffBuildings(b).over).length;
  return {
    birds: FLOCK.list.length,
    capacity: birdCapacity(),
    fromTrees: birdTrees().length*2,
    fromNestBoxes: nestBoxes().length*2,
    eggs: B.eggs.filter(e=>!e.hatched).length,
    chicks: FLOCK.list.filter(b=>b.age<1).length,
    overABuildingRightNow: inHouse,
    playingTogether: !!TOGETHER.on,
    playCooldown: Math.round(TOGETHER.cool),
    happyEnoughToPlay: FLOCK.list.filter(b=>contentment(b)>0.72).length + ' of ' + FLOCK.list.length,
    everySoulDifferent: new Set(souls.map(s=>JSON.stringify([s.bold,s.social,s.greedy]))).size
      + ' distinct of ' + souls.length,
    souls: souls.slice(0,6),
  };
};
