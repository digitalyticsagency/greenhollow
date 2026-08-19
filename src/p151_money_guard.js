/* =====================================================================
   A$NaN

   Reported: the cash pill reading A$NaN. The header prints fmt(S.cash) and
   fmt(undefined) is exactly "A$NaN", so the number itself had gone.

   I could not reproduce it. A fresh game stays clean through the monthly
   reckoning, through placing and wrecking, through every obligation firing,
   through feeding, bathing, buying a dog, and through every good's price
   and output — all checked for NaN individually and none of them produce
   one. The saved game on this machine has a valid number in it.

   That leaves the case that matters most anyway: once cash goes NaN it
   stays NaN, because every later sum touches it. NaN + 3692 is NaN. It
   saves, it reloads, and the farm is unrecoverable — you cannot buy
   anything again, ever, and nothing tells you why.

   So this does two things.

   IT REPAIRS. A watchdog on the frame checks that cash is a finite number.
   If it is not, it puts back the last good value it saw, says so in the
   log, and prints one stack to the console so the next occurrence names
   its own cause. A watchdog rather than a property guard because the save
   loader replaces S wholesale, which would throw away any accessor
   defined on the old object.

   AND IT STOPS BACK-CHARGING. A real bug found while looking: the
   compliance obligations from p148 test conditions the farm may already
   have met. A player returning to an established save was billed the
   setup cost for all of them at once the moment it loaded — measured at
   $2,800 in one hit for three. You cannot be fined today for the size you
   already were yesterday. Anything already true the first time the rule
   is applied to a save is grandfathered: recorded as held, no setup taken.
   Only a threshold you cross while playing costs you.
   ===================================================================== */

/* ---------- the watchdog ---------- */
const MONEY = { last: null, repairs: 0, told: false };
function moneyOK(v){ return typeof v === 'number' && isFinite(v); }

function moneyWatch(){
  if(typeof S !== 'object' || !S) return;
  if(moneyOK(S.cash)){ MONEY.last = S.cash; return; }
  /* something upstream produced a NaN or dropped the field entirely */
  const restored = moneyOK(MONEY.last) ? MONEY.last : 0;
  S.cash = restored;
  MONEY.repairs++;
  if(!MONEY.told){
    MONEY.told = true;
    try{
      console.warn('[greenhollow] cash went non-finite and was repaired to', restored,
        '\nStack at the moment it was noticed:\n', new Error().stack);
    }catch(e){}
    if(typeof log === 'function')
      log(`The books stopped adding up and have been put back to ${fmt(restored)}. `
        + `If it happens again the console will say where.`, 'bad', 'money');
  }
}
if(typeof tickPeople === 'function'){
  const _tickMoney = tickPeople;
  tickPeople = function(){
    const r = _tickMoney.apply(this, arguments);
    try{ moneyWatch(); }catch(e){}
    return r;
  };
}
/* and immediately, for a save that is already broken when it loads */
if(typeof ui === 'function'){
  const _uiMoney = ui;
  ui = function(){
    try{ moneyWatch(); }catch(e){}
    return _uiMoney.apply(this, arguments);
  };
}
setTimeout(()=>{ try{ moneyWatch(); }catch(e){} }, 400);

/* ---------- no back-charging ---------- */
if(typeof checkObligations === 'function'){
  const _checkBase = checkObligations;
  checkObligations = function(){
    try{
      const held = obState();
      /* First time this save is seen: whatever it already qualifies for is
         simply true of it, not something it just did. Record and move on. */
      if(!held.__grandfathered){
        held.__grandfathered = S.day || 1;
        let carried = 0;
        OBLIGATIONS.forEach(o=>{
          if(held[o.id]) return;
          let hit = false;
          try{ hit = !!o.met(); }catch(e){}
          if(hit){ held[o.id] = { since: S.day || 1, grandfathered: true }; carried++; }
        });
        if(carried && typeof log === 'function')
          log(`${carried} standing ${carried === 1 ? 'obligation' : 'obligations'} on a place this `
            + `size — already in force, so nothing to set up. ${fmt(obligationsMonthly())} a month.`,
            '', 'money');
        return;
      }
    }catch(e){}
    return _checkBase.apply(this, arguments);
  };
}

/* ---------- handle ---------- */
G.moneyGuardAudit = function(){
  const held = obState();
  return {
    cash: S.cash,
    cashIsFinite: moneyOK(S.cash),
    lastGoodSeen: MONEY.last,
    repairsMade: MONEY.repairs,
    grandfatheredOn: held.__grandfathered || 'not yet seen',
    obligations: OBLIGATIONS.map(o=>({
      what: o.n,
      held: !!held[o.id],
      grandfathered: !!(held[o.id] && held[o.id].grandfathered),
      monthly: o.month,
    })),
    monthlyCompliance: obligationsMonthly(),
  };
};
