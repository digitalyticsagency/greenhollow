/* =====================================================================
   THE YEAR HAS DAYS IN IT NOW

   The played save is 51 sessions of about fifteen minutes. A game played
   that way needs a reason to be opened on a particular day rather than
   eventually, and this one had none: every day was the same shape as the
   one before it.

   Six events on a fixed calendar, one or two a season. Each is announced
   five days out, runs for three, and asks for something off your farm -
   produce for the supper, wool for the fair, candles for the lights. Take
   part and you get standing at the market, a little money, and a line in
   the log that says the valley noticed.

   The seasons are already there: seasonLen days each, four of them, so a
   year is 112 days by default and an event lands on the same day of the
   same season every year. Nothing here invents a clock.

   The village hall from the valley projects makes every event worth half
   again, which is the first thing in the game that gives a valley project
   a reason beyond its own effect.
   ===================================================================== */

function evSeasonLen(){ return (typeof SET === 'function' ? SET('seasonLen') : 28) || 28; }
function evDayOfSeason(){ return ((S.day - 1) % evSeasonLen()) + 1; }
function evYear(){ return Math.floor((S.day - 1) / (evSeasonLen() * 4)) + 1; }

/* season indexes follow SEASONS: 0 summer, 1 autumn, 2 winter, 3 spring */
const EVENTS = [
  { id:'show',    season:0, at:0.50, len:3, n:'The valley show',
    d:'Trestles, rosettes and a man with a clipboard. Bring your best of anything.',
    asks:'Any 12 items from the barn', need:(st)=>evTotalStock() >= 12,
    take:()=>evSpend(12),
    pay:{ fame:6, cash:420 },
    say:'Your name went up on the board.' },

  { id:'shear',   season:0, at:0.82, len:3, n:'The wool fair',
    d:'Fleeces graded on the green. Buyers come down from the city for it.',
    asks:'8 wool', need:()=>(S.store.wool||0) >= 8,
    take:()=>evSpendGood('wool', 8),
    pay:{ fame:4, cash:640 },
    say:'Your clip graded well.' },

  { id:'apple',   season:1, at:0.30, len:3, n:'Apple day',
    d:'Presses in the lane, everyone tasting everyone else’s. Bring apples or cider.',
    asks:'10 apples, or 3 cider', need:()=>(S.store.apple||0) >= 10 || (S.store.cider||0) >= 3,
    take:()=>((S.store.cider||0) >= 3 ? evSpendGood('cider',3) : evSpendGood('apple',10)),
    pay:{ fame:4, cash:380 },
    say:'They asked for your press next year.' },

  { id:'supper',  season:1, at:0.72, len:3, n:'The harvest supper',
    d:'Long tables in the hall, everything on them grown within a mile.',
    asks:'Any 20 items from the barn', need:()=>evTotalStock() >= 20,
    take:()=>evSpend(20),
    pay:{ fame:8, cash:300, morale:0.12 },
    say:'The whole valley ate at your expense, and said so.' },

  { id:'lights',  season:2, at:0.36, len:3, n:'Midwinter lights',
    d:'Lanterns down the lane and along every gate, on the shortest evening of the year.',
    asks:'6 candles, or 6 honey', need:()=>(S.store.candle||0) >= 6 || (S.store.honey||0) >= 6,
    take:()=>((S.store.candle||0) >= 6 ? evSpendGood('candle',6) : evSpendGood('honey',6)),
    pay:{ fame:5, cash:260, morale:0.15 },
    say:'The children stayed out until it was properly dark.' },

  { id:'planting',season:3, at:0.18, len:3, n:'Planting day',
    d:'Neighbours turn out for whoever needs it most. This year it is you.',
    asks:'Nothing — just be here', need:()=>true,
    take:()=>true,
    pay:{ fame:3, cash:0, seedGift:1 },
    say:'Six people you barely know spent a day on your beds.' },
];

