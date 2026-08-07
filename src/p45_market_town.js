/* =====================================================================
   THE MARKET AS A PLACE, NOT A ROW OF AWNINGS

   Until now the market ground had stalls and a crowd and nothing else.
   A real market that runs five days has structures: a covered hall for
   the wet days, a line of traders' cottages the market puts up so
   people are not driving home each night, a produce store, and a green
   with a stage where the whole thing finishes.

   So: buildings, the traders who live and work in them, and on the
   fifth day everyone stops trading and gathers at the stage.
   ===================================================================== */

/* the market wants more room now that it has buildings on it */
if(typeof marketLayout === 'function'){
  const _marketLayoutBig = marketLayout;
  marketLayout = function(){
    marketInit();
    if(S.market.ground) return S.market.ground;
    /* try for a proper site first, fall back the way the finder already does */
    const g = findMarketGround(18, 10) || findMarketGround(14, 8);
    S.market.ground = g;
    return g;
  };
}

/* ---------- the buildings ---------- */

/* a trader's cottage: small, pitched, with a lit window at night */
function traderCottage(w, h, seed){
  let s = `<rect x="${n(w*0.08)}" y="${n(h*0.14)}" width="${n(w*0.9)}" height="${n(h*0.9)}" rx="2"
    fill="#16240c" opacity=".22"/>`;
  s += `<rect x="0" y="0" width="${n(w)}" height="${n(h)}" rx="2" fill="#2a3238" opacity=".8"/>`;
  s += `<rect x="0.8" y="0.8" width="${n(w-1.6)}" height="${n(h-1.6)}" rx="1.6"
    fill="${['#9c6b52','#7f8c6a','#8a7a9c','#a5825a'][Math.floor(hash(seed)*4)]}"/>`;
  /* ridge and pitch shading */
  s += `<rect x="0.8" y="0.8" width="${n(w-1.6)}" height="${n((h-1.6)*0.46)}" fill="#fff" opacity=".14"/>`;
  s += `<rect x="0.8" y="${n(h*0.54)}" width="${n(w-1.6)}" height="${n(h*0.44)}" fill="#000" opacity=".16"/>`;
  s += `<rect x="0.8" y="${n(h*0.48)}" width="${n(w-1.6)}" height="1.2" fill="#e2e9ec" opacity=".8"/>`;
  /* chimney and a window that lights up after dark */
  s += `<rect x="${n(w*0.72)}" y="${n(h*0.16)}" width="${n(w*0.10)}" height="${n(h*0.20)}" rx="0.8" fill="#7b6f66"/>`;
  s += `<rect x="${n(w*0.14)}" y="${n(h*0.62)}" width="${n(w*0.22)}" height="${n(h*0.20)}" rx="1"
    class="mk-win" fill="#4a6470"/>`;
  return s;
}

/* the covered hall: a long span with a monitor roof down the middle */
function marketHall(w, h){
  let s = `<rect x="${n(w*0.05)}" y="${n(h*0.12)}" width="${n(w*0.95)}" height="${n(h*0.92)}" rx="3"
    fill="#16240c" opacity=".22"/>`;
  s += `<rect x="0" y="0" width="${n(w)}" height="${n(h)}" rx="2.4" fill="#2a3238" opacity=".85"/>`;
  s += `<rect x="1" y="1" width="${n(w-2)}" height="${n(h-2)}" rx="2" fill="#8e9aa2"/>`;
  s += `<rect x="1" y="1" width="${n(w-2)}" height="${n((h-2)*0.44)}" fill="#fff" opacity=".16"/>`;
  for(let i=3;i<w-2;i+=5)
    s += `<line x1="${n(i)}" y1="1.5" x2="${n(i)}" y2="${n(h-1.5)}" stroke="#000" stroke-opacity=".09" stroke-width="0.7"/>`;
  /* clerestory strip so it reads as a hall not a slab */
  s += `<rect x="${n(w*0.24)}" y="${n(h*0.36)}" width="${n(w*0.52)}" height="${n(h*0.20)}" rx="1.4" fill="#6d7981"/>`;
  s += `<rect x="${n(w*0.25)}" y="${n(h*0.375)}" width="${n(w*0.50)}" height="${n(h*0.17)}" rx="1"
    fill="url(#gGlass)" opacity=".9"/>`;
  s += `<rect x="1" y="${n(h*0.60)}" width="${n(w-2)}" height="1.4" fill="#000" opacity=".22"/>`;
  return s;
}

