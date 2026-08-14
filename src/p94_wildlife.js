/* =====================================================================
   WILDLIFE — SIX SPECIES, EACH WITH ITS OWN HEAD

   Nothing outside the fence had ever mattered. The farm was a closed
   system: your animals, your family, your guests, and a horizon that was
   scenery. So there were no stakes at night, and the dog you can buy had
   nothing to be for beyond fetching your own stock back.

   Six species, each built from what the animal actually does rather than
   from a difficulty knob:

     fox       nocturnal, bold, and the only real threat. Works the fence
               line, goes for hens, and will not come near the dog.
     badger    nocturnal, heavy, uninterested in your birds. Digs, wrecks
               a bed, ambles off. A nuisance, not a predator.
     deer      crepuscular, extremely wary, browses anything growing that
               is not fenced. Gone at the first thing that moves.
     hare      crepuscular, nervous, harmless. Sits in the open until
               something gets close, then leaves at speed.
     owl       nocturnal, silent, entirely beneficial - it takes the mice
               that eat your feed. Worth having, never worth chasing.
     buzzard   diurnal, circles high, drops on something in the meadow.
               Occasionally eyes the poultry, mostly does not bother.

   EACH INDIVIDUAL IS DIFFERENT. A species sets the range; the animal
   drawn from it gets its own boldness, wariness, hunger and patience, so
   one fox will chance the yard in daylight and another will not come past
   the hedge all week. They are not scripted: each has drives, a memory of
   what has frightened it and where the food was, and picks what to do
   from what it can see. A fox that has been chased off by the dog twice
   stops trying that corner.

   The dog is the answer to most of it, which is the point. Her duty drive
   already outranks everything else; predators now register as duty.
   ===================================================================== */

const WILD = {
  fox: {
    n:'Fox', active:'night', threat:true, targets:'poultry',
    speed:78, wary:0.45, bold:0.75, size:1,
    col:{body:'#c4642c', dark:'#9c4a1e', pale:'#f0e6d8'},
    say:['…','!'], seen:'A fox is working along the fence line.' },
  badger: {
    n:'Badger', active:'night', threat:false, targets:'beds',
    speed:52, wary:0.35, bold:0.8, size:1.05,
    col:{body:'#5a5550', dark:'#2b2724', pale:'#eceae4'},
    say:['…'], seen:'A badger has come through the hedge.' },
  deer: {
    n:'Roe deer', active:'dusk', threat:false, targets:'crops',
    speed:96, wary:0.92, bold:0.25, size:1.25,
    col:{body:'#a87a4e', dark:'#7d5a36', pale:'#f2ead6'},
    say:['…'], seen:'Deer are out at the edge of the beds.' },
  hare: {
    n:'Hare', active:'dusk', threat:false, targets:null,
    speed:120, wary:0.88, bold:0.3, size:0.7,
    col:{body:'#b08a5c', dark:'#8a6a44', pale:'#f4efe4'},
    say:['…'], seen:'A hare is sitting out in the open.' },
  owl: {
    n:'Barn owl', active:'night', threat:false, targets:'mice', good:true,
    speed:110, wary:0.5, bold:0.6, size:0.85,
    col:{body:'#f0e8d8', dark:'#c9b48c', pale:'#ffffff'},
    say:['…'], seen:'The barn owl is hunting over the grass.' },
  buzzard: {
    n:'Buzzard', active:'day', threat:false, targets:'mice',
    speed:88, wary:0.6, bold:0.55, size:1,
    col:{body:'#7a6249', dark:'#4f3f2e', pale:'#e6dcc6'},
    say:['…'], seen:'A buzzard is circling over the meadow.' },
};

function wildList(){ if(!Array.isArray(S.wild)) S.wild = []; return S.wild; }

/* is this species out at this hour? */
function wildAwake(sp){
  const f = (typeof dayFrac === 'function') ? dayFrac() : 0.5;
  const night = f < 0.22 || f > 0.84;
  const dusk  = (f > 0.74 && f <= 0.90) || (f >= 0.16 && f < 0.30);
  if(sp.active === 'night') return night;
  if(sp.active === 'dusk')  return dusk || night;
  return !night;
}

