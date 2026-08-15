/* =====================================================================
   TELLING THE DRAGON TO DO SOMETHING

   The dog got a menu on the land and four things to do on it. The dragon
   has had a mind since p108, three drives, a roost and a ride, and the
   only thing you have ever been able to ask it for is a ride. Everything
   else it decides.

   It gets the same treatment and none of the same games, because a dragon
   is not a big dog. Every one of these is something only a thing that
   flies and breathes fire could do, and every one of them feeds a drive
   it already had:

     Set a tree alight
                      pick one of your trees. It crosses the farm, hangs
                      over it and puts a jet of flame down, and the tree
                      CATCHES — it does not vanish. It burns for the best
                      part of half a minute, the crown blackening and
                      shrinking under the flames, sparks going up, until
                      there is nothing there but hot ground. Only trees
                      burn; soil does not catch, and burning the weeds off
                      a bed was a tidy little chore rather than a dragon
                      setting fire to something. It costs you the charm
                      the tree was providing, so it is a decision. Heat
                      has to go somewhere anyway — burning is the only
                      thing in p108 that discharges it.
     Hunt             it leaves the map entirely, is gone a while, and
                      comes back with something. Feed in the store, and
                      its hunger down. The one command that costs you
                      nothing and takes real time.
     Fly a circuit    a display over the farm, climbing and roaring. It
                      wants an audience — pride is a drive it cannot
                      satisfy on its own without you present — and the
                      farm's charm goes up while people watch it.
     Come down        it lands beside you.
     Back to the roost.
     Ride out         the existing ride, now on the same menu as the rest.

   IT ONLY TAKES ORDERS IF IT RATES YOU. Bond above 0.35, the same line
   p108 calls `listens` and the same one that gates the ride. Below it the
   dragon looks at you and does not move, and says so. A dog obeys because
   it loves you; a dragon obeys because it has decided to.

   Commands are read before dragonDecide and return early while they last
   — the shape p127 and p130 use for the dog — so nothing in p108 has to
   know these exist. The flame reuses d.flameT, which p114 already draws
   on its own layer, rather than a second fire of my own.
   ===================================================================== */

function dragonListens(){
  const d = S.dragon;
  return !!(d && (d.bond || 0) > 0.35);
}
function dragonWorldState(){
  if(!S.dragonworld) S.dragonworld = { day:-1, burns:0, hunts:0, shows:0 };
  if(S.dragonworld.day !== S.day){
    S.dragonworld.day = S.day; S.dragonworld.burns = 0;
    S.dragonworld.hunts = 0; S.dragonworld.shows = 0;
  }
  return S.dragonworld;
}
function dragonHandler(){
  if(S.you && S.you.x !== undefined) return { x:S.you.x, y:S.you.y };
  const r = (typeof roostSpot === 'function') ? roostSpot() : null;
  return r || { x:(FARM.x+3)*T, y:(FARM.y+3)*T };
}

let DRAGONAIM = false;

/* ---------- the menu ---------- */
function dragonMenuClose(){ const m = document.getElementById('dragonmenu'); if(m) m.remove(); }
G.dragonMenuClose = dragonMenuClose;

