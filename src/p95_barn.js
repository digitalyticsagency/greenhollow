/* =====================================================================
   THE BARN READ AS A SPREADSHEET, BECAUSE IT WAS ONE

   Every line in the market panel showed exactly 10 - trail rides, wool,
   milk, duck eggs, poultry, all 10. That is not production; it is
   p9_systems.js:359, where the logistics automation sells everything
   above S.autoCfg.reserve each day and reserve is a single flat number
   applied to every good in the game. Eggs at $2.25 and trail rides at
   $6.50 were held back in identical quantity, so the barn converged on a
   flat wall of tens no matter what the farm actually produced.

   Three things are wrong and they are connected.

   1. THE RESERVE IS NOT DERIVED FROM ANYTHING. A number a player can
      change is fine; a number that ignores what the good is, is not.

   2. IT IS TOO SMALL TO DO ITS JOB. The reserve exists so stock is on
      hand when an order arrives. Contracts are generated at
      p5_engine.js:541 as round((craft?3:9) * 0.7..1.6), so a bulk order
      runs to 14 units and a craft order to 5. Holding 10 back means the
      largest orders in the game can never be filled from the barn - you
      sold the stock that order needed, yesterday, automatically.

   3. NOTHING EVER SPOILS. There is no shelf life anywhere in the game,
      so milk keeps for two hundred days and an unbooked trail ride is
      still sitting in the barn a season later. That is what makes the
      panel read as a ledger rather than a larder.

   WHAT REPLACES IT

   Shelf life per good, taken from what the thing actually is. Honey and
   wool do not spoil, because they do not. Garlic keeps four months,
   potatoes ten weeks, apples six. Milk keeps three days. A trail ride is
   a booking, not a jar, so it lapses in two.

   Spoilage only bites above a larder allowance, so ordinary trading
   never loses anything - you have somewhere cool to put a week's eggs.
   It bites on hoards. That is the point: the fix for a flat wall of tens
   is not a different flat number, it is a reason for the numbers to move.

   The root cellar finally does what its name says. It has been in the
   game since level 3 described as "cool storage" while doing nothing but
   adding 12% to sale prices. It now doubles the larder and doubles the
   shelf life of everything a cellar genuinely keeps - roots, apples,
   pumpkins, cheese - and does nothing at all for milk, because a cellar
   does not keep milk.

   Conservative in the same way p76_storage is: it never takes the last
   of anything, it never touches stock inside the larder allowance, and
   an existing save loses its hoard slowly rather than overnight.
   ===================================================================== */

/* days a good keeps; 0 means it does not spoil at all */
const KEEPS = {
  /* services and fresh dairy */
  trailride:2, milk:3, cream:3,
  /* meat */
  pork:4, poultry:4,
  /* soft and leafy, days rather than weeks */
  strawberry:4, lettuce:5, herbs:5, berries:5, radish:6, flowers:6, veg_box:4,
  /* fruiting veg */
  cucumber:9, tomato:9, chilli:12,
  /* eggs keep far longer than people expect */
  egg:21, duckegg:21,
  /* the keepers */
  apple:40, carrot:45, pumpkin:60, potato:70, garlic:120,
  /* preserved and non-food: these are why you preserve things */
  cheese:150, jam:0, honeyjar:0, soap:0, honey:0, wool:0,
};

/* what a root cellar is actually any use for */
const CELLARED = ['apple','carrot','pumpkin','potato','garlic','cheese','veg_box'];

function hasCellar(){ return (S.objs || []).some(o=>o.bp === 'cellar'); }

function keepsOf(k){
  let d = KEEPS[k];
  if(d === undefined) d = GOODS[k] && GOODS[k].craft ? 0 : 30;  /* sane default */
  if(d && hasCellar() && CELLARED.includes(k)) d *= 2;
  return d;
}

/* how much you can keep properly before anything starts going over */
function larderOf(k){
  const life = keepsOf(k);
  if(life === 0) return Infinity;                 /* nothing to protect */
  const base = hasCellar() ? 16 : 8;
  /* a booking is not a thing you put on a shelf */
  if(k === 'trailride') return 2;
  if(life <= 4) return Math.round(base * 0.6);
  /* Working stock gets stored properly. Without this the reserve sits
     just above the larder and bleeds a unit a day, so eggs settled at 13
     against a reserve of 14 and the largest orders stayed a unit short -
     the exact problem this part exists to fix. Anything above the reserve
     is a hoard and still goes over. */
  return Math.max(base, goodReserve(k));
}

