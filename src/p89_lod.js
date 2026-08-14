/* =====================================================================
   DETAIL THAT KNOWS HOW FAR AWAY IT IS

   cam.z is used for camera maths and nothing else. The same art draws
   whether a building fills the screen or is twelve pixels wide, which
   costs at both ends: zoomed out the farm is a mush of sub-pixel detail
   that cannot be read and still has to be painted, and zoomed in there is
   nothing extra to reward getting closer.

   Three bands, switched by a class on the scene so the art itself never
   has to know:

     far   (below 0.55)  hairlines, grain, weathering streaks, corrugation
                         and idle animation are all dropped. None of it
                         resolves at that size - it is noise that costs
                         frames.
     mid   (0.55-1.35)   as drawn. This is the band the art was made for.
     close (above 1.35)  the extras come in: plank and stone joints, sills
                         and lintels on windows, a warmer rim on lit edges.

   Everything is done with CSS on classes the art already emits, so no
   drawing function was touched and nothing is re-rendered when the zoom
   changes - the same DOM simply shows less or more of itself.
   ===================================================================== */

let lodBand = '';

function lodFor(z){
  return z < 0.55 ? 'lod-far' : z > 1.35 ? 'lod-close' : 'lod-mid';
}

function applyLod(){
  const z = (typeof cam === 'object' && cam) ? (cam.z || 1) : 1;
  const band = lodFor(z);
  if(band === lodBand) return;
  const scene = document.getElementById('scene') || document.body;
  scene.classList.remove('lod-far','lod-mid','lod-close');
  scene.classList.add(band);
  lodBand = band;
}

/* applyCam() is what actually moves and scales the world, so it is the
   one place guaranteed to run on every zoom change however it was made -
   buttons, wheel, pinch or fitView. */
if(typeof applyCam === 'function'){
  const _applyCamLod = applyCam;
  applyCam = function(){
    const r = _applyCamLod.apply(this, arguments);
    try{ applyLod(); }catch(e){}
    return r;
  };
}
setTimeout(()=>{ try{ applyLod(); }catch(e){} }, 320);

(function lodCss(){
  const s = document.createElement('style');
  s.textContent = `
  /* ---------- FAR: drop what cannot resolve ---------- */
  /* Hairlines under about a pixel on screen read as grey haze rather than
     as detail, so they come out entirely. The shapes underneath are what
     carry the farm at this size. */
  .lod-far [stroke-width="0.5"], .lod-far [stroke-width="0.6"],
  .lod-far [stroke-width="0.7"], .lod-far [stroke-width="0.8"]{ display:none; }
  /* corrugation, weathering streaks and grain: many elements, no read */
  .lod-far [stroke-opacity=".11"], .lod-far [stroke-opacity=".1"],
  .lod-far [opacity=".06"], .lod-far [opacity=".08"], .lod-far [opacity=".09"]{ display:none; }
  /* idle motion at a distance is a shimmer, not life */
  .lod-far .sway, .lod-far .cropsway, .lod-far .spin, .lod-far .spinSlow,
  .lod-far .ripple, .lod-far .flame, .lod-far .bee, .lod-far .dogtail{
    animation: none !important; }
  /* names stop being legible long before this and just add clutter */
  .lod-far .nlab{ display:none; }

  /* ---------- CLOSE: things that only make sense up here ---------- */
  /* joints on timber and stone, drawn from what is already there rather
     than by adding elements: a light top edge and a dark bottom one */
  .lod-close [fill="url(#gTimber)"], .lod-close [fill="url(#gStone)"]{
    stroke: rgba(0,0,0,.16); stroke-width: 0.4; paint-order: fill; }
  .lod-close [fill="url(#gGlass)"]{
    stroke: rgba(255,255,255,.30); stroke-width: 0.5; paint-order: fill; }
  /* roofs get their sheet lines back, harder than at mid */
  .lod-close [stroke-opacity=".11"]{ stroke-opacity:.2; }
  /* a warmer edge where the light lands, which only reads big */
  .lod-close [fill="url(#gPlaster)"]{
    stroke: rgba(255,240,205,.5); stroke-width: 0.5; paint-order: fill; }

  @media (prefers-reduced-motion: reduce){
    .lod-far .sway, .lod-far .cropsway{ animation:none !important; }
  }`;
  document.head.appendChild(s);
})();

/* ---------- handle ---------- */
G.lodAudit = function(){
  const z = (typeof cam === 'object' && cam) ? (cam.z || 1) : 1;
  const scene = document.getElementById('scene') || document.body;
  const count = sel => document.querySelectorAll(sel).length;
  const hidden = sel => [...document.querySelectorAll(sel)]
    .filter(e=>getComputedStyle(e).display === 'none').length;
  return {
    zoom:+z.toFixed(3),
    band:lodBand,
    sceneClasses:[...scene.classList].filter(c=>c.startsWith('lod-')),
    thresholds:'far < 0.55 · mid · close > 1.35',
    hairlines:{ total:count('[stroke-width="0.5"],[stroke-width="0.6"],[stroke-width="0.7"],[stroke-width="0.8"]'),
                hiddenNow:hidden('[stroke-width="0.5"],[stroke-width="0.6"],[stroke-width="0.7"],[stroke-width="0.8"]') },
    labels:{ total:count('.nlab'), hiddenNow:hidden('.nlab') },
  };
};
