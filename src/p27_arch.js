/* =====================================================================
   ARCHITECTURE ON UPGRADE

   Only seven of the fifty-two upgradeable objects changed shape when you
   paid to improve them; the rest just got better numbers. This file gives
   every one of them a real progression.

   The idea running through it: upgrading does not sprawl, it consolidates.
   Mk I is a rough single volume. Mk II bolts on the lean-to you would
   actually build first. Mk III pulls it into one compact footprint with a
   clerestory and a paved apron. Mk IV is the architectural version —
   standing seam, glazing, solar, planting.

   Living things follow the same arc differently: they grow, thicken and
   gain the infrastructure a serious grower would add.
   ===================================================================== */


/* ---------- level of detail ----------
   The tier layers are cumulative: a Mk IV shed carries its Mk II lean-to
   and Mk III clerestory as well as its own green roof and verandah. That
   is right visually, but on a farm of two hundred maxed objects it is a
   lot of DOM to re-serialise every render. So the fine decoration —
   planting tufts, apron joints, netting wires — drops out once the farm
   is big. Structure always stays: the building never loses its shape,
   only its garnish. */
/* Per-object upgrade art, filled in by a later part. Grouping objects into
   families gets the buildings right but produces nonsense at the edges - a
   hedge does not want a concrete apron, a fire circle does not want a green
   roof. Anything named here takes precedence over its family. */
var ARCH_SPECIAL = {};

let ARCH_LOD = 2;
function archLod(){
  const nObj = (typeof S !== 'undefined' && S && S.objs) ? S.objs.length : 0;
  return nObj > 95 ? 0 : nObj > 55 ? 1 : 2;
}

/* ---------- structural primitives ---------- */

/* a lean-to bolted onto one side, lower than the main roof */
function annex(w, h, o){
  o = o||{};
  const roof = o.roof || '#8a969c';
  let s = `<rect x="${n(w*0.06)}" y="${n(h*0.10)}" width="${n(w)}" height="${n(h)}" rx="2"
    fill="#16240c" opacity=".20"/>`;
  s += `<rect x="0" y="0" width="${n(w)}" height="${n(h)}" rx="1.6" fill="#2a3238" opacity=".8"/>`;
  s += `<rect x="0.8" y="0.8" width="${n(w-1.6)}" height="${n(h-1.6)}" rx="1.2" fill="${roof}"/>`;
  /* single-pitch: light at the high edge, shade at the low */
  s += `<rect x="0.8" y="0.8" width="${n(w-1.6)}" height="${n((h-1.6)*0.42)}" fill="#fff" opacity=".17"/>`;
  s += `<rect x="0.8" y="${n(h*0.6)}" width="${n(w-1.6)}" height="${n(h*0.4-0.8)}" fill="#000" opacity=".20"/>`;
  for(let i=2.4; ARCH_LOD>0 && i<w-1; i+=3.4)
    s += `<line x1="${n(i)}" y1="1" x2="${n(i)}" y2="${n(h-1)}" stroke="#fff" stroke-opacity=".09" stroke-width="0.5"/>`;
  s += `<rect x="0.8" y="${n(h-1.8)}" width="${n(w-1.6)}" height="1.4" fill="#000" opacity=".3"/>`;
  return s;
}

/* clerestory monitor along the ridge — the giveaway of a serious shed */
function monitor(w, h){
  const mw = w*0.52, mx = (w-mw)/2, my = h*0.30, mh = Math.max(3.2, h*0.20);
  let s = `<rect x="${n(mx+1)}" y="${n(my+1.4)}" width="${n(mw)}" height="${n(mh)}" rx="1"
    fill="#000" opacity=".22"/>`;
  s += `<rect x="${n(mx)}" y="${n(my)}" width="${n(mw)}" height="${n(mh)}" rx="1" fill="#6d7981"/>`;
  s += `<rect x="${n(mx+0.7)}" y="${n(my+0.7)}" width="${n(mw-1.4)}" height="${n(mh-1.4)}" rx="0.7"
    fill="url(#gGlass)" opacity=".92"/>`;
  const bays = Math.max(2, Math.round(mw/7));
  for(let i=1;i<bays;i++)
    s += `<line x1="${n(mx+mw*i/bays)}" y1="${n(my+0.7)}" x2="${n(mx+mw*i/bays)}" y2="${n(my+mh-0.7)}"
      stroke="#59646b" stroke-width="0.6"/>`;
  s += `<rect x="${n(mx)}" y="${n(my)}" width="${n(mw)}" height="1" fill="#eef4f7" opacity=".85"/>`;
  return s;
}

