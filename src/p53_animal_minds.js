/* =====================================================================
   ANIMAL MINDS

   Up to now the stock were decoration that bunched up when it thundered.
   This gives each animal its own small mind: a position it chose, a thing
   it is currently doing, a mood, and the freedom to change all three.

   Four things happen here.

   1. Bubbles stop flying in from the top-left corner. The old bubPop
      keyframe set a CSS `transform`, which overrides the SVG transform
      *attribute* that positions the bubble - so for the first 0.25s of
      every bubble's life it sat at the layer origin. Measured: three
      bubbles with translate(320,344), translate(340,602) and
      translate(541,270) all reported getScreenCTM() = (395,74).

   2. Sheds became real. The old cutaway was drawn into the people layer,
      which paints over the pen, and "inside" was the same bunching class
      as the panic. Now each pen contains an actual shelter with a roof
      you can lift, and a species-correct interior underneath it.

   3. A day cycle. At dusk most of the stock take themselves in; the
      hardy ones stay out. At first light everyone comes out and gets on
      with the ordinary social business of being an animal.

   4. The one that came back. Shoot the craft down and the animal it
      took comes back changed. It thinks, and a few times a day it walks
      the yard with the whole pen strung out behind it in single file,
      and they pick things up from it.
   ===================================================================== */

/* ---------- 1. the bubble fix ---------- */
/* Redefining the keyframe by name beats the original, which is defined
   earlier in the document. `translate:` and `scale:` are separate
   properties and compose with the transform attribute instead of
   replacing it, which is the whole point. */
(function bubbleFix(){
  const s = document.createElement('style');
  s.textContent = `
  .bubble{ transform-box:fill-box; transform-origin:50% 100%; }
  @keyframes bubPop{
    0%  { opacity:0; translate:0 4px; scale:.9; }
    100%{ opacity:1; translate:0 0;   scale:1;  } }
  @media (prefers-reduced-motion: reduce){
    @keyframes bubPop{ 0%{opacity:0;} 100%{opacity:1;} } }
  `;
  document.head.appendChild(s);
})();

/* ---------- 2. where the shelter sits inside a pen ---------- */
/* One rectangle, upper-left of the yard, big enough to hold the stock.
   Everything else - roof, interior, where an animal walks to when it
   goes in - is derived from this, so they cannot drift apart. */
function shelterBox(w, h){
  const sw = Math.max(46, Math.min(w * 0.46, 120));
  const sh = Math.max(38, Math.min(h * 0.52, 96));
  return { x: w*0.07, y: h*0.07, w: sw, h: sh };
}

/* Most species get the same shelter rectangle; a hive is its own
   shelter, so p54 overrides this for bees. */
function shelterBoxFor(kind, w, h){ return shelterBox(w, h); }

/* the deterministic spot an animal stands when it has no other idea.
   paddock() and the mind model both call this, so the drawn position
   and the simulated position are the same number. */
function baseSpot(i, seed, w, h){
  return { x: 8 + hash(i*2.3 + seed) * Math.max(4, w - 16),
           y: 8 + hash(i*5.7 + seed) * Math.max(4, h - 16) };
}

/* ---------- 3. species-correct interiors ---------- */
/* Drawn as a cutaway: you are looking down into the shelter with the
   roof lifted off, so the fittings read from above. Kept deliberately
   sparse - at this size a nest box is a rounded rect with an egg in it,
   and anything finer is only string length. */
