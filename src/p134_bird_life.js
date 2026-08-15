/* =====================================================================
   BIRDS BELONG TO THE TREES, AND THEY REMEMBER WHO FED THEM

   p132 put twelve birds in the sky and they were there whatever the farm
   looked like — a field of bare soil had the same flock over it as an
   orchard. They were also too big and too many. This makes them part of
   the land instead of decoration on top of it.

   THE TREES DECIDE HOW MANY. Two birds a tree, and a kite only once
   there are six trees to hunt over. Plant a wood and it fills up over the
   following days; fell the lot and they leave. No trees, no birds — you
   can empty the sky by clearing the land, which is exactly what happens.
   They arrive and leave a bird at a time so it reads as a population
   rather than a switch.

   THEY NEST. Each bird holds a tree and goes back to it — at night, and
   through the day when it has nothing else on. It drops into the canopy,
   the wings stop, and it sits there bobbing with a nest under it. That is
   also why felling a tree matters: the bird in it loses its nest.

   THEY EAT YOUR CROPS. A bird with no reason to like you will drop onto a
   ripening bed and take some. Not catastrophic, but it accumulates, and
   it is the reason the next two things exist.

   A SCARECROW STOPS THEM. Build one and nothing will feed inside its
   radius. It does not kill birds or drive them off the farm — it moves
   them along, which is what a scarecrow does.

   OR YOU FEED THEM, AND THEY REMEMBER YOU. Scatter grain and every bird
   that comes to it learns who you are. Trust is per person, so the
   farmer who feeds them is not the same to them as the one who never
   has. Past half trust a bird stops raiding your beds entirely; past
   three quarters it sings when you are near and flies loops around you.
   You buy the crop protection with kindness rather than a stick, and
   both work.
   ===================================================================== */

/* ---------- the trees are the carrying capacity ---------- */
function birdTrees(){
  return (S.objs||[]).filter(o=>{
    const bp = BPMAP[o.bp];
    return bp && /^tree_/.test(bp.art || '');
  });
}
function birdCapacity(){
  const t = birdTrees().length;
  if(!t) return 0;
  return Math.min(BIRD_MIX.length, Math.round(t*2));
}
/* the kite needs somewhere worth hunting over */
function birdAllowed(k){
  return k !== 'kite' || birdTrees().length >= 6;
}

function birdLifeState(){
  if(!S.birdlife) S.birdlife = { day:-1, fedToday:0, raids:0, seed:0 };
  if(S.birdlife.day !== S.day){ S.birdlife.day = S.day; S.birdlife.fedToday = 0; S.birdlife.raids = 0; }
  return S.birdlife;
}

/* one in, one out, so the sky fills and empties gradually */
let BIRD_POP_T = 0;
function birdPopTick(dt){
  BIRD_POP_T += dt;
  if(BIRD_POP_T < 2.5) return;
  BIRD_POP_T = 0;
  const cap = birdCapacity();
  if(FLOCK.list.length > cap){
    /* the ones without a nest go first */
    const idx = FLOCK.list.findIndex(b=>!b.nest);
    const gone = FLOCK.list.splice(idx >= 0 ? idx : FLOCK.list.length-1, 1)[0];
    if(gone){
      const el = document.querySelector(`#birdlay [data-bk="${gone.id}"]`);
      if(el) el.remove();
    }
    return;
  }
  if(FLOCK.list.length < cap){
    const k = BIRD_MIX[FLOCK.list.length % BIRD_MIX.length];
    if(!birdAllowed(k)) return;
    FLOCK.list.push(birdMake(k, 'p'+Date.now()+FLOCK.list.length));
  }
}

/* p132 spawns a fixed twelve when the list is empty; the trees own this now */
if(typeof birdSpawn === 'function'){
  birdSpawn = function(){
    /* Seeds a few and lets birdPopTick grow the rest. Filling straight to
       capacity made planting a wood switch the sky from empty to twelve
       birds between one frame and the next — measured, it went 0 to 12
       with no middle. They arrive one at a time now, which is the whole
       point of tying them to the trees. */
    FLOCK.list = [];
    const cap = Math.min(birdCapacity(), 3);
    for(let i=0;i<cap;i++){
      const k = BIRD_MIX[i % BIRD_MIX.length];
      if(birdAllowed(k)) FLOCK.list.push(birdMake(k, 'i'+i));
    }
  };
}

