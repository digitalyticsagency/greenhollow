/* =====================================================================
   PEOPLE WHO REMEMBER

   p62 gave everyone five needs and a mood that comes out of them, which
   is a good half of a mind: it explains what somebody wants right now. It
   does not explain why they like one person and not another, what they
   are quietly hoping for, or what they will still be thinking about next
   week. That is what this adds.

   FOUR TRAITS, FIXED. Warmth, grit, pride and patience, rolled once and
   never changed. They are the shape of the person, and everything below
   is read through them: a proud one takes a telling-off badly and a
   patient one lets it go.

   A MEMORY THAT LASTS. Things that happen to somebody are written down
   with a day and a weight — you taught them, you shouted at them, they
   were praised in front of the others, you sold the cow they liked.
   Ordinary memories fade over a fortnight. Strong ones do not fade at
   all, and they are still there being referred to a season later.

   OPINIONS OF EACH OTHER. Everyone holds a number about everyone else,
   including you, moved by what they have shared: working the same
   building all day, eating at the same table, watching you tear a strip
   off somebody. Warm people drift upward on their own; proud people do
   not forgive quickly.

   AND SOMETHING THEY WANT. Each person carries a private goal they never
   mention unless you ask — a day off, the market, to be taught the dairy,
   somewhere to sit by the water. They pursue it in their own time,
   whether or not you are watching, and getting it is worth more to them
   than anything you can say.

   TWELVE THINGS YOU CAN DO. Work alongside, teach, ask how they are,
   praise, apologise, argue, give something, share a meal, take them to
   the market, promote, let them go, and ask what they think of somebody
   else. Each one costs something real — hours, goods, money or goodwill —
   and each is remembered.
   ===================================================================== */

const MIND_GOALS = [
  { id:'dayoff',  n:'a day off',                    say:'I would not say no to a day off.' },
  { id:'market',  n:'a trip to the market',         say:'I have not been down to the market in ages.' },
  { id:'learn',   n:'to be taught something',       say:'Nobody has ever shown me how the dairy works.' },
  { id:'seat',    n:'somewhere to sit by the water',say:'Somewhere to sit by the water would be the thing.' },
  { id:'own',     n:'a patch of their own',         say:'I would like a bed of my own to do as I please with.' },
  { id:'quiet',   n:'to be left alone a while',     say:'I am not much for being organised, if I am honest.' },
];

function mind(p){
  if(!p) return null;
  if(!p.mind){
    const h = (k)=>+(0.15 + Math.random()*0.8).toFixed(2);
    p.mind = {
      traits: { warmth:h(1), grit:h(2), pride:h(3), patience:h(4) },
      mem: [],
      op: {},
      goal: MIND_GOALS[Math.floor(Math.random()*MIND_GOALS.length)].id,
      goalMet: 0,
      lastPraise: -99,
    };
  }
  return p.mind;
}
function allMinded(){
  return [].concat(S.family || [], S.workers || []).filter(p=>p && p.id !== '__self');
}
function personById(id){
  if(id === 'you') return { id:'you', name:'You' };
  return allMinded().find(p=>p.id === id) || null;
}

/* ---------- memory ---------- */
function remember(p, text, weight, kind){
  const m = mind(p); if(!m) return;
  m.mem.unshift({ t:text, d:S.day || 1, w:weight || 1, k:kind || 'event' });
  if(m.mem.length > 30) m.mem.length = 30;
}
/* ordinary things fade over a fortnight; strong ones never do */
function memWeightNow(e){
  if(e.w >= 3) return e.w;
  const age = (S.day || 1) - e.d;
  return Math.max(0, e.w * (1 - age/14));
}
function livingMemories(p){
  const m = mind(p); if(!m) return [];
  return m.mem.filter(e=>memWeightNow(e) > 0.05);
}

/* ---------- opinions ---------- */
function opinionOf(p, id){
  const m = mind(p); if(!m) return 0;
  if(m.op[id] === undefined) m.op[id] = 0;
  return m.op[id];
}
function shiftOpinion(p, id, by){
  const m = mind(p); if(!m) return;
  const t = m.traits;
  /* pride resists a rise after a knock; warmth speeds one */
  let k = by > 0 ? (0.7 + t.warmth*0.6) : (0.7 + t.pride*0.7);
  m.op[id] = Math.max(-100, Math.min(100, (m.op[id] || 0) + by*k));
}
function opinionWord(v){
  if(v >= 55) return 'thinks the world of you';
  if(v >= 25) return 'likes you';
  if(v >= 8)  return 'is warm enough';
  if(v > -8)  return 'has no strong view';
  if(v > -25) return 'is cool with you';
  if(v > -55) return 'does not much like you';
  return 'cannot stand you';
}

