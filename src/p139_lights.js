/* =====================================================================
   THE LIGHTS COME ON

   The festoon lights blueprint has carried `night:1` since it was written
   and nothing has ever read it. Grep the whole game for `.night` and you
   get three hits, all of them about what people say after dark. So the
   lights were a picture of lights: you bought them, they sat there, and at
   midnight they looked exactly as they did at noon.

   isNight() has existed the whole time in p11. This connects the two.

   Anything that is a light — the festoon string, the yard light, the
   lightning rod's little marker lamp — gets a glow after dusk that fades
   up and down with the hour rather than snapping on, plus a warm pool on
   the ground beneath it and a slow flicker per bulb so a string of them is
   not one flat blob. Off during the day, so it costs nothing when it is
   not doing anything.

   The charm they were already worth is unchanged. This is the part you
   were paying for that was missing.
   ===================================================================== */

/* what counts as a light: the flag, or a blueprint that plainly is one */
function isLightObj(o){
  const bp = BPMAP[o.bp];
  if(!bp) return false;
  if(bp.night) return true;
  return /light|lamp|lantern|festoon/i.test(bp.id + ' ' + (bp.name || ''));
}
function litObjs(){ return (S.objs || []).filter(isLightObj); }

/* how lit the night is: 0 by day, 1 in the small hours, eased at the edges */
function lampLevel(){
  if(typeof dayFrac !== 'function') return 0;
  const f = dayFrac();
  const dusk = 0.80, dawn = 0.26;
  if(f > dusk) return Math.min(1, (f - dusk) / 0.06);
  if(f < dawn) return Math.min(1, (dawn - f) / 0.06);
  return 0;
}

function paintLamps(){
  const lvl = lampLevel();
  const objs = lvl > 0.01 ? litObjs() : [];
  let g = document.getElementById('lamplay');
  if(!objs.length){ if(g) g.remove(); return; }
  if(!g){
    const fg = document.getElementById('fg');
    if(!fg) return;
    g = document.createElementNS('http://www.w3.org/2000/svg','g');
    g.id = 'lamplay';
    g.setAttribute('pointer-events','none');
    /* under the people and above the ground, so nobody is lit from in front */
    const people = document.getElementById('people');
    if(people) fg.insertBefore(g, people); else fg.appendChild(g);
  }
  const now = performance.now()/1000;
  let s = '';
  objs.forEach((o, oi)=>{
    const bp = BPMAP[o.bp];
    const f = footprint(bp, o.rot);
    const x0 = o.tx*T, y0 = o.ty*T, w = f.w*T, h = f.h*T;
    /* a warm pool on the ground under the whole fitting */
    s += `<ellipse cx="${n(x0 + w/2)}" cy="${n(y0 + h*0.92)}" rx="${n(w*0.85)}" ry="${n(h*0.55)}"
      fill="#ffd27a" opacity="${(0.20*lvl).toFixed(3)}"/>`;
    /* and a bulb every 20px or so along it, each on its own flicker */
    const bulbs = Math.max(1, Math.round(w/20));
    for(let i=0;i<bulbs;i++){
      const bx = x0 + w*((i+0.5)/bulbs);
      const by = y0 + h*(bulbs > 1 ? 0.34 : 0.42);
      const fl = 0.82 + 0.18*Math.sin(now*(1.6 + ((oi*3+i)%5)*0.34) + i*1.7);
      const a = lvl*fl;
      s += `<circle cx="${n(bx)}" cy="${n(by)}" r="${n(6.5)}" fill="#ffd27a" opacity="${(0.16*a).toFixed(3)}"/>`;
      s += `<circle cx="${n(bx)}" cy="${n(by)}" r="${n(3.1)}" fill="#ffe6ad" opacity="${(0.42*a).toFixed(3)}"/>`;
      s += `<circle cx="${n(bx)}" cy="${n(by)}" r="1.5" fill="#fff6dd" opacity="${(0.95*a).toFixed(3)}"/>`;
    }
  });
  g.innerHTML = s;
}

/* ride the frame the rest of the world rides */
if(typeof tickPeople === 'function'){
  const _tickLamps = tickPeople;
  tickPeople = function(){
    const r = _tickLamps.apply(this, arguments);
    try{ paintLamps(); }catch(e){}
    return r;
  };
}
/* and paint once on load so they are lit before the first tick */
try{ paintLamps(); }catch(e){}

/* ---------- handle ---------- */
G.lightsAudit = function(){
  return {
    hour: typeof dayFrac === 'function' ? +dayFrac().toFixed(3) : 'no clock',
    night: typeof isNight === 'function' ? isNight() : 'unknown',
    lampLevel: +lampLevel().toFixed(2),
    lightsOnLand: litObjs().map(o=>BPMAP[o.bp].name),
    painted: !!document.getElementById('lamplay'),
    bulbsDrawn: (document.getElementById('lamplay')||{children:[]}).children.length,
  };
};
