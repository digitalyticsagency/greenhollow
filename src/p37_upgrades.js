/* =====================================================================
   UPGRADES THAT SUIT WHAT THE THING ACTUALLY IS

   Grouping objects into families got the buildings right and everything
   else wrong. A glamping tent, a fire circle, a playground and a car
   park were all "pavilions", so all four sprouted a shade sail and a
   green roof. A hedge got a concrete apron. Trees got bird netting.

   These are the per-object versions. Each asks what a real owner would
   actually add to that thing, in the order they would add it.
   ===================================================================== */

/* ---------- shared bits used by several of these ---------- */

/* festoon lights strung between two points, bulbs hanging off a catenary */
function festoon(x1, y1, x2, y2, bulbs, seed){
  const sag = Math.max(4, Math.hypot(x2-x1, y2-y1)*0.14);
  const mx = (x1+x2)/2, my = (y1+y2)/2 + sag;
  let s = `<path d="M${n(x1)} ${n(y1)} Q${n(mx)} ${n(my)} ${n(x2)} ${n(y2)}"
    stroke="#5c5546" stroke-width="0.7" fill="none" opacity=".9"/>`;
  const N = bulbs || 6;
  for(let i=1;i<N;i++){
    const t = i/N, it = 1-t;
    /* point on the quadratic, then a short drop to the bulb */
    const bx = it*it*x1 + 2*it*t*mx + t*t*x2;
    const by = it*it*y1 + 2*it*t*my + t*t*y2;
    s += `<line x1="${n(bx)}" y1="${n(by)}" x2="${n(bx)}" y2="${n(by+1.6)}" stroke="#5c5546" stroke-width="0.5"/>`;
    s += `<circle class="fx-bulb" cx="${n(bx)}" cy="${n(by+2.4)}" r="1.35" fill="#ffe9a8"
      style="animation-delay:-${((hash(i*3.1+(seed||0))*2.4)).toFixed(2)}s"/>`;
  }
  return s;
}

/* a timber deck with boards running the long way */
function deckBoards(x, y, w, h, seed){
  let s = `<rect x="${n(x+1)}" y="${n(y+1.4)}" width="${n(w)}" height="${n(h)}" rx="2" fill="#16240c" opacity=".2"/>`;
  s += `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" rx="2" fill="#b9884f"/>`;
  const rows = Math.max(3, Math.round(h/4));
  for(let i=0;i<rows;i++){
    s += `<rect x="${n(x)}" y="${n(y + h*i/rows)}" width="${n(w)}" height="${n(h/rows)}"
      fill="${i%2 ? '#c0904f' : '#b07f47'}"/>`;
    s += `<line x1="${n(x)}" y1="${n(y + h*i/rows)}" x2="${n(x+w)}" y2="${n(y + h*i/rows)}"
      stroke="#8e6435" stroke-width="0.5" opacity=".7"/>`;
  }
  s += `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" rx="2"
    fill="none" stroke="#8e6435" stroke-width="0.7" opacity=".8"/>`;
  return s;
}

/* a hot tub: cedar surround, steaming water, a couple of jets */
function spaTub(cx, cy, r){
  let s = `<ellipse cx="${n(cx+r*0.2)}" cy="${n(cy+r*0.28)}" rx="${n(r*1.05)}" ry="${n(r*0.95)}" fill="#16240c" opacity=".24"/>`;
  s += `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" fill="#8a6440"/>`;
  s += `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r*0.88)}" fill="#a37b4f"/>`;
  /* cedar staves round the rim */
  for(let i=0;i<12;i++){
    const a = (i/12)*Math.PI*2;
    s += `<line x1="${n(cx+Math.cos(a)*r*0.88)}" y1="${n(cy+Math.sin(a)*r*0.88)}"
      x2="${n(cx+Math.cos(a)*r)}" y2="${n(cy+Math.sin(a)*r)}"
      stroke="#7a5836" stroke-width="0.6" opacity=".8"/>`;
  }
  s += `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r*0.74)}" fill="#3f8fb0"/>`;
  s += `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r*0.74)}" fill="url(#gWater)" opacity=".85"/>`;
  s += `<ellipse cx="${n(cx-r*0.24)}" cy="${n(cy-r*0.26)}" rx="${n(r*0.3)}" ry="${n(r*0.16)}" fill="#fff" opacity=".34"/>`;
  /* steam curling off it */
  for(let i=0;i<3;i++)
    s += `<circle class="fx-steam" cx="${n(cx - r*0.3 + i*r*0.3)}" cy="${n(cy - r*0.2)}"
      r="${(r*0.24 + i*0.5).toFixed(1)}" fill="#ffffff" opacity=".22"
      style="animation-delay:-${(i*1.3).toFixed(1)}s"/>`;
  return s;
}

