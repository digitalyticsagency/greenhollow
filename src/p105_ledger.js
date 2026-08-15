/* =====================================================================
   THE BOOKS, AND TWO FIXES

   1. THE VALLEY PANEL DID NOT REFRESH AFTER YOU FUNDED SOMETHING.

   Reported as: fund the village shop and it is still sitting there
   offering to be funded, so you click again thinking the first one
   missed. buildValley() takes the money, records it, and calls render()
   and ui() - but openValley() built its markup once and handed it to
   modal(), and nothing re-ran it. The funded project kept its Fund
   button until you closed and reopened the panel.

   Worth being exact about what did and did not happen, because it
   changes what needed fixing: the second click never charged you.
   buildValley returns immediately on hasV(id), and a measured double
   call takes 150,000 and then 0. What was broken was the panel telling
   you it had not worked. It refreshes now.

   2. LAYOUTS IS BEHIND A SWITCH RATHER THAN DELETED.

   Asked to remove it as not earning its place. Hidden by default rather
   than cut, because saving a pen block and stamping it out four times is
   genuinely useful to somebody laying out a big farm, and deleting the
   code would also mean unpicking p83's wrappers around it. A switch in
   Settings costs nothing, leaves no dead code, and can be turned back on.

   3. THE BOOKS THEMSELVES.

   The farm knew its own numbers and never showed them in one place: a
   monthly reckoning flashed past in the log, passive income was invisible
   until you read a tooltip, and there was nowhere to see whether the last
   fortnight was better than the one before it.

   The Money tab totals every stream and every bill, shows the trend from
   figures the game has actually recorded rather than a guess, and gives
   advice that is derived - each note names the number it came from, so it
   can be checked. No advice appears unless the data supports it.
   ===================================================================== */

/* ---------- 1. the valley panel refreshes ---------- */
if(typeof G.buildValley === 'function'){
  const _buildValleyBase = G.buildValley;
  G.buildValley = function(id){
    const had = (S.valley && S.valley.built || []).slice();
    const r = _buildValleyBase.apply(this, arguments);
    try{
      const now = (S.valley && S.valley.built) || [];
      /* only when something actually got funded, so a click on an already
         funded project does not reopen the panel underneath the player */
      if(now.length !== had.length && typeof G.openValley === 'function') G.openValley();
    }catch(e){}
    return r;
  };
}

/* ---------- 2. the layouts switch ---------- */
(function layoutSetting(){
  if(typeof SETTINGS === 'undefined') return;
  if(SETTINGS.some(o=>o.k==='layoutsOn')) return;
  const i = SETTINGS.findIndex(o=>o.g==='Display');
  SETTINGS.splice(i < 0 ? 0 : i+1, 0, {
    g:'Display', k:'layoutsOn', n:'Saved layouts', t:'bool', def:false,
    d:'Copy a block of the farm and stamp it out elsewhere. Off by default — most farms never need it.'
  });
})();
if(typeof G.openLayouts === 'function'){
  const _openLayoutsGate = G.openLayouts;
  G.openLayouts = function(){
    if(!SET('layoutsOn')){
      if(typeof toast === 'function') toast('Saved layouts are switched off in Settings', 'bad');
      return;
    }
    return _openLayoutsGate.apply(this, arguments);
  };
}
/* hide its entry point wherever it is drawn */
function syncLayoutButtons(){
  /* A substring attribute selector over the whole document cost 2.5ms a
     call on a large farm — measured the single most expensive thing in
     ui(). These buttons only ever live in the build list or the right
     panel, so it searches those two and nothing else. */
  const on = SET('layoutsOn');
  const sel = '[onclick*="openLayouts"],[onclick*="saveLayout"]';
  ['buildList','rightBody'].forEach(id=>{
    const root = document.getElementById(id);
    if(root) root.querySelectorAll(sel).forEach(b=>{ b.style.display = on ? '' : 'none'; });
  });
}
if(typeof ui === 'function'){
  const _uiLayouts = ui;
  ui = function(){ const r = _uiLayouts.apply(this, arguments);
    try{ syncLayoutButtons(); }catch(e){} return r; };
}
setTimeout(syncLayoutButtons, 800);

/* ---------- 3. the books ---------- */

