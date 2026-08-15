/* =====================================================================
   CALL HER OUT, AND FIVE THINGS TO DO WITH HER

   She has a kennel, a mind and a bond with you, and there has never been
   a single thing you can do with her on purpose. Everything she does she
   decides herself. This adds the two halves of an actual relationship:
   you can call her, and you can play with her.

   CLICK THE KENNEL. She comes out of it — a real exit, not a teleport:
   she is pushed to the mouth, given a burst of speed out into the yard,
   barks twice, and then her own mind takes over again and decides what to
   do next. The burst is a temporary state on the dog, not a new tick, so
   nothing in p92 has to know it happened.

   A four second lockout, for the same reason p85 and p92 have one: this
   is a click handler on a scene element and people click things twice.

   FIVE GAMES, on the same shape the market sideshow already uses — a
   modal, buttons, one result screen. They are hers rather than reskins of
   the fair:

     Fetch        a timing bar. Call her at the right moment.
     Scent trail  nine tiles, and she tells you warmer or colder, so it
                  is deduction rather than the pure guess dowsing is.
     Weave        five poles, five timing stops, cumulative.
     Tug of war   hold to build the pull, let go before it slips. Greed.
     Round-up     four strays, nearest first, against a clock.

   WHAT THEY PAY. Bond, mostly, because that is the currency she deals
   in — it gates riding, fighting and everything else she does. A little
   charm and a little energy, and never cash, because a farm that can be
   funded by playing with the dog is a farm nobody farms. They are capped
   at one round of each per day so they cannot be ground.

   AVAILABLE IN BOTH VERSIONS. The starter door hides the automation
   category and two reference panels and nothing else, so the kennel, the
   button and all five games are there for everybody.
   ===================================================================== */

/* ---------- how much a game may give ---------- */
function dogPlayState(){
  if(!S.dogplay) S.dogplay = { day:-1, played:{}, won:0 };
  if(S.dogplay.day !== S.day){ S.dogplay.day = S.day; S.dogplay.played = {}; }
  return S.dogplay;
}
function dogPlayed(k){ return !!dogPlayState().played[k]; }

function dogReward(key, bond, charm, msg, cls){
  const P = dogPlayState();
  P.played[key] = 1;
  const d = S.dog;
  if(d && bond) d.bond = Math.min(1, (d.bond === undefined ? 0.35 : d.bond) + bond);
  /* S.charm is not a field — charm is computed by stat(), and S.charmGift
     is what feeds into it. Guarding on typeof S.charm meant every charm
     reward in here silently did nothing. */
  if(charm) S.charmGift = (S.charmGift || 0) + charm;
  if(bond > 0) P.won++;
  if(typeof log === 'function') log(msg, cls || '', 'home');
  if(typeof sfx === 'function') sfx(bond >= 0.04 ? 'level' : 'click');
  try{ ui(); G.save(); }catch(e){}
}

function dogBack(title, body){
  const d = S.dog;
  modal(`<h2>${title}</h2>${body}
    <div class="mfoot">
      <button class="btn" onclick="G.openDogPlay()">More games</button>
      <button class="btn ghost" onclick="G.closeModal()">Leave her to it</button>
    </div>`);
  if(d) { try{ sfx('bark'); }catch(e){} }
}

/* ---------- calling her out of the kennel ---------- */
G.callDogOut = function(){
  const d = S.dog;
  if(!d){ if(typeof toast==='function') toast('You have no dog','bad'); return; }
  const home = (typeof kennelSpot === 'function') ? kennelSpot() : null;
  if(!home){ if(typeof toast==='function') toast('No kennel to call her out of','bad'); return; }
  if((d.outCool || 0) > 0) return;
  d.outCool = 4;

  /* out of the mouth and into the yard, then her own mind resumes */
  d.x = home.x; d.y = home.y;
  d.burst = 1.5;                        /* seconds of running out */
  d.burstX = home.x + (Math.random() < 0.5 ? -1 : 1) * (60 + Math.random()*50);
  d.burstY = home.y + 46 + Math.random()*26;
  d.state = 'run';
  d.task = null; d.taskT = 0;           /* drop whatever she was doing */

  try{ sfx('bark'); }catch(e){}
  setTimeout(()=>{ try{ sfx('bark'); }catch(e){} }, 260);
  setTimeout(()=>{ try{ sfx('growl'); }catch(e){} }, 620);
  if(typeof speak === 'function') try{ speak(d, 'woof!'); }catch(e){}
  if(typeof toast === 'function') toast(`${d.name} shot out of the kennel`, 'good');
};

