/* =====================================================================
   A SHED, A BAKERY AND A BUNKHOUSE SHOULD NOT UPGRADE INTO THE SAME
   BUILDING

   Twenty-eight buildings share the `shed` architecture family, and the
   family is what draws the upgrade. So every one of them gained the same
   lean-to, the same clerestory, the same water tank and the same apron.
   Measured on the tier-3 shape signature: the shed family averaged 0.767
   similarity to each other, having started at 0.527 — upgrading a
   building made it LESS like itself and MORE like its neighbours, which
   is the opposite of what an upgrade is for. bunkhouse and bunk_annexe
   scored a flat 1.00: at Mk IV they were the same picture.

   ARCH_SPECIAL is the hook p27 left for exactly this, and it was empty
   for the whole shed family. This fills it, one entry per building, so
   the thing gained at each tier is the thing that building would
   actually gain: a bakery gets a flue and a flour silo, a wool shed gets
   a shearing board and a press, a root store gets banked earth and
   ground-level vents.

   TIERS STILL MEAN WHAT THEY MEANT. Mk II is the obvious first fix, Mk
   III pulls it into one footprint, Mk IV is architectural, and the
   layers stay cumulative. What changes is that the fix is specific to
   the trade.

   IT ALSO COSTS LESS. The generic family art is ~10.9KB of SVG string
   per building, and string length is the real cost in a scene that
   re-serialises the foreground every render. These replacements are a
   fraction of that, so a farm of maxed sheds gets both more distinct and
   cheaper.

   TWO WIRING PATHS, BECAUSE THERE ARE TWO WRAPPERS. p27 reads
   ARCH_SPECIAL[name] inside the drawing function, so filling the table
   late is enough for the eleven names it wrapped. p70's re-wrap captured
   `const spec` before defining the function, so for the seventeen names
   it wrapped the table is never consulted again. For those the generic
   art is appended as a suffix, so it is recovered and stripped: p27
   seeds the family with idx*7.7, the index is found once per building by
   testing which seed reproduces the exact suffix, and it is cached.
   Verified: mushroom_shed idx 3, hay_barn 19, bunkhouse 27, bunk_annexe
   35, guest_wing 38.
   ===================================================================== */

/* ---------- small parts, shared ---------- */
function sh_flue(x, y, w, h, cap){
  let s = `<rect x="${n(x+1)}" y="${n(y+1.4)}" width="${n(w)}" height="${n(h)}" rx="1" fill="#000" opacity=".22"/>`;
  s += `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" rx="1" fill="#6f7a80"/>`;
  s += `<rect x="${n(x)}" y="${n(y)}" width="${n(w*0.45)}" height="${n(h)}" fill="#fff" opacity=".18"/>`;
  if(cap) s += `<rect x="${n(x-1)}" y="${n(y-1.6)}" width="${n(w+2)}" height="2" rx="1" fill="#59646b"/>`;
  return s;
}
function sh_stack(x, y, w, h, c1, c2, rows){
  let s = '';
  const r = Math.max(2, rows || 3);
  for(let i=0;i<r;i++){
    const yy = y + h - (i+1)*(h/r);
    s += `<rect x="${n(x + (i%2)*1.2)}" y="${n(yy)}" width="${n(w)}" height="${n(h/r - 0.7)}" rx="0.8"
      fill="${i%2 ? c1 : (c2||c1)}"/>`;
    s += `<rect x="${n(x + (i%2)*1.2)}" y="${n(yy)}" width="${n(w)}" height="1" fill="#fff" opacity=".16"/>`;
  }
  return s;
}
function sh_drum(cx, cy, r, c){
  let s = `<ellipse cx="${n(cx+0.8)}" cy="${n(cy+1.2)}" rx="${n(r)}" ry="${n(r*0.5)}" fill="#000" opacity=".22"/>`;
  s += `<ellipse cx="${n(cx)}" cy="${n(cy)}" rx="${n(r)}" ry="${n(r*0.5)}" fill="${c || '#9aa6ad'}"/>`;
  s += `<ellipse cx="${n(cx - r*0.22)}" cy="${n(cy - r*0.12)}" rx="${n(r*0.6)}" ry="${n(r*0.28)}"
    fill="#fff" opacity=".22"/>`;
  return s;
}
function sh_rack(x, y, w, h, bars){
  let s = `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" rx="1" fill="#5c4a34" opacity=".9"/>`;
  const b = Math.min(6, Math.max(2, bars || 4));
  for(let i=1;i<b;i++)
    s += `<line x1="${n(x + w*i/b)}" y1="${n(y)}" x2="${n(x + w*i/b)}" y2="${n(y+h)}"
      stroke="#3d3125" stroke-width="0.7"/>`;
  s += `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="0.9" fill="#fff" opacity=".18"/>`;
  return s;
}
function sh_door(x, y, w, h, c){
  let s = `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" rx="1" fill="${c||'#3a4148'}"/>`;
  s += `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h*0.3)}" fill="#fff" opacity=".12"/>`;
  return s;
}
function sh_win(x, y, w, h){
  return `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" rx="0.8"
    fill="url(#gGlass)" stroke="#59646b" stroke-width="0.5" opacity=".92"/>`;
}
function sh_awn(x, y, w, h, c){
  let s = `<rect x="${n(x)}" y="${n(y+h)}" width="${n(w)}" height="1.6" rx="0.8" fill="#000" opacity=".2"/>`;
  s += `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" rx="1" fill="${c||'#b6564a'}"/>`;
  const st = Math.min(7, Math.max(3, Math.round(w/7)));
  for(let i=1;i<st;i+=2)
    s += `<rect x="${n(x + w*i/st)}" y="${n(y)}" width="${n(w/st)}" height="${n(h)}" fill="#f0ece2" opacity=".8"/>`;
  s += `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="0.9" fill="#fff" opacity=".22"/>`;
  return s;
}
function sh_line(x, y, w, seed){
  let s = `<line x1="${n(x)}" y1="${n(y)}" x2="${n(x+w)}" y2="${n(y)}" stroke="#8c8578" stroke-width="0.6"/>`;
  const cols = ['#dfe6ea','#cdd7de','#e6d9c4','#c9d6c2'];
  for(let i=0;i<4;i++){
    const px = x + w*(0.14 + i*0.22);
    s += `<rect class="lf-sway" x="${n(px)}" y="${n(y)}" width="${n(w*0.13)}" height="${n(w*0.16)}"
      rx="0.8" fill="${cols[(i + Math.round(seed))%4]}" opacity=".92" style="--i:${i%5}"/>`;
  }
  return s;
}
function sh_vents(x, y, w, cnt){
  let s = '';
  const c = Math.min(6, Math.max(2, cnt || 3));
  for(let i=0;i<c;i++)
    s += `<rect x="${n(x + w*i/c)}" y="${n(y)}" width="${n(w/c*0.6)}" height="2.2" rx="1"
      fill="#2c3238" opacity=".85"/>`;
  return s;
}

