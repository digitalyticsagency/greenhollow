/* =====================================================================
   THE FAIRGROUND

   Refusing to open the market because the farm was full was the wrong
   answer. A real market is not held in your paddock — it is held on the
   common, and you walk down to it.

   So the market now always has somewhere to go: a permanent fairground
   on the flat below the farm, laid out properly, with ten different
   buildings rather than one repeated, and a crowd of fifty.

   Fifty people is the interesting constraint. Fifty JS-ticked agents
   would cost far more than the frame budget allows, so eight traders
   have real behaviour — routines, shifts, speech — and the other
   forty-two are CSS-driven: they drift on their own keyframes at zero
   per-frame cost. On screen they read the same.
   ===================================================================== */

/* the common sits below the farm, clear of everything you own */
function fairGround(){
  const w = 26, h = 9;
  return {
    tx: FARM.x,
    ty: FARM.y + FARM.h + 2,
    w: Math.min(w, WT - FARM.x - 1),
    h,
  };
}

/* the market takes the farm if there is room, and the common if not */
if(typeof marketLayout === 'function'){
  const _layoutFair = marketLayout;
  marketLayout = function(){
    marketInit();
    if(S.market.ground) return S.market.ground;
    const onFarm = findMarketGround(18, 10);
    S.market.ground = onFarm || fairGround();
    S.market.onCommon = !onFarm;
    return S.market.ground;
  };
}

/* marketStart used to bail when nothing fitted; it never needs to now */
if(typeof marketStart === 'function'){
  const _startFair = marketStart;
  marketStart = function(){
    marketInit();
    S.market.ground = null;
    marketLayout();                 /* guarantees a ground either way */
    return _startFair.apply(this, arguments);
  };
}

