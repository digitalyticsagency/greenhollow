/* =====================================================================
   FIVE MORE SIDESHOW GAMES, EACH PAYING IN SOMETHING THE FARM USES

   The two existing games paid in market points only. These pay in
   water, power, feed and charm — the four things a farm actually runs
   on — so the sideshow stops being a diversion and becomes part of the
   supply chain. Win the dowsing and your tanks fill; win the pedal
   generator and your batteries charge.

   Charm also finally explains itself. It quietly multiplies tourism
   income and animal production, and nothing anywhere said so.
   ===================================================================== */

/* ---------- charm, explained ---------- */
/* These are the two live formulas, read straight from the engine rather
   than restated - if the engine changes, so does this. */
function charmEffects(){
  const c = (typeof stat === 'function') ? stat().charm : 0;
  return {
    charm: Math.round(c),
    tourism: 1 + Math.min(2.2, c/90),      // charmMul()
    animals: 1 + Math.min(1.6, c/110),     // the animal rate multiplier
    tourCap: c/90 >= 2.2,
    animCap: c/110 >= 1.6,
  };
}

function charmPanel(){
  const e = charmEffects();
  return `<div class="pcard">
    <h3>Charm — ${e.charm}</h3>
    <p class="sub">Charm is not decoration. It multiplies two things every day:</p>
    <div class="tl"><span>Visitor income</span><b>×${e.tourism.toFixed(2)}${e.tourCap?' (max)':''}</b></div>
    <div class="tl"><span>Animal production</span><b>×${e.animals.toFixed(2)}${e.animCap?' (max)':''}</b></div>
    <p class="sub" style="margin-top:8px">Flowers, ponds, trees and a good house raise it.
    It caps at ×3.2 on visitors and ×2.6 on animals, so there is a point past which
    more planting pays you in looks rather than money.</p>
  </div>`;
}

/* show it on the Stats tab, above the condition panel */
if(typeof renderRight === 'function'){
  const _renderRightCharm = renderRight;
  renderRight = function(){
    const r = _renderRightCharm.apply(this, arguments);
    if(rightTab === 'owner'){
      const b = document.getElementById('rightBody');
      if(b && !b.querySelector('.charmcard')){
        const d = document.createElement('div');
        d.innerHTML = charmPanel();
        d.firstElementChild.classList.add('charmcard');
        b.insertBefore(d.firstElementChild, b.firstChild);
      }
    }
    return r;
  };
}

/* ---------- helpers shared by the new games ---------- */
function mkPlayed(key){ marketInit(); return !!S.market.played[key]; }
function mkFinish(key, pts, msg, cls){
  marketInit();
  S.market.played[key] = 1;
  S.market.score += pts;
  log(msg, cls || '', 'farm');
  if(typeof sfx==='function') sfx(pts >= 15 ? 'level' : 'click');
  ui(); G.save();
}
function mkBack(title, body){
  modal(`<h2>${title}</h2>${body}
    <div class="mfoot"><button class="btn" onclick="G.openMarket()">Back to the market</button></div>`);
}

/* ---------- 1. dowsing: pays in water ---------- */
G.playDowse = function(){
  if(mkPlayed('dowse')) return toast('You have had your go at that one','');
  const well = Math.floor(Math.random()*9);
  DOWSE.well = well; DOWSE.tries = 2;
  modal(`<h2>Water divining</h2>
    <p class="sub">The old boy with the hazel rod says there is water under one of these nine.
    Two goes. Find it and they will fill your tanks from the standpipe.</p>
    <div class="dowsegrid">${Array.from({length:9},(_,i)=>
      `<button class="dowsecell" id="dz${i}" onclick="G.dowsePick(${i})"></button>`).join('')}</div>
    <div class="muted" id="dowseinfo" style="margin-top:8px">Two goes left.</div>
    <div class="mfoot"><button class="btn ghost" onclick="G.openMarket()">Give up</button></div>`);
};
const DOWSE = {well:0, tries:2};
G.dowsePick = function(i){
  const cell = document.getElementById('dz'+i);
  if(!cell || cell.disabled) return;
  cell.disabled = true;
  if(i === DOWSE.well){
    cell.classList.add('hit'); cell.textContent = '💧';
    const cap = (typeof stat==='function') ? stat().waterCap : 400;
    const want = Math.round(cap * 0.6);
    const room = Math.max(0, cap - (S.water||0));
    const got  = Math.min(want, room);
    S.water = (S.water||0) + got;
    /* A prize that silently does nothing is worse than no prize. If the
       tanks are already full they buy the rest off you at the standpipe. */
    const sold = want - got;
    const cash = sold * 2;
    if(cash) { S.cash += cash; S.totalEarned += cash; }
    const line = got && cash ? `${got}L into the tanks and ${fmt(cash)} for the rest`
               : got         ? `${got}L into the tanks`
               :               `tanks already full, so ${fmt(cash)} for the lot`;
    mkFinish('dowse', 22, `Found water at the market — ${line}.`, 'good');
    mkBack('Water!', `<p class="sub">The rod dipped right over it. ${
      got && cash ? `They ran <b>${got}L</b> into your tanks and bought the other ${sold}L off you for <b>${fmt(cash)}</b>.`
      : got       ? `They ran <b>${got}L</b> into your tanks.`
      :             `Your tanks were already full, so they took the lot off you for <b>${fmt(cash)}</b>.`
    }</p><p class="sub">+22 market points.</p>`);
    return;
  }
  cell.classList.add('miss'); cell.textContent = '·';
  DOWSE.tries--;
  const info = document.getElementById('dowseinfo');
  if(DOWSE.tries > 0){ if(info) info.textContent = 'One go left.'; return; }
  mkFinish('dowse', 4, 'Dry every time at the divining.', '');
  mkBack('Dry', `<p class="sub">Nothing under either. It was under number ${DOWSE.well+1}.</p>
    <p class="sub">+4 market points.</p>`);
};

