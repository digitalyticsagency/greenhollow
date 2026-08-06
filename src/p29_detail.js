/* =====================================================================
   WORKING DETAIL

   p28 made objects sit in the light and breathe. This makes them look
   like they are doing something: the jam kitchen smokes, the turbine
   actually turns, water rings spread, solar catches the sun as it
   crosses, the battery blinks while it charges.

   Everything here obeys the same budget as the rest of the art. Detail
   is drawn in the object's own coordinates so it rides along with
   rotation, it animates on transform and opacity only, and the number
   of emitters per render is rationed — a farm of ninety sheds does not
   need ninety smoke plumes to read as busy.
   ===================================================================== */

/* ---------- extra materials ---------- */
/* Injected into the shared <defs> so they are defined once for the whole
   scene rather than per object. */
const _DEFS_BASE = DEFS;
DEFS = function(){
  const base = _DEFS_BASE();
  const extra = `
  <linearGradient id="gMetalSpec" x1="0" y1="0" x2="0.35" y2="1">
    <stop offset="0"    stop-color="#b9c6cd"/>
    <stop offset="0.34" stop-color="#e8f0f4"/>
    <stop offset="0.52" stop-color="#9fadb5"/>
    <stop offset="1"    stop-color="#76838b"/>
  </linearGradient>
  <radialGradient id="gSmoke" cx="0.5" cy="0.5" r="0.5">
    <stop offset="0"   stop-color="#ffffff" stop-opacity="0.55"/>
    <stop offset="0.6" stop-color="#dfe6ea" stop-opacity="0.24"/>
    <stop offset="1"   stop-color="#dfe6ea" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="gLamp" cx="0.5" cy="0.5" r="0.5">
    <stop offset="0"   stop-color="#ffe9a8" stop-opacity="0.95"/>
    <stop offset="0.45" stop-color="#f5c95c" stop-opacity="0.45"/>
    <stop offset="1"   stop-color="#f5c95c" stop-opacity="0"/>
  </radialGradient>`;
  return base.replace('</defs>', extra + '</defs>');
};

/* ---------- the details ---------- */

/* a flue with three puffs climbing out of it, staggered so the plume
   is continuous rather than pulsing as one blob */
function detSmoke(w, h, seed){
  const x = w*0.78, y = h*0.30;
  let s = `<rect x="${n(x-2.2)}" y="${n(y-4)}" width="4.4" height="7" rx="1" fill="#8d959a"/>`;
  s += `<rect x="${n(x-2.2)}" y="${n(y-4)}" width="4.4" height="2" rx="1" fill="#aab2b7"/>`;
  for(let i=0;i<3;i++){
    const r = 2.2 + i*0.9;
    s += `<circle class="dt-smoke" cx="${n(x)}" cy="${n(y-5)}" r="${r.toFixed(1)}"
      fill="url(#gSmoke)" style="animation-delay:-${(i*1.25).toFixed(2)}s"/>`;
  }
  return s;
}

/* rings spreading from a point on the water */
function detRipple(w, h, seed){
  const cx = w*(0.40 + hash(seed)*0.22), cy = h*(0.42 + hash(seed*2.3)*0.2);
  let s = '';
  for(let i=0;i<2;i++)
    s += `<circle class="dt-ripple" cx="${n(cx)}" cy="${n(cy)}" r="1"
      fill="none" stroke="#dff1fa" stroke-width="0.8"
      style="animation-delay:-${(i*1.6).toFixed(2)}s"/>`;
  return s;
}


/* charge indicator: a small lamp that breathes */
function detLamp(w, h){
  const x = w*0.86, y = h*0.16;
  return `<circle class="dt-lamp" cx="${n(x)}" cy="${n(y)}" r="${n(Math.min(w,h)*0.10)}"
      fill="url(#gLamp)"/>`
    + `<circle class="dt-lamp" cx="${n(x)}" cy="${n(y)}" r="1.5" fill="#ffe9a8"
      style="animation-delay:-.4s"/>`;
}

/* which objects get which working detail */
const DETAIL = {
  kitchen:detSmoke, dairy:detSmoke, honey_lab:detSmoke,
  packing:detSmoke, workshop:detSmoke, cellar:detSmoke,
  pond:detRipple, duck_pond:detRipple, tank:detRipple, well:detRipple,
  battery:detLamp, ai_hub:detLamp, lights:detLamp,
};

let DETAIL_WIRED = 0;

/* ration: plenty to read as a busy farm, far short of what would cost us */
const DETAIL_CAP = 8;
let DETAIL_USED = 0;

(function applyDetail(){
  let wired = 0;
  Object.keys(DETAIL).forEach((name, idx)=>{
    const base = ART[name];
    if(typeof base !== 'function') return;
    const det = DETAIL[name];
    ART[name] = function(w, h, ob){
      const out = base(w, h, ob);
      /* detail is a live-scene luxury: skip it for palette thumbnails
         (no object) and once the ration for this render is spent */
      if(!ob || DETAIL_USED >= DETAIL_CAP) return out;
      if(typeof SET === 'function' && SET('motion') === false) return out;
      DETAIL_USED++;
      let extra = '';
      try { extra = det(w, h, idx*3.7) || ''; } catch(e){ extra = ''; }
      return out + extra;
    };
    wired++;
  });
  DETAIL_WIRED = wired;
})();

/* reset the ration each full render, alongside the idle-animation one */
const _renderDetail = render;
render = function(){ DETAIL_USED = 0; return _renderDetail.apply(this, arguments); };

(function detailCss(){
  const s = document.createElement('style');
  s.textContent = `
  /* transform-box:fill-box makes these rotate/scale about their own
     centre rather than the SVG root origin */
  .dt-smoke, .dt-ripple, .dt-lamp{
    transform-box:fill-box; transform-origin:center; pointer-events:none; }

  .dt-smoke { animation: dtSmoke 3.75s ease-out infinite; }
  .dt-ripple{ animation: dtRipple 3.2s ease-out infinite; }
  .dt-lamp  { animation: dtLamp 2.4s ease-in-out infinite; }

  @keyframes dtSmoke {
    0%   { opacity:0;   transform: translateY(2px)   scale(.5); }
    25%  { opacity:.5; }
    100% { opacity:0;   transform: translateY(-7px) scale(1.15); } }
  @keyframes dtRipple {
    0%   { opacity:.55; transform: scale(.4); }
    100% { opacity:0;   transform: scale(2.4); } }
  @keyframes dtLamp {
    0%,100%{ opacity:.35; transform: scale(.9); }
    50%    { opacity:1;   transform: scale(1.08); } }

  @media (prefers-reduced-motion: reduce){
    .dt-smoke,.dt-ripple,.dt-lamp{ animation:none !important; }
    .dt-smoke{ opacity:0 !important; } }
  `;
  document.head.appendChild(s);
})();

setTimeout(()=>{ if(typeof render === 'function') render(); }, 300);
