/* =====================================================================
   THE DOG MEETS THE DRAGON, A RECORD OF WHAT YOU HAVE SEEN, AND A
   FORECAST

   Three of the five, and the three that are genuinely small. The village
   and the extra ride games are each the size of the ride itself and get
   their own pass.

   1. THE DOG AND THE DRAGON DID NOT KNOW EACH OTHER EXISTED. Both have
      minds. Neither had any idea the other was on the farm, which is odd
      when one of them is a fox-chasing farm dog and the other is a
      reptile the size of a horse.

      She works it out over time, and it is one-way: she has an opinion
      about it, it barely registers her. Wary at first - she keeps her
      distance and grumbles. Then curious, edging closer. Then used to it,
      and eventually she will lie down near it, which is the whole point
      of the arc. Being near it while it is settled is what moves her
      along; it breathing fire sets her back.

   2. AN ALMANAC. Six wildlife species, four aliens, six champions, five
      ride scenes, five arenas - all randomised, and nothing recorded what
      you had actually met. It fills in as you encounter things, keeps a
      count, and for wildlife records the range of temperaments you have
      personally seen, which is different from the range that exists.

   3. A FORECAST. The books already take a reading every five days. That
      is a series, and a series can be extrapolated - so the Money tab now
      says when you will hit the next round number at the rate you are
      actually going, from your own history rather than a guess. It says
      so when the trend is down, too.
   ===================================================================== */

/* ---------- 1. the dog forms a view ---------- */
const DOG_DRAGON = ['wary','curious','used to it','easy'];

function dogDragonBond(){
  const d = S.dog; if(!d) return 0;
  if(d.dragonEase === undefined) d.dragonEase = 0;
  return d.dragonEase;
}
function dogDragonStage(){
  const e = dogDragonBond();
  return e > 0.75 ? 3 : e > 0.45 ? 2 : e > 0.18 ? 1 : 0;
}

if(typeof tickDog === 'function'){
  const _tickDogMeet = tickDog;
  tickDog = function(dt){
    const r = _tickDogMeet.apply(this, arguments);
    try{
      const d = S.dog, dr = S.dragon;
      if(!d || !dr) return r;
      if(d.dragonEase === undefined) d.dragonEase = 0;
      const gap = Math.hypot(d.x - dr.x, d.y - dr.y);
      const settled = ['rest','perch','feed','sit'].includes(dr.state);

      if(gap < 150){
        const wasStage = dogDragonStage();
        /* time near it while it is calm is what does it */
        if(settled) d.dragonEase = Math.min(1, d.dragonEase + dt * 0.020);
        /* fire undoes some of that, fairly */
        if(dr.state === 'burn' || (dr.showT > 0))
          d.dragonEase = Math.max(0, d.dragonEase - dt * 0.10);

        /* while she is wary she will not settle beside it */
        if(dogDragonStage() === 0 && gap < 70){
          const ax = d.x - dr.x, ay = d.y - dr.y;
          const m = Math.hypot(ax, ay) || 1;
          d.x += (ax/m) * 34 * dt; d.y += (ay/m) * 34 * dt;
          d.state = 'walk';
          if(!d.grumbleT || (d.grumbleT -= dt) <= 0){
            d.grumbleT = 14;
            if(typeof speak === 'function') try{ speak(d, 'grrr'); }catch(e){}
          }
        }
        const nowStage = dogDragonStage();
        if(nowStage !== wasStage && typeof log === 'function'){
          const lines = [
            `${d.name} will not go near ${dr.name}.`,
            `${d.name} has started watching ${dr.name} instead of avoiding it.`,
            `${d.name} walked right past ${dr.name} without a second look.`,
            `${d.name} lay down beside ${dr.name}. They have come to an arrangement.`,
          ];
          log(lines[nowStage], nowStage >= 2 ? 'good' : '', 'home');
        }
      }
    }catch(e){}
    return r;
  };
}

/* ---------- 2. the almanac ---------- */
function almInit(){ if(!S.almanac) S.almanac = { wild:{}, champ:{}, scene:{}, arena:{} }; return S.almanac; }
function almSee(kind, id, extra){
  const a = almInit();
  if(!a[kind]) a[kind] = {};
  const e = a[kind][id] || (a[kind][id] = { n:0, first:S.day });
  e.n++; e.last = S.day;
  if(extra) Object.keys(extra).forEach(k=>{
    const v = extra[k];
    if(typeof v !== 'number') return;
    if(e[k+'Lo'] === undefined || v < e[k+'Lo']) e[k+'Lo'] = v;
    if(e[k+'Hi'] === undefined || v > e[k+'Hi']) e[k+'Hi'] = v;
  });
  return e;
}

