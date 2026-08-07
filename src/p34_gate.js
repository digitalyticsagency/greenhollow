/* =====================================================================
   SHAREWARE GATE, OWNER PANEL, AND PLAY ANALYSIS

   Three separate things, kept honest about what each can and cannot do.

   1. A thirty-minute trial on shared copies. This is an honour-system
      nag, not DRM: it lives in localStorage, so devtools, a private
      window or clearing site data resets it. Anyone who wants past it
      gets past it. It is here to prompt people who would happily pay,
      not to stop people who would not.

   2. An owner panel of real play statistics — for THIS browser only.
      A published artifact is sealed: it cannot phone home, so it cannot
      possibly know what other people did with a link you shared. The
      panel says so on its face rather than implying otherwise.

   3. An analysis of that play which reads the actual save and suggests
      what to build next and what is going wrong.
   ===================================================================== */

/* ------------------------------------------------------------------
   PASTE YOUR PAYPAL LINK HERE
   e.g. 'https://paypal.me/yourhandle/5'
   While this is empty the pay button stays disabled, so nobody can
   send money to the wrong account.
   ------------------------------------------------------------------ */
const PAYPAL_LINK = 'https://www.paypal.com/ncp/payment/GL6SLJKVCLHBY';

const TRIAL_MS   = 30 * 60 * 1000;      // thirty minutes of actual play
const GATE_KEY   = 'greenhollow_play';

/* The owner runs the file locally; shared copies are served over http(s).
   So the gate applies to people you share with, not to you. */
function gateApplies(){
  if(location.protocol === 'file:') return false;
  return !PLAY.unlocked;
}

const PLAY = (function loadPlay(){
  let d = {};
  try { d = JSON.parse(localStorage.getItem(GATE_KEY) || '{}'); } catch(e){ d = {}; }
  return {
    ms:        d.ms        || 0,      // cumulative milliseconds played
    sessions:  d.sessions  || 0,
    firstSeen: d.firstSeen || Date.now(),
    lastSeen:  d.lastSeen  || Date.now(),
    unlocked:  !!d.unlocked,
    prompted:  d.prompted  || 0,      // times the gate has been shown
  };
})();

function savePlay(){
  try { localStorage.setItem(GATE_KEY, JSON.stringify(PLAY)); } catch(e){}
}

PLAY.sessions++;
PLAY.lastSeen = Date.now();
savePlay();

/* count only time the tab is actually in front and the sim is running */
let gateLast = performance.now();
function tickGate(){
  const now = performance.now();
  const dt = now - gateLast;
  gateLast = now;
  if(document.hidden) return;
  if(typeof S === 'undefined' || !S) return;
  PLAY.ms += dt;
  PLAY.lastSeen = Date.now();
  if(PLAY.ms % 5000 < 40) savePlay();
  if(gateApplies() && PLAY.ms >= TRIAL_MS) showGate();
}
setInterval(tickGate, 1000);

function fmtDur(ms){
  const m = Math.floor(ms/60000), h = Math.floor(m/60);
  return h ? `${h}h ${m%60}m` : `${m}m`;
}

/* ---------- the lock ---------- */
let gateShown = false;
function showGate(){
  if(gateShown) return;
  gateShown = true;
  if(typeof S !== 'undefined' && S) S.speed = 0;      // stop the world
  PLAY.prompted++; savePlay();

  const paid = PAYPAL_LINK && /^https:\/\//.test(PAYPAL_LINK);
  const el = document.createElement('div');
  el.id = 'gateWrap';
  el.innerHTML = `
    <div class="gateCard">
      <div class="gateMark">🌱</div>
      <h2>You have played 30 minutes of Greenhollow</h2>
      <p>The free trial ends here. If you have enjoyed it, five dollars keeps
      the farm going and unlocks the rest — the seasons, the upgrades, the
      whole homestead.</p>
      ${paid
        ? `<a class="gateBtn pay" href="${PAYPAL_LINK}" target="_blank" rel="noopener noreferrer">
             Continue with PayPal</a>`
        : `<button class="gateBtn pay" disabled title="The owner has not set a PayPal link yet">
             PayPal link not set up yet</button>`}
      <button class="gateBtn ghost" onclick="G.gateUnlock()">I have donated — unlock</button>
      <p class="gateFine">Unlocking is on trust: the game cannot verify a payment on its own.
      Your farm is saved either way.</p>
    </div>`;
  document.body.appendChild(el);
  if(typeof sfx === 'function') sfx('error');
}

