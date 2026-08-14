/* =====================================================================
   ART — shared material defs + drawn components
   Sun is fixed at upper-left: highlights on top/left edges, cast shadows
   down/right. Every component draws in local space (0,0 → w,h) so the
   engine can rotate it freely.
   ===================================================================== */
const ART = {};
const T = 40;                       // pixels per land tile

function n(v){ return Math.round(v*10)/10; }
function hash(i){ const x = Math.sin(i*127.1)*43758.5453; return x - Math.floor(x); }

/* ---------------- shared <defs> ---------------- */
function DEFS(){
  return `<defs>
  <!-- No filters. fGrain, fRough, fDrop, fSoft and fGlow lived here with
       zero uses between them, and two were feTurbulence and
       feGaussianBlur - the pair that historically took this scene from
       121fps to 15. Depth comes from stacked shapes and gradients; an
       unused blur in DEFS is just an invitation. -->

  <linearGradient id="gLawn" x1="0.1" y1="0" x2="0.65" y2="1">
    <stop offset="0" stop-color="#88b25c"/><stop offset="0.45" stop-color="#74a04b"/><stop offset="1" stop-color="#5d8a3c"/></linearGradient>
  <linearGradient id="gMeadow" x1="0" y1="0" x2="0.5" y2="1">
    <stop offset="0" stop-color="#c3b982"/><stop offset="0.5" stop-color="#b3a976"/><stop offset="1" stop-color="#a49b69"/></linearGradient>
  <linearGradient id="gSoil" x1="0.2" y1="0" x2="0.7" y2="1">
    <stop offset="0" stop-color="#7a5a3f"/><stop offset="0.5" stop-color="#63482f"/><stop offset="1" stop-color="#4c3624"/></linearGradient>
  <linearGradient id="gSoilWet" x1="0.2" y1="0" x2="0.7" y2="1">
    <stop offset="0" stop-color="#5b4028"/><stop offset="0.5" stop-color="#4a3320"/><stop offset="1" stop-color="#3a2818"/></linearGradient>
  <linearGradient id="gRoof" x1="0.05" y1="0" x2="0.55" y2="1">
    <stop offset="0" stop-color="#a3aeb4"/><stop offset="0.4" stop-color="#8a959b"/><stop offset="1" stop-color="#6a747a"/></linearGradient>
  <linearGradient id="gRoofRed" x1="0.05" y1="0" x2="0.55" y2="1">
    <stop offset="0" stop-color="#bd6455"/><stop offset="0.5" stop-color="#a1503f"/><stop offset="1" stop-color="#7e3b2e"/></linearGradient>
  <linearGradient id="gTimber" x1="0" y1="0" x2="0.4" y2="1">
    <stop offset="0" stop-color="#bb8b57"/><stop offset="0.55" stop-color="#a1743f"/><stop offset="1" stop-color="#7d5931"/></linearGradient>
  <linearGradient id="gSolar" x1="0.1" y1="0" x2="0.7" y2="1">
    <stop offset="0" stop-color="#38507f"/><stop offset="0.35" stop-color="#22304f"/><stop offset="1" stop-color="#161f36"/></linearGradient>
  <linearGradient id="gGravel" x1="0" y1="0" x2="0.4" y2="1">
    <stop offset="0" stop-color="#d3c7a8"/><stop offset="0.55" stop-color="#c5b898"/><stop offset="1" stop-color="#b6a988"/></linearGradient>
  <linearGradient id="gGlass" x1="0.05" y1="0" x2="0.6" y2="1">
    <stop offset="0" stop-color="#e6f6fa"/><stop offset="0.45" stop-color="#c2e0e9"/><stop offset="1" stop-color="#9dc2ce"/></linearGradient>
  <linearGradient id="gStone" x1="0" y1="0" x2="0.4" y2="1">
    <stop offset="0" stop-color="#ada59a"/><stop offset="0.5" stop-color="#999186"/><stop offset="1" stop-color="#857e73"/></linearGradient>
  <radialGradient id="gWater" cx="0.36" cy="0.3" r="0.78">
    <stop offset="0" stop-color="#8fd0e8"/><stop offset="0.4" stop-color="#4f93b5"/>
    <stop offset="0.85" stop-color="#2f6d90"/><stop offset="1" stop-color="#255d7c"/></radialGradient>
  <radialGradient id="gCanopy" cx="0.34" cy="0.28" r="0.8">
    <stop offset="0" stop-color="#79b356"/><stop offset="0.45" stop-color="#4f8c38"/>
    <stop offset="0.85" stop-color="#356523"/><stop offset="1" stop-color="#274c19"/></radialGradient>
  <radialGradient id="gCanopyD" cx="0.34" cy="0.28" r="0.8">
    <stop offset="0" stop-color="#5f9c48"/><stop offset="0.5" stop-color="#3c7530"/><stop offset="1" stop-color="#21451a"/></radialGradient>
  <radialGradient id="gCanopyO" cx="0.34" cy="0.28" r="0.8">
    <stop offset="0" stop-color="#9ab86a"/><stop offset="0.5" stop-color="#6f9448"/><stop offset="1" stop-color="#456029"/></radialGradient>
  <linearGradient id="gHedge" x1="0" y1="0" x2="0.3" y2="1">
    <stop offset="0" stop-color="#5b9440"/><stop offset="0.5" stop-color="#3f6f2c"/><stop offset="1" stop-color="#27491c"/></linearGradient>
  <linearGradient id="gTank" x1="0" y1="0" x2="0.7" y2="1">
    <stop offset="0" stop-color="#6d9a67"/><stop offset="0.5" stop-color="#5c8859"/><stop offset="1" stop-color="#365a36"/></linearGradient>
  <!-- added in the polish pass: these absorb the most-repeated flat
       fills. Same hue as what they replace, one extra value of depth. -->
  <linearGradient id="gPlaster" x1="0.05" y1="0" x2="0.55" y2="1">
    <stop offset="0" stop-color="#f2ead6"/><stop offset="0.5" stop-color="#e2d8c0"/><stop offset="1" stop-color="#cbbfa4"/></linearGradient>
  <linearGradient id="gMetal" x1="0" y1="0" x2="0.45" y2="1">
    <stop offset="0" stop-color="#c2ccd2"/><stop offset="0.45" stop-color="#9fb0b8"/><stop offset="1" stop-color="#76858d"/></linearGradient>
  <linearGradient id="gStraw" x1="0.1" y1="0" x2="0.6" y2="1">
    <stop offset="0" stop-color="#e6d49a"/><stop offset="0.5" stop-color="#d8c48b"/><stop offset="1" stop-color="#b99f63"/></linearGradient>
  <radialGradient id="gLeafLit" cx="0.32" cy="0.26" r="0.82">
    <stop offset="0" stop-color="#96c96a"/><stop offset="0.45" stop-color="#6ca346"/>
    <stop offset="0.85" stop-color="#47762c"/><stop offset="1" stop-color="#335620"/></radialGradient>
  <linearGradient id="gEarthDry" x1="0.15" y1="0" x2="0.65" y2="1">
    <stop offset="0" stop-color="#b09a71"/><stop offset="0.5" stop-color="#9c8760"/><stop offset="1" stop-color="#7f6c4c"/></linearGradient>
  <radialGradient id="gShadow" cx="0.5" cy="0.5" r="0.5">
    <stop offset="0" stop-color="#16240c" stop-opacity="0.55"/>
    <stop offset="0.6" stop-color="#16240c" stop-opacity="0.34"/>
    <stop offset="1" stop-color="#16240c" stop-opacity="0"/></radialGradient>

  <linearGradient id="gHaze" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#cfe0ea" stop-opacity="0.45"/>
    <stop offset="0.22" stop-color="#cfe0ea" stop-opacity="0.10"/>
    <stop offset="0.5" stop-color="#cfe0ea" stop-opacity="0"/>
    <stop offset="0.8" stop-color="#cfe0ea" stop-opacity="0.10"/>
    <stop offset="1" stop-color="#cfe0ea" stop-opacity="0.4"/></linearGradient>
  <linearGradient id="gSky" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#ffffff" stop-opacity="0.5"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></linearGradient>
  </defs>`;   /* the two trailing .replace() calls are gone: one swapped a string
        for itself, the other rewrote gWater's last stop behind the
        gradient's back, so editing the declaration did nothing. */
}

