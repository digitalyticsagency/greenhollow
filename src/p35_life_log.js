/* =====================================================================
   THE FARM LOG, THE FAMILY'S VOICES, AND MILESTONE EVENTS

   Everything the family did indoors was invisible: they went to bed,
   ate breakfast, sheltered from a storm, and the log said nothing. Now
   it narrates their day, grouped and filterable so it does not become
   a wall of noise.

   They also talk to each other. When two of them end up in the same
   room or the same corner of a paddock, one of them says something
   suited to the hour, the weather and who they are with.

   And the milestones report to GoatCounter as events — which needs no
   backend at all. It only fires where analytics exists, so the artifact
   and local copies stay silent.
   ===================================================================== */

/* ---------- 1. a log that knows what kind of thing happened ---------- */

const LOG_CATS = {
  farm:   {n:'Farm',   i:'🌱'},
  home:   {n:'Home',   i:'🏠'},
  money:  {n:'Money',  i:'💰'},
  weather:{n:'Weather',i:'🌦'},
  alert:  {n:'Alerts', i:'⚠️'},
};
let logFilter = 'all';

/* classify by wording, so every existing log() call is categorised too */
function logCat(msg, cls){
  const m = String(msg).toLowerCase();
  /* Severity wins over subject matter: "struck by lightning" is something
     going wrong, not a weather report, so this has to be tested first. */
  if(cls === 'bad' || /died|dead|struck|lost|short of|nowhere|crowded|failed|wilted|escaped/.test(m))
    return 'alert';
  if(/bill|payday|sold|salary|paid|wage|cost|\$|earn|bought|price/.test(m))
    return 'money';
  if(/storm|rain|frost|heat|lightning|weather|sunny|cloud|forecast/.test(m))
    return 'weather';
  if(/asleep|turned in|bed|breakfast|dinner|dishes|read to|story|indoors|chores|house|kettle|tea|fire|pyjamas|compost|scraps/.test(m))
    return 'home';
  return 'farm';
}

function renderLog(){
  const el = document.getElementById('log');
  if(!el) return;
  const rows = (S.log || []).filter(l => logFilter === 'all' || (l.k || 'farm') === logFilter);
  const chips = ['all'].concat(Object.keys(LOG_CATS)).map(k=>{
    const on = logFilter === k ? ' on' : '';
    const label = k === 'all' ? 'All' : LOG_CATS[k].i + ' ' + LOG_CATS[k].n;
    const count = k === 'all' ? (S.log||[]).length
      : (S.log||[]).filter(l => (l.k||'farm') === k).length;
    return `<button class="lgchip${on}" onclick="G.logFilter('${k}')">${label}<i>${count}</i></button>`;
  }).join('');
  el.innerHTML = `<div class="lgchips">${chips}</div>` + (rows.length
    ? rows.map(l=>`<div class="lg ${l.c} k-${l.k||'farm'}">
        <time>D${l.d}</time>
        <em>${LOG_CATS[l.k||'farm'].i}</em>
        <span>${l.m}</span></div>`).join('')
    : `<div class="lgempty">Nothing under this filter yet.</div>`);
}

G.logFilter = function(k){ logFilter = k; renderLog(); if(typeof sfx==='function') sfx('click'); };

/* keep the same signature every caller already uses */
log = function(msg, cls, cat){
  S.log.unshift({d:S.day, m:msg, c:cls||'', k:cat || logCat(msg, cls), t:Date.now()});
  if(S.log.length > 90) S.log.pop();
  renderLog();
};

/* ---------- 2. narrate the household ---------- */
/* Log only when someone's activity actually changes, and only for the
   things worth reading. Ticking every frame would bury everything else. */
const ACT_WORDING = {
  'asleep':                 p => `${p.name} turned in for the night.`,
  'making breakfast':       p => `${p.name} put breakfast on.`,
  'eating breakfast':       p => `${p.name} came down for breakfast.`,
  'having dinner':          p => `${p.name} sat down to dinner.`,
  'washing up':             p => `${p.name} started the washing up.`,
  'drying the dishes':      p => `${p.name} dried the dishes.`,
  'sitting by the fire':    p => `${p.name} settled by the fire.`,
  'being read to':          p => `${p.name} was read a story.`,
  'in pyjamas':             p => `${p.name} got into pyjamas.`,
  'watching the storm':     p => `${p.name} watched the storm from the window.`,
  'making tea':             p => `${p.name} put the kettle on.`,
  'mending by the fire':    p => `${p.name} mended something by the fire.`,
  'drawing at the table':   p => `${p.name} drew at the kitchen table.`,
  'reading by the window':  p => `${p.name} read by the window.`,
  'playing cards':          p => `${p.name} dealt out a game of cards.`,
  'turning the compost':    p => `${p.name} turned the compost heap.`,
  'taking out the scraps':  p => `${p.name} carried the scraps out to the compost.`,
  'tending the beds':       p => `${p.name} worked through the beds.`,
  'feeding the animals':    p => `${p.name} fed the animals.`,
  'studying':               p => `${p.name} sat down to schoolwork.`,
  'playing':                p => `${p.name} went off to play.`,
};

