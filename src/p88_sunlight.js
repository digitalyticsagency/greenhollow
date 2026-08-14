/* =====================================================================
   THE LIGHT MOVES

   paintSun() has always computed where the sun is, worked out an angle
   and a shadow length from it, and written them to --sun-x and --sun-y.
   Nothing has ever read them. Every shadow on the farm pointed the same
   way and was the same length at dawn, at noon and at dusk, while the sky
   above it went from orange to blue to orange again.

   This connects the two. Shadows now swing and stretch through the day:
   long and thrown to one side first thing, short and tucked under things
   at midday, long the other way by evening, and almost gone at night.

   HOW IT REACHES EVERY SHADOW WITHOUT TOUCHING THE ART

   After the polish pass most shadows are fill="url(#gShadow)", and the
   rest - animals, tiers, the architecture layer - are fill="#16240c" with
   a low opacity. Both are addressable in CSS, so one rule moves all of
   them and not a single art function had to change. The gradient's own
   stops use stop-color rather than fill, so gShadow itself is not caught
   by its own selector.

   The art's fixed convention is a sun in the upper left with shadows
   falling down and right, and that stays the baseline: what is added here
   is the swing either side of it through the day, so nothing looks wrong
   at noon and everything looks better at either end.
   ===================================================================== */

/* Only ever a transform. Opacity is left alone deliberately - every
   shadow in the game carries its own, tuned to the thing above it, and a
   blanket opacity here would flatten all of that to one value. */
(function sunlightCss(){
  const s = document.createElement('style');
  s.textContent = `
  [fill="url(#gShadow)"], [fill="#16240c"], .pr-shadow{
    transform-box: fill-box;
    transform-origin: 50% 50%;
    transform: translate(var(--sh-dx, 0px), var(--sh-dy, 0px))
               scale(var(--sh-sx, 1), var(--sh-sy, 1));
    transition: transform 1.6s linear;
  }
  @media (prefers-reduced-motion: reduce){
    [fill="url(#gShadow)"], [fill="#16240c"], .pr-shadow{ transition:none; }
  }`;
  document.head.appendChild(s);
})();

/* the sun's own arc, read the same way paintSun reads it */
function sunState(){
  const f = (typeof dayFrac === 'function') ? dayFrac() : 0.5;
  const up = f >= 0.22 && f <= 0.84;
  const p = up ? (f - 0.22) / 0.62 : 0;          /* 0 at dawn, 1 at dusk */
  /* long at both ends, short overhead */
  const len = up ? 1 + (1 - Math.sin(p * Math.PI)) * 2.2 : 1;
  return { f, up, p, len };
}

function applySunShadows(){
  const s = sunState();
  const root = document.documentElement;

  if(!s.up){
    /* night: a shadow with no sun is just contact, so it sits still and
       small rather than being thrown anywhere */
    root.style.setProperty('--sh-dx', '0px');
    root.style.setProperty('--sh-dy', '0.5px');
    root.style.setProperty('--sh-sx', '0.92');
    root.style.setProperty('--sh-sy', '0.92');
    return;
  }

  /* Light swings left to right across the day, so the shadow it throws
     swings right to left. At p=0.5 this is zero and the art's own
     baked-in down-right offset is all that is left, which is why midday
     looks exactly as it always did. */
  const swing = (0.5 - s.p) * 2;                 /* +1 dawn, 0 noon, -1 dusk */
  const dx = swing * s.len * 4.6;
  const dy = (s.len - 1) * 1.9;

  /* a low sun stretches a shadow along its own length */
  const sx = 1 + Math.abs(swing) * (s.len - 1) * 0.30;
  const sy = 1 + (s.len - 1) * 0.12;

  root.style.setProperty('--sh-dx', dx.toFixed(2) + 'px');
  root.style.setProperty('--sh-dy', dy.toFixed(2) + 'px');
  root.style.setProperty('--sh-sx', sx.toFixed(3));
  root.style.setProperty('--sh-sy', sy.toFixed(3));
}

/* paintSun already runs on the day tick, which is the right cadence -
   the sun does not need updating more often than the sky does */
if(typeof paintSun === 'function'){
  const _paintSunLight = paintSun;
  paintSun = function(){
    const r = _paintSunLight.apply(this, arguments);
    try{ applySunShadows(); }catch(e){}
    return r;
  };
}
setTimeout(()=>{ try{ applySunShadows(); }catch(e){} }, 300);

/* ---------- handle ---------- */
G.sunAudit = function(){
  const s = sunState();
  const root = getComputedStyle(document.documentElement);
  const read = k => root.getPropertyValue(k).trim();
  const shadows = document.querySelectorAll(
    '[fill="url(#gShadow)"], [fill="#16240c"], .pr-shadow').length;
  return {
    timeOfDay: `${(s.f*24).toFixed(1)}h`,
    sunUp: s.up,
    throughDay: s.up ? `${Math.round(s.p*100)}% across the sky` : 'below the horizon',
    shadowLength: +s.len.toFixed(2),
    vars: { dx:read('--sh-dx'), dy:read('--sh-dy'), sx:read('--sh-sx'), sy:read('--sh-sy') },
    shadowsAffected: shadows,
    /* what it would be at four points of the day, without moving the clock */
    curve: [0, 0.25, 0.5, 0.75, 1].map(p=>{
      const len = 1 + (1 - Math.sin(p*Math.PI)) * 2.2;
      const sw = (0.5 - p) * 2;
      return `${['dawn','morning','noon','afternoon','dusk'][[0,0.25,0.5,0.75,1].indexOf(p)]}: `
        + `dx ${(sw*len*4.6).toFixed(1)}px, stretch ${(1 + Math.abs(sw)*(len-1)*0.30).toFixed(2)}x`;
    }),
  };
};
