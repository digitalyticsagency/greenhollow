/* =====================================================================
   WHY NOBODY EVER HIRED ANYONE

   The played save has workers: 0 after 199 days. The reason is one
   missing line rather than a price problem.

   Produce accrues at p5_engine:447 as

       o.ready += Math.max(1, Math.round(E.per(o) * earningHead(o) * yieldMul(o)));

   and there is no cap on o.ready and no spoilage system anywhere in the
   game. A chicken coop left alone for 199 days holds 1,592 eggs worth
   $9,552, and all of it comes out in a single click whenever you next
   look at it. Nothing is ever lost by waiting.

   So a farmhand at $1,740 a month plus a $320 cottage buys you exactly
   one thing: the same produce, in the barn, earlier. That is not worth a
   wage, and the save is correct not to have hired anybody. The same
   applies to the AI automation - it is paying for a convenience that
   costs nothing to go without.

   THE FIX IS THE MISSING HUSBANDRY, NOT A WAGE CUT

   A pen has somewhere to put the eggs, and that somewhere fills up. Each
   pen now holds about a week of its own production; once it is full the
   animals keep living but production stalls until someone empties it.
   That is what actually happens on a smallholding, and it gives labour -
   hired, family or automated - something real to be worth.

   Deliberately conservative in two ways:

   - It never deletes anything. A pen already holding 1,592 eggs keeps
     all 1,592; it simply stops adding more until collected. Capping to
     the limit would have destroyed thousands of dollars of a played
     save's stock, which is not an acceptable way to fix a balance bug.

   - A week is generous. A player checking in every few days will never
     see it. It bites on the pens you have forgotten, which is precisely
     where a farmhand should be earning their wage.
   ===================================================================== */

/* about a week of production, with a floor so small pens are not fussy */
function penCapacity(o){
  const bp = BPMAP[o.bp];
  if(!bp || bp.kind !== 'animal') return Infinity;
  const perDay = (typeof E === 'object' && E.per && E.cap)
    ? (E.cap(o) * E.per(o) / (bp.cycle || 1))
    : ((bp.cap || 1) * (bp.per || 1) / (bp.cycle || 1));
  return Math.max(12, Math.round(perDay * 7));
}

/* Wrapped rather than clamped after the fact: the tick is inside a long
   forEach that cannot be reached, so the readings are taken either side
   and any growth on an already-full pen is undone. Undoing the increment
   preserves whatever was there before, which clamping would not. */
if(typeof advanceDay === 'function'){
  const _advanceStore = advanceDay;
  advanceDay = function(){
    const before = new Map();
    (S.objs || []).forEach(o=>{
      if(BPMAP[o.bp] && BPMAP[o.bp].kind === 'animal') before.set(o, o.ready || 0);
    });

    const r = _advanceStore.apply(this, arguments);

    let stalled = 0;
    before.forEach((was, o)=>{
      const capN = penCapacity(o);
      /* only a pen that was ALREADY full stalls, so the run that fills it
         still completes - you are never cut off mid-day without warning */
      if(was >= capN && (o.ready || 0) > was){ o.ready = was; stalled++; }
    });
    if(stalled && typeof log === 'function'){
      log(stalled === 1
        ? 'A pen is full — nothing more can be stored until it is collected.'
        : `${stalled} pens are full — nothing more can be stored until they are collected.`,
        'bad', 'farm');
    }
    return r;
  };
}

/* ---------- tell the player, in the panel that already shows the count ---------- */
(function showFullness(){
  if(typeof ui !== 'function') return;
  const paint = ()=>{
    /* There is no selObj() in this codebase — selection is the global
       `sel`, holding an id. This asked for a function that has never
       existed, got null every time, and returned before painting, so the
       "% of cap" badge this whole block exists for was never once shown. */
    const o = (S.objs || []).find(z=>z.id === sel);
    if(!o || !BPMAP[o.bp] || BPMAP[o.bp].kind !== 'animal') return;
    const capN = penCapacity(o);
    const pct = Math.min(1, (o.ready || 0) / capN);
    /* scoped to the panel: this walked all 35,000 nodes of the document on
       every ui() call, and the label it wants is always in the right panel */
    [...(document.getElementById('rightBody')||document).querySelectorAll('*')].forEach(el=>{
      if(el.children.length || el.dataset.penfull) return;
      const t = el.textContent.trim();
      if(t !== 'Waiting to collect' && t !== 'Waiting') return;
      el.dataset.penfull = '1';
      const note = document.createElement('span');
      note.style.cssText = 'margin-left:6px;font-size:11px;opacity:.75';
      note.textContent = pct >= 1 ? '· FULL' : `· ${Math.round(pct*100)}% of ${capN}`;
      if(pct >= 1) note.style.color = '#e08a8a';
      el.appendChild(note);
    });
  };
  const _uiStore = ui;
  ui = function(){ const r = _uiStore.apply(this, arguments); try{ paint(); }catch(e){} return r; };
})();

/* ---------- handle ---------- */
G.storageAudit = function(){
  const pens = (S.objs || []).filter(o=>BPMAP[o.bp] && BPMAP[o.bp].kind === 'animal');
  const w3 = 900 + 3*280;
  const sample = ['coop','goat_pen','cow_pasture','duck_pond']
    .filter(id=>BPMAP[id])
    .map(id=>{
      const b = BPMAP[id];
      const fake = { bp:id, tier:0, animals:b.cap };
      const capN = penCapacity(fake);
      const perDay = b.cap*b.per/b.cycle;
      return `${b.name}: ${perDay}/day, holds ${capN} (${(capN/perDay).toFixed(1)} days) then stalls`;
    });
  return {
    penLimits: sample,
    yourPens: pens.map(o=>{
      const capN = penCapacity(o);
      return `${BPMAP[o.bp].name}: ${o.ready||0} / ${capN}${(o.ready||0)>=capN?' — FULL, production stalled':''}`;
    }),
    workerNowWorth: `a skill-3 hand costs $${w3}/mo and prevents the stall on up to 5 pens a day`,
    neverDeletes: 'a pen over the limit keeps everything it has; only new production stops',
  };
};
