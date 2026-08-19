/* =====================================================================
   WHAT THIS BUILDING ACTUALLY DOES FOR YOU

   Measuring the farm blueprint by blueprint turned up something worth
   saying out loud: nothing is inert. Every one of the 124 blueprints
   moves at least one of stat()'s nineteen channels, or crafts, or pays
   rent. The complaint that buildings "do not contribute to the economy"
   was not wrong about the feeling, it was wrong about the cause — they
   contribute through nineteen numbers, and the panel showed you almost
   none of them.

   So this asks the only question that cannot be fudged: what changes if
   this building is not there? The object is lifted out of S.objs, the
   whole world is recomputed, it is put back, and the two are diffed.
   Whatever moved is what it does. Nothing is declared from a blueprint
   field, so a building cannot claim a contribution it does not make, and
   a contribution that arrives through some other module's wrapper still
   shows up.

   It is also honest about the bill. Upkeep is 1.2% of what the thing cost
   every month and rates go up with every structure and every tier, so
   each building has a standing cost whether or not it earns. Both sides
   are shown and the net is stated plainly, including when the answer is
   that this thing costs you money and is worth it for the charm.

   Two guards. The panel only recomputes when the selection changes,
   because a double stat() pass every frame for a number that has not
   moved is waste. And the object is restored in a finally, so a throw
   inside anyone's stat wrapper cannot leave a building deleted from the
   farm.
   ===================================================================== */

/* the nineteen channels, in words rather than field names */
const CONTRIB_LABELS = {
  power:      { n:'Power',            u:' kW',  good:1 },
  use:        { n:'Power draw',       u:' kW',  good:-1 },
  charm:      { n:'Charm',            u:'',     good:1 },
  feedGain:   { n:'Feed grown',       u:'/day', good:1 },
  waterCap:   { n:'Water storage',    u:' L',   good:1 },
  waterGain:  { n:'Water collected',  u:' L/day', good:1 },
  tour:       { n:'Visitor draw',     u:'',     good:1 },
  fert:       { n:'Soil fertility',   u:'',     good:1 },
  seedoff:    { n:'Cheaper seed',     u:'',     good:1 },
  pricebonus: { n:'Better prices',    u:'',     good:1 },
  workbonus:  { n:'Work done faster', u:'',     good:1 },
  craftspeed: { n:'Crafting speed',   u:'',     good:1 },
  tourmul:    { n:'Visitor multiplier', u:'×',  good:1 },
  autowater:  { n:'Automatic watering', u:'',   good:1 },
  pollinate:  { n:'Pollination',      u:'',     good:1 },
  shelter:    { n:'Shelter',          u:'',     good:1 },
  ducks:      { n:'Pest control',     u:'',     good:1 },
  buffer:     { n:'Power buffer',     u:'',     good:1 },
};

function worldSnapshot(){
  const out = {};
  try{
    const st = stat();
    Object.keys(st).forEach(k=>{
      if(typeof st[k] === 'number') out['st_' + k] = st[k];
    });
  }catch(e){}
  try{ out.income = incomeLines().reduce((a, x)=>a + (x.v || 0), 0); }catch(e){}
  try{ const og = outgoings(); out.rates = og.rates || 0; out.upkeep = og.upkeep || 0; }catch(e){}
  return out;
}

