/* =====================================================================
   THE VALLEY — what the money is for

   A played save had $442,951 and nothing worth buying. The answer is not
   a bigger shop, and it is deliberately not a city: this game is about a
   family, a partner who does the chores you missed, and animals with
   opinions. A zoning and logistics layer would compete with that rather
   than extend it.

   So the money revives the place around you instead. You stay a farmer.
   Each milestone is a named thing you work toward, it costs real money,
   it changes what you can see on the horizon, and it does something you
   can measure. Seven of them, $80,000 up to $1.5m, about $3.9m in total.

   Every effect here is a wrapper on a function the game already has, so
   nothing in the core loop had to be rewritten to support it, and each
   one is checkable from G.valleyAudit() rather than taken on trust.
   ===================================================================== */

function valleyInit(){
  if(!S.valley) S.valley = { built: [] };
  if(!Array.isArray(S.valley.built)) S.valley.built = [];
  return S.valley;
}
function hasV(id){ return valleyInit().built.indexOf(id) >= 0; }

const VALLEY = [
  { id:'coop',      n:'The co-op',            cost:80000,   at:0,
    d:'A shared cold store at the crossroads. Growers pool what they have, so buyers come for a pallet instead of a crate.',
    e:'Contracts are three times the size, and pay three times as much.' },
  { id:'shop',      n:'The village shop',     cost:150000,  at:1,
    d:'The shop has been shut since before you came. Stock it and it opens again, with your name on the board outside.',
    e:'A daily income that grows with how lovely your farm is.' },
  { id:'mill',      n:'The old mill',         cost:250000,  at:2,
    d:'The wheel has not turned in forty years. The race is still there under the weeds.',
    e:'Adds flour, and the bakery can turn it into bread properly.' },
  { id:'creamery',  n:'The creamery',         cost:400000,  at:3,
    d:'A proper vat and a cool room, so milk stops being something you sell by the bucket.',
    e:'A bulk cheese run at the dairy: 20 milk at a time.' },
  { id:'school',    n:'The school',           cost:600000,  at:4,
    d:'Reopen the schoolhouse and families stop leaving the valley. Some of them start visiting yours.',
    e:'Visitor income up by half.' },
  { id:'hall',      n:'The village hall',     cost:900000,  at:5,
    d:'Somewhere to hold the harvest supper and the show. A valley with a hall has a calendar.',
    e:'The market is worth half again as much standing.' },
  { id:'station',   n:'The station halt',     cost:1500000, at:6,
    d:'A request stop on the branch line. What leaves in the morning is on a city table by evening.',
    e:'Everything you sell fetches 20% more, everywhere.' },
];

function valleyNext(){ return VALLEY.find(v=>!hasV(v.id)) || null; }
function valleyCanBuy(v){ return v && !hasV(v.id) && valleyInit().built.length >= v.at; }

function buildValley(id){
  valleyInit();
  const v = VALLEY.find(x=>x.id===id);
  if(!v || hasV(id)) return;
  if(!valleyCanBuy(v)) return toast('The valley is not ready for that yet','bad'), sfx('error');
  if(S.cash < v.cost) return toast(`${v.n} costs ${fmt(v.cost)}`,'bad'), sfx('error');
  S.cash -= v.cost;
  S.valley.built.push(id);
  applyValley();
  /* The backdrop is only rebuilt when its token changes, and the token is
     world size + land id + expansions - none of which a valley project
     touches. Clearing terrainCache alone rebuilt the string and threw it
     away; the village appeared in terrain() and never in #bg. Blanking
     bgToken is what actually forces the backdrop to be re-emitted. */
  terrainCache = '';
  try{ bgToken = ''; }catch(e){}
  sfx('level');
  toast(`${v.n} — done`,'gold');
  log(`${v.n} is open. ${v.e}`,'gold','home');
  render(); ui(); G.save();
}
G.buildValley = buildValley;

/* ---------- effects ----------
   applyValley() re-runs on load and after each build. Everything it does
   is idempotent, because it is called more than once. */
function applyValley(){
  valleyInit();

  /* the mill puts flour in the world, and gives the bakery something to
     do with it besides eggs */
  if(hasV('mill') && typeof GOODS === 'object'){
    if(!GOODS.flour) GOODS.flour = { n:'Flour', c:'#e8dfc6', p:18, craft:1 };
    if(BPMAP.bakery && !BPMAP.bakery.recipes.some(r=>r.in.flour)){
      BPMAP.bakery.recipes = BPMAP.bakery.recipes.concat([
        { in:{flour:4}, out:{bread:5}, days:1 },
      ]);
    }
  }
  /* the creamery is a scale change, not a new product */
  if(hasV('creamery') && BPMAP.dairy && !BPMAP.dairy.recipes.some(r=>(r.in.milk||0) >= 20)){
    BPMAP.dairy.recipes = BPMAP.dairy.recipes.concat([
      { in:{milk:20}, out:{cheese:9}, days:2 },
    ]);
  }
}

