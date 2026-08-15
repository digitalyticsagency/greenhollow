/* =====================================================================
   THE FAMILY EATS WHAT YOU GREW

   The household already made dinner every evening - there is an act for
   it and a line in the log - but nothing was ever eaten. The barn filled
   up, the family said they were cooking, and the two facts never met.

   Now dinner comes out of the barn. One portion a head, drawn from
   whatever is edible, and the more different things there are the better
   it goes down. A varied dinner off your own land lifts the household;
   a plain one is fine; nothing at all means driving out for it, which
   costs money and puts everyone in a worse mood.

   Deliberately cheap to feed. A family of four eats four items a night
   against a farm that produces dozens, so this is a reason to grow a
   range rather than a drain to manage. Wool, soap and candles are not
   dinner, and the list of what is says so explicitly rather than
   guessing from price.
   ===================================================================== */

/* what is not food, stated rather than inferred */
const NOT_FOOD = ['wool','yarn','soap','candle','flowers','ride'];
function isFood(gid){
  return !!GOODS[gid] && NOT_FOOD.indexOf(gid) < 0;
}

function household(){
  return 1 + ((S.family || []).length);      /* you, plus the family */
}

/* Pick a dinner: one item a head, spread over as many different foods as
   possible, cheapest first so the good stuff stays sellable. */
function pickDinner(){
  const want = household();
  const foods = Object.keys(S.store || {})
    .filter(k => (S.store[k] || 0) > 0 && isFood(k))
    .sort((a,b) => sellPrice(a) - sellPrice(b));
  const taken = {};
  let n = 0;
  /* one of each first - that is what makes it a meal rather than a pile */
  for(const k of foods){ if(n >= want) break; taken[k] = 1; n++; }
  /* then top up from the cheapest if the family is bigger than the variety */
  let i = 0;
  while(n < want && foods.length){
    const k = foods[i % foods.length];
    if((S.store[k] || 0) > (taken[k] || 0)){ taken[k] = (taken[k] || 0) + 1; n++; }
    else if(++i > foods.length * 3) break;
  }
  return { taken, n, variety:Object.keys(taken).length, want };
}

function eatDinner(){
  const want = household();
  const d = pickDinner();

  /* nothing in the barn: they buy dinner in */
  if(d.n === 0){
    const bill = 14 * want;
    S.cash = Math.max(0, S.cash - bill);
    S.morale = clamp((S.morale === undefined ? 0.6 : S.morale) - 0.04, 0, 1);
    S.lastMeal = { n:0, variety:0, bill, text:'nothing on the farm — dinner came from the shop' };
    log(`Nothing to eat off the place. Dinner cost ${fmt(bill)}.`, 'bad', 'home');
    return S.lastMeal;
  }

  Object.keys(d.taken).forEach(k=>{
    S.store[k] -= d.taken[k];
    if(S.store[k] <= 0) delete S.store[k];
  });

  /* variety is what makes it good, and feeding everyone is the floor */
  const fed = d.n >= want;
  const lift = !fed ? -0.01
             : d.variety >= 4 ? 0.055
             : d.variety >= 3 ? 0.035
             : d.variety >= 2 ? 0.02
             : 0.008;
  S.morale = clamp((S.morale === undefined ? 0.6 : S.morale) + lift, 0, 1);

  const names = Object.keys(d.taken).map(k=>GOODS[k].n.toLowerCase());
  const list = names.length === 1 ? names[0]
    : names.slice(0,-1).join(', ') + ' and ' + names[names.length-1];
  const text = !fed ? `${list} — not quite enough to go round`
    : d.variety >= 4 ? `${list} — a proper spread`
    : d.variety >= 3 ? `${list}`
    : `${list} again`;

  S.lastMeal = { n:d.n, variety:d.variety, text, lift:+lift.toFixed(3) };
  log(`Dinner: ${text}.`, d.variety >= 4 ? 'good' : '', 'home');
  return S.lastMeal;
}

/* once a day, after everything else has produced */
if(typeof advanceDay === 'function'){
  const _advMeal = advanceDay;
  advanceDay = function(){
    const r = _advMeal.apply(this, arguments);
    try{ eatDinner(); }catch(e){}
    return r;
  };
}

/* ---------- show it, in the panel that already shows the household ---------- */
(function mealRow(){
  if(typeof ui !== 'function') return;
  const paint = ()=>{
    if(!S.lastMeal) return;
    const labels = [...(document.getElementById('rightBody')||document).querySelectorAll('*')].filter(el =>
      el.children.length === 0 && /^(Morale|Household)$/.test(el.textContent.trim()));
    labels.forEach(lbl=>{
      const row = lbl.parentElement;
      if(!row || row.dataset.mealAdded) return;
      row.dataset.mealAdded = '1';
      const div = document.createElement('div');
      div.className = 'muted';
      div.style.cssText = 'font-size:12px;margin:4px 0 0';
      div.textContent = `Last night: ${S.lastMeal.text}`;
      row.parentNode.insertBefore(div, row.nextSibling);
    });
  };
  const _uiMeal = ui;
  ui = function(){ const r = _uiMeal.apply(this, arguments); try{ paint(); }catch(e){} return r; };
})();

/* ---------- handle ---------- */
G.mealAudit = function(){
  const d = pickDinner();
  return {
    household: household(),
    edibleInBarn: Object.keys(S.store||{}).filter(isFood).length,
    tonightWouldEat: Object.keys(d.taken).map(k=>`${d.taken[k]} ${k}`),
    variety: d.variety,
    lastNight: S.lastMeal || 'nothing recorded yet',
    morale: +(S.morale === undefined ? 0.6 : S.morale).toFixed(3),
    notFood: NOT_FOOD,
  };
};
