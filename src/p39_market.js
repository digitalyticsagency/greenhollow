/* =====================================================================
   THE FARMERS MARKET

   Five days, twice a season. The game lays out a market ground on
   whatever open land it can find, fills it with stalls and bunting,
   and the valley turns up.

   Three things happen there. You can enter produce and animals for
   judging, which is scored off what you have actually grown rather
   than a dice roll. You can play the sideshow games. And you can put
   money into the relief fund for farmers who have had a bad year.

   Doing well earns standing, and standing is worth money: a farm the
   valley rates gets more for everything it sells, for good.
   ===================================================================== */

/* ---------- state ---------- */
function marketInit(){
  if(!S.market) S.market = {next: 12, active:0, day:0, score:0, entered:{}, played:{}, given:0};
  if(S.fame === undefined) S.fame = 0;
}

const FAME_TITLES = [
  {at:0,   n:'Unknown',            d:'Nobody outside the gate has heard of you.'},
  {at:12,  n:'Talked about',       d:'Word is getting around the valley.'},
  {at:28,  n:'Local favourite',    d:'People come out of their way for your stall.'},
  {at:48,  n:'Regional name',      d:'Restaurants ring you before the season starts.'},
  {at:72,  n:'Best in the valley', d:'Your name is what the market is known for.'},
];
function fameTitle(){
  marketInit();
  let t = FAME_TITLES[0];
  FAME_TITLES.forEach(f=>{ if(S.fame >= f.at) t = f; });
  return t;
}
/* standing is worth money on everything you sell, permanently */
function fameBonus(){ marketInit(); return Math.min(0.45, S.fame/200); }

const _sellPriceFame = sellPrice;
sellPrice = function(gid){
  const base = _sellPriceFame(gid);
  return Math.max(1, Math.round(base * (1 + fameBonus())));
};

/* ---------- the ground: find open land and lay a market on it ---------- */
/* Scans the farm for the largest clear rectangle it can find, so the
   market never lands on top of anything you have built. */
function findMarketGround(wantW, wantH){
  const taken = (tx,ty)=>!!obAt(tx,ty);
  for(let h = wantH; h >= 4; h--){
    for(let w = wantW; w >= 6; w--){
      for(let ty = FARM.y; ty <= FARM.y + FARM.h - h; ty++){
        for(let tx = FARM.x; tx <= FARM.x + FARM.w - w; tx++){
          let clear = true;
          for(let y = ty; y < ty+h && clear; y++)
            for(let x = tx; x < tx+w; x++)
              if(taken(x,y)){ clear = false; break; }
          if(clear) return {tx, ty, w, h};
        }
      }
    }
  }
  return null;
}

function marketLayout(){
  marketInit();
  if(S.market.ground) return S.market.ground;
  const g = findMarketGround(14, 8);
  S.market.ground = g;
  return g;
}

/* a market stall: striped awning, trestle, crates of produce */
function stallArt(w, h, seed, col){
  let s = `<rect x="${n(w*0.06)}" y="${n(h*0.60)}" width="${n(w*0.88)}" height="${n(h*0.30)}" rx="1.6" fill="#16240c" opacity=".2"/>`;
  /* trestle table */
  s += `<rect x="${n(w*0.08)}" y="${n(h*0.54)}" width="${n(w*0.84)}" height="${n(h*0.26)}" rx="1.6" fill="#b08653"/>`;
  s += `<rect x="${n(w*0.08)}" y="${n(h*0.54)}" width="${n(w*0.84)}" height="${n(h*0.08)}" rx="1.6" fill="#c9a06a"/>`;
  /* crates of produce on it */
  for(let i=0;i<3;i++){
    const cx = w*(0.20 + i*0.26);
    s += `<rect x="${n(cx-w*0.09)}" y="${n(h*0.60)}" width="${n(w*0.18)}" height="${n(h*0.14)}" rx="1" fill="#8a6a45"/>`;
    for(let k=0;k<3;k++)
      s += `<circle cx="${n(cx - w*0.05 + k*w*0.05)}" cy="${n(h*0.655)}" r="${n(Math.min(w,h)*0.035)}"
        fill="${['#d8402f','#e8862e','#82c94f','#e0344a','#c9a06a'][(i*3+k+Math.round(seed))%5]}"/>`;
  }
  /* striped awning over the top */
  s += `<rect x="${n(w*0.04)}" y="${n(h*0.10)}" width="${n(w*0.92)}" height="${n(h*0.34)}" rx="2" fill="#f2ece0"/>`;
  const bands = 6;
  for(let i=0;i<bands;i+=2)
    s += `<rect x="${n(w*(0.04 + i*0.92/bands))}" y="${n(h*0.10)}" width="${n(w*0.92/bands)}" height="${n(h*0.34)}"
      fill="${col}" opacity=".85"/>`;
  s += `<rect x="${n(w*0.04)}" y="${n(h*0.41)}" width="${n(w*0.92)}" height="${n(h*0.04)}" fill="#000" opacity=".18"/>`;
  /* corner posts */
  [[0.07,0.46],[0.93,0.46]].forEach(p=>
    s += `<circle cx="${n(w*p[0])}" cy="${n(h*p[1])}" r="1.4" fill="#8a6a45"/>`);
  return s;
}

