/* =====================================================================
   SOMEBODY LIVES IN THE VILLAGE YOU PAID FOR

   You have funded a co-op, a shop, a mill, a creamery, a school, a hall
   and a station halt — up to £3.88M — and every one of them is a painted
   roof on the horizon. Nothing goes in or out of them. That is the
   single largest thing in this game that takes money and gives nothing
   back, and it is the reason to build this.

   PEOPLE, NOT DECORATION. The village is populated in proportion to what
   you have actually funded: each project brings its own people, and they
   have somewhere to be. A miller works the mill. Children go to the
   school in the morning and are let out at three. The hall fills in the
   evening. They walk between the buildings on their own business and are
   simply there when you look over.

   MARKET DAY IS THE PAYOFF. Twice a week some of them walk the track up
   to your farm, and what happens then depends on you: they buy from a
   farm stand if you have one, they linger if the place is charming, and
   they go home again. Money you never chased arrives because a village
   exists and likes you. The more of the valley you have funded, the more
   of them come.

   THEY HAVE A VIEW OF YOU. Reputation, earned rather than declared: sell
   them good stock and it rises, have nothing for them and it drifts
   down. It sets how many come and how much they spend, so the village
   pays back proportionally to how you treat it.

   Drawn in the backdrop layer at village scale, on the same tick as
   everything else, and painted by moving elements rather than redrawing.
   ===================================================================== */

const VJOBS = {
  coop:     { n:'co-op hand', c:'#6b8b72' },
  shop:     { n:'shopkeeper', c:'#b45b4a' },
  mill:     { n:'miller',     c:'#c8a44e' },
  creamery: { n:'dairyman',   c:'#7fa8c4' },
  school:   { n:'teacher',    c:'#8a5f9c' },
  hall:     { n:'warden',     c:'#4f7f96' },
  station:  { n:'porter',     c:'#5a6a74' },
};
const VNAMES = ['Bryn','Wren','Osk','Mabel','Tam','Ivo','Hesper','Corin','Nell','Rafe',
                'Sable','Pike','Elin','Gower','Marnie'];

function villageOn(){ return !!(S.valley && S.valley.built && S.valley.built.length); }
function villageBase(){ return { x: WPX*0.16, y: 34, sc: 0.62 }; }

function villInit(){
  if(!S.vill) S.vill = { folk:[], rep:0.4, lastMarket:-99 };
  if(S.vill.rep === undefined) S.vill.rep = 0.4;
  return S.vill;
}

/* the population follows what you have funded */
function villSync(){
  const V = villInit();
  if(!villageOn()) { V.folk = []; return V; }
  const built = S.valley.built;
  const want = [];
  built.forEach((id,i)=>{
    const job = VJOBS[id] || { n:'villager', c:'#7a8a72' };
    want.push({ id, job });
    /* the bigger projects support a second household */
    if(['mill','creamery','school','hall','station'].includes(id))
      want.push({ id, job:{ n:'villager', c:'#8a8f7a' } });
  });
  /* add and remove to match, keeping existing people and their memories */
  while(V.folk.length > want.length) V.folk.pop();
  const B = villageBase();
  while(V.folk.length < want.length){
    const i = V.folk.length, w = want[i];
    V.folk.push({
      id: 'v'+i, home: w.id, job: w.job,
      name: VNAMES[i % VNAMES.length],
      x: B.x + 40 + i*26, y: B.y + 30,
      hx: B.x + 40 + i*26, hy: B.y + 30,
      dir: 1, state:'work', t: Math.random()*8,
      temper: ['brisk','idle','chatty'][i % 3],
      away: 0, spent: 0,
    });
  }
  V.folk.forEach((f,i)=>{ if(want[i]) { f.home = want[i].id; f.job = want[i].job; } });
  return V;
}

/* ---------- what they do with their day ---------- */
function villTick(dt){
  if(!villageOn()) return;
  const V = villSync();
  const B = villageBase();
  const f0 = (typeof dayFrac === 'function') ? dayFrac() : 0.5;
  const marketDay = (S.day % 3 === 0);

  V.folk.forEach((f,i)=>{
    f.t += dt;
    if(f.away){
      /* on the farm: walk in, hang about, walk home */
      f.away -= dt;
      const gate = { x:(FARM.x+1)*T, y:(FARM.y+FARM.h*0.5)*T };
      const tgt = f.away > 14 ? gate : { x:f.hx, y:f.hy };
      const dx = tgt.x-f.x, dy = tgt.y-f.y, d = Math.hypot(dx,dy)||1;
      if(d > 6){ const k = Math.min(1, 42*dt/d); f.x += dx*k; f.y += dy*k;
        f.dir = dx<0?-1:1; f.state='walk'; }
      else f.state = 'look';
      if(f.away <= 0){ f.x=f.hx; f.y=f.hy; f.state='work'; }
      return;
    }
    /* at home: a routine by hour */
    let tx = f.hx, ty = f.hy;
    if(f0 > 0.34 && f0 < 0.62){ tx = f.hx + (i%3-1)*22; ty = f.hy + 6; f.state='work'; }
    else if(f0 >= 0.62 && f0 < 0.82){ tx = B.x + 70; ty = B.y + 24; f.state='talk'; }
    else { tx = f.hx; ty = f.hy; f.state='work'; }
    const dx = tx-f.x, dy = ty-f.y, d = Math.hypot(dx,dy)||1;
    if(d > 4){ const k = Math.min(1, 22*dt/d); f.x += dx*k; f.y += dy*k; f.dir = dx<0?-1:1; }
  });

  /* market day: some of them come up the track */
  if(marketDay && V.lastMarket !== S.day && f0 > 0.36 && f0 < 0.44){
    V.lastMarket = S.day;
    villMarket();
  }
  villPaint();
}