/* ---------- one animal, with a personality of its own ---------- */
function spawnWild(key){
  const sp = WILD[key]; if(!sp) return null;
  const seed = Math.random();
  /* the species sets the middle of the range; the individual varies round
     it, so no two foxes behave alike */
  const vary = (base, spread)=> Math.max(0.05, Math.min(1, base + (Math.random()-0.5)*spread));
  const edge = Math.floor(Math.random()*4);
  const pad = 2;
  let x, y;
  if(edge === 0){ x = (FARM.x + Math.random()*FARM.w)*T; y = (FARM.y - pad)*T; }
  else if(edge === 1){ x = (FARM.x + FARM.w + pad)*T;    y = (FARM.y + Math.random()*FARM.h)*T; }
  else if(edge === 2){ x = (FARM.x + Math.random()*FARM.w)*T; y = (FARM.y + FARM.h + pad)*T; }
  else { x = (FARM.x - pad)*T; y = (FARM.y + Math.random()*FARM.h)*T; }

  const w = {
    id:'w'+Date.now()+Math.floor(Math.random()*999),
    k:key, x, y, dir:1, state:'enter', t:0,
    /* the individual */
    bold: vary(sp.bold, 0.5),
    wary: vary(sp.wary, 0.4),
    hunger: 0.4 + Math.random()*0.5,
    patience: 4 + Math.random()*14,        /* seconds it will hold its nerve */
    scared: 0,                              /* memory of being driven off */
    home: {x, y},                           /* the way it came in */
    born: S.day,
  };
  wildList().push(w);
  if(typeof log === 'function') log(sp.seen, sp.good ? 'good' : (sp.threat ? 'bad' : ''), 'farm');
  return w;
}

/* what it came for */
function wildTarget(w){
  const sp = WILD[w.k];
  if(sp.targets === 'poultry'){
    const pen = (S.objs||[]).find(o=>{
      const bp = BPMAP[o.bp];
      return bp && bp.kind === 'animal' && (o.animals||0) > 0
        && ['chicken','duck','quail','turkey'].includes(bp.animal);
    });
    if(pen){ const f = footprint(BPMAP[pen.bp], pen.rot);
      return {x:(pen.tx+f.w/2)*T, y:(pen.ty+f.h/2)*T, pen}; }
  }
  if(sp.targets === 'crops' || sp.targets === 'beds'){
    const bed = (S.objs||[]).find(o=>{
      const bp = BPMAP[o.bp];
      return bp && bp.kind === 'plot' && (sp.targets === 'beds' || o.crop);
    });
    if(bed){ const f = footprint(BPMAP[bed.bp], bed.rot);
      return {x:(bed.tx+f.w/2)*T, y:(bed.ty+f.h/2)*T, bed}; }
  }
  /* mice, or nothing in particular: somewhere out in the grass */
  return { x:(FARM.x + 2 + Math.random()*(FARM.w-4))*T,
           y:(FARM.y + 2 + Math.random()*(FARM.h-4))*T };
}

/* the nearest thing that frightens it, and how much */
function wildFright(w){
  const sp = WILD[w.k];
  let worst = null;
  const consider = (x, y, weight)=>{
    const d = Math.hypot(x - w.x, y - w.y);
    /* a wary animal notices further off; a bold one lets you get closer */
    const range = (120 + sp.wary*200) * weight;
    if(d < range && (!worst || d < worst.d)) worst = {d, x, y, range};
  };
  if(S.dog && S.dog.x !== undefined) consider(S.dog.x, S.dog.y, 1.5);   /* the dog most of all */
  if(S.you) consider(S.you.x, S.you.y, 1.0);
  (S.family||[]).forEach(p=>{ if(p.x !== undefined) consider(p.x, p.y, 0.7); });
  return worst;
}

