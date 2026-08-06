/* =====================================================================
   UPGRADES YOU CAN SEE — each Mark rebuilds the structure, it does not
   just decorate it. Mk I is a shed; Mk IV is a plant.
   ===================================================================== */

/* The art functions are called without a tier argument all over the place,
   so we park it here for the duration of one draw. */
let ART_TIER = 0;
if(typeof drawObj === 'function'){
  const _drawObj = drawObj;
  drawObj = function(o){
    ART_TIER = (typeof tOf==='function') ? tOf(o) : 0;
    const out = _drawObj(o);
    ART_TIER = 0;
    return out;
  };
}
function curTier(o){
  if(o && typeof o.tier === 'number') return o.tier;
  return ART_TIER;
}

/* ---------------------------------------------------------------
   The building primitive, rebuilt per Mark.
   I — a plain gable shed
   II — a longer building with a lean-to wing and a clerestory
   III — a two-block works with a parapet, loading canopy and vents
   IV — a clad plant: glass atrium, full solar skin, gantry and mast
   --------------------------------------------------------------- */
const _buildingBase = building;
building = function(w, h, o){
  o = o || {};
  const tier = (o.tier !== undefined) ? o.tier : ART_TIER;
  if(!tier) return _buildingBase(w, h, o);

  const roof = o.roof || 'url(#gRoof)';
  let s = '';

  /* one shadow for the whole complex */
  s += `<rect x="${n(w*0.05)}" y="${n(h*0.09)}" width="${n(w*0.96)}" height="${n(h*0.94)}" rx="3"
    fill="#16240c" opacity=".34"/>`;

  if(tier === 1){
    /* main range plus a lean-to along the sunny side */
    s += `<g>${_buildingBase(w*0.74, h*0.9, {...o, tier:0, solar:1})}</g>`;
    s += `<g transform="translate(${n(w*0.70)},${n(h*0.28)})">
      ${_buildingBase(w*0.30, h*0.62, {...o, tier:0, roof:'#8d979d', skirt:3})}</g>`;
    /* clerestory ridge lights */
    for(let i=0;i<3;i++)
      s += `<rect x="${n(w*(0.16+i*0.18))}" y="${n(h*0.40)}" width="${n(w*0.11)}" height="${n(h*0.07)}"
        rx="1" fill="url(#gGlass)" stroke="#6e7d85" stroke-width="0.6"/>`;
    /* concrete apron */
    s += `<rect x="${n(w*0.06)}" y="${n(h*0.90)}" width="${n(w*0.66)}" height="${n(h*0.08)}" rx="1.5" fill="#b3ab9c"/>`;
  }

  if(tier === 2){
    /* two blocks joined by a glazed link, with a loading canopy */
    s += `<g>${_buildingBase(w*0.52, h*0.62, {...o, tier:0, solar:1, solar2:1})}</g>`;
    s += `<g transform="translate(${n(w*0.46)},${n(h*0.34)})">
      ${_buildingBase(w*0.54, h*0.66, {...o, tier:0, solar:1, solar2:1})}</g>`;
    s += `<rect x="${n(w*0.40)}" y="${n(h*0.44)}" width="${n(w*0.16)}" height="${n(h*0.22)}" rx="1.5"
      fill="url(#gGlass)" stroke="#7e929a" stroke-width="0.9"/>`;
    /* parapet band across the front */
    s += `<rect x="${n(w*0.02)}" y="${n(h*0.62)}" width="${n(w*0.50)}" height="${n(h*0.05)}" rx="1" fill="#c3ccd2"/>`;
    /* loading canopy on steel posts */
    s += `<rect x="${n(w*0.06)}" y="${n(h*0.70)}" width="${n(w*0.34)}" height="${n(h*0.14)}" rx="1.5" fill="#8d979d"/>`;
    s += `<rect x="${n(w*0.06)}" y="${n(h*0.70)}" width="${n(w*0.34)}" height="${n(h*0.05)}" rx="1.5" fill="#a9b3b9"/>`;
    [0.09,0.22,0.35].forEach(t=> s += `<rect x="${n(w*t)}" y="${n(h*0.84)}" width="2" height="${n(h*0.12)}" fill="#6e7d85"/>`);
    /* roof plant: vents and a silo */
    for(let i=0;i<4;i++)
      s += `<circle cx="${n(w*(0.60+i*0.09))}" cy="${n(h*0.42)}" r="${n(Math.min(w,h)*0.028)}" fill="#b6bfc4" stroke="#78848b" stroke-width="0.6"/>`;
    s += `<circle cx="${n(w*0.90)}" cy="${n(h*0.20)}" r="${n(Math.min(w,h)*0.09)}" fill="#cdd5d9" stroke="#87949b" stroke-width="1"/>`;
  }

  if(tier >= 3){
    /* a proper plant: podium, glass atrium, full solar skin, gantry */
    s += `<rect x="${n(w*0.02)}" y="${n(h*0.10)}" width="${n(w*0.96)}" height="${n(h*0.84)}" rx="3" fill="#5f6a70"/>`;
    s += `<rect x="${n(w*0.02)}" y="${n(h*0.10)}" width="${n(w*0.96)}" height="${n(h*0.30)}" rx="3" fill="#78848b"/>`;
    /* solar skin over the whole roof */
    s += panels(w*0.05, h*0.14, w*0.90, h*0.34, Math.max(5, Math.round(w/12)), 3);
    /* glazed atrium down the middle */
    s += `<rect x="${n(w*0.30)}" y="${n(h*0.50)}" width="${n(w*0.40)}" height="${n(h*0.36)}" rx="2"
      fill="url(#gGlass)" stroke="#8fa8b0" stroke-width="1"/>`;
    for(let i=1;i<4;i++)
      s += `<line x1="${n(w*(0.30+i*0.10))}" y1="${n(h*0.50)}" x2="${n(w*(0.30+i*0.10))}" y2="${n(h*0.86)}"
        stroke="#8fa8b0" stroke-width="0.8"/>`;
    /* service wings either side */
    s += `<rect x="${n(w*0.05)}" y="${n(h*0.52)}" width="${n(w*0.22)}" height="${n(h*0.34)}" rx="2" fill="#6e7a81"/>`;
    s += `<rect x="${n(w*0.73)}" y="${n(h*0.52)}" width="${n(w*0.22)}" height="${n(h*0.34)}" rx="2" fill="#6e7a81"/>`;
    /* gantry running the length of the roof */
    s += `<rect x="${n(w*0.05)}" y="${n(h*0.455)}" width="${n(w*0.90)}" height="2.4" rx="1.2" fill="#c3ccd2"/>`;
    for(let i=0;i<5;i++)
      s += `<rect x="${n(w*(0.10+i*0.19))}" y="${n(h*0.42)}" width="2" height="${n(h*0.05)}" fill="#9aa5ab"/>`;
    /* status strip */
    s += `<rect x="${n(w*0.32)}" y="${n(h*0.88)}" width="${n(w*0.36)}" height="${n(h*0.06)}" rx="1.5" fill="#0e1c26"/>`;
    for(let i=0;i<5;i++)
      s += `<rect class="twinkle" style="animation-delay:${(i*0.28).toFixed(2)}s"
        x="${n(w*(0.34+i*0.065))}" y="${n(h*0.895)}" width="${n(w*0.04)}" height="${n(h*0.03)}" fill="#7cc24f"/>`;
    /* stacks */
    [0.12,0.86].forEach(t=>{
      s += `<rect x="${n(w*t)}" y="${n(h*0.02)}" width="${n(w*0.045)}" height="${n(h*0.16)}" rx="1" fill="#aab4ba"/>`;
      s += `<rect x="${n(w*t)}" y="${n(h*0.02)}" width="${n(w*0.045)}" height="${n(h*0.04)}" rx="1" fill="#cdd5d9"/>`;
    });
    /* standing-seam cladding across the podium */
    for(let i=0;i<Math.max(6, Math.round(w/9)); i++){
      const x = w*0.03 + i*(w*0.94/Math.max(6, Math.round(w/9)));
      s += `<line x1="${n(x)}" y1="${n(h*0.50)}" x2="${n(x)}" y2="${n(h*0.92)}" stroke="#fff" stroke-opacity=".07" stroke-width="0.8"/>`;
      s += `<line x1="${n(x+1.2)}" y1="${n(h*0.50)}" x2="${n(x+1.2)}" y2="${n(h*0.92)}" stroke="#000" stroke-opacity=".12" stroke-width="0.8"/>`;
    }
    /* rooftop plant: chillers, ducting and a walkway */
    for(let i=0;i<3;i++)
      s += `<rect x="${n(w*(0.14+i*0.13))}" y="${n(h*0.155)}" width="${n(w*0.09)}" height="${n(h*0.10)}" rx="1.5"
        fill="#9aa5ab" stroke="#6e7d85" stroke-width="0.7"/>`;
    s += `<rect x="${n(w*0.60)}" y="${n(h*0.16)}" width="${n(w*0.28)}" height="${n(h*0.07)}" rx="3" fill="#b6bfc4"/>`;
    s += `<rect x="${n(w*0.05)}" y="${n(h*0.115)}" width="${n(w*0.90)}" height="1.6" fill="#c3ccd2" opacity=".7"/>`;
    /* access ladder and handrail */
    s += `<rect x="${n(w*0.955)}" y="${n(h*0.14)}" width="1.6" height="${n(h*0.34)}" fill="#9aa5ab"/>`;
    for(let i=0;i<5;i++)
      s += `<rect x="${n(w*0.945)}" y="${n(h*(0.17+i*0.06))}" width="3.6" height="1" fill="#9aa5ab"/>`;
    /* lit atrium glow at night */
    s += `<rect x="${n(w*0.30)}" y="${n(h*0.50)}" width="${n(w*0.40)}" height="${n(h*0.36)}" rx="2"
      fill="#ffe9b0" opacity=".16"/>`;
    /* company sign band */
    s += `<rect x="${n(w*0.05)}" y="${n(h*0.44)}" width="${n(w*0.90)}" height="${n(h*0.045)}" rx="1" fill="#2c3a42"/>`;
    s += `<rect x="${n(w*0.07)}" y="${n(h*0.452)}" width="${n(w*0.24)}" height="${n(h*0.022)}" rx="1" fill="#7cc24f" opacity=".85"/>`;
  }
  s += grain(0,0,w,h,0.08);
  return s;
};

