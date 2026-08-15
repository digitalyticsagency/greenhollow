/* =====================================================================
   THE HUB SENDS SOMETHING OUT

   The farm control hub does twelve to fifty-five visits a day depending
   on its Mark, and every one of them happens in a single silent batch at
   the day rollover. Beds get watered, pens get collected, jars get
   carried in from the kitchen, and nothing whatsoever crosses the yard.
   The most expensive automation in the game is a box that hums.

   THE ROUND IS NOW DRIVEN. One machine per Mark rolls out of the hub,
   takes the next job off the day's round, drives to it, works it, and
   goes to the next. When the round is done they come home and dock. The
   queue is the hub's real plan — the same hubPlan() the automation ran,
   in the same household priority order — so the length of the queue and
   the number of machines are the true capacity, and you can watch a Mk I
   run out of trips while the beds it never reached sit there.

   IT SHOWS THE ROUND, IT DOES NOT GATE IT. Being straight about this: the
   work itself still lands in one batch at rollover, as it always has.
   Making arrival the moment the water actually goes on would mean a bed
   watered at 4pm instead of midnight, and that is an economy change
   dressed up as a graphics change. The machines are an honest picture of
   a round that really happened, in the real order, at the real capacity —
   not a simulation laid over the top of it.

   A COLOUR PER JOB, because a machine crossing the yard should tell you
   what it is going to do: blue for water, green for harvest and picking,
   amber for the animals, grey for tidying up.

   THE BAYS. The hub has one docking bay per machine, and lifting the roof
   shows which are empty. That is the clearest read of "it is working"
   available, and it costs nothing while the roof is on because p122 only
   draws interiors when the roof is up.

   Moved by transform on the existing element, never by regenerating the
   SVG — the mistake p92 documents for the dog, where she was following
   you invisibly for a whole release because nothing ever moved her node.
   ===================================================================== */

const BOT_JOB_COL = {
  water:   { c:'#4f93b5', lit:'#8fd0e8' },
  harvest: { c:'#5f8f3f', lit:'#9ed46a' },
  animals: { c:'#c08a3a', lit:'#f0c070' },
  tidy:    { c:'#7a828a', lit:'#c3ccd2' },
};

/* one machine per Mark, so upgrading puts another one on the yard */
function botFleet(){ return Math.max(0, Math.min(4, (typeof hubMark === 'function') ? hubMark() : 0)); }

function hubDoor(){
  const h = (typeof hub === 'function') ? hub() : null;
  if(!h) return null;
  const f = footprint(BPMAP[h.bp], h.rot);
  return { x:(h.tx + f.w/2)*T, y:(h.ty + f.h + 0.3)*T, obj:h };
}

function botState(){
  if(!S.bots) S.bots = { units:[], queue:[], day:-1 };
  return S.bots;
}

/* where a job sits on the ground */
function botTargetOf(o){
  if(!o) return null;
  const bp = BPMAP[o.bp]; if(!bp) return null;
  const f = footprint(bp, o.rot);
  return { x:(o.tx + f.w/2)*T, y:(o.ty + f.h*0.72)*T };
}

/* ---------- the round is set when the hub runs it ---------- */
if(typeof runAutomation === 'function'){
  const _runAutoBots = runAutomation;
  runAutomation = function(){
    const r = _runAutoBots.apply(this, arguments);
    try{
      const B = botState();
      const door = hubDoor();
      if(!door){ B.units = []; B.queue = []; return r; }
      const plan = (typeof hubPlan === 'function') ? hubPlan() : null;
      if(!plan) return r;
      /* the day's round, in the order the hub actually worked it */
      B.day = S.day;
      B.queue = plan.doing.map(d=>({ id:d.o.id, g:d.g })).filter(q=>q.id !== undefined);
      B.waiting = plan.waiting;
      /* the fleet, docked and ready */
      const want = botFleet();
      while(B.units.length > want) B.units.pop();
      while(B.units.length < want)
        B.units.push({ i:B.units.length, x:door.x, y:door.y, dir:1,
                       state:'dock', jobId:null, g:'tidy', t:0, work:0 });
      B.units.forEach(u=>{ if(u.state !== 'dock'){ u.state='home'; } });
    }catch(e){}
    return r;
  };
}