/* the whole ground, drawn as one layer while the market is on */
function marketLayer(){
  marketInit();
  if(!S.market.active) return '';
  const g = marketLayout();
  if(!g) return '';
  const X = g.tx*T, Y = g.ty*T, W = g.w*T, H = g.h*T;
  let s = `<g id="marketground">`;
  /* trodden grass and a gravel avenue down the middle */
  s += `<rect x="${n(X)}" y="${n(Y)}" width="${n(W)}" height="${n(H)}" rx="6" fill="#8a9c5c" opacity=".45"/>`;
  s += `<rect x="${n(X+W*0.06)}" y="${n(Y+H*0.42)}" width="${n(W*0.88)}" height="${n(H*0.18)}" rx="4"
    fill="url(#gGravel)" opacity=".85"/>`;

  /* stalls in two rows facing the avenue */
  const cols = ['#c65f4a','#4f7f96','#c8a44e','#6b8b72','#9c7fb0','#d8804a'];
  const per = Math.max(3, Math.floor(g.w/3));
  for(let i=0;i<per;i++){
    const sx = X + W*0.06 + i*(W*0.88/per);
    const sw = W*0.88/per - 4;
    s += `<g transform="translate(${n(sx)},${n(Y+H*0.06)})">${stallArt(sw, H*0.34, i*2.3, cols[i%cols.length])}</g>`;
    s += `<g transform="translate(${n(sx)},${n(Y+H*0.62)})">${stallArt(sw, H*0.34, i*3.7+1, cols[(i+3)%cols.length])}</g>`;
  }
  /* bunting strung the length of the avenue */
  for(let row=0; row<2; row++){
    const by = Y + (row ? H*0.60 : H*0.40);
    const x1 = X + W*0.05, x2 = X + W*0.95;
    s += `<path d="M${n(x1)} ${n(by)} Q${n((x1+x2)/2)} ${n(by+7)} ${n(x2)} ${n(by)}"
      stroke="#7c6f5a" stroke-width="0.7" fill="none"/>`;
    for(let i=1;i<14;i++){
      const t = i/14, it = 1-t;
      const bx = it*it*x1 + 2*it*t*((x1+x2)/2) + t*t*x2;
      const byy = it*it*by + 2*it*t*(by+7) + t*t*by;
      s += `<path d="M${n(bx-2.2)} ${n(byy)} L${n(bx+2.2)} ${n(byy)} L${n(bx)} ${n(byy+4)} Z"
        fill="${cols[i%cols.length]}" opacity=".92"/>`;
    }
  }
  /* a little crowd milling about */
  for(let i=0;i<14;i++){
    const px = X + W*(0.08 + hash(i*2.7)*0.84);
    const py = Y + H*(0.44 + hash(i*4.1)*0.14);
    s += `<g class="mk-visitor" transform="translate(${n(px)},${n(py)})"
      style="animation-delay:-${(hash(i*5.3)*6).toFixed(1)}s">
      <ellipse cx="0.8" cy="3.4" rx="2.6" ry="1.1" fill="#16240c" opacity=".28"/>
      <rect x="-1.6" y="-3" width="3.2" height="5.2" rx="1.5" fill="${cols[i%cols.length]}"/>
      <circle cx="0" cy="-4.4" r="1.7" fill="#e2b98f"/></g>`;
  }
  /* the entrance arch */
  s += `<rect x="${n(X+W*0.02)}" y="${n(Y+H*0.44)}" width="${n(W*0.035)}" height="${n(H*0.14)}" rx="1.4" fill="#8a6a45"/>`;
  s += `<rect x="${n(X+W*0.945)}" y="${n(Y+H*0.44)}" width="${n(W*0.035)}" height="${n(H*0.14)}" rx="1.4" fill="#8a6a45"/>`;
  return s + '</g>';
}

