/* =====================================================================
   DEPTH AND LIFE

   Two things make a flat top-down scene read as solid: everything has to
   sit in the same light, and everything has to breathe a little.

   Light first. Individual art functions each drew their own shadow, or
   didn't, so objects sat at inconsistent heights. drawObj is the one
   place every object passes through, so the ground shadow is cast there
   — one direction, one softness, scaled by how tall the thing is.

   Then life. The frame budget here was hard-won: an earlier version ran
   at 15fps because 355 elements were animating and every one carried an
   SVG filter. So this animates with transforms only, never filters, and
   caps how many things can move at once. Objects past the cap are still
   drawn — they just hold still, which nobody notices in a crowd.
   ===================================================================== */

/* how tall each kind of thing stands. Drives shadow length and offset —
   a tank throws a longer shadow than a garden bed because it is taller. */
const HEIGHT = {
  home:2.6, housing:2.4, hub:2.2, process:2.0, shop:1.9, tourism:1.7,
  power:2.1, water:2.2, animal:1.2, bonus:1.4, store:1.9,
  perennial:1.5, plot:0.5, decor:1.0, feed:0.6, rec:1.2,
};
function objHeight(bp){
  if(bp.art === 'path' || bp.art === 'ring' || bp.art === 'parking') return 0;
  if(bp.art === 'pond' || bp.art === 'duck_pond') return 0.2;
  if(/^tree_/.test(bp.art)) return 2.4;
  return HEIGHT[bp.cat] !== undefined ? HEIGHT[bp.cat] : (HEIGHT[bp.kind] || 1.2);
}

/* Ground shadow, cast down-right from the same upper-left sun the art
   already assumes. Two stacked ellipses give a soft edge for far less
   than a Gaussian blur would cost. */
function groundShadow(o, bp){
  const hgt = objHeight(bp);
  if(hgt <= 0) return '';
  const f = footprint(bp, o.rot);
  const w = f.w*T, h = f.h*T;
  const x = o.tx*T, y = o.ty*T;
  /* taller things: longer throw, softer and weaker edge */
  const off = 1.6 + hgt*1.9;
  const grow = 1 + hgt*0.05;
  const op  = Math.min(0.30, 0.13 + hgt*0.055);
  const cx = x + w/2 + off*0.8, cy = y + h*0.93 + off*0.42;
  return `<g class="obshadow" aria-hidden="true">`
    + `<ellipse cx="${n(cx)}" cy="${n(cy)}" rx="${n(w*0.54*grow)}" ry="${n(h*0.30*grow)}"
        fill="#16240c" opacity="${(op*0.5).toFixed(3)}"/>`
    + `<ellipse cx="${n(cx-off*0.25)}" cy="${n(cy-off*0.18)}" rx="${n(w*0.45)}" ry="${n(h*0.24)}"
        fill="#16240c" opacity="${(op*0.75).toFixed(3)}"/>`
    + `</g>`;
}

/* which objects are worth animating, and with what */
function idleClass(bp){
  const a = bp.art || '';
  /* Only motion that a real farm actually shows. A turbine mast does not
     rock and a shed does not bob, so neither gets a whole-object
     transform - their life comes from working detail instead. */
  /* Plants sway through the .sway class on their foliage alone, wired to
     the real wind - rotating the whole group moved the bed and soil too. */
  if(/pond|duck_pond|well/.test(a))                                   return 'lf-shimmer';
  if(/lights|sign/.test(a))                                           return 'lf-glow';
  return '';
}

/* Budget: how many objects may animate at once. Measured, not chosen:
   in SVG an animated child repaints its region instead of compositing,
   so cost scales with animated AREA. Twenty movers reads as a living farm.
   Twenty-six cost about 11fps on a busy one and twenty is most of the
   effect for half the price; the far larger figure
   an earlier pass reported was measurement error, taken while the game
   simulation was still running during the sample. */
const IDLE_CAP = 20;

/* ---- hook the single place every object is drawn ---- */
const _drawObjBase = drawObj;
drawObj = function(o){
  const bp = BPMAP[o.bp];
  const inner = _drawObjBase(o);
  if(!bp || MERGE_ROAD[o.bp]) return inner;

  const shadow = (typeof SET !== 'function' || SET('shadows') !== false)
    ? groundShadow(o, bp) : '';

  /* animation is opt-in per object and rationed, so a big farm cannot
     drag the frame rate down the way it used to */
  let cls = '';
  if((typeof SET !== 'function' || SET('motion') !== false) && IDLE_USED < IDLE_CAP){
    cls = idleClass(bp);
    if(cls){
      IDLE_USED++;
      /* stagger so they do not all move on the same beat */
      const d = ((o.id ? String(o.id).length * 7 + o.tx * 13 + o.ty * 29 : 0) % 40) / 10;
      return shadow + `<g class="lifewrap ${cls}" style="animation-delay:-${d}s">${inner}</g>`;
    }
  }
  return shadow + inner;
};

/* reset the ration at the start of every full render */
let IDLE_USED = 0;
const _renderDepth = render;
render = function(){ IDLE_USED = 0; return _renderDepth.apply(this, arguments); };

(function lifeCss(){
  const s = document.createElement('style');
  s.textContent = `
  /* transform/opacity only — these stay on the compositor and never
     trigger layout or an offscreen filter pass */
  .lifewrap{ transform-origin:50% 92%; will-change:transform; }
  .lf-shimmer{ animation: lfShim 5.2s ease-in-out infinite; }
  .lf-glow   { animation: lfGlow 3.8s ease-in-out infinite; }
  .obshadow  { pointer-events:none; }

  @keyframes lfShim {
    0%,100%{ opacity:.95; } 50%{ opacity:1; } }
  @keyframes lfGlow {
    0%,100%{ opacity:.88; } 50%{ opacity:1; } }

  /* the OS-level preference wins over our setting */
  @media (prefers-reduced-motion: reduce){
    .lifewrap{ animation:none !important; } }
  `;
  document.head.appendChild(s);
})();

/* redraw once so existing farms pick the treatment up immediately */
setTimeout(()=>{ if(typeof render === 'function') render(); }, 260);
