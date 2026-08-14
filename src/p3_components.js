/* =====================================================================
   COMPONENTS — every placeable thing, drawn to its footprint.
   Signature: (w, h, ob) where `ob` is the live object (or null for a
   catalogue thumbnail), so buildings can show their real state.
   ===================================================================== */

/* ---- growing beds: soil, furrows and the crop actually in them ---- */
function bedArt(w,h,ob,rows){
  rows = rows || Math.max(1, Math.round(h/16));
  const wet = ob && ob.water > 0.45;
  let s = `<rect x="0.5" y="1.5" width="${n(w-1)}" height="${n(h-1.5)}" rx="2" fill="#2a1e14" opacity=".5"/>`;
  s += `<rect x="0.5" y="0.5" width="${n(w-1)}" height="${n(h-2)}" rx="2" fill="${wet?'url(#gSoilWet)':'url(#gSoil)'}"/>`;
  /* timber edging */
  s += `<rect x="0.5" y="0.5" width="${n(w-1)}" height="${n(h-2)}" rx="2" fill="none" stroke="#8b6640" stroke-width="1.6"/>`;
  s += `<rect x="1.2" y="1.2" width="${n(w-2.4)}" height="${n(h-3.4)}" rx="1.6" fill="none" stroke="#000" stroke-opacity=".25" stroke-width="0.8"/>`;
  const rh = (h-5)/rows;
  for(let r0=0;r0<rows;r0++){
    const y = 2.5 + r0*rh + rh/2;
    s += `<line x1="3" y1="${n(y)}" x2="${n(w-3)}" y2="${n(y)}" stroke="#000" stroke-opacity=".2" stroke-width="${n(rh*0.5)}"/>`;
    s += `<line x1="3" y1="${n(y-rh*0.2)}" x2="${n(w-3)}" y2="${n(y-rh*0.2)}" stroke="#fff" stroke-opacity=".06" stroke-width="1"/>`;
  }
  if(ob && ob.crop){
    const cr = CROPS[ob.crop];
    const st = ob.stage;                          // 0..1 growth
    const per = Math.min(7, Math.max(3, Math.floor((w-8)/13)));
    for(let r0=0;r0<rows;r0++){
      const y = 2.5 + r0*rh + rh/2;
      for(let i=0;i<per;i++){
        const x = 5 + (i+0.5)*((w-10)/per);
        s += plant(cr, x, y, st, r0*per+i, ob.pest);
      }
    }
    if(ob.stage >= 1){
      s += `<circle class="pulse" cx="${n(w-5)}" cy="5" r="3" fill="#f0c14b" opacity=".9"/>`;
    }
  } else {
    for(let i=0;i<Math.min(24,Math.floor(w*h/140));i++){
      s += `<circle cx="${n(3+hash(i*2.3)*(w-6))}" cy="${n(3+hash(i*4.1+2)*(h-6))}" r="${n(0.5+hash(i)*0.6)}" fill="#8a6a4a" opacity=".5"/>`;
    }
  }
  s += grain(0,0,w,h,0.14);
  return s;
}

/* a single plant at a growth stage */
function plant(cr,x,y,st,seed,pest){
  const sc = 0.35 + st*0.85;
  const leaf = cr.leaf || '#4f9c39';
  let s = '';
  if(st < 0.12){
    return `<circle cx="${n(x)}" cy="${n(y)}" r="0.9" fill="#6fb04a"/>`;
  }
  const R = 3.1*sc;
  s += '<g class="cropsway">';
  for(let i=0;i<4;i++){
    const a = (i/4)*Math.PI*2 + hash(seed+i);
    s += `<ellipse cx="${n(x+Math.cos(a)*R*0.45)}" cy="${n(y+Math.sin(a)*R*0.4)}" rx="${n(R*0.55)}" ry="${n(R*0.42)}"
      fill="${leaf}" opacity="${(0.72+hash(seed*3+i)*0.28).toFixed(2)}" transform="rotate(${n(a*57)} ${n(x)} ${n(y)})"/>`;
  }
  s += `<circle cx="${n(x-R*0.2)}" cy="${n(y-R*0.24)}" r="${n(R*0.3)}" fill="#8fca63" opacity=".55"/>`;
  s += '</g>';
  if(st > 0.72 && cr.fruit){
    const fn = cr.fruitN || 2;
    for(let i=0;i<fn;i++){
      const a = i*2.1 + seed;
      s += `<circle cx="${n(x+Math.cos(a)*R*0.5)}" cy="${n(y+Math.sin(a)*R*0.45)}" r="${n(1.2*sc)}" fill="${cr.fruit}"/>`;
      s += `<circle cx="${n(x+Math.cos(a)*R*0.5-0.4)}" cy="${n(y+Math.sin(a)*R*0.45-0.4)}" r="${n(0.4*sc)}" fill="#fff" opacity=".5"/>`;
    }
  }
  if(pest && hash(seed*7)>0.6){
    s += `<circle cx="${n(x+1.6)}" cy="${n(y-1.6)}" r="0.9" fill="#c8583f"/>`;
  }
  return s;
}

/* ===================== registry ===================== */

