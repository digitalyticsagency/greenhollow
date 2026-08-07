/* =====================================================================
   ANIMALS REBUILT IN THE 3D TOY STYLE

   The reference images share a very specific language: a big soft
   rounded body, short stubby legs, an oversized head with large glossy
   eyes and a highlight, a soft rim of light down one side, and a single
   contact shadow. Everything reads as moulded plastic rather than drawn.

   These are built from that vocabulary rather than the flat shapes that
   were there before, and a cow is added because the reference asked for
   one and the barn had none.

   They also move: a slow breathing rise and fall, ears that twitch, a
   head that dips to graze. Sheep and goats settle near each other at
   night because flock animals genuinely do, and a shed holding more than
   one kind gets its species separated - which is what a real farmer does,
   because mixing stock in one pen causes bullying at the feeder.
   ===================================================================== */

/* ---------- the shared toy-3D vocabulary ---------- */

/* a body: base colour, a lit crown, a shaded belly and a soft rim */
function toyBody(cx, cy, rx, ry, base, lit, shade){
  let s = `<ellipse cx="${n(cx)}" cy="${n(cy)}" rx="${n(rx)}" ry="${n(ry)}" fill="${base}"/>`;
  s += `<ellipse cx="${n(cx - rx*0.18)}" cy="${n(cy - ry*0.28)}" rx="${n(rx*0.74)}" ry="${n(ry*0.62)}"
    fill="${lit}" opacity=".85"/>`;
  s += `<ellipse cx="${n(cx + rx*0.16)}" cy="${n(cy + ry*0.34)}" rx="${n(rx*0.66)}" ry="${n(ry*0.44)}"
    fill="${shade}" opacity=".38"/>`;
  return s;
}

/* the eye that makes these read as toys: dark bead, bright catchlight */
function toyEye(cx, cy, r){
  return `<ellipse cx="${n(cx)}" cy="${n(cy)}" rx="${n(r*1.05)}" ry="${n(r*1.15)}" fill="#ffffff"/>`
       + `<circle cx="${n(cx)}" cy="${n(cy + r*0.08)}" r="${n(r*0.68)}" fill="#2b2118"/>`
       + `<circle cx="${n(cx - r*0.24)}" cy="${n(cy - r*0.30)}" r="${n(r*0.26)}" fill="#ffffff"/>`;
}

/* short stubby leg with a dark hoof */
function toyLeg(x, y, w, h, col, hoof){
  return `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" rx="${n(w*0.5)}" fill="${col}"/>`
       + `<rect x="${n(x)}" y="${n(y + h*0.55)}" width="${n(w)}" height="${n(h*0.45)}" rx="${n(w*0.5)}"
          fill="${hoof || '#4a3f36'}"/>`;
}

/* the fleece rim that makes a sheep a sheep */
function fleeceRim(cx, cy, rx, ry, col, n0, seed){
  let s = '';
  for(let i=0;i<n0;i++){
    const a = (i/n0)*Math.PI*2;
    s += `<circle cx="${n(cx + Math.cos(a)*rx*0.92)}" cy="${n(cy + Math.sin(a)*ry*0.92)}"
      r="${n(rx*(0.20 + hash(i*3.1+seed)*0.07))}" fill="${col}"/>`;
  }
  return s;
}

/* ---------- the animals ---------- */

