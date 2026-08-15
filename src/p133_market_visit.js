/* =====================================================================
   GOING TO THE MARKET, RATHER THAN OPENING IT

   The market has been a real place on this farm since p39 — eighteen
   tiles by ten, with stalls, traders' cottages, a produce store and a
   green with a stage on it. And the only way anybody has ever interacted
   with it is a dialog that lists what is there. You have never once
   walked onto it.

   THREE THINGS.

   1. YOU CAN GO. A button takes you there: your farmer walks across the
      farm to the market ground and the camera follows, and while you are
      standing on it the game knows you are AT the market rather than
      looking at a list of it. Another button walks you home. Both ways,
      any time, and the farm carries on without you.

   2. IT LOOKS LIKE SOMEWHERE ELSE. While you are there a staged backdrop
      fades in behind the ground — graded sky, a ridge of hills, haze —
      built the same way p107 stages the arena for the champions, because
      that is the look that makes a patch of grass read as a location.
      It fades out again the moment you leave, and it never touches the
      farm's own rendering.

   3. YOU WALK UP TO THINGS. Every stall is somewhere you stand rather
      than a row in a menu. Get close and the stall tells you what it is
      and what it wants; the judging tent, the supply stall, the relief
      fund and every sideshow game are all pitched on the ground now.
      Three new games are pitched there too, so there is something at the
      far end worth crossing for.

   The dialog is still there and still works — the tabs from p129 are the
   fastest way to do the rounds if you do not want to walk. This is the
   other way of doing it, and the two share every underlying action, so
   nothing is implemented twice.
   ===================================================================== */

const VISIT = { on:false, k:0, near:null, t:0, travel:null };

function marketGround(){
  try{ if(typeof marketLayout === 'function') marketLayout(); }catch(e){}
  return (S.market && S.market.ground) || null;
}
function marketCentre(){
  const g = marketGround();
  if(!g) return null;
  return { x:(g.tx + g.w/2)*T, y:(g.ty + g.h/2)*T, g };
}
/* Two tiles of margin, because she ends up standing on the edge of the
   ground as often as inside it and a hard boundary made the backdrop and
   the bar flicker on and off as she shifted her feet. */
function atTheMarket(){
  const c = marketCentre(); if(!c || !S.you) return false;
  const g = c.g, m = 2*T;
  return S.you.x > g.tx*T - m && S.you.x < (g.tx+g.w)*T + m
      && S.you.y > g.ty*T - m && S.you.y < (g.ty+g.h)*T + m;
}

/* ---------- the pitches: where each thing stands on the ground ----------
   Laid out as two rows down the market with the stage at the far end, so
   walking the length of it passes everything. */
function marketPitches(){
  const g = marketGround(); if(!g) return [];
  const col = (i, of_)=> g.tx + 1.2 + (g.w-2.4) * (i/(of_-1));
  const rowA = g.ty + 1.6, rowB = g.ty + g.h - 2.2;
  const P = [];
  const top = [
    ['judge',  'Judging tent',   'Enter what you grew',        ()=>marketOpenTab('Judging')],
    ['supply', 'Supply stall',   'Seed, tools and stock',      ()=>marketOpenTab('Supplies')],
    ['relief', 'Relief fund',    'For growers who lost a season', ()=>marketOpenTab('Relief fund')],
    ['games',  'Sideshow row',   'Every game on the field',    ()=>marketOpenTab('Sideshow')],
  ];
  const bottom = [
    ['hook',   'Hook a duck',    'Three hooks, one pond',      ()=>G.playHookDuck()],
    ['shy',    'Coconut shy',    'Three balls at five coconuts', ()=>G.playCoconut()],
    ['scales', 'Guess the beast','One guess at the prize bullock', ()=>G.playHeaviest()],
  ];
  top.forEach((t,i)=>P.push({ id:t[0], n:t[1], d:t[2], go:t[3],
    x:col(i, top.length)*T, y:rowA*T, row:'top' }));
  bottom.forEach((t,i)=>P.push({ id:t[0], n:t[1], d:t[2], go:t[3],
    x:col(i, bottom.length)*T, y:rowB*T, row:'bottom' }));
  return P;
}

/* opening the dialog on a particular tab, so the walk-up and the list
   share one implementation rather than each having their own */
