/* =====================================================================
   THE REAL REASON ANIMALS LOOKED LIKE THEY WERE OUT, AND A LIGHT YOU BUY

   1. Every previous audit I ran on containment measured a.x - the
      simulated position - and it was always clean, so I kept reporting
      that nothing was outside. That was the wrong number. What is drawn
      is the animal's BASE position plus a CSS translate, and render()
      wipes the translate. Measured: 3 of 8 base positions off the grass,
      the worst 1.27x the ellipse radius, and every translate reading
      "(cleared)" straight after a render. So on every redraw the whole
      pen snapped into the bare corners of the footprint and sat there
      until the next tick moved them back.

      baseSpot() sampled the footprint rectangle. The grass is an
      ellipse. It now samples the ellipse, and translates are re-applied
      the instant a render finishes so there is no snap at all.

   2. The lamps along the west boundary are gone. A yard light is a thing
      you buy and put where you want it, on the Land shelf, and it draws
      a little power like everything else.
   ===================================================================== */

/* ---------- 1. base positions belong on the grass ---------- */
/* Deterministic, so paddock() and the mind model still agree, but polar
   inside the ellipse instead of uniform across the rectangle. sqrt on
   the radius keeps them evenly spread rather than bunched at the middle. */
if(typeof baseSpot === 'function'){
  baseSpot = function(i, seed, w, h){
    const t = hash(i*2.3 + seed) * Math.PI * 2;
    const r = Math.sqrt(hash(i*5.7 + seed));
    return { x: w/2 + Math.cos(t) * (w/2) * 0.80 * r,
             y: h/2 + Math.sin(t) * (h/2) * 0.80 * r };
  };
}

/* Put every animal back where the simulation says it is, immediately
   after the DOM is rebuilt. Without this there is a visible jump on
   every redraw even with the base positions fixed. */
function reapplyAnimalPositions(){
  if(typeof MINDS === 'undefined') return;
  MINDS.forEach((m, id)=>{
    const el = document.querySelector(`.ob[data-id="${id}"]`);
    if(!el) return;
    m.list.forEach(a=>{
      const g = el.querySelector(`.pen-animal[data-ai="${a.i}"]`);
      if(!g) return;
      g.style.translate = `${n(a.x - a.bx)}px ${n(a.y - a.by)}px`;
      g.classList.toggle('a-inside', !!a.inside);
      g.classList.toggle('a-away', !!a.away);
    });
  });
}
if(typeof render === 'function'){
  const _renderReapply = render;
  render = function(){
    const r = _renderReapply.apply(this, arguments);
    try{ reapplyAnimalPositions(); }catch(e){}
    return r;
  };
}

/* ---------- 2. no more lamps on the boundary ---------- */
if(typeof lampPositions === 'function'){
  lampPositions = function(){ return []; };     /* nothing auto-placed */
}

/* ---------- 3. a yard light you buy and place ---------- */
if(typeof BP !== 'undefined' && typeof BPMAP === 'object' && !BPMAP.yard_light){
  const light = {
    id:'yard_light', name:'Yard light', art:'yard_light', cat:'land',
    w:1, h:1, cost:140, lvl:2, kind:'bonus', power:-0.4, charm:3,
    desc:'A pole light on a photocell. Comes on at dusk, off at first light.',
    tip:'Put them where you walk after dark. They draw a little power, so a flat battery means a dark yard.',
  };
  BP.push(light); BPMAP.yard_light = light;
}

