/* =====================================================================
   FURNISH IT YOURSELF

   The last of the four. The plan is the house you bought and it answers
   to who is home, but everything in it is still decided for you - you
   cannot put a piano in the living room or a proper range in the
   kitchen.

   TAKEN FROM THE SIMS, WHERE IT WORKS. An item is worth something to a
   room, a room is worth something to the people in it, and the whole
   thing rolls up into how well the household lives. What is deliberately
   NOT taken is free-form placement. Dragging a sofa around a 240x160
   cutaway with the camera at arbitrary zoom would be a fiddly, bad
   version of a thing the game does not need: you choose the room and the
   house arranges it against a wall, which is what the plan drawing wants
   anyway.

   DIMINISHING RETURNS ARE THE POINT. Without them the answer is always
   "buy every item for every room" and there is no decision. The second
   thing in a room is worth about two thirds of the first, the third half
   again, and rooms have a hard slot limit by floor area, so a small
   bathroom cannot absorb four hundred pounds of comfort. What you are
   really choosing is which rooms to spend on.

   Items suit rooms. A range only helps a kitchen; a bed frame only a
   bedroom. Putting a piano in the bathroom is not an option offered,
   because a catalogue that lets you do nonsense is a catalogue nobody
   reads carefully.
   ===================================================================== */

const FURNISH = [
  /* living */
  {id:'rug',     n:'Wool rug',        cost:120,  c:0.10, rooms:['living','bed','office'], cat:'Comfort'},
  {id:'piano',   n:'Upright piano',   cost:1400, c:0.26, rooms:['living'],                cat:'Comfort'},
  {id:'armchair',n:'Good armchair',   cost:340,  c:0.16, rooms:['living','office'],       cat:'Comfort'},
  {id:'pics',    n:'Framed pictures', cost:90,   c:0.08, rooms:['living','hall','bed','office'], cat:'Decor'},
  {id:'plants',  n:'House plants',    cost:60,   c:0.07, rooms:['living','hall','bath','kitchen','office'], cat:'Decor'},
  {id:'curtains',n:'Lined curtains',  cost:180,  c:0.11, rooms:['living','bed'],          cat:'Decor'},
  /* kitchen */
  {id:'range',   n:'Cast iron range', cost:1600, c:0.24, rooms:['kitchen'],               cat:'Fittings'},
  {id:'dresser', n:'Welsh dresser',   cost:520,  c:0.15, rooms:['kitchen','living'],      cat:'Storage'},
  {id:'larder',  n:'Larder cupboard', cost:300,  c:0.12, rooms:['kitchen','pantry'],      cat:'Storage'},
  /* bedrooms */
  {id:'wardrobe',n:'Oak wardrobe',    cost:480,  c:0.16, rooms:['bed','guest'],           cat:'Storage'},
  {id:'goodbed', n:'Proper bedstead', cost:700,  c:0.22, rooms:['bed','guest'],           cat:'Comfort'},
  {id:'desk',    n:'Writing desk',    cost:260,  c:0.14, rooms:['bed','office'],          cat:'Fittings'},
  /* bath and utility */
  {id:'rolltop', n:'Roll-top bath',   cost:900,  c:0.20, rooms:['bath'],                  cat:'Fittings'},
  {id:'stove',   n:'Wood burner',     cost:850,  c:0.21, rooms:['living','hall'],         cat:'Fittings'},
  {id:'shelves', n:'Fitted shelving', cost:210,  c:0.11, rooms:['store','util','pantry','office'], cat:'Storage'},
];
const FURNMAP = {}; FURNISH.forEach(f=>FURNMAP[f.id]=f);

function furnInit(){ if(!S.furnish) S.furnish = {}; return S.furnish; }
function furnIn(roomKey){ return (furnInit()[roomKey] || []).slice(); }

/* How much a room can take: its floor area, capped by what the room is
   for. Area alone gave a living room two slots, which is not a living
   room, and would have given a bathroom the same as a lounge because in
   this plan they happen to be the same size. */
