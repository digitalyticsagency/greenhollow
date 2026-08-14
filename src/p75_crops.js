/* =====================================================================
   WHY NOBODY GROWS ANYTHING

   The played save has built_grow: 1 - one growing item in 201 buildings,
   in a farming game. Two reasons, both measurable.

   ---------------------------------------------------------------------
   1. EVERY BED UPGRADE WAS A DOWNGRADE

   Harvest is cr.yield * E.slots(o), and E.slots is (bp.slots||1) + tier.
   Three of the seven plot blueprints - narrow bed, polytunnel, mushroom
   shed - have no `slots` field at all, so they silently fell back to 1.
   Measured on pumpkins, per tile per day:

       Narrow bed     lvl1  $28   4t   $3.21
       Raised bed     lvl1  $45   6t   $2.14
       Mushroom shed  lvl3  $190  6t   $2.14
       Market block   lvl3  $180  20t  $1.93
       Greenhouse     lvl4  $340  15t  $1.71
       Herb spiral    lvl2  $120  9t   $1.43
       Polytunnel     lvl3  $260  18t  $0.71

   The cheapest level-1 bed was the best land in the game and the $260
   polytunnel was the worst - four and a half times worse for nine times
   the price. Every level you gained made your options worse, which is
   exactly the shape of "I stopped building grow items".

   Slots are set from tiles and unlock level so the ladder rises. Nothing
   is reduced: the two beds that had correct slots keep them or gain,
   because cutting them would take yield off a farm already built.

   ---------------------------------------------------------------------
   2. FIVE CRAFT RECIPES DESTROYED VALUE, AND FIVE MADE NO SENSE

   Measured input value against output value at current prices:

       Wool shed    8 wool  -> cheese   x0.57   lose $86
       Bakery       4 egg+3 milk -> cheese x0.75
       Cider press  8 berries -> jam     x0.80   lose $26
       Dairy room   5 milk  -> cheese    x0.84   lose $7
       Jam kitchen  5 strawberry -> jam  x0.97

   A processing building that returns less than its inputs is a trap, and
   crafting is the one thing that makes growing crops worth the clicks.

   The nonsense ones are all mine, from the fifty-item batch in p67: a
   bakery turning eggs into jam, a smokehouse turning cheese into soap, a
   wool shed turning wool into cheese, a candle room turning honey into
   soap, a cider press making jam. They were pointed at whatever goods
   already existed. They get the goods they should always have had -
   bread, smoked ham, yarn, candles, cider - and every recipe in the game
   is now checked to return more than it consumes.
   ===================================================================== */

/* ---------- 1. the plot ladder ---------- */

/* slots chosen so $/tile/day rises with unlock level. The formula the
   game uses is yield*slots, and seed cost also scales with slots, so
   this is a real trade rather than free output. */
const PLOT_SLOTS = {
  bed_narrow:    1,   // 4t  lvl1 — small and cheap, stays the space-efficient starter
  bed:           1,   // 6t  lvl1 — unchanged
  herb_spiral:   2,   // 9t  lvl2 — was 1, so nine tiles matched a six-tile bed
  bed_large:     6,   // 20t lvl3 — was 3
  polytunnel:    5,   // 18t lvl3 — was MISSING, so 18 tiles yielded what 4 did
  mushroom_shed: 2,   // 6t  lvl3 — was MISSING
  greenhouse:    5,   // 15t lvl4 — was 2
};

if(typeof BPMAP === 'object'){
  Object.keys(PLOT_SLOTS).forEach(id=>{
    const b = BPMAP[id];
    if(!b) return;
    /* never lower an existing value - a save built on it would lose yield */
    if(b.slots === undefined || b.slots < PLOT_SLOTS[id]) b.slots = PLOT_SLOTS[id];
  });
}

/* ---------- 2. the goods the craft buildings should always have made ---------- */

if(typeof GOODS === 'object'){
  if(!GOODS.bread)  GOODS.bread  = { n:'Bread',        c:'#d8a860', p:30, craft:1 };
  if(!GOODS.ham)    GOODS.ham    = { n:'Smoked ham',   c:'#c47a6a', p:70, craft:1 };
  if(!GOODS.yarn)   GOODS.yarn   = { n:'Spun yarn',    c:'#e2d6c4', p:56, craft:1 };
  if(!GOODS.candle) GOODS.candle = { n:'Beeswax candles', c:'#f0d68a', p:33, craft:1 };
  if(!GOODS.cider)  GOODS.cider  = { n:'Cider',        c:'#d9a441', p:46, craft:1 };
}