/* ---------- mood, carried across days ---------- */
function moodOf(p){
  const m = mind(p); if(!m) return 0.6;
  let base = (p.mood === undefined ? 0.65 : p.mood);
  /* what they are still carrying */
  livingMemories(p).forEach(e=>{ base += (e.k === 'good' ? 1 : e.k === 'bad' ? -1 : 0) * memWeightNow(e) * 0.035; });
  if(m.goalMet && (S.day || 1) - m.goalMet < 12) base += 0.12;
  return Math.max(0, Math.min(1, base));
}

/* ---------- what they are quietly after ---------- */
function goalOf(p){
  const m = mind(p); if(!m) return null;
  return MIND_GOALS.find(g=>g.id === m.goal) || null;
}
function goalSpot(p){
  const g = goalOf(p); if(!g) return null;
  const find = (test)=> (S.objs || []).find(o=>test(BPMAP[o.bp] || {}, o));
  let o = null;
  if(g.id === 'seat')  o = find(bp=>bp.id === 'bench') || find(bp=>bp.kind === 'water');
  if(g.id === 'quiet') o = find(bp=>/tree_/.test(bp.art || ''));
  if(g.id === 'own')   o = find(bp=>bp.kind === 'plot');
  if(g.id === 'learn') o = find(bp=>bp.kind === 'process');
  if(!o) return null;
  const f = footprint(BPMAP[o.bp], o.rot);
  return { x:(o.tx + f.w/2)*T, y:(o.ty + f.h + 0.4)*T, obj:o };
}

/* they go after it in their own time, which is the point of it being private */
if(typeof routine === 'function'){
  const _routineMind = routine;
  routine = function(p){
    const base = _routineMind.apply(this, arguments);
    try{
      if(!p || p.controlled) return base;
      if(!base || base.act === 'asleep') return base;
      const m = mind(p);
      const f = (typeof dayFrac === 'function') ? dayFrac() : 0.5;
      /* an hour in the late afternoon is their own */
      if(f > 0.70 && f < 0.80 && m && !m.goalMet){
        const sp = goalSpot(p);
        if(sp){
          if(Math.hypot(sp.x - p.x, sp.y - p.y) < T*1.2 && !m.goalMet){
            m.goalMet = S.day || 1;
            remember(p, `Got ${goalOf(p).n} at last.`, 3, 'good');
            shiftOpinion(p, 'you', 6);
            if(typeof log === 'function')
              log(`${p.name} finally got ${goalOf(p).n}.`, 'good', 'home');
          }
          return { x:sp.x, y:sp.y, act:'after something of their own' };
        }
      }
    }catch(e){}
    return base;
  };
}

/* ---------- being near each other builds an opinion ---------- */
let MINDS_T = 0;
function mindTick(dt){
  MINDS_T += dt;
  if(MINDS_T < 3) return;
  MINDS_T = 0;
  const all = allMinded();
  all.forEach(a=>{
    mind(a);
    all.forEach(b=>{
      if(a === b) return;
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if(d < T*2.2){
        /* time spent together, coloured by how warm each of them is */
        const m = mind(a);
        shiftOpinion(a, b.id, 0.35 * (0.5 + m.traits.warmth));
      }
    });
    /* and being near you counts for something too */
    if(S.you && Math.hypot(a.x - S.you.x, a.y - S.you.y) < T*2.2)
      shiftOpinion(a, 'you', 0.22);
  });
}
if(typeof tickPeople === 'function'){
  const _tickMind = tickPeople;
  tickPeople = function(dt){
    const r = _tickMind.apply(this, arguments);
    try{ mindTick(typeof dt === 'number' ? dt : 1/30); }catch(e){}
    return r;
  };
}

/* ---------- a mood you can measure in the work ---------- */
if(typeof workersDay === 'function'){
  const _workersDayMind = workersDay;
  workersDay = function(){
    const hands = S.workers || [];
    const keep = hands.map(w=>w.skill);
    hands.forEach(w=>{
      const mo = moodOf(w), op = opinionOf(w, 'you');
      /* a miserable hand who dislikes you does less; a happy one who likes
         you does more. Bounded so it never decides the whole day. */
      const lift = (mo - 0.6) * 1.6 + (op/100) * 0.8;
      w.skill = Math.max(0, (w.skill || 0) + lift);
    });
    let r;
    try{ r = _workersDayMind.apply(this, arguments); }
    finally{ hands.forEach((w,i)=>{ w.skill = keep[i]; }); }
    return r;
  };
}

