/* =====================================================================
   CLOUDS

   The scene had discs of tone scattered across the ground standing in
   for variation, and nothing at all in the sky. That is backwards: the
   ground reads better when its variation is felt rather than seen, and
   the sky is where shapes are supposed to float.

   These sit in the band above the horizon, drift slowly, and take their
   colour from the sun — white and high at midday, gold and low-bellied
   at dawn, bruised grey under a storm. They are built from overlapping
   ellipses with a lit top and a shaded underside, which is the same
   upper-left light every object on the ground obeys.
   ===================================================================== */

function cloudShape(w, h, seed){
  /* a cumulus is a cluster of lobes, not one blob: three or four
     overlapping circles with a flat base */
  const lobes = 3 + Math.round(hash(seed)*2);
  let body = '', lit = '';
  for(let i=0;i<lobes;i++){
    const t  = i/(lobes-1||1);
    const cx = w*(0.16 + t*0.68);
    const r  = h*(0.34 + hash(seed+i*3.1)*0.30) * (1 - Math.abs(t-0.5)*0.5);
    const cy = h*0.62 - r*0.32;
    body += `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}"/>`;
    lit  += `<circle cx="${n(cx)}" cy="${n(cy - r*0.22)}" r="${n(r*0.78)}"/>`;
  }
  /* flat base, the way cumulus actually sit on their condensation level */
  body += `<rect x="${n(w*0.10)}" y="${n(h*0.44)}" width="${n(w*0.80)}" height="${n(h*0.22)}" rx="${n(h*0.11)}"/>`;
  return `<g class="cl-body">${body}</g><g class="cl-lit">${lit}</g>`;
}

function cloudLayer(){
  const W = WPX;
  let s = '<g id="clouds" aria-hidden="true">';
  /* The visible sky is a narrow band above the ridgeline, so clouds have
     to be small and sit well inside it. Sized against that band, not
     against the world, or one cloud swallows the horizon. */
  for(let i=0;i<11;i++){
    const t   = i/11;
    const cw  = 62 + hash(i*2.7)*94;
    const ch  = 15 + hash(i*4.1)*15;
    /* spread across the full width, jittered so the spacing is not a comb */
    const x   = -W*0.20 + (t + (hash(i*7.3)-0.5)*0.06) * W*1.45;
    const y   = -246 + hash(i*3.3)*128;
    const dur = (170 + hash(i*5.7)*190).toFixed(0);
    /* higher sits fainter: cheap aerial perspective */
    const dep = (0.55 + ((y+246)/128) * 0.35).toFixed(2);
    s += `<g class="cloud" style="animation-duration:${dur}s;animation-delay:-${(hash(i*8.1)*dur).toFixed(0)}s"
      transform="translate(${n(x)},${n(y)})" opacity="${dep}">${cloudShape(cw, ch, i*3.7)}</g>`;
  }
  return s + '</g>';
}

/* the sky band sits behind everything, so clouds belong in the cached
   backdrop rather than the live foreground */
const _terrainSky = terrain;
terrain = function(){
  const out = _terrainSky();
  if(out.indexOf('id="clouds"') >= 0) return out;
  /* drop them in just after the horizon so ridges still overlap them */
  return out + cloudLayer();
};

/* Clouds take their colour from the sun. paintSun already runs on the
   day tick, so tint there rather than starting another timer. */
function tintClouds(){
  const root = document.documentElement;
  let body = '#f4f8fb', lit = '#ffffff', op = 1;
  if(typeof skyNow === 'function'){
    const s = skyNow(), f = s.f;
    const dawn = f > 0.18 && f < 0.30, dusk = f > 0.74 && f < 0.88;
    const night = (typeof isNight === 'function') ? isNight() : false;
    if(night){        body = '#39465c'; lit = '#5b6b86'; op = 0.55; }
    else if(dawn){    body = '#e9b48f'; lit = '#ffe0c0'; op = 0.95; }
    else if(dusk){    body = '#dc9c86'; lit = '#ffd2ac'; op = 0.95; }
  }
  const w = (typeof S !== 'undefined' && S) ? S.weather : 'sun';
  if(w === 'storm'){ body = '#59606b'; lit = '#7d8593'; op = 1; }
  else if(w === 'rain'){ body = '#7c8894'; lit = '#9aa6b1'; op = 1; }
  else if(w === 'cloud'){ body = '#dbe3e9'; lit = '#f2f7fa'; op = 1; }
  root.style.setProperty('--cloud-body', body);
  root.style.setProperty('--cloud-lit', lit);
  root.style.setProperty('--cloud-op', op);
}
const _paintSunClouds = (typeof paintSun === 'function') ? paintSun : null;
if(_paintSunClouds) paintSun = function(){ const r = _paintSunClouds.apply(this, arguments); tintClouds(); return r; };

(function cloudCss(){
  const s = document.createElement('style');
  s.textContent = `
  :root{ --cloud-body:#f4f8fb; --cloud-lit:#ffffff; --cloud-op:1; }
  #clouds{ pointer-events:none; }
  #clouds .cl-body circle, #clouds .cl-body rect{ fill:var(--cloud-body); }
  #clouds .cl-lit  circle{ fill:var(--cloud-lit); opacity:.45; }
  #clouds .cloud{ opacity:var(--cloud-op); animation-name:clDrift;
    animation-timing-function:linear; animation-iteration-count:infinite; }
  @keyframes clDrift{ from{ transform:translateX(-7%);} to{ transform:translateX(7%);} }
  @media (prefers-reduced-motion: reduce){ #clouds .cloud{ animation:none !important; } }
  `;
  document.head.appendChild(s);
})();

setTimeout(()=>{
  tintClouds();
  /* the backdrop is cached, so force one rebuild to pick the clouds up */
  if(typeof terrainCache !== 'undefined') terrainCache = '';
  if(typeof render === 'function') render();
}, 320);