/* the burst runs on the existing tick, ahead of her own decision */
if(typeof tickDog === 'function'){
  const _tickDogBurst = tickDog;
  tickDog = function(dt){
    const d = S.dog;
    try{
      if(d){
        d.outCool = Math.max(0, (d.outCool || 0) - dt);
        if(d.burst > 0){
          d.burst -= dt;
          const dx = d.burstX - d.x, dy = d.burstY - d.y;
          const dist = Math.hypot(dx, dy) || 1;
          if(dist > 6){
            const k = Math.min(1, 150*dt/dist);      /* faster than any goal she sets */
            d.x += dx*k; d.y += dy*k;
            if(Math.abs(dx) > 2) d.dir = dx < 0 ? -1 : 1;
          }
          d.state = 'run';
          if(typeof paintDog === 'function') paintDog();
          return;                                    /* her mind waits its turn */
        }
      }
    }catch(e){}
    return _tickDogBurst.apply(this, arguments);
  };
}

/* clicking the kennel is what calls her */
function wireKennelClick(){
  try{
    const k = (typeof kennelObj === 'function') ? kennelObj() : null;
    if(!k) return;
    const el = document.querySelector(`.ob[data-id="${k.id}"]`);
    if(!el || el.dataset.dogwired) return;
    el.dataset.dogwired = '1';
    el.style.cursor = 'pointer';
    el.addEventListener('click', ()=>{ try{ G.callDogOut(); }catch(e){} });
  }catch(e){}
}
if(typeof render === 'function'){
  const _renderKennelClick = render;
  render = function(){
    const r = _renderKennelClick.apply(this, arguments);
    try{ wireKennelClick(); }catch(e){}
    return r;
  };
}

/* ---------- the games hub ---------- */
const DOG_GAMES = [
  ['fetch',  'Fetch',        'She tears after the stick. Call her at the right moment.'],
  ['scent',  'Scent trail',  'Nine places. She works out warmer or colder as she goes.'],
  ['weave',  'Weave',        'Five poles, five stops. Miss one and she clips it.'],
  ['tug',    'Tug of war',   'Hold on. Let go too late and she has it off you.'],
  ['round',  'Round-up',     'Four out. Nearest first, against the clock.'],
];

G.openDogPlay = function(){
  const d = S.dog;
  if(!d){ if(typeof toast==='function') toast('You have no dog','bad'); return; }
  dogPlayState();
  const bond = Math.round((d.bond === undefined ? 0.35 : d.bond) * 100);
  modal(`<h2>${d.name} plays</h2>
    <p class="sub">Five things she is good at. One round of each a day — she is a dog, not a
      slot machine. What they build is her opinion of you, which is what everything else
      she does runs on.</p>
    <div class="ledrow"><span>How she rates you</span><b>${bond}%</b></div>
    <div class="bar" style="margin:4px 0 12px"><i style="transform:scaleX(${
      ((d.bond===undefined?0.35:d.bond)).toFixed(3)});background:#7cc24f"></i></div>
    <div class="mkgrid">
      ${DOG_GAMES.map(g=>`<button class="mkcard" ${dogPlayed(g[0])?'disabled':''}
        onclick="G.dogGame('${g[0]}')"><b>${g[1]}</b><span class="muted">${g[2]}</span>
        <span class="lprice">${dogPlayed(g[0])?'Played today':'Have a go'}</span></button>`).join('')}
    </div>
    <div class="mfoot"><button class="btn ghost" onclick="G.closeModal()">Not now</button></div>`);
};