/* ---------- 2. pedal generator: pays in power ---------- */
G.playPedal = function(){
  if(mkPlayed('pedal')) return toast('You have had your go at that one','');
  PEDAL.count = 0; PEDAL.on = true; PEDAL.left = 6;
  modal(`<h2>Pedal generator</h2>
    <p class="sub">Six seconds on the rig. Every push is a watt into the market battery —
    and they will send you home with whatever you make.</p>
    <div class="pedalwrap">
      <div class="pedalbar"><i id="pedalfill"></i></div>
      <button class="btn pedalbtn" onclick="G.pedalPush()">PUSH</button>
    </div>
    <div class="muted" id="pedalinfo" style="margin-top:6px">6.0s · 0 pushes</div>
    <div class="mfoot"><button class="btn ghost" onclick="G.pedalStop(1)">Stop</button></div>`);
  PEDAL.timer = setInterval(()=>{
    PEDAL.left -= 0.1;
    const i = document.getElementById('pedalinfo');
    if(i) i.textContent = `${Math.max(0,PEDAL.left).toFixed(1)}s · ${PEDAL.count} pushes`;
    if(PEDAL.left <= 0) G.pedalStop();
  }, 100);
};
const PEDAL = {count:0, on:false, left:6, timer:0};
G.pedalPush = function(){
  if(!PEDAL.on) return;
  PEDAL.count++;
  const f = document.getElementById('pedalfill');
  if(f) f.style.transform = `scaleX(${Math.min(1, PEDAL.count/45).toFixed(3)})`;
  if(typeof sfx==='function' && PEDAL.count % 5 === 0) sfx('click');
};
G.pedalStop = function(quit){
  if(!PEDAL.on) return;
  PEDAL.on = false; clearInterval(PEDAL.timer);
  if(quit) return G.openMarket();
  const kw = Math.round(PEDAL.count * 0.9);
  const pts = PEDAL.count >= 40 ? 24 : PEDAL.count >= 25 ? 15 : PEDAL.count >= 12 ? 8 : 3;
  S.batteryGift = (S.batteryGift||0) + kw;
  S.cash += kw * 2;
  mkFinish('pedal', pts, `Pedalled ${PEDAL.count} pushes — ${kw}kW, sold back for ${fmt(kw*2)}.`, 'good');
  mkBack(`${kw}kW`, `<p class="sub">${PEDAL.count} pushes in six seconds. The market bought the
    lot back off you for <b>${fmt(kw*2)}</b>.</p><p class="sub">+${pts} market points.</p>`);
};

