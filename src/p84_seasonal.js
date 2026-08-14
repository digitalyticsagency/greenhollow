/* =====================================================================
   THE FARM DRESSES FOR THE SEASON

   Nothing on the land changed with the calendar. The sky did, the weather
   did, growth rates did, but the buildings looked identical in midwinter
   and midsummer. For someone whose save is 157 decor items out of 201,
   that is the one place the year should show.

   Six weeks of the year the farm puts something up by itself: bunting for
   the show, lanterns for midwinter, blossom in spring. It costs nothing,
   it is placed on things you already own, and it takes itself down again.

   Two rules kept it from becoming clutter:

   - it hangs off buildings you already have, never on empty ground, so it
     decorates the farm you made rather than dropping objects on it
   - it is drawn in the object layer under everything that moves, so a
     person walking past a strung line still passes in front of it

   Tied to the same calendar as the events, so bunting goes up for show
   week and lanterns for midwinter, and the farm looks like it is taking
   part rather than like a setting changed.
   ===================================================================== */

/* which dressing is up, and when. Season indexes match SEASONS:
   0 summer, 1 autumn, 2 winter, 3 spring. `from`/`to` are fractions of
   the season, so they follow seasonLen if it is changed in settings. */
const DRESSINGS = [
  { id:'bunting',  season:0, from:0.42, to:0.62, n:'Show bunting' },
  { id:'harvest',  season:1, from:0.60, to:0.85, n:'Harvest wreaths' },
  { id:'lanterns', season:2, from:0.24, to:0.52, n:'Midwinter lanterns' },
  { id:'blossom',  season:3, from:0.05, to:0.40, n:'Spring blossom' },
];

function dressSeasonLen(){ return (typeof SET === 'function' ? SET('seasonLen') : 28) || 28; }
function dressDayFrac(){ return (((S.day - 1) % dressSeasonLen()) + 1) / dressSeasonLen(); }
function dressingNow(){
  const f = dressDayFrac();
  return DRESSINGS.find(d => d.season === S.season && f >= d.from && f <= d.to) || null;
}

/* the buildings worth dressing: anything with a roof or a real presence */
function dressTargets(){
  return (S.objs || []).filter(o=>{
    const bp = BPMAP[o.bp];
    if(!bp) return false;
    return ['home','housing','hub','tourism','shop','process','animal','feed'].includes(bp.kind)
        || ['cabin','shed','workshop','barn'].includes(bp.art);
  });
}