G.dogGame = function(k){
  if(dogPlayed(k)) return toast('She has had her go at that today','');
  ({ fetch:dogFetch, scent:dogScent, weave:dogWeave, tug:dogTug, round:dogRound })[k]();
};

/* ---------- 1. fetch: a timing bar ---------- */
const FETCH = { raf:0, t:0, on:false };
function dogFetch(){
  FETCH.on = true; FETCH.t = 0;
  modal(`<h2>Fetch</h2>
    <p class="sub">She is already going. The marker runs out and comes back — call her
      when it is in the green and she turns on a sixpence.</p>
    <div class="dogbar"><div class="dogzone"></div><i id="fetchpin"></i></div>
    <div class="mfoot">
      <button class="btn" onclick="G.fetchCall()">Call her</button>
      <button class="btn ghost" onclick="G.fetchQuit()">Leave it</button>
    </div>`);
  const step = ()=>{
    if(!FETCH.on) return;
    FETCH.t += 0.016;
    const p = (Math.sin(FETCH.t*2.1) + 1) / 2;           /* out and back */
    const pin = document.getElementById('fetchpin');
    if(pin) pin.style.left = (p*100).toFixed(1) + '%';
    FETCH.p = p;
    FETCH.raf = requestAnimationFrame(step);
  };
  FETCH.raf = requestAnimationFrame(step);
}
G.fetchQuit = function(){ FETCH.on = false; cancelAnimationFrame(FETCH.raf); G.openDogPlay(); };
G.fetchCall = function(){
  FETCH.on = false; cancelAnimationFrame(FETCH.raf);
  const p = FETCH.p || 0;
  const off = Math.abs(p - 0.5);                          /* green is the middle fifth */
  const d = S.dog;
  if(off < 0.10){
    dogReward('fetch', 0.025, 3, `${d.name} turned on a sixpence and brought the stick straight back.`, 'good');
    dogBack('Straight back', `<p class="sub">Perfect call. She dropped it at your feet and
      waited for the next one.</p><p class="sub">She rates you a little more.</p>`);
  } else if(off < 0.22){
    dogReward('fetch', 0.010, 1, `${d.name} came back with the stick, in her own time.`, '');
    dogBack('Got there', `<p class="sub">A beat late, so she made a loop of it first.</p>`);
  } else {
    dogReward('fetch', 0.002, 0, `${d.name} kept the stick.`, '');
    dogBack('She kept it', `<p class="sub">You called far too early and she decided the
      stick was hers now. She is under the hedge with it.</p>`);
  }
};

/* ---------- 2. scent trail: warmer or colder ---------- */
const SCENT = { at:0, tries:3 };
function dogScent(){
  SCENT.at = Math.floor(Math.random()*9); SCENT.tries = 3;
  modal(`<h2>Scent trail</h2>
    <p class="sub">Something is buried under one of the nine. Three goes — after each one
      she will tell you whether you are getting warmer.</p>
    <div class="dowsegrid">${Array.from({length:9},(_,i)=>
      `<button class="dowsecell" id="sc${i}" onclick="G.scentPick(${i})"></button>`).join('')}</div>
    <div class="muted" id="scentinfo" style="margin-top:8px">Three goes.</div>
    <div class="mfoot"><button class="btn ghost" onclick="G.openDogPlay()">Leave it</button></div>`);
}
G.scentPick = function(i){
  const cell = document.getElementById('sc'+i);
  if(!cell || cell.disabled) return;
  cell.disabled = true;
  const d = S.dog;
  if(i === SCENT.at){
    cell.classList.add('hit'); cell.textContent = '🦴';
    try{ sfx('bark'); }catch(e){}
    dogReward('scent', 0.025, 2, `${d.name} dug it straight out on the scent trail.`, 'good');
    dogBack('Found it', `<p class="sub">Nose down, tail going, straight to it.</p>`);
    return;
  }
  cell.classList.add('miss');
  /* distance on the 3×3, so "warmer" means something */
  const dist = Math.abs(i%3 - SCENT.at%3) + Math.abs(Math.floor(i/3) - Math.floor(SCENT.at/3));
  cell.textContent = dist <= 1 ? '·' : '×';
  SCENT.tries--;
  const info = document.getElementById('scentinfo');
  if(SCENT.tries > 0){
    if(info) info.textContent = (dist <= 1 ? 'She is very interested in that one — close.'
      : dist <= 2 ? 'Warmer.' : 'Cold. She has wandered off to look elsewhere.')
      + ` ${SCENT.tries} go${SCENT.tries>1?'es':''} left.`;
    return;
  }
  dogReward('scent', 0.005, 0, `${d.name} lost the scent trail.`, '');
  dogBack('Lost it', `<p class="sub">It was under number ${SCENT.at+1}. She has gone to
    sit down.</p>`);
};

