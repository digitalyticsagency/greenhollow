/* =====================================================================
   PHASE 3 — THE TOP BAR, REORGANISED

   Twenty-two buttons in one undifferentiated row, every one at the same
   visual weight, with Delete sitting a few pixels from Save and two
   separate controls both labelled Market.

   They arrive from seven different files - p1_head, p23_fixes3,
   p31_storm, p38_work_ui, p39_market, p40_neglect, p42_fun_guests,
   p48_fixes4 - each appending to .tools whenever it happens to load.
   Rewriting seven injection sites to emit into the right container
   would be brittle and would break the next time something new is
   added. So this moves the existing nodes instead: every handler,
   tooltip and id travels with its element, and nothing is recreated.

   Four groups, three weight tiers:

     Tier 1  money and level, then playback - the things you look at and
             press constantly
     Tier 2  world state and the two view toggles - reference, uniform
             icon size, quieter
     Tier 3  everything rare or destructive, behind an overflow menu:
             save/load/export/undo/delete/new, the five weather forcing
             buttons, help and the unlock code

   Donate and Market stay out of the overflow, right-aligned as their
   own pair, because they are destinations rather than utilities.
   ===================================================================== */

/* Which group each button belongs to, by id or by the text it carries.
   Anything not listed falls through to the overflow, which is the safe
   default: a new button shows up somewhere sensible rather than
   crowding the primary row. */
const HDR_PLAN = {
  playback: ['spd1','spd2','spd3'],
  view:     ['roofbtn','sndBtn'],
  going:    ['mktbtn','gotomkt'],
  money:    ['donatebtn'],
};
/* buttons with no id are matched on their label */
const HDR_OVERFLOW_LABELS = ['Save','⤓','⤒','Delete','New','?','💾','⟲','☀️','🌧️','⛈️','❄️','🔥'];

function hdrGroupFor(btn){
  const id = btn.id || '';
  for(const g in HDR_PLAN) if(HDR_PLAN[g].indexOf(id) >= 0) return g;
  if(id === 'codebtn') return 'more';
  const label = (btn.textContent || '').trim();
  if(HDR_OVERFLOW_LABELS.indexOf(label) >= 0) return 'more';
  return 'more';
}