/* poured apron: the concrete you stand a ute on */
function apron(x, y, w, h, r){
  if(ARCH_LOD === 0) return '';
  let s = `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" rx="${r||2}"
    fill="#9aa0a2" opacity=".55"/>`;
  s += `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" rx="${r||2}"
    fill="none" stroke="#7f8688" stroke-width="0.6" opacity=".7"/>`;
  /* control joints */
  const cols = ARCH_LOD===0 ? 1 : Math.max(1, Math.round(w/14));
  for(let i=1;i<cols;i++)
    s += `<line x1="${n(x+w*i/cols)}" y1="${n(y)}" x2="${n(x+w*i/cols)}" y2="${n(y+h)}"
      stroke="#7f8688" stroke-width="0.5" opacity=".55"/>`;
  s += `<line x1="${n(x)}" y1="${n(y+h*0.5)}" x2="${n(x+w)}" y2="${n(y+h*0.5)}"
    stroke="#7f8688" stroke-width="0.5" opacity=".45"/>`;
  return s;
}

/* verandah / covered walk: posts casting little shadows onto decking */
function verandah(x, y, w, h){
  let s = `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" rx="1.4" fill="#a98255"/>`;
  s += `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" rx="1.4" fill="#000" opacity=".12"/>`;
  const boards = ARCH_LOD===0 ? 0 : Math.max(3, Math.round(h/2.6));
  for(let i=1;i<boards;i++)
    s += `<line x1="${n(x)}" y1="${n(y+h*i/boards)}" x2="${n(x+w)}" y2="${n(y+h*i/boards)}"
      stroke="#7d5f3c" stroke-width="0.5" opacity=".7"/>`;
  for(let i=0;i<Math.max(2,Math.round(w/10));i++){
    const px = x + 2 + i*(w-4)/Math.max(1,Math.round(w/10)-1);
    s += `<circle cx="${n(px+0.8)}" cy="${n(y+h-1.4)}" r="1.5" fill="#000" opacity=".22"/>`;
    s += `<circle cx="${n(px)}" cy="${n(y+h-2)}" r="1.3" fill="#c9a577"/>`;
  }
  return s;
}

/* planting bed against a wall — softens the Mk IV builds */
function planter(x, y, w, h, seed){
  let s = `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" rx="1.2" fill="#6b5642"/>`;
  s += `<rect x="${n(x+0.6)}" y="${n(y+0.6)}" width="${n(w-1.2)}" height="${n(h-1.2)}" rx="1" fill="#3f5a2a"/>`;
  const cnt = ARCH_LOD===0 ? 0 : Math.max(2, Math.min(ARCH_LOD===1?6:14, Math.round(w/4)));
  for(let i=0;i<cnt;i++){
    const cx = x + 1.6 + (w-3.2)*(i+0.5)/cnt, r = 1.1 + hash(i*3.1+seed)*1.1;
    s += `<circle cx="${n(cx)}" cy="${n(y+h*0.5)}" r="${r.toFixed(1)}" fill="#6ea63f"/>`;
    s += `<circle cx="${n(cx-r*0.3)}" cy="${n(y+h*0.5-r*0.3)}" r="${(r*0.5).toFixed(1)}" fill="#8cc457" opacity=".8"/>`;
  }
  return s;
}

/* a green roof — the Mk IV signature */
function roofGarden(x, y, w, h, seed){
  let s = `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" rx="1.4" fill="#4a6b32"/>`;
  s += `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h*0.4)}" rx="1.4" fill="#fff" opacity=".10"/>`;
  const tufts = ARCH_LOD===0 ? 0 : Math.max(3, Math.min(ARCH_LOD===1?10:24, Math.round(w*h/26)));
  for(let i=0;i<tufts;i++){
    const cx = x+1 + hash(i*5.7+seed)*(w-2), cy = y+1 + hash(i*9.3+seed)*(h-2);
    s += `<circle cx="${n(cx)}" cy="${n(cy)}" r="${(0.8+hash(i*2.2)*1).toFixed(1)}"
      fill="${hash(i)>0.75?'#c7d96a':'#6ea63f'}" opacity=".9"/>`;
  }
  s += `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" rx="1.4"
    fill="none" stroke="#8c9a72" stroke-width="0.7"/>`;
  return s;
}

