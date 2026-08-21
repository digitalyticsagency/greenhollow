/* =====================================================================
   THE PHONE IN YOUR POCKET

   Everything this game knows is behind a button on a rail: the ledger,
   the herd book, the weather, what your family think of you. All of it
   requires you to stop, find the icon and open a modal. Which is not how
   anybody has found anything out since about 2008.

   So: a phone. It opens over the corner of the screen, it is small, and
   it is the same phone all day.

   THE MESSAGES ARE REAL. Nothing on this thing is written in advance.
   Every message is generated from a fact the simulation is already
   holding — a farmhand whose opinion of you has gone under, somebody
   whose one wish you have not got round to, an animal in the herd book
   whose condition has dropped, the overdraft, a storm today, the beds
   that are ripe right now. Each one names the thing and the number. If
   the farm has nothing to say, you get no messages, and that is correct.

   AND YOU CAN ANSWER. A reply is two buttons and both of them do
   something to the person who sent it — the same opinion machinery p158
   uses for everything else. Being decent to somebody by text counts for
   slightly less than being decent to them in the yard, which is also
   correct.

   IT IS ALSO A PHONE. You can ring anyone on the place and it tells you
   where they are and what they are doing, because that is what ringing
   somebody is for. Weather, bank, prices and your list of ambitions are
   the other four apps, and the battery goes flat if you never go home.
   ===================================================================== */

const PH = {
  open:false, app:'home', battery:1, day:-1, msgs:[], seen:0, thread:null, buzz:0
};
const PH_DRAIN = 0.55;              /* a full day away from a socket costs this much */

/* ---------- the state it reads ---------- */
function phFolk(){ return (typeof allMinded === 'function') ? allMinded() : []; }
function phClock(){
  const f = (typeof dayFrac === 'function') ? dayFrac() : 0.5;
  const mins = Math.round(f * 24 * 60);
  const h = Math.floor(mins/60), m = mins % 60;
  return `${((h+11)%12)+1}:${String(m).padStart(2,'0')} ${h < 12 ? 'am' : 'pm'}`;
}
function phWeather(){ return WEATHERS[S.weather] || WEATHERS.sun; }
function phCharging(){
  /* anything you have built that draws power will also charge a phone */
  const near = (S.objs || []).some(o=>{
    const bp = BPMAP[o.bp]; if(!bp) return false;
    if(!(bp.power < 0 || ['cabin','worker_cottage','shed','workshop'].includes(bp.id))) return false;
    const f = footprint(bp, o.rot);
    const dx = (o.tx+f.w/2)*T - (S.you ? S.you.x : 0);
    const dy = (o.ty+f.h/2)*T - (S.you ? S.you.y : 0);
    return Math.hypot(dx, dy) < T*4;
  });
  return near;
}

