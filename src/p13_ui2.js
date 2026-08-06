/* =====================================================================
   UI 2 — career, settings, coach, and the land/home chooser
   ===================================================================== */

/* ---------------- career panel ---------------- */
function careerHTML(){
  careerInit();
  const p = prof(), c = S.career, out = outgoings();
  const daysToPay = c.salaryDay - (S.day % c.salaryDay);
  const net = salary() - out.total;
  let h = `<div class="card">
    <div class="cardhead">
      <div><div class="eyebrow">Your work</div><b class="big">${p.name}</b>
      <div class="muted">${p.field} · skill ${c.skill} of ${p.ceil}</div></div>
      <button class="chip" onclick="G.openProfs()" data-tip="${esc('<b>Change career</b>Retraining costs about 60% of a month’s pay and knocks your skill back.')}">Change</button>
    </div>
    <div class="bar"><i style="transform:scaleX(${(c.cxp/skillNext()).toFixed(3)});background:linear-gradient(90deg,#4d8f3c,#7cc24f)"></i></div>
    <div class="muted" style="margin-top:4px">${c.cxp} / ${skillNext()} to next skill level</div>
  </div>

  <div class="card">
    <div class="eyebrow">Today</div>
    <div class="statrow"><span>Hours left</span><b class="${c.hours<2?'bad':''}">${c.hours.toFixed(1)}h</b></div>
    <div class="bar"><i style="transform:scaleX(${(c.hours/HOURS_PER_DAY).toFixed(3)});background:linear-gradient(90deg,#3f7f9c,#6fb6d8)"></i></div>
    <div class="muted" style="margin-top:5px">Farm jobs and client work draw on the same clock.</div>
    ${c.burnout>0.05?`<div class="warnbox">Burnout ${Math.round(c.burnout*100)}% — your pay is reduced. Work fewer billable hours.</div>`:''}
  </div>

  <div class="card">
    <div class="cardhead"><div><div class="eyebrow">Next payday</div>
      <b class="big">${fmt(salary())}</b><div class="muted">in ${daysToPay} day${daysToPay===1?'':'s'}</div></div>
      <div style="text-align:right"><div class="eyebrow">Monthly bills</div>
      <b class="big ${net<0?'bad':''}">−${fmt(out.total)}</b>
      <div class="muted">net ${net<0?'−':'+'}${fmt(Math.abs(net))}</div></div></div>
    <div class="ledger">
      ${ledger('Council rates', out.rates, 'Scales with how much you have built and upgraded.')}
      ${ledger('Upkeep', out.upkeep, 'Maintenance on every structure you own.')}
      ${ledger('AI service', out.ai, 'Daily module fees, billed monthly.')}
      ${ledger('Wages', out.wages, 'Hired hands, if any.')}
      ${ledger('Loan interest', out.interest, '4.5% a month on the outstanding balance.')}
    </div>
  </div>

  <div class="card">
    <div class="cardhead"><div><div class="eyebrow">Debt</div>
      <b class="big ${c.loan>0?'bad':''}">${fmt(c.loan)}</b></div>
      <div style="display:flex;gap:5px">
        <button class="chip" onclick="borrow(1000)" data-tip="${esc('<b>Borrow $1,000</b>Costs 4.5% a month until repaid.')}">Borrow 1k</button>
        <button class="chip" ${c.loan?'':'disabled'} onclick="repay(1000)">Repay 1k</button>
      </div></div>
  </div>

  <div class="ph">Client work available</div>`;
  if(!c.jobs.length) h += `<div class="empty">No briefs right now — check back tomorrow.</div>`;
  c.jobs.forEach(j=>{
    const afford = c.hours >= j.hrs;
    h += `<div class="job ${afford?'':'off'}" data-tip="${esc(`<b>${j.kind}</b>${j.who}<hr><div class="tl"><span>Takes</span><b>${j.hrs}h of your day</b></div><div class="tl"><span>Pays</span><span class="tk">${fmt(j.pay)}</span></div><div class="tl"><span>Effective rate</span><b>${fmt(j.pay/j.hrs)}/h</b></div><div class="tl"><span>Expires in</span><b>${j.left} day${j.left>1?'s':''}</b></div>`)}">
      <div class="jm"><b>${j.kind}</b><span class="muted">${j.who} · ${j.hrs}h · expires in ${j.left}d</span></div>
      <div class="jp">${fmt(j.pay)}</div>
      <button class="chip go" ${afford?'':'disabled'} onclick="takeJob('${j.id}')">Take</button></div>`;
  });
  return h;
}
function ledger(k,v,tip){
  return `<div class="ledrow" data-tip="${esc('<b>'+k+'</b>'+tip)}"><span>${k}</span><b>${fmt(v)}</b></div>`;
}

