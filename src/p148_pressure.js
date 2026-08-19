/* =====================================================================
   THE FARM STOPS BEING HARD ON DAY NINETY-ONE

   Measured against the running build, buying in a sensible order:

     day  31   $301 in hand, $2,571 a month clear     — tight, good
     day  91   a month's profit exceeds the most expensive thing in the game
     day 121   the whole catalogue built, $122,000 banked
     day 151   money has stopped being a constraint at all
     day 211   $295,000 and nothing left to spend it on

   Income grew about elevenfold across that run while costs grew about
   three and a half. The income:outgoings ratio went 3.8 to 13.0. Nothing
   in the game pushes back on scale, so scale is free.

   The fix is not to make things cost more. A flat rise punishes the early
   farm, which is the part that already works. What actually happens to a
   smallholding that gets big is three things, and none of them are
   arbitrary:

   ONE. THE PRICE FALLS WHEN YOU FLOOD THE MARKET. Sell six dozen eggs a
   week into a valley and you get the going rate. Sell six hundred and you
   are the reason the rate moved. Every good now has a local market that
   softens as your own output of it climbs — gently at first, hard once
   you are the dominant supplier, with a floor so it never becomes
   pointless. This is the one that matters: it caps monoculture, it makes
   a mixed farm worth more than a big one, and it does nothing at all to
   somebody with four beds and a coop.

   TWO. RATES ARE PROGRESSIVE. Councils rate on improved value, and the
   band you sit in rises with what you have built. A shed on a small block
   is rated as a shed; forty buildings is a commercial operation and is
   rated like one.

   THREE. SCALE BRINGS COMPLIANCE. Past real thresholds a real holding
   picks up real obligations: food safety certification once you are
   processing for sale, effluent management once the stock numbers are up,
   public liability once you have paying visitors staying, and workers'
   cover once you employ more than a couple of people. Each is announced
   when you cross it, costs a one-off to set up and a fixed amount every
   month after — and each is the direct consequence of something you chose
   to build.

   All three scale with success and none of them touch the first month.
   The Difficulty setting still multiplies the lot, so Relaxed stays
   relaxed.
   ===================================================================== */

/* ---------- one: the local market only absorbs so much ---------- */

/* how much of a given good this farm turns out in a month */
function monthlyOutput(gid){
  let out = 0;
  (S.objs || []).forEach(o=>{
    const bp = BPMAP[o.bp]; if(!bp) return;
    if(bp.good === gid){
      if(bp.kind === 'animal' && o.animals > 0){
        const per = (typeof E === 'object' && E.per) ? E.per(o) : (bp.per || 0);
        out += per * o.animals / Math.max(1, bp.cycle || 1) * 30;
      } else if(bp.kind === 'perennial'){
        const q = (typeof E === 'object' && E.qty) ? E.qty(o) : (bp.qty || 0);
        out += q / Math.max(1, bp.cycle || 10) * 30;
      }
    }
    /* crops in the ground, and what the workshops turn out */
    if(bp.kind === 'plot' && o.crop === gid && typeof CROPS === 'object' && CROPS[gid])
      out += (CROPS[gid].yield || 0) * (bp.slots || 1) * 30 / Math.max(4, CROPS[gid].days || 8);
    if(bp.kind === 'process' && o.recipe >= 0 && bp.recipes && bp.recipes[o.recipe]){
      const rc = bp.recipes[o.recipe];
      if(rc.out && rc.out[gid]) out += rc.out[gid] * 30 / Math.max(1, rc.days || 1);
    }
  });
  return out;
}

/* The curve. Below the threshold nothing happens at all — a small farm is
   a price taker and sells everything at the going rate. Past it the price
   softens on a power curve rather than a cliff, and it never falls below
   the floor, because somebody will always buy good food at a discount. */
const SAT = { free: 90, half: 520, floor: 0.34, shape: 0.78 };
function saturation(gid){
  const q = monthlyOutput(gid);
  if(q <= SAT.free) return 1;
  const over = (q - SAT.free) / SAT.half;
  const mul = 1 / (1 + Math.pow(over, SAT.shape));
  return Math.max(SAT.floor, mul);
}