function buildHeader(){
  const tools = document.querySelector('#top .tools');
  if(!tools || document.getElementById('hdrPlayback')) return false;

  /* collect every control currently in the bar, including the ones
     wrapped in the saveMenu span */
  const btns = Array.from(tools.querySelectorAll('button'));
  if(btns.length < 6) return false;             /* injectors not finished yet */

  const mk = (id, cls)=>{ const d = document.createElement('div'); d.id = id; d.className = cls; return d; };
  const gPlay  = mk('hdrPlayback', 'tgroup tgroup-seg');
  const gView  = mk('hdrView',     'tgroup');
  const gGo    = mk('hdrGo',       'tgroup tgroup-right');
  const gMore  = mk('hdrMoreWrap', 'tgroup');

  const menu = document.createElement('div');
  menu.id = 'hdrMenu'; menu.className = 'hdrmenu'; menu.hidden = true;

  const moreBtn = document.createElement('button');
  moreBtn.className = 'tbtn'; moreBtn.id = 'hdrMore'; moreBtn.type = 'button';
  moreBtn.textContent = '⋯';
  moreBtn.setAttribute('aria-haspopup', 'true');
  moreBtn.setAttribute('aria-expanded', 'false');
  moreBtn.setAttribute('data-tip', "<b>More</b>Saving, files, help and the sandbox weather controls.");

  /* sort what is already there */
  btns.forEach(b=>{
    const g = hdrGroupFor(b);
    if(g === 'playback')   gPlay.appendChild(b);
    else if(g === 'view')  gView.appendChild(b);
    else if(g === 'going') gGo.appendChild(b);
    else if(g === 'money') gGo.appendChild(b);
    else                   menu.appendChild(b);
  });

  /* the two Market controls do different things and were both just
     labelled "Market". One opens the market, one flies the camera to it. */
  const mkt = document.getElementById('mktbtn');
  const goto = document.getElementById('gotomkt');
  if(mkt){ mkt.textContent = 'Market';
           mkt.setAttribute('data-tip', "<b>Open the market</b>Trade, contracts and the five-day fair."); }
  if(goto){ goto.textContent = '⇢';
            goto.classList.add('icon-only');
            goto.setAttribute('data-tip', "<b>Go to the market</b>Moves the camera there without opening anything."); }
  /* donate reads as an action, not a utility */
  const don = document.getElementById('donatebtn');
  if(don) don.classList.add('accent');

  /* group the weather-forcing buttons inside the menu under a heading,
     since five emoji in a list is not self-explanatory */
  const wx = Array.from(menu.querySelectorAll('button'))
    .filter(b=>['☀️','🌧️','⛈️','❄️','🔥'].indexOf((b.textContent||'').trim()) >= 0);
  if(wx.length){
    const hd = document.createElement('div');
    hd.className = 'hdrmenu-h'; hd.textContent = 'Force the weather';
    const row = document.createElement('div'); row.className = 'hdrmenu-row';
    wx.forEach(b=>row.appendChild(b));
    menu.appendChild(hd); menu.appendChild(row);
  }
  /* a heading over the file actions, which are the dangerous ones */
  const fileBtns = Array.from(menu.children).filter(el=>el.tagName === 'BUTTON');
  if(fileBtns.length){
    const hd = document.createElement('div');
    hd.className = 'hdrmenu-h'; hd.textContent = 'Farm and files';
    menu.insertBefore(hd, fileBtns[0]);
  }

  gMore.appendChild(moreBtn); gMore.appendChild(menu);

  tools.innerHTML = '';
  tools.appendChild(gPlay);
  tools.appendChild(gView);
  tools.appendChild(gGo);
  tools.appendChild(gMore);

  /* open / close */
  function setOpen(on){
    menu.hidden = !on;
    moreBtn.classList.toggle('on', on);
    moreBtn.setAttribute('aria-expanded', on ? 'true' : 'false');
  }
  /* pointerdown, not click. The world's pan handler takes pointer capture
     on pointerdown, and a real mouse press on the toggle was opening the
     menu and then having it shut again before the next frame - the same
     family of problem that made the UFO unshootable and the stray
     un-pickable. Toggling on pointerdown and ignoring pointerdown that
     originated inside the group is stable. */
  moreBtn.addEventListener('pointerdown', e=>{
    e.preventDefault(); e.stopPropagation();
    setOpen(menu.hidden);
  });
  document.addEventListener('pointerdown', e=>{
    if(!gMore.contains(e.target)) setOpen(false);
  }, true);
  document.addEventListener('keydown', e=>{ if(e.key === 'Escape') setOpen(false); });
  /* a button inside the menu closes it, so the menu is not left hanging
     over the farm after you press Save */
  menu.addEventListener('click', e=>{ if(e.target.closest('button')) setOpen(false); });
  /* the menu's own buttons must not be treated as an outside press */
  menu.addEventListener('pointerdown', e=>{ e.stopPropagation(); });

  /* cash and level are what you actually watch */
  const cells = document.querySelectorAll('#stats .stat');
  if(cells[0]) cells[0].classList.add('stat-cash');
  if(cells[1]) cells[1].classList.add('stat-lvl');

  return true;
}

/* Several injectors do NOT target .tools. They do:
       const bar = document.querySelector('.tbtn').parentElement;
   - find the first toolbar button anywhere in the document and use its
   parent. Once the bar is grouped, that resolves to #hdrPlayback, so
   Roof, Donate, Market, Code and the five weather buttons all inserted
   themselves into the playback segment. Watching only .tools' direct
   children missed it completely, because the mutation happened one
   level down.

   So: watch the whole subtree and re-file anything that lands in the
   wrong group. Re-filing is itself a mutation, hence the already-correct
   check to stop it chasing its own tail. */
function hdrTargetFor(btn){
  const g = hdrGroupFor(btn);
  if(g === 'playback') return document.getElementById('hdrPlayback');
  if(g === 'view')     return document.getElementById('hdrView');
  if(g === 'going' || g === 'money') return document.getElementById('hdrGo');
  return document.getElementById('hdrMenu');
}
/* Cosmetics that must be re-applied, because the buttons they target
   are injected after buildHeader has already run once. Written to be
   safe to call repeatedly. */
/* An icon is fine in a horizontal bar where position carries meaning.
   In a vertical dropdown it is just a glyph - the menu was reading
   "?", "💾", "⟲", "⤓", "⤒" down the left edge. Each gets a word.
   This lives in hdrPolish rather than buildHeader because buildHeader
   runs exactly once, before half these buttons have been injected -
   the same timing trap that ate the Market relabel. */
