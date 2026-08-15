/* =====================================================================
   LIFT THE ROOF AND THERE IS SOMETHING UNDER IT

   The Roof button has existed since p31. Until now it worked in exactly
   two places: the house, which has furnished rooms, and the animal pens,
   which show the stock inside. Measured across ten working buildings —
   dairy, bakery, workshop, cidery, smokehouse, cafe, packing, kitchen,
   wool shed, gift shop — nought of ten had a liftable roof. Lifting the
   roof on a bakery showed you the roof.

   The reason is that all twenty-eight of them are drawn by the single
   building() primitive in p2, which never emitted the .shed-roof /
   .shed-in pair the pen art has used since p53. That is now fixed in
   building() itself, so the mechanism arrives for all of them at once,
   and this file supplies what each one actually has inside.

   WHY IT IS WORTH THE TROUBLE. The buildings are near enough identical
   from above — measured at 57% shared shape vocabulary at Mk I, rising to
   82% at Mk IV. A bakery and a wool shed are the same rectangle in
   different colours. The inside is where they differ: an oven and proving
   racks, or a sorting table and fleece bales. This is the cheapest
   identity available, because the silhouette does not have to change.

   COST. Interiors are only drawn while the roof is up. An interior nobody
   can see is pure string length, and the whole foreground SVG is
   re-serialised every render, so the normal case pays nothing at all.
   The trade is that the reveal is instant rather than a quarter-second
   fade, because the art and the class land in the same frame.
   ===================================================================== */