function shedFittings(kind, b){
  const X = n(b.x), Y = n(b.y), W = b.w, H = b.h;
  let s = '';
  /* bedding, common to all of them */
  s += `<rect x="${X}" y="${Y}" width="${n(W)}" height="${n(H)}" rx="3" fill="#d8c48b"/>`;
  for(let i=0;i<10;i++){
    const sx = b.x + 3 + hash(i*3.1)*(W-6), sy = b.y + 3 + hash(i*6.7)*(H-6);
    s += `<line x1="${n(sx)}" y1="${n(sy)}" x2="${n(sx+3)}" y2="${n(sy-1.3)}" stroke="#bfa96c" stroke-width=".7"/>`;
  }

  if(kind === 'chicken' || kind === 'duck'){
    /* roost bars over a droppings board, nest boxes along the back wall */
    s += `<rect x="${n(b.x+W*0.06)}" y="${n(b.y+H*0.52)}" width="${n(W*0.52)}" height="${n(H*0.34)}" rx="2" fill="#b9a377"/>`;
    for(let i=0;i<2;i++)
      s += `<rect x="${n(b.x+W*0.08)}" y="${n(b.y+H*0.58+i*H*0.13)}" width="${n(W*0.48)}" height="2.4" rx="1.2" fill="#8a6a42"/>`;
    for(let i=0;i<3;i++){
      const bx = b.x + W*0.64, by = b.y + H*0.12 + i*H*0.26;
      s += `<rect x="${n(bx)}" y="${n(by)}" width="${n(W*0.28)}" height="${n(H*0.2)}" rx="2" fill="#a8814f"/>`;
      s += `<rect x="${n(bx+1.5)}" y="${n(by+1.5)}" width="${n(W*0.28-3)}" height="${n(H*0.2-3)}" rx="1.5" fill="#cbb474"/>`;
      if(i < 2) s += `<ellipse cx="${n(bx+W*0.14)}" cy="${n(by+H*0.11)}" rx="2.6" ry="3.2" fill="#fdf6e6"/>`;
    }
    /* feeder cone and a drinker */
    s += `<circle cx="${n(b.x+W*0.2)}" cy="${n(b.y+H*0.2)}" r="${n(Math.min(W,H)*0.09)}" fill="#9fb0b8"/>`;
    s += `<circle cx="${n(b.x+W*0.2)}" cy="${n(b.y+H*0.2)}" r="${n(Math.min(W,H)*0.05)}" fill="#7d8f98"/>`;
    s += `<circle cx="${n(b.x+W*0.42)}" cy="${n(b.y+H*0.2)}" r="${n(Math.min(W,H)*0.07)}" fill="url(#gWater)"/>`;
    /* dust bath - chickens will not settle without one */
    if(kind === 'chicken')
      s += `<ellipse cx="${n(b.x+W*0.8)}" cy="${n(b.y+H*0.82)}" rx="${n(W*0.13)}" ry="${n(H*0.1)}" fill="#c3a882"/>`;
    else
      s += `<ellipse cx="${n(b.x+W*0.8)}" cy="${n(b.y+H*0.82)}" rx="${n(W*0.14)}" ry="${n(H*0.1)}" fill="url(#gWater)"/>`;
  }

  else if(kind === 'cow'){
    /* free stalls with divider loops, a feed bunk behind a headlock rail */
    for(let i=0;i<3;i++){
      const sy = b.y + H*0.34 + i*H*0.21;
      s += `<rect x="${n(b.x+W*0.06)}" y="${n(sy)}" width="${n(W*0.56)}" height="${n(H*0.17)}" rx="2" fill="#e0cd97"/>`;
      s += `<path d="M${n(b.x+W*0.62)} ${n(sy)} q6 ${n(H*0.085)} 0 ${n(H*0.17)}" fill="none" stroke="#8f9aa2" stroke-width="1.6"/>`;
    }
    s += `<rect x="${n(b.x+W*0.06)}" y="${n(b.y+H*0.08)}" width="${n(W*0.72)}" height="${n(H*0.14)}" rx="2" fill="#9a8a63"/>`;
    s += `<rect x="${n(b.x+W*0.08)}" y="${n(b.y+H*0.1)}" width="${n(W*0.68)}" height="${n(H*0.1)}" rx="1.5" fill="#7f9b46"/>`;
    for(let i=0;i<5;i++)
      s += `<line x1="${n(b.x+W*0.1+i*W*0.16)}" y1="${n(b.y+H*0.06)}" x2="${n(b.x+W*0.1+i*W*0.16)}" y2="${n(b.y+H*0.24)}" stroke="#aeb8bf" stroke-width="1.3"/>`;
    s += `<rect x="${n(b.x+W*0.82)}" y="${n(b.y+H*0.3)}" width="${n(W*0.13)}" height="${n(H*0.2)}" rx="2" fill="url(#gWater)"/>`;
  }

  else if(kind === 'goat'){
    /* goats climb or they wreck the place - two ledges and a hay rack */
    s += `<rect x="${n(b.x+W*0.08)}" y="${n(b.y+H*0.56)}" width="${n(W*0.4)}" height="${n(H*0.1)}" rx="2" fill="#a8814f"/>`;
    s += `<rect x="${n(b.x+W*0.08)}" y="${n(b.y+H*0.54)}" width="${n(W*0.4)}" height="2.4" rx="1.2" fill="#c69a5f"/>`;
    s += `<rect x="${n(b.x+W*0.3)}" y="${n(b.y+H*0.76)}" width="${n(W*0.34)}" height="${n(H*0.09)}" rx="2" fill="#8f6c40"/>`;
    s += `<rect x="${n(b.x+W*0.3)}" y="${n(b.y+H*0.74)}" width="${n(W*0.34)}" height="2.2" rx="1.1" fill="#b08a52"/>`;
    s += `<rect x="${n(b.x+W*0.6)}" y="${n(b.y+H*0.1)}" width="${n(W*0.3)}" height="${n(H*0.18)}" rx="2" fill="#9a8a63"/>`;
    for(let i=0;i<4;i++)
      s += `<line x1="${n(b.x+W*0.63+i*W*0.07)}" y1="${n(b.y+H*0.1)}" x2="${n(b.x+W*0.63+i*W*0.07)}" y2="${n(b.y+H*0.28)}" stroke="#c9b47e" stroke-width="1.2"/>`;
    s += `<rect x="${n(b.x+W*0.1)}" y="${n(b.y+H*0.12)}" width="${n(W*0.14)}" height="${n(H*0.12)}" rx="2" fill="#d4a3a3"/>`;
  }

  else { /* sheep and anything else: ring feeder, hurdles, mineral bucket */
    s += `<circle cx="${n(b.x+W*0.32)}" cy="${n(b.y+H*0.4)}" r="${n(Math.min(W,H)*0.19)}" fill="none" stroke="#9aa4ab" stroke-width="2"/>`;
    s += `<circle cx="${n(b.x+W*0.32)}" cy="${n(b.y+H*0.4)}" r="${n(Math.min(W,H)*0.14)}" fill="#a8913f"/>`;
    for(let i=0;i<2;i++)
      s += `<rect x="${n(b.x+W*0.62)}" y="${n(b.y+H*0.14+i*H*0.34)}" width="${n(W*0.3)}" height="${n(H*0.24)}" rx="2"
              fill="none" stroke="#8a6a42" stroke-width="1.4"/>`;
    s += `<rect x="${n(b.x+W*0.08)}" y="${n(b.y+H*0.78)}" width="${n(W*0.14)}" height="${n(H*0.12)}" rx="2" fill="#6f8fb0"/>`;
  }

  /* a lamp, because it is dim under a roof */
  s += `<circle class="fx-bulb" cx="${n(b.x+W*0.5)}" cy="${n(b.y+H*0.04)}" r="2.6" fill="#ffe9a8"/>`;
  return s;
}

