/* =====================================================================
   TAKING SHELTER

   When a storm comes through, a real family is not out weeding. They
   come inside, and the house lights up while the paddocks go dark.

   So: storms pull everyone indoors, the lightning gets genuinely
   dramatic, and because all the interesting behaviour is now hidden
   under a roof, you can lift the roof off and watch it.

   The drama here is all light and timing — no camera shake. Shaking the
   view reads as a bug, not as weather.
   ===================================================================== */

/* ---------- 1. everyone indoors during a storm ---------- */

/* where each person sits inside the house, as a fraction of its footprint */
const INDOOR_SPOTS = [
  {fx:0.24, fy:0.34, act:'at the kitchen table'},
  {fx:0.52, fy:0.30, act:'making tea'},
  {fx:0.74, fy:0.38, act:'watching the rain'},
  {fx:0.30, fy:0.66, act:'reading by the fire'},
  {fx:0.58, fy:0.70, act:'playing cards'},
  {fx:0.80, fy:0.64, act:'drawing at the window'},
  {fx:0.42, fy:0.50, act:'listening to the radio'},
  {fx:0.66, fy:0.52, act:'mending a jumper'},
];

function homeObj(){
  return S.objs.find(o => BPMAP[o.bp] && BPMAP[o.bp].kind === 'home');
}
function stormNow(){ return S.weather === 'storm'; }

/* Each person keeps the same seat for the duration of a storm rather than
   teleporting between chairs every tick. */
function indoorSpot(p, idx){
  const ho = homeObj();
  if(!ho) return null;
  const bp = BPMAP[ho.bp], f = footprint(bp, ho.rot);
  const sp = INDOOR_SPOTS[idx % INDOOR_SPOTS.length];
  return { x:(ho.tx + f.w*sp.fx)*T, y:(ho.ty + f.h*sp.fy)*T, act:sp.act };
}

const _routineStorm = routine;
routine = function(p){
  if(stormNow()){
    const list = S.family.concat(S.workers || []);
    const idx = Math.max(0, list.findIndex(q => q.id === p.id));
    const spot = indoorSpot(p, idx);
    if(spot) return spot;
  }
  return _routineStorm(p);
};

/* ---------- 2. lift the roof and watch ---------- */

/* A cutaway of the house: floorboards, dividing walls, and the furniture
   that makes each room legible from above. */
function interiorArt(w, h){
  let s = `<rect x="1" y="1" width="${n(w-2)}" height="${n(h-2)}" rx="3" fill="#c9a878"/>`;
  /* floorboards running the long way */
  const boards = Math.max(4, Math.round(h/7));
  for(let i=1;i<boards;i++)
    s += `<line x1="1.5" y1="${n(1+(h-2)*i/boards)}" x2="${n(w-1.5)}" y2="${n(1+(h-2)*i/boards)}"
      stroke="#ab8a5f" stroke-width="0.6" opacity=".7"/>`;

  /* interior walls: kitchen/living split, two bedrooms along the top */
  const wall = (x1,y1,x2,y2)=>`<line x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}"
    stroke="#efe6d6" stroke-width="2.4" stroke-linecap="round"/>`;
  s += wall(w*0.46, 2, w*0.46, h*0.46);
  s += wall(2, h*0.46, w*0.92, h*0.46);
  s += wall(w*0.72, h*0.46, w*0.72, h-2);

  /* kitchen: bench, sink, stove */
  s += `<rect x="${n(w*0.06)}" y="${n(h*0.10)}" width="${n(w*0.34)}" height="${n(h*0.10)}" rx="1.6" fill="#8e9aa2"/>`;
  s += `<rect x="${n(w*0.10)}" y="${n(h*0.12)}" width="${n(w*0.07)}" height="${n(h*0.06)}" rx="1" fill="#c8d2d8"/>`;
  s += `<circle cx="${n(w*0.30)}" cy="${n(h*0.15)}" r="${n(h*0.025)}" fill="#3f4a52"/>`;
  s += `<rect x="${n(w*0.10)}" y="${n(h*0.26)}" width="${n(w*0.24)}" height="${n(h*0.12)}" rx="2" fill="#a9764a"/>`;

  /* living: rug, sofa, hearth */
  s += `<ellipse cx="${n(w*0.60)}" cy="${n(h*0.26)}" rx="${n(w*0.13)}" ry="${n(h*0.11)}" fill="#9c5b52" opacity=".85"/>`;
  s += `<rect x="${n(w*0.50)}" y="${n(h*0.07)}" width="${n(w*0.20)}" height="${n(h*0.07)}" rx="2.4" fill="#5f7a6b"/>`;
  s += `<rect x="${n(w*0.86)}" y="${n(h*0.16)}" width="${n(w*0.09)}" height="${n(h*0.14)}" rx="1.4" fill="#7b6f66"/>`;
  s += `<circle class="hearth" cx="${n(w*0.905)}" cy="${n(h*0.23)}" r="${n(h*0.035)}" fill="#f0a24b"/>`;

  /* bedrooms along the bottom */
  s += `<rect x="${n(w*0.06)}" y="${n(h*0.56)}" width="${n(w*0.20)}" height="${n(h*0.16)}" rx="2" fill="#7f8fa6"/>`;
  s += `<rect x="${n(w*0.06)}" y="${n(h*0.56)}" width="${n(w*0.20)}" height="${n(h*0.05)}" rx="2" fill="#c3cede"/>`;
  s += `<rect x="${n(w*0.40)}" y="${n(h*0.56)}" width="${n(w*0.20)}" height="${n(h*0.16)}" rx="2" fill="#7f8fa6"/>`;
  s += `<rect x="${n(w*0.40)}" y="${n(h*0.56)}" width="${n(w*0.20)}" height="${n(h*0.05)}" rx="2" fill="#c3cede"/>`;
  /* bathroom in the corner */
  s += `<rect x="${n(w*0.78)}" y="${n(h*0.56)}" width="${n(w*0.14)}" height="${n(h*0.12)}" rx="2" fill="#cdd9de"/>`;

  /* warm light spilling from the rooms */
  s += `<rect x="1" y="1" width="${n(w-2)}" height="${n(h-2)}" rx="3" fill="#ffd489" opacity=".10"/>`;
  return s;
}