/* ---------- they work the round across the day ---------- */
function tickBots(dt){
  const B = botState();
  const door = hubDoor();
  if(!door){ if(B.units.length) B.units = []; return; }
  if(!B.units.length && botFleet()){
    B.units = []; for(let i=0;i<botFleet();i++)
      B.units.push({ i, x:door.x, y:door.y, dir:1, state:'dock', jobId:null, g:'tidy', t:0, work:0 });
  }

  B.units.forEach(u=>{
    u.t += dt;
    const speed = 54;

    if(u.state === 'dock' || u.state === 'home'){
      /* home: take the next job if there is one */
      if(B.queue && B.queue.length){
        const q = B.queue.shift();
        const o = (S.objs||[]).find(x=>x.id === q.id);
        const tgt = botTargetOf(o);
        if(tgt){ u.jobId = q.id; u.g = q.g || 'tidy'; u.tx = tgt.x; u.ty = tgt.y; u.state = 'out'; u.work = 0; }
        return;
      }
      /* nothing to do: sit in the bay */
      u.x += (door.x + (u.i - 1.5)*9 - u.x) * Math.min(1, dt*3);
      u.y += (door.y - u.y) * Math.min(1, dt*3);
      u.state = 'dock';
      return;
    }

    if(u.state === 'out'){
      const dx = u.tx - u.x, dy = u.ty - u.y, d = Math.hypot(dx, dy) || 1;
      if(d > 7){
        const k = Math.min(1, speed*dt/d);
        u.x += dx*k; u.y += dy*k;
        if(Math.abs(dx) > 1) u.dir = dx < 0 ? -1 : 1;
      } else u.state = 'work';
      return;
    }

    if(u.state === 'work'){
      u.work += dt;
      if(u.work > 2.2){ u.state = 'back'; u.jobId = null; }
      return;
    }

    if(u.state === 'back'){
      const bx = door.x + (u.i - 1.5)*9, by = door.y;
      const dx = bx - u.x, dy = by - u.y, d = Math.hypot(dx, dy) || 1;
      if(d > 5){
        const k = Math.min(1, speed*dt/d);
        u.x += dx*k; u.y += dy*k;
        if(Math.abs(dx) > 1) u.dir = dx < 0 ? -1 : 1;
      } else {
        u.state = 'home';
        /* a bay lighting up is worth a repaint, but only if you can see in */
        if(typeof SET === 'function' && SET('roofOff') && typeof render === 'function')
          try{ render(); }catch(e){}
      }
      return;
    }
  });
}

/* ---------- how a machine looks ---------- */
function botArt(u){
  const col = BOT_JOB_COL[u.g] || BOT_JOB_COL.tidy;
  const working = u.state === 'work';
  let s = `<ellipse cx="1.4" cy="5.2" rx="7" ry="2.4" fill="url(#gShadow)" opacity=".55"/>`;
  /* chassis, lit from upper-left */
  s += `<rect x="-6.4" y="-5.4" width="12.8" height="10" rx="2.6" fill="#8d979d"/>`;
  s += `<rect x="-6.4" y="-5.4" width="12.8" height="3" rx="2.2" fill="#c3ccd2"/>`;
  s += `<rect x="3.4" y="-5.4" width="3" height="10" rx="2" fill="#000000" opacity=".18"/>`;
  /* sensor band and the light that says what it is out for */
  s += `<rect x="-4.6" y="-3.2" width="9.2" height="3.2" rx="1.2" fill="#2f373d"/>`;
  s += `<circle class="botlamp" cx="0" cy="-1.6" r="1.5" fill="${col.lit}" style="--i:${u.i%4}"/>`;
  /* A band in the job colour. At farm scale the whole machine is about
     fourteen pixels across, so this is a pixel and a half — it needs the
     depth and the lit top edge or the colour does not survive the size. */
  s += `<rect x="-6.4" y="1.2" width="12.8" height="3.4" fill="${col.c}"/>`;
  s += `<rect x="-6.4" y="1.2" width="12.8" height="1" fill="${col.lit}" opacity=".75"/>`;
  /* tracks */
  s += `<rect x="-7.4" y="-3.4" width="1.8" height="7" rx="0.9" fill="#4a5157"/>`;
  s += `<rect x="5.6" y="-3.4" width="1.8" height="7" rx="0.9" fill="#3f464b"/>`;
  /* the arm, down only while it is actually on a job */
  if(working)
    s += `<path class="botarm" d="M0 0 L0 7" stroke="${col.c}" stroke-width="1.8" stroke-linecap="round"/>`;
  return s;
}

function botLayer(){
  let g = document.getElementById('botlay');
  if(!g){
    const fg = document.getElementById('fg');
    if(!fg) return null;
    g = document.createElementNS('http://www.w3.org/2000/svg','g');
    g.id = 'botlay';
    g.setAttribute('pointer-events','none');
    fg.appendChild(g);
  }
  return g;
}

/* Built once and moved, never rebuilt — a CSS-animated lamp on an element
   that is recreated every frame restarts from zero every frame and sits
   frozen at the first keyframe, which is the p115 wing bug. */