/* ---------- 3. best beast: scored on how you keep them, pays in feed ---------- */
G.playBeast = function(){
  if(mkPlayed('beast')) return toast('You have had your go at that one','');
  const pens = (S.objs||[]).filter(o=>BPMAP[o.bp] && BPMAP[o.bp].kind==='animal' && (o.animals||0) > 0);
  if(!pens.length) return mkBack('Best beast',
    `<p class="sub">You have no stock to enter. Keep some animals and come back.</p>`);
  modal(`<h2>Best beast</h2>
    <p class="sub">Judged on condition, not luck — how well you have kept them and how far
    you have taken the pen. Winner takes a pallet of feed.</p>
    <div class="mkgrid">
      ${pens.map(o=>{
        const bp = BPMAP[o.bp];
        const cond = Math.round((o.care===undefined?1:o.care)*100);
        return `<button class="mkcard" onclick="G.enterBeast('${o.id}')">
          <b>${bp.name}</b>
          <span class="muted">${o.animals} head · condition ${cond}% · ${TIERS[o.tier||0].n}</span>
          <span class="lprice">Enter</span></button>`;
      }).join('')}
    </div>
    <div class="mfoot"><button class="btn ghost" onclick="G.openMarket()">Back</button></div>`);
};
G.enterBeast = function(id){
  const o = (S.objs||[]).find(z=>z.id===id);
  if(!o) return;
  const care = (o.care===undefined?1:o.care);
  const score = care*60 + (o.tier||0)*12 + Math.min(20, (o.animals||0)*2);
  const rival = 45 + Math.random()*45;
  const won = score >= rival;
  const feed = won ? 70 : 20;
  S.feed = (S.feed||0) + feed;
  const pts = won ? 26 : 6;
  mkFinish('beast', pts, won
    ? `Best beast went to your ${BPMAP[o.bp].name.toLowerCase()}. ${feed} feed won.`
    : `Placed at the beast judging. ${feed} feed for turning up.`, won?'gold':'');
  mkBack(won ? 'First place' : 'Placed',
    `<p class="sub">Scored <b>${Math.round(score)}</b> against ${Math.round(rival)}.
     ${won ? 'The sash is yours.' : 'Condition is what does it — a well-kept pen wins this.'}</p>
     <p class="sub">${feed} feed into the store. +${pts} market points.</p>`);
};

/* ---------- 4. prettiest pitch: scored on real charm, pays in charm ---------- */
G.playPitch = function(){
  if(mkPlayed('pitch')) return toast('You have had your go at that one','');
  const e = charmEffects();
  const rival = 20 + Math.random()*70;
  const won = e.charm >= rival;
  const gain = won ? 8 : 3;
  S.charmGift = (S.charmGift||0) + gain;
  const pts = won ? 24 : 7;
  mkFinish('pitch', pts, won
    ? `Prettiest pitch went to you. +${gain} charm.`
    : `Placed in the prettiest pitch. +${gain} charm.`, won?'gold':'');
  mkBack(won ? 'Prettiest pitch' : 'Well placed',
    `<p class="sub">Judged on the charm of your farm — <b>${e.charm}</b> against ${Math.round(rival)}.</p>
     <p class="sub">Charm is worth having: it is already multiplying your visitor income by
     <b>×${e.tourism.toFixed(2)}</b> and your animal production by <b>×${e.animals.toFixed(2)}</b>.</p>
     <p class="sub">+${gain} charm, +${pts} market points.</p>`);
};

/* the charm won at the market is real and permanent */
if(typeof stat === 'function'){
  const _statCharm = stat;
  stat = function(){
    const st = _statCharm.apply(this, arguments);
    if(S.charmGift) st.charm += S.charmGift;
    return st;
  };
}

/* ---------- 5. hay bale toss: a power meter you have to stop ---------- */
G.playBale = function(){
  if(mkPlayed('bale')) return toast('You have had your go at that one','');
  BALE.on = true; BALE.p = 0; BALE.dir = 1; BALE.best = 0; BALE.tries = 3;
  modal(`<h2>Bale toss</h2>
    <p class="sub">Stop the meter as high as you dare — but let it hit the top and you
    have pulled something. Three lifts.</p>
    <div class="balebar"><i id="balefill"></i><span class="balered"></span></div>
    <div class="muted" id="baleinfo" style="margin-top:6px">Three lifts left · best 0m</div>
    <div class="mfoot">
      <button class="btn" onclick="G.baleStop()">Lift</button>
      <button class="btn ghost" onclick="G.baleQuit()">Give up</button>
    </div>`);
  baleLoop();
};
const BALE = {on:false, p:0, dir:1, best:0, tries:3, raf:0};
function baleLoop(){
  if(!BALE.on) return;
  BALE.p += 0.016*BALE.dir;
  if(BALE.p >= 1){ BALE.p = 1; BALE.dir = -1; }
  if(BALE.p <= 0){ BALE.p = 0; BALE.dir = 1; }
  const f = document.getElementById('balefill');
  if(f) f.style.transform = `scaleX(${BALE.p.toFixed(3)})`;
  BALE.raf = requestAnimationFrame(baleLoop);
}
G.baleStop = function(){
  if(!BALE.on) return;
  const p = BALE.p;
  /* over 0.92 is the red band - you strain and lose the lift */
  const m = p > 0.92 ? 0 : Math.round(p*34);
  if(m > BALE.best) BALE.best = m;
  BALE.tries--;
  const info = document.getElementById('baleinfo');
  if(info) info.textContent = p > 0.92
    ? `Pulled something. ${BALE.tries} left · best ${BALE.best}m`
    : `${BALE.tries} lifts left · best ${BALE.best}m`;
  if(typeof sfx==='function') sfx(p > 0.92 ? 'error' : 'click');
  if(BALE.tries <= 0){
    BALE.on = false; cancelAnimationFrame(BALE.raf);
    const pts = BALE.best >= 28 ? 25 : BALE.best >= 20 ? 16 : BALE.best >= 12 ? 9 : 3;
    const cash = BALE.best * 6;
    S.cash += cash;
    mkFinish('bale', pts, `Bale toss: ${BALE.best}m, ${fmt(cash)} prize.`, pts>=16?'gold':'');
    mkBack(`${BALE.best}m`, `<p class="sub">${BALE.best>=28?'Cleared the rail.':BALE.best>=20?'A good honest lift.':'The back will feel that.'}</p>
      <p class="sub">${fmt(cash)} prize money, +${pts} market points.</p>`);
  }
};
G.baleQuit = function(){ BALE.on = false; cancelAnimationFrame(BALE.raf); G.openMarket(); };