function beast3d(kind, x, y, sc, idle){
  sc = sc || 1;
  const S0 = sc * 1.15;
  /* one soft contact shadow, as in every reference */
  let s = `<ellipse cx="${n(x + 0.6*S0)}" cy="${n(y + 3.4*S0)}" rx="${n(5.4*S0)}" ry="${n(1.9*S0)}"
    fill="#16240c" opacity=".26"/>`;
  s += `<g class="a3-body">`;

  if(kind === 'sheep'){
    s += toyLeg(x-2.6*S0, y+1.4*S0, 1.5*S0, 2.6*S0, '#cfc6bb');
    s += toyLeg(x+1.4*S0, y+1.4*S0, 1.5*S0, 2.6*S0, '#cfc6bb');
    s += fleeceRim(x, y, 4.4*S0, 3.5*S0, '#f4f1ea', 11, 1);
    s += toyBody(x, y, 4.2*S0, 3.3*S0, '#faf8f3', '#ffffff', '#cfc6bb');
    /* head, set forward and slightly up */
    s += `<g class="a3-head">`;
    s += `<ellipse cx="${n(x+2.9*S0)}" cy="${n(y-1.7*S0)}" rx="${n(2.5*S0)}" ry="${n(2.2*S0)}" fill="#e9e4da"/>`;
    s += `<ellipse cx="${n(x+2.7*S0)}" cy="${n(y-2.3*S0)}" rx="${n(1.9*S0)}" ry="${n(1.4*S0)}" fill="#f6f3ec"/>`;
    /* the woolly fringe */
    for(let i=0;i<4;i++)
      s += `<circle cx="${n(x + (1.9+i*0.5)*S0)}" cy="${n(y - (3.1+ (i%2)*0.3)*S0)}" r="${n(0.9*S0)}" fill="#faf8f3"/>`;
    s += `<g class="a3-ear-l"><ellipse cx="${n(x+1.0*S0)}" cy="${n(y-2.1*S0)}" rx="${n(1.5*S0)}" ry="${n(0.75*S0)}"
      fill="#ded7cb" transform="rotate(-18 ${n(x+1.0*S0)} ${n(y-2.1*S0)})"/>
      <ellipse cx="${n(x+1.1*S0)}" cy="${n(y-2.1*S0)}" rx="${n(0.9*S0)}" ry="${n(0.38*S0)}"
      fill="#e6a6ae" transform="rotate(-18 ${n(x+1.1*S0)} ${n(y-2.1*S0)})"/></g>`;
    s += `<g class="a3-ear-r"><ellipse cx="${n(x+4.6*S0)}" cy="${n(y-2.0*S0)}" rx="${n(1.5*S0)}" ry="${n(0.75*S0)}"
      fill="#ded7cb" transform="rotate(16 ${n(x+4.6*S0)} ${n(y-2.0*S0)})"/>
      <ellipse cx="${n(x+4.5*S0)}" cy="${n(y-2.0*S0)}" rx="${n(0.9*S0)}" ry="${n(0.38*S0)}"
      fill="#e6a6ae" transform="rotate(16 ${n(x+4.5*S0)} ${n(y-2.0*S0)})"/></g>`;
    s += toyEye(x+2.1*S0, y-1.7*S0, 0.62*S0);
    s += toyEye(x+3.6*S0, y-1.7*S0, 0.62*S0);
    s += `<ellipse cx="${n(x+2.9*S0)}" cy="${n(y-0.75*S0)}" rx="${n(0.62*S0)}" ry="${n(0.42*S0)}" fill="#e79aa6"/>`;
    s += `</g>`;

  } else if(kind === 'chicken'){
    s += toyLeg(x-1.2*S0, y+1.8*S0, 0.7*S0, 1.8*S0, '#f0a93c', '#e08b1e');
    s += toyLeg(x+0.7*S0, y+1.8*S0, 0.7*S0, 1.8*S0, '#f0a93c', '#e08b1e');
    s += toyBody(x, y, 3.4*S0, 3.0*S0, '#fbfaf7', '#ffffff', '#ddd6cb');
    /* the tail fan */
    s += `<ellipse cx="${n(x-3.0*S0)}" cy="${n(y-1.2*S0)}" rx="${n(1.9*S0)}" ry="${n(1.3*S0)}"
      fill="#f2efe8" transform="rotate(-28 ${n(x-3.0*S0)} ${n(y-1.2*S0)})"/>`;
    s += `<g class="a3-head">`;
    s += `<circle cx="${n(x+2.2*S0)}" cy="${n(y-2.2*S0)}" r="${n(1.9*S0)}" fill="#fdfcfa"/>`;
    /* comb and wattle */
    for(let i=0;i<3;i++)
      s += `<circle cx="${n(x + (1.5+i*0.7)*S0)}" cy="${n(y - (3.9 - (i===1?0.4:0))*S0)}" r="${n(0.68*S0)}" fill="#e2402f"/>`;
    s += `<ellipse cx="${n(x+2.0*S0)}" cy="${n(y-0.7*S0)}" rx="${n(0.5*S0)}" ry="${n(0.8*S0)}" fill="#e2402f"/>`;
    s += `<path d="M${n(x+3.6*S0)} ${n(y-2.2*S0)} l ${n(1.7*S0)} ${n(0.6*S0)} l ${n(-1.7*S0)} ${n(0.7*S0)} z"
      fill="#f0a93c"/>`;
    s += toyEye(x+2.6*S0, y-2.5*S0, 0.5*S0);
    s += `</g>`;

  } else if(kind === 'goat'){
    s += toyLeg(x-2.4*S0, y+1.5*S0, 1.3*S0, 2.5*S0, '#e8e3d8');
    s += toyLeg(x+1.3*S0, y+1.5*S0, 1.3*S0, 2.5*S0, '#e8e3d8');
    s += toyBody(x, y, 4.0*S0, 2.9*S0, '#f5f2ea', '#fdfcf8', '#d8d0c2');
    s += `<g class="a3-head">`;
    s += `<ellipse cx="${n(x+2.8*S0)}" cy="${n(y-1.5*S0)}" rx="${n(2.3*S0)}" ry="${n(2.0*S0)}" fill="#f2efe7"/>`;
    s += `<ellipse cx="${n(x+2.6*S0)}" cy="${n(y-2.0*S0)}" rx="${n(1.7*S0)}" ry="${n(1.2*S0)}" fill="#faf8f2"/>`;
    /* Horns swept BACK over the skull, tapering. Curving them up and
       forward read as a floating wire loop rather than a goat. */
    [[-0.55, -0.20],[0.35, 0.16]].forEach(o=>{
      const hx = x + (3.0 + o[0])*S0, hy = y - 3.0*S0;
      s += `<path d="M${n(hx)} ${n(hy)}
        q ${n((-1.5 + o[1]*2)*S0)} ${n(-1.4*S0)} ${n((-2.4 + o[1]*3)*S0)} ${n(-0.7*S0)}"
        stroke="#8b8175" stroke-width="${n(0.55*S0)}" fill="none" stroke-linecap="round"/>`;
      s += `<circle cx="${n(hx)}" cy="${n(hy)}" r="${n(0.34*S0)}" fill="#8b8175"/>`;
    });
    s += `<g class="a3-ear-l"><ellipse cx="${n(x+1.1*S0)}" cy="${n(y-1.9*S0)}" rx="${n(1.3*S0)}" ry="${n(0.62*S0)}"
      fill="#e4ded1" transform="rotate(-24 ${n(x+1.1*S0)} ${n(y-1.9*S0)})"/></g>`;
    s += `<g class="a3-ear-r"><ellipse cx="${n(x+4.4*S0)}" cy="${n(y-1.8*S0)}" rx="${n(1.3*S0)}" ry="${n(0.62*S0)}"
      fill="#e4ded1" transform="rotate(22 ${n(x+4.4*S0)} ${n(y-1.8*S0)})"/></g>`;
    s += toyEye(x+2.1*S0, y-1.6*S0, 0.58*S0);
    s += toyEye(x+3.5*S0, y-1.6*S0, 0.58*S0);
    /* the beard and the bell */
    s += `<path d="M${n(x+2.8*S0)} ${n(y+0.1*S0)} q ${n(0.3*S0)} ${n(1.2*S0)} ${n(-0.2*S0)} ${n(1.7*S0)}"
      stroke="#efeade" stroke-width="${n(0.6*S0)}" fill="none" stroke-linecap="round"/>`;
    s += `<circle cx="${n(x+2.6*S0)}" cy="${n(y+0.6*S0)}" r="${n(0.62*S0)}" fill="#e0b23c"/>`;
    s += `</g>`;

  } else if(kind === 'cow'){
    s += toyLeg(x-3.0*S0, y+1.6*S0, 1.6*S0, 2.7*S0, '#f7f5f1', '#2f2a26');
    s += toyLeg(x+1.6*S0, y+1.6*S0, 1.6*S0, 2.7*S0, '#f7f5f1', '#2f2a26');
    s += toyBody(x, y, 5.0*S0, 3.4*S0, '#fbfaf8', '#ffffff', '#d6d0c8');
    /* the patches, kept few and large the way the reference has them */
    s += `<ellipse cx="${n(x-1.9*S0)}" cy="${n(y+0.5*S0)}" rx="${n(1.7*S0)}" ry="${n(1.3*S0)}" fill="#2f2a26"/>`;
    s += `<ellipse cx="${n(x+1.5*S0)}" cy="${n(y+1.2*S0)}" rx="${n(1.2*S0)}" ry="${n(0.9*S0)}" fill="#2f2a26"/>`;
    s += `<g class="a3-head">`;
    s += `<ellipse cx="${n(x+3.6*S0)}" cy="${n(y-1.9*S0)}" rx="${n(2.7*S0)}" ry="${n(2.3*S0)}" fill="#fbfaf8"/>`;
    /* the black cap over the eyes */
    s += `<path d="M${n(x+1.9*S0)} ${n(y-2.6*S0)} q ${n(1.7*S0)} ${n(-1.9*S0)} ${n(3.4*S0)} ${n(0)}
      q ${n(-1.7*S0)} ${n(1.0*S0)} ${n(-3.4*S0)} ${n(0)} z" fill="#2f2a26"/>`;
    /* horns and ears */
    s += `<ellipse cx="${n(x+2.4*S0)}" cy="${n(y-4.0*S0)}" rx="${n(0.62*S0)}" ry="${n(0.95*S0)}" fill="#f0e6cf"
      transform="rotate(-24 ${n(x+2.4*S0)} ${n(y-4.0*S0)})"/>`;
    s += `<ellipse cx="${n(x+4.7*S0)}" cy="${n(y-4.0*S0)}" rx="${n(0.62*S0)}" ry="${n(0.95*S0)}" fill="#f0e6cf"
      transform="rotate(24 ${n(x+4.7*S0)} ${n(y-4.0*S0)})"/>`;
    s += `<g class="a3-ear-l"><ellipse cx="${n(x+1.4*S0)}" cy="${n(y-2.4*S0)}" rx="${n(1.4*S0)}" ry="${n(0.72*S0)}"
      fill="#2f2a26" transform="rotate(-20 ${n(x+1.4*S0)} ${n(y-2.4*S0)})"/></g>`;
    s += `<g class="a3-ear-r"><ellipse cx="${n(x+5.7*S0)}" cy="${n(y-2.3*S0)}" rx="${n(1.4*S0)}" ry="${n(0.72*S0)}"
      fill="#2f2a26" transform="rotate(20 ${n(x+5.7*S0)} ${n(y-2.3*S0)})"/></g>`;
    s += toyEye(x+2.8*S0, y-2.0*S0, 0.62*S0);
    s += toyEye(x+4.5*S0, y-2.0*S0, 0.62*S0);
    /* the big soft muzzle */
    s += `<ellipse cx="${n(x+3.7*S0)}" cy="${n(y-0.4*S0)}" rx="${n(1.8*S0)}" ry="${n(1.3*S0)}" fill="#f2b3b8"/>`;
    s += `<ellipse cx="${n(x+3.1*S0)}" cy="${n(y-0.6*S0)}" rx="${n(0.28*S0)}" ry="${n(0.36*S0)}" fill="#c98d95"/>`;
    s += `<ellipse cx="${n(x+4.3*S0)}" cy="${n(y-0.6*S0)}" rx="${n(0.28*S0)}" ry="${n(0.36*S0)}" fill="#c98d95"/>`;
    s += `</g>`;

  } else if(kind === 'rabbit'){
    s += toyBody(x, y, 3.0*S0, 2.8*S0, '#e0ac78', '#f0c79a', '#c98f5e');
    s += `<circle cx="${n(x-2.6*S0)}" cy="${n(y+1.4*S0)}" r="${n(1.2*S0)}" fill="#fdfaf5"/>`;
    s += `<g class="a3-head">`;
    s += `<circle cx="${n(x+1.6*S0)}" cy="${n(y-1.9*S0)}" r="${n(2.0*S0)}" fill="#e6b684"/>`;
    s += `<g class="a3-ear-l"><ellipse cx="${n(x+0.6*S0)}" cy="${n(y-4.6*S0)}" rx="${n(0.72*S0)}" ry="${n(2.2*S0)}"
      fill="#e6b684" transform="rotate(-10 ${n(x+0.6*S0)} ${n(y-4.6*S0)})"/>
      <ellipse cx="${n(x+0.6*S0)}" cy="${n(y-4.6*S0)}" rx="${n(0.34*S0)}" ry="${n(1.6*S0)}"
      fill="#f0a8b0" transform="rotate(-10 ${n(x+0.6*S0)} ${n(y-4.6*S0)})"/></g>`;
    s += `<g class="a3-ear-r"><ellipse cx="${n(x+2.6*S0)}" cy="${n(y-4.7*S0)}" rx="${n(0.72*S0)}" ry="${n(2.2*S0)}"
      fill="#e6b684" transform="rotate(9 ${n(x+2.6*S0)} ${n(y-4.7*S0)})"/>
      <ellipse cx="${n(x+2.6*S0)}" cy="${n(y-4.7*S0)}" rx="${n(0.34*S0)}" ry="${n(1.6*S0)}"
      fill="#f0a8b0" transform="rotate(9 ${n(x+2.6*S0)} ${n(y-4.7*S0)})"/></g>`;
    s += toyEye(x+0.9*S0, y-2.0*S0, 0.52*S0);
    s += toyEye(x+2.4*S0, y-2.0*S0, 0.52*S0);
    s += `<ellipse cx="${n(x+1.6*S0)}" cy="${n(y-1.1*S0)}" rx="${n(0.34*S0)}" ry="${n(0.26*S0)}" fill="#e08a94"/>`;
    s += `</g>`;

  } else if(kind === 'duck'){
    s += toyLeg(x-1.0*S0, y+1.6*S0, 0.7*S0, 1.4*S0, '#f0a93c', '#e08b1e');
    s += toyLeg(x+0.6*S0, y+1.6*S0, 0.7*S0, 1.4*S0, '#f0a93c', '#e08b1e');
    s += toyBody(x, y, 3.2*S0, 2.6*S0, '#fbfaf7', '#ffffff', '#dcd6cb');
    s += `<g class="a3-head">`;
    s += `<circle cx="${n(x+2.2*S0)}" cy="${n(y-2.1*S0)}" r="${n(1.7*S0)}" fill="#fdfcfa"/>`;
    s += `<ellipse cx="${n(x+3.7*S0)}" cy="${n(y-1.7*S0)}" rx="${n(1.3*S0)}" ry="${n(0.62*S0)}" fill="#f0a93c"/>`;
    s += toyEye(x+2.5*S0, y-2.4*S0, 0.46*S0);
    s += `</g>`;

  } else {
    /* anything not restyled falls back to the original artwork */
    return null;
  }
  s += `</g>`;
  return s;
}