/* ---------------- primitives ---------------- */

/* ambient-occlusion contact shadow under an object */
/* A blur filter here costs an offscreen pass per object; at this zoom a
   plain translucent ellipse is indistinguishable and effectively free. */
function ao(x,y,w,h,o){
  const op = (o||0.34);
  /* Was two flat #16240c ellipses with hard edges. gShadow fades to zero
     alpha at its own rim, so the contact shadow ends softly without a
     blur filter - the effect the banned fSoft was there for, at no cost.
     One ellipse now does what two were approximating.

     Geometry is copied exactly from the old outer ellipse - cx+0.06w,
     0.94h, rx 0.55w, ry 0.22h. It already reached past the footprint to
     1.11w, and a first pass at this quietly widened it to 1.16w, which
     bleeds onto the next tile. The only thing that changes here is the
     fill. Opacity is x1.9 because the two old ellipses composited over
     each other to ~0.30 at op=0.28, and gShadow's centre stop is 0.55
     alpha - x1.15 would have made every shadow on the farm lighter. */
  return `<ellipse cx="${n(x+w/2+w*0.06)}" cy="${n(y+h*0.94)}" rx="${n(w*0.55)}" ry="${n(h*0.22)}"
    fill="url(#gShadow)" opacity="${Math.min(1, op*1.9).toFixed(2)}"/>`;
}

/* The one outline rule. Structures get a hairline darker edge on their
   outer silhouette; organics never do, because an outline on a canopy or
   an animal reads as cartoon rather than crisp. Gated on footprint - at
   40px a 1x1 item is mostly outline. */