function narrateHousehold(){
  (S.family || []).forEach(p=>{
    if(!p.act) return;
    if(p._loggedAct === p.act) return;
    p._loggedAct = p.act;
    const w = ACT_WORDING[p.act];
    if(w) log(w(p), '', 'home');
  });
}

/* ---------- 3. they talk to each other ---------- */
const CHAT = {
  night:   ['Sleep well.', 'Long day tomorrow.', 'Night, love.', 'One more story?'],
  storm:   ['That was close!', 'Hope the roof holds.', 'Count the seconds…', 'Glad we came in.'],
  kitchen: ['Smells good.', 'Pass the salt?', 'Who left the tap on?', 'Seconds?'],
  work:    ['Beds need water.', 'Chooks are out again.', 'Fence wants fixing.', 'Good crop this year.'],
  play:    ['Chase me!', 'Watch this!', 'My turn!', 'Look what I found!'],
  idle:    ['Lovely evening.', 'Kettle on?', 'Did you see the birds?', 'All quiet.'],
};

function chatPool(){
  const f = (typeof dayFrac === 'function') ? dayFrac() : 0.5;
  if(S.weather === 'storm') return CHAT.storm;
  if(f < 0.24 || f > 0.88)  return CHAT.night;
  if(f < 0.30 || (f > 0.78 && f < 0.86)) return CHAT.kitchen;
  return CHAT.idle;
}

const BUBBLES = [];
let chatCool = 0;

function tickChat(dt){
  chatCool -= dt;
  /* age out the bubbles that are showing */
  for(let i=BUBBLES.length-1;i>=0;i--){
    BUBBLES[i].life -= dt;
    if(BUBBLES[i].life <= 0){
      const el = document.getElementById(BUBBLES[i].id);
      if(el) el.remove();
      BUBBLES.splice(i,1);
    }
  }
  if(chatCool > 0 || BUBBLES.length >= 2) return;
  if(typeof SET === 'function' && SET('motion') === false) return;

  /* find two people standing close enough to be talking */
  const all = (S.family || []).concat(S.workers || []);
  if(all.length < 2) return;
  const pairs = [];
  for(let i=0;i<all.length;i++)
    for(let j=i+1;j<all.length;j++){
      const d = Math.hypot(all[i].x-all[j].x, all[i].y-all[j].y);
      if(d < 46) pairs.push([all[i], all[j]]);
    }
  if(!pairs.length){ chatCool = 3; return; }

  const [a, b] = pairs[Math.floor(Math.random()*pairs.length)];
  const kidTalk = a.role === 'child' && b.role === 'child';
  const pool = kidTalk ? CHAT.play : chatPool();
  speak(a, pool[Math.floor(Math.random()*pool.length)]);
  /* the other one answers a beat later */
  setTimeout(()=>{ if(Math.random() < 0.6) speak(b, pool[Math.floor(Math.random()*pool.length)]); }, 1200);
  chatCool = 7 + Math.random()*8;
}

function speak(p, text){
  const layer = document.getElementById('people');
  if(!layer) return;
  const id = 'bub' + Math.random().toString(36).slice(2,7);
  const w = Math.max(38, Math.min(120, text.length*5.4));
  /* Two people talking stand close together, so their bubbles would sit on
     top of each other. Lift this one clear of any bubble already nearby. */
  let lift = 0;
  BUBBLES.forEach(b=>{
    if(Math.abs(b.p.x - p.x) < 90 && Math.abs(b.p.y - p.y) < 40) lift += 20;
  });
  const g = document.createElementNS('http://www.w3.org/2000/svg','g');
  g.setAttribute('id', id);
  g.setAttribute('class', 'bubble');
  g.setAttribute('transform', `translate(${Math.round(p.x)},${Math.round(p.y - 30 - lift)})`);
  g.innerHTML =
    `<rect x="${-w/2}" y="-15" width="${w}" height="18" rx="9" fill="#fdfbf4"
       stroke="#c9c0aa" stroke-width="0.8"/>
     <path d="M-3 3 L0 8 L3 3 Z" fill="#fdfbf4" stroke="#c9c0aa" stroke-width="0.8"/>
     <text x="0" y="-2.5" text-anchor="middle" font-size="9"
       font-family="system-ui,-apple-system,sans-serif" fill="#3d4634">${text}</text>`;
  layer.appendChild(g);
  BUBBLES.push({id, life:3.6, p, lift});
}