/* ---------- 3. weave: five stops ---------- */
const WEAVE = { raf:0, on:false, pole:0, hit:0, t:0 };
function dogWeave(){
  WEAVE.on = true; WEAVE.pole = 0; WEAVE.hit = 0; WEAVE.t = 0;
  weaveDraw();
  const step = ()=>{
    if(!WEAVE.on) return;
    WEAVE.t += 0.016;
    const p = (Math.sin(WEAVE.t * (2.4 + WEAVE.pole*0.5)) + 1) / 2;   /* faster each pole */
    WEAVE.p = p;
    const pin = document.getElementById('weavepin');
    if(pin) pin.style.left = (p*100).toFixed(1) + '%';
    WEAVE.raf = requestAnimationFrame(step);
  };
  WEAVE.raf = requestAnimationFrame(step);
}
function weaveDraw(){
  modal(`<h2>Weave — pole ${WEAVE.pole+1} of 5</h2>
    <p class="sub">Stop her in the green at each pole. She speeds up as she goes.</p>
    <div class="dogbar"><div class="dogzone"></div><i id="weavepin"></i></div>
    <div class="muted" style="margin-top:8px">Clean so far: <b>${WEAVE.hit}</b></div>
    <div class="mfoot">
      <button class="btn" onclick="G.weaveStop()">Through</button>
      <button class="btn ghost" onclick="G.weaveQuit()">Leave it</button>
    </div>`);
}
G.weaveQuit = function(){ WEAVE.on = false; cancelAnimationFrame(WEAVE.raf); G.openDogPlay(); };
G.weaveStop = function(){
  if(Math.abs((WEAVE.p||0) - 0.5) < 0.12) WEAVE.hit++;
  else { try{ sfx('whine'); }catch(e){} }
  WEAVE.pole++;
  if(WEAVE.pole < 5){ weaveDraw(); return; }
  WEAVE.on = false; cancelAnimationFrame(WEAVE.raf);
  const d = S.dog, n5 = WEAVE.hit;
  const bond = n5 >= 5 ? 0.030 : n5 >= 3 ? 0.015 : 0.005;
  dogReward('weave', bond, n5 >= 4 ? 3 : 1,
    `${d.name} went through ${n5} of the five poles clean.`, n5 >= 4 ? 'good' : '');
  dogBack(n5 >= 5 ? 'Clear round' : n5 >= 3 ? 'Good run' : 'Scrappy',
    `<p class="sub">${n5} of 5 clean.${n5 >= 5 ? ' Not a pole touched.' :
      n5 === 0 ? ' She took the lot out and looked delighted about it.' : ''}</p>`);
};