/* — home & structures — */
ART.cabin = (w,h)=>{
  let s = ao(0,0,w,h,.3);
  s += `<rect x="${n(w*0.03)}" y="${n(h*0.5)}" width="${n(w*0.46)}" height="${n(h*0.24)}" rx="2" fill="#8e6b3e"/>`;
  s += `<rect x="${n(w*0.03)}" y="${n(h*0.49)}" width="${n(w*0.46)}" height="${n(h*0.22)}" rx="2" fill="url(#gTimber)"/>`;
  for(let i=1;i<9;i++) s += `<line x1="${n(w*0.03+i*(w*0.46/9))}" y1="${n(h*0.49)}" x2="${n(w*0.03+i*(w*0.46/9))}" y2="${n(h*0.71)}" stroke="#00000033" stroke-width="0.8"/>`;
  s += `<g transform="translate(${n(w*0.42)},${n(h*0.26)})">${building(w*0.56,h*0.58,{solar:1,skylight:1})}</g>`;
  s += `<g transform="translate(1,1)">${building(w*0.66,h*0.48,{solar:1,chimney:1})}</g>`;
  s += `<rect x="${n(w*0.28)}" y="${n(h*0.4)}" width="${n(w*0.17)}" height="${n(h*0.16)}" rx="1.5" fill="url(#gGlass)" stroke="#7e929a" stroke-width="0.8"/>`;
  s += `<circle cx="${n(w*0.09)}" cy="${n(h*0.78)}" r="3.4" fill="#4f8a35"/><circle cx="${n(w*0.44)}" cy="${n(h*0.78)}" r="3" fill="#5f9c3d"/>`;
  return s;
};
ART.shed      = (w,h)=> building(w,h,{solar:1,chimney:0});
ART.workshop  = (w,h)=> building(w,h,{roof:'url(#gRoofRed)',solar:1});
ART.cellar    = (w,h)=>{
  let s = patch(w,h,'#7fa855',9,1);
  s += `<ellipse cx="${n(w/2)}" cy="${n(h*0.48)}" rx="${n(w*0.36)}" ry="${n(h*0.32)}" fill="#6a8f45"/>`;
  /* the mound is a dome, so it takes the light on its upper-left third */
  s += `<ellipse cx="${n(w/2-w*0.07)}" cy="${n(h*0.41)}" rx="${n(w*0.22)}" ry="${n(h*0.18)}" fill="#7fa855" opacity=".55"/>`;
  s += `<rect x="${n(w*0.36)}" y="${n(h*0.6)}" width="${n(w*0.28)}" height="${n(h*0.3)}" rx="2" fill="var(--a-timber-d)"/>`;
  s += `<rect x="${n(w*0.4)}" y="${n(h*0.64)}" width="${n(w*0.2)}" height="${n(h*0.24)}" rx="1.5" fill="#4b3520"/>`;
  return s;
};

/* — energy — */
ART.solar_ground = (w,h)=>{
  let s = patch(w,h,'#5f7a44',12,1);
  const rows = Math.max(2, Math.round(h/14));
  for(let i=0;i<rows;i++){
    const y = 3 + i*((h-6)/rows);
    s += `<rect x="4" y="${n(y+3)}" width="${n(w-8)}" height="3" fill="#16240c" opacity=".3"/>`;
    s += panels(3, y, w-6, (h-8)/rows, Math.max(3,Math.round(w/12)), 1);
  }
  return s;
};
ART.wind = (w,h)=>{
  const cx=w/2, hy=h*0.3;
  let s = `<ellipse cx="${n(cx+5)}" cy="${n(h-5)}" rx="9" ry="3" fill="url(#gShadow)" opacity=".5"/>`;
  s += `<rect x="${n(cx-1.6)}" y="${n(hy)}" width="3.2" height="${n(h-hy-3)}" rx="1.6" fill="url(#gMetal)"/>`;
  s += `<rect x="${n(cx-1.6)}" y="${n(hy)}" width="1.3" height="${n(h-hy-3)}" fill="#fff" opacity=".5"/>`;
  s += `<g class="spin" style="transform-origin:${n(cx)}px ${n(hy)}px">`;
  for(let i=0;i<3;i++) s += `<path d="M${n(cx)} ${n(hy)} l -1.4 -${n(hy*0.9)} q 1.4 -3 2.8 0 z" fill="#f3f4f0" transform="rotate(${i*120} ${n(cx)} ${n(hy)})"/>`;
  s += `</g><circle cx="${n(cx)}" cy="${n(hy)}" r="2.2" fill="#b3b7b0"/>`;
  return s;
};
ART.battery = (w,h)=>{
  let s = ao(0,0,w,h,.28);
  s += `<rect x="${n(w*0.14)}" y="${n(h*0.16)}" width="${n(w*0.72)}" height="${n(h*0.66)}" rx="2" fill="#4d565f"/>`;
  s += `<rect x="${n(w*0.14)}" y="${n(h*0.16)}" width="${n(w*0.72)}" height="${n(h*0.3)}" rx="2" fill="#69747e"/>`;
  s += `<rect x="${n(w*0.26)}" y="${n(h*0.52)}" width="${n(w*0.48)}" height="3.4" rx="1.7" fill="#0e1a10"/>`;
  s += `<rect x="${n(w*0.27)}" y="${n(h*0.53)}" width="${n(w*0.34)}" height="2.4" rx="1.2" fill="#7cc24f"/>`;
  /* where the cabinet meets the ground, not a drop shadow - a darker band
     inside its own footprint, which reads as contact at any zoom */
  s += `<rect x="${n(w*0.14)}" y="${n(h*0.74)}" width="${n(w*0.72)}" height="${n(h*0.08)}" fill="#2f363d" opacity=".55"/>`;
  s += edge(w,h,2);
  return s;
};

