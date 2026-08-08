/* =====================================================================
   STRAYS - AND A HARD FENCE

   Two things, and they are opposites on purpose.

   First, nothing drifts out by accident any more. Every animal is clamped
   to its own pen at the end of every tick, after the goal-seeking and
   after the procession, so no amount of trail-following or social
   drifting can walk one through a fence.

   Second, because a farm where nothing ever gets out is a dull farm, one
   can now get out deliberately. At most two at a time, farm-wide. A stray
   leaves the pen, wanders the property, and stops earning while it is
   loose. Pick it up and carry it back and it goes straight home.

   The pick-up listens on pointerdown, not click. The world's pan handler
   takes pointer capture on pointerdown and the browser then never fires a
   click at all - the same thing that made the UFO unshootable.
   ===================================================================== */

/* ---------- 1. the hard fence ---------- */
/* Belt and braces: chooseAct already aims inside the pen, but a clamp
   after the fact is the only thing that cannot be defeated by some future
   behaviour that sets a goal without thinking about bounds. */
/* patch() draws the grass as a wobbly ellipse inscribed in the pen's
   footprint, so the four corners of the rectangle are bare ground. A
   rectangular clamp therefore parks animals in those corners, off the
   green, which is exactly what "the animals are outside" looks like on a
   wide paddock. Everything outdoors is held to the ellipse instead.
   0.84 keeps them clear of the wobble, which dips to 0.88 of the radius. */
function clampToEllipse(p, cx, cy, rx, ry){
  rx = Math.max(4, rx); ry = Math.max(4, ry);
  const dx = (p.x - cx)/rx, dy = (p.y - cy)/ry;
  const d = Math.hypot(dx, dy);
  if(d <= 1) return;
  p.x = cx + (dx/d)*rx;
  p.y = cy + (dy/d)*ry;
}
function grassEllipse(m){
  return { cx:m.w/2, cy:m.h/2, rx:(m.w/2)*0.84, ry:(m.h/2)*0.84 };
}
function clampToPen(m, a){
  if(a.inside){
    /* the shed floor really is a rectangle */
    const b = m.box, pad = 5;
    a.x = Math.max(b.x+pad, Math.min(b.x+b.w-pad, a.x));
    a.y = Math.max(b.y+pad, Math.min(b.y+b.h-pad, a.y));
    return;
  }
  const g = (typeof outdoorEllipse === 'function') ? outdoorEllipse(m) : grassEllipse(m);
  clampToEllipse(a, g.cx, g.cy, g.rx, g.ry);
}

/* ---------- 2. who is loose ---------- */
const MAX_STRAYS = 2;
const STRAY_SC = { chicken:0.92, duck:0.9, sheep:0.95, goat:0.95, cow:1.15, rabbit:0.9, bee:1 };
const STRAY_OUT = {
  chicken:['*bok?*','Free!','*struts off*'], duck:['Quack?','*waddles off*'],
  sheep:['Baa…','*wanders*'], goat:['Meh! 😼','*headed for the veg*','Meh meh!'],
  cow:['Moo…','*ambles off*'], rabbit:['*hops away*','*sniff*'], bee:['bzz…'],
};
const STRAY_HOME = ['*trots back in*','😌','Baa!','*settles*','Home.'];

function strayList(){ S.strays = S.strays || []; return S.strays; }

/* an animal gets out. Which one is recorded by pen and index so the pen
   can hide exactly that head rather than just drawing one fewer. */
function releaseStray(o, m, a){
  const st = strayList();
  if(st.length >= MAX_STRAYS) return false;
  if(st.some(s=>s.pen === o.id && s.i === a.i)) return false;
  const wx = o.tx*T + a.x, wy = o.ty*T + a.y;
  st.push({ pen:o.id, i:a.i, kind:m.kind, x:wx, y:wy, gx:wx, gy:wy, until:0,
             day:(S.day||0), t:Date.now() });
  a.away = true;
  const pool = STRAY_OUT[m.kind] || ['…'];
  if(typeof speak === 'function') speak({x:wx, y:wy}, pool[Math.floor(Math.random()*pool.length)]);
  if(typeof log === 'function')
    log(`One of the ${m.kind}s is out. It will not earn a thing until it is back in - pick it up and carry it home.`, 'bad', 'farm');
  if(typeof toast === 'function') toast('An animal is loose', 'bad');
  if(typeof SND !== 'undefined') SND.play('error');
  /* Without this the stray exists in state but has no element, so the
     hit test finds nothing and clicking it does nothing at all. The
     G.letOut() test helper called render() itself, which is exactly why
     this passed testing and failed in play - the same hole that made the
     UFO unshootable. */
  if(typeof render === 'function') render();
  updateStrayHud();
  return true;
}

