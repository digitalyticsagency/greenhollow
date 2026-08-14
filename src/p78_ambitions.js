/* =====================================================================
   AMBITIONS — the thing the game never had

   A played save reached day 199 with $442,951 in the bank, and the honest
   problem was not that there was nothing to buy. It was that nothing ever
   said what you were working toward, and nothing ever said you had done
   it. Money accumulated and the game never noticed.

   This is a list of named goals measured off state the game already
   keeps - totalEarned, harvests, seedsPlanted, fame, expansions, lots,
   the objects on the land - so it reads a real save correctly the moment
   it loads, including one that is 199 days deep. Nothing has to be
   started fresh to see progress.

   Two counters did not exist and are added here rather than faked: the
   set of goods you have ever produced, and the number of craft batches
   collected. Both are recorded going forward, and both are seeded
   generously on an existing save from what is already in the barn, so a
   long save does not show zero for things it plainly did years ago.

   Deliberately: no rewards, no currency, no unlocks. An ambition is a
   name and a line of progress. The moment it pays out it becomes another
   income source to optimise, and the point of it is to be the opposite
   of that.
   ===================================================================== */

function ambInit(){
  if(!S.amb) S.amb = { made:{}, batches:0, seen:{} };
  if(!S.amb.made) S.amb.made = {};
  if(S.amb.batches === undefined) S.amb.batches = 0;
  if(!S.amb.seen) S.amb.seen = {};
  /* an existing save has produced plenty - seed from what is in the barn
     and from what its buildings can make, so day 199 does not read as 0 */
  if(!S.amb.seeded){
    Object.keys(S.store || {}).forEach(k=>{ S.amb.made[k] = 1; });
    (S.objs || []).forEach(o=>{
      const bp = BPMAP[o.bp];
      if(bp && bp.good) S.amb.made[bp.good] = 1;
    });
    S.amb.seeded = 1;
  }
  return S.amb;
}

/* record what gets produced, from here on */
if(typeof give === 'function'){
  const _giveAmb = give;
  give = function(gid, qty){
    try{ ambInit(); if(gid) S.amb.made[gid] = 1; }catch(e){}
    return _giveAmb.apply(this, arguments);
  };
}

/* ---------- helpers the goals are measured with ---------- */
function ambSpecies(){
  const set = new Set();
  (S.objs || []).forEach(o=>{
    const bp = BPMAP[o.bp];
    if(bp && bp.kind === 'animal' && bp.animal && (o.animals||0) > 0) set.add(bp.animal);
  });
  return set;
}
function ambHead(){
  return (S.objs || []).reduce((a,o)=>{
    const bp = BPMAP[o.bp];
    return a + (bp && bp.kind === 'animal' ? (o.animals||0) : 0);
  }, 0);
}
function ambCount(kind){
  return (S.objs || []).filter(o=>BPMAP[o.bp] && BPMAP[o.bp].kind === kind).length;
}
function ambTiles(){
  return typeof estateTiles === 'function' ? estateTiles() : FARM.w*FARM.h;
}
function ambGoodsMade(){ ambInit(); return Object.keys(S.amb.made).length; }
function ambCraftKinds(){
  /* how many distinct craft outputs are reachable from what you own */
  const out = new Set();
  (S.objs || []).forEach(o=>{
    const bp = BPMAP[o.bp];
    if(bp && bp.recipes) bp.recipes.forEach(r=>Object.keys(r.out).forEach(k=>out.add(k)));
  });
  return out.size;
}

/* ---------- the list ----------
   `at` is the target, `now` reads the save. Progress is now/at, clamped.
   Groups are ordered roughly by when they come into reach. */
