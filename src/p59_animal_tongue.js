/* =====================================================================
   ANIMALS DO NOT SPEAK ENGLISH

   Until now the stock said things like "Good grass here", "I ate the
   fence" and "Trough is empty", and the clever one delivered whole
   sentences. That is a person in an animal costume.

   Two changes.

   First, a tongue. Every species gets its own syllables and its own way
   of inflecting them, and every utterance is generated rather than
   picked off a list - so a hungry chicken and a sleepy chicken make
   recognisably different noises, and no two are quite the same. Meaning
   travels by pictogram instead of words: an animal that wants feed shows
   a grain, not the sentence "I am hungry". An animal thinking shows the
   thing it is thinking about. Two animals of the same species answer
   each other; two of different species mostly do not understand one
   another, and say so.

   Second, a mind worth having. Each animal carries five needs that drift
   on their own - food, water, rest, company, curiosity - a mood that
   falls out of whichever need is loudest, and a bond with one particular
   other animal that it will cross the pen to stand next to. What it does
   and what it says both come from that, so the pen is legible: an animal
   at the feeder is there because it is hungry, and it sounds hungry.
   ===================================================================== */

/* ---------- 1. the tongue ---------- */
/* soft: contented, close-range. loud: carrying calls. purr: contact
   noise made when touching or settled. Every species gets all three so
   the generator never has to special-case anything. */
const TONGUE = {
  chicken:{ soft:['bok','buk','brk','bup'],      loud:['BAWK','BOK'],   purr:'brrrrr',  trill:'bugurk' },
  duck:   { soft:['quak','wak','wek'],           loud:['QUACK','WAAK'], purr:'mrrp',    trill:'quaquaqua' },
  sheep:  { soft:['baa','bah','meh'],            loud:['BAAA','MAAA'],  purr:'mmmh',    trill:'baa-aa-aa' },
  goat:   { soft:['meh','maa','neh'],            loud:['MEHHH','NAAA'], purr:'hmmn',    trill:'meh-eh-eh' },
  cow:    { soft:['moo','mrr','hmm'],            loud:['MOOO','MRRAA'], purr:'hrrrmm',  trill:'moo-oo-oo' },
  rabbit: { soft:['*sniff*','*nose twitch*'],    loud:['*THUMP*'],      purr:'*purr*',  trill:'*thump thump*' },
  bee:    { soft:['bzz','bzt','vzz'],            loud:['BZZZT'],        purr:'bzzzzz',  trill:'bzz-bzz-bzz' },
};

/* what an animal is thinking about, shown as the thing itself */
const PICTO = {
  food:'🌾', water:'💧', rest:'😴', company:'🫂', curious:'❓', alarm:'❗',
  cold:'🌧️', warm:'☀️', play:'🌀', bond:'💛', gate:'🚪', human:'🧍', pest:'🐛',
};

function pick(a){ return a[Math.floor(Math.random()*a.length)]; }
function rep(sy, n, join){ return new Array(n).fill(sy).join(join === undefined ? ' ' : join); }

/* Build an utterance. The mood decides length, volume and punctuation -
   which is most of what carries emotion in an animal call. */
function utter(kind, mood){
  const T = TONGUE[kind] || TONGUE.sheep;
  const s = () => pick(T.soft);
  switch(mood){
    case 'alarm':    return pick(T.loud) + (Math.random()<0.5 ? '!' : '!!');
    case 'hungry':   return rep(s(), 2 + (Math.random()<0.4?1:0)) + '!';
    case 'thirsty':  return s() + ' ' + s() + '?';
    case 'curious':  return s() + '?';
    case 'social':   return Math.random()<0.4 ? T.trill : s() + ' ' + s() + (Math.random()<0.5?'?':'!');
    case 'sleepy':   return Math.random()<0.5 ? T.purr : s() + '…';
    case 'play':     return pick(T.loud).toLowerCase() + '! ' + s() + '!';
    case 'affection':return T.purr;
    case 'confused': return s() + '…?';
    default:         return Math.random()<0.28 ? T.purr : rep(s(), 1 + (Math.random()<0.45?1:0));
  }
}

/* the call, plus the thing it is about - only sometimes, so the pen is
   not a wall of emoji */
function utterWith(kind, mood, need){
  const line = utter(kind, mood);
  const p = PICTO[need];
  if(!p) return line;
  return Math.random() < 0.55 ? line + ' ' + p : line;
}

/* ---------- 2. the mind ---------- */
/* Needs drift up on their own and are pushed down by doing the matching
   thing. Whichever is highest is what the animal is currently about. */
