/* =====================================================================
   A HORSE, GUESTS WITH SOMEWHERE TO GO, AND A CLEARER APIARY

   On the bees: they are not broken. A stocked apiary made 18 honey over
   six days, which is exactly the three a day it is specified for. An
   apiary with no hives in it makes nothing, and the only thing telling
   you so was a small label reading "Buy hives" - which is both easy to
   miss and the wrong word, since what you are buying is bees. That is
   what has changed here, not the production.

   The horse is a full animal: its own art, its own tongue, its own
   stable interior, its own place in the panic, the shed rota, the mind
   model and the economy. It does not give milk or eggs - it gives trail
   rides, which is what a horse on a working smallholding actually earns.

   And the guests stop milling about outside their tent. They walk to the
   tea kiosk, the gift shop, the farm stand, the yoga deck, the fire
   circle and the pond, they spend money while they are there, and they
   fall into conversation with each other when they meet.
   ===================================================================== */

/* ---------- 1. say what an empty apiary needs ---------- */
if(typeof objState === 'function'){
  const _objStateBees = objState;
  objState = function(o){
    const r = _objStateBees.apply(this, arguments);
    const bp = BPMAP[o.bp];
    if(bp && bp.animal === 'hive' && !o.animals) r.alert = 'No bees — buy hives';
    return r;
  };
}
if(BPMAP.apiary){
  BPMAP.apiary.tip = 'Buy hives to put bees in it — an empty apiary produces nothing. '
    + 'Once stocked it needs no feed at all, and it speeds every crop on the farm.';
}

/* ---------- 2. the horse ---------- */
if(typeof GOODS === 'object' && !GOODS.ride){
  GOODS.ride = { n:'Trail ride', c:'#c98f4a', p:45 };
}
if(typeof SPECIES === 'object' && !SPECIES.horse){
  SPECIES.horse = { sc:1.15, walk:4.6, run:16, restless:0.5, sound:'moo' };
}

if(typeof BP !== 'undefined' && typeof BPMAP === 'object' && !BPMAP.horse_paddock){
  const horse = {
    id:'horse_paddock', name:'Horse paddock', art:'horse_paddock', cat:'animal',
    w:6, h:4, cost:900, lvl:5, kind:'animal',
    animal:'horse', cap:3, buy:320, good:'ride', per:1.5, cycle:1,
    /* 1.5 is right. I briefly raised it to 2.7 after measuring a 21-day
       payback, then found that reading was taken on a herd that had only
       just arrived - yieldMul was 0.43 and climbs to 0.81 once they
       settle. At rest 1.5 gives A$164/day and a 13-day payback, in the
       same band as every other pen. Measuring a transient again. */
    feed:3.5, charm:20,
    desc:'Grazing and a stable block for up to three horses. Visitors pay to ride out.',
    tip:'The highest charm on the farm and a strong daily earner, but they eat like cows and need the room.',
  };
  BP.push(horse); BPMAP.horse_paddock = horse;
}

