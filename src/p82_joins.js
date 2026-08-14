/* =====================================================================
   FENCES AND WALLS THAT JOIN UP

   Paths already merge: roadLayer() collects every path tile, looks at its
   four neighbours and draws one continuous surface with rounded outer
   corners. Nothing else does. A fence, a hedge or a dry stone wall is a
   4x1 object that draws inside its own footprint and stops, so a boundary
   built from six of them is six separate pieces sitting end to end - the
   rails do not meet, the posts do not line up, and a right angle is two
   runs that happen to touch.

   This adds the joins. For every pair of neighbouring tiles carrying the
   same material it bridges the seam, and wherever a run turns or meets
   another it puts a post or a stone on the corner. Nothing replaces the
   existing art - it is drawn over the seams only - so every fence in a
   played save keeps the look it has and simply stops being interrupted.

   Windbreaks are deliberately left out. A row of trees does not want a
   corner post, and joining them would make a hedge of something that is
   meant to read as planting.
   ===================================================================== */

/* material -> how a join is drawn. Keyed off blueprint id. */
const JOIN_KINDS = {
  fence:      'rail',
  hedge:      'hedge',
  stone_wall: 'stone',
};

/* every tile covered by a joinable object, grouped by material */
function joinTiles(){
  const map = {};                      /* kind -> Set('x,y') */
  (S.objs || []).forEach(o=>{
    const kind = JOIN_KINDS[o.bp];
    if(!kind) return;
    const bp = BPMAP[o.bp]; if(!bp) return;
    const f = footprint(bp, o.rot);
    const set = map[kind] || (map[kind] = new Set());
    for(let x=0; x<f.w; x++)
      for(let y=0; y<f.h; y++)
        set.add((o.tx+x) + ',' + (o.ty+y));
  });
  return map;
}

/* the bridging pieces, drawn in world coordinates */
function joinPiece(kind, px, py, dir){
  /* dir: 'h' bridges the vertical seam on the right, 'v' the one below */
  const mid = T/2;
  if(kind === 'rail'){
    const y = py + mid;
    if(dir === 'h')
      return `<line x1="${px+T-2}" y1="${n(y+1.2)}" x2="${px+T+2}" y2="${n(y+1.2)}" stroke="#000" stroke-opacity=".3" stroke-width="2"/>`
           + `<line x1="${px+T-2}" y1="${n(y-1.8)}" x2="${px+T+2}" y2="${n(y-1.8)}" stroke="#a8814f" stroke-width="1.3"/>`
           + `<line x1="${px+T-2}" y1="${n(y+1)}"   x2="${px+T+2}" y2="${n(y+1)}"   stroke="#8e6b3e" stroke-width="1.3"/>`;
    /* a vertical run: the rails turn to run down the tile */
    const x = px + mid;
    return `<line x1="${n(x+1.2)}" y1="${py+T-2}" x2="${n(x+1.2)}" y2="${py+T+2}" stroke="#000" stroke-opacity=".3" stroke-width="2"/>`
         + `<line x1="${n(x-1.8)}" y1="${py+T-2}" x2="${n(x-1.8)}" y2="${py+T+2}" stroke="#a8814f" stroke-width="1.3"/>`
         + `<line x1="${n(x+1)}"   y1="${py+T-2}" x2="${n(x+1)}"   y2="${py+T+2}" stroke="#8e6b3e" stroke-width="1.3"/>`;
  }
  if(kind === 'hedge'){
    const t = 15;                       /* the hedge helper's own thickness */
    if(dir === 'h')
      return `<rect x="${px+T-4}" y="${n(py+mid-t/2)}" width="8" height="${t}" rx="${n(t*0.42)}" fill="url(#gHedge)"/>`
           + `<circle cx="${px+T}" cy="${n(py+mid-t*0.1)}" r="${n(t*0.3)}" fill="#5f9a42" opacity=".55"/>`;
    return `<rect x="${n(px+mid-t/2)}" y="${py+T-4}" width="${t}" height="8" rx="${n(t*0.42)}" fill="url(#gHedge)"/>`
         + `<circle cx="${n(px+mid-t*0.1)}" cy="${py+T}" r="${n(t*0.3)}" fill="#5f9a42" opacity=".55"/>`;
  }
  /* stone */
  if(dir === 'h')
    return `<rect x="${px+T-3}" y="${n(py+mid-8)}" width="6" height="16" rx="1.4" fill="#9aa4ab"/>`;
  return `<rect x="${n(px+mid-8)}" y="${py+T-3}" width="16" height="6" rx="1.4" fill="#8794a0"/>`;
}