/* every stream, per month, from what the farm actually is */
function incomeLines(){
  const out = [];
  const c = (typeof careerInit === 'function') ? (careerInit(), S.career) : null;

  if(typeof salary === 'function' && SET('salaryOn') !== false)
    out.push({ n:'Client work', v: salary(), d:'Your profession, paid at each reckoning.' });

  /* produce: what the farm makes in a month at today's prices */
  let produce = 0;
  (S.objs || []).forEach(o=>{
    const bp = BPMAP[o.bp]; if(!bp) return;
    if(bp.kind === 'animal' && bp.good && o.animals > 0){
      const per = (typeof E === 'object' && E.per) ? E.per(o) : (bp.per||0);
      produce += (per * o.animals / (bp.cycle||1)) * 30 * sellPrice(bp.good);
    }
    if(bp.kind === 'perennial' && bp.good){
      const q = (typeof E === 'object' && E.qty) ? E.qty(o) : (bp.qty||0);
      produce += (q / Math.max(1, bp.cycle||10)) * 30 * sellPrice(bp.good);
    }
  });
  if(produce > 0) out.push({ n:'Livestock and orchard', v: Math.round(produce),
    d:'At today\'s prices, if you collect and sell it all.' });

  /* passive holdings — the glowing stock and anything like it */
  let passive = 0;
  const bits = [];
  (S.objs || []).forEach(o=>{
    const bp = BPMAP[o.bp]; if(!bp) return;
    if(bp.kind === 'tourism' || bp.kind === 'shop'){
      const rate = (typeof E === 'object' && E.rate) ? E.rate(o) : 0;
      passive += rate * 30 * 12;
    }
  });
  if(S.oddities) Object.keys(S.oddities).forEach(k=>{
    const v = S.oddities[k];
    if(v && v.income){ passive += v.income; bits.push(v.n || k); }
  });
  if(typeof oddIncome === 'function'){ try{ passive += oddIncome(); }catch(e){} }
  if(passive > 0) out.push({ n:'Visitors and holdings', v: Math.round(passive),
    d: bits.length ? bits.join(', ') : 'Guests, the stand, and anything that pays you for owning it.' });

  return out;
}

function expenseLines(){
  if(typeof outgoings !== 'function') return [];
  const o = outgoings();
  const rows = [
    { n:'Council rates', v:o.rates,    d:'On everything you own, and it rises with tiers.' },
    { n:'Upkeep',        v:o.upkeep,   d:'1.2% of what each building cost, every month.' },
    { n:'Wages',         v:o.wages,    d:'Farmhands.' },
    { n:'Loan interest', v:o.interest, d:'On the balance outstanding.' },
    { n:'AI service',    v:o.ai,       d:'The hub modules you have switched on.' },
  ];
  if(typeof householdCost === 'function')
    rows.push({ n:'Household', v: householdCost(), d:'What the family costs to keep.' });
  return rows.filter(r=>r.v > 0);
}

/* the trend, from figures the game has recorded rather than a guess */
function ledgerHistory(){
  if(!Array.isArray(S.ledger)) S.ledger = [];
  return S.ledger;
}
function ledgerRecord(){
  const h = ledgerHistory();
  const inc = incomeLines().reduce((a,b)=>a+b.v, 0);
  const exp = expenseLines().reduce((a,b)=>a+b.v, 0);
  h.push({ d:S.day, cash:Math.round(S.cash), inc:Math.round(inc), exp:Math.round(exp),
           worth: Math.round(netWorth()) });
  if(h.length > 60) h.shift();
}
function netWorth(){
  let w = S.cash || 0;
  (S.objs || []).forEach(o=>{ const bp = BPMAP[o.bp]; if(bp) w += (bp.cost||0) * 0.55; });
  Object.keys(S.store || {}).forEach(k=>{ w += S.store[k] * sellPrice(k); });
  w -= (S.career && S.career.loan) || 0;
  return w;
}
if(typeof advanceDay === 'function'){
  const _advLedger = advanceDay;
  advanceDay = function(){
    const r = _advLedger.apply(this, arguments);
    try{ if(S.day % 5 === 0) ledgerRecord(); }catch(e){}
    return r;
  };
}