/* ---------- a small kit, all of it aerial and lit from upper-left ---------- */
const KIT = {
  /* timber worktop */
  bench(x, y, w, d){
    return `<rect x="${n(x+1)}" y="${n(y+1.4)}" width="${n(w)}" height="${n(d)}" rx="1.2" fill="#000000" opacity=".22"/>`
      + `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(d)}" rx="1.2" fill="#9a7748"/>`
      + `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="1.5" rx="0.7" fill="#c4a071"/>`;
  },
  /* shelving: a run of boards with things on them */
  shelf(x, y, w, d, seed){
    let s = `<rect x="${n(x+1)}" y="${n(y+1.2)}" width="${n(w)}" height="${n(d)}" rx="1" fill="#000000" opacity=".20"/>`
      + `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(d)}" rx="1" fill="#7d6449"/>`
      + `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="1.2" fill="#a58a63"/>`;
    const cnt = Math.max(2, Math.round(w/9));
    for(let i=0;i<cnt;i++)
      s += `<rect x="${n(x+2+i*(w-3)/cnt)}" y="${n(y+1.6)}" width="${n((w-3)/cnt-2)}" height="${n(d-3)}" rx="0.6"
        fill="#d8cbb0" opacity="${(0.5+hash(seed+i)*0.4).toFixed(2)}"/>`;
    return s;
  },
  /* steel tank from above */
  vat(cx, cy, r){
    return `<ellipse cx="${n(cx+1)}" cy="${n(cy+1.2)}" rx="${n(r)}" ry="${n(r*0.9)}" fill="#000000" opacity=".24"/>`
      + `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" fill="#9aa6ac"/>`
      + `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r*0.74)}" fill="#c3ccd2"/>`
      + `<circle cx="${n(cx-r*0.3)}" cy="${n(cy-r*0.32)}" r="${n(r*0.26)}" fill="#ffffff" opacity=".45"/>`;
  },
  /* wooden barrel from above */
  barrel(cx, cy, r){
    return `<ellipse cx="${n(cx+0.8)}" cy="${n(cy+1)}" rx="${n(r)}" ry="${n(r*0.9)}" fill="#000000" opacity=".24"/>`
      + `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" fill="#7a5433"/>`
      + `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r*0.78)}" fill="#9a6d44"/>`
      + `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r*0.3)}" fill="#5f4127"/>`;
  },
  /* stacked crate */
  crate(x, y, s0){
    return `<rect x="${n(x+0.8)}" y="${n(y+1)}" width="${n(s0)}" height="${n(s0*0.8)}" rx="0.8" fill="#000000" opacity=".22"/>`
      + `<rect x="${n(x)}" y="${n(y)}" width="${n(s0)}" height="${n(s0*0.8)}" rx="0.8" fill="#a8813f"/>`
      + `<rect x="${n(x)}" y="${n(y)}" width="${n(s0)}" height="${n(s0*0.24)}" rx="0.8" fill="#c39d5c"/>`
      + `<line x1="${n(x+s0*0.5)}" y1="${n(y)}" x2="${n(x+s0*0.5)}" y2="${n(y+s0*0.8)}" stroke="#6f5427" stroke-width="0.7"/>`;
  },
  /* a sack, slumped */
  sack(cx, cy, r){
    return `<ellipse cx="${n(cx+0.8)}" cy="${n(cy+1)}" rx="${n(r)}" ry="${n(r*0.72)}" fill="#000000" opacity=".22"/>`
      + `<ellipse cx="${n(cx)}" cy="${n(cy)}" rx="${n(r)}" ry="${n(r*0.72)}" fill="#c8b48a"/>`
      + `<ellipse cx="${n(cx-r*0.22)}" cy="${n(cy-r*0.2)}" rx="${n(r*0.5)}" ry="${n(r*0.34)}" fill="#ddcaa4" opacity=".8"/>`;
  },
  /* a machine: grey body, dark panel, one indicator */
  machine(x, y, w, d, lit){
    return `<rect x="${n(x+1)}" y="${n(y+1.4)}" width="${n(w)}" height="${n(d)}" rx="1.4" fill="#000000" opacity=".24"/>`
      + `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(d)}" rx="1.4" fill="#8d979d"/>`
      + `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="1.6" rx="0.8" fill="#c3ccd2"/>`
      + `<rect x="${n(x+w*0.18)}" y="${n(y+d*0.30)}" width="${n(w*0.64)}" height="${n(d*0.40)}" rx="0.8" fill="#3b444a"/>`
      + (lit ? `<circle cx="${n(x+w*0.86)}" cy="${n(y+d*0.5)}" r="1.4" fill="#7cc24f"/>` : '');
  },
  /* brick oven or firebox, with a mouth that glows */
  oven(x, y, w, d, glow){
    return `<rect x="${n(x+1)}" y="${n(y+1.4)}" width="${n(w)}" height="${n(d)}" rx="1.6" fill="#000000" opacity=".26"/>`
      + `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(d)}" rx="1.6" fill="#8a5b47"/>`
      + `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="1.8" rx="0.9" fill="#a9755b"/>`
      + `<rect x="${n(x+w*0.22)}" y="${n(y+d*0.34)}" width="${n(w*0.56)}" height="${n(d*0.40)}" rx="1" fill="#2a1b12"/>`
      + (glow ? `<rect x="${n(x+w*0.28)}" y="${n(y+d*0.42)}" width="${n(w*0.44)}" height="${n(d*0.24)}" rx="0.8" fill="#e8862e" opacity=".85"/>` : '');
  },
  /* a bed seen from above */
  bunk(x, y, w, d){
    return `<rect x="${n(x+0.8)}" y="${n(y+1.2)}" width="${n(w)}" height="${n(d)}" rx="1.4" fill="#000000" opacity=".20"/>`
      + `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(d)}" rx="1.4" fill="#6f7f8c"/>`
      + `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(d*0.34)}" rx="1.4" fill="#e6e0d2"/>`
      + `<rect x="${n(x+w*0.12)}" y="${n(y+d*0.06)}" width="${n(w*0.76)}" height="${n(d*0.20)}" rx="1" fill="#fbf7ee"/>`;
  },
  /* a round table with chairs */
  table(cx, cy, r){
    let s = `<ellipse cx="${n(cx+0.8)}" cy="${n(cy+1)}" rx="${n(r)}" ry="${n(r*0.9)}" fill="#000000" opacity=".20"/>`
      + `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" fill="#a8804c"/>`
      + `<circle cx="${n(cx-r*0.22)}" cy="${n(cy-r*0.22)}" r="${n(r*0.52)}" fill="#c19b62" opacity=".7"/>`;
    for(let i=0;i<3;i++){ const a=(i/3)*6.28+0.6;
      s += `<circle cx="${n(cx+Math.cos(a)*r*1.6)}" cy="${n(cy+Math.sin(a)*r*1.5)}" r="${n(r*0.42)}" fill="#6f5a3f"/>`; }
    return s;
  },
  /* a stacked bale */
  bale(x, y, w, d){
    return `<rect x="${n(x+0.8)}" y="${n(y+1)}" width="${n(w)}" height="${n(d)}" rx="1" fill="#000000" opacity=".20"/>`
      + `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(d)}" rx="1" fill="url(#gStraw)"/>`
      + `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="1.3" rx="0.6" fill="#ffffff" opacity=".28"/>`
      + `<line x1="${n(x+w*0.34)}" y1="${n(y)}" x2="${n(x+w*0.34)}" y2="${n(y+d)}" stroke="#8a7442" stroke-width="0.7"/>`;
  },
  /* seed trays / growing racks */
  trays(x, y, w, d, seed, col){
    let s = '';
    const rows = 2, cols = Math.max(2, Math.round(w/14));
    for(let r=0;r<rows;r++) for(let c=0;c<cols;c++){
      const tx = x + c*(w/cols), ty = y + r*(d/rows);
      s += `<rect x="${n(tx)}" y="${n(ty)}" width="${n(w/cols-1.6)}" height="${n(d/rows-1.6)}" rx="0.8" fill="#5d4a34"/>`;
      s += `<rect x="${n(tx+0.8)}" y="${n(ty+0.8)}" width="${n(w/cols-3.2)}" height="${n(d/rows-3.2)}" rx="0.6"
        fill="${col || '#6ea63f'}" opacity="${(0.55+hash(seed+r*3+c)*0.4).toFixed(2)}"/>`;
    }
    return s;
  },
  /* things hung from the rafters */
  hanging(x, y, w, cnt, col){
    let s = `<line x1="${n(x)}" y1="${n(y)}" x2="${n(x+w)}" y2="${n(y)}" stroke="#5a4a38" stroke-width="1.4"/>`;
    for(let i=0;i<cnt;i++){
      const hx = x + 3 + i*((w-6)/Math.max(1,cnt-1));
      s += `<ellipse cx="${n(hx+0.6)}" cy="${n(y+4.6)}" rx="2.6" ry="3.6" fill="#000000" opacity=".2"/>`;
      s += `<ellipse cx="${n(hx)}" cy="${n(y+4)}" rx="2.4" ry="3.4" fill="${col}"/>`;
    }
    return s;
  },
};