/* ---------------- coach ---------------- */
function coachHTML(){
  if(S.lvl < 2) return `<div class="empty"><div style="font-size:28px;margin-bottom:8px">🧭</div>
    <b>The coach unlocks at level 2</b>
    <div style="margin-top:6px">Harvest a few crops first — then it will read the whole farm and tell you
    what is costing you money.</div>
    <div style="margin-top:10px;color:var(--acc)">Level ${S.lvl} · ${S.xp}/${xpFor(S.lvl)} XP</div></div>`;
  if(S.settings && S.settings.aiHints === false)
    return `<div class="empty">The coach is switched off in Settings.</div>`;
  const tips = coachTips();
  return `<div class="card"><div class="eyebrow">What to do next</div>
    <div class="muted">Read from your farm right now, most urgent first.</div></div>` +
    tips.map((t,i)=>`<div class="tipcard p${t.p}">
      <div class="tipn">${i+1}</div>
      <div><b>${t.t}</b><span class="muted">${t.w}</span></div></div>`).join('');
}

/* ---------------- settings ---------------- */
function settingsHTML(){
  settingsInit();
  const groups = Array.from(new Set(SETTINGS.map(s=>s.g)));
  return groups.map(g=>`
    <div class="ph">${g}</div>
    ${SETTINGS.filter(s=>s.g===g).map(o=>{
      const v = S.settings[o.k];
      if(o.t==='bool') return `<div class="setrow" data-tip="${esc('<b>'+o.n.replace('&amp;','&')+'</b>'+(o.d||''))}">
        <span>${o.n}</span>
        <button class="sw ${v?'on':''}" onclick="setOpt('${o.k}', ${!v})" aria-label="${o.n}"></button></div>`;
      if(o.t==='range') return `<div class="setrow col" data-tip="${esc('<b>'+o.n.replace('&amp;','&')+'</b>'+(o.d||''))}">
        <div class="sl"><span>${o.n}</span><b>${v}${o.unit||''}</b></div>
        <input type="range" min="${o.min}" max="${o.max}" value="${v}" oninput="setOpt('${o.k}', +this.value)"></div>`;
      return `<div class="setrow col"><div class="sl"><span>${o.n}</span></div>
        <div class="segs">${o.opts.map(x=>`<button class="seg ${v===x?'on':''}" onclick="setOpt('${o.k}','${x}')">${x}</button>`).join('')}</div></div>`;
    }).join('')}`).join('') +
    `<div style="padding:12px"><button class="btn wide ghost" onclick="G.resetSettings()">Restore defaults</button></div>`;
}