/* ---------------------------------------------------------------
   The non-building structures grow too
   --------------------------------------------------------------- */
/* rain tanks: two, then four, then a bank with a pump house */
const _artTank = ART.tank;
ART.tank = (w,h,ob)=>{
  const t = curTier(ob);
  if(!t) return _artTank(w,h,ob);
  const cnt = t===1 ? 3 : t===2 ? 4 : 5;
  const rad = Math.min(h*0.44, (w/cnt)/2 - 1);
  let s = '';
  for(let i=0;i<cnt;i++){
    const cx=(w/cnt)*(i+0.5), cy=h*0.48;
    s += `<ellipse cx="${n(cx+2)}" cy="${n(cy+2.5)}" rx="${n(rad)}" ry="${n(rad*0.9)}" fill="#16240c" opacity=".34"/>`;
    s += `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(rad)}" fill="#2f4f2f"/>`;
    s += `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(rad-1.2)}" fill="url(#gTank)"/>`;
    for(let j=0;j<12;j++){ const a=(j/12)*Math.PI*2;
      s += `<line x1="${n(cx)}" y1="${n(cy)}" x2="${n(cx+Math.cos(a)*(rad-2))}" y2="${n(cy+Math.sin(a)*(rad-2))}" stroke="#3e6a3e" stroke-width="0.7" opacity=".7"/>`; }
    s += `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(rad*0.26)}" fill="#5f8a5c"/>`;
    s += `<path d="M${n(cx-rad*0.58)} ${n(cy-rad*0.5)} a ${n(rad*0.8)} ${n(rad*0.8)} 0 0 1 ${n(rad*0.9)} ${n(-rad*0.14)}" stroke="#fff" stroke-width="1.2" fill="none" opacity=".38"/>`;
  }
  /* manifold pipework along the base */
  s += `<rect x="${n(w*0.04)}" y="${n(h*0.88)}" width="${n(w*0.92)}" height="2.6" rx="1.3" fill="#8b949a"/>`;
  for(let i=0;i<cnt;i++)
    s += `<rect x="${n((w/cnt)*(i+0.5)-1)}" y="${n(h*0.78)}" width="2" height="${n(h*0.12)}" fill="#8b949a"/>`;
  if(t>=2){  /* pump house */
    s += `<g transform="translate(${n(w*0.80)},${n(h*0.04)})">${_buildingBase(w*0.18,h*0.3,{roof:'#8d979d',skirt:2})}</g>`;
  }
  if(t>=3){  /* filtration skid and a level readout */
    s += `<rect x="${n(w*0.04)}" y="${n(h*0.04)}" width="${n(w*0.2)}" height="${n(h*0.22)}" rx="2" fill="#5f6a70"/>`;
    s += `<circle class="pulse" cx="${n(w*0.14)}" cy="${n(h*0.15)}" r="2" fill="#6fb6d8"/>`;
  }
  if(ob){
    const lv = clamp(ob.store/(ob.cap||100), 0, 1);
    s += `<rect x="${n(w*0.16)}" y="${n(h-3.4)}" width="${n(w*0.68)}" height="2.6" rx="1.3" fill="#0e1a10" opacity=".8"/>`;
    s += `<rect x="${n(w*0.16)}" y="${n(h-3.4)}" width="${n(w*0.68*lv)}" height="2.6" rx="1.3" fill="#6fb6d8"/>`;
  }
  return s;
};