/* contracts: the co-op means buyers want pallets */
if(typeof rollContracts === 'function'){
  const _rollBase = rollContracts;
  rollContracts = function(){
    const before = (S.contracts||[]).length;
    const r = _rollBase.apply(this, arguments);
    if(hasV('coop')){
      (S.contracts||[]).slice(before).forEach(c=>{
        c.qty = Math.round(c.qty * 3);
        c.pay = Math.round(c.pay * 3);
        c.left = c.left + 2;                 /* a bigger order gets more time */
      });
    }
    return r;
  };
}

/* the station lifts every price; the school lifts visitor money */
if(typeof sellPrice === 'function'){
  const _sellValley = sellPrice;
  sellPrice = function(gid){
    const base = _sellValley.apply(this, arguments);
    return hasV('station') ? Math.max(1, Math.round(base * 1.2)) : base;
  };
}
if(typeof charmMul === 'function'){
  const _charmValley = charmMul;
  charmMul = function(){
    const base = _charmValley.apply(this, arguments);
    return hasV('school') ? base * 1.5 : base;
  };
}

/* the hall: market standing is worth half again */
if(typeof marketEnd === 'function'){
  const _marketEndValley = marketEnd;
  marketEnd = function(){
    const before = S.fame || 0;
    const r = _marketEndValley.apply(this, arguments);
    if(hasV('hall')){
      const gained = (S.fame||0) - before;
      if(gained > 0) S.fame = Math.min(100, before + Math.round(gained * 1.5));
    }
    return r;
  };
}

/* the shop pays out daily, scaled by how good the place looks */
if(typeof advanceDay === 'function'){
  const _advValley = advanceDay;
  advanceDay = function(){
    const r = _advValley.apply(this, arguments);
    if(hasV('shop')){
      const take = Math.round(40 + Math.min(300, (stat().charm||0) * 1.1));
      if(take > 0 && typeof earn === 'function'){
        earn(take, 0);
        if(typeof log === 'function' && (S.day % 7 === 0))
          log(`The village shop took ${fmt(take)} on your produce today.`, '', 'money');
      }
    }
    return r;
  };
}

/* ---------- the horizon changes as it gets built ---------- */
function valleyArt(){
  valleyInit();
  if(!S.valley.built.length) return '';
  const W = WPX;
  /* the village sits on the mid band, off to the west, small enough to
     read as distance rather than as another farm */
  const bx = W * 0.16, by = 34, sc = 0.62;
  const roof = (x,y,w,h,rc)=>
      `<rect x="${n(x)}" y="${n(y+h*0.42)}" width="${n(w)}" height="${n(h*0.58)}" fill="#d9cdb4"/>`
    + `<path d="M${n(x-w*0.1)} ${n(y+h*0.44)} L${n(x+w/2)} ${n(y)} L${n(x+w*1.1)} ${n(y+h*0.44)} Z" fill="${rc}"/>`
    + `<rect x="${n(x+w*0.36)}" y="${n(y+h*0.66)}" width="${n(w*0.28)}" height="${n(h*0.34)}" fill="#6d5b44"/>`;
  let s = `<g id="village" opacity=".92">`;
  let x = bx;
  const put = (id, w, h, rc, extra)=>{
    if(!hasV(id)) return;
    s += roof(x, by, w*sc, h*sc, rc);
    if(extra) s += extra(x, by, w*sc, h*sc);
    x += w*sc + 10;
  };
  put('coop',  74, 46, '#8a959b');
  put('shop',  58, 42, '#a1503f');
  put('mill',  60, 54, '#7e3b2e', (X,Y,w,h)=>
      `<circle cx="${n(X-6)}" cy="${n(Y+h*0.72)}" r="${n(h*0.34)}" fill="none" stroke="#6d5b44" stroke-width="3"/>`
    + `<circle cx="${n(X-6)}" cy="${n(Y+h*0.72)}" r="${n(h*0.12)}" fill="#6d5b44"/>`);
  put('creamery', 66, 40, '#8a959b');
  put('school', 62, 50, '#a1503f', (X,Y,w,h)=>
      `<rect x="${n(X+w*0.42)}" y="${n(Y-h*0.5)}" width="${n(w*0.16)}" height="${n(h*0.55)}" fill="#d9cdb4"/>`
    + `<path d="M${n(X+w*0.4)} ${n(Y-h*0.46)} L${n(X+w*0.5)} ${n(Y-h*0.86)} L${n(X+w*0.6)} ${n(Y-h*0.46)} Z" fill="#7e3b2e"/>`);
  put('hall',  80, 46, '#6a747a');
  put('station', 88, 34, '#55606a', (X,Y,w,h)=>
      `<rect x="${n(X-10)}" y="${n(Y+h*1.02)}" width="${n(w+20)}" height="4" fill="#8b8371"/>`
    + `<rect x="${n(X-16)}" y="${n(Y+h*1.14)}" width="${n(w+32)}" height="3" fill="#6d6558"/>`);
  s += `</g>`;
  return s;
}