const FURN_CAP = { living:5, bed:4, kitchen:4, office:4, guest:3,
                   bath:3, hall:3, pantry:3, store:3, util:3 };
function furnSlots(r){
  const area = r.w * r.h;                       /* fraction of the house */
  const cap = FURN_CAP[r.use] || FURN_CAP[r.t] || 3;
  return Math.max(2, Math.min(cap, Math.round(area * 55)));
}
function furnFor(r){
  return FURNISH.filter(f=>f.rooms.indexOf(r.t) >= 0 || (r.use && f.rooms.indexOf(r.use) >= 0));
}

/* diminishing returns, so the choice is which rooms rather than all of them */
function furnComfort(roomKey){
  const list = furnIn(roomKey);
  let total = 0;
  list.forEach((id,i)=>{
    const f = FURNMAP[id]; if(!f) return;
    total += f.c * Math.pow(0.66, i);
  });
  return total;
}

/* fold it into the score p100 already computes */
if(typeof roomComfort === 'function'){
  const _roomComfortBase = roomComfort;
  roomComfort = function(r){
    const base = _roomComfortBase.apply(this, arguments);
    let add = 0;
    try{ add = furnComfort(r.k); }catch(e){}
    return Math.max(0, Math.min(1, base + add));
  };
}

/* ---------- buying ---------- */
G.buyFurnish = function(roomKey, id){
  const f = FURNMAP[id]; if(!f) return;
  const plan = assignRooms();
  const r = plan.rooms.find(x=>x.k === roomKey); if(!r) return;
  const have = furnIn(roomKey);
  if(have.length >= furnSlots(r)) return toast('That room is full', 'bad');
  if(have.indexOf(id) >= 0)       return toast('Already got one of those in there', 'bad');
  if(S.cash < f.cost)             return toast('Not enough cash', 'bad');
  S.cash -= f.cost;
  furnInit()[roomKey] = have.concat([id]);
  if(typeof log === 'function') log(`Put ${f.n.toLowerCase()} in the ${r.label.toLowerCase()}.`, '', 'home');
  if(typeof sfx === 'function') try{ sfx('coin'); }catch(e){}
  if(typeof save === 'function') try{ save(); }catch(e){}
  if(typeof render === 'function') render();
  if(typeof ui === 'function') ui();
};
G.sellFurnish = function(roomKey, id){
  const f = FURNMAP[id]; if(!f) return;
  const have = furnIn(roomKey);
  const i = have.indexOf(id); if(i < 0) return;
  have.splice(i,1);
  furnInit()[roomKey] = have;
  const back = Math.round(f.cost * 0.55);
  S.cash += back;
  if(typeof log === 'function') log(`Sold the ${f.n.toLowerCase()} on for ${fmt(back)}.`, '', 'home');
  if(typeof save === 'function') try{ save(); }catch(e){}
  if(typeof render === 'function') render();
  if(typeof ui === 'function') ui();
};

/* ---------- drawing what you bought ----------
   Placed round the room's edge, inside the skirting, in the order bought.
   Positions are walked clockwise from the top-left so a second item never
   lands on the first, and everything sits against a wall the way a plan
   drawing expects. */
function furnSpot(R, i, total){
  const inset = Math.min(R.w, R.h) * 0.13;
  const slots = [
    {x:R.x + R.w*0.50, y:R.y + inset,        w:R.w*0.30, h:inset*1.2},   /* top wall */
    {x:R.x + R.w - inset, y:R.y + R.h*0.52,  w:inset*1.2, h:R.h*0.28},   /* right    */
    {x:R.x + R.w*0.32, y:R.y + R.h - inset,  w:R.w*0.28, h:inset*1.2},   /* bottom   */
    {x:R.x + inset,    y:R.y + R.h*0.60,     w:inset*1.2, h:R.h*0.24},   /* left     */
    {x:R.x + R.w*0.72, y:R.y + R.h*0.74,     w:R.w*0.20, h:inset*1.1},   /* corner   */
  ];
  return slots[i % slots.length];
}