/* ---------- one entry per building ---------- */
const SHED_ART = {

  /* --- the plain shed keeps the lean-to; it is the one that earned it --- */
  shed(w,h,t){
    let s = '';
    if(t>=1){ s += apron(w*0.02,h*0.72,w*0.56,h*0.24,2);
      s += `<g transform="translate(${n(w*0.68)},${n(h*0.18)})">${annex(w*0.28,h*0.38,{roof:'#8a969c'})}</g>`; }
    if(t>=2){ s += sh_stack(w*0.06,h*0.50,w*0.20,h*0.18,'#a9814f','#8f6b3f',3);
      s += miniTank(w*0.90,h*0.70,Math.min(w,h)*0.09); }
    if(t>=3){ s += `<g transform="translate(${n(w*0.06)},${n(h*0.04)})">${monitor(w*0.56,h*0.50)}</g>`;
      s += planter(w*0.30,h*0.90,w*0.42,h*0.07,3); }
    return s;
  },

  /* --- trades: what the work needs, in the order you would buy it --- */
  workshop(w,h,t){
    let s = '';
    if(t>=1){ s += apron(w*0.04,h*0.70,w*0.64,h*0.26,2);
      s += sh_rack(w*0.72,h*0.30,w*0.22,h*0.24,4); }              /* tool wall */
    if(t>=2){ s += `<rect x="${n(w*0.10)}" y="${n(h*0.76)}" width="${n(w*0.26)}" height="3.4" rx="1.4" fill="#7d5931"/>`;
      s += `<rect x="${n(w*0.14)}" y="${n(h*0.80)}" width="2.4" height="${n(h*0.12)}" fill="#6b4b28"/>`;
      s += `<rect x="${n(w*0.30)}" y="${n(h*0.80)}" width="2.4" height="${n(h*0.12)}" fill="#6b4b28"/>`; }
    if(t>=3){ s += `<g transform="translate(${n(w*0.08)},${n(h*0.04)})">${monitor(w*0.52,h*0.46)}</g>`;
      s += sh_drum(w*0.86,h*0.84,Math.min(w,h)*0.07,'#889298'); }
    return s;
  },
  cellar(w,h,t){
    let s = '';
    if(t>=1){ s += `<rect x="${n(w*0.30)}" y="${n(h*0.62)}" width="${n(w*0.30)}" height="${n(h*0.16)}" rx="1.4"
        fill="#4a3a2a"/>`;                                          /* hatch, open */
      s += `<rect x="${n(w*0.32)}" y="${n(h*0.64)}" width="${n(w*0.26)}" height="${n(h*0.12)}" rx="1" fill="#1b1610"/>`; }
    if(t>=2){ s += sh_drum(w*0.20,h*0.80,Math.min(w,h)*0.09,'#7a5a3a');
      s += sh_drum(w*0.40,h*0.86,Math.min(w,h)*0.08,'#6d5133'); }
    if(t>=3){ s += `<rect x="${n(w*0.06)}" y="${n(h*0.30)}" width="${n(w*0.88)}" height="${n(h*0.16)}" rx="3"
        fill="#5a6b3a" opacity=".85"/>`;                            /* earth bank over the vault */
      s += sh_vents(w*0.20,h*0.48,w*0.55,4); }
    return s;
  },
  packing(w,h,t){
    let s = '';
    if(t>=1){ s += apron(w*0.02,h*0.66,w*0.96,h*0.30,2);
      s += `<rect x="${n(w*0.60)}" y="${n(h*0.58)}" width="${n(w*0.34)}" height="${n(h*0.10)}" rx="1.2"
        fill="#8a949a"/>`; }                                        /* loading dock lip */
    if(t>=2){ s += sh_stack(w*0.08,h*0.70,w*0.16,h*0.20,'#c2a878','#a98f5f',3);
      s += sh_stack(w*0.28,h*0.74,w*0.14,h*0.16,'#c2a878','#a98f5f',2); }
    if(t>=3){ s += sh_awn(w*0.58,h*0.50,w*0.38,h*0.08,'#5e7a86');
      s += `<rect x="${n(w*0.06)}" y="${n(h*0.06)}" width="${n(w*0.30)}" height="${n(h*0.10)}" rx="1.4"
        fill="#4a545c"/>`; }
    return s;
  },
  dairy(w,h,t){
    let s = '';
    if(t>=1){ s += apron(w*0.04,h*0.72,w*0.66,h*0.24,2);
      s += miniTank(w*0.86,h*0.40,Math.min(w,h)*0.13); }            /* bulk vat first */
    if(t>=2){ s += sh_drum(w*0.16,h*0.82,Math.min(w,h)*0.075,'#c6ced3');
      s += sh_drum(w*0.32,h*0.86,Math.min(w,h)*0.07,'#c6ced3');
      s += sh_drum(w*0.48,h*0.82,Math.min(w,h)*0.075,'#c6ced3'); }
    if(t>=3){ s += `<rect x="${n(w*0.06)}" y="${n(h*0.08)}" width="${n(w*0.46)}" height="${n(h*0.14)}" rx="2"
        fill="#aeb9c0"/>`;
      s += `<circle class="lf-spin" cx="${n(w*0.20)}" cy="${n(h*0.15)}" r="${n(Math.min(w,h)*0.05)}"
        fill="none" stroke="#dfe7ea" stroke-width="1.6"/>`; }        /* chiller */
    return s;
  },
  kitchen(w,h,t){
    let s = '';
    if(t>=1) s += sh_flue(w*0.74,h*0.06,w*0.09,h*0.30,1);
    if(t>=2){ s += apron(w*0.04,h*0.74,w*0.56,h*0.22,2);
      s += `<rect x="${n(w*0.08)}" y="${n(h*0.46)}" width="${n(w*0.34)}" height="${n(h*0.12)}" rx="1.4"
        fill="#b9c2c8"/>`; }                                         /* stainless bench */
    if(t>=3){ s += sh_win(w*0.10,h*0.28,w*0.30,h*0.12);
      s += planter(w*0.46,h*0.86,w*0.44,h*0.08,5); }                 /* herbs by the door */
    return s;
  },
  honey_lab(w,h,t){
    let s = '';
    if(t>=1) s += sh_drum(w*0.78,h*0.56,Math.min(w,h)*0.13,'#c9a24a');   /* extractor */
    if(t>=2){ s += sh_stack(w*0.08,h*0.62,w*0.18,h*0.24,'#d8b45c','#b8933f',4);  /* supers */
      s += apron(w*0.04,h*0.86,w*0.50,h*0.10,2); }
    if(t>=3){ s += sh_win(w*0.30,h*0.30,w*0.26,h*0.12);
      s += `<circle class="lf-glow" cx="${n(w*0.78)}" cy="${n(h*0.40)}" r="1.5" fill="#ffd27a"/>`; }
    return s;
  },
  gift_shop(w,h,t){
    let s = '';
    if(t>=1) s += sh_awn(w*0.10,h*0.44,w*0.60,h*0.10,'#b6564a');
    if(t>=2){ s += sh_win(w*0.14,h*0.56,w*0.50,h*0.12);
      s += `<rect x="${n(w*0.70)}" y="${n(h*0.40)}" width="${n(w*0.20)}" height="${n(h*0.14)}" rx="1.4"
        fill="#f0e6cf"/>`;
      s += `<rect x="${n(w*0.72)}" y="${n(h*0.43)}" width="${n(w*0.16)}" height="2" fill="#8a6a42"/>`; }
    if(t>=3){ s += verandah(w*0.06,h*0.72,w*0.72,h*0.16);
      s += planter(w*0.80,h*0.74,w*0.16,h*0.14,9); }
    return s;
  },
  nursery(w,h,t){
    let s = '';
    if(t>=1){ for(let i=0;i<3;i++)
        s += `<rect x="${n(w*0.08 + i*w*0.20)}" y="${n(h*0.62)}" width="${n(w*0.17)}" height="${n(h*0.13)}"
          rx="1" fill="#5a4632"/><rect x="${n(w*0.09 + i*w*0.20)}" y="${n(h*0.63)}"
          width="${n(w*0.15)}" height="${n(h*0.10)}" rx="0.8" fill="#4d7a33"/>`; }  /* seed trays */
    if(t>=2){ s += `<rect x="${n(w*0.04)}" y="${n(h*0.24)}" width="${n(w*0.72)}" height="${n(h*0.10)}" rx="2"
        fill="#3f5a2a" opacity=".45"/>`;                              /* shade cloth, kept thin */
      s += miniTank(w*0.90,h*0.72,Math.min(w,h)*0.09); }
    if(t>=3){ s += planter(w*0.06,h*0.84,w*0.64,h*0.10,4);
      s += `<line x1="${n(w*0.06)}" y1="${n(h*0.80)}" x2="${n(w*0.76)}" y2="${n(h*0.80)}"
        stroke="#5f6b72" stroke-width="0.7" opacity=".8"/>`; }        /* drip line */
    return s;
  },
  worker_cottage(w,h,t){
    let s = '';
    if(t>=1){ s += sh_flue(w*0.16,h*0.04,w*0.08,h*0.26,1);
      s += sh_door(w*0.44,h*0.52,w*0.12,h*0.16,'#5a4030'); }
    if(t>=2){ s += verandah(w*0.06,h*0.68,w*0.62,h*0.14);
      s += sh_line(w*0.70,h*0.82,w*0.26,2); }
    if(t>=3){ s += sh_win(w*0.16,h*0.50,w*0.16,h*0.11);
      s += sh_win(w*0.66,h*0.50,w*0.16,h*0.11);
      s += planter(w*0.08,h*0.86,w*0.50,h*0.08,6); }
    return s;
  },
  ai_hub(w,h,t){
    let s = '';
    if(t>=1){ s += apron(w*0.04,h*0.74,w*0.60,h*0.22,2);
      s += `<rect x="${n(w*0.72)}" y="${n(h*0.30)}" width="${n(w*0.20)}" height="${n(h*0.40)}" rx="2"
        fill="#46525c"/>`;                                            /* cooling cabinet */
      s += sh_vents(w*0.74,h*0.36,w*0.16,3); }
    if(t>=2){ s += `<line x1="${n(w*0.30)}" y1="${n(h*0.36)}" x2="${n(w*0.30)}" y2="${n(h*0.06)}"
        stroke="#7d868c" stroke-width="1.6"/>`;
      s += `<ellipse cx="${n(w*0.30)}" cy="${n(h*0.06)}" rx="${n(w*0.09)}" ry="${n(h*0.035)}"
        fill="#c6ced3"/>`;                                            /* dish */
      s += `<circle class="lf-glow" cx="${n(w*0.30)}" cy="${n(h*0.06)}" r="1.4" fill="#7cf0c0"/>`; }
    if(t>=3){ s += `<g transform="translate(${n(w*0.06)},${n(h*0.04)})">${panels(w*0.52,h*0.16,3)}</g>`;
      for(let i=0;i<4;i++)
        s += `<rect class="lf-glow" x="${n(w*0.10 + i*w*0.09)}" y="${n(h*0.58)}" width="2.6" height="2.6"
          rx="0.8" fill="#7cf0c0" opacity=".9" style="--i:${i%5}"/>`; }
    return s;
  },

  /* --- the seventeen p70 wrapped --- */
  mushroom_shed(w,h,t){
    let s = '';
    if(t>=1){ s += sh_vents(w*0.10,h*0.34,w*0.70,5);
      s += sh_door(w*0.44,h*0.54,w*0.14,h*0.16,'#22282c'); }         /* kept dark */
    if(t>=2){ s += `<rect x="${n(w*0.06)}" y="${n(h*0.44)}" width="${n(w*0.14)}" height="${n(h*0.30)}" rx="2"
        fill="#8f9aa1"/>`;                                            /* humidity plant */
      s += sh_drum(w*0.86,h*0.62,Math.min(w,h)*0.09,'#9aa6ad'); }
    if(t>=3){ s += sh_rack(w*0.24,h*0.60,w*0.44,h*0.20,5);
      s += `<rect x="${n(w*0.06)}" y="${n(h*0.06)}" width="${n(w*0.36)}" height="${n(h*0.10)}" rx="2"
        fill="#5a6b3a" opacity=".8"/>`; }
    return s;
  },
  generator(w,h,t){
    let s = '';
    if(t>=1){ s += sh_flue(w*0.78,h*0.04,w*0.10,h*0.34,1);
      s += apron(w*0.04,h*0.74,w*0.62,h*0.22,2); }
    if(t>=2){ s += miniTank(w*0.20,h*0.60,Math.min(w,h)*0.12);       /* day tank */
      s += `<rect x="${n(w*0.40)}" y="${n(h*0.56)}" width="${n(w*0.28)}" height="${n(h*0.18)}" rx="2"
        fill="#4e5a62"/>`; }
    if(t>=3){ s += sh_vents(w*0.42,h*0.50,w*0.24,3);
      s += `<circle class="lf-glow" cx="${n(w*0.66)}" cy="${n(h*0.60)}" r="1.4" fill="#ffb46a"/>`; }
    return s;
  },
  inverter(w,h,t){
    let s = '';
    if(t>=1) s += `<rect x="${n(w*0.28)}" y="${n(h*0.40)}" width="${n(w*0.44)}" height="${n(h*0.30)}" rx="2"
      fill="#46525c"/><rect x="${n(w*0.30)}" y="${n(h*0.42)}" width="${n(w*0.40)}" height="${n(h*0.08)}"
      rx="1" fill="#5f6b72"/>`;
    if(t>=2){ s += `<rect x="${n(w*0.24)}" y="${n(h*0.70)}" width="${n(w*0.52)}" height="3" rx="1.5"
        fill="#6b7278"/>`;                                            /* conduit run */
      s += apron(w*0.18,h*0.76,w*0.64,h*0.14,2); }
    if(t>=3){ s += `<g transform="translate(${n(w*0.10)},${n(h*0.06)})">${panels(w*0.80,h*0.20,3)}</g>`;
      s += `<circle class="lf-glow" cx="${n(w*0.66)}" cy="${n(h*0.46)}" r="1.3" fill="#7cf0c0"/>`; }
    return s;
  },
  hay_barn(w,h,t){
    let s = '';
    if(t>=1){ for(let i=0;i<3;i++)                                    /* open bays, not a wall */
        s += `<rect x="${n(w*0.08 + i*w*0.29)}" y="${n(h*0.42)}" width="${n(w*0.22)}" height="${n(h*0.26)}"
          rx="1" fill="#1e1a12" opacity=".55"/>`; }
    if(t>=2){ s += sh_stack(w*0.10,h*0.46,w*0.18,h*0.22,'#d9c07a','#c2a75f',3);
      s += sh_stack(w*0.68,h*0.50,w*0.18,h*0.18,'#d9c07a','#c2a75f',2); }
    if(t>=3){ s += `<rect x="${n(w*0.04)}" y="${n(h*0.30)}" width="${n(w*0.92)}" height="2.4" rx="1.2"
        fill="#7d868c"/>`;
      for(let i=0;i<3;i++)
        s += `<rect x="${n(w*0.12 + i*w*0.30)}" y="${n(h*0.26)}" width="2" height="${n(h*0.08)}"
          rx="1" fill="#5f6b72"/>`; }                                          /* gantry rail */
    return s;
  },
  bakery(w,h,t){
    let s = '';
    if(t>=1) s += sh_flue(w*0.72,h*0.02,w*0.11,h*0.36,1);            /* the oven says so */
    if(t>=2){ s += `<ellipse cx="${n(w*0.18)}" cy="${n(h*0.46)}" rx="${n(w*0.10)}" ry="${n(h*0.16)}"
        fill="#c6ced3"/>`;                                            /* flour silo */
      s += `<ellipse cx="${n(w*0.18)}" cy="${n(h*0.31)}" rx="${n(w*0.10)}" ry="${n(h*0.05)}" fill="#dfe7ea"/>`;
      s += apron(w*0.30,h*0.76,w*0.56,h*0.18,2); }
    if(t>=3){ s += sh_rack(w*0.34,h*0.50,w*0.34,h*0.16,5);
      s += `<rect x="${n(w*0.38)}" y="${n(h*0.68)}" width="${n(w*0.26)}" height="${n(h*0.07)}" rx="1.2"
        fill="#4a3a2a"/>`; }
    return s;
  },
  smokehouse(w,h,t){
    let s = '';
    if(t>=1){ s += sh_flue(w*0.46,h*0.00,w*0.10,h*0.34,1);
      s += `<circle class="lf-sway" cx="${n(w*0.51)}" cy="${n(h*0.02)}" r="${n(Math.min(w,h)*0.05)}"
        fill="#cfd6da" opacity=".35"/>`; }                            /* one puff, cheap */
    if(t>=2){ s += sh_rack(w*0.16,h*0.48,w*0.30,h*0.14,4);
      s += sh_stack(w*0.66,h*0.56,w*0.16,h*0.18,'#8a6a42','#6f5333',3); }  /* the wood pile */
    if(t>=3){ s += sh_vents(w*0.20,h*0.68,w*0.44,3);
      s += apron(w*0.10,h*0.80,w*0.62,h*0.14,2); }
    return s;
  },
  cidery(w,h,t){
    let s = '';
    if(t>=1) s += sh_drum(w*0.76,h*0.50,Math.min(w,h)*0.13,'#8a6a42');   /* the press */
    if(t>=2){ s += sh_drum(w*0.18,h*0.72,Math.min(w,h)*0.09,'#7a5a3a');
      s += sh_drum(w*0.36,h*0.78,Math.min(w,h)*0.08,'#6d5133');
      s += apron(w*0.06,h*0.86,w*0.56,h*0.10,2); }
    if(t>=3){ s += miniTank(w*0.86,h*0.78,Math.min(w,h)*0.10);
      s += sh_win(w*0.28,h*0.34,w*0.28,h*0.11); }
    return s;
  },
  wool_shed(w,h,t){
    let s = '';
    if(t>=1){ s += `<rect x="${n(w*0.08)}" y="${n(h*0.54)}" width="${n(w*0.56)}" height="${n(h*0.16)}" rx="1.4"
        fill="#b08b58"/>`;                                            /* shearing board */
      s += `<rect x="${n(w*0.08)}" y="${n(h*0.54)}" width="${n(w*0.56)}" height="1.2" fill="#fff" opacity=".2"/>`; }
    if(t>=2){ s += `<rect x="${n(w*0.70)}" y="${n(h*0.42)}" width="${n(w*0.20)}" height="${n(h*0.30)}" rx="2"
        fill="#6f7a80"/>`;                                            /* wool press */
      s += sh_stack(w*0.10,h*0.74,w*0.20,h*0.18,'#efe9dc','#ddd5c4',3); }
    if(t>=3){ s += `<rect x="${n(w*0.04)}" y="${n(h*0.76)}" width="${n(w*0.92)}" height="${n(h*0.06)}" rx="2"
        fill="#8a949a" opacity=".6"/>`;                               /* race out to the yards */
      s += sh_vents(w*0.14,h*0.30,w*0.46,4); }
    return s;
  },
  candle_room(w,h,t){
    let s = '';
    if(t>=1) s += sh_drum(w*0.78,h*0.54,Math.min(w,h)*0.10,'#d8b45c');   /* wax vat */
    if(t>=2){ for(let i=0;i<4;i++)                                    /* dipping frames */
        s += `<rect x="${n(w*0.10 + i*w*0.14)}" y="${n(h*0.46)}" width="2.2" height="${n(h*0.22)}"
          rx="1" fill="#8a6a42"/>`;
      s += `<rect x="${n(w*0.08)}" y="${n(h*0.44)}" width="${n(w*0.50)}" height="2" rx="1" fill="#6f5333"/>`; }
    if(t>=3){ s += sh_vents(w*0.12,h*0.30,w*0.34,3);
      s += `<circle class="lf-glow" cx="${n(w*0.78)}" cy="${n(h*0.44)}" r="1.5" fill="#ffd27a"/>`;
      s += `<circle class="lf-glow" cx="${n(w*0.20)}" cy="${n(h*0.52)}" r="1.2" fill="#ffe6ad"/>`; }
    return s;
  },
  cafe(w,h,t){
    let s = '';
    if(t>=1) s += sh_awn(w*0.08,h*0.46,w*0.62,h*0.10,'#4a7a6a');
    if(t>=2){ s += verandah(w*0.04,h*0.62,w*0.72,h*0.16);
      for(let i=0;i<2;i++){                                           /* two tables, no more */
        const cx = w*(0.18 + i*0.28);
        s += `<circle cx="${n(cx)}" cy="${n(h*0.70)}" r="${n(Math.min(w,h)*0.055)}" fill="#e8e0cf"/>`;
        s += `<circle cx="${n(cx)}" cy="${n(h*0.70)}" r="${n(Math.min(w,h)*0.055)}" fill="#000" opacity=".1"/>`; } }
    if(t>=3){ s += sh_flue(w*0.80,h*0.06,w*0.08,h*0.24,1);
      s += planter(w*0.06,h*0.84,w*0.60,h*0.09,7); }
    return s;
  },
  bunkhouse(w,h,t){
    let s = '';
    if(t>=1){ for(let i=0;i<4;i++)                                    /* a row of small windows */
        s += sh_win(w*(0.10 + i*0.20), h*0.48, w*0.13, h*0.10);
      s += sh_door(w*0.44,h*0.62,w*0.12,h*0.14,'#4a5a4a'); }
    if(t>=2){ s += verandah(w*0.04,h*0.72,w*0.80,h*0.13);
      s += sh_line(w*0.06,h*0.90,w*0.36,1); }
    if(t>=3){ s += sh_flue(w*0.86,h*0.08,w*0.07,h*0.22,1);
      s += `<g transform="translate(${n(w*0.06)},${n(h*0.04)})">${panels(w*0.60,h*0.14,3)}</g>`; }
    return s;
  },
  bunk_annexe(w,h,t){
    let s = '';                                                       /* the small one: one door, a ladder */
    if(t>=1){ s += sh_win(w*0.20,h*0.50,w*0.18,h*0.12);
      s += sh_door(w*0.58,h*0.52,w*0.14,h*0.18,'#4a5a4a'); }
    if(t>=2){ for(let i=0;i<4;i++)                                    /* external stair to the top bunk */
        s += `<rect x="${n(w*0.78)}" y="${n(h*(0.42 + i*0.08))}" width="${n(w*0.14)}" height="2"
          rx="1" fill="#8a6a42"/>`;
      s += `<rect x="${n(w*0.90)}" y="${n(h*0.40)}" width="1.8" height="${n(h*0.34)}" fill="#6f5333"/>`; }
    if(t>=3){ s += sh_line(w*0.08,h*0.80,w*0.34,4);
      s += `<rect x="${n(w*0.24)}" y="${n(h*0.28)}" width="${n(w*0.24)}" height="${n(h*0.10)}" rx="1.4"
        fill="url(#gGlass)" stroke="#59646b" stroke-width="0.5" opacity=".9"/>`; }
    return s;
  },
  laundry(w,h,t){
    let s = '';
    if(t>=1){ s += sh_vents(w*0.66,h*0.42,w*0.24,2);
      s += sh_line(w*0.06,h*0.62,w*0.44,3); }
    if(t>=2){ s += apron(w*0.04,h*0.76,w*0.66,h*0.18,2);
      s += miniTank(w*0.88,h*0.62,Math.min(w,h)*0.10); }
    if(t>=3){ s += sh_line(w*0.06,h*0.72,w*0.44,5);
      s += sh_win(w*0.16,h*0.40,w*0.24,h*0.10); }
    return s;
  },
  mud_room(w,h,t){
    let s = '';
    if(t>=1){ s += `<rect x="${n(w*0.10)}" y="${n(h*0.58)}" width="${n(w*0.40)}" height="${n(h*0.10)}" rx="1.2"
        fill="#5a4632"/>`;                                            /* boot rack */
      for(let i=0;i<3;i++)
        s += `<rect x="${n(w*0.13 + i*w*0.12)}" y="${n(h*0.54)}" width="${n(w*0.07)}" height="${n(h*0.06)}"
          rx="1" fill="#3a4a3a"/>`; }
    if(t>=2){ s += apron(w*0.04,h*0.70,w*0.62,h*0.20,2);
      s += `<rect x="${n(w*0.60)}" y="${n(h*0.44)}" width="${n(w*0.30)}" height="2" rx="1" fill="#6f5333"/>`;
      for(let i=0;i<3;i++)
        s += `<rect x="${n(w*0.64 + i*w*0.08)}" y="${n(h*0.46)}" width="1.6" height="${n(h*0.06)}" fill="#4a5a4a"/>`; }
    if(t>=3){ s += sh_awn(w*0.06,h*0.36,w*0.50,h*0.08,'#6a7a52');
      s += planter(w*0.62,h*0.76,w*0.30,h*0.10,13); }
    return s;
  },
  guest_wing(w,h,t){
    let s = '';
    if(t>=1){ s += sh_win(w*0.12,h*0.48,w*0.22,h*0.13);              /* proper windows, not vents */
      s += sh_win(w*0.62,h*0.48,w*0.22,h*0.13); }
    if(t>=2){ s += verandah(w*0.04,h*0.68,w*0.88,h*0.16);
      s += sh_door(w*0.44,h*0.56,w*0.12,h*0.14,'#5a4030'); }
    if(t>=3){ s += `<rect x="${n(w*0.30)}" y="${n(h*0.38)}" width="${n(w*0.36)}" height="${n(h*0.14)}" rx="2"
        fill="url(#gGlass)" stroke="#59646b" stroke-width="0.6" opacity=".9"/>`;   /* bay */
      s += planter(w*0.06,h*0.86,w*0.84,h*0.08,17); }
    return s;
  },
  root_store(w,h,t){
    let s = '';
    if(t>=1){ s += `<rect x="${n(w*0.04)}" y="${n(h*0.36)}" width="${n(w*0.92)}" height="${n(h*0.22)}" rx="4"
        fill="#5a6b3a" opacity=".9"/>`;                               /* banked earth over it */
      s += sh_vents(w*0.16,h*0.60,w*0.62,4); }
    if(t>=2){ s += sh_door(w*0.44,h*0.62,w*0.14,h*0.16,'#3a3126');
      s += sh_stack(w*0.10,h*0.74,w*0.16,h*0.16,'#b08b58','#947344',3); }
    if(t>=3){ s += `<g transform="translate(${n(w*0.10)},${n(h*0.30)})">${roofGarden(0,0,w*0.80,h*0.10,5)}</g>`;
      s += apron(w*0.30,h*0.84,w*0.50,h*0.10,2); }
    return s;
  },
};