/* how often one gets out. Neglected stock push at the fence harder, which
   gives the care system one more consequence. */
let STRAY_ROLL = 0;
function tickStrayChance(dt){
  STRAY_ROLL -= dt;
  if(STRAY_ROLL > 0) return;
  STRAY_ROLL = 45 + Math.random()*75;
  if(strayList().length >= MAX_STRAYS) return;
  if(S.shed) return;                                  /* not during a storm shut-in */
  if(typeof isNight === 'function' && isNight()) return;
  const pens = (typeof stockPens === 'function' ? stockPens() : []).filter(o=>{
    const m = MINDS.get(o.id);
    return m && m.list.filter(a=>!a.away).length > 1;  /* never empty a pen */
  });
  if(!pens.length) return;
  const o = pens[Math.floor(Math.random()*pens.length)];
  const m = MINDS.get(o.id);
  let chance = 0.22;
  const care = (typeof careOf === 'function') ? careOf(o) : null;
  if(care && care.dirty) chance += 0.25;
  if(o.hungry > 0) chance += 0.2;
  if(m.kind === 'goat') chance += 0.28;               /* goats are goats */
  if(Math.random() > chance) return;
  const candidates = m.list.filter(a=>!a.away && !a.smart);
  if(!candidates.length) return;
  releaseStray(o, m, candidates[Math.floor(Math.random()*candidates.length)]);
}

/* ---------- 3. a stray wanders the farm ---------- */
function farmBoundsPx(){
  return { x:(FARM.x+0.5)*T, y:(FARM.y+0.5)*T, w:(FARM.w-1)*T, h:(FARM.h-1)*T };
}

function tickStrays(dt){
  const st = strayList();
  if(!st.length) return;
  const b = farmBoundsPx();
  const now = Date.now();
  st.forEach((s, k)=>{
    if(now > s.until){
      s.until = now + 3000 + Math.random()*6000;
      s.gx = b.x + Math.random()*b.w;
      s.gy = b.y + Math.random()*b.h;
    }
    const dx = s.gx - s.x, dy = s.gy - s.y, d = Math.hypot(dx,dy) || 1;
    if(d > 1){ const sp = 11*dt; s.x += dx/d*Math.min(sp,d); s.y += dy/d*Math.min(sp,d); }
    s.x = Math.max(b.x, Math.min(b.x+b.w, s.x));
    s.y = Math.max(b.y, Math.min(b.y+b.h, s.y));
    const el = document.querySelector(`.stray[data-si="${k}"]`);
    if(el) el.setAttribute('transform', `translate(${n(s.x)},${n(s.y)})`);
  });
}

/* strays are drawn in the people layer, above the pens, because that is
   where things that are not part of an object belong */
function strayLayer(){
  const st = strayList();
  if(!st.length) return '';
  let s = '';
  st.forEach((x, k)=>{
    s += `<g class="stray" data-si="${k}" transform="translate(${n(x.x)},${n(x.y)})">`;
    s += `<circle class="strayring" r="11" cx="0" cy="0" fill="none" stroke="#e8b23c" stroke-width="2"/>`;
    s += `<path class="straypin" d="M0 -15 l4.5 -7 h-9 Z" fill="#e8b23c"/>`;
    s += (x.kind === 'bee' && typeof beeBody === 'function')
       ? beeBody(0,0,1) : beast(x.kind, 0, 0, STRAY_SC[x.kind] || 1);
    s += `</g>`;
  });
  return s;
}
if(typeof peopleLayer === 'function'){
  const _peopleLayerStray = peopleLayer;
  peopleLayer = function(){ return _peopleLayerStray.apply(this, arguments) + strayLayer(); };
}