/* the stage: a low deck, a backdrop and bunting posts */
function marketStage(w, h){
  let s = `<ellipse cx="${n(w*0.5)}" cy="${n(h*0.72)}" rx="${n(w*0.62)}" ry="${n(h*0.42)}"
    fill="#7d9450" opacity=".55"/>`;
  s += `<rect x="${n(w*0.16)}" y="${n(h*0.18)}" width="${n(w*0.68)}" height="${n(h*0.44)}" rx="2" fill="#a5825a"/>`;
  for(let i=1;i<6;i++)
    s += `<line x1="${n(w*0.16)}" y1="${n(h*(0.18+i*0.073))}" x2="${n(w*0.84)}" y2="${n(h*(0.18+i*0.073))}"
      stroke="#8a6a45" stroke-width="0.6" opacity=".7"/>`;
  /* backdrop */
  s += `<rect x="${n(w*0.16)}" y="${n(h*0.06)}" width="${n(w*0.68)}" height="${n(h*0.14)}" rx="1.6" fill="#c65f4a"/>`;
  s += `<rect x="${n(w*0.16)}" y="${n(h*0.06)}" width="${n(w*0.68)}" height="${n(h*0.05)}" rx="1.6" fill="#d9775f"/>`;
  /* posts with lights */
  [[0.14,0.16],[0.86,0.16]].forEach((p,i)=>{
    s += `<rect x="${n(w*p[0])}" y="${n(h*p[1])}" width="${n(w*0.018)}" height="${n(h*0.46)}" rx="0.8" fill="#8a6a45"/>`;
    s += `<circle class="fx-bulb" cx="${n(w*p[0]+w*0.009)}" cy="${n(h*p[1])}" r="1.8" fill="#ffe9a8"
      style="animation-delay:-${i}s"/>`;
  });
  return s;
}

/* where each structure sits on the ground, as fractions */
function marketPlan(){
  const g = S.market.ground;
  if(!g) return null;
  const X = g.tx*T, Y = g.ty*T, W = g.w*T, H = g.h*T;
  return {
    X, Y, W, H,
    hall:  {x:X+W*0.04, y:Y+H*0.03, w:W*0.34, h:H*0.20},
    stage: {x:X+W*0.62, y:Y+H*0.02, w:W*0.34, h:H*0.26},
    green: {x:X+W*0.58, y:Y+H*0.24, w:W*0.40, h:H*0.22},
    cots:  Array.from({length:4}, (_,i)=>({
      x: X + W*(0.06 + i*0.135), y: Y + H*0.80, w: W*0.10, h: H*0.16 })),
    store: {x:X+W*0.62, y:Y+H*0.80, w:W*0.20, h:H*0.16},
  };
}

function marketBuildingsLayer(){
  marketInit();
  if(!S.market.active) return '';
  const p = marketPlan();
  if(!p) return '';
  let s = `<g id="markettown" aria-hidden="true">`;
  s += `<g transform="translate(${n(p.hall.x)},${n(p.hall.y)})">${marketHall(p.hall.w, p.hall.h)}</g>`;
  s += `<g transform="translate(${n(p.stage.x)},${n(p.stage.y)})">${marketStage(p.stage.w, p.stage.h)}</g>`;
  p.cots.forEach((c,i)=>{
    s += `<g transform="translate(${n(c.x)},${n(c.y)})">${traderCottage(c.w, c.h, i*3.1)}</g>`;
  });
  /* the produce store, a plain shed */
  s += `<g transform="translate(${n(p.store.x)},${n(p.store.y)})">${traderCottage(p.store.w, p.store.h, 9)}</g>`;
  /* the green in front of the stage, where people gather */
  s += `<ellipse cx="${n(p.green.x + p.green.w*0.5)}" cy="${n(p.green.y + p.green.h*0.5)}"
    rx="${n(p.green.w*0.52)}" ry="${n(p.green.h*0.55)}" fill="#8fae5c" opacity=".38"/>`;
  return s + '</g>';
}

