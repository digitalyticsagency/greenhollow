/* =====================================================================
   FOURTEEN BUTTONS IN A COLUMN IS NOT A MENU

   Every feature added this year hung another icon on the right-hand rail:
   birds, dog, dragon, champions, fox, market, reel, cameras, household,
   whose-day, the people here, working visitors, the yard, the herd book,
   the drone, ask. Measured: twenty buttons, fifteen of them showing, a
   column 550 pixels tall running off the bottom of the screen — and every
   one of them a bare emoji with no label, so even the ones you could see
   were a guessing game.

   They go in a drawer. One button on the rail opens a panel with all of
   them written out in words, grouped by what they are for, with a line of
   explanation each. Zoom and the path brush stay on the rail, because
   those are used mid-gesture and a drawer would be in the way.

   IT STAYS HONEST ABOUT WHAT YOU HAVE. Each entry is shown only when the
   underlying button is — no drone until you own one, no herd book until
   there is stock. The drawer reads the real buttons rather than keeping
   its own list, so a module added tomorrow appears in it without knowing
   this file exists, and clicking an entry clicks the real button, so
   every handler keeps working untouched.

   AND IT IS REACHABLE. Real buttons with real names, tab order, Escape to
   close, and a keyboard shortcut on the drawer itself. The old rail could
   not be reached by anyone who could not see a 32 pixel emoji.
   ===================================================================== */

/* the rail keeps what you use mid-gesture; everything else goes inside */
const DOCK_KEEP = ['brushBtn'];
const DOCK_GROUPS = [
  { n:'The land', ids:['feedbirdbtn','herdbtn','dogplaybtn','summonbtn'] },
  { n:'The people', ids:['dollbtn','mindbtn','pabtn','wwoofbtn'] },
  { n:'Machines and eyes', ids:['dronebtn','machbtn','cambtn','reelbtn'] },
  { n:'Away from the farm', ids:['mktgobtn','ridebtn','duelbtn'] },
  { n:'Anything else', ids:['askbtn'] },
];
/* a plain-English name and line for each, since the buttons carry emoji */
const DOCK_TEXT = {
  feedbirdbtn:['The birds','Grain, water, nest boxes, and who knows you.'],
  herdbtn:['The herd book','Every animal by tag, age, dam and condition.'],
  dogplaybtn:['The dog','Call her out and find something to do.'],
  summonbtn:['Call something in','Wildlife onto the land — the dog will see it off.'],
  dollbtn:['Who is where','Everyone, by the room they are actually in.'],
  mindbtn:['The people here','What they think, what they want, what you can do.'],
  pabtn:['Whose day is it','Take somebody else’s hands for a while.'],
  wwoofbtn:['Working visitors','Someone for the season, for board and food.'],
  dronebtn:['The drone','Fly it. Crop, stock, roof and thermal surveys.'],
  machbtn:['The yard','Own, hire or share a ute — and keep it running.'],
  cambtn:['Cameras','Live from every post, and what has gone past.'],
  reelbtn:['The farm reel','Film the place while you play, then watch it back.'],
  mktgobtn:['The market','Load the family in and drive down.'],
  ridebtn:['The dragon','Tell it to do something.'],
  duelbtn:['Something to watch','Two champions, or two wyrms.'],
  askbtn:['Ask the farm','Why the money moved, what the crops are doing.'],
};

function dockHost(){ return document.getElementById('zoomctl'); }
function dockManaged(){
  const host = dockHost(); if(!host) return [];
  return [...host.children].filter(el=>el.id && el.id !== 'dockbtn'
    && !DOCK_KEEP.includes(el.id));
}
/* A button counts as offered if its own module wants it shown. That has to
   be read at the one moment it is true: immediately after syncWorldButtons
   has run and before this file hides anything. Reading it later sees only
   our own hiding and reports the whole drawer as unavailable — which is
   exactly what the first version did, and why the drawer came up empty
   with sixteen buttons tucked into it. */
function dockOffered(el){ return el && el.dataset.dockWas !== 'none'; }

/* called straight after the modules have had their say */
function dockCapture(){
  const host = dockHost(); if(!host) return;
  dockManaged().forEach(el=>{
    el.dataset.dockWas = (el.style.display === 'none' && el.dataset.dockHidden === undefined)
      ? 'none' : (el.dataset.dockHidden === undefined ? '' : el.dataset.dockWas || '');
    /* first sight of this button: whatever it is showing now is the truth */
    if(el.dataset.dockHidden === undefined){
      el.dataset.dockWas = el.style.display === 'none' ? 'none' : '';
      el.dataset.dockHidden = '1';
    } else {
      /* afterwards the module still speaks by setting display each sync */
      if(el.style.display !== 'none') el.dataset.dockWas = '';
    }
    el.style.display = 'none';
  });
}

/* keep the rail button present and its count current; never touches dockWas */
function dockTidy(){
  const host = dockHost(); if(!host) return;
  dockManaged().forEach(el=>{ el.style.display = 'none'; });
  let btn = document.getElementById('dockbtn');
  if(!btn){
    btn = document.createElement('button');
    btn.id = 'dockbtn';
    btn.textContent = '☰';
    btn.title = 'Everything you can do  (E)';
    btn.setAttribute('aria-label', 'Everything you can do');
    btn.setAttribute('data-tip','<b>Everything you can do</b>All the farm\u2019s tools, written out.<span class="tg">Key: E</span>');
    btn.onclick = ()=>G.openDock();
    host.insertBefore(btn, host.firstChild);
  }
  btn.dataset.count = dockManaged().filter(dockOffered).length;
}