G.gateUnlock = function(){
  PLAY.unlocked = true; savePlay();
  const w = document.getElementById('gateWrap'); if(w) w.remove();
  gateShown = false;
  if(typeof S !== 'undefined' && S) S.speed = 1;
  if(typeof toast === 'function') toast('Unlocked — thank you', 'gold');
  if(typeof sfx === 'function') sfx('level');
};

/* ---------- owner panel: real numbers, this browser only ---------- */
function ownerStats(){
  const byCat = {};
  (S.objs || []).forEach(o=>{
    const bp = BPMAP[o.bp]; if(!bp) return;
    const c = bp.cat || bp.kind || 'other';
    byCat[c] = (byCat[c] || 0) + 1;
  });
  const tiers = (S.objs || []).reduce((a,o)=> a + (o.tier||0), 0);
  return {
    played:    PLAY.ms,
    sessions:  PLAY.sessions,
    firstSeen: PLAY.firstSeen,
    prompted:  PLAY.prompted,
    unlocked:  PLAY.unlocked,
    day:       S.day || 0,
    level:     S.level || 1,
    cash:      S.cash || 0,
    earned:    S.totalEarned || 0,
    objects:   (S.objs || []).length,
    upgrades:  tiers,
    family:    (S.family || []).length,
    workers:   (S.workers || []).length,
    byCat,
  };
}

/* ---------- the analysis ---------- */
/* Reads the save and reports what is actually wrong or missing, ordered
   by how much it costs the player. No invented data. */
function playAnalysis(){
  const st = ownerStats();
  const out = [];
  const has = art => (S.objs || []).some(o => (BPMAP[o.bp]||{}).art === art);
  const countKind = k => (S.objs || []).filter(o => (BPMAP[o.bp]||{}).kind === k).length;

  /* survival first */
  if(st.cash < 200)
    out.push({sev:'high', t:'Cash is low',
      d:`${fmt(st.cash)} left. Bills land monthly whether or not the farm earns. Sell stock or take on a job before payday.`});

  /* stat() is the engine's own reckoning - short is the flag the sim uses */
  if(typeof stat === 'function'){
    try { const p = stat(); if(p && p.short)
      out.push({sev:'high', t:'Short of power',
        d:`Generating ${p.power}kW against ${p.use}kW of demand. Greenhouses and workshops drop to 40% until you add solar or a battery.`}); } catch(e){}
  }

  if(!has('lightning_rod') && countKind('animal') > 0)
    out.push({sev:'high', t:'No lightning rod',
      d:`You keep animals and have no rod. A storm strike has a 40% chance of killing one.`});

  /* yield and economy */
  if(!has('compost') && countKind('plot') > 0)
    out.push({sev:'med', t:'No compost',
      d:'Compost lifts bed yield and costs nothing to run. With '+countKind('plot')+' beds it pays for itself quickly.'});

  if(!has('tank') && !has('pond'))
    out.push({sev:'med', t:'No water storage',
      d:'Rain tanks turn wet weather into irrigation. Without them a dry spell stalls every crop.'});

  if(countKind('plot') > 0 && countKind('process') === 0)
    out.push({sev:'med', t:'Selling raw produce',
      d:'A jam kitchen or dairy turns cheap produce into goods worth several times more.'});

  if(st.upgrades === 0 && st.objects > 4)
    out.push({sev:'med', t:'Nothing upgraded yet',
      d:'Every building has four tiers. Mk II is usually the cheapest yield you can buy, and the structure visibly changes.'});

  /* people */
  if(st.family > 0 && !has('playground') && !has('deck'))
    out.push({sev:'low', t:'Nothing for the family to do',
      d:'Recreation keeps the household content and gives the children somewhere to go in the afternoon.'});

  if(st.workers === 0 && st.objects > 12)
    out.push({sev:'low', t:'Working the farm alone',
      d:'A farmhand costs wages but covers jobs while you are busy. Worth it past a dozen buildings.'});

  /* engagement */
  if(st.day > 20 && countKind('tourism') === 0)
    out.push({sev:'low', t:'No visitor income',
      d:'Tourism earns without planting anything. A tea kiosk or glamping tent pays on charm alone.'});

  if(!out.length)
    out.push({sev:'low', t:'Nothing obvious to fix',
      d:'The farm is in good order. Push a building to Mk IV, or expand the land and start a second block.'});

  return out;
}