function evTotalStock(){
  return Object.keys(S.store || {}).reduce((a,k)=>a + (S.store[k]||0), 0);
}
/* spend n items, cheapest first, so taking part never costs your best goods */
function evSpend(n){
  const keys = Object.keys(S.store||{}).filter(k=>S.store[k] > 0)
    .sort((a,b)=>sellPrice(a) - sellPrice(b));
  let left = n;
  for(const k of keys){
    const take = Math.min(left, S.store[k]);
    S.store[k] -= take; if(S.store[k] <= 0) delete S.store[k];
    left -= take;
    if(left <= 0) break;
  }
  return left <= 0;
}
function evSpendGood(gid, n){
  if((S.store[gid]||0) < n) return false;
  S.store[gid] -= n; if(S.store[gid] <= 0) delete S.store[gid];
  return true;
}

function evStartDay(e){ return Math.max(1, Math.round(evSeasonLen() * e.at)); }
function evIsOn(e){
  if(S.season !== e.season) return false;
  const d = evDayOfSeason(), s = evStartDay(e);
  return d >= s && d < s + e.len;
}
function evDone(e){
  if(!S.events) S.events = {};
  return S.events[e.id + ':' + evYear()] === 1;
}
function evMark(e){
  if(!S.events) S.events = {};
  S.events[e.id + ':' + evYear()] = 1;
}
function evOnNow(){ return EVENTS.filter(evIsOn); }
/* days until an event starts, this year or next */
function evDaysAway(e){
  const sl = evSeasonLen();
  const target = e.season * sl + evStartDay(e);
  const now = (S.season * sl) + evDayOfSeason();
  const yearLen = sl * 4;
  let d = target - now;
  if(d < 0) d += yearLen;
  return d;
}
function evNext(){
  return EVENTS.slice().sort((a,b)=>evDaysAway(a) - evDaysAway(b))[0];
}

/* ---------- taking part ---------- */
G.joinEvent = function(id){
  const e = EVENTS.find(x=>x.id===id);
  if(!e) return;
  if(!evIsOn(e))  return toast('That is not on today','bad'), sfx('error');
  if(evDone(e))   return toast('You have already been','bad');
  if(!e.need())   return toast(`You need ${e.asks.toLowerCase()}`,'bad'), sfx('error');
  if(!e.take())   return toast('Not enough in the barn','bad'), sfx('error');

  /* the village hall makes the valley turn out properly */
  const mul = (typeof hasV === 'function' && hasV('hall')) ? 1.5 : 1;
  const p = e.pay;
  if(p.fame){ S.fame = Math.min(100, (S.fame||0) + Math.round(p.fame * mul)); }
  if(p.cash){ earn(Math.round(p.cash * mul), Math.round(p.cash * mul / 20)); }
  if(p.morale !== undefined) S.morale = Math.min(1, (S.morale===undefined?0.6:S.morale) + p.morale);
  if(p.seedGift) S.eventSeedGift = (S.eventSeedGift||0) + 1;

  evMark(e);
  sfx('level');
  toast(`${e.n} — ${e.say}`,'gold');
  log(`${e.n}: ${e.say}${mul>1?' The hall was full.':''}`,'gold','home');
  ui(); G.save();
};

/* planting day leaves you a season of cheaper seed */
if(typeof G === 'object' && typeof stat === 'function'){
  const _statEv = stat;
  stat = function(){
    const s = _statEv.apply(this, arguments);
    if(S.eventSeedGift && S.season === 3) s.seedoff = Math.min(0.6, (s.seedoff||0) + 0.25);
    return s;
  };
}

/* ---------- notice, and the day itself ---------- */
if(typeof advanceDay === 'function'){
  const _advEv = advanceDay;
  advanceDay = function(){
    const r = _advEv.apply(this, arguments);
    try{
      EVENTS.forEach(e=>{
        const away = evDaysAway(e);
        if(away === 5) log(`${e.n} is in five days. ${e.asks}.`, '', 'home');
        if(away === 0 && !evDone(e)) log(`${e.n} starts today. ${e.d}`, 'gold', 'home');
      });
      /* the gift lapses when spring does */
      if(S.season !== 3) S.eventSeedGift = 0;
    }catch(err){}
    return r;
  };
}