function furnArt(r, R){
  const list = furnIn(r.k);
  if(!list.length) return '';
  let s = '';
  list.forEach((id,i)=>{
    const f = FURNMAP[id]; if(!f) return;
    const p = furnSpot(R, i, list.length);
    const x = p.x - p.w/2, y = p.y - p.h/2;
    const sh = `<rect x="${n(x+0.8)}" y="${n(y+1)}" width="${n(p.w)}" height="${n(p.h)}" rx="1.4" fill="#000" opacity=".13"/>`;
    switch(id){
      case 'rug':
        s += `<ellipse cx="${n(p.x)}" cy="${n(p.y)}" rx="${n(p.w*0.62)}" ry="${n(p.h*1.5)}" fill="#8d6a5e" opacity=".85"/>`
           + `<ellipse cx="${n(p.x)}" cy="${n(p.y)}" rx="${n(p.w*0.42)}" ry="${n(p.h*1.0)}" fill="none" stroke="#c98a72" stroke-width="0.7"/>`;
        break;
      case 'piano':
        s += sh + `<rect x="${n(x)}" y="${n(y)}" width="${n(p.w)}" height="${n(p.h)}" rx="1" fill="#2b2320"/>`
           + `<rect x="${n(x+p.w*0.06)}" y="${n(y+p.h*0.62)}" width="${n(p.w*0.88)}" height="${n(p.h*0.28)}" fill="#f4f2ec"/>`;
        for(let k=0;k<8;k++) s += `<line x1="${n(x+p.w*(0.10+k*0.10))}" y1="${n(y+p.h*0.62)}" x2="${n(x+p.w*(0.10+k*0.10))}" y2="${n(y+p.h*0.90)}" stroke="#2b2320" stroke-width="0.4"/>`;
        break;
      case 'armchair':
        s += sh + `<rect x="${n(x)}" y="${n(y)}" width="${n(p.w)}" height="${n(p.h)}" rx="2" fill="#5f7a6b"/>`
           + `<rect x="${n(x+p.w*0.16)}" y="${n(y+p.h*0.22)}" width="${n(p.w*0.68)}" height="${n(p.h*0.6)}" rx="1.4" fill="#71907f"/>`;
        break;
      case 'pics':
        for(let k=0;k<3;k++)
          s += `<rect x="${n(x+p.w*(0.06+k*0.32))}" y="${n(y)}" width="${n(p.w*0.24)}" height="${n(p.h*0.72)}" rx="0.5"
            fill="${['#c8a44e','#b45b4a','#4f7f96'][k]}" stroke="#5c452c" stroke-width="0.5"/>`;
        break;
      case 'plants':
        s += `<circle cx="${n(p.x)}" cy="${n(p.y+p.h*0.28)}" r="${n(Math.min(p.w,p.h)*0.42)}" fill="#7a5a3c"/>`
           + `<circle cx="${n(p.x)}" cy="${n(p.y)}" r="${n(Math.min(p.w,p.h)*0.55)}" fill="#5f9a3c"/>`
           + `<circle cx="${n(p.x-p.w*0.16)}" cy="${n(p.y+p.h*0.10)}" r="${n(Math.min(p.w,p.h)*0.30)}" fill="#6fae48"/>`;
        break;
      case 'curtains':
        s += `<rect x="${n(x)}" y="${n(y)}" width="${n(p.w*0.22)}" height="${n(p.h)}" rx="0.8" fill="#8a5f72"/>`
           + `<rect x="${n(x+p.w*0.78)}" y="${n(y)}" width="${n(p.w*0.22)}" height="${n(p.h)}" rx="0.8" fill="#8a5f72"/>`;
        break;
      case 'range':
        s += sh + `<rect x="${n(x)}" y="${n(y)}" width="${n(p.w)}" height="${n(p.h)}" rx="1" fill="#3a3f42"/>`
           + `<rect x="${n(x+p.w*0.08)}" y="${n(y+p.h*0.18)}" width="${n(p.w*0.36)}" height="${n(p.h*0.6)}" rx="1" fill="#22262a"/>`
           + `<circle cx="${n(x+p.w*0.70)}" cy="${n(y+p.h*0.34)}" r="${n(p.h*0.14)}" fill="#8b939a"/>`
           + `<circle cx="${n(x+p.w*0.86)}" cy="${n(y+p.h*0.34)}" r="${n(p.h*0.14)}" fill="#8b939a"/>`;
        break;
      case 'dresser': case 'larder': case 'wardrobe': case 'shelves':
        s += sh + `<rect x="${n(x)}" y="${n(y)}" width="${n(p.w)}" height="${n(p.h)}" rx="1" fill="#8a6a45"/>`
           + `<line x1="${n(x+p.w*0.5)}" y1="${n(y)}" x2="${n(x+p.w*0.5)}" y2="${n(y+p.h)}" stroke="#6d5133" stroke-width="0.5"/>`
           + `<circle cx="${n(x+p.w*0.42)}" cy="${n(y+p.h*0.5)}" r="0.7" fill="#e8d9a8"/>`
           + `<circle cx="${n(x+p.w*0.58)}" cy="${n(y+p.h*0.5)}" r="0.7" fill="#e8d9a8"/>`;
        break;
      case 'goodbed':
        s += sh + `<rect x="${n(x)}" y="${n(y)}" width="${n(p.w)}" height="${n(p.h)}" rx="1.4" fill="#6d5133"/>`
           + `<rect x="${n(x+p.w*0.08)}" y="${n(y+p.h*0.14)}" width="${n(p.w*0.84)}" height="${n(p.h*0.72)}" rx="1" fill="#e8eef2"/>`;
        break;
      case 'desk':
        s += sh + `<rect x="${n(x)}" y="${n(y)}" width="${n(p.w)}" height="${n(p.h)}" rx="1" fill="#a9764a"/>`
           + `<rect x="${n(x+p.w*0.30)}" y="${n(y+p.h*0.16)}" width="${n(p.w*0.40)}" height="${n(p.h*0.5)}" rx="0.8" fill="#2f3a40"/>`;
        break;
      case 'rolltop':
        s += sh + `<rect x="${n(x)}" y="${n(y)}" width="${n(p.w)}" height="${n(p.h)}" rx="${n(Math.min(p.w,p.h)*0.45)}" fill="#f2f7fa"/>`
           + `<rect x="${n(x+p.w*0.12)}" y="${n(y+p.h*0.2)}" width="${n(p.w*0.76)}" height="${n(p.h*0.6)}" rx="${n(Math.min(p.w,p.h)*0.3)}" fill="#cfe4ee"/>`;
        break;
      case 'stove':
        s += sh + `<rect x="${n(x)}" y="${n(y)}" width="${n(p.w)}" height="${n(p.h)}" rx="1" fill="#33383b"/>`
           + `<rect x="${n(x+p.w*0.18)}" y="${n(y+p.h*0.24)}" width="${n(p.w*0.64)}" height="${n(p.h*0.5)}" rx="0.8"
             fill="${hearthLit() ? '#f0a24b' : '#1d2124'}"/>`;
        break;
    }
  });
  return s;
}

