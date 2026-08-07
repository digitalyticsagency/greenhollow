/* =====================================================================
   INTO THE SHED, AND WHAT COMES DOWN AFTER

   After the panic passes the stock do not just spread back out — they
   file into the shed and stay in for a while, and what they get up to
   in there changes the longer they are shut in. Lift the roof and you
   can watch it.

   And then, because a storm this violent should leave something behind:
   sometimes a craft comes down through the cloud, puts a beam on a pen
   and takes an animal. Shoot it down and it drops what it was carrying —
   two head of something that is not quite a cow any more, and which
   turns out to be worth a great deal every month.
   ===================================================================== */

/* ---------- 1. into the shed ---------- */
const SHED_MS = 150000;                 /* they stay in a good while */
const SHED_ACTS = [
  {at:0,     n:'huddled together',  d:'Still pressed into one corner, not moving.'},
  {at:0.18,  n:'settling',          d:'Starting to spread out and sniff around.'},
  {at:0.36,  n:'at the hay',        d:'Pulling at the hay net, calmer now.'},
  {at:0.56,  n:'playing',           d:'The young ones have started shoving each other about.'},
  {at:0.74,  n:'grooming',          d:'Nosing and grooming each other. This is what settled stock do.'},
  {at:0.88,  n:'dozing',            d:'Lying down with their legs tucked under. Fully at ease.'},
];

function shedPhase(){
  const s = S.shed;
  if(!s) return null;
  const t = 1 - (s.until - Date.now())/SHED_MS;
  let cur = SHED_ACTS[0];
  SHED_ACTS.forEach(a=>{ if(t >= a.at) cur = a; });
  return {...cur, t};
}

function startShed(){
  S.shed = { until: Date.now() + SHED_MS, said: 0 };
  applyShedClass(true);
  if(typeof log === 'function')
    log('The stock have taken themselves into the sheds. They will be in a while.', '', 'home');
}

function applyShedClass(on){
  animalPens().forEach(o=>{
    const el = document.querySelector(`.ob[data-id="${o.id}"]`);
    if(el) el.classList.toggle('inshed', !!on);
  });
}

/* the cutaway: bedding, a hay net, a water trough, and the stock */
function shedInteriors(){
  if(!SET('roofOff') || !S.shed) return '';
  let s = '';
  animalPens().filter(o=>(o.animals||0) > 0).forEach(o=>{
    const bp = BPMAP[o.bp], f = footprint(bp, o.rot);
    const w = f.w*T, h = f.h*T, X = o.tx*T, Y = o.ty*T;
    s += `<g class="shedcut" transform="translate(${n(X)},${n(Y)})">`;
    /* straw floor */
    s += `<rect x="${n(w*0.08)}" y="${n(h*0.08)}" width="${n(w*0.84)}" height="${n(h*0.58)}" rx="3" fill="#d8c48b"/>`;
    for(let i=0;i<Math.min(24, Math.round(w*h/120)); i++)
      s += `<line x1="${n(w*0.1 + hash(i*2.7)*w*0.8)}" y1="${n(h*0.1 + hash(i*4.3)*h*0.54)}"
        x2="${n(w*0.1 + hash(i*2.7)*w*0.8 + 3)}" y2="${n(h*0.1 + hash(i*4.3)*h*0.54 - 1.4)}"
        stroke="#bfa96c" stroke-width="0.7"/>`;
    /* hay net and trough along the back */
    s += `<rect x="${n(w*0.12)}" y="${n(h*0.11)}" width="${n(w*0.26)}" height="${n(h*0.11)}" rx="2" fill="#a8913f"/>`;
    s += `<rect x="${n(w*0.58)}" y="${n(h*0.11)}" width="${n(w*0.28)}" height="${n(h*0.09)}" rx="2" fill="#9fb0b8"/>`;
    s += `<rect x="${n(w*0.59)}" y="${n(h*0.12)}" width="${n(w*0.26)}" height="${n(h*0.05)}" rx="1.5" fill="url(#gWater)"/>`;
    /* a lamp, on because it is dim in there */
    s += `<circle class="fx-bulb" cx="${n(w*0.5)}" cy="${n(h*0.14)}" r="${n(h*0.03)}" fill="#ffe9a8"/>`;
    s += `<rect x="${n(w*0.08)}" y="${n(h*0.08)}" width="${n(w*0.84)}" height="${n(h*0.58)}" rx="3"
      fill="none" stroke="#f2e9d8" stroke-width="1.4" opacity=".9"/>`;
    s += `</g>`;
  });
  return s;
}

