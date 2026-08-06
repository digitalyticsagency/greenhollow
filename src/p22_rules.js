/* =====================================================================
   LAND RULES — grounded in real published guidance rather than invented
   numbers. Every figure below carries its source, shown in the Rules tab.
   Simplified for a game; not planning or legal advice.
   ===================================================================== */

/* One tile is a tenth of a hectare, so a 21x14 starter block is ~29 ha —
   about the size of a small working farm. */
const HA_PER_TILE = 0.1;
function farmHa(){ return +(FARM.w * FARM.h * HA_PER_TILE).toFixed(1); }
function farmAcres(){ return +(farmHa() * 2.4711).toFixed(1); }

/* ---------------------------------------------------------------
   Dry Sheep Equivalent — the standard Australian unit for comparing
   the feed demand of different stock.
   1 DSE = the feed a 2-year-old ~50 kg Merino wether needs to hold
   weight (7.60 MJ/day).
   Sources: MLA, Wikipedia (see SOURCES below).
   --------------------------------------------------------------- */
const DSE = {
  chicken:0.05,   // poultry are negligible against grazing stock
  duck:0.05,
  rabbit:0.06,
  sheep:1.0,      // the reference animal
  goat:1.0,       // a 50 kg dry goat ~ 1 DSE (MLA goat factsheet)
  hive:0,         // bees do not graze
  pig:2.5,
  horse:8,
  cow:8,          // a yearling steer ~ 8 DSE; a lactating cow up to 25
};
function dseOf(animal){ return DSE[animal] !== undefined ? DSE[animal] : 1; }
function farmDSE(){
  return +S.objs.reduce((a,o)=>{
    const bp = BPMAP[o.bp];
    return a + (bp.animal ? dseOf(bp.animal) * (o.animals||0) : 0);
  }, 0).toFixed(1);
}

/* Carrying capacity in DSE per hectare, by biome.
   Published NSW figures: 1.8–4.7 DSE/ha on natural pasture in the
   Northern Tablelands; 3–6 DSE/ha typical across the Hunter, and about
   8 DSE/ha on beef country under professional pasture management.
   The biome values below sit inside that published range. */
const DSE_PER_HA = {
  valley:6.0, orchard:5.5, river:6.0, lake:5.0, pond:5.0, forest:3.5,
  hill:4.0, coast:4.5, plateau:3.0, moor:2.0, mount:1.8, oasis:1.5,
};
function carryingCapacity(){
  const l = LANDMAP[S.landId];
  const base = (l && DSE_PER_HA[l.biome]) || 4;
  const c = country();
  /* pasture improvement from compost and fodder lifts what the land carries */
  const improved = 1
    + (S.objs.some(o=>o.bp==='compost') ? 0.25 : 0)
    + Math.min(0.4, S.objs.filter(o=>o.bp==='fodder').length * 0.2);
  return Math.round(farmHa() * base * improved * (c.pasture||1));
}
function stockPressure(){
  const cap = carryingCapacity();
  return cap > 0 ? farmDSE()/cap : 0;
}

/* ---------------------------------------------------------------
   Harvestable rights — in NSW's coastal and central inland-draining
   catchments a landholder may capture 10% of the average annual
   rainfall run-off from their land without a water access licence.
   --------------------------------------------------------------- */
const HARVEST_PCT = 0.10;
/* The game's litres are an abstraction — a tank holds 220 of them and
   watering a bed costs 8. So the right is expressed in those same units,
   sized so that three or four tanks is roughly your entitlement. The real
   figure depends on your catchment; the Rules tab links to the calculator
   rather than inventing a number. */
function harvestableRight(){
  const l = LANDMAP[S.landId] || {};
  return Math.round(farmHa() * 25 * (1 + (l.rain||0)) * (country().water||1));
}
function licensedStorage(){
  return S.objs.filter(o=>BPMAP[o.bp].kind==='water')
               .reduce((a,o)=>a + E.wcap(o), 0);
}

/* ---------------------------------------------------------------
   Minimum lot size — what the land you can buy is allowed to be.
   NSW LEPs commonly set 10 ha for RU1 Primary Production and around
   2 ha for RU2 / RU4; NZ district plans often set ~40 ha on good
   soils with limited smaller lots allowed.
   --------------------------------------------------------------- */