/* ---------- put them on the market screen ---------- */
if(typeof G.openMarket === 'function'){
  const _openMarketGames = G.openMarket;
  G.openMarket = function(){
    const r = _openMarketGames.apply(this, arguments);
    marketInit();
    if(!S.market.active) return r;
    const body = document.querySelector('.mbox, .modal, #modal');
    if(!body || body.querySelector('.mkmore')) return r;
    const games = [
      ['dowse', 'Water divining', 'Find the water under nine boards. Fills your tanks.'],
      ['pedal', 'Pedal generator', 'Six seconds on the rig. They buy the power back.'],
      ['beast', 'Best beast',      'Judged on condition. Winner takes a pallet of feed.'],
      ['pitch', 'Prettiest pitch', 'Scored on your farm’s charm. Wins you more of it.'],
      ['bale',  'Bale toss',       'Stop the meter high without straining. Prize money.'],
    ];
    const fn = {dowse:'playDowse', pedal:'playPedal', beast:'playBeast', pitch:'playPitch', bale:'playBale'};
    const html = `<div class="mkgrid mkmore">
      ${games.map(g=>`<button class="mkcard" ${mkPlayed(g[0])?'disabled':''}
        onclick="G.${fn[g[0]]}()"><b>${g[1]}</b><span class="muted">${g[2]}</span>
        <span class="lprice">${mkPlayed(g[0])?'Played':'Have a go'}</span></button>`).join('')}
    </div>`;
    /* slot them straight after the existing sideshow grid */
    const grids = body.querySelectorAll('.mkgrid');
    const sideshow = grids[1] || grids[0];
    if(sideshow) sideshow.insertAdjacentHTML('afterend', html);
    return r;
  };
}

(function sideshowCss(){
  const s = document.createElement('style');
  s.textContent = `
  .dowsegrid{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin:10px 0;max-width:220px;}
  .dowsecell{aspect-ratio:1;border-radius:9px;background:#6b5642;border:1px solid #55442f;
    cursor:pointer;font-size:18px;color:#e6ecdf;}
  .dowsecell:hover:not([disabled]){background:#7d6650;}
  .dowsecell[disabled]{cursor:default;}
  .dowsecell.hit{background:#2f6d90;border-color:#4f93b5;}
  .dowsecell.miss{background:#4a3f30;color:#8b8070;}
  .pedalwrap{display:flex;align-items:center;gap:10px;margin:10px 0;}
  .pedalbar{flex:1;height:22px;border-radius:8px;background:#3a4432;overflow:hidden;}
  .pedalbar i{display:block;height:100%;background:linear-gradient(90deg,#7cc24f,#f0d79a);
    transform:scaleX(0);transform-origin:left center;transition:transform .06s linear;}
  .pedalbtn{min-width:96px;font-size:15px;}
  .balebar{position:relative;height:26px;border-radius:8px;background:#3a4432;overflow:hidden;margin-top:10px;}
  .balebar i{display:block;height:100%;background:linear-gradient(90deg,#4d8f3c,#f0c14b);
    transform:scaleX(0);transform-origin:left center;}
  .balered{position:absolute;right:0;top:0;bottom:0;width:8%;background:#c0392b;opacity:.75;}
  `;
  document.head.appendChild(s);
})();
