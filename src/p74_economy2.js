/* =====================================================================
   ECONOMY, SECOND PASS

   Continuing from p73, and correcting two of my own recommendations now
   that the played save has supplied the numbers.

   WHAT I GOT WRONG FIRST TIME

   I proposed raising building upkeep from 1.2% to 4-5% of capital. On a
   201-building save the monthly ledger is:

       rates    $9,698   (120 + built*26 + tierLevels*34)
       household  $860
       upkeep     ~$340   (1.2% of capital)

   Upkeep is three percent of the bill. Quadrupling it moves the total by
   about a thousand dollars against an income near $93,000 a month. It
   was the wrong lever and I had recommended it before I had the building
   count.

   The deeper miss: outgoings are not the problem. $10,900 a month
   against $93,300 is not a game that needs a tax - it is a game with
   $442,951 in the bank and nothing to spend it on. That is a content
   gap, not a balance one, and inventing a punishment for it would make
   a cosy game worse. Flagged rather than papered over.

   WHAT THIS FILE DOES CHANGE

   1. Leisure earns. All seventeen rec items returned exactly $0 from
      visitors - guestSpendFor() fell through to a bare "return 0"
      fallback marked "look, do not pay". Seventeen items,
      $3,115, and 176 tiles of footprint - the whole farm - that guests
      walked to and paid nothing for. They now charge by charm.

   2. Livestock costs something to keep. There was no per-head cost at
      all: a four-cow dairy and a forty-cow dairy cost the same to run.
      Husbandry is now charged per animal, so a big herd is a commitment
      rather than free money.

   3. Wool is worth keeping sheep for. At level 4 the dairy pasture
      returned $4.63 per tile per day and the sheep paddock $1.40 - the
      same unlock level, three and a half times the return, so sheep and
      alpacas were strictly a worse use of the same land. Wool is lifted
      rather than dairy cut, because cutting dairy would take money off a
      save that has already built its farm around it.
   ===================================================================== */

/* ---------- 1. leisure charges its visitors ---------- */

/* Priced off charm because charm is already the game's own measure of
   "worth crossing a field for", so a hot tub earns more than a sandpit
   without a second table to keep in sync. */
if(typeof guestSpendFor === 'function'){
  const _spendBase = guestSpendFor;
  guestSpendFor = function(bp){
    const base = _spendBase.apply(this, arguments);
    if(base > 0) return base;
    if(!bp) return 0;
    if(typeof GUEST_LODGING !== 'undefined' && GUEST_LODGING.indexOf(bp.art) >= 0) return 0;
    if(bp.kind === 'rec') return Math.max(3, Math.round((bp.charm || 6) * 0.55));
    return base;
  };
}

/* ---------- 2. husbandry, per head ---------- */

const HUSBANDRY_PER_HEAD = 0.85;          // dollars per animal per day

function husbandryCost(){
  return Math.round((S.objs || []).reduce((a, o) => {
    const bp = BPMAP[o.bp];
    if(!bp || bp.kind !== 'animal') return a;
    return a + (o.animals || 0) * HUSBANDRY_PER_HEAD * 30;
  }, 0));
}

/* outgoings() is what the ledger panel reads and what the monthly charge
   is taken from, so the line has to be added there rather than deducted
   somewhere of its own, or the player would be charged for something the
   panel never showed them. */
if(typeof outgoings === 'function'){
  const _outBase = outgoings;
  outgoings = function(){
    const o = _outBase.apply(this, arguments);
    const h = husbandryCost();
    o.husbandry = h;
    o.total = (o.total || 0) + h;
    return o;
  };
}

/* the ledger panel lists a fixed set of rows, so the new one needs a home */
(function addHusbandryRow(){
  if(typeof ui !== 'function') return;
  const paint = () => {
    document.querySelectorAll('.ledger-row, .tl').forEach(()=>{});
    /* find the Upkeep row the panel already draws and put husbandry after it */
    const rows = [...document.querySelectorAll('*')].filter(el =>
      el.children.length === 0 && el.textContent.trim() === 'Upkeep');
    rows.forEach(lbl => {
      const row = lbl.parentElement;
      if(!row || row.dataset.husb) return;
      row.dataset.husb = '1';
      const h = husbandryCost();
      if(!h) return;
      const clone = row.cloneNode(true);
      clone.dataset.husb = '1';
      const kids = clone.children;
      if(kids[0]) kids[0].textContent = 'Livestock';
      if(kids[1]) kids[1].textContent = (typeof fmt === 'function' ? fmt(h) : '$' + h);
      clone.setAttribute('data-tip', 'Feed rounds, bedding and vet visits — charged per animal.');
      row.parentNode.insertBefore(clone, row.nextSibling);
    });
  };
  const _uiBase = ui;
  ui = function(){ const r = _uiBase.apply(this, arguments); try{ paint(); }catch(e){} return r; };
})();

/* ---------- 3. wool is worth the paddock ---------- */

/* Sheep and alpacas both sell wool, so one price fixes both. At $25 the
   sheep paddock returns about $2.55 per tile per day and the alpaca
   about $1.85, against the dairy's $4.63 - still clearly behind, which
   is right for a lower-effort animal, but no longer pointless. */
if(typeof GOODS === 'object' && GOODS.wool && GOODS.wool.p < 25){
  GOODS.wool.p = 25;
}

