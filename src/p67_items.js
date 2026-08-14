/* =====================================================================
   FIFTY NEW THINGS TO BUILD — five per category

   Nothing existing is touched. Every entry matches the schema its
   category already uses, which is one shared shape (id, name, art, cat,
   w, h, cost, lvl, kind, desc, tip) plus whatever fields that `kind`
   requires: perennials need good/qty/cycle, animals need
   animal/cap/buy/good/per/cycle/feed, process needs recipes, water needs
   cap, power needs power, shop needs rate, tourism needs income.

   Leisure is the exception and is handled the way the game already does
   it - as rows appended to REC, which p17_more expands into blueprints
   with synthesised art, desc and tip. Adding BP entries directly for
   leisure would have produced items that look right in the shop and
   render blank on the ground.

   Prices and footprints are pulled from each category's existing spread
   rather than invented. Where a new item sits outside that range it is
   deliberate and noted - the honesty box below the farm stand, the dam
   above the pond - because the gap being filled is "there is nothing
   cheaper/bigger than this yet".

   Art: composed from the same primitives everything else uses -
   building, annex, patch, canopy, water, panels, apron, fence - so the
   light still comes from the upper left and nothing looks pasted in.
   ===================================================================== */

/* small shared shapes, so fifty items do not become fifty bespoke
   drawings that drift out of style */
function it_slab(w,h,fill,r){ return `<rect x="1" y="1" width="${n(w-2)}" height="${n(h-2)}" rx="${r||3}" fill="${fill}"/>`; }
function it_shadow(w,h){ return `<rect x="2.5" y="3" width="${n(w-2)}" height="${n(h-2)}" rx="3" fill="#16240c" opacity=".22"/>`; }
function it_lid(w,h,fill){ return `<rect x="1" y="1" width="${n(w-2)}" height="${n((h-2)*0.42)}" rx="3" fill="${fill}" opacity=".55"/>`; }
function it_posts(w,h,c){
  let s=''; for(let x=3;x<w-2;x+=Math.max(8,(w-6)/4)){
    s+=`<rect x="${n(x)}" y="${n(h*0.30)}" width="2.2" height="${n(h*0.5)}" rx="1.1" fill="${c||'#7d5931'}"/>`; }
  return s;
}
function it_roofBox(w,h,roof){
  return it_shadow(w,h) + (typeof building==='function'
    ? building(w,h,{roof:roof||'url(#gRoof)'})
    : it_slab(w,h,'#6f7ba8'));
}

/* ---------------------------------------------------------------
   1. GROW   existing 45-340, lvl 1-4, kinds plot/perennial/bonus
   --------------------------------------------------------------- */
const NEW_GROW = [
{id:'bed_narrow', name:'Narrow bed', art:'bed_narrow', cat:'grow', w:2,h:2, cost:28, lvl:1, kind:'plot',
  desc:'A single short bed. Cheapest way to get a crop in the ground.',
  tip:'Fits the gaps nothing else will. Same crop choice as any bed.'},
{id:'polytunnel', name:'Polytunnel', art:'polytunnel', cat:'grow', w:6,h:3, cost:260, lvl:3, kind:'plot', power:-1,
  desc:'Hooped plastic over a long bed. Warmer than open ground, cheaper than glass.',
  tip:'The middle step between a raised bed and a greenhouse.'},
{id:'vine_row', name:'Grape vines', art:'vine_row', cat:'grow', w:5,h:2, cost:300, lvl:4, kind:'perennial',
  good:'berries', qty:7, cycle:7, charm:12,
  desc:'Trained vines on wire. Slow to come in, generous once they do.',
  tip:'A third perennial alongside the orchard and the berry patch.'},
{id:'mushroom_shed', name:'Mushroom shed', art:'mushroom_shed', cat:'grow', w:3,h:2, cost:190, lvl:3, kind:'plot', power:-1,
  desc:'Dark, damp and stacked with logs. Crops here ignore the weather entirely.',
  tip:'The only growing space a storm cannot touch.'},
{id:'worm_farm', name:'Worm farm', art:'worm_farm', cat:'grow', w:2,h:2, cost:85, lvl:2, kind:'bonus', fert:0.12, charm:2,
  desc:'Stacked trays of worms turning scraps into castings.',
  tip:'A second fertility source, cheaper and smaller than the compost bays.'},
];

/* ---------------------------------------------------------------
   2. WATER   existing 120-380, lvl 1-5
   --------------------------------------------------------------- */
const NEW_WATER = [
{id:'butt', name:'Water butt', art:'butt', cat:'water', w:1,h:1, cost:45, lvl:1, kind:'water', cap:60,
  desc:'One barrel under a downpipe. Sixty litres is sixty litres.',
  tip:'Below the price of anything else here — buy one on day one.'},
{id:'swale', name:'Swale', art:'swale', cat:'water', w:6,h:1, cost:130, lvl:2, kind:'bonus', charm:4, shelter:0.1,
  desc:'A shallow ditch on the contour that stops rain running off your land.',
  tip:'Passive. Costs nothing to run and quietly keeps the soil damp.'},
{id:'greywater', name:'Greywater filter', art:'greywater', cat:'water', w:2,h:2, cost:240, lvl:3, kind:'water', cap:90, gain:6, power:-1,
  desc:'Reed bed and sand filter. Recycles house water rather than collecting rain.',
  tip:'Refills whatever the weather is doing, which no tank can claim.'},
{id:'dam', name:'Small dam', art:'dam', cat:'water', w:8,h:5, cost:520, lvl:5, kind:'water', cap:700, gain:22, charm:18,
  desc:'An earth dam across the low corner. The largest store on the farm.',
  tip:'Above the pond in every way, and it needs the room to prove it.'},
{id:'drip', name:'Drip lines', art:'drip', cat:'water', w:4,h:1, cost:160, lvl:3, kind:'bonus', autowater:1, power:-1,
  desc:'Perforated line along the beds, on a timer.',
  tip:'Cheaper automatic watering than the irrigation ring, in a thinner footprint.'},
];

