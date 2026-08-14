/* =====================================================================
   WINDOWS THAT LIGHT UP AT NIGHT

   p33_indoors has claimed since it was written that when the roof is on,
   "the windows glow instead". They never did. The roof goes on, the
   people vanish, and the farm at 1am looks exactly like the farm at
   noon with a blue filter over it - which is why night has never felt
   like anywhere anyone lives.

   The glass itself is drawn in p2_art's building(), which every shed,
   workshop, cottage and gift shop on the farm goes through. The lit pane
   is emitted there too, at opacity 0, using the same wx/bh/skirt as the
   window it sits behind - so it cannot drift out of register no matter
   what size the building is or how it is scaled. All this part does is
   decide when to fade it up.

   It is a class on the scene and a CSS transition, which is the same
   trick p60 uses for the lamp posts, and for the same reason: dusk must
   not cost a re-render. Toggling one class on #fg fades every window on
   the farm together over a second and a half, and costs nothing per
   frame.

   Three states, because a farm at night is not uniformly lit:

     evening   the household is up; the house is warm and bright and the
               outbuildings show a working light
     late      everyone is asleep; the house drops to a nightlight and
               the sheds keep only a security glow
     no power  nothing. The lamps in p60 already go out when the farm
               cannot carry them, and it would be strange for the house
               to be blazing while the lamps are dark.

   Scoped to #fg deliberately. The build panel draws the same buildings
   as thumbnails in their own SVGs, and lit windows in a shop menu at
   midday would look like a bug.
   ===================================================================== */

function houseAsleep(){
  const who = (S.family || []).filter(p => p && p.act !== undefined);
  if(!who.length) return isNight();
  return who.every(p => /asleep|pyjamas|in bed/i.test(p.act || ''));
}

function lightsOn(){
  if(typeof isNight === 'function' && !isNight()) return false;
  /* the same supply rule the lamp posts use, so they agree */
  if(S && typeof S.powerBal === 'number' && S.powerBal < -4) return false;
  return true;
}

let LIGHT_STATE = '';
function tickLights(quiet){
  const fg = document.getElementById('fg');
  if(!fg) return;
  const on = lightsOn();
  const state = !on ? '' : (houseAsleep() ? 'late' : 'evening');
  if(state === LIGHT_STATE) return;
  const was = LIGHT_STATE;
  LIGHT_STATE = state;
  fg.classList.toggle('nightlit', !!state);
  fg.classList.toggle('abed', state === 'late');
  if(typeof log === 'function' && !quiet){
    if(!was && state === 'evening')      log('The lights came on in the house.', '', 'home');
    else if(state === 'late')            log('The last light went off upstairs.', '', 'home');
    else if(!state && was)               log('The house is dark again — the sun is up.', '', 'home');
  }
}

if(typeof tickPeople === 'function'){
  const _tickPeopleLights = tickPeople;
  tickPeople = function(dt){
    const r = _tickPeopleLights.apply(this, arguments);
    try{ tickLights(); }catch(e){}
    return r;
  };
}

/* A full render rebuilds #fg's contents but not #fg itself, so the class
   survives; this is only for the first paint after a reload. Quiet,
   because it re-derives a state the farm is already in - announcing it
   put "the last light went off upstairs" in the log twice on load. */
setTimeout(()=>{ try{ LIGHT_STATE = ''; tickLights(true); }catch(e){} }, 400);

(function lightCss(){
  const s = document.createElement('style');
  s.textContent = `
  #fg .winglow, #fg .winspill{ transition: opacity 1.6s ease; }

  /* outbuildings: someone left a light on in the shed */
  #fg.nightlit .winglow { opacity:.55; }
  #fg.nightlit .winspill{ opacity:.13; }

  /* the house, while anyone is still up */
  #fg.nightlit .winglow.home { opacity:.92; }
  #fg.nightlit .winspill.home{ opacity:.22; }

  /* everyone in bed */
  #fg.nightlit.abed .winglow      { opacity:.20; }
  #fg.nightlit.abed .winspill     { opacity:.05; }
  #fg.nightlit.abed .winglow.home { opacity:.34; }
  #fg.nightlit.abed .winspill.home{ opacity:.08; }
  `;
  document.head.appendChild(s);
})();

/* ---------- handle ---------- */
G.lightsAudit = function(){
  const fg = document.getElementById('fg');
  return {
    night: typeof isNight === 'function' ? isNight() : 'n/a',
    powerBal: S.powerBal,
    lightsOn: lightsOn(),
    everyoneAsleep: houseAsleep(),
    state: LIGHT_STATE || 'dark',
    litPanes: fg ? fg.querySelectorAll('.winglow').length : 0,
    housePanes: fg ? fg.querySelectorAll('.winglow.home').length : 0,
    classes: fg ? fg.getAttribute('class') : 'no #fg',
    family: (S.family||[]).map(p=>`${p.name}: ${p.act||'—'}`),
  };
};