/* ---------- what is in each one ----------
   Fractions of the interior box, so they hold at every building size. */
const INTERIORS = {
  shed:        (w,h)=> KIT.bench(w*0.06,h*0.14,w*0.44,h*0.16) + KIT.crate(w*0.60,h*0.16,h*0.22)
                     + KIT.crate(w*0.60,h*0.50,h*0.22) + KIT.shelf(w*0.06,h*0.62,w*0.44,h*0.18,3),
  workshop:    (w,h)=> KIT.bench(w*0.06,h*0.12,w*0.52,h*0.16) + KIT.machine(w*0.64,h*0.14,w*0.28,h*0.30,1)
                     + KIT.shelf(w*0.06,h*0.60,w*0.52,h*0.20,7) + KIT.crate(w*0.68,h*0.62,h*0.22),
  cellar:      (w,h)=> [0,1,2].map(i=>KIT.barrel(w*(0.20+i*0.30), h*0.30, h*0.15)).join('')
                     + [0,1,2].map(i=>KIT.barrel(w*(0.20+i*0.30), h*0.72, h*0.15)).join(''),
  packing:     (w,h)=> KIT.bench(w*0.06,h*0.36,w*0.62,h*0.20) + KIT.machine(w*0.72,h*0.14,w*0.22,h*0.24,1)
                     + KIT.crate(w*0.08,h*0.66,h*0.20) + KIT.crate(w*0.34,h*0.66,h*0.20) + KIT.crate(w*0.60,h*0.66,h*0.20),
  dairy:       (w,h)=> KIT.vat(w*0.24,h*0.32,h*0.17) + KIT.vat(w*0.56,h*0.32,h*0.17)
                     + KIT.bench(w*0.08,h*0.64,w*0.56,h*0.16) + KIT.machine(w*0.76,h*0.58,w*0.18,h*0.26,1),
  kitchen:     (w,h)=> KIT.oven(w*0.06,h*0.14,w*0.32,h*0.28) + KIT.bench(w*0.44,h*0.16,w*0.48,h*0.18)
                     + KIT.table(w*0.36,h*0.68,h*0.13) + KIT.shelf(w*0.66,h*0.60,w*0.28,h*0.18,4),
  honey_lab:   (w,h)=> KIT.vat(w*0.24,h*0.30,h*0.16) + KIT.bench(w*0.46,h*0.20,w*0.46,h*0.16)
                     + KIT.shelf(w*0.10,h*0.64,w*0.80,h*0.20,11),
  gift_shop:   (w,h)=> KIT.bench(w*0.10,h*0.66,w*0.62,h*0.16) + KIT.shelf(w*0.06,h*0.12,w*0.40,h*0.20,2)
                     + KIT.shelf(w*0.52,h*0.12,w*0.40,h*0.20,5) + KIT.crate(w*0.78,h*0.62,h*0.20),
  nursery:     (w,h)=> KIT.trays(w*0.06,h*0.12,w*0.88,h*0.36,3,'#7cc24f')
                     + KIT.trays(w*0.06,h*0.56,w*0.88,h*0.34,9,'#8fd45c'),
  worker_cottage:(w,h)=> KIT.bunk(w*0.08,h*0.14,w*0.34,h*0.30) + KIT.table(w*0.68,h*0.32,h*0.13)
                     + KIT.oven(w*0.60,h*0.66,w*0.30,h*0.22,1) + KIT.shelf(w*0.08,h*0.62,w*0.40,h*0.18,6),
  ai_hub:      (w,h)=> KIT.machine(w*0.08,h*0.14,w*0.20,h*0.60,1) + KIT.machine(w*0.34,h*0.14,w*0.20,h*0.60,1)
                     + KIT.bench(w*0.62,h*0.30,w*0.30,h*0.16),
  mushroom_shed:(w,h)=> KIT.trays(w*0.06,h*0.12,w*0.88,h*0.34,5,'#b9a98c')
                     + KIT.trays(w*0.06,h*0.54,w*0.88,h*0.34,8,'#a8977a'),
  hay_barn:    (w,h)=> [0,1,2].map(i=>KIT.bale(w*(0.06+i*0.31), h*0.14, w*0.26, h*0.34)).join('')
                     + [0,1].map(i=>KIT.bale(w*(0.16+i*0.36), h*0.56, w*0.30, h*0.32)).join(''),
  bakery:      (w,h)=> KIT.oven(w*0.06,h*0.12,w*0.36,h*0.34,1) + KIT.bench(w*0.48,h*0.16,w*0.44,h*0.18)
                     + KIT.shelf(w*0.06,h*0.60,w*0.86,h*0.22,2) + KIT.sack(w*0.14,h*0.90,h*0.08),
  smokehouse:  (w,h)=> KIT.oven(w*0.34,h*0.70,w*0.32,h*0.22,1) + KIT.hanging(w*0.10,h*0.20,w*0.80,5,'#a8613c')
                     + KIT.hanging(w*0.10,h*0.44,w*0.80,4,'#94512f'),
  cidery:      (w,h)=> KIT.machine(w*0.08,h*0.14,w*0.32,h*0.32,0) + KIT.vat(w*0.68,h*0.28,h*0.16)
                     + [0,1,2].map(i=>KIT.barrel(w*(0.16+i*0.28), h*0.74, h*0.14)).join(''),
  wool_shed:   (w,h)=> KIT.bench(w*0.08,h*0.16,w*0.56,h*0.20) + KIT.bale(w*0.70,h*0.12,w*0.24,h*0.30)
                     + KIT.bale(w*0.70,h*0.52,w*0.24,h*0.30) + KIT.sack(w*0.22,h*0.72,h*0.11)
                     + KIT.sack(w*0.44,h*0.74,h*0.10),
  candle_room: (w,h)=> KIT.vat(w*0.22,h*0.30,h*0.15) + KIT.vat(w*0.50,h*0.30,h*0.15)
                     + KIT.hanging(w*0.10,h*0.62,w*0.80,7,'#f0e0b0') + KIT.bench(w*0.68,h*0.16,w*0.26,h*0.16),
  cafe:        (w,h)=> KIT.bench(w*0.06,h*0.12,w*0.52,h*0.16) + KIT.table(w*0.26,h*0.56,h*0.12)
                     + KIT.table(w*0.66,h*0.40,h*0.12) + KIT.table(w*0.72,h*0.78,h*0.11),
  bunkhouse:   (w,h)=> [0,1,2].map(i=>KIT.bunk(w*(0.06+i*0.31), h*0.12, w*0.26, h*0.32)).join('')
                     + [0,1,2].map(i=>KIT.bunk(w*(0.06+i*0.31), h*0.56, w*0.26, h*0.32)).join(''),
  bunk_annexe: (w,h)=> KIT.bunk(w*0.08,h*0.14,w*0.36,h*0.32) + KIT.bunk(w*0.54,h*0.14,w*0.36,h*0.32)
                     + KIT.shelf(w*0.20,h*0.64,w*0.56,h*0.18,4),
  laundry:     (w,h)=> KIT.machine(w*0.08,h*0.16,w*0.24,h*0.30,1) + KIT.machine(w*0.38,h*0.16,w*0.24,h*0.30,0)
                     + KIT.vat(w*0.80,h*0.30,h*0.15) + KIT.hanging(w*0.10,h*0.68,w*0.80,6,'#e8eef2'),
  mud_room:    (w,h)=> KIT.bench(w*0.08,h*0.20,w*0.50,h*0.16) + KIT.shelf(w*0.08,h*0.58,w*0.50,h*0.20,1)
                     + KIT.crate(w*0.68,h*0.22,h*0.22) + KIT.crate(w*0.68,h*0.60,h*0.22),
  guest_wing:  (w,h)=> KIT.bunk(w*0.08,h*0.16,w*0.34,h*0.30) + KIT.bunk(w*0.56,h*0.16,w*0.34,h*0.30)
                     + KIT.table(w*0.50,h*0.72,h*0.12),
  root_store:  (w,h)=> [0,1,2].map(i=>KIT.crate(w*(0.08+i*0.30), h*0.16, h*0.26)).join('')
                     + [0,1,2].map(i=>KIT.sack(w*(0.18+i*0.30), h*0.72, h*0.11)).join(''),
};