/* ---------- the per-object upgrades ---------- */

ARCH_SPECIAL.glamping = function(w, h, t, seed){
  let s = '';
  /* Mk II - you build the deck first, and a fire bowl to sit around */
  if(t >= 1){
    s += deckBoards(w*0.06, h*0.68, w*0.88, h*0.26, seed);
    s += `<circle cx="${n(w*0.18)}" cy="${n(h*0.81)}" r="${n(Math.min(w,h)*0.055)}" fill="#4a4238"/>`;
    s += `<circle class="fx-ember" cx="${n(w*0.18)}" cy="${n(h*0.81)}" r="${n(Math.min(w,h)*0.03)}" fill="#f0a24b"/>`;
    /* two chairs facing it */
    [[0.30,0.78],[0.30,0.87]].forEach(p=>{
      s += `<ellipse cx="${n(w*p[0])}" cy="${n(h*p[1])}" rx="${n(w*0.035)}" ry="${n(h*0.026)}" fill="#5f6b57"/>`;
    });
  }
  /* Mk III - the spa, and festoon lights over the deck */
  if(t >= 2){
    s += spaTub(w*0.76, h*0.80, Math.min(w,h)*0.115);
    s += festoon(w*0.06, h*0.66, w*0.94, h*0.66, 7, seed);
    /* a privacy screen of slats along the back */
    for(let i=0;i<8;i++)
      s += `<rect x="${n(w*(0.08+i*0.106))}" y="${n(h*0.60)}" width="${n(w*0.018)}" height="${n(h*0.07)}"
        rx="0.6" fill="#9c7448"/>`;
  }
  /* Mk IV - a second string of lights, planters and a path in */
  if(t >= 3){
    s += festoon(w*0.10, h*0.10, w*0.90, h*0.16, 6, seed+4);
    s += planter(w*0.06, h*0.955, w*0.34, h*0.04, seed);
    s += planter(w*0.60, h*0.955, w*0.34, h*0.04, seed+2);
    s += `<rect x="${n(w*0.44)}" y="${n(h*0.94)}" width="${n(w*0.12)}" height="${n(h*0.06)}" rx="1.4"
      fill="#c9b48c" opacity=".8"/>`;
  }
  return s;
};

ARCH_SPECIAL.firepit = function(w, h, t, seed){
  let s = '';
  const cx = w*0.5, cy = h*0.5, R = Math.min(w,h);
  if(t >= 1){
    /* a proper stone ring and log seats around it */
    for(let i=0;i<10;i++){
      const a = (i/10)*Math.PI*2;
      s += `<ellipse cx="${n(cx+Math.cos(a)*R*0.26)}" cy="${n(cy+Math.sin(a)*R*0.22)}"
        rx="${n(R*0.045)}" ry="${n(R*0.035)}" fill="url(#gStone)"/>`;
    }
    [[0,-0.38],[0.34,0.20],[-0.34,0.20]].forEach(p=>{
      s += `<rect x="${n(cx+R*p[0]-R*0.10)}" y="${n(cy+R*p[1]-R*0.035)}" width="${n(R*0.20)}" height="${n(R*0.07)}"
        rx="${n(R*0.035)}" fill="#8a6a45"/>`;
      s += `<rect x="${n(cx+R*p[0]-R*0.10)}" y="${n(cy+R*p[1]-R*0.035)}" width="${n(R*0.20)}" height="${n(R*0.03)}"
        rx="${n(R*0.015)}" fill="#a5825a"/>`;
    });
  }
  if(t >= 2){
    /* a woodpile and lights strung overhead */
    s += `<rect x="${n(w*0.04)}" y="${n(h*0.06)}" width="${n(w*0.20)}" height="${n(h*0.14)}" rx="1.4" fill="#7a5836"/>`;
    for(let i=0;i<6;i++)
      s += `<circle cx="${n(w*(0.06+ (i%3)*0.06))}" cy="${n(h*(0.09 + Math.floor(i/3)*0.07))}" r="${n(h*0.026)}" fill="#c19a68"/>`;
    s += festoon(w*0.08, h*0.14, w*0.92, h*0.14, 7, seed);
  }
  if(t >= 3){
    /* paved circle so it is usable in the wet, and a second light run */
    s += `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(R*0.44)}" fill="none"
      stroke="#b9ab95" stroke-width="1.4" opacity=".55" stroke-dasharray="4 3"/>`;
    s += festoon(w*0.08, h*0.88, w*0.92, h*0.88, 7, seed+3);
    s += `<circle class="fx-bulb" cx="${n(cx)}" cy="${n(cy)}" r="${n(R*0.075)}" fill="#ffb347"/>`;
  }
  return s;
};