function paintBots(){
  const B = botState();
  const g = botLayer(); if(!g) return;
  const have = {};
  [...g.children].forEach(el=>{ have[el.getAttribute('data-b')] = el; });
  B.units.forEach(u=>{
    let el = have[u.i];
    if(!el){
      el = document.createElementNS('http://www.w3.org/2000/svg','g');
      el.setAttribute('data-b', u.i);
      el.innerHTML = botArt(u);
      g.appendChild(el);
    } else if(el.dataset.look !== u.g + (u.state === 'work' ? '1' : '0')){
      el.innerHTML = botArt(u);            /* only when what it shows changed */
    }
    el.dataset.look = u.g + (u.state === 'work' ? '1' : '0');
    delete have[u.i];
    el.setAttribute('transform', `translate(${n(u.x)},${n(u.y)}) scale(${u.dir},1)`);
    el.style.opacity = (u.state === 'dock' && !(typeof SET==='function' && SET('roofOff'))) ? '0.85' : '1';
  });
  Object.keys(have).forEach(k=>have[k].remove());
}

if(typeof tickPeople === 'function'){
  const _tickPeopleBots = tickPeople;
  tickPeople = function(dt){
    const r = _tickPeopleBots.apply(this, arguments);
    try{
      if(typeof hub === 'function' && hub()){
        tickBots(Math.min(0.08, typeof dt === 'number' ? dt : 0.05));
        paintBots();
      }
    }catch(e){}
    return r;
  };
}

/* ---------- the bays, seen when the roof comes off ----------
   p122 gave the hub server racks. It gets a rank of docking bays as well,
   lit where a machine is home and dark where one is out. */
if(typeof INTERIORS === 'object'){
  INTERIORS.ai_hub = (w, h)=>{
    const B = botState();
    let s = KIT.machine(w*0.06, h*0.06, w*0.19, h*0.34, 1)
          + KIT.machine(w*0.29, h*0.06, w*0.19, h*0.34, 1)
          + KIT.bench(w*0.56, h*0.08, w*0.36, h*0.14);
    /* The bays sit in the middle band, not along the bottom. Down there
       they were completely hidden at Mk III and IV — the apron, verandah
       and planters are ground furniture, so they correctly stay put when
       the roof lifts, and they were sitting straight on top of the bays. */
    const bays = Math.max(1, botFleet());
    for(let i=0;i<bays;i++){
      const bx = w*0.07 + i*(w*0.86/bays), bw = w*0.86/bays - w*0.035;
      const u = B.units[i];
      const home = !u || u.state === 'dock' || u.state === 'home';
      s += `<rect x="${n(bx)}" y="${n(h*0.48)}" width="${n(bw)}" height="${n(h*0.20)}" rx="1.6"
        fill="#3f464b"/>`;
      s += `<rect x="${n(bx+1.4)}" y="${n(h*0.50)}" width="${n(bw-2.8)}" height="${n(h*0.16)}" rx="1.2"
        fill="${home ? '#5c6a58' : '#22282c'}"/>`;
      /* green when it is home, dim amber when the bay is empty */
      s += `<circle cx="${n(bx+bw-3.6)}" cy="${n(h*0.535)}" r="1.7"
        fill="${home ? '#7cc24f' : '#8a5a3a'}"/>`;
      if(home)
        s += `<rect x="${n(bx+3)}" y="${n(h*0.545)}" width="${n(bw-9)}" height="${n(h*0.09)}" rx="1"
          fill="#8d979d"/>`;
    }
    return s;
  };
}

/* ---------- the hub says it is working ---------- */
(function botCss(){
  const s = document.createElement('style');
  s.textContent = `
  .botlamp{ animation: botpulse 1.9s ease-in-out infinite; animation-delay: calc(var(--i)*.35s); }
  @keyframes botpulse{ 0%,100%{ opacity:.55 } 50%{ opacity:1 } }
  .botarm{ animation: botwork .5s ease-in-out infinite alternate; transform-origin: 0 0; }
  @keyframes botwork{ from{ transform: rotate(-13deg) } to{ transform: rotate(13deg) } }
  @media (prefers-reduced-motion: reduce){
    .botlamp, .botarm{ animation:none } }
  `;
  document.head.appendChild(s);
})();

/* ---------- handle ---------- */
G.hubRobotAudit = function(){
  const h = (typeof hub === 'function') ? hub() : null;
  if(!h) return { hub:false, note:'no farm control hub built' };
  const B = botState();
  const by = {}; B.units.forEach(u=>{ by[u.state] = (by[u.state]||0)+1; });
  return {
    mark: (typeof hubMark === 'function') ? 'Mk '+hubMark() : '—',
    capacityToday: (typeof hubCapacity === 'function') ? hubCapacity() : '—',
    machines: B.units.length,
    doing: by,
    jobsLeftOnTheRound: (B.queue || []).length,
    jobsItCouldNotReach: B.waiting || 0,
    outNow: B.units.filter(u=>u.state !== 'dock' && u.state !== 'home').length,
    carrying: B.units.map(u=>u.g),
    inDom: !!document.getElementById('botlay'),
    honestly: 'the round is shown, not gated — the work still lands at rollover',
  };
};