/* ---------- the reserve, per good, from the economy's own numbers ----------
   The largest order the contract generator can produce for this class of
   good, so the reserve can actually do the job it exists for. Scaled by
   whatever the player set, with the old default of 10 meaning "normal",
   so anyone who deliberately raised or lowered it keeps their intent. */
function goodReserve(k){
  const g = GOODS[k];
  if(!g) return 10;
  const maxOrder = g.craft ? 5 : 14;
  const life = keepsOf(k);
  let want = maxOrder;
  /* no sense holding back what you are going to lose anyway */
  if(life && life <= 2)      want = 0;
  else if(life && life <= 4) want = Math.min(maxOrder, 6);
  else if(life && life <= 9) want = Math.min(maxOrder, 10);
  return Math.max(0, Math.round(want * reserveScale()));
}

/* The player's own setting is the scale, with the old default of 10
   meaning "normal". It is read from a saved slot rather than live, because
   the live value gets held at Infinity while p9's pass runs - see below. */
function reserveScale(){
  const v = (S.autoCfg && S.autoCfg.userReserve !== undefined)
    ? S.autoCfg.userReserve
    : ((S.autoCfg && S.autoCfg.reserve) || 10);
  return (v || 10) / 10;
}

/* ---------- spoilage ---------- */
function spoilDay(){
  const lost = {};
  Object.keys(S.store || {}).forEach(k=>{
    const qty = S.store[k];
    if(!(qty > 0)) return;
    const life = keepsOf(k);
    if(!life) return;                       /* honey, wool, jam: keeps forever */
    const larder = larderOf(k);
    const over = qty - larder;
    if(over <= 0) return;                   /* properly stored, nothing lost */
    /* the excess turns over at its own rate; never takes the last of it */
    let n = Math.max(1, Math.round(over / life));
    n = Math.min(n, qty - 1, over);
    if(n <= 0) return;
    S.store[k] = qty - n;
    lost[k] = n;
  });

  const keys = Object.keys(lost);
  if(keys.length && typeof log === 'function'){
    const worst = keys.sort((a,b)=>lost[b]*sellPrice(b) - lost[a]*sellPrice(a))[0];
    const value = keys.reduce((a,k)=>a + lost[k]*sellPrice(k), 0);
    log(keys.length === 1
      ? `${lost[worst]} × ${GOODS[worst].n} went over before you sold it (${fmt(value)}).`
      : `${GOODS[worst].n} and ${keys.length-1} other line${keys.length>2?'s':''} went over in the barn (${fmt(value)}).`,
      'bad', 'money');
  }
  return lost;
}

/* ---------- sell surplus at per-good limits, before p9's flat pass ---------- */
/* The market tooltip has always told the player to "hold stock when it is
   low, sell into a spike", and the automation was the one participant in
   the economy ignoring its own advice - it dumped everything above 10
   daily at whatever the price happened to be. Holding through a dip is
   what a person would do, and it is also what stops the barn being a flat
   wall: quantities now move with the market instead of resting on one
   number. It only holds what will not spoil while it waits. */
/* Bounded deliberately. The first version held anything non-perishable
   for as long as the price was down, and a thirty-day run put wool at 60
   and still climbing - "hold through a dip" had become "hold forever",
   which is a worse failure than the flat 10 it replaced. A dip lasting a
   month is not a dip. So the wait ends on whichever comes first: the
   price recovering, ten days of waiting, or a pile three times the size
   of the reserve. */
const HOLD_DAYS = 10, HOLD_STACK = 3;

function holdingForPrice(k){
  const tr = (S.prices && S.prices[k]) || 1;
  if(tr >= 0.96) return false;                       /* not a dip */
  const life = keepsOf(k);
  if(life && (S.store[k] || 0) > larderOf(k)) return false;  /* it would spoil waiting */
  const waited = (S.barnHold && S.barnHold[k]) || 0;
  if(waited >= HOLD_DAYS) return false;              /* waited long enough */
  const keep = goodReserve(k);
  if(keep && (S.store[k] || 0) > keep * HOLD_STACK) return false;  /* pile is silly */
  return true;
}

/* how long each line has been waiting for a better price */
function holdTick(){
  if(!S.barnHold) S.barnHold = {};
  Object.keys(S.store || {}).forEach(k=>{
    if(holdingForPrice(k)) S.barnHold[k] = (S.barnHold[k] || 0) + 1;
    else delete S.barnHold[k];
  });
  Object.keys(S.barnHold).forEach(k=>{ if(!(S.store[k] > 0)) delete S.barnHold[k]; });
}