G.openDragonMenu = function(){
  const d = S.dragon;
  if(!d){ if(typeof toast==='function') toast('You have no dragon','bad'); return; }
  dragonMenuClose();
  const listens = dragonListens();
  const vp = document.getElementById('viewport') || document.body;
  const wr = document.getElementById('world').getBoundingClientRect();
  const vr = vp.getBoundingClientRect();

  const m = document.createElement('div');
  m.id = 'dragonmenu';
  m.innerHTML = `
    <div class="dragonmenu-h">${d.name}</div>
    ${listens ? `
      <button class="dragonmenu-b" onclick="G.dragonBurnStart()">🔥 Set a tree alight</button>
      <button class="dragonmenu-b" onclick="G.dragonHunt()">🍖 Go and hunt</button>
      <button class="dragonmenu-b" onclick="G.dragonShow()">🌀 Fly a circuit</button>
      <button class="dragonmenu-b" onclick="G.dragonCome()">✋ Come down</button>
      <button class="dragonmenu-b" onclick="G.dragonRoost()">🪨 Back to the roost</button>
      <button class="dragonmenu-b quiet" onclick="G.dragonMenuClose();G.rideDragon()">Ride out…</button>`
    : `<div class="dragonmenu-no">It looks at you and does not move.
        ${d.name} takes orders from somebody it rates — that is a bond above
        0.35, and yours is ${(d.bond||0).toFixed(2)}. Feed it, ride it, fly with it.</div>`}`;
  vp.appendChild(m);

  const anchor = (typeof roostSpot === 'function' && roostSpot()) || { x:d.x, y:d.y };
  const sx = anchor.x*cam.z + cam.x + wr.left - vr.left;
  const sy = anchor.y*cam.z + cam.y + wr.top  - vr.top;
  const w = 182, h = listens ? 224 : 130;
  m.style.left = Math.round(Math.max(8, Math.min(vr.width  - w - 8, sx + 14))) + 'px';
  m.style.top  = Math.round(Math.max(8, Math.min(vr.height - h - 8, sy - h/2))) + 'px';

  setTimeout(()=>{
    const away = (e)=>{ if(!m.contains(e.target)){ dragonMenuClose(); document.removeEventListener('mousedown', away, true); } };
    document.addEventListener('mousedown', away, true);
  }, 0);
};

/* ---------- commands ---------- */
function dragonCmd(c){
  const d = S.dragon; if(!d) return;
  /* every command funnels through here, so the paused-world wake goes
     here too — see wakeTheWorld in p130 */
  if(typeof G.wakeTheWorld === 'function') G.wakeTheWorld();
  d.cmd = c; d.task = null; d.taskT = 0;
  dragonMenuClose();
}

G.dragonCome = function(){
  const h = dragonHandler();
  dragonCmd({ mode:'come', x:h.x + 46, y:h.y - 24, t:0 });
  if(typeof toast === 'function') toast(`${S.dragon.name} is coming down`, '');
};
G.dragonRoost = function(){
  const r = (typeof roostSpot === 'function') ? roostSpot() : null;
  if(!r) return toast('There is no roost','bad');
  dragonCmd({ mode:'roost', x:r.x, y:r.y - 34, t:0 });
};
G.dragonShow = function(){
  const d = S.dragon;
  dragonCmd({ mode:'show', t:0, ph:0 });
  try{ G.bang('roar'); }catch(e){}
  if(typeof toast === 'function') toast(`${d.name} is showing off`, 'gold');
};
G.dragonHunt = function(){
  const d = S.dragon;
  dragonCmd({ mode:'hunt', t:0, stage:'out',
              x:(FARM.x + FARM.w + 9)*T, y:(FARM.y - 7)*T });
  if(typeof log === 'function') log(`${d.name} went out over the ridge to hunt.`, '', 'farm');
};

/* ---------- what will burn ----------
   Only trees. A bed of soil does not catch, and burning the weeds off one
   was a tidy little chore rather than a dragon setting fire to something.
   The three trees are the only things on this farm that are actually
   flammable, and losing one costs you the charm it was standing there
   providing — so this is a decision, not a free tidy-up. */
function isFlammable(o){
  const bp = BPMAP[o.bp];
  return !!(bp && /^tree_/.test(bp.art || ''));
}
function flammableAt(wx, wy){
  return (S.objs||[]).find(o=>{
    if(!isFlammable(o)) return false;
    const f = footprint(BPMAP[o.bp], o.rot);
    return wx >= o.tx*T && wx <= (o.tx+f.w)*T && wy >= o.ty*T && wy <= (o.ty+f.h)*T;
  });
}

G.dragonBurnStart = function(){
  const trees = (S.objs||[]).filter(isFlammable);
  if(!trees.length){ dragonMenuClose(); return toast('Nothing on the farm will burn — plant a tree','bad'); }
  dragonMenuClose();
  DRAGONAIM = true;
  document.body.classList.add('dragon-aiming');
  if(typeof toast === 'function') toast('Click a tree to set alight', 'good');
};