/* beds: more rows, then cloches, then a full poly-covered block */
const _artBed = ART.bed, _artBedL = ART.bed_large;
function tieredBed(base, rows){
  return (w,h,ob)=>{
    const t = curTier(ob);
    let s = base(w,h,ob);
    if(t>=1){  /* timber frame upgraded to raised sleepers with a path */
      s += `<rect x="0.5" y="0.5" width="${n(w-1)}" height="${n(h-2)}" rx="2" fill="none" stroke="#a8814f" stroke-width="2.2"/>`;
      s += `<rect x="1.6" y="1.6" width="${n(w-3.2)}" height="${n(h-4.2)}" rx="1.6" fill="none" stroke="#000" stroke-opacity=".22" stroke-width="1"/>`;
    }
    if(t>=2){  /* hoops and drip line */
      for(let i=0;i<Math.max(2,Math.round(w/26));i++){
        const x = 6 + i*((w-12)/Math.max(1,Math.round(w/26)-0+1));
        s += `<path d="M${n(x)} ${n(h-4)} q ${n((w/8))} ${n(-h*0.7)} ${n(w/4)} 0" stroke="#cfe0e6" stroke-width="1.1" fill="none" opacity=".75"/>`;
      }
      s += `<line x1="4" y1="${n(h*0.5)}" x2="${n(w-4)}" y2="${n(h*0.5)}" stroke="#3f6b8a" stroke-width="1" opacity=".7"/>`;
    }
    if(t>=3){  /* fully covered, climate controlled */
      s += `<rect x="1" y="1" width="${n(w-2)}" height="${n(h-3)}" rx="3" fill="url(#gGlass)" opacity=".5"/>`;
      s += `<rect x="1" y="1" width="${n(w-2)}" height="${n(h-3)}" rx="3" fill="none" stroke="#9db4bb" stroke-width="1.2"/>`;
      s += `<rect x="${n(w*0.36)}" y="${n(h-5)}" width="${n(w*0.28)}" height="3.4" rx="1.5" fill="#0e1c26"/>`;
      s += `<circle class="twinkle" cx="${n(w*0.5)}" cy="${n(h-3.3)}" r="1.2" fill="#7cc24f"/>`;
    }
    return s;
  };
}
ART.bed = tieredBed(_artBed);
ART.bed_large = tieredBed(_artBedL);