/* what changes if this is not here */
const CONTRIB_CACHE = { id:null, data:null };
function contributionOf(o){
  if(!o) return null;
  if(CONTRIB_CACHE.id === o.id && CONTRIB_CACHE.data) return CONTRIB_CACHE.data;
  const objs = S.objs || [];
  const i = objs.indexOf(o);
  if(i < 0) return null;
  const withIt = worldSnapshot();
  let without;
  try{
    objs.splice(i, 1);
    without = worldSnapshot();
  } finally {
    /* back in the same slot whatever happened, so a throw in anybody's
       stat wrapper cannot quietly delete a building off the farm */
    objs.splice(i, 0, o);
  }
  const gains = [], costs = [];
  Object.keys(withIt).forEach(k=>{
    const d = (withIt[k] || 0) - (without[k] || 0);
    if(Math.abs(d) < 0.0005) return;
    if(k === 'rates' || k === 'upkeep'){ costs.push({ k, n:k === 'rates' ? 'Council rates' : 'Upkeep', v:d, money:1 }); return; }
    if(k === 'income'){ gains.push({ k, n:'Earns', v:d, money:1 }); return; }
    const key = k.replace(/^st_/, '');
    const L = CONTRIB_LABELS[key];
    if(!L) return;
    const helpful = (L.good > 0) ? d > 0 : d < 0;
    (helpful ? gains : costs).push({ k:key, n:L.n, v:d, u:L.u });
  });
  /* A working building's output is not in incomeLines at all — the ledger
     projects livestock, orchards, rent and shops, but not what a recipe
     turns out. So a dairy in the middle of a batch read "costs you $111 a
     month and gives nothing back", which is the opposite of true. The
     batch is valued the same way the ledger values livestock: at today's
     prices, if you collect and sell it. */
  try{
    const bp = BPMAP[o.bp];
    if(bp && bp.kind === 'process' && o.recipe >= 0 && bp.recipes && bp.recipes[o.recipe]){
      const rc = bp.recipes[o.recipe];
      let worth = 0;
      Object.keys(rc.out || {}).forEach(k=>{ worth += rc.out[k] * (typeof sellPrice === 'function' ? sellPrice(k) : 0); });
      const perMonth = worth * (30 / Math.max(1, rc.days || 1));
      if(perMonth > 0) gains.push({ k:'craft', n:'Crafts worth', v:perMonth, money:1 });
    }
  }catch(e){}

  const monthlyCost = costs.filter(c=>c.money).reduce((a, c)=>a + c.v, 0);
  const monthlyGain = gains.filter(c=>c.money).reduce((a, c)=>a + c.v, 0);
  const data = { gains, costs, monthlyCost, monthlyGain, net: monthlyGain - monthlyCost };
  CONTRIB_CACHE.id = o.id; CONTRIB_CACHE.data = data;
  return data;
}

function contribNum(v, u){
  const s = (v > 0 ? '+' : '') + (Math.abs(v) < 10 ? (+v.toFixed(2)) : Math.round(v));
  return s + (u || '');
}

function contributionHTML(o){
  const d = contributionOf(o);
  if(!d) return '';
  const bp = BPMAP[o.bp] || {};
  let h = `<div class="contrib"><h4>What this does for you</h4>`;

  if(d.gains.length){
    h += `<div class="rows">`;
    d.gains.forEach(g=>{
      h += `<div class="row"><span>${g.n}</span><b class="cgood">${
        g.money ? fmt(Math.round(g.v)) + '/mo' : contribNum(g.v, g.u)}</b></div>`;
    });
    h += `</div>`;
  } else {
    h += `<p class="sub">Nothing measurable while it sits idle${
      bp.kind === 'plot' ? ' — plant it and it will' : ''}.</p>`;
  }

  const nonMoneyCosts = d.costs.filter(c=>!c.money);
  if(nonMoneyCosts.length){
    h += `<div class="rows">`;
    nonMoneyCosts.forEach(c=>{
      h += `<div class="row"><span>${c.n}</span><b class="cbad">${contribNum(c.v, c.u)}</b></div>`;
    });
    h += `</div>`;
  }

  h += `<div class="rows"><div class="row"><span>Costs you</span>
    <b class="cbad">${fmt(Math.round(d.monthlyCost))}/mo</b></div>`;
  if(d.monthlyGain > 0)
    h += `<div class="row"><span>Brings in</span><b class="cgood">${fmt(Math.round(d.monthlyGain))}/mo</b></div>`;
  h += `<div class="row"><span><b>Net</b></span><b class="${d.net >= 0 ? 'cgood' : 'cbad'}">${
    fmt(Math.round(d.net))}/mo</b></div></div>`;

  /* the honest sentence at the bottom */
  const nice = d.gains.filter(g=>!g.money).map(g=>g.n.toLowerCase());
  if(d.gains.some(g=>g.k === 'craft'))
    h += `<p class="sub">At today's prices, if you collect the batches and sell them.</p>`;
  h += `<p class="sub">${
    d.net >= 0 ? 'It pays for itself.'
    : nice.length ? `It costs you ${fmt(Math.round(-d.net))} a month. You keep it for the ${
        nice.slice(0, 3).join(', ')}.`
    : `It costs you ${fmt(Math.round(-d.net))} a month and gives nothing back yet.`}</p>`;

  /* whether anybody is in it, from p144 */
  if(['process', 'shop', 'tourism'].includes(bp.kind)){
    h += `<div class="rows"><div class="row"><span>Staffed</span><b class="${o.staffed ? 'cgood' : 'cbad'}">${
      o.staffed ? 'yes — a third faster' : 'nobody in it'}</b></div></div>`;
  }
  return h + `</div>`;
}

