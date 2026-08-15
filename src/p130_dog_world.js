/* =====================================================================
   PLAYING WITH HER ON THE LAND, NOT IN A DIALOG

   Fair criticism of p127: five games that are a modal, some buttons and a
   sentence about what she did. You never see the dog. Reading "she turned
   on a sixpence" is not playing with a dog, it is being told about one.

   So this is the other kind, and it happens in the farm:

     Throw the ball   you pick the spot. The ball leaves your hand on an
                      arc, bounces, and settles. She breaks for it, picks
                      it up — the ball is now in her mouth and moves with
                      her — carries it back to you and drops it at your
                      feet. Then she waits, because that is what a dog
                      does, and you throw it again.
     Come here        she leaves whatever she had decided to do and comes.
     Round them up    the one useful thing she does, on command.
     Go to bed        back to the kennel.

   ALL OF IT ON THE GROUND. No modal opens for any of these. The ball is a
   real object with a position, she has real states while she is chasing
   and carrying, and everything is drawn in the scene layer and moved by
   transform rather than regenerated — the p92 lesson about the dog who
   was following you invisibly for a release.

   HOW IT INTERRUPTS HER. Her mind in p92 decides for her every frame. A
   command sets a task that is read *before* dogDecide runs and returns
   early while it lasts, the same shape the p127 kennel burst uses, so
   nothing in p92 has to know these exist. When the ball is dropped the
   task clears and she goes back to having her own opinions.

   WHAT IT PAYS. Bond, capped per day at about what one of the quiet games
   pays, so fetching forty times in a row is pleasant and not a strategy.

   The five dialog games from p127 are still there, one line down the
   menu, for when you want something to click rather than something to
   watch. Nothing was taken away.
   ===================================================================== */

let BALL = null;                    /* the thrown ball, while there is one */
let DOGAIM = false;                 /* waiting for you to pick a spot */

function dogWorldState(){
  if(!S.dogworld) S.dogworld = { day:-1, fetchBond:0, throws:0 };
  if(S.dogworld.day !== S.day){ S.dogworld.day = S.day; S.dogworld.fetchBond = 0; S.dogworld.throws = 0; }
  return S.dogworld;
}

/* A command does nothing at all while the game is paused: p20's unified
   frame only calls tickPeople when S.speed > 0, so she is given the order
   and then simply stands there. Pausing to look around before clicking
   something is exactly what people do. p104 already resumes the world
   before staging a duel; commands do the same. */
function wakeTheWorld(){
  if(S && S.speed === 0 && typeof G.setSpeed === 'function'){
    try{ G.setSpeed(1); }catch(e){}
  }
}
G.wakeTheWorld = wakeTheWorld;

/* where you are standing, which is where the ball comes back to */
function dogHandler(){
  if(S.you && S.you.x !== undefined) return { x:S.you.x, y:S.you.y };
  const h = (typeof kennelSpot === 'function') ? kennelSpot() : null;
  return h ? { x:h.x, y:h.y - 30 } : { x:(FARM.x+3)*T, y:(FARM.y+3)*T };
}

/* ---------- the menu, on the land beside the kennel ---------- */
function dogMenuClose(){
  const m = document.getElementById('dogmenu');
  if(m) m.remove();
}
G.dogMenuClose = dogMenuClose;

G.openDogMenu = function(){
  const d = S.dog;
  if(!d){ if(typeof toast==='function') toast('You have no dog','bad'); return; }
  dogMenuClose();
  const home = (typeof kennelSpot === 'function') ? kennelSpot() : null;
  const vp = document.getElementById('viewport') || document.body;
  const wr = document.getElementById('world').getBoundingClientRect();
  const vr = vp.getBoundingClientRect();

  const m = document.createElement('div');
  m.id = 'dogmenu';
  m.innerHTML = `
    <div class="dogmenu-h">${d.name}</div>
    <button class="dogmenu-b" onclick="G.dogThrowStart()">🎾 Throw the ball</button>
    <button class="dogmenu-b" onclick="G.dogCome()">✋ Come here</button>
    <button class="dogmenu-b" onclick="G.dogRoundUp()">🐑 Round them up</button>
    <button class="dogmenu-b" onclick="G.dogBed()">🏠 Go to bed</button>
    <button class="dogmenu-b quiet" onclick="G.dogMenuClose();G.openDogPlay()">Quiet games…</button>`;
  vp.appendChild(m);

  /* anchored to the kennel on screen, kept inside the viewport */
  if(home){
    const sx = home.x*cam.z + cam.x + wr.left - vr.left;
    const sy = home.y*cam.z + cam.y + wr.top  - vr.top;
    const w = 168, h = 196;
    m.style.left = Math.round(Math.max(8, Math.min(vr.width  - w - 8, sx + 14))) + 'px';
    m.style.top  = Math.round(Math.max(8, Math.min(vr.height - h - 8, sy - h/2))) + 'px';
  } else { m.style.left = '20px'; m.style.top = '80px'; }

  setTimeout(()=>{
    const away = (e)=>{ if(!m.contains(e.target)){ dogMenuClose(); document.removeEventListener('mousedown', away, true); } };
    document.addEventListener('mousedown', away, true);
  }, 0);
};