/* solar: more rows, then trackers, then a full array with an inverter shed */
const _artSolar = ART.solar_ground;
ART.solar_ground = (w,h,ob)=>{
  const t = curTier(ob);
  if(!t) return _artSolar(w,h,ob);
  let s = patch(w,h,'#87ad5c',12,1);
  const rows = 2 + t;
  for(let i=0;i<rows;i++){
    const y = 3 + i*((h-6)/rows);
    s += `<rect x="4" y="${n(y+3)}" width="${n(w-8)}" height="3" fill="#16240c" opacity=".3"/>`;
    s += panels(3, y, w-6, (h-8)/rows, Math.max(4, Math.round(w/10)), 1);
    if(t>=2)  /* tracker torque tube */
      s += `<rect x="3" y="${n(y+(h-8)/rows/2)}" width="${n(w-6)}" height="1.6" rx="0.8" fill="#9aa5ab"/>`;
  }
  if(t>=3){
    s += `<g transform="translate(${n(w*0.76)},${n(h*0.72)})">${_buildingBase(w*0.22,h*0.26,{roof:'#8d979d',skirt:2})}</g>`;
    s += `<circle class="pulse" cx="${n(w*0.87)}" cy="${n(h*0.78)}" r="2" fill="#7cc24f"/>`;
  }
  return s;
};