ARCH_SPECIAL.playground = function(w, h, t, seed){
  let s = '';
  if(t >= 1){
    /* soft-fall bark and a swing set */
    s += `<rect x="${n(w*0.06)}" y="${n(h*0.62)}" width="${n(w*0.88)}" height="${n(h*0.30)}" rx="3"
      fill="#a8804f" opacity=".55"/>`;
    s += `<rect x="${n(w*0.12)}" y="${n(h*0.16)}" width="${n(w*0.30)}" height="${n(h*0.03)}" rx="1.2" fill="#8b96a0"/>`;
    [0.18,0.28,0.36].forEach(fx=>{
      s += `<line x1="${n(w*fx)}" y1="${n(h*0.19)}" x2="${n(w*fx)}" y2="${n(h*0.34)}" stroke="#8b96a0" stroke-width="0.7"/>`;
      s += `<rect x="${n(w*fx-w*0.022)}" y="${n(h*0.34)}" width="${n(w*0.044)}" height="${n(h*0.02)}" rx="0.8" fill="#d1462f"/>`;
    });
  }
  if(t >= 2){
    /* slide and sandpit */
    s += `<path d="M${n(w*0.62)} ${n(h*0.18)} L${n(w*0.86)} ${n(h*0.42)} L${n(w*0.78)} ${n(h*0.46)} L${n(w*0.56)} ${n(h*0.22)} Z"
      fill="#e0c07a"/>`;
    s += `<rect x="${n(w*0.56)}" y="${n(h*0.12)}" width="${n(w*0.10)}" height="${n(h*0.10)}" rx="1.4" fill="#5f9a3c"/>`;
    s += `<ellipse cx="${n(w*0.28)}" cy="${n(h*0.78)}" rx="${n(w*0.14)}" ry="${n(h*0.10)}" fill="#e8d9a8"/>`;
    s += `<ellipse cx="${n(w*0.28)}" cy="${n(h*0.78)}" rx="${n(w*0.14)}" ry="${n(h*0.10)}"
      fill="none" stroke="#b49a63" stroke-width="0.8"/>`;
    /* a bucket and spade in the sand */
    s += `<rect x="${n(w*0.30)}" y="${n(h*0.75)}" width="${n(w*0.03)}" height="${n(h*0.04)}" rx="0.6" fill="#d1462f"/>`;
  }
  if(t >= 3){
    /* climbing frame, a bench for the adults, and lights for evenings */
    s += `<rect x="${n(w*0.62)}" y="${n(h*0.60)}" width="${n(w*0.28)}" height="${n(h*0.26)}" rx="2"
      fill="none" stroke="#8b96a0" stroke-width="1.1"/>`;
    for(let i=1;i<3;i++)
      s += `<line x1="${n(w*(0.62+0.28*i/3))}" y1="${n(h*0.60)}" x2="${n(w*(0.62+0.28*i/3))}" y2="${n(h*0.86)}"
        stroke="#8b96a0" stroke-width="0.8"/>`;
    for(let i=1;i<3;i++)
      s += `<line x1="${n(w*0.62)}" y1="${n(h*(0.60+0.26*i/3))}" x2="${n(w*0.90)}" y2="${n(h*(0.60+0.26*i/3))}"
        stroke="#8b96a0" stroke-width="0.8"/>`;
    s += `<rect x="${n(w*0.08)}" y="${n(h*0.92)}" width="${n(w*0.24)}" height="${n(h*0.05)}" rx="1.4" fill="#a98255"/>`;
    s += festoon(w*0.06, h*0.08, w*0.94, h*0.08, 7, seed);
  }
  return s;
};