/* swap the new art in wherever the old beast() was used */
if(typeof beast === 'function'){
  const _beastOld = beast;
  beast = function(kind, x, y, sc, idle){
    const out = beast3d(kind, x, y, sc, idle);
    return out === null ? _beastOld.apply(this, arguments) : out;
  };
}

/* ---------- a cow to put in the barn ---------- */
if(typeof BP !== 'undefined' && Array.isArray(BP) && !BP.some(b=>b.id==='cow_pasture')){
  BP.push({
    id:'cow_pasture', name:'Dairy pasture', art:'cow_pasture', cat:'animals', kind:'animal',
    w:5, h:4, cost:1400, lvl:3, animal:'cow', cap:4, qty:3, cycle:2.2, per:1.6,
    good:'milk', feed:9, charm:6,
    d:'Four dairy cows on good grass. The heaviest feeder on the farm and the best return.',
  });
  if(typeof BPMAP === 'object') BPMAP.cow_pasture = BP[BP.length-1];
}
if(typeof GOODS === 'object' && !GOODS.milk){
  GOODS.milk = {n:'Milk', c:'#f4f1e8', p:11};
}

ART.cow_pasture = (w,h,ob)=>{
  const cnt = ob ? Math.min(4, ob.animals||0) : 2;
  let s = (typeof paddock === 'function') ? paddock(w,h,'cow',0,7,0.92) : patch(w,h,'#7fa64e',12,1);
  /* a run-in shelter along the top */
  s += `<g transform="translate(${n(w*0.06)},${n(h*0.05)})">${
    (typeof annex==='function') ? annex(w*0.34, h*0.26, {roof:'#9aa6ac'}) : ''}</g>`;
  /* a water trough, because a dairy cow drinks more than anything else here */
  s += `<rect x="${n(w*0.66)}" y="${n(h*0.10)}" width="${n(w*0.26)}" height="${n(h*0.09)}" rx="2" fill="#9fb0b8"/>`;
  s += `<rect x="${n(w*0.67)}" y="${n(h*0.11)}" width="${n(w*0.24)}" height="${n(h*0.05)}" rx="1.5" fill="url(#gWater)"/>`;
  for(let i=0;i<cnt;i++){
    const cx = w*(0.24 + (i%2)*0.42), cy = h*(0.52 + Math.floor(i/2)*0.28);
    s += `<g class="a3 a3-graze" style="animation-delay:-${(i*1.9).toFixed(1)}s">${
      beast('cow', cx, cy, 1.15, true)}</g>`;
  }
  if(ob && ob.ready>0) s += `<circle class="pulse" cx="${n(w-6)}" cy="6" r="3.4" fill="#f0c14b"/>`;
  return s;
};