/* the animal itself, in the same stacked-shape style as the others */
if(typeof beast3d === 'function'){
  const _beast3dHorse = beast3d;
  beast3d = function(kind, x, y, sc, idle){
    if(kind !== 'horse') return _beast3dHorse.apply(this, arguments);
    sc = (sc || 1) * 1.25;
    const coat = '#8a5a34', mane = '#3a2718', sock = '#efe6d6';
    let s = `<ellipse cx="${n(x+0.8*sc)}" cy="${n(y+3.6*sc)}" rx="${n(6.2*sc)}" ry="${n(2.1*sc)}"
              fill="#16240c" opacity=".26"/>`;
    s += `<g class="a3-body">`;
    /* legs first, behind the barrel */
    [-2.6, -1.2, 1.4, 2.8].forEach((lx, i)=>{
      s += `<rect x="${n(x+lx*sc)}" y="${n(y+0.6*sc)}" width="${n(0.9*sc)}" height="${n(3.2*sc)}"
              rx="${n(0.45*sc)}" fill="${coat}"/>`;
      if(i % 2) s += `<rect x="${n(x+lx*sc)}" y="${n(y+3.0*sc)}" width="${n(0.9*sc)}" height="${n(0.9*sc)}"
              rx="${n(0.4*sc)}" fill="${sock}"/>`;
    });
    /* barrel */
    s += `<ellipse cx="${n(x)}" cy="${n(y)}" rx="${n(4.6*sc)}" ry="${n(2.7*sc)}" fill="${coat}"/>`;
    s += `<ellipse cx="${n(x-0.6*sc)}" cy="${n(y-0.7*sc)}" rx="${n(3.9*sc)}" ry="${n(1.8*sc)}"
            fill="#a06f42" opacity=".85"/>`;
    /* hindquarters and tail */
    s += `<ellipse cx="${n(x+3.1*sc)}" cy="${n(y-0.2*sc)}" rx="${n(2.1*sc)}" ry="${n(2.2*sc)}" fill="${coat}"/>`;
    s += `<path class="a3-tail" d="M${n(x+4.8*sc)} ${n(y-0.8*sc)} q${n(1.9*sc)} ${n(1.4*sc)} ${n(0.7*sc)} ${n(3.4*sc)}"
            fill="none" stroke="${mane}" stroke-width="${n(1.15*sc)}" stroke-linecap="round"/>`;
    /* neck and head, up and to the left where the light is */
    s += `<g class="a3-head">`;
    s += `<path d="M${n(x-3.4*sc)} ${n(y-1.1*sc)} q${n(-1.5*sc)} ${n(-2.6*sc)} ${n(-0.2*sc)} ${n(-3.8*sc)}
            l${n(2.0*sc)} ${n(0.5*sc)} q${n(-0.6*sc)} ${n(2.1*sc)} ${n(0.8*sc)} ${n(3.0*sc)} Z" fill="${coat}"/>`;
    s += `<ellipse cx="${n(x-4.5*sc)}" cy="${n(y-4.6*sc)}" rx="${n(1.9*sc)}" ry="${n(1.35*sc)}" fill="${coat}"/>`;
    s += `<ellipse cx="${n(x-5.6*sc)}" cy="${n(y-4.3*sc)}" rx="${n(0.95*sc)}" ry="${n(0.8*sc)}" fill="#6d4526"/>`;
    /* mane along the crest */
    s += `<path d="M${n(x-3.3*sc)} ${n(y-1.6*sc)} q${n(-1.2*sc)} ${n(-2.2*sc)} ${n(-0.6*sc)} ${n(-3.5*sc)}"
            fill="none" stroke="${mane}" stroke-width="${n(1.3*sc)}" stroke-linecap="round"/>`;
    /* ears and eye */
    s += `<path d="M${n(x-4.9*sc)} ${n(y-5.6*sc)} l${n(0.5*sc)} ${n(-1.2*sc)} l${n(0.6*sc)} ${n(1.1*sc)} Z" fill="${coat}"/>`;
    s += `<path d="M${n(x-3.9*sc)} ${n(y-5.5*sc)} l${n(0.5*sc)} ${n(-1.1*sc)} l${n(0.6*sc)} ${n(1.0*sc)} Z" fill="${coat}"/>`;
    s += `<circle cx="${n(x-4.9*sc)}" cy="${n(y-4.8*sc)}" r="${n(0.34*sc)}" fill="#1d1408"/>`;
    s += `<ellipse cx="${n(x-5.0*sc)}" cy="${n(y-5.1*sc)}" rx="${n(0.5*sc)}" ry="${n(0.22*sc)}"
            fill="#ffffff" opacity=".5"/>`;
    s += `</g></g>`;
    return s;
  };
  /* beast() dispatches through beast3d, so the horse arrives with it */
}

