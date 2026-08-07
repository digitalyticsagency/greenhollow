/* =====================================================================
   A MARKET THAT WORKS LIKE A REAL ONE, AND STAFF WHO WORK IN BUILDINGS

   The market layout follows how markets are actually laid out: the
   eye-catching stall at the entrance to pull people in, perishables at
   the far end so they are bought last, wide aisles, seating so people
   linger, a tiered display because height sells, and a demonstration
   stand — the interactive zone every market guide insists on.

   And it now sells things. A market you can only sell at is half a
   market. This one stocks the seed, feed and gear that make a farm
   self-sufficient, priced against your standing.

   Separately: buildings that should have somebody in them now do.
   Processing rooms, shops and the hub are staffed around the clock on
   shifts, and lifting the roof shows you who is on.
   ===================================================================== */

/* ---------- 1. what the market sells ---------- */
/* Deliberately only what a farm needs to stand on its own - seed to
   grow, feed to keep stock, gear that removes a dependency. No trinkets. */
const MARKET_STOCK = [
  {id:'seedbox',  n:'Seed box',        d:'A season of mixed seed. Plant anything without buying in.',
   cost:260,  gain:'seed'},
  {id:'feedrun',  n:'Feed run',        d:'A pallet of stock feed. Fills the feed store outright.',
   cost:220,  gain:'feed'},
  {id:'toolkit',  n:'Tool kit',        d:'Proper tools. Every farm job takes a quarter less time, for good.',
   cost:900,  gain:'tools'},
  {id:'compostst',n:'Compost starter', d:'Live culture and worms. Clears pests and sets the beds right.',
   cost:340,  gain:'compost'},
  {id:'rainkit',  n:'Guttering kit',   d:'Catches off every roof you own. Adds water storage permanently.',
   cost:520,  gain:'water'},
  {id:'breeding', n:'Breeding pair',   d:'Good stock. Your animals produce more from here on.',
   cost:1200, gain:'stock'},
];

function marketPrice(it){
  /* standing cuts what you pay, the same way it lifts what you earn */
  const disc = (typeof fameBonus === 'function') ? fameBonus()*0.6 : 0;
  return Math.max(20, Math.round(it.cost * (1 - disc)));
}

G.buyStock = function(id){
  marketInit();
  const it = MARKET_STOCK.find(x=>x.id===id);
  if(!it) return;
  if(!S.bought) S.bought = {};
  const once = ['toolkit','rainkit','breeding'].includes(id);
  if(once && S.bought[id]) return toast('You already have that','');
  const price = marketPrice(it);
  if(S.cash < price) return toast(`Needs ${fmt(price)}`,'bad'), sfx('error');
  S.cash -= price;
  S.bought[id] = (S.bought[id]||0) + 1;

  /* each one does something real */
  if(it.gain === 'seed'){ Object.keys(GOODS).forEach(k=>{ S.seeds = S.seeds||{}; S.seeds[k]=(S.seeds[k]||0)+4; }); }
  if(it.gain === 'feed'){ S.feed = (S.feed||0) + 60; }
  if(it.gain === 'compost'){ S.pests = Math.max(0, (S.pests||0) - 60);
                             (S.objs||[]).forEach(o=>{ if(o.weeds) o.weeds = 0; }); }
  if(it.gain === 'water'){ S.waterBonus = (S.waterBonus||0) + 400; S.water = (S.water||0) + 200; }
  if(it.gain === 'tools'){ S.toolBonus = 0.25; }
  if(it.gain === 'stock'){ S.stockBonus = (S.stockBonus||0) + 0.3; }

  log(`Bought ${it.n} at the market — ${fmt(price)}.`, 'good', 'money');
  toast(`${it.n} bought`, 'good');
  if(typeof sfx==='function') sfx('coin');
  G.openMarket(); ui(); G.save();
};

/* the tool kit actually shortens jobs */
if(typeof spendHours === 'function'){
  const _spendHours = spendHours;
  spendHours = function(kind){
    const h = _spendHours.apply(this, arguments);
    if(S.toolBonus){ S.career.hours = Math.min(24, S.career.hours + h*S.toolBonus); }
    return h;
  };
}