if(typeof sellPrice === 'function'){
  const _sellBase = sellPrice;
  sellPrice = function(gid){
    const p = _sellBase.apply(this, arguments);
    let s = 1;
    try{ s = saturation(gid); }catch(e){}
    /* Relaxed barely feels it, Brutal feels it early */
    let d = 1;
    try{ d = (typeof diff === 'function' && diff().sell) ? diff().sell : 1; }catch(e){}
    const soften = 1 - (1 - s) * (d >= 1 ? 1 : 0.6);
    return Math.max(1, Math.round(p * soften));
  };
}

/* ---------- one and a half: the valley only holds so many visitors ----
   Tourism income was linear in beds: every tent added its full nightly
   rate again, so forty beds earned forty times one bed. Real accommodation
   does not work that way — the district has a finite number of people
   looking for somewhere to stay, and putting up more beds spreads the same
   demand thinner. Occupancy is what falls.

   Demand rises with charm and with your standing, but sub-linearly: being
   twice as charming does not bring twice as many people, it brings about
   forty percent more. So the first few beds run near full, and the
   twentieth only pays if you have earned the demand to fill it. */
function guestCapacity(){
  return (S.objs || []).reduce((a, o)=>{
    const bp = BPMAP[o.bp]; if(!bp) return a;
    if(bp.kind === 'tourism') return a + Math.max(1, bp.slots || 1);
    if(bp.kind === 'housing') return a + Math.max(1, bp.slots || 1) * 0.5;
    return a;
  }, 0);
}
function guestDemand(){
  let charm = 0, fame = 0;
  try{ charm = stat().charm || 0; }catch(e){}
  try{ fame = S.fame || 0; }catch(e){}
  /* a couple of parties a month before anyone has heard of you, then it
     grows on the square root of how nice the place is */
  return 2.2 + 3.4 * Math.sqrt(Math.max(0, charm) / 40) * (1 + fame / 180);
}
function occupancy(){
  const cap = guestCapacity();
  if(cap <= 0) return 1;
  return Math.max(0.18, Math.min(1, guestDemand() / cap));
}
/* p145 works tourism out as: every building's nightly rate, times the
   charm multiplier, times thirty. That is linear in buildings and linear
   in charm, so six tents at charm 346 came to $24,700 a month and twelve
   would have come to $49,400. Nobody is staying in them — the number
   never asks whether anyone came.

   Counted properly it is people, not beds: however many parties the
   district sends you, capped by how many you can put up, times what they
   pay. Charm still helps twice — it brings more of them, and they pay a
   premium — but both are bounded, so the twentieth tent only earns if you
   have earned the demand to fill it. */
function tourismObjs(){
  return (S.objs || []).filter(o=>(BPMAP[o.bp] || {}).kind === 'tourism');
}
function nightlyRate(){
  const t = tourismObjs();
  if(!t.length) return 0;
  const avg = t.reduce((a, o)=>a + (BPMAP[o.bp].income || 0), 0) / t.length;
  let charm = 0;
  try{ charm = stat().charm || 0; }catch(e){}
  const premium = 1 + Math.min(0.65, charm / 620);      /* a nicer place charges more, within reason */
  return avg * premium;
}
function tourismMonthly(){
  const parties = Math.min(guestCapacity(), guestDemand());
  return parties * nightlyRate() * 30;
}
/* what p145 put in, so it can be taken back out again exactly */
function tourismLinearOld(){
  let mul = 1;
  try{ mul = ((typeof charmMul === 'function') ? charmMul() : 1) * (stat().tourmul || 1); }catch(e){}
  return tourismObjs().reduce((a, o)=>a + (BPMAP[o.bp].income || 0) * mul * 30, 0);
}
if(typeof incomeLines === 'function'){
  const _incOcc = incomeLines;
  incomeLines = function(){
    const out = _incOcc.apply(this, arguments) || [];
    try{
      const line = out.find(l=>/visitors and holdings/i.test(l.n || ''));
      if(line && tourismObjs().length){
        const corrected = line.v - tourismLinearOld() + tourismMonthly();
        line.v = Math.max(0, Math.round(corrected));
        line.d = `${Math.round(Math.min(guestCapacity(), guestDemand()))} parties a month at `
               + `${fmt(Math.round(nightlyRate()))} a night. `
               + `${Math.round(occupancy()*100)}% of your beds are filled.`;
      }
    }catch(e){}
    return out;
  };
}