/* ---------- commands ---------- */
G.dogCome = function(){
  const d = S.dog; if(!d) return;
  dogMenuClose();
  wakeTheWorld();
  const h = dogHandler();
  d.cmd = { mode:'come', x:h.x - 22, y:h.y + 14, t:0 };
  d.task = null; d.taskT = 0;
  try{ sfx('bark'); }catch(e){}
  if(typeof toast === 'function') toast(`${d.name} is coming`, '');
};
G.dogBed = function(){
  const d = S.dog; if(!d) return;
  dogMenuClose();
  wakeTheWorld();
  const home = (typeof kennelSpot === 'function') ? kennelSpot() : null;
  if(!home) return toast('She has no kennel','bad');
  d.cmd = { mode:'bed', x:home.x, y:home.y, t:0 };
  d.task = null; d.taskT = 0;
  if(typeof toast === 'function') toast(`${d.name} is going in`, '');
};
G.dogRoundUp = function(){
  const d = S.dog; if(!d) return;
  dogMenuClose();
  wakeTheWorld();
  const strays = (typeof strayList === 'function') ? strayList() : (S.strays || []);
  if(!strays || !strays.length){
    try{ sfx('whine'); }catch(e){}
    return toast('Nothing is out', '');
  }
  d.cmd = { mode:'work', x:strays[0].x, y:strays[0].y, t:0 };
  d.task = null; d.taskT = 0;
  try{ sfx('bark'); }catch(e){}
};

/* ---------- the ball ---------- */
G.dogThrowStart = function(){
  const d = S.dog; if(!d) return;
  dogMenuClose();
  DOGAIM = true;
  document.body.classList.add('dog-aiming');
  if(typeof toast === 'function') toast('Click where to throw it', 'good');
};

function dogThrowTo(wx, wy){
  const d = S.dog; if(!d) return;
  DOGAIM = false;
  document.body.classList.remove('dog-aiming');
  wakeTheWorld();
  const from = dogHandler();
  BALL = { x0:from.x, y0:from.y - 16, x1:wx, y1:wy, t:0, dur:0.75,
           x:from.x, y:from.y - 16, z:16, held:false, rest:false };
  d.cmd = { mode:'fetch', stage:'chase', t:0 };
  d.task = null; d.taskT = 0;
  dogWorldState().throws++;
  try{ sfx('whoosh'); }catch(e){ try{ sfx('click'); }catch(e2){} }
}

/* the next click on the land is the throw */
(function aimClick(){
  const world = document.getElementById('world');
  const host = world || document;
  host.addEventListener('click', (e)=>{
    if(!DOGAIM) return;
    e.preventDefault(); e.stopPropagation();
    try{
      const t = screenToTile(e.clientX, e.clientY);
      dogThrowTo(t.wx, t.wy);
    }catch(err){ DOGAIM = false; document.body.classList.remove('dog-aiming'); }
  }, true);
  document.addEventListener('keydown', (e)=>{
    if(DOGAIM && e.key === 'Escape'){
      DOGAIM = false; document.body.classList.remove('dog-aiming');
      if(typeof toast === 'function') toast('Not throwing it then', '');
    }
  });
})();