/* the art: dark by day, a warm pool and a cone after dusk */
if(typeof ART === 'object'){
  ART.yard_light = (w, h)=>{
    const cx = w*0.5, base = h*0.86;
    let s = '';
    /* pool first so the post stands in it */
    s += `<ellipse class="yl-pool"  cx="${n(cx+1)}" cy="${n(base+1)}" rx="${n(w*0.95)}" ry="${n(h*0.40)}" fill="#ffd98a" opacity="0"/>`;
    s += `<ellipse class="yl-pool2" cx="${n(cx+1)}" cy="${n(base+1)}" rx="${n(w*0.55)}" ry="${n(h*0.23)}" fill="#fff0c4" opacity="0"/>`;
    s += `<path class="yl-cone" d="M${n(cx-1)} ${n(base-26)} L${n(cx+5)} ${n(base-26)} L${n(cx+w*0.8)} ${n(base+2)} L${n(cx-w*0.5)} ${n(base+2)} Z" fill="#ffd98a" opacity="0"/>`;
    /* contact shadow, then the post, lit upper-left as everything is */
    s += `<ellipse cx="${n(cx+1.4)}" cy="${n(base)}" rx="4.4" ry="1.8" fill="#16240c" opacity=".3"/>`;
    s += `<rect x="${n(cx-2.4)}" y="${n(base-3)}" width="4.8" height="3.4" rx="1.3" fill="#3f4a52"/>`;
    s += `<rect x="${n(cx-1.1)}" y="${n(base-29)}" width="2.2" height="27" rx="1.1" fill="#55616b"/>`;
    s += `<rect x="${n(cx-1.1)}" y="${n(base-29)}" width="0.9" height="27" rx="0.45" fill="#7d8994"/>`;
    s += `<path d="M${n(cx)} ${n(base-29)} q0 -5 6 -5" fill="none" stroke="#55616b" stroke-width="2.1"/>`;
    s += `<path d="M${n(cx+2.6)} ${n(base-34.4)} h7.2 l-1.5 4.6 h-4.2 Z" fill="#46525c"/>`;
    s += `<ellipse class="yl-bulb" cx="${n(cx+6.2)}" cy="${n(base-29.4)}" rx="3.1" ry="1.5" fill="#ffe9a8" opacity=".25"/>`;
    return s;
  };
}

/* they switch themselves on and off. A class on the object group rather
   than a redraw, so dusk costs nothing. */
let YL_STATE = null;
function tickYardLights(){
  const lit = (typeof lampsLit === 'function') ? lampsLit() : false;
  if(lit === YL_STATE) return;
  YL_STATE = lit;
  let n0 = 0;
  (S.objs || []).forEach(o=>{
    if((BPMAP[o.bp] || {}).art !== 'yard_light') return;
    const el = document.querySelector(`.ob[data-id="${o.id}"]`);
    if(el){ el.classList.toggle('yl-on', lit); n0++; }
  });
  if(n0 && typeof log === 'function')
    log(lit ? `The yard lights came on.` : `The yard lights went off with the sun.`, '', 'home');
}
/* re-apply after a redraw, same reason as the animals */
if(typeof render === 'function'){
  const _renderYl = render;
  render = function(){
    const r = _renderYl.apply(this, arguments);
    const lit = (typeof lampsLit === 'function') ? lampsLit() : false;
    (S.objs || []).forEach(o=>{
      if((BPMAP[o.bp] || {}).art !== 'yard_light') return;
      const el = document.querySelector(`.ob[data-id="${o.id}"]`);
      if(el) el.classList.toggle('yl-on', lit);
    });
    return r;
  };
}

const _tickPeopleYl = tickPeople;
tickPeople = function(dt){
  const r = _tickPeopleYl.apply(this, arguments);
  try{ tickYardLights(); }catch(e){}
  return r;
};

(function yardLightCss(){
  const s = document.createElement('style');
  s.textContent = `
  .ob .yl-pool,.ob .yl-pool2,.ob .yl-cone,.ob .yl-bulb{ transition:opacity .9s ease; }
  .ob.yl-on .yl-pool { opacity:.22; animation: ylFlicker 6s ease-in-out infinite; }
  .ob.yl-on .yl-pool2{ opacity:.32; }
  .ob.yl-on .yl-cone { opacity:.10; }
  .ob.yl-on .yl-bulb { opacity:1; }
  @keyframes ylFlicker{ 0%,100%{ opacity:.22 } 47%{ opacity:.26 } 52%{ opacity:.18 } }
  @media (prefers-reduced-motion: reduce){ .ob.yl-on .yl-pool{ animation:none } }
  `;
  document.head.appendChild(s);
})();

/* ---------- handles ---------- */
G.penCheck = function(){
  const out = [];
  (typeof stockPens === 'function' ? stockPens() : []).forEach(o=>{
    const m = MINDS.get(o.id); if(!m) return;
    const g = outdoorEllipse(m);
    let simOff = 0, baseOff = 0, drawnOff = 0;
    const el = document.querySelector(`.ob[data-id="${o.id}"]`);
    m.list.forEach(a=>{
      if(Math.hypot((a.x-g.cx)/g.rx, (a.y-g.cy)/g.ry) > 1.001) simOff++;
      if(Math.hypot((a.bx-g.cx)/g.rx, (a.by-g.cy)/g.ry) > 1.001) baseOff++;
      if(el){
        const q = el.querySelector(`.pen-animal[data-ai="${a.i}"]`);
        const t = q && q.style.translate;
        if(!t) drawnOff++;                    /* no translate = sitting on base */
      }
    });
    out.push({ pen:o.bp, head:m.list.length, simOff, baseOff, noTranslate:drawnOff });
  });
  return out;
};