/* they say what they are doing, and it changes the longer they are in */
function tickShed(){
  if(!S.shed) return;
  if(Date.now() > S.shed.until){
    S.shed = null;
    applyShedClass(false);
    if(typeof log === 'function') log('The stock are back out in the paddocks.', 'good', 'farm');
    if(typeof render === 'function') render();
    return;
  }
  const ph = shedPhase();
  if(!ph) return;
  if(S.shed.lastAct !== ph.n){
    S.shed.lastAct = ph.n;
    if(typeof log === 'function') log(`In the shed: ${ph.d}`, '', 'home');
  }
  S.shed.said -= 1;
  if(S.shed.said > 0) return;
  S.shed.said = 40 + Math.floor(Math.random()*50);
  const pens = animalPens().filter(o=>(o.animals||0) > 0);
  if(!pens.length) return;
  const o = pens[Math.floor(Math.random()*pens.length)];
  const sp = penSpecies(o);
  const lines = {
    'huddled together':['…','*shivering*','*pressed in*'],
    'settling':        ['…?','*sniff*','Baa?'],
    'at the hay':      ['*munch*','*pull*','Mmm'],
    'playing':         ['*shove*','*bounce*','😄','*headbutt!*'],
    'grooming':        ['*nuzzle*','*lick*','😌'],
    'dozing':          ['*yawn*','💤','…zzz'],
  }[ph.n] || ['…'];
  const c = penCentre(o);
  if(typeof speak === 'function') speak({x:c.x, y:c.y}, lines[Math.floor(Math.random()*lines.length)]);
}

/* the shed follows the panic */
if(typeof tickPanic === 'function'){
  const _tickPanicShed = tickPanic;
  tickPanic = function(){
    const was = !!(S && S.animalPanic);
    const r = _tickPanicShed.apply(this, arguments);
    if(was && S && !S.animalPanic) startShed();     /* panic just ended */
    return r;
  };
}

if(typeof peopleLayer === 'function'){
  const _peopleLayerShed = peopleLayer;
  peopleLayer = function(){ return shedInteriors() + _peopleLayerShed.apply(this, arguments); };
}
if(typeof render === 'function'){
  const _renderShed = render;
  render = function(){
    const r = _renderShed.apply(this, arguments);
    if(S && S.shed) applyShedClass(true);
    return r;
  };
}

/* ---------- 2. the craft ---------- */
const UFO_CHANCE = 0.32;               /* per strike */

function ufoArt(w){
  const h = w*0.46;
  let s = `<ellipse class="ufo-glow" cx="0" cy="${n(h*0.30)}" rx="${n(w*0.60)}" ry="${n(h*0.34)}"
    fill="#7cf0c0" opacity=".22"/>`;
  /* dome */
  s += `<ellipse cx="0" cy="${n(-h*0.18)}" rx="${n(w*0.26)}" ry="${n(h*0.42)}" fill="#bfe9ff" opacity=".9"/>`;
  s += `<ellipse cx="${n(-w*0.07)}" cy="${n(-h*0.28)}" rx="${n(w*0.11)}" ry="${n(h*0.18)}" fill="#fff" opacity=".7"/>`;
  /* hull */
  s += `<ellipse cx="0" cy="0" rx="${n(w*0.5)}" ry="${n(h*0.30)}" fill="#7c8794"/>`;
  s += `<ellipse cx="0" cy="${n(-h*0.06)}" rx="${n(w*0.5)}" ry="${n(h*0.22)}" fill="#a4b0bd"/>`;
  s += `<ellipse cx="0" cy="${n(h*0.10)}" rx="${n(w*0.42)}" ry="${n(h*0.16)}" fill="#5d6874"/>`;
  /* running lights */
  for(let i=0;i<7;i++){
    const a = (i/7)*Math.PI*2;
    s += `<circle class="ufo-lamp" cx="${n(Math.cos(a)*w*0.40)}" cy="${n(h*0.06 + Math.sin(a)*h*0.10)}"
      r="${n(w*0.035)}" fill="#7cf0c0" style="animation-delay:-${(i*0.13).toFixed(2)}s"/>`;
  }
  return s;
}

function ufoLayer(){
  const u = S.ufo;
  if(!u) return '';
  const w = 96;
  let s = `<g id="ufo" transform="translate(${n(u.x)},${n(u.y)})">`;
  /* the beam, once it has locked on */
  if(u.phase === 'beam' || u.phase === 'lift'){
    s += `<path class="ufo-beam" d="M${n(-w*0.22)} 0 L${n(w*0.22)} 0
      L${n(w*0.46)} ${n(u.beamLen)} L${n(-w*0.46)} ${n(u.beamLen)} Z"
      fill="#7cf0c0" opacity=".26"/>`;
  }
  s += `<g class="ufo-hull">${ufoArt(w)}</g>`;
  if(u.hp < u.hpMax){
    s += `<rect x="${n(-w*0.4)}" y="${n(-w*0.42)}" width="${n(w*0.8)}" height="4" rx="2" fill="#00000066"/>`;
    s += `<rect x="${n(-w*0.4)}" y="${n(-w*0.42)}" width="${n(w*0.8*(u.hp/u.hpMax))}" height="4" rx="2" fill="#7cf0c0"/>`;
  }
  return s + '</g>';
}