/* ---------- handle ---------- */
G.econAudit2 = function(){
  const perTile = id => {
    const b = BPMAP[id]; if(!b) return id + ' missing';
    const head = b.cap || 1;
    const gross = head * b.per * sellPrice(b.good) / b.cycle;
    const feed  = (b.feed || 0) * head * 4;
    const husb  = head * HUSBANDRY_PER_HEAD;
    const up    = ((b.cost || 0) * 0.012 + 26) / 30;
    const tiles = b.w * b.h + (b.feed || 0) * head / 0.75;
    return `${b.name} (lvl${b.lvl}): net $${(gross-feed-husb-up).toFixed(1)}/d over ${tiles.toFixed(0)}t = $${((gross-feed-husb-up)/tiles).toFixed(2)}/tile/d`;
  };
  const rec = Object.values(BPMAP).filter(b => b.kind === 'rec');
  return {
    animalsAtLevel4: ['cow_pasture','sheep','alpaca','pig_pen'].map(perTile),
    earlyAnimals: ['coop','duck_pond','goat_pen'].map(perTile),
    leisureNowEarns: rec.slice(0, 6).map(b =>
      `${b.name}: $${guestSpendFor(b)}/visit (charm ${b.charm||0})`),
    leisureEarningCount: rec.filter(b => guestSpendFor(b) > 0).length + '/' + rec.length,
    husbandry: { perHeadPerDay: HUSBANDRY_PER_HEAD, monthlyOnThisFarm: husbandryCost() },
    ledger: typeof outgoings === 'function' ? outgoings() : 'n/a',
  };
};

/* =====================================================================
   THE MARKET NUMBERS THAT STOPPED MOVING

   Two figures were frozen by hard caps, so doing more produced exactly
   the same result - which reads as the game being broken rather than as
   a design choice.

   JUDGING STRENGTH used Math.min(q, 20): twenty veg boxes and a thousand
   veg boxes both scored 460. A player with a full barn sees the number
   stop and has no way to tell that bringing more is pointless. Quantity
   now keeps counting with a square-root tail, so a big barn is worth
   more than a small one without being worth fifty times more. The first
   twenty units score exactly as before, so nothing already entered is
   devalued.

   THE RELIEF FUND used Math.min(30, amt/40): $1,200 and $442,951 both
   bought 30 points of standing. On a save holding $442,951 that is the
   difference between a gesture and a fortune, priced identically. It is
   now a log curve - real generosity keeps counting, with the diminishing
   returns you would expect from goodwill - and the fixed $50/$200/$1,000
   buttons are joined by a box for any amount, since the old top button
   could not even reach the old cap.
   ===================================================================== */

if(typeof judgingEntries === 'function'){
  const _judgeBase = judgingEntries;
  judgingEntries = function(){
    const out = _judgeBase.apply(this, arguments);
    out.forEach(e => {
      const g = GOODS[e.gid]; if(!g) return;
      /* rebuild the quantity term: the original was min(q,20), so keep
         that below 20 and add a tail above it rather than rescaling
         everything and moving scores the player already knows. */
      const q = e.q || 0;
      if(q > 20){
        const extra = Math.sqrt(q - 20) * 2.6;
        e.score = Math.round(e.score * (1 + extra / 20));
      }
    });
    return out.sort((a,b) => b.score - a.score).slice(0, 8);
  };
}

if(typeof G === 'object' && typeof G.giveRelief === 'function'){
  const _reliefBase = G.giveRelief;
  G.giveRelief = function(amt){
    amt = Math.max(0, Math.min(S.cash, amt|0));
    if(amt <= 0) return toast('Nothing to give','bad');
    /* Points the base function will add, so they can be corrected after. */
    const oldPts = Math.min(30, Math.round(amt/40));
    /* 18, not 14: at 14 the $1,000 button dropped from 25 points to 19,
       which nerfs the one amount players actually use. At 18 the curve
       meets the old value there and beats it everywhere else, so no
       donation is worth less than it was before. */
    const newPts = Math.max(1, Math.round(18 * Math.log10(1 + amt/45)));
    const r = _reliefBase.call(this, amt);
    if(S.market) S.market.score += (newPts - oldPts);
    return r;
  };
}

/* a box for any amount, because the largest button could not reach the cap */
if(typeof G === 'object'){
  G.giveReliefCustom = function(){
    const el = document.getElementById('mkgive-amt');
    const v = el ? parseInt(el.value, 10) : 0;
    if(!v || v <= 0) return toast('Enter an amount','bad');
    G.giveRelief(v);
  };
  if(typeof G.openMarket === 'function'){
    const _openBase = G.openMarket;
    G.openMarket = function(){
      const r = _openBase.apply(this, arguments);
      try{
        const give = document.querySelector('.mkgive');
        if(give && !give.dataset.custom){
          give.dataset.custom = '1';
          const wrap = document.createElement('span');
          wrap.style.cssText = 'display:inline-flex;gap:6px;align-items:center;margin-left:6px';
          wrap.innerHTML = `<input id="mkgive-amt" type="number" min="1" step="50" placeholder="Any amount"
              style="width:110px;padding:7px 9px;border-radius:8px;border:1px solid var(--line);
                     background:rgba(0,0,0,.25);color:var(--ink);font:inherit"/>
            <button class="btn ghost" onclick="G.giveReliefCustom()">Give</button>`;
          give.appendChild(wrap);
        }
      }catch(e){}
      return r;
    };
  }
}

G.marketAudit = function(){
  const j = typeof judgingEntries === 'function' ? judgingEntries() : [];
  const relief = a => Math.max(1, Math.round(18 * Math.log10(1 + a/45)));
  return {
    judgingNow: j.slice(0,5).map(e=>`${e.n}: ${e.q} in barn -> strength ${e.score}`),
    reliefCurve: [50,200,1000,10000,100000,442951].map(a=>`$${a} -> ${relief(a)} pts (was ${Math.min(30,Math.round(a/40))})`),
  };
};