/* ---------- the mind ---------- */
function wildThink(w, dt){
  const sp = WILD[w.k];
  w.t += dt;

  /* 1. frightened beats everything, and how easily depends on the animal */
  const fright = wildFright(w);
  if(fright && w.state !== 'flee'){
    const nerve = w.bold * (1 - w.scared*0.5);
    if(fright.d < fright.range * (1 - nerve*0.6)){
      w.state = 'flee';
      w.scared = Math.min(1, w.scared + 0.34);
      w.fleeFrom = {x:fright.x, y:fright.y};
      if(sp.threat && typeof log === 'function' && Math.random()<0.5)
        log(`The ${sp.n.toLowerCase()} was seen off.`, 'good', 'farm');
    }
  }

  if(w.state === 'flee'){
    const fx = w.x - (w.fleeFrom ? w.fleeFrom.x : w.home.x);
    const fy = w.y - (w.fleeFrom ? w.fleeFrom.y : w.home.y);
    const m = Math.hypot(fx, fy) || 1;
    w.x += (fx/m) * sp.speed * 1.5 * dt;
    w.y += (fy/m) * sp.speed * 1.5 * dt;
    w.dir = fx < 0 ? -1 : 1;
    /* off the edge of the world and gone */
    const out = w.x < (FARM.x-3)*T || w.x > (FARM.x+FARM.w+3)*T
             || w.y < (FARM.y-3)*T || w.y > (FARM.y+FARM.h+3)*T;
    if(out) w.done = true;
    return;
  }

  /* 2. otherwise it is here for something */
  if(!w.goal) w.goal = wildTarget(w);
  const dx = w.goal.x - w.x, dy = w.goal.y - w.y;
  const dist = Math.hypot(dx, dy);

  if(dist > 16){
    const k = Math.min(1, (sp.speed * dt) / dist);
    w.x += dx * k; w.y += dy * k;
    if(Math.abs(dx) > 2) w.dir = dx < 0 ? -1 : 1;
    w.state = 'move';
  } else {
    w.state = 'busy';
    w.busyT = (w.busyT || 0) + dt;
    /* it only does harm if it is bold enough to stay and finish */
    if(w.busyT > w.patience * (1 - w.bold*0.5)){
      wildPayoff(w);
      w.busyT = 0;
      w.goal = null;
      w.hunger = Math.max(0, w.hunger - 0.5);
      if(w.hunger < 0.2){ w.state = 'flee'; w.fleeFrom = {x:w.x+1, y:w.y}; }
    }
  }
}

/* what actually happens when it gets what it came for */
function wildPayoff(w){
  const sp = WILD[w.k];
  if(sp.targets === 'poultry' && w.goal && w.goal.pen){
    const pen = w.goal.pen;
    if((pen.animals||0) > 0){
      pen.animals -= 1;
      if(typeof startlePens === 'function') try{ startlePens(); }catch(e){}
      if(typeof log === 'function')
        log(`The fox took one from the ${BPMAP[pen.bp].name.toLowerCase()}.`, 'bad', 'farm');
      if(typeof toast === 'function') toast('The fox got one','bad');
    }
  } else if(sp.targets === 'beds' && w.goal && w.goal.bed){
    const bed = w.goal.bed;
    bed.weeds = Math.min(1, (bed.weeds||0) + 0.5);
    bed.fert  = Math.max(0.15, (bed.fert===undefined?1:bed.fert) - 0.12);
    if(typeof log === 'function') log('A badger has been digging in a bed.', 'bad', 'farm');
  } else if(sp.targets === 'crops' && w.goal && w.goal.bed){
    const bed = w.goal.bed;
    if(bed.crop && bed.stage > 0.15){
      bed.stage = Math.max(0, bed.stage - 0.3);
      if(typeof log === 'function') log('Deer have been browsing the beds.', 'bad', 'farm');
    }
  } else if(sp.targets === 'mice'){
    /* the owl and the buzzard are on your side: mice eat feed */
    S.feed = Math.min(9999, (S.feed||0) + 2);
    if(typeof log === 'function' && Math.random() < 0.4)
      log(`The ${sp.n.toLowerCase()} took a mouse off the feed store.`, 'good', 'farm');
  }
}

/* ---------- who turns up, and how often ---------- */
function wildSpawnCheck(){
  const list = wildList();
  if(list.length >= 3) return;                    /* never a crowd */
  const hens = (S.objs||[]).some(o=>{
    const bp = BPMAP[o.bp];
    return bp && bp.kind==='animal' && (o.animals||0)>0
      && ['chicken','duck','quail','turkey'].includes(bp.animal); });
  const crops = (S.objs||[]).some(o=>BPMAP[o.bp] && BPMAP[o.bp].kind==='plot' && o.crop);
  const dogHere = !!S.dog;

  Object.keys(WILD).forEach(k=>{
    const sp = WILD[k];
    if(!wildAwake(sp)) return;
    if(list.some(w=>w.k===k)) return;             /* one of each at a time */
    let chance = 0.05;
    if(k==='fox')     chance = hens ? 0.16 : 0.03;
    if(k==='deer')    chance = crops ? 0.13 : 0.05;
    if(k==='badger')  chance = 0.07;
    if(k==='hare')    chance = 0.09;
    if(k==='owl')     chance = 0.12;
    if(k==='buzzard') chance = 0.08;
    /* a dog on the place keeps the threats honest */
    if(sp.threat && dogHere) chance *= 0.45;
    if(Math.random() < chance) spawnWild(k);
  });
}