ARCH_SPECIAL.deck = function(w, h, t, seed){
  let s = '';
  if(t >= 1){
    /* a rail around the edge, and mats laid out */
    s += `<rect x="${n(w*0.04)}" y="${n(h*0.04)}" width="${n(w*0.92)}" height="${n(h*0.84)}" rx="2"
      fill="none" stroke="#a98255" stroke-width="1.4"/>`;
    [[0.18,0.30],[0.46,0.30],[0.74,0.30]].forEach(p=>{
      s += `<rect x="${n(w*p[0]-w*0.07)}" y="${n(h*p[1])}" width="${n(w*0.14)}" height="${n(h*0.26)}" rx="1.6"
        fill="#7f9d8c" opacity=".85"/>`;
    });
  }
  if(t >= 2){
    /* shade sail overhead and pots at the corners */
    const sx=w*0.14, sy=h*0.06, sw=w*0.72, sh=h*0.34;
    s += `<path d="M${n(sx)} ${n(sy+sh*0.2)} Q${n(sx+sw*0.5)} ${n(sy-sh*0.12)} ${n(sx+sw)} ${n(sy+sh*0.2)}
      L${n(sx+sw)} ${n(sy+sh*0.8)} Q${n(sx+sw*0.5)} ${n(sy+sh*1.12)} ${n(sx)} ${n(sy+sh*0.8)} Z"
      fill="#e6dcc2" opacity=".28"/>`;
    s += `<circle cx="${n(w*0.10)}" cy="${n(h*0.90)}" r="${n(h*0.05)}" fill="#7a5a3c"/>`;
    s += `<circle cx="${n(w*0.10)}" cy="${n(h*0.87)}" r="${n(h*0.055)}" fill="#5f9a3c"/>`;
    s += `<circle cx="${n(w*0.90)}" cy="${n(h*0.90)}" r="${n(h*0.05)}" fill="#7a5a3c"/>`;
    s += `<circle cx="${n(w*0.90)}" cy="${n(h*0.87)}" r="${n(h*0.055)}" fill="#5f9a3c"/>`;
  }
  if(t >= 3){
    s += festoon(w*0.06, h*0.02, w*0.94, h*0.06, 7, seed);
    s += `<circle class="fx-steam" cx="${n(w*0.5)}" cy="${n(h*0.5)}" r="${n(Math.min(w,h)*0.22)}"
      fill="#ffe9a8" opacity=".10"/>`;
  }
  return s;
};

ARCH_SPECIAL.parking = function(w, h, t, seed){
  let s = '';
  if(t >= 1){
    /* painted bays */
    const bays = Math.max(3, Math.round(w/26));
    for(let i=1;i<bays;i++)
      s += `<line x1="${n(w*i/bays)}" y1="${n(h*0.12)}" x2="${n(w*i/bays)}" y2="${n(h*0.88)}"
        stroke="#eef2f4" stroke-width="1.2" opacity=".75"/>`;
  }
  if(t >= 2){
    /* an EV charger and a disabled bay */
    s += `<rect x="${n(w*0.02)}" y="${n(h*0.36)}" width="${n(w*0.05)}" height="${n(h*0.24)}" rx="1.4" fill="#3f6b52"/>`;
    s += `<circle class="fx-bulb" cx="${n(w*0.045)}" cy="${n(h*0.42)}" r="1.4" fill="#7cf0a0"/>`;
    s += `<rect x="${n(w*0.10)}" y="${n(h*0.18)}" width="${n(w*0.16)}" height="${n(h*0.64)}" rx="1.6"
      fill="#3f7fb0" opacity=".28"/>`;
  }
  if(t >= 3){
    /* shade canopy over the bays and a light column */
    s += `<rect x="${n(w*0.30)}" y="${n(h*0.10)}" width="${n(w*0.66)}" height="${n(h*0.36)}" rx="2"
      fill="#c8d2d6" opacity=".30"/>`;
    s += `<rect x="${n(w*0.30)}" y="${n(h*0.10)}" width="${n(w*0.66)}" height="${n(h*0.10)}" rx="2"
      fill="#fff" opacity=".14"/>`;
    s += `<rect x="${n(w*0.62)}" y="${n(h*0.50)}" width="${n(w*0.02)}" height="${n(h*0.34)}" fill="#8b96a0"/>`;
    s += `<circle class="fx-bulb" cx="${n(w*0.63)}" cy="${n(h*0.50)}" r="2" fill="#ffe9a8"/>`;
  }
  return s;
};