/* the roof that hides all of that when the toggle is off */
function shedRoof(b){
  let s = `<g class="shed-roof">`;
  s += `<rect x="${n(b.x-1.5)}" y="${n(b.y-1.5)}" width="${n(b.w+3)}" height="${n(b.h+3)}" rx="3" fill="url(#gRoof)"/>`;
  /* ridge down the long axis, lit from the upper left */
  const horiz = b.w >= b.h;
  if(horiz){
    s += `<rect x="${n(b.x-1.5)}" y="${n(b.y-1.5)}" width="${n(b.w+3)}" height="${n(b.h*0.5)}" rx="3" fill="#ffffff" opacity=".1"/>`;
    s += `<line x1="${n(b.x-1)}" y1="${n(b.y+b.h*0.5)}" x2="${n(b.x+b.w+1)}" y2="${n(b.y+b.h*0.5)}" stroke="#2f3a42" stroke-width="1.2" opacity=".55"/>`;
    for(let i=1;i<Math.round(b.w/9);i++)
      s += `<line x1="${n(b.x+i*9)}" y1="${n(b.y-1)}" x2="${n(b.x+i*9)}" y2="${n(b.y+b.h+1)}" stroke="#000" stroke-width=".5" opacity=".14"/>`;
  } else {
    s += `<rect x="${n(b.x-1.5)}" y="${n(b.y-1.5)}" width="${n(b.w*0.5)}" height="${n(b.h+3)}" rx="3" fill="#ffffff" opacity=".1"/>`;
    s += `<line x1="${n(b.x+b.w*0.5)}" y1="${n(b.y-1)}" x2="${n(b.x+b.w*0.5)}" y2="${n(b.y+b.h+1)}" stroke="#2f3a42" stroke-width="1.2" opacity=".55"/>`;
    for(let i=1;i<Math.round(b.h/9);i++)
      s += `<line x1="${n(b.x-1)}" y1="${n(b.y+i*9)}" x2="${n(b.x+b.w+1)}" y2="${n(b.y+i*9)}" stroke="#000" stroke-width=".5" opacity=".14"/>`;
  }
  /* eave shadow on the ground, down and right */
  s += `<rect x="${n(b.x+1)}" y="${n(b.y+b.h+1.5)}" width="${n(b.w+2)}" height="2.6" rx="1.3" fill="#16240c" opacity=".22"/>`;
  s += `</g>`;
  return s;
}