/* ---------- messages, every one of them from a fact ---------- */
function phCompose(){
  const out = [];
  const day = S.day || 1;
  const add = (from, id, text, replies)=>out.push({ from, id, text, day, replies:replies||null, at:phClock() });

  /* 1. somebody has gone off you */
  phFolk().forEach(p=>{
    const op = (typeof opinionOf === 'function') ? opinionOf(p, 'you') : 0;
    if(op <= -22){
      add(p.name, 'sour:'+p.id,
        `I will say it here rather than to your face. Things have not been right between us.`,
        [{ t:'You are right. I will do better.', op:6, mem:'apologised by message' },
         { t:'You knew the work when you came.',  op:-4, mem:'was told to get on with it' }], p);
    }
  });
  /* 2. the one thing they want */
  phFolk().forEach(p=>{
    const m = (typeof mind === 'function') ? mind(p) : null;
    if(!m || m.goalMet) return;
    const g = (typeof MIND_GOALS !== 'undefined') && MIND_GOALS.find(x=>x.id === m.goal);
    if(!g) return;
    if((day + (p.name || '').length) % 4 !== 0) return;       /* not every day, or it is nagging */
    add(p.name, 'want:'+p.id+':'+day, g.say,
      [{ t:'I will see what I can do.', op:4, mem:'was told it would be looked at' },
       { t:'Not this month.',           op:-3, mem:'was told no' }], p);
  });
  /* 3. an animal that is going backwards */
  if(typeof bookOf === 'function'){
    (S.objs || []).forEach(o=>{
      const bp = BPMAP[o.bp]; if(!bp || bp.kind !== 'animal') return;
      (bookOf(o) || []).forEach(a=>{
        if(a.cond !== undefined && a.cond < 0.45){
          add('The herd book', 'beast:'+a.tag,
            `${a.name} (${a.tag}) is down to ${Math.round(a.cond*100)}% condition in the `
            + `${bp.name.toLowerCase()}.`);
        }
      });
    });
  }
  /* 4. money */
  if(S.cash < 250){
    add('Valley Mutual', 'bank:'+Math.floor(day/3),
      `Your balance is ${fmt(Math.round(S.cash))}. Rates and wages come out at the reckoning.`);
  }
  if(S.career && S.career.loan > 0 && day % 7 === 0){
    add('Valley Mutual', 'loan:'+day,
      `Interest on ${fmt(Math.round(S.career.loan))} at ${(S.career.rate*100).toFixed(1)}% is due.`);
  }
  /* 5. weather worth telling somebody about */
  if(['storm','frost','heat'].includes(S.weather)){
    const w = phWeather();
    add('Valley alerts', 'wx:'+day+':'+S.weather,
      `${w.n} on the block today. Growth ${Math.round((w.growth-1)*100)}%`
      + (w.rain ? `, ${w.rain}mm of rain` : ', no rain') + '.');
  }
  /* 6. what is ready right now */
  const ripe = (S.objs || []).filter(o=>{
    const bp = BPMAP[o.bp]; if(!bp) return false;
    return (bp.kind === 'plot' && o.crop && o.stage >= 1) || (bp.kind === 'perennial' && o.stage >= 1);
  });
  if(ripe.length >= 3){
    add('The farm', 'ripe:'+day,
      `${ripe.length} beds are ready. Longest standing is the ${BPMAP[ripe[0].bp].name.toLowerCase()} `
      + `at ${ripe[0].tx},${ripe[0].ty}.`);
  }
  /* 7. the ute, if you own one and have not looked after it.
     Keyed on the day, not on the number: condition falls continuously
     while you drive, so keying on the reading sent a fresh message every
     time it ticked down a point — three identical lines in one morning,
     measured. One a day, about the worst machine in the yard. */
  if(typeof uteObjs === 'function'){
    const utes = uteObjs();
    const worst = utes.slice().sort((a,b)=>
      ((a.cond === undefined ? 1 : a.cond)) - ((b.cond === undefined ? 1 : b.cond)))[0];
    if(worst){
      const c = worst.cond === undefined ? 1 : worst.cond;
      const many = utes.length > 1 ? ` (worst of ${utes.length})` : '';
      if(utes.some(o=>o.broken)) add('The yard', 'ute:broken:'+day,
        'The ute will not start. It needs paying for.');
      else if(c < 0.35) add('The yard', 'ute:cond:'+day,
        `The ute${many} is down to ${Math.round(c*100)}%. It will let you down soon.`);
      const dry = utes.filter(o=>o.fuel !== undefined && o.fuel < 0.15);
      if(dry.length) add('The yard', 'ute:fuel:'+day,
        `The ute is on ${Math.round(Math.min(...dry.map(o=>o.fuel))*100)}% fuel.`);
    }
  }
  return out;
}
function phRefresh(){
  const fresh = phCompose();
  /* The seen-set has to grow as the batch is walked, not only hold what
     was already there. Two utes in the same condition compose the same
     message with the same id, and both landed — the inbox showed the
     same line twice. */
  const have = new Set(PH.msgs.map(m=>m.id));
  let added = 0;
  fresh.forEach(m=>{
    if(have.has(m.id)) return;
    have.add(m.id);
    PH.msgs.unshift(m); added++;
  });
  if(PH.msgs.length > 40) PH.msgs.length = 40;
  return added;
}
function phUnread(){ return PH.msgs.filter(m=>!m.read).length; }
G.phoneReply = function(idx, which){
  const m = PH.msgs[idx]; if(!m || !m.replies) return;
  const r = m.replies[which]; if(!r) return;
  const p = m.who || phFolk().find(x=>x.name === m.from);
  if(p && typeof shiftOpinion === 'function'){
    shiftOpinion(p, 'you', r.op);                 /* by text, so it counts for less */
    if(typeof remember === 'function') remember(p, r.mem, 1, 'phone');
  }
  m.answered = r.t;
  m.replies = null;
  if(typeof log === 'function') log(`Texted ${m.from}: “${r.t}”`, r.op > 0 ? 'good' : '', 'farm');
  phPaint();
};