function marketOpenTab(title){
  if(typeof G.openMarket !== 'function') return;
  G.openMarket();
  try{
    const chips = [...document.querySelectorAll('#mktabs .chip')];
    const i = chips.findIndex(c=>c.textContent.trim().indexOf(title) === 0);
    if(i >= 0 && typeof G.mktabPick === 'function') G.mktabPick(i);
  }catch(e){}
}

/* ---------- travelling ---------- */
/* Walked there directly rather than through findPath. findPath is built
   for stepping onto a building's near edge and it came back with a
   single node for a cross-farm trip, so she set off, reached that one
   waypoint and stopped — measured, she halted at y=566 with the ground
   ending at 520, just outside her own destination. The market is open
   ground; a straight walk is both simpler and certain to arrive. */
function travelTo(x, y, then){
  youInit();
  VISIT.travel = { x, y, then: then || null };
  S.you.path = []; S.you.state = 'idle'; S.you.job = null;
}

G.goToMarket = function(){
  const c = marketCentre();
  if(!c){ if(typeof toast==='function') toast('There is no market on today','bad'); return; }
  if(typeof G.wakeTheWorld === 'function') G.wakeTheWorld();
  travelTo(c.x, (c.g.ty + c.g.h - 1.5)*T);
  if(typeof toast === 'function') toast('Off to the market', 'good');
  if(typeof log === 'function') log('You walked down to the market.', '', 'farm');
};

G.goHome = function(){
  youInit();
  const home = (S.objs||[]).find(o=>BPMAP[o.bp] && BPMAP[o.bp].kind === 'home')
            || (S.objs||[])[0];
  VISIT.on = false;
  if(typeof G.wakeTheWorld === 'function') G.wakeTheWorld();
  if(home){
    const f = footprint(BPMAP[home.bp], home.rot);
    travelTo((home.tx + f.w/2)*T, (home.ty + f.h + 0.6)*T);
  }
  if(typeof toast === 'function') toast('Back to the farm', '');
};

/* ---------- the staged backdrop, only while you are standing there ---------- */
function visitBackdrop(k){
  const g = marketGround(); if(!g || k < 0.01) return '';
  /* generous margin so it reads as a horizon rather than a rug */
  const x = (g.tx - 9)*T, y = (g.ty - 11)*T, w = (g.w + 18)*T, h = (g.h + 15)*T;
  const hz = y + h*0.44;
  let s = `<g id="mktstage" opacity="${k.toFixed(3)}" pointer-events="none">`;
  s += `<defs><linearGradient id="gMkt" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#8fc4e8"/><stop offset="0.55" stop-color="#cfe4ef"/>
    <stop offset="1" stop-color="#e9ddc0"/></linearGradient></defs>`;
  s += `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(hz-y)}" fill="url(#gMkt)"/>`;
  /* two ridges, the far one hazier */
  const ridge = (base, amp, fill, op, seed)=>{
    let d = `M${n(x)} ${n(base+60)} L${n(x)} ${n(base)}`;
    for(let i=0;i<=20;i++){
      const px = x + w*i/20;
      const py = base - (hash(i*3.1+seed)*0.55 + hash(i*1.7+seed)*0.45) * amp;
      d += ` L${n(px)} ${n(py)}`;
    }
    d += ` L${n(x+w)} ${n(base+60)} Z`;
    return `<path d="${d}" fill="${fill}" opacity="${op}"/>`;
  };
  s += ridge(hz - h*0.03, h*0.13, '#9fb2b8', 0.55, 3);
  s += ridge(hz,          h*0.09, '#7f9482', 0.75, 9);
  /* the field the market stands in, running back to the ridge */
  s += `<rect x="${n(x)}" y="${n(hz)}" width="${n(w)}" height="${n(y+h-hz)}" fill="#8fae5c"/>`;
  s += `<rect x="${n(x)}" y="${n(hz)}" width="${n(w)}" height="${n((y+h-hz)*0.18)}" fill="#a8c46e" opacity=".7"/>`;
  /* haze along the join */
  s += `<rect x="${n(x)}" y="${n(hz-14)}" width="${n(w)}" height="28" fill="#ffffff" opacity=".16"/>`;
  s += `</g>`;
  return s;
}