/* append to whatever p100 draws for the room */
if(typeof fRoom === 'function'){
  const _fRoomBase = fRoom;
  fRoom = function(r, R, W){
    const base = _fRoomBase.apply(this, arguments);
    let extra = '';
    try{ extra = furnArt(r, R); }catch(e){}
    return base + extra;
  };
}

/* ---------- the panel, on the house you clicked ---------- */
function furnishHTML(){
  const plan = assignRooms();
  const spend = Object.keys(furnInit()).reduce((a,k)=>
    a + furnIn(k).reduce((b,id)=>b + (FURNMAP[id]?FURNMAP[id].cost:0), 0), 0);

  let h = `<div class="ph" style="margin:8px -11px 6px;padding-left:0">Furnishings</div>
    <div class="muted" style="margin-bottom:6px">Each room takes a few things, and the second of
    anything is worth less than the first — spend where the household actually sits.
    <b>${fmt(spend)}</b> in so far.</div>`;

  plan.rooms.forEach(r=>{
    const have = furnIn(r.k), slots = furnSlots(r);
    const opts = furnFor(r).filter(f=>have.indexOf(f.id) < 0);
    h += `<div style="margin:0 0 7px">
      <div style="display:flex;align-items:baseline;gap:6px">
        <b style="font-size:12px">${r.label}</b>
        <span class="muted" style="font-size:10px">${have.length}/${slots} · comfort ${(roomComfort(r)).toFixed(2)}</span></div>`;
    if(have.length) h += `<div style="display:flex;gap:4px;flex-wrap:wrap;margin:3px 0">` + have.map(id=>{
      const f = FURNMAP[id];
      return `<button class="chip" onclick="G.sellFurnish('${r.k}','${id}')"
        data-tip="${esc(`<b>${f.n}</b>${f.cat} · adds ${f.c.toFixed(2)} comfort<hr>Click to sell it on for ${fmt(Math.round(f.cost*0.55))}.`)}">${f.n} ×</button>`;
    }).join('') + `</div>`;
    if(have.length < slots && opts.length){
      h += `<div style="display:flex;gap:4px;flex-wrap:wrap">` + opts.slice(0,4).map(f=>
        `<button class="chip" ${S.cash < f.cost ? 'disabled' : ''} onclick="G.buyFurnish('${r.k}','${f.id}')"
          data-tip="${esc(`<b>${f.n}</b>${f.cat}<hr><div class="tl"><span>Cost</span><span class="tk">${fmt(f.cost)}</span></div><div class="tl"><span>Comfort</span><b>+${f.c.toFixed(2)}</b></div><span class="tg">Worth less if it is not the first thing in the room.</span>`)}">
          + ${f.n} ${fmt(f.cost)}</button>`).join('') + `</div>`;
    } else if(have.length >= slots){
      h += `<div class="muted" style="font-size:10px">Full.</div>`;
    }
    h += `</div>`;
  });
  return h;
}