/* ---------- the apps ---------- */
function phHome(){
  const unread = phUnread();
  const apps = [
    ['msg','Messages','✉️', unread],
    ['wx','Weather', phWeather().ic, 0],
    ['bank','Bank','🏦', 0],
    ['prices','Prices','📈', 0],
    ['calls','Everyone','📞', 0],
    ['notes','Ambitions','📋', 0],
  ];
  return `<div class="phgrid">${apps.map(([id,n0,ic,b])=>
    `<button class="phapp" onclick="G.phoneApp('${id}')">
      <span class="phic">${ic}${b ? `<i class="phbadge">${b}</i>` : ''}</span>
      <span>${n0}</span></button>`).join('')}</div>
    <div class="phfoot muted">${S.you && S.you.name ? S.you.name : 'You'} · ${
      SEASONS[S.season].n} day ${S.day}</div>`;
}
function phMessages(){
  if(!PH.msgs.length) return `<div class="phempty">No messages.<br><span class="muted">The farm
    only writes when something has happened.</span></div>`;
  return PH.msgs.map((m,i)=>{
    PH.msgs[i].read = 1;
    return `<div class="phmsg${m.replies ? ' phlive' : ''}">
      <div class="phfrom">${m.from}<span class="muted">${m.at} · day ${m.day}</span></div>
      <div class="phbody">${m.text}</div>
      ${m.replies ? `<div class="phreply">${m.replies.map((r,j)=>
          `<button class="btn ghost" onclick="G.phoneReply(${i},${j})">${r.t}</button>`).join('')}</div>` : ''}
      ${m.answered ? `<div class="phsent">You: ${m.answered}</div>` : ''}
    </div>`;
  }).join('');
}
function phWx(){
  const w = phWeather(), se = SEASONS[S.season];
  const st = (typeof stat === 'function') ? stat() : {};
  /* An honest outlook: this game rolls the weather fresh each morning, so
     nobody knows tomorrow. What can be said truthfully is how often each
     kind falls in this season, which is what a forecast actually is. */
  const wet = se.rain;
  const odds = [['Rain or storm', wet], ['Dry', 1-wet]];
  return `<div class="phbig">${w.ic} ${w.n}</div>
    <div class="phrows">
      <div class="row"><span>Growth today</span><b>${Math.round(w.growth*100)}%</b></div>
      <div class="row"><span>Rain</span><b>${w.rain ? w.rain + 'mm' : 'none'}</b></div>
      <div class="row"><span>Evaporation</span><b>${w.evap.toFixed(1)}×</b></div>
      <div class="row"><span>Solar</span><b>${Math.round(w.power*100)}%</b></div>
      <div class="row"><span>Water in the tanks</span><b>${Math.round(S.water)}L</b></div>
    </div>
    <div class="phnote muted">Outlook for ${se.n}: ${odds.map(([n0,p])=>
      `${n0} ${Math.round(p*100)}%`).join(' · ')}. Tomorrow is rolled in the morning
      like everybody else's, so this is the season's habit, not a promise.</div>`;
}
function phBank(){
  const inc = (typeof incomeLines === 'function') ? incomeLines() : [];
  const out = (typeof outgoings === 'function') ? outgoings() : {total:0};
  const gross = inc.reduce((a,l)=>a+l.v, 0);
  const net = gross - out.total;
  return `<div class="phbig">${fmt(Math.round(S.cash))}</div>
    <div class="phnote muted">in the account${S.career && S.career.loan > 0
      ? ` · ${fmt(Math.round(S.career.loan))} owing` : ''}</div>
    <div class="phrows">
      ${inc.map(l=>`<div class="row"><span>${l.n}</span><b class="cgood">${fmt(Math.round(l.v))}</b></div>`).join('')}
      <div class="row"><span>Rates, upkeep, wages, interest</span><b class="cbad">−${fmt(out.total)}</b></div>
      <div class="row phtot"><span>A month, as it stands</span>
        <b class="${net >= 0 ? 'cgood' : 'cbad'}">${net >= 0 ? '' : '−'}${fmt(Math.abs(Math.round(net)))}</b></div>
    </div>`;
}
function phPrices(){
  const held = Object.keys(S.store || {}).filter(k=>S.store[k] > 0);
  const keys = held.length ? held : Object.keys(GOODS).slice(0, 8);
  return `<div class="phrows">${keys.map(k=>{
    const mult = (S.prices && S.prices[k]) || 1;
    const dir = mult > 1.06 ? '▲' : mult < 0.94 ? '▼' : '·';
    const cls = mult > 1.06 ? 'cgood' : mult < 0.94 ? 'cbad' : 'muted';
    return `<div class="row"><span>${GOODS[k] ? GOODS[k].n : k}
      <i class="muted">${S.store && S.store[k] ? '×'+S.store[k] : ''}</i></span>
      <b class="${cls}">${fmt(sellPrice(k))} ${dir}</b></div>`;
  }).join('')}</div>
  <div class="phnote muted">What a unit fetches today, your farm's price bonus included.</div>`;
}
function phCalls(){
  const folk = phFolk();
  if(!folk.length) return `<div class="phempty">Nobody else on the place yet.</div>`;
  return folk.map((p,i)=>{
    const op = (typeof opinionOf === 'function') ? Math.round(opinionOf(p,'you')) : 0;
    const mo = (typeof moodOf === 'function') ? Math.round(moodOf(p)*100) : null;
    return `<div class="phmsg">
      <div class="phfrom">${p.name}<span class="muted">${
        typeof opinionWord === 'function' ? opinionWord(op) : ''}</span></div>
      <div class="phbody">${p.act || 'about the place'}${mo !== null ? ` · mood ${mo}%` : ''}</div>
      <div class="phreply">
        <button class="btn ghost" onclick="G.phoneRing(${i})">Ring</button>
        <button class="btn ghost" onclick="G.phoneKind(${i})">Say something kind</button>
      </div></div>`;
  }).join('');
}
function phNotes(){
  if(typeof AMBITIONS === 'undefined') return `<div class="phempty">Nothing listed.</div>`;
  const live = AMBITIONS.map(a=>({a, s:ambState(a)})).filter(x=>!x.s.done)
    .sort((x,y)=>y.s.pct - x.s.pct).slice(0, 7);
  const done = AMBITIONS.filter(a=>ambState(a).done).length;
  return `<div class="phnote muted">${done} of ${AMBITIONS.length} done.</div>
    <div class="phrows">${live.map(({a,s})=>`
      <div class="phamb">
        <div class="row"><span>${a.n}</span><b>${Math.round(s.now)}/${s.at}</b></div>
        <div class="phbar"><i style="width:${Math.round(s.pct*100)}%"></i></div>
        <div class="muted" style="font-size:10px">${a.d}</div>
      </div>`).join('')}</div>`;
}
G.phoneRing = function(i){
  const p = phFolk()[i]; if(!p) return;
  const tx = Math.round((p.x || 0)/T), ty = Math.round((p.y || 0)/T);
  const where = (typeof roomOf === 'function' && roomOf(p)) ? roomOf(p) : `out at ${tx},${ty}`;
  const op = (typeof opinionOf === 'function') ? opinionOf(p,'you') : 0;
  const tone = op > 20 ? 'They pick up straight away.'
             : op < -20 ? 'It rings a long time first.' : 'They pick up.';
  PH.msgs.unshift({ from:p.name, id:'call:'+p.id+':'+(S.day||1)+':'+Math.round(performance.now()),
    day:S.day||1, at:phClock(), read:1,
    text:`${tone} “${p.act ? p.act.charAt(0).toUpperCase()+p.act.slice(1) : 'Nothing much'}.” ${where}.` });
  PH.app = 'msg';
  phPaint();
};
G.phoneKind = function(i){
  const p = phFolk()[i]; if(!p) return;
  const m = (typeof mind === 'function') ? mind(p) : null;
  if(m && (S.day || 1) - (m.lastPhone || -99) < 1) return toast('You have already rung them today');
  if(m) m.lastPhone = S.day || 1;
  if(typeof shiftOpinion === 'function') shiftOpinion(p, 'you', 3);
  if(typeof remember === 'function') remember(p, 'got a kind message from you', 1, 'phone');
  toast(`${p.name} appreciated that`, 'good');
  phPaint();
};