/* a rainwater tank tucked beside a building */
function miniTank(cx, cy, r){
  let s = `<ellipse cx="${n(cx+r*0.25)}" cy="${n(cy+r*0.3)}" rx="${n(r)}" ry="${n(r*0.9)}" fill="#16240c" opacity=".22"/>`;
  s += `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" fill="url(#gTank)"/>`;
  s += `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r*0.72)}" fill="none" stroke="#000" stroke-opacity=".18" stroke-width="0.7"/>`;
  s += `<circle cx="${n(cx-r*0.3)}" cy="${n(cy-r*0.35)}" r="${n(r*0.3)}" fill="#fff" opacity=".28"/>`;
  return s;
}

/* ---------- the families ---------- */
/* Each returns extra SVG to lay over the base art for a given tier.
   They receive the object's own width/height so they scale with footprint. */

const ARCH = {
  /* solid working buildings: sheds, workshops, processing rooms */
  shed(w, h, t, seed, o){
    let s = '';
    if(t >= 1){
      /* the lean-to you build first, plus a hardstand to work on */
      s += apron(w*0.02, h*0.70, w*0.62, h*0.26, 2);
      s += `<g transform="translate(${n(w*0.66)},${n(h*0.16)})">${annex(w*0.30, h*0.40, {roof:'#8a969c'})}</g>`;
      s += miniTank(w*0.90, h*0.72, Math.min(w,h)*0.09);
    }
    if(t >= 2){
      /* pulled into one compact footprint: clerestory over the main volume */
      s += `<g transform="translate(${n(w*0.04)},${n(h*0.02)})">${monitor(w*0.60, h*0.56)}</g>`;
      s += apron(w*0.02, h*0.70, w*0.94, h*0.26, 2);
      s += `<rect x="${n(w*0.06)}" y="${n(h*0.60)}" width="${n(w*0.88)}" height="1.6" rx="0.8"
        fill="#cfd6da" opacity=".8"/>`;
      s += planter(w*0.06, h*0.90, w*0.40, h*0.07, seed);
    }
    if(t >= 3){
      /* architectural: green roof over the annex, glazed end, full solar */
      s += `<g transform="translate(${n(w*0.66)},${n(h*0.14)})">${roofGarden(0, 0, w*0.30, h*0.30, seed)}</g>`;
      s += `<rect x="${n(w*0.08)}" y="${n(h*0.06)}" width="${n(w*0.52)}" height="${n(h*0.10)}" rx="1"
        fill="url(#gGlass)" stroke="#5f6b72" stroke-width="0.6" opacity=".95"/>`;
      s += verandah(w*0.06, h*0.62, w*0.56, h*0.09);
      s += planter(w*0.52, h*0.90, w*0.42, h*0.07, seed+3);
      s += `<circle cx="${n(w*0.90)}" cy="${n(h*0.10)}" r="2" fill="#7cc24f"/>`;
    }
    return s;
  },

  /* light open structures: kiosks, decks, tents, play */
  pavilion(w, h, t, seed){
    let s = '';
    if(t >= 1){
      s += verandah(w*0.08, h*0.72, w*0.84, h*0.13);
      s += `<circle cx="${n(w*0.12)}" cy="${n(h*0.16)}" r="${n(Math.min(w,h)*0.07)}" fill="#6ea63f"/>`;
    }
    if(t >= 2){
      /* a shade sail: taut fabric, not a slab. Kept translucent so the
         thing underneath still reads through it. */
      const sx = w*0.12, sy = h*0.10, sw = w*0.76, sh = h*0.42;
      if(ARCH_LOD > 0){
      s += `<path d="M${n(sx)} ${n(sy+sh*0.14)} Q${n(sx+sw*0.5)} ${n(sy-sh*0.10)} ${n(sx+sw)} ${n(sy+sh*0.14)}
        L${n(sx+sw)} ${n(sy+sh*0.86)} Q${n(sx+sw*0.5)} ${n(sy+sh*1.10)} ${n(sx)} ${n(sy+sh*0.86)} Z"
        fill="#e6dcc2" opacity=".34"/>`;
      s += `<path d="M${n(sx)} ${n(sy+sh*0.14)} Q${n(sx+sw*0.5)} ${n(sy-sh*0.10)} ${n(sx+sw)} ${n(sy+sh*0.14)}
        L${n(sx+sw)} ${n(sy+sh*0.50)} L${n(sx)} ${n(sy+sh*0.50)} Z"
        fill="#fff" opacity=".16"/>`;
      /* seams between fabric panels */
      for(let k=1;k<3;k++)
        s += `<line x1="${n(sx+sw*k/3)}" y1="${n(sy+sh*0.02)}" x2="${n(sx+sw*k/3)}" y2="${n(sy+sh*0.98)}"
          stroke="#c9bda0" stroke-width="0.6" opacity=".55"/>`;
      s += `<path d="M${n(sx)} ${n(sy+sh*0.14)} Q${n(sx+sw*0.5)} ${n(sy-sh*0.10)} ${n(sx+sw)} ${n(sy+sh*0.14)}"
        fill="none" stroke="#cfc3a6" stroke-width="0.8" opacity=".8"/>`;
      }
      [[0.12,0.12],[0.88,0.12],[0.12,0.52],[0.88,0.52]].forEach((p,i)=>{
        s += `<circle cx="${n(w*p[0]+0.8)}" cy="${n(h*p[1]+0.8)}" r="1.6" fill="#000" opacity=".22"/>`;
        s += `<circle cx="${n(w*p[0])}" cy="${n(h*p[1])}" r="1.4" fill="#c9a577"/>`;
      });
      s += planter(w*0.08, h*0.88, w*0.36, h*0.08, seed);
    }
    if(t >= 3){
      s += `<g transform="translate(${n(w*0.10)},${n(h*0.06)})">${roofGarden(0,0,w*0.80,h*0.20,seed)}</g>`;
      s += `<rect x="${n(w*0.14)}" y="${n(h*0.30)}" width="${n(w*0.72)}" height="${n(h*0.16)}" rx="2"
        fill="url(#gGlass)" opacity=".8" stroke="#5f6b72" stroke-width="0.6"/>`;
      s += planter(w*0.50, h*0.88, w*0.42, h*0.08, seed+5);
      s += `<circle class="pulse" cx="${n(w*0.90)}" cy="${n(h*0.88)}" r="2" fill="#f0c14b"/>`;
    }
    return s;
  },

  /* animal enclosures: better shelter, better fencing, better handling */
  paddock(w, h, t, seed){
    let s = '';
    if(t >= 1){
      /* a run-in shelter in the corner */
      s += `<g transform="translate(${n(w*0.04)},${n(h*0.04)})">${annex(w*0.28, h*0.26, {roof:'#9aa6ac'})}</g>`;
      s += `<rect x="${n(w*0.40)}" y="${n(h*0.86)}" width="${n(w*0.22)}" height="${n(h*0.07)}" rx="1.5" fill="#7d6a54"/>`;
    }
    if(t >= 2){
      /* stock fence with proper strainer posts, and a water trough */
      s += `<rect x="${n(w*0.03)}" y="${n(h*0.03)}" width="${n(w*0.94)}" height="${n(h*0.94)}" rx="3"
        fill="none" stroke="#8b7c66" stroke-width="1.1" stroke-dasharray="6 3" opacity=".9"/>`;
      [[0.03,0.03],[0.97,0.03],[0.03,0.97],[0.97,0.97]].forEach(p=>{
        s += `<circle cx="${n(w*p[0]+0.6)}" cy="${n(h*p[1]+0.6)}" r="1.7" fill="#000" opacity=".22"/>`;
        s += `<circle cx="${n(w*p[0])}" cy="${n(h*p[1])}" r="1.5" fill="#7d6a54"/>`;
      });
      s += `<rect x="${n(w*0.62)}" y="${n(h*0.86)}" width="${n(w*0.24)}" height="${n(h*0.07)}" rx="2" fill="#9fb0b8"/>`;
      s += `<rect x="${n(w*0.63)}" y="${n(h*0.87)}" width="${n(w*0.22)}" height="${n(h*0.04)}" rx="1.5" fill="url(#gWater)"/>`;
    }
    if(t >= 3){
      /* covered yard and a handling race */
      s += `<g transform="translate(${n(w*0.04)},${n(h*0.02)})">${roofGarden(0,0,w*0.28,h*0.16,seed)}</g>`;
      if(ARCH_LOD > 0)
        s += `<rect x="${n(w*0.36)}" y="${n(h*0.06)}" width="${n(w*0.58)}" height="${n(h*0.26)}" rx="2"
          fill="#c8d2d6" opacity=".45" stroke="#9aa8ad" stroke-width="0.7"/>`;
      for(let i=1;i<4;i++)
        s += `<line x1="${n(w*(0.36+0.58*i/4))}" y1="${n(h*0.06)}" x2="${n(w*(0.36+0.58*i/4))}" y2="${n(h*0.32)}"
          stroke="#9aa8ad" stroke-width="0.6" opacity=".8"/>`;
      s += apron(w*0.30, h*0.80, w*0.64, h*0.16, 2);
      s += `<circle cx="${n(w*0.10)}" cy="${n(h*0.90)}" r="2" fill="#7cc24f"/>`;
    }
    return s;
  },

  /* planting: it grows, gets trellised, then gets netted and irrigated */
  grove(w, h, t, seed){
    let s = '';
    if(t >= 1){
      /* mulch rings and a drip line */
      s += `<rect x="${n(w*0.06)}" y="${n(h*0.50)}" width="${n(w*0.88)}" height="1.2" rx="0.6"
        fill="#5b6f8a" opacity=".55"/>`;
      for(let i=0;i<4;i++)
        s += `<circle cx="${n(w*(0.16+i*0.23))}" cy="${n(h*0.50)}" r="1" fill="#8fd0e8" opacity=".8"/>`;
    }
    if(t >= 2){
      /* trellis posts and wires — the mark of a managed block */
      for(let i=0;i<4;i++){
        const px = w*(0.12+i*0.25);
        s += `<circle cx="${n(px+0.6)}" cy="${n(h*0.90+0.6)}" r="1.5" fill="#000" opacity=".2"/>`;
        s += `<circle cx="${n(px)}" cy="${n(h*0.90)}" r="1.3" fill="#8b7c66"/>`;
        s += `<line x1="${n(px)}" y1="${n(h*0.14)}" x2="${n(px)}" y2="${n(h*0.90)}"
          stroke="#8b7c66" stroke-width="0.8" opacity=".75"/>`;
      }
      s += `<rect x="${n(w*0.06)}" y="${n(h*0.20)}" width="${n(w*0.88)}" height="0.8" fill="#9aa8ad" opacity=".7"/>`;
      s += `<rect x="${n(w*0.06)}" y="${n(h*0.62)}" width="${n(w*0.88)}" height="0.8" fill="#9aa8ad" opacity=".7"/>`;
    }
    if(t >= 3){
      /* bird netting stretched over the whole block, plus a picking path */
      /* the netting sheet is a full-footprint alpha layer — the single
         most expensive thing here once farms get big */
      if(ARCH_LOD > 0)
        s += `<rect x="${n(w*0.04)}" y="${n(h*0.06)}" width="${n(w*0.92)}" height="${n(h*0.80)}" rx="3"
          fill="#dfe8ec" opacity=".16" stroke="#cbd6da" stroke-width="0.7"/>`;
      for(let i=1; ARCH_LOD>0 && i<6; i++)
        s += `<line x1="${n(w*(0.04+0.92*i/6))}" y1="${n(h*0.06)}" x2="${n(w*(0.04+0.92*i/6))}" y2="${n(h*0.86)}"
          stroke="#cbd6da" stroke-width="0.4" opacity=".5"/>`;
      s += `<rect x="${n(w*0.06)}" y="${n(h*0.88)}" width="${n(w*0.88)}" height="${n(h*0.08)}" rx="1.5"
        fill="#b7a184" opacity=".7"/>`;
    }
    return s;
  },

  /* water: edges get built, then planted, then usable */
  water(w, h, t, seed){
    let s = '';
    if(t >= 1){
      s += `<ellipse cx="${n(w*0.5)}" cy="${n(h*0.5)}" rx="${n(w*0.44)}" ry="${n(h*0.40)}"
        fill="none" stroke="#8b7c66" stroke-width="1.4" opacity=".7"/>`;
    }
    if(t >= 2){
      /* reed planting and a small jetty */
      for(let i=0;i<10;i++){
        const a = hash(i*4.1+seed)*Math.PI*2;
        const rx = w*0.44*Math.cos(a), ry = h*0.40*Math.sin(a);
        s += `<line x1="${n(w*0.5+rx)}" y1="${n(h*0.5+ry)}" x2="${n(w*0.5+rx*0.92)}" y2="${n(h*0.5+ry*0.92-2.4)}"
          stroke="#6ea63f" stroke-width="0.9" stroke-linecap="round" opacity=".9"/>`;
      }
      s += verandah(w*0.36, h*0.06, w*0.28, h*0.14);
    }
    if(t >= 3){
      s += `<rect x="${n(w*0.30)}" y="${n(h*0.02)}" width="${n(w*0.40)}" height="${n(h*0.06)}" rx="1.5"
        fill="#a98255"/>`;
      s += planter(w*0.06, h*0.86, w*0.34, h*0.08, seed);
      s += planter(w*0.60, h*0.86, w*0.34, h*0.08, seed+2);
      s += `<circle class="pulse" cx="${n(w*0.86)}" cy="${n(h*0.14)}" r="2" fill="#8fd0e8"/>`;
    }
    return s;
  },

  /* infrastructure: it gets bigger, doubled, then hardened and monitored */
  infra(w, h, t, seed){
    let s = '';
    if(t >= 1){
      s += apron(w*0.06, h*0.74, w*0.88, h*0.20, 2);
    }
    if(t >= 2){
      s += `<rect x="${n(w*0.08)}" y="${n(h*0.10)}" width="${n(w*0.84)}" height="${n(h*0.54)}" rx="2"
        fill="none" stroke="#9aa8ad" stroke-width="0.9" stroke-dasharray="4 2" opacity=".8"/>`;
      s += miniTank(w*0.88, h*0.24, Math.min(w,h)*0.10);
    }
    if(t >= 3){
      s += `<rect x="${n(w*0.10)}" y="${n(h*0.12)}" width="${n(w*0.34)}" height="${n(h*0.16)}" rx="1.2"
        fill="url(#gSolar)" stroke="#3a4a55" stroke-width="0.6"/>`;
      s += planter(w*0.06, h*0.92, w*0.40, h*0.06, seed);
      s += `<circle class="pulse" cx="${n(w*0.88)}" cy="${n(h*0.88)}" r="2" fill="#7cc24f"/>`;
    }
    return s;
  },
};