/* ---------- movement ---------- */
(function animalCss(){
  const s = document.createElement('style');
  s.textContent = `
  /* breathing: the whole body rises and settles */
  .a3 .a3-body{ transform-box:fill-box; transform-origin:50% 90%;
    animation: a3Breathe 4.2s ease-in-out infinite; }
  @keyframes a3Breathe{
    0%,100%{ transform: scale(1,1); }
    50%    { transform: scale(1.015,1.035) translateY(-0.4px); } }
  /* the head dips to graze, then comes back up to look around */
  .a3-graze .a3-head{ transform-box:fill-box; transform-origin:20% 40%;
    animation: a3Graze 9s ease-in-out infinite; }
  @keyframes a3Graze{
    0%,44%  { transform: rotate(0deg)  translateY(0); }
    56%,80% { transform: rotate(11deg) translateY(2px); }
    92%,100%{ transform: rotate(0deg)  translateY(0); } }
  /* ears twitch independently, which is most of what sells a live animal */
  .a3 .a3-ear-l{ transform-box:fill-box; transform-origin:80% 50%;
    animation: a3EarL 5.5s ease-in-out infinite; }
  .a3 .a3-ear-r{ transform-box:fill-box; transform-origin:20% 50%;
    animation: a3EarR 6.8s ease-in-out infinite; }
  @keyframes a3EarL{ 0%,88%,100%{ transform: rotate(0deg); } 92%{ transform: rotate(-13deg); } }
  @keyframes a3EarR{ 0%,84%,100%{ transform: rotate(0deg); } 89%{ transform: rotate(12deg); } }
  @media (prefers-reduced-motion: reduce){
    .a3 .a3-body, .a3-graze .a3-head, .a3 .a3-ear-l, .a3 .a3-ear-r{ animation:none !important; } }
  `;
  document.head.appendChild(s);
})();