const NEEDS = ['food','water','rest','company','curious'];
/* Tuned against a measurement, not a guess: at the first values every
   need sat pinned at 1.0 after 300 ticks, so mood was just "whichever
   need happened to be a hair higher" - noise wearing a model's clothes.
   A need now takes a few minutes to build and a few seconds of doing the
   right thing to clear. */
const NEED_DRIFT = { food:0.0042, water:0.0050, rest:0.0026, company:0.0038, curious:0.0034 };
const NEED_EASE  = 0.20;
const NEED_MOOD  = { food:'hungry', water:'thirsty', rest:'sleepy', company:'social', curious:'curious' };
/* the indoor and outdoor activity that answers each need */
/* Each species does its own version of answering a need - a chicken
   scratches where a cow grazes, and the log reads better for it. */
const NEED_ACT = {
  food:    { out:'grazing',         in:'at the feed' },
  water:   { out:'at the water',    in:'at the drinker' },
  rest:    { out:'resting',         in:'bedded down' },
  company: { out:'with the others', in:'huddled up' },
  curious: { out:'investigating',   in:'nosing about' },
};
const FEED_VERB = { chicken:'scratching', duck:'dabbling', bee:'foraging',
                    rabbit:'nibbling', goat:'browsing' };
function actFor(kind, need, inside){
  const base = NEED_ACT[need][inside ? 'in' : 'out'];
  if(need === 'food' && !inside && FEED_VERB[kind]) return FEED_VERB[kind];
  return base;
}

function seedMind(m, a){
  if(a.need) return;
  a.need = {};
  NEEDS.forEach(k=>{ a.need[k] = Math.random()*0.4; });
  a.mood = 'content';
  /* one particular friend, not a general fondness for everyone */
  if(m.list.length > 1){
    let b = a.i;
    while(b === a.i) b = Math.floor(Math.random()*m.list.length);
    a.bond = b;
  } else a.bond = -1;

  /* line is generated on read, so it is fresh every time and cannot be
     overwritten with English by the older code that still assigns to it */
  Object.defineProperty(a, 'line', {
    get(){ return utterWith(m.kind, a.mood, a.topNeed); },
    set(){ /* deliberately ignored - animals do not take dictation */ },
    configurable: true,
  });
}

if(typeof mindFor === 'function'){
  const _mindForTongue = mindFor;
  mindFor = function(o){
    const m = _mindForTongue.apply(this, arguments);
    if(m) m.list.forEach(a=>seedMind(m, a));
    return m;
  };
}

function topNeedOf(a){
  let best = 'food', v = -1;
  NEEDS.forEach(k=>{ if(a.need[k] > v){ v = a.need[k]; best = k; } });
  return v > 0.36 ? best : null;
}

/* ---------- 3. what an animal decides to do ---------- */
/* Keeps p57's one-out-of-the-shed rule; adds the needs on top, so the
   activity chosen is the one that answers whatever it most wants. */
if(typeof chooseAct === 'function'){
  chooseAct = function(m, a, night){
    seedMind(m, a);
    const penWantsIn = !!S.shed || night;
    const wantIn = penWantsIn ? (a.i !== turnHolder(m)) : false;
    a.inside = wantIn;

    const need = topNeedOf(a);
    a.topNeed = need;
    a.mood = need ? NEED_MOOD[need] : (Math.random()<0.2 ? 'play' : 'content');
    a.act   = need ? actFor(m.kind, need, wantIn)
                   : (wantIn ? 'settled' : 'about the paddock');
    a.doing = !!need;          /* read by the need tick to know it is being answered */
    a.until = Date.now() + 4000 + Math.random()*9000;

    if(wantIn){
      const b = m.box;
      a.gx = b.x + 6 + Math.random()*Math.max(2, b.w - 12);
      a.gy = b.y + 6 + Math.random()*Math.max(2, b.h - 12);
      return;
    }

    const g = outdoorEllipse(m);
    /* company and bonds send an animal to a specific other animal;
       everything else sends it somewhere in the field */
    let target = null;
    if(need === 'company' || (a.bond >= 0 && Math.random() < 0.35)){
      const f = m.list[a.bond];
      if(f && !f.away && !f.inside) target = f;
    }
    if(!target && Math.random() < 0.4){
      const others = m.list.filter(o=>o !== a && !o.inside && !o.away);
      if(others.length) target = pick(others);
    }
    if(target){
      a.gx = target.x + (Math.random()-0.5)*24;
      a.gy = target.y + (Math.random()-0.5)*18;
    } else {
      const pt = pointInEllipse(g);
      a.gx = pt.x; a.gy = pt.y;
    }
    const goal = { x:a.gx, y:a.gy };
    clampToEllipse(goal, g.cx, g.cy, g.rx, g.ry);
    a.gx = goal.x; a.gy = goal.y;
  };
}

