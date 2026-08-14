/* =====================================================================
   THE LAND HAS A FALL TO IT

   Land descriptions have always talked about ground the terrain never
   delivered - "sloped ground with a long view", "bermed into the slope",
   a swale "on the contour" - while the property itself was a perfectly
   flat green rectangle. Nothing told you which way was downhill, so
   nothing about the place read as a place.

   This gives every holding a fall, taken from its own biome, and draws
   it three ways:

     shading   the high side catches the light, the low side sits in it,
               a single soft gradient across the whole property
     contours  a few soft banks across the slope, each with a lit crown
               and a shaded lip, which is what actually makes an eye read
               height on a flat image
     the fall  a drainage line running down the steepest way, ending at
               the pond if there is one, because water goes where the
               ground sends it

   It is drawn in the terrain, under everything, and changes no footprint,
   no collision and no placement rule. The ground looks like it has a
   shape; it does not behave like it does. That is a deliberate limit -
   making objects sit into a slope means every art function needs a height
   offset, and this is the ninety percent of the effect for none of that.
   ===================================================================== */

/* how much fall, and which way, by the land you chose */
const RELIEF = {
  mount:   {k:1.00, a:-118}, plateau: {k:0.70, a:-96},
  hill:    {k:0.85, a:-104}, valley:  {k:0.62, a:-74},
  moor:    {k:0.55, a:-88},  forest:  {k:0.48, a:-112},
  river:   {k:0.66, a:-70},  lake:    {k:0.42, a:-66},
  pond:    {k:0.38, a:-72},  coast:   {k:0.50, a:-58},
  oasis:   {k:0.34, a:-84},  orchard: {k:0.44, a:-92},
};
function reliefOf(){
  const l = (typeof LANDMAP === 'object') ? LANDMAP[S.landId] : null;
  const b = l && l.biome;
  return RELIEF[b] || {k:0.5, a:-90};
}