/* ---------- panel ---------- */
G.openEvents = function(){
  const on = evOnNow();
  const sl = evSeasonLen();
  let h = `<h2>The year</h2>
    <p class="sub">Year ${evYear()} · ${SEASONS[S.season].n}, day ${evDayOfSeason()} of ${sl}.
    ${on.length ? '<b>Something is on today.</b>' : `Next: ${evNext().n}, in ${evDaysAway(evNext())} days.`}</p>`;

  [0,1,2,3].forEach(si=>{
    h += `<h4 style="margin:14px 0 4px">${SEASONS[si].n}</h4>`;
    const rows = EVENTS.filter(e=>e.season===si).sort((a,b)=>a.at-b.at);
    if(!rows.length) h += `<div class="muted" style="font-size:12px">Nothing on.</div>`;
    rows.forEach(e=>{
      const isOn = evIsOn(e), done = evDone(e), away = evDaysAway(e);
      h += `<div style="padding:8px 0;border-top:1px solid var(--line);opacity:${isOn?1:.72}">
        <div style="display:flex;gap:8px;align-items:baseline">
          <b style="flex:1">${isOn?'● ':''}${e.n}</b>
          <span class="muted" style="font-size:11px">${done?'done this year':isOn?`on now · ${e.len - (evDayOfSeason()-evStartDay(e))}d left`:`day ${evStartDay(e)}`}</span>
        </div>
        <div class="muted" style="font-size:12px;margin:2px 0 4px">${e.d}</div>
        <div style="font-size:12px"><span class="muted">Brings:</span> ${e.asks}
          <span class="muted"> · </span><span style="color:var(--acc)">+${e.pay.fame} standing${e.pay.cash?`, ${fmt(e.pay.cash)}`:''}</span></div>
        ${isOn && !done ? `<button class="btn" style="margin-top:6px" ${e.need()?'':'disabled'}
            onclick="G.joinEvent('${e.id}')">${e.need()?'Take part':`Need ${e.asks.toLowerCase()}`}</button>` : ''}
      </div>`;
    });
  });
  h += `<div class="mfoot"><button class="btn ghost" onclick="G.closeModal()">Close</button></div>`;
  modal(h);
};

/* a chip in the header, and it goes gold while something is on */
setTimeout(()=>{
  const bar = document.querySelector('.tbtn') && document.querySelector('.tbtn').parentElement;
  if(!bar || document.getElementById('evbtn')) return;
  const b = document.createElement('button');
  b.id = 'evbtn'; b.className = 'tbtn';
  b.addEventListener('click', ()=>G.openEvents());
  bar.appendChild(b);
  const refresh = ()=>{
    const on = evOnNow().filter(e=>!evDone(e));
    b.textContent = on.length ? `★ ${on[0].n}` : '☰ The year';
    b.style.color = on.length ? '#f0c14b' : '';
    b.dataset.tip = on.length
      ? `<b>${on[0].n}</b>On now. ${on[0].asks}.`
      : `<b>The year</b>Next: ${evNext().n}, in ${evDaysAway(evNext())} days.`;
  };
  refresh();
  const _uiEv = ui;
  ui = function(){ const r = _uiEv.apply(this, arguments); try{ refresh(); }catch(e){} return r; };
}, 680);

/* ---------- handle ---------- */
G.eventAudit = function(){
  return {
    today: `year ${evYear()}, ${SEASONS[S.season].n} day ${evDayOfSeason()}/${evSeasonLen()}`,
    onNow: evOnNow().map(e=>e.n),
    next: `${evNext().n} in ${evDaysAway(evNext())} days`,
    calendar: EVENTS.map(e=>`${SEASONS[e.season].n} day ${evStartDay(e)}: ${e.n} (${e.len}d) — ${e.asks}`),
    doneThisYear: EVENTS.filter(evDone).map(e=>e.n),
    hallBonus: (typeof hasV==='function' && hasV('hall')) ? 'x1.5' : 'x1',
  };
};