const COUNTRY_RULES = {
  au:{minLotHa:2,  primaryProdHa:10, pasture:1.0,  water:1.0,  unit:'ha',
      body:'Local Environmental Plan (council)',
      note:'NSW LEPs commonly set 10 ha minimum for RU1 Primary Production and about 2 ha for RU2 Rural Landscape and RU4 Primary Production Small Lots. Harvestable rights let you capture 10% of run-off without a licence.'},
  nz:{minLotHa:40, primaryProdHa:40, pasture:1.15, water:1.2,  unit:'ha',
      body:'District Plan (council)',
      note:'Rural subdivision on good soils is often held to about 40 ha, though many councils allow one or two smaller lots down to around 0.5 ha.'},
  uk:{minLotHa:2,  primaryProdHa:5,  pasture:1.1,  water:1.05, unit:'acres',
      body:'Local Planning Authority',
      note:'No single national minimum; agricultural permitted development rights generally attach to holdings of 5 hectares or more.'},
  ie:{minLotHa:2,  primaryProdHa:5,  pasture:1.1,  water:1.1,  unit:'acres',
      body:'County Development Plan',
      note:'Rural housing and subdivision are controlled by county development plans rather than a national minimum.'},
  ca:{minLotHa:16, primaryProdHa:32, pasture:0.8,  water:1.0,  unit:'acres',
      body:'Provincial / municipal zoning',
      note:'Agricultural zoning is provincial. Quarter-section thinking is common, and reserves such as the BC Agricultural Land Reserve restrict subdivision.'},
  us:{minLotHa:16, primaryProdHa:40, pasture:0.9,  water:0.95, unit:'acres',
      body:'County zoning',
      note:'County zoning governs. Many counties set agricultural minimums around 40 acres; water rights vary hugely by state.'},
  za:{minLotHa:10, primaryProdHa:21, pasture:0.7,  water:0.75, unit:'ha',
      body:'Subdivision of Agricultural Land Act',
      note:'Subdivision of agricultural land requires ministerial consent. Water is the binding constraint over much of the country.'},
};
function rules(){ return COUNTRY_RULES[SET('country')] || COUNTRY_RULES.au; }

/* fold the real figures into country() so the rest of the game uses them */
(function mergeRules(){
  Object.keys(COUNTRY_RULES).forEach(k=>{
    if(COUNTRIES[k]) Object.assign(COUNTRIES[k], COUNTRY_RULES[k]);
  });
})();

/* ---------------------------------------------------------------
   Stocking is now judged in DSE against carrying capacity, not a
   flat head count.
   --------------------------------------------------------------- */
stockLimit = function(){ return carryingCapacity(); };
if(typeof G.buyAnimal === 'function'){
  const _buy22 = G.buyAnimal;
  G.buyAnimal = function(id){
    const o = S.objs.find(z=>z.id===id); if(!o) return;
    const bp = BPMAP[o.bp];
    const addl = dseOf(bp.animal);
    if(farmDSE() + addl > carryingCapacity()){
      toast(`Over carrying capacity — ${farmDSE()} of ${carryingCapacity()} DSE`,'bad');
      sfx('error');
      log(`The land carries ${carryingCapacity()} DSE. Buy more land, or add compost and fodder to improve the pasture.`,'bad');
      return;
    }
    _buy22.call(G, id);
  };
}
/* overstocking degrades the pasture and the animals */
if(typeof advanceDay === 'function'){
  const _adv22 = advanceDay;
  advanceDay = function(){
    _adv22();
    const p = stockPressure();
    if(p > 1){
      S.objs.forEach(o=>{
        if(BPMAP[o.bp].kind!=='animal' || !o.herd) return;
        o.herd.forEach(a=>{ a.health = clamp(a.health - (p-1)*0.12, 0, 1); });
      });
      if(Math.random() < 0.3)
        log(`Overstocked at ${farmDSE()} DSE against ${carryingCapacity()} — condition is slipping.`,'bad');
    }
  };
}

/* ---------------------------------------------------------------
   The Rules tab — the numbers, what they mean here, and the sources
   --------------------------------------------------------------- */