/* ---------- the handset ---------- */
G.phoneApp = function(id){ PH.app = id; phPaint(); };
G.phoneOpen = function(){
  if(PH.battery <= 0.01) return toast('The phone is flat. Go and charge it.','bad');
  PH.open = true; PH.app = 'home';
  phRefresh();
  let host = document.getElementById('phwrap');
  if(!host){ host = document.createElement('div'); host.id = 'phwrap'; document.body.appendChild(host); }
  phPaint();
  try{ sfx('click'); }catch(e){}
};
G.phoneClose = function(){
  PH.open = false;
  const h = document.getElementById('phwrap'); if(h) h.remove();
  phSyncButton();
};
G.phoneToggle = function(){ PH.open ? G.phoneClose() : G.phoneOpen(); };
function phPaint(){
  if(!PH.open) return;
  const host = document.getElementById('phwrap'); if(!host) return;
  const body = PH.app === 'home' ? phHome()
    : PH.app === 'msg' ? phMessages()
    : PH.app === 'wx' ? phWx()
    : PH.app === 'bank' ? phBank()
    : PH.app === 'prices' ? phPrices()
    : PH.app === 'calls' ? phCalls()
    : phNotes();
  const titles = { home:'', msg:'Messages', wx:'Weather', bank:'Valley Mutual',
                   prices:'Prices', calls:'Everyone', notes:'Ambitions' };
  const charging = phCharging();
  host.innerHTML = `<div id="phone" class="${PH.buzz > 0 ? 'phbuzz' : ''}">
    <div class="phbar2">
      <span>${phClock()}</span>
      <span style="flex:1"></span>
      <span>${phWeather().ic}</span>
      <span class="phbatt ${PH.battery < 0.15 ? 'phlow' : ''}">${charging ? '⚡' : ''}${
        Math.round(PH.battery*100)}%</span>
    </div>
    <div class="phhead">
      ${PH.app === 'home' ? '<b>Greenhollow</b>'
        : `<button class="phback" onclick="G.phoneApp('home')">‹</button><b>${titles[PH.app]}</b>`}
      <span style="flex:1"></span>
      <button class="phx" onclick="G.phoneClose()">✕</button>
    </div>
    <div class="phscreen">${body}</div>
  </div>`;
  phSyncButton();
}
function phSyncButton(){
  const b = document.getElementById('phonebtn'); if(!b) return;
  const u = phUnread();
  b.textContent = '📱';
  b.classList.toggle('phhas', u > 0);
  b.setAttribute('data-tip', `<b>Your phone</b>${u ? u + ' unread' : 'Messages, weather, bank, prices, everyone.'}`);
}

