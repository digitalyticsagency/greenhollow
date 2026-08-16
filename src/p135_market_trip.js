/* =====================================================================
   THE MARKET IS SOMEWHERE ELSE, AND YOU DRIVE THERE

   p133 let you walk onto the market ground, but the market ground is a
   corner of your own farm — your beds and your barn are still in shot,
   and it never stopped feeling like the same field with bunting on it.

   So the market moves off the farm entirely. This is the ride's
   architecture from p110, for the same reason the ride uses it: a place
   that is not your farm should not be drawn by the thing that draws your
   farm. A full-bleed overlay owns the whole screen, the farm is not
   visible at all while you are away, and when you come back it is exactly
   where you left it.

   YOU DRIVE. Clicking go puts the family in the truck and takes them
   down the lane — five parallax bands, hedges and poles going past, the
   farm shrinking behind you and the market town coming up ahead. It takes
   about seven seconds each way and you can skip it. Coming home is the
   same road the other way round.

   THE MARKET ITSELF is a street you walk along rather than a list: two
   rows of stalls under a graded sky with hills behind, traders standing
   at their pitches, a crowd moving through it. Arrow keys or click to
   walk. Stand in front of a stall and it tells you what it is; the
   judging tent, the supply stall, the relief fund, the sideshow and the
   three ground games from p133 are all pitched along the street.

   Every activity is the same call p133 already made, so nothing is
   implemented twice — the dialog and its tabs are still what opens, and
   the market's rules, prices and scoring are untouched.
   ===================================================================== */

let MTRIP = null;

/* p133's on-farm visit is superseded: one market, not two. Its backdrop
   and its bar are keyed off atTheMarket, so this switches both off
   without unpicking the file. */
if(typeof atTheMarket === 'function'){
  atTheMarket = function(){ return false; };
}

const MSTALLS = [
  { p:0.10, n:'Judging tent',    d:'Enter what you grew',            go:()=>marketOpenTab('Judging'),
    c:'#c8583f' },
  { p:0.24, n:'Supply stall',    d:'Seed, tools and stock',          go:()=>marketOpenTab('Supplies'),
    c:'#4f7f96' },
  { p:0.38, n:'Hook a duck',     d:'Three hooks, one pond',          go:()=>G.playHookDuck(),
    c:'#6fb6d8' },
  { p:0.52, n:'Coconut shy',     d:'Three balls at five coconuts',   go:()=>G.playCoconut(),
    c:'#b98a4a' },
  { p:0.66, n:'Guess the beast', d:'One guess at the prize bullock', go:()=>G.playHeaviest(),
    c:'#8a9a3f' },
  { p:0.80, n:'Sideshow row',    d:'Every game on the field',        go:()=>marketOpenTab('Sideshow'),
    c:'#a98fd6' },
  { p:0.93, n:'Relief fund',     d:'For growers who lost a season',  go:()=>marketOpenTab('Relief fund'),
    c:'#e8a33d' },
];

/* ---------- the layer ---------- */
function mktLayer(){
  let el = document.getElementById('mktlay');
  if(!el){
    const host = document.getElementById('world') || document.body;
    el = document.createElementNS('http://www.w3.org/2000/svg','svg');
    el.id = 'mktlay';
    el.setAttribute('preserveAspectRatio','none');
    el.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;z-index:44;';
    host.appendChild(el);
  }
  return el;
}

/* ---------- going ---------- */
G.goToMarket = function(){
  if(MTRIP) return;
  if(!(S.market && S.market.active)){
    if(typeof toast === 'function') toast('There is no market on today','bad');
    return;
  }
  if(typeof G.wakeTheWorld === 'function') G.wakeTheWorld();
  MTRIP = { phase:'out', t:0, dur:6.5, x:0, px:0.10, walk:0, near:null, dir:1 };
  mktLayer();
  mktBar();
  document.addEventListener('keydown', mktKey);
  if(typeof log === 'function') log('You took the family down to the market.', '', 'farm');
  if(typeof sfx === 'function') try{ sfx('click'); }catch(e){}
};

