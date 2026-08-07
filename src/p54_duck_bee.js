/* =====================================================================
   DUCKS, BEES, RABBITS - AND THE BUGS THE LAST PASS EXPOSED

   p53 gave the stock minds, but only the species that went through
   paddock(). Ducks swim on a pond, bees live in a box and rabbits are
   filed under 'bonus' rather than 'animal', so all three were left out.

   Wiring them up turned up three genuine faults that had nothing to do
   with minds:

   * A placed rabbit hutch drew NO rabbits. The blueprint is kind:'bonus',
     so place() never initialised o.animals, and ART.rabbit renders
     (ob.animals||0) head - zero. You bought charm and got an empty hutch.

   * penSpecies() returned 'hive' for the apiary, because the blueprint
     says animal:'hive' and bp.animal is checked before the art-name
     fallback that would have said 'bee'. Every per-species lookup in the
     game - voice, panic cry, now activities - missed for bees.

   * tickMinds ran inside a bare try/catch that swallowed everything.
     That is how the undefined speech line in the procession stayed
     invisible. It now reports the first failure and then stays quiet.
   ===================================================================== */

/* ---------- bees are bees ---------- */
if(typeof penSpecies === 'function'){
  const _penSpeciesBee = penSpecies;
  penSpecies = function(o){
    const sp = _penSpeciesBee.apply(this, arguments);
    return sp === 'hive' ? 'bee' : sp;
  };
}

/* ---------- a hutch with rabbits in it ---------- */
/* Fixed at draw time rather than by changing the blueprint to kind
   'animal': that field drives feed, production and the daily reckoning,
   and rabbits are meant to cost nothing and produce nothing. */
const RABBIT_HEAD = 3;
if(typeof ART === 'object' && ART.rabbit){
  ART.rabbit = (w,h,ob)=> paddock(w, h, 'rabbit', (ob && ob.animals) || RABBIT_HEAD, 27, 0.9);
}

/* The pens the mind model is allowed to touch. Deliberately NOT
   animalPens(), which the economy uses - widening that would start
   charging feed for rabbits. */
function mindPens(){
  return (S.objs||[]).filter(o=>{
    const bp = BPMAP[o.bp]; if(!bp) return false;
    if(bp.kind === 'animal') return (o.animals||0) > 0;
    return bp.art === 'rabbit';              /* charm-only, always occupied */
  });
}
function penHead(o){
  const bp = BPMAP[o.bp];
  if(bp.kind === 'animal') return o.animals || 0;
  return RABBIT_HEAD;
}

/* ---------- ducks: a pond with a house on the bank ---------- */
/* Ducks swim by day and are shut in a house at night, which is the whole
   reason a duck house exists - foxes. So the pen is water plus a bank
   strip, and the shelter sits on the bank. */
function pondRect(w, h){
  return { x: w*0.06, y: h*0.42, w: w*0.88, h: h*0.5 };
}

function duckHouseFittings(b){
  const W = b.w, H = b.h;
  let s = '';
  s += `<rect x="${n(b.x)}" y="${n(b.y)}" width="${n(W)}" height="${n(H)}" rx="3" fill="#d8c48b"/>`;
  for(let i=0;i<8;i++){
    const sx = b.x + 3 + hash(i*3.1)*(W-6), sy = b.y + 3 + hash(i*6.7)*(H-6);
    s += `<line x1="${n(sx)}" y1="${n(sy)}" x2="${n(sx+3)}" y2="${n(sy-1.3)}" stroke="#bfa96c" stroke-width=".7"/>`;
  }
  /* ducks nest on the floor, not on shelves - low straw nests in a corner */
  for(let i=0;i<2;i++){
    const nx = b.x + W*0.1, ny = b.y + H*0.5 + i*H*0.24;
    s += `<ellipse cx="${n(nx+W*0.14)}" cy="${n(ny)}" rx="${n(W*0.15)}" ry="${n(H*0.1)}" fill="#c2a862"/>`;
    s += `<ellipse cx="${n(nx+W*0.14)}" cy="${n(ny)}" rx="${n(W*0.09)}" ry="${n(H*0.06)}" fill="#efe3c2"/>`;
    if(i === 0) s += `<ellipse cx="${n(nx+W*0.14)}" cy="${n(ny)}" rx="2.4" ry="3" fill="#f6f1e2"/>`;
  }
  /* a shallow drinker deep enough to clear their nostrils, and grain */
  s += `<rect x="${n(b.x+W*0.56)}" y="${n(b.y+H*0.16)}" width="${n(W*0.3)}" height="${n(H*0.16)}" rx="2" fill="#9fb0b8"/>`;
  s += `<rect x="${n(b.x+W*0.575)}" y="${n(b.y+H*0.185)}" width="${n(W*0.27)}" height="${n(H*0.1)}" rx="1.5" fill="url(#gWater)"/>`;
  s += `<rect x="${n(b.x+W*0.56)}" y="${n(b.y+H*0.56)}" width="${n(W*0.28)}" height="${n(H*0.14)}" rx="2" fill="#a8814f"/>`;
  s += `<circle class="fx-bulb" cx="${n(b.x+W*0.5)}" cy="${n(b.y+H*0.04)}" r="2.4" fill="#ffe9a8"/>`;
  return s;
}

