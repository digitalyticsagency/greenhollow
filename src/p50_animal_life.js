/* =====================================================================
   THE ANIMALS HAVE SOMETHING TO SAY

   Three layers, and they build on each other.

   Voices: each pen speaks now and then, in a line that reflects what is
   actually happening to it — hungry stock complain, a pen with something
   ready is pleased, a dirty pen says so. Each with its own sound.

   A social sim underneath: animals notice their neighbours. Species that
   flock settle near each other, a goat next to a hen coop causes trouble,
   and two pens of the same kind get on. Those relationships are what make
   the third layer possible.

   Stories: small things that start, run for a few days and finish. A hen
   goes broody and hatches chicks; the goat gets out and eats a bed; two
   pens strike up a friendship. They only trigger on conditions that are
   genuinely true on your farm, so nothing is ever narrated that did not
   happen.
   ===================================================================== */

/* ---------- 1. voices ---------- */
const ANIMAL_VOICE = {
  chicken:{sfx:'cluck', ok:['Bok!','🥚 Bok bok','Cluck…','*scratch scratch*'],
           hungry:['Bok?! 🌾','Empty feeder!','Bok bok BOK'],
           dirty:['Bok… 🙁','Needs a clean in here']},
  duck:   {sfx:'quack', ok:['Quack!','🦆 Quack quack','*splash*','Lovely puddle'],
           hungry:['Quack?! 🌾','Nothing in the trough'],
           dirty:['Quack… 🙁','Water wants changing']},
  sheep:  {sfx:'bleat', ok:['Baaa','🐑 Baa!','*munch munch*','Good grass here'],
           hungry:['Baaa?! 🌾','Grass is gone'],
           dirty:['Baa… 🙁','Bedding is damp']},
  goat:   {sfx:'bleat', ok:['Meh-eh!','🐐 Meh!','*chew*','What is that? Mine now'],
           hungry:['Meh-eh?! 🌾','I ate the fence'],
           dirty:['Meh… 🙁','Muck out please']},
  cow:    {sfx:'moo',   ok:['Moo~','🐄 Mooo','*slow chew*','Warm today'],
           hungry:['Mooo?! 🌾','Trough is empty'],
           dirty:['Moo… 🙁','Straw needs changing']},
  rabbit: {sfx:'thump', ok:['*thump*','🐰 …','*nose twitch*','*binky!*'],
           hungry:['*thump thump* 🌾','Hungry!'],
           dirty:['…🙁','Hutch is grubby']},
  bee:    {sfx:'bee',   ok:['🐝 Bzzz','*busy*','Bzz bzz'],
           hungry:['Bzz? 🌸','Not enough flowers'], dirty:['Bzz…']},
};

function penSpecies(o){
  const bp = BPMAP[o.bp] || {};
  if(bp.animal) return bp.animal;
  const a = bp.art || '';
  if(/coop/.test(a)) return 'chicken';
  if(/duck/.test(a)) return 'duck';
  if(/sheep/.test(a)) return 'sheep';
  if(/goat/.test(a)) return 'goat';
  if(/cow/.test(a)) return 'cow';
  if(/rabbit/.test(a)) return 'rabbit';
  if(/apiary/.test(a)) return 'bee';
  return null;
}
function animalPens(){
  return (S.objs||[]).filter(o=>BPMAP[o.bp] && BPMAP[o.bp].kind==='animal');
}
function penCentre(o){
  const f = footprint(BPMAP[o.bp], o.rot);
  return { x:(o.tx + f.w*0.5)*T, y:(o.ty + f.h*0.45)*T };
}

/* one pen speaks at a time, on a cooldown, and only when it has cause */
let voiceCool = 0;
function tickVoices(dt){
  voiceCool -= dt;
  if(voiceCool > 0) return;
  if(typeof SET === 'function' && SET('motion') === false) return;
  if((typeof isNight === 'function') && isNight()) return;   /* asleep */

  const pens = animalPens().filter(o=>(o.animals||0) > 0);
  if(!pens.length){ voiceCool = 5; return; }
  const o = pens[Math.floor(Math.random()*pens.length)];
  const sp = penSpecies(o);
  const v = ANIMAL_VOICE[sp];
  if(!v){ voiceCool = 4; return; }

  /* what it says depends on how it is actually doing */
  const care = (o.care === undefined ? 1 : o.care);
  const pool = o.hungry ? v.hungry : care < 0.45 ? v.dirty : v.ok;
  const line = pool[Math.floor(Math.random()*pool.length)];
  const c = penCentre(o);
  if(typeof speak === 'function') speak({x:c.x, y:c.y}, line);
  if(typeof SND !== 'undefined' && v.sfx) SND.play(v.sfx);
  /* complaints come round more often than contentment */
  voiceCool = (o.hungry || care < 0.45) ? 7 + Math.random()*6 : 13 + Math.random()*12;
}

/* ---------- 2. what the animals make of each other ---------- */
/* Nothing elaborate: who is next to whom, and whether that is a good or
   bad pairing. It is enough to drive the stories. */