G.leaveMarket = function(){
  if(!MTRIP) return;
  MTRIP.phase = 'home'; MTRIP.t = 0;
};
G.skipDrive = function(){
  if(!MTRIP) return;
  if(MTRIP.phase === 'out'){ MTRIP.phase = 'at'; MTRIP.t = 0; }
  else if(MTRIP.phase === 'home') mktEnd();
};

function mktEnd(){
  MTRIP = null;
  document.removeEventListener('keydown', mktKey);
  const el = document.getElementById('mktlay'); if(el) el.remove();
  const b = document.getElementById('mktripbar'); if(b) b.remove();
  if(typeof toast === 'function') toast('Home again', '');
  if(typeof ui === 'function') try{ ui(); }catch(e){}
  if(typeof save === 'function') try{ save(); }catch(e){}
}

function mktKey(e){
  if(!MTRIP) return;
  if(e.key === 'Escape'){ G.leaveMarket(); e.preventDefault(); return; }
  if(MTRIP.phase !== 'at') return;
  if(e.key === 'ArrowLeft'  || e.key === 'a'){ MTRIP.walk = -1; e.preventDefault(); }
  if(e.key === 'ArrowRight' || e.key === 'd'){ MTRIP.walk =  1; e.preventDefault(); }
  if(e.key === 'Enter' || e.key === ' '){
    if(MTRIP.near){ try{ MTRIP.near.go(); }catch(err){} }
    e.preventDefault();
  }
}
document.addEventListener('keyup', (e)=>{
  if(MTRIP && ['ArrowLeft','ArrowRight','a','d'].includes(e.key)) MTRIP.walk = 0;
});

/* ---------- the tick ---------- */
function tickTrip(dt){
  if(!MTRIP) return;
  const M = MTRIP;
  M.t += dt;
  if(M.phase === 'out'){
    M.x += dt * 240;
    if(M.t >= M.dur){ M.phase = 'at'; M.t = 0; }
  } else if(M.phase === 'home'){
    /* The truck is mirrored for the run home, but the scenery kept
       scrolling the same way — so it faced left while the world moved as
       though it were still going right, and the whole thing read as
       driving backwards. The road runs the other way now, which is what
       turning round actually looks like. */
    M.x -= dt * 240;
    if(M.t >= M.dur){ mktEnd(); return; }
  } else {
    /* walking the street */
    if(M.walk){ M.px = Math.max(0.03, Math.min(0.97, M.px + M.walk*dt*0.16)); M.dir = M.walk; }
    M.near = null;
    let best = 1;
    MSTALLS.forEach(s=>{
      const d = Math.abs(s.p - M.px);
      if(d < 0.055 && d < best){ best = d; M.near = s; }
    });
  }
  paintTrip();
  mktBar();
}

/* JS % keeps the sign of the left operand, so once the journey counter
   passes the tile width every roadside object computed a NEGATIVE offset
   and every hedge, pole and road marking sat off the left of the screen.
   The drive looked like an empty field going past. */
function wrapX(v, m){ return ((v % m) + m) % m; }