/* ---------- it lives in your pocket, so it ticks ---------- */
let PH_T = 0;
function phTick(dt){
  PH_T += dt;
  if(PH.buzz > 0) PH.buzz -= dt;
  /* battery: a whole day away from a socket costs PH_DRAIN, and standing
     near anything with power in it puts it back */
  const dayLen = 90;
  if(phCharging()) PH.battery = Math.min(1, PH.battery + dt/dayLen * 2.4);
  else PH.battery = Math.max(0, PH.battery - dt/dayLen * PH_DRAIN);
  if(PH.battery <= 0.01 && PH.open) G.phoneClose();

  if(PH_T < 4) return;
  PH_T = 0;
  const added = phRefresh();
  if(added){
    PH.buzz = 0.6;
    if(typeof isNight !== 'function' || !isNight()){
      toast(`${added} new message${added>1?'s':''}`, '');
      try{ sfx('click'); }catch(e){}
    }
  }
  if(PH.open) phPaint(); else phSyncButton();
}
if(typeof tickPeople === 'function'){
  const _tickPh = tickPeople;
  tickPeople = function(dt){
    const r = _tickPh.apply(this, arguments);
    try{ phTick(typeof dt === 'number' ? dt : 1/30); }catch(e){}
    return r;
  };
}
document.addEventListener('keydown', (e)=>{
  if(e.key !== 'p' && e.key !== 'P') return;
  const t = e.target;
  if(t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
  if(typeof RIG === 'object' && RIG.on) return;        /* p is not a driving control, but stay out of the way */
  if(typeof DRONE === 'object' && DRONE.on) return;
  e.preventDefault();
  G.phoneToggle();
});

/* the rail button, and the drawer entry so it can be found in words */
if(typeof syncWorldButtons === 'function'){
  const _syncPh = syncWorldButtons;
  syncWorldButtons = function(){
    const r = _syncPh.apply(this, arguments);
    try{
      const host = document.getElementById('zoomctl');
      if(host && !document.getElementById('phonebtn')){
        const b = document.createElement('button');
        b.id = 'phonebtn'; b.textContent = '📱';
        b.className = (host.firstElementChild && host.firstElementChild.className) || '';
        b.onclick = ()=>G.phoneToggle();
        host.appendChild(b);
      }
      phSyncButton();
    }catch(e){}
    return r;
  };
}
if(typeof DOCK_TEXT === 'object'){
  DOCK_TEXT.phonebtn = ['Your phone','Messages from the people here, weather, bank, prices.'];
  if(typeof DOCK_GROUPS !== 'undefined'){
    const g = DOCK_GROUPS.find(x=>x.n === 'Anything else');
    if(g && !g.ids.includes('phonebtn')) g.ids.unshift('phonebtn');
  }
}

G.phoneAudit = function(){
  return {
    open: PH.open, app: PH.app,
    battery: +PH.battery.toFixed(3), charging: phCharging(),
    messages: PH.msgs.length, unread: phUnread(),
    withReplies: PH.msgs.filter(m=>m.replies).length,
    sources: [...new Set(PH.msgs.map(m=>String(m.id).split(':')[0]))],
    button: !!document.getElementById('phonebtn'),
    folk: phFolk().map(p=>p.name)
  };
};

(function phCss(){
  const s = document.createElement('style');
  s.textContent = `
  #phonebtn{ font-size:15px; line-height:1; position:relative }
  #phonebtn.phhas::after{ content:''; position:absolute; top:3px; right:3px; width:7px; height:7px;
    border-radius:50%; background:#ff5a44; box-shadow:0 0 0 2px rgba(0,0,0,.4) }
  #phwrap{ position:fixed; right:16px; bottom:16px; z-index:72 }
  #phone{ width:min(300px,84vw); background:#0e1512; border:1px solid var(--line2,#33402c);
    border-radius:20px; overflow:hidden; box-shadow:0 14px 40px rgba(0,0,0,.55);
    display:flex; flex-direction:column; max-height:min(560px,76vh) }
  #phone.phbuzz{ animation:phshake .45s }
  @keyframes phshake{ 0%,100%{transform:translateX(0)} 20%{transform:translateX(-3px)}
    45%{transform:translateX(3px)} 70%{transform:translateX(-2px)} }
  .phbar2{ display:flex; gap:6px; align-items:center; padding:6px 12px 2px; font-size:10px;
    color:#9bb09b; font-variant-numeric:tabular-nums }
  .phbatt.phlow{ color:#ff8a72 }
  .phhead{ display:flex; align-items:center; gap:6px; padding:4px 10px 8px;
    border-bottom:1px solid rgba(255,255,255,.07) }
  .phhead b{ font-size:13px; color:#e8f0e4 }
  .phback,.phx{ background:none; border:0; color:#9bb09b; font-size:15px; cursor:pointer; padding:0 4px }
  .phscreen{ overflow:auto; padding:10px; display:flex; flex-direction:column; gap:8px }
  .phgrid{ display:grid; grid-template-columns:repeat(3,1fr); gap:8px }
  .phapp{ background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.07);
    border-radius:12px; padding:9px 4px; display:flex; flex-direction:column; align-items:center;
    gap:5px; cursor:pointer; color:#cfe0cf; font-size:10px }
  .phapp:hover{ background:rgba(255,255,255,.1) }
  .phic{ font-size:20px; position:relative; line-height:1 }
  .phbadge{ position:absolute; top:-4px; right:-9px; background:#ff5a44; color:#fff;
    border-radius:9px; font-size:9px; font-style:normal; padding:0 4px; min-width:14px }
  .phfoot{ text-align:center; font-size:10px; margin-top:2px }
  .phmsg{ background:rgba(255,255,255,.05); border-radius:11px; padding:8px 10px }
  .phmsg.phlive{ border:1px solid rgba(255,224,138,.35) }
  .phfrom{ display:flex; justify-content:space-between; gap:8px; font-size:11px;
    font-weight:600; color:#e8f0e4; margin-bottom:3px }
  .phfrom .muted{ font-weight:400; font-size:9px }
  .phbody{ font-size:11.5px; color:#cfe0cf; line-height:1.42 }
  .phreply{ display:flex; gap:5px; flex-wrap:wrap; margin-top:7px }
  .phreply .btn{ font-size:10px; padding:4px 7px }
  .phsent{ margin-top:6px; font-size:10.5px; color:#9fd6a8; text-align:right }
  .phempty{ text-align:center; padding:26px 10px; font-size:12px; color:#cfe0cf }
  .phbig{ font-size:22px; color:#e8f0e4; text-align:center; padding:6px 0 0 }
  .phnote{ font-size:10px; line-height:1.45 }
  .phrows .row{ display:flex; justify-content:space-between; gap:8px; font-size:11px;
    padding:4px 0; border-bottom:1px solid rgba(255,255,255,.05) }
  .phrows .row.phtot{ border-bottom:0; margin-top:3px; font-weight:600 }
  .phamb{ margin-bottom:6px }
  .phbar{ height:4px; border-radius:3px; background:rgba(255,255,255,.09); overflow:hidden }
  .phbar i{ display:block; height:100%; background:#7fc98a }`;
  document.head.appendChild(s);
})();