function edge(w,h,r){
  if(w < 70 || h < 40) return '';
  return `<rect x="0.5" y="0.5" width="${n(w-1)}" height="${n(h-1)}" rx="${r===undefined?3:r}"
    fill="none" stroke="var(--a-edge)" stroke-width="0.5"/>`;
}

/* grain overlay clipped to a shape via a rect (cheap texture) */
/* feTurbulence is far too costly to run per object; texture now comes from
   the gradients and speckles already in each material. */
function grain(){ return ''; }
/* organic ground patch */
function patch(w,h,fill,seed,inset){
  inset = inset||1;
  const pts=[], N=16;
  for(let i=0;i<N;i++){
    const a=(i/N)*Math.PI*2, wob=0.88+hash(seed*5+i)*0.14;
    pts.push([n(w/2+Math.cos(a)*(w/2-inset)*wob), n(h/2+Math.sin(a)*(h/2-inset)*wob)]);
  }
  let d=`M${pts[0][0]} ${pts[0][1]}`;
  for(let i=1;i<=N;i++){
    const p=pts[i%N], q=pts[(i+1)%N];
    d+=` Q${p[0]} ${p[1]} ${n((p[0]+q[0])/2)} ${n((p[1]+q[1])/2)}`;
  }
  return `<path d="${d}Z" fill="${fill}"/>`;
}

/* pitched-roof building, lit from upper left.
   Reads as a building at small sizes: eave overhang shadow, two roof planes
   meeting at a lit ridge, gable-end shading, gutter, wall band with a door. */
