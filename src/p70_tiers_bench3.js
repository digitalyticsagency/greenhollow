/* =====================================================================
   UPGRADE TIERS FOR THE FIFTY, AND TIER 3 BENCH CONVERSATION

   1. The new items all looked identical at Mk I and Mk IV, and the
      reason is structural rather than cosmetic. Tier art is not drawn by
      the item's own ART function - p27 keeps a table, ARCH_FAMILY,
      mapping an object id to one of six architectural families, and
      wraps each named ART function so tiers 1..3 append that family's
      extra structure. None of the fifty new items were in that table,
      so upgrading one changed the number in the panel and nothing on
      the ground.

      There is a second, quieter problem: applyArchitecture() is an IIFE
      that runs when p27 loads and wraps whatever ART functions exist at
      that moment. The new items are defined in p67, which loads later.
      So adding them to the table is not enough - the wrap has to be
      re-run for them, which is what happens below.

   2. Tier 3: two people on the same bench get talking. It goes through
      the existing tickChat pairing rather than a second conversation
      system, so it inherits the six-bubble cap, the trait voices, the
      day themes and the storm and night rules for free.
   ===================================================================== */

/* ---------- 1. put the new items in an architectural family ---------- */
/* Chosen by what the thing actually is, not by its shop category: a
   polytunnel gains what a grove gains, a server rack gains what
   infrastructure gains. */
const NEW_ARCH_FAMILY = {
  /* grow */
  bed_narrow:'grove', polytunnel:'grove', vine_row:'grove',
  mushroom_shed:'shed', worm_farm:'infra',
  /* water */
  butt:'water', swale:'water', greywater:'water', dam:'water', drip:'infra',
  /* power */
  solar_roof:'infra', micro_hydro:'infra', generator:'shed',
  solar_tracker:'infra', inverter:'shed',
  /* animals */
  quail:'paddock', pig_pen:'paddock', turkey_run:'paddock',
  alpaca:'paddock', hay_barn:'shed',
  /* craft — all working buildings */
  bakery:'shed', smokehouse:'shed', cidery:'shed',
  wool_shed:'shed', candle_room:'shed',
  /* trade */
  honesty_box:'pavilion', cafe:'shed', bunkhouse:'shed',
  shepherd_hut:'pavilion', pickyourown:'pavilion',
  /* land */
  stone_wall:'infra', pergola:'pavilion', wildflower:'grove',
  birdbath:'infra', windbreak:'grove',
  /* home */
  bunk_annexe:'shed', laundry:'shed', mud_room:'shed',
  guest_wing:'shed', root_store:'shed',
  /* AI */
  weather_mast:'infra', soil_sensors:'infra', relay:'infra',
  server_rack:'shed', camera_post:'infra',
  /* leisure — p17_more names their art rec_<id> */
  rec_zipline:'pavilion', rec_climbing_frame:'pavilion',
  rec_firepit_seats:'pavilion', rec_plunge_pool:'water',
  rec_bird_hide:'pavilion',
};

/* A few where the generic family would read wrong, so they get their own
   progression. The rule from the art notes is consolidation rather than
   sprawl: Mk II is the obvious first fix, Mk III pulls it into one
   footprint, Mk IV is architectural. */