/* coop: bigger run, second house, then an aviary with a feed silo */
const _artCoop = ART.coop;
ART.coop = (w,h,ob)=>{
  const t = curTier(ob);
  if(!t) return _artCoop(w,h,ob);
  const cnt = ob ? Math.min(20, ob.animals||0) : 4;
  let s = paddock(w,h,'chicken',cnt,7,0.9);
  s += `<g transform="translate(${n(w*0.04)},${n(h*0.06)})">
    ${_buildingBase(w*0.40, h*0.44, {roof:'url(#gRoofRed)', solar:1})}</g>`;
  if(t>=1)
    s += `<g transform="translate(${n(w*0.48)},${n(h*0.06)})">
      ${_buildingBase(w*0.30, h*0.36, {roof:'url(#gRoofRed)'})}</g>`;
  if(t>=2){   /* covered run */
    s += `<rect x="${n(w*0.06)}" y="${n(h*0.54)}" width="${n(w*0.86)}" height="${n(h*0.38)}" rx="3"
      fill="none" stroke="#9db4bb" stroke-width="1.2" stroke-dasharray="3 2" opacity=".8"/>`;
    s += `<rect x="${n(w*0.82)}" y="${n(h*0.10)}" width="${n(w*0.13)}" height="${n(h*0.3)}" rx="2" fill="#b6bfc4"/>`;
    s += `<path d="M${n(w*0.825)} ${n(h*0.10)} l ${n(w*0.06)} ${n(-h*0.07)} l ${n(w*0.06)} ${n(h*0.07)} z" fill="#cdd5d9"/>`;
  }
  if(t>=3){   /* automated feed line and egg belt */
    s += `<rect x="${n(w*0.06)}" y="${n(h*0.50)}" width="${n(w*0.86)}" height="2" rx="1" fill="#c3ccd2"/>`;
    s += `<rect x="${n(w*0.30)}" y="${n(h*0.94)}" width="${n(w*0.4)}" height="3" rx="1.5" fill="#0e1c26"/>`;
    s += `<circle class="twinkle" cx="${n(w*0.5)}" cy="${n(h*0.955)}" r="1.2" fill="#f0c14b"/>`;
  }
  if(ob && ob.ready>0) s += `<circle class="pulse" cx="${n(w-6)}" cy="6" r="3.4" fill="#f0c14b"/>`;
  return s;
};

