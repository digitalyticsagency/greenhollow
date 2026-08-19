/* =====================================================================
   THE LAST TWELVE ROOMS

   p122 gave twenty-six buildings something under the roof. Twelve
   enclosed structures were still hollow: lift the roof off a shepherd's
   hut, a glamping tent, a tea kiosk or the dragon's roost and there was
   nothing in there at all, which is worse than not having the feature —
   it says the building is a prop.

   These are the ones that are genuinely rooms. Not everything on the
   missing list was: a swale, a windbreak, a drip line and a weather mast
   have no inside to draw, and giving them one would be a lie about what
   they are.

   TWO WIRING PATHS, AS BEFORE. p122 threads BUILDING_INSIDE through
   building() for anything drawn as a pitched volume, and wraps the whole
   art as a roof for the two that are not — the earth-mound cellar and the
   glass nursery. Measured which of these twelve is which: the cabin and
   the farm stand go through building() and take the threaded path; the
   other ten are tents, domes, boxes on posts and cabinets that never call
   building(), so they take the wrap.

   NOT THE RABBIT HUTCH. It looked like it belonged on the list and it did
   not: p53 has furnished animal shelters since it was written, through the
   same .shed-in group, and adding a second interior drew two sets of
   fittings on top of each other. Anything with an animal pen shelter is
   already someone else's job.

   THE FLOOR IS PART OF THE ANSWER. A tent has a groundsheet, a hut has
   boards, the roost has beaten earth and the kiosk has tiles, so the
   floor is drawn per building rather than from one grey rect. It is the
   quickest read of what kind of place you are looking into.
   ===================================================================== */