function barnSurplusDay(){
  if(typeof autoOn !== 'function' || !autoOn('logistics')) return 0;
  let sold = 0, made = 0;
  Object.keys(S.store || {}).forEach(k=>{
    if(holdingForPrice(k)) return;
    const keep = goodReserve(k);
    const over = (S.store[k] || 0) - keep;
    if(over <= 0) return;
    const v = over * sellPrice(k);
    S.store[k] = keep;
    if(S.store[k] <= 0) delete S.store[k];
    S.cash += v; S.totalEarned += v; made += v; sold += over;
  });
  return made;
}

/* p9's flat sell-off runs INSIDE advanceDay, so simply running afterwards
   would be too late: it would already have sold everything down to 10 and
   a per-good reserve of 14 cannot put stock back. Its limit is held at
   Infinity for the duration of the base call, which makes its loop a
   no-op while leaving its contract-filling untouched, and the real pass
   runs after. The player's number is preserved separately as the scale.

   Then spoilage, in that order - spoiling first would destroy stock the
   automation was about to turn into cash. */
if(typeof advanceDay === 'function'){
  const _advBarn = advanceDay;
  advanceDay = function(){
    if(!S.autoCfg) S.autoCfg = {};
    if(S.autoCfg.userReserve === undefined)
      S.autoCfg.userReserve = S.autoCfg.reserve === undefined ? 10 : S.autoCfg.reserve;
    const held = S.autoCfg.reserve;
    S.autoCfg.reserve = Infinity;
    let r;
    try{ r = _advBarn.apply(this, arguments); }
    finally{ S.autoCfg.reserve = held; }
    try{ holdTick(); barnSurplusDay(); spoilDay(); }catch(e){}
    return r;
  };
}

/* ---------- say so in the panel, or none of it is legible ----------
   Injected inside the existing name cell rather than beside it: .mrow is
   a grid, so an extra sibling would add a column and shift every row. */
if(typeof marketHTML === 'function'){
  const _marketBarn = marketHTML;
  marketHTML = function(){
    let h = _marketBarn.apply(this, arguments);
    try{
      Object.keys(S.store || {}).forEach(k=>{
        const g = GOODS[k]; if(!g) return;
        const life = keepsOf(k);
        const larder = larderOf(k);
        const over = (S.store[k] || 0) - larder;
        /* Kept to a few characters: the name cell is a fixed grid column
           and words like "going over" pushed longer names into an
           ellipsis. The number is the shelf life and the colour says
           whether it is a problem, which is the same information. */
        const st = `font-style:normal;font-size:9px;margin-left:4px`;
        let badge = '';
        if(over <= 0 && holdingForPrice(k)){
          badge = `<i style="${st};color:#8fb0d0" title="Price is below normal — held back rather than sold into a dip.">hold</i>`;
        } else if(!life){
          badge = '';                                   /* keeps forever: say nothing */
        } else if(over > 0){
          badge = `<i style="${st};color:#e08a8a" title="Keeps about ${life} days. Your larder holds ${larder}; the ${over} above that is going over — sell it.">${life}d</i>`;
        } else {
          badge = `<i style="${st};opacity:.4" title="Keeps about ${life} days. Stored properly — nothing is being lost.">${life}d</i>`;
        }
        if(!badge) return;
        const cell = `<span class="nm">${g.n}</span>`;
        if(h.indexOf(cell) >= 0)
          h = h.replace(cell, `<span class="nm">${g.n}${badge}</span>`);
      });
    }catch(e){}
    return h;
  };
}

/* ---------- handle ---------- */
G.barnAudit = function(){
  const keys = Object.keys(S.store || {}).filter(k=>S.store[k] > 0);
  return {
    cellar: hasCellar() ? 'built — doubles larder and cellar-keeping shelf life' : 'not built',
    reserveScale: ((S.autoCfg && S.autoCfg.reserve) || 10) / 10,
    lines: keys.map(k=>{
      const life = keepsOf(k), larder = larderOf(k);
      return `${GOODS[k].n}: ${S.store[k]} · keeps ${life ? life+'d' : 'indefinitely'}`
        + ` · larder ${larder === Infinity ? 'n/a' : larder}`
        + ` · AI holds ${goodReserve(k)}`
        + ((life && S.store[k] > larder) ? ' — GOING OVER' : '');
    }),
    biggestOrders: 'bulk contracts run to 14 units, craft to 5 — reserves now cover them',
    wasBefore: 'a flat 10 of everything, which is why every line read 10',
  };
};