/* ---------- 4. needs actually move ---------- */
let NEED_T = 0;
if(typeof tickMinds === 'function'){
  const _tickMindsNeeds = tickMinds;
  tickMinds = function(dt){
    const r = _tickMindsNeeds.apply(this, arguments);
    if(!S || S.speed === 0) return r;
    NEED_T += dt;
    if(NEED_T < 0.5) return r;
    const step = NEED_T; NEED_T = 0;

    (typeof stockPens === 'function' ? stockPens() : []).forEach(o=>{
      const m = MINDS.get(o.id); if(!m) return;
      const fed = !o.hungry;
      m.list.forEach(a=>{
        if(!a.need) seedMind(m, a);
        NEEDS.forEach(k=>{
          a.need[k] = Math.min(1, a.need[k] + NEED_DRIFT[k]*step);
        });
        /* doing the thing answers the need it belongs to */
        /* doing the thing is enough - it does not also have to have
           arrived at a particular pixel */
        const cur = a.topNeed;
        if(cur && a.doing) a.need[cur] = Math.max(0, a.need[cur] - NEED_EASE*step);
        /* under a roof is rest whatever else it is doing */
        if(a.inside) a.need.rest = Math.max(0, a.need.rest - NEED_EASE*0.5*step);
        /* an empty feed store means food never gets answered - the pen
           gets audibly hungrier, which is the warning */
        if(!fed) a.need.food = Math.min(1, a.need.food + 0.02*step);
        /* standing next to the friend is what company is for */
        const f = a.bond >= 0 ? m.list[a.bond] : null;
        if(f && !f.away && Math.hypot(f.x-a.x, f.y-a.y) < 22)
          a.need.company = Math.max(0, a.need.company - 0.07*step);
      });
    });
    return r;
  };
}

/* ---------- 5. they answer each other ---------- */
/* Same species: a proper exchange. Different species: the second animal
   makes its own noise and does not know what the first one meant. */
let ANSWER_T = 0;
function tickAnswers(dt){
  ANSWER_T -= dt;
  if(ANSWER_T > 0) return;
  ANSWER_T = 5 + Math.random()*7;
  const pens = (typeof stockPens === 'function' ? stockPens() : []);
  if(!pens.length) return;
  const o = pick(pens);
  const m = MINDS.get(o.id); if(!m || m.list.length < 2) return;
  const speakers = m.list.filter(a=>!a.away && !a.inside);
  if(speakers.length < 2) return;

  const A = pick(speakers);
  /* prefer the one it is bonded to, if that one is out */
  const bonded = (A.bond >= 0) ? m.list[A.bond] : null;
  const B = (bonded && !bonded.away && !bonded.inside && bonded !== A)
          ? bonded : pick(speakers.filter(x=>x !== A));
  if(!B) return;

  const wx = o.tx*T, wy = o.ty*T;
  const mood = A.mood || 'social';
  if(typeof speak === 'function') speak({x:wx + A.x, y:wy + A.y}, utterWith(m.kind, mood, A.topNeed));
  setTimeout(()=>{
    if(typeof speak !== 'function') return;
    const near = Math.hypot(A.x-B.x, A.y-B.y) < 60;
    /* an answer if it heard, a contact purr if they are touching */
    const reply = near && Math.random() < 0.4 ? utter(m.kind, 'affection')
                                              : utter(m.kind, 'social');
    speak({x:wx + B.x, y:wy + B.y}, reply);
  }, 1100 + Math.random()*700);
}

/* across the fence, nobody understands anybody */
let CROSS_T = 0;
function tickCrossTalk(dt){
  CROSS_T -= dt;
  if(CROSS_T > 0) return;
  CROSS_T = 16 + Math.random()*18;
  const pens = (typeof stockPens === 'function' ? stockPens() : []);
  if(pens.length < 2) return;
  const a = pick(pens);
  const b = pick(pens.filter(p=>p.id !== a.id));
  if(!b) return;
  const ka = penSpecies(a), kb = penSpecies(b);
  if(ka === kb) return;
  const ca = penCentre(a), cb = penCentre(b);
  if(Math.hypot(ca.x-cb.x, ca.y-cb.y) > 420) return;   /* out of earshot */
  if(typeof speak === 'function'){
    speak(ca, utter(ka, 'social'));
    setTimeout(()=>{ speak(cb, utter(kb, 'confused') + ' ' + PICTO.curious); }, 1200);
  }
}