/* Keys must be in the same alphabetical order pairKey() produces, or the
   lookup silently never matches - which is exactly what happened to
   sheep/goat. */
const PAIRING = {
  'goat|sheep':   {mood:-0.2, why:'The goat bullies the sheep off the feeder.'},
  'sheep|sheep':  {mood:+0.3, why:'Two flocks within sight of each other settle better.'},
  'cow|cow':      {mood:+0.3, why:'Cattle are herd animals and calmer in company.'},
  'chicken|duck': {mood:-0.25,why:'Ducks keep fouling the hens’ dry bedding.'},
  'chicken|chicken':{mood:+0.2,why:'Hens range happily between the two coops.'},
  'goat|goat':    {mood:+0.25,why:'The goats have each other to argue with.'},
  'bee|flowers':  {mood:+0.4, why:'The hives are right by the flowers.'},
};

function pairKey(a, b){ return [a,b].sort().join('|'); }

function socialMap(){
  const pens = animalPens();
  const out = [];
  for(let i=0;i<pens.length;i++)
    for(let j=i+1;j<pens.length;j++){
      const a = penCentre(pens[i]), b = penCentre(pens[j]);
      if(Math.hypot(a.x-b.x, a.y-b.y) > T*7) continue;      /* not neighbours */
      const sa = penSpecies(pens[i]), sb = penSpecies(pens[j]);
      if(!sa || !sb) continue;
      const p = PAIRING[pairKey(sa,sb)];
      if(p) out.push({a:pens[i], b:pens[j], sa, sb, ...p});
    }
  return out;
}

/* neighbours lift or drag on how the stock are doing */
function tickSocial(days){
  const links = socialMap();
  if(!links.length) return;
  links.forEach(l=>{
    const d = l.mood * 0.02 * days;
    [l.a, l.b].forEach(o=>{
      o.care = Math.max(0, Math.min(1, (o.care===undefined?1:o.care) + d));
    });
  });
}

/* ---------- 3. stories ---------- */
/* Each has a condition that must genuinely hold, a run of days, and an
   ending. Nothing narrates something that did not happen. */
const STORIES = [
  {
    id:'broody',
    days:4,
    can(){ const c = animalPens().find(o=>penSpecies(o)==='chicken' && (o.animals||0) >= 3
             && (o.care===undefined?1:o.care) > 0.6); return c ? {pen:c} : null; },
    start(x){ return `One of the hens has gone broody and will not leave the nest box.`; },
    end(x){
      const pen = (S.objs||[]).find(o=>o.id === x.pen.id);
      if(!pen) return `The broody hen was moved on.`;
      const cap = (BPMAP[pen.bp]||{}).cap || 8;
      const born = Math.min(3, Math.max(0, cap - (pen.animals||0)));
      pen.animals = Math.min(cap, (pen.animals||0) + born);
      return born
        ? `${born} chick${born>1?'s':''} hatched. The coop is up to ${pen.animals}.`
        : `The eggs hatched but the coop was already full — the chicks went to a neighbour.`;
    },
  },
  {
    id:'escape',
    days:2,
    can(){ const g = animalPens().find(o=>penSpecies(o)==='goat' && (o.animals||0) > 0
             && (o.care===undefined?1:o.care) < 0.7); return g ? {pen:g} : null; },
    start(){ return `A goat is out. There is a gap in the fence and it knows about it.`; },
    end(){
      const beds = (S.objs||[]).filter(o=>BPMAP[o.bp] && BPMAP[o.bp].kind==='plot' && o.crop && o.stage>0);
      if(!beds.length) return `The goat was walked back in. Nothing worth eating out there.`;
      const bed = beds[Math.floor(Math.random()*beds.length)];
      bed.stage = Math.max(0, bed.stage - 1);
      return `The goat got into the ${(GOODS[bed.crop]||{n:'beds'}).n.toLowerCase()} before anyone noticed.`;
    },
  },
  {
    id:'calf',
    days:6,
    can(){ const c = animalPens().find(o=>penSpecies(o)==='cow' && (o.animals||0) >= 2
             && (o.care===undefined?1:o.care) > 0.65); return c ? {pen:c} : null; },
    start(){ return `One of the cows is due. She has taken herself to the far corner.`; },
    end(x){
      const pen = (S.objs||[]).find(o=>o.id === x.pen.id);
      if(!pen) return `The cow was sold on before she calved.`;
      const cap = (BPMAP[pen.bp]||{}).cap || 4;
      if((pen.animals||0) < cap){ pen.animals++; return `A calf. Standing within the hour, as they do.`; }
      return `A calf — but the pasture is full, so she went to the neighbour's herd.`;
    },
  },
  {
    id:'friendship',
    days:5,
    can(){ const l = socialMap().find(x=>x.mood > 0); return l ? {link:l, why:l.why} : null; },
    start(x){ return `The stock have sorted themselves out. ${x.why}`; },
    end(x){
      const pens = animalPens();
      pens.forEach(o=>{ o.care = Math.min(1, (o.care===undefined?1:o.care) + 0.12); });
      S.morale = Math.min(1, (S.morale===undefined?0.6:S.morale) + 0.04);
      return `A settled yard. Everything is in better condition for it.`;
    },
  },
  {
    id:'feud',
    days:3,
    can(){ const l = socialMap().find(x=>x.mood < 0); return l ? {link:l, why:l.why} : null; },
    start(x){ return `Trouble in the yard. ${x.why}`; },
    end(x){
      return `It settled down on its own, but keep an eye on that feeder.`;
    },
  },
  {
    id:'lamb',
    days:5,
    can(){ const s = animalPens().find(o=>penSpecies(o)==='sheep' && (o.animals||0) >= 2
             && (o.care===undefined?1:o.care) > 0.6); return s ? {pen:s} : null; },
    start(){ return `One of the ewes is heavy. Lambing within the week.`; },
    end(x){
      const pen = (S.objs||[]).find(o=>o.id === x.pen.id);
      if(!pen) return `The ewe was sold on.`;
      const cap = (BPMAP[pen.bp]||{}).cap || 8;
      const born = Math.min(2, Math.max(0, cap - (pen.animals||0)));
      pen.animals = Math.min(cap, (pen.animals||0) + born);
      return born ? `${born === 2 ? 'Twin lambs' : 'A lamb'}. Up and following within minutes.`
                  : `Lambs born, but the paddock is full — they went to market.`;
    },
  },
];