/* ---------- fittings p122 did not need ---------- */
const KIT2 = {
  /* a made bed, seen from above: pillow at the head, turned-down corner */
  bed(x, y, w, d, made){
    let s = `<rect x="${n(x+1)}" y="${n(y+1.3)}" width="${n(w)}" height="${n(d)}" rx="1.6" fill="#000000" opacity=".22"/>`;
    s += `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(d)}" rx="1.6" fill="#8d6f4c"/>`;
    s += `<rect x="${n(x+0.8)}" y="${n(y+0.8)}" width="${n(w-1.6)}" height="${n(d-1.6)}" rx="1.2"
      fill="${made ? '#cfd8de' : '#b9c3c9'}"/>`;
    s += `<rect x="${n(x+1.4)}" y="${n(y+1.2)}" width="${n(w-2.8)}" height="${n(d*0.26)}" rx="1"
      fill="#eef3f6"/>`;                                     /* pillow */
    if(!made)
      s += `<path d="M${n(x+w-1.4)} ${n(y+d*0.42)} l${n(-w*0.34)} ${n(d*0.2)} l${n(w*0.34)} 0 Z"
        fill="#e2e9ee" opacity=".9"/>`;                      /* turned down */
    return s;
  },
  /* bedroll on the ground, for a tent */
  bedroll(x, y, w, d, c){
    return `<ellipse cx="${n(x+w/2+0.8)}" cy="${n(y+d/2+1)}" rx="${n(w/2)}" ry="${n(d/2)}" fill="#000000" opacity=".2"/>`
      + `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(d)}" rx="${n(d/2)}" fill="${c || '#6f7f8c'}"/>`
      + `<rect x="${n(x+w*0.06)}" y="${n(y+d*0.18)}" width="${n(w*0.34)}" height="${n(d*0.64)}" rx="${n(d*0.32)}"
        fill="#e8eef2" opacity=".85"/>`;
  },
  /* a woven rug, because a room with a rug reads as lived in */
  rug(x, y, w, d, c1, c2){
    let s = `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(d)}" rx="1" fill="${c1 || '#8a5f4a'}"/>`;
    const bands = Math.max(2, Math.round(d/4));
    for(let i=1;i<bands;i+=2)
      s += `<rect x="${n(x)}" y="${n(y + d*i/bands)}" width="${n(w)}" height="${n(d/bands)}"
        fill="${c2 || '#b08268'}" opacity=".75"/>`;
    s += `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(d)}" rx="1" fill="none"
      stroke="#5c3f31" stroke-width="0.6" opacity=".6"/>`;
    return s;
  },
  /* a serving counter with a till on it */
  counter(x, y, w, d){
    return `<rect x="${n(x+1)}" y="${n(y+1.3)}" width="${n(w)}" height="${n(d)}" rx="1.2" fill="#000000" opacity=".22"/>`
      + `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(d)}" rx="1.2" fill="#7f5f3d"/>`
      + `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="1.4" rx="0.7" fill="#b08a5c"/>`
      + `<rect x="${n(x+w*0.62)}" y="${n(y+d*0.2)}" width="${n(w*0.26)}" height="${n(d*0.56)}" rx="1"
        fill="#5c646a"/>`
      + `<rect x="${n(x+w*0.66)}" y="${n(y+d*0.3)}" width="${n(w*0.18)}" height="${n(d*0.22)}" rx="0.6"
        fill="#cfe0ea" opacity=".9"/>`;
  },
  /* jars and produce in a row */
  jars(x, y, w, cnt, c){
    let s = '';
    const k = Math.min(7, Math.max(2, cnt || 4));
    for(let i=0;i<k;i++){
      const cx = x + w*(i+0.5)/k, r = Math.min(3.4, w/k*0.34);
      s += `<circle cx="${n(cx+0.5)}" cy="${n(y+0.6)}" r="${n(r)}" fill="#000000" opacity=".2"/>`;
      s += `<circle cx="${n(cx)}" cy="${n(y)}" r="${n(r)}" fill="${c || '#c9822f'}"/>`;
      s += `<circle cx="${n(cx)}" cy="${n(y)}" r="${n(r*0.62)}" fill="#e8b45c" opacity=".7"/>`;
      s += `<circle cx="${n(cx-r*0.3)}" cy="${n(y-r*0.32)}" r="${n(r*0.24)}" fill="#ffffff" opacity=".5"/>`;
    }
    return s;
  },
  /* a cash box, open */
  cashbox(x, y, w, d){
    return `<rect x="${n(x+0.8)}" y="${n(y+1)}" width="${n(w)}" height="${n(d)}" rx="1" fill="#000000" opacity=".22"/>`
      + `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(d)}" rx="1" fill="#6b5335"/>`
      + `<rect x="${n(x+1)}" y="${n(y+1)}" width="${n(w-2)}" height="${n(d-2)}" rx="0.8" fill="#3a2f1e"/>`
      + `<rect x="${n(x+w*0.2)}" y="${n(y+d*0.3)}" width="${n(w*0.24)}" height="${n(d*0.34)}" rx="0.5" fill="#c9a24a"/>`
      + `<rect x="${n(x+w*0.54)}" y="${n(y+d*0.32)}" width="${n(w*0.22)}" height="${n(d*0.3)}" rx="0.5" fill="#a8b0b6"/>`;
  },
  /* a server cabinet: stacked units, some with a light on */
  units(x, y, w, d, rows, seed){
    let s = `<rect x="${n(x+1)}" y="${n(y+1.2)}" width="${n(w)}" height="${n(d)}" rx="1.2" fill="#000000" opacity=".26"/>`;
    s += `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(d)}" rx="1.2" fill="#39424a"/>`;
    const k = Math.min(8, Math.max(3, rows || 5));
    for(let i=0;i<k;i++){
      const uy = y + 1.4 + i*(d-2.8)/k;
      s += `<rect x="${n(x+1.4)}" y="${n(uy)}" width="${n(w-2.8)}" height="${n((d-2.8)/k-1)}" rx="0.6"
        fill="#4e5a63"/>`;
      s += `<circle cx="${n(x+w-3.2)}" cy="${n(uy+((d-2.8)/k-1)/2)}" r="0.9"
        fill="${hash(seed+i) > 0.4 ? '#7cf0c0' : '#e2705c'}"/>`;
    }
    return s;
  },
  /* straw, heaped */
  straw(x, y, w, d, seed){
    let s = `<ellipse cx="${n(x+w/2)}" cy="${n(y+d/2)}" rx="${n(w/2)}" ry="${n(d/2)}" fill="#b9995c"/>`;
    for(let i=0;i<9;i++){
      const a = hash(seed+i)*Math.PI*2, r = hash(seed+i*2.3);
      const px = x + w/2 + Math.cos(a)*w*0.36*r, py = y + d/2 + Math.sin(a)*d*0.36*r;
      s += `<line x1="${n(px-2.4)}" y1="${n(py)}" x2="${n(px+2.4)}" y2="${n(py-1)}"
        stroke="#d8bd7c" stroke-width="0.8" opacity=".85"/>`;
    }
    return s;
  },
  /* a small hoard: what a dragon keeps */
  hoard(x, y, w, seed){
    let s = '';
    for(let i=0;i<7;i++){
      const cx = x + w*hash(seed+i), cy = y + 4*hash(seed+i*1.7);
      s += `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(1.4+hash(seed+i*3)*1.4)}"
        fill="${i%3 ? '#d8b45c' : '#c9d6dd'}" opacity=".95"/>`;
    }
    return s;
  },
  /* a dog basket with a blanket in it */
  basket(cx, cy, r){
    return `<ellipse cx="${n(cx+0.8)}" cy="${n(cy+1)}" rx="${n(r)}" ry="${n(r*0.8)}" fill="#000000" opacity=".22"/>`
      + `<ellipse cx="${n(cx)}" cy="${n(cy)}" rx="${n(r)}" ry="${n(r*0.8)}" fill="#a2793f"/>`
      + `<ellipse cx="${n(cx)}" cy="${n(cy)}" rx="${n(r*0.76)}" ry="${n(r*0.58)}" fill="#7d5a2c"/>`
      + `<ellipse cx="${n(cx)}" cy="${n(cy+r*0.06)}" rx="${n(r*0.62)}" ry="${n(r*0.44)}" fill="#8fa2b0"/>`
      + `<ellipse cx="${n(cx-r*0.2)}" cy="${n(cy-r*0.1)}" rx="${n(r*0.3)}" ry="${n(r*0.2)}" fill="#a9bcc8" opacity=".8"/>`;
  },
  /* a feed and water bowl */
  bowls(x, y, r){
    return `<circle cx="${n(x)}" cy="${n(y)}" r="${n(r)}" fill="#5c646a"/>`
      + `<circle cx="${n(x)}" cy="${n(y)}" r="${n(r*0.68)}" fill="#7f8b92"/>`
      + `<circle cx="${n(x+r*2.4)}" cy="${n(y)}" r="${n(r)}" fill="#5c646a"/>`
      + `<circle cx="${n(x+r*2.4)}" cy="${n(y)}" r="${n(r*0.68)}" fill="#6fa8c4"/>`;
  },
  /* hutch tiers with bedding */
  tiers(x, y, w, d, rows){
    let s = '';
    const k = Math.max(2, rows || 2);
    for(let i=0;i<k;i++){
      const ty = y + i*(d/k);
      s += `<rect x="${n(x)}" y="${n(ty)}" width="${n(w)}" height="${n(d/k-1.2)}" rx="1" fill="#8a6a42"/>`;
      s += `<rect x="${n(x+1)}" y="${n(ty+1)}" width="${n(w-2)}" height="${n(d/k-3.4)}" rx="0.8" fill="#c8b48a"/>`;
      s += `<rect x="${n(x+1)}" y="${n(ty+1)}" width="${n(w-2)}" height="1" fill="#ddcaa4" opacity=".9"/>`;
    }
    return s;
  },
};