/* the whole pen answering at once - a farm sounds like this at dawn */
let CHORUS_T = 40;
function tickChorus(dt){
  CHORUS_T -= dt;
  if(CHORUS_T > 0) return;
  CHORUS_T = 55 + Math.random()*70;
  const pens = (typeof stockPens === 'function' ? stockPens() : []);
  if(!pens.length) return;
  const o = pick(pens);
  const m = MINDS.get(o.id); if(!m) return;
  const out = m.list.filter(a=>!a.away && !a.inside);
  if(out.length < 3) return;
  const wx = o.tx*T, wy = o.ty*T;
  out.slice(0, 4).forEach((a, k)=>{
    setTimeout(()=>{
      if(typeof speak === 'function') speak({x:wx + a.x, y:wy + a.y}, utter(m.kind, k===0?'social':'content'));
    }, k * 520);
  });
  const v = ANIMAL_VOICE[m.kind];
  if(v && typeof SND !== 'undefined') SND.play(v.sfx);
}

const _tickPeopleTongue = tickPeople;
tickPeople = function(dt){
  const r = _tickPeopleTongue.apply(this, arguments);
  if(S && S.speed !== 0){
    try{ tickAnswers(dt); tickCrossTalk(dt); tickChorus(dt); }catch(e){}
  }
  return r;
};

/* ---------- 6. retire every English line still in the game ---------- */
/* These are all const bindings, so they are mutated in place rather than
   reassigned. Doing it here in one block means the old tables stay
   readable as history instead of being edited away. */
(function silenceEnglish(){
  /* the clever one thinks in pictures, not sentences */
  if(typeof SMART_LINES !== 'undefined'){
    SMART_LINES.length = 0;
    SMART_LINES.push('💭 🚪','💭 🌧️','💭 🌾 ☀️','💭 🧍 🌾','💭 🚪 ❓','💭 💧','💭 🌾 🌾','💭 🫂');
  }
  if(typeof FOLLOW_LINES !== 'undefined'){
    FOLLOW_LINES.length = 0;
    FOLLOW_LINES.push('…','❓','💛','*follows*','…❓','🫂');
  }
  if(typeof LEARNED_LINES !== 'undefined'){
    LEARNED_LINES.length = 0;
    LEARNED_LINES.push('💭 ❓','💭 🚪','…💭','💭 🌾');
  }
  /* strays */
  if(typeof STRAY_OUT === 'object'){
    Object.keys(STRAY_OUT).forEach(k=>{
      STRAY_OUT[k] = [utter(k,'alarm'), utter(k,'curious') + ' ' + PICTO.gate, utter(k,'social')];
    });
  }
  if(typeof STRAY_HOME !== 'undefined'){
    STRAY_HOME.length = 0;
    STRAY_HOME.push('💛','🫂','…','😌');
  }
  /* the status voices - keep the sound, drop the English */
  if(typeof ANIMAL_VOICE === 'object'){
    Object.keys(ANIMAL_VOICE).forEach(k=>{
      const v = ANIMAL_VOICE[k];
      v.ok     = [utter(k,'content'), utter(k,'content'), utter(k,'affection')];
      v.hungry = [utter(k,'hungry') + ' ' + PICTO.food, utter(k,'hungry'), utter(k,'alarm') + ' ' + PICTO.food];
      v.dirty  = [utter(k,'confused'), utter(k,'content') + ' 🙁'];
    });
  }
  /* the storm panic */
  if(typeof PANIC_CRY === 'object'){
    Object.keys(PANIC_CRY).forEach(k=>{
      PANIC_CRY[k] = [utter(k,'alarm') + ' 😱', utter(k,'alarm') + ' 😨', utter(k,'alarm') + ' ' + PICTO.alarm];
    });
  }
  if(typeof PANIC_CALL === 'object'){
    Object.keys(PANIC_CALL).forEach(k=>{
      PANIC_CALL[k] = [utter(k,'curious'), utter(k,'sleepy'), utter(k,'confused')];
    });
  }
  /* the shed activities in p53/p54 pair a name with an English line;
     the name is for the log, the line is what gets spoken - so only the
     line needs replacing, and the getter on a.line already handles it */
})();

/* ---------- handles ---------- */
G.tongue = function(kind){
  kind = kind || 'sheep';
  return ['content','curious','social','hungry','thirsty','sleepy','play','alarm','affection','confused']
    .map(mo => mo + ': ' + utter(kind, mo));
};
G.minds = function(){
  const out = [];
  (typeof stockPens === 'function' ? stockPens() : []).forEach(o=>{
    const m = MINDS.get(o.id); if(!m) return;
    m.list.slice(0,3).forEach(a=>{
      out.push({ pen:o.bp, i:a.i, mood:a.mood, wants:a.topNeed, act:a.act,
                 bond:a.bond, says:a.line,
                 needs:Object.keys(a.need||{}).reduce((z,k)=>(z[k]=+a.need[k].toFixed(2),z),{}) });
    });
  });
  return out;
};