function ownerPanelHTML(){
  const st = ownerStats();
  const an = playAnalysis();
  const sev = {high:'#e0664f', med:'#f0a24b', low:'#7cc24f'};
  const row = (k,v)=>`<div class="tl"><span>${k}</span><b>${v}</b></div>`;
  const cats = Object.keys(st.byCat).sort((a,b)=>st.byCat[b]-st.byCat[a])
    .map(c=>`<span class="ochip">${c} <b>${st.byCat[c]}</b></span>`).join('');
  return `
  <div class="pcard">
    <h3>This browser</h3>
    <p class="sub">A published page is sealed off — it cannot report back to you.
    These numbers are this browser only, and say nothing about people you shared a link with.
    For real visitor figures use the analytics on the GitHub Pages copy.</p>
    ${row('Time played', fmtDur(st.played))}
    ${row('Sessions', st.sessions)}
    ${row('First opened', new Date(st.firstSeen).toLocaleDateString())}
    ${row('Trial prompt shown', st.prompted + (st.unlocked ? ' · unlocked' : ''))}
  </div>
  <div class="pcard">
    <h3>This farm</h3>
    ${row('Day', st.day)}${row('Level', st.level)}
    ${row('Cash', fmt(st.cash))}${row('Earned all up', fmt(st.earned))}
    ${row('Buildings', st.objects)}${row('Upgrade levels bought', st.upgrades)}
    ${row('Household', st.family + ' family · ' + st.workers + ' hired')}
    <div class="ochips">${cats || '<span class="muted">nothing built yet</span>'}</div>
  </div>
  <div class="pcard">
    <h3>What to improve</h3>
    <p class="sub">Read from your actual save, ordered by what it is costing you.</p>
    ${an.map(a=>`<div class="oadv" style="--sev:${sev[a.sev]}">
      <b>${a.t}</b><span>${a.d}</span></div>`).join('')}
  </div>
  <div class="pcard">
    <button class="btn ghost" onclick="G.exportStats()">Download these stats as CSV</button>
  </div>`;
}

G.exportStats = function(){
  const st = ownerStats();
  const rows = [['metric','value'],
    ['time_played_minutes', Math.round(st.played/60000)],
    ['sessions', st.sessions],
    ['first_seen', new Date(st.firstSeen).toISOString()],
    ['trial_prompted', st.prompted],
    ['unlocked', st.unlocked],
    ['day', st.day], ['level', st.level],
    ['cash', st.cash], ['total_earned', st.earned],
    ['buildings', st.objects], ['upgrade_levels', st.upgrades],
    ['family', st.family], ['workers', st.workers]];
  Object.keys(st.byCat).forEach(c=>rows.push(['built_'+c, st.byCat[c]]));
  const csv = rows.map(r=>r.join(',')).join('\n');
  /* the artifact runtime offers a real save dialog; a blob link elsewhere */
  if(window.claude && window.claude.downloads && window.claude.downloads.save){
    window.claude.downloads.save({filename:'greenhollow-stats.csv', data:csv})
      .then(()=>toast('Stats saved','good'))
      .catch(()=>toast('Save cancelled',''));
    return;
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], {type:'text/csv'}));
  a.download = 'greenhollow-stats.csv';
  a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href), 4000);
  toast('Stats downloaded','good');
};