/* ---------- ten buildings, each its own thing ---------- */
function fairBuilding(kind, w, h, seed){
  const roofOf = c => `<rect x="0.8" y="0.8" width="${n(w-1.6)}" height="${n(h-1.6)}" rx="1.6" fill="${c}"/>`;
  const shell = () =>
    `<rect x="${n(w*0.07)}" y="${n(h*0.13)}" width="${n(w*0.95)}" height="${n(h*0.92)}" rx="2" fill="#16240c" opacity=".22"/>`
  + `<rect x="0" y="0" width="${n(w)}" height="${n(h)}" rx="2" fill="#2a3238" opacity=".82"/>`;
  const pitch = () =>
    `<rect x="0.8" y="0.8" width="${n(w-1.6)}" height="${n((h-1.6)*0.46)}" fill="#fff" opacity=".14"/>`
  + `<rect x="0.8" y="${n(h*0.54)}" width="${n(w-1.6)}" height="${n(h*0.44)}" fill="#000" opacity=".16"/>`
  + `<rect x="0.8" y="${n(h*0.48)}" width="${n(w-1.6)}" height="1.2" fill="#e2e9ec" opacity=".8"/>`;
  let s = shell();

  switch(kind){
    case 'bakery':
      s += roofOf('#b5763f') + pitch();
      s += `<rect x="${n(w*0.66)}" y="${n(h*0.14)}" width="${n(w*0.14)}" height="${n(h*0.26)}" rx="1" fill="#7b6f66"/>`;
      for(let i=0;i<2;i++)
        s += `<circle class="fx-steam" cx="${n(w*0.73)}" cy="${n(h*0.12)}" r="${(2.2+i).toFixed(1)}"
          fill="#fff" opacity=".24" style="animation-delay:-${i*1.5}s"/>`;
      break;
    case 'cider':
      s += roofOf('#7f8c6a') + pitch();
      s += `<circle cx="${n(w*0.30)}" cy="${n(h*0.66)}" r="${n(h*0.16)}" fill="#8a6440"/>`;
      s += `<circle cx="${n(w*0.30)}" cy="${n(h*0.66)}" r="${n(h*0.10)}" fill="#c08f5c"/>`;
      s += `<rect x="${n(w*0.52)}" y="${n(h*0.58)}" width="${n(w*0.30)}" height="${n(h*0.16)}" rx="1.4" fill="#8a6a45"/>`;
      break;
    case 'forge':
      s += roofOf('#5f6b72') + pitch();
      s += `<rect x="${n(w*0.20)}" y="${n(h*0.16)}" width="${n(w*0.16)}" height="${n(h*0.28)}" rx="1" fill="#4a4238"/>`;
      s += `<circle class="fx-ember" cx="${n(w*0.28)}" cy="${n(h*0.62)}" r="${n(h*0.10)}" fill="#f0a24b"/>`;
      break;
    case 'flowers':
      s += roofOf('#9c6b8a') + pitch();
      for(let i=0;i<8;i++){
        const c=['#e05c7a','#f0a24b','#f5d94e','#a86fd0'][i%4];
        s += `<circle cx="${n(w*(0.14+(i%4)*0.22))}" cy="${n(h*(0.66+Math.floor(i/4)*0.18))}" r="2" fill="${c}"/>`;
      }
      break;
    case 'tearoom':
      s += roofOf('#c65f4a') + pitch();
      [[0.26,0.72],[0.62,0.72]].forEach(p=>{
        s += `<circle cx="${n(w*p[0])}" cy="${n(h*p[1])}" r="${n(h*0.09)}" fill="#e0d4b4"/>`;
      });
      break;
    case 'bandstand':
      s += `<ellipse cx="${n(w*0.5)}" cy="${n(h*0.62)}" rx="${n(w*0.46)}" ry="${n(h*0.40)}" fill="#a5825a"/>`;
      s += `<ellipse cx="${n(w*0.5)}" cy="${n(h*0.52)}" rx="${n(w*0.42)}" ry="${n(h*0.34)}" fill="#c49a63"/>`;
      for(let i=0;i<6;i++){
        const a=(i/6)*Math.PI*2;
        s += `<rect x="${n(w*0.5+Math.cos(a)*w*0.36)}" y="${n(h*0.5+Math.sin(a)*h*0.28)}"
          width="1.8" height="${n(h*0.24)}" rx="0.8" fill="#8a6a45"/>`;
      }
      s += `<circle class="fx-bulb" cx="${n(w*0.5)}" cy="${n(h*0.34)}" r="2.2" fill="#ffe9a8"/>`;
      break;
    case 'pens':
      s += `<rect x="1" y="1" width="${n(w-2)}" height="${n(h-2)}" rx="3" fill="#8fae5c" opacity=".8"/>`;
      s += `<rect x="1" y="1" width="${n(w-2)}" height="${n(h-2)}" rx="3" fill="none"
        stroke="#8b7c66" stroke-width="1.2" stroke-dasharray="5 3"/>`;
      for(let i=0;i<4;i++)
        s += `<ellipse cx="${n(w*(0.2+i*0.2))}" cy="${n(h*(0.4+(i%2)*0.3))}" rx="3.2" ry="2.4" fill="#f6efdf"/>`;
      break;
    case 'store':
      s += roofOf('#8a7a9c') + pitch();
      for(let i=0;i<3;i++)
        s += `<rect x="${n(w*(0.14+i*0.26))}" y="${n(h*0.62)}" width="${n(w*0.20)}" height="${n(h*0.20)}" rx="1.2" fill="#8a6a45"/>`;
      break;
    case 'hall':
      return marketHall(w, h);
    default: /* cottage */
      return traderCottage(w, h, seed);
  }
  return s;
}