if(typeof spawnWild === 'function'){
  const _spawnAlm = spawnWild;
  spawnWild = function(){
    const w = _spawnAlm.apply(this, arguments);
    try{ if(w) almSee('wild', w.k, { bold:w.bold, wary:w.wary }); }catch(e){}
    return w;
  };
}
if(typeof G.startDuel === 'function'){
  const _duelAlm = G.startDuel;
  G.startDuel = function(){
    const r = _duelAlm.apply(this, arguments);
    try{ if(DUEL){ almSee('champ', DUEL.hero.id); almSee('champ', DUEL.villain.id);
      if(DUEL.arena) almSee('arena', DUEL.arena.id); } }catch(e){}
    return r;
  };
}
if(typeof G.rideDragon === 'function'){
  const _rideAlm = G.rideDragon;
  G.rideDragon = function(){
    const r = _rideAlm.apply(this, arguments);
    try{ if(typeof RIDE !== 'undefined' && RIDE && RIDE.scene) almSee('scene', RIDE.scene.id); }catch(e){}
    return r;
  };
}

function almanacHTML(){
  const a = almInit();
  const row = (label, seen, total, items)=>{
    let h = `<div class="ph">${label} <span style="color:var(--txt3);font-weight:500">${seen} of ${total}</span></div>`;
    h += items.map(it=>{
      const e = it.e;
      return `<div class="mrow" data-tip="${esc(it.tip)}" style="${e?'':'opacity:.42'}">
        <span class="nm">${e ? it.n : '— — —'}</span>
        <span class="pr">${e ? '×'+e.n : ''}</span></div>`;
    }).join('');
    return h;
  };
  let h = `<div class="card"><div class="muted">What you have actually met. It fills in as you
    go — the ranges are what you have seen yourself, not what exists.</div></div>`;

  if(typeof WILD === 'object'){
    const ks = Object.keys(WILD);
    h += row('Wildlife', ks.filter(k=>a.wild[k]).length, ks.length, ks.map(k=>{
      const e = a.wild[k], sp = WILD[k];
      return { n:sp.n, e, tip:e
        ? `<b>${sp.n}</b>${sp.seen||''}<hr><div class="tl"><span>Seen</span><b>${e.n} times</b></div>`
          + `<div class="tl"><span>First</span><b>day ${e.first}</b></div>`
          + (e.boldLo!==undefined?`<div class="tl"><span>Boldness seen</span><b>${e.boldLo.toFixed(2)}–${e.boldHi.toFixed(2)}</b></div>`:'')
        : `<b>Not yet seen</b>Something you have not met.` };
    }));
  }
  if(typeof FIGHTERS === 'object'){
    h += row('Champions', FIGHTERS.filter(f=>a.champ[f.id]).length, FIGHTERS.length,
      FIGHTERS.map(f=>({ n:f.n, e:a.champ[f.id],
        tip:a.champ[f.id] ? `<b>${f.n}</b>Fought ${a.champ[f.id].n} times.` : '<b>Not yet seen</b>' })));
  }
  if(typeof ARENAS === 'object'){
    h += row('Arenas', ARENAS.filter(x=>a.arena[x.id]).length, ARENAS.length,
      ARENAS.map(x=>({ n:x.n, e:a.arena[x.id],
        tip:a.arena[x.id] ? `<b>${x.n}</b>Fought over ${a.arena[x.id].n} times.` : '<b>Not yet seen</b>' })));
  }
  if(typeof SCENES === 'object'){
    h += row('Places you have flown', SCENES.filter(x=>a.scene[x.id]).length, SCENES.length,
      SCENES.map(x=>({ n:x.n, e:a.scene[x.id],
        tip:a.scene[x.id] ? `<b>${x.n}</b>Flown ${a.scene[x.id].n} times.` : '<b>Not yet flown</b>' })));
  }
  if(S.dog && S.dragon){
    h += `<div class="ph">The dog and the dragon</div>
      <div class="card"><b style="font-size:12px">${DOG_DRAGON[dogDragonStage()]}</b>
      <div class="bar" style="margin-top:5px"><i style="transform:scaleX(${dogDragonBond().toFixed(3)});background:#7cc24f"></i></div>
      <div class="muted" style="margin-top:4px">Time near it while it is settled brings her round.
      Fire sets her back.</div></div>`;
  }
  return h;
}