/* ---------- nests ---------- */
function birdClaimNest(b){
  const trees = birdTrees();
  if(!trees.length){ b.nest = null; return null; }
  let t = trees.find(o=>o.id === b.nestId);
  if(!t){
    /* prefer a tree nobody has taken */
    const taken = new Set(FLOCK.list.map(o=>o.nestId).filter(Boolean));
    t = trees.find(o=>!taken.has(o.id)) || trees[Math.floor(Math.random()*trees.length)];
    b.nestId = t.id;
  }
  const f = footprint(BPMAP[t.bp], t.rot);
  b.nest = { x:(t.tx + f.w/2)*T, y:(t.ty + f.h*0.42)*T, id:t.id };
  return b.nest;
}

/* ---------- the scarecrow ---------- */
(function scarecrowBlueprint(){
  if(typeof BP === 'undefined' || BPMAP.scarecrow) return;
  const bp = { id:'scarecrow', name:'Scarecrow', art:'scarecrow', cat:'land',
    w:1, h:1, cost:45, lvl:1, kind:'decor', charm:2,
    desc:'A coat on a cross-post. Birds will not feed anywhere near it.',
    tip:'Stops birds taking from beds inside about four tiles. It moves them along rather than driving them off the farm.' };
  BP.push(bp); BPMAP[bp.id] = bp;
})();

if(typeof ART === 'object' && !ART.scarecrow){
  ART.scarecrow = (w,h)=>{
    const cx = w/2;
    let s = patch(w, h, '#9aad5e', 51, 2);
    s += ao(cx-9, h*0.30, 18, h*0.62, 0.30);
    /* the cross-post */
    s += `<rect x="${n(cx-1.8)}" y="${n(h*0.24)}" width="3.6" height="${n(h*0.62)}" rx="1.4" fill="#7a5c3a"/>`;
    s += `<rect x="${n(cx-11)}" y="${n(h*0.40)}" width="22" height="3" rx="1.4" fill="#8a6a45"/>`;
    /* straw poking out at the wrists */
    [-11, 8].forEach(x=>{
      for(let i=0;i<3;i++)
        s += `<path d="M${n(cx+x+ (x<0?0:3))} ${n(h*0.41)} l${n((x<0?-4:4)+i)} ${n(3+i*1.6)}"
          stroke="url(#gStraw)" stroke-width="1.3" stroke-linecap="round" fill="none"/>`;
    });
    /* the coat */
    s += `<path d="M${n(cx-8)} ${n(h*0.40)} L${n(cx+8)} ${n(h*0.40)}
      L${n(cx+6)} ${n(h*0.70)} L${n(cx-6)} ${n(h*0.70)} Z" fill="#5f6b8a"/>`;
    s += `<path d="M${n(cx-8)} ${n(h*0.40)} L${n(cx)} ${n(h*0.40)}
      L${n(cx-1)} ${n(h*0.70)} L${n(cx-6)} ${n(h*0.70)} Z" fill="#78849f" opacity=".8"/>`;
    /* head and a hat with a brim */
    s += `<circle cx="${n(cx)}" cy="${n(h*0.32)}" r="${n(5.2)}" fill="#d8c48a"/>`;
    s += `<circle cx="${n(cx-1.6)}" cy="${n(h*0.315)}" r="0.9" fill="#3a3026"/>`;
    s += `<circle cx="${n(cx+1.8)}" cy="${n(h*0.315)}" r="0.9" fill="#3a3026"/>`;
    s += `<path d="M${n(cx-3)} ${n(h*0.35)} q3 2 6 0" stroke="#3a3026" stroke-width="0.9"
      fill="none" stroke-linecap="round"/>`;
    s += `<ellipse cx="${n(cx)}" cy="${n(h*0.27)}" rx="9" ry="2.6" fill="#8a6a45"/>`;
    s += `<path d="M${n(cx-5)} ${n(h*0.27)} q5 -7 10 0 z" fill="#a07d52"/>`;
    return s;
  };
}