/* ---------- 4. picking one up ---------- */
function carrying(){ return S.carry || null; }

function pickUpStray(k){
  const st = strayList();
  const s = st[k]; if(!s) return;
  st.splice(k, 1);
  S.carry = { pen:s.pen, i:s.i, kind:s.kind };
  if(typeof SND !== 'undefined') SND.play('collect');
  if(typeof toast === 'function') toast(`Carrying the ${s.kind} — click its pen to put it back`, '');
  if(typeof log === 'function') log(`You picked up the ${s.kind}. Click a pen to put it back.`, '', 'farm');
  if(typeof render === 'function') render();
  updateCarryBadge(); updateStrayHud();
}

function dropInto(o){
  const c = carrying(); if(!c) return false;
  const bp = BPMAP[o.bp];
  const sp = (typeof penSpecies === 'function') ? penSpecies(o) : null;
  if(!bp || sp !== c.kind){
    if(typeof toast === 'function') toast(`That is not where a ${c.kind} lives`, 'bad');
    return false;
  }
  /* home again - if it came from this pen, put it back in its own slot */
  const m = MINDS.get(o.id);
  if(m){
    const a = (c.pen === o.id) ? m.list[c.i] : m.list.find(x=>x.away) || m.list[0];
    if(a){ a.away = false; a.until = 0; }
  }
  S.carry = null;
  if(typeof SND !== 'undefined') SND.play('place');
  const cen = (typeof penCentre === 'function') ? penCentre(o) : null;
  if(cen && typeof speak === 'function')
    speak(cen, STRAY_HOME[Math.floor(Math.random()*STRAY_HOME.length)]);
  if(typeof log === 'function') log(`The ${c.kind} is back in its pen.`, 'good', 'farm');
  if(typeof toast === 'function') toast('Back where it belongs', 'good');
  if(typeof render === 'function') render();
  updateCarryBadge(); updateStrayHud();
  return true;
}

/* pointerdown, because the pan handler takes pointer capture and no click
   is ever delivered - verified when the UFO would not shoot */
setTimeout(()=>{
  document.addEventListener('pointerdown', (e)=>{
    if(!S) return;
    /* carrying: the next tap on a matching pen puts it back */
    if(carrying()){
      const ob = e.target.closest ? e.target.closest('.ob[data-id]') : null;
      if(ob){
        const o = (S.objs||[]).find(x=>x.id === +ob.dataset.id);
        if(o && dropInto(o)){ e.preventDefault(); e.stopPropagation(); }
      }
      return;
    }
    const st = strayList();
    if(!st.length) return;
    for(let k=0;k<st.length;k++){
      const el = document.querySelector(`.stray[data-si="${k}"]`);
      if(!el) continue;
      const b = el.getBoundingClientRect();
      if(!b.width) continue;
      if(e.clientX >= b.left-18 && e.clientX <= b.right+18 &&
         e.clientY >= b.top-18  && e.clientY <= b.bottom+18){
        e.preventDefault(); e.stopPropagation();
        pickUpStray(k);
        return;
      }
    }
  }, true);
}, 500);

/* A control that does not require aiming at a moving animal. If one is
   loose you get a button; press it and the nearest stray is picked up,
   or if you are already carrying one it goes home. Clicking the animal
   still works - this is the floor, not the replacement. */
function updateStrayHud(){
  let el = document.getElementById('strayhud');
  const st = strayList();
  const c = carrying();
  if(!st.length && !c){ if(el) el.remove(); return; }
  if(!el){
    el = document.createElement('button');
    el.id = 'strayhud';
    el.type = 'button';
    el.addEventListener('click', (e)=>{
      e.preventDefault(); e.stopPropagation();
      if(carrying()){ sendCarriedHome(); return; }
      if(strayList().length) pickUpStray(0);
    });
    document.body.appendChild(el);
  }
  el.textContent = c
    ? `Carrying a ${c.kind} — put it back`
    : `${st.length} animal${st.length===1?'':'s'} loose — round up${looseFor(st)}`;
  el.className = c ? 'carrying' : '';
  /* sit above the bottom bar rather than at a guessed offset - the bar is
     32px on mobile and absent on a wide window */
  const bar = document.getElementById('mobtabs');
  let lift = 16;
  if(bar){ const r = bar.getBoundingClientRect();
           if(r.height && r.bottom > window.innerHeight - 4) lift = r.height + 14; }
  el.style.bottom = lift + 'px';
}