function spawnUfo(){
  if(S.ufo) return;
  const pens = animalPens().filter(o=>(o.animals||0) > 0);
  if(!pens.length) return;
  const target = pens[Math.floor(Math.random()*pens.length)];
  const c = penCentre(target);
  S.ufo = {
    phase:'arrive', x: c.x - 260, y: (FARM.y-1)*T, tx: c.x, ty: c.y - 90,
    target: target.id, beamLen: 0, hp: 6, hpMax: 6, t: 0, took: 0,
  };
  if(typeof log === 'function')
    log('Something came down through the cloud. It is not a plane.', 'bad', 'alert');
  if(typeof toast === 'function') toast('Something is over the paddock', 'bad');
  if(typeof SND !== 'undefined') SND.play('error');
}

function tickUfo(dt){
  const u = S.ufo;
  if(!u) return;
  u.t += dt;

  if(u.phase === 'arrive'){
    const dx = u.tx - u.x, dy = u.ty - u.y, d = Math.hypot(dx,dy);
    if(d < 6){ u.phase = 'beam'; u.t = 0; }
    else { const sp = 120*dt; u.x += dx/d*Math.min(d,sp); u.y += dy/d*Math.min(d,sp); }
  }
  else if(u.phase === 'beam'){
    u.beamLen = Math.min(96, u.beamLen + 90*dt);
    if(u.t > 3.4){ u.phase = 'lift'; u.t = 0;
      /* it takes one head off the pen it was over */
      const pen = (S.objs||[]).find(o=>o.id === u.target);
      if(pen && (pen.animals||0) > 0){
        pen.animals--; u.took++;
        if(typeof log === 'function')
          log(`It took one of the ${(BPMAP[pen.bp]||{name:'stock'}).name.toLowerCase()}. Straight up the beam.`, 'bad', 'alert');
        if(typeof toast === 'function') toast('It took an animal', 'bad');
      }
    }
  }
  else if(u.phase === 'lift'){
    u.beamLen = Math.max(0, u.beamLen - 70*dt);
    if(u.t > 2.2){
      /* line up another pen, or leave */
      const pens = animalPens().filter(o=>(o.animals||0) > 0);
      if(u.took < 3 && pens.length && Math.random() < 0.7){
        const nxt = pens[Math.floor(Math.random()*pens.length)];
        const c = penCentre(nxt);
        u.target = nxt.id; u.tx = c.x; u.ty = c.y - 90; u.phase = 'arrive'; u.t = 0;
      } else { u.phase = 'leave'; u.t = 0; }
    }
  }
  else if(u.phase === 'leave'){
    u.y -= 130*dt; u.x += 60*dt;
    if(u.y < (FARM.y-4)*T){
      S.ufo = null;
      if(typeof log === 'function') log('It went back up through the cloud and was gone.', '', 'alert');
      if(typeof render === 'function') render();
      return;
    }
  }
  paintUfo();
}

function paintUfo(){
  const u = S.ufo;
  let el = document.getElementById('ufo');
  if(!u){ if(el) el.parentElement && el.remove(); return; }
  if(!el){ if(typeof render === 'function') render(); return; }
  el.setAttribute('transform', `translate(${n(u.x)},${n(u.y)})`);
  const beam = el.querySelector('.ufo-beam');
  if(beam){
    beam.setAttribute('d', `M${n(-96*0.22)} 0 L${n(96*0.22)} 0 L${n(96*0.46)} ${n(u.beamLen)} L${n(-96*0.46)} ${n(u.beamLen)} Z`);
    beam.style.display = (u.phase==='beam'||u.phase==='lift') ? '' : 'none';
  }
}

/* ---------- shooting it down ---------- */
G.shootUfo = function(){
  const u = S.ufo;
  if(!u) return;
  u.hp--;
  if(typeof SND !== 'undefined') SND.play('click');
  const el = document.getElementById('ufo');
  if(el){ el.classList.remove('ufo-hit'); void el.offsetWidth; el.classList.add('ufo-hit'); }
  if(u.hp > 0){ if(typeof render === 'function') render(); return; }

  /* down it comes */
  const took = u.took;
  S.ufo = null;
  if(typeof SND !== 'undefined') SND.play('level');
  /* what it was carrying comes back changed */
  S.mutants = (S.mutants || 0) + 2;
  if(typeof log === 'function'){
    log('You brought it down over the top paddock.', 'gold', 'farm');
    log(`Two head walked out of the wreck. They are not quite what went up — they glow, faintly. Whatever they are now, people pay for it.`, 'gold', 'farm');
  }
  if(typeof toast === 'function') toast('Two glowing head recovered', 'gold');
  if(typeof render === 'function') render();
  if(typeof ui === 'function') ui();
  G.save();
};