/* ---------- the twelve things ---------- */
const ACTIONS = [
  { id:'alongside', n:'Work alongside them', d:'An hour of your day, next to them.',
    can:()=>true,
    run(p){ const m = mind(p);
      shiftOpinion(p, 'you', 7); p.need && (p.need.social = Math.max(0, p.need.social - 0.3));
      p.skill = Math.min(9, (p.skill || 0) + 0.08);
      remember(p, 'Worked alongside you for an afternoon.', 1.6, 'good');
      return `${p.name} got on with it beside you. Easier company than expected.`; } },

  { id:'teach', n:'Teach them something', d:'Costs you the afternoon; they get better at it.',
    can:()=>true,
    run(p){ p.skill = Math.min(9, (p.skill || 0) + 0.5);
      shiftOpinion(p, 'you', 9);
      const m = mind(p); if(m.goal === 'learn' && !m.goalMet){ m.goalMet = S.day || 1;
        shiftOpinion(p, 'you', 12);
        remember(p, 'You taught them properly. Nobody had before.', 3, 'good');
        return `${p.name} has wanted this for months. Skill now ${(p.skill).toFixed(1)}.`; }
      remember(p, 'You showed them how something was done.', 2, 'good');
      return `Skill now ${(p.skill).toFixed(1)}.`; } },

  { id:'ask', n:'Ask how they are', d:'Free. They may tell you what they are after.',
    can:()=>true,
    run(p){ const m = mind(p), g = goalOf(p);
      shiftOpinion(p, 'you', 2);
      const mo = moodOf(p);
      const feel = mo > 0.75 ? 'in good spirits' : mo > 0.5 ? 'alright' :
                   mo > 0.3 ? 'a bit flat' : 'not good at all';
      const mem = livingMemories(p)[0];
      return `${p.name} is ${feel}. "${g ? g.say : 'Nothing much to report.'}"` +
        (mem ? ` Still thinking about: ${mem.t.toLowerCase()}` : ''); } },

  { id:'praise', n:'Praise them', d:'Free, and worth less each time you do it.',
    can:()=>true,
    run(p){ const m = mind(p);
      const since = (S.day || 1) - m.lastPraise;
      const worth = since > 20 ? 8 : since > 8 ? 4 : 1;
      m.lastPraise = S.day || 1;
      shiftOpinion(p, 'you', worth);
      remember(p, 'You said they had done well.', worth > 4 ? 2 : 0.6, 'good');
      return worth > 4 ? `${p.name} went a bit pink and said nothing.`
        : `${p.name} nodded. You have said it a lot lately.`; } },

  { id:'apologise', n:'Apologise', d:'Only worth anything if there is something to apologise for.',
    can:(p)=>livingMemories(p).some(e=>e.k === 'bad'),
    run(p){ const m = mind(p);
      const bad = m.mem.find(e=>e.k === 'bad' && memWeightNow(e) > 0.05);
      if(bad) bad.w = Math.max(0.4, bad.w * 0.35);
      shiftOpinion(p, 'you', 10 + mind(p).traits.warmth*8);
      remember(p, 'You apologised, and meant it.', 2.4, 'good');
      return `${p.name} said it was forgotten. It is not, but it is smaller.`; } },

  { id:'argue', n:'Tell them off', d:'Fixes slacking. Remembered for a long time.',
    can:()=>true,
    run(p){ const t = mind(p).traits;
      shiftOpinion(p, 'you', -(14 + t.pride*16));
      p.need && (p.need.purpose = Math.max(0, p.need.purpose - 0.45));
      remember(p, 'You tore a strip off them in the yard.', 3, 'bad');
      /* and everyone who saw it thinks slightly less of you */
      allMinded().forEach(o=>{ if(o !== p && Math.hypot(o.x - p.x, o.y - p.y) < T*4){
        shiftOpinion(o, 'you', -4); remember(o, `Saw you shouting at ${p.name}.`, 1.4, 'bad'); } });
      return `${p.name} took it badly. Anyone in the yard saw it.`; } },

  { id:'give', n:'Give them something', d:'Out of the barn. Costs you the goods.',
    can:()=>Object.keys(S.store || {}).some(k=>(S.store[k] || 0) > 0),
    run(p){ const k = Object.keys(S.store).find(x=>(S.store[x] || 0) > 0);
      S.store[k] -= 1;
      shiftOpinion(p, 'you', 11);
      remember(p, `You gave them ${GOODS[k] ? GOODS[k].n.toLowerCase() : k} for nothing.`, 2.2, 'good');
      return `${p.name} took the ${GOODS[k] ? GOODS[k].n.toLowerCase() : k} and looked pleased.`; } },

  { id:'meal', n:'Share a meal', d:'Everybody at the table thinks better of everybody.',
    can:()=>true,
    run(p){ const here = allMinded();
      here.forEach(a=>{ shiftOpinion(a, 'you', 4);
        here.forEach(b=>{ if(a !== b) shiftOpinion(a, b.id, 3); });
        a.need && (a.need.food = Math.max(0, a.need.food - 0.4));
        a.need && (a.need.social = Math.max(0, a.need.social - 0.35)); });
      remember(p, 'Everyone ate together.', 1.8, 'good');
      return `The whole table, for once. It did everybody good.`; } },

  { id:'market', n:'Take them to the market', d:'A day gone, and they will not forget it.',
    can:()=>true,
    run(p){ const m = mind(p);
      shiftOpinion(p, 'you', 16);
      if(m.goal === 'market' && !m.goalMet){ m.goalMet = S.day || 1; shiftOpinion(p, 'you', 12);
        remember(p, 'You took them to the market. They had been hoping for months.', 3, 'good');
        return `${p.name} talked the whole way there and the whole way back.`; }
      remember(p, 'You took them down to the market.', 2.6, 'good');
      return `${p.name} enjoyed the day out.`; } },

  { id:'promote', n:'Put their wage up', d:'Workers only. Costs you every month.',
    can:(p)=>(S.workers || []).includes(p) && !p.wwoof,
    run(p){ const up = Math.round((p.wage || 900) * 0.15);
      p.wage = (p.wage || 900) + up;
      shiftOpinion(p, 'you', 14);
      remember(p, 'You put their wage up without being asked.', 3, 'good');
      return `${p.name} is on ${fmt(p.wage)} a month now.`; } },

  { id:'let-go', n:'Let them go', d:'Ends it. The others will have a view.',
    can:(p)=>(S.workers || []).includes(p),
    run(p){ const name = p.name;
      S.workers = (S.workers || []).filter(w=>w !== p);
      allMinded().forEach(o=>{ shiftOpinion(o, 'you', -9);
        remember(o, `You let ${name} go.`, 2.6, 'bad'); });
      return `${name} packed up and went. Nobody said much.`; } },

  { id:'about', n:'Ask what they think of somebody', d:'Free, and occasionally awkward.',
    can:()=>allMinded().length > 1,
    run(p){ const others = allMinded().filter(o=>o !== p);
      const o = others[Math.floor(Math.random()*others.length)];
      const v = opinionOf(p, o.id);
      const word = v > 25 ? 'gets on well with them' : v > 8 ? 'has no complaints'
        : v > -8 ? 'has not thought about it' : v > -25 ? 'finds them hard work'
        : 'would rather not be on the same job as them';
      return `${p.name} ${word} — about ${o.name}.`; } },
];