/* how long the longest-loose one has been out. They never wander home by
   themselves, so this only goes up until you fetch it. */
function looseFor(st){
  if(!st.length) return '';
  const oldest = st.reduce((a,b)=> (a.day||0) <= (b.day||0) ? a : b);
  const days = Math.max(0, (S.day||0) - (oldest.day||0));
  if(days <= 0) return '';
  return days === 1 ? ' · out since yesterday' : ` · out ${days} days`;
}

/* put whatever you are carrying back in the pen it came from */
function sendCarriedHome(){
  const c = carrying(); if(!c) return false;
  const o = (S.objs||[]).find(x=>x.id === c.pen)
         || (typeof stockPens === 'function' ? stockPens() : []).find(x=>penSpecies(x) === c.kind);
  if(!o){                                   /* its pen was demolished while it was out */
    S.carry = null;
    if(typeof log === 'function') log(`The ${c.kind} has nowhere to go back to.`, 'bad', 'farm');
    updateStrayHud(); updateCarryBadge();
    return false;
  }
  return dropInto(o);
}

function updateCarryBadge(){
  /* The button carries this message now; a second floating badge saying
     the same thing just covered more of the farm. */
  const el = document.getElementById('carrybadge');
  if(el) el.remove();
}

/* ---------- 5. a loose animal does not earn ---------- */
/* Without this the whole thing is cosmetic. An animal that is out is not
   in the pen being milked. */
function strayCountFor(penId){
  return strayList().filter(s=>s.pen === penId).length
       + ((S.carry && S.carry.pen === penId) ? 1 : 0);
}
/* This is the part that makes an escape cost something. Until now the
   claim that a loose animal does not earn was not actually implemented -
   strayCountFor existed and nothing called it, and the pen was still paid
   for the head standing out in the yard. */
if(typeof earningHead === 'function'){
  earningHead = function(o){
    return Math.max(0, (o.animals || 0) - strayCountFor(o.id));
  };
}

/* ---------- 6. the roof must work even mid-storm ---------- */
/* The mind loop returns early while the stock are panicking, and the
   roof-off class was only applied inside it. So for the 34 seconds of a
   panic the roof button did nothing - which is precisely when you would
   want to look in. Applied here instead, where nothing can gate it. */
function applyRoofClass(){
  if(!S) return;
  const off = (typeof SET === 'function') && SET('roofOff');
  document.querySelectorAll('.ob[data-id]').forEach(el=>{
    el.classList.toggle('roof-off', !!off);
  });
}
if(typeof render === 'function'){
  const _renderRoof = render;
  render = function(){ const r = _renderRoof.apply(this, arguments); applyRoofClass(); return r; };
}

/* ---------- 7. wire into the tick ---------- */
if(typeof tickMinds === 'function'){
  const _tickMindsStray = tickMinds;
  tickMinds = function(dt){
    const r = _tickMindsStray.apply(this, arguments);
    applyRoofClass();                       /* runs even when the base bailed */
    if(!S || S.speed === 0) return r;
    /* hide whichever head is not actually in the pen, and hard-clamp the
       rest - this runs last, so nothing downstream can undo it */
    (typeof stockPens === 'function' ? stockPens() : []).forEach(o=>{
      const m = MINDS.get(o.id); if(!m) return;
      const el = document.querySelector(`.ob[data-id="${o.id}"]`);
      m.list.forEach(a=>{
        clampToPen(m, a);
        if(!el) return;
        const g = el.querySelector(`.pen-animal[data-ai="${a.i}"]`);
        if(g) g.classList.toggle('a-away', !!a.away);
      });
    });
    tickStrayChance(dt);
    tickStrays(dt);
    updateStrayHud();
    return r;
  };
}