/* the paddock: grazing, a stable block, a water trough */
if(typeof ART === 'object'){
  ART.horse_paddock = (w,h,ob)=>{
    const cnt = ob ? Math.min(3, ob.animals||0) : 1;
    let s = (typeof paddock === 'function') ? paddock(w,h,'horse',cnt,31,1.0)
                                            : patch(w,h,'#7fa64e',31,1);
    s += `<rect x="${n(w*0.70)}" y="${n(h*0.10)}" width="${n(w*0.22)}" height="${n(h*0.09)}" rx="2" fill="#9fb0b8"/>`;
    s += `<rect x="${n(w*0.71)}" y="${n(h*0.11)}" width="${n(w*0.20)}" height="${n(h*0.05)}" rx="1.5" fill="url(#gWater)"/>`;
    if(ob && ob.ready>0) s += `<circle class="pulse" cx="${n(w-6)}" cy="6" r="3.4" fill="#f0c14b"/>`;
    return s;
  };
}

/* a stable, not a shed: standing stalls, a hay net, a salt lick, a bucket */
if(typeof shedFittings === 'function'){
  const _shedFittingsHorse = shedFittings;
  shedFittings = function(kind, b){
    if(kind !== 'horse') return _shedFittingsHorse.apply(this, arguments);
    const W = b.w, H = b.h;
    let s = `<rect x="${n(b.x)}" y="${n(b.y)}" width="${n(W)}" height="${n(H)}" rx="3" fill="#d8c48b"/>`;
    for(let i=0;i<10;i++){
      const sx = b.x + 3 + hash(i*3.1)*(W-6), sy = b.y + 3 + hash(i*6.7)*(H-6);
      s += `<line x1="${n(sx)}" y1="${n(sy)}" x2="${n(sx+3)}" y2="${n(sy-1.3)}" stroke="#bfa96c" stroke-width=".7"/>`;
    }
    /* three standing stalls divided by partitions */
    for(let i=0;i<3;i++){
      const sy = b.y + H*0.26 + i*H*0.24;
      s += `<rect x="${n(b.x+W*0.06)}" y="${n(sy)}" width="${n(W*0.62)}" height="${n(H*0.20)}" rx="2" fill="#e4d2a0"/>`;
      s += `<rect x="${n(b.x+W*0.06)}" y="${n(sy+H*0.20)}" width="${n(W*0.62)}" height="1.6" fill="#8a6a42"/>`;
    }
    /* hay net on the back wall, a salt lick and a bucket */
    s += `<rect x="${n(b.x+W*0.72)}" y="${n(b.y+H*0.14)}" width="${n(W*0.20)}" height="${n(H*0.26)}" rx="2" fill="#9a8a63"/>`;
    for(let i=0;i<3;i++)
      s += `<line x1="${n(b.x+W*0.745+i*W*0.055)}" y1="${n(b.y+H*0.14)}" x2="${n(b.x+W*0.745+i*W*0.055)}" y2="${n(b.y+H*0.40)}"
              stroke="#c9b47e" stroke-width="1.2"/>`;
    s += `<rect x="${n(b.x+W*0.74)}" y="${n(b.y+H*0.52)}" width="${n(W*0.14)}" height="${n(H*0.12)}" rx="2" fill="#d4a3a3"/>`;
    s += `<circle cx="${n(b.x+W*0.82)}" cy="${n(b.y+H*0.76)}" r="${n(Math.min(W,H)*0.07)}" fill="#7d8f98"/>`;
    s += `<circle cx="${n(b.x+W*0.82)}" cy="${n(b.y+H*0.76)}" r="${n(Math.min(W,H)*0.05)}" fill="url(#gWater)"/>`;
    s += `<circle class="fx-bulb" cx="${n(b.x+W*0.5)}" cy="${n(b.y+H*0.04)}" r="2.6" fill="#ffe9a8"/>`;
    return s;
  };
}