const SCARE_R = 4.2*40;                 /* about four tiles */
function scarecrows(){ return (S.objs||[]).filter(o=>o.bp === 'scarecrow'); }
function scaredHere(x, y){
  return scarecrows().some(o=>{
    const f = footprint(BPMAP[o.bp], o.rot);
    return Math.hypot((o.tx+f.w/2)*T - x, (o.ty+f.h/2)*T - y) < SCARE_R;
  });
}

/* ---------- who they know ---------- */
function birdTrust(b, who){ return (b.knows && b.knows[who]) || 0; }
function birdLearn(b, who, amt){
  b.knows = b.knows || {};
  b.knows[who] = Math.min(1, (b.knows[who] || 0) + amt);
  return b.knows[who];
}
/* the trust that matters for the crops is the best of anybody's */
function birdBestTrust(b){
  return Math.max(0, ...Object.values(b.knows || {}));
}

/* ---------- feeding ---------- */
G.feedBirds = function(){
  const L = birdLifeState();
  if(!S.you){ return; }
  if((S.feed || 0) < 2){ if(typeof toast==='function') toast('No feed in the barn','bad'); return; }
  if(L.fedToday >= 3){ if(typeof toast==='function') toast('You have scattered enough today',''); return; }
  if(typeof G.wakeTheWorld === 'function') G.wakeTheWorld();
  S.feed = Math.max(0, (S.feed||0) - 2);
  L.fedToday++;
  L.seedX = S.you.x; L.seedY = S.you.y + 14; L.seed = 26;      /* seconds it stays down */
  if(typeof toast === 'function') toast('Grain scattered', 'good');
  if(typeof log === 'function') log('You scattered grain for the birds.', '', 'farm');
};

/* ---------- the life tick ---------- */
function tickBirdLife(dt){
  const L = birdLifeState();
  birdPopTick(dt);
  if(L.seed > 0) L.seed -= dt;

  const night = (typeof isNight === 'function') ? isNight() : false;
  const you = S.you;

  FLOCK.list.forEach(b=>{
    /* it always has a tree in mind, if there is one */
    if(!b.nest || !(S.objs||[]).some(o=>o.id === b.nestId)) birdClaimNest(b);

    /* 1. grain on the ground beats everything short of a raptor */
    if(L.seed > 0 && b.fear < 0.35){
      const d = Math.hypot(L.seedX - b.x, L.seedY - b.y);
      if(d < 340){
        b.life = 'toseed';
        b.lx = L.seedX + (hash(b.id.length*3.1)-0.5)*30;
        b.ly = L.seedY + (hash(b.id.length*7.3)-0.5)*18;
        if(d < 26){
          b.fed = (b.fed || 0) + dt;
          const t = birdLearn(b, 'you', dt*0.09);
          if(t > 0.5 && !b.friendSaid){
            b.friendSaid = 1;
            if(typeof log === 'function')
              log(`A ${BIRD_KINDS[b.k].n.toLowerCase()} has decided you are all right. It will leave the beds alone.`,
                  'good', 'farm');
          }
        }
        return;
      }
    }

    /* 2. roosting: at night, or when it has nothing else on */
    b.roost = Math.max(0, (b.roost || 0) - dt);
    if(b.nest && (night || (b.roost <= 0 && Math.random() < dt*0.03))){
      b.life = 'nesting';
      b.lx = b.nest.x; b.ly = b.nest.y;
      if(!night && Math.hypot(b.x-b.nest.x, b.y-b.nest.y) < 12) b.roost = 8 + Math.random()*10;
      return;
    }

    /* 3. raiding a bed — unless it likes you, or a scarecrow says no */
    if(birdBestTrust(b) < 0.5 && b.k !== 'kite' && b.fear < 0.3){
      if(!b.raidT || b.raidT <= 0){
        const beds = (S.objs||[]).filter(o=>{
          const bp = BPMAP[o.bp];
          return bp && ['plot','perennial'].includes(bp.kind) && (o.crop || bp.kind==='perennial')
            && (o.stage || 0) > 0.35;
        }).filter(o=>{
          const f = footprint(BPMAP[o.bp], o.rot);
          return !scaredHere((o.tx+f.w/2)*T, (o.ty+f.h/2)*T);
        });
        if(beds.length && Math.random() < dt*0.06){
          const o = beds[Math.floor(Math.random()*beds.length)];
          const f = footprint(BPMAP[o.bp], o.rot);
          b.raid = o.id; b.raidT = 9;
          b.lx = (o.tx + Math.random()*f.w)*T;
          b.ly = (o.ty + Math.random()*f.h)*T;
        }
      }
      if(b.raidT > 0){
        b.raidT -= dt;
        b.life = 'raiding';
        const o = (S.objs||[]).find(x=>x.id === b.raid);
        if(o && Math.hypot(b.x-b.lx, b.y-b.ly) < 18){
          if(scaredHere(b.x, b.y)){ b.raidT = 0; b.life = null; b.fear = Math.max(b.fear, 0.4); return; }
          o.stage = Math.max(0, (o.stage||0) - dt*0.014);
          if(Math.random() < dt*0.2){ L.raids++; }
        }
        return;
      }
    }

    /* 4. a bird that trusts you comes and plays, and sings about it */
    if(you && birdTrust(b, 'you') > 0.75 && b.fear < 0.25){
      const d = Math.hypot(you.x-b.x, you.y-b.y);
      if(d < 260){
        b.life = 'playing';
        const a = b.t*2.2;
        b.lx = you.x + Math.cos(a)*54;
        b.ly = you.y - 26 + Math.sin(a)*26;
        b.sing = (b.sing || 0) - dt;
        if(b.sing <= 0){ b.sing = 3 + Math.random()*4; try{ sfx('chirp'); }catch(e){} }
        return;
      }
    }
    b.life = null;
  });
}