/* the market ground rides just under the people */
const _peopleLayerMarket = peopleLayer;
peopleLayer = function(){ return marketLayer() + _peopleLayerMarket.apply(this, arguments); };

/* ---------- running the event ---------- */
function marketStart(){
  marketInit();
  S.market.active = 1; S.market.day = 1; S.market.score = 0;
  S.market.entered = {}; S.market.played = {}; S.market.given = 0;
  S.market.ground = null;
  const g = marketLayout();
  if(!g){
    S.market.active = 0;
    S.market.next = S.day + 6;
    log('The market was called off — no clear ground on the farm for it.','bad','alert');
    return;
  }
  log('The farmers market opens on the flat. Five days.','gold','farm');
  toast('Farmers market — five days','gold');
  if(typeof sfx==='function') sfx('level');
  render();
  setTimeout(()=>G.openMarket(), 700);
}

function marketEnd(){
  marketInit();
  const sc = S.market.score;
  const gained = Math.round(sc/10);
  S.fame = Math.min(100, S.fame + gained);
  S.market.active = 0;
  S.market.ground = null;
  S.market.next = S.day + 26 + Math.floor(Math.random()*10);
  const t = fameTitle();
  log(`Market over. ${sc} points, ${gained} standing. You are ${t.n.toLowerCase()}.`, 'gold', 'farm');
  toast(`Market done — ${t.n}`, 'gold');
  if(typeof sfx==='function') sfx('level');
  render(); ui();
}

/* one tick a day */
function marketDayTick(){
  marketInit();
  if(!S.market.active){
    if(S.day >= S.market.next) marketStart();
    return;
  }
  S.market.day++;
  if(S.market.day > 5){ marketEnd(); return; }
  /* takings scale with what you brought and how well known you are */
  const stallTake = Math.round((20 + S.market.score*0.6) * (1 + fameBonus()) * (0.8 + Math.random()*0.5));
  S.cash += stallTake; S.totalEarned += stallTake;
  log(`Market day ${S.market.day}: the stall took ${fmt(stallTake)}.`, 'gold', 'money');
}

/* ---------- judging: scored off the farm you actually have ---------- */
function judgingEntries(){
  const out = [];
  Object.keys(S.store || {}).forEach(gid=>{
    const q = S.store[gid] || 0;
    if(q <= 0 || !GOODS[gid]) return;
    /* quality: what it is worth, how much you brought, how well you grow it */
    const tierAvg = (S.objs||[]).filter(o=>BPMAP[o.bp] && BPMAP[o.bp].kind==='plot')
      .reduce((a,o,i,arr)=> a + (o.tier||0)/(arr.length||1), 0);
    const score = Math.round(GOODS[gid].p * Math.min(q,20) * 0.5 * (1 + tierAvg*0.25));
    out.push({gid, n:GOODS[gid].n, q, score, c:GOODS[gid].c});
  });
  return out.sort((a,b)=>b.score-a.score).slice(0, 8);
}

