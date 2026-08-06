/* =====================================================================
   BIRDS

   A farm without birds reads as a diagram. These are deliberately cheap:
   a handful of flock members crossing the sky on a long loop, and a few
   ground birds that hop between trees, beds and the compost — where
   real birds actually go, because that is where the worms are.

   They take cover in a storm like everyone else, and they roost at
   night. Both are behaviour you would notice if it were missing.
   ===================================================================== */

const BIRDS = { sky:[], ground:[], layer:null, nests:[] };
const BIRD_SKY_MAX = 5;
const BIRD_GROUND_MAX = 5;

/* a bird from above is a body and two swept wings */
function birdArt(sc, col){
  sc = sc || 1;
  const c = col || '#3f4a52';
  return `<g class="bd-wings">
      <path d="M0 0 q ${n(-5*sc)} ${n(-3.4*sc)} ${n(-9*sc)} ${n(-1.2*sc)}
               q ${n(4*sc)} ${n(1.4*sc)} ${n(9*sc)} ${n(1.2*sc)} z" fill="${c}"/>
      <path d="M0 0 q ${n(5*sc)} ${n(-3.4*sc)} ${n(9*sc)} ${n(-1.2*sc)}
               q ${n(-4*sc)} ${n(1.4*sc)} ${n(-9*sc)} ${n(1.2*sc)} z" fill="${c}"/>
    </g>
    <ellipse cx="0" cy="0" rx="${n(2.6*sc)}" ry="${n(1.5*sc)}" fill="${c}"/>
    <circle cx="${n(2.4*sc)}" cy="${n(-0.5*sc)}" r="${n(1.1*sc)}" fill="${c}"/>
    <path d="M${n(3.4*sc)} ${n(-0.5*sc)} l ${n(1.6*sc)} ${n(0.5*sc)} l ${n(-1.6*sc)} ${n(0.6*sc)} z" fill="#e0a13c"/>`;
}

/* a nest is a woven cup with eggs, tucked in a tree */
function nestArt(sc){
  sc = sc || 1;
  let s = `<ellipse cx="0" cy="${n(1.6*sc)}" rx="${n(7*sc)}" ry="${n(4*sc)}" fill="#16240c" opacity=".26"/>`;
  s += `<ellipse cx="0" cy="0" rx="${n(7*sc)}" ry="${n(5*sc)}" fill="#7a6242"/>`;
  s += `<ellipse cx="0" cy="${n(-0.5*sc)}" rx="${n(5.2*sc)}" ry="${n(3.4*sc)}" fill="#5d4a31"/>`;
  /* woven twigs around the rim */
  for(let i=0;i<9;i++){
    const a = (i/9)*Math.PI*2;
    s += `<line x1="${n(Math.cos(a)*6.4*sc)}" y1="${n(Math.sin(a)*4.4*sc)}"
      x2="${n(Math.cos(a)*7.8*sc)}" y2="${n(Math.sin(a)*5.4*sc)}"
      stroke="#8b7150" stroke-width="${n(0.8*sc)}" stroke-linecap="round"/>`;
  }
  [[-1.8,-0.4],[0.6,0.6],[2.2,-0.8]].forEach(e=>{
    s += `<ellipse cx="${n(e[0]*sc)}" cy="${n(e[1]*sc)}" rx="${n(1.7*sc)}" ry="${n(2.1*sc)}" fill="#dfe6d4"/>`;
    s += `<ellipse cx="${n((e[0]-0.4)*sc)}" cy="${n((e[1]-0.5)*sc)}" rx="${n(0.7*sc)}" ry="${n(0.9*sc)}" fill="#fff" opacity=".6"/>`;
  });
  return s;
}

/* where a ground bird would actually bother going */
function birdTargets(){
  const good = S.objs.filter(o=>{
    const a = (BPMAP[o.bp]||{}).art || '';
    return /^tree_|compost|bed|orchard|berry|flowers|pond|fodder|coop/.test(a);
  });
  return good.length ? good : S.objs.slice(0, 4);
}

function birdsInit(){
  if(BIRDS.sky.length) return;
  for(let i=0;i<BIRD_SKY_MAX;i++){
    BIRDS.sky.push({ id:'sk'+i,
      x: Math.random()*WPX, y: -200 + Math.random()*150,
      sc: 0.55 + Math.random()*0.4, vx: 26 + Math.random()*26,
      bobT: Math.random()*6 });
  }
  for(let i=0;i<BIRD_GROUND_MAX;i++){
    BIRDS.ground.push({ id:'gd'+i,
      x: (FARM.x + Math.random()*FARM.w)*T, y: (FARM.y + Math.random()*FARM.h)*T,
      sc: 0.5 + Math.random()*0.25, tx:0, ty:0, wait: Math.random()*3, hop:0 });
  }
}

/* nests appear in mature trees — one per tree, up to three */
function nestSites(){
  const trees = S.objs.filter(o=>/^tree_/.test((BPMAP[o.bp]||{}).art||''));
  return trees.slice(0,3).map(o=>{
    const f = footprint(BPMAP[o.bp], o.rot);
    return { x:(o.tx+f.w*0.68)*T, y:(o.ty+f.h*0.30)*T };
  });
}