function building(w,h,o){
  o=o||{};
  const roof=o.roof||'url(#gRoof)', wall=o.wall||'url(#gTimber)';
  const skirt = o.skirt===0 ? 0 : Math.max(4, Math.min(7, h*0.13));
  const m = 1.2;
  const bh = h - skirt;               // roof block
  const ridge = m + (bh-m)*0.47;
  const tier = o.tier||0;
  /* long soft cast shadow, sun from upper left */
  let s = `<rect x="${n(m+w*0.055)}" y="${n(m+h*0.09)}" width="${n(w-2*m)}" height="${n(h-m)}" rx="3"
    fill="#16240c" opacity=".22"/><rect x="${n(m+w*0.035)}" y="${n(m+h*0.06)}" width="${n(w-2*m)}" height="${n(h-m)}" rx="3"
    fill="#16240c" opacity=".16"/>`;

  /* wall band under the eave, with a door and windows */
  if(skirt>0){
    s += `<rect x="${n(m+1.5)}" y="${n(bh-2)}" width="${n(w-2*m-3)}" height="${n(skirt+2)}" rx="1.5" fill="${wall}"/>`;
    s += `<rect x="${n(m+1.5)}" y="${n(bh-2)}" width="${n(w-2*m-3)}" height="2" fill="#000" opacity=".3"/>`;
    const dw = Math.min(9, w*0.12);
    s += `<rect x="${n(w*0.5-dw/2)}" y="${n(bh+0.4)}" width="${n(dw)}" height="${n(skirt-0.8)}" rx="0.8" fill="#4b3520"/>`;
    for(let k=0;k<2;k++){
      const wx = w*(0.2+k*0.55), ww = Math.min(8,w*0.1), wh = skirt-2.4;
      s += `<rect x="${n(wx)}" y="${n(bh+1)}" width="${n(ww)}" height="${n(wh)}" rx="0.6" fill="#4a6470"/>`;
      s += `<rect x="${n(wx)}" y="${n(bh+1)}" width="${n(ww)}" height="${n(wh)}" rx="0.6" fill="url(#gGlass)" opacity=".8"/>`;
      /* diagonal reflection streak across the glass */
      s += `<polygon points="${n(wx)},${n(bh+1+wh)} ${n(wx+ww*0.55)},${n(bh+1)} ${n(wx+ww*0.85)},${n(bh+1)} ${n(wx+ww*0.3)},${n(bh+1+wh)}"
        fill="#fff" opacity=".45"/>`;
      s += `<rect x="${n(wx)}" y="${n(bh+1)}" width="${n(ww)}" height="${n(wh)}" rx="0.6" fill="none" stroke="#3d4f57" stroke-width="0.5"/>`;
    }
    s += `<rect x="${n(m+1.5)}" y="${n(bh+skirt-1.2)}" width="${n(w-2*m-3)}" height="1.2" fill="#000" opacity=".4"/>`;
  }

  /* eave overhang: dark plate slightly larger than the roof */
  s += `<rect x="${n(m-0.8)}" y="${n(m-0.8)}" width="${n(w-2*m+1.6)}" height="${n(bh-m+1.6)}" rx="2" fill="#2a3238" opacity=".85"/>`;

  /* the two roof planes */
  s += `<rect x="${m}" y="${m}" width="${n(w-2*m)}" height="${n(ridge-m)}" rx="1.4" fill="${roof}"/>`;
  s += `<rect x="${m}" y="${n(ridge)}" width="${n(w-2*m)}" height="${n(bh-ridge)}" rx="1.4" fill="${roof}"/>`;
  s += `<rect x="${m}" y="${m}" width="${n(w-2*m)}" height="${n(ridge-m)}" fill="#fff" opacity=".16"/>`;
  s += `<rect x="${m}" y="${n(ridge)}" width="${n(w-2*m)}" height="${n(bh-ridge)}" fill="#000" opacity=".2"/>`;

  /* corrugation running down the pitch */
  for(let i=m+3.5;i<w-m;i+=4){
    s += `<line x1="${n(i)}" y1="${n(m+0.5)}" x2="${n(i)}" y2="${n(bh-0.5)}" stroke="#fff" stroke-opacity=".11" stroke-width="0.6"/>`;
    s += `<line x1="${n(i+1.6)}" y1="${n(m+0.5)}" x2="${n(i+1.6)}" y2="${n(bh-0.5)}" stroke="#000" stroke-opacity=".1" stroke-width="0.6"/>`;
  }

  /* solar arrays, inset so roof still shows around them */
  const ins = Math.max(3.5, Math.min(w,h)*0.1), cols = o.cols || Math.max(3, Math.round(w/16));
  if(o.solar)  s += panels(m+ins, m+ins*0.8, w-2*(m+ins), ridge-m-ins*1.1, cols, 2);
  if(o.solar2) s += panels(m+ins, ridge+1.4, w-2*(m+ins), bh-ridge-ins-1.4, cols, 2);

  /* gable ends darkened so the roof reads as pitched */
  s += `<rect x="${m}" y="${m}" width="2.4" height="${n(bh-m)}" fill="#000" opacity=".2"/>`;
  s += `<rect x="${n(w-m-2.4)}" y="${m}" width="2.4" height="${n(bh-m)}" fill="#000" opacity=".26"/>`;

  /* gutter + lit ridge cap */
  s += `<rect x="${m}" y="${n(bh-2)}" width="${n(w-2*m)}" height="2" fill="#000" opacity=".28"/>`;
  s += `<rect x="${m}" y="${n(ridge-1.3)}" width="${n(w-2*m)}" height="1.5" fill="#e2e9ec" opacity=".9"/>`;
  s += `<rect x="${m}" y="${n(ridge+0.3)}" width="${n(w-2*m)}" height="1" fill="#000" opacity=".35"/>`;

  /* raking light plus a broad sheen band across the pitch */
  s += `<polygon points="${n(m)},${n(bh)} ${n(w*0.34)},${m} ${n(w*0.46)},${m} ${n(w*0.1)},${n(bh)}" fill="#fff" opacity=".1"/>`;
  s += `<rect x="${m}" y="${n(m+(ridge-m)*0.18)}" width="${n(w-2*m)}" height="${n((ridge-m)*0.3)}" fill="url(#gSky)" opacity=".3"/>`;
  /* weathering: rust/dirt streaks down the shaded pitch and worn eave corners */
  for(let i=0;i<Math.max(2,Math.round(w/22));i++){
    const sx = m+3+hash(i*7.3+w)*(w-2*m-6);
    s += `<rect x="${n(sx)}" y="${n(ridge+1)}" width="${(0.8+hash(i)*1.4).toFixed(1)}" height="${n(bh-ridge-1)}"
      fill="#3f4448" opacity="${(0.06+hash(i*3)*0.09).toFixed(2)}"/>`;
  }
  s += `<circle cx="${n(m+2)}" cy="${n(bh-2)}" r="2.4" fill="#000" opacity=".12"/>`;
  s += `<circle cx="${n(w-m-2)}" cy="${n(bh-2)}" r="2.8" fill="#000" opacity=".14"/>`;

  if(o.chimney){
    s += `<rect x="${n(w*0.76)}" y="${n(ridge-7)}" width="4.4" height="7.5" rx="0.8" fill="#7b6f66"/>`;
    s += `<rect x="${n(w*0.76)}" y="${n(ridge-7)}" width="4.4" height="2" rx="0.8" fill="#9d918a"/>`;
    s += `<rect x="${n(w*0.76-0.8)}" y="${n(ridge-7.8)}" width="6" height="1.4" rx="0.7" fill="#5d544d"/>`;
  }
  if(o.skylight){
    s += `<rect x="${n(w*0.3)}" y="${n(m+ (ridge-m)*0.3)}" width="${n(w*0.18)}" height="${n((ridge-m)*0.42)}" rx="0.8"
      fill="url(#gGlass)" stroke="#5f6b72" stroke-width="0.7"/>`;
  }
  s += grain(0,0,w,h,0.09);
  return s;
}

