/* =====================================================================
   SOMEBODY COMES FOR THE SEASON

   Hiring is a transaction: a signing fee, a wage, and a farmhand who
   arrives already able to do the job. The thing that actually happens on
   a smallholding is warmer and considerably less efficient — someone
   turns up for a season, works for their board and their dinner, and is
   genuinely no use for the first fortnight.

   THEY ARRIVE WITH A REASON. A name, somewhere they came from, and why
   they wrote to you: leaving a city job, learning before buying their own
   block, travelling and out of money, writing a thesis on soil. It is one
   line and it is the difference between a person and a unit of labour.

   THEY ARE BAD AT IT FIRST. A hired hand starts at skill one to three. A
   WWOOFer starts at zero — worse than nobody, because you are also
   feeding them — and climbs to about two and a half over a fortnight. Take
   one on the week before harvest and you have made a mistake. Take one in
   the quiet part of the season and by the time it matters they are
   worth having.

   THEY EAT. They go into the household count, so dinner is cooked for one
   more and the barn empties faster. That is the deal: board and food, no
   wage. It is cheaper than hiring and it is not free.

   THEY LEAVE. Six weeks and they are gone. Some ask to stay on — and they
   ask, rather than you deciding, with the answer depending on whether the
   place was any good to be on. Say yes and they become a paid farmhand at
   a wage they have earned, already knowing where everything is.

   Housing is a bed, not a cottage: a bunk in the guest wing or the
   bunkhouse will do, which is what those buildings are for and what
   nobody was using them for.
   ===================================================================== */

const WWOOF_NAMES = ['Ines','Tomas','Mei','Rafa','Anneke','Jonah','Priya','Kai',
                     'Marta','Lucien','Saoirse','Otto'];
const WWOOF_FROM  = ['Lyon','Osaka','Galway','Turin','Rotterdam','Valparaíso','Leeds',
                     'Kraków','Porto','Wellington','Montréal','Ljubljana'];
const WWOOF_WHY = [
  'left an office job in March and has not gone back',
  'wants a block of their own and has never dug one',
  'is travelling and ran out of money in the nicest possible way',
  'is writing something about soil and needs to have held some',
  'grew up on a farm that was sold and misses it',
  'answered the notice in the co-op window',
];
const WWOOF_STAY = 42;            /* days: six weeks */
const WWOOF_LEARN = 14;           /* days to become worth having */

function wwoofState(){
  if(!S.wwoof) S.wwoof = { day:-1, offer:null, seen:0 };
  return S.wwoof;
}
function wwoofers(){ return (S.workers || []).filter(w=>w.wwoof); }
/* a bunk anywhere will do — that is the point of them */
function wwoofBeds(){
  return (S.objs || []).reduce((a,o)=>{
    const bp = BPMAP[o.bp]; if(!bp) return a;
    if(['guest_wing','bunkhouse','bunk_annexe','shepherd_hut','worker_cottage'].includes(bp.id))
      return a + Math.max(1, bp.slots || 2);
    return a;
  }, 0);
}
function wwoofRoom(){ return wwoofBeds() - wwoofers().length; }

/* skill climbs from nothing over a fortnight */
function wwoofSkill(w){
  const days = (S.day || 1) - (w.wwoof.arrived || 1);
  return Math.max(0, Math.min(2.5, (days / WWOOF_LEARN) * 2.5));
}

/* ---------- somebody writes to you ---------- */
function wwoofTick(){
  const W = wwoofState();
  if(W.day === S.day) return;
  W.day = S.day;

  /* skills climb, stays run out */
  (S.workers || []).forEach(w=>{
    if(!w.wwoof) return;
    w.skill = wwoofSkill(w);
    const left = (w.wwoof.arrived + WWOOF_STAY) - (S.day || 1);
    if(left === 7 && typeof log === 'function')
      log(`${w.name} has a week left.`, '', 'home');
    if(left <= 0) wwoofLeaves(w);
  });

  /* an offer, now and then, if there is a bed and not already one here */
  if(!W.offer && wwoofRoom() > 0 && wwoofers().length < 2 && (S.day || 1) > 6){
    if(Math.random() < 0.06){
      const i = Math.floor(Math.random()*WWOOF_NAMES.length);
      W.offer = {
        name: WWOOF_NAMES[i],
        from: WWOOF_FROM[(i + Math.floor(Math.random()*5)) % WWOOF_FROM.length],
        why:  WWOOF_WHY[Math.floor(Math.random()*WWOOF_WHY.length)],
        day:  S.day || 1,
      };
      if(typeof log === 'function')
        log(`${W.offer.name} from ${W.offer.from} has written asking to come and work for `
          + `board and food.`, 'gold', 'home');
      if(typeof toast === 'function') toast('A letter about the summer', 'gold');
    }
  }
  /* an unanswered letter goes cold */
  if(W.offer && (S.day || 1) - W.offer.day > 5){
    if(typeof log === 'function') log(`${W.offer.name} found somewhere else.`, '', 'home');
    W.offer = null;
  }
}