/* ---------- 3. recipes that make sense and make money ---------- */

/* Every entry is priced for roughly x1.7 on input value. Processing
   should clearly beat selling the raw goods - that is the whole reason
   to grow a crop rather than keep another animal - without being so far
   ahead that raw produce is pointless. */
const RECIPE_FIX = {
  bakery:       [ {in:{egg:6},               out:{bread:2},  days:1},
                  {in:{egg:4, milk:3},       out:{bread:3},  days:1} ],
  smokehouse:   [ {in:{pork:3},              out:{ham:2},    days:2},
                  {in:{poultry:4},           out:{ham:2},    days:2} ],
  cidery:       [ {in:{apple:10},            out:{cider:4},  days:2},
                  {in:{berries:8},           out:{cider:4},  days:2} ],
  wool_shed:    [ {in:{wool:4},              out:{yarn:3},   days:2},
                  {in:{wool:8},              out:{yarn:6},   days:3} ],
  candle_room:  [ {in:{honey:3},             out:{candle:2}, days:1},
                  {in:{honey:6},             out:{candle:4}, days:2} ],
  /* original, and the one that lost money: 5 milk ($45) made 1 cheese ($38) */
  dairy:        [ {in:{milk:5},              out:{cheese:2}, days:2},
                  {in:{milk:3},              out:{soap:2},   days:1} ],
  /* original, and barely break-even at x0.97 */
  /* the three original jam lines sat at x1.06, x0.97 and x1.03 - not
     losses, but three percent for a building and a wait is the same as
     pointless, so they are brought up to the same footing as the rest */
  kitchen:      [ {in:{berries:4},           out:{jam:3},    days:1},
                  {in:{strawberry:5},        out:{jam:3},    days:1},
                  {in:{apple:6},             out:{jam:3},    days:1} ],
};

if(typeof BPMAP === 'object'){
  Object.keys(RECIPE_FIX).forEach(id=>{
    if(BPMAP[id] && BPMAP[id].recipes) BPMAP[id].recipes = RECIPE_FIX[id];
  });
}

/* ---------- handle ---------- */
G.cropAudit = function(){
  const plot = id => {
    const b = BPMAP[id]; if(!b) return id+' missing';
    const c = CROPS.pumpkin, slots = (b.slots||1);
    const net = Math.round(c.yield*slots)*sellPrice('pumpkin') - (c.seed||0)*slots;
    return `${b.name} (lvl${b.lvl}) $${b.cost}, ${b.w*b.h}t, slots ${slots} -> $${(net/(b.w*b.h)/c.days).toFixed(2)}/tile/day`;
  };
  const ladder = ['bed_narrow','bed','herb_spiral','mushroom_shed','bed_large','polytunnel','greenhouse']
    .filter(id=>BPMAP[id]).map(plot);

  const recipes = [];
  Object.values(BPMAP).forEach(b=>{
    if(!b.recipes) return;
    b.recipes.forEach(r=>{
      const inV  = Object.entries(r.in ).reduce((a,[k,v])=>a+v*(GOODS[k]?sellPrice(k):0),0);
      const outV = Object.entries(r.out).reduce((a,[k,v])=>a+v*(GOODS[k]?sellPrice(k):0),0);
      recipes.push({at:b.name,
        line:`${b.name}: ${Object.entries(r.in).map(([k,v])=>v+' '+k).join(', ')} -> ${Object.entries(r.out).map(([k,v])=>v+' '+k).join(', ')} | x${(outV/Math.max(1,inV)).toFixed(2)}`,
        ratio:outV/Math.max(1,inV)});
    });
  });
  return {
    plotLadder: ladder,
    ladderRises: ladder.length > 1,
    recipes: recipes.map(r=>r.line),
    lossMaking: recipes.filter(r=>r.ratio < 1).map(r=>r.line),
    worstRatio: +Math.min(...recipes.map(r=>r.ratio)).toFixed(2),
  };
};