/* ---------------------------------------------------------------
   3. POWER   existing 230-340, lvl 2-4, kind power
   --------------------------------------------------------------- */
const NEW_POWER = [
{id:'solar_roof', name:'Roof solar', art:'solar_roof', cat:'power', w:3,h:2, cost:200, lvl:2, kind:'power', power:5,
  desc:'Panels on an existing roof. No ground taken, less output.',
  tip:'The cheapest way onto your own supply.'},
{id:'micro_hydro', name:'Micro-hydro', art:'micro_hydro', cat:'power', w:2,h:2, cost:380, lvl:4, kind:'power', power:7, storm:1,
  desc:'A small turbine in running water. Indifferent to sun and wind.',
  tip:'The only generator that does not care what the sky is doing.'},
{id:'generator', name:'Diesel backup', art:'generator', cat:'power', w:2,h:2, cost:260, lvl:3, kind:'power', power:9,
  desc:'Noisy, thirsty, and it works at three in the morning in a storm.',
  tip:'Insurance rather than infrastructure.'},
{id:'solar_tracker', name:'Tracking array', art:'solar_tracker', cat:'power', w:4,h:4, cost:460, lvl:5, kind:'power', power:18, charm:-2,
  desc:'Panels that follow the sun across the day.',
  tip:'The most power on the farm, and it looks industrial. Plant something in front of it.'},
{id:'inverter', name:'Inverter shed', art:'inverter', cat:'power', w:2,h:2, cost:210, lvl:3, kind:'bonus', buffer:1,
  desc:'Proper conversion and a small buffer, so less of what you make is wasted.',
  tip:'Does nothing on its own. Makes everything else you have generate go further.'},
];

/* ---------------------------------------------------------------
   4. ANIMALS   existing 100-1400, lvl 2-5
   --------------------------------------------------------------- */
const NEW_ANIMAL = [
{id:'quail', name:'Quail hutch', art:'quail', cat:'animal', w:3,h:2, cost:120, lvl:2, kind:'animal',
  animal:'quail', cap:10, buy:14, good:'egg', per:1, cycle:2, feed:0.2, charm:4,
  desc:'Ten quail in a stacked hutch. Tiny birds, tiny feed bill, tiny eggs.',
  tip:'The cheapest laying stock on the farm and the smallest footprint.'},
{id:'pig_pen', name:'Pig pen', art:'pig_pen', cat:'animal', w:5,h:4, cost:620, lvl:4, kind:'animal',
  animal:'pig', cap:4, buy:150, good:'milk', per:2, cycle:2, feed:2.6, charm:6,
  desc:'Deep straw and a wallow. Pigs turn scraps into something worth selling.',
  tip:'Sits between the goats and the dairy herd in both cost and return.'},
{id:'turkey_run', name:'Turkey run', art:'turkey_run', cat:'animal', w:4,h:3, cost:340, lvl:3, kind:'animal',
  animal:'turkey', cap:6, buy:55, good:'duckegg', per:1, cycle:2, feed:1.1, charm:7,
  desc:'Big birds in a tall run. Fewer eggs than hens, worth more each.',
  tip:'A step up from the coop without the space a paddock needs.'},
{id:'alpaca', name:'Alpaca paddock', art:'alpaca', cat:'animal', w:6,h:4, cost:780, lvl:4, kind:'animal',
  animal:'alpaca', cap:4, buy:210, good:'wool', per:4, cycle:5, feed:1.4, charm:24,
  desc:'Four alpacas on good grass. The finest fleece you can grow, and visitors adore them.',
  tip:'The highest charm of any animal, and wool worth more per head than sheep.'},
{id:'hay_barn', name:'Hay barn', art:'hay_barn', cat:'animal', w:4,h:3, cost:280, lvl:3, kind:'feed', feed:9,
  desc:'Cut, dried and stacked under cover. Nine units of feed a day.',
  tip:'Twice what a fodder patch grows, in not much more room.'},
];

/* ---------------------------------------------------------------
   5. CRAFT   existing 300-420, lvl 3-5, kind process
   --------------------------------------------------------------- */
