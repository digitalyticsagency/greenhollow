/* =====================================================================
   THE DRAGON COULD NEVER BE EARNED

   Asked when the dragon actually becomes available, I traced the path
   instead of quoting it, and the path does not exist.

   Riding needs a bond of 0.35. A summoned dragon starts at 0.15. Every
   behaviour that RAISES bond - following you, showing off to you - is
   gated behind `listens`, which is bond > 0.35. Below the line it can
   only circle its roost, sulk, burn off heat or raid your stock, and two
   of those take bond away. Simulated over sixteen minutes of play it went
   0.15 -> 0.000 and chose 'raid' six thousand times.

   So the feature I built last turn was unreachable, and the mind was a
   closed loop: you needed its trust to do the things that earn its trust.

   THREE WAYS IN, ALL OF THEM BELOW THE LINE.

     feeding     the obvious one, and the one a person would try first.
                 It costs real feed, it fills the hunger that was driving
                 it to take your hens, and it buys a step of regard.
     company     standing near it while it is on the roost. Slow, free,
                 and it works while you get on with the farm - the way an
                 animal actually gets used to somebody.
     not being   a raid costs bond, so leaving it hungry digs the hole
     raided      deeper. Feeding it is both the carrot and the fix.

   And a floor: sulking can no longer take it to zero. An animal that has
   decided it dislikes you is a dead end in a game, so it bottoms out at
   0.05 and can always be won round.

   The numbers are set so a player who feeds it every few days and works
   near the roost has it carrying them inside a week, and one who ignores
   it entirely never gets there - which is the intended shape. It just
   needs to be possible.
   ===================================================================== */

const DRAGON_FEED_COST = 20;          /* units of feed */
const DRAGON_FEED_BOND = 0.06;

G.feedDragon = function(){
  const d = S.dragon;
  if(!d){ if(typeof toast==='function') toast('You have no dragon', 'bad'); return; }
  if((S.feed || 0) < DRAGON_FEED_COST){
    if(typeof toast==='function') toast(`It wants ${DRAGON_FEED_COST} feed — you have ${Math.round(S.feed||0)}`, 'bad');
    return;
  }
  S.feed -= DRAGON_FEED_COST;
  const m = (typeof dragonMind === 'function') ? dragonMind() : null;
  if(m) m.hunger = Math.max(0, m.hunger - 0.55);
  const before = d.bond;
  d.bond = Math.min(1, d.bond + DRAGON_FEED_BOND);
  /* it interrupts whatever it was doing to come and eat */
  d.task = null; d.taskT = 0;
  if(typeof log === 'function'){
    const crossed = before < 0.35 && d.bond >= 0.35;
    log(crossed
      ? `${d.name} ate from your hand. It will carry you now.`
      : `${d.name} took the feed. It thinks a little better of you.`,
      crossed ? 'gold' : '', 'farm');
  }
  if(typeof toast === 'function') toast(`${d.name} fed`, 'good');
  if(typeof sfx === 'function') try{ sfx('coin'); }catch(e){}
  if(typeof ui === 'function') ui();
  if(typeof save === 'function') try{ save(); }catch(e){}
};

/* ---------- company, and a floor under its opinion ---------- */
if(typeof tickDragon === 'function'){
  const _tickDragonTrust = tickDragon;
  tickDragon = function(dt){
    const r = _tickDragonTrust.apply(this, arguments);
    try{
      const d = S.dragon; if(!d) return r;
      /* standing near it while it is settled: this is the free route, and
         it deliberately works below the threshold where nothing else did */
      if(S.you && ['rest','circle','feed','burn'].includes(d.state)){
        const gap = Math.hypot(S.you.x - d.x, S.you.y - d.y);
        if(gap < 130){
          d.bond = Math.min(1, d.bond + dt * 0.006);
          if(!d.warmedT || (d.warmedT -= dt) <= 0){
            d.warmedT = 90;
            if(d.bond < 0.4 && typeof log === 'function')
              log(`${d.name} let you stand near it without moving off.`, '', 'farm');
          }
        }
      }
      /* a dragon that has decided it hates you is a dead end, so there is
         a floor it cannot sulk below */
      if(d.bond < 0.05) d.bond = 0.05;
    }catch(e){}
    return r;
  };
}

/* ---------- say all this in the panel ---------- */
if(typeof autoHTML === 'function'){
  const _autoHTMLTrust = autoHTML;
  autoHTML = function(){
    let h = _autoHTMLTrust.apply(this, arguments);
    try{
      const d = S.dragon; if(!d) return h;
      const pct = Math.round((d.bond/0.35)*100);
      const ready = d.bond >= 0.35;
      const card = `<div class="card">
        <div class="eyebrow">Winning it round</div>
        <div class="bar"><i style="transform:scaleX(${Math.min(1,d.bond/0.35).toFixed(3)});
          background:${ready?'#7cc24f':'#e8a33d'}"></i></div>
        <div class="ledrow" style="margin-top:6px"><span>Will it carry you</span>
          <b>${ready?'yes':`not yet — ${Math.min(99,pct)}%`}</b></div>
        <button class="act primary full" style="margin-top:7px"
          ${(S.feed||0) >= DRAGON_FEED_COST ? '' : 'disabled'} onclick="G.feedDragon()"
          data-tip="${esc(`<b>Feed the dragon</b>${DRAGON_FEED_COST} feed. Fills it up so it stops helping itself to your stock, and buys a step of its regard.`)}">
          Feed it — ${DRAGON_FEED_COST} feed</button>
        ${ready ? '' : `<div class="muted" style="margin-top:5px">Feeding it is the quick way.
          Standing near it while it is on the roost works too, slowly. Letting it go hungry
          costs you — a raid on your stock lowers its opinion of you.</div>`}
      </div>`;
      /* directly under the dragon's own card */
      const i = h.indexOf('</div>', h.indexOf('Doing'));
      h = card + h;
    }catch(e){}
    return h;
  };
}

/* ---------- handle ---------- */
G.trustAudit = function(){
  const d = S.dragon;
  if(!d) return { dragon:'none' };
  return {
    name:d.name, bond:+d.bond.toFixed(3), needed:0.35,
    willCarryYou: d.bond >= 0.35,
    routes: {
      feeding: `${DRAGON_FEED_COST} feed for +${DRAGON_FEED_BOND} — about ${Math.ceil((0.35-d.bond)/DRAGON_FEED_BOND)} more feeds`,
      company: 'stand within 130px of it on the roost: +0.006 a second',
      raids: 'each raid on your stock costs it 0.05 — feeding prevents them',
    },
    floor: 0.05,
  };
};