if(typeof ART === 'object' && ART.duck_pond){
  ART.duck_pond = (w,h,ob)=>{
    const cnt = ob ? Math.min(8, ob.animals||0) : 3;
    const p = pondRect(w,h), b = shelterBox(w,h);
    /* grass bank first, then the pond cut into it */
    let s = patch(w,h,'#84ad57',19,1);
    s += `<g transform="translate(${n(p.x)},${n(p.y)})">${water(p.w, p.h, 19)}</g>`;
    /* a muddy margin where they get in and out */
    s += `<ellipse cx="${n(p.x+p.w*0.5)}" cy="${n(p.y)}" rx="${n(p.w*0.34)}" ry="4" fill="#9c8557" opacity=".55"/>`;
    s += `<g class="shed-in">${duckHouseFittings(b)}</g>`;
    const cx = w/2, cy = h/2;
    for(let i=0;i<cnt;i++){
      const sp = baseSpot(i, 19, w, h);
      /* start them on the water, which is where a duck actually is */
      const dx0 = p.x + 6 + hash(i*2.9)*Math.max(4, p.w-12);
      const dy0 = p.y + 5 + hash(i*4.3+1)*Math.max(4, p.h-10);
      const hx = (cx - dx0)*0.82, hy = (cy - dy0)*0.82;
      s += `<g class="pen-animal a3" data-ai="${i}" style="--hx:${n(hx)}px; --hy:${n(hy)}px;
        animation-delay:-${(hash(i*7.1+19)*3).toFixed(1)}s">${beast('duck', dx0, dy0, 0.9)}</g>`;
    }
    s += shedRoof(b);
    if(ob && ob.ready>0) s += `<circle class="pulse" cx="${n(w-6)}" cy="6" r="3.4" fill="#f0c14b"/>`;
    return s;
  };
}

/* ---------- bees: the hive is the shed ---------- */
/* No separate shelter - lift the roof and you are looking down into the
   boxes at the frames, which is exactly what a beekeeper sees. */