/* ---------- wiring, path one: the eleven p27 wrapped ----------
   p27 reads ARCH_SPECIAL[name] inside the drawing function, so putting
   the entry in the table is the whole job. */
let SHED_ID_DIRECT = 0;
if(typeof ARCH_SPECIAL === 'object'){
  Object.keys(SHED_ART).forEach(name=>{
    if(ARCH_SPECIAL[name]) return;                 /* never tread on an existing special */
    ARCH_SPECIAL[name] = SHED_ART[name];
    SHED_ID_DIRECT++;
  });
}

/* ---------- wiring, path two: the seventeen p70 wrapped ----------
   p70's re-wrap read `const spec = NEW_ARCH_SPECIAL[name]` before it
   defined the drawing function, so the table is captured and filling
   either table afterwards changes nothing. What it does do is append the
   family art as a plain suffix — `return out + extra` — so the suffix can
   be reproduced and removed.

   p27 seeds the family with idx*7.7 where idx is the building's position
   in the key list. We do not know the index, so it is found once per
   building by trying seeds until one reproduces the exact suffix, then
   cached. ARCH_LOD is already set by the inner wrapper by the time we
   run, so recomputing with the cached seed gives a byte-identical string. */
const SHED_SEED = {};                              /* name -> seed, or -1 for "gave up" */
const SHED_ID_REWRAPPED = [];

