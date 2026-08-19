/* =====================================================================
   A UTE THAT BREAKS DOWN

   Farmhands do 2 + skill jobs a day and that is the whole of it — a
   thirty acre block and a five acre one are worked at the same speed by
   the same pair of hands carrying the same buckets. What is missing is
   the thing every real holding has and every real holding argues about:
   a vehicle.

   THREE WAYS TO HAVE ONE, which is the actual decision.

     Own it     $4,800 up front. Yours, always there, and it is your
                problem when it stops.
     Hire       $180 a day, a week at a time. Somebody else's problem,
                and it costs more than owning if you keep doing it.
     Share      $1,600 for a half share with the neighbour. Cheap, but
                roughly one day in four he has it, and you find that out
                on the morning you needed it.

   IT WEARS. Every day it works takes condition off it, faster with more
   hands using it. Below about a third it starts failing, and a failure is
   not a warning — it is out of action until you pay for the repair, which
   costs more than the service you did not do. Service it at any time for
   a fraction of that. This is the whole of the maintenance argument in
   two numbers, and the game already has the calendar to make you regret
   the choice.

   WHAT IT IS WORTH. Two extra jobs a day per farmhand, so a pair of hands
   go from six jobs to ten. That is what a vehicle is for: not doing the
   work, carrying it.
   ===================================================================== */

/* ---------- the machine ---------- */
(function uteBlueprint(){
  if(typeof BP === 'undefined' || BPMAP.ute) return;
  const bp = { id:'ute', name:'Farm ute', art:'ute', cat:'auto',
    w:2, h:1, cost:4800, lvl:2, kind:'bonus', charm:1,
    desc:'A flatbed that has already had one life somewhere else.',
    tip:'Two more jobs a day for every farmhand. Wears out, and lets you know at the worst time.' };
  BP.push(bp); BPMAP[bp.id] = bp;
})();
if(typeof ART === 'object' && !ART.ute){
  ART.ute = (w,h,o)=>{
    const broken = o && o.broken;
    const body = broken ? '#7d6a58' : '#8c5f4a';
    let s = patch(w, h, '#9aa0a2', 41, 2);
    s += ao(w*0.06, h*0.18, w*0.88, h*0.66, 0.3);
    /* tray, cab, glass, wheels — read from above */
    s += `<rect x="${n(w*0.06)}" y="${n(h*0.24)}" width="${n(w*0.88)}" height="${n(h*0.52)}" rx="3" fill="${body}"/>`;
    s += `<rect x="${n(w*0.06)}" y="${n(h*0.24)}" width="${n(w*0.88)}" height="${n(h*0.16)}" rx="3" fill="#fff" opacity=".14"/>`;
    s += `<rect x="${n(w*0.10)}" y="${n(h*0.30)}" width="${n(w*0.34)}" height="${n(h*0.40)}" rx="2" fill="#5c4636"/>`;
    s += `<rect x="${n(w*0.50)}" y="${n(h*0.30)}" width="${n(w*0.30)}" height="${n(h*0.40)}" rx="2" fill="url(#gGlass)" opacity=".9"/>`;
    [0.22, 0.78].forEach(fx=>{ [0.20, 0.80].forEach(fy=>{
      s += `<rect x="${n(w*fx-3)}" y="${n(h*fy-2.4)}" width="6" height="4.8" rx="1.6" fill="#2a2a2e"/>`; }); });
    if(broken){
      s += `<path d="M${n(w*0.62)} ${n(h*0.16)} q3 -6 6 -2 q3 4 6 -1" stroke="#9aa6ad"
        stroke-width="1.6" fill="none" opacity=".8"/>`;
      s += `<circle cx="${n(w*0.88)}" cy="${n(h*0.14)}" r="2.4" fill="#e2705c"/>`;
    }
    return s;
  };
}

function machState(){
  if(!S.mach) S.mach = { hire:0, share:0, shareDay:-1, day:-1, told:false };
  return S.mach;
}
function uteObjs(){ return (S.objs || []).filter(o=>o.bp === 'ute'); }

/* the neighbour has it about one day in four, and you find out that morning */
function shareAvailable(){
  const M = machState();
  if(M.share <= 0) return false;
  if(M.shareDay !== S.day){
    M.shareDay = S.day;
    M.shareToday = hash((S.day || 1) * 3.77) > 0.26;
  }
  return !!M.shareToday;
}