/* ---------- 4. tug of war: hold and let go ---------- */
const TUG = { raf:0, on:false, pull:0 };
function dogTug(){
  TUG.on = true; TUG.pull = 0;
  modal(`<h2>Tug of war</h2>
    <p class="sub">Hold on and the pull builds. The longer you hold the more it is worth —
      but she is stronger than you and past the red she has it.</p>
    <div class="dogbar"><i id="tugpin" style="left:0%"></i></div>
    <div class="muted" id="tuginfo" style="margin-top:8px">Hold.</div>
    <div class="mfoot">
      <button class="btn" id="tugbtn"
        onmousedown="G.tugHold()" onmouseup="G.tugLet()"
        ontouchstart="G.tugHold()" ontouchend="G.tugLet()">Hold on</button>
      <button class="btn ghost" onclick="G.tugQuit()">Leave it</button>
    </div>`);
}
G.tugQuit = function(){ TUG.on = false; cancelAnimationFrame(TUG.raf); G.openDogPlay(); };
G.tugHold = function(){
  if(!TUG.on) return;
  const step = ()=>{
    if(!TUG.on) return;
    TUG.pull += 0.0085;
    const pin = document.getElementById('tugpin');
    if(pin) pin.style.left = Math.min(100, TUG.pull*100).toFixed(1) + '%';
    const info = document.getElementById('tuginfo');
    if(info) info.textContent = TUG.pull > 0.82 ? 'She is winning this.'
      : TUG.pull > 0.6 ? 'Digging her heels in.' : 'Holding.';
    if(TUG.pull >= 1){ G.tugLet(true); return; }
    TUG.raf = requestAnimationFrame(step);
  };
  TUG.raf = requestAnimationFrame(step);
};
G.tugLet = function(lost){
  if(!TUG.on) return;
  TUG.on = false; cancelAnimationFrame(TUG.raf);
  const d = S.dog, p = TUG.pull;
  if(lost || p >= 1){
    try{ sfx('growl'); }catch(e){}
    dogReward('tug', 0.005, 0, `${d.name} took the rope clean off you.`, '');
    dogBack('She has it', `<p class="sub">Straight out of your hands and off round the
      yard with it. She is not bringing it back.</p>`);
    return;
  }
  const bond = p > 0.82 ? 0.030 : p > 0.55 ? 0.020 : 0.010;
  dogReward('tug', bond, p > 0.7 ? 3 : 1,
    `A long tug of war with ${d.name}.`, p > 0.7 ? 'good' : '');
  dogBack(p > 0.82 ? 'Right to the edge' : 'Good tug',
    `<p class="sub">You let go at ${Math.round(p*100)}%.${
      p > 0.82 ? ' Any longer and she would have had it.' : ''}</p>`);
};

/* ---------- 5. round-up: nearest first ---------- */
const ROUND = { list:[], t:0, raf:0, on:false };
function dogRound(){
  ROUND.on = true; ROUND.t = 14;
  ROUND.list = Array.from({length:4}, (_,i)=>({ i, d: 20 + Math.round(Math.random()*90), got:0 }));
  roundDraw();
  const step = ()=>{
    if(!ROUND.on) return;
    ROUND.t -= 0.016;
    const el = document.getElementById('roundt');
    if(el) el.textContent = Math.max(0, ROUND.t).toFixed(1) + 's';
    if(ROUND.t <= 0){ G.roundEnd(); return; }
    ROUND.raf = requestAnimationFrame(step);
  };
  ROUND.raf = requestAnimationFrame(step);
}
function roundDraw(){
  modal(`<h2>Round-up</h2>
    <p class="sub">Four out on the hill. Send her to the nearest one first — go out of
      order and she has to double back.</p>
    <div class="mkgrid">
      ${ROUND.list.map(s=>`<button class="mkcard" ${s.got?'disabled':''}
        onclick="G.roundSend(${s.i})"><b>${s.got?'In':'Stray'}</b>
        <span class="muted">${s.d}m out</span>
        <span class="lprice">${s.got?'Home':'Send her'}</span></button>`).join('')}
    </div>
    <div class="muted" style="margin-top:8px">Time left: <b id="roundt">${ROUND.t.toFixed(1)}s</b></div>
    <div class="mfoot"><button class="btn ghost" onclick="G.roundQuit()">Call it off</button></div>`);
}
G.roundQuit = function(){ ROUND.on = false; cancelAnimationFrame(ROUND.raf); G.openDogPlay(); };
G.roundSend = function(i){
  const s = ROUND.list.find(x=>x.i === i);
  if(!s || s.got) return;
  const left = ROUND.list.filter(x=>!x.got);
  const nearest = left.reduce((a,b)=>b.d < a.d ? b : a, left[0]);
  s.got = 1;
  if(s !== nearest){ ROUND.t -= 3; try{ sfx('whine'); }catch(e){} }
  else try{ sfx('bark'); }catch(e){}
  if(ROUND.list.every(x=>x.got)){ G.roundEnd(); return; }
  roundDraw();
};
G.roundEnd = function(){
  ROUND.on = false; cancelAnimationFrame(ROUND.raf);
  const d = S.dog;
  const got = ROUND.list.filter(x=>x.got).length;
  const time = Math.max(0, ROUND.t);
  const bond = got === 4 ? (time > 6 ? 0.035 : 0.025) : got >= 2 ? 0.010 : 0.002;
  dogReward('round', bond, got === 4 ? 4 : 1,
    `${d.name} brought ${got} of the four in.`, got === 4 ? 'good' : '');
  dogBack(got === 4 ? 'All four in' : 'Time',
    `<p class="sub">${got} of four, with ${time.toFixed(1)}s on the clock.${
      got === 4 && time > 6 ? ' Not a wasted step.' : ''}</p>`);
};