G.enterJudging = function(gid){
  marketInit();
  if(S.market.entered[gid]) return toast('Already entered','bad');
  const e = judgingEntries().find(x=>x.gid===gid);
  if(!e) return;
  S.market.entered[gid] = 1;
  /* rivals are drawn against your own standard so it stays a contest */
  const rival = Math.round(e.score * (0.55 + Math.random()*0.75));
  const won = e.score >= rival;
  const pts = won ? 18 + Math.round(e.score/40) : 5;
  S.market.score += pts;
  log(won ? `${e.n} took first place in judging. +${pts}`
          : `${e.n} was placed second. +${pts}`, won?'gold':'', 'farm');
  toast(won ? `First place — ${e.n}!` : `Second — ${e.n}`, won?'gold':'');
  if(typeof sfx==='function') sfx(won?'level':'click');
  G.openMarket(); ui(); G.save();
};

/* ---------- the sideshow ---------- */
/* Guess the weight: one number, closest wins. Real stakes, no dice. */
G.playWeigh = function(){
  marketInit();
  if(S.market.played.weigh) return toast('You have had your go at that one','bad');
  const real = 40 + Math.floor(Math.random()*160);
  modal(`<h2>Guess the weight</h2>
    <p class="sub">A prize pumpkin sits on the scales under a cloth. Closest guess takes the sash.</p>
    <div class="mkguess">
      <input id="mkg" type="number" min="1" max="400" value="100" class="mkinput"/>
      <span class="muted">kilograms</span>
    </div>
    <div class="mfoot">
      <button class="btn" onclick="G.weighResult(${real})">Guess</button>
      <button class="btn ghost" onclick="G.openMarket()">Back</button>
    </div>`);
};
G.weighResult = function(real){
  const v = parseInt((document.getElementById('mkg')||{}).value, 10) || 0;
  const off = Math.abs(v - real);
  const pts = off <= 5 ? 25 : off <= 15 ? 15 : off <= 35 ? 8 : 2;
  S.market.played.weigh = 1;
  S.market.score += pts;
  log(`Guessed ${v}kg, it was ${real}kg. +${pts} at the market.`, pts>=15?'gold':'', 'farm');
  if(typeof sfx==='function') sfx(pts>=15?'level':'click');
  modal(`<h2>${off <= 5 ? 'Spot on' : off <= 15 ? 'Close' : 'Not quite'}</h2>
    <p class="sub">It weighed <b>${real}kg</b>. You said ${v}kg — ${off}kg out.</p>
    <p class="sub">+${pts} market points.</p>
    <div class="mfoot"><button class="btn" onclick="G.openMarket()">Back to the market</button></div>`);
  ui(); G.save();
};

/* Welly toss: a moving marker you have to stop in the green */
G.playToss = function(){
  marketInit();
  if(S.market.played.toss) return toast('You have had your go at that one','bad');
  modal(`<h2>Welly toss</h2>
    <p class="sub">Stop the marker in the green to throw long. Three throws.</p>
    <div class="tossbar"><div class="tosszone"></div><div class="tossmark" id="tossmark"></div></div>
    <div class="muted" id="tossinfo" style="margin-top:6px">Throws left: 3 · distance 0m</div>
    <div class="mfoot">
      <button class="btn" id="tossbtn" onclick="G.tossStop()">Throw</button>
      <button class="btn ghost" onclick="G.tossQuit()">Give up</button>
    </div>`);
  TOSS.throws = 3; TOSS.dist = 0; TOSS.t = 0; TOSS.on = true;
  tossLoop();
};
const TOSS = {on:false, throws:3, dist:0, t:0, raf:0};
function tossLoop(){
  if(!TOSS.on) return;
  TOSS.t += 0.022;
  const p = (Math.sin(TOSS.t*2.4) + 1) / 2;          // 0..1 sweep
  const el = document.getElementById('tossmark');
  if(el) el.style.left = (p*100).toFixed(1) + '%';
  TOSS.p = p;
  TOSS.raf = requestAnimationFrame(tossLoop);
}
G.tossStop = function(){
  if(!TOSS.on) return;
  const p = TOSS.p || 0;
  /* the green band sits from 0.42 to 0.58 */
  const good = p > 0.42 && p < 0.58;
  const near = p > 0.32 && p < 0.68;
  const m = good ? 28 + Math.round(Math.random()*10) : near ? 14 + Math.round(Math.random()*8) : 4 + Math.round(Math.random()*5);
  TOSS.dist += m;
  TOSS.throws--;
  const info = document.getElementById('tossinfo');
  if(info) info.textContent = `Throws left: ${TOSS.throws} · distance ${TOSS.dist}m`;
  if(typeof sfx==='function') sfx(good?'level':'click');
  if(TOSS.throws <= 0){
    TOSS.on = false; cancelAnimationFrame(TOSS.raf);
    const pts = TOSS.dist >= 75 ? 25 : TOSS.dist >= 50 ? 16 : TOSS.dist >= 30 ? 9 : 3;
    S.market.played.toss = 1;
    S.market.score += pts;
    log(`Welly toss: ${TOSS.dist}m. +${pts} at the market.`, pts>=16?'gold':'', 'farm');
    modal(`<h2>${TOSS.dist}m</h2>
      <p class="sub">${TOSS.dist>=75?'That cleared the fence.':TOSS.dist>=50?'A respectable throw.':'The judges were kind.'}</p>
      <p class="sub">+${pts} market points.</p>
      <div class="mfoot"><button class="btn" onclick="G.openMarket()">Back to the market</button></div>`);
    ui(); G.save();
  }
};
G.tossQuit = function(){ TOSS.on = false; cancelAnimationFrame(TOSS.raf); G.openMarket(); };