const NEW_CRAFT = [
{id:'bakery', name:'Bakery', art:'bakery', cat:'craft', w:5,h:3, cost:400, lvl:4, kind:'process', power:-3,
  recipes:[{in:{egg:6},out:{jam:2},days:1},{in:{egg:4,milk:3},out:{cheese:1},days:1}],
  desc:'Bread, pastry and custard tarts. Eggs and milk become something people queue for.',
  tip:'The only outlet that takes eggs in quantity.'},
{id:'smokehouse', name:'Smokehouse', art:'smokehouse', cat:'craft', w:4,h:3, cost:360, lvl:4, kind:'process',
  recipes:[{in:{cheese:2},out:{soap:3},days:2},{in:{apple:8},out:{jam:3},days:2}],
  desc:'Cold smoke over applewood. Slow, and it doubles what goes in.',
  tip:'No power at all — it runs on the wood you already have.'},
{id:'cidery', name:'Cider press', art:'cidery', cat:'craft', w:4,h:3, cost:380, lvl:4, kind:'process', power:-2,
  recipes:[{in:{apple:10},out:{jam:4},days:2},{in:{berries:8},out:{jam:3},days:2}],
  desc:'Press, barrels and a cool room. The best thing to do with a heavy orchard.',
  tip:'Takes fruit in bulk, which the jam kitchen cannot.'},
{id:'wool_shed', name:'Wool shed', art:'wool_shed', cat:'craft', w:5,h:3, cost:340, lvl:3, kind:'process', power:-2,
  recipes:[{in:{wool:4},out:{soap:4},days:2},{in:{wool:8},out:{cheese:3},days:3}],
  desc:'Skirting table, scour and a spinning frame. Fleece becomes yarn.',
  tip:'Until now wool was the only thing you sold entirely unprocessed.'},
{id:'candle_room', name:'Candle room', art:'candle_room', cat:'craft', w:4,h:3, cost:310, lvl:3, kind:'process', power:-1,
  recipes:[{in:{honey:3},out:{soap:4},days:1},{in:{honey:6},out:{jam:3},days:2}],
  desc:'Beeswax, wicks and moulds. A second thing to do with a good hive year.',
  tip:'Pairs with the apiary the way the dairy pairs with the goats.'},
];

/* ---------------------------------------------------------------
   6. TRADE   existing 120-520, lvl 2-6
   --------------------------------------------------------------- */
const NEW_TRADE = [
{id:'honesty_box', name:'Honesty box', art:'honesty_box', cat:'trade', w:2,h:2, cost:60, lvl:1, kind:'shop', rate:0.9, charm:4,
  desc:'A crate, a price list and a tin. People are mostly honest.',
  tip:'Below the farm stand in price and speed — but it sells from day one.'},
{id:'cafe', name:'Farm cafe', art:'cafe', cat:'trade', w:5,h:4, cost:620, lvl:5, kind:'tourism', income:38, charm:18, power:-3,
  desc:'Tables, a proper kitchen and a view. The biggest visitor earner on the farm.',
  tip:'Above the tea kiosk in every direction, including the electricity bill.'},
{id:'bunkhouse', name:'Bunkhouse', art:'bunkhouse', cat:'trade', w:5,h:3, cost:380, lvl:4, kind:'tourism', income:22, charm:8,
  desc:'Simple beds for a group. Less charming than a dome, and it sleeps six.',
  tip:'Volume rather than luxury.'},
{id:'shepherd_hut', name:"Shepherd's hut", art:'shepherd_hut', cat:'trade', w:3,h:2, cost:300, lvl:3, kind:'tourism', income:18, charm:14,
  desc:'Cast-iron wheels, a stove and one very good bed.',
  tip:'Sits between the glamping tent and the dome.'},
{id:'pickyourown', name:'Pick-your-own gate', art:'pickyourown', cat:'trade', w:3,h:3, cost:220, lvl:3, kind:'shop', rate:1.8, markup:1.15, charm:10,
  desc:'Let visitors into the rows and charge them by the punnet.',
  tip:'Sells crops without you harvesting them first.'},
];

/* ---------------------------------------------------------------
   7. LAND   existing 6-150, lvl 1-3, kinds decor/bonus
   --------------------------------------------------------------- */
const NEW_LAND = [
{id:'stone_wall', name:'Dry stone wall', art:'stone_wall', cat:'land', w:4,h:1, cost:60, lvl:2, kind:'decor', charm:7,
  desc:'Laid by hand, no mortar. Lasts longer than the farm will.',
  tip:'More charm than post and rail, for more money.'},
{id:'pergola', name:'Pergola', art:'pergola', cat:'land', w:3,h:3, cost:110, lvl:3, kind:'decor', charm:12,
  desc:'Oak posts and a climbing rose. Something with height, for once.',
  tip:'Nearly everything else on the farm is flat. This is not.'},
{id:'wildflower', name:'Wildflower strip', art:'wildflower', cat:'land', w:6,h:1, cost:40, lvl:1, kind:'bonus', charm:9, pollinate:1,
  desc:'A sown margin left to do as it likes. Bees find it within a week.',
  tip:'Cheap charm that also helps every crop you grow.'},
{id:'birdbath', name:'Bird bath', art:'birdbath', cat:'land', w:1,h:1, cost:18, lvl:1, kind:'decor', charm:4,
  desc:'One stone bowl on a plinth.',
  tip:'The smallest thing you can place, and it still counts.'},
{id:'windbreak', name:'Windbreak row', art:'windbreak', cat:'land', w:6,h:1, cost:95, lvl:2, kind:'bonus', charm:6, shelter:0.35,
  desc:'A staggered row of hardy trees along the exposed side.',
  tip:'Shelter is what stops a storm undoing a season.'},
];

/* ---------------------------------------------------------------
   8. HOME   existing 0-320, lvl 1-4
   --------------------------------------------------------------- */