if(typeof ART === 'object' && ART.apiary){
  const _apiaryBase = ART.apiary;
  ART.apiary = (w,h,ob)=>{
    let s = _apiaryBase(w,h,ob);
    const cnt = Math.max(2, Math.floor(w/22));
    /* frames and brood, revealed with the roof off */
    let inner = '';
    for(let i=0;i<cnt;i++){
      const x = 3+i*((w-6)/cnt), bw = Math.min(13,(w-6)/cnt-2), y = h/2-7;
      inner += `<rect x="${n(x)}" y="${n(y)}" width="${n(bw)}" height="14" rx="1" fill="#6b4f28"/>`;
      /* frames run front to back; capped honey at the edges, brood centre */
      for(let f=0; f<4; f++){
        const fx = x + 1 + f*((bw-2)/4);
        const edge = (f === 0 || f === 3);
        inner += `<rect x="${n(fx)}" y="${n(y+1.4)}" width="${n((bw-2)/4 - 0.6)}" height="11.2" rx="0.6"
          fill="${edge ? '#e8b64a' : '#c98f4a'}"/>`;
      }
      inner += `<rect x="${n(x)}" y="${n(y)}" width="${n(bw)}" height="14" rx="1" fill="none" stroke="#4a3618" stroke-width=".8"/>`;
    }
    s += `<g class="shed-in">${inner}</g>`;
    /* the lids are the roof */
    let lids = '';
    for(let i=0;i<cnt;i++){
      const x = 3+i*((w-6)/cnt), bw = Math.min(13,(w-6)/cnt-2), y = h/2-7;
      lids += `<rect x="${n(x-0.8)}" y="${n(y-2)}" width="${n(bw+1.6)}" height="3" rx="1" fill="#f4efe1"/>`;
    }
    s += `<g class="shed-roof">${lids}</g>`;
    /* the bees themselves, as agents rather than two decorative dots */
    const head = ob ? Math.min(8, ob.animals || 0) : 3;
    for(let i=0;i<head;i++){
      const bx = 6 + hash(i*2.9+23)*Math.max(4, w-12);
      const by = 5 + hash(i*4.3+23)*Math.max(4, h-10);
      s += `<g class="pen-animal" data-ai="${i}" style="--hx:0px; --hy:0px;
        animation-delay:-${(hash(i*7.1+23)*3).toFixed(1)}s">${beeBody(bx, by, 1)}</g>`;
    }
    return s;
  };
}

/* a hive is its own shed, so the "shelter" for bees is the hive row */
function hiveRow(w, h){ return { x: 3, y: h/2 - 7, w: Math.max(8, w - 6), h: 14 }; }
if(typeof shelterBoxFor === 'function'){
  shelterBoxFor = function(kind, w, h){
    if(kind === 'bee') return hiveRow(w, h);
    return shelterBox(w, h);
  };
}

/* beast() has no bee - at this size one is a striped bead with wings */
function beeBody(x, y, sc){
  sc = sc || 1;
  return `<g>
    <ellipse cx="${n(x)}" cy="${n(y)}" rx="${n(2.2*sc)}" ry="${n(1.5*sc)}" fill="#e8b64a"/>
    <rect x="${n(x-0.9*sc)}" y="${n(y-1.5*sc)}" width="${n(0.8*sc)}" height="${n(3*sc)}" rx="0.3" fill="#3a2c14"/>
    <rect x="${n(x+0.5*sc)}" y="${n(y-1.4*sc)}" width="${n(0.7*sc)}" height="${n(2.8*sc)}" rx="0.3" fill="#3a2c14"/>
    <circle cx="${n(x-2.1*sc)}" cy="${n(y-0.2*sc)}" r="${n(0.9*sc)}" fill="#2b2210"/>
    <ellipse class="beewing" cx="${n(x+0.2*sc)}" cy="${n(y-1.7*sc)}" rx="${n(1.6*sc)}" ry="${n(0.8*sc)}"
      fill="#dceaf2" opacity=".72"/>
  </g>`;
}

/* ---------- where a species wants to be when it is out ---------- */
/* Ducks belong on the water; everything else uses the whole yard. */
function outdoorRegion(m){
  if(m.kind === 'duck') return pondRect(m.w, m.h);
  return { x: 7, y: 7, w: m.w-14, h: m.h-14 };
}

/* ---------- rework the mind model to cover all of them ---------- */
if(typeof chooseAct === 'function'){
  chooseAct = function(m, a, night){
    const wantIn = !!S.shed || (night && !a.bold);
    a.inside = wantIn;
    const pool = (wantIn ? IN_ACTS : OUT_ACTS)[m.kind] || OUT_ACTS.sheep;
    const pick = pool[Math.floor(Math.random()*pool.length)];
    a.act = pick[0]; a.line = pick[1];
    a.until = Date.now() + 4000 + Math.random()*9000;

    if(wantIn){
      const b = m.box;
      a.gx = b.x + 6 + Math.random()*Math.max(2, b.w - 12);
      a.gy = b.y + 6 + Math.random()*Math.max(2, b.h - 12);
      return;
    }
    const r = outdoorRegion(m);
    const others = m.list.filter(o=>o !== a && !o.inside);
    if(others.length && Math.random() < 0.62){
      a.gx = others[Math.floor(Math.random()*others.length)].x + (Math.random()-0.5)*26;
      a.gy = others[Math.floor(Math.random()*others.length)].y + (Math.random()-0.5)*20;
    } else {
      a.gx = r.x + Math.random()*r.w;
      a.gy = r.y + Math.random()*r.h;
    }
    a.gx = Math.max(r.x, Math.min(r.x + r.w, a.gx));
    a.gy = Math.max(r.y, Math.min(r.y + r.h, a.gy));
  };
}