function wwoofLeaves(w){
  const W = wwoofState();
  const goodPlace = ((S.morale === undefined ? 0.6 : S.morale) > 0.55)
    && ((typeof stat === 'function' ? (stat().charm || 0) : 0) > 40);
  S.workers = (S.workers || []).filter(z=>z.id !== w.id);
  W.seen = (W.seen || 0) + 1;
  if(goodPlace && Math.random() < 0.45){
    const wage = 900 + Math.round(w.skill * 280);
    if(typeof log === 'function')
      log(`${w.name}'s six weeks are up and they have asked to stay on — ${fmt(wage)} a month, `
        + `and they already know where everything is.`, 'gold', 'home');
    W.askingToStay = { name:w.name, skill:+w.skill.toFixed(1), wage, from:w.wwoof.from };
    if(typeof toast === 'function') toast(`${w.name} would like to stay`, 'gold');
  } else {
    if(typeof log === 'function')
      log(`${w.name} went back to ${w.wwoof.from} this morning.`, '', 'home');
  }
}

G.wwoofAccept = function(){
  const W = wwoofState();
  const o = W.offer; if(!o) return;
  if(wwoofRoom() <= 0) return toast('Nowhere to put them','bad');
  S.workers = S.workers || [];
  S.workers.push({
    id:'ww' + Date.now(), name:o.name, skill:0, wage:0,
    x:(FARM.x+2)*T, y:(FARM.y+2)*T, path:[], state:'idle', dir:1, t:0, done:0,
    wwoof:{ arrived:S.day || 1, from:o.from, why:o.why },
  });
  W.offer = null;
  if(typeof log === 'function')
    log(`${o.name} arrived from ${o.from}. Six weeks, board and food, and no idea what a `
      + `dibber is.`, 'gold', 'home');
  try{ sfx('build'); }catch(e){}
  if(typeof render === 'function') render();
  if(typeof ui === 'function') ui();
  G.openWwoof();
};
G.wwoofDecline = function(){
  const W = wwoofState();
  if(W.offer && typeof log === 'function') log(`Wrote back to ${W.offer.name} to say no.`, '', 'home');
  W.offer = null;
  G.openWwoof();
};
G.wwoofKeep = function(yes){
  const W = wwoofState();
  const a = W.askingToStay; if(!a) return;
  if(yes){
    if(S.cash < a.wage) return toast('Not enough to take on a wage','bad');
    S.workers = S.workers || [];
    S.workers.push({ id:'w' + Date.now(), name:a.name, skill:Math.max(1, Math.round(a.skill)),
      wage:a.wage, x:(FARM.x+2)*T, y:(FARM.y+2)*T, path:[], state:'idle', dir:1, t:0, done:0 });
    if(typeof log === 'function') log(`${a.name} stayed on at ${fmt(a.wage)} a month.`, 'gold', 'home');
  } else {
    if(typeof log === 'function') log(`${a.name} went back to ${a.from}.`, '', 'home');
  }
  W.askingToStay = null;
  if(typeof ui === 'function') ui();
  G.openWwoof();
};

/* ---------- they eat ---------- */
if(typeof household === 'function'){
  const _householdWwoof = household;
  household = function(){
    /* p86 counts you plus the family. A WWOOFer is board and food, so they
       are at the table; a paid farmhand feeds themselves. */
    return _householdWwoof.apply(this, arguments) + wwoofers().length;
  };
}
/* and they need a bed, but not a worker cottage */
if(typeof workerBeds === 'function'){
  const _bedsWwoof = workerBeds;
  workerBeds = function(){
    return _bedsWwoof.apply(this, arguments) + wwoofers().length;
  };
}

if(typeof tickPeople === 'function'){
  const _tickWwoof = tickPeople;
  tickPeople = function(){
    const r = _tickWwoof.apply(this, arguments);
    try{ wwoofTick(); }catch(e){}
    return r;
  };
}