/* ---------- the relief fund ---------- */
G.giveRelief = function(amt){
  marketInit();
  amt = Math.max(0, Math.min(S.cash, amt|0));
  if(amt <= 0) return toast('Nothing to give','bad');
  S.cash -= amt;
  S.market.given += amt;
  const pts = Math.min(30, Math.round(amt/40));
  S.market.score += pts;
  S.morale = Math.min(1, (S.morale===undefined?0.6:S.morale) + 0.04);
  log(`Gave ${fmt(amt)} to the relief fund. +${pts} standing at the market.`, 'good', 'money');
  toast(`${fmt(amt)} to the relief fund`, 'good');
  if(typeof sfx==='function') sfx('coin');
  G.openMarket(); ui(); G.save();
};

/* ---------- the market screen ---------- */
G.openMarket = function(){
  marketInit();
  if(!S.market.active){
    return modal(`<h2>No market on</h2>
      <p class="sub">The next farmers market opens on day ${S.market.next}. It runs five days.</p>
      <div class="mfoot"><button class="btn" onclick="G.closeModal()">Close</button></div>`);
  }
  const ents = judgingEntries();
  const t = fameTitle();
  modal(`<h2>Farmers market — day ${S.market.day} of 5</h2>
    <p class="sub">${t.n} · ${t.d} Market points so far: <b>${S.market.score}</b>.</p>

    <h4>Judging</h4>
    <p class="sub">Scored on what you actually grew — quality, quantity and how well you
    keep your beds. Enter anything in the barn.</p>
    <div class="mkgrid">
      ${ents.length ? ents.map(e=>`
        <button class="mkcard" ${S.market.entered[e.gid]?'disabled':''} onclick="G.enterJudging('${e.gid}')">
          <span class="mkdot" style="background:${e.c}"></span>
          <b>${e.n}</b>
          <span class="muted">${e.q} in the barn · strength ${e.score}</span>
          <span class="lprice">${S.market.entered[e.gid]?'Entered':'Enter'}</span>
        </button>`).join('')
      : `<p class="sub">Nothing in the barn to enter. Harvest something first.</p>`}
    </div>

    <h4>Sideshow</h4>
    <div class="mkgrid">
      <button class="mkcard" ${S.market.played.weigh?'disabled':''} onclick="G.playWeigh()">
        <b>Guess the weight</b><span class="muted">One guess at the prize pumpkin.</span>
        <span class="lprice">${S.market.played.weigh?'Played':'Have a go'}</span></button>
      <button class="mkcard" ${S.market.played.toss?'disabled':''} onclick="G.playToss()">
        <b>Welly toss</b><span class="muted">Three throws. Stop the marker in the green.</span>
        <span class="lprice">${S.market.played.toss?'Played':'Have a go'}</span></button>
    </div>

    <h4>Farmers' relief fund</h4>
    <p class="sub">For growers who lost a season to hail or drought. It buys you nothing
    but goodwill — which at a market is worth something. Given so far: ${fmt(S.market.given)}.</p>
    <div class="mkgive">
      <button class="btn ghost" onclick="G.giveRelief(50)">Give $50</button>
      <button class="btn ghost" onclick="G.giveRelief(200)">Give $200</button>
      <button class="btn ghost" onclick="G.giveRelief(1000)">Give $1,000</button>
    </div>

    <div class="mfoot"><button class="btn ghost" onclick="G.closeModal()">Close</button></div>`);
};

