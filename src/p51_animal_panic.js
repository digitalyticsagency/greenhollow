/* =====================================================================
   THE STOCK PANIC TOO

   The family startle and huddle when lightning strikes; the animals
   carried on grazing through it, which is exactly backwards — livestock
   are far more frightened of thunder than people are.

   Now every pen reacts. They cry out in their own language, then bunch
   into the middle of the pen and stay bunched for a good while, calling
   back and forth to each other across the yard until it passes. Real
   stock do stay balled up long after the noise stops, so this outlasts
   the family's huddle by a wide margin.

   Animals are drawn loose inside paddock() with nothing to grab, so
   each one is now wrapped in a group carrying the offset toward its own
   pen centre. Bunching is then one CSS class on the pen.
   ===================================================================== */

/* ---------- give every drawn animal a handle and a direction home ---------- */
if(typeof paddock === 'function'){
  const _paddockBase = paddock;
  paddock = function(w, h, kind, cnt, seed, sc){
    /* Rebuild rather than wrap: the animals are emitted inline by the
       original, so there is no way to reach them after the fact. */
    let s = patch(w,h,'#84ad57',seed,1);
    s += `<rect x="1.5" y="1.5" width="${n(w-3)}" height="${n(h-3)}" rx="2.5" fill="none" stroke="#00000033" stroke-width="2.6"/>`;
    s += `<rect x="1.5" y="1.5" width="${n(w-3)}" height="${n(h-3)}" rx="2.5" fill="none" stroke="#a8814f" stroke-width="1.3"/>`;
    for(let x=2;x<w-2;x+=11){ s += `<rect x="${n(x-1)}" y="0" width="2" height="4" rx="1" fill="#7d5931"/>`;
                              s += `<rect x="${n(x-1)}" y="${n(h-4)}" width="2" height="4" rx="1" fill="#7d5931"/>`; }
    for(let y=2;y<h-2;y+=11){ s += `<rect x="0" y="${n(y-1)}" width="4" height="2" rx="1" fill="#7d5931"/>`;
                              s += `<rect x="${n(w-4)}" y="${n(y-1)}" width="4" height="2" rx="1" fill="#7d5931"/>`; }
    const cx = w/2, cy = h/2;
    for(let i=0;i<cnt;i++){
      const ax = 8 + hash(i*2.3+seed)*Math.max(4, w-16);
      const ay = 8 + hash(i*5.7+seed)*Math.max(4, h-16);
      /* how far this one has to move to reach the middle, minus a little
         so they bunch rather than stack on one point */
      const dx = (cx - ax) * 0.82, dy = (cy - ay) * 0.82;
      s += `<g class="pen-animal" style="--hx:${n(dx)}px; --hy:${n(dy)}px;
        animation-delay:-${(hash(i*7.1+seed)*3).toFixed(1)}s">${
        beast(kind, ax, ay, sc||1)}</g>`;
    }
    return s;
  };
}

/* ---------- what each species shouts ---------- */
const PANIC_CRY = {
  chicken:['😱 BOK BOK BOK!','😨 BAWK!','😰 Bok bok bok bok'],
  duck:   ['😱 QUACK QUACK!','😨 QUACK!','😰 Quack quack quack'],
  sheep:  ['😱 BAAAA!','😨 Baa baa baa!','😰 BAAA-AA!'],
  goat:   ['😱 MEHHHH!','😨 Meh-eh-eh!','😰 MEH!'],
  cow:    ['😱 MOOOO!','😨 MOO-OO!','😰 Mooooo…'],
  rabbit: ['😱 *THUMP THUMP*','😨 *frozen stiff*','😰 *thump*'],
  bee:    ['😨 BZZZZZT!','😰 Bzz bzz bzz'],
};
/* what they call to each other once the worst has passed */
const PANIC_CALL = {
  chicken:['Bok…? Bok.','…bok.','Bok bok?'],
  duck:   ['Quack…?','…quack.','Quack quack?'],
  sheep:  ['Baa…?','…baa.','Baa? Baa.'],
  goat:   ['Meh…?','…meh.','Meh? Meh.'],
  cow:    ['Moo…?','…moo.','Moo? Moo.'],
  rabbit: ['*sniff*','*ears up*','*still*'],
  bee:    ['bzz…','…bzz'],
};

/* ---------- the panic itself ---------- */
/* Deliberately long: stock stay balled up well after the thunder stops. */
const PANIC_MS = 34000;