/* bubbles follow the speaker while they are up */
function moveBubbles(){
  BUBBLES.forEach(b=>{
    const el = document.getElementById(b.id);
    if(el) el.setAttribute('transform', `translate(${Math.round(b.p.x)},${Math.round(b.p.y - 30 - (b.lift||0))})`);
  });
}

const _tickPeopleChat = tickPeople;
tickPeople = function(dt){
  const r = _tickPeopleChat.apply(this, arguments);
  if(S && S.speed !== 0){ narrateHousehold(); tickChat(dt); }
  moveBubbles();
  return r;
};

/* ---------- 4. milestones as GoatCounter events ---------- */
/* No backend: GoatCounter takes client-side events. It only exists on the
   Pages copy, so this is a silent no-op in the artifact and locally. */
const SENT = (function(){
  try { return JSON.parse(localStorage.getItem('greenhollow_ev') || '{}'); }
  catch(e){ return {}; }
})();

function trackOnce(name){
  if(SENT[name]) return;
  if(!track(name)) return;          // not delivered - try again next sweep
  SENT[name] = 1;
  try { localStorage.setItem('greenhollow_ev', JSON.stringify(SENT)); } catch(e){}
}
/* returns true only if the event was actually handed to GoatCounter */
function track(name){
  if(!window.goatcounter || typeof window.goatcounter.count !== 'function') return false;
  try {
    window.goatcounter.count({path:'ev-' + name, title:'Greenhollow: ' + name, event:true});
    return true;
  } catch(e){ return false; }
}

/* the funnel worth knowing: did they start, keep going, hit the wall, pay */
function trackMilestones(){
  if(typeof S === 'undefined' || !S) return;
  trackOnce('opened');
  if(S.landId)                      trackOnce('land-chosen');
  if(S.settings && S.settings.wfh === false) trackOnce('offgrid-chosen');
  if((S.objs||[]).length >= 8)      trackOnce('built-8');
  if((S.objs||[]).some(o=>o.tier>0))trackOnce('first-upgrade');
  [3,5,10,25,50].forEach(d=>{ if(S.day >= d) trackOnce('day-' + d); });
  if(typeof PLAY !== 'undefined'){
    if(PLAY.ms > 5*60000)  trackOnce('played-5min');
    if(PLAY.ms > 15*60000) trackOnce('played-15min');
    if(PLAY.prompted > 0)  trackOnce('trial-gate-hit');
    if(PLAY.unlocked)      trackOnce('unlocked');
  }
}
setInterval(trackMilestones, 20000);
setTimeout(trackMilestones, 4000);

/* fire the two that matter the moment they happen, not on the next sweep */
if(typeof G.gateUnlock === 'function'){
  const _unlock = G.gateUnlock;
  G.gateUnlock = function(){ trackOnce('unlocked'); return _unlock.apply(this, arguments); };
}

(function logCss(){
  const s = document.createElement('style');
  s.textContent = `
  .lgchips{display:flex;flex-wrap:wrap;gap:4px;padding:0 0 7px;position:sticky;top:0;
    background:var(--pan,#1b2416);z-index:2;}
  .lgchip{font-size:10.5px;padding:3px 7px;border-radius:7px;cursor:pointer;
    background:rgba(255,255,255,.06);border:1px solid transparent;color:#b9c4ae;
    display:inline-flex;align-items:center;gap:4px;}
  .lgchip:hover{background:rgba(255,255,255,.11);}
  .lgchip.on{background:rgba(124,194,79,.18);border-color:#5fae48;color:#dff0d2;}
  .lgchip i{font-style:normal;opacity:.65;font-size:9.5px;}
  .lg{display:grid;grid-template-columns:auto auto 1fr;gap:6px;align-items:baseline;
    padding:3px 0;border-bottom:1px solid rgba(255,255,255,.04);}
  .lg em{font-style:normal;font-size:10px;opacity:.8;}
  .lg.k-home  span{color:#cfd8c4;}
  .lg.k-money span{color:#f0d79a;}
  .lg.k-alert span{color:#f0a893;}
  .lgempty{font-size:11px;color:#8b9680;padding:8px 0;}
  .bubble{pointer-events:none;animation:bubPop .25s ease-out;}
  .bubble text{paint-order:stroke;}
  @keyframes bubPop{ from{opacity:0;transform:translateY(4px) scale(.9);} to{opacity:1;} }
  @media (prefers-reduced-motion: reduce){ .bubble{animation:none;} }
  `;
  document.head.appendChild(s);
})();

setTimeout(renderLog, 500);