/* ---------- wiring ---------- */
/* one market tick per game day */
let marketLastDay = -1;
setInterval(()=>{
  if(typeof S === 'undefined' || !S || S.speed === 0) return;
  marketInit();
  if(S.day !== marketLastDay){
    marketLastDay = S.day;
    marketDayTick();
  }
}, 900);

/* a button in the top bar that lights up while the market is on */
setTimeout(()=>{
  const bar = document.querySelector('.tbtn') && document.querySelector('.tbtn').parentElement;
  if(!bar || document.getElementById('mktbtn')) return;
  const b = document.createElement('button');
  b.id = 'mktbtn'; b.className = 'tbtn';
  b.textContent = 'Market';
  b.dataset.tip = '<b>Farmers market</b>Five days, twice a season. Judging, sideshow games and the relief fund.';
  b.addEventListener('click', ()=>G.openMarket());
  bar.appendChild(b);
  setInterval(()=>{
    marketInit();
    b.classList.toggle('on', !!S.market.active);
    b.textContent = S.market.active ? `Market ${S.market.day}/5` : 'Market';
  }, 1200);
}, 560);

/* let people try it without waiting for day 12 */
G.forceMarket = function(){ marketInit(); S.market.next = S.day; marketDayTick(); };

(function marketCss(){
  const s = document.createElement('style');
  s.textContent = `
  #marketground{ pointer-events:none; }
  .mk-visitor{ animation: mkWander 9s ease-in-out infinite; transform-box:fill-box; }
  @keyframes mkWander{
    0%,100%{ transform: translateX(0); }
    50%    { transform: translateX(9px); } }
  .mkgrid{display:grid;gap:8px;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));margin:6px 0 12px;}
  .mkcard{display:flex;flex-direction:column;align-items:flex-start;gap:3px;padding:11px;
    border-radius:12px;text-align:left;cursor:pointer;background:var(--pan2,#ffffff0d);
    border:1px solid var(--line,#ffffff1f);transition:transform .12s ease,border-color .12s ease;}
  .mkcard:hover:not([disabled]){transform:translateY(-2px);border-color:var(--acc,#7cc24f);}
  .mkcard[disabled]{opacity:.45;cursor:default;}
  .mkcard b{font-size:13px;}
  .mkcard .muted{font-size:11px;line-height:1.4;}
  .mkcard .lprice{margin-top:4px;font-weight:700;font-size:11.5px;color:#9ad06f;}
  .mkdot{width:10px;height:10px;border-radius:50%;display:inline-block;}
  .mkgive{display:flex;gap:8px;flex-wrap:wrap;}
  .mkinput{width:110px;padding:8px;border-radius:8px;background:rgba(255,255,255,.08);
    border:1px solid var(--line,#ffffff1f);color:inherit;font-size:15px;}
  .mkguess{display:flex;align-items:center;gap:8px;margin:10px 0;}
  .tossbar{position:relative;height:26px;border-radius:8px;margin-top:10px;
    background:linear-gradient(90deg,#5b4a3a,#7d6a52,#5b4a3a);overflow:hidden;}
  .tosszone{position:absolute;left:42%;width:16%;top:0;bottom:0;background:#4d8f3c;opacity:.85;}
  .tossmark{position:absolute;top:0;bottom:0;width:3px;background:#fff;box-shadow:0 0 6px #fff;}
  @media (prefers-reduced-motion: reduce){ .mk-visitor{ animation:none !important; } }
  `;
  document.head.appendChild(s);
})();