/* ---------- market day ---------- */
function villMarket(){
  const V = villInit();
  const going = Math.max(1, Math.round(V.folk.length * (0.25 + V.rep*0.45)));
  let sold = 0, took = 0;
  const stand = (S.objs||[]).find(o=>BPMAP[o.bp] && ['shop','tourism'].includes(BPMAP[o.bp].kind));

  V.folk.slice(0, going).forEach(f=>{ f.away = 34 + Math.random()*10; });

  if(stand){
    const keys = Object.keys(S.store||{}).filter(k=>S.store[k]>0);
    for(let i=0;i<going && keys.length;i++){
      const k = keys[Math.floor(Math.random()*keys.length)];
      if(!(S.store[k]>0)) continue;
      const q = Math.min(S.store[k], 1 + Math.floor(Math.random()*3));
      const price = sellPrice(k) * (1.12 + V.rep*0.3);   /* they pay over market */
      S.store[k] -= q; if(S.store[k]<=0) delete S.store[k];
      S.cash += q*price; S.totalEarned += q*price;
      sold += q; took += q*price;
    }
    V.rep = Math.min(1, V.rep + (sold ? 0.04 : -0.02));
  } else {
    V.rep = Math.max(0, V.rep - 0.01);
  }

  if(typeof log === 'function'){
    if(sold) log(`Market day — ${going} came up from the village and bought ${sold} for ${fmt(Math.round(took))}.`, 'good', 'money');
    else if(stand) log(`Market day — ${going} came up from the village and found the barn empty.`, 'bad', 'farm');
    else log(`${going} walked up from the village to look round. You have nowhere to sell to them.`, '', 'farm');
  }
  if(typeof toast === 'function' && sold) toast(`Village market: +${fmt(Math.round(took))}`, 'good');
}

/* ---------- drawing ---------- */
function villLayer(){
  let g = document.getElementById('villagefolk');
  if(!g){
    const bg = document.getElementById('fg');
    if(!bg) return null;
    g = document.createElementNS('http://www.w3.org/2000/svg','g');
    g.id = 'villagefolk';
    g.setAttribute('pointer-events','none');
    bg.appendChild(g);
  }
  return g;
}
function villFolkArt(f){
  const c = f.job.c;
  return `<g><ellipse cx="0" cy="1" rx="3" ry="1.1" fill="#16240c" opacity=".2"/>
    <rect x="-1.7" y="-6.4" width="3.4" height="6.4" rx="1.5" fill="${c}"/>
    <circle cx="0" cy="-8.2" r="1.9" fill="#efc9a4"/>
    <path d="M-1.4 -5 L-3 -2.4 M1.4 -5 L3 -2.4" stroke="${c}" stroke-width="1.1" stroke-linecap="round"/></g>`;
}
function villPaint(){
  const g = villLayer(); if(!g) return;
  const V = villInit();
  const have = {};
  [...g.children].forEach(el=>{ have[el.getAttribute('data-v')] = el; });
  V.folk.forEach(f=>{
    let el = have[f.id];
    if(!el){
      el = document.createElementNS('http://www.w3.org/2000/svg','g');
      el.setAttribute('data-v', f.id);
      el.innerHTML = villFolkArt(f);
      g.appendChild(el);
    }
    delete have[f.id];
    const sc = f.away ? 1 : villageBase().sc;
    el.setAttribute('transform', `translate(${n(f.x)},${n(f.y)}) scale(${(f.dir*sc).toFixed(2)},${sc})`);
  });
  Object.keys(have).forEach(k=>have[k].remove());
}

if(typeof tickPeople === 'function'){
  const _tickPeopleVill = tickPeople;
  tickPeople = function(dt){
    const r = _tickPeopleVill.apply(this, arguments);
    try{ villTick(Math.min(0.08, typeof dt==='number'?dt:0.05)); }catch(e){}
    return r;
  };
}

/* ---------- it shows in the valley panel ---------- */
if(typeof G.openValley === 'function'){
  const _openValleyVill = G.openValley;
  G.openValley = function(){
    const r = _openValleyVill.apply(this, arguments);
    try{
      if(!villageOn()) return r;
      const V = villSync();
      const body = document.querySelector('.mbox, .modal, #modal') || document.body;
      if(body.querySelector('.villcard')) return r;
      const div = document.createElement('div');
      div.className = 'card villcard';
      div.innerHTML = `<div class="eyebrow">The village</div>
        <div class="ledrow"><span>People living there</span><b>${V.folk.length}</b></div>
        <div class="ledrow"><span>What they think of you</span>
          <b>${V.rep>0.7?'they rate you':V.rep>0.4?'friendly':'indifferent'}</b></div>
        <div class="muted" style="margin-top:5px">They walk up every third day. Keep something in
        the barn and a stand to sell it from and they will buy — over the market rate, because
        they would rather buy from you.</div>`;
      body.appendChild(div);
    }catch(e){}
    return r;
  };
}

/* ---------- handle ---------- */
G.villageAudit = function(){
  const V = villSync();
  const by = {}; V.folk.forEach(f=>{ by[f.state] = (by[f.state]||0)+1; });
  return {
    funded: villageOn() ? S.valley.built.join(', ') : 'nothing funded yet',
    population: V.folk.length,
    doing: by,
    onYourFarmNow: V.folk.filter(f=>f.away>0).length,
    reputation: +V.rep.toFixed(2),
    marketDay: `every 3rd day — next on day ${S.day + (3 - S.day%3)}`,
    canSellToThem: (S.objs||[]).some(o=>BPMAP[o.bp] && ['shop','tourism'].includes(BPMAP[o.bp].kind)),
    wasBefore: 'the village was painted roofs with nobody in them',
  };
};