/* ---------- the art ---------- */
function dressArt(){
  const d = dressingNow();
  if(!d) return '';
  const targets = dressTargets();
  if(!targets.length) return '';
  let s = '';

  targets.forEach((o, i)=>{
    const bp = BPMAP[o.bp];
    const f = footprint(bp, o.rot);
    const px = o.tx*T, py = o.ty*T, w = f.w*T, h = f.h*T;

    if(d.id === 'bunting'){
      /* a line strung across the front, sagging in the middle */
      const y = py + h*0.16, sag = Math.min(14, w*0.09);
      s += `<path d="M${n(px+4)} ${n(y)} Q${n(px+w/2)} ${n(y+sag)} ${n(px+w-4)} ${n(y)}"
        fill="none" stroke="#6d5b44" stroke-width="1.4"/>`;
      const flags = Math.max(3, Math.round(w/26));
      for(let k=0;k<flags;k++){
        const t = (k+0.5)/flags;
        const fx = px+4 + (w-8)*t;
        const fy = y + Math.sin(Math.PI*t)*sag;
        const c = ['#d4726a','#e8a33d','#6bbf7a','#7fa8c4','#c47fa8'][(k+i)%5];
        s += `<path d="M${n(fx-3.4)} ${n(fy)} L${n(fx+3.4)} ${n(fy)} L${n(fx)} ${n(fy+7)} Z" fill="${c}"/>`;
      }
    }

    else if(d.id === 'harvest'){
      /* a wheat wreath on the gable, and a couple of pumpkins by the door */
      const cx = px + w*0.5, cy = py + h*0.22;
      s += `<circle cx="${n(cx)}" cy="${n(cy)}" r="9" fill="none" stroke="#c9a86a" stroke-width="3.4"/>`;
      s += `<circle cx="${n(cx)}" cy="${n(cy)}" r="9" fill="none" stroke="#e0c489" stroke-width="1.4"/>`;
      s += `<path d="M${n(cx-3)} ${n(cy+9)} q3 4 6 0" fill="none" stroke="#b0303f" stroke-width="2"/>`;
      s += `<ellipse cx="${n(px+w*0.18)}" cy="${n(py+h-6)}" rx="6" ry="5" fill="#e8862e"/>`;
      s += `<ellipse cx="${n(px+w*0.18)}" cy="${n(py+h-6)}" rx="2.2" ry="5" fill="#d4761e" opacity=".6"/>`;
      s += `<rect x="${n(px+w*0.18-1)}" y="${n(py+h-12)}" width="2" height="3.4" fill="#4f7a35"/>`;
    }

    else if(d.id === 'lanterns'){
      /* lanterns along the eave, warm and slightly uneven */
      const y = py + h*0.14;
      const cnt = Math.max(2, Math.round(w/34));
      for(let k=0;k<cnt;k++){
        const lx = px + (w/(cnt+1))*(k+1);
        s += `<line x1="${n(lx)}" y1="${n(y-6)}" x2="${n(lx)}" y2="${n(y)}" stroke="#6d5b44" stroke-width="1"/>`;
        s += `<rect class="lantern" x="${n(lx-3.6)}" y="${n(y)}" width="7.2" height="9" rx="2"
          fill="#f0c14b" opacity=".92" style="animation-delay:-${((k*0.7)%3).toFixed(1)}s"/>`;
        s += `<rect x="${n(lx-3.6)}" y="${n(y)}" width="7.2" height="3" rx="1.4" fill="#fff" opacity=".35"/>`;
      }
    }

    else if(d.id === 'blossom'){
      /* petals caught along the roofline, and a drift at the foot */
      for(let k=0;k<6;k++){
        const bxp = px + 6 + hash(i*7+k)*(w-12);
        const byp = py + h*0.1 + hash(i*3+k)*(h*0.2);
        s += `<circle cx="${n(bxp)}" cy="${n(byp)}" r="${(1.6+hash(k)*1.4).toFixed(1)}" fill="#f2c4d4" opacity=".85"/>`;
      }
      s += `<ellipse cx="${n(px+w*0.5)}" cy="${n(py+h-3)}" rx="${n(w*0.34)}" ry="3.4" fill="#f2c4d4" opacity=".45"/>`;
    }
  });

  return s ? `<g id="dressing" pointer-events="none">${s}</g>` : '';
}

/* drawn straight after the objects, so people and animals pass in front */
if(typeof render === 'function'){
  const _renderDress = render;
  render = function(){
    const r = _renderDress.apply(this, arguments);
    try{
      const old = document.getElementById('dressing');
      if(old) old.remove();
      const fg = document.getElementById('fg');
      const html = dressArt();
      if(fg && html){
        const tmp = document.createElementNS('http://www.w3.org/2000/svg','g');
        tmp.innerHTML = html;
        const obs = fg.querySelector('#obs');
        if(obs && obs.nextSibling) fg.insertBefore(tmp.firstChild, obs.nextSibling);
        else fg.appendChild(tmp.firstChild);
      }
    }catch(e){}
    return r;
  };
}

/* a line in the log the day it goes up and the day it comes down */
if(typeof advanceDay === 'function'){
  const _advDress = advanceDay;
  advanceDay = function(){
    const before = dressingNow();
    const r = _advDress.apply(this, arguments);
    try{
      const after = dressingNow();
      if(after && (!before || before.id !== after.id))
        log(`${after.n} went up around the farm.`, '', 'home');
      if(before && !after)
        log(`${before.n} came down.`, '', 'home');
    }catch(e){}
    return r;
  };
}

(function dressCss(){
  const s = document.createElement('style');
  s.textContent = `
  .lantern{ animation: lanternGlow 3s ease-in-out infinite; }
  @keyframes lanternGlow{ 0%,100%{ opacity:.78 } 50%{ opacity:1 } }
  @media(prefers-reduced-motion:reduce){ .lantern{ animation:none } }`;
  document.head.appendChild(s);
})();

/* ---------- handle ---------- */
G.seasonalAudit = function(){
  const sl = dressSeasonLen();
  return {
    today: `${SEASONS[S.season].n} day ${((S.day-1)%sl)+1}/${sl}`,
    upNow: dressingNow() ? dressingNow().n : 'nothing',
    targets: dressTargets().length,
    calendar: DRESSINGS.map(d=>
      `${SEASONS[d.season].n} days ${Math.round(d.from*sl)}-${Math.round(d.to*sl)}: ${d.n}`),
    artBytes: dressArt().length,
    inDom: !!document.getElementById('dressing'),
  };
};