ARCH_SPECIAL.bench = function(w, h, t, seed){
  let s = '';
  if(t >= 1){
    /* a paved spot underfoot and a planter beside it */
    s += `<ellipse cx="${n(w*0.5)}" cy="${n(h*0.78)}" rx="${n(w*0.44)}" ry="${n(h*0.20)}" fill="#b9ab95" opacity=".4"/>`;
    s += `<circle cx="${n(w*0.86)}" cy="${n(h*0.72)}" r="${n(h*0.11)}" fill="#7a5a3c"/>`;
    s += `<circle cx="${n(w*0.86)}" cy="${n(h*0.66)}" r="${n(h*0.13)}" fill="#5f9a3c"/>`;
  }
  if(t >= 2){
    /* a pergola over it, with a climber going up one post */
    s += `<rect x="${n(w*0.10)}" y="${n(h*0.08)}" width="${n(w*0.80)}" height="${n(h*0.05)}" rx="1.2" fill="#a98255"/>`;
    for(let i=0;i<5;i++)
      s += `<rect x="${n(w*(0.14+i*0.17))}" y="${n(h*0.08)}" width="${n(w*0.03)}" height="${n(h*0.34)}" rx="0.8"
        fill="#b8935f" opacity=".9"/>`;
    s += `<circle cx="${n(w*0.14)}" cy="${n(h*0.26)}" r="${n(h*0.07)}" fill="#5f9a3c"/>`;
    s += `<circle cx="${n(w*0.17)}" cy="${n(h*0.15)}" r="${n(h*0.05)}" fill="#6ea63f"/>`;
  }
  if(t >= 3){
    s += festoon(w*0.12, h*0.10, w*0.88, h*0.10, 5, seed);
    s += planter(w*0.06, h*0.90, w*0.40, h*0.07, seed);
  }
  return s;
};

ARCH_SPECIAL.dome = function(w, h, t, seed){
  let s = '';
  const cx=w*0.5, cy=h*0.48, R=Math.min(w,h)*0.36;
  if(t >= 1){
    /* the panel lattice that makes a geodesic read as one */
    for(let i=0;i<6;i++){
      const a=(i/6)*Math.PI*2;
      s += `<line x1="${n(cx)}" y1="${n(cy)}" x2="${n(cx+Math.cos(a)*R)}" y2="${n(cy+Math.sin(a)*R)}"
        stroke="#cfd9de" stroke-width="0.8" opacity=".7"/>`;
    }
    s += `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(R*0.55)}" fill="none" stroke="#cfd9de" stroke-width="0.8" opacity=".7"/>`;
    s += deckBoards(w*0.06, h*0.80, w*0.88, h*0.16, seed);
  }
  if(t >= 2){
    s += festoon(w*0.06, h*0.78, w*0.94, h*0.78, 6, seed);
    s += spaTub(w*0.84, h*0.30, Math.min(w,h)*0.09);
  }
  if(t >= 3){
    s += `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(R*0.22)}" fill="url(#gGlass)" opacity=".9"
      stroke="#9db4bb" stroke-width="0.8"/>`;
    s += festoon(w*0.10, h*0.06, w*0.90, h*0.10, 6, seed+2);
  }
  return s;
};

ARCH_SPECIAL.tea_kiosk = function(w, h, t, seed){
  let s = '';
  if(t >= 1){
    /* a serving counter and a couple of tables out front */
    s += `<rect x="${n(w*0.14)}" y="${n(h*0.62)}" width="${n(w*0.72)}" height="${n(h*0.09)}" rx="1.6" fill="#a98255"/>`;
    s += `<rect x="${n(w*0.14)}" y="${n(h*0.62)}" width="${n(w*0.72)}" height="${n(h*0.03)}" rx="1.6" fill="#c49a63"/>`;
    [[0.30,0.84],[0.68,0.84]].forEach(p=>{
      s += `<circle cx="${n(w*p[0])}" cy="${n(h*p[1])}" r="${n(h*0.07)}" fill="#c9b48c"/>`;
      s += `<circle cx="${n(w*p[0])}" cy="${n(h*p[1])}" r="${n(h*0.045)}" fill="#e0d4b4"/>`;
    });
  }
  if(t >= 2){
    /* striped awning over the counter */
    s += `<rect x="${n(w*0.10)}" y="${n(h*0.46)}" width="${n(w*0.80)}" height="${n(h*0.16)}" rx="2" fill="#e8e2d2"/>`;
    for(let i=0;i<6;i++)
      s += `<rect x="${n(w*(0.10+i*0.133))}" y="${n(h*0.46)}" width="${n(w*0.066)}" height="${n(h*0.16)}"
        fill="#c65f4a" opacity=".75"/>`;
    s += `<rect x="${n(w*0.10)}" y="${n(h*0.60)}" width="${n(w*0.80)}" height="${n(h*0.02)}" fill="#000" opacity=".18"/>`;
  }
  if(t >= 3){
    s += festoon(w*0.08, h*0.40, w*0.92, h*0.40, 6, seed);
    s += planter(w*0.06, h*0.94, w*0.36, h*0.05, seed);
    s += planter(w*0.58, h*0.94, w*0.36, h*0.05, seed+2);
  }
  return s;
};