const SOURCES = [
  {t:'Harvestable rights — NSW Department of Climate Change, Energy, the Environment and Water',
   u:'https://www.water.dcceew.nsw.gov.au/our-work/licensing-and-approvals/basic-landholder-rights/harvestable-rights',
   d:'Landholders may capture a share of rainfall run-off in farm dams without a water access licence. Dams cannot sit within 40 m of a third-order or higher stream, or within 3 km upstream of a wetland of international importance.'},
  {t:'Dams and licensing — NSW Government Water',
   u:'https://water.dpie.nsw.gov.au/our-work/licensing-and-approvals/dams',
   d:'When a farm dam needs an approval, and when it does not.'},
  {t:'Basic landholder rights — WaterNSW',
   u:'https://www.waternsw.com.au/customer-services/water-licensing/basic-landholder-rights',
   d:'Stock and domestic rights alongside harvestable rights.'},
  {t:'Stocking rate — Meat & Livestock Australia',
   u:'https://www.mla.com.au/extension-training-and-tools/feedbase-hub/persistent-pastures/grazing-management/stocking-rate/',
   d:'Carrying capacity is the long-term sustainable stocking rate for a given area, expressed in DSE per hectare per year.'},
  {t:'Managing livestock numbers — MLA goat factsheet (PDF)',
   u:'https://www.mla.com.au/globalassets/mla-corporate/extensions-training-and-tools/documents/mla-goats-fs06-livestocknumbers-r3.pdf',
   d:'A 50 kg dry goat is about 1 DSE; a yearling steer about 8 DSE; a lactating cow as much as 25 DSE.'},
  {t:'Beef stocking rates and farm size, Hunter region — NSW DPI (PDF)',
   u:'https://www.dpird.nsw.gov.au/__data/assets/pdf_file/0014/70610/Beef-stocking-rates-and-farm-size---Hunter-region.pdf',
   d:'3–6 DSE/ha typically dominates Hunter grazing land; about 8 DSE/ha with professional pasture management.'},
  {t:'Carrying capacity and DSE — NRM South (PDF)',
   u:'https://nrmsouth.org.au/wp-content/uploads/2015/04/NRM_South_Factsheet_Carrying_Capacity.pdf',
   d:'A practical explanation of carrying capacity for graziers.'},
  {t:'Dry Sheep Equivalent — Wikipedia',
   u:'https://en.wikipedia.org/wiki/Dry_Sheep_Equivalent',
   d:'1 DSE is the feed a two-year-old ~50 kg Merino wether needs to maintain weight, about 7.60 MJ/day.'},
  {t:'Minimum lot size for subdivision in NSW',
   u:'https://www.yourplanna.com.au/articles/minimum-lot-size-requirements-for-subdividing-land-in-nsw',
   d:'Rural minimum lot sizes are set by each council Local Environmental Plan; RU1 Primary Production is commonly 10 ha, RU2 and RU4 around 2 ha.'},
  {t:'Harvestable rights calculator — NSW Government Water',
   u:'https://water.dpie.nsw.gov.au/our-work/licensing-and-approvals/basic-landholder-rights/harvestable-rights',
   d:'Work out the actual maximum harvestable right dam capacity for a real property.'},
  {t:'NSW Planning Portal Spatial Viewer',
   u:'https://www.planningportal.nsw.gov.au/spatialviewer/',
   d:'Look up the zoning and minimum lot size that applies to a real address.'},
  {t:'Minimum land size for subdivision in New Zealand',
   u:'https://www.surveyingservices.co.nz/blog/post/151305/minimum-land-size-for-subdivision-in-new-zealand-what-you-need-to-know/',
   d:'Rural blocks on quality soils are often held to about 40 ha, with limited smaller lots allowed.'},
];