const HDR_MENU_LABELS = {
  '?':'How to play', '💾':'Save now', '⟲':'Reset the farm',
  '⤓':'Download a save file', '⤒':'Load a save file',
  '🔊':'Sound', '🔇':'Sound', '⇢':'Go to the market', 'Roof':'Lift the roof',
};
/* A button that leaves the menu for the bar must shed its word again,
   or it comes back reading "RoofLift the roof" and blows out the bar
   width. Verified by stubbing innerWidth wide and watching them return. */
function hdrUnlabel(b){
  const ic = b.querySelector('.hdricon');
  if(!ic) return;
  const raw = ic.textContent;
  b.textContent = raw;
}
function hdrStripBarLabels(){
  document.querySelectorAll('#top .tools button .hdrlabel').forEach(sp=>{
    const b = sp.closest('button');
    if(b && !b.closest('#hdrMenu')) hdrUnlabel(b);
  });
}

function hdrLabelMenu(){
  const menu = document.getElementById('hdrMenu');
  if(!menu) return;
  Array.from(menu.querySelectorAll('button')).forEach(b=>{
    if(b.querySelector('.hdrlabel')) return;
    if(b.closest('.hdrmenu-row')) return;          /* the weather row stays icons */
    const raw = (b.textContent || '').trim();
    const word = HDR_MENU_LABELS[raw];
    if(!word) return;
    b.textContent = '';
    const ic = document.createElement('span'); ic.className = 'hdricon'; ic.textContent = raw;
    const tx = document.createElement('span'); tx.className = 'hdrlabel'; tx.textContent = word;
    b.appendChild(ic); b.appendChild(tx);
  });
}

function hdrPolish(){
  /* Relabel first, THEN label the menu. The other way round left the
     go-to-market button one pass behind forever: labelling ran while it
     still read "⇢ Market", the relabel then shortened it to "⇢", and the
     label pass had already gone. */
  const goto = document.getElementById('gotomkt');
  if(goto && goto.textContent.trim() !== '⇢' && !goto.querySelector('.hdrlabel')){
    goto.textContent = '⇢';
    goto.classList.add('icon-only');
    goto.setAttribute('data-tip', "<b>Go to the market</b>Moves the camera there without opening anything.");
  }
  /* before the early return further down, which was skipping it */
  hdrLabelMenu();
  hdrStripBarLabels();
  const mkt = document.getElementById('mktbtn');
  if(mkt) mkt.setAttribute('data-tip', "<b>Open the market</b>Trade, contracts and the five-day fair.");
  const don = document.getElementById('donatebtn');
  if(don) don.classList.add('accent');

  /* collect the weather buttons into their own labelled row */
  const menu = document.getElementById('hdrMenu');
  if(!menu) return;
  let row = menu.querySelector('.hdrmenu-row');
  const wx = Array.from(menu.querySelectorAll('button'))
    .filter(b=>['☀️','🌧️','⛈️','❄️','🔥'].indexOf((b.textContent||'').trim()) >= 0)
    .filter(b=>!b.parentElement.classList.contains('hdrmenu-row'));
  if(!wx.length) return;
  if(!row){
    const hd = document.createElement('div');
    hd.className = 'hdrmenu-h'; hd.textContent = 'Force the weather';
    row = document.createElement('div'); row.className = 'hdrmenu-row';
    menu.appendChild(hd); menu.appendChild(row);
  }
  wx.forEach(b=>row.appendChild(b));
  /* the funbar wrapper is empty once its buttons are rehomed */
  const fb = document.getElementById('funbar');
  if(fb && !fb.querySelector('button')) fb.remove();
}