/* the plan: buildings spread along both sides of a wide avenue */
function fairPlan(){
  marketInit();
  const g = S.market.ground;
  if(!g) return null;
  const X = g.tx*T, Y = g.ty*T, W = g.w*T, H = g.h*T;
  const kinds = ['hall','bakery','cider','forge','flowers','tearoom','store','pens','cottage','cottage'];
  const top = [], bot = [];
  const per = 5;
  for(let i=0;i<per;i++){
    top.push({kind:kinds[i],     x:X + W*(0.03 + i*0.194), y:Y + H*0.04, w:W*0.17, h:H*0.24});
    bot.push({kind:kinds[i+per], x:X + W*(0.03 + i*0.194), y:Y + H*0.70, w:W*0.17, h:H*0.24});
  }
  return {X, Y, W, H, top, bot,
    green:{x:X + W*0.36, y:Y + H*0.32, w:W*0.28, h:H*0.34},
    bandstand:{x:X + W*0.42, y:Y + H*0.34, w:W*0.16, h:H*0.26}};
}

function fairLayer(){
  marketInit();
  if(!S.market.active || !S.market.onCommon) return '';
  const p = fairPlan();
  if(!p) return '';
  let s = `<g id="fairground" aria-hidden="true">`;
  /* the common itself */
  s += `<rect x="${n(p.X)}" y="${n(p.Y)}" width="${n(p.W)}" height="${n(p.H)}" rx="8" fill="#8fae5c" opacity=".55"/>`;
  s += `<rect x="${n(p.X+p.W*0.02)}" y="${n(p.Y+p.H*0.30)}" width="${n(p.W*0.96)}" height="${n(p.H*0.38)}" rx="6"
    fill="url(#gGravel)" opacity=".8"/>`;
  p.top.concat(p.bot).forEach((b,i)=>{
    s += `<g transform="translate(${n(b.x)},${n(b.y)})">${fairBuilding(b.kind, b.w, b.h, i*2.7)}</g>`;
  });
  s += `<g transform="translate(${n(p.bandstand.x)},${n(p.bandstand.y)})">
    ${fairBuilding('bandstand', p.bandstand.w, p.bandstand.h, 3)}</g>`;
  return s + '</g>';
}

/* ---------- fifty people ---------- */
/* Eight are the traders with real behaviour, already built. These are the
   other forty-two: pure CSS, no per-frame JavaScript, so the crowd costs
   essentially nothing. */
const CROWD_SHIRTS = ['#c65f4a','#4f7f96','#c8a44e','#6b8b72','#9c7fb0','#d8804a','#5fb0d4','#e8a33d'];
function crowdLayer(){
  marketInit();
  if(!S.market.active) return '';
  const p = S.market.onCommon ? fairPlan() : null;
  const g = S.market.ground;
  if(!g) return '';
  const X = (p?p.X:g.tx*T), Y = (p?p.Y:g.ty*T), W = (p?p.W:g.w*T), H = (p?p.H:g.h*T);
  const N = 42;
  let s = `<g id="crowd" aria-hidden="true">`;
  for(let i=0;i<N;i++){
    /* clustered on the avenue, thinning toward the edges */
    const cx = X + W*(0.05 + hash(i*2.3)*0.90);
    const cy = Y + H*(0.34 + hash(i*4.7)*0.34);
    const sc = (0.82 + hash(i*6.1)*0.3).toFixed(2);
    const col = CROWD_SHIRTS[i % CROWD_SHIRTS.length];
    const dur = (7 + hash(i*8.3)*9).toFixed(1);
    const del = (hash(i*9.7)*9).toFixed(1);
    s += `<g class="cw" transform="translate(${n(cx)},${n(cy)})"
        style="animation-duration:${dur}s;animation-delay:-${del}s">
      <g transform="scale(${sc})">
        <ellipse cx="0.8" cy="3.6" rx="2.8" ry="1.2" fill="#16240c" opacity=".26"/>
        <rect x="-1.7" y="-3.2" width="3.4" height="5.4" rx="1.6" fill="${col}"/>
        <circle cx="0" cy="-4.6" r="1.8" fill="#e2b98f"/>
      </g></g>`;
  }
  return s + '</g>';
}