/* ---------- 3. the forecast ---------- */
function ledgerForecast(){
  const h = (typeof ledgerHistory === 'function') ? ledgerHistory() : [];
  if(h.length < 3) return null;
  const a = h[Math.max(0, h.length-5)], b = h[h.length-1];
  const days = Math.max(1, b.d - a.d);
  const perDay = (b.worth - a.worth) / days;
  if(Math.abs(perDay) < 1) return { flat:true, perDay };
  const w = b.worth;
  /* the next round number worth aiming at */
  const steps = [50e3,100e3,250e3,500e3,1e6,2.5e6,5e6,10e6,25e6,50e6,100e6];
  const next = steps.find(x=>x > w);
  if(perDay > 0 && next){
    return { perDay, target:next, days:Math.ceil((next - w)/perDay), day:b.d + Math.ceil((next-w)/perDay) };
  }
  if(perDay < 0){
    const zero = Math.ceil(w / -perDay);
    return { perDay, falling:true, days:zero, day:b.d + zero };
  }
  return { perDay };
}

if(typeof moneyHTML === 'function'){
  const _moneyForecast = moneyHTML;
  moneyHTML = function(){
    let h = _moneyForecast.apply(this, arguments);
    try{
      const f = ledgerForecast();
      let card;
      if(!f) card = `<div class="card"><b style="font-size:12px">No forecast yet</b>
        <div class="muted" style="margin-top:3px">The books take a reading every five days.
        Three readings and it can project.</div></div>`;
      else if(f.flat) card = `<div class="card"><b style="font-size:12px">Holding steady</b>
        <div class="muted" style="margin-top:3px">Your worth is not moving either way at the moment.</div></div>`;
      else if(f.falling) card = `<div class="warnbox"><b>Falling ${fmt(Math.round(-f.perDay*30))} a month</b>
        <div style="margin-top:3px;opacity:.85">At this rate you run out on day ${f.day} — ${f.days} days.
        Measured from your own readings, not a guess.</div></div>`;
      else card = `<div class="card"><b style="font-size:12px">${fmt(f.target)} around day ${f.day}</b>
        <div class="muted" style="margin-top:3px">${f.days} days at your current
        ${fmt(Math.round(f.perDay*30))} a month, measured from your own readings.</div></div>`;
      const i = h.indexOf('<div class="ph">What the numbers say</div>');
      h = i < 0 ? h + card : h.slice(0,i) + card + h.slice(i);
    }catch(e){}
    return h;
  };
}

/* ---------- the almanac gets a tab ---------- */
if(typeof renderRight === 'function'){
  const _rrAlm = renderRight;
  renderRight = function(){
    if(rightTab === 'almanac'){
      const b = document.getElementById('rightBody');
      if(b){ b.innerHTML = almanacHTML(); return; }
    }
    return _rrAlm.apply(this, arguments);
  };
}
function addAlmanacTab(){
  const bar = document.querySelector('.ptabs');
  if(!bar || bar.querySelector('#almtab')) return;
  const t = document.createElement('button');
  t.id = 'almtab'; t.className = 'ptab'; t.textContent = 'Almanac';
  t.addEventListener('click', ()=>{
    rightTab = 'almanac';
    bar.querySelectorAll('.ptab').forEach(b=>b.classList.remove('on'));
    t.classList.add('on');
    if(typeof ui === 'function') ui();
  });
  bar.appendChild(t);
  if(rightTab === 'almanac') t.classList.add('on');
}
setTimeout(addAlmanacTab, 800);
if(typeof ui === 'function'){
  const _uiAlm = ui;
  ui = function(){ const r = _uiAlm.apply(this, arguments); try{ addAlmanacTab(); }catch(e){} return r; };
}

/* ---------- handle ---------- */
G.almanacAudit = function(){
  const a = almInit();
  const f = ledgerForecast();
  return {
    wildSeen: `${Object.keys(a.wild).length} of ${typeof WILD==='object'?Object.keys(WILD).length:0}`,
    championsSeen: `${Object.keys(a.champ).length} of ${typeof FIGHTERS==='object'?FIGHTERS.length:0}`,
    arenasSeen: `${Object.keys(a.arena).length} of ${typeof ARENAS==='object'?ARENAS.length:0}`,
    placesFlown: `${Object.keys(a.scene).length} of ${typeof SCENES==='object'?SCENES.length:0}`,
    dogAndDragon: (S.dog && S.dragon)
      ? `${DOG_DRAGON[dogDragonStage()]} (${dogDragonBond().toFixed(2)})` : 'not both present',
    forecast: f ? (f.falling ? `falling, out on day ${f.day}`
      : f.flat ? 'flat' : `${fmt(f.target)} around day ${f.day}`) : 'needs 3 readings',
  };
};