/* The diesel backup, the inverter and the server rack are deliberately not
   in that list. They are 2×2 pieces of equipment rather than buildings you
   go inside, they are not drawn by building(), and fittings for them would
   be code that can never run. */

/* These two are working stores that are also not drawn by building() — the
   cellar is an earth mound and the nursery is glass — so they get the two
   layers wrapped round their own art instead. */
const ODD_INTERIORS = ['cellar', 'nursery'];

/* ---------- hand each art function its own fittings ----------
   building() reads BUILDING_INSIDE (declared in p2) for the duration of
   one call. Threading it this way rather than as an option means the
   twenty-eight art functions in p3 and p67 do not each have to be
   rewritten to pass something they were never written to know about.
   try/finally so a throw inside the art cannot leave it set. */
(function wireInteriors(){
  if(typeof ART !== 'object') return;
  let wired = 0;
  Object.keys(INTERIORS).forEach(art=>{
    const base = ART[art];
    if(typeof base !== 'function' || ODD_INTERIORS.includes(art)) return;
    ART[art] = function(w, h, ob){
      BUILDING_INSIDE = INTERIORS[art];
      try{ return base.call(this, w, h, ob); }
      finally{ BUILDING_INSIDE = null; }
    };
    wired++;
  });

  /* the mound and the glasshouse: whole art becomes the roof, floor under it */
  ODD_INTERIORS.forEach(art=>{
    const base = ART[art];
    if(typeof base !== 'function' || typeof INTERIORS[art] !== 'function') return;
    ART[art] = function(w, h, ob){
      const out = base.call(this, w, h, ob);
      if(!(typeof SET === 'function' && SET('roofOff'))) return out;
      const ix = 1, iy = 1, iw = w-2, ih = h-2;
      let s = `<g class="shed-in">`;
      s += `<rect x="${n(ix)}" y="${n(iy)}" width="${n(iw)}" height="${n(ih)}" rx="3" fill="#6d635a"/>`;
      s += `<rect x="${n(ix)}" y="${n(iy)}" width="${n(iw)}" height="${n(ih)}" rx="3" fill="url(#gSoil)" opacity=".22"/>`;
      s += `<rect x="${n(ix)}" y="${n(iy)}" width="${n(iw)}" height="2.4" fill="#000000" opacity=".30"/>`;
      let inner = '';
      try{ inner = INTERIORS[art](iw, ih) || ''; }catch(e){ inner = ''; }
      if(inner) s += `<g transform="translate(${n(ix)},${n(iy)})">${inner}</g>`;
      s += `</g>`;
      return s + `<g class="shed-roof">${out}</g>`;
    };
    wired++;
  });
  INTERIORS._wired = wired;
})();