/* the life goals outrank the species steering in p132 */
if(typeof birdThink === 'function'){
  const _birdThinkLife = birdThink;
  birdThink = function(b, dt){
    const base = _birdThinkLife.apply(this, arguments);
    try{
      if(b.fear > 0.35) return base;             /* a raptor still beats everything */
      if(b.life && b.lx !== undefined){
        const K = BIRD_KINDS[b.k];
        b.mode = b.life;
        const dx = b.lx-b.x, dy = b.ly-b.y, d = Math.hypot(dx,dy)||1;
        const slow = (b.life === 'nesting' || b.life === 'toseed') && d < 40;
        return { vx: dx/d*K.speed*(slow?0.5:1.15), vy: dy/d*K.speed*(slow?0.4:0.9) };
      }
    }catch(e){}
    return base;
  };
}

/* a nesting or feeding bird folds its wings */
if(typeof tickFlock === 'function'){
  const _tickFlockLife = tickFlock;
  tickFlock = function(dt){
    const r = _tickFlockLife.apply(this, arguments);
    try{
      FLOCK.list.forEach(b=>{
        const el = document.querySelector(`#birdlay [data-bk="${b.id}"]`);
        if(!el) return;
        const settled = (b.life === 'nesting' || b.life === 'toseed' || b.life === 'raiding')
          && Math.hypot(b.x - (b.lx===undefined?b.x:b.lx), b.y - (b.ly===undefined?b.y:b.ly)) < 16;
        el.classList.toggle('settled', !!settled);
      });
    }catch(e){}
    return r;
  };
}