/* ---------- floors, because a tent is not a workshop ---------- */
const FLOORS = {
  timber: (w,h)=>{
    let s = `<rect x="0" y="0" width="${n(w)}" height="${n(h)}" fill="#8a6a45"/>`;
    for(let i=1;i<Math.round(h/5);i++)
      s += `<line x1="0" y1="${n(i*5)}" x2="${n(w)}" y2="${n(i*5)}" stroke="#6f5333" stroke-width="0.5" opacity=".65"/>`;
    return s;
  },
  canvas: (w,h)=>`<rect x="0" y="0" width="${n(w)}" height="${n(h)}" fill="#7e8a76"/>`
    + `<rect x="0" y="0" width="${n(w)}" height="${n(h)}" fill="url(#gSoil)" opacity=".14"/>`,
  earth: (w,h)=>`<rect x="0" y="0" width="${n(w)}" height="${n(h)}" fill="#6d5a44"/>`
    + `<rect x="0" y="0" width="${n(w)}" height="${n(h)}" fill="url(#gSoil)" opacity=".3"/>`,
  tile: (w,h)=>{
    let s = `<rect x="0" y="0" width="${n(w)}" height="${n(h)}" fill="#b8b2a4"/>`;
    for(let i=1;i<Math.round(w/7);i++)
      s += `<line x1="${n(i*7)}" y1="0" x2="${n(i*7)}" y2="${n(h)}" stroke="#9a9488" stroke-width="0.5"/>`;
    for(let i=1;i<Math.round(h/7);i++)
      s += `<line x1="0" y1="${n(i*7)}" x2="${n(w)}" y2="${n(i*7)}" stroke="#9a9488" stroke-width="0.5"/>`;
    return s;
  },
  steel: (w,h)=>`<rect x="0" y="0" width="${n(w)}" height="${n(h)}" fill="#4a545c"/>`
    + `<rect x="0" y="0" width="${n(w)}" height="${n(h*0.4)}" fill="#ffffff" opacity=".05"/>`,
};

