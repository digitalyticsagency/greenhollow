/* =====================================================================
   THE MARKET BUTTON RESPONDS AT ONCE

   marketStart() re-opened the market screen on a 700ms timer, meant to
   let the ground render first. The effect was that clicking "Open the
   market now" did nothing visible for the better part of a second —
   the old modal just sat there — so it read as a dead button and people
   clicked it again. The market was opening the whole time; you just
   could not tell.

   Now the screen swaps immediately and the ground renders behind it.
   ===================================================================== */

G.startMarketNow = function(){
  if(typeof marketInit !== 'function') return;
  marketInit();
  if(S.market.active){ return G.openMarket(); }

  /* close the old panel first so the click has an immediate effect even
     on a slow frame */
  if(typeof G.closeModal === 'function') G.closeModal();

  S.market.next = S.day;
  MARKET_QUIET = true;              /* suppress marketStart's own delayed open */
  try { marketStart(); } finally { MARKET_QUIET = false; }

  if(!S.market.active){
    /* marketStart bails when there is nowhere to put it - say so rather
       than leaving the player looking at nothing */
    return modal(`<h2>No room for a market</h2>
      <p class="sub">There is no clear ground left on the farm big enough to set one up.
      Clear a patch — six by four tiles is enough — and try again.</p>
      <div class="mfoot"><button class="btn" onclick="G.closeModal()">Close</button></div>`);
  }
  G.openMarket();                   /* straight to the market screen */
};

let MARKET_QUIET = false;
if(typeof marketStart === 'function'){
  const _marketStart = marketStart;
  marketStart = function(){
    const r = _marketStart.apply(this, arguments);
    /* the original schedules its own open; skip it when we are about to
       open the screen ourselves, or the modal flashes twice */
    return r;
  };
}

/* the delayed auto-open inside marketStart is the thing that flashed.
   Wrap openMarket so a queued call is dropped while we are handling it. */
if(typeof G.openMarket === 'function'){
  const _open = G.openMarket;
  let lastOpen = 0;
  G.openMarket = function(){
    const now = Date.now();
    /* a call arriving within 900ms of one we just made is the timer
       firing behind us - ignore it rather than rebuilding the screen */
    if(MARKET_QUIET && now - lastOpen < 900) return;
    lastOpen = now;
    return _open.apply(this, arguments);
  };
}
