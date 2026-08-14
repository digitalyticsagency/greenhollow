/* =====================================================================
   THE WHOLE FARM WAS RENDERING NEAR-BLACK

   The lawn is one rect filled url(#gLawn), and gLawn is a mid-green
   three-stop gradient. On screen the property was a dark, almost black
   rectangle with faint vertical banding, while the meadow outside the
   hedge stayed a healthy green. Forcing the rect to magenta proved
   nothing was covering it: the gradient itself was not painting, and
   what showed through was the bare backdrop with the mown stripes -
   which are white at 3.5% - reading as the only texture on it.

   The cause is DEFS() being emitted into every SVG in the document. The
   scene has two (#bg, #fg) and every catalogue thumbnail builds its own,
   so each gradient id existed eleven times over. `url(#gLawn)` resolves
   to the FIRST element with that id in the document, and the first one
   lived inside a build-menu thumbnail in ASIDE#left - a panel with
   display:none. A paint server inside a subtree that is never rendered
   is not built, so every reference to it silently paints nothing.

   Cross-<svg> references are not the problem and were verified working:
   a rect in #fg filled from a gradient in #bg's own defs paints
   correctly. The problem is only ever *which* copy wins the id, and
   whether that copy is in a rendered subtree.

   So: install the definitions exactly once, in a host that is always
   rendered and always first, and make DEFS() emit nothing afterwards.
   Every existing call site keeps working untouched - there are eight of
   them across the layers, the thumbnails and the market - they just stop
   contributing duplicate ids, and all of them resolve to the one live
   copy. It also drops eight redundant copies of the block from the DOM.

   The host is width/height 0 and clipped, NOT display:none - that would
   reintroduce the exact bug this fixes.
   ===================================================================== */

const DEFS_HOST_ID = 'defsHost';

function installDefsHost(){
  if(document.getElementById(DEFS_HOST_ID)) return false;
  const raw = DEFS();                        /* capture before overriding */
  if(!raw) return false;
  const host = document.createElementNS('http://www.w3.org/2000/svg','svg');
  host.setAttribute('id', DEFS_HOST_ID);
  host.setAttribute('width','0');
  host.setAttribute('height','0');
  host.setAttribute('aria-hidden','true');
  /* rendered, but occupying nothing and never hit-testable */
  host.setAttribute('style','position:absolute;left:0;top:0;width:0;height:0;overflow:hidden;pointer-events:none');
  host.innerHTML = raw;
  document.body.insertBefore(host, document.body.firstChild);
  return true;
}

/* Once the host owns the ids, every other emitter must stop claiming
   them. Returning '' rather than editing eight call sites keeps this
   reversible and keeps the art code unaware of any of it. */
const _DEFS_FULL = DEFS;
function scopeDefsToHost(){
  DEFS = function(){
    return document.getElementById(DEFS_HOST_ID) ? '' : _DEFS_FULL();
  };
}

(function defsHostBoot(){
  const go = function(){
    if(!installDefsHost()) return;
    scopeDefsToHost();
    /* the backdrop is cached and was built with the duplicate ids in it,
       so it has to be rebuilt once for the fix to show */
    if(typeof terrainCache !== 'undefined') terrainCache = '';
    if(typeof render === 'function') render();
  };
  if(document.body) setTimeout(go, 0);
  else document.addEventListener('DOMContentLoaded', ()=>setTimeout(go,0));
})();

/* ---------- handle ---------- */
/* Reports whether any gradient id is still duplicated, and whether the
   copy that wins each id is in a rendered subtree. That second half is
   the part that actually matters and the part I could not see by
   reading the source. */
G.defsAudit = function(){
  const host = document.getElementById(DEFS_HOST_ID);
  const ids = host ? [...host.querySelectorAll('[id]')].map(n=>n.id) : [];
  const dupes = [], hiddenOwner = [];
  ids.forEach(id=>{
    const all = document.querySelectorAll('[id="'+id+'"]');
    if(all.length > 1) dupes.push(id+' x'+all.length);
    let r = all[0];
    while(r && r.tagName !== 'svg') r = r.parentNode;
    let a = r, hid = false;
    while(a && a !== document.body){
      const cs = getComputedStyle(a);
      if(cs.display === 'none' || cs.visibility === 'hidden'){ hid = true; break; }
      a = a.parentNode;
    }
    if(hid) hiddenOwner.push(id);
  });
  return {
    hostPresent: !!host,
    definitions: ids.length,
    stillDuplicated: dupes,
    winningCopyInHiddenSubtree: hiddenOwner,   /* must be empty */
    defsNowEmits: DEFS().length,
  };
};