function dragonBurnAt(wx, wy){
  const tree = flammableAt(wx, wy);
  /* a miss keeps you aiming rather than silently dropping the whole
     command — trees are small and the cursor is a crosshair for a reason */
  if(!tree){ if(typeof toast === 'function') toast('That will not burn — click a tree, or Esc', 'bad'); return; }
  if(tree.alight){ if(typeof toast === 'function') toast('That one is already going','' ); return; }
  DRAGONAIM = false;
  document.body.classList.remove('dragon-aiming');
  const f = footprint(BPMAP[tree.bp], tree.rot);
  dragonCmd({ mode:'burn', treeId:tree.id, t:0,
              x:(tree.tx + f.w/2)*T, y:(tree.ty + f.h/2)*T - 30 });
}

/* ---------- a tree on fire ----------
   It does not vanish when the dragon breathes on it. It catches, burns
   for the best part of half a minute while the crown goes and the flames
   drop into the trunk, and then there is nothing there. Held on the
   object so it survives a render, and ticked with everything else. */
const BURN_DUR = 26;                 /* seconds from catching to gone */

function lightTree(o){
  if(!o || o.alight) return;
  o.alight = 0.0001;                 /* progress 0..1, truthy from the off */
}
function burnTick(dt){
  const objs = S.objs || [];
  let done = null;
  for(const o of objs){
    if(!o.alight) continue;
    o.alight = Math.min(1, o.alight + dt/BURN_DUR);
    if(o.alight >= 1) done = o;
  }
  if(done){
    const bp = BPMAP[done.bp];
    S.objs = objs.filter(x=>x !== done);
    S.embers = (S.embers || []).concat([{ x:(done.tx+1)*T, y:(done.ty+1)*T, t:0 }]);
    if(typeof log === 'function')
      log(`The ${(bp && bp.name || 'tree').toLowerCase()} burned down to nothing. The ground is still hot.`,
          'bad', 'farm');
    if(typeof render === 'function') try{ render(); }catch(e){}
    if(typeof ui === 'function') try{ ui(); }catch(e){}
  }
  if(S.embers && S.embers.length){
    S.embers.forEach(e=>e.t += dt);
    S.embers = S.embers.filter(e=>e.t < 40);
  }
}

/* flames drawn per frame in their own layer, so the scene is not rebuilt */
function paintBurn(){
  const alight = (S.objs||[]).filter(o=>o.alight);
  const embers = S.embers || [];
  let g = document.getElementById('burnlay');
  if(!alight.length && !embers.length){ if(g) g.remove(); return; }
  if(!g){
    const fg = document.getElementById('fg');
    if(!fg) return;
    g = document.createElementNS('http://www.w3.org/2000/svg','g');
    g.id = 'burnlay';
    g.setAttribute('pointer-events','none');
    fg.appendChild(g);
  }
  const now = (performance.now()/1000);
  let s = '';

  alight.forEach(o=>{
    const f = footprint(BPMAP[o.bp], o.rot);
    const cx = (o.tx + f.w/2)*T, cy = (o.ty + f.h/2)*T;
    const k = o.alight;
    /* the fire builds, holds, then falls into the trunk as the crown goes */
    const size = k < 0.25 ? k/0.25 : k > 0.75 ? Math.max(0.18, (1-k)/0.25) : 1;
    const h0 = (f.h*T) * (0.30 + 0.55*size);
    /* the crown darkens and shrinks under it */
    s += `<ellipse cx="${n(cx)}" cy="${n(cy - f.h*T*0.10)}" rx="${n(f.w*T*0.44*(1-k*0.45))}"
      ry="${n(f.h*T*0.34*(1-k*0.45))}" fill="#221610" opacity="${(0.20 + k*0.62).toFixed(2)}"/>`;
    /* tongues, each on its own wobble */
    for(let i=0;i<5;i++){
      const a = hash(i*3.7 + o.tx);
      const sway = Math.sin(now*(3.4 + a*2.6) + i*1.9) * (5 + a*4);
      const hh = h0 * (0.55 + a*0.5);
      const bx = cx + (i-2)*(f.w*T*0.13) + sway*0.35;
      const by = cy + f.h*T*0.16;
      const tongue = (sc, col, op)=>`<path d="M${n(bx-6*sc)} ${n(by)}
        Q${n(bx-3*sc+sway)} ${n(by-hh*0.55*sc)} ${n(bx+sway*1.1)} ${n(by-hh*sc)}
        Q${n(bx+3*sc+sway)} ${n(by-hh*0.55*sc)} ${n(bx+6*sc)} ${n(by)} Z"
        fill="${col}" opacity="${op}"/>`;
      s += tongue(1.0, '#e24a12', 0.55);
      s += tongue(0.68, '#ff9a2a', 0.80);
      s += tongue(0.36, '#ffe07a', 0.92);
    }
    /* sparks going up */
    for(let i=0;i<4;i++){
      const a = hash(i*5.1 + o.ty);
      const rise = ((now*(26 + a*30) + a*90) % 90);
      const ex = cx + (a-0.5)*f.w*T*0.7 + Math.sin(now*2 + i)*5;
      s += `<circle cx="${n(ex)}" cy="${n(cy - rise)}" r="${(1 + a*1.6).toFixed(1)}"
        fill="#ffc46a" opacity="${(0.75*(1 - rise/90)).toFixed(2)}"/>`;
    }
    /* the light it throws on the ground */
    s += `<ellipse cx="${n(cx)}" cy="${n(cy + f.h*T*0.30)}" rx="${n(f.w*T*0.75*size)}"
      ry="${n(f.h*T*0.30*size)}" fill="#ff8a3a" opacity="${(0.13*size).toFixed(3)}"/>`;
  });

  /* what is left afterwards, cooling for a while */
  embers.forEach(e=>{
    const k = 1 - e.t/40;
    s += `<ellipse cx="${n(e.x)}" cy="${n(e.y)}" rx="${n(T*0.62)}" ry="${n(T*0.42)}"
      fill="#1b1410" opacity="${(0.55*k).toFixed(3)}"/>`;
    for(let i=0;i<3;i++){
      const a = hash(i*2.3 + e.x);
      s += `<circle cx="${n(e.x + (a-0.5)*T*0.7)}" cy="${n(e.y + (hash(i+9)-0.5)*T*0.4)}"
        r="${(1.2 + a).toFixed(1)}" fill="#ff7a2a"
        opacity="${(0.5*k*(0.4 + 0.6*Math.abs(Math.sin(now*2 + i)))).toFixed(3)}"/>`;
    }
  });

  g.innerHTML = s;
}