/* ---------- how stock actually share a shed ---------- */
/* Real husbandry: flock animals settle together and lie touching at night;
   mixed species in one pen bully each other at the feeder, so they get
   separated. This reads that off what is actually in each pen. */
function pennedSpecies(o){
  const bp = BPMAP[o.bp] || {};
  return bp.animal || (/(sheep)/.test(bp.art||'') ? 'sheep'
    : /goat/.test(bp.art||'') ? 'goat'
    : /coop|chicken/.test(bp.art||'') ? 'chicken'
    : /duck/.test(bp.art||'') ? 'duck'
    : /rabbit/.test(bp.art||'') ? 'rabbit' : 'stock');
}

function husbandryNote(){
  const pens = (S.objs||[]).filter(o=>BPMAP[o.bp] && BPMAP[o.bp].kind==='animal');
  if(!pens.length) return '';
  const byKind = {};
  pens.forEach(o=>{ const k = pennedSpecies(o); byKind[k] = (byKind[k]||0) + 1; });
  const kinds = Object.keys(byKind);
  const night = (typeof isNight === 'function') && isNight();
  const notes = [];
  if(kinds.includes('sheep') || kinds.includes('goat'))
    notes.push(night
      ? 'Sheep and goats have bunched up against the fence for the night — flock animals sleep touching.'
      : 'Sheep and goats keep together while they graze; a lone one gets stressed.');
  if(kinds.includes('chicken') && kinds.includes('duck'))
    notes.push('Keep ducks off the hens’ dry bedding — ducks foul water and chickens need it dry.');
  if(kinds.length >= 3)
    notes.push('Three or more species: give each its own feeder, or the bigger stock will push the smaller off.');
  if(pens.some(o=>(o.animals||0) === 1))
    notes.push('A single animal on its own does badly. Most of these do better in pairs or better.');
  return notes.join(' ');
}

/* surface it on the Stats tab */
if(typeof renderRight === 'function'){
  const _renderRightHusb = renderRight;
  renderRight = function(){
    const r = _renderRightHusb.apply(this, arguments);
    if(rightTab === 'owner'){
      const b = document.getElementById('rightBody');
      const note = husbandryNote();
      if(b && note && !b.querySelector('.husbcard')){
        const d = document.createElement('div');
        d.className = 'pcard husbcard';
        d.innerHTML = `<h3>The stock</h3><p class="sub">${note}</p>`;
        b.appendChild(d);
      }
    }
    return r;
  };
}