/* ---------- 4. the pen, rebuilt once more ---------- */
/* p51 rebuilt this to give every animal a handle. It now also carries a
   shelter, and each animal gets an index so the mind model can find it. */
if(typeof paddock === 'function'){
  paddock = function(w, h, kind, cnt, seed, sc){
    const b = shelterBox(w, h);
    let s = patch(w,h,'#84ad57',seed,1);
    s += `<rect x="1.5" y="1.5" width="${n(w-3)}" height="${n(h-3)}" rx="2.5" fill="none" stroke="#00000033" stroke-width="2.6"/>`;
    s += `<rect x="1.5" y="1.5" width="${n(w-3)}" height="${n(h-3)}" rx="2.5" fill="none" stroke="#a8814f" stroke-width="1.3"/>`;
    for(let x=2;x<w-2;x+=11){ s += `<rect x="${n(x-1)}" y="0" width="2" height="4" rx="1" fill="#7d5931"/>`;
                              s += `<rect x="${n(x-1)}" y="${n(h-4)}" width="2" height="4" rx="1" fill="#7d5931"/>`; }
    for(let y=2;y<h-2;y+=11){ s += `<rect x="0" y="${n(y-1)}" width="4" height="2" rx="1" fill="#7d5931"/>`;
                              s += `<rect x="${n(w-4)}" y="${n(y-1)}" width="4" height="2" rx="1" fill="#7d5931"/>`; }

    /* the interior sits under the animals, inside the same group, which
       is the whole reason the old cutaway looked wrong */
    s += `<g class="shed-in">${shedFittings(kind, b)}</g>`;

    const cx = w/2, cy = h/2;
    for(let i=0;i<cnt;i++){
      const p = baseSpot(i, seed, w, h);
      const dx = (cx - p.x) * 0.82, dy = (cy - p.y) * 0.82;
      /* a3/a3-graze keep the breathing and head-dip from p49 working now
         that every species goes through here */
      s += `<g class="pen-animal a3 a3-graze" data-ai="${i}" style="--hx:${n(dx)}px; --hy:${n(dy)}px;
        animation-delay:-${(hash(i*7.1+seed)*3).toFixed(1)}s">${beast(kind, p.x, p.y, sc||1)}</g>`;
    }
    /* roof last so it covers the stock that went inside */
    s += shedRoof(b);
    return s;
  };
}

/* ---------- 5. the minds ---------- */
/* Runtime only. Persisting a position per animal per frame would bloat
   the save for something nobody would notice being restored. What does
   persist is the part that matters: which animal came back clever, and
   what the pen has learned from it. */
const MINDS = new Map();