/* ---------- the drive ---------- */
function driveArt(W, H, M){
  const k = Math.min(1, M.t / M.dur);
  const home = M.phase === 'home';
  let s = '';
  /* sky and the sun low over the lane */
  s += `<defs><linearGradient id="gTrip" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#8fc0e4"/><stop offset="0.6" stop-color="#d8e8ef"/>
    <stop offset="1" stop-color="#efe3c4"/></linearGradient></defs>`;
  s += `<rect x="0" y="0" width="${n(W)}" height="${n(H)}" fill="url(#gTrip)"/>`;
  s += `<circle cx="${n(W*0.76)}" cy="${n(H*0.20)}" r="${n(H*0.07)}" fill="#ffe9a8" opacity=".9"/>`;

  const band = (rate, baseY, amp, fill, seed)=>{
    const step = 120, off = -((M.x*rate) % step);
    let d = `M${n(off-step)} ${n(H)}`;
    for(let i=0;i<=Math.ceil(W/step)+3;i++){
      const px = off - step + i*step;
      const py = baseY*H - (hash(i*3.1+seed)*0.6 + hash(i*1.7+seed)*0.4)*amp*H;
      d += ` L${n(px)} ${n(py)}`;
    }
    d += ` L${n(off + W + step*2)} ${n(H)} Z`;
    return `<path d="${d}" fill="${fill}"/>`;
  };
  s += band(0.12, 0.56, 0.13, '#9fb6a8', 2);
  s += band(0.30, 0.66, 0.10, '#7d9a72', 6);
  s += band(0.55, 0.74, 0.06, '#6d8a5c', 9);

  /* the lane */
  const roadY = H*0.78;
  s += `<rect x="0" y="${n(roadY)}" width="${n(W)}" height="${n(H-roadY)}" fill="#b9a882"/>`;
  s += `<rect x="0" y="${n(roadY)}" width="${n(W)}" height="4" fill="#8d7f60"/>`;
  for(let i=0;i<14;i++){
    const dx = wrapX(i*140 - M.x*1.6, W+140) - 70;
    s += `<rect x="${n(dx)}" y="${n(roadY + (H-roadY)*0.52)}" width="46" height="4" rx="2"
      fill="#efe6cc" opacity=".8"/>`;
  }
  /* hedges and poles going past */
  for(let i=0;i<10;i++){
    const dx = wrapX(i*190 - M.x*1.15, W+220) - 110;
    s += `<rect x="${n(dx)}" y="${n(roadY-56)}" width="5" height="56" fill="#6b5335"/>`;
    s += `<rect x="${n(dx-16)}" y="${n(roadY-58)}" width="37" height="5" fill="#6b5335"/>`;
  }
  for(let i=0;i<16;i++){
    const dx = wrapX(i*110 - M.x*1.5, W+140) - 70;
    s += `<ellipse cx="${n(dx)}" cy="${n(roadY-8)}" rx="34" ry="15" fill="#5f7f48"/>`;
    s += `<ellipse cx="${n(dx-9)}" cy="${n(roadY-13)}" rx="20" ry="9" fill="#749a58" opacity=".85"/>`;
  }

  /* where you are going, coming up ahead */
  const townIn = Math.max(0, (k - 0.5)/0.5);
  if(townIn > 0){
    const tx = W*0.62, ty = roadY - 46;
    s += `<g opacity="${townIn.toFixed(2)}">`;
    for(let i=0;i<5;i++){
      s += `<rect x="${n(tx + i*34)}" y="${n(ty - 18 - (i%2)*10)}" width="28"
        height="${n(24 + (i%2)*10)}" fill="#c8b89a"/>`;
      s += `<path d="M${n(tx + i*34 - 3)} ${n(ty - 18 - (i%2)*10)}
        l17 -11 l17 11 z" fill="${['#c8583f','#4f7f96','#8a6a45','#6f8b52','#b98a4a'][i]}"/>`;
    }
    s += `</g>`;
  }

  /* the truck, and the family in it */
  const cx = W*0.34 + Math.sin(M.t*9)*1.6, cy = roadY + (H-roadY)*0.30;
  const flip = home ? -1 : 1;
  s += `<g transform="translate(${n(cx)},${n(cy)}) scale(${flip},1)">`;
  s += `<ellipse cx="6" cy="26" rx="60" ry="8" fill="#000" opacity=".18"/>`;
  /* bed of the truck with the family standing in it */
  s += `<rect x="-58" y="-14" width="62" height="30" rx="3" fill="#7d5f3c"/>`;
  const fam = (typeof S.family === 'object' && S.family) ? S.family.slice(0,4) : [];
  const riders = Math.max(2, fam.length + 1);
  for(let i=0;i<riders;i++){
    const rx = -50 + i*14, bob = Math.sin(M.t*7 + i)*1.4;
    s += `<circle cx="${n(rx)}" cy="${n(-22+bob)}" r="5" fill="#efc9a4"/>`;
    s += `<rect x="${n(rx-4)}" y="${n(-18+bob)}" width="8" height="10" rx="3"
      fill="${['#c8583f','#4f7f96','#8a5f9c','#6f8b52','#e8a33d'][i%5]}"/>`;
  }
  /* cab */
  s += `<rect x="4" y="-20" width="34" height="36" rx="4" fill="#c8583f"/>`;
  s += `<rect x="10" y="-15" width="22" height="15" rx="2" fill="#cfe4ef" opacity=".9"/>`;
  s += `<rect x="-60" y="10" width="100" height="8" rx="3" fill="#5a4630"/>`;
  /* wheels, turning */
  [-40, 26].forEach(wx=>{
    s += `<circle cx="${n(wx)}" cy="18" r="11" fill="#2f2a26"/>`;
    s += `<circle cx="${n(wx)}" cy="18" r="4.6" fill="#8d979d"/>`;
    s += `<g transform="translate(${n(wx)},18) rotate(${wrapX(M.x*2.2, 360)})">
      <rect x="-4.6" y="-0.9" width="9.2" height="1.8" fill="#5f696f"/></g>`;
  });
  s += `</g>`;

  /* dust behind */
  for(let i=0;i<6;i++){
    const a = hash(i*3.7 + Math.floor(M.t*4));
    /* dust trails behind the truck, so it swaps sides when it turns round */
    s += `<circle cx="${n(cx - flip*(70 + i*16 + a*20))}" cy="${n(cy + 18 - a*8)}"
      r="${n(5 + a*7)}" fill="#d8cbae" opacity="${(0.32 - i*0.045).toFixed(2)}"/>`;
  }

  s += `<text x="${n(W/2)}" y="${n(H*0.10)}" text-anchor="middle" font-size="15"
    fill="#3d4a35" style="font-family:inherit" opacity=".8">${
      home ? 'Heading home' : 'On the way to market'}</text>`;
  return s;
}