(function dragonAimClick(){
  const host = document.getElementById('world') || document;
  host.addEventListener('click', (e)=>{
    if(!DRAGONAIM) return;
    e.preventDefault(); e.stopPropagation();
    try{ const t = screenToTile(e.clientX, e.clientY); dragonBurnAt(t.wx, t.wy); }
    catch(err){ DRAGONAIM = false; document.body.classList.remove('dragon-aiming'); }
  }, true);
  document.addEventListener('keydown', (e)=>{
    if(DRAGONAIM && e.key === 'Escape'){
      DRAGONAIM = false; document.body.classList.remove('dragon-aiming');
      if(typeof toast === 'function') toast('Left it then','');
    }
  });
})();

/* ---------- the tick, ahead of its own mind ---------- */
function dragonWorldTick(dt){
  const d = S.dragon; if(!d) return false;
  const c = d.cmd; if(!c) return false;
  c.t += dt;
  if(c.t > 60){ d.cmd = null; return false; }

  const m = (typeof dragonMind === 'function') ? dragonMind() : null;
  const fly = (tx, ty, speed)=>{
    const dx = tx - d.x, dy = ty - d.y, dist = Math.hypot(dx, dy) || 1;
    if(dist > 10){
      const k = Math.min(1, speed*dt/dist);
      d.x += dx*k; d.y += dy*k;
      if(Math.abs(dx) > 2) d.dir = dx < 0 ? -1 : 1;
      d.state = 'fly';
      return false;
    }
    return true;
  };

  if(c.mode === 'burn'){
    if(fly(c.x, c.y, 190)){
      const tree = (S.objs||[]).find(o=>o.id === c.treeId);
      if(tree && !tree.alight){
        lightTree(tree);
        d.flameT = 1.6;                       /* p114 draws this on its own layer */
        d.state = 'burn';
        if(m) m.heat = Math.max(0, m.heat - 0.4);
        d.bond = Math.min(1, (d.bond||0.35) + 0.006);
        dragonWorldState().burns++;
        try{ G.bang('roar'); }catch(e){}
        if(typeof log === 'function')
          log(`${d.name} put a jet of flame into the ${(BPMAP[tree.bp].name||'tree').toLowerCase()}. It has caught.`,
              'bad', 'farm');
      }
      d.cmd = null;
    }
    return true;
  }

  if(c.mode === 'hunt'){
    if(c.stage === 'out'){
      d.state = 'fly';
      if(fly(c.x, c.y, 210)){ c.stage = 'away'; c.t = 0; }
      return true;
    }
    if(c.stage === 'away'){
      d.state = 'fly';
      if(c.t > 6){                            /* gone a while, out of sight */
        c.stage = 'back';
        const r = (typeof roostSpot === 'function') ? roostSpot() : dragonHandler();
        c.x = r.x; c.y = r.y - 30;
      }
      return true;
    }
    if(fly(c.x, c.y, 200)) {
      const got = 6 + Math.floor(Math.random()*7);
      S.feed = Math.min(9999, (S.feed||0) + got);
      if(m) m.hunger = Math.max(0, m.hunger - 0.5);
      d.bond = Math.min(1, (d.bond||0.35) + 0.008);
      dragonWorldState().hunts++;
      d.state = 'feed';
      try{ G.bang('roar'); }catch(e){}
      if(typeof log === 'function')
        log(`${d.name} came back over the ridge and dropped ${got} feed by the roost.`, 'good', 'farm');
      if(typeof ui === 'function') try{ ui(); }catch(e){}
      d.cmd = null;
    }
    return true;
  }

  if(c.mode === 'show'){
    /* a circuit over the middle of the farm, climbing as it goes */
    c.ph += dt * 1.5;
    const cx = (FARM.x + FARM.w/2)*T, cy = (FARM.y + FARM.h/2)*T;
    const rad = Math.min(FARM.w, FARM.h)*T*0.32;
    d.x = cx + Math.cos(c.ph)*rad*1.35;
    d.y = cy + Math.sin(c.ph)*rad*0.55 - 40;
    d.dir = Math.sin(c.ph) > 0 ? 1 : -1;
    d.state = 'fly';
    if(!c.roared && c.ph > 3){ c.roared = 1; try{ G.bang('roar'); }catch(e){} }
    if(c.ph > 6.4){
      if(m) m.pride = Math.max(0, m.pride - 0.5);
      d.bond = Math.min(1, (d.bond||0.35) + 0.006);
      /* S.charm does not exist — charm is computed by stat(). S.charmGift
         is the persistent field p46 adds into it, and it is the only way
         to grant charm that actually lands. */
      S.charmGift = (S.charmGift || 0) + 2;
      dragonWorldState().shows++;
      if(typeof log === 'function')
        log(`${d.name} flew a circuit over the farm. Everybody stopped to watch it.`, 'gold', 'farm');
      d.cmd = null;
    }
    return true;
  }

  if(c.mode === 'come'){
    if(fly(c.x, c.y, 170)){ d.state = 'land'; if(c.t > 3) d.cmd = null; }
    return true;
  }
  if(c.mode === 'roost'){
    if(fly(c.x, c.y, 170)){ d.state = 'rest'; d.cmd = null; }
    return true;
  }
  return false;
}