/* ---------- 2. the market screen gains a supplies aisle ---------- */
if(typeof G.openMarket === 'function'){
  const _openMarketBuy = G.openMarket;
  G.openMarket = function(){
    const r = _openMarketBuy.apply(this, arguments);
    marketInit();
    if(!S.market.active) return r;
    const body = document.querySelector('.mbox, .modal, #modal');
    if(!body || body.querySelector('.mkstock')) return r;
    if(!S.bought) S.bought = {};
    const html = `
      <h4>Supplies</h4>
      <p class="sub">What a farm needs to stand on its own. Your standing takes money off
      the price, the same way it puts money on what you sell.</p>
      <div class="mkgrid mkstock">
        ${MARKET_STOCK.map(it=>{
          const once = ['toolkit','rainkit','breeding'].includes(it.id);
          const had = once && S.bought[it.id];
          const p = marketPrice(it);
          return `<button class="mkcard" ${had?'disabled':''} onclick="G.buyStock('${it.id}')">
            <b>${it.n}</b><span class="muted">${it.d}</span>
            <span class="lprice">${had ? 'Owned' : fmt(p)}</span></button>`;
        }).join('')}
      </div>`;
    const foot = body.querySelector('.mfoot');
    if(foot) foot.insertAdjacentHTML('beforebegin', html);
    else body.insertAdjacentHTML('beforeend', html);
    return r;
  };
}

/* ---------- 3. the ground, laid out the way markets actually are ---------- */
if(typeof marketLayer === 'function'){
  const _marketLayerBase = marketLayer;
  marketLayer = function(){
    const base = _marketLayerBase.apply(this, arguments);
    if(!base) return base;
    marketInit();
    const g = S.market.ground;
    if(!g) return base;
    const X = g.tx*T, Y = g.ty*T, W = g.w*T, H = g.h*T;
    let s = `<g id="marketextra" aria-hidden="true">`;

    /* the draw stall at the entrance: flowers, because that is what every
       market puts at the front */
    s += `<g transform="translate(${n(X+W*0.02)},${n(Y+H*0.40)})">`;
    for(let i=0;i<10;i++){
      const c=['#e05c7a','#f0a24b','#f5d94e','#a86fd0','#e8607f'][i%5];
      s += `<circle cx="${n(4+(i%5)*5)}" cy="${n(4+Math.floor(i/5)*7)}" r="2.4" fill="${c}"/>`;
      s += `<circle cx="${n(4+(i%5)*5)}" cy="${n(4+Math.floor(i/5)*7)}" r="0.9" fill="#fdf3c8"/>`;
    }
    s += `</g>`;

    /* tiered display on the near row - height sells */
    for(let i=0;i<3;i++){
      const tx = X + W*(0.18 + i*0.28);
      s += `<rect x="${n(tx)}" y="${n(Y+H*0.30)}" width="${n(W*0.10)}" height="${n(H*0.04)}" rx="1" fill="#a5825a"/>`;
      s += `<rect x="${n(tx+W*0.012)}" y="${n(Y+H*0.26)}" width="${n(W*0.076)}" height="${n(H*0.04)}" rx="1" fill="#b8935f"/>`;
      for(let k=0;k<3;k++)
        s += `<circle cx="${n(tx+W*0.022+k*W*0.026)}" cy="${n(Y+H*0.275)}" r="1.6"
          fill="${['#d8402f','#82c94f','#e8862e'][k]}"/>`;
    }

    /* seating, so people linger rather than walk straight through */
    [[0.30,0.52],[0.62,0.52]].forEach(p=>{
      s += `<rect x="${n(X+W*p[0])}" y="${n(Y+H*p[1])}" width="${n(W*0.09)}" height="${n(H*0.035)}"
        rx="1.4" fill="#a98255"/>`;
      s += `<rect x="${n(X+W*p[0])}" y="${n(Y+H*p[1])}" width="${n(W*0.09)}" height="${n(H*0.012)}"
        rx="1" fill="#c49a63"/>`;
    });

    /* the demonstration stand - the interactive zone, with a pan steaming */
    const dx = X + W*0.74, dy = Y + H*0.46;
    s += `<rect x="${n(dx)}" y="${n(dy)}" width="${n(W*0.14)}" height="${n(H*0.09)}" rx="1.6" fill="#8e9aa2"/>`;
    s += `<circle cx="${n(dx+W*0.045)}" cy="${n(dy+H*0.045)}" r="${n(H*0.022)}" fill="#3c454b"/>`;
    for(let i=0;i<2;i++)
      s += `<circle class="fx-steam" cx="${n(dx+W*0.045)}" cy="${n(dy+H*0.02)}" r="${(2+i).toFixed(1)}"
        fill="#fff" opacity=".22" style="animation-delay:-${(i*1.4).toFixed(1)}s"/>`;
    s += `<rect x="${n(dx-W*0.01)}" y="${n(dy-H*0.06)}" width="${n(W*0.16)}" height="${n(H*0.045)}" rx="1.4"
      fill="#f2ece0"/>`;

    return base + s + '</g>';
  };
}