/* ---------------- land & home chooser ---------------- */
let chooseFilter = {biome:'all', size:'all'};
function landChooser(){
  const biomes = ['all'].concat(BIOMES.map(b=>b.k));
  const list = LANDS.filter(l=>
    (chooseFilter.biome==='all'||l.biome===chooseFilter.biome) &&
    (chooseFilter.size==='all'||l.size===chooseFilter.size));
  return `<h2>Choose your land</h2>
    <p class="sub">${LANDS.length} places to farm. Climate, shape and size all follow the location —
    a mountain top is windier, colder and far more beautiful than moorland, and priced accordingly.</p>
    <div class="filters">
      ${biomes.map(b=>`<button class="chip ${chooseFilter.biome===b?'on':''}" onclick="G.filterLand('biome','${b}')">${b==='all'?'All places':BIOMES.find(x=>x.k===b).n}</button>`).join('')}
    </div>
    <div class="filters">
      ${['all'].concat(SIZES.map(s=>s.n)).map(s=>`<button class="chip ${chooseFilter.size===s?'on':''}" onclick="G.filterLand('size','${s}')">${s==='all'?'Any size':s}</button>`).join('')}
    </div>
    <div class="landgrid">
      ${list.slice(0,60).map(l=>`
        <button class="landcard" onclick="G.pickLand('${l.id}')"
          data-tip="${esc(`<b>${l.name}</b>${l.d}<hr><div class="tl"><span>Plot</span><b>${l.w}×${l.h} tiles · ${l.shape}</b></div><div class="tl"><span>Rain</span><b>${pct(l.rain)}</b></div><div class="tl"><span>Wind</span><b>${pct(l.wind)}</b></div><div class="tl"><span>Warmth</span><b>${pct(l.warm)}</b></div><div class="tl"><span>Sun</span><b>${pct(l.sun)}</b></div><div class="tl"><span>Base charm</span><b>+${l.charm}</b></div>`)}>
          <span class="lminimap">${landMini(l)}</span>
          <b>${l.name}</b>
          <span class="muted">${l.shape} · ${l.w}×${l.h}</span>
          <span class="lprice">${fmt(l.price)}</span>
        </button>`).join('')}
    </div>
    <div class="mfoot"><span class="muted">Showing ${Math.min(60,list.length)} of ${list.length}</span></div>`;
}
function pct(v){ return (v>0?'+':'')+Math.round(v*100)+'%'; }
function landMini(l){
  const c = {lake:'#4f93b5',pond:'#5da2b8',river:'#5f9ec4',hill:'#8aa85e',mount:'#9aa3ac',
    plateau:'#a3ab7e',valley:'#79a44e',coast:'#6fb6b8',forest:'#3f7a32',moor:'#8f8b62',
    orchard:'#7cb04a',oasis:'#c9b46a'}[l.biome] || '#79a44e';
  const ar = l.w/l.h;
  return `<svg viewBox="0 0 60 40"><rect width="60" height="40" rx="4" fill="#1b2416"/>
    <rect x="${(60-Math.min(52,52*ar/1.5))/2}" y="${(40-Math.min(30,30/Math.max(0.7,ar/1.5)))/2}"
      width="${Math.min(52,52*ar/1.5)}" height="${Math.min(30,30/Math.max(0.7,ar/1.5))}" rx="3" fill="${c}"/>
    <rect x="${(60-Math.min(52,52*ar/1.5))/2}" y="${(40-Math.min(30,30/Math.max(0.7,ar/1.5)))/2}"
      width="${Math.min(52,52*ar/1.5)}" height="${Math.min(30,30/Math.max(0.7,ar/1.5))}" rx="3"
      fill="none" stroke="#2c5220" stroke-width="2"/></svg>`;
}
function homeChooser(){
  const l = LANDMAP[S.pendingLand] || {};
  return `<h2>Choose your house</h2>
    <p class="sub">${HOMES.length} homes. The house sets your baseline charm and how much power the
    farm starts with — a solar package pays for itself, architectural pays visitors.</p>
    <div class="landgrid">
      ${HOMES.slice(0,60).map(hm=>`
        <button class="landcard" onclick="G.pickHome('${hm.id}')"
          data-tip="${esc(`<b>${hm.name}</b>${hm.d}<hr>${hm.fd}<hr><div class="tl"><span>Charm</span><b>+${hm.charm}</b></div><div class="tl"><span>Power</span><b>${hm.power} kW</b></div><div class="tl"><span>Price</span><span class="tk">${fmt(hm.price)}</span></div>`)}>
          <span class="lminimap">${homeMini(hm)}</span>
          <b>${hm.name}</b>
          <span class="muted">+${hm.charm} charm · ${hm.power} kW</span>
          <span class="lprice">${fmt(hm.price)}</span>
        </button>`).join('')}
    </div>
    <div class="mfoot"><button class="btn ghost" onclick="G.openLandChooser()">← Back to land</button></div>`;
}
function homeMini(hm){
  return `<svg viewBox="0 0 60 40">${DEFS()}<rect width="60" height="40" rx="4" fill="#1b2416"/>
    <g transform="translate(10,8) scale(${(0.4*hm.sc).toFixed(2)})">${building(100,60,{roof:hm.roof,solar:hm.power>10?1:0,chimney:1})}</g></svg>`;
}