/* ---------- the traders ---------- */
const TRADER_NAMES = ['Halim','Greta','Osei','Mira','Cass','Ines','Bo','Fen','Lark','Ada'];
const TRADER_SHIRTS = ['#c65f4a','#4f7f96','#c8a44e','#6b8b72','#9c7fb0','#d8804a'];
const TRADER_LINES = {
  work:  ['Fresh this morning!','Two for five!','Last of the season.','Try a piece?','Straight off the tree.'],
  home:  ['Long day.','Kettle on.','Good takings today.','Feet are done in.'],
  cheer: ['🎉 What a week!','👏 Best market yet!','🥳 Same again next season!','🎊 Well done all!'],
};

function tradersInit(){
  marketInit();
  if(!S.market.active){ S.traders = []; return; }
  if(!S.traders) S.traders = [];
  const p = marketPlan();
  if(!p) return;
  const want = 5;
  while(S.traders.length < want){
    const i = S.traders.length;
    const c = p.cots[i % p.cots.length];
    S.traders.push({
      id:'trd'+i, idx:i,
      name: TRADER_NAMES[i % TRADER_NAMES.length],
      shirt: TRADER_SHIRTS[i % TRADER_SHIRTS.length],
      x: c.x + c.w*0.5, y: c.y + c.h + 6,
      dir:1, t:Math.random()*3, wx:0, wy:0, said:0, act:'setting up',
    });
  }
  if(S.traders.length > want) S.traders.length = want;
}

function traderGoal(tr){
  const p = marketPlan();
  if(!p) return null;
  const f = (typeof dayFrac === 'function') ? dayFrac() : 0.5;
  const finale = S.market.day >= 5;

  /* the fifth day everybody downs tools and gathers at the stage */
  if(finale){
    const a = (tr.idx / 5) * Math.PI * 2;
    return { x: p.green.x + p.green.w*0.5 + Math.cos(a)*p.green.w*0.22,
             y: p.green.y + p.green.h*0.5 + Math.sin(a)*p.green.h*0.26,
             act:'at the closing', cheer:true };
  }
  /* asleep in their cottage overnight */
  if(f < 0.26 || f > 0.86){
    const c = p.cots[tr.idx % p.cots.length];
    return { x: c.x + c.w*0.5, y: c.y + c.h*0.5, act:'turned in', inside:true };
  }
  /* otherwise working their pitch along the avenue */
  const px = p.X + p.W*(0.12 + tr.idx*0.17) + (tr.wx||0);
  const py = p.Y + p.H*(tr.idx % 2 ? 0.62 : 0.44) + (tr.wy||0);
  return { x:px, y:py, act:'working the stall' };
}

function tickTraders(dt){
  tradersInit();
  if(!(S.traders||[]).length) return;
  const finale = S.market.day >= 5;
  (S.traders||[]).forEach(tr=>{
    const goal = traderGoal(tr);
    if(!goal) return;
    tr.act = goal.act; tr.inside = !!goal.inside; tr.cheer = !!goal.cheer;
    const dx = goal.x - tr.x, dy = goal.y - tr.y, d = Math.hypot(dx, dy);
    if(d > 3){
      const spd = (finale ? 62 : 38)*dt;
      tr.x += dx/d*Math.min(d, spd); tr.y += dy/d*Math.min(d, spd);
      if(Math.abs(dx) > 0.4) tr.dir = dx > 0 ? 1 : -1;
    } else {
      tr.t = (tr.t||0) + dt;
      if(tr.t > 4){ tr.t = 0; tr.wx = (Math.random()-0.5)*24; tr.wy = (Math.random()-0.5)*14; }
    }
    tr.said = (tr.said||0) - dt;
    if(tr.said <= 0 && Math.random() < dt*0.09){
      tr.said = finale ? 6 + Math.random()*6 : 16 + Math.random()*20;
      const pool = finale ? TRADER_LINES.cheer : tr.inside ? TRADER_LINES.home : TRADER_LINES.work;
      if(typeof speak === 'function') speak(tr, pool[Math.floor(Math.random()*pool.length)]);
    }
  });
  paintTraders();
}