/* Draw the cutaway over the home's footprint when the roof is lifted. */
function roofOffLayer(){
  if(!SET('roofOff')) return '';
  const ho = homeObj();
  if(!ho) return '';
  const bp = BPMAP[ho.bp], f = footprint(bp, ho.rot);
  const w = f.w*T, h = f.h*T;
  return `<g id="cutaway" transform="translate(${n(ho.tx*T)},${n(ho.ty*T)})">
    ${interiorArt(w, h)}
    <rect x="0.6" y="0.6" width="${n(w-1.2)}" height="${n(h-1.2)}" rx="3.4"
      fill="none" stroke="#f2e9d8" stroke-width="1.6" opacity=".9"/></g>`;
}

/* the cutaway sits above the house but below the people, so the family
   reads as being inside it */
const _peopleLayerStorm = peopleLayer;
peopleLayer = function(){ return roofOffLayer() + _peopleLayerStorm.apply(this, arguments); };

/* a setting, and a button in the top bar */
(function addRoofSetting(){
  if(SETTINGS.some(o=>o.k==='roofOff')) return;
  const i = SETTINGS.findIndex(o=>o.g==='Display');
  SETTINGS.splice(i < 0 ? 0 : i+1, 0, {
    g:'Display', k:'roofOff', n:'Lift the roof', t:'bool', def:false,
    d:'See inside the house — useful in a storm, when everyone is indoors.'
  });
})();

G.toggleRoof = function(){
  const v = !SET('roofOff');
  setOpt('roofOff', v);
  render();
  toast(v ? 'Roof lifted — you can see inside' : 'Roof back on', 'good');
  sfx('click');
};

/* ---------- 3. dramatic lightning ---------- */
/* Louder in light, not in motion: a double flash with a dark beat between
   them, the sky dropping out, and the bolt held a fraction longer. */
const _strikeBase = (typeof lightningStrike === 'function') ? lightningStrike : null;
if(_strikeBase){
  lightningStrike = function(){
    const r = _strikeBase.apply(this, arguments);
    const world = document.getElementById('world');
    if(world){
      world.classList.remove('storm-flash');
      void world.offsetWidth;
      world.classList.add('storm-flash');
      setTimeout(()=>world.classList.remove('storm-flash'), 1300);
    }
    /* the follow-up stroke real lightning almost always has */
    if(Math.random() < 0.55) setTimeout(()=>{ try{ _strikeBase(); }catch(e){} }, 180 + Math.random()*160);
    return r;
  };
}

(function stormCss(){
  const s = document.createElement('style');
  s.textContent = `
  #cutaway{ pointer-events:none; }
  #cutaway .hearth{ animation: hearthFlicker 2.2s ease-in-out infinite; }
  @keyframes hearthFlicker{ 0%,100%{opacity:.75} 50%{opacity:1} }

  /* the world dims hard, then the strike over-brightens it twice */
  .storm-flash{ animation: stormFlash 1.25s ease-out 1; }
  @keyframes stormFlash{
    0%   { filter:none; }
    6%   { filter:brightness(1.9) contrast(.9); }
    13%  { filter:brightness(.72); }
    20%  { filter:brightness(1.55); }
    30%  { filter:brightness(.85); }
    100% { filter:none; } }
  @media (prefers-reduced-motion: reduce){
    .storm-flash{ animation:none !important; }
    #cutaway .hearth{ animation:none !important; } }
  `;
  document.head.appendChild(s);
})();

/* a button in the top bar, since the roof is something you flip often */
setTimeout(()=>{
  const bar = document.querySelector('.tbtn') && document.querySelector('.tbtn').parentElement;
  if(!bar || document.getElementById('roofbtn')) return;
  const b = document.createElement('button');
  b.id = 'roofbtn'; b.className = 'tbtn' + (SET('roofOff') ? ' on' : '');
  b.textContent = 'Roof';
  b.dataset.tip = '<b>Lift the roof</b>See what the family are doing inside. They all come in during a storm.';
  b.addEventListener('click', ()=>{ G.toggleRoof(); b.classList.toggle('on', !!SET('roofOff')); });
  bar.insertBefore(b, bar.firstChild);
}, 420);