/* ---------------- family & farmhands ---------------- */
function homeLifeHTML(){
  peopleInit();
  const beds = workerBeds(), used = S.workers.length;
  const morale = S.morale===undefined ? 0.6 : S.morale;
  let h = `<div class="card">
    <div class="eyebrow">Household morale</div>
    <div class="bar"><i style="transform:scaleX(${morale.toFixed(3)});background:linear-gradient(90deg,#c47fa8,#f0a8c8)"></i></div>
    <div class="muted" style="margin-top:5px">Time with your family lifts morale and pulls back burnout,
    which is what your salary is scaled by. When you have nothing queued, you will go and find them.</div>
  </div><div class="ph">Family</div>`;

  S.family.forEach(f=>{
    h += `<div class="person" data-tip="${esc(`<b>${f.name}</b>${f.role==='partner'?'Your partner. Works the beds and the animals through the day.':'Studies in the morning, plays in the afternoon.'}<hr><div class="tl"><span>Right now</span><b>${f.act||'—'}</b></div>`)}">
      <span class="pav" style="background:${f.shirt}"></span>
      <span class="pm"><input class="pname" value="${f.name}" onchange="G.renameFamily('${f.id}', this.value)"
        aria-label="Name"><span class="muted">${f.role==='partner'?'Partner':'Child'} · ${f.act||'at home'}</span></span>
    </div>`;
  });

  h += `<div class="ph">Farmhands <span style="color:var(--txt3);font-weight:500">${used} of ${beds} beds</span></div>`;
  if(!beds) h += `<div class="empty">No worker housing yet.<div style="margin-top:6px">Build a
    <b>worker cottage</b> from the Home category — it sleeps two, and one more per upgrade.</div></div>`;
  S.workers.forEach(w=>{
    h += `<div class="person" data-tip="${esc(`<b>${w.name}</b>Skill ${w.skill} — does ${2+w.skill} jobs a day: watering, harvesting, collecting and mucking out.<hr><div class="tl"><span>Wage</span><span class="tk">${fmt(w.wage)}/month</span></div><div class="tl"><span>Jobs done yesterday</span><b>${w.done||0}</b></div>`)}">
      <span class="pav" style="background:#4f8a9c"></span>
      <span class="pm"><b>${w.name}</b><span class="muted">skill ${w.skill} · ${fmt(w.wage)}/mo · ${w.done||0} jobs yesterday</span></span>
      <button class="chip" onclick="fireWorker('${w.id}')">Let go</button></div>`;
  });
  const canHire = used < beds;
  h += `<div style="padding:9px 11px">
    <button class="btn wide ${canHire?'':'ghost'}" ${canHire?'':'disabled'} onclick="hireWorker()"
      data-tip="${esc('<b>Hire a farmhand</b>Signing-on fee of about half a month’s wage, then a monthly wage forever. They water, harvest, collect and clean without being asked.<hr><span class="tg">Cheaper than AI early on, dearer once you scale.</span>')}">
      ${canHire?'Hire a farmhand':'Build a cottage first'}</button>
    <div class="muted" style="margin-top:6px">Total wages: ${fmt(workerWages())}/month.</div></div>`;
  return h;
}