/* greenhouse: taller glass, then a gothic arch range, then a research house */
const _artGh = ART.greenhouse;
ART.greenhouse = (w,h,ob)=>{
  const t = curTier(ob);
  let s = _artGh(w,h,ob);
  if(t>=1){
    for(let i=0;i<3;i++)
      s += `<rect x="${n(w*(0.14+i*0.26))}" y="${n(h*0.04)}" width="${n(w*0.18)}" height="${n(h*0.08)}"
        rx="1" fill="#dff0f5" stroke="#8fa8b0" stroke-width="0.7"/>`;   // roof vents
  }
  if(t>=2){
    s += `<rect x="0" y="${n(h*0.46)}" width="${n(w)}" height="${n(h*0.06)}" fill="#c3ccd2" opacity=".85"/>`;
    s += `<g transform="translate(${n(w*0.02)},${n(h*0.74)})">${_buildingBase(w*0.2,h*0.24,{roof:'#8d979d',skirt:2})}</g>`;
  }
  if(t>=3){
    s += `<rect x="1" y="1" width="${n(w-2)}" height="${n(h-3)}" rx="2" fill="#7fd0ff" opacity=".10"/>`;
    for(let i=0;i<4;i++)
      s += `<rect class="twinkle" style="animation-delay:${(i*0.3).toFixed(2)}s"
        x="${n(w*(0.12+i*0.22))}" y="${n(h*0.30)}" width="${n(w*0.16)}" height="1.8" rx="0.9" fill="#ff9ec4" opacity=".8"/>`;  // grow lights
    s += `<rect x="${n(w*0.36)}" y="${n(h-5)}" width="${n(w*0.28)}" height="3.4" rx="1.5" fill="#0e1c26"/>`;
  }
  return s;
};

/* farm stand: stall, then a shop, then a farm shop with parking canopy */
const _artStand = ART.farm_stand;
ART.farm_stand = (w,h,ob)=>{
  const t = curTier(ob);
  if(!t) return _artStand(w,h,ob);
  let s = `<rect x="0" y="1" width="${n(w)}" height="${n(h-1)}" rx="3" fill="#9d9276"/>` +
          `<rect x="0" y="0" width="${n(w)}" height="${n(h-2)}" rx="3" fill="url(#gGravel)"/>`;
  for(let i=0;i<Math.min(40, Math.floor(w*h/90));i++)
    s += `<circle cx="${n(hash(i*1.7)*w)}" cy="${n(hash(i*3.1+5)*h)}" r="${n(0.5+hash(i)*0.9)}" fill="#8d8268" opacity=".5"/>`;
  s += `<g transform="translate(${n(w*0.04)},${n(h*0.04)})">
    ${_buildingBase(w*0.62, h*0.62, {roof:'url(#gRoofRed)', solar:t>=2?1:0})}</g>`;
  s += `<rect x="${n(w*0.08)}" y="${n(h*0.56)}" width="${n(w*0.54)}" height="${n(h*0.1)}" rx="1.5" fill="url(#gGlass)"/>`;
  const goods=['#e2603a','#efb43c','#6fb04a','#c8583f','#f2e07a','#9b6fc4'];
  for(let i=0;i<4+t;i++)
    s += `<circle cx="${n(w*0.10+i*(w*0.52/(4+t)))}" cy="${n(h*0.74)}" r="2.4" fill="${goods[i%6]}"/>`;
  if(t>=1)  /* awning */
    s += `<rect x="${n(w*0.06)}" y="${n(h*0.66)}" width="${n(w*0.58)}" height="${n(h*0.05)}" rx="1" fill="#c8583f"/>`;
  if(t>=2){ /* sign and a second counter */
    s += `<rect x="${n(w*0.68)}" y="${n(h*0.12)}" width="${n(w*0.28)}" height="${n(h*0.18)}" rx="2" fill="#f4efe1" stroke="#7d5931" stroke-width="1.4"/>`;
    s += `<line x1="${n(w*0.72)}" y1="${n(h*0.19)}" x2="${n(w*0.92)}" y2="${n(h*0.19)}" stroke="#9c8470" stroke-width="1.4"/>`;
    s += `<line x1="${n(w*0.72)}" y1="${n(h*0.24)}" x2="${n(w*0.88)}" y2="${n(h*0.24)}" stroke="#9c8470" stroke-width="1.4"/>`;
  }
  if(t>=3){ /* covered forecourt with lights */
    s += `<rect x="${n(w*0.66)}" y="${n(h*0.42)}" width="${n(w*0.30)}" height="${n(h*0.4)}" rx="2" fill="#8d979d" opacity=".85"/>`;
    s += `<rect x="${n(w*0.66)}" y="${n(h*0.42)}" width="${n(w*0.30)}" height="${n(h*0.06)}" rx="2" fill="#a9b3b9"/>`;
    [0.70,0.90].forEach(t2=> s += `<rect x="${n(w*t2)}" y="${n(h*0.80)}" width="2" height="${n(h*0.16)}" fill="#6e7d85"/>`);
    s += `<circle class="twinkle" cx="${n(w*0.81)}" cy="${n(h*0.50)}" r="1.6" fill="#ffd97a"/>`;
  }
  if(ob && ob.ready>0) s += `<circle class="pulse" cx="${n(w-6)}" cy="6" r="3.4" fill="#f0c14b"/>`;
  return s;
};