/* ---------- the panel ---------- */
G.openWwoof = function(){
  const W = wwoofState();
  const here = wwoofers();
  let h = `<h2>Working visitors</h2>`;
  if(W.askingToStay){
    const a = W.askingToStay;
    h += `<div class="note" style="border-left:2px solid var(--gold,#d8b45a);padding-left:14px;margin:0 0 14px">
      <b>${a.name} would like to stay on.</b> Skill ${a.skill} now, and they know the place.
      ${fmt(a.wage)} a month.
      <div style="margin-top:8px;display:flex;gap:8px">
        <button class="btn" onclick="G.wwoofKeep(1)">Take them on</button>
        <button class="btn ghost" onclick="G.wwoofKeep(0)">Say goodbye</button></div></div>`;
  }
  if(W.offer){
    const o = W.offer;
    h += `<div class="mkgrid"><button class="mkcard" onclick="G.wwoofAccept()">
        <b>${o.name}, from ${o.from}</b>
        <span class="muted">${o.why}. Six weeks, board and food, no wage.</span>
        <span class="lprice">Write back yes</span></button>
      <button class="mkcard" onclick="G.wwoofDecline()"><b>Not this season</b>
        <span class="muted">You have enough on.</span>
        <span class="lprice">Decline</span></button></div>`;
  }
  if(here.length){
    h += `<h3 style="margin:14px 0 6px;font-size:15px">Here now</h3><div class="rows">`;
    here.forEach(w=>{
      const days = (S.day || 1) - w.wwoof.arrived;
      const left = WWOOF_STAY - days;
      h += `<div class="row"><span><b>${w.name}</b> <span class="muted">from ${w.wwoof.from}</span><br>
        <span class="muted" style="font-size:11px">${days < WWOOF_LEARN
          ? 'still learning — ' + Math.round(wwoofSkill(w)*10)/10 + ' of 2.5'
          : 'worth having now'}</span></span>
        <b>${left} day${left===1?'':'s'} left</b></div>`;
    });
    h += `</div>`;
  }
  if(!W.offer && !here.length && !W.askingToStay){
    h += `<p class="sub">Nobody at the moment. People write when there is a bed free —
      a bunk in the guest wing, the bunkhouse or a shepherd's hut is enough.
      You have ${wwoofRoom()} spare.</p>`;
  }
  h += `<p class="sub" style="margin-top:12px">They work for board and their dinner. No wage, but
    they eat with the household, and they are no use at all for the first fortnight.</p>
    <div class="mfoot"><button class="btn ghost" onclick="G.closeModal()">Close</button></div>`;
  modal(h);
};

if(typeof syncWorldButtons === 'function'){
  const _syncWwoof = syncWorldButtons;
  syncWorldButtons = function(){
    const r = _syncWwoof.apply(this, arguments);
    try{
      const host = document.getElementById('zoomctl');
      if(host && !document.getElementById('wwoofbtn')){
        const b = document.createElement('button');
        b.id = 'wwoofbtn'; b.textContent = '🎒';
        b.title = 'Working visitors';
        b.setAttribute('data-tip','<b>Working visitors</b>Somebody for the season, for board and food.');
        b.onclick = ()=>G.openWwoof();
        host.insertBefore(b, host.firstChild);
      }
      const b2 = document.getElementById('wwoofbtn');
      const W = wwoofState();
      if(b2) b2.style.display = (wwoofers().length || W.offer || W.askingToStay || wwoofBeds() > 0)
        ? '' : 'none';
      if(b2) b2.classList.toggle('has-people', !!(W.offer || W.askingToStay));
    }catch(e){}
    return r;
  };
}

/* ---------- handle ---------- */
G.wwoofAudit = function(){
  const W = wwoofState();
  return {
    beds: wwoofBeds(), spare: wwoofRoom(),
    hereNow: wwoofers().map(w=>({ name:w.name, from:w.wwoof.from,
      day:(S.day||1) - w.wwoof.arrived, skill:+wwoofSkill(w).toFixed(2),
      jobsPerDay: 2 + wwoofSkill(w), wage:w.wage })),
    offerOpen: W.offer ? `${W.offer.name} from ${W.offer.from}` : null,
    askingToStay: W.askingToStay ? W.askingToStay.name : null,
    haveStayed: W.seen || 0,
    householdAtTable: (typeof household === 'function') ? household() : '?',
    stayLength: WWOOF_STAY + ' days', learnIn: WWOOF_LEARN + ' days',
  };
};