/* A tree burns whether or not the dragon is still standing over it, and
   whether or not you have one — so this rides tickPeople rather than the
   dragon's own tick, which only runs while a dragon exists. */
if(typeof tickPeople === 'function'){
  const _tickPeopleBurn = tickPeople;
  tickPeople = function(dt){
    const r = _tickPeopleBurn.apply(this, arguments);
    try{
      burnTick(Math.min(0.08, typeof dt === 'number' ? dt : 0.05));
      paintBurn();
    }catch(e){}
    return r;
  };
}

if(typeof tickDragon === 'function'){
  const _tickDragonWorld = tickDragon;
  tickDragon = function(dt){
    try{
      /* a command returns early and never reaches p108's tick, where the
         mind is created — the same trap p130 fell into with the dog */
      if(typeof dragonMind === 'function') dragonMind();
      if(dragonWorldTick(typeof dt === 'number' ? dt : 0.05)) return;
    }catch(e){}
    return _tickDragonWorld.apply(this, arguments);
  };
}

/* ---------- the doors in ----------
   Clicking the roost, and the dragon button that used to go straight to
   the ride. The ride is now one line of the menu rather than the only
   thing the button could do. */
function wireRoostClick(){
  try{
    const r = (S.objs||[]).find(o=>o.bp === 'dragon_roost');
    if(!r) return;
    const el = document.querySelector(`.ob[data-id="${r.id}"]`);
    if(!el || el.dataset.drwired) return;
    el.dataset.drwired = '1';
    el.style.cursor = 'pointer';
    el.addEventListener('click', ()=>{ try{ if(S.dragon) G.openDragonMenu(); }catch(e){} });
  }catch(e){}
}
if(typeof render === 'function'){
  const _renderRoost = render;
  render = function(){
    const r = _renderRoost.apply(this, arguments);
    try{ wireRoostClick(); }catch(e){}
    return r;
  };
}
if(typeof syncWorldButtons === 'function'){
  const _syncDragonWorld = syncWorldButtons;
  syncWorldButtons = function(){
    const r = _syncDragonWorld.apply(this, arguments);
    try{
      const b = document.getElementById('ridebtn');
      if(b){
        b.onclick = ()=>G.openDragonMenu();
        b.title = 'Tell the dragon to do something';
        b.setAttribute('data-tip','<b>The dragon</b>Set a tree alight, send it hunting, ask for a circuit — or ride out.');
      }
    }catch(e){}
    return r;
  };
}