/* — water — */
ART.tank = (w,h,ob)=>{
  const cnt = 2, rad = Math.min(h, w/cnt)/2 - 1.5;
  let s='';
  for(let i=0;i<cnt;i++){
    const cx=(w/cnt)*(i+0.5), cy=h/2;
    s += `<ellipse cx="${n(cx+2)}" cy="${n(cy+2.5)}" rx="${n(rad)}" ry="${n(rad*0.9)}" fill="#16240c" opacity=".34"/>`;
    s += `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(rad)}" fill="#2f4f2f"/>`;
    s += `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(rad-1.2)}" fill="url(#gTank)"/>`;
    for(let j=0;j<12;j++){
      const a=(j/12)*Math.PI*2;
      s += `<line x1="${n(cx)}" y1="${n(cy)}" x2="${n(cx+Math.cos(a)*(rad-2))}" y2="${n(cy+Math.sin(a)*(rad-2))}" stroke="#3e6a3e" stroke-width="0.8" opacity=".7"/>`;
    }
    s += `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(rad*0.26)}" fill="#5f8a5c"/>`;
    s += `<path d="M${n(cx-rad*0.58)} ${n(cy-rad*0.5)} a ${n(rad*0.8)} ${n(rad*0.8)} 0 0 1 ${n(rad*0.9)} ${n(-rad*0.14)}" stroke="#fff" stroke-width="1.3" fill="none" opacity=".38"/>`;
  }
  if(ob){
    const lv = Math.max(0, Math.min(1, ob.store/(ob.cap||100)));
    s += `<rect x="${n(w*0.16)}" y="${n(h-3.4)}" width="${n(w*0.68)}" height="2.6" rx="1.3" fill="#0e1a10" opacity=".8"/>`;
    s += `<rect x="${n(w*0.16)}" y="${n(h-3.4)}" width="${n(w*0.68*lv)}" height="2.6" rx="1.3" fill="#6fb6d8"/>`;
  }
  return s;
};
ART.pond = (w,h)=> water(w,h,4);
ART.well = (w,h)=>{
  let s = patch(w,h,'#84aa58',15,1);
  s += `<circle cx="${n(w/2)}" cy="${n(h/2)}" r="${n(Math.min(w,h)/2-3)}" fill="url(#gStone)"/>`;
  s += `<circle cx="${n(w/2)}" cy="${n(h/2)}" r="${n(Math.min(w,h)/2-5.5)}" fill="#22506b"/>`;
  s += `<circle cx="${n(w/2-1.5)}" cy="${n(h/2-1.5)}" r="${n(Math.min(w,h)/2-8)}" fill="#3d7a9c" opacity=".7"/>`;
  return s;
};
ART.sprinkler = (w,h)=>{
  let s = patch(w,h,'#8cb35f',18,1);
  s += `<circle cx="${n(w/2)}" cy="${n(h/2)}" r="${n(Math.min(w,h)*0.4)}" fill="none" stroke="#9fd6ee" stroke-width="1" stroke-dasharray="3 3" opacity=".7" class="spinSlow" style="transform-origin:${n(w/2)}px ${n(h/2)}px"/>`;
  s += `<ellipse cx="${n(w/2+0.6)}" cy="${n(h/2+1.6)}" rx="3.4" ry="1.8" fill="url(#gShadow)" opacity=".6"/>`;
  s += `<circle cx="${n(w/2)}" cy="${n(h/2)}" r="2.6" fill="url(#gMetal)"/>`;
  s += `<circle cx="${n(w/2)}" cy="${n(h/2)}" r="1.2" fill="#9fd6ee"/>`;
  return s;
};