function refileStrays(){
  const tools = document.querySelector('#top .tools');
  if(!tools) return;
  Array.from(tools.querySelectorAll('button.tbtn')).forEach(b=>{
    if(b.id === 'hdrMore') return;
    const want = hdrTargetFor(b);
    if(!want) return;
    /* a button inside the weather row of the menu is already home */
    if(b.parentElement && b.parentElement.classList.contains('hdrmenu-row')) return;
    /* ...and so is one the responsive spill deliberately parked there.
       Without this, refile and hdrResponsive fight: the spill moves a
       button into the menu, the observer fires, and refile puts it back
       into a group that is display:none at this width - unreachable. */
    if(b.closest && b.closest('#hdrSpill')) return;
    if(b.parentElement === want) return;
    /* keep the funbar span together rather than scattering its buttons */
    const grp = b.parentElement && b.parentElement.id === 'funbar' ? b.parentElement : b;
    if(grp.parentElement === want) return;
    want.appendChild(grp);
  });
  hdrPolish();
}
function watchHeader(){
  const tools = document.querySelector('#top .tools');
  if(!tools) return;
  let queued = false;
  new MutationObserver(()=>{
    if(queued) return;
    queued = true;
    requestAnimationFrame(()=>{ queued = false; refileStrays(); });
  }).observe(tools, {childList:true, subtree:true});
}

/* the injectors all use timers of their own; poll briefly rather than
   guess a delay that is long enough today and too short tomorrow */
(function initHeader(){
  /* the injectors fire on their own timers, the latest around 420ms.
     Wait for the button count to stop changing rather than guessing a
     delay that is right today and wrong after the next part lands. */
  let last = -1, stable = 0, tries = 0;
  const t = setInterval(()=>{
    tries++;
    const n = document.querySelectorAll('#top .tools button').length;
    stable = (n === last) ? stable + 1 : 0;
    last = n;
    if((stable >= 3 && n >= 6) || tries > 60){
      clearInterval(t);
      buildHeader();
      watchHeader();
      refileStrays();
      setTimeout(()=>{ refileStrays(); hdrResponsive(); }, 800);   /* anything very late */
    }
  }, 120);
})();

(function headerCss(){
  const s = document.createElement('style');
  s.textContent = `
  /* one gap inside a group, a bigger one plus a rule between groups */
  #top .tools{ display:flex; align-items:center; gap:14px; }
  #top .tgroup{ display:flex; align-items:center; gap:6px; position:relative; }
  #top .tgroup + .tgroup{ padding-left:14px; border-left:1px solid var(--line); }
  #top .tgroup-right{ margin-left:auto; }

  /* one hit target for every control in the bar */
  #top .tools .tbtn{ min-width:32px; height:32px; padding:0 9px; display:inline-flex;
    align-items:center; justify-content:center; }
  #top .tools .tbtn.icon-only{ padding:0; width:32px; }

  /* playback reads as one control, not three loose buttons */
  #top .tgroup-seg{ gap:0; background:rgba(0,0,0,.22); border:1px solid var(--line);
    border-radius:9px; padding:2px; }
  #top .tgroup-seg .tbtn{ border:0; background:transparent; border-radius:7px; height:28px; }
  #top .tgroup-seg .tbtn.on{ background:rgba(124,194,79,.20); color:#dff0d2; }

  /* donate is an action, so it may look like one */
  #top .tbtn.accent{ background:rgba(221,111,156,.16); border-color:rgba(221,111,156,.4); }
  #top .tbtn.accent:hover{ background:rgba(221,111,156,.26); }

  /* cash and level carry the most weight in the stat row */
  #stats .stat-cash b{ font-size:15px; }
  #stats .stat-cash{ background:rgba(240,193,75,.10); border-color:rgba(240,193,75,.28); }
  #stats .stat-lvl b{ font-size:13.5px; }

  /* the overflow */
  .hdrmenu{ position:absolute; top:38px; right:0; min-width:212px; z-index:9500;
    background:#1e2718; background-image:linear-gradient(rgba(28,37,22,.98),rgba(22,30,17,.99));
    border:1px solid var(--line2); border-radius:11px; padding:7px;
    box-shadow:0 14px 40px rgba(0,0,0,.55); display:flex; flex-direction:column; gap:3px; }
  .hdrmenu[hidden]{ display:none; }
  .hdrmenu .tbtn{ width:100%; justify-content:flex-start !important; height:32px !important;
    background:transparent; border:0; text-align:left; gap:9px; padding:0 9px; }
  .hdrmenu .hdricon{ width:17px; display:inline-flex; justify-content:center; flex:0 0 auto; opacity:.9; }
  .hdrmenu .hdrlabel{ font-size:12.5px; }
  .hdrmenu .tbtn:hover{ background:rgba(255,255,255,.09); }
  .hdrmenu .tbtn.danger{ color:#f0a898; }
  .hdrmenu .tbtn.danger:hover{ background:rgba(226,112,92,.16); }
  .hdrmenu-h{ font-size:10px; letter-spacing:.08em; text-transform:uppercase;
    color:var(--ink3); padding:7px 8px 3px; }
  .hdrmenu-row{ display:flex; gap:4px; padding:0 4px 3px; }
  .hdrmenu-row .tbtn{ width:34px !important; justify-content:center !important; }

  /* The bar did not shrink. Measured at a 288px viewport: #top was
     1355px wide, so the overflow button, Market and Donate all sat off
     the right-hand edge with no way to reach them. Flex children will
     not shrink past their content unless min-width:0 says they may, and
     nothing did. The stats are the elastic part - they scroll; the
     controls are pinned so they are always reachable. */
  /* #app is a grid and #top is a grid item; grid items default to
     min-width:auto, which refuses to shrink below content size. That is
     why the bar measured 1114px inside a 288px column. */
  #top{ gap:10px; min-width:0; }
  #top .brand{ flex:0 0 auto; }
  #top .stats{ flex:1 1 auto; min-width:0; overflow-x:auto; scrollbar-width:thin; }
  #top .stats::-webkit-scrollbar{ height:4px; }
  #top .stats::-webkit-scrollbar-thumb{ background:rgba(255,255,255,.18); border-radius:2px; }
  #top .tools{ flex:0 0 auto; }

  @media(max-width:980px){
    #top .tools{ gap:8px; }
    #top .tgroup + .tgroup{ padding-left:8px; }
    #top .tgroup-right{ margin-left:0; }
    .hdrmenu{ right:-4px; }
  }
  /* very narrow: keep only playback and the overflow, and let the menu
     hold everything else rather than pushing it off the screen */
  @media(max-width:620px){
    #top .brand h1, #top .brand span{ display:none; }
    #top #hdrView, #top #hdrGo{ display:none; }
    #top .tgroup + .tgroup{ padding-left:8px; }
    .hdrmenu{ position:fixed; right:8px; top:52px; max-height:70vh; overflow-y:auto; }
  }
  @media (prefers-reduced-motion: reduce){ .hdrmenu{ transition:none; } }
  `;
  document.head.appendChild(s);
})();