/* ---------- a ledger bug this measurement turned up ----------
   incomeLines() works out what visitors and holdings bring in like this:

     if(bp.kind === 'tourism' || bp.kind === 'shop'){
       const rate = E.rate(o) ...; passive += rate * 30 * 12; }

   and E.rate reads BPMAP[o.bp].rate. Shops have a `rate`. Tourism
   buildings do not — they have `income`, which is what the inspect panel
   has always shown you as "Base $30/day". So every tourism building
   contributed exactly nothing to the projected monthly income while the
   panel beside it promised thirty a day, and the glamping tent looked
   like a pure cost.

   The tourism side is added here, at the same rate the panel quotes:
   income x charm x the visitor multiplier, thirty days. Shops are left
   alone — theirs already works. */
if(typeof incomeLines === 'function'){
  const _incomeTourism = incomeLines;
  incomeLines = function(){
    const out = _incomeTourism.apply(this, arguments) || [];
    try{
      const st = stat();
      const mul = ((typeof charmMul === 'function') ? charmMul() : 1) * (st.tourmul || 1);
      let tourism = 0;
      (S.objs || []).forEach(o=>{
        const bp = BPMAP[o.bp];
        if(bp && bp.kind === 'tourism' && bp.income) tourism += bp.income * mul * 30;
      });
      if(tourism > 0){
        const line = out.find(l=>/visitors and holdings/i.test(l.n || ''));
        if(line) line.v = Math.round(line.v + tourism);
        else out.push({ n:'Visitors and holdings', v:Math.round(tourism),
          d:'Beds, tents and anything else guests pay you to use.' });
      }
    }catch(e){}
    return out;
  };
}

/* ---------- into the panel ---------- */
if(typeof inspHTML === 'function'){
  const _inspContrib = inspHTML;
  inspHTML = function(){
    let h = _inspContrib.apply(this, arguments);
    try{
      const o = (S.objs || []).find(z=>z.id === sel);
      if(o) h += contributionHTML(o);
    }catch(e){}
    return h;
  };
}
/* the measurement is only redone when you select something else */
if(typeof render === 'function'){
  const _renderContrib = render;
  render = function(){
    try{ if(CONTRIB_CACHE.id && CONTRIB_CACHE.id !== sel){ CONTRIB_CACHE.id = null; CONTRIB_CACHE.data = null; } }catch(e){}
    return _renderContrib.apply(this, arguments);
  };
}

(function contribCss(){
  const s = document.createElement('style');
  s.textContent = `
  .contrib{ margin-top:12px; padding-top:10px; border-top:1px solid var(--line2,#33402c) }
  .contrib h4{ margin:0 0 7px; font-size:12px; letter-spacing:.04em; text-transform:uppercase;
    opacity:.75; font-weight:600 }
  .contrib .rows{ margin-bottom:7px }
  .contrib .cgood{ color:#7cc24f }
  .contrib .cbad{ color:#e2a05c }
  `;
  document.head.appendChild(s);
})();

/* ---------- handle ---------- */
G.contributionAudit = function(){
  const sample = (S.objs || []).slice(0, 6).map(o=>{
    const d = contributionOf(o);
    return {
      what: (BPMAP[o.bp] || {}).name,
      gains: d ? d.gains.map(g=>g.n + ' ' + contribNum(g.v, g.u)) : [],
      costsMonthly: d ? Math.round(d.monthlyCost) : null,
      net: d ? Math.round(d.net) : null,
    };
  });
  return {
    channelsNamed: Object.keys(CONTRIB_LABELS).length,
    measuredBy: 'removing the object and recomputing the whole world',
    objectsOnFarm: (S.objs || []).length,
    cacheHeldFor: CONTRIB_CACHE.id || 'nothing selected',
    sample,
  };
};