function startlePens(){
  const pens = animalPens().filter(o=>(o.animals||0) > 0);
  if(!pens.length) return;
  S.animalPanic = { until: Date.now() + PANIC_MS, phase:'cry', callAt: Date.now() + 5000 };

  pens.forEach((o, i)=>{
    const sp = penSpecies(o);
    const cry = (PANIC_CRY[sp] || ['😨 !'])[Math.floor(Math.random()*(PANIC_CRY[sp]||[1]).length)];
    /* stagger so the yard erupts rather than shouting in unison */
    setTimeout(()=>{
      const c = penCentre(o);
      if(typeof speak === 'function') speak({x:c.x, y:c.y}, cry);
      const v = ANIMAL_VOICE[sp];
      if(v && typeof SND !== 'undefined') SND.play(v.sfx);
    }, 60 + i*170);
  });

  applyPanicClass(true);
  if(typeof log === 'function')
    log('The stock scattered at the thunder, then bunched up in the middle of the pens.', '', 'alert');
}

/* the bunching is one class on each pen's group */
function applyPanicClass(on){
  animalPens().forEach(o=>{
    const el = document.querySelector(`.ob[data-id="${o.id}"]`);
    if(el) el.classList.toggle('panic', !!on);
  });
}

/* while it lasts they call across the yard, one pen at a time */
function tickPanic(){
  const p = S.animalPanic;
  if(!p) return;
  const now = Date.now();
  if(now > p.until){
    S.animalPanic = null;
    applyPanicClass(false);
    if(typeof log === 'function')
      log('The stock have settled and spread back out.', 'good', 'farm');
    return;
  }
  /* nothing but crying for the first few seconds */
  if(now < p.callAt) return;
  p.callAt = now + 2200 + Math.random()*2600;
  const pens = animalPens().filter(o=>(o.animals||0) > 0);
  if(!pens.length) return;
  const o = pens[Math.floor(Math.random()*pens.length)];
  const sp = penSpecies(o);
  const pool = PANIC_CALL[sp];
  if(!pool) return;
  const c = penCentre(o);
  if(typeof speak === 'function') speak({x:c.x, y:c.y}, pool[Math.floor(Math.random()*pool.length)]);
  /* a neighbour answers a beat later - that is the conversation */
  const others = pens.filter(x=>x.id !== o.id);
  if(others.length && Math.random() < 0.7){
    const o2 = others[Math.floor(Math.random()*others.length)];
    const sp2 = penSpecies(o2);
    const pool2 = PANIC_CALL[sp2];
    if(pool2) setTimeout(()=>{
      const c2 = penCentre(o2);
      if(typeof speak === 'function') speak({x:c2.x, y:c2.y}, pool2[Math.floor(Math.random()*pool2.length)]);
    }, 900 + Math.random()*700);
  }
}

/* the pen class has to be reapplied after any redraw */
if(typeof render === 'function'){
  const _renderPanic = render;
  render = function(){
    const r = _renderPanic.apply(this, arguments);
    if(S && S.animalPanic) applyPanicClass(true);
    return r;
  };
}

/* while panicking the stock are too upset to chat normally */
if(typeof tickVoices === 'function'){
  const _tickVoicesPanic = tickVoices;
  tickVoices = function(dt){
    if(S && S.animalPanic) return;
    return _tickVoicesPanic.apply(this, arguments);
  };
}

/* the trigger, alongside the family's own startle */
if(typeof lightningStrike === 'function'){
  const _strikeAnimals = lightningStrike;
  lightningStrike = function(){
    const r = _strikeAnimals.apply(this, arguments);
    /* a follow-up stroke extends the panic rather than restarting it */
    if(S && S.animalPanic){ S.animalPanic.until = Date.now() + PANIC_MS; }
    else startlePens();
    return r;
  };
}

const _tickPeoplePanic = tickPeople;
tickPeople = function(dt){
  const r = _tickPeoplePanic.apply(this, arguments);
  if(S && S.speed !== 0) tickPanic();
  return r;
};

(function panicCss(){
  const s = document.createElement('style');
  s.textContent = `
  /* each animal carries the offset to its own pen centre, so one class
     bunches the whole pen without knowing where anything is */
  .pen-animal{ transform-box:fill-box; transform-origin:center;
    transition: transform 1.1s cubic-bezier(.2,.8,.3,1); }
  .ob.panic .pen-animal{
    transform: translate(var(--hx,0), var(--hy,0)) scale(.92);
    animation: penShiver 0.5s ease-in-out infinite; }
  @keyframes penShiver{
    0%,100%{ translate: 0 0; }
    50%    { translate: 0.4px -0.3px; } }
  @media (prefers-reduced-motion: reduce){
    .pen-animal{ transition:none; }
    .ob.panic .pen-animal{ animation:none !important; } }
  `;
  document.head.appendChild(s);
})();

/* so it can be seen without waiting for weather */
G.scareStock = function(){ startlePens(); };