function shedFindSeed(name, w, h, t, ob, full){
  if(SHED_SEED[name] !== undefined) return SHED_SEED[name];
  let found = -1;
  for(let idx = 0; idx < 400; idx++){
    let g = '';
    try{ g = ARCH.shed(w, h, t, idx*7.7, ob) || ''; }catch(e){ continue; }
    if(g && full.endsWith(g)){ found = idx*7.7; break; }
  }
  SHED_SEED[name] = found;
  return found;
}

(function rewrapCapturedSheds(){
  if(typeof ART !== 'object' || typeof ARCH !== 'object') return;
  Object.keys(SHED_ART).forEach(name=>{
    const base = ART[name];
    if(typeof base !== 'function') return;
    /* does the late fill already reach this one? then leave it alone */
    const probe = ()=>'<!--SHEDPROBE-->';
    const had = Object.prototype.hasOwnProperty.call(ARCH_SPECIAL, name);
    const old = ARCH_SPECIAL[name];
    ARCH_SPECIAL[name] = probe;
    let reached = false;
    try{ reached = (base(120, 90, {tier:3, lvl:4}) || '').indexOf('<!--SHEDPROBE-->') >= 0; }catch(e){}
    if(had) ARCH_SPECIAL[name] = old; else delete ARCH_SPECIAL[name];
    if(reached) return;

    const mine = SHED_ART[name];
    ART[name] = function(w, h, ob){
      const full = base(w, h, ob) || '';
      const t = (typeof curTier === 'function') ? curTier(ob) : (ob && ob.tier) || 0;
      if(!t) return full;
      let out = full;
      const seed = shedFindSeed(name, w, h, t, ob, full);
      if(seed >= 0){
        let g = '';
        try{ g = ARCH.shed(w, h, t, seed, ob) || ''; }catch(e){}
        if(g && out.endsWith(g)) out = out.slice(0, out.length - g.length);
      }
      let extra = '';
      try{ extra = mine(w, h, t, seed, ob) || ''; }catch(e){ extra = ''; }
      return out + extra;
    };
    SHED_ID_REWRAPPED.push(name);
  });
})();