/* it sits behind everything the farm draws */
function paintVisit(){
  const fg = document.getElementById('fg'); if(!fg) return;
  let el = document.getElementById('mktvisit');
  if(VISIT.k < 0.01){ if(el) el.remove(); return; }
  if(!el){
    el = document.createElementNS('http://www.w3.org/2000/svg','g');
    el.id = 'mktvisit';
    el.setAttribute('pointer-events','none');
    fg.insertBefore(el, fg.firstChild);          /* behind the farm, not over it */
  }
  let s = visitBackdrop(VISIT.k);
  /* the pitch signs, and the one you are standing at */
  marketPitches().forEach(p=>{
    const on = VISIT.near && VISIT.near.id === p.id;
    s += `<g opacity="${(VISIT.k * (on ? 1 : 0.72)).toFixed(3)}">`;
    s += `<rect x="${n(p.x-3)}" y="${n(p.y-30)}" width="6" height="30" fill="#6b5335"/>`;
    s += `<rect x="${n(p.x-30)}" y="${n(p.y-46)}" width="60" height="19" rx="3"
      fill="${on ? '#f0c14b' : '#e8dcbc'}" stroke="#6b5335" stroke-width="1.4"/>`;
    s += `<text x="${n(p.x)}" y="${n(p.y-33)}" text-anchor="middle" font-size="8.5"
      fill="#3a2c18" style="font-family:inherit">${p.n}</text>`;
    if(on){
      s += `<circle cx="${n(p.x)}" cy="${n(p.y+4)}" r="${n(16 + Math.sin(VISIT.t*4)*2)}"
        fill="none" stroke="#f0c14b" stroke-width="2.4" opacity=".8"/>`;
    }
    s += `</g>`;
  });
  el.innerHTML = s;
}

/* ---------- the tick: are you there, and what are you next to ---------- */
function tickVisit(dt){
  VISIT.t += dt;
  /* the walk itself */
  if(VISIT.travel && S.you){
    const tv = VISIT.travel;
    const dx = tv.x - S.you.x, dy = tv.y - S.you.y, d = Math.hypot(dx, dy);
    const spd = (S.settings && S.settings.walkFast ? 250 : 170) * dt;
    if(d <= spd){
      S.you.x = tv.x; S.you.y = tv.y;
      VISIT.travel = null;
      S.you.state = 'idle';
      if(tv.then) try{ tv.then(); }catch(e){}
    } else {
      S.you.x += dx/d*spd; S.you.y += dy/d*spd;
      S.you.dir = dx < 0 ? -1 : 1;
      S.you.state = 'walk';
    }
    if(typeof paintYou === 'function') try{ paintYou(); }catch(e){}
  }
  const here = atTheMarket() && !!(S.market && S.market.active);
  VISIT.on = here;
  VISIT.k += ((here ? 1 : 0) - VISIT.k) * Math.min(1, dt*2.2);

  VISIT.near = null;
  if(here && S.you){
    let best = 999;
    marketPitches().forEach(p=>{
      const d = Math.hypot(p.x - S.you.x, p.y - S.you.y);
      if(d < 46 && d < best){ best = d; VISIT.near = p; }
    });
  }
  paintVisit();
  syncVisitBar();
}

/* ---------- the bar: where you are, and the way back ---------- */
function syncVisitBar(){
  let bar = document.getElementById('mktbar');
  const show = VISIT.k > 0.02;
  if(!show){ if(bar) bar.remove(); return; }
  const vp = document.getElementById('viewport') || document.body;
  if(!bar){
    bar = document.createElement('div');
    bar.id = 'mktbar';
    bar.innerHTML = `<span class="mkb-where">At the market</span>
      <button class="mkb-do" id="mkbdo"></button>
      <button class="mkb-home" onclick="G.goHome()">Back to the farm</button>`;
    vp.appendChild(bar);
  }
  const doBtn = bar.querySelector('#mkbdo');
  if(VISIT.near){
    doBtn.style.display = '';
    doBtn.textContent = `${VISIT.near.n} — ${VISIT.near.d}`;
    doBtn.onclick = ()=>{ try{ VISIT.near.go(); }catch(e){} };
  } else {
    doBtn.style.display = 'none';
  }
}

/* ---------- three more games, pitched on the ground ---------- */
function mkGameDone(key, pts, title, body, cls){
  if(typeof mkFinish === 'function') mkFinish(key, pts, title, cls);
  if(typeof mkBack === 'function') mkBack(title, body);
}