/* ---------- handle ---------- */
G.interiorsAudit = function(){
  const has = (art)=>{
    let s = '';
    try{ s = ART[art] ? ART[art](140, 110, {tier:0, id:'x', rot:0}) : ''; }catch(e){}
    return { roofLayer:/shed-roof/.test(s), interior:/shed-in/.test(s), chars:s.length };
  };
  const names = Object.keys(INTERIORS).filter(k=>k[0] !== '_');
  const roofOff = (typeof SET === 'function') && SET('roofOff');
  const sample = names.filter(a=>ART[a]).map(a=>[a, has(a)]);
  return {
    roofCurrentlyLifted: !!roofOff,
    interiorsDefined: names.length,
    artFunctionsWired: INTERIORS._wired,
    withLiftableRoof: `${sample.filter(([,v])=>v.roofLayer).length} of ${sample.length}`,
    withInteriorRightNow: `${sample.filter(([,v])=>v.interior).length} of ${sample.length}`,
    note: roofOff ? 'interiors are drawn because the roof is up'
                  : 'interiors cost nothing while the roof is on',
    avgChars: Math.round(sample.reduce((s,[,v])=>s+v.chars,0) / Math.max(1,sample.length)),
    wasBefore: '0 of 10 working buildings had anything under the roof',
  };
};