/* photovoltaic array */
function panels(x,y,w,h,cols,rows){
  if(w<3||h<3) return '';
  let s = `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" rx="0.8" fill="url(#gSolar)"/>`;
  const cw=w/cols, ch=h/rows;
  for(let i=0;i<cols;i++) for(let j=0;j<rows;j++){
    s += `<rect x="${n(x+i*cw+0.5)}" y="${n(y+j*ch+0.5)}" width="${n(cw-1)}" height="${n(ch-1)}"
      fill="#31456e" opacity="${(0.35+0.4*hash(i*4+j)).toFixed(2)}"/>`;
  }
  s += `<polygon points="${n(x)},${n(y+h)} ${n(x+w*0.4)},${n(y)} ${n(x+w*0.56)},${n(y)} ${n(x+w*0.08)},${n(y+h)}" fill="#bcd8f0" opacity="0.18"/>`;
  s += `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" rx="0.8" fill="none" stroke="#0b1220" stroke-opacity=".55" stroke-width="0.7"/>`;
  return s;
}

/* leafy canopy with lit crown and cast shadow */
function canopy(cx,cy,r,grad,seed,sway){
  let s = `<ellipse cx="${n(cx+r*0.34)}" cy="${n(cy+r*0.46)}" rx="${n(r*0.98)}" ry="${n(r*0.6)}"
    fill="#16240c" opacity="0.24"/><ellipse cx="${n(cx+r*0.3)}" cy="${n(cy+r*0.42)}" rx="${n(r*0.82)}" ry="${n(r*0.48)}"
    fill="#16240c" opacity="0.26"/>`;
  s += `<g${sway?' class="sway"':''} style="transform-origin:${n(cx)}px ${n(cy+r*0.7)}px">`;
  /* dark underside mass */
  s += `<circle cx="${n(cx+r*0.1)}" cy="${n(cy+r*0.14)}" r="${n(r*0.86)}" fill="#2b5418"/>`;
  /* mid lobes with real size variance */
  for(let i=0;i<6;i++){
    const a=(i/6)*Math.PI*2+hash(seed+i)*0.8, d=r*(0.3+hash(seed*3+i)*0.28);
    s += `<circle cx="${n(cx+Math.cos(a)*d)}" cy="${n(cy+Math.sin(a)*d*0.82)}"
      r="${n(r*(0.34+hash(seed*7+i)*0.3))}" fill="${grad}"/>`;
  }
  s += `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r*0.6)}" fill="${grad}"/>`;
  /* sun-side crown */
  for(let i=0;i<3;i++){
    const b=-1.5+i*0.6, d=r*(0.2+hash(seed*11+i)*0.24);
    s += `<circle cx="${n(cx-r*0.2+Math.cos(b)*d)}" cy="${n(cy-r*0.22+Math.sin(b)*d)}"
      r="${n(r*(0.13+hash(seed*13+i)*0.12))}" fill="#a9d47c" opacity="${(0.3+hash(seed+i)*0.35).toFixed(2)}"/>`;
  }
  /* rim light on the top-left edge */
  s += `<path d="M${n(cx-r*0.78)} ${n(cy-r*0.2)} a ${n(r*0.82)} ${n(r*0.82)} 0 0 1 ${n(r*0.9)} ${n(-r*0.52)}"
    stroke="#c2e39a" stroke-width="${n(r*0.1)}" fill="none" opacity=".35" stroke-linecap="round"/>`;
  s += `</g>`;
  return s;
}

/* pointed native tree */
function conifer(cx,cy,r,seed){
  let s = `<ellipse cx="${n(cx+r*0.32)}" cy="${n(cy+r*0.44)}" rx="${n(r*0.82)}" ry="${n(r*0.48)}" fill="#16240c" opacity=".26"/>`;
  s += `<g>`;
  s += `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r*0.88)}" fill="url(#gCanopyD)"/>`;
  s += `<circle cx="${n(cx-r*0.12)}" cy="${n(cy-r*0.12)}" r="${n(r*0.55)}" fill="#417a2f"/>`;
  s += `<circle cx="${n(cx-r*0.2)}" cy="${n(cy-r*0.2)}" r="${n(r*0.26)}" fill="#5d9c40" opacity=".8"/>`;
  s += `</g>`;
  return s;
}

/* clipped hedge run */
function hedge(w,h){
  const vert = h>w, thick = vert?w:h;
  let s = `<rect x="0.5" y="1.5" width="${n(w-1)}" height="${n(h-1.5)}" rx="${n(thick*0.42)}" fill="#1f3c15" opacity=".55"/>`;
  s += `<rect x="0.5" y="0.5" width="${n(w-1)}" height="${n(h-2)}" rx="${n(thick*0.42)}" fill="url(#gHedge)"/>`;
  const cnt = Math.max(3, Math.floor((vert?h:w)/7));
  for(let i=0;i<cnt;i++){
    const t=(i+0.5)/cnt;
    const cx = vert? w*0.46 : 1.5+t*(w-3);
    const cy = vert? 1.5+t*(h-3) : h*0.42;
    s += `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(thick*0.3)}" fill="#5f9a42" opacity="${(0.35+0.4*hash(i*3)).toFixed(2)}"/>`;
  }
  s += `<rect x="0.5" y="0.5" width="${n(w-1)}" height="${n(thick*0.24)}" rx="${n(thick*0.2)}" fill="#7cb257" opacity=".3"/>`;
  s += grain(0,0,w,h,0.16);
  return s;
}