/* — growing — */
ART.bed        = (w,h,ob)=> bedArt(w,h,ob,2);
ART.bed_large  = (w,h,ob)=> bedArt(w,h,ob,4);
ART.greenhouse = (w,h,ob)=>{
  let s = `<rect x="2.5" y="3" width="${n(w-3)}" height="${n(h-3)}" rx="2" fill="#16240c" opacity=".34"/>`;
  s += `<rect x="0.5" y="0.5" width="${n(w-1)}" height="${n(h-2)}" rx="2" fill="#8ea4ab"/>`;
  s += `<rect x="1.5" y="1.5" width="${n(w-3)}" height="${n(h-4)}" rx="1.5" fill="url(#gGlass)"/>`;
  if(ob && ob.crop){
    const cr = CROPS[ob.crop];
    for(let r0=0;r0<2;r0++) for(let i=0;i<Math.max(3,Math.floor(w/12));i++){
      const x = 6+(i+0.5)*((w-12)/Math.max(3,Math.floor(w/12)));
      s += `<g opacity=".85">${plant(cr, x, h*(0.32+r0*0.36), ob.stage, r0*7+i, ob.pest)}</g>`;
    }
  } else {
    s += `<rect x="4" y="${n(h*0.26)}" width="${n(w-8)}" height="${n(h*0.16)}" rx="1" fill="#6fae4c" opacity=".45"/>`;
    s += `<rect x="4" y="${n(h*0.6)}" width="${n(w-8)}" height="${n(h*0.16)}" rx="1" fill="#6fae4c" opacity=".45"/>`;
  }
  for(let i=6;i<w-2;i+=7) s += `<line x1="${n(i)}" y1="1.5" x2="${n(i)}" y2="${n(h-2.5)}" stroke="#7d949c" stroke-width="0.9"/>`;
  s += `<line x1="1.5" y1="${n(h/2-0.8)}" x2="${n(w-1.5)}" y2="${n(h/2-0.8)}" stroke="#f0f6f8" stroke-width="1.6"/>`;
  s += `<line x1="1.5" y1="${n(h/2+0.7)}" x2="${n(w-1.5)}" y2="${n(h/2+0.7)}" stroke="#000" stroke-opacity=".2" stroke-width="0.8"/>`;
  s += `<polygon points="2,${n(h-3)} ${n(w*0.42)},2 ${n(w*0.56)},2 ${n(w*0.14)},${n(h-3)}" fill="#fff" opacity=".26"/>`;
  if(ob && ob.stage>=1) s += `<circle class="pulse" cx="${n(w-5)}" cy="5" r="3" fill="#f0c14b"/>`;
  return s;
};
ART.herb_spiral = (w,h,ob)=>{
  const cx=w/2, cy=h/2, R=Math.min(w,h)/2-1.5;
  let s = `<ellipse cx="${n(cx+2)}" cy="${n(cy+2)}" rx="${n(R*0.95)}" ry="${n(R*0.85)}" fill="#16240c" opacity=".3"/>`;
  s += `<ellipse cx="${n(cx)}" cy="${n(cy)}" rx="${n(R)}" ry="${n(R*0.94)}" fill="#8fb45f"/>`;
  let d='';
  for(let t=0;t<=Math.PI*3.4;t+=0.15){
    const rr = R*0.9*(1-t/(Math.PI*3.9));
    d += (t===0?'M':'L') + n(cx+Math.cos(t)*rr) + ' ' + n(cy+Math.sin(t)*rr*0.92) + ' ';
  }
  s += `<path d="${d}" stroke="#6b5238" stroke-width="${n(Math.max(3,R*0.3))}" fill="none" stroke-linecap="round"/>`;
  s += `<path d="${d}" stroke="url(#gSoil)" stroke-width="${n(Math.max(2,R*0.22))}" fill="none" stroke-linecap="round"/>`;
  const cols=['#4f8a35','#6fb04a','#8fc95d','#dd6f9c','#efb43c','#9b6fc4','#5fb0d4'];
  for(let i=0;i<15;i++){
    const a=i*0.95, rr=Math.max(R*0.16, R*0.86*(1-(i*0.95)/(Math.PI*4.2)));
    s += `<circle cx="${n(cx+Math.cos(a)*rr)}" cy="${n(cy+Math.sin(a)*rr*0.92)}" r="${n(Math.max(1.3,R*0.1))}" fill="${cols[i%7]}"/>`;
  }
  if(ob && ob.stage>=1) s += `<circle class="pulse" cx="${n(w-5)}" cy="5" r="3" fill="#f0c14b"/>`;
  return s;
};
ART.orchard = (w,h,ob)=>{
  let s = patch(w,h,'#82ac57',21,1);
  const cols=Math.max(2,Math.round(w/26)), rows=Math.max(2,Math.round(h/26));
  const ripe = ob && ob.stage>=1;
  /* One sway group per band rather than one per tree. Swaying every
     canopy individually looked marginally better and cost 48 animated
     nodes per orchard - eighteen orchards measured 928 nodes and 48fps.
     Three bands with staggered delays keeps the block from moving as one
     slab for 3 nodes instead of 48. */
  const bands = [[],[],[]];
  for(let i=0;i<cols;i++) for(let j=0;j<rows;j++){
    const cx = (w/cols)*(i+0.5), cy = (h/rows)*(j+0.5);
    bands[(i+j)%3].push(canopy(cx, cy, Math.min(w/cols,h/rows)*0.42, 'url(#gCanopy)', i*3+j, false));
    if(ripe) for(let k=0;k<3;k++){
      const a=k*2.2+i;
      bands[(i+j)%3].push(`<circle cx="${n(cx+Math.cos(a)*6)}" cy="${n(cy+Math.sin(a)*5)}" r="1.7" fill="#e2603a"/>`);
    }
  }
  /* emit each band as one swaying group, staggered so the block does not
     move as a single slab */
  bands.forEach((b, k)=>{
    if(!b.length) return;
    s += `<g class="sway" style="transform-origin:${n(w/2)}px ${n(h)}px;animation-delay:-${(k*1.7).toFixed(1)}s">`
       + b.join('') + `</g>`;
  });
  if(ripe) s += `<circle class="pulse" cx="${n(w-5)}" cy="5" r="3" fill="#f0c14b"/>`;
  return s;
};
ART.berry = (w,h,ob)=>{
  let s = bedArt(w,h,null,2);
  const ripe = ob && ob.stage>=1;
  s += `<g class="sway" style="transform-origin:${n(w/2)}px ${n(h)}px">`;
  for(let i=0;i<14;i++){
    const x=4+hash(i*1.9)*(w-8), y=4+hash(i*3.1+2)*(h-8);
    s += `<circle cx="${n(x)}" cy="${n(y)}" r="${n(2.4+hash(i)*1.2)}" fill="#3f7a32"/>`;
    if(ripe) s += `<circle cx="${n(x+1)}" cy="${n(y-1)}" r="1.1" fill="#5a4a9c"/>`;
  }
  s += `</g>`;
  if(ripe) s += `<circle class="pulse" cx="${n(w-5)}" cy="5" r="3" fill="#f0c14b"/>`;
  return s;
};
ART.flowers = (w,h)=>{
  let s = patch(w,h,'#8cb35f',33,1);
  const cols=['#dd6f9c','#efb43c','#9b6fc4','#e2603a','#f2e07a','#5fb0d4','#fff6e0'];
  /* the heads catch the wind; the strip they are planted in does not */
  s += `<g class="sway" style="transform-origin:${n(w/2)}px ${n(h)}px">`;
  for(let i=0;i<Math.min(38,Math.floor(w*h/70));i++){
    const x=3+hash(i*1.3)*(w-6), y=3+hash(i*2.7+3)*(h-6);
    s += `<circle cx="${n(x+0.4)}" cy="${n(y+0.8)}" r="${n(1.5+hash(i)*1.1)}" fill="var(--a-shadow)" opacity=".3"/>`;
    s += `<circle cx="${n(x)}" cy="${n(y)}" r="${n(1.4+hash(i)*1.1)}" fill="${cols[i%7]}"/>`;
  }
  s += `</g>`;
  return s;
};
ART.compost = (w,h)=>{
  let s = ao(0,0,w,h,.28);
  for(let i=0;i<3;i++){
    const x = 1.5 + i*((w-3)/3);
    s += `<rect x="${n(x)}" y="2.5" width="${n((w-3)/3-1.5)}" height="${n(h-5)}" rx="1.5" fill="var(--a-timber-d)"/>`;
    s += `<rect x="${n(x+1)}" y="3.5" width="${n((w-3)/3-3.5)}" height="${n(h-7)}" rx="1" fill="${['#4b3520','#6b4f38','#4f7a35'][i]}"/>`;
    s += `<rect x="${n(x)}" y="2.5" width="${n((w-3)/3-1.5)}" height="1.6" rx="0.8" fill="#a1743f"/>`;
    /* the third bin is the finished one - give it a straw crown so the
       three bays read as a sequence rather than three identical boxes */
    if(i===2) s += `<rect x="${n(x+1)}" y="3.2" width="${n((w-3)/3-3.5)}" height="2" rx="1" fill="url(#gStraw)" opacity=".85"/>`;
  }
  return s;
};
ART.nursery = (w,h)=>{
  let s = ART.greenhouse(w,h,null);
  s += `<rect x="4" y="${n(h*0.45)}" width="${n(w-8)}" height="2.6" rx="1" fill="#7cc24f" opacity=".7"/>`;
  return s;
};

