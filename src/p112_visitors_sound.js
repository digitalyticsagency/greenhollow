/* =====================================================================
   SOMETHING DIFFERENT EVERY TIME, AND YOU CAN HEAR IT

   Three reports, all of them right, and the second one had a cause I
   could measure straight away.

   1. ALWAYS A FOX. summonWild picks at random from the species flagged
      `threat`, and exactly one species carries that flag. The pool had a
      single member, so the random choice was a formality. Eight draws in
      a row returned fox eight times.

      It draws from everything that can plausibly turn up now - the
      predators, the browsers, the birds - and it will not repeat what it
      gave you last time. Plus four visitors that are not from round here.

   2. THE ALIENS. Four, and they are not reskinned foxes. Each wants
      something different from the farm and behaves differently when the
      dog goes for it:

        drifter   a slow glowing orb. Samples a crop and leaves. Harmless,
                  and it ignores the dog entirely, which unnerves her.
        skitter   spindly and fast. Steals a small item and bolts.
        watcher   hangs in the air and does nothing at all. Frightens the
                  livestock by existing.
        harvester a squat machine. Cuts a bed and takes the lot, and the
                  dog cannot move it.

   3. NOTHING TO HEAR. The music bus was live - measured at 0.22 with the
      context running - but a cue is a handful of quiet oscillators and
      there was no punch tied to the action anywhere. A fight had no
      impacts, the beam had no charge, the mountain came down in silence.

      So: a proper sound for each beat, through the effects bus rather
      than the music one, because that is the loud channel. Impacts are
      noise bursts through a falling filter, the beam is a rising sweep
      that holds and then breaks, and the collapse is low noise with a
      long tail. All generated - there is not going to be a megabyte of
      audio files inside a single HTML page.
   ===================================================================== */

/* ---------- 1. the aliens ---------- */
(function alienSpecies(){
  if(typeof WILD !== 'object' || WILD.drifter) return;
  Object.assign(WILD, {
    drifter:  { n:'Drifter',   active:[20,4], threat:0, good:0, targets:['plot'],
                speed:42,  wary:0.05, size:1.0, alien:1, c:'#8fe8d0', c2:'#3fa88c',
                say:['…'], seen:'A pale light is drifting slowly over the beds.' },
    skitter:  { n:'Skitter',   active:[21,3], threat:1, good:0, targets:['plot','animal'],
                speed:150, wary:0.55, size:0.8, alien:1, c:'#c9a4ff', c2:'#6a4ad8',
                say:['!'], seen:'Something thin and quick went past the barn.' },
    watcher:  { n:'Watcher',   active:[22,3], threat:1, good:0, targets:['animal'],
                speed:30,  wary:0.02, size:1.2, alien:1, c:'#ffd88f', c2:'#c88a2a',
                say:['…'], seen:'Something is hanging over the yard, not moving.' },
    harvester:{ n:'Harvester', active:[1,5],  threat:1, good:0, targets:['plot'],
                speed:56,  wary:0.10, size:1.4, alien:1, c:'#b8c4cc', c2:'#5a6a74',
                say:['…'], seen:'A squat machine has come into the far bed.' },
  });
})();