if(typeof horizonLayer === 'function'){
  const _horizonValley = horizonLayer;
  horizonLayer = function(){
    return _horizonValley.apply(this, arguments) + valleyArt();
  };
}

/* ---------- the panel ---------- */
G.openValley = function(){
  valleyInit();
  const doneN = S.valley.built.length;
  let h = `<h2>The valley</h2>
    <p class="sub">${doneN} of ${VALLEY.length} done. Your money does not only buy sheds —
    it can put this valley back on its feet. Each of these changes what you can see from the gate.</p>`;
  VALLEY.forEach(v=>{
    const built = hasV(v.id);
    const open  = valleyCanBuy(v);
    const afford= S.cash >= v.cost;
    h += `<div style="padding:10px 0;border-top:1px solid var(--line);opacity:${built||open?1:.5}">
      <div style="display:flex;gap:8px;align-items:baseline">
        <b style="flex:1">${built?'● ':''}${v.n}</b>
        <span class="tk">${built?'done':fmt(v.cost)}</span></div>
      <div class="muted" style="font-size:12px;margin:3px 0 5px">${v.d}</div>
      <div style="font-size:12px;color:var(--acc)">${v.e}</div>
      ${built ? '' : open
        ? `<button class="btn" style="margin-top:7px" ${afford?'':'disabled'}
             onclick="G.buildValley('${v.id}')">${afford?`Fund it — ${fmt(v.cost)}`:`Needs ${fmt(v.cost)}`}</button>`
        : `<div class="muted" style="font-size:11px;margin-top:6px">Opens once ${VALLEY[v.at-1] ? VALLEY[v.at-1].n.toLowerCase() : 'the previous project'} is done.</div>`}
    </div>`;
  });
  h += `<div class="mfoot"><button class="btn ghost" onclick="G.closeModal()">Close</button></div>`;
  modal(h);
};

/* button, mounted like the others */
setTimeout(()=>{
  const bar = document.querySelector('.tbtn') && document.querySelector('.tbtn').parentElement;
  if(!bar || document.getElementById('valleybtn')) return;
  const b = document.createElement('button');
  b.id = 'valleybtn'; b.className = 'tbtn';
  b.textContent = '⌂ Valley';
  b.dataset.tip = '<b>The valley</b>Put the village back on its feet. Seven projects, and you can see every one of them from your gate.';
  b.addEventListener('click', ()=>G.openValley());
  bar.appendChild(b);
}, 600);

/* effects have to be live on a save that already has some built */
setTimeout(()=>{
  try{
    applyValley();
    if(valleyInit().built.length){ terrainCache=''; try{ bgToken=''; }catch(e){} render(); }
  }catch(e){}
}, 700);

/* ---------- handle ---------- */
G.valleyAudit = function(){
  valleyInit();
  return {
    built: S.valley.built,
    next: valleyNext() ? `${valleyNext().n} — ${fmt(valleyNext().cost)}` : 'all done',
    totalCost: VALLEY.reduce((a,v)=>a+v.cost,0),
    effectsLive: {
      contractsTripled: hasV('coop'),
      shopDailyTake: hasV('shop') ? Math.round(40 + Math.min(300,(stat().charm||0)*1.1)) : 0,
      flourExists: !!(typeof GOODS==='object' && GOODS.flour),
      bakeryFlourRecipe: !!(BPMAP.bakery && BPMAP.bakery.recipes.some(r=>r.in.flour)),
      creameryBulkRun: !!(BPMAP.dairy && BPMAP.dairy.recipes.some(r=>(r.in.milk||0)>=20)),
      sellPriceMul: hasV('station') ? 1.2 : 1,
      charmMulNow: +charmMul().toFixed(2),
      villageOnHorizon: valleyArt().length > 0,
    },
  };
};