const NEW_HOME = [
{id:'bunk_annexe', name:'Bunk annexe', art:'bunk_annexe', cat:'home', w:3,h:2, cost:180, lvl:2, kind:'housing', slots:1, charm:3,
  desc:'A lean-to with two bunks. Somewhere for a hand to sleep, cheaply.',
  tip:'Below the worker cottage. One more pair of hands for half the money.'},
{id:'laundry', name:'Laundry', art:'laundry', cat:'home', w:3,h:2, cost:140, lvl:2, kind:'bonus', charm:3, power:-1,
  desc:'Copper, line and a mangle. One less thing eating the day.',
  tip:'Household chores take less out of everyone.'},
{id:'mud_room', name:'Mud room', art:'mud_room', cat:'home', w:2,h:2, cost:90, lvl:1, kind:'bonus', charm:2,
  desc:'Boots off, coats up, floor saved.',
  tip:'The cheapest thing in Home, and the first one you will want.'},
{id:'guest_wing', name:'Guest wing', art:'guest_wing', cat:'home', w:4,h:3, cost:420, lvl:4, kind:'housing', slots:3, charm:10,
  desc:'Three proper rooms off the main house.',
  tip:'The most housing in one footprint.'},
{id:'root_store', name:'Root store', art:'root_store', cat:'home', w:3,h:2, cost:200, lvl:3, kind:'bonus', charm:4, keep:1,
  desc:'Sand, slats and a cold north wall. Keeps a harvest through winter.',
  tip:'A second store beside the cellar, for when one is not enough.'},
];

/* ---------------------------------------------------------------
   9. AI   existing: the hub only. These are placeable objects that
      make the hub and its modules work better, not new modules.
   --------------------------------------------------------------- */
const NEW_AUTO = [
{id:'weather_mast', name:'Weather mast', art:'weather_mast', cat:'auto', w:1,h:2, cost:260, lvl:4, kind:'bonus', power:-0.5, charm:2,
  desc:'Anemometer, rain gauge and a radio link to the hub.',
  tip:'The hub makes better calls when it knows what is coming.'},
{id:'soil_sensors', name:'Soil sensor grid', art:'soil_sensors', cat:'auto', w:4,h:1, cost:320, lvl:4, kind:'bonus', power:-0.5, autowater:1,
  desc:'Probes through the beds, reporting moisture every hour.',
  tip:'Irrigation stops guessing and starts measuring.'},
{id:'relay', name:'Signal relay', art:'relay', cat:'auto', w:1,h:1, cost:180, lvl:3, kind:'bonus', power:-0.4,
  desc:'A repeater on a pole, for the far corners of a big property.',
  tip:'Automation reaches the parts of the farm the hub cannot see.'},
{id:'server_rack', name:'Server rack', art:'server_rack', cat:'auto', w:2,h:2, cost:640, lvl:5, kind:'bonus', power:-2, buffer:1,
  desc:'Runs the models locally instead of paying someone else to.',
  tip:'Cuts what the automation modules cost you every day.'},
{id:'camera_post', name:'Camera post', art:'camera_post', cat:'auto', w:1,h:1, cost:220, lvl:3, kind:'bonus', power:-0.4, charm:1,
  desc:'A camera on the stock, watching for anything wrong.',
  tip:'Illness and trouble get noticed sooner than you would notice them.'},
];

/* ---------------------------------------------------------------
   10. LEISURE — REC rows, not BP entries. p17_more expands these.
   --------------------------------------------------------------- */
const NEW_REC = [
 {id:'zipline',        name:'Zip line',          w:6,h:2, cost:240, lvl:4, charm:15, who:'child', act:'flying down the zip line'},
 {id:'climbing_frame', name:'Climbing frame',    w:3,h:3, cost:130, lvl:2, charm:10, who:'child', act:'up the climbing frame'},
 {id:'firepit_seats',  name:'Fire pit seating',  w:4,h:4, cost:200, lvl:3, charm:14, who:'adult', act:'round the fire'},
 {id:'plunge_pool',    name:'Plunge pool',       w:3,h:3, cost:300, lvl:4, charm:17, who:'adult', act:'in the plunge pool'},
 {id:'bird_hide',      name:'Bird hide',         w:2,h:2, cost:75,  lvl:2, charm:8,  who:'adult', act:'watching birds'},
];

/* ---------------------------------------------------------------
   register everything
   --------------------------------------------------------------- */
(function registerItems(){
  const all = [].concat(NEW_GROW, NEW_WATER, NEW_POWER, NEW_ANIMAL, NEW_CRAFT,
                        NEW_TRADE, NEW_LAND, NEW_HOME, NEW_AUTO);
  let added = 0;
  all.forEach(bp=>{
    if(BPMAP[bp.id]) return;                 /* never clobber an existing item */
    BP.push(bp); BPMAP[bp.id] = bp; added++;
  });
  /* leisure goes through REC so p17_more builds it the same way as the
     twelve already there */
  if(typeof REC !== 'undefined'){
    NEW_REC.forEach(r=>{
      if(BPMAP[r.id]) return;
      REC.push(r);
      const bp = {id:r.id, name:r.name, art:'rec_'+r.id, cat:'leisure', w:r.w, h:r.h,
        cost:r.cost, lvl:r.lvl, kind:'rec', charm:r.charm, who:r.who, act:r.act,
        desc:`Somewhere for the ${r.who==='child'?'children':'adults'} to spend time. Raises household morale.`,
        tip:'Recreation lifts morale, morale pulls back burnout, and burnout is what your salary is scaled by.'};
      BP.push(bp); BPMAP[r.id] = bp; added++;
    });
  }
  if(typeof log === 'function' && added)
    setTimeout(()=>log(`${added} new things to build have appeared in the shop.`, 'good', 'farm'), 1500);
})();

/* ---------------------------------------------------------------
   ART — composed from the shared primitives so the light stays put
   --------------------------------------------------------------- */