if(typeof inspHTML === 'function'){
  const _inspFurn = inspHTML;
  inspHTML = function(){
    const base = _inspFurn.apply(this, arguments);
    try{
      /* selection is the global `sel` holding an id — there is no
         selObj(), which is why the first version of this silently fell
         through to the base panel every time */
      const o = (S.objs || []).find(z=>z.id === sel);
      if(!o || !BPMAP[o.bp] || BPMAP[o.bp].kind !== 'home') return base;
      return base + `<div class="card">${furnishHTML()}</div>`;
    }catch(e){}
    return base;
  };
}

/* ---------- handle ---------- */
G.furnishAudit = function(){
  const plan = assignRooms();
  return {
    spent: Object.keys(furnInit()).reduce((a,k)=>
      a + furnIn(k).reduce((b,id)=>b + (FURNMAP[id]?FURNMAP[id].cost:0), 0), 0),
    rooms: plan.rooms.map(r=>
      `${r.label}: ${furnIn(r.k).length}/${furnSlots(r)} — ${furnIn(r.k).map(i=>FURNMAP[i].n).join(', ') || 'empty'}`
      + ` · comfort ${roomComfort(r).toFixed(2)}`),
    houseComfort: +houseComfort().toFixed(3),
    catalogue: FURNISH.length,
    diminishing: 'each further item in a room is worth 0.66x the one before',
  };
};