/* Below 620px the view and destination groups are hidden to stop the bar
   overflowing, so their buttons have to live in the menu instead - a
   control you cannot reach is worse than a crowded bar. */
function hdrResponsive(){
  const narrow = window.innerWidth <= 620;
  const menu = document.getElementById('hdrMenu');
  const gView = document.getElementById('hdrView');
  const gGo   = document.getElementById('hdrGo');
  if(!menu || !gView || !gGo) return;
  let spill = document.getElementById('hdrSpill');
  if(narrow){
    if(!spill){
      spill = document.createElement('div');
      spill.id = 'hdrSpill';
      const hd = document.createElement('div');
      hd.className = 'hdrmenu-h'; hd.textContent = 'View and places';
      spill.appendChild(hd);
      menu.insertBefore(spill, menu.firstChild);
    }
    Array.from(gView.children).concat(Array.from(gGo.children))
      .forEach(b=>{ if(b.tagName === 'BUTTON') spill.appendChild(b); });
  } else if(spill){
    Array.from(spill.querySelectorAll('button')).forEach(b=>{
      const t = hdrTargetFor(b);
      if(t && t !== menu) t.appendChild(b);
    });
    spill.remove();
  }
}
window.addEventListener('resize', ()=>{ try{ hdrResponsive(); }catch(e){} });

/* ---------- handles ---------- */
G.headerCheck = function(){
  const grab = id => Array.from((document.getElementById(id)||{children:[]}).children)
    .filter(e=>e.tagName === 'BUTTON').map(e=>(e.textContent||'').trim() || e.id);
  const menu = document.getElementById('hdrMenu');
  return {
    playback: grab('hdrPlayback'),
    view:     grab('hdrView'),
    destinations: grab('hdrGo'),
    overflow: menu ? Array.from(menu.querySelectorAll('button')).map(b=>(b.textContent||'').trim()) : [],
    looseInBar: Array.from(document.querySelectorAll('#top .tools > button')).map(b=>b.id || b.textContent.trim()),
    menuOpen: menu ? !menu.hidden : null,
  };
};