/* ---------- one and three quarters: retail, then wholesale ----------
   Saturation prices each good against its own output, which stops a
   monoculture but does nothing about volume spread across fifteen
   different goods — sell a bit of everything and every line stays under
   its threshold. A real direct-selling farm hits a different wall: a
   stall, a stand and a district only absorb so much at retail, and
   everything past that goes to a wholesaler at wholesale money.

   So the first slice of total output each month earns the retail price
   the game already quotes, and the rest earns about half. It is one line
   in the ledger and it is the difference between a smallholding and a
   supplier. */
const RETAIL = { units: 640, wholesale: 0.52 };
function totalOutput(){
  let t = 0;
  Object.keys(GOODS || {}).forEach(g=>{ t += monthlyOutput(g); });
  return t;
}
function retailBlend(){
  const t = totalOutput();
  if(t <= RETAIL.units) return 1;
  return (RETAIL.units + (t - RETAIL.units) * RETAIL.wholesale) / t;
}
if(typeof incomeLines === 'function'){
  const _incWhole = incomeLines;
  incomeLines = function(){
    const out = _incWhole.apply(this, arguments) || [];
    try{
      const blend = retailBlend();
      if(blend < 0.999){
        const line = out.find(l=>/livestock and orchard/i.test(l.n || ''));
        if(line){
          line.v = Math.round(line.v * blend);
          line.d = `Past ${RETAIL.units} units a month the surplus goes wholesale, so you are `
                 + `averaging ${Math.round(blend*100)}% of the retail price.`;
        }
      }
    }catch(e){}
    return out;
  };
}

/* ---------- two: rates go up in bands ---------- */
const RATE_BANDS = [
  { upto: 13,  mul: 1.00, n:'residential' },
  { upto: 22,  mul: 1.25, n:'rural residential' },
  { upto: 32,  mul: 1.70, n:'primary production' },
  { upto: 45,  mul: 2.20, n:'commercial' },
  { upto: 999, mul: 2.90, n:'commercial — major' },
];
function rateBand(){
  const built = (S.objs || []).filter(o=>(BPMAP[o.bp] || {}).kind !== 'decor').length;
  return RATE_BANDS.find(b=>built <= b.upto) || RATE_BANDS[RATE_BANDS.length - 1];
}

/* ---------- three: obligations you take on by growing ---------- */
const OBLIGATIONS = [
  { id:'food',    n:'Food safety certification',
    d:'You are processing food for sale. It has to be certified and inspected.',
    setup: 900,  month: 240,
    met: ()=>(S.objs||[]).filter(o=>(BPMAP[o.bp]||{}).kind === 'process').length >= 3 },
  { id:'effluent',n:'Effluent management plan',
    d:'Stock numbers are past what a paddock absorbs on its own.',
    setup: 1400, month: 310,
    met: ()=>(S.objs||[]).reduce((a,o)=>a + ((BPMAP[o.bp]||{}).kind === 'animal' ? (o.animals||0) : 0), 0) >= 40 },
  { id:'liability',n:'Public liability cover',
    d:'People are staying on your land and paying you for it.',
    setup: 1100, month: 380,
    met: ()=>(S.objs||[]).filter(o=>['tourism','housing'].includes((BPMAP[o.bp]||{}).kind)).length >= 4 },
  { id:'workers', n:"Workers' compensation",
    d:'More than two on the payroll is no longer a favour between neighbours.',
    setup: 800,  month: 290,
    met: ()=>(S.workers || []).length >= 3 },
  { id:'water',   n:'Water take licence',
    d:'Drawing this much means the catchment wants it metered.',
    setup: 1600, month: 340,
    met: ()=>{ try{ return (stat().waterCap || 0) >= 2400; }catch(e){ return false; } } },
];
function obState(){
  if(!S.oblig) S.oblig = {};
  return S.oblig;
}
function obligationsDue(){
  const held = obState();
  return OBLIGATIONS.filter(o=>held[o.id]);
}
function obligationsMonthly(){
  return obligationsDue().reduce((a, o)=>a + o.month, 0);
}
/* crossing a threshold is an event, not a silent line item */
function checkObligations(){
  const held = obState();
  OBLIGATIONS.forEach(o=>{
    if(held[o.id]) return;
    let hit = false;
    try{ hit = !!o.met(); }catch(e){}
    if(!hit) return;
    held[o.id] = { since: S.day || 1 };
    S.cash = (S.cash || 0) - o.setup;
    if(typeof log === 'function')
      log(`${o.n}: ${o.d} ${fmt(o.setup)} to set up, then ${fmt(o.month)} a month.`, 'bad', 'money');
    if(typeof toast === 'function') toast(o.n, 'bad');
  });
}