/* ---------- the dog treats a predator as duty ---------- */
if(typeof dogDecide === 'function'){
  const _dogDecideWild = dogDecide;
  dogDecide = function(){
    const d = S.dog;
    if(d){
      /* anything on the place that should not be, nearest first */
      const intruders = wildList().filter(w=>!w.done && WILD[w.k] && !WILD[w.k].good);
      if(intruders.length){
        intruders.sort((a,b)=>Math.hypot(a.x-d.x,a.y-d.y) - Math.hypot(b.x-d.x,b.y-d.y));
        const w = intruders[0];
        return { mode:'work', x:w.x, y:w.y, say:'!', wild:w };
      }
    }
    return _dogDecideWild.apply(this, arguments);
  };
}

/* ---------- art ---------- */
function wildArt(w){
  const sp = WILD[w.k], c = sp.col, s0 = sp.size;
  const S1 = v => n(v*s0);
  let body = '';
  if(w.k === 'fox'){
    body = `<ellipse cx="0" cy="0" rx="${S1(7.4)}" ry="${S1(3.4)}" fill="${c.body}"/>
      <path d="M${S1(6.5)} ${S1(-1)} l${S1(4.6)} ${S1(-3.2)} l${S1(-0.6)} ${S1(3.4)} z" fill="${c.body}"/>
      <circle cx="${S1(7.6)}" cy="${S1(-2.6)}" r="${S1(2.6)}" fill="${c.body}"/>
      <path d="M${S1(6.2)} ${S1(-4.4)} l${S1(0.8)} ${S1(-2.6)} l${S1(1.6)} ${S1(1.8)} z" fill="${c.dark}"/>
      <path d="M${S1(8.4)} ${S1(-4.6)} l${S1(1)} ${S1(-2.4)} l${S1(1.2)} ${S1(2.2)} z" fill="${c.dark}"/>
      <ellipse cx="${S1(9.8)}" cy="${S1(-2)}" rx="${S1(1.4)}" ry="${S1(1)}" fill="${c.pale}"/>
      <circle cx="${S1(10.6)}" cy="${S1(-2.2)}" r="${S1(0.5)}" fill="#1d1408"/>
      <path class="wtail" d="M${S1(-7)} ${S1(-0.6)} q${S1(-6)} ${S1(-1.4)} ${S1(-7.4)} ${S1(-4)}"
        stroke="${c.body}" stroke-width="${S1(3.2)}" fill="none" stroke-linecap="round"/>
      <circle cx="${S1(-14)}" cy="${S1(-4.4)}" r="${S1(1.8)}" fill="${c.pale}"/>
      ${[-4,-1.6,2.2,4.6].map(lx=>`<rect x="${S1(lx)}" y="${S1(2.4)}" width="${S1(1.3)}" height="${S1(3.4)}" rx="${S1(0.6)}" fill="${c.dark}"/>`).join('')}`;
  } else if(w.k === 'badger'){
    body = `<ellipse cx="0" cy="0" rx="${S1(8)}" ry="${S1(4)}" fill="${c.body}"/>
      <ellipse cx="${S1(7)}" cy="${S1(-0.6)}" rx="${S1(3.4)}" ry="${S1(2.6)}" fill="${c.pale}"/>
      <path d="M${S1(5.4)} ${S1(-2.6)} l${S1(6)} ${S1(0)} l0 ${S1(1.2)} l${S1(-6)} 0 z" fill="${c.dark}"/>
      <circle cx="${S1(10.4)}" cy="${S1(-0.4)}" r="${S1(0.7)}" fill="#1d1408"/>
      ${[-5,-2,1.4,4.4].map(lx=>`<rect x="${S1(lx)}" y="${S1(2.8)}" width="${S1(1.6)}" height="${S1(3)}" rx="${S1(0.7)}" fill="${c.dark}"/>`).join('')}`;
  } else if(w.k === 'deer'){
    body = `<ellipse cx="0" cy="0" rx="${S1(7)}" ry="${S1(3.6)}" fill="${c.body}"/>
      <rect x="${S1(5)}" y="${S1(-8)}" width="${S1(2)}" height="${S1(7)}" rx="${S1(1)}" fill="${c.body}"/>
      <ellipse cx="${S1(6.4)}" cy="${S1(-9)}" rx="${S1(2.6)}" ry="${S1(1.9)}" fill="${c.body}"/>
      <ellipse cx="${S1(8.4)}" cy="${S1(-8.6)}" rx="${S1(1)}" ry="${S1(0.8)}" fill="${c.dark}"/>
      <path d="M${S1(5)} ${S1(-10.6)} l${S1(-0.6)} ${S1(-2.6)}" stroke="${c.dark}" stroke-width="${S1(0.7)}"/>
      <path d="M${S1(7.4)} ${S1(-10.6)} l${S1(0.8)} ${S1(-2.4)}" stroke="${c.dark}" stroke-width="${S1(0.7)}"/>
      <circle cx="${S1(5.6)}" cy="${S1(-9.2)}" r="${S1(0.5)}" fill="#1d1408"/>
      <ellipse cx="${S1(-6.4)}" cy="${S1(-1.6)}" rx="${S1(1.4)}" ry="${S1(1.1)}" fill="${c.pale}"/>
      ${[-4.6,-2,2,4.4].map(lx=>`<rect x="${S1(lx)}" y="${S1(2.8)}" width="${S1(1.1)}" height="${S1(5.4)}" rx="${S1(0.5)}" fill="${c.dark}"/>`).join('')}`;
  } else if(w.k === 'hare'){
    body = `<ellipse cx="0" cy="0" rx="${S1(5)}" ry="${S1(3.4)}" fill="${c.body}"/>
      <circle cx="${S1(4.4)}" cy="${S1(-2.6)}" r="${S1(2.4)}" fill="${c.body}"/>
      <ellipse cx="${S1(3.4)}" cy="${S1(-7)}" rx="${S1(0.9)}" ry="${S1(3.4)}" fill="${c.body}" transform="rotate(-12 ${S1(3.4)} ${S1(-7)})"/>
      <ellipse cx="${S1(5.6)}" cy="${S1(-7)}" rx="${S1(0.9)}" ry="${S1(3.4)}" fill="${c.body}" transform="rotate(9 ${S1(5.6)} ${S1(-7)})"/>
      <circle cx="${S1(5.6)}" cy="${S1(-3)}" r="${S1(0.5)}" fill="#1d1408"/>
      <circle cx="${S1(-4.8)}" cy="${S1(0.6)}" r="${S1(1.5)}" fill="${c.pale}"/>`;
  } else if(w.k === 'owl'){
    body = `<ellipse class="wwing" cx="0" cy="0" rx="${S1(9)}" ry="${S1(3)}" fill="${c.body}" opacity=".95"/>
      <ellipse cx="0" cy="0" rx="${S1(3.4)}" ry="${S1(4)}" fill="${c.pale}"/>
      <circle cx="0" cy="${S1(-3.4)}" r="${S1(2.6)}" fill="${c.pale}"/>
      <path d="M${S1(-2)} ${S1(-3.8)} q${S1(2)} ${S1(2.4)} ${S1(4)} 0" fill="none" stroke="${c.dark}" stroke-width="${S1(0.5)}"/>
      <circle cx="${S1(-1)}" cy="${S1(-3.8)}" r="${S1(0.6)}" fill="#1d1408"/>
      <circle cx="${S1(1)}" cy="${S1(-3.8)}" r="${S1(0.6)}" fill="#1d1408"/>`;
  } else {
    body = `<ellipse class="wwing" cx="0" cy="0" rx="${S1(10)}" ry="${S1(2.6)}" fill="${c.body}"/>
      <ellipse cx="0" cy="0" rx="${S1(3)}" ry="${S1(3.4)}" fill="${c.dark}"/>
      <circle cx="${S1(2.6)}" cy="${S1(-2.2)}" r="${S1(1.8)}" fill="${c.body}"/>
      <path d="M${S1(4)} ${S1(-2.2)} l${S1(1.8)} ${S1(0.6)} l${S1(-1.8)} ${S1(0.8)} z" fill="#e0b040"/>`;
  }
  const flying = (w.k === 'owl' || w.k === 'buzzard');
  return `<g class="wild ${w.k} ${w.state}" data-w="${w.id}" transform="translate(${n(w.x)},${n(w.y)})">
    <ellipse cx="${S1(1.4)}" cy="${S1(flying?9:5.4)}" rx="${S1(6)}" ry="${S1(2)}"
      fill="url(#gShadow)" opacity="${flying?0.3:0.55}"/>
    <g transform="scale(${w.dir},1)${flying?` translate(0,${S1(-6)})`:''}">${body}</g></g>`;
}