/* ---------- the decorative infrastructure ---------- */
/* A hedge does not get a concrete apron. These just get better at being
   what they already are. */
ARCH_SPECIAL.hedge = function(w, h, t, seed){
  let s = '';
  if(t >= 1) s += `<rect x="0" y="${n(h*0.18)}" width="${n(w)}" height="${n(h*0.64)}" rx="2" fill="#3f6b32" opacity=".35"/>`;
  if(t >= 2){
    /* clipped into shape, with topiary balls at intervals */
    for(let i=0;i<Math.max(2,Math.round(w/34));i++)
      s += `<circle cx="${n(w*(0.14+i*0.34))}" cy="${n(h*0.5)}" r="${n(Math.min(w,h)*0.30)}" fill="#4e8531"/>`;
  }
  if(t >= 3)
    for(let i=0;i<Math.max(3,Math.round(w/18));i++)
      s += `<circle cx="${n(w*(0.08+i*0.18))}" cy="${n(h*0.34)}" r="1.5" fill="#f0e6a8" opacity=".9"/>`;
  return s;
};

ARCH_SPECIAL.fence = function(w, h, t, seed){
  let s = '';
  if(t >= 1) s += `<rect x="0" y="${n(h*0.40)}" width="${n(w)}" height="${n(h*0.06)}" rx="1" fill="#a5825a"/>`;
  if(t >= 2){
    s += `<rect x="0" y="${n(h*0.60)}" width="${n(w)}" height="${n(h*0.05)}" rx="1" fill="#96754f"/>`;
    for(let i=0;i<Math.max(2,Math.round(w/22));i++)
      s += `<rect x="${n(w*(0.05+i*0.22))}" y="${n(h*0.28)}" width="${n(w*0.022)}" height="${n(h*0.52)}" rx="0.8" fill="#7d5f3c"/>`;
  }
  if(t >= 3)
    for(let i=0;i<Math.max(2,Math.round(w/22));i++)
      s += `<circle cx="${n(w*(0.05+i*0.22)+w*0.011)}" cy="${n(h*0.26)}" r="1.4" fill="#c9a577"/>`;
  return s;
};

ARCH_SPECIAL.gate = function(w, h, t, seed){
  let s = '';
  if(t >= 1) s += `<rect x="${n(w*0.06)}" y="${n(h*0.10)}" width="${n(w*0.88)}" height="${n(h*0.06)}" rx="1.4" fill="#a5825a"/>`;
  if(t >= 2){
    s += `<circle cx="${n(w*0.20)}" cy="${n(h*0.30)}" r="${n(h*0.10)}" fill="#5f9a3c"/>`;
    s += `<circle cx="${n(w*0.80)}" cy="${n(h*0.30)}" r="${n(h*0.10)}" fill="#5f9a3c"/>`;
  }
  if(t >= 3) s += festoon(w*0.08, h*0.14, w*0.92, h*0.14, 5, seed);
  return s;
};