/* a stray left out overnight is a real cost, not just a nag */
if(typeof tickAnimalDay === 'function'){
  const _tickDayStray = tickAnimalDay;
  tickAnimalDay = function(){
    const wasNight = LAST_NIGHT;
    const r = _tickDayStray.apply(this, arguments);
    if(wasNight === false && LAST_NIGHT === true && strayList().length){
      if(typeof log === 'function')
        log(`${strayList().length} animal${strayList().length===1?' is':'s are'} still out after dark. Anything could happen to them.`, 'bad', 'farm');
      if(typeof toast === 'function') toast('Stock still loose after dark', 'bad');
    }
    return r;
  };
}

(function strayCss(){
  const s = document.createElement('style');
  s.textContent = `
  .pen-animal.a-away{ opacity:0 !important; pointer-events:none; }
  .stray{ cursor:grab; }
  .strayring{ opacity:.75; animation: strayPulse 1.5s ease-in-out infinite; }
  @keyframes strayPulse{ 0%,100%{ opacity:.35; r:9; } 50%{ opacity:.85; r:10.5; } }
  #strayhud{ position:fixed; left:50%; bottom:112px; transform:translateX(-50%);
    background:#e8b23c; color:#2a2410; font:600 13px/1.2 system-ui,-apple-system,sans-serif;
    padding:9px 16px; border-radius:999px; z-index:9001; cursor:pointer; border:0;
    box-shadow:0 3px 10px rgba(0,0,0,.35); }
  #strayhud.carrying{ background:#8fce6b; }
  #strayhud:hover{ filter:brightness(1.06); }
  .straypin{ animation: strayPulse 1.5s ease-in-out infinite; }
  #carrybadge{ position:fixed; left:50%; bottom:74px; transform:translateX(-50%);
    background:#e8b23c; color:#2a2410; font:600 13px/1.2 system-ui,-apple-system,sans-serif;
    padding:8px 14px; border-radius:999px; z-index:9000; pointer-events:none;
    box-shadow:0 3px 10px rgba(0,0,0,.35); }
  @media (prefers-reduced-motion: reduce){ .strayring{ animation:none; } }
  `;
  document.head.appendChild(s);
})();

/* ---------- handles ---------- */
/* They stay out until you fetch them, so say so once a day rather than
   only at the moment it happens - an escape you missed is otherwise a
   silent, permanent drain on that pen's output. */
if(typeof advanceDay === 'function'){
  const _advanceDayStray = advanceDay;
  advanceDay = function(){
    const r = _advanceDayStray.apply(this, arguments);
    const st = strayList();
    if(st.length && typeof log === 'function'){
      const kinds = [...new Set(st.map(s=>s.kind))].join(' and ');
      log(`Still out: ${st.length} ${kinds}. ${st.length===1?'It is':'They are'} earning nothing until you bring ${st.length===1?'it':'them'} in.`, 'bad', 'farm');
    }
    updateStrayHud();
    return r;
  };
}
window.addEventListener('resize', ()=>{ try{ updateStrayHud(); }catch(e){} });

G.letOut = function(penId){
  const pens = (typeof stockPens === 'function') ? stockPens() : [];
  const o = penId ? S.objs.find(x=>x.id===penId) : pens[0];
  if(!o) return 'no pen';
  const m = MINDS.get(o.id) || (typeof mindFor === 'function' ? mindFor(o) : null);
  if(!m) return 'no mind';
  const a = m.list.find(x=>!x.away);
  if(!a) return 'all out already';
  const ok = releaseStray(o, m, a);
  if(typeof render === 'function') render();
  return ok ? `a ${m.kind} is loose` : 'already at the stray limit';
};
G.strays = function(){ return strayList().map(s=>({kind:s.kind, pen:s.pen, x:Math.round(s.x), y:Math.round(s.y)})); };
G.roundUp = function(){
  const st = strayList();
  st.forEach(s=>{ const m = MINDS.get(s.pen); if(m && m.list[s.i]) m.list[s.i].away = false; });
  S.strays = []; S.carry = null;
  updateCarryBadge(); updateStrayHud();
  if(typeof render === 'function') render();
  return 'all back in';
};