/* is there a machine you can actually use today */
function machineWorking(){
  const M = machState();
  const own = uteObjs().find(o=>!o.broken);
  if(own) return { how:'own', o:own, condition:(own.cond === undefined ? 1 : own.cond) };
  if(M.hire > 0) return { how:'hire', condition:1 };
  if(shareAvailable()) return { how:'share', condition:0.8 };
  return null;
}

const MACH_BOOST = 2;                       /* extra jobs a day, per farmhand */

/* ---------- wear, failure and the day roll ---------- */
function machDay(){
  const M = machState();
  if(M.day === S.day) return;
  M.day = S.day;
  if(M.hire > 0){
    M.hire--;
    if(M.hire === 0 && typeof log === 'function')
      log('The hired ute went back this morning.', '', 'farm');
  }
  const hands = (S.workers || []).length;
  uteObjs().forEach(o=>{
    if(o.cond === undefined) o.cond = 1;
    if(o.broken) return;
    /* it only wears on days it is actually carrying something */
    /* Tuned against a measurement: at 0.012 + 0.009 a hand it warned on day
       22 and failed on day 36, which is five weeks out of a $4,800 machine
       and reads as a punishment rather than maintenance. At these numbers a
       pair of hands get about eleven weeks before the warning and a little
       over three months before it fails, so servicing is a thing you do
       twice a season rather than constantly. */
    const use = 0.005 + hands * 0.0035;
    o.cond = Math.max(0, o.cond - use);
    const risk = o.cond > 0.34 ? 0 : (0.34 - o.cond) * 0.55;
    if(Math.random() < risk){
      o.broken = 1;
      if(typeof log === 'function')
        log(`The ute has stopped. ${fmt(machRepairCost(o))} to put right, and nothing is being `
          + `carried until it is.`, 'bad', 'farm');
      if(typeof toast === 'function') toast('The ute has broken down', 'bad');
      try{ sfx('error'); }catch(e){}
    } else if(o.cond < 0.34 && !o.warned){
      o.warned = 1;
      if(typeof log === 'function')
        log('The ute is due a service. It will not ask twice.', 'bad', 'farm');
    }
  });
}
function machServiceCost(o){ return Math.round(140 + (1 - (o.cond === undefined ? 1 : o.cond)) * 520); }
function machRepairCost(o){ return Math.round(900 + (1 - (o.cond === undefined ? 1 : o.cond)) * 900); }

if(typeof tickPeople === 'function'){
  const _tickMach = tickPeople;
  tickPeople = function(){
    const r = _tickMach.apply(this, arguments);
    try{ machDay(); }catch(e){}
    return r;
  };
}

/* ---------- what it is for ---------- */
if(typeof workersDay === 'function'){
  const _workersDayMach = workersDay;
  workersDay = function(){
    const m = machineWorking();
    if(!m) return _workersDayMach.apply(this, arguments);
    /* the budget in workersDay is 2 + skill, so lifting skill for the
       duration of the call is the least invasive way to give them a
       vehicle without reimplementing the day */
    const hands = S.workers || [];
    const keep = hands.map(w=>w.skill);
    hands.forEach(w=>{ w.skill = (w.skill || 0) + MACH_BOOST; });
    let r;
    try{ r = _workersDayMach.apply(this, arguments); }
    finally{ hands.forEach((w,i)=>{ w.skill = keep[i]; }); }
    return r;
  };
}