G.openDock = function(){
  dockTidy();
  const have = {};
  dockManaged().forEach(el=>{ have[el.id] = dockOffered(el); });
  const groups = DOCK_GROUPS.map(g=>({
    n: g.n,
    items: g.ids.filter(id=>have[id]),
  })).filter(g=>g.items.length);
  /* anything a later module added that this file has never heard of */
  const known = new Set(DOCK_GROUPS.flatMap(g=>g.ids));
  const extra = Object.keys(have).filter(id=>have[id] && !known.has(id));
  if(extra.length) groups.push({ n:'New', items:extra });

  const cell = (id)=>{
    const el = document.getElementById(id);
    const txt = DOCK_TEXT[id] || [ (el && el.title) || id, '' ];
    const icon = el ? (el.textContent || '').trim() : '';
    return `<button class="dockitem" onclick="G.dockGo('${id}')">
      <span class="dockicon" aria-hidden="true">${icon}</span>
      <span class="dockmain"><b>${txt[0]}</b><span class="muted">${txt[1]}</span></span>
    </button>`;
  };
  modal(`<h2>Everything you can do</h2>
    <p class="sub">The tools that were stacked down the side of the screen. Only what you
      actually have is listed.</p>
    ${groups.map(g=>`<h3 class="dockgroup">${g.n}</h3>
      <div class="dockgrid">${g.items.map(cell).join('')}</div>`).join('')}
    ${groups.length ? '' : `<p class="sub">Nothing here yet — build something and it will appear.</p>`}
    <div class="mfoot"><button class="btn ghost" onclick="G.closeModal()">Close</button></div>`);
};
G.dockGo = function(id){
  const el = document.getElementById(id);
  G.closeModal();
  if(!el) return;
  /* the real button, with the real handler its own module attached */
  const was = el.style.display;
  el.style.display = '';
  try{ el.click(); }
  finally{ el.style.display = was; }
};

/* modules add their buttons through syncWorldButtons, so tidy after it */
if(typeof syncWorldButtons === 'function'){
  const _syncDock = syncWorldButtons;
  syncWorldButtons = function(){
    const r = _syncDock.apply(this, arguments);
    try{ dockCapture(); dockTidy(); }catch(e){}
    return r;
  };
}
setTimeout(()=>{ try{ dockCapture(); dockTidy(); }catch(e){} }, 600);
setTimeout(()=>{ try{ dockCapture(); dockTidy(); }catch(e){} }, 2400);

document.addEventListener('keydown', (e)=>{
  if(e.key !== 'e' && e.key !== 'E') return;
  const t = e.target;
  if(t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
  if(typeof DRONE === 'object' && DRONE.on) return;      /* flying: E is not a menu */
  e.preventDefault();
  const open = !!document.getElementById('dockbtn') && document.querySelector('.dockgrid');
  if(open) G.closeModal(); else G.openDock();
});

(function dockCss(){
  const s = document.createElement('style');
  s.textContent = `
  #dockbtn{ font-size:16px; line-height:1; position:relative }
  #dockbtn::after{ content:attr(data-count); position:absolute; top:-3px; right:-3px;
    min-width:15px; height:15px; padding:0 3px; border-radius:8px;
    background:var(--green,#7cc24f); color:#12180f; font:700 9.5px/15px var(--font,sans-serif);
    text-align:center }
  #dockbtn[data-count="0"]::after{ display:none }
  .dockgroup{ margin:14px 0 7px; font-size:11px; letter-spacing:.09em; text-transform:uppercase;
    color:var(--ink3,#75886a); font-weight:700 }
  .dockgrid{ display:grid; grid-template-columns:repeat(auto-fill,minmax(230px,1fr)); gap:8px }
  .dockitem{ display:flex; gap:10px; align-items:flex-start; text-align:left; padding:10px;
    border-radius:9px; background:var(--card,rgba(255,255,255,.05));
    border:1px solid var(--line2,#33402c); cursor:pointer; color:inherit; font:inherit }
  .dockitem:hover{ border-color:var(--green,#7cc24f); background:rgba(124,194,79,.12) }
  .dockitem:focus-visible{ outline:2px solid var(--gold,#f0c14b); outline-offset:2px }
  .dockicon{ font-size:19px; line-height:1.1; flex:0 0 auto; width:24px; text-align:center }
  .dockmain{ display:flex; flex-direction:column; gap:2px; min-width:0 }
  .dockmain b{ font-size:12.5px }
  .dockmain .muted{ font-size:11px; line-height:1.4; color:var(--ink3,#75886a) }
  `;
  document.head.appendChild(s);
})();

/* ---------- handle ---------- */
G.dockAudit = function(){
  const host = dockHost();
  const managed = dockManaged();
  return {
    onTheRail: host ? [...host.children].filter(el=>el.style.display !== 'none')
      .map(el=>el.id || '(zoom)') : [],
    railHeight: host ? Math.round(host.getBoundingClientRect().height) : 0,
    tuckedAway: managed.filter(el=>el.style.display === 'none').length,
    offeredInDrawer: managed.filter(dockOffered).length,
    notYetEarned: managed.filter(el=>!dockOffered(el)).map(el=>el.id),
    labelled: managed.filter(el=>DOCK_TEXT[el.id]).length + ' of ' + managed.length,
    wasBefore: '20 buttons, 15 showing, a 550px column with no labels',
  };
};