const OUT_ACTS = {
  chicken:[['pecking','*peck peck*'],['scratching','*scratch*'],['dust-bathing','*fluff*'],['preening','*preen*']],
  duck:   [['dabbling','*dabble*'],['preening','*preen*'],['paddling','Quack!'],['resting','…']],
  sheep:  [['grazing','*munch*'],['chewing cud','…'],['following','Baa?'],['resting','*flop*']],
  goat:   [['browsing','*nibble*'],['climbing','Meh!'],['head-butting','*bonk*'],['investigating','Meh?']],
  cow:    [['grazing','*munch*'],['chewing cud','…'],['at the water','*slurp*'],['lying up','Moo…']],
  rabbit: [['nibbling','*nibble*'],['binkying','*hop!*'],['washing','*wash*'],['flopped','…']],
  bee:    [['foraging','bzz'],['dancing','bzz bzz']],
};
const IN_ACTS = {
  chicken:[['on the perch','*settling*'],['in the nest box','*bok*'],['at the feeder','*peck*'],['roosting','💤']],
  duck:   [['on the bedding','*shuffle*'],['at the water','*dabble*'],['tucked in','💤']],
  sheep:  [['at the ring feeder','*munch*'],['bedded down','💤'],['chewing cud','…']],
  goat:   [['on the ledge','Meh!'],['at the hay rack','*pull*'],['at the mineral lick','*lick*'],['bedded down','💤']],
  cow:    [['in the stall','*settling*'],['at the feed bunk','*munch*'],['at the trough','*slurp*'],['lying up','💤']],
  rabbit: [['in the hide','…'],['at the hay','*nibble*'],['flopped out','💤']],
  bee:    [['in the hive','bzz']],
};
/* what the clever one says, and what the rest come out with once they
   have been following it around for a while */
const SMART_LINES = [
  '💭 The gate opens inward.','💭 Rain comes from that side.','💭 They feed us at the same hour.',
  '💭 If I stand here, they see me.','💭 The trough fills when the wheel turns.','💭 Follow me.',
  '💭 There is more grass past the fence.','💭 I remember yesterday.',
];
const FOLLOW_LINES = ['*in line*','…where?','*trots after*','*keeping up*','*watching him*','…','*shuffle*','*follows*'];
const LEARNED_LINES = ['…the gate?','*watching*','*copies him*','Oh!','*thinking*','…same hour.'];

/* Which pens the mind model walks, and how many head are in one.
   Both are overridden in p54 so ducks, bees and the charm-only rabbit
   hutch join in without widening animalPens(), which the economy uses
   to decide who eats. */
function stockPens(){ return animalPens().filter(o=>(o.animals||0) > 0); }
function penHeadCount(o){ return o.animals || 0; }

function mindFor(o){
  const bp = BPMAP[o.bp], f = footprint(bp, o.rot);
  const w = f.w*T, h = f.h*T;
  const cnt = penHeadCount(o);
  let m = MINDS.get(o.id);
  if(m && m.cnt === cnt && m.w === w) return m;
  const kind = penSpecies(o);
  m = { id:o.id, cnt, w, h, kind, box:shelterBoxFor(kind, w, h), list:[], trail:[], proc:null, nextProc:0 };
  for(let i=0;i<cnt;i++){
    const p = baseSpot(i, o.id*3.7, w, h);
    m.list.push({ i, bx:p.x, by:p.y, x:p.x, y:p.y, gx:p.x, gy:p.y,
                  act:'', until:0, inside:false, smart:false,
                  bold: hash(i*11.3 + o.id) > 0.72 });   /* the ones that stay out */
  }
  /* restore the clever one after a reload */
  const sm = (S.smartAnimals||[]).find(a=>a.pen === o.id);
  if(sm && m.list[sm.i]) m.list[sm.i].smart = true;
  MINDS.set(o.id, m);
  return m;
}

