/* =====================================================================
   THE HUB PRICE, THE BUBBLES, AND ONE OUT AT A TIME

   Three unrelated fixes that all needed doing.

   1. The control hub is the thing that turns the farm into an automated
      business, and at A$480 it was an impulse buy. It is A$50,000 now -
      a genuine goal - except with the unlock code, where it is A$450 so
      the automation can be demonstrated without grinding for it.

   2. Speech bubbles were drawn to a width that had nothing to do with
      how wide the text renders, so a long line spilled out of its own
      rounded rect. Two people could also say the same line at the same
      moment and stack two identical bubbles on top of each other.

   3. Stock now come out of the shed one at a time.
   ===================================================================== */

/* ---------- 1. what the hub costs ---------- */
/* A getter rather than a number, so every existing reader - the shop
   card, the affordability check, place(), the refund - picks it up with
   no changes. Nothing in the codebase writes to bp.cost, so there is no
   setter to lose. */
const HUB_COST_FULL  = 50000;
const HUB_COST_ADMIN = 450;

function hubUnlocked(){
  if(typeof S !== 'undefined' && S && S.unlocked) return true;
  if(typeof PLAY !== 'undefined' && PLAY && PLAY.unlocked) return true;
  return false;
}

if(typeof BPMAP === 'object' && BPMAP.ai_hub){
  /* upgrades still price off the old number - Mk II at 0.9x of fifty
     thousand would be A$87,540, which is not a tier, it is a wall */
  BPMAP.ai_hub.upBase = 480;
  Object.defineProperty(BPMAP.ai_hub, 'cost', {
    get(){ return hubUnlocked() ? HUB_COST_ADMIN : HUB_COST_FULL; },
    enumerable: true, configurable: true,
  });
  BPMAP.ai_hub.tip = 'The single biggest investment on the farm. Mk I runs irrigation. '
    + 'Mk II adds the harvest drone and livestock robot. Mk III adds agronomy and logistics. '
    + 'Mk IV adds the grid optimiser.';
}

if(typeof upCost === 'function'){
  const _upCostBase = upCost;
  upCost = function(o){
    const bp = BPMAP[o.bp];
    if(bp && bp.upBase){
      return Math.round(bp.upBase * (0.9 + tOf(o)*0.85) + 40);
    }
    return _upCostBase.apply(this, arguments);
  };
}

/* ---------- 1b. the animal ladder was upside down ---------- */
/* Audited by computing payback from the game's own E.per / E.cycle /
   yieldMul rather than reading the tables:

     goat_pen     A$630   A$73/day   9 days
     coop         A$398   A$39/day  10
     duck_pond    A$444   A$44/day  10
     apiary       A$548   A$39/day  14
     sheep        A$800   A$22/day  36
     cow_pasture A$2360   A$58/day  40

   A dairy cow produced 1.62 units a day. So did a goat - identical
   per-head output - while costing A$240 a head against A$70, sitting in
   a pen that cost A$1400 against A$280, and eating three times as much.
   The cow was strictly worse than the goat on every axis while being
   gated four levels later, and its own tip called it "the best daily
   return". Sheep were worse again: the slowest payback in the game.

   Crops are fine and were left alone - a bed costs A$45 and pays back in
   three to six days across every crop, which is a healthy spread.

   Cows are now what the tip always claimed: the biggest earner on the
   farm and the biggest feed bill. Sheep become a real mid-game option
   instead of dead content. */
if(typeof BPMAP === 'object'){
  if(BPMAP.cow_pasture){
    BPMAP.cow_pasture.per = 6;          /* was 2 - same as a goat, for 3.4x the price */
    BPMAP.cow_pasture.tip = 'The biggest earner on the farm and the biggest feed bill. '
      + 'Do not buy stock until the feed store can keep up.';
  }
  if(BPMAP.sheep){
    BPMAP.sheep.per = 3;                /* was 1 - a 36-day payback is not an option, it is a trap */
    BPMAP.sheep.desc = 'A heavy fleece every five days. Slow cycle, high value per unit.';
  }
}

/* ---------- 2. bubbles that fit their text ---------- */
/* The old width was max(38, min(120, len*5.4)). At font-size 9 a
   character averages about 4.9px, so a 34-character line needs ~167px
   and was given 120 - it ran out of both ends of its own bubble. */
if(typeof speak === 'function'){
  speak = function(p, text){
    const layer = document.getElementById('people');
    if(!layer || !text) return;
    text = String(text);

    /* Two speakers reaching for the same line at the same moment used to
       stack two identical bubbles. One is enough. */
    if(BUBBLES.some(b => b.text === text && Math.abs(b.p.x - p.x) < 140
                                         && Math.abs(b.p.y - p.y) < 90)) return;

    /* long lines get a smaller face rather than an ever-wider bubble */
    const fs = text.length > 30 ? 8 : 9;
    const per = fs * 0.545;                     /* measured against system-ui */
    const w   = Math.max(40, Math.min(210, text.length*per + 14));
    const h   = 18 * (fs/9);

    let lift = 0;
    BUBBLES.forEach(b=>{
      if(Math.abs(b.p.x - p.x) < 110 && Math.abs(b.p.y - p.y) < 52) lift += h + 6;
    });

    const id = 'bub' + Math.random().toString(36).slice(2,7);
    const g = document.createElementNS('http://www.w3.org/2000/svg','g');
    g.setAttribute('id', id);
    g.setAttribute('class', 'bubble');
    g.setAttribute('transform', `translate(${Math.round(p.x)},${Math.round(p.y - 30 - lift)})`);
    g.innerHTML =
      `<rect x="${n(-w/2)}" y="${n(-h+3)}" width="${n(w)}" height="${n(h)}" rx="${n(h/2)}"
         fill="#fdfbf4" stroke="#c9c0aa" stroke-width="0.8"/>
       <path d="M-3 3 L0 8 L3 3 Z" fill="#fdfbf4" stroke="#c9c0aa" stroke-width="0.8"/>
       <text x="0" y="${n(-h*0.5 + fs*0.36)}" text-anchor="middle" font-size="${fs}"
         font-family="system-ui,-apple-system,sans-serif" fill="#3d4634">${text}</text>`;
    layer.appendChild(g);
    BUBBLES.push({id, life:3.6, p, lift, text});
  };
}