function storyInit(){ if(!S.story) S.story = {active:null, done:{}, next: (S.day||0) + 3}; }

function tickStories(){
  storyInit();
  const st = S.story;
  /* finish the one that is running */
  if(st.active){
    if(S.day >= st.active.endsDay){
      const def = STORIES.find(x=>x.id === st.active.id);
      let line = '';
      try { line = def ? def.end(st.active.ctx || {}) : ''; } catch(e){ line = ''; }
      if(line) log(line, 'good', 'farm');
      if(typeof toast === 'function' && line) toast(line.slice(0, 46), 'good');
      st.done[st.active.id] = (st.done[st.active.id]||0) + 1;
      st.active = null;
      st.next = S.day + 6 + Math.floor(Math.random()*8);
      if(typeof render === 'function') render();
    }
    return;
  }
  /* start a new one when something is genuinely true */
  if(S.day < st.next) return;
  const shuffled = STORIES.slice().sort(()=>Math.random()-0.5);
  for(const def of shuffled){
    let ctx = null;
    try { ctx = def.can(); } catch(e){ ctx = null; }
    if(!ctx) continue;
    /* keep a light reference so end() can find the pen again */
    const slim = {};
    if(ctx.pen) slim.pen = {id: ctx.pen.id};
    if(ctx.why) slim.why = ctx.why;
    st.active = {id:def.id, endsDay: S.day + def.days, ctx:slim};
    let line = '';
    try { line = def.start(ctx); } catch(e){ line = ''; }
    if(line){ log(line, '', 'farm'); if(typeof toast === 'function') toast(line.slice(0,46), ''); }
    return;
  }
  st.next = S.day + 3;      /* nothing fitted; look again shortly */
}

/* what is happening right now, for the Stats tab */
function storyNote(){
  storyInit();
  const st = S.story;
  if(!st.active) return '';
  const def = STORIES.find(x=>x.id === st.active.id);
  if(!def) return '';
  const left = Math.max(0, st.active.endsDay - S.day);
  let line = '';
  try { line = def.start(st.active.ctx || {}); } catch(e){ line = ''; }
  return `${line} <b>${left} day${left===1?'':'s'}</b> to go.`;
}

if(typeof renderRight === 'function'){
  const _renderRightStory = renderRight;
  renderRight = function(){
    const r = _renderRightStory.apply(this, arguments);
    if(rightTab === 'owner'){
      const b = document.getElementById('rightBody');
      const note = storyNote();
      if(b && note && !b.querySelector('.storycard')){
        const d = document.createElement('div');
        d.className = 'pcard storycard';
        d.innerHTML = `<h3>On the farm</h3><p class="sub">${note}</p>`;
        b.insertBefore(d, b.firstChild);
      }
    }
    return r;
  };
}

/* ---------- wiring ---------- */
const _tickPeopleAnimals = tickPeople;
tickPeople = function(dt){
  const r = _tickPeopleAnimals.apply(this, arguments);
  if(S && S.speed !== 0) tickVoices(dt);
  return r;
};

let storyLastDay = -1;
setInterval(()=>{
  if(typeof S === 'undefined' || !S || S.speed === 0) return;
  storyInit();
  if(S.day !== storyLastDay){
    if(storyLastDay >= 0){ tickSocial(1); tickStories(); }
    storyLastDay = S.day;
  }
}, 900);

/* a way to see one without waiting */
G.tellStory = function(){ storyInit(); S.story.next = S.day; tickStories(); };