/* pond / dam */
function water(w,h,seed){
  /* a pond should read as water first and bank second: keep the verge
     narrow so the pool dominates the footprint */
  let s = patch(w,h,'#5d7a3a',seed||4,0.5);
  s += `<g transform="translate(${n(w*0.5)},${n(h*0.5)}) scale(0.955) translate(${n(-w*0.5)},${n(-h*0.5)})">${patch(w,h,'#7d9450',seed||4,0.5)}</g>`;
  s += `<g transform="translate(${n(w*0.5)},${n(h*0.5)}) scale(0.915) translate(${n(-w*0.5)},${n(-h*0.5)})">${patch(w,h,'url(#gWater)',seed||4,0.5)}</g>`;
  /* darker at the far edge, so the pool reads as having depth */
  s += `<g transform="translate(${n(w*0.5)},${n(h*0.62)}) scale(0.7) translate(${n(-w*0.5)},${n(-h*0.5)})">${patch(w,h,'#1f5878',seed||4,0.5)}</g>`;
  for(let i=0;i<3;i++){
    s += `<ellipse class="ripple" cx="${n(w*(0.34+i*0.16))}" cy="${n(h*(0.4+i*0.13))}" rx="${n(w*0.13)}" ry="${n(h*0.045)}"
      fill="none" stroke="#dff4fb" stroke-width="0.9" opacity=".4" style="animation-delay:${(i*1.1).toFixed(1)}s"/>`;
  }
  s += `<ellipse cx="${n(w*0.32)}" cy="${n(h*0.28)}" rx="${n(w*0.24)}" ry="${n(h*0.10)}" fill="#fff" opacity=".30"/>`;
  s += `<ellipse cx="${n(w*0.27)}" cy="${n(h*0.24)}" rx="${n(w*0.12)}" ry="${n(h*0.045)}" fill="#fff" opacity=".34"/>`;
  for(let i=0;i<9;i++){
    const a=(i/9)*Math.PI*2;
    s += `<path d="M${n(w/2+Math.cos(a)*(w/2-4))} ${n(h/2+Math.sin(a)*(h/2-4))} q 1.6 -4 0 -7" stroke="#4e8433" stroke-width="1.2" fill="none"/>`;
  }
  return s;
}

/* gravel surface: graded aggregate, compacted darker centre, ragged edge */
function gravel(w,h,shape,rx){
  let s;
  if(shape==='ellipse'||shape==='ring'){
    s = `<ellipse cx="${n(w/2)}" cy="${n(h/2)}" rx="${n(w/2-0.5)}" ry="${n(h/2-0.5)}" fill="#8f8468"/>`;
    s += `<ellipse cx="${n(w/2)}" cy="${n(h/2-0.8)}" rx="${n(w/2-1.5)}" ry="${n(h/2-1.5)}" fill="url(#gGravel)"/>`;
    s += `<ellipse cx="${n(w/2)}" cy="${n(h/2)}" rx="${n(w/2-5)}" ry="${n(h/2-5)}" fill="#b8ac8c" opacity=".45"/>`;
    if(shape==='ring'){
      s += `<ellipse cx="${n(w/2)}" cy="${n(h/2)}" rx="${n(w/2-11)}" ry="${n(h/2-11)}" fill="url(#gLawn)"/>`;
      s += `<ellipse cx="${n(w/2)}" cy="${n(h/2)}" rx="${n(w/2-11)}" ry="${n(h/2-11)}" fill="none" stroke="#6f8f48" stroke-width="3" opacity=".55"/>`;
    }
  } else {
    s = `<rect x="0" y="0.8" width="${n(w)}" height="${n(h-0.8)}" rx="${rx===undefined?2.5:rx}" fill="#8f8468"/>`;
    s += `<rect x="0" y="0" width="${n(w)}" height="${n(h-1.4)}" rx="${rx===undefined?2.5:rx}" fill="url(#gGravel)"/>`;
    s += `<rect x="${n(w*0.1)}" y="${n(h*0.22)}" width="${n(w*0.8)}" height="${n(h*0.56)}" rx="2" fill="#b8ac8c" opacity=".4"/>`;
  }
  /* graded stone: a few big, many small */
  const stones = Math.min(46, Math.floor(w*h/140));
  for(let i=0;i<stones;i++){
    const big = i%7===0;
    const r = big ? 1.4+hash(i)*1.6 : 0.4+hash(i+9)*0.8;
    const c = i%4===0 ? '#e2d8bf' : i%3===0 ? '#7f7660' : '#a3987c';
    s += `<circle cx="${n(hash(i*1.7)*w)}" cy="${n(hash(i*3.1+5)*h)}" r="${n(r)}" fill="${c}" opacity="${big?0.75:0.55}"/>`;
  }
  /* ragged edge: stones spilling onto the grass instead of a hard cut line */
  for(let i=0;i<Math.min(10,Math.floor(w/14));i++){
    s += `<circle cx="${n(hash(i*2.3)*w)}" cy="${n(h-1+hash(i*4.1)*3)}" r="${n(0.6+hash(i)*1)}" fill="#b6a988" opacity=".7"/>`;
    s += `<circle cx="${n(hash(i*5.3+1)*w)}" cy="${n(1-hash(i*2.9)*3)}" r="${n(0.6+hash(i+3)*1)}" fill="#b6a988" opacity=".7"/>`;
  }
  s += grain(0,0,w,h,0.26);
  return s;
}