ARCH_SPECIAL.sign = function(w, h, t, seed){
  let s = '';
  if(t >= 1) s += `<rect x="${n(w*0.14)}" y="${n(h*0.20)}" width="${n(w*0.72)}" height="${n(h*0.04)}" rx="1" fill="#e8dcc0"/>`;
  if(t >= 2){
    s += `<rect x="${n(w*0.10)}" y="${n(h*0.14)}" width="${n(w*0.80)}" height="${n(h*0.30)}" rx="2"
      fill="none" stroke="#c9a577" stroke-width="1.2"/>`;
    s += `<rect x="${n(w*0.18)}" y="${n(h*0.32)}" width="${n(w*0.44)}" height="${n(h*0.035)}" rx="1" fill="#e8dcc0" opacity=".8"/>`;
  }
  if(t >= 3){
    s += `<circle class="fx-bulb" cx="${n(w*0.12)}" cy="${n(h*0.12)}" r="1.6" fill="#ffe9a8"/>`;
    s += `<circle class="fx-bulb" cx="${n(w*0.88)}" cy="${n(h*0.12)}" r="1.6" fill="#ffe9a8"
      style="animation-delay:-1.1s"/>`;
  }
  return s;
};

/* ---------- trees grow, they do not get netted ---------- */
['tree_native','tree_shade','tree_olive'].forEach(k=>{
  ARCH_SPECIAL[k] = function(w, h, t, seed){
    let s = '';
    const cx = w*0.5, cy = h*0.5, R = Math.min(w,h)*0.5;
    /* Mk II - mulch ring and a stake, the way a young tree is actually kept */
    if(t >= 1){
      s += `<circle cx="${n(cx)}" cy="${n(cy+R*0.55)}" r="${n(R*0.42)}" fill="#6b5642" opacity=".45"/>`;
      s += `<rect x="${n(cx+R*0.30)}" y="${n(cy+R*0.10)}" width="${n(R*0.05)}" height="${n(R*0.55)}" rx="0.6" fill="#9c7a52"/>`;
    }
    /* Mk III - a ring seat at the base. Kept small and low: from above the
       canopy hides most of it, and a big hoop reads as a ring over the
       crown rather than a bench under it. */
    if(t >= 2){
      s += `<circle cx="${n(cx)}" cy="${n(cy+R*0.74)}" r="${n(R*0.22)}" fill="none"
        stroke="#a98255" stroke-width="${n(R*0.055)}" opacity=".92"/>`;
      s += `<circle cx="${n(cx)}" cy="${n(cy+R*0.74)}" r="${n(R*0.22)}" fill="none"
        stroke="#c49a63" stroke-width="${n(R*0.018)}" opacity=".9"/>`;
    }
    /* Mk IV - lights up through the canopy, and a swing on one bough */
    if(t >= 3){
      for(let i=0;i<7;i++){
        const a = (i/7)*Math.PI*2 + seed;
        s += `<circle class="fx-bulb" cx="${n(cx+Math.cos(a)*R*0.55)}" cy="${n(cy+Math.sin(a)*R*0.45)}"
          r="1.4" fill="#ffe9a8" style="animation-delay:-${(i*0.35).toFixed(2)}s"/>`;
      }
      /* a couple of fallen fruit or leaves at the base, rather than a swing:
         from directly above a swing is one ambiguous line */
      s += `<circle cx="${n(cx-R*0.42)}" cy="${n(cy+R*0.80)}" r="${n(R*0.045)}" fill="#c07a3c" opacity=".8"/>`;
      s += `<circle cx="${n(cx+R*0.36)}" cy="${n(cy+R*0.86)}" r="${n(R*0.04)}" fill="#c07a3c" opacity=".7"/>`;
    }
    return s;
  };
});

(function upgradeCss(){
  const s = document.createElement('style');
  s.textContent = `
  .fx-bulb{ animation: fxBulb 3.2s ease-in-out infinite; }
  @keyframes fxBulb{ 0%,100%{opacity:.55} 50%{opacity:1} }
  .fx-ember{ animation: fxEmber 2.4s ease-in-out infinite; }
  @keyframes fxEmber{ 0%,100%{opacity:.6} 50%{opacity:1} }
  .fx-steam{ animation: fxSteam 4.4s ease-out infinite; }
  @keyframes fxSteam{
    0%   { opacity:0;   transform:translateY(1px)  scale(.7); }
    30%  { opacity:.26; }
    100% { opacity:0;   transform:translateY(-6px) scale(1.3); } }
  #cutaway .fx-steam, .fx-steam, .fx-bulb, .fx-ember{ transform-box:fill-box; transform-origin:center; }
  @media (prefers-reduced-motion: reduce){
    .fx-bulb,.fx-ember,.fx-steam{ animation:none !important; } }
  `;
  document.head.appendChild(s);
})();