/* the old overlay was fighting the new geometry — keep only the Mk badge glow */
tierSkin = function(w,h,tier){
  if(!tier) return '';
  if(tier < 3) return '';
  return `<circle class="pulse" cx="${n(w-5)}" cy="5" r="2.4" fill="#f0c14b" opacity=".9"/>`;
};

/* ---------------------------------------------------------------
   Show the player what they are buying: current vs next, side by side
   --------------------------------------------------------------- */
function tierPreview(o, tier){
  const bp = BPMAP[o.bp];
  const fn = ART[bp.art] || ART.shed;
  const w = bp.w*T, h = bp.h*T;
  const sc = Math.min(72/w, 54/h, 1.4);
  const prev = ART_TIER; ART_TIER = tier;
  let art = '';
  try { art = fn(w, h, {...o, tier}); } catch(e){ art = ''; }
  ART_TIER = prev;
  return `<svg viewBox="0 0 ${w} ${h}" width="${n(w*sc)}" height="${n(h*sc)}">${DEFS()}${art}</svg>`;
}
if(typeof inspHTML === 'function'){
  const _insp = inspHTML;
  inspHTML = function(){
    let h = _insp();
    const o = S.objs.find(z=>z.id===sel);
    if(!o || !canUpgrade(o)) return h;
    const nt = tOf(o)+1;
    const card = `<div class="card" style="margin:0 0 8px">
      <div class="eyebrow">What ${TIERS[nt].n} looks like</div>
      <div class="tierprev">
        <span><i>${tierPreview(o, tOf(o))}</i><small>${TIERS[tOf(o)].n} now</small></span>
        <span class="arrow">→</span>
        <span><i>${tierPreview(o, nt)}</i><small style="color:${TIERS[nt].col}">${TIERS[nt].n}</small></span>
      </div></div>`;
    /* slot it just above the upgrade button */
    return h.replace('<button class="act primary full"', card + '<button class="act primary full"');
  };
}

(function tierCss(){
  const st = document.createElement('style');
  st.textContent = `
  .tierprev{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:6px;}
  .tierprev > span{display:flex;flex-direction:column;align-items:center;gap:4px;flex:1;min-width:0;}
  .tierprev i{display:flex;align-items:center;justify-content:center;height:56px;width:100%;
    background:rgba(0,0,0,.28);border-radius:10px;border:.5px solid var(--hair);
    filter:drop-shadow(1px 2px 2px rgba(0,0,0,.45));}
  .tierprev small{font-size:9.5px;color:var(--txt3);font-weight:600;}
  .tierprev .arrow{flex:0 0 auto;color:var(--txt3);font-size:14px;}`;
  document.head.appendChild(st);
})();