/* pick somewhere to be, and something to be doing there */
function chooseAct(m, a, night){
  const inShed = !!S.shed;
  const wantIn = inShed || (night && !a.bold);
  a.inside = wantIn;
  const pool = (wantIn ? IN_ACTS : OUT_ACTS)[m.kind] || OUT_ACTS.sheep;
  const pick = pool[Math.floor(Math.random()*pool.length)];
  a.act = pick[0]; a.line = pick[1];
  a.until = Date.now() + 4000 + Math.random()*9000;

  if(wantIn){
    const b = m.box;
    a.gx = b.x + 6 + Math.random()*(b.w - 12);
    a.gy = b.y + 6 + Math.random()*(b.h - 12);
  } else {
    /* social: two thirds of the time head roughly toward somebody else,
       which is what makes a paddock look like a flock rather than a grid */
    const others = m.list.filter(o=>o !== a && !o.inside);
    if(others.length && Math.random() < 0.62){
      const t = others[Math.floor(Math.random()*others.length)];
      a.gx = t.x + (Math.random()-0.5)*26;
      a.gy = t.y + (Math.random()-0.5)*20;
    } else {
      a.gx = a.bx + (Math.random()-0.5)*m.w*0.5;
      a.gy = a.by + (Math.random()-0.5)*m.h*0.5;
    }
  }
  a.gx = Math.max(7, Math.min(m.w-7, a.gx));
  a.gy = Math.max(7, Math.min(m.h-7, a.gy));
}

/* the procession: the clever one walks, everyone strings out behind it */
function startProcession(m){
  const lead = m.list.find(a=>a.smart);
  if(!lead || m.list.length < 2) return;
  m.proc = { until: Date.now() + 22000, leg: 0 };
  m.trail = [];
  lead.inside = false;
  m.list.forEach(a=>{ a.inside = false; });
  const o = S.objs.find(x=>x.id === m.id);
  if(o && typeof speak === 'function'){
    const c = penCentre(o);
    speak({x:c.x, y:c.y}, '💭 Follow me.');
  }
  if(typeof log === 'function')
    log(`${smartName(m.id)} set off across the pen, and the others fell in behind.`, 'gold', 'farm');
}

function smartName(penId){
  const sm = (S.smartAnimals||[]).find(a=>a.pen === penId);
  return sm && sm.name ? sm.name : 'The clever one';
}

function stepProcession(m, dt){
  const lead = m.list.find(a=>a.smart);
  if(!lead){ m.proc = null; return; }
  /* leader walks a slow circuit of the yard */
  const p = m.proc;
  p.leg += dt * 0.22;
  const rx = m.w*0.32, ry = m.h*0.3;
  lead.gx = m.w*0.5 + Math.cos(p.leg)*rx;
  lead.gy = m.h*0.5 + Math.sin(p.leg)*ry;
  lead.act = 'leading'; lead.inside = false; lead.line = '💭 This way.';

  /* record where the leader has been; each follower aims at an older
     point on that trail, which is what puts them in single file */
  m.trail.unshift({x:lead.x, y:lead.y});
  if(m.trail.length > 160) m.trail.length = 160;
  const others = m.list.filter(a=>!a.smart);
  others.forEach((a, k)=>{
    const t = m.trail[Math.min(m.trail.length-1, 10 + k*9)];
    if(t){ a.gx = t.x; a.gy = t.y; }
    a.act = 'following'; a.inside = false;
    a.line = FOLLOW_LINES[a.i % FOLLOW_LINES.length];
  });

  if(Date.now() > p.until){
    m.proc = null; m.trail = [];
    S.penLearned = S.penLearned || {};
    S.penLearned[m.id] = (S.penLearned[m.id] || 0) + 1;
    const lv = S.penLearned[m.id];
    if(typeof log === 'function')
      log(`The pen has now followed ${smartName(m.id)} ${lv} time${lv===1?'':'s'}. They are picking things up.`, 'good', 'farm');
    m.list.forEach(a=>{ a.until = 0; });
  }
}

/* ---------- 6. the tick ---------- */
let MIND_T = 0, MIND_SAY = 0;