/* ---------- advice, derived, each note naming its number ---------- */
function ledgerAdvice(){
  const inc = incomeLines(), exp = expenseLines();
  const I = inc.reduce((a,b)=>a+b.v,0), E2 = exp.reduce((a,b)=>a+b.v,0);
  const out = [];

  if(E2 > I) out.push({ bad:1, t:`You are ${fmt(E2-I)} a month short.`,
    w:`${fmt(I)} in against ${fmt(E2)} out. Sell stock, take an order, or cut the biggest line below.` });
  else if(I > 0) out.push({ t:`${fmt(I-E2)} a month clear.`,
    w:`${fmt(I)} in, ${fmt(E2)} out — a margin of ${Math.round((I-E2)/I*100)}%.` });

  /* the biggest bill, named */
  if(exp.length){
    const worst = exp.slice().sort((a,b)=>b.v-a.v)[0];
    if(worst.v > E2*0.4) out.push({ t:`${worst.n} is ${Math.round(worst.v/E2*100)}% of your outgoings.`,
      w:`${fmt(worst.v)} a month. ${worst.d}` });
  }

  /* idle cash */
  if(S.cash > E2 * 8 && E2 > 0) out.push({ t:`${fmt(S.cash)} is sitting idle.`,
    w:`That is ${Math.round(S.cash/E2)} months of outgoings doing nothing. Land, a hub upgrade or a processing building would put it to work.` });

  /* the barn */
  const barn = Object.keys(S.store||{}).reduce((a,k)=>a + S.store[k]*sellPrice(k), 0);
  if(barn > 400) out.push({ t:`${fmt(barn)} sitting in the barn.`,
    w:`Sold, that is ${(barn/Math.max(1,E2)).toFixed(1)} months of bills. Perishables are losing value while it waits.` });

  /* pens that have stalled */
  const stalled = (S.objs||[]).filter(o=>{
    const bp = BPMAP[o.bp];
    return bp && bp.kind==='animal' && typeof penCapacity==='function' && (o.ready||0) >= penCapacity(o);
  }).length;
  if(stalled) out.push({ bad:1, t:`${stalled} pen${stalled>1?'s are':' is'} full and has stopped producing.`,
    w:'Collect, or put the animals higher up the household priorities in Family.' });

  /* the hub at capacity */
  if(typeof hubPlan === 'function' && typeof hub === 'function' && hub()){
    try{
      const p = hubPlan();
      if(p.waiting > 0) out.push({ bad:1, t:`The hub cannot reach ${p.waiting} job${p.waiting>1?'s':''} a day.`,
        w:`Mk ${hubMark()} does ${p.cap}. Upgrade it, or hire a farmhand — a hand is ${fmt(900)} a month against work you are already losing.` });
    }catch(e){}
  }

  /* growth, from the record */
  const h = ledgerHistory();
  if(h.length >= 3){
    const a = h[Math.max(0,h.length-4)], b = h[h.length-1];
    const days = Math.max(1, b.d - a.d);
    const rate = (b.worth - a.worth) / days;
    out.push({ t: rate >= 0 ? `Growing ${fmt(Math.round(rate*30))} a month in worth.`
                            : `Losing ${fmt(Math.round(-rate*30))} a month in worth.`,
      w:`Measured from your own history: ${fmt(a.worth)} on day ${a.d} to ${fmt(b.worth)} on day ${b.d}.` });
  } else {
    out.push({ t:'Not enough history yet for a trend.',
      w:'The books take a reading every five days. Come back in a fortnight.' });
  }
  return out;
}