function rulesHTML(){
  const r = rules(), c = country();
  const ha = farmHa(), ac = farmAcres();
  const cap = carryingCapacity(), used = farmDSE(), p = stockPressure();
  const hr = harvestableRight(), st = licensedStorage();
  const areaTxt = r.unit==='acres' ? `${ac} acres (${ha} ha)` : `${ha} ha (${ac} acres)`;

  let h = `<div class="card">
    <div class="eyebrow">Your holding · ${c.n}</div>
    <b class="big">${areaTxt}</b>
    <div class="muted">${FARM.w}×${FARM.h} tiles, at a tenth of a hectare each.</div>
    <div class="ledrow" style="margin-top:7px"><span>Minimum lot, primary production</span><b>${r.primaryProdHa} ha</b></div>
    <div class="ledrow"><span>Minimum rural lot</span><b>${r.minLotHa} ha</b></div>
    <div class="ledrow"><span>Set by</span><b>${r.body}</b></div>
    ${ha < r.minLotHa ? `<div class="warnbox">At ${ha} ha this holding is below the ${r.minLotHa} ha minimum — in the real world it could not be created as a separate lot.</div>`:''}
  </div>

  <div class="card">
    <div class="eyebrow">Carrying capacity</div>
    <b class="big ${p>1?'bad':''}">${used} of ${cap} DSE</b>
    <div class="bar"><i style="transform:scaleX(${Math.min(1,p).toFixed(3)});
      background:${p>1?'#ff6b5a':p>0.85?'#ffb03a':'linear-gradient(90deg,#4d8f3c,#7cc24f)'}"></i></div>
    <div class="muted" style="margin-top:5px">
      One DSE is the feed a 50 kg dry Merino wether needs to hold weight. A goat is about 1 DSE,
      a steer about 8. This land runs about ${(cap/Math.max(0.1,ha)).toFixed(1)} DSE per hectare —
      published NSW figures range from under 2 on poor country to about 8 under good pasture management.</div>
    ${p>1?`<div class="warnbox">Overstocked. Condition drops daily until you destock, buy more land,
      or improve the pasture with compost and fodder.</div>`:''}
    <div class="ledrow" style="margin-top:7px"><span>Pasture improvement</span>
      <b>${S.objs.some(o=>o.bp==='compost')?'compost ':''}${S.objs.filter(o=>o.bp==='fodder').length?'fodder':''}${!S.objs.some(o=>o.bp==='compost')&&!S.objs.some(o=>o.bp==='fodder')?'none':''}</b></div>
  </div>

  <div class="card">
    <div class="eyebrow">Water — harvestable right</div>
    <b class="big">${hr.toLocaleString()} storage units</b>
    <div class="muted">Modelled on the NSW harvestable right: ten per cent of average annual run-off
    from ${ha} ha, which in coastal and central inland-draining catchments you may capture without a
    water access licence. Shown in the game's own units — a tank holds 220 — because the real volume
    depends on your catchment and rainfall. Use the NSW calculator linked below for an actual figure.</div>
    <div class="ledrow" style="margin-top:7px"><span>Storage you have built</span><b>${st.toLocaleString()} L</b></div>
    <div class="ledrow"><span>Share of your right</span><b>${hr?Math.round(st/hr*100):0}%</b></div>
    ${st > hr ? `<div class="warnbox">Your storage now exceeds the harvestable right. On a real holding
      that needs a water access licence and a works approval.</div>`:''}
  </div>

  <div class="card">
    <div class="eyebrow">How this country plays</div>
    <div class="muted">${r.note}</div>
  </div>

  <div class="ph">Sources</div>
  <div style="padding:2px 10px 12px">
  ${SOURCES.map(s=>`<a class="srcrow" href="${s.u}" target="_blank" rel="noopener noreferrer">
      <b>${s.t}</b><span class="muted">${s.d}</span>
      <span class="srcurl">${s.u.split('://')[1].slice(0,52)}${s.u.length>60?'…':''}</span></a>`).join('')}
  </div>
  <div class="card" style="border-color:rgba(255,176,58,.4)">
    <div class="muted">These figures are simplified to make a game work. Rural planning, water
    licensing and stocking rules vary by council, catchment and season — check the sources above,
    or your own council, before applying any of it to real land.</div>
  </div>`;
  return h;
}

/* ---------------------------------------------------------------
   Wire in the tab
   --------------------------------------------------------------- */
(function wire22(){
  const css = document.createElement('style');
  css.textContent = `
  .srcrow{display:block;padding:8px 10px;margin-bottom:6px;border-radius:11px;
    background:var(--g1);border:.5px solid var(--hair);text-decoration:none;color:var(--txt);
    transition:background .18s var(--ease),transform .18s var(--ease);}
  .srcrow:hover{background:var(--g2);transform:translateY(-1px);}
  .srcrow b{display:block;font-size:11.5px;margin-bottom:2px;}
  .srcurl{display:block;font-size:9.5px;color:var(--acc2);margin-top:3px;word-break:break-all;}`;
  document.head.appendChild(css);

  const tabs = document.querySelector('.ptabs');
  if(tabs && !tabs.querySelector('[data-rt="rules"]')){
    const b = document.createElement('button');
    b.className='ptab'; b.dataset.rt='rules'; b.textContent='Rules';
    b.dataset.tip='<b>Land rules</b>Your holding size, carrying capacity in DSE and water rights — with the real sources they are based on.';
    b.addEventListener('click', ()=>{ rightTab='rules'; syncTabs(); renderRight(); sfx('click'); });
    tabs.appendChild(b);
  }
  const _rr22 = renderRight;
  renderRight = function(){
    if(rightTab==='rules'){ document.getElementById('rightBody').innerHTML = rulesHTML(); return; }
    _rr22();
  };

  /* the coach should mention it when you are over capacity */
  if(typeof coachTips === 'function'){
    const _tips = coachTips;
    coachTips = function(){
      const t = _tips();
      const p = stockPressure();
      if(p > 1) t.unshift({p:1, t:`Overstocked — ${farmDSE()} DSE on land that carries ${carryingCapacity()}`,
        w:'Animal condition drops every day you stay over. Destock, buy adjoining land, or add compost and a fodder patch to lift what the pasture carries.'});
      const st = licensedStorage(), hr = harvestableRight();
      if(st > hr && hr > 0) t.push({p:3, t:'Storage is past your harvestable right',
        w:'On real land in NSW, storing more than 10% of run-off needs a water access licence and a works approval. See the Rules tab.'});
      return t.slice(0,5);
    };
  }
})();