/* ---------- the tick: commands are read before her own mind ---------- */
function dogWorldTick(dt){
  const d = S.dog; if(!d) return false;
  /* A command returns early and never reaches p92's tick, which is where
     the mind and the bond are created. Buy a dog and immediately tell her
     to fetch and she would run the whole errand with d.bond undefined —
     caught by measuring a bond gain of NaN. Initialise first, then
     command; both are idempotent. */
  try{ if(typeof dogInit === 'function') dogInit();
       if(typeof dogMind === 'function') dogMind(); }catch(e){}

  /* the ball flies whether or not she is chasing it */
  if(BALL && !BALL.held && !BALL.rest){
    BALL.t += dt;
    const k = Math.min(1, BALL.t / BALL.dur);
    BALL.x = BALL.x0 + (BALL.x1 - BALL.x0)*k;
    BALL.y = BALL.y0 + (BALL.y1 - BALL.y0)*k;
    BALL.z = Math.sin(k*Math.PI) * 46 + (1-k)*10;
    if(k >= 1){ BALL.z = 0; BALL.rest = true; }
  }
  if(BALL && BALL.held){ BALL.x = d.x + (d.dir>0 ? 11 : -11); BALL.y = d.y - 3; BALL.z = 4; }

  const c = d.cmd;
  if(!c) return false;
  c.t += dt;
  if(c.t > 45){ d.cmd = null; return false; }        /* never stuck on a command */

  const go = (tx, ty, speed)=>{
    const dx = tx - d.x, dy = ty - d.y, dist = Math.hypot(dx, dy) || 1;
    if(dist > 8){
      const k = Math.min(1, speed*dt/dist);
      d.x += dx*k; d.y += dy*k;
      if(Math.abs(dx) > 2) d.dir = dx < 0 ? -1 : 1;
      return false;
    }
    return true;
  };

  if(c.mode === 'fetch'){
    if(!BALL){ d.cmd = null; return false; }
    if(c.stage === 'chase'){
      d.state = 'run';
      if(go(BALL.x, BALL.y, 150) && BALL.rest){
        BALL.held = true;
        c.stage = 'return';
        try{ sfx('bark'); }catch(e){}
      }
      return true;
    }
    if(c.stage === 'return'){
      d.state = 'run';
      const h = dogHandler();
      if(go(h.x - 18, h.y + 12, 132)){
        BALL.held = false; BALL.rest = true; BALL.z = 0;
        c.stage = 'wait'; c.t = 0;
        /* she is pleased with herself, up to a point each day */
        const W = dogWorldState();
        const room = Math.max(0, 0.025 - W.fetchBond);
        const gain = Math.min(room, 0.005);
        if(gain > 0){ W.fetchBond += gain;
          d.bond = Math.min(1, (d.bond === undefined ? 0.35 : d.bond) + gain); }
        try{ sfx('bark'); }catch(e){}
        if(typeof log === 'function' && W.throws === 1)
          log(`${d.name} brought the ball straight back and dropped it at your feet.`, 'good', 'home');
      }
      return true;
    }
    /* waiting to be thrown again */
    d.state = 'sit';
    if(c.t > 6){ d.cmd = null; BALL = null; }
    return true;
  }

  if(c.mode === 'come'){
    d.state = 'run';
    if(go(c.x, c.y, 128)){ d.state = 'sit'; if(c.t > 2.5) d.cmd = null; }
    return true;
  }
  if(c.mode === 'bed'){
    d.state = 'walk';
    if(go(c.x, c.y, 92)){ d.state = 'sleep'; d.cmd = null; }
    return true;
  }
  if(c.mode === 'work'){
    d.state = 'run';
    const strays = (typeof strayList === 'function') ? strayList() : (S.strays || []);
    if(!strays || !strays.length){ d.cmd = null; return false; }
    const s = strays[0];
    if(go(s.x, s.y, 150)){
      d.roundCool = Math.max(0, (d.roundCool||0) - dt);
      if(typeof G.roundUp === 'function' && d.roundCool <= 0){
        const had = strays.length;
        G.roundUp(); d.roundCool = 4;
        if(had && typeof log === 'function')
          log(`${d.name} brought ${had === 1 ? 'a stray' : had + ' strays'} in, on command.`, 'good', 'farm');
        d.bond = Math.min(1, (d.bond||0.35) + 0.01);
        d.cmd = null;
      }
    }
    return true;
  }
  return false;
}

if(typeof tickDog === 'function'){
  const _tickDogWorld = tickDog;
  tickDog = function(dt){
    try{
      if(dogWorldTick(typeof dt === 'number' ? dt : 0.05)){
        if(typeof paintDog === 'function') paintDog();
        paintBall();
        return;                       /* a command outranks her own mind */
      }
      paintBall();
    }catch(e){}
    return _tickDogWorld.apply(this, arguments);
  };
}