/* ---------- wiring: which object belongs to which family ---------- */
const ARCH_FAMILY = {
  /* working buildings */
  shed:'shed', workshop:'shed', cellar:'shed', packing:'shed', dairy:'shed',
  kitchen:'shed', honey_lab:'shed', gift_shop:'shed', nursery:'shed',
  worker_cottage:'shed', ai_hub:'shed',
  /* light structures */
  tea_kiosk:'pavilion', deck:'pavilion', glamping:'pavilion', dome:'pavilion',
  firepit:'pavilion', playground:'pavilion', bench:'pavilion', parking:'pavilion',
  /* animals */
  duck_pond:'paddock', goat_pen:'paddock', sheep:'paddock', apiary:'paddock',
  rabbit:'paddock', fodder:'paddock',
  /* planting */
  orchard:'grove', berry:'grove', flowers:'grove', herb_spiral:'grove',
  tree_native:'grove', tree_shade:'grove', tree_olive:'grove',
  /* water */
  pond:'water', well:'water',
  /* infrastructure and site works */
  wind:'infra', battery:'infra', sprinkler:'infra', compost:'infra',
  lights:'infra', sign:'infra', gate:'infra', ring:'infra', hedge:'infra', fence:'infra',
};

let ARCH_WRAPPED = 0;

/* wrap each art function so tier 0 is untouched and 1..3 gain structure */
(function applyArchitecture(){
  let wrapped = 0, missing = [];
  Object.keys(ARCH_FAMILY).forEach((name, idx)=>{
    const base = ART[name];
    if(typeof base !== 'function'){ missing.push(name); return; }
    const fam = ARCH[ARCH_FAMILY[name]];
    if(!fam) return;
    ART[name] = function(w, h, ob){
      const out = base(w, h, ob);
      const t = (typeof curTier === 'function') ? curTier(ob) : (ob && ob.tier) || 0;
      if(!t) return out;
      let extra = '';
      ARCH_LOD = archLod();
      const spec = ARCH_SPECIAL[name];
      try { extra = (spec ? spec(w, h, t, idx*7.7, ob) : fam(w, h, t, idx*7.7, ob)) || ''; }
      catch(e){ extra = ''; }
      return out + extra;
    };
    wrapped++;
  });
  if(missing.length) console.warn('[greenhollow] architecture: no art for', missing.join(', '));
  ARCH_WRAPPED = wrapped;
})();