/* bees and hives get their own vocabulary rather than borrowing sheep's */
if(typeof OUT_ACTS === 'object'){
  OUT_ACTS.bee = [['foraging','🐝 bzz'],['on the flowers','*bzz bzz*'],['returning heavy','bzz!'],['fanning the entrance','*bzzzz*']];
  IN_ACTS.bee  = [['on the comb','*bzz*'],['capping honey','bzz…'],['clustered','*hum*'],['tending brood','bzz bzz']];
  OUT_ACTS.duck = [['dabbling','*dabble*'],['upending','*splash*'],['preening on the bank','*preen*'],['paddling','Quack!'],['bathing','*splash splash*']];
  IN_ACTS.duck  = [['on the nest','*settling*'],['at the drinker','*dabble*'],['bedded on straw','💤'],['muttering','*quack…*']];
}

/* the mind loop now walks mindPens(), so ducks, bees and the rabbit
   hutch are all in - this is the seam p53 leaves for exactly this */
if(typeof stockPens === 'function'){
  stockPens = function(){ return mindPens(); };
  penHeadCount = function(o){ return penHead(o); };
}

/* ---------- the clever one needs to look clever ---------- */
/* No filters - drop-shadow is a filter and the scene layer cannot afford
   one per animal. A drawn ring costs a single element. */
function markSmart(g){
  if(g.querySelector('.smartmark')) return;
  const c = document.createElementNS('http://www.w3.org/2000/svg','circle');
  c.setAttribute('class','smartmark');
  c.setAttribute('r','7.5'); c.setAttribute('cx','0'); c.setAttribute('cy','0');
  c.setAttribute('fill','none'); c.setAttribute('stroke','#bfe3ff'); c.setAttribute('stroke-width','1.4');
  const kid = g.firstElementChild;
  /* sit the ring on the animal's own origin */
  const bb = kid && kid.getBBox ? (function(){ try{ return kid.getBBox(); }catch(e){ return null; } })() : null;
  if(bb){ c.setAttribute('cx', n(bb.x + bb.width/2)); c.setAttribute('cy', n(bb.y + bb.height*0.62)); }
  g.insertBefore(c, g.firstChild);
}

/* ---------- 4. stop swallowing errors ---------- */
/* The bare catch in p53 is why a missing speech line went unnoticed.
   Report the first one, then go quiet so a per-frame fault cannot flood
   the console. */
let MIND_ERR = 0;
if(typeof tickPeople === 'function'){
  const _tickPeopleGuard = tickPeople;
  tickPeople = function(dt){
    try{ return _tickPeopleGuard.apply(this, arguments); }
    catch(e){
      if(!MIND_ERR++){
        console.error('[greenhollow] animal tick failed:', e);
        if(typeof log === 'function') log('Something went wrong with the stock. Details in the console.', 'bad', 'farm');
      }
      throw e;
    }
  };
}

(function duckBeeCss(){
  const s = document.createElement('style');
  s.textContent = `
  .smartmark{ opacity:.55; animation: smartRing 2.6s ease-in-out infinite; }
  @keyframes smartRing{ 0%,100%{ opacity:.3; } 50%{ opacity:.7; } }
  @media (prefers-reduced-motion: reduce){ .smartmark{ animation:none; } }
  `;
  document.head.appendChild(s);
})();

G.duckCheck = function(){
  const p = (S.objs||[]).find(o=>BPMAP[o.bp] && BPMAP[o.bp].art==='duck_pond');
  if(!p) return 'no duck pond placed';
  const el = document.querySelector(`.ob[data-id="${p.id}"]`);
  return { ducks: el ? el.querySelectorAll('.pen-animal').length : 0,
           house: el ? el.querySelectorAll('.shed-in').length : 0,
           species: penSpecies(p) };
};
