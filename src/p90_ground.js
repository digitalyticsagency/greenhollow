/* =====================================================================
   GROUND THAT REMEMBERS

   Weather changes numbers and puts a sheen or a frost over the whole
   scene, but the ground itself never records anything. It rains for three
   days and the yard looks exactly as it did; the family walk the same
   line to the beds a hundred times and the grass is untouched.

   Four marks that accumulate and fade on their own:

     mud      builds where animals are penned and where people cross,
              worst in wet weather, dries back in a few fine days
     puddles  fill in rain on ground that is already muddy, and go first
              when it clears
     paths    worn where the household actually walks, so a desire line
              appears wherever the route really is
     snow     settles on roofs in winter and thaws off them

   All of it lives on a small grid keyed by tile, not on the objects, so
   it survives things being moved or sold and costs nothing per object.
   The grid is capped and swept, so a farm played for years does not
   accumulate an unbounded map.
   ===================================================================== */

const GROUND_MAX = 900;          /* tiles tracked at once, oldest wettest kept */

function groundInit(){
  if(!S.ground) S.ground = {};    /* 'x,y' -> {m:mud 0..1, w:wear 0..1} */
  return S.ground;
}
function gKey(tx,ty){ return tx + ',' + ty; }
function gAt(tx,ty){ const g = groundInit(); return g[gKey(tx,ty)] || null; }
function gAdd(tx,ty,mud,wear){
  const g = groundInit(), k = gKey(tx,ty);
  const c = g[k] || (g[k] = {m:0, w:0});
  if(mud)  c.m = Math.min(1, c.m + mud);
  if(wear) c.w = Math.min(1, c.w + wear);
}

/* ---------- what marks it, once a day ---------- */
function groundDay(){
  const g = groundInit();
  const wet = ['rain','storm'].includes(S.weather);
  const dry = ['sun','heat'].includes(S.weather);

  /* animals churn the ground they stand on, more of them, more of it */
  (S.objs || []).forEach(o=>{
    const bp = BPMAP[o.bp];
    if(!bp || bp.kind !== 'animal' || !(o.animals > 0)) return;
    const f = footprint(bp, o.rot);
    const load = Math.min(1, o.animals / Math.max(1, bp.cap || 1));
    /* the gateway end of a pen takes the worst of it, as it does in life */
    for(let x=0; x<f.w; x++)
      for(let y=0; y<f.h; y++){
        const edge = (y === f.h-1) ? 1 : 0.35;
        gAdd(o.tx+x, o.ty+y, (wet ? 0.16 : 0.05) * load * edge, 0);
      }
  });

  /* people wear a line wherever they actually are */
  const walkers = (S.family || []).concat(S.workers || [], S.you ? [S.you] : []);
  walkers.forEach(p=>{
    if(p.x === undefined) return;
    gAdd(Math.floor(p.x / T), Math.floor(p.y / T), wet ? 0.05 : 0.02, 0.09);
  });

  /* and it recovers: mud dries, grass grows back over a quiet path */
  const keys = Object.keys(g);
  keys.forEach(k=>{
    const c = g[k];
    if(dry)      c.m = Math.max(0, c.m - 0.10);
    else if(!wet) c.m = Math.max(0, c.m - 0.05);
    c.w = Math.max(0, c.w - 0.012);
    if(c.m <= 0.02 && c.w <= 0.02) delete g[k];
  });

  /* a played-for-years farm should not carry an unbounded map */
  const left = Object.keys(g);
  if(left.length > GROUND_MAX){
    left.map(k=>[k, g[k].m + g[k].w])
        .sort((a,b)=>a[1] - b[1])
        .slice(0, left.length - GROUND_MAX)
        .forEach(([k])=>delete g[k]);
  }
}

if(typeof advanceDay === 'function'){
  const _advGround = advanceDay;
  advanceDay = function(){
    const r = _advGround.apply(this, arguments);
    try{ groundDay(); }catch(e){}
    return r;
  };
}

/* ---------- drawing it ---------- */
function groundArt(){
  const g = groundInit();
  const keys = Object.keys(g);
  const wet = ['rain','storm'].includes(S.weather);
  const winter = S.season === 2;
  let s = '';

  keys.forEach(k=>{
    const c = g[k];
    const [x,y] = k.split(',').map(Number);
    const px = x*T, py = y*T;
    /* worn grass first, so mud sits on top of it */
    if(c.w > 0.05)
      s += `<rect x="${px}" y="${py}" width="${T}" height="${T}"
        fill="#8a7f52" opacity="${(c.w*0.30).toFixed(3)}"/>`;
    if(c.m > 0.05){
      s += `<rect x="${px}" y="${py}" width="${T}" height="${T}" rx="3"
        fill="url(#gEarthDry)" opacity="${(c.m*0.62).toFixed(3)}"/>`;
      /* puddles only where it is genuinely churned and genuinely raining */
      if(wet && c.m > 0.55){
        const r0 = 5 + hash(x*3.1+y*7.7)*7;
        s += `<ellipse cx="${n(px + T*0.32 + hash(x+y)*T*0.35)}" cy="${n(py + T*0.55 + hash(x*2+y)*T*0.25)}"
          rx="${n(r0)}" ry="${n(r0*0.55)}" fill="#5f7d8c" opacity="${((c.m-0.55)*1.1).toFixed(3)}"/>`;
      }
    }
  });

  /* snow settles on roofs, which is the one place it reads from above */
  if(winter && ['snow','frost'].includes(S.weather)){
    (S.objs || []).forEach(o=>{
      const bp = BPMAP[o.bp];
      if(!bp || !['home','housing','hub','tourism','shop','process','animal','feed'].includes(bp.kind)) return;
      const f = footprint(bp, o.rot);
      s += `<rect x="${o.tx*T + 2}" y="${o.ty*T + 2}" width="${f.w*T - 4}" height="${n(f.h*T*0.42)}"
        rx="3" fill="#eef4f7" opacity=".72"/>`;
    });
  }
  return s ? `<g id="ground" pointer-events="none">${s}</g>` : '';
}

/* under the objects, over the terrain: it is on the ground, not on things */
if(typeof render === 'function'){
  const _renderGround = render;
  render = function(){
    const r = _renderGround.apply(this, arguments);
    try{
      const old = document.getElementById('ground');
      if(old) old.remove();
      const fg = document.getElementById('fg');
      const html = groundArt();
      if(fg && html){
        const tmp = document.createElementNS('http://www.w3.org/2000/svg','g');
        tmp.innerHTML = html;
        fg.insertBefore(tmp.firstChild, fg.firstChild);
      }
    }catch(e){}
    return r;
  };
}

/* ---------- handle ---------- */
G.groundAudit = function(){
  const g = groundInit();
  const keys = Object.keys(g);
  const muddy = keys.filter(k=>g[k].m > 0.3).length;
  const worn  = keys.filter(k=>g[k].w > 0.2).length;
  return {
    tilesMarked: keys.length,
    muddy, worn,
    cap: GROUND_MAX,
    weather: S.weather,
    puddlesShowing: ['rain','storm'].includes(S.weather)
      ? keys.filter(k=>g[k].m > 0.55).length : 0,
    snowOnRoofs: (S.season === 2 && ['snow','frost'].includes(S.weather)),
    worst: keys.map(k=>({k, m:+g[k].m.toFixed(2), w:+g[k].w.toFixed(2)}))
      .sort((a,b)=>(b.m+b.w)-(a.m+a.w)).slice(0,5),
    inDom: !!document.getElementById('ground'),
  };
};