function tickMinds(dt){
  if(!S || S.speed === 0) return;
  if(S.animalPanic) return;                 /* panic owns them while it lasts */
  MIND_T += dt;
  if(MIND_T < 0.1) return;
  const step = MIND_T; MIND_T = 0;

  const night = (typeof isNight === 'function') ? isNight() : false;
  const pens = stockPens();
  const now = Date.now();

  pens.forEach(o=>{
    const m = mindFor(o);
    const el = document.querySelector(`.ob[data-id="${o.id}"]`);
    if(!el) return;

    /* the clever one's rounds, a few times a day */
    if(m.list.some(a=>a.smart)){
      if(!m.proc && now > m.nextProc){
        m.nextProc = now + 90000 + Math.random()*90000;
        if(!night) startProcession(m);
      }
      if(m.proc) stepProcession(m, step);
    }

    m.list.forEach(a=>{
      if(!m.proc && now > a.until) chooseAct(m, a, night);
      /* ease toward the goal - slow, because stock amble */
      const sp = (m.proc ? 15 : 7) * step;
      const dx = a.gx - a.x, dy = a.gy - a.y;
      const d = Math.hypot(dx, dy) || 1;
      if(d > 1){ a.x += dx/d * Math.min(sp, d); a.y += dy/d * Math.min(sp, d); }

      const g = el.querySelector(`.pen-animal[data-ai="${a.i}"]`);
      if(!g) return;
      g.style.translate = `${n(a.x - a.bx)}px ${n(a.y - a.by)}px`;
      /* facing */
      const kid = g.firstElementChild;
      if(kid && Math.abs(dx) > 2) g.style.setProperty('--face', dx < 0 ? '-1' : '1');
      g.classList.toggle('a-inside', a.inside);
      g.classList.toggle('a-smart', !!a.smart);
      if(a.smart && typeof markSmart === 'function') markSmart(g);
      g.classList.toggle('a-moving', d > 2);
    });

    /* the roof class is applied in p55, outside the panic guard */
  });

  /* somebody says something every so often */
  MIND_SAY -= step;
  if(MIND_SAY > 0 || !pens.length) return;
  MIND_SAY = 3.5 + Math.random()*5;
  const o = pens[Math.floor(Math.random()*pens.length)];
  const m = mindFor(o);
  const talkers = m.list.filter(a=>a.act);
  if(!talkers.length) return;
  const a = talkers[Math.floor(Math.random()*talkers.length)];
  /* a bubble over the animal itself, not the middle of the pen */
  const f = footprint(BPMAP[o.bp], o.rot);
  const world = { x: o.tx*T + a.x, y: o.ty*T + a.y };
  let line = a.line || '…';
  if(a.smart) line = SMART_LINES[Math.floor(Math.random()*SMART_LINES.length)];
  else if((S.penLearned && S.penLearned[o.id] || 0) > 0 && Math.random() < 0.35)
    line = LEARNED_LINES[Math.floor(Math.random()*LEARNED_LINES.length)];
  if(typeof speak === 'function') speak(world, line);
  if(a.smart && typeof SND !== 'undefined') SND.play('collect');
}

/* the day turning over is worth a line in the log */
let LAST_NIGHT = null;
function tickAnimalDay(){
  if(!S || S.speed === 0) return;
  const night = (typeof isNight === 'function') ? isNight() : false;
  if(LAST_NIGHT === null){ LAST_NIGHT = night; return; }
  if(night === LAST_NIGHT) return;
  LAST_NIGHT = night;
  const pens = stockPens();
  if(!pens.length) return;
  MINDS.forEach(m=>m.list.forEach(a=>{ a.until = 0; }));
  if(typeof log === 'function'){
    if(night) log('The stock have taken themselves in for the night. A few of the hardy ones stayed out.', '', 'farm');
    else      log('First light - everyone is out again.', 'good', 'farm');
  }
}

const _tickPeopleMinds = tickPeople;
tickPeople = function(dt){
  const r = _tickPeopleMinds.apply(this, arguments);
  try{ tickMinds(dt); tickAnimalDay(); }catch(e){}
  return r;
};

/* ---------- 7. the one that came back ---------- */
/* shootUfo already hands back two head. This marks one animal in the pen
   it was taken from as the one that changed, which is what the whole
   procession hangs off. */