function traderLayer(){
  tradersInit();
  if(!(S.traders||[]).length) return '';
  return `<g id="traders">` + S.traders.map(tr=>
    `<g class="npc trader${tr.cheer?' cheering':''}" data-t="${tr.id}"
        transform="translate(${n(tr.x)},${n(tr.y)})">
      <g class="youbob"><g transform="scale(${tr.dir},1)">${person(0,0,1.0,tr.shirt,'#e8e0cc')}</g></g>
      <text class="nlab" y="-24" text-anchor="middle">${tr.name}</text></g>`).join('') + `</g>`;
}

function paintTraders(){
  const roofOff = SET('roofOff');
  (S.traders||[]).forEach(tr=>{
    const el = document.querySelector(`[data-t="${tr.id}"]`);
    if(!el) return;
    el.setAttribute('transform', `translate(${n(tr.x)},${n(tr.y)})`);
    const flip = el.querySelector('.youbob > g');
    if(flip) flip.setAttribute('transform', `scale(${tr.dir},1)`);
    el.classList.toggle('cheering', !!tr.cheer);
    el.style.opacity = (tr.inside && !roofOff) ? '0' : '';
  });
}

/* ---------- the fifth day ---------- */
/* Everyone on the ground converges on the green and cheers. The family
   come over too, because a closing day is worth walking to. */
function tickFinale(){
  marketInit();
  if(!S.market.active) return;
  if(S.market.day < 5){ S.market.cheered = 0; return; }
  if(S.market.cheered) return;
  S.market.cheered = 1;
  const p = marketPlan();
  if(!p) return;
  if(typeof SND !== 'undefined') SND.play('huddle');
  if(typeof log === 'function')
    log('Closing day — the whole market gathered at the stage.', 'gold', 'farm');
  if(typeof toast === 'function') toast('Closing ceremony', 'gold');
  /* your household walks over for it */
  S.marketGather = { x: p.green.x + p.green.w*0.5, y: p.green.y + p.green.h*0.72, until: Date.now() + 22000 };
  const stage = document.getElementById('markettown');
  if(stage) stage.classList.add('celebrating');
  setTimeout(()=>{ const el=document.getElementById('markettown'); if(el) el.classList.remove('celebrating'); }, 12000);
}

/* the family attend the closing */
if(typeof routine === 'function'){
  const _routineFinale = routine;
  routine = function(p){
    const g = S.marketGather;
    if(g && Date.now() < g.until && !(S.huddle && S.huddle.phase)){
      const list = (S.family||[]).concat(S.workers||[]);
      const i = Math.max(0, list.findIndex(q=>q.id===p.id));
      const a = (i/Math.max(1,list.length))*Math.PI*2;
      return { x:g.x + Math.cos(a)*26, y:g.y + Math.sin(a)*16, act:'at the market closing' };
    }
    return _routineFinale.apply(this, arguments);
  };
}

/* layers and ticks */
if(typeof marketLayer === 'function'){
  const _marketLayerTown = marketLayer;
  marketLayer = function(){ return _marketLayerTown.apply(this, arguments) + marketBuildingsLayer(); };
}
const _peopleLayerTraders = peopleLayer;
peopleLayer = function(){ return _peopleLayerTraders.apply(this, arguments) + traderLayer(); };

const _tickPeopleTraders = tickPeople;
tickPeople = function(dt){
  const r = _tickPeopleTraders.apply(this, arguments);
  if(S && S.speed !== 0){ tickTraders(dt); tickFinale(); }
  return r;
};

(function townCss(){
  const s = document.createElement('style');
  s.textContent = `
  #markettown{pointer-events:none;}
  #markettown .mk-win{ animation: mkWin 6s ease-in-out infinite; }
  @keyframes mkWin{ 0%,100%{fill:#4a6470} 50%{fill:#ffd489} }
  #markettown.celebrating .fx-bulb{ animation-duration:.7s !important; }
  #traders .trader{transition:opacity .4s ease;}
  /* a proper cheer: up on the toes, arms implied by the bob */
  #traders .trader.cheering .youbob{ animation: cheerHop .7s ease-in-out infinite; }
  @keyframes cheerHop{
    0%,100%{ transform: translateY(0)    scale(1); }
    40%    { transform: translateY(-5px) scale(1.05); }
    70%    { transform: translateY(-1px) scale(.99); } }
  @media (prefers-reduced-motion: reduce){
    #markettown .mk-win, #traders .trader.cheering .youbob{ animation:none !important; } }
  `;
  document.head.appendChild(s);
})();