/* ---------- the twelve ---------- */
const INTERIORS2 = {
  /* a one-room cabin: bed, stove, table, a rug */
  cabin: { floor:'timber', art:(w,h)=>
    KIT2.bed(w*0.06, h*0.12, w*0.34, h*0.30, 1)
    + KIT.oven(w*0.62, h*0.12, w*0.30, h*0.24, 1)
    + KIT.table(w*0.36, h*0.62, h*0.13)
    + KIT2.rug(w*0.10, h*0.56, w*0.22, h*0.26)
    + KIT.shelf(w*0.60, h*0.46, w*0.32, h*0.14, 3) },

  /* the tent: two bedrolls and a lamp, nothing else fits */
  glamping: { floor:'canvas', art:(w,h)=>
    KIT2.bedroll(w*0.10, h*0.20, w*0.34, h*0.20, '#6f7f8c')
    + KIT2.bedroll(w*0.54, h*0.20, w*0.34, h*0.20, '#7d6f8c')
    + KIT2.rug(w*0.28, h*0.52, w*0.44, h*0.20, '#7a5f4a', '#a68266')
    + KIT.crate(w*0.08, h*0.62, h*0.14) },

  /* the dome: a bed, a stove and a wide view, so keep the middle clear */
  dome: { floor:'timber', art:(w,h)=>
    KIT2.bed(w*0.08, h*0.16, w*0.30, h*0.28, 1)
    + KIT.oven(w*0.72, h*0.20, w*0.20, h*0.20, 1)
    + KIT2.rug(w*0.34, h*0.52, w*0.32, h*0.26, '#6d5f7a', '#9182a6')
    + KIT.table(w*0.50, h*0.62, h*0.11) },

  /* a shepherd's hut is one bunk, one stove, one shelf, end of list */
  shepherd_hut: { floor:'timber', art:(w,h)=>
    KIT2.bed(w*0.06, h*0.14, w*0.42, h*0.26, 0)
    + KIT.oven(w*0.70, h*0.14, w*0.24, h*0.22, 1)
    + KIT.shelf(w*0.06, h*0.56, w*0.50, h*0.16, 5)
    + KIT2.jars(w*0.66, h*0.62, w*0.26, 3, '#a8613c') },

  /* the stand: a counter facing out and the produce behind it */
  farm_stand: { floor:'timber', art:(w,h)=>
    KIT2.counter(w*0.06, h*0.62, w*0.88, h*0.20)
    + KIT.crate(w*0.10, h*0.16, h*0.20)
    + KIT.crate(w*0.34, h*0.16, h*0.20)
    + KIT2.jars(w*0.62, h*0.26, w*0.30, 4, '#c9822f')
    + KIT2.cashbox(w*0.74, h*0.66, w*0.16, h*0.12) },

  /* the kiosk: an urn, cups and a counter */
  tea_kiosk: { floor:'tile', art:(w,h)=>
    KIT2.counter(w*0.06, h*0.58, w*0.88, h*0.22)
    + KIT.vat(w*0.22, h*0.28, h*0.14)
    + KIT2.jars(w*0.52, h*0.24, w*0.40, 5, '#d8b45c')
    + KIT.shelf(w*0.06, h*0.10, w*0.36, h*0.12, 7) },

  /* the honesty box: produce, a slot and the tin. No counter, that is the point */
  honesty_box: { floor:'timber', art:(w,h)=>
    KIT.crate(w*0.08, h*0.24, h*0.30)
    + KIT2.jars(w*0.40, h*0.34, w*0.36, 4, '#b8552f')
    + KIT2.cashbox(w*0.78, h*0.30, w*0.16, h*0.18)
    + KIT.shelf(w*0.08, h*0.66, w*0.84, h*0.16, 11) },

  /* the rack: cabinets and a patch panel */
  server_rack: { floor:'steel', art:(w,h)=>
    KIT2.units(w*0.08, h*0.12, w*0.34, h*0.72, 6, 2)
    + KIT2.units(w*0.52, h*0.12, w*0.34, h*0.72, 5, 9)
    + KIT.machine(w*0.08, h*0.88, w*0.78, h*0.08, 1) },

  /* the cabinet: switchgear and conduit, nothing living in here */
  inverter: { floor:'steel', art:(w,h)=>
    KIT2.units(w*0.10, h*0.16, w*0.36, h*0.60, 4, 5)
    + KIT.machine(w*0.54, h*0.16, w*0.34, h*0.34, 1)
    + KIT.machine(w*0.54, h*0.56, w*0.34, h*0.20, 0) },

  /* the kennel: a basket, two bowls and a chewed ball */
  kennel: { floor:'timber', art:(w,h)=>
    KIT2.basket(w*0.36, h*0.42, Math.min(w,h)*0.24)
    + KIT2.bowls(w*0.74, h*0.70, Math.min(w,h)*0.07)
    + KIT2.straw(w*0.08, h*0.62, w*0.22, h*0.22, 7)
    + `<circle cx="${n(w*0.16)}" cy="${n(h*0.26)}" r="${n(Math.min(w,h)*0.06)}" fill="#c9583f"/>` },

  /* the roost: beaten earth, a great deal of straw, and a hoard */
  dragon_roost: { floor:'earth', art:(w,h)=>
    KIT2.straw(w*0.12, h*0.20, w*0.62, h*0.52, 3)
    + KIT2.hoard(w*0.72, h*0.62, w*0.22, 11)
    + `<ellipse cx="${n(w*0.42)}" cy="${n(h*0.46)}" rx="${n(w*0.22)}" ry="${n(h*0.16)}"
        fill="#5c4a33" opacity=".55"/>` },
};