/* the fairground sits under the stalls, the crowd over them */
if(typeof marketLayer === 'function'){
  const _marketLayerFair = marketLayer;
  marketLayer = function(){
    const inner = _marketLayerFair.apply(this, arguments);
    if(!inner) return inner;
    return fairLayer() + inner + crowdLayer();
  };
}

/* traders spread across the whole common rather than one short row */
if(typeof traderGoal === 'function'){
  const _traderGoalFair = traderGoal;
  traderGoal = function(tr){
    const base = _traderGoalFair.apply(this, arguments);
    if(!S.market.onCommon || !base || base.cheer || base.inside) return base;
    const p = fairPlan();
    if(!p) return base;
    /* stand in front of their own building */
    const all = p.top.concat(p.bot);
    const b = all[tr.idx % all.length];
    return { x: b.x + b.w*0.5 + (tr.wx||0),
             y: b.y + b.h + 10 + (tr.wy||0), act:'working the stall' };
  };
}

/* eight traders on the common, five on the farm */
if(typeof tradersInit === 'function'){
  const _tradersInitFair = tradersInit;
  tradersInit = function(){
    const r = _tradersInitFair.apply(this, arguments);
    marketInit();
    if(!S.market.active || !S.market.onCommon) return r;
    const want = 8;
    const p = fairPlan();
    if(!p) return r;
    const all = p.top.concat(p.bot);
    while((S.traders||[]).length < want){
      const i = S.traders.length;
      const b = all[i % all.length];
      S.traders.push({
        id:'trd'+i, idx:i,
        name: TRADER_NAMES[i % TRADER_NAMES.length],
        shirt: TRADER_SHIRTS[i % TRADER_SHIRTS.length],
        x: b.x + b.w*0.5, y: b.y + b.h + 10,
        dir:1, t:Math.random()*3, wx:0, wy:0, said:0, act:'setting up',
      });
    }
    return r;
  };
}

/* the closing gathers everyone at the bandstand on the common */
if(typeof marketPlan === 'function'){
  const _marketPlanFair = marketPlan;
  marketPlan = function(){
    if(S.market && S.market.onCommon){
      const p = fairPlan();
      if(p) return { X:p.X, Y:p.Y, W:p.W, H:p.H,
        hall:p.top[0], stage:p.bandstand, green:p.green,
        cots:p.bot.slice(3), store:p.bot[2] };
    }
    return _marketPlanFair.apply(this, arguments);
  };
}

/* tell the player where it is */
if(typeof G.openMarket === 'function'){
  const _openMarketWhere = G.openMarket;
  G.openMarket = function(){
    const r = _openMarketWhere.apply(this, arguments);
    marketInit();
    if(!S.market.active || !S.market.onCommon) return r;
    /* the dialog, not the flex backdrop it sits in — see p119 */
    const body = document.getElementById('modalBody');
    if(!body || body.querySelector('.mkwhere')) return r;
    const sub = body.querySelector('.sub');
    if(sub) sub.insertAdjacentHTML('afterend',
      `<p class="sub mkwhere">Your farm was full, so it is on the common below the boundary —
       ten traders' buildings, a bandstand and half the valley turned out.</p>`);
    return r;
  };
}

(function fairCss(){
  const s = document.createElement('style');
  s.textContent = `
  #fairground, #crowd{pointer-events:none;}
  /* the crowd drifts entirely on CSS: no per-frame JavaScript for 42 people */
  #crowd .cw{ animation-name:cwDrift; animation-timing-function:ease-in-out;
    animation-iteration-count:infinite; transform-box:fill-box; }
  @keyframes cwDrift{
    0%,100%{ transform: translate(0,0); }
    25%    { transform: translate(9px,-3px); }
    50%    { transform: translate(3px,4px); }
    75%    { transform: translate(-7px,1px); } }
  @media (prefers-reduced-motion: reduce){ #crowd .cw{ animation:none !important; } }
  `;
  document.head.appendChild(s);
})();