/* a tab for it, next to the others */
setTimeout(()=>{
  const tabs = document.querySelector('.ptabs');
  if(!tabs || tabs.querySelector('[data-rt="owner"]')) return;
  const b = document.createElement('button');
  b.className = 'ptab'; b.dataset.rt = 'owner'; b.textContent = 'Stats';
  b.dataset.tip = '<b>Your play stats</b>Time played on this browser, plus what the farm needs next.';
  b.addEventListener('click', ()=>{ rightTab='owner'; syncTabs(); renderRight(); sfx('click'); });
  tabs.appendChild(b);
}, 460);

const _renderRightOwner = renderRight;
renderRight = function(){
  if(rightTab === 'owner'){
    const b = document.getElementById('rightBody');
    if(b){ b.innerHTML = ownerPanelHTML(); return; }
  }
  return _renderRightOwner.apply(this, arguments);
};

(function gateCss(){
  const s = document.createElement('style');
  s.textContent = `
  #gateWrap{position:fixed;inset:0;z-index:99999;display:flex;align-items:center;
    justify-content:center;padding:20px;background:rgba(8,14,10,.82);
    backdrop-filter:blur(6px);}
  .gateCard{max-width:420px;width:100%;background:#1b2416;border:1px solid #3d4a33;
    border-radius:18px;padding:26px;text-align:center;color:#e6ecdf;
    box-shadow:0 24px 60px rgba(0,0,0,.5);}
  .gateMark{font-size:40px;margin-bottom:6px;}
  .gateCard h2{margin:0 0 10px;font-size:19px;line-height:1.3;}
  .gateCard p{margin:0 0 16px;font-size:13px;line-height:1.55;color:#b9c4ae;}
  .gateBtn{display:block;width:100%;padding:12px;border-radius:11px;margin-bottom:9px;
    font-size:14px;font-weight:700;cursor:pointer;border:1px solid transparent;
    text-decoration:none;}
  .gateBtn.pay{background:linear-gradient(180deg,#4d8f3c,#3a6f2c);color:#fff;border-color:#5fae48;}
  .gateBtn.pay[disabled]{background:#39422f;border-color:#4a5540;color:#8b9680;cursor:not-allowed;}
  .gateBtn.ghost{background:transparent;border-color:#4a5540;color:#c6d1ba;}
  .gateBtn.ghost:hover{background:rgba(255,255,255,.06);}
  .gateFine{font-size:11px !important;color:#8b9680 !important;margin:6px 0 0 !important;}
  /* .tl is a tooltip row elsewhere; inside the panel it needs to lay out
     as a labelled line or the label and value run together */
  #rightBody .pcard .tl{display:flex;justify-content:space-between;align-items:baseline;
    gap:10px;padding:3px 0;border-bottom:1px solid rgba(255,255,255,.05);font-size:12px;}
  #rightBody .pcard .tl:last-of-type{border-bottom:none;}
  #rightBody .pcard .tl span{color:#b9c4ae;}
  #rightBody .pcard .tl b{white-space:nowrap;}
  .ochips{display:flex;flex-wrap:wrap;gap:5px;margin-top:8px;}
  .ochip{background:rgba(255,255,255,.07);border-radius:7px;padding:3px 8px;font-size:11px;}
  .oadv{padding:7px 0;margin-bottom:9px;border-bottom:1px solid rgba(255,255,255,.06);}
  .oadv:last-of-type{border-bottom:none;}
  /* severity reads from a small dot beside the heading rather than a
     slab down the side - same information, less of a template tell */
  .oadv b{display:flex;align-items:center;gap:6px;font-size:12.5px;margin-bottom:2px;}
  .oadv b::before{content:'';width:6px;height:6px;border-radius:50%;
    background:var(--sev,#7cc24f);flex:0 0 auto;}
  .oadv span{font-size:11.5px;color:#b9c4ae;line-height:1.5;}
  `;
  document.head.appendChild(s);
})();