/* ---------- wiring ---------- */
let INTERIORS2_THREADED = [], INTERIORS2_WRAPPED = [];
(function wireMoreInteriors(){
  if(typeof ART !== 'object' || typeof INTERIORS !== 'object') return;
  Object.keys(INTERIORS2).forEach(name=>{
    const base = ART[name];
    if(typeof base !== 'function') return;
    if(INTERIORS[name]) return;                 /* never tread on p122's work */
    const spec = INTERIORS2[name];
    const inner = spec.art;

    /* does this one go through building()? then p122's own thread is all
       it needs, and the fittings land in the volume it already draws */
    let threaded = false;
    const keep = (typeof BUILDING_INSIDE !== 'undefined') ? BUILDING_INSIDE : null;
    /* building() only emits the fittings when Roof off is on, so the probe
       has to force it. Without that every one of these reads as untheaded
       at load time, when the setting is off by default, and a pitched
       building gets its floor drawn under the whole sprite rather than
       inside the volume. */
    let prevRoof;
    try{ settingsInit && settingsInit(); prevRoof = S.settings.roofOff; S.settings.roofOff = true; }catch(e){}
    try{
      BUILDING_INSIDE = ()=>'<!--PROBE2-->';
      threaded = ((base(120, 90, { tier:1, lvl:4 }) || '') + '').indexOf('<!--PROBE2-->') >= 0;
    }catch(e){}
    finally{
      BUILDING_INSIDE = keep;
      try{ if(prevRoof !== undefined) S.settings.roofOff = prevRoof; }catch(e){}
    }

    INTERIORS[name] = inner;

    if(threaded){
      /* building() emits one .shed-in per volume it draws, and some art
         draws two — the cabin has a porch as well as a room. BUILDING_INSIDE
         persists across both calls, so the same furniture was laid out
         twice, once in each. The fittings go in the first volume only;
         the porch keeps its floor and stays empty, which is what a porch is. */
      ART[name] = function(w, h, ob){
        let used = false;
        BUILDING_INSIDE = function(iw, ih){
          if(used) return '';
          used = true;
          try{ return inner(iw, ih) || ''; }catch(e){ return ''; }
        };
        try{ return base.call(this, w, h, ob); }
        finally{ BUILDING_INSIDE = null; }
      };
      INTERIORS2_THREADED.push(name);
    } else {
      /* the p122 pattern for things that are not pitched volumes: floor and
         fittings underneath, the whole of the original art as the roof */
      const floor = FLOORS[spec.floor] || FLOORS.timber;
      ART[name] = function(w, h, ob){
        const out = base.call(this, w, h, ob);
        if(!(typeof SET === 'function' && SET('roofOff'))) return out;
        const ix = 1, iy = 1, iw = Math.max(4, w-2), ih = Math.max(4, h-2);
        let s = `<g class="shed-in"><g transform="translate(${n(ix)},${n(iy)})">`;
        s += `<clipPath id="ic${name}"><rect x="0" y="0" width="${n(iw)}" height="${n(ih)}" rx="3"/></clipPath>`;
        s += `<g clip-path="url(#ic${name})">`;
        try{ s += floor(iw, ih); }catch(e){}
        s += `<rect x="0" y="0" width="${n(iw)}" height="2.4" fill="#000000" opacity=".30"/>`;
        try{ s += inner(iw, ih) || ''; }catch(e){}
        s += `</g></g></g>`;
        return s + `<g class="shed-roof">${out}</g>`;
      };
      INTERIORS2_WRAPPED.push(name);
    }
  });
})();

/* ---------- handle ---------- */
G.moreInteriorsAudit = function(){
  const drew = {};
  Object.keys(INTERIORS2).forEach(k=>{
    let bytes = 0;
    const had = (typeof SET === 'function') ? SET('roofOff') : false;
    try{
      settingsInit && settingsInit();
      const prev = S.settings.roofOff;
      S.settings.roofOff = true;
      bytes = (ART[k](120, 90, { tier:2, lvl:4 }) || '').length;
      S.settings.roofOff = prev;
    }catch(e){ bytes = -1; }
    drew[k] = bytes;
  });
  return {
    added: Object.keys(INTERIORS2).length,
    throughBuilding: INTERIORS2_THREADED,
    wrappedAsRoof: INTERIORS2_WRAPPED,
    interiorsNow: Object.keys(INTERIORS).filter(k=>typeof INTERIORS[k] === 'function').length,
    bytesWithRoofOff: drew,
    notRooms: 'swale, windbreak, drip, weather mast and the rest have no inside to draw',
  };
};
