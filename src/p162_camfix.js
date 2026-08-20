/* =====================================================================
   THE FEEDS WERE BLINKING, AND THE NIGHT VISION WAS BLINDING

   Two faults, reported together and unrelated underneath.

   THE BLINK. Camera and drone feeds are a <use> of the live scene, which
   was the whole trick: no copying, no second render, the feed simply is
   the farm. Except render() replaces every child of #fg from scratch on
   every frame — measured, thirty out of thirty renders — so the <use>
   had its target pulled out from under it sixty times a second and
   repainted from nothing each time. That is the flicker.

   The fix is a shared snapshot. One hidden copy of the scene, cloned five
   times a second, and every feed points at that instead. It stops
   flickering because the node stops being destroyed, and five frames a
   second is what a farm camera looks like anyway. Cost measured before
   committing to it: 3.65ms to clone both layers, so under 2% of a core at
   5fps — and it is one snapshot however many cameras you own, so the
   fourth feed is free.

   THE NIGHT VISION. The infrared filter brightened an already-bright
   picture. The day/night darkening in this game is a separate overlay
   sitting above the scene, not part of it, so a feed of #fg at three in
   the morning is showing full daylight — and the filter was adding
   brightness 1.22 and saturation 2.1 on top of that. Hence a screen of
   blown-out neon. It darkens first now and tints second, which is the
   order a real sensor does it in.
   ===================================================================== */

const SNAP = { t:0, every:0.2, host:null, ready:false };

function snapEnsure(){
  if(SNAP.host && document.body.contains(SNAP.host)) return SNAP.host;
  const host = document.createElement('div');
  host.id = 'camsnap';
  host.setAttribute('aria-hidden','true');
  host.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;pointer-events:none';
  host.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0">
    <g id="snapbg"></g><g id="snapfg"></g></svg>`;
  document.body.appendChild(host);
  SNAP.host = host;
  return host;
}
/* one copy of the scene, taken on our own clock rather than the renderer's */
function snapTake(){
  snapEnsure();
  const bg = document.getElementById('bg'), fg = document.getElementById('fg');
  const sbg = document.getElementById('snapbg'), sfg = document.getElementById('snapfg');
  if(!bg || !fg || !sbg || !sfg) return;
  const nbg = bg.cloneNode(true), nfg = fg.cloneNode(true);
  /* ids inside a clone would collide with the originals, and a duplicate id
     is what makes a <use> resolve to the wrong subtree */
  [nbg, nfg].forEach(root=>{
    root.removeAttribute('id');
    root.querySelectorAll('[id]').forEach(el=>el.removeAttribute('id'));
  });
  sbg.replaceChildren(...nbg.childNodes);
  sfg.replaceChildren(...nfg.childNodes);
  SNAP.ready = true;
}
function snapNeeded(){
  if(typeof DRONE === 'object' && DRONE.on) return true;
  /* closeModal hides the backdrop without emptying it, so the grid is still
     in the document long after you shut the cameras. Testing for the node
     alone left the snapshot running for the rest of the session — measured
     as still needed with the panel closed. Ask whether it is actually on
     screen. */
  const grid = document.getElementById('camgrid');
  if(!grid) return false;
  if(grid.offsetParent === null) return false;
  const back = document.getElementById('modal');
  return !back || back.classList.contains('show');
}
if(typeof tickPeople === 'function'){
  const _tickSnap = tickPeople;
  tickPeople = function(dt){
    const r = _tickSnap.apply(this, arguments);
    try{
      if(snapNeeded()){
        SNAP.t += (typeof dt === 'number' ? dt : 1/30);
        if(SNAP.t >= SNAP.every){ SNAP.t = 0; snapTake(); }
      }
    }catch(e){}
    return r;
  };
}

/* point every feed at the snapshot rather than the live tree */
function snapWire(){
  snapTake();
  document.querySelectorAll('.camsvg use, #drfeed use').forEach(u=>{
    const href = u.getAttribute('href') || u.getAttribute('xlink:href') || '';
    if(href === '#bg') u.setAttribute('href', '#snapbg');
    else if(href === '#fg') u.setAttribute('href', '#snapfg');
  });
}
['openCameras','flyDrone'].forEach(fn=>{
  if(typeof G[fn] !== 'function') return;
  const base = G[fn];
  G[fn] = function(){
    const r = base.apply(this, arguments);
    try{ snapWire(); }catch(e){}
    return r;
  };
});
/* the zoom rebuilds nothing, but the camera panel can be reopened by the
   incident review, so rewire whenever the grid reappears */
if(typeof camRefresh === 'function'){
  const _camRefreshSnap = camRefresh;
  camRefresh = function(){
    const r = _camRefreshSnap.apply(this, arguments);
    try{
      const stale = document.querySelector('.camsvg use[href="#fg"]');
      if(stale) snapWire();
    }catch(e){}
    return r;
  };
}

/* ---------- night vision you can see through ---------- */
(function irFix(){
  const s = document.createElement('style');
  s.textContent = `
  /* The scene under a feed is always lit as daylight — the day/night wash
     is an overlay above it, not part of #fg. So infrared has to bring the
     level down before it tints, or it compounds into white-green. */
  .camsvg.ir, #drfeed.ir{
    filter: brightness(.52) saturate(.35) sepia(1) hue-rotate(58deg)
            saturate(2.2) contrast(1.12) brightness(1.05) !important;
  }
  /* and a little fall-off at the edges, the way a lens behaves */
  .camcell::after, .drfeedwrap::after{
    content:''; position:absolute; inset:0; pointer-events:none; border-radius:inherit;
    box-shadow:inset 0 0 26px rgba(0,0,0,.34);
  }
  `;
  document.head.appendChild(s);
})();

/* ---------- handle ---------- */
G.camFixAudit = function(){
  const feeds = [...document.querySelectorAll('.camsvg use, #drfeed use')];
  const targets = feeds.map(u=>u.getAttribute('href'));
  return {
    snapshotExists: !!document.getElementById('snapfg'),
    snapshotTakenAt: SNAP.every*1000 + 'ms (' + Math.round(1/SNAP.every) + ' fps)',
    snapshotNodes: (document.getElementById('snapfg') || {querySelectorAll:()=>[]})
      .querySelectorAll('*').length,
    feedsOpen: feeds.length,
    pointingAtSnapshot: targets.filter(t=>t === '#snapbg' || t === '#snapfg').length,
    stillPointingAtLiveScene: targets.filter(t=>t === '#bg' || t === '#fg').length,
    duplicateIdsInSnapshot: (document.getElementById('snapfg') || {querySelectorAll:()=>[]})
      .querySelectorAll('[id]').length,
    wasBefore: 'feeds used #fg directly, whose children render() replaces every frame',
  };
};
