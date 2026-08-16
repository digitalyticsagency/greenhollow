/* =====================================================================
   WHEN A SCENE IS ON, THE FARM IS NOT THERE

   The champions' duel is an SVG group inside #fg, which is also where the
   farm keeps its objects, its people, its two separate flocks of birds and
   you. So the arena opened over the top of a working farm and the roofs,
   chests, machines and sparrows carried on drawing across it — visible in
   the screenshot as feed crates and finches over the mountains.

   The ride and the market trip are full-bleed and mostly covered it, but
   only mostly, and anything that painted after them leaked the same way.

   So: while any scene owns the screen, every farm layer is hidden and put
   back afterwards. It is applied every frame rather than once at the start,
   because render() rebuilds those groups from scratch and a one-shot hide
   is undone by the next repaint — the same trap that broke the wing
   animation and the market bar.

   ALSO HERE: a switch for the birds in Settings, for anyone who would
   rather have a quiet sky, and an icon on the champions button, which was
   the only one in the row wearing a bolt of lightning for no reason.
   ===================================================================== */

/* the farm's own layers, all siblings of whatever scene is running */
const FARM_LAYERS = ['obs','joins','herd','people','birds','you',
                     'birdlay','nestlay','burnlay','ballay','dragonlay'];
const FARM_LAYER_CLASSES = ['roadlay'];

/* All three scenes cover the world by design — p107 draws the arena
   backdrop across the whole of it for the duration of the duel, and the
   ride and the market trip are full-bleed overlays. The farm was never
   showing through because a scene was too small; it was showing through
   because it paints after, on layers that sit above.

   So the question is only "is a scene on", and the game already knows:
   p104 keeps duelActive(). Ask it rather than measuring rectangles — the
   answer is authoritative, costs nothing, and does not depend on a window
   having a size, which is not guaranteed in an embedded host. */
const FULL_BLEED = ['ridelay','mktlay'];
function sceneRunning(){
  for(const id of FULL_BLEED){
    const el = document.getElementById(id);
    if(el && el.children.length) return id;
  }
  try{ if(typeof duelActive === 'function' && duelActive()) return 'duellay'; }catch(e){}
  return null;
}

let SHROUD_ON = null;
function applyShroud(){
  const scene = sceneRunning();
  if(!scene && !SHROUD_ON) return;                 /* nothing to do, the common case */
  const hide = !!scene;
  FARM_LAYERS.forEach(id=>{
    if(id === scene) return;                       /* never hide the scene itself */
    const el = document.getElementById(id);
    if(!el) return;
    if(hide){ if(el.style.display !== 'none'){ el.dataset.shrouded = '1'; el.style.display = 'none'; } }
    else if(el.dataset.shrouded){ delete el.dataset.shrouded; el.style.display = ''; }
  });
  FARM_LAYER_CLASSES.forEach(cls=>{
    document.querySelectorAll('#fg .' + cls).forEach(el=>{
      if(hide){ el.dataset.shrouded = '1'; el.style.display = 'none'; }
      else if(el.dataset.shrouded){ delete el.dataset.shrouded; el.style.display = ''; }
    });
  });
  SHROUD_ON = scene;
}

/* every frame, because render() rebuilds these groups underneath us */
if(typeof render === 'function'){
  const _renderShroud = render;
  render = function(){ const r = _renderShroud.apply(this, arguments); try{ applyShroud(); }catch(e){} return r; };
}
if(typeof tickPeople === 'function'){
  const _tickShroud = tickPeople;
  tickPeople = function(){ const r = _tickShroud.apply(this, arguments); try{ applyShroud(); }catch(e){} return r; };
}

/* ---------- a switch for the birds ---------- */
(function birdSetting(){
  if(typeof SETTINGS === 'undefined' || SETTINGS.find(s=>s.k === 'birdsOn')) return;
  const near = SETTINGS.findIndex(s=>s.k === 'critters');
  const entry = { k:'birdsOn', def:true, t:'bool', g:'Look',
    n:'Birds', d:'Finches, martins and the rest, with their nests, eggs and squabbles. Off leaves a quiet sky.' };
  if(near >= 0) SETTINGS.splice(near+1, 0, entry); else SETTINGS.push(entry);
})();

function birdsEnabled(){
  try{ return SET('birdsOn') !== false; }catch(e){ return true; }
}

/* off means off: they stop thinking and they stop being drawn */
if(typeof tickFlock === 'function'){
  const _flockSw = tickFlock;
  tickFlock = function(){
    if(!birdsEnabled()){
      ['birdlay','nestlay'].forEach(id=>{
        const el = document.getElementById(id);
        if(el && el.style.display !== 'none') el.style.display = 'none';
      });
      const g = document.getElementById('birds');
      if(g && g.style.display !== 'none') g.style.display = 'none';
      return;
    }
    ['birdlay','nestlay','birds'].forEach(id=>{
      const el = document.getElementById(id);
      if(el && el.style.display === 'none' && !el.dataset.shrouded) el.style.display = '';
    });
    return _flockSw.apply(this, arguments);
  };
}
if(typeof tickBirdLife === 'function'){
  const _lifeSw = tickBirdLife;
  tickBirdLife = function(){ if(!birdsEnabled()) return; return _lifeSw.apply(this, arguments); };
}
if(typeof birdPopTick === 'function'){
  const _popSw = birdPopTick;
  birdPopTick = function(){ if(!birdsEnabled()) return; return _popSw.apply(this, arguments); };
}
if(typeof syncWorldButtons === 'function'){
  const _syncSw = syncWorldButtons;
  syncWorldButtons = function(){
    const r = _syncSw.apply(this, arguments);
    try{
      const b = document.getElementById('feedbirdbtn');
      if(b && !birdsEnabled()) b.style.display = 'none';
      /* the champions button was the only one in the row without a picture
         of what it does */
      const d = document.getElementById('duelbtn');
      if(d && d.textContent !== '⚔️'){ d.textContent = '⚔️'; }
    }catch(e){}
    return r;
  };
}

/* ---------- handle ---------- */
G.shroudAudit = function(){
  const scene = sceneRunning();
  const leaking = scene ? FARM_LAYERS.filter(id=>{
    const el = document.getElementById(id);
    return el && el.children.length && getComputedStyle(el).display !== 'none';
  }) : [];
  return {
    sceneRunning: scene || 'none',
    farmLayersHidden: FARM_LAYERS.filter(id=>{
      const el = document.getElementById(id); return el && el.style.display === 'none';
    }),
    stillVisibleDuringScene: leaking,
    duelActive: (()=>{ try{ return duelActive(); }catch(e){ return 'unknown'; } })(),
    birdsOn: birdsEnabled(),
    duelButtonIcon: (document.getElementById('duelbtn')||{}).textContent || 'no button',
  };
};