/* — animals — */
function paddock(w,h,kind,cnt,seed,sc){
  let s = patch(w,h,'#84ad57',seed,1);
  s += `<rect x="1.5" y="1.5" width="${n(w-3)}" height="${n(h-3)}" rx="2.5" fill="none" stroke="#00000033" stroke-width="2.6"/>`;
  s += `<rect x="1.5" y="1.5" width="${n(w-3)}" height="${n(h-3)}" rx="2.5" fill="none" stroke="#a8814f" stroke-width="1.3"/>`;
  for(let x=2;x<w-2;x+=11){ s += `<rect x="${n(x-1)}" y="0" width="2" height="4" rx="1" fill="#7d5931"/>`;
                            s += `<rect x="${n(x-1)}" y="${n(h-4)}" width="2" height="4" rx="1" fill="#7d5931"/>`; }
  for(let y=2;y<h-2;y+=11){ s += `<rect x="0" y="${n(y-1)}" width="4" height="2" rx="1" fill="#7d5931"/>`;
                            s += `<rect x="${n(w-4)}" y="${n(y-1)}" width="4" height="2" rx="1" fill="#7d5931"/>`; }
  for(let i=0;i<cnt;i++){
    s += beast(kind, 8+hash(i*2.3+seed)*Math.max(4,w-16), 8+hash(i*5.7+seed)*Math.max(4,h-16), sc||1);
  }
  return s;
}
ART.coop = (w,h,ob)=>{
  const cnt = ob ? Math.min(8, ob.animals||0) : 3;
  let s = paddock(w,h,'chicken',cnt,7,0.92);
  s += `<g transform="translate(${n(w*0.05)},${n(h*0.08)})">${building(w*0.46,h*0.5,{roof:'url(#gRoofRed)',solar:1})}</g>`;
  if(ob && ob.ready>0) s += `<circle class="pulse" cx="${n(w-6)}" cy="6" r="3.4" fill="#f0c14b"/>`;
  return s;
};
ART.goat_pen = (w,h,ob)=>{
  const cnt = ob ? Math.min(6, ob.animals||0) : 2;
  let s = paddock(w,h,'goat',cnt,11,0.95);
  s += `<g transform="translate(${n(w*0.04)},${n(h*0.06)})">${building(w*0.36,h*0.42,{})}</g>`;
  if(ob && ob.ready>0) s += `<circle class="pulse" cx="${n(w-6)}" cy="6" r="3.4" fill="#f0c14b"/>`;
  return s;
};
ART.sheep = (w,h,ob)=>{
  const cnt = ob ? Math.min(8, ob.animals||0) : 4;
  let s = paddock(w,h,'sheep',cnt,15,0.95);
  if(ob && ob.ready>0) s += `<circle class="pulse" cx="${n(w-6)}" cy="6" r="3.4" fill="#f0c14b"/>`;
  return s;
};
ART.duck_pond = (w,h,ob)=>{
  const cnt = ob ? Math.min(8, ob.animals||0) : 3;
  let s = water(w,h,19);
  for(let i=0;i<cnt;i++) s += beast('duck', 8+hash(i*2.9)*Math.max(4,w-16), 8+hash(i*4.3+1)*Math.max(4,h-16), 0.9);
  if(ob && ob.ready>0) s += `<circle class="pulse" cx="${n(w-6)}" cy="6" r="3.4" fill="#f0c14b"/>`;
  return s;
};
ART.apiary = (w,h,ob)=>{
  const cnt = Math.max(2, Math.floor(w/22));
  let s = patch(w,h,'#8cb35f',23,1);
  const cols=['#e8c05a','#e2ded2','#9fc0d8','#e29a72','#b9d38e','#d8a8c4'];
  for(let i=0;i<cnt;i++){
    const x = 3+i*((w-6)/cnt), bw = Math.min(13,(w-6)/cnt-2), y = h/2-7;
    s += `<rect x="${n(x+1.5)}" y="${n(y+2)}" width="${n(bw)}" height="14" rx="1" fill="#16240c" opacity=".32"/>`;
    s += `<rect x="${n(x)}" y="${n(y)}" width="${n(bw)}" height="14" rx="1" fill="${cols[i%6]}"/>`;
    s += `<rect x="${n(x)}" y="${n(y)}" width="${n(bw)}" height="4.6" rx="1" fill="#fff" opacity=".22"/>`;
    s += `<rect x="${n(x-0.8)}" y="${n(y-2)}" width="${n(bw+1.6)}" height="3" rx="1" fill="#f4efe1"/>`;
    s += `<line x1="${n(x)}" y1="${n(y+5.5)}" x2="${n(x+bw)}" y2="${n(y+5.5)}" stroke="#00000033" stroke-width="0.8"/>`;
    s += `<line x1="${n(x)}" y1="${n(y+10)}" x2="${n(x+bw)}" y2="${n(y+10)}" stroke="#00000033" stroke-width="0.8"/>`;
  }
  s += `<circle class="bee" cx="${n(w*0.7)}" cy="${n(h*0.24)}" r="1.4" fill="#f0c14b"/>`;
  s += `<circle class="bee" cx="${n(w*0.3)}" cy="${n(h*0.7)}" r="1.2" fill="#f0c14b" style="animation-delay:1.4s"/>`;
  if(ob && ob.ready>0) s += `<circle class="pulse" cx="${n(w-6)}" cy="6" r="3.4" fill="#f0c14b"/>`;
  return s;
};
ART.rabbit = (w,h,ob)=> paddock(w,h,'rabbit', ob?Math.min(6,ob.animals||0):2, 27, 0.9);
ART.fodder = (w,h)=>{
  let s = patch(w,h,'#b5bd68',31,1);
  s += `<g class="sway" style="transform-origin:${n(w/2)}px ${n(h)}px">`;
  for(let i=0;i<Math.floor(w*h/26);i++){
    const x=3+hash(i*1.4)*(w-6);
    s += `<path d="M${n(x)} ${n(h-4)} q ${n((hash(i)-0.5)*3)} -6 ${n((hash(i+2)-0.5)*4)} -9" stroke="#c9c26a" stroke-width="1.1" fill="none"/>`;
  }
  s += `</g>`;
  return s;
};