/* ---------- 4. staff inside the buildings ---------- */
/* A dairy with nobody in it is a shed. These are the people who make the
   processing buildings read as working, and they run on shifts so there
   is always somebody on somewhere. */
const STAFF_ROLES = {
  kitchen:   {t:'making preserves',  shirt:'#d4726a'},
  dairy:     {t:'on the separator',  shirt:'#6bbf7a'},
  honey_lab: {t:'spinning frames',   shirt:'#e8a33d'},
  packing:   {t:'packing boxes',     shirt:'#5fb0d4'},
  workshop:  {t:'at the bench',      shirt:'#8f6fc4'},
  gift_shop: {t:'on the counter',    shirt:'#c47fa8'},
  farm_stand:{t:'serving',           shirt:'#e0995c'},
  ai_hub:    {t:'watching the board',shirt:'#7fa8c4'},
};
const STAFF_NAMES = ['Rosa','Kit','Dev','Noor','Sam','Iris','Ben','Yara','Cal','Mina','Tobi','Wren'];

function staffedBuildings(){
  return (S.objs||[]).filter(o=>STAFF_ROLES[(BPMAP[o.bp]||{}).art]);
}

function staffInit(){
  if(!S.staff) S.staff = [];
  const bs = staffedBuildings();
  S.staff = S.staff.filter(w => bs.some(b => b.id === w.at));
  bs.forEach((b, i)=>{
    if(S.staff.some(w => w.at === b.id)) return;
    const art = BPMAP[b.bp].art, role = STAFF_ROLES[art];
    const f = footprint(BPMAP[b.bp], b.rot);
    S.staff.push({
      id:'stf'+b.id, at:b.id, art,
      name: STAFF_NAMES[(S.staff.length + i) % STAFF_NAMES.length],
      shirt: role.shirt, act: role.t,
      shift: i % 3,                          /* three shifts, round the clock */
      x:(b.tx + f.w*0.5)*T, y:(b.ty + f.h*0.5)*T,
      dir:1, t:Math.random()*3, wx:0, wy:0,
    });
  });
}

/* who is on right now: three shifts, so the hub is never empty */
function onShift(w){
  const f = (typeof dayFrac === 'function') ? dayFrac() : 0.5;
  const band = f < 0.33 ? 0 : f < 0.66 ? 1 : 2;
  /* the hub runs around the clock; everything else works daylight */
  if(w.art === 'ai_hub') return w.shift === band;
  return f > 0.28 && f < 0.80;
}

function tickStaff(dt){
  staffInit();
  (S.staff||[]).forEach(w=>{
    const b = (S.objs||[]).find(o=>o.id === w.at);
    if(!b) return;
    const f = footprint(BPMAP[b.bp], b.rot);
    const cx = (b.tx + f.w*0.5)*T, cy = (b.ty + f.h*0.5)*T;
    w.on = onShift(w);
    const gx = cx + (w.wx||0), gy = cy + (w.wy||0);
    const dx = gx - w.x, dy = gy - w.y, d = Math.hypot(dx, dy);
    if(d > 2){ const spd = 26*dt; w.x += dx/d*Math.min(d,spd); w.y += dy/d*Math.min(d,spd);
               if(Math.abs(dx) > 0.4) w.dir = dx > 0 ? 1 : -1; }
    w.t = (w.t||0) + dt;
    if(w.t > 3.5){ w.t = 0; w.wx = (Math.random()-0.5)*f.w*T*0.5; w.wy = (Math.random()-0.5)*f.h*T*0.4; }
  });
  paintStaff();
}