/* post-and-rail fence run */
function fence(w,h){
  const y=h/2;
  let s = `<line x1="0.5" y1="${n(y+1.2)}" x2="${n(w-0.5)}" y2="${n(y+1.2)}" stroke="#000" stroke-opacity=".3" stroke-width="2"/>`;
  s += `<line x1="0.5" y1="${n(y-1.8)}" x2="${n(w-0.5)}" y2="${n(y-1.8)}" stroke="#a8814f" stroke-width="1.3"/>`;
  s += `<line x1="0.5" y1="${n(y+1)}" x2="${n(w-0.5)}" y2="${n(y+1)}" stroke="#8e6b3e" stroke-width="1.3"/>`;
  for(let i=1.5;i<w-1;i+=9){
    s += `<rect x="${n(i)}" y="${n(y-4.5)}" width="2.2" height="9" rx="1" fill="#7d5931"/>`;
    s += `<rect x="${n(i)}" y="${n(y-4.5)}" width="1" height="9" fill="#a8814f"/>`;
  }
  return s;
}

/* livestock, drawn small and top-down */
function beast(kind,x,y,sc,idle){
  sc=sc||1;
  const sh=`<ellipse cx="${n(x+1.4*sc)}" cy="${n(y+2.8*sc)}" rx="${n(4.6*sc)}" ry="${n(1.8*sc)}" fill="#16240c" opacity=".3"/>`;
  let b='';
  if(kind==='chicken') b =
    `<ellipse cx="${n(x)}" cy="${n(y)}" rx="${n(3.7*sc)}" ry="${n(2.8*sc)}" fill="#f6efdf"/>
     <ellipse cx="${n(x-1.2*sc)}" cy="${n(y+0.3*sc)}" rx="${n(2.4*sc)}" ry="${n(1.9*sc)}" fill="#e3d8c1"/>
     <circle cx="${n(x+3.1*sc)}" cy="${n(y-2.2*sc)}" r="${n(1.8*sc)}" fill="#fffbf0"/>
     <circle cx="${n(x+3.1*sc)}" cy="${n(y-3.8*sc)}" r="${n(0.9*sc)}" fill="#cf4433"/>
     <path d="M${n(x+4.7*sc)} ${n(y-2*sc)} l ${n(1.9*sc)} ${n(0.6*sc)} l ${n(-1.9*sc)} ${n(0.9*sc)} z" fill="#e8a22e"/>`;
  else if(kind==='goat') b =
    `<ellipse cx="${n(x)}" cy="${n(y)}" rx="${n(5.6*sc)}" ry="${n(3*sc)}" fill="#e6ded0"/>
     <ellipse cx="${n(x-2*sc)}" cy="${n(y)}" rx="${n(3.4*sc)}" ry="${n(2.4*sc)}" fill="#cfc5b3"/>
     <circle cx="${n(x+5.6*sc)}" cy="${n(y-1.8*sc)}" r="${n(2.1*sc)}" fill="#f0eade"/>
     <path d="M${n(x+4.8*sc)} ${n(y-3.6*sc)} q ${n(1*sc)} ${n(-2.8*sc)} ${n(2.8*sc)} ${n(-1.8*sc)}" stroke="#8b7a5f" stroke-width="${n(0.9*sc)}" fill="none"/>
     <rect x="${n(x-3.6*sc)}" y="${n(y+2*sc)}" width="${n(1.2*sc)}" height="${n(2.8*sc)}" fill="#b0a695"/>
     <rect x="${n(x+2.6*sc)}" y="${n(y+2*sc)}" width="${n(1.2*sc)}" height="${n(2.8*sc)}" fill="#b0a695"/>`;
  else if(kind==='sheep') b =
    `<ellipse cx="${n(x)}" cy="${n(y)}" rx="${n(5.4*sc)}" ry="${n(3.8*sc)}" fill="#f7f3e9"/>
     <circle cx="${n(x-2.8*sc)}" cy="${n(y-2.2*sc)}" r="${n(2.3*sc)}" fill="#fffdf6"/>
     <circle cx="${n(x+0.8*sc)}" cy="${n(y-3*sc)}" r="${n(2.5*sc)}" fill="#fffdf6"/>
     <circle cx="${n(x+2.6*sc)}" cy="${n(y+1.6*sc)}" r="${n(2.3*sc)}" fill="#f2ede0"/>
     <circle cx="${n(x+5.6*sc)}" cy="${n(y-0.8*sc)}" r="${n(2*sc)}" fill="#4f4740"/>`;
  else if(kind==='duck') b =
    `<ellipse cx="${n(x)}" cy="${n(y)}" rx="${n(4.2*sc)}" ry="${n(2.6*sc)}" fill="#fdfaf0"/>
     <circle cx="${n(x+3.4*sc)}" cy="${n(y-2.2*sc)}" r="${n(1.7*sc)}" fill="#fff"/>
     <path d="M${n(x+4.8*sc)} ${n(y-2*sc)} l ${n(2.2*sc)} ${n(0.7*sc)} l ${n(-2.2*sc)} ${n(0.8*sc)} z" fill="#e8a22e"/>`;
  else if(kind==='pig') b =
    `<ellipse cx="${n(x)}" cy="${n(y)}" rx="${n(5.6*sc)}" ry="${n(3.2*sc)}" fill="#e2a3a5"/>
     <circle cx="${n(x+5.4*sc)}" cy="${n(y-0.8*sc)}" r="${n(2.3*sc)}" fill="#ecb6b7"/>
     <circle cx="${n(x+6.8*sc)}" cy="${n(y-0.4*sc)}" r="${n(1*sc)}" fill="#c98b8d"/>`;
  else b =
    `<ellipse cx="${n(x)}" cy="${n(y)}" rx="${n(3.2*sc)}" ry="${n(2.3*sc)}" fill="#e7dcc6"/>
     <circle cx="${n(x+2.6*sc)}" cy="${n(y-1.7*sc)}" r="${n(1.4*sc)}" fill="#f2e9d6"/>`;
  return `<g>${sh}${b}</g>`;
}