/* the horse's own voice, activities and panic */
(function horseVoice(){
  if(typeof TONGUE === 'object')
    TONGUE.horse = { soft:['hnn','hrrm','fff'], loud:['NEIGHHH','HEHHH'], purr:'hrrrrr', trill:'*whicker*' };
  if(typeof OUT_ACTS === 'object'){
    OUT_ACTS.horse = [['grazing','hnn'],['at the water','hrrm'],['cantering','*whicker*'],['dozing on its feet','hrrrrr']];
    IN_ACTS.horse  = [['in the stall','hnn'],['at the hay net','*chew*'],['at the salt lick','hrrm'],['bedded down','hrrrrr']];
  }
  if(typeof FEED_VERB === 'object') FEED_VERB.horse = 'grazing';
  if(typeof ANIMAL_VOICE === 'object' && typeof utter === 'function'){
    ANIMAL_VOICE.horse = { sfx:'moo',
      ok:[utter('horse','content'), utter('horse','content'), utter('horse','affection')],
      hungry:[utter('horse','hungry')+' 🌾', utter('horse','alarm')+' 🌾'],
      dirty:[utter('horse','confused')] };
  }
  if(typeof PANIC_CRY === 'object' && typeof utter === 'function'){
    PANIC_CRY.horse  = [utter('horse','alarm')+' 😱', utter('horse','alarm')+' 😨'];
    PANIC_CALL.horse = [utter('horse','curious'), utter('horse','sleepy')];
  }
  if(typeof STRAY_SC === 'object') STRAY_SC.horse = 1.0;
  if(typeof STRAY_OUT === 'object' && typeof utter === 'function')
    STRAY_OUT.horse = [utter('horse','alarm'), utter('horse','curious')+' 🚪'];
})();

/* ---------- 3. guests with somewhere to go ---------- */
/* Each attraction is a place, an activity and a price. A guest that
   spends is a guest who paid you, so this is income rather than set
   dressing. */
const GUEST_STOPS = [
  { art:'tea_kiosk',  act:'at the tea kiosk',   spend:9,  say:['Two teas, please.','Proper scone, this.'] },
  { art:'gift_shop',  act:'in the gift shop',   spend:22, say:['I am buying this.','One for my sister.'] },
  { art:'farm_stand', act:'at the farm stand',  spend:14, say:['All this is from here?','I will take a dozen.'] },
  { art:'deck',       act:'on the yoga deck',   spend:12, say:['Breathe out…','Best class I have had.'] },
  { art:'firepit',    act:'at the fire circle', spend:0,  say:['Budge up.','Marshmallows?'] },
  { art:'playground', act:'watching the kids',  spend:0,  say:['They will sleep well tonight.'] },
  { art:'pond',       act:'down by the pond',   spend:0,  say:['Look at the light on that water.'] },
  { art:'orchard',    act:'walking the orchard',spend:0,  say:['Can you smell the blossom?'] },
];

function guestStops(){
  const out = [];
  GUEST_STOPS.forEach(g=>{
    (S.objs||[]).forEach(o=>{
      if((BPMAP[o.bp]||{}).art !== g.art) return;
      const f = footprint(BPMAP[o.bp], o.rot);
      out.push({ ...g, o, x:(o.tx + f.w*0.5)*T, y:(o.ty + f.h*0.78)*T });
    });
  });
  return out;
}

const GUEST_CHAT = [
  'Where have you come from?','First time here?','We are in the dome, you?',
  'Have you tried the tea?','Beautiful spot, isn\'t it.','How long are you staying?',
];

/* p42 already walks guests to a goal and paints them. Rather than move
   them in parallel - which had both systems writing g.act every frame
   and mine losing, because it only writes when it re-picks - this feeds
   p42 the goal and lets it do the driving. One authority. */
function pickGuestStop(g){
  const stops = guestStops();
  if(!stops.length) return null;
  const s = stops[Math.floor(Math.random()*stops.length)];
  g.trip = { art:s.art, act:s.act, x:s.x + (Math.random()-0.5)*30, y:s.y + (Math.random()-0.5)*18,
             spend:s.spend, paid:false, until:Date.now() + 18000 + Math.random()*20000 };
  if(s.say && Math.random() < 0.6 && typeof speak === 'function')
    setTimeout(()=>{ if(g.trip) speak(g, s.say[Math.floor(Math.random()*s.say.length)]); }, 2200);
  return g.trip;
}