function reliefArt(){
  const r = reliefOf();
  const px = FARM.x*T, py = FARM.y*T, pw = FARM.w*T, ph = FARM.h*T;
  const rad = r.a * Math.PI/180;
  /* unit vector pointing downhill */
  const dx = Math.cos(rad), dy = Math.sin(rad);
  let s = '';

  /* 1. the whole property lit from the high side. The gradient is defined
        per-render because its direction follows the fall line, and it is
        given its own id so it never collides with the shared defs. */
  const gid = 'gFall';
  s += `<defs><linearGradient id="${gid}" x1="${(0.5 - dx*0.5).toFixed(3)}" y1="${(0.5 - dy*0.5).toFixed(3)}"
        x2="${(0.5 + dx*0.5).toFixed(3)}" y2="${(0.5 + dy*0.5).toFixed(3)}">
      <stop offset="0"   stop-color="#ffffff" stop-opacity="${(0.10*r.k).toFixed(3)}"/>
      <stop offset="0.45" stop-color="#ffffff" stop-opacity="0"/>
      <stop offset="0.62" stop-color="#16240c" stop-opacity="0"/>
      <stop offset="1"   stop-color="#16240c" stop-opacity="${(0.13*r.k).toFixed(3)}"/>
    </linearGradient></defs>`;
  s += `<rect x="${px}" y="${py}" width="${pw}" height="${ph}" rx="6" fill="url(#${gid})"/>`;

  /* 2. banks across the slope. Perpendicular to the fall, wobbled with the
        same hash the rest of the terrain uses so they sit in the world
        rather than looking ruled on. */
  const bands = Math.max(2, Math.round(2 + r.k*3));
  const perp = {x:-dy, y:dx};
  for(let i=1;i<=bands;i++){
    const t = i/(bands+1);
    /* a point on the fall line at t, then a band through it across the slope */
    const cx0 = px + pw/2 + dx*(t-0.5)*pw*0.95;
    const cy0 = py + ph/2 + dy*(t-0.5)*ph*0.95;
    const len = Math.max(pw, ph);
    const pts = [];
    for(let k=-6;k<=6;k++){
      const f = k/6;
      const wob = (hash(i*7.7 + k*1.9) - 0.5) * 12 * r.k;
      pts.push([ n(cx0 + perp.x*f*len*0.62 + dx*wob), n(cy0 + perp.y*f*len*0.62 + dy*wob) ]);
    }
    let d = `M${pts[0][0]} ${pts[0][1]}`;
    for(let k=1;k<pts.length;k++){
      const a = pts[k-1], b = pts[k];
      d += ` Q${a[0]} ${a[1]} ${n((a[0]+b[0])/2)} ${n((a[1]+b[1])/2)}`;
    }
    /* the lit crown of the bank, then its shaded lip just downhill */
    s += `<path d="${d}" fill="none" stroke="#ffffff" stroke-opacity="${(0.09*r.k).toFixed(3)}"
      stroke-width="${n(5*r.k+2)}" stroke-linecap="round"/>`;
    s += `<g transform="translate(${n(dx*3.4)},${n(dy*3.4)})"><path d="${d}" fill="none"
      stroke="#16240c" stroke-opacity="${(0.11*r.k).toFixed(3)}"
      stroke-width="${n(4*r.k+1.6)}" stroke-linecap="round"/></g>`;
  }

  /* 3. the fall line itself: where water would run, ending at the pond
        if the farm has one */
  if(r.k > 0.4){
    const pond = (S.objs||[]).find(o=>['pond','dam'].includes(o.bp));
    const sx = px + pw/2 - dx*pw*0.46, sy = py + ph/2 - dy*ph*0.46;
    let ex = px + pw/2 + dx*pw*0.46, ey = py + ph/2 + dy*ph*0.46;
    if(pond){
      const f = footprint(BPMAP[pond.bp], pond.rot);
      ex = (pond.tx + f.w/2)*T; ey = (pond.ty + f.h/2)*T;
    }
    const mx = (sx+ex)/2 + perp.x*26, my = (sy+ey)/2 + perp.y*26;
    s += `<path d="M${n(sx)} ${n(sy)} Q${n(mx)} ${n(my)} ${n(ex)} ${n(ey)}"
      fill="none" stroke="#6f8f5a" stroke-opacity="${(0.34*r.k).toFixed(2)}"
      stroke-width="${n(7*r.k+2)}" stroke-linecap="round"/>`;
    s += `<path d="M${n(sx)} ${n(sy)} Q${n(mx)} ${n(my)} ${n(ex)} ${n(ey)}"
      fill="none" stroke="#8fb0d0" stroke-opacity="${(0.30*r.k).toFixed(2)}"
      stroke-width="${n(2.4*r.k+0.8)}" stroke-linecap="round"/>`;
  }

  return `<g id="relief" pointer-events="none">${s}</g>`;
}

/* into the cached terrain, so it costs nothing per frame */
if(typeof terrain === 'function'){
  const _terrainRelief = terrain;
  terrain = function(){
    const base = _terrainRelief.apply(this, arguments);
    let art = '';
    try{ art = reliefArt(); }catch(e){ return base; }
    /* immediately after the property's lawn, so it shades the farm and
       not the meadow beyond the hedge */
    const key = 'fill="url(#gLawn)"/>';
    const i = base.indexOf(key);
    if(i < 0) return base + art;
    const at = i + key.length;
    return base.slice(0, at) + art + base.slice(at);
  };
}

/* the backdrop is only re-emitted when its token changes, and none of
   these change it, so buying land or moving house needs a nudge */
function reliefRefresh(){
  terrainCache = '';
  try{ bgToken = ''; }catch(e){}
  if(typeof render === 'function') render();
}
setTimeout(reliefRefresh, 760);

/* ---------- handle ---------- */
G.reliefAudit = function(){
  const r = reliefOf();
  const l = (typeof LANDMAP === 'object') ? LANDMAP[S.landId] : null;
  return {
    land: l ? (l.n || S.landId) : S.landId,
    biome: l ? l.biome : 'unknown',
    steepness: r.k,
    fallDirection: `${r.a}deg`,
    bands: Math.max(2, Math.round(2 + r.k*3)),
    hasWatercourse: r.k > 0.4,
    drainsToPond: (S.objs||[]).some(o=>['pond','dam'].includes(o.bp)),
    artBytes: reliefArt().length,
    inTerrain: terrain().indexOf('id="relief"') >= 0,
    inDom: !!document.getElementById('relief'),
  };
};