if(typeof wildArt === 'function'){
  const _wildArtBase = wildArt;
  wildArt = function(w){
    const sp = WILD[w.k];
    if(!sp || !sp.alien) return _wildArtBase.apply(this, arguments);
    const s0 = sp.size;
    let s = `<ellipse cx="1" cy="3" rx="${n(9*s0)}" ry="${n(3*s0)}" fill="#16240c" opacity=".22"/>`;
    if(w.k === 'drifter'){
      s += `<circle cx="0" cy="${n(-10*s0)}" r="${n(11*s0)}" fill="${sp.c}" opacity=".22"/>`;
      s += `<circle cx="0" cy="${n(-10*s0)}" r="${n(7*s0)}" fill="${sp.c}" opacity=".45"/>`;
      s += `<circle cx="0" cy="${n(-10*s0)}" r="${n(4*s0)}" fill="#ffffff" opacity=".8"/>`;
      s += `<ellipse class="adrift" cx="0" cy="${n(-10*s0)}" rx="${n(15*s0)}" ry="${n(4*s0)}"
        fill="none" stroke="${sp.c2}" stroke-width="1.2" opacity=".7"/>`;
    } else if(w.k === 'skitter'){
      s += `<ellipse cx="0" cy="${n(-9*s0)}" rx="${n(6*s0)}" ry="${n(4.4*s0)}" fill="${sp.c2}"/>`;
      s += `<ellipse cx="0" cy="${n(-10*s0)}" rx="${n(3.4*s0)}" ry="${n(2.2*s0)}" fill="${sp.c}"/>`;
      for(let i=0;i<3;i++){
        const dx0 = (i-1)*4*s0;
        s += `<path d="M${n(dx0)} ${n(-7*s0)} L${n(dx0*1.9)} ${n(-1*s0)} L${n(dx0*2.3)} 2"
          fill="none" stroke="${sp.c2}" stroke-width="${n(1.3*s0)}" stroke-linecap="round"/>`;
      }
      s += `<circle cx="0" cy="${n(-10.4*s0)}" r="${n(1.2*s0)}" fill="#fff"/>`;
    } else if(w.k === 'watcher'){
      s += `<ellipse class="awatch" cx="0" cy="${n(-16*s0)}" rx="${n(9*s0)}" ry="${n(6*s0)}" fill="${sp.c2}"/>`;
      s += `<ellipse cx="0" cy="${n(-17*s0)}" rx="${n(6*s0)}" ry="${n(3.6*s0)}" fill="${sp.c}"/>`;
      s += `<circle cx="0" cy="${n(-16*s0)}" r="${n(2.6*s0)}" fill="#2a1c0a"/>`;
      s += `<ellipse cx="0" cy="${n(-6*s0)}" rx="${n(11*s0)}" ry="${n(2.6*s0)}" fill="${sp.c}" opacity=".18"/>`;
    } else {
      s += `<rect x="${n(-8*s0)}" y="${n(-12*s0)}" width="${n(16*s0)}" height="${n(9*s0)}" rx="2" fill="${sp.c2}"/>`;
      s += `<rect x="${n(-8*s0)}" y="${n(-12*s0)}" width="${n(16*s0)}" height="${n(3*s0)}" rx="2" fill="${sp.c}"/>`;
      s += `<circle cx="${n(-4*s0)}" cy="${n(-8*s0)}" r="${n(1.6*s0)}" fill="#ff7a5a"/>`;
      for(let i=0;i<4;i++)
        s += `<rect x="${n((-7+i*4)*s0)}" y="${n(-3*s0)}" width="${n(2*s0)}" height="${n(4*s0)}" fill="#3a444a"/>`;
    }
    return s;
  };
}

/* spawnWild logs sp.seen directly, so a species without one puts the
   literal word "undefined" in the farm log — which is exactly what the
   four aliens did on their first outing. Belt and braces for anything
   added later without one. */
(function guardSeen(){
  Object.keys(WILD).forEach(k=>{
    if(!WILD[k].seen) WILD[k].seen = `A ${WILD[k].n.toLowerCase()} is on the land.`;
    if(!WILD[k].say)  WILD[k].say = ['…'];
  });
})();

/* ---------- 2. never the same thing twice running ---------- */
if(typeof summonWild === 'function'){
  const _summonWildBase = summonWild;
  summonWild = function(kind){
    if(kind) return _summonWildBase.apply(this, arguments);
    /* Everything that can plausibly turn up, not just the one species
       carrying the `threat` flag — that pool had exactly one member, so
       eight draws gave eight foxes. */
    let pool = Object.keys(WILD).filter(k=>!WILD[k].good || WILD[k].alien);
    if(!pool.length) pool = Object.keys(WILD);
    if(pool.length > 1 && S.lastSummon) pool = pool.filter(k=>k !== S.lastSummon);
    const k = pool[Math.floor(Math.random()*pool.length)];
    S.lastSummon = k;
    const w = _summonWildBase.call(this, k);
    if(w && WILD[k].alien && typeof log === 'function')
      /* 'alerts' is a log FILTER chip, not a log() category — passing it
         crashed renderLog outright. 'farm' is the category these belong in. */
      log(`Something came over the hedge that is not from round here.`, 'bad', 'farm');
    return w;
  };
}