/* nests in the trees, and the grain on the ground */
function paintNests(){
  const L = birdLifeState();
  let g = document.getElementById('nestlay');
  const nested = FLOCK.list.filter(b=>b.nest && b.life === 'nesting'
    && Math.hypot(b.x-b.nest.x, b.y-b.nest.y) < 16);
  if(!nested.length && !(L.seed > 0)){ if(g) g.remove(); return; }
  if(!g){
    const fg = document.getElementById('fg'); if(!fg) return;
    g = document.createElementNS('http://www.w3.org/2000/svg','g');
    g.id = 'nestlay'; g.setAttribute('pointer-events','none');
    fg.appendChild(g);
  }
  let s = '';
  nested.forEach(b=>{
    s += `<ellipse cx="${n(b.nest.x)}" cy="${n(b.nest.y+5)}" rx="7" ry="3.4" fill="#6b5335"/>`;
    s += `<ellipse cx="${n(b.nest.x)}" cy="${n(b.nest.y+4)}" rx="5.4" ry="2.4" fill="#8a6f47"/>`;
  });
  if(L.seed > 0){
    const k = Math.min(1, L.seed/26);
    for(let i=0;i<9;i++){
      const a = hash(i*4.7), b2 = hash(i*2.3);
      s += `<circle cx="${n(L.seedX + (a-0.5)*30)}" cy="${n(L.seedY + (b2-0.5)*18)}"
        r="1.3" fill="#e8c96a" opacity="${(0.85*k).toFixed(2)}"/>`;
    }
  }
  g.innerHTML = s;
}

if(typeof tickPeople === 'function'){
  const _tickPeopleLife = tickPeople;
  tickPeople = function(dt){
    const r = _tickPeopleLife.apply(this, arguments);
    try{
      tickBirdLife(Math.min(0.08, typeof dt === 'number' ? dt : 0.05));
      paintNests();
    }catch(e){}
    return r;
  };
}

/* the feed button, beside the other world buttons */
if(typeof syncWorldButtons === 'function'){
  const _syncFeed = syncWorldButtons;
  syncWorldButtons = function(){
    const r = _syncFeed.apply(this, arguments);
    try{
      const host = document.getElementById('zoomctl');
      if(!host) return r;
      let b = document.getElementById('feedbirdbtn');
      if(!b){
        b = document.createElement('button');
        b.id = 'feedbirdbtn';
        b.textContent = '🌾';
        b.title = 'Scatter grain for the birds';
        b.setAttribute('data-tip','<b>Feed the birds</b>Two feed from the barn. Every bird that comes learns who you are, and one that trusts you leaves the beds alone and sings when you pass.');
        b.onclick = ()=>G.feedBirds();
        host.insertBefore(b, host.firstChild);
      }
      b.style.display = FLOCK.list.length ? '' : 'none';
    }catch(e){}
    return r;
  };
}

(function birdLifeCss(){
  const s = document.createElement('style');
  s.textContent = `
  #feedbirdbtn{ font-size:15px; line-height:1 }
  /* a bird that has landed folds its wings and just breathes */
  .bird.settled .bw{ animation: bksettle 2.6s ease-in-out infinite; }
  @keyframes bksettle{ 0%,100%{ transform: rotate(-6deg) scaleY(.96) }
                       50%  { transform: rotate(-2deg) scaleY(1.02) } }
  @media (prefers-reduced-motion: reduce){ .bird.settled .bw{ animation:none } }
  `;
  document.head.appendChild(s);
})();

/* ---------- handle ---------- */
G.birdLifeAudit = function(){
  const L = birdLifeState();
  const trees = birdTrees().length;
  const by = {};
  FLOCK.list.forEach(b=>{
    const l = b.life || 'own business';
    by[l] = (by[l]||0)+1;
  });
  return {
    trees,
    capacity: birdCapacity(),
    inTheSky: FLOCK.list.length,
    kiteAllowed: birdAllowed('kite') ? 'yes — six trees or more' : 'no — needs six trees',
    doing: by,
    nesting: FLOCK.list.filter(b=>b.life==='nesting').length,
    withNests: FLOCK.list.filter(b=>b.nest).length,
    scarecrows: scarecrows().length,
    scarecrowRadius: (SCARE_R/40).toFixed(1)+' tiles',
    trustInYou: FLOCK.list.map(b=>+birdTrust(b,'you').toFixed(2)).sort((a,b2)=>b2-a),
    friendly: FLOCK.list.filter(b=>birdBestTrust(b) >= 0.5).length + ' will not touch the beds',
    grainDown: L.seed > 0 ? Math.round(L.seed)+'s left' : 'none',
    raidsToday: L.raids,
    feedInBarn: S.feed || 0,
  };
};