/* ---------- the button, beside the other world buttons ---------- */
if(typeof syncWorldButtons === 'function'){
  const _syncDogPlay = syncWorldButtons;
  syncWorldButtons = function(){
    const r = _syncDogPlay.apply(this, arguments);
    try{
      const host = document.getElementById('zoomctl');
      if(!host) return r;
      let b = document.getElementById('dogplaybtn');
      if(!b){
        b = document.createElement('button');
        b.id = 'dogplaybtn';
        b.textContent = '🎾';
        b.title = 'Play with the dog';
        b.setAttribute('data-tip','<b>Play with her</b>Five games. What they build is her opinion of you, which everything else she does runs on.');
        b.onclick = ()=>G.openDogPlay();
        host.insertBefore(b, host.firstChild);
      }
      b.style.display = S.dog ? '' : 'none';
    }catch(e){}
    return r;
  };
}

(function dogPlayCss(){
  const s = document.createElement('style');
  s.textContent = `
  #dogplaybtn{ font-size:15px; line-height:1 }
  .dogbar{ position:relative; height:26px; border-radius:9px; background:#141b10;
    border:1px solid var(--line2); margin:10px 0 2px; overflow:hidden; }
  .dogzone{ position:absolute; left:40%; width:20%; top:0; bottom:0;
    background:linear-gradient(180deg,rgba(124,194,79,.42),rgba(77,143,60,.30)); }
  .dogbar i{ position:absolute; top:2px; bottom:2px; width:4px; border-radius:2px;
    background:var(--gold); box-shadow:0 0 8px rgba(240,193,75,.7); }
  `;
  document.head.appendChild(s);
})();

/* ---------- handle ---------- */
G.dogPlayAudit = function(){
  const d = S.dog;
  if(!d) return { dog:false, games:DOG_GAMES.map(g=>g[1]) };
  const P = dogPlayState();
  const k = (typeof kennelObj === 'function') ? kennelObj() : null;
  const home = (typeof kennelSpot === 'function') ? kennelSpot() : null;
  return {
    dog:d.name,
    bond:+(d.bond||0).toFixed(2),
    kennel: k ? 'built' : 'none',
    sleepsAt: home ? `${Math.round(home.x)},${Math.round(home.y)}` : '—',
    insideTheKennel: !!(k && home && Math.abs(d.x-home.x) < 14 && Math.abs(d.y-home.y) < 14),
    kennelClickWired: !!(k && document.querySelector(`.ob[data-id="${k.id}"][data-dogwired]`)),
    burstingOutNow: (d.burst || 0) > 0,
    callCooldown: +(d.outCool || 0).toFixed(1),
    games: DOG_GAMES.map(g=>({ game:g[1], playedToday: dogPlayed(g[0]) })),
    roundsWon: P.won,
    buttonInDom: !!document.getElementById('dogplaybtn'),
  };
};