/* ---------- the market street ---------- */
function streetArt(W, H, M){
  let s = '';
  s += `<defs><linearGradient id="gStreet" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#8fc4e8"/><stop offset="0.52" stop-color="#d4e6ef"/>
    <stop offset="1" stop-color="#e9ddc0"/></linearGradient></defs>`;
  s += `<rect x="0" y="0" width="${n(W)}" height="${n(H)}" fill="url(#gStreet)"/>`;
  const hz = H*0.40;
  /* hills behind the town */
  const ridge = (base, amp, fill, op, seed)=>{
    let d = `M0 ${n(base+70)} L0 ${n(base)}`;
    for(let i=0;i<=18;i++){
      const px = W*i/18;
      const py = base - (hash(i*3.1+seed)*0.55 + hash(i*1.9+seed)*0.45)*amp;
      d += ` L${n(px)} ${n(py)}`;
    }
    d += ` L${n(W)} ${n(base+70)} Z`;
    return `<path d="${d}" fill="${fill}" opacity="${op}"/>`;
  };
  s += ridge(hz-16, H*0.14, '#a6b8c0', 0.6, 4);
  s += ridge(hz,    H*0.10, '#83997e', 0.85, 11);
  /* the ground of the market */
  s += `<rect x="0" y="${n(hz)}" width="${n(W)}" height="${n(H-hz)}" fill="#8fae5c"/>`;
  s += `<rect x="0" y="${n(hz)}" width="${n(W)}" height="${n((H-hz)*0.10)}" fill="#a4c46e" opacity=".7"/>`;
  /* the trodden street down the middle */
  const roadY = hz + (H-hz)*0.52;
  s += `<rect x="0" y="${n(roadY-26)}" width="${n(W)}" height="52" fill="#c2b18a"/>`;
  s += `<rect x="0" y="${n(roadY-26)}" width="${n(W)}" height="3" fill="#a2916a" opacity=".7"/>`;

  /* the stalls, laid along the street */
  const spanX = (p)=> (p - M.px)*W*2.6 + W*0.5;
  MSTALLS.forEach((st, i)=>{
    const x = spanX(st.p);
    if(x < -160 || x > W+160) return;
    const back = i % 2 === 0;
    const y = back ? roadY - 74 : roadY + 34;
    const on = M.near === st;
    s += `<g opacity="${back ? 1 : 1}">`;
    /* awning */
    s += `<rect x="${n(x-52)}" y="${n(y)}" width="104" height="34" rx="2" fill="#e9e2d0"/>`;
    for(let k2=0;k2<6;k2++)
      s += `<rect x="${n(x-52 + k2*17.4)}" y="${n(y)}" width="8.7" height="34" fill="${st.c}" opacity=".85"/>`;
    s += `<rect x="${n(x-56)}" y="${n(y+30)}" width="112" height="7" rx="3" fill="#8a7a58"/>`;
    /* counter and goods */
    s += `<rect x="${n(x-44)}" y="${n(y+37)}" width="88" height="20" rx="2" fill="#a98a5c"/>`;
    for(let k2=0;k2<5;k2++)
      s += `<circle cx="${n(x-33 + k2*16)}" cy="${n(y+41)}" r="4"
        fill="${['#c8583f','#e8a33d','#6f8b52','#b0524a','#d8c44a'][k2]}"/>`;
    /* the trader */
    s += `<circle cx="${n(x+16)}" cy="${n(y+30)}" r="5.4" fill="#efc9a4"/>`;
    s += `<rect x="${n(x+11)}" y="${n(y+35)}" width="11" height="14" rx="4" fill="#5f6b8a"/>`;
    /* sign */
    s += `<rect x="${n(x-46)}" y="${n(y-22)}" width="92" height="19" rx="3"
      fill="${on ? '#f0c14b' : '#efe6cc'}" stroke="#6b5335" stroke-width="1.4"/>`;
    s += `<text x="${n(x)}" y="${n(y-8.5)}" text-anchor="middle" font-size="10.5"
      fill="#3a2c18" style="font-family:inherit">${st.n}</text>`;
    s += `</g>`;
  });

  /* the crowd going about it */
  for(let i=0;i<16;i++){
    const a = hash(i*5.3), b = hash(i*2.7);
    const cx2 = wrapX(a*W*2.6 - M.px*W*2.6 + W*0.5 + i*37, W+120) - 60;
    const cy2 = roadY + (b-0.5)*40 + Math.sin(M.t*1.4 + i)*2;
    const col = ['#c8583f','#4f7f96','#8a5f9c','#6f8b52','#e8a33d','#a98fd6'][i%6];
    s += `<ellipse cx="${n(cx2)}" cy="${n(cy2+11)}" rx="6" ry="2.4" fill="#000" opacity=".16"/>`;
    s += `<circle cx="${n(cx2)}" cy="${n(cy2-8)}" r="4.6" fill="#efc9a4"/>`;
    s += `<rect x="${n(cx2-4)}" y="${n(cy2-4)}" width="8" height="13" rx="3" fill="${col}"/>`;
  }

  /* you */
  const yx = W*0.5, yy = roadY + 6;
  s += `<g transform="translate(${n(yx)},${n(yy)}) scale(${M.dir},1)">`;
  s += `<ellipse cx="0" cy="15" rx="8" ry="3" fill="#000" opacity=".2"/>`;
  s += `<circle cx="0" cy="-11" r="6" fill="#efc9a4"/>`;
  s += `<rect x="-6" y="-6" width="12" height="17" rx="4" fill="#c8583f"/>`;
  s += `<rect x="-5" y="10" width="4" height="7" rx="2" fill="#3f4a5a"/>`;
  s += `<rect x="1" y="10" width="4" height="7" rx="2" fill="#3f4a5a"/>`;
  s += `<path d="M-9 -14 q9 -5 18 0" stroke="#8a6a45" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  s += `</g>`;

  /* bunting over the street */
  for(let i=0;i<26;i++){
    const bx = (i*(W/24)) - 20;
    const sag = Math.sin(i*0.6)*6;
    s += `<path d="M${n(bx)} ${n(hz+10+sag)} l7 12 l7 -12 z"
      fill="${['#c8583f','#4f7f96','#e8a33d','#6f8b52'][i%4]}" opacity=".9"/>`;
  }
  return s;
}

function paintTrip(){
  const M = MTRIP; if(!M) return;
  const el = mktLayer(); if(!el) return;
  const box = el.getBoundingClientRect();
  const W = Math.max(320, box.width), H = Math.max(240, box.height);
  el.setAttribute('viewBox', `0 0 ${Math.round(W)} ${Math.round(H)}`);
  el.innerHTML = (M.phase === 'at') ? streetArt(W, H, M) : driveArt(W, H, M);
}

/* ---------- the bar ---------- */
function mktBar(){
  const M = MTRIP;
  let bar = document.getElementById('mktripbar');
  if(!M){ if(bar) bar.remove(); return; }
  const vp = document.getElementById('viewport') || document.body;

  /* Built ONCE and updated in place. It used to rewrite innerHTML on every
     tick, which meant the button you pressed on was destroyed and rebuilt
     between mousedown and mouseup — so the browser never matched the two
     up and no click event ever fired. Reported as "when I click it, it
     doesn't open anything", and it was right: the button was a new element
     sixty times a second. Same lesson as p115's wings — anything that
     depends on an element still being the same element breaks when you
     rebuild it every frame. */
  if(!bar){
    bar = document.createElement('div');
    bar.id = 'mktripbar';
    bar.innerHTML = `<span class="mkt-where"></span>
      <button class="mkt-do" id="mktdo"></button>
      <button class="mkt-do mkt-talk" id="mkttalk"></button>
      <span class="mkt-hint">← → to walk</span>
      <button class="mkt-skip" id="mktskip">Skip the drive</button>
      <button class="mkt-home" id="mkthome">Drive home</button>`;
    vp.appendChild(bar);
    bar.querySelector('#mktskip').onclick = ()=>G.skipDrive();
    bar.querySelector('#mkthome').onclick = ()=>G.leaveMarket();
    /* the action button reads the CURRENT stall at click time rather than
       closing over whichever one was near when it was created */
    bar.querySelector('#mktdo').onclick = ()=>{
      const near = MTRIP && MTRIP.near;
      if(near && near.go) try{ near.go(); }catch(e){}
    };
    bar.querySelector('#mkttalk').onclick = ()=>{
      const f = MTRIP && MTRIP.nearFolk;
      if(f && typeof G.talkFolk === 'function') try{ G.talkFolk(f.id); }catch(e){}
    };
  }

  const where = bar.querySelector('.mkt-where');
  const hint  = bar.querySelector('.mkt-hint');
  const doB   = bar.querySelector('#mktdo');
  const skip  = bar.querySelector('#mktskip');
  const home  = bar.querySelector('#mkthome');
  const at    = M.phase === 'at';

  const label = at ? 'Market' : (M.phase === 'home' ? 'Driving home' : 'On the way');
  if(where.textContent !== label) where.textContent = label;

  const want = at && M.near ? `${M.near.n} — ${M.near.d}` : '';
  if(doB.dataset.k !== want){
    doB.dataset.k = want;
    doB.textContent = want;
    doB.style.display = want ? '' : 'none';
  }
  /* the person is a second button, not a replacement for the stall */
  const talk = bar.querySelector('#mkttalk');
  const wantTalk = at && M.nearFolk ? `Talk to ${M.nearFolk.n}` : '';
  if(talk.dataset.k !== wantTalk){
    talk.dataset.k = wantTalk;
    talk.textContent = wantTalk;
    talk.style.display = wantTalk ? '' : 'none';
  }
  const hintOn = at ? '' : 'none';
  if(hint.style.display !== hintOn) hint.style.display = hintOn;
  const skipOn = at ? 'none' : '';
  if(skip.style.display !== skipOn) skip.style.display = skipOn;
  const homeOn = at ? '' : 'none';
  if(home.style.display !== homeOn) home.style.display = homeOn;
}

/* ---------- wire it in ---------- */
if(typeof tickPeople === 'function'){
  const _tickPeopleTrip = tickPeople;
  tickPeople = function(dt){
    const r = _tickPeopleTrip.apply(this, arguments);
    try{ if(MTRIP) tickTrip(Math.min(0.06, typeof dt === 'number' ? dt : 0.05)); }catch(e){}
    return r;
  };
}
/* the drive must keep running even with the sim paused, or the screen
   freezes mid-journey with a truck stopped on the road */
(function tripFrame(){
  let last = performance.now();
  function f(now){
    requestAnimationFrame(f);
    const dt = Math.min(0.06, (now-last)/1000); last = now;
    try{ if(MTRIP && (!S || S.speed === 0)) tickTrip(dt); }catch(e){}
  }
  requestAnimationFrame(f);
})();

if(typeof syncWorldButtons === 'function'){
  const _syncTrip = syncWorldButtons;
  syncWorldButtons = function(){
    const r = _syncTrip.apply(this, arguments);
    try{
      const b = document.getElementById('mktgobtn');
      if(b){
        b.onclick = ()=>G.goToMarket();
        b.title = 'Drive down to the market';
        b.setAttribute('data-tip','<b>Go to the market</b>The family get in the truck and drive down. It is a different place — you will not see the farm until you come back.');
      }
    }catch(e){}
    return r;
  };
}

(function tripCss(){
  const s = document.createElement('style');
  s.textContent = `
  #mktlay{ animation: mktin .5s ease; }
  @keyframes mktin{ from{ opacity:0 } to{ opacity:1 } }
  #mktripbar{ position:absolute; left:50%; transform:translateX(-50%); bottom:14px; z-index:66;
    display:flex; align-items:center; gap:8px; padding:7px 9px; border-radius:999px;
    background:rgba(20,27,16,.94); border:1px solid var(--line2); box-shadow:var(--shadow);
    font-family:var(--font); max-width:min(94vw,660px); }
  .mkt-where{ font-size:11px; font-weight:700; letter-spacing:.06em; text-transform:uppercase;
    color:var(--gold); padding:0 4px; white-space:nowrap; }
  .mkt-hint{ font-size:11px; color:var(--ink3); white-space:nowrap; }
  .mkt-do{ font-family:inherit; font-size:12.5px; font-weight:650; color:#0e1a09;
    background:linear-gradient(180deg,#f0c14b,#c99a2c); border-radius:999px;
    padding:7px 13px; cursor:pointer; white-space:nowrap; overflow:hidden;
    text-overflow:ellipsis; max-width:300px; }
  .mkt-talk{ background:linear-gradient(180deg,#9fd06a,#5f9a3c); }
  .mkt-home, .mkt-skip{ font-family:inherit; font-size:12px; color:var(--ink2);
    background:var(--panel2); border:1px solid var(--line); border-radius:999px;
    padding:6px 12px; cursor:pointer; white-space:nowrap; }
  .mkt-home:hover, .mkt-skip:hover{ color:var(--ink); border-color:var(--green); }
  @media (max-width:560px){ .mkt-hint{ display:none } }
  @media (prefers-reduced-motion: reduce){ #mktlay{ animation:none } }
  `;
  document.head.appendChild(s);
})();

/* clicking the street walks you toward that point */
document.addEventListener('click', (e)=>{
  if(!MTRIP || MTRIP.phase !== 'at') return;
  const el = document.getElementById('mktlay'); if(!el) return;
  const box = el.getBoundingClientRect();
  if(e.clientX < box.left || e.clientX > box.right) return;
  if(e.clientY < box.top  || e.clientY > box.bottom) return;
  if(e.target.closest && e.target.closest('#mktripbar')) return;
  const rel = (e.clientX - box.left) / box.width;
  MTRIP.px = Math.max(0.03, Math.min(0.97, MTRIP.px + (rel - 0.5) / 2.6));
  MTRIP.dir = rel > 0.5 ? 1 : -1;
}, true);

/* ---------- handle ---------- */
G.marketTripAudit = function(){
  if(!MTRIP) return { away:false, stalls:MSTALLS.map(s=>s.n),
    note:'the market is off the farm — you drive to it' };
  return {
    away:true,
    phase: MTRIP.phase === 'out' ? 'driving there'
         : MTRIP.phase === 'home' ? 'driving home' : 'at the market',
    secondsIntoPhase: +MTRIP.t.toFixed(1),
    alongTheStreet: +MTRIP.px.toFixed(2),
    standingAt: MTRIP.near ? MTRIP.near.n : 'between stalls',
    stalls: MSTALLS.map(s=>s.n),
    farmVisible: !document.getElementById('mktlay') ? 'yes' : 'no — the overlay covers it',
    ridersInTheTruck: 1 + ((S.family && S.family.length) || 0),
  };
};