function wildLayer(){
  const list = wildList().filter(w=>!w.done);
  if(!list.length) return '';
  return `<g id="wildlife" pointer-events="none">${list.map(wildArt).join('')}</g>`;
}

/* ---------- ticking and painting ---------- */
function tickWild(dt){
  const list = wildList();
  if(!list.length) return;
  list.forEach(w=>{ if(!w.done) wildThink(w, dt); });
  /* anything gone, or out past its own hours, leaves */
  for(let i=list.length-1;i>=0;i--){
    const w = list[i];
    if(w.done || !wildAwake(WILD[w.k])) list.splice(i,1);
  }
  paintWild();
}
function paintWild(){
  const layer = document.getElementById('wildlife');
  if(!layer) return;
  wildList().forEach(w=>{
    const el = layer.querySelector(`[data-w="${w.id}"]`);
    if(!el) return;
    el.setAttribute('transform', `translate(${n(w.x)},${n(w.y)})`);
    el.setAttribute('class', `wild ${w.k} ${w.state}`);
    const g = el.querySelector('g');
    const sp = WILD[w.k], flying = (w.k==='owl'||w.k==='buzzard');
    if(g) g.setAttribute('transform', `scale(${w.dir},1)${flying?` translate(0,${n(-6*sp.size)})`:''}`);
  });
}