/* ---------- handle ---------- */
G.shedIdentityAudit = function(){
  const sig = (name, t)=>{
    const f = ART[name]; if(typeof f !== 'function') return null;
    let s = ''; try{ s = f(120, 90, {tier:t, lvl:4}); }catch(e){ return null; }
    return s.replace(/[-\d.]+/g, '#');
  };
  const jac = (a, b)=>{
    const ta = new Set(a.match(/<[a-z]+[^>]*?(?=\/?>)/g) || []);
    const tb = new Set(b.match(/<[a-z]+[^>]*?(?=\/?>)/g) || []);
    const inter = [...ta].filter(x=>tb.has(x)).length;
    const uni = new Set([...ta, ...tb]).size;
    return uni ? inter/uni : 0;
  };
  const fam = Object.keys(ARCH_FAMILY).filter(k=>ARCH_FAMILY[k] === 'shed');
  const mean = (t)=>{
    const v = [];
    for(let i=0;i<fam.length;i++) for(let j=i+1;j<fam.length;j++){
      const a = sig(fam[i], t), b = sig(fam[j], t);
      if(a && b) v.push(jac(a, b));
    }
    return v.length ? +(v.reduce((x,y)=>x+y, 0)/v.length).toFixed(3) : null;
  };
  const bytes = (t)=>{
    let n0 = 0, c = 0;
    fam.forEach(k=>{ const s = sig(k, t); if(s){ n0 += s.length; c++; } });
    return c ? Math.round(n0/c) : 0;
  };
  return {
    shedFamily: fam.length,
    givenOwnArt: Object.keys(SHED_ART).length,
    filledIntoArchSpecial: SHED_ID_DIRECT,
    rewrappedBecauseCaptured: SHED_ID_REWRAPPED.length,
    seedsRecovered: Object.keys(SHED_SEED).filter(k=>SHED_SEED[k] >= 0).length,
    seedsNotFound: Object.keys(SHED_SEED).filter(k=>SHED_SEED[k] < 0),
    meanSimilarity: { tier0: mean(0), tier1: mean(1), tier2: mean(2), tier3: mean(3) },
    avgBytesPerBuilding: { tier0: bytes(0), tier3: bytes(3) },
    wasBefore: 'tier0 0.527 -> tier3 0.767; bunkhouse/bunk_annexe identical at 1.00',
  };
};