/* — processing — */
ART.honey_lab = (w,h,ob)=>{
  let s = building(w,h,{solar:1});
  s += `<rect x="${n(w*0.6)}" y="${n(h*0.58)}" width="${n(w*0.3)}" height="4" rx="1" fill="url(#gGlass)"/>`;
  s += `<circle cx="${n(w*0.2)}" cy="${n(h*0.72)}" r="3" fill="#f0c14b"/>`;
  if(ob && ob.ready>0) s += `<circle class="pulse" cx="${n(w-6)}" cy="6" r="3.4" fill="#f0c14b"/>`;
  return s;
};
ART.kitchen = (w,h,ob)=>{
  let s = building(w,h,{roof:'url(#gRoofRed)'});
  s += `<circle cx="${n(w*0.24)}" cy="${n(h*0.7)}" r="2.6" fill="#e2603a"/>`;
  s += `<circle cx="${n(w*0.42)}" cy="${n(h*0.7)}" r="2.6" fill="#efb43c"/>`;
  if(ob && ob.ready>0) s += `<circle class="pulse" cx="${n(w-6)}" cy="6" r="3.4" fill="#f0c14b"/>`;
  return s;
};
ART.dairy = (w,h,ob)=>{
  let s = building(w,h,{solar:1});
  s += `<rect x="${n(w*0.14)}" y="${n(h*0.62)}" width="${n(w*0.3)}" height="4.5" rx="2" fill="#e8eef0"/>`;
  if(ob && ob.ready>0) s += `<circle class="pulse" cx="${n(w-6)}" cy="6" r="3.4" fill="#f0c14b"/>`;
  return s;
};
ART.packing = (w,h,ob)=>{
  let s = building(w,h,{solar:1,solar2:1});
  s += `<rect x="${n(w*0.1)}" y="${n(h*0.68)}" width="${n(w*0.24)}" height="5" rx="1" fill="#a1743f"/>`;
  return s;
};

