/* =====================================================================
   OFF-GRID vs WORK-FROM-HOME

   Not everyone wants a second job. At the start we ask outright, and
   answering "no" removes the whole career system rather than leaving a
   dead tab sitting there. It stays reversible from Settings, because
   plenty of people change their mind three hours in.

   Going off-grid is genuinely harder: no salary lands each month, but
   the bills still do. What you get back is every waking hour for the
   land, which is the trade the mode is actually about.
   ===================================================================== */

function wfhOn(){ return !S.settings || S.settings.wfh !== false; }

/* the setting, so the choice is never a one-way door */
(function addWfhSetting(){
  if(SETTINGS.some(o=>o.k==='wfh')) return;
  const i = SETTINGS.findIndex(o=>o.g==='Gameplay');
  SETTINGS.splice(i < 0 ? 0 : i+1, 0, {
    g:'Gameplay', k:'wfh', n:'Work from home', t:'bool', def:true,
    d:'Off: no salary and no clients, but every hour is yours. Bills still arrive.'
  });
})();

/* --- the question itself, asked after the house is chosen --- */
function wfhChooser(){
  const l  = LANDMAP[S.pendingLand] || LANDS[0];
  const hm = HOMEMAP[S.pendingHome] || HOMES[0];
  const p  = PROFS[0];
  return `<h2>How will you pay for it?</h2>
    <p class="sub">You have chosen <b>${esc(hm.name)}</b> on <b>${esc(l.name)}</b>.
    Before you break ground: is the farm the whole plan, or do you keep a job you can
    do from the kitchen table? You can change this later in Settings.</p>
    <div class="wfhpick">
      <button class="wfhcard" onclick="G.pickWfh(1)">
        <span class="wfhic">${wfhDeskArt()}</span>
        <b>I work from home too</b>
        <span class="muted">A salary lands every month and clients send work.
        Hours you bill are hours the farm does not get. Starts you as a
        ${esc(p.name)} — ${PROFS.length} professions to switch between.</span>
        <span class="lprice">${fmt(p.pay)}/mo to start</span>
      </button>
      <button class="wfhcard" onclick="G.pickWfh(0)">
        <span class="wfhic">${wfhOffgridArt()}</span>
        <b>Off-grid — the farm is the income</b>
        <span class="muted">No salary, no clients, no Work tab. Rates, feed and
        upkeep still fall due every month, so the land has to carry you.
        Every hour of the day is yours to spend outside.</span>
        <span class="lprice warn">Harder — bills without a wage</span>
      </button>
    </div>
    <p class="sub" style="margin-top:10px">Either way you can flip
    <b>Settings → Gameplay → Work from home</b> whenever you like.</p>`;
}

/* two small illustrations so the choice reads at a glance */
function wfhDeskArt(){
  return `<svg viewBox="0 0 64 44" width="64" height="44">
    <rect x="6" y="30" width="52" height="3" rx="1.5" fill="#8a6a4a"/>
    <rect x="10" y="33" width="3" height="9" fill="#6f543a"/>
    <rect x="51" y="33" width="3" height="9" fill="#6f543a"/>
    <rect x="20" y="12" width="26" height="17" rx="2" fill="#2f3a45"/>
    <rect x="22" y="14" width="22" height="13" rx="1" fill="#6fb6d8"/>
    <rect x="26" y="16" width="14" height="2" rx="1" fill="#bfe4f5" opacity=".8"/>
    <rect x="26" y="20" width="10" height="2" rx="1" fill="#bfe4f5" opacity=".55"/>
    <rect x="30" y="29" width="6" height="2" fill="#2f3a45"/>
    <circle cx="52" cy="24" r="4" fill="#7cc24f"/>
    <rect x="51" y="20" width="2" height="5" rx="1" fill="#5d9a3a"/>
  </svg>`;
}
function wfhOffgridArt(){
  return `<svg viewBox="0 0 64 44" width="64" height="44">
    <path d="M4 36 Q18 28 32 33 Q46 38 60 31" stroke="#7cc24f" stroke-width="3"
      fill="none" stroke-linecap="round"/>
    <path d="M14 33 L22 20 L30 33 Z" fill="#5d9a3a"/>
    <path d="M34 33 L42 16 L50 33 Z" fill="#4e8531"/>
    <circle cx="50" cy="12" r="6" fill="#f0c14b"/>
    <path d="M8 40 h48" stroke="#8a6a4a" stroke-width="3" stroke-linecap="round"/>
  </svg>`;
}