const AMBITIONS = [
  { g:'The homestead', n:'Break the ground',        d:'Harvest your first crop.',                    now:()=>S.harvests||0,              at:1 },
  { g:'The homestead', n:'Something to feed',       d:'Keep animals of two different kinds.',        now:()=>ambSpecies().size,          at:2 },
  { g:'The homestead', n:'Off the grid',            d:'Generate more power than you use.',           now:()=>{const s=stat();return s.power>=s.use&&s.use>0?1:0;}, at:1 },
  { g:'The homestead', n:'A working farm',          d:'Have twenty buildings on your land.',         now:()=>(S.objs||[]).length,        at:20 },

  { g:'The land',      n:'The adjoining paddock',   d:'Buy land from the neighbour once.',           now:()=>S.expansions||0,            at:1 },
  { g:'The land',      n:'Across the lane',         d:'Buy a separate lot.',                         now:()=>(S.lots||[]).length,        at:1 },
  { g:'The land',      n:'A proper holding',        d:'Farm a thousand tiles.',                      now:()=>ambTiles(),                 at:1000 },
  { g:'The land',      n:'Everything they will sell', d:'Own six separate lots.',                    now:()=>(S.lots||[]).length,        at:6 },

  { g:'The herd',      n:'Mixed farming',           d:'Keep five different species.',                now:()=>ambSpecies().size,          at:5 },
  { g:'The herd',      n:'Every kind there is',     d:'Keep all eleven species at once.',            now:()=>ambSpecies().size,          at:11 },
  { g:'The herd',      n:'A hundred head',          d:'Have a hundred animals on the place.',        now:()=>ambHead(),                  at:100 },

  { g:'The kitchen',   n:'Make something',          d:'Own a building that processes what you grow.',now:()=>ambCount('process'),        at:1 },
  { g:'The kitchen',   n:'The full pantry',         d:'Produce twenty different goods.',             now:()=>ambGoodsMade(),             at:20 },
  { g:'The kitchen',   n:'Nothing leaves raw',      d:'Be able to craft eight different products.',  now:()=>ambCraftKinds(),            at:8 },

  { g:'The market',    n:'Talked about',            d:'Reach 12 standing at the market.',            now:()=>S.fame||0,                  at:12 },
  { g:'The market',    n:'Local favourite',         d:'Reach 28 standing.',                          now:()=>S.fame||0,                  at:28 },
  { g:'The market',    n:'Best in the valley',      d:'Reach 72 standing — the top of the board.',   now:()=>S.fame||0,                  at:72 },

  { g:'The household', n:'Room for guests',         d:'Have somewhere for visitors to stay.',        now:()=>ambCount('housing'),        at:1 },
  { g:'The household', n:'Somewhere to sit',        d:'Put a bench, a deck or a fire circle in.',    now:()=>(S.objs||[]).filter(o=>['bench','deck','firepit'].includes(o.bp)).length, at:1 },
  { g:'The household', n:'A place worth visiting',  d:'Reach 200 charm.',                            now:()=>Math.round(stat().charm),   at:200 },

  { g:'The long run',  n:'A season in',             d:'Reach day 90.',                               now:()=>S.day||0,                   at:90 },
  { g:'The long run',  n:'Five years on',           d:'Reach day 1,800.',                            now:()=>S.day||0,                   at:1800 },
  { g:'The long run',  n:'Earned a living',         d:'Earn a hundred thousand in total.',           now:()=>S.totalEarned||0,           at:100000 },
  { g:'The long run',  n:'A million through the gate', d:'Earn a million in total.',                 now:()=>S.totalEarned||0,           at:1000000 },
];

function ambState(a){
  let now = 0;
  try{ now = a.now() || 0; }catch(e){ now = 0; }
  return { now, at:a.at, done: now >= a.at, pct: Math.max(0, Math.min(1, now / a.at)) };
}
function ambDoneCount(){ return AMBITIONS.filter(a=>ambState(a).done).length; }

/* ---------- the panel ---------- */
G.openAmbitions = function(){
  ambInit();
  const groups = [];
  AMBITIONS.forEach(a=>{ if(!groups.includes(a.g)) groups.push(a.g); });
  const done = ambDoneCount();

  const fmtN = v => (typeof fmt === 'function' && v >= 1000) ? fmt(v).replace(/^A?\$/,'') : Math.round(v).toLocaleString();

  let h = `<h2>Ambitions</h2>
    <p class="sub">${done} of ${AMBITIONS.length} done. Nothing here pays out —
    it is a list of things worth having done.</p>`;

  groups.forEach(g=>{
    const rows = AMBITIONS.filter(a=>a.g===g);
    const gd = rows.filter(a=>ambState(a).done).length;
    h += `<h4 style="margin:14px 0 6px;display:flex;justify-content:space-between">
            <span>${g}</span><span class="muted" style="font-weight:400">${gd}/${rows.length}</span></h4>`;
    rows.forEach(a=>{
      const s = ambState(a);
      h += `<div style="display:flex;gap:10px;align-items:flex-start;padding:7px 0;border-top:1px solid var(--line)">
        <div style="width:18px;flex:0 0 18px;text-align:center;font-size:13px;color:${s.done?'#8fc063':'var(--ink3)'}">
          ${s.done?'●':'○'}</div>
        <div style="flex:1;min-width:0">
          <div style="font-weight:${s.done?'700':'600'};color:${s.done?'var(--ink)':'var(--ink2)'}">${a.n}</div>
          <div class="muted" style="font-size:12px">${a.d}</div>
          ${s.done ? '' : `<div class="bar" style="margin-top:5px;height:4px"><i style="transform:scaleX(${s.pct.toFixed(3)});background:linear-gradient(90deg,#6d9445,#9dc46a)"></i></div>`}
        </div>
        <div class="muted" style="font-size:11px;white-space:nowrap;padding-top:2px">
          ${s.done ? 'done' : `${fmtN(s.now)} / ${fmtN(s.at)}`}</div>
      </div>`;
    });
  });

  h += `<div class="mfoot"><button class="btn ghost" onclick="G.closeModal()">Close</button></div>`;
  modal(h);
};

/* the button, mounted the same way the Donate chip is */
setTimeout(()=>{
  const bar = document.querySelector('.tbtn') && document.querySelector('.tbtn').parentElement;
  if(!bar || document.getElementById('ambbtn')) return;
  const b = document.createElement('button');
  b.id = 'ambbtn'; b.className = 'tbtn';
  b.textContent = '◎ Ambitions';
  b.dataset.tip = '<b>Ambitions</b>What you are working toward, and what you have already done.';
  b.addEventListener('click', ()=>G.openAmbitions());
  bar.appendChild(b);
}, 560);

/* ---------- handle ---------- */
G.ambAudit = function(){
  return {
    done: ambDoneCount() + '/' + AMBITIONS.length,
    rows: AMBITIONS.map(a=>{ const s=ambState(a);
      return `${s.done?'[x]':'[ ]'} ${a.g} · ${a.n}: ${Math.round(s.now)}/${s.at}`; }),
  };
};