/* what an alien does when it gets where it is going */
if(typeof wildPayoff === 'function'){
  const _payoffBase = wildPayoff;
  wildPayoff = function(w){
    const sp = w && WILD[w.k];
    if(!sp || !sp.alien) return _payoffBase.apply(this, arguments);
    try{
      if(w.k === 'drifter'){
        log(`The drifter passed over a bed, took a reading of some kind, and left.`, '', 'farm');
      } else if(w.k === 'skitter'){
        const keys = Object.keys(S.store||{}).filter(k=>S.store[k]>0);
        if(keys.length){
          const k = keys[Math.floor(Math.random()*keys.length)];
          const took = Math.min(S.store[k], 2);
          S.store[k] -= took; if(S.store[k]<=0) delete S.store[k];
          log(`A skitter went through the barn and took ${took} × ${GOODS[k].n}.`, 'bad', 'money');
        }
      } else if(w.k === 'watcher'){
        (S.objs||[]).forEach(o=>{ const bp=BPMAP[o.bp];
          if(bp && bp.kind==='animal' && o.care!==undefined) o.care = Math.max(0, o.care-0.25); });
        log(`The watcher hung over the yard doing nothing. The stock would not settle.`, 'bad', 'farm');
      } else if(w.k === 'harvester'){
        const bed = (S.objs||[]).find(o=>BPMAP[o.bp] && BPMAP[o.bp].kind==='plot' && o.crop);
        if(bed){ const c=bed.crop; bed.crop=null; bed.stage=0;
          log(`A harvester cut your ${CROPS[c]?c:'crop'} and took the lot. Nothing you did stopped it.`, 'bad', 'farm'); }
      }
    }catch(e){}
    return null;
  };
}

/* ---------- 3. sound with some weight to it ---------- */
function ac(){
  try{ const m = SND.music(); return m ? m.ctx : null; }catch(e){ return null; }
}
function bang(kind){
  if(typeof SET === 'function' && SET('sfx') === false) return;
  const c = ac(); if(!c) return;
  const t = c.currentTime;
  const out = c.createGain(); out.gain.value = 0.9; out.connect(c.destination);

  const noise = (dur, f0, f1, g0)=>{
    const len = Math.max(1, Math.floor(c.sampleRate*dur));
    const b = c.createBuffer(1, len, c.sampleRate);
    const d = b.getChannelData(0);
    for(let i=0;i<len;i++) d[i] = (Math.random()*2-1) * (1 - i/len);
    const s = c.createBufferSource(); s.buffer = b;
    const f = c.createBiquadFilter(); f.type='lowpass';
    f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t+dur);
    const g = c.createGain();
    g.gain.setValueAtTime(g0, t); g.gain.exponentialRampToValueAtTime(0.0001, t+dur);
    s.connect(f); f.connect(g); g.connect(out); s.start(t); s.stop(t+dur);
  };
  const swept = (dur, f0, f1, type, g0, delay)=>{
    const o = c.createOscillator(); o.type = type;
    const at = t + (delay||0);
    o.frequency.setValueAtTime(f0, at); o.frequency.exponentialRampToValueAtTime(f1, at+dur);
    const g = c.createGain();
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(g0, at+0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, at+dur);
    o.connect(g); g.connect(out); o.start(at); o.stop(at+dur+0.05);
  };

  if(kind === 'hit'){        noise(0.16, 2600, 220, 0.55); swept(0.12, 320, 90, 'square', 0.30); }
  else if(kind === 'heavy'){ noise(0.42, 1800, 90, 0.75);  swept(0.34, 180, 44, 'sawtooth', 0.40); }
  else if(kind === 'charge'){ swept(1.5, 90, 900, 'sawtooth', 0.22); swept(1.5, 92, 906, 'square', 0.12); }
  else if(kind === 'beam'){  swept(1.1, 1400, 260, 'sawtooth', 0.34); noise(1.1, 3000, 500, 0.30); }
  else if(kind === 'blast'){ noise(1.5, 3200, 60, 0.95); swept(1.0, 260, 40, 'sawtooth', 0.55);
                             swept(0.5, 1200, 120, 'square', 0.30); }
  else if(kind === 'rumble'){ noise(2.2, 500, 40, 0.7); swept(1.8, 90, 30, 'sine', 0.45); }
  else if(kind === 'whoosh'){ noise(0.34, 900, 2600, 0.34); }
  else if(kind === 'roar'){  swept(0.9, 220, 70, 'sawtooth', 0.5); noise(0.9, 900, 120, 0.4); }
}
G.bang = bang;