(function dragonWorldCss(){
  const s = document.createElement('style');
  s.textContent = `
  #dragonmenu{ position:absolute; z-index:70; width:182px; padding:6px;
    background:rgba(28,22,18,.96); border:1px solid var(--line2); border-radius:12px;
    box-shadow:var(--shadow); font-family:var(--font); animation:drgm .14s ease; }
  @keyframes drgm{ from{ opacity:0; transform:translateY(-4px) } to{ opacity:1 } }
  .dragonmenu-h{ font-size:10.5px; letter-spacing:.09em; text-transform:uppercase;
    color:#c9a06a; font-weight:700; padding:4px 8px 6px; }
  .dragonmenu-b{ display:block; width:100%; text-align:left; font-family:inherit;
    font-size:12.5px; color:var(--ink); padding:7px 9px; border-radius:8px; cursor:pointer; }
  .dragonmenu-b:hover{ background:rgba(232,138,46,.20); }
  .dragonmenu-b.quiet{ color:var(--ink3); font-size:11.5px; border-top:1px solid var(--line);
    margin-top:4px; padding-top:8px; }
  .dragonmenu-no{ font-size:11.5px; color:var(--ink2); line-height:1.55; padding:2px 9px 8px; }
  body.dragon-aiming #world{ cursor:crosshair; }
  @media (prefers-reduced-motion: reduce){ #dragonmenu{ animation:none } }
  `;
  document.head.appendChild(s);
})();

/* ---------- handle ---------- */
G.dragonWorldAudit = function(){
  const d = S.dragon;
  if(!d) return { dragon:false, commands:['set a tree alight','hunt','fly a circuit','come down','roost'] };
  const W = dragonWorldState();
  const m = (typeof dragonMind === 'function') ? dragonMind() : null;
  return {
    dragon:d.name,
    bond:+(d.bond||0).toFixed(2),
    takesOrders: dragonListens(),
    needsBond: 0.35,
    command: d.cmd ? d.cmd.mode + (d.cmd.stage ? ' · ' + d.cmd.stage : '') : 'none — its own mind',
    aimingAtABed: DRAGONAIM,
    at:[Math.round(d.x), Math.round(d.y)], state:d.state,
    drives: m ? { hunger:+m.hunger.toFixed(2), pride:+m.pride.toFixed(2), heat:+m.heat.toFixed(2) } : null,
    today: { treesSetAlight:W.burns, hunts:W.hunts, circuits:W.shows },
    burningNow: (S.objs||[]).filter(o=>o.alight).map(o=>({
      tree:(BPMAP[o.bp]||{}).name, gone:Math.round((o.alight||0)*100)+'%' })),
    coolingGround: (S.embers||[]).length,
    feed: S.feed,
    menuOpen: !!document.getElementById('dragonmenu'),
  };
};
