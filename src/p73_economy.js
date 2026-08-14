/* =====================================================================
   ECONOMY FIXES, DRIVEN BY THE PLAYED SAVE

   Three findings from a real 199-day save (743 minutes, 51 sessions,
   $619,200 earned, 201 buildings) checked against the game's own price
   and production functions.

   ---------------------------------------------------------------------
   1. THE XP DROUGHT — why a 199-day player is still level 4

   Two lines in the daily tick:

       earn(inc, 0);                                   // tourism
       earn(sellPrice(pick) * (bp.markup||1) * 0.92, 0); // shops

   Both pass 0 as the XP argument. Selling goods pays value/22 and
   contracts pay value/12, but the two passive income paths pay nothing.

   The save has 14 trade buildings and 1 grow building, so almost all of
   its income arrives through the two paths that award no XP. Had that
   $619,200 come through the barn it would be about 28,000 XP, which is
   level 13. The player is on level 4 - roughly 3% of the progression
   their earnings imply - and level gates the build menu, so the content
   they have paid for is locked behind income they cannot convert.

   Fixed by wrapping earn() rather than editing the tick: a passive
   dollar is worth less XP than one you carried to the barn yourself,
   which keeps hands-on play the better route without leaving a tourism
   farm stuck forever.

   ---------------------------------------------------------------------
   2. PIG AND TURKEY WERE NET-NEGATIVE, AND WRONG

   pig_pen produced `milk` and turkey_run produced `duckegg` - a pig
   giving milk and a turkey laying duck eggs. Both were priced for the
   animal they were borrowed from, and with feed at $4/unit both pens
   ran at a loss forever:

       pig pen    gross $40.00/day - feed $41.60 = -$2.70/day
       turkey run gross $21.00/day - feed $26.40 = -$6.40/day

   Land left empty beat either of them. They get their own goods, priced
   so both land between sheep and alpaca rather than at the top.

   ---------------------------------------------------------------------
   3. THREE QUARTERS OF THE SAVE'S CHARM DOES NOTHING

   charmMul() is 1 + min(2.2, charm/90), so it stops rewarding at 198.
   The save has 157 land items, which is roughly 830 charm - about four
   times the cap. Every hedge, tree and lamp past the cap is bought,
   placed, paid for in rates, and worth exactly nothing.

   That is the save's dominant activity: 157 of 201 buildings. The cap is
   raised and softened so decorating keeps paying, with diminishing
   returns rather than a wall.
   ===================================================================== */

/* ---------- 1. XP from passive income ---------- */

/* Rates chosen against the barn's value/22. Guests and shoppers are
   worth less per dollar than produce you handled yourself, so the ratio
   holds the incentive in place instead of inverting it. */
const XP_PER_DOLLAR_PASSIVE = 1/34;

if(typeof earn === 'function'){
  const _earnBase = earn;
  earn = function(v, xp){
    /* Only top up when the caller passed no XP at all. Sales, contracts
       and guest trips already carry their own and must not be doubled. */
    if((xp === 0 || xp === undefined) && v > 0){
      xp = Math.round(v * XP_PER_DOLLAR_PASSIVE);
    }
    return _earnBase.call(this, v, xp);
  };
}

/* ---------- 2. pig and turkey get their own goods ---------- */

if(typeof GOODS === 'object'){
  /* Priced so each pen clears its feed bill with a margin close to the
     sheep paddock, not close to the dairy. Working from the pen data:
       pig    4 head x 2 per / 2 day cycle  = 4 units/day, feed $41.60
       turkey 6 head x 1 per / 2 day cycle  = 3 units/day, feed $26.40 */
  if(!GOODS.pork)    GOODS.pork    = { n:'Pork',    c:'#e0a3a6', p:28 };
  if(!GOODS.poultry) GOODS.poultry = { n:'Poultry', c:'#c9a882', p:22 };
}

if(typeof BPMAP === 'object'){
  if(BPMAP.pig_pen && BPMAP.pig_pen.good === 'milk'){
    BPMAP.pig_pen.good = 'pork';
    BPMAP.pig_pen.desc = 'Four pigs on deep litter. They eat well and pay for it.';
  }
  if(BPMAP.turkey_run && BPMAP.turkey_run.good === 'duckegg'){
    BPMAP.turkey_run.good = 'poultry';
    /* 1.1 feed a head was the highest in the game for the smallest
       return; at 0.85 the run clears its costs without being free. */
    BPMAP.turkey_run.feed = 0.85;
    BPMAP.turkey_run.desc = 'Six turkeys with room to strut. Slow growers, good money.';
  }
}

/* ---------- 3. charm keeps paying past 198 ---------- */

/* Was: 1 + min(2.2, c/90) - a hard stop at 198 charm.
   Now: the first 198 behave exactly as before, so nothing already built
   loses value, and beyond that a square-root tail keeps decorating worth
   doing without letting it run away. At 830 charm - what the save
   actually has - this pays about 4.0x instead of 3.2x. */
if(typeof charmMul === 'function'){
  charmMul = function(){
    const c = stat().charm;
    const base = Math.min(2.2, c/90);
    const over = c > 198 ? Math.sqrt((c - 198)/90) * 0.42 : 0;
    return 1 + base + Math.min(1.6, over);
  };
}

/* ---------- handle ---------- */
G.econAudit = function(){
  const price = g => (GOODS[g] ? sellPrice(g) : 0);
  const pen = id => {
    const b = BPMAP[id]; if(!b) return id + ' missing';
    const head = b.cap||1;
    const gross = head*b.per*price(b.good)/b.cycle;
    const feed  = (b.feed||0)*head*4;
    const up    = ((b.cost||0)*0.012+26)/30;
    return `${b.name}: ${b.good} @$${price(b.good)} — gross $${gross.toFixed(1)}/d, feed $${feed.toFixed(1)}, upkeep $${up.toFixed(1)} → net $${(gross-feed-up).toFixed(1)}/d`;
  };
  const c = stat().charm;
  return {
    pig: pen('pig_pen'),
    turkey: pen('turkey_run'),
    sheepForComparison: pen('sheep'),
    charm: { current:c, multiplier:+charmMul().toFixed(2),
             oldMultiplier:+(1+Math.min(2.2,c/90)).toFixed(2) },
    xp: { passiveRate:'$1 = '+XP_PER_DOLLAR_PASSIVE.toFixed(4)+' XP',
          barnRate:'$1 = '+(1/22).toFixed(4)+' XP',
          note:'passive income now levels you up; it awarded nothing before' },
  };
};
