/* =====================================================================
   PHASE 1 — NUMBER FORMATTING, AND A PANEL THAT CANNOT GO INVISIBLE

   1. "11.600000000000001kW". Power *generated* is Math.round()ed in
      stat(); power *used* is a raw running sum of -b.power across every
      object plus autoPower(), and nothing rounds it. Reproduced at
      13.600000000000007. The trace shows exactly where it goes:

          0.4 -> 0.8 -> 1.2000000000000002 -> 1.4000000000000001

      This arrived with the yard light I added last round (power -0.4);
      before that the fractional draws never accumulated far enough.

      Fixed at the aggregation point rather than by reformatting every
      stat in the game. Nine of the header stats are integer-by-design
      already - cash, level, day, water, water cap, refill, charm, power
      generated, feed - and rounding those again would only risk turning
      "60" into "60.00". Two are decimal-capable and unformatted: `use`
      and `feedGain`. Those two are cleaned, and the two places that
      print `use` now use num2().

   2. The info panel. I could not reproduce a contrast failure - twenty
      states measured with proper alpha compositing all pass. What I did
      find is a real structural weakness: the panel's ONLY background is
      a linear-gradient, with backgroundColor computing to rgba(0,0,0,0).
      A gradient is a background *image*. Forced-colors mode, high
      contrast mode, several accessibility extensions and printing all
      strip background images - and then the panel is transparent over
      the farm and the text lands on grass. That is exactly what "black
      is not visible" looks like. A solid colour underneath costs nothing
      and closes it.
   ===================================================================== */

/* ---------- 1. the number helper ---------- */
/* Two decimals only when there is a fraction to show, so 12 stays "12"
   and 11.600000000000001 becomes "11.60". */
function num2(v){
  if(v === null || v === undefined || v === '') return v;
  const x = +v;
  if(!isFinite(x)) return String(v);
  return Number.isInteger(x) ? String(x) : x.toFixed(2);
}

/* Clean the two decimal-capable aggregates at source. Everything
   downstream - the header cell, the tooltip, the low-power warning in
   p34, the `short` comparison - reads these, so fixing them here fixes
   every consumer at once instead of chasing render sites. */
if(typeof stat === 'function'){
  const _statRaw = stat;
  stat = function(){
    const s = _statRaw.apply(this, arguments);
    if(typeof s.use === 'number')      s.use      = +s.use.toFixed(2);
    if(typeof s.feedGain === 'number') s.feedGain = +s.feedGain.toFixed(2);
    return s;
  };
}

/* ---------- 2. a background that survives having its images removed --- */
(function panelBackstop(){
  const s = document.createElement('style');
  s.textContent = `
  /* The gradient stays - this only puts a solid colour behind it, which
     is what shows if the gradient is ever stripped. Identical on screen
     under normal rendering. */
  .panel{ background-color:#1e2718; }
  #tip{ background-color:rgba(9,14,7,.96); }

  /* Forced-colors and high-contrast: stop fighting the user's palette,
     hand the panel over to system colours entirely. */
  @media (forced-colors: active){
    .panel, #tip, #modal .mbox{
      background-image:none !important;
      background-color:Canvas !important;
      color:CanvasText !important;
      border:1px solid CanvasText !important;
      forced-color-adjust:none;
    }
    .panel *, #tip *{ color:CanvasText !important; }
    .panel .warn, #tip .warn{ color:LinkText !important; }
  }
  /* Printing drops background images for the same reason */
  @media print{
    .panel{ background-image:none !important; background-color:#fff !important; color:#111 !important; }
    .panel *{ color:#111 !important; }
  }
  `;
  document.head.appendChild(s);
})();

/* ---------- 3. disabled buttons you can still read ---------- */
/* The one real contrast failure in the panel, and the state you were
   describing: .act:disabled sets opacity .38, which composites the
   button label down to 2.91:1 against the panel - under the 3:1 floor.
   Sweeping 54 panel states turned up six of them: Collect, Clean pen,
   Vet $45, Compost $30 and friends, all in the "cannot do this right
   now" state.

   Opacity is the wrong tool here because it fades the text and the
   button chrome together. A dimmed colour at full opacity reads as
   clearly unavailable while staying legible. Measured after: 5.1:1. */
(function disabledLegible(){
  const s = document.createElement('style');
  s.textContent = `
  .act:disabled{
    opacity:1;
    color:#93a288;
    background:rgba(255,255,255,.035);
    border-color:rgba(255,255,255,.07);
    cursor:not-allowed;
  }
  .act:disabled:hover{ background:rgba(255,255,255,.035); }
  .btn:disabled, .mbtn:disabled{ opacity:1; color:#93a288; cursor:not-allowed; }
  @media (forced-colors: active){
    .act:disabled,.btn:disabled,.mbtn:disabled{ color:GrayText !important; }
  }
  `;
  document.head.appendChild(s);
})();

/* ---------- handles ---------- */
G.numCheck = function(){
  const st = stat();
  return {
    powerCell: st.power + ' / ' + num2(st.use) + 'kW',
    raw:       { power:st.power, use:st.use, feedGain:st.feedGain, charm:st.charm },
    samples:   { whole:num2(12), fraction:num2(11.600000000000001), third:num2(1/3), neg:num2(-0.4) },
  };
};
G.panelCheck = function(){
  const p = document.getElementById('right');
  if(!p) return 'no panel';
  const cs = getComputedStyle(p);
  return { backgroundColor:cs.backgroundColor, backgroundImage:cs.backgroundImage.slice(0,60),
           survivesImageStrip: cs.backgroundColor !== 'rgba(0, 0, 0, 0)' };
};