const SMART_NAMES = ['Ada','Pilot','Comet','Halo','Nine','Beacon'];
if(typeof G !== 'undefined' && typeof G.shootUfo === 'function'){
  const _shootSmart = G.shootUfo;
  G.shootUfo = function(){
    const u = S.ufo;
    const penId = u && (u.target !== undefined ? u.target : null);
    const hpWas = u ? u.hp : 0;
    const r = _shootSmart.apply(this, arguments);
    if(hpWas <= 1 && penId !== null){         /* that shot was the one that downed it */
      const o = S.objs.find(x=>x.id === penId);
      if(o && (o.animals||0) > 0){
        S.smartAnimals = S.smartAnimals || [];
        if(!S.smartAnimals.some(a=>a.pen === penId)){
          const name = SMART_NAMES[Math.floor(Math.random()*SMART_NAMES.length)];
          S.smartAnimals.push({ pen:penId, i:0, name });
          MINDS.delete(penId);
          if(typeof log === 'function')
            log(`The one it took came back different. ${name} watches the gate now, and works things out. The others have started watching ${name}.`, 'gold', 'farm');
          if(typeof toast === 'function') toast(`${name} came back clever`, 'gold');
        }
      }
    }
    return r;
  };
}

/* Whatever they were in the middle of, a storm ending outranks it -
   otherwise they carry on grazing for up to another ten seconds while
   the shed sits open, which reads as them ignoring it. */
function interruptMinds(){ MINDS.forEach(m=>{ m.proc = null; m.list.forEach(a=>{ a.until = 0; }); }); }
if(typeof startShed === 'function'){
  const _startShedMinds = startShed;
  startShed = function(){ const r = _startShedMinds.apply(this, arguments); interruptMinds(); return r; };
}

/* ---------- 8. the shed window now just forces everyone in ---------- */
/* The old cutaway drew into the people layer over the top of the pen.
   The pen draws its own interior now, so that can go. */
if(typeof shedInteriors === 'function'){
  shedInteriors = function(){ return ''; };
}

/* ---------- 9. styling ---------- */
(function mindCss(){
  const s = document.createElement('style');
  s.textContent = `
  /* movement is the individual translate property so it composes with
     the panic/shed transform instead of fighting it */
  .pen-animal{ transition: translate 1.1s linear, transform 1.1s cubic-bezier(.2,.8,.3,1); }
  .pen-animal.a-moving > *{ animation: aBob .7s ease-in-out infinite; }
  @keyframes aBob{ 0%,100%{ transform:translateY(0);} 50%{ transform:translateY(-1.1px);} }

  /* the roof, and what it hides */
  .shed-in{ opacity:0; transition:opacity .25s; }
  .ob.roof-off .shed-in{ opacity:1; }
  .ob.roof-off .shed-roof{ opacity:0; }
  .shed-roof{ transition:opacity .25s; }
  .pen-animal.a-inside{ opacity:0; transition:opacity .35s; }
  .ob.roof-off .pen-animal.a-inside{ opacity:1; }


  @media (prefers-reduced-motion: reduce){
    .pen-animal{ transition:none; }
    .pen-animal.a-moving > *{ animation:none; } }
  `;
  document.head.appendChild(s);
})();

/* ---------- 10. handles for trying it without waiting ---------- */
G.animalsIn   = function(){ S.shed = { until: Date.now()+150000, said:0 }; interruptMinds(); render(); };
G.animalsOut  = function(){ S.shed = null; interruptMinds(); render(); };
G.makeSmart   = function(penId){
  const pens = animalPens().filter(o=>(o.animals||0)>0);
  const o = penId ? S.objs.find(x=>x.id===penId) : pens[0];
  if(!o) return 'no pen';
  S.smartAnimals = S.smartAnimals || [];
  if(!S.smartAnimals.some(a=>a.pen===o.id))
    S.smartAnimals.push({pen:o.id, i:0, name:SMART_NAMES[Math.floor(Math.random()*SMART_NAMES.length)]});
  MINDS.delete(o.id);
  return smartName(o.id) + ' in pen ' + o.id;
};
G.parade = function(penId){
  const pens = animalPens().filter(o=>(o.animals||0)>0);
  const o = penId ? S.objs.find(x=>x.id===penId) : pens[0];
  if(!o) return 'no pen';
  const m = mindFor(o);
  if(!m.list.some(a=>a.smart)) return 'no clever animal in that pen - call G.makeSmart() first';
  startProcession(m);
  return 'off they go';
};