/* hook a duck */
const HOOK = { got:0, tries:3 };
G.playHookDuck = function(){
  if(typeof mkPlayed === 'function' && mkPlayed('hook')) return toast('You have had your go','');
  HOOK.got = 0; HOOK.tries = 3;
  hookDraw();
};
function hookDraw(){
  modal(`<h2>Hook a duck</h2>
    <p class="sub">Six on the water, three hooks. The marked ones are worth having and you
      cannot tell which from here — that is rather the point of it.</p>
    <div class="dowsegrid" style="grid-template-columns:repeat(6,1fr);max-width:300px">
      ${Array.from({length:6},(_,i)=>`<button class="dowsecell" id="hk${i}"
        onclick="G.hookPick(${i})">🦆</button>`).join('')}</div>
    <div class="muted" id="hookinfo" style="margin-top:8px">${HOOK.tries} hooks left.</div>
    <div class="mfoot"><button class="btn ghost" onclick="G.openMarket()">Leave it</button></div>`);
}
G.hookPick = function(i){
  const c = document.getElementById('hk'+i);
  if(!c || c.disabled) return;
  c.disabled = true;
  const win = Math.random() < 0.42;
  c.textContent = win ? '★' : '·';
  c.classList.add(win ? 'hit' : 'miss');
  if(win) HOOK.got++;
  HOOK.tries--;
  const info = document.getElementById('hookinfo');
  if(HOOK.tries > 0){ if(info) info.textContent = `${HOOK.got} marked, ${HOOK.tries} hooks left.`; return; }
  const cash = HOOK.got * 30;
  if(cash){ S.cash += cash; S.totalEarned += cash; }
  mkGameDone('hook', 6 + HOOK.got*7,
    HOOK.got ? `Hooked ${HOOK.got}` : 'All blanks',
    `<p class="sub">${HOOK.got ? `${HOOK.got} marked duck${HOOK.got>1?'s':''} — <b>${fmt(cash)}</b>.`
      : 'Three plain ducks. The man on the stall was very sympathetic.'}</p>`,
    HOOK.got ? 'good' : '');
};

/* coconut shy */
const SHY = { down:0, balls:3 };
G.playCoconut = function(){
  if(typeof mkPlayed === 'function' && mkPlayed('shy')) return toast('You have had your go','');
  SHY.down = 0; SHY.balls = 3;
  shyDraw();
};
function shyDraw(){
  modal(`<h2>Coconut shy</h2>
    <p class="sub">Five up, three balls. They are wedged in tighter than they look, which
      everybody says and everybody is right about.</p>
    <div class="dowsegrid" style="grid-template-columns:repeat(5,1fr);max-width:260px">
      ${Array.from({length:5},(_,i)=>`<button class="dowsecell" id="cn${i}"
        onclick="G.shyThrow(${i})">🥥</button>`).join('')}</div>
    <div class="muted" id="shyinfo" style="margin-top:8px">${SHY.balls} balls left.</div>
    <div class="mfoot"><button class="btn ghost" onclick="G.openMarket()">Leave it</button></div>`);
}
G.shyThrow = function(i){
  const c = document.getElementById('cn'+i);
  if(!c || c.disabled || SHY.balls <= 0) return;
  SHY.balls--;
  const hit = Math.random() < 0.34;
  if(hit){ c.disabled = true; c.textContent = '·'; c.classList.add('hit'); SHY.down++; }
  else c.classList.add('miss');
  const info = document.getElementById('shyinfo');
  if(SHY.balls > 0){ if(info) info.textContent = `${SHY.down} down, ${SHY.balls} left.`; return; }
  const cash = SHY.down * 45;
  if(cash){ S.cash += cash; S.totalEarned += cash; }
  mkGameDone('shy', 5 + SHY.down*9,
    SHY.down ? `${SHY.down} off the stand` : 'Not a one',
    `<p class="sub">${SHY.down ? `<b>${fmt(cash)}</b> and the respect of the stallholder.`
      : 'They were wedged in. They are always wedged in.'}</p>`,
    SHY.down ? 'good' : '');
};