/* ---------- the panel ---------- */
G.openPerson = function(id){
  const p = personById(id) || allMinded()[0];
  if(!p) return modal(`<h2>Nobody here</h2><p class="sub">There is no one else on the place yet.</p>
    <div class="mfoot"><button class="btn ghost" onclick="G.closeModal()">Close</button></div>`);
  const m = mind(p), g = goalOf(p), mo = moodOf(p), op = opinionOf(p, 'you');
  const mems = livingMemories(p).slice(0, 5);
  modal(`<h2>${p.name}</h2>
    <p class="sub">${p.role || 'farmhand'}${p.wwoof ? ` · here from ${p.wwoof.from}` : ''}
      · ${opinionWord(op)}</p>
    <div class="rows">
      <div class="row"><span>Mood</span><b>${Math.round(mo*100)}%</b></div>
      <div class="row"><span>What they think of you</span><b>${Math.round(op)}</b></div>
      <div class="row"><span>Quietly after</span><b>${g ? (m.goalMet ? g.n + ' — got it' : g.n) : '—'}</b></div>
      <div class="row"><span>Made of</span><b>${
        Object.entries(m.traits).sort((a,b)=>b[1]-a[1]).slice(0,2)
          .map(([k])=>k).join(' and ')}</b></div>
    </div>
    ${mems.length ? `<h3 style="margin:14px 0 6px;font-size:15px">Still carrying</h3>
      <div class="rows">${mems.map(e=>`<div class="row"><span>${e.t}</span>
        <b class="${e.k === 'bad' ? 'cbad' : e.k === 'good' ? 'cgood' : ''}">day ${e.d}</b></div>`).join('')}</div>` : ''}
    <h3 style="margin:14px 0 6px;font-size:15px">What you can do</h3>
    <div class="mkgrid">${ACTIONS.filter(a=>{ try{ return a.can(p); }catch(e){ return false; } })
      .map(a=>`<button class="mkcard" onclick="G.doTo('${p.id}','${a.id}')">
        <b>${a.n}</b><span class="muted">${a.d}</span></button>`).join('')}</div>
    <div id="mindsay" style="margin-top:10px"></div>
    <div class="mfoot">
      <button class="btn ghost" onclick="G.closeModal()">Leave them be</button>
      <button class="btn" onclick="G.openPeoplePicker()">Somebody else</button></div>`);
};
G.doTo = function(pid, aid){
  const p = personById(pid); const a = ACTIONS.find(x=>x.id === aid);
  if(!p || !a) return;
  let said = '';
  try{ said = a.run(p) || ''; }catch(e){ said = 'That did not go anywhere.'; }
  if(typeof log === 'function' && said) log(`${said}`, '', 'home');
  const gone = !allMinded().includes(p);
  if(gone){ G.closeModal(); return; }
  G.openPerson(pid);
  const box = document.getElementById('mindsay');
  if(box) box.innerHTML = `<div class="note" style="margin:0;border-left:2px solid var(--gold,#d8b45a);
    padding-left:14px">${said}</div>`;
};
G.openPeoplePicker = function(){
  const all = allMinded();
  modal(`<h2>Who?</h2>
    <div class="mkgrid">${all.map(p=>{
      const op = opinionOf(p, 'you'), mo = moodOf(p);
      return `<button class="mkcard" onclick="G.openPerson('${p.id}')"><b>${p.name}</b>
        <span class="muted">${p.role || 'farmhand'} · ${opinionWord(op)}<br>
          mood ${Math.round(mo*100)}%</span></button>`; }).join('')}</div>
    ${all.length ? '' : '<p class="sub">Nobody here yet.</p>'}
    <div class="mfoot"><button class="btn ghost" onclick="G.closeModal()">Close</button></div>`);
};