/* — commerce & tourism — */
ART.farm_stand = (w,h,ob)=>{
  let s = patch(w,h,'#8cb35f',37,1);
  s += `<rect x="3" y="${n(h*0.48)}" width="${n(w-6)}" height="${n(h*0.4)}" rx="2" fill="#16240c" opacity=".3"/>`;
  s += `<rect x="3" y="${n(h*0.46)}" width="${n(w-6)}" height="${n(h*0.36)}" rx="2" fill="url(#gTimber)"/>`;
  s += `<polygon points="1,${n(h*0.48)} ${n(w-1)},${n(h*0.48)} ${n(w*0.87)},${n(h*0.12)} ${n(w*0.13)},${n(h*0.12)}" fill="url(#gRoofRed)"/>`;
  s += `<polygon points="1,${n(h*0.48)} ${n(w-1)},${n(h*0.48)} ${n(w*0.87)},${n(h*0.3)} ${n(w*0.13)},${n(h*0.3)}" fill="#000" opacity=".16"/>`;
  const goods=['#e2603a','#efb43c','#6fb04a','#c8583f','#f2e07a','#9b6fc4'];
  for(let i=0;i<5;i++) s += `<circle cx="${n(8+i*((w-16)/4))}" cy="${n(h*0.6)}" r="2.4" fill="${goods[i%6]}"/>`;
  if(ob && ob.ready>0) s += `<circle class="pulse" cx="${n(w-6)}" cy="6" r="3.4" fill="#f0c14b"/>`;
  return s;
};
ART.tea_kiosk = (w,h)=>{
  let s = ART.farm_stand(w,h,null);
  s += `<circle cx="${n(w*0.5)}" cy="${n(h*0.62)}" r="3" fill="#f4efe1"/>`;
  return s;
};
ART.gift_shop = (w,h)=>{
  let s = building(w,h,{roof:'url(#gRoof)'});
  s += `<rect x="${n(w*0.28)}" y="${n(h*0.62)}" width="${n(w*0.42)}" height="5" rx="1" fill="url(#gGlass)"/>`;
  return s;
};
ART.glamping = (w,h)=>{
  const cx=w/2;
  let s = `<ellipse cx="${n(cx+2)}" cy="${n(h-4)}" rx="${n(w*0.42)}" ry="${n(h*0.13)}" fill="url(#gShadow)" opacity=".5"/>`;
  /* left flank is the shaded one, right flank faces the sun - same two
     polygons as before, now both on the canvas gradient */
  s += `<polygon points="${n(cx)},2 ${n(w-3)},${n(h-4)} 3,${n(h-4)}" fill="url(#gPlaster)"/>`;
  s += `<polygon points="${n(cx)},2 ${n(w-3)},${n(h-4)} ${n(cx)},${n(h-4)}" fill="#efe6cd"/>`;
  s += `<polygon points="${n(cx)},2 ${n(cx)},${n(h-4)} 3,${n(h-4)}" fill="var(--a-shadow)" opacity=".13"/>`;
  s += `<path d="M${n(cx)} ${n(h-4)} L${n(cx-w*0.12)} ${n(h*0.52)} L${n(cx+w*0.12)} ${n(h*0.52)} z" fill="#6d5b44"/>`;
  s += `<circle cx="${n(cx)}" cy="3" r="1.6" fill="var(--a-gold)"/>`;
  return s;
};
ART.dome = (w,h)=>{
  const cx=w/2, cy=h/2, R=Math.min(w,h)/2-1.5;
  let s = `<ellipse cx="${n(cx+2)}" cy="${n(cy+3)}" rx="${n(R)}" ry="${n(R*0.86)}" fill="url(#gShadow)" opacity=".55"/>`;
  s += `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(R)}" fill="url(#gGlass)"/>`;
  for(let i=0;i<6;i++){
    const a1=(i/6)*Math.PI*2, a2=((i+1)/6)*Math.PI*2;
    s += `<path d="M${n(cx)} ${n(cy)} L${n(cx+Math.cos(a1)*R)} ${n(cy+Math.sin(a1)*R)} L${n(cx+Math.cos(a2)*R)} ${n(cy+Math.sin(a2)*R)} z" fill="none" stroke="#89a6b0" stroke-width="0.9"/>`;
    s += `<line x1="${n(cx+Math.cos(a1)*R*0.5)}" y1="${n(cy+Math.sin(a1)*R*0.5)}" x2="${n(cx+Math.cos(a2)*R*0.5)}" y2="${n(cy+Math.sin(a2)*R*0.5)}" stroke="#89a6b0" stroke-width="0.9"/>`;
  }
  s += `<circle cx="${n(cx-R*0.3)}" cy="${n(cy-R*0.32)}" r="${n(R*0.26)}" fill="#fff" opacity=".5"/>`;
  s += `<rect x="${n(cx-R*0.85)}" y="${n(cy+R*0.62)}" width="${n(R*1.7)}" height="${n(R*0.34)}" rx="1.5" fill="url(#gTimber)"/>`;
  return s;
};
ART.deck = (w,h)=>{
  let s = ao(0,0,w,h,.26);
  s += `<rect x="0.5" y="1" width="${n(w-1)}" height="${n(h-2)}" rx="2.5" fill="#8e6b3e"/>`;
  s += `<rect x="0.5" y="0.5" width="${n(w-1)}" height="${n(h-3)}" rx="2.5" fill="url(#gTimber)"/>`;
  for(let i=4;i<w-1;i+=4.5) s += `<line x1="${n(i)}" y1="1" x2="${n(i)}" y2="${n(h-3)}" stroke="#00000030" stroke-width="0.9"/>`;
  s += `<rect x="${n(w*0.3)}" y="${n(h*0.3)}" width="${n(w*0.4)}" height="${n(h*0.36)}" rx="2" fill="#7fa9bd" opacity=".85"/>`;
  s += `<circle cx="${n(w*0.14)}" cy="${n(h*0.76)}" r="3.6" fill="#4f8a35"/>`;
  s += `<circle cx="${n(w*0.87)}" cy="${n(h*0.24)}" r="4" fill="#5f9c3d"/>`;
  return s;
};
ART.playground = (w,h)=>{
  let s = patch(w,h,'#93bd64',41,1);
  s += `<ellipse cx="${n(w*0.24)}" cy="${n(h*0.62)}" rx="${n(w*0.18)}" ry="${n(h*0.2)}" fill="#b9ab82"/>`;
  s += `<ellipse cx="${n(w*0.24)}" cy="${n(h*0.6)}" rx="${n(w*0.16)}" ry="${n(h*0.17)}" fill="#e0d3ac"/>`;
  s += `<g transform="translate(${n(w*0.05)},${n(h*0.08)})">${building(w*0.24,h*0.3,{roof:'url(#gRoofRed)'})}</g>`;
  s += `<path d="M${n(w*0.46)} ${n(h*0.7)} L${n(w*0.56)} ${n(h*0.2)} L${n(w*0.66)} ${n(h*0.7)}" stroke="#a8814f" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
  s += `<rect x="${n(w*0.52)}" y="${n(h*0.44)}" width="6.5" height="2.4" rx="1.2" fill="#c8583f"/>`;
  s += `<path d="M${n(w*0.76)} ${n(h*0.22)} L${n(w*0.9)} ${n(h*0.62)}" stroke="#4f93b5" stroke-width="4.5" fill="none" stroke-linecap="round"/>`;
  s += `<rect x="${n(w*0.72)}" y="${n(h*0.14)}" width="${n(w*0.1)}" height="${n(h*0.12)}" rx="1.5" fill="#efb43c"/>`;
  return s;
};
ART.firepit = (w,h)=>{
  const cx=w/2, cy=h/2, R=Math.min(w,h)*0.34;
  let s = patch(w,h,'#8cb35f',43,1);
  s += `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(R)}" fill="url(#gGravel)"/>`;
  for(let i=0;i<9;i++){ const a=(i/9)*Math.PI*2;
    s += `<circle cx="${n(cx+Math.cos(a)*R*0.82)}" cy="${n(cy+Math.sin(a)*R*0.82)}" r="2.4" fill="url(#gStone)"/>`; }
  s += `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(R*0.42)}" fill="#3a2f26"/>`;
  s += `<circle class="flame" cx="${n(cx)}" cy="${n(cy)}" r="${n(R*0.26)}" fill="#e8862e"/>`;
  s += `<circle class="flame" cx="${n(cx)}" cy="${n(cy-1)}" r="${n(R*0.14)}" fill="#f7d46a" style="animation-delay:.4s"/>`;
  return s;
};