/* The day-29 scene opened with a line that was also in that day's adult
   small-talk pool, so the scene and the ambient chatter could say the
   same sentence in the same second. Scene openers are now their own. */
if(typeof DAYS !== 'undefined' && Array.isArray(DAYS)){
  DAYS.forEach(d=>{
    if(!d.s || !d.s.l) return;
    d.s.l = d.s.l.map(line => d.a.indexOf(line) >= 0 ? line + '' : line);
    /* if an opener duplicates a pool line, drop it from the pool instead -
       the scene is the more specific of the two */
    d.a = d.a.filter(line => d.s.l.indexOf(line) < 0);
    if(!d.a.length) d.a = ['Long day.'];
  });
}

/* ---------- 3. one out of the shed at a time ---------- */
/* Real stock do not trickle in and out of a shed in ones and twos all
   night; they are in, and one gets up. So when the pen wants to be
   inside - after dark, or shut in by a storm - exactly one animal may be
   out, and which one rotates so it is not always the same head. */
const OUT_TURN_MS = 18000;

function turnHolder(m){
  const now = Date.now();
  if(m.outIdx === undefined || now > (m.outUntil || 0)){
    const pool = m.list.filter(a=>!a.away);
    if(!pool.length){ m.outIdx = -1; m.outUntil = now + OUT_TURN_MS; return -1; }
    /* next in line rather than random, so everyone gets a turn */
    const cur = m.list.findIndex(a=>a.i === m.outIdx);
    const nxt = pool[(Math.max(0,cur) + 1) % pool.length];
    m.outIdx  = nxt.i;
    m.outUntil = now + OUT_TURN_MS + Math.random()*8000;
  }
  return m.outIdx;
}

if(typeof chooseAct === 'function'){
  chooseAct = function(m, a, night){
    const penWantsIn = !!S.shed || night;
    /* the one whose turn it is stays out; everybody else is in */
    const wantIn = penWantsIn ? (a.i !== turnHolder(m)) : false;
    a.inside = wantIn;
    const pool = (wantIn ? IN_ACTS : OUT_ACTS)[m.kind] || OUT_ACTS.sheep;
    const pick = pool[Math.floor(Math.random()*pool.length)];
    a.act = pick[0]; a.line = pick[1];
    a.until = Date.now() + 4000 + Math.random()*9000;

    if(wantIn){
      const b = m.box;
      a.gx = b.x + 6 + Math.random()*Math.max(2, b.w - 12);
      a.gy = b.y + 6 + Math.random()*Math.max(2, b.h - 12);
      return;
    }
    const g = outdoorEllipse(m);
    const others = m.list.filter(o=>o !== a && !o.inside && !o.away);
    if(others.length && Math.random() < 0.62){
      const t = others[Math.floor(Math.random()*others.length)];
      a.gx = t.x + (Math.random()-0.5)*26;
      a.gy = t.y + (Math.random()-0.5)*20;
    } else {
      const pt = pointInEllipse(g);
      a.gx = pt.x; a.gy = pt.y;
    }
    const goal = { x:a.gx, y:a.gy };
    clampToEllipse(goal, g.cx, g.cy, g.rx, g.ry);
    a.gx = goal.x; a.gy = goal.y;
  };
}

/* the turn changing has to actually move them, not wait for the current
   activity to run out */
if(typeof tickMinds === 'function'){
  const _tickMindsTurn = tickMinds;
  tickMinds = function(dt){
    const r = _tickMindsTurn.apply(this, arguments);
    if(!S || S.speed === 0) return r;
    const night = (typeof isNight === 'function') ? isNight() : false;
    if(!night && !S.shed) return r;
    (typeof stockPens === 'function' ? stockPens() : []).forEach(o=>{
      const m = MINDS.get(o.id); if(!m) return;
      const holder = turnHolder(m);
      m.list.forEach(a=>{
        if(a.away) return;
        const shouldBeIn = (a.i !== holder);
        if(a.inside !== shouldBeIn) a.until = 0;      /* re-decide now */
      });
    });
    return r;
  };
}

/* ---------- handles ---------- */
G.hubPrice = function(){ return { unlocked:hubUnlocked(), cost:BPMAP.ai_hub.cost, mk2:upCost({bp:'ai_hub', tier:0}) }; };
G.whoIsOut = function(){
  return (typeof stockPens === 'function' ? stockPens() : []).map(o=>{
    const m = MINDS.get(o.id);
    if(!m) return { pen:o.bp, out:'no mind' };
    return { pen:o.bp, head:m.list.length, turn:m.outIdx,
             outside:m.list.filter(a=>!a.inside && !a.away).length };
  });
};