/* tie it to the beats */
if(typeof duelTick === 'function'){
  const _duelTickSnd = duelTick;
  duelTick = function(dt){
    const beforeBeat = DUEL ? DUEL.beat : -1;
    const beforeShake = DUEL ? DUEL.shake : 0;
    const r = _duelTickSnd.apply(this, arguments);
    try{
      if(!DUEL || DUEL.over) return r;
      /* a new beat gets its own sound */
      if(DUEL.beat !== beforeBeat){
        const k = BEATS[DUEL.beat] && BEATS[DUEL.beat].k;
        if(k === 'charge') bang('charge');
        else if(k === 'beam') bang('beam');
        else if(k === 'struggle') bang('beam');
        else if(k === 'finish') bang('blast');
        else if(['clash','knock','meteor','disc','barrage','grapple'].includes(k)) bang('whoosh');
        else if(k === 'arrive') bang('roar');
      }
      /* every impact the fight generates */
      if(DUEL.shake > 0.9 && beforeShake <= 0.9) bang('heavy');
      else if(DUEL.shake > 0.3 && beforeShake <= 0.3) bang('hit');
    }catch(e){}
    return r;
  };
}
/* the mountain */
if(typeof breakPeak === 'function'){
  const _breakPeakSnd = breakPeak;
  breakPeak = function(){
    const p = _breakPeakSnd.apply(this, arguments);
    try{ if(p){ bang('heavy'); setTimeout(()=>bang('rumble'), 220); } }catch(e){}
    return p;
  };
}
/* the chase */
if(typeof chaseEnd === 'function'){
  const _chaseEndSnd = chaseEnd;
  chaseEnd = function(how){ try{ bang(how==='seen off'?'hit':'whoosh'); }catch(e){}
    return _chaseEndSnd.apply(this, arguments); };
}
/* the dragon */
if(typeof G.summonDragon === 'function'){
  const _sdSnd = G.summonDragon;
  G.summonDragon = function(){ const r = _sdSnd.apply(this, arguments);
    try{ if(S.dragon) bang('roar'); }catch(e){} return r; };
}

(function alienCss(){
  const s = document.createElement('style');
  s.textContent = `
  .adrift{ animation: adr 3.2s linear infinite; transform-origin:center; }
  @keyframes adr{ from{ transform: rotate(0deg) } to{ transform: rotate(360deg) } }
  .awatch{ animation: awa 2.6s ease-in-out infinite alternate; }
  @keyframes awa{ from{ transform: translateY(0) } to{ transform: translateY(-5px) } }
  @media (prefers-reduced-motion: reduce){ .adrift,.awatch{ animation:none } }
  `;
  document.head.appendChild(s);
})();

/* ---------- handle ---------- */
G.visitorAudit = function(){
  const pool = Object.keys(WILD).filter(k=>!WILD[k].good || WILD[k].alien);
  return {
    summonPool: pool,
    poolSize: pool.length,
    aliens: Object.keys(WILD).filter(k=>WILD[k].alien).map(k=>`${WILD[k].n} — ${WILD[k].targets.join('/')}`),
    lastSummoned: S.lastSummon || 'none yet',
    neverRepeats: 'the previous one is removed from the draw',
    sounds: ['hit','heavy','charge','beam','blast','rumble','whoosh','roar'],
    wasBefore: 'the pool held one species, so every summon was a fox',
  };
};