/* — access & decor — */
ART.path   = (w,h)=> gravel(w,h,'rect',Math.min(w,h)*0.35);
ART.ring   = (w,h)=> gravel(w,h,'ring');
ART.parking= (w,h)=>{
  let s = gravel(w,h,'rect',2);
  for(let i=1;i<4;i++) s += `<line x1="${n(i*w/4)}" y1="3" x2="${n(i*w/4)}" y2="${n(h-3)}" stroke="#fff" stroke-width="1.2" opacity=".55"/>`;
  return s;
};
ART.hedge  = (w,h)=> hedge(w,h);
ART.fence  = (w,h)=> fence(w,h);
ART.gate   = (w,h)=>{
  let s = gravel(w,h*0.5,'rect',2).replace(/^/,`<g transform="translate(0,${n(h*0.45)})">`)+'</g>';
  s += `<rect x="${n(w*0.07)}" y="${n(h*0.18)}" width="5" height="${n(h*0.7)}" rx="2" fill="url(#gTimber)"/>`;
  s += `<rect x="${n(w*0.86)}" y="${n(h*0.18)}" width="5" height="${n(h*0.7)}" rx="2" fill="url(#gTimber)"/>`;
  s += `<path d="M${n(w*0.09)} ${n(h*0.22)} Q${n(w/2)} ${n(h*0.02)} ${n(w*0.89)} ${n(h*0.22)}" stroke="#8e6b3e" stroke-width="6" fill="none" stroke-linecap="round"/>`;
  s += `<path d="M${n(w*0.09)} ${n(h*0.21)} Q${n(w/2)} ${n(h*0.01)} ${n(w*0.89)} ${n(h*0.21)}" stroke="#bb8b57" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
  return s;
};
ART.sign = (w,h)=>{
  let s = patch(w,h,'#8cb35f',47,1);
  s += `<ellipse cx="${n(w/2+1.2)}" cy="${n(h*0.92)}" rx="4" ry="1.6" fill="url(#gShadow)" opacity=".6"/>`;
  s += `<rect x="${n(w/2-1.4)}" y="${n(h*0.5)}" width="2.8" height="${n(h*0.42)}" fill="var(--a-timber-d)"/>`;
  s += `<rect x="4" y="${n(h*0.16)}" width="${n(w-8)}" height="${n(h*0.36)}" rx="2" fill="url(#gPlaster)" stroke="var(--a-timber-d)" stroke-width="1.6"/>`;
  s += `<line x1="7" y1="${n(h*0.28)}" x2="${n(w-7)}" y2="${n(h*0.28)}" stroke="#9c8470" stroke-width="1.4"/>`;
  s += `<line x1="7" y1="${n(h*0.4)}" x2="${n(w-11)}" y2="${n(h*0.4)}" stroke="#9c8470" stroke-width="1.4"/>`;
  return s;
};
ART.tree_native = (w,h)=> conifer(w/2,h/2,Math.min(w,h)*0.42,3);
ART.tree_shade  = (w,h)=> canopy(w/2,h/2,Math.min(w,h)*0.44,'url(#gCanopy)',5,true);
ART.tree_olive  = (w,h)=> canopy(w/2,h/2,Math.min(w,h)*0.42,'url(#gCanopyO)',9,true);
ART.bench = (w,h)=>{
  let s = ao(0,0,w,h,.22);
  s += `<rect x="1" y="${n(h*0.38)}" width="${n(w-2)}" height="${n(h*0.3)}" rx="2" fill="#8e6b3e"/>`;
  s += `<rect x="1" y="${n(h*0.32)}" width="${n(w-2)}" height="${n(h*0.26)}" rx="2" fill="url(#gTimber)"/>`;
  return s;
};
ART.lights = (w,h)=>{
  let s = `<path d="M2 ${n(h*0.35)} Q${n(w/2)} ${n(h*0.9)} ${n(w-2)} ${n(h*0.35)}" stroke="#6d5b44" stroke-width="1" fill="none"/>`;
  for(let i=0;i<6;i++){
    const t=i/5, x=2+t*(w-4), y=(h*0.35)+Math.sin(Math.PI*t)*(h*0.45);
    s += `<circle class="twinkle" cx="${n(x)}" cy="${n(y)}" r="1.9" fill="#ffd97a" style="animation-delay:${(i*0.3).toFixed(1)}s"/>`;
  }
  return s;
};

/* — automation hub — */
ART.ai_hub = (w,h,ob)=>{
  const t = ob ? (ob.tier||0) : 0;
  let s = building(w,h,{roof:'url(#gRoof)',solar:1,skylight:1});
  s += `<rect x="${n(w*0.2)}" y="${n(h*0.56)}" width="${n(w*0.6)}" height="${n(h*0.16)}" rx="1.5" fill="#0e1c26"/>`;
  for(let i=0;i<5;i++)
    s += `<rect class="twinkle" style="animation-delay:${(i*0.3).toFixed(2)}s" x="${n(w*0.23+i*w*0.115)}" y="${n(h*0.59)}"
      width="${n(w*0.07)}" height="${n(h*0.09)}" fill="${i<=t?'#7cc24f':'#31465a'}"/>`;
  s += `<rect x="${n(w*0.48)}" y="${n(-h*0.2)}" width="1.8" height="${n(h*0.34)}" fill="#b9c2c7"/>`;
  s += `<circle class="pulse" cx="${n(w*0.49)}" cy="${n(-h*0.2)}" r="2.4" fill="#6fb6d8"/>`;
  for(let i=1;i<=3;i++)
    s += `<path d="M${n(w*0.49-5*i)} ${n(-h*0.15+2*i)} a ${5*i} ${5*i} 0 0 1 ${10*i} 0"
      stroke="#6fb6d8" stroke-width="0.8" fill="none" opacity="${(0.6-i*0.14).toFixed(2)}"/>`;
  return s;
};

/* — worker cottage — */
ART.worker_cottage = (w,h,ob)=>{
  let s = building(w*0.86, h*0.7, {roof:'url(#gRoofRed)', chimney:1});
  s = `<g transform="translate(${n(w*0.07)},${n(h*0.16)})">${s}</g>`;
  s += `<rect x="${n(w*0.14)}" y="${n(h*0.86)}" width="${n(w*0.72)}" height="${n(h*0.1)}" rx="2" fill="#c69a68"/>`;
  s += `<circle cx="${n(w*0.2)}" cy="${n(h*0.8)}" r="3.2" fill="#4f8a35"/>`;
  s += `<circle cx="${n(w*0.8)}" cy="${n(h*0.8)}" r="2.8" fill="#5f9c3d"/>`;
  /* washing line — the tell that somebody lives here */
  s += `<path d="M${n(w*0.1)} ${n(h*0.76)} Q ${n(w*0.5)} ${n(h*0.84)} ${n(w*0.9)} ${n(h*0.76)}" stroke="#8a7f6a" stroke-width="0.8" fill="none"/>`;
  ['#e8eef0','#c8583f','#e8c25a'].forEach((c,i)=>{
    s += `<rect class="sway" x="${n(w*(0.24+i*0.2))}" y="${n(h*0.78)}" width="5" height="7" rx="1" fill="${c}"
      style="transform-origin:${n(w*(0.24+i*0.2)+2.5)}px ${n(h*0.78)}px"/>`;
  });
  return s;
};