/* ---------- fold it into the books ---------- */
if(typeof outgoings === 'function'){
  const _outBase = outgoings;
  outgoings = function(){
    const o = _outBase.apply(this, arguments) || {};
    try{
      const band = rateBand();
      const extraRates = Math.round((o.rates || 0) * (band.mul - 1));
      const comp = obligationsMonthly();
      o.rates = (o.rates || 0) + extraRates;
      if(comp) o.compliance = comp;
      o.rateBand = band.n;
      o.total = (o.total || 0) + extraRates + comp;
    }catch(e){}
    return o;
  };
}
/* the ledger should say what the line is */
if(typeof incomeLines === 'function' && typeof ledgerLines === 'undefined'){
  /* nothing to do — outgoings carries it; this is where a future line would go */
}

/* checked once a day rather than every frame */
let OB_DAY = -1;
if(typeof tickPeople === 'function'){
  const _tickOb = tickPeople;
  tickPeople = function(){
    const r = _tickOb.apply(this, arguments);
    try{
      if(S && S.day !== OB_DAY){ OB_DAY = S.day; checkObligations(); }
    }catch(e){}
    return r;
  };
}

/* ---------- handle ---------- */
G.pressureAudit = function(){
  const goods = {};
  Object.keys(GOODS || {}).forEach(g=>{
    const q = monthlyOutput(g);
    if(q > 0) goods[g] = { perMonth: Math.round(q), priceMul: +saturation(g).toFixed(2),
                           price: sellPrice(g) };
  });
  const band = rateBand();
  const og = outgoings();
  const inc = incomeLines().reduce((a, x)=>a + x.v, 0);
  return {
    saturation: { freeUnder: SAT.free + '/month', halvesAround: SAT.half, floor: SAT.floor },
    goodsInProduction: goods,
    rateBand: band.n + ' (×' + band.mul + ')',
    guestCapacity: +guestCapacity().toFixed(1),
    guestDemand: +guestDemand().toFixed(1),
    occupancy: Math.round(occupancy()*100) + '%',
    nightlyRate: Math.round(nightlyRate()),
    tourismMonthly: Math.round(tourismMonthly()),
    tourismWouldHaveBeen: Math.round(tourismLinearOld()),
    totalUnitsPerMonth: Math.round(totalOutput()),
    retailShare: Math.round(retailBlend()*100) + '% of retail price',
    obligationsHeld: obligationsDue().map(o=>o.n + ' ' + fmt(o.month) + '/mo'),
    complianceMonthly: obligationsMonthly(),
    monthlyIncome: Math.round(inc),
    monthlyOut: Math.round(og.total),
    ratio: +(inc / Math.max(1, og.total)).toFixed(2),
    wasBefore: 'ratio 3.8 at 14 buildings rising to 13.0 at 49; money meaningless by day 151',
  };
};