(function itemArt(){
  const A = (typeof ART === 'object') ? ART : null; if(!A) return;

  /* --- grow --- */
  A.bed_narrow = (w,h,ob)=> (A.bed ? A.bed(w,h,ob) : it_slab(w,h,'url(#gSoil)'));
  A.polytunnel = (w,h)=>{
    let s = it_shadow(w,h) + it_slab(w,h,'#6a5a3c');
    for(let i=0;i<Math.round(w/9);i++)
      s += `<path d="M${n(4+i*9)} ${n(h-3)} q${n(4.5)} ${n(-h*0.9)} 9 0" fill="none" stroke="#cfe6ef" stroke-width="1.5" opacity=".85"/>`;
    s += `<rect x="2" y="${n(h*0.16)}" width="${n(w-4)}" height="${n(h*0.7)}" rx="4" fill="#dff0f6" opacity=".38"/>`;
    return s;
  };
  A.vine_row = (w,h)=>{
    let s = patch(w,h,'#7d9c54',41,1) + it_posts(w,h,'#6b4f30');
    for(let i=0;i<3;i++) s += `<line x1="3" y1="${n(h*0.32+i*h*0.18)}" x2="${n(w-3)}" y2="${n(h*0.32+i*h*0.18)}" stroke="#8d99a3" stroke-width=".8"/>`;
    for(let i=0;i<Math.round(w/7);i++){
      const cx=5+i*7; s += canopy(cx, h*0.46, 4.4, 'url(#gCanopyO)', i+3, 1);
      s += `<circle cx="${n(cx+1.5)}" cy="${n(h*0.62)}" r="1.5" fill="#6b3f7a"/>`;
    }
    return s;
  };
  A.mushroom_shed = (w,h)=>{
    let s = it_roofBox(w,h,'#4a4238');
    for(let i=0;i<4;i++) s += `<ellipse cx="${n(w*(0.24+i*0.18))}" cy="${n(h*0.72)}" rx="2.4" ry="1.5" fill="#d9cbb4"/>`;
    return s;
  };
  A.worm_farm = (w,h)=>{
    let s = it_shadow(w,h);
    for(let i=2;i>=0;i--) s += `<rect x="${n(2+i*0.8)}" y="${n(2+i*(h-6)/3)}" width="${n(w-4-i*1.6)}" height="${n((h-4)/3)}" rx="2" fill="${['#4a6b34','#3f5c2c','#345024'][i]}"/>`;
    return s;
  };

  /* --- water --- */
  A.butt = (w,h)=>{
    const r=Math.min(w,h)/2-1.5;
    return `<ellipse cx="${n(w/2+1)}" cy="${n(h/2+1.5)}" rx="${n(r)}" ry="${n(r*0.85)}" fill="#16240c" opacity=".3"/>`
      + `<circle cx="${n(w/2)}" cy="${n(h/2)}" r="${n(r)}" fill="#39543a"/>`
      + `<circle cx="${n(w/2)}" cy="${n(h/2)}" r="${n(r*0.7)}" fill="#4d6b48"/>`
      + `<path d="M${n(w/2-r*0.7)} ${n(h/2)} a${n(r*0.7)} ${n(r*0.7)} 0 0 1 ${n(r*1.4)} 0 Z" fill="#ffffff" opacity=".18"/>`;
  };
  A.swale = (w,h)=>{
    let s = patch(w,h,'#7fa64e',43,1);
    s += `<path d="M2 ${n(h*0.55)} q${n(w*0.25)} ${n(-h*0.35)} ${n(w*0.5)} 0 q${n(w*0.25)} ${n(h*0.35)} ${n(w*0.5-2)} 0"
            fill="none" stroke="#5d7a44" stroke-width="${n(h*0.42)}" stroke-linecap="round" opacity=".9"/>`;
    return s;
  };
  A.greywater = (w,h)=>{
    let s = it_shadow(w,h) + it_slab(w,h,'#5b6a54');
    s += `<rect x="2.5" y="2.5" width="${n(w-5)}" height="${n(h*0.45)}" rx="2" fill="url(#gWater)"/>`;
    for(let i=0;i<5;i++) s += `<line x1="${n(4+i*(w-8)/4)}" y1="${n(h*0.52)}" x2="${n(4+i*(w-8)/4)}" y2="${n(h-4)}" stroke="#7f9b46" stroke-width="1.4"/>`;
    return s;
  };
  A.dam = (w,h)=>{
    let s = patch(w,h,'#7fa64e',47,1);
    s += `<g transform="translate(${n(w*0.06)},${n(h*0.14)})">${water(w*0.88, h*0.66, 47)}</g>`;
    s += `<rect x="1" y="${n(h*0.82)}" width="${n(w-2)}" height="${n(h*0.14)}" rx="3" fill="#8a7b5c"/>`;
    s += `<rect x="1" y="${n(h*0.82)}" width="${n(w-2)}" height="${n(h*0.05)}" rx="2" fill="#a3956f"/>`;
    return s;
  };
  A.drip = (w,h)=>{
    let s = patch(w,h,'#7a9a52',49,1);
    s += `<line x1="2" y1="${n(h*0.5)}" x2="${n(w-2)}" y2="${n(h*0.5)}" stroke="#3f4a52" stroke-width="2" stroke-linecap="round"/>`;
    for(let i=0;i<Math.round(w/6);i++) s += `<circle class="fx-bulb" cx="${n(4+i*6)}" cy="${n(h*0.68)}" r="1.1" fill="#6fb6d8"/>`;
    return s;
  };

  /* --- power --- */
  A.solar_roof = (w,h)=> it_shadow(w,h) + it_slab(w,h,'#3a4450') + panels(w-4, h-4, 2);
  A.micro_hydro = (w,h)=>{
    let s = it_shadow(w,h) + it_slab(w,h,'#4a5a62');
    s += `<circle class="lf-spin" cx="${n(w/2)}" cy="${n(h/2)}" r="${n(Math.min(w,h)*0.3)}" fill="none" stroke="#c9d6dd" stroke-width="2"/>`;
    s += `<rect x="1" y="${n(h*0.72)}" width="${n(w-2)}" height="${n(h*0.2)}" rx="2" fill="url(#gWater)"/>`;
    return s;
  };
  A.generator = (w,h)=>{
    let s = it_shadow(w,h) + it_slab(w,h,'#6b5b48') + it_lid(w,h,'#8b7a63');
    s += `<rect x="${n(w*0.62)}" y="${n(h*0.12)}" width="2.6" height="${n(h*0.3)}" rx="1.3" fill="#3a3128"/>`;
    return s;
  };
  A.solar_tracker = (w,h)=>{
    let s = it_shadow(w,h);
    s += `<rect x="${n(w*0.45)}" y="${n(h*0.55)}" width="${n(w*0.1)}" height="${n(h*0.4)}" rx="2" fill="#55616b"/>`;
    s += `<g transform="translate(${n(w*0.06)},${n(h*0.1)})">${panels(w*0.88, h*0.5, 3)}</g>`;
    return s;
  };
  A.inverter = (w,h)=>{
    let s = it_shadow(w,h) + it_slab(w,h,'#55616b') + it_lid(w,h,'#7d8994');
    s += `<circle class="lf-glow" cx="${n(w*0.5)}" cy="${n(h*0.68)}" r="1.6" fill="#7cf0c0"/>`;
    return s;
  };

  /* --- animals: paddock() gives pens, shelters and the mind hooks --- */
  /* This said 'chicken', so the quail hutch drew white birds with red
     combs while the live simulation - which reads bp.animal correctly -
     walked actual quail around on top of them. Two different species in
     one pen. beast3d has had a quail body since p68; the pen art just
     never asked for it. */
  A.quail       = (w,h,ob)=> paddock(w,h,'quail',   ob?Math.min(10,ob.animals||0):3, 51, 0.7);
  A.pig_pen     = (w,h,ob)=> paddock(w,h,'pig',     ob?Math.min(4, ob.animals||0):2, 53, 1.05);
  A.turkey_run  = (w,h,ob)=> paddock(w,h,'turkey',  ob?Math.min(6, ob.animals||0):2, 55, 1.0);
  A.alpaca      = (w,h,ob)=> paddock(w,h,'alpaca',  ob?Math.min(4, ob.animals||0):2, 57, 1.1);
  A.hay_barn    = (w,h)=>{
    let s = it_roofBox(w,h,'url(#gRoofRed)');
    for(let i=0;i<3;i++) s += `<rect x="${n(w*(0.12+i*0.26))}" y="${n(h*0.66)}" width="${n(w*0.2)}" height="${n(h*0.22)}" rx="2" fill="#cbb474"/>`;
    return s;
  };

  /* --- craft --- */
  const craftBox = (roof, dot)=> (w,h)=>{
    let s = it_roofBox(w,h,roof);
    s += `<circle class="lf-work" cx="${n(w*0.78)}" cy="${n(h*0.24)}" r="2.2" fill="${dot}"/>`;
    return s;
  };
  A.bakery       = craftBox('url(#gRoofRed)', '#f0c14b');
  A.smokehouse   = craftBox('#4a4038', '#c98f4a');
  A.cidery       = craftBox('#7a6a4a', '#c9a06a');
  A.wool_shed    = craftBox('#9aa6ac', '#efe6d6');
  A.candle_room  = craftBox('#8a7c4e', '#ffe9a8');

  /* --- trade --- */
  A.honesty_box = (w,h)=>{
    let s = it_shadow(w,h) + it_slab(w,h,'#a8814f');
    s += `<rect x="${n(w*0.2)}" y="${n(h*0.16)}" width="${n(w*0.6)}" height="${n(h*0.3)}" rx="2" fill="#cbb474"/>`;
    s += `<circle cx="${n(w*0.5)}" cy="${n(h*0.68)}" r="2" fill="#f0c14b"/>`;
    return s;
  };
  A.cafe         = (w,h)=>{ let s=it_roofBox(w,h,'url(#gRoofRed)');
    s += `<g transform="translate(${n(w*0.06)},${n(h*0.68)})">${verandah? verandah(0,0,w*0.88,h*0.26):''}</g>`; return s; };
  A.bunkhouse    = (w,h)=> it_roofBox(w,h,'#8a969c');
  A.shepherd_hut = (w,h)=>{
    let s = it_shadow(w,h);
    s += `<rect x="2" y="${n(h*0.18)}" width="${n(w-4)}" height="${n(h*0.6)}" rx="${n(h*0.28)}" fill="#5b7d6a"/>`;
    s += `<rect x="2" y="${n(h*0.18)}" width="${n(w-4)}" height="${n(h*0.22)}" rx="${n(h*0.16)}" fill="#6f927c"/>`;
    s += `<circle cx="${n(w*0.24)}" cy="${n(h*0.84)}" r="${n(h*0.12)}" fill="#3a3128"/>`;
    s += `<circle cx="${n(w*0.76)}" cy="${n(h*0.84)}" r="${n(h*0.12)}" fill="#3a3128"/>`;
    return s;
  };
  A.pickyourown = (w,h)=>{
    let s = patch(w,h,'#84ad57',59,1);
    s += `<rect x="${n(w*0.44)}" y="2" width="2.4" height="${n(h-4)}" rx="1.2" fill="#7d5931"/>`;
    s += `<rect x="${n(w*0.1)}" y="${n(h*0.2)}" width="${n(w*0.34)}" height="${n(h*0.16)}" rx="2" fill="#cbb474"/>`;
    return s;
  };

  /* --- land --- */
  A.stone_wall = (w,h)=>{
    let s=''; for(let i=0;i<Math.round(w/5);i++)
      s += `<rect x="${n(1+i*5)}" y="${n(h*0.2)}" width="4.2" height="${n(h*0.6)}" rx="1.4" fill="${i%2?'#9aa4ab':'#8794a0'}"/>`;
    return s;
  };
  A.pergola = (w,h)=>{
    let s = it_posts(w,h,'#8a6a42');
    for(let i=0;i<4;i++) s += `<line x1="2" y1="${n(h*0.2+i*h*0.14)}" x2="${n(w-2)}" y2="${n(h*0.2+i*h*0.14)}" stroke="#a8814f" stroke-width="1.6"/>`;
    s += canopy(w*0.5, h*0.34, Math.min(w,h)*0.3, 'url(#gCanopy)', 61, 1);
    return s;
  };
  A.wildflower = (w,h)=>{
    let s = patch(w,h,'#8cb35f',63,1);
    const cols=['#e8c05a','#dd6f9c','#c08bff','#ffffff','#ff8a5b'];
    for(let i=0;i<Math.round(w/2.6);i++)
      s += `<circle class="lf-sway" cx="${n(2+i*2.6)}" cy="${n(h*0.4+hash(i)*h*0.3)}" r="1.3" fill="${cols[i%5]}"/>`;
    return s;
  };
  A.birdbath = (w,h)=>{
    const cx=w/2, cy=h/2;
    return `<ellipse cx="${n(cx+1)}" cy="${n(cy+2)}" rx="${n(w*0.3)}" ry="${n(h*0.16)}" fill="#16240c" opacity=".3"/>`
      + `<rect x="${n(cx-1.2)}" y="${n(cy-1)}" width="2.4" height="${n(h*0.34)}" rx="1.2" fill="#9aa4ab"/>`
      + `<ellipse cx="${n(cx)}" cy="${n(cy-2)}" rx="${n(w*0.3)}" ry="${n(h*0.14)}" fill="#b6c1c8"/>`
      + `<ellipse cx="${n(cx)}" cy="${n(cy-2.4)}" rx="${n(w*0.2)}" ry="${n(h*0.09)}" fill="url(#gWater)"/>`;
  };
  A.windbreak = (w,h)=>{
    let s=''; for(let i=0;i<Math.round(w/5.5);i++)
      s += conifer(2.5+i*5.5, h*0.5, Math.min(4.6, h*0.42), 65+i);
    return s;
  };

  /* --- home --- */
  A.bunk_annexe = (w,h)=> it_roofBox(w,h,'#8a969c');
  A.laundry     = (w,h)=>{ let s=it_roofBox(w,h,'#9aa6ac');
    s += `<line x1="${n(w*0.12)}" y1="${n(h*0.82)}" x2="${n(w*0.88)}" y2="${n(h*0.82)}" stroke="#d9d2c0" stroke-width=".8"/>`;
    for(let i=0;i<3;i++) s += `<rect x="${n(w*(0.2+i*0.22))}" y="${n(h*0.82)}" width="${n(w*0.12)}" height="${n(h*0.1)}" rx="1" fill="#e8e2cf"/>`;
    return s; };
  A.mud_room    = (w,h)=> it_roofBox(w,h,'#7a6a4a');
  A.guest_wing  = (w,h)=> it_roofBox(w,h,'url(#gRoof)');
  A.root_store  = (w,h)=>{ let s=it_roofBox(w,h,'#6b5b48');
    s += `<rect x="${n(w*0.36)}" y="${n(h*0.6)}" width="${n(w*0.28)}" height="${n(h*0.3)}" rx="2" fill="#3a3128"/>`; return s; };

  /* --- AI --- */
  const mast = (w,h,head)=>{
    const cx=w/2;
    let s = `<ellipse cx="${n(cx+1)}" cy="${n(h-2)}" rx="3.4" ry="1.4" fill="#16240c" opacity=".3"/>`;
    s += `<rect x="${n(cx-1)}" y="${n(h*0.12)}" width="2" height="${n(h*0.8)}" rx="1" fill="#7d8994"/>`;
    s += head(cx);
    return s;
  };
  A.weather_mast = (w,h)=> mast(w,h,cx=>
    `<circle class="lf-spin" cx="${n(cx)}" cy="${n(h*0.16)}" r="3.4" fill="none" stroke="#c9d6dd" stroke-width="1.4"/>`);
  A.relay = (w,h)=> mast(w,h,cx=>
    `<path d="M${n(cx-3)} ${n(h*0.2)} L${n(cx)} ${n(h*0.08)} L${n(cx+3)} ${n(h*0.2)}" fill="none" stroke="#8fb4ff" stroke-width="1.4"/>`
    + `<circle class="lf-glow" cx="${n(cx)}" cy="${n(h*0.08)}" r="1.4" fill="#8fb4ff"/>`);
  A.camera_post = (w,h)=> mast(w,h,cx=>
    `<rect x="${n(cx-2.4)}" y="${n(h*0.1)}" width="4.8" height="3" rx="1.2" fill="#46525c"/>`
    + `<circle class="lf-glow" cx="${n(cx+1.6)}" cy="${n(h*0.14)}" r="1" fill="#ff5bb0"/>`);
  A.soil_sensors = (w,h)=>{
    let s = patch(w,h,'#7a9a52',67,1);
    for(let i=0;i<Math.round(w/5);i++){
      s += `<rect x="${n(3+i*5)}" y="${n(h*0.3)}" width="1.6" height="${n(h*0.45)}" rx="0.8" fill="#55616b"/>`;
      s += `<circle class="lf-glow" cx="${n(3.8+i*5)}" cy="${n(h*0.26)}" r="1" fill="#7cf0c0"/>`;
    }
    return s;
  };
  A.server_rack = (w,h)=>{
    let s = it_shadow(w,h) + it_slab(w,h,'#2b3238');
    for(let i=0;i<4;i++){
      s += `<rect x="2.5" y="${n(3+i*(h-6)/4)}" width="${n(w-5)}" height="${n((h-8)/4)}" rx="1.2" fill="#3c464e"/>`;
      s += `<circle class="lf-glow" cx="${n(w-4.5)}" cy="${n(4.5+i*(h-6)/4)}" r="0.9" fill="#7cf0c0"
              style="animation-delay:${(i*0.3).toFixed(1)}s"/>`;
    }
    return s;
  };

  /* --- leisure: p17_more names them rec_<id> --- */
  A.rec_zipline = (w,h)=>{
    let s = patch(w,h,'#84ad57',69,1) + it_posts(w,h,'#8a6a42');
    s += `<line x1="4" y1="${n(h*0.28)}" x2="${n(w-4)}" y2="${n(h*0.52)}" stroke="#c9d6dd" stroke-width="1.2"/>`;
    s += `<rect x="${n(w*0.42)}" y="${n(h*0.38)}" width="3" height="4" rx="1.4" fill="#e8543f"/>`;
    return s;
  };
  A.rec_climbing_frame = (w,h)=>{
    let s = patch(w,h,'#8cb35f',71,1);
    for(let i=0;i<3;i++) s += `<rect x="${n(w*0.2+i*w*0.26)}" y="${n(h*0.24)}" width="2.2" height="${n(h*0.56)}" rx="1.1" fill="#c98f4a"/>`;
    for(let i=0;i<3;i++) s += `<line x1="${n(w*0.2)}" y1="${n(h*0.32+i*h*0.16)}" x2="${n(w*0.78)}" y2="${n(h*0.32+i*h*0.16)}" stroke="#e8b64a" stroke-width="1.6"/>`;
    return s;
  };
  A.rec_firepit_seats = (w,h)=>{
    let s = patch(w,h,'#9c8557',73,1);
    s += `<circle cx="${n(w/2)}" cy="${n(h/2)}" r="${n(Math.min(w,h)*0.16)}" fill="#3a3128"/>`;
    s += `<circle class="lf-glow" cx="${n(w/2)}" cy="${n(h/2)}" r="${n(Math.min(w,h)*0.1)}" fill="#ff8a5b"/>`;
    for(let i=0;i<5;i++){ const a=(i/5)*Math.PI*2;
      s += `<rect x="${n(w/2+Math.cos(a)*w*0.3-2.4)}" y="${n(h/2+Math.sin(a)*h*0.3-1.4)}" width="4.8" height="2.8" rx="1.2" fill="#8a6a42"/>`; }
    return s;
  };
  A.rec_plunge_pool = (w,h)=>{
    let s = patch(w,h,'#8cb35f',75,1);
    s += `<rect x="${n(w*0.14)}" y="${n(h*0.16)}" width="${n(w*0.72)}" height="${n(h*0.68)}" rx="4" fill="#7d8f98"/>`;
    s += `<rect x="${n(w*0.18)}" y="${n(h*0.2)}" width="${n(w*0.64)}" height="${n(h*0.6)}" rx="3" fill="url(#gWater)"/>`;
    return s;
  };
  A.rec_bird_hide = (w,h)=>{
    let s = it_shadow(w,h) + it_slab(w,h,'#5d6b4a');
    s += `<rect x="${n(w*0.16)}" y="${n(h*0.38)}" width="${n(w*0.68)}" height="${n(h*0.16)}" rx="1.6" fill="#2b3228"/>`;
    return s;
  };
})();

/* ---------- handles ---------- */
G.newItems = function(){
  const ids = [].concat(NEW_GROW,NEW_WATER,NEW_POWER,NEW_ANIMAL,NEW_CRAFT,
                        NEW_TRADE,NEW_LAND,NEW_HOME,NEW_AUTO).map(b=>b.id)
             .concat(NEW_REC.map(r=>r.id));
  const missingArt = ids.filter(id=>{
    const bp = BPMAP[id]; return !bp || typeof ART[bp.art] !== 'function';
  });
  const byCat = {};
  ids.forEach(id=>{ const bp=BPMAP[id]; if(bp) (byCat[bp.cat]=byCat[bp.cat]||[]).push(id); });
  return { added:ids.length, registered:ids.filter(id=>!!BPMAP[id]).length,
           missingArt, byCat };
};