function birdsLayer(){
  birdsInit();
  const nests = nestSites().map(p=>
    `<g class="bd-nest" transform="translate(${n(p.x)},${n(p.y)})">${nestArt(0.8)}</g>`).join('');
  const sky = BIRDS.sky.map(b=>
    `<g class="bd bd-sky" data-b="${b.id}" transform="translate(${n(b.x)},${n(b.y)})">
      <g transform="scale(${b.sc.toFixed(2)})">${birdArt(1,'#46525c')}</g></g>`).join('');
  const gnd = BIRDS.ground.map(b=>
    `<g class="bd bd-gnd" data-b="${b.id}" transform="translate(${n(b.x)},${n(b.y)})">
      <ellipse cx="1" cy="4" rx="4" ry="1.6" fill="#16240c" opacity=".3"/>
      <g transform="scale(${b.sc.toFixed(2)})">${birdArt(1,'#5a4636')}</g></g>`).join('');
  return `<g id="birds">${nests}${sky}${gnd}</g>`;
}

function tickBirds(dt){
  if(!BIRDS.sky.length) return;
  const hidden = (S.weather === 'storm' || S.weather === 'rain');
  const night  = (typeof isNight === 'function') ? isNight() : false;
  const away   = hidden || night;

  BIRDS.sky.forEach(b=>{
    b.x += b.vx*dt;
    b.bobT += dt;
    if(b.x > WPX + 120){ b.x = -120; b.y = -200 + Math.random()*150; }
    const el = document.querySelector(`[data-b="${b.id}"]`);
    if(el){
      el.setAttribute('transform', `translate(${n(b.x)},${n(b.y + Math.sin(b.bobT*1.6)*4)})`);
      el.style.opacity = away ? 0 : 1;
    }
  });

  BIRDS.ground.forEach(b=>{
    const el = document.querySelector(`[data-b="${b.id}"]`);
    if(away){ if(el) el.style.opacity = 0; return; }
    if(el) el.style.opacity = 1;
    b.wait -= dt;
    if(b.wait <= 0 && !b.hop){
      const targets = birdTargets();
      if(targets.length){
        const o = targets[Math.floor(Math.random()*targets.length)];
        const f = footprint(BPMAP[o.bp], o.rot);
        b.tx = (o.tx + Math.random()*f.w)*T;
        b.ty = (o.ty + Math.random()*f.h)*T;
        b.hop = 1;
      }
    }
    if(b.hop){
      const dx = b.tx-b.x, dy = b.ty-b.y, d = Math.hypot(dx,dy);
      if(d < 3){ b.hop = 0; b.wait = 1.5 + Math.random()*4; }
      else { const spd = 54*dt; b.x += dx/d*Math.min(d,spd); b.y += dy/d*Math.min(d,spd); }
      if(el) el.setAttribute('transform', `translate(${n(b.x)},${n(b.y)})`);
    }
  });
}

/* birds ride along with the people layer so they land in the same stack */
const _peopleLayerBirds = peopleLayer;
peopleLayer = function(){ return _peopleLayerBirds.apply(this, arguments) + birdsLayer(); };

const _tickPeopleBirds = tickPeople;
tickPeople = function(dt){ const r = _tickPeopleBirds.apply(this, arguments); tickBirds(dt); return r; };

(function birdCss(){
  const s = document.createElement('style');
  s.textContent = `
  #birds{ pointer-events:none; }
  #birds .bd{ transition:opacity .8s ease; }
  #birds .bd-wings{ transform-box:fill-box; transform-origin:center;
    animation: bdFlap .34s ease-in-out infinite; }
  #birds .bd-gnd .bd-wings{ animation-duration:1.6s; }
  @keyframes bdFlap{
    0%,100%{ transform: scaleY(1)    translateY(0); }
    50%    { transform: scaleY(.35)  translateY(-1px); } }
  @media (prefers-reduced-motion: reduce){ #birds .bd-wings{ animation:none !important; } }
  `;
  document.head.appendChild(s);
})();

/* =====================================================================
   COMPOST IS A FAMILY JOB

   Turning a heap is the classic shared chore: the partner turns it, the
   kids carry scraps out to it. Both only happen if a compost bay exists,
   and neither happens in a storm, when the shelter routine wins.
   ===================================================================== */
function compostSpot(){
  const c = S.objs.find(o => (BPMAP[o.bp]||{}).art === 'compost');
  if(!c) return null;
  const f = footprint(BPMAP[c.bp], c.rot);
  return { x:(c.tx + f.w*0.5)*T, y:(c.ty + f.h + 0.4)*T };
}

const _routineCompost = routine;
routine = function(p){
  const f = dayFrac();
  const heap = compostSpot();
  if(heap && S.weather !== 'storm'){
    /* partner turns the heap mid-morning */
    if(p.role === 'partner' && f > 0.40 && f < 0.46)
      return { ...heap, act:'turning the compost' };
    /* the kids run the scraps out after breakfast */
    if(p.role === 'child' && f > 0.36 && f < 0.40)
      return { ...heap, act:'taking out the scraps' };
  }
  return _routineCompost(p);
};