function staffLayer(){
  staffInit();
  if(!(S.staff||[]).length) return '';
  return `<g id="staff">` + S.staff.map(w=>
    `<g class="npc worker" data-w="${w.id}" transform="translate(${n(w.x)},${n(w.y)})">
      <g class="youbob working"><g transform="scale(${w.dir},1)">${person(0,0,1.0,w.shirt,'#e8e0cc')}</g></g>
      <text class="nlab" y="-24" text-anchor="middle">${w.name}</text></g>`).join('') + `</g>`;
}

function paintStaff(){
  const roofOff = SET('roofOff');
  (S.staff||[]).forEach(w=>{
    const el = document.querySelector(`[data-w="${w.id}"]`);
    if(!el) return;
    el.setAttribute('transform', `translate(${n(w.x)},${n(w.y)})`);
    /* they are inside a building, so the roof hides them unless lifted */
    el.style.opacity = (w.on && roofOff) ? '' : '0';
  });
}

/* lifting the roof also cuts away the working buildings */
function workBuildingCutaways(){
  if(!SET('roofOff')) return '';
  let s = '';
  staffedBuildings().forEach(b=>{
    const bp = BPMAP[b.bp], f = footprint(bp, b.rot);
    const w = f.w*T, h = f.h*T, X = b.tx*T, Y = b.ty*T;
    s += `<g class="workcut" transform="translate(${n(X)},${n(Y)})">`;
    s += `<rect x="${n(w*0.07)}" y="${n(h*0.07)}" width="${n(w*0.86)}" height="${n(h*0.66)}" rx="3" fill="#cbb28a"/>`;
    for(let i=1;i<5;i++)
      s += `<line x1="${n(w*0.07)}" y1="${n(h*(0.07+i*0.132))}" x2="${n(w*0.93)}" y2="${n(h*(0.07+i*0.132))}"
        stroke="#ad9268" stroke-width="0.5" opacity=".6"/>`;
    /* a bench down one side and crates down the other */
    s += `<rect x="${n(w*0.10)}" y="${n(h*0.12)}" width="${n(w*0.80)}" height="${n(h*0.13)}" rx="1.6" fill="#8e9aa2"/>`;
    s += `<rect x="${n(w*0.10)}" y="${n(h*0.12)}" width="${n(w*0.80)}" height="${n(h*0.04)}" rx="1.6" fill="#aab6bd"/>`;
    for(let i=0;i<3;i++)
      s += `<rect x="${n(w*(0.12+i*0.26))}" y="${n(h*0.54)}" width="${n(w*0.20)}" height="${n(h*0.14)}" rx="1.4" fill="#8a6a45"/>`;
    s += `<rect x="${n(w*0.07)}" y="${n(h*0.07)}" width="${n(w*0.86)}" height="${n(h*0.66)}" rx="3"
      fill="none" stroke="#f2e9d8" stroke-width="1.4" opacity=".9"/>`;
    s += `</g>`;
  });
  return s;
}

const _peopleLayerStaff = peopleLayer;
peopleLayer = function(){
  return workBuildingCutaways() + _peopleLayerStaff.apply(this, arguments) + staffLayer();
};

const _tickPeopleStaff = tickPeople;
tickPeople = function(dt){
  const r = _tickPeopleStaff.apply(this, arguments);
  if(S && S.speed !== 0) tickStaff(dt);
  return r;
};

(function market2Css(){
  const s = document.createElement('style');
  s.textContent = `
  #marketextra{pointer-events:none;}
  #staff .worker{transition:opacity .4s ease;}
  .workcut{pointer-events:none;}
  `;
  document.head.appendChild(s);
})();