/* ---------- the yard ---------- */
G.openMachinery = function(){
  const M = machState();
  const own = uteObjs();
  const m = machineWorking();
  const rows = own.map(o=>{
    const c = o.cond === undefined ? 1 : o.cond;
    return `<div class="row"><span>Farm ute${o.broken ? ' <span class="cbad">— broken down</span>' : ''}</span>
      <b>${Math.round(c*100)}%</b></div>`;
  }).join('');
  modal(`<h2>The yard</h2>
    <p class="sub">${m ? `A machine is available today — ${
        m.how === 'own' ? 'your own' : m.how === 'hire' ? 'the hired one' : "the neighbour's"}. `
        + `Every farmhand does ${MACH_BOOST} more jobs a day.`
      : 'Nothing to carry with today. Farmhands are on foot.'}</p>
    ${rows ? `<div class="rows">${rows}</div>` : ''}
    <div class="mkgrid">
      ${own.map((o,i)=>o.broken
        ? `<button class="mkcard" ${S.cash < machRepairCost(o) ? 'disabled':''}
            onclick="G.fixUte(${i})"><b>Repair it</b>
            <span class="muted">It will not move until this is paid.</span>
            <span class="lprice">${fmt(machRepairCost(o))}</span></button>`
        : `<button class="mkcard" ${S.cash < machServiceCost(o) ? 'disabled':''}
            onclick="G.serviceUte(${i})"><b>Service it</b>
            <span class="muted">Oil, filters, and the brakes looked at. Back to as good as it gets.</span>
            <span class="lprice">${fmt(machServiceCost(o))}</span></button>`).join('')}
      <button class="mkcard" ${S.cash < 1260 || M.hire > 0 ? 'disabled':''} onclick="G.hireUte()">
        <b>Hire one for a week</b>
        <span class="muted">${M.hire > 0 ? `${M.hire} day${M.hire>1?'s':''} left on the current hire.`
          : 'Somebody else services it. Cheap once, dear as a habit.'}</span>
        <span class="lprice">${fmt(1260)}</span></button>
      <button class="mkcard" ${S.cash < 1600 || M.share > 0 ? 'disabled':''} onclick="G.shareUte()">
        <b>Half share with the neighbour</b>
        <span class="muted">${M.share > 0
          ? (shareAvailable() ? 'Yours today.' : 'He has it today.')
          : 'Half the cost of owning. He has it about one day in four.'}</span>
        <span class="lprice">${M.share > 0 ? 'Held' : fmt(1600)}</span></button>
    </div>
    <div class="mfoot"><button class="btn ghost" onclick="G.closeModal()">Shut the shed</button></div>`);
};
G.serviceUte = function(i){
  const o = uteObjs()[i]; if(!o) return;
  const c = machServiceCost(o);
  if(S.cash < c) return toast('Not enough for the service','bad');
  S.cash -= c; o.cond = 1; o.warned = 0;
  if(typeof log === 'function') log(`Serviced the ute, ${fmt(c)}.`, '', 'money');
  try{ sfx('build'); }catch(e){}
  G.openMachinery();
};
G.fixUte = function(i){
  const o = uteObjs()[i]; if(!o) return;
  const c = machRepairCost(o);
  if(S.cash < c) return toast('Not enough for the repair','bad');
  S.cash -= c; o.broken = 0; o.cond = 0.85; o.warned = 0;
  if(typeof log === 'function') log(`Repaired the ute, ${fmt(c)}. Cheaper to have serviced it.`, 'bad', 'money');
  try{ sfx('build'); }catch(e){}
  if(typeof render === 'function') render();
  G.openMachinery();
};
G.hireUte = function(){
  if(S.cash < 1260) return toast('Not enough to hire','bad');
  S.cash -= 1260; machState().hire = 7;
  if(typeof log === 'function') log('Hired a ute for the week.', '', 'money');
  G.openMachinery();
};
G.shareUte = function(){
  if(S.cash < 1600) return toast('Not enough for a half share','bad');
  S.cash -= 1600; machState().share = 1;
  if(typeof log === 'function')
    log('Went halves with the neighbour on a ute. He gets it when he needs it.', '', 'money');
  G.openMachinery();
};

if(typeof syncWorldButtons === 'function'){
  const _syncMach = syncWorldButtons;
  syncWorldButtons = function(){
    const r = _syncMach.apply(this, arguments);
    try{
      const host = document.getElementById('zoomctl');
      if(host && !document.getElementById('machbtn')){
        const b = document.createElement('button');
        b.id = 'machbtn'; b.textContent = '🛻';
        b.title = 'The yard';
        b.setAttribute('data-tip','<b>The yard</b>Own, hire or share a ute — and keep it running.');
        b.onclick = ()=>G.openMachinery();
        host.insertBefore(b, host.firstChild);
      }
      const b2 = document.getElementById('machbtn');
      const M = machState();
      if(b2) b2.style.display = (uteObjs().length || M.hire > 0 || M.share > 0 ||
        (S.workers || []).length) ? '' : 'none';
    }catch(e){}
    return r;
  };
}

/* ---------- handle ---------- */
G.machineryAudit = function(){
  const M = machState();
  const m = machineWorking();
  return {
    owned: uteObjs().map(o=>({ condition:Math.round((o.cond === undefined ? 1 : o.cond)*100) + '%',
      broken:!!o.broken, service:fmt(machServiceCost(o)), repair:fmt(machRepairCost(o)) })),
    hireDaysLeft: M.hire,
    halfShare: !!M.share,
    shareAvailableToday: M.share ? shareAvailable() : false,
    workingToday: m ? m.how : 'none',
    boostPerHand: m ? MACH_BOOST : 0,
    jobsPerHand: (S.workers || []).map(w=>(2 + (w.skill || 0) + (m ? MACH_BOOST : 0))),
  };
};