if(typeof tickPeople === 'function'){
  const _tickPeopleWild = tickPeople;
  tickPeople = function(dt){
    const r = _tickPeopleWild.apply(this, arguments);
    try{ tickWild(typeof dt === 'number' ? Math.min(0.1, dt) : 0.05); }catch(e){}
    return r;
  };
}
if(typeof render === 'function'){
  const _renderWild = render;
  render = function(){
    const r = _renderWild.apply(this, arguments);
    try{
      const old = document.getElementById('wildlife');
      if(old) old.remove();
      const fg = document.getElementById('fg');
      const html = wildLayer();
      if(fg && html){
        const tmp = document.createElementNS('http://www.w3.org/2000/svg','g');
        tmp.innerHTML = html;
        fg.appendChild(tmp.firstChild);
      }
    }catch(e){}
    return r;
  };
}
/* a chance of company twice a day, at the turns of the light */
if(typeof advanceDay === 'function'){
  const _advWild = advanceDay;
  advanceDay = function(){
    const r = _advWild.apply(this, arguments);
    try{ wildSpawnCheck(); if(typeof render==='function') render(); }catch(e){}
    return r;
  };
}

(function wildCss(){
  const s = document.createElement('style');
  s.textContent = `
  .wild .wtail{ transform-box:fill-box; transform-origin:100% 50%;
    animation: wTail 1.4s ease-in-out infinite; }
  .wild.flee .wtail{ animation-duration:.4s; }
  @keyframes wTail{ 0%,100%{transform:rotate(-6deg)} 50%{transform:rotate(8deg)} }
  .wild .wwing{ transform-box:fill-box; transform-origin:50% 50%;
    animation: wWing 0.5s ease-in-out infinite; }
  @keyframes wWing{ 0%,100%{transform:scaleY(1)} 50%{transform:scaleY(.42)} }
  .wild.busy .wwing{ animation-duration:1.6s; }
  @media(prefers-reduced-motion:reduce){ .wild .wtail,.wild .wwing{ animation:none } }`;
  document.head.appendChild(s);
})();

/* ---------- handles ---------- */
G.wildAudit = function(){
  return {
    species: Object.keys(WILD).map(k=>`${WILD[k].n}: ${WILD[k].active}, ${WILD[k].threat?'threat':WILD[k].good?'beneficial':'nuisance'}, after ${WILD[k].targets||'nothing'}`),
    awakeNow: Object.keys(WILD).filter(k=>wildAwake(WILD[k])).map(k=>WILD[k].n),
    onTheFarm: wildList().filter(w=>!w.done).map(w=>({
      what:WILD[w.k].n, state:w.state,
      bold:+w.bold.toFixed(2), wary:+w.wary.toFixed(2),
      patience:+w.patience.toFixed(1), scared:+w.scared.toFixed(2),
      at:`${Math.round(w.x)},${Math.round(w.y)}`,
    })),
    dogOnDuty: !!S.dog,
  };
};
G.spawnWild = function(k){ const w = spawnWild(k); render(); return w ? WILD[k].n + ' arrived' : 'unknown species'; };