if(typeof guestGoal === 'function'){
  const _guestGoalBase = guestGoal;
  guestGoal = function(g){
    const night = (typeof isNight === 'function') && isNight();
    const base = _guestGoalBase.apply(this, arguments);
    /* indoors, asleep or in a storm the original wins outright */
    if(night || S.weather === 'storm' || (base && base.inside)){ g.trip = null; return base; }

    const now = Date.now();
    if(g.trip && now > g.trip.until) g.trip = null;
    if(!g.trip && Math.random() < 0.02) pickGuestStop(g);
    if(!g.trip) return base;

    /* they pay once, on arrival */
    if(!g.trip.paid && g.trip.spend > 0 && Math.hypot(g.trip.x-g.x, g.trip.y-g.y) < 16){
      g.trip.paid = true;
      if(typeof earn === 'function') earn(g.trip.spend, 1);
      if(typeof log === 'function') log(`A guest spent ${fmt(g.trip.spend)} ${g.trip.act}.`, 'gold', 'money');
      if(typeof SND !== 'undefined') SND.play('coin');
    }
    return { x:g.trip.x, y:g.trip.y, act:g.trip.act, inside:false };
  };
}

const GUEST_CHAT2 = GUEST_CHAT;
function tickGuestLife(dt){
  const gs = (S.guests || []);
  if(gs.length < 2) return;
  if(Math.random() > dt*0.06) return;
  for(let i=0;i<gs.length;i++){
    for(let j=i+1;j<gs.length;j++){
      const a = gs[i], b = gs[j];
      if(a.inside || b.inside) continue;
      if(Math.hypot(a.x-b.x, a.y-b.y) > 52) continue;
      if(typeof speak !== 'function') return;
      speak(a, GUEST_CHAT2[Math.floor(Math.random()*GUEST_CHAT2.length)]);
      setTimeout(()=>speak(b, GUEST_CHAT2[Math.floor(Math.random()*GUEST_CHAT2.length)]), 1400);
      return;
    }
  }
}

/* remember where their tent is, so 'wandering' means near home */
if(typeof guestsInit === 'function'){
  const _guestsInitHome = guestsInit;
  guestsInit = function(){
    const r = _guestsInitHome.apply(this, arguments);
    (S.guests||[]).forEach(g=>{
      if(g.hx === undefined){ g.hx = g.x; g.hy = g.y; }
    });
    return r;
  };
}

const _tickPeopleGuestLife = tickPeople;
tickPeople = function(dt){
  const r = _tickPeopleGuestLife.apply(this, arguments);
  if(S && S.speed !== 0){ try{ tickGuestLife(dt); }catch(e){} }
  return r;
};

/* ---------- handles ---------- */
G.horseCheck = function(){
  const o = (S.objs||[]).find(x=>x.bp === 'horse_paddock');
  if(!o) return 'no horse paddock placed';
  const el = document.querySelector(`.ob[data-id="${o.id}"]`);
  return { animals:o.animals, species:penSpecies(o), ready:o.ready,
           drawn: el ? el.querySelectorAll('.pen-animal').length : 0,
           interior: el ? el.querySelectorAll('.shed-in > *').length : 0,
           says: (typeof utter === 'function') ? utter('horse','social') : '?' };
};
G.guestCheck = function(){
  return { guests:(S.guests||[]).length, stops:guestStops().map(s=>s.art),
           doing:(S.guests||[]).map(g=>({act:g.act, stop:g.stop, owes:g.owes||0})) };
};

/* ---------- 4. a cap on how much is being said at once ---------- */
/* With animals, people, guests, scenes and the day's chatter all live,
   a busy farm put fourteen bubbles on screen at the same time - counted
   off a screenshot. Individually each one is right; together they are a
   wall of text over the thing you are trying to watch. Six is enough to
   feel alive and few enough to read. */
const BUBBLE_CAP = 6;
if(typeof speak === 'function'){
  const _speakCapped = speak;
  speak = function(p, text){
    if(typeof BUBBLES !== 'undefined' && BUBBLES.length >= BUBBLE_CAP) return;
    return _speakCapped.apply(this, arguments);
  };
}