/* guess the beast */
G.playHeaviest = function(){
  if(typeof mkPlayed === 'function' && mkPlayed('heaviest')) return toast('You have had your go','');
  const real = 520 + Math.floor(Math.random()*380);
  window.__beastKg = real;
  modal(`<h2>Guess the beast</h2>
    <p class="sub">One guess at what the prize bullock weighs. Closest at the end of the
      market takes the prize; within twenty kilos and they pay out on the spot.</p>
    <div class="mkguess">
      <input id="beastin" class="mkinput" type="number" placeholder="kg"
        style="width:130px;text-align:center"/>
    </div>
    <div class="mfoot">
      <button class="btn" onclick="G.beastGuess()">That is my guess</button>
      <button class="btn ghost" onclick="G.openMarket()">Leave it</button></div>`);
  setTimeout(()=>{ const i=document.getElementById('beastin'); if(i) i.focus(); }, 60);
};
G.beastGuess = function(){
  const v = +((document.getElementById('beastin')||{}).value || 0);
  const real = window.__beastKg || 700;
  const off = Math.abs(v - real);
  const cash = off <= 20 ? 240 : off <= 60 ? 80 : 0;
  if(cash){ S.cash += cash; S.totalEarned += cash; }
  mkGameDone('heaviest', off <= 20 ? 26 : off <= 60 ? 12 : 4,
    off <= 20 ? 'Spot on' : off <= 60 ? 'Close' : 'Wide',
    `<p class="sub">He went <b>${real}kg</b>. You said ${v || 0}kg — ${off}kg out.${
      cash ? ` <b>${fmt(cash)}</b>.` : ''}</p>`,
    cash ? 'good' : '');
};

/* ---------- wire it in ---------- */
if(typeof tickPeople === 'function'){
  const _tickPeopleVisit = tickPeople;
  tickPeople = function(dt){
    const r = _tickPeopleVisit.apply(this, arguments);
    try{ tickVisit(Math.min(0.08, typeof dt === 'number' ? dt : 0.05)); }catch(e){}
    return r;
  };
}

/* the way in, beside the other world buttons */
if(typeof syncWorldButtons === 'function'){
  const _syncVisit = syncWorldButtons;
  syncWorldButtons = function(){
    const r = _syncVisit.apply(this, arguments);
    try{
      const host = document.getElementById('zoomctl');
      if(!host) return r;
      let b = document.getElementById('mktgobtn');
      if(!b){
        b = document.createElement('button');
        b.id = 'mktgobtn';
        b.textContent = '⛺';
        b.title = 'Walk down to the market';
        b.setAttribute('data-tip','<b>Go to the market</b>Walk onto the ground itself — the stalls, the sideshow and the ring are all things you stand in front of.');
        b.onclick = ()=>G.goToMarket();
        host.insertBefore(b, host.firstChild);
      }
      b.style.display = (S.market && S.market.active) ? '' : 'none';
    }catch(e){}
    return r;
  };
}

(function visitCss(){
  const s = document.createElement('style');
  s.textContent = `
  #mktgobtn{ font-size:15px; line-height:1 }
  #mktbar{ position:absolute; left:50%; transform:translateX(-50%); bottom:14px; z-index:64;
    display:flex; align-items:center; gap:8px; padding:7px 9px; border-radius:999px;
    background:rgba(20,27,16,.92); border:1px solid var(--line2); box-shadow:var(--shadow);
    font-family:var(--font); max-width:min(92vw,620px); }
  .mkb-where{ font-size:11px; font-weight:700; letter-spacing:.06em; text-transform:uppercase;
    color:var(--gold); padding:0 4px; white-space:nowrap; }
  .mkb-do{ font-family:inherit; font-size:12.5px; font-weight:650; color:#0e1a09;
    background:linear-gradient(180deg,#f0c14b,#c99a2c); border-radius:999px;
    padding:7px 13px; cursor:pointer; white-space:nowrap; overflow:hidden;
    text-overflow:ellipsis; max-width:320px; }
  .mkb-home{ font-family:inherit; font-size:12px; color:var(--ink2);
    background:var(--panel2); border:1px solid var(--line); border-radius:999px;
    padding:6px 12px; cursor:pointer; white-space:nowrap; }
  .mkb-home:hover{ color:var(--ink); border-color:var(--green); }
  @media (max-width:520px){ .mkb-where{ display:none } }
  `;
  document.head.appendChild(s);
})();

/* ---------- handle ---------- */
G.marketVisitAudit = function(){
  const g = marketGround();
  return {
    marketOn: !!(S.market && S.market.active),
    ground: g ? `${g.w}×${g.h} tiles at ${g.tx},${g.ty}` : 'none pitched',
    youAreThere: atTheMarket(),
    backdrop: +VISIT.k.toFixed(2),
    standingAt: VISIT.near ? VISIT.near.n : 'nothing in particular',
    pitches: marketPitches().map(p=>p.n),
    newGames: ['Hook a duck','Coconut shy','Guess the beast'],
    barInDom: !!document.getElementById('mktbar'),
    walkingThere: !!VISIT.travel,
    goButtonInDom: !!document.getElementById('mktgobtn'),
  };
};