/* the mutants pay, every month */
if(typeof monthlyReckoning === 'function'){
  const _monthlyMutant = monthlyReckoning;
  monthlyReckoning = function(){
    const r = _monthlyMutant.apply(this, arguments);
    const m = S.mutants || 0;
    if(m > 0){
      const pay = m * 1400;
      S.cash += pay; S.totalEarned += pay;
      log(`The glowing stock brought in ${fmt(pay)} this month. Nobody asks where they came from.`, 'gold', 'money');
    }
    return r;
  };
}

/* a target you can actually click */
setTimeout(()=>{
  document.addEventListener('click', (e)=>{
    if(!S || !S.ufo) return;
    const el = document.getElementById('ufo');
    if(!el) return;
    const b = el.getBoundingClientRect();
    /* generous hit box - this is meant to be fun, not fiddly */
    if(e.clientX >= b.left-14 && e.clientX <= b.right+14 &&
       e.clientY >= b.top-14  && e.clientY <= b.bottom+14){
      e.preventDefault(); e.stopPropagation();
      G.shootUfo();
    }
  }, true);
}, 500);

/* it rides above everything */
if(typeof peopleLayer === 'function'){
  const _peopleLayerUfo = peopleLayer;
  peopleLayer = function(){ return _peopleLayerUfo.apply(this, arguments) + ufoLayer(); };
}

const _tickPeopleUfo = tickPeople;
tickPeople = function(dt){
  const r = _tickPeopleUfo.apply(this, arguments);
  if(S && S.speed !== 0){ tickShed(); tickUfo(dt); }
  return r;
};

/* it comes in on the back of a strike, sometimes */
if(typeof lightningStrike === 'function'){
  const _strikeUfo = lightningStrike;
  lightningStrike = function(){
    const r = _strikeUfo.apply(this, arguments);
    if(!S.ufo && Math.random() < UFO_CHANCE) setTimeout(spawnUfo, 2600);
    return r;
  };
}

/* show the glowing stock on the Stats tab */
if(typeof renderRight === 'function'){
  const _renderRightMut = renderRight;
  renderRight = function(){
    const r = _renderRightMut.apply(this, arguments);
    if(rightTab === 'owner' && (S.mutants||0) > 0){
      const b = document.getElementById('rightBody');
      if(b && !b.querySelector('.mutcard')){
        const d = document.createElement('div');
        d.className = 'pcard mutcard';
        d.innerHTML = `<h3>The glowing stock</h3>
          <p class="sub">${S.mutants} head recovered from the wreck. They pay
          <b>${fmt(S.mutants*1400)}</b> a month and eat nothing at all.</p>`;
        b.appendChild(d);
      }
    }
    return r;
  };
}

(function ufoCss(){
  const s = document.createElement('style');
  s.textContent = `
  /* in the shed: the stock hold their bunch and the pen dims */
  .ob.inshed .pen-animal{ transform: translate(var(--hx,0), var(--hy,0)) scale(.9); }
  .shedcut{ pointer-events:none; }
  #ufo{ cursor:crosshair; }
  #ufo .ufo-hull{ transform-box:fill-box; transform-origin:center;
    animation: ufoHover 3.1s ease-in-out infinite; }
  @keyframes ufoHover{
    0%,100%{ transform: translateY(0)    rotate(-1.5deg); }
    50%    { transform: translateY(-5px) rotate(1.5deg); } }
  #ufo .ufo-lamp{ animation: ufoLamp 1.1s ease-in-out infinite; }
  @keyframes ufoLamp{ 0%,100%{ opacity:.35 } 50%{ opacity:1 } }
  #ufo .ufo-glow{ animation: ufoGlow 2.4s ease-in-out infinite; }
  @keyframes ufoGlow{ 0%,100%{ opacity:.14 } 50%{ opacity:.32 } }
  #ufo .ufo-beam{ animation: ufoBeam 1.4s ease-in-out infinite; }
  @keyframes ufoBeam{ 0%,100%{ opacity:.18 } 50%{ opacity:.34 } }
  #ufo.ufo-hit .ufo-hull{ animation: ufoHit .28s ease-out 1; }
  @keyframes ufoHit{
    0%  { filter:none; transform: translateX(0); }
    30% { transform: translateX(-4px) rotate(-6deg); }
    60% { transform: translateX(4px)  rotate(5deg); }
    100%{ transform: translateX(0); } }
  @media (prefers-reduced-motion: reduce){
    #ufo .ufo-hull, #ufo .ufo-lamp, #ufo .ufo-glow, #ufo .ufo-beam{ animation:none !important; } }
  `;
  document.head.appendChild(s);
})();

/* so it can be tried without waiting for a storm */
G.callUfo = function(){ spawnUfo(); };