/* human figure for scale */
/* The body parts carry classes now so CSS can pose the figure - fold the
   legs to sit, tuck an arm - without person() having to branch into a
   second whole drawing. `prop` is a sixth optional argument appended at
   the end; all five existing call sites stop at `hat`, so nothing else
   needed touching. */
function person(x,y,sc,shirt,hat,prop){
  sc=sc||1;
  let s = `<ellipse class="pr-shadow" cx="${n(x+1.6*sc)}" cy="${n(y+9*sc)}" rx="${n(4.4*sc)}" ry="${n(1.8*sc)}" fill="#16240c" opacity=".32"/>`;
  s += `<rect class="pr-leg pr-leg-l" x="${n(x-2.2*sc)}" y="${n(y+2.6*sc)}" width="${n(1.8*sc)}" height="${n(6*sc)}" rx="${n(0.9*sc)}" fill="#3f4a5a"/>`;
  s += `<rect class="pr-leg pr-leg-r" x="${n(x+0.4*sc)}" y="${n(y+2.6*sc)}" width="${n(1.8*sc)}" height="${n(6*sc)}" rx="${n(0.9*sc)}" fill="#3f4a5a"/>`;
  s += `<rect class="pr-torso" x="${n(x-3*sc)}" y="${n(y-2.4*sc)}" width="${n(6*sc)}" height="${n(5.6*sc)}" rx="${n(2.2*sc)}" fill="${shirt||'#c8583f'}"/>`;
  s += `<rect class="pr-arm pr-arm-l" x="${n(x-4.8*sc)}" y="${n(y-1.8*sc)}" width="${n(1.9*sc)}" height="${n(4.4*sc)}" rx="${n(0.9*sc)}" fill="${shirt||'#c8583f'}"/>`;
  s += `<rect class="pr-arm pr-arm-r" x="${n(x+2.9*sc)}" y="${n(y-1.8*sc)}" width="${n(1.9*sc)}" height="${n(4.4*sc)}" rx="${n(0.9*sc)}" fill="${shirt||'#c8583f'}"/>`;
  s += `<circle class="pr-head" cx="${n(x)}" cy="${n(y-4.6*sc)}" r="${n(2.9*sc)}" fill="#e2b98f"/>`;
  s += `<path class="pr-hair" d="M${n(x-2.9*sc)} ${n(y-4.9*sc)} a ${n(2.9*sc)} ${n(2.9*sc)} 0 0 1 ${n(5.8*sc)} 0 z" fill="#4a3a2c"/>`;
  if(hat){ s += `<g class="pr-hat"><ellipse cx="${n(x)}" cy="${n(y-5.2*sc)}" rx="${n(5*sc)}" ry="${n(2.2*sc)}" fill="${hat}"/>
                 <circle cx="${n(x)}" cy="${n(y-6*sc)}" r="${n(2.3*sc)}" fill="${hat}"/></g>`; }
  if(prop) s += prop;
  return s;
}