/* a post or capping stone where a run turns or meets another */
function joinCorner(kind, px, py){
  const cx = px + T/2, cy = py + T/2;
  if(kind === 'rail')
    return `<rect x="${n(cx-1.4)}" y="${n(cy-5.5)}" width="2.8" height="11" rx="1.2" fill="#7d5931"/>`
         + `<rect x="${n(cx-1.4)}" y="${n(cy-5.5)}" width="1.2" height="11" fill="#a8814f"/>`;
  if(kind === 'hedge')
    return `<circle cx="${n(cx)}" cy="${n(cy)}" r="8.6" fill="url(#gHedge)"/>`
         + `<circle cx="${n(cx-1.4)}" cy="${n(cy-1.6)}" r="4" fill="#7cb257" opacity=".45"/>`;
  return `<rect x="${n(cx-5)}" y="${n(cy-6)}" width="10" height="12" rx="1.8" fill="#a7b0b6"/>`
       + `<rect x="${n(cx-5)}" y="${n(cy-6)}" width="10" height="3.2" rx="1.4" fill="#b8c0c5"/>`;
}

function joinLayer(){
  const map = joinTiles();
  let s = '';
  Object.keys(map).forEach(kind=>{
    const set = map[kind];
    const has = (x,y)=> set.has(x + ',' + y);
    set.forEach(k=>{
      const [x,y] = k.split(',').map(Number);
      const px = x*T, py = y*T;
      const R = has(x+1,y), D = has(x,y+1), L = has(x-1,y), U = has(x,y-1);
      if(R) s += joinPiece(kind, px, py, 'h');
      if(D) s += joinPiece(kind, px, py, 'v');
      /* a corner is a tile with neighbours on two different axes, and a
         junction is one with three or more - both want the post */
      const horiz = (L?1:0) + (R?1:0), vert = (U?1:0) + (D?1:0);
      if(horiz && vert) s += joinCorner(kind, px, py);
    });
  });
  return s ? `<g id="joins" pointer-events="none">${s}</g>` : '';
}

/* Drawn with the objects rather than under them, so a join sits on top of
   the two pieces it is joining instead of behind their end caps. */
if(typeof render === 'function'){
  const _renderJoin = render;
  render = function(){
    const r = _renderJoin.apply(this, arguments);
    try{
      const fg = document.getElementById('fg');
      const old = document.getElementById('joins');
      if(old) old.remove();
      if(fg){
        const html = joinLayer();
        if(html){
          const obs = fg.querySelector('#obs');
          const tmp = document.createElementNS('http://www.w3.org/2000/svg','g');
          tmp.innerHTML = html;
          const g = tmp.firstChild;
          /* immediately after the objects group, so people and animals
             still draw over the top of a fence they are standing behind */
          if(obs && obs.nextSibling) fg.insertBefore(g, obs.nextSibling);
          else fg.appendChild(g);
        }
      }
    }catch(e){}
    return r;
  };
}

/* ---------- handle ---------- */
G.joinAudit = function(){
  const map = joinTiles();
  const out = {};
  Object.keys(map).forEach(k=>{
    const set = map[k];
    const has = (x,y)=> set.has(x+','+y);
    let seams = 0, corners = 0;
    set.forEach(key=>{
      const [x,y] = key.split(',').map(Number);
      if(has(x+1,y)) seams++;
      if(has(x,y+1)) seams++;
      const horiz = (has(x-1,y)?1:0)+(has(x+1,y)?1:0);
      const vert  = (has(x,y-1)?1:0)+(has(x,y+1)?1:0);
      if(horiz && vert) corners++;
    });
    out[k] = { tiles:set.size, seams, corners };
  });
  return { materials:out, layerBytes: joinLayer().length,
           inDom: !!document.getElementById('joins') };
};