/* ---------- the tab ---------- */
function moneyHTML(){
  const inc = incomeLines(), exp = expenseLines();
  const I = inc.reduce((a,b)=>a+b.v,0), E2 = exp.reduce((a,b)=>a+b.v,0);
  const net = I - E2;
  const h2 = ledgerHistory();

  let h = `<div style="padding:9px 10px;border-bottom:1px solid var(--line)">
    <div style="font-size:10px;color:var(--ink3);text-transform:uppercase;letter-spacing:.07em">Net worth</div>
    <div style="font-size:19px;font-weight:800;color:var(--gold)">${fmt(Math.round(netWorth()))}</div>
    <div class="muted" style="font-size:11px">Cash, half of what you have built, and the barn — less the loan.</div>
  </div>`;

  h += `<div class="card"><div class="ledrow"><span>Coming in</span><b style="color:#7cc24f">${fmt(I)}/mo</b></div>
    <div class="ledrow"><span>Going out</span><b style="color:#e2705c">${fmt(E2)}/mo</b></div>
    <div class="ledrow" style="border-top:1px solid var(--line);margin-top:4px;padding-top:5px">
      <span><b>Net</b></span><b style="color:${net>=0?'#7cc24f':'#e2705c'}">${net>=0?'+':''}${fmt(net)}/mo</b></div></div>`;

  /* the trend, drawn from the recorded history */
  if(h2.length >= 2){
    const vals = h2.map(r=>r.worth);
    const lo = Math.min(...vals), hi = Math.max(...vals), span = Math.max(1, hi-lo);
    const pts = h2.map((r,i)=>`${(i/(h2.length-1)*100).toFixed(1)},${(38 - (r.worth-lo)/span*34).toFixed(1)}`).join(' ');
    h += `<div class="ph">Worth over time</div>
      <div style="padding:4px 10px 10px">
        <svg viewBox="0 0 100 40" preserveAspectRatio="none" style="width:100%;height:56px">
          <polyline points="${pts}" fill="none" stroke="#7cc24f" stroke-width="1.4"
            vector-effect="non-scaling-stroke"/></svg>
        <div class="muted" style="font-size:10px">Day ${h2[0].d} to ${h2[h2.length-1].d} · ${fmt(h2[0].worth)} → ${fmt(h2[h2.length-1].worth)}</div>
      </div>`;
  }

  h += `<div class="ph">Coming in</div>`;
  if(!inc.length) h += `<div class="empty">Nothing is paying you yet.</div>`;
  inc.forEach(r=>{
    h += `<div class="mrow" data-tip="${esc(`<b>${r.n}</b>${r.d}`)}">
      <span class="nm">${r.n}</span><span class="pr" style="color:#7cc24f">${fmt(r.v)}</span></div>`;
  });

  h += `<div class="ph">Going out</div>`;
  exp.forEach(r=>{
    h += `<div class="mrow" data-tip="${esc(`<b>${r.n}</b>${r.d}`)}">
      <span class="nm">${r.n}</span><span class="pr" style="color:#e2705c">${fmt(r.v)}</span></div>`;
  });

  h += `<div class="ph">What the numbers say</div>`;
  ledgerAdvice().forEach(a=>{
    /* The game's own vocabulary: .warnbox is what it already uses for
       something needing attention, and everything else is a plain card.
       This first went out with a 3px coloured bar down the left edge,
       which is louder than anything else in this UI and a pattern the
       game uses nowhere - its borders are all .5px hairlines. */
    if(a.bad){
      h += `<div class="warnbox"><b>${a.t}</b>
        <div style="margin-top:3px;opacity:.85">${a.w}</div></div>`;
    } else {
      h += `<div class="card"><b style="font-size:12px">${a.t}</b>
        <div class="muted" style="margin-top:3px">${a.w}</div></div>`;
    }
  });
  return h;
}

/* wire it in beside Barn / Orders / AI */
if(typeof renderRight === 'function'){
  const _renderRightMoney = renderRight;
  renderRight = function(){
    if(rightTab === 'money'){
      const b = document.getElementById('rightBody');
      if(b){ b.innerHTML = moneyHTML(); return; }
    }
    return _renderRightMoney.apply(this, arguments);
  };
}
function addMoneyTab(){
  /* The bar is .ptabs with .ptab buttons and the handlers are bound with
     addEventListener rather than inline onclick, so the tab is matched by
     class and re-inserted after every ui() - the bar is rebuilt. */
  const bar = document.querySelector('.ptabs');
  if(!bar || bar.querySelector('#moneytab')) return;
  const t = document.createElement('button');
  t.id = 'moneytab';
  t.className = 'ptab';
  t.textContent = 'Money';
  t.addEventListener('click', ()=>{
    rightTab = 'money';
    bar.querySelectorAll('.ptab').forEach(b=>b.classList.remove('on','active','sel'));
    t.classList.add('on');
    if(typeof ui === 'function') ui();
  });
  const ai = [...bar.querySelectorAll('.ptab')].find(b=>b.textContent.trim()==='AI');
  if(ai && ai.nextSibling) bar.insertBefore(t, ai.nextSibling); else bar.appendChild(t);
  if(rightTab === 'money') t.classList.add('on');
}
setTimeout(addMoneyTab, 700);
setTimeout(addMoneyTab, 2200);
if(typeof ui === 'function'){
  const _uiMoney = ui;
  ui = function(){ const r = _uiMoney.apply(this, arguments); try{ addMoneyTab(); }catch(e){} return r; };
}

/* seed a first reading so the trend has somewhere to start */
setTimeout(()=>{ try{ if(!ledgerHistory().length) ledgerRecord(); }catch(e){} }, 1500);

/* ---------- handle ---------- */
G.ledgerAudit = function(){
  const inc = incomeLines(), exp = expenseLines();
  return {
    netWorth: Math.round(netWorth()),
    incoming: inc.map(r=>`${r.n}: ${fmt(r.v)}/mo`),
    outgoing: exp.map(r=>`${r.n}: ${fmt(r.v)}/mo`),
    net: fmt(inc.reduce((a,b)=>a+b.v,0) - exp.reduce((a,b)=>a+b.v,0)) + '/mo',
    readings: ledgerHistory().length,
    advice: ledgerAdvice().map(a=>a.t),
    layouts: SET('layoutsOn') ? 'on' : 'off (Settings > Display)',
  };
};