/* ---------- the ball, drawn once and moved ---------- */
function paintBall(){
  let g = document.getElementById('ballay');
  if(!BALL){ if(g) g.remove(); return; }
  if(!g){
    const fg = document.getElementById('fg');
    if(!fg) return;
    g = document.createElementNS('http://www.w3.org/2000/svg','g');
    g.id = 'ballay';
    g.setAttribute('pointer-events','none');
    g.innerHTML = `<ellipse class="bsh" cx="0" cy="0" rx="4" ry="1.7" fill="#16240c" opacity=".3"/>
      <g class="bbody"><circle r="4.2" fill="#d8e34a"/>
      <circle r="4.2" fill="none" stroke="#b6c033" stroke-width="0.9"/>
      <path d="M-4 -1.4 q4 2.4 8 0" fill="none" stroke="#f2f7c0" stroke-width="0.9"/>
      <circle cx="-1.4" cy="-1.5" r="1.5" fill="#eaf28a" opacity=".8"/></g>`;
    fg.appendChild(g);
  }
  const sh = g.querySelector('.bsh'), bd = g.querySelector('.bbody');
  sh.setAttribute('transform', `translate(${n(BALL.x)},${n(BALL.y)}) scale(${(1 - BALL.z/90).toFixed(2)})`);
  bd.setAttribute('transform', `translate(${n(BALL.x)},${n(BALL.y - BALL.z)})`);
}

/* ---------- clicking the kennel opens the menu ----------
   p127 wired the kennel to call her straight out. A menu is the better
   door now there is more than one thing to ask for, and calling her out
   is still one line of it. */
if(typeof G.callDogOut === 'function'){
  G.callDogOut = (function(prev){
    return function(){
      if(S.dog && (typeof kennelObj === 'function') && kennelObj()){ G.openDogMenu(); return; }
      return prev.apply(this, arguments);
    };
  })(G.callDogOut);
}

/* and the world button opens it too */
if(typeof syncWorldButtons === 'function'){
  const _syncDogWorld = syncWorldButtons;
  syncWorldButtons = function(){
    const r = _syncDogWorld.apply(this, arguments);
    try{
      const b = document.getElementById('dogplaybtn');
      if(b) b.onclick = ()=>G.openDogMenu();
    }catch(e){}
    return r;
  };
}

(function dogWorldCss(){
  const s = document.createElement('style');
  s.textContent = `
  #dogmenu{ position:absolute; z-index:70; width:168px; padding:6px;
    background:rgba(22,30,17,.96); border:1px solid var(--line2); border-radius:12px;
    box-shadow:var(--shadow); font-family:var(--font); animation:dogm .14s ease; }
  @keyframes dogm{ from{ opacity:0; transform:translateY(-4px) } to{ opacity:1 } }
  .dogmenu-h{ font-size:10.5px; letter-spacing:.09em; text-transform:uppercase;
    color:var(--ink3); font-weight:700; padding:4px 8px 6px; }
  .dogmenu-b{ display:block; width:100%; text-align:left; font-family:inherit;
    font-size:12.5px; color:var(--ink); padding:7px 9px; border-radius:8px; cursor:pointer; }
  .dogmenu-b:hover{ background:rgba(124,194,79,.18); }
  .dogmenu-b.quiet{ color:var(--ink3); font-size:11.5px; border-top:1px solid var(--line);
    margin-top:4px; padding-top:8px; border-radius:0 0 8px 8px; }
  body.dog-aiming #world{ cursor:crosshair; }
  @media (prefers-reduced-motion: reduce){ #dogmenu{ animation:none } }
  `;
  document.head.appendChild(s);
})();

/* ---------- handle ---------- */
G.dogWorldAudit = function(){
  const d = S.dog;
  if(!d) return { dog:false };
  const W = dogWorldState();
  return {
    dog:d.name,
    menuOpen: !!document.getElementById('dogmenu'),
    aimingForAThrow: DOGAIM,
    command: d.cmd ? d.cmd.mode + (d.cmd.stage ? ' · ' + d.cmd.stage : '') : 'none — her own mind',
    ball: BALL ? { at:[Math.round(BALL.x), Math.round(BALL.y)], height:Math.round(BALL.z),
                   inHerMouth:!!BALL.held, onTheGround:!!BALL.rest } : 'none',
    ballInDom: !!document.getElementById('ballay'),
    throwsToday: W.throws,
    bondFromFetchToday: +W.fetchBond.toFixed(3),
    dailyFetchCap: 0.025,
    commands: ['throw the ball','come here','round them up','go to bed'],
  };
};