/* --- rewire the opening sequence: land -> house -> this --- */
G.pickHome = function(id){
  S.pendingHome = id;
  sfx('click');
  modal(wfhChooser());
};
G.pickWfh = function(yes){
  const l  = LANDMAP[S.pendingLand] || LANDS[0];
  const hm = HOMEMAP[S.pendingHome] || HOMES[0];
  startFarm(l, hm);
  settingsInit();
  S.settings.wfh = !!yes;
  G.closeModal();
  sfx('build');
  if(yes){
    log('You keep the day job. Salary lands monthly.','good');
  } else {
    log('Off-grid. No wage — the farm has to pay for itself.','warn');
    if(rightTab === 'work'){ rightTab = 'insp'; }
  }
  syncWorkTab();
  renderRight();
  G.save();
};

/* --- gate the career system itself --- */
const _salary = salary;
salary = function(){ return wfhOn() ? _salary() : 0; };

const _rollJobs = (typeof rollJobs === 'function') ? rollJobs : null;
if(_rollJobs) rollJobs = function(){ if(!wfhOn()){ if(S.career) S.career.jobs = []; return; } return _rollJobs(); };

/* off-grid gives the day back: no billable hours are ever consumed */
const _hoursLeft = hoursLeft;
hoursLeft = function(){ return wfhOn() ? _hoursLeft() : 24; };

/* the monthly line should not claim a payday that never happened */
const _monthly = monthlyReckoning;
monthlyReckoning = function(){
  if(wfhOn()) return _monthly();
  careerInit();
  const out = outgoings();
  S.cash -= out.total;
  const c = S.career;
  if(c.loan > 0){
    const repay = Math.min(c.loan, Math.round(c.loan*0.08));
    if(S.cash > repay){ S.cash -= repay; c.loan -= repay; }
  }
  log(`Bills due: ${fmt(out.total)}. No wage — off-grid.`, S.cash > 0 ? 'warn' : 'bad');
  toast(`Bills ${fmt(out.total)} · off-grid`, S.cash > 0 ? 'warn' : 'bad');
  sfx('error');
};

/* --- hide the Work tab when there is no work --- */
function syncWorkTab(){
  const b = document.querySelector('.ptab[data-rt="work"]');
  if(b) b.style.display = wfhOn() ? '' : 'none';
  if(!wfhOn() && rightTab === 'work'){ rightTab = 'insp'; syncTabs(); }
}

/* if they turn it off from Settings, react immediately */
const _setOpt = setOpt;
setOpt = function(k, v){
  const r = _setOpt(k, v);
  if(k === 'wfh'){
    syncWorkTab();
    if(v){ log('Back on the payroll. Salary resumes next payday.','good'); }
    else { log('Off-grid from here. The farm carries the bills.','warn'); }
    renderRight();
  }
  return r;
};

/* the panel still exists for anyone who lands on it mid-transition */
const _careerHTML = careerHTML;
careerHTML = function(){
  if(wfhOn()) return _careerHTML();
  return `<div class="pcard">
    <h3>Off-grid</h3>
    <p class="sub">You chose to live off the land, so there is no salary, no clients
    and no billable hours — every hour of every day goes to the farm. Rates, feed
    and upkeep still fall due each month.</p>
    <button class="btn" onclick="setOpt('wfh',true);rightTab='work';syncTabs();renderRight()">
      Take on work from home</button>
  </div>`;
};

(function wfhCss(){
  const s = document.createElement('style');
  s.textContent = `
  .wfhpick{display:grid;gap:10px;grid-template-columns:1fr 1fr;margin-top:4px;}
  @media(max-width:640px){ .wfhpick{grid-template-columns:1fr;} }
  .wfhcard{display:flex;flex-direction:column;align-items:flex-start;gap:6px;
    padding:14px;border-radius:14px;text-align:left;cursor:pointer;
    background:var(--pan2,#ffffff0d);border:1px solid var(--line,#ffffff1f);
    transition:transform .12s ease, border-color .12s ease, background .12s ease;}
  .wfhcard:hover{transform:translateY(-2px);border-color:var(--acc,#7cc24f);
    background:var(--pan3,#ffffff14);}
  .wfhcard b{font-size:14px;}
  .wfhcard .muted{font-size:11.5px;line-height:1.45;}
  .wfhic{display:block;margin-bottom:2px;}
  .wfhcard .lprice{margin-top:auto;padding-top:6px;font-weight:700;font-size:12px;}
  .wfhcard .lprice.warn{color:#f0a24b;}`;
  document.head.appendChild(s);
})();

/* existing saves predate the question: they keep their career */
(function migrate(){
  if(typeof S === 'undefined' || !S) return;
  settingsInit();
  if(S.settings.wfh === undefined) S.settings.wfh = true;
  setTimeout(syncWorkTab, 300);
})();