if(typeof syncWorldButtons === 'function'){
  const _syncMind = syncWorldButtons;
  syncWorldButtons = function(){
    const r = _syncMind.apply(this, arguments);
    try{
      const host = document.getElementById('zoomctl');
      if(host && !document.getElementById('mindbtn')){
        const b = document.createElement('button');
        b.id = 'mindbtn'; b.textContent = '💬';
        b.title = 'The people here';
        b.setAttribute('data-tip','<b>The people here</b>What they think, what they want, and what you can do about it.');
        b.onclick = ()=>G.openPeoplePicker();
        host.insertBefore(b, host.firstChild);
      }
      const b2 = document.getElementById('mindbtn');
      if(b2) b2.style.display = allMinded().length ? '' : 'none';
    }catch(e){}
    return r;
  };
}

/* ---------- handle ---------- */
G.mindsAudit = function(){
  const all = allMinded();
  return {
    people: all.length,
    actions: ACTIONS.length,
    each: all.map(p=>{
      const m = mind(p), g = goalOf(p);
      return {
        who: p.name + ' (' + (p.role || 'farmhand') + ')',
        mood: Math.round(moodOf(p)*100) + '%',
        ofYou: Math.round(opinionOf(p, 'you')),
        traits: Object.entries(m.traits).map(([k,v])=>k[0] + v.toFixed(2)).join(' '),
        wants: g ? (m.goalMet ? g.n + ' (got it)' : g.n) : '-',
        memories: livingMemories(p).length,
        strongest: (livingMemories(p).sort((a,b)=>memWeightNow(b)-memWeightNow(a))[0] || {}).t || '-',
        opinionsHeld: Object.keys(m.op).length,
      };
    }),
  };
};