const NEW_ARCH_SPECIAL = {
  /* a tunnel does not gain a lean-to; it gains length, then glass, then
     automatic vents */
  polytunnel(w,h,t){
    let s = '';
    if(t >= 1) s += apron(w*0.02, h*0.84, w*0.96, h*0.14, 2);
    if(t >= 2){
      s += `<rect x="2" y="${n(h*0.10)}" width="${n(w-4)}" height="${n(h*0.8)}" rx="5"
              fill="url(#gGlass)" stroke="#5f6b72" stroke-width="0.6" opacity=".55"/>`;
      s += miniTank(w*0.92, h*0.24, Math.min(w,h)*0.10);
    }
    if(t >= 3){
      for(let i=0;i<Math.round(w/14);i++)
        s += `<rect class="lf-work" x="${n(6+i*14)}" y="${n(h*0.06)}" width="7" height="2.4" rx="1.2"
                fill="#cfd6da" opacity=".9"/>`;
      s += planter(w*0.06, h*0.90, w*0.5, h*0.07, 3);
    }
    return s;
  },
  /* the dam gains a spillway, then a jetty, then a hydro tap */
  dam(w,h,t){
    let s = '';
    if(t >= 1) s += `<rect x="${n(w*0.40)}" y="${n(h*0.80)}" width="${n(w*0.2)}" height="${n(h*0.18)}" rx="2" fill="#9aa4ab"/>`;
    if(t >= 2){
      s += `<rect x="${n(w*0.10)}" y="${n(h*0.30)}" width="${n(w*0.26)}" height="3" rx="1.5" fill="#8a6a42"/>`;
      s += `<rect x="${n(w*0.33)}" y="${n(h*0.28)}" width="3" height="${n(h*0.16)}" rx="1.5" fill="#7d5931"/>`;
    }
    if(t >= 3){
      s += `<circle class="lf-spin" cx="${n(w*0.52)}" cy="${n(h*0.86)}" r="${n(Math.min(w,h)*0.07)}"
              fill="none" stroke="#c9d6dd" stroke-width="2"/>`;
      s += planter(w*0.62, h*0.88, w*0.3, h*0.08, 7);
    }
    return s;
  },
  /* the tracker gains rows, then a hardstand, then a battery wall */
  solar_tracker(w,h,t){
    let s = '';
    if(t >= 1) s += `<g transform="translate(${n(w*0.06)},${n(h*0.60)})">${panels(w*0.88, h*0.26, 3)}</g>`;
    if(t >= 2) s += apron(w*0.02, h*0.86, w*0.96, h*0.12, 2);
    if(t >= 3){
      s += `<rect x="${n(w*0.06)}" y="${n(h*0.90)}" width="${n(w*0.36)}" height="${n(h*0.08)}" rx="2" fill="#3f4a52"/>`;
      s += `<circle class="lf-glow" cx="${n(w*0.12)}" cy="${n(h*0.94)}" r="1.3" fill="#7cf0c0"/>`;
    }
    return s;
  },
  /* the server rack gains cooling, then a UPS, then a roof array feeding it */
  server_rack(w,h,t){
    let s = '';
    if(t >= 1) s += `<rect x="${n(w*0.06)}" y="${n(h*0.04)}" width="${n(w*0.88)}" height="${n(h*0.1)}" rx="2" fill="#55616b"/>`;
    if(t >= 2) s += `<rect x="${n(w*0.72)}" y="${n(h*0.2)}" width="${n(w*0.22)}" height="${n(h*0.5)}" rx="2" fill="#46525c"/>`;
    if(t >= 3) s += `<g transform="translate(${n(w*0.06)},${n(h*0.02)})">${panels(w*0.6, h*0.16, 2)}</g>`;
    return s;
  },
};

/* ---------- 2. re-run the wrap for the new items ---------- */
/* p27's applyArchitecture already ran and only saw the original art.
   This is the same wrap, applied to the names it could not have known
   about, with a guard so an item is never double-wrapped. */
const ARCH_REWRAPPED = new Set();
function wrapNewArchitecture(){
  if(typeof ARCH !== 'object' || typeof ART !== 'object') return 0;
  let wrapped = 0, noArt = [];
  Object.keys(NEW_ARCH_FAMILY).forEach((name, idx)=>{
    if(ARCH_REWRAPPED.has(name)) return;
    const base = ART[name];
    if(typeof base !== 'function'){ noArt.push(name); return; }
    const fam = ARCH[NEW_ARCH_FAMILY[name]];
    if(!fam) return;
    /* keep the table honest so anything reading it sees the truth */
    if(typeof ARCH_FAMILY === 'object') ARCH_FAMILY[name] = NEW_ARCH_FAMILY[name];
    const spec = NEW_ARCH_SPECIAL[name];
    ART[name] = function(w, h, ob){
      const out = base(w, h, ob);
      const t = (typeof curTier === 'function') ? curTier(ob) : (ob && ob.tier) || 0;
      if(!t) return out;
      let extra = '';
      if(typeof archLod === 'function') ARCH_LOD = archLod();
      try{ extra = (spec ? spec(w, h, t, idx*7.7, ob) : fam(w, h, t, idx*7.7, ob)) || ''; }
      catch(e){ extra = ''; }
      return out + extra;
    };
    ARCH_REWRAPPED.add(name);
    wrapped++;
  });
  if(noArt.length) console.warn('[greenhollow] tiers: no art yet for', noArt.join(', '));
  return wrapped;
}
/* the leisure art is created by p17_more's REC loop, which may not have
   run by the time this file is evaluated - so try, then try once more */
wrapNewArchitecture();
setTimeout(wrapNewArchitecture, 600);

/* ---------- 3. Tier 3: two on a bench get talking ---------- */
/* Deliberately routed through the existing pairing rather than a new
   system: that is where the bubble cap, the trait voices, the day themes
   and the night and storm rules already live. */
const BENCH_TALK = {
  pair: ['Warmer out than I thought.','Have you seen the state of the top field?',
         'Sit down a minute.','I could stay here all afternoon.',
         'That is the last of it done.','Listen to that.'],
  reader: ['…','Listen to this bit.','*turns a page*','Mm.','You would like this one.'],
  reply:  ['Mm.','Go on then.','I know.','It is nice, isn\'t it.','Ha.'],
};

function benchPairs(){
  const out = [];
  if(typeof SEATS === 'undefined') return out;
  SEATS.forEach((arr, objId)=>{
    const ids = arr.filter(Boolean);
    if(ids.length < 2) return;
    const all = (S.family||[]).concat(S.workers||[]);
    for(let i=0;i<ids.length-1;i++){
      const a = all.find(p=>p.id === ids[i]);
      const b = all.find(p=>p.id === ids[i+1]);
      if(a && b) out.push([a, b]);
    }
  });
  return out;
}

/* The duplicate guard in p57 only blocks two identical bubbles on screen
   at the same moment. Consecutive repeats slipped past it, and a
   two-person conversation saying "Listen to that." three times running
   reads worse than saying nothing - counted in a 400-tick capture. This
   remembers the last line from each side and picks again. */
const BENCH_LAST = { a:null, b:null };
function pickFresh(pool, side){
  if(pool.length < 2) return pool[0];
  let line, guard = 0;
  do { line = pool[Math.floor(Math.random()*pool.length)]; }
  while(line === BENCH_LAST[side] && ++guard < 6);
  BENCH_LAST[side] = line;
  return line;
}

let BENCH_T = 0;
function tickBenchTalk(dt){
  BENCH_T -= dt;
  if(BENCH_T > 0) return;
  BENCH_T = 7 + Math.random()*8;
  if(S.weather === 'storm') return;
  if(typeof isNight === 'function' && isNight()) return;
  const pairs = benchPairs();
  if(!pairs.length) return;
  let [a, b] = pairs[Math.floor(Math.random()*pairs.length)];
  /* the pair arrives in seat order, so without this the person in seat 0
     always opens and the reader's lines never surface at all */
  if(Math.random() < 0.5){ const t = a; a = b; b = t; }
  if(typeof speak !== 'function') return;

  /* someone with a book says something different from someone just
     sitting - it is the one line that makes the book mean anything */
  const aReading = a.act === 'reading';
  const pool = aReading ? BENCH_TALK.reader : BENCH_TALK.pair;
  const line = pickFresh(pool, 'a');
  speak(a, line);
  setTimeout(()=>{
    if(a.act !== 'reading' && a.act !== 'sitting a while' && a.act !== 'sitting together') return;
    if(typeof speak !== 'function') return;
    const rp = aReading ? BENCH_TALK.reply : BENCH_TALK.pair;
    speak(b, pickFresh(rp, 'b'));
  }, 1300 + Math.random()*600);
}

const _tickPeopleBench3 = tickPeople;
tickPeople = function(dt){
  const r = _tickPeopleBench3.apply(this, arguments);
  if(S && S.speed !== 0){ try{ tickBenchTalk(dt); }catch(e){} }
  return r;
};

/* ---------- handles ---------- */
G.tierCheck = function(id){
  const bp = BPMAP[id];
  if(!bp) return 'no such item';
  const out = {};
  [0,1,2,3].forEach(t=>{
    let svg = '';
    try{ svg = ART[bp.art](bp.w*T, bp.h*T, {id:1, bp:id, tier:t, animals:bp.cap||0, ready:0}) || ''; }
    catch(e){ svg = 'ERR ' + e.message; }
    out['Mk' + (t+1)] = svg.length;
  });
  out.family = NEW_ARCH_FAMILY[bp.art] || (typeof ARCH_FAMILY==='object' ? ARCH_FAMILY[bp.art] : null) || 'none';
  out.distinct = new Set([out.Mk1,out.Mk2,out.Mk3,out.Mk4]).size;
  return out;
};
G.tierAudit = function(){
  const names = Object.keys(NEW_ARCH_FAMILY);
  const flat = [];
  names.forEach(art=>{
    const bp = BP.find(b=>b.art === art);
    if(!bp) return;
    const lens = [0,1,2,3].map(t=>{
      try{ return (ART[art](bp.w*T, bp.h*T, {id:1,bp:bp.id,tier:t,animals:bp.cap||0,ready:0})||'').length; }
      catch(e){ return -1; }
    });
    if(new Set(lens).size < 4) flat.push({art, lens});
  });
  return { checked:names.length, stillFlat:flat.length, flat:flat.slice(0,8),
           rewrapped:ARCH_REWRAPPED.size };
};
G.benchTalk = function(){ BENCH_T = 0; return { pairs: benchPairs().map(p=>p[0].name+' + '+p[1].name) }; };
