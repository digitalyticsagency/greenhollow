/* =====================================================================
   THE INTERIOR, DRAWN FROM THE PLAN AND FROM WHO IS HOME

   p99 works out what rooms the house has. This draws them, and makes the
   drawing answer to what is actually happening.

   ARCHITECTURAL. The shell is a filled ring rather than a stroked
   rectangle, so the corners mitre properly and the wall reads as having
   thickness - which is the single thing that separates a floorplan from
   a rectangle with a line round it. Partitions are drawn thinner than
   the shell, at the thickness the house style implies: a stone croft's
   walls are twice a container home's. Every room has skirting, its own
   floor finish, and furniture set against the wall it would really stand
   against rather than floating in the middle.

   IT ANSWERS TO THE HOUSEHOLD. The things that were painted on before
   and are now conditional:

     beds        one per person who sleeps there, made or slept in
                 depending on whether that person is actually asleep
     the table   laid at mealtimes, with a place per person eating
     the hearth  lit when it is cold or dark, out on a summer afternoon
     tidiness    low morale leaves the place cluttered; a tidy house is
                 something you can see rather than a number in a panel

   COMFORT, AS ASKED - SMALL. Every room scores for what is in it and how
   well it suits the household, and the house average is a comfort score
   that eases the rest and social needs slightly and nudges morale. It is
   deliberately a small effect on systems that already exist rather than a
   new currency: a well-appointed house makes the family recover a little
   faster, and that is all.
   ===================================================================== */

function personAsleep(p){ return /asleep|in bed/i.test((p && p.act) || ''); }
function anyoneEating(){
  return (S.family || []).some(p=>/breakfast|lunch|dinner|eating/i.test(p.act || ''));
}
function hearthLit(){
  if(S.season === 2) return true;                                  /* winter */
  if(['frost','snow','storm','rain'].includes(S.weather)) return true;
  return (typeof isNight === 'function') ? isNight() : false;
}
function tidiness(){ return Math.max(0, Math.min(1, (S.morale === undefined ? 0.6 : S.morale))); }

/* ---------- furniture, drawn against walls ---------- */
function fKitchen(R, W){
  const run = R.h * 0.22;
  let s = '';
  /* counter run along the top wall, with a sink and a hob */
  s += `<rect x="${n(R.x)}" y="${n(R.y)}" width="${n(R.w)}" height="${n(run)}" fill="#8e9aa2"/>`;
  s += `<rect x="${n(R.x)}" y="${n(R.y)}" width="${n(R.w)}" height="${n(run*0.32)}" fill="#aab6bd"/>`;
  s += `<rect x="${n(R.x+R.w*0.08)}" y="${n(R.y+run*0.30)}" width="${n(R.w*0.20)}" height="${n(run*0.48)}" rx="1" fill="#ccd6dc"/>`;
  [0.50,0.62,0.74,0.86].forEach(fx=>
    s += `<circle cx="${n(R.x+R.w*fx)}" cy="${n(R.y+run*0.55)}" r="${n(run*0.13)}" fill="#3c454b"/>`);
  /* tall units on the right wall */
  s += `<rect x="${n(R.x+R.w-R.w*0.16)}" y="${n(R.y+run+1)}" width="${n(R.w*0.16)}" height="${n(R.h*0.34)}" rx="1" fill="#dfe5e8"/>`;
  s += `<line x1="${n(R.x+R.w-R.w*0.16)}" y1="${n(R.y+run+1+R.h*0.17)}" x2="${n(R.x+R.w)}" y2="${n(R.y+run+1+R.h*0.17)}" stroke="#b9c2c7" stroke-width="0.6"/>`;
  /* table, laid if anyone is eating */
  const tx = R.x + R.w*0.40, ty = R.y + R.h*0.68;
  const tw = R.w*0.46, th = R.h*0.26;
  s += `<ellipse cx="${n(tx+1.4)}" cy="${n(ty+1.8)}" rx="${n(tw/2)}" ry="${n(th/2)}" fill="#000" opacity=".13"/>`;
  s += `<rect x="${n(tx-tw/2)}" y="${n(ty-th/2)}" width="${n(tw)}" height="${n(th)}" rx="2" fill="#a9764a"/>`;
  s += `<rect x="${n(tx-tw/2)}" y="${n(ty-th/2)}" width="${n(tw)}" height="${n(th*0.34)}" rx="2" fill="#c08f5c"/>`;
  /* one place per person actually at the table, plus you if a meal is on */
  const atTable = (S.family || []).filter(p=>/breakfast|lunch|dinner|eating/i.test(p.act||'')).length;
  if(atTable){
    const nn = Math.min(4, atTable + 1);
    for(let i=0;i<nn;i++){
      const px = tx - tw*0.32 + (tw*0.64) * (nn===1?0.5:i/(nn-1));
      s += `<circle cx="${n(px)}" cy="${n(ty)}" r="${n(Math.min(th,tw)*0.17)}" fill="#f4f7f9"/>`;
      s += `<circle cx="${n(px)}" cy="${n(ty)}" r="${n(Math.min(th,tw)*0.09)}" fill="#e2c9a4"/>`;
    }
  }
  /* chairs tucked under */
  [-0.30,0.30].forEach(dx=>
    s += `<rect x="${n(tx+tw*dx-tw*0.10)}" y="${n(ty+th*0.56)}" width="${n(tw*0.20)}" height="${n(th*0.26)}" rx="1.2" fill="#8a6a45"/>`);
  return s;
}

function fLiving(R, W){
  let s = '';
  /* rug, centred */
  s += `<ellipse cx="${n(R.x+R.w*0.44)}" cy="${n(R.y+R.h*0.56)}" rx="${n(R.w*0.29)}" ry="${n(R.h*0.27)}" fill="#9c5b52"/>`;
  s += `<ellipse cx="${n(R.x+R.w*0.44)}" cy="${n(R.y+R.h*0.56)}" rx="${n(R.w*0.20)}" ry="${n(R.h*0.18)}" fill="none" stroke="#c98a72" stroke-width="1" opacity=".8"/>`;
  /* sofa against the top wall, facing in */
  s += `<rect x="${n(R.x+R.w*0.12)}" y="${n(R.y+1.2)}" width="${n(R.w*0.42)}" height="${n(R.h*0.18)}" rx="2.4" fill="#57755f"/>`;
  s += `<rect x="${n(R.x+R.w*0.14)}" y="${n(R.y+1.2+R.h*0.05)}" width="${n(R.w*0.17)}" height="${n(R.h*0.11)}" rx="1.6" fill="#6b8b72"/>`;
  s += `<rect x="${n(R.x+R.w*0.34)}" y="${n(R.y+1.2+R.h*0.05)}" width="${n(R.w*0.17)}" height="${n(R.h*0.11)}" rx="1.6" fill="#6b8b72"/>`;
  /* armchair on the left wall */
  s += `<rect x="${n(R.x+1.2)}" y="${n(R.y+R.h*0.40)}" width="${n(R.w*0.13)}" height="${n(R.h*0.20)}" rx="2.2" fill="#5f7a6b"/>`;
  /* hearth in the right wall, lit or cold */
  const lit = hearthLit();
  const hx = R.x+R.w-R.w*0.13, hy = R.y+R.h*0.30;
  s += `<rect x="${n(hx)}" y="${n(hy)}" width="${n(R.w*0.13)}" height="${n(R.h*0.30)}" rx="1.4" fill="#7b6f66"/>`;
  s += `<rect x="${n(hx+R.w*0.025)}" y="${n(hy+R.h*0.06)}" width="${n(R.w*0.08)}" height="${n(R.h*0.18)}" rx="1" fill="#2e2620"/>`;
  if(lit){
    s += `<circle class="hearth" cx="${n(hx+R.w*0.065)}" cy="${n(hy+R.h*0.15)}" r="${n(R.h*0.075)}" fill="#f0a24b"/>`;
    s += `<circle class="hearth-glow" cx="${n(hx+R.w*0.065)}" cy="${n(hy+R.h*0.15)}" r="${n(R.h*0.26)}" fill="#f0a24b" opacity=".18"/>`;
  } else {
    s += `<circle cx="${n(hx+R.w*0.065)}" cy="${n(hy+R.h*0.15)}" r="${n(R.h*0.05)}" fill="#3a332c"/>`;
  }
  /* bookshelf on the bottom wall */
  s += `<rect x="${n(R.x+R.w*0.08)}" y="${n(R.y+R.h-R.h*0.12)}" width="${n(R.w*0.26)}" height="${n(R.h*0.10)}" rx="1" fill="#8a6a45"/>`;
  for(let i=0;i<7;i++)
    s += `<rect x="${n(R.x+R.w*(0.095+i*0.033))}" y="${n(R.y+R.h-R.h*0.11)}" width="${n(R.w*0.021)}" height="${n(R.h*0.078)}"
      fill="${['#b45b4a','#4f7f96','#c8a44e','#6b8b72'][i%4]}"/>`;
  return s;
}

/* a bed, with someone in it if they are asleep */
function fBed(R, wide, who){
  const bw = wide ? R.w*0.56 : R.w*0.34;
  const bh = R.h*0.46;
  const bx = R.x + (wide ? R.w*0.10 : R.w*0.08);
  const by = R.y + R.h*0.16;
  const kid = !wide;
  let s = `<rect x="${n(bx+1.2)}" y="${n(by+1.5)}" width="${n(bw)}" height="${n(bh)}" rx="2" fill="#000" opacity=".13"/>`;
  s += `<rect x="${n(bx)}" y="${n(by)}" width="${n(bw)}" height="${n(bh)}" rx="2" fill="#8a6a45"/>`;
  s += `<rect x="${n(bx+0.7)}" y="${n(by+bh*0.18)}" width="${n(bw-1.4)}" height="${n(bh*0.78)}" rx="1.4"
    fill="${kid?'#7fa8c4':'#7f8fa6'}"/>`;
  s += `<rect x="${n(bx+bw*0.16)}" y="${n(by+bh*0.04)}" width="${n(bw*0.68)}" height="${n(bh*0.15)}" rx="1.8" fill="#fbfdff"/>`;
  const sleeping = (who || []).filter(personAsleep).length;
  if(sleeping){
    /* the quilt rises over whoever is under it */
    for(let i=0;i<Math.min(2,sleeping);i++){
      const cx = bx + bw*(sleeping>1 ? (0.32+i*0.36) : 0.5);
      s += `<ellipse cx="${n(cx)}" cy="${n(by+bh*0.55)}" rx="${n(bw*0.20)}" ry="${n(bh*0.28)}"
        fill="${kid?'#8fb6cf':'#8d9bb0'}"/>`;
      s += `<circle cx="${n(cx)}" cy="${n(by+bh*0.24)}" r="${n(bh*0.09)}" fill="#e8c9a8"/>`;
    }
  } else {
    /* made, with the quilt folded at the foot */
    s += `<rect x="${n(bx+0.7)}" y="${n(by+bh*0.74)}" width="${n(bw-1.4)}" height="${n(bh*0.18)}" rx="1.2"
      fill="${kid?'#5f8fb0':'#66748a'}"/>`;
  }
  return s;
}

function fRoom(r, R, W){
  switch(r.t){
    case 'kitchen': return fKitchen(R, W);
    case 'living':  return fLiving(R, W);
    case 'bath': {
      let s = `<rect x="${n(R.x+R.w*0.10)}" y="${n(R.y+R.h*0.10)}" width="${n(R.w*0.78)}" height="${n(R.h*0.30)}" rx="2.6" fill="#e8f1f5"/>`;
      s += `<rect x="${n(R.x+R.w*0.18)}" y="${n(R.y+R.h*0.16)}" width="${n(R.w*0.62)}" height="${n(R.h*0.19)}" rx="2" fill="#bcdbe8"/>`;
      s += `<circle cx="${n(R.x+R.w*0.28)}" cy="${n(R.y+R.h*0.60)}" r="${n(Math.min(R.w,R.h)*0.13)}" fill="#e8f1f5"/>`;
      s += `<rect x="${n(R.x+R.w*0.56)}" y="${n(R.y+R.h*0.52)}" width="${n(R.w*0.28)}" height="${n(R.h*0.18)}" rx="1.8" fill="#e8f1f5"/>`;
      return s;
    }
    case 'office': {
      let s = `<rect x="${n(R.x+R.w*0.08)}" y="${n(R.y+R.h*0.12)}" width="${n(R.w*0.80)}" height="${n(R.h*0.20)}" rx="1.6" fill="#8a6a45"/>`;
      s += `<rect x="${n(R.x+R.w*0.24)}" y="${n(R.y+R.h*0.16)}" width="${n(R.w*0.26)}" height="${n(R.h*0.11)}" rx="1" fill="#2f3a40"/>`;
      s += `<rect x="${n(R.x+R.w*0.36)}" y="${n(R.y+R.h*0.40)}" width="${n(R.w*0.22)}" height="${n(R.h*0.16)}" rx="2" fill="#5f7a6b"/>`;
      s += `<rect x="${n(R.x+R.w*0.08)}" y="${n(R.y+R.h-R.h*0.22)}" width="${n(R.w*0.34)}" height="${n(R.h*0.14)}" rx="1.2" fill="#7d5f3c"/>`;
      return s;
    }
    case 'pantry': case 'store': {
      let s = '';
      for(let i=0;i<3;i++)
        s += `<rect x="${n(R.x+R.w*0.08)}" y="${n(R.y+R.h*(0.14+i*0.26))}" width="${n(R.w*0.84)}" height="${n(R.h*0.13)}" rx="1" fill="#8a6a45"/>`;
      for(let i=0;i<10;i++)
        s += `<circle cx="${n(R.x+R.w*(0.14+ (i%5)*0.18))}" cy="${n(R.y+R.h*(0.20+Math.floor(i/5)*0.26))}"
          r="${n(Math.min(R.w,R.h)*0.045)}" fill="${['#b45b4a','#c8a44e','#6b8b72','#a9764a','#4f7f96'][i%5]}"/>`;
      return s;
    }
    case 'util': {
      let s = `<rect x="${n(R.x+R.w*0.10)}" y="${n(R.y+R.h*0.12)}" width="${n(R.w*0.36)}" height="${n(R.h*0.24)}" rx="1.6" fill="#dfe5e8"/>`;
      s += `<circle cx="${n(R.x+R.w*0.28)}" cy="${n(R.y+R.h*0.24)}" r="${n(Math.min(R.w,R.h)*0.07)}" fill="#9fb3bd"/>`;
      s += `<rect x="${n(R.x+R.w*0.54)}" y="${n(R.y+R.h*0.12)}" width="${n(R.w*0.34)}" height="${n(R.h*0.24)}" rx="1.6" fill="#e8eef1"/>`;
      s += `<rect x="${n(R.x+R.w*0.10)}" y="${n(R.y+R.h*0.56)}" width="${n(R.w*0.78)}" height="${n(R.h*0.10)}" rx="1" fill="#8a6a45"/>`;
      return s;
    }
    case 'guest': return fBed(R, true, []);
    case 'hall': {
      /* runner and coat hooks - a hall is not an empty corridor */
      let s = `<rect x="${n(R.x+R.w*0.06)}" y="${n(R.y+R.h*0.30)}" width="${n(R.w*0.50)}" height="${n(R.h*0.40)}" rx="1.4" fill="#8d6a5e" opacity=".7"/>`;
      for(let i=0;i<4;i++)
        s += `<circle cx="${n(R.x+R.w*(0.66+i*0.07))}" cy="${n(R.y+R.h*0.30)}" r="${n(R.h*0.10)}"
          fill="${['#b45b4a','#4f7f96','#c8a44e','#6b8b72'][i]}"/>`;
      return s;
    }
    case 'bed': {
      const occupants = r.use === 'main'
        ? (S.family||[]).filter(f=>f.role==='partner').concat(S.you?[S.you]:[])
        : (r.kids || []);
      if(r.use === 'main') return fBed(R, true, occupants)
        + `<rect x="${n(R.x+R.w*0.74)}" y="${n(R.y+R.h*0.16)}" width="${n(R.w*0.18)}" height="${n(R.h*0.14)}" rx="1" fill="#8a6a45"/>`
        + `<circle cx="${n(R.x+R.w*0.83)}" cy="${n(R.y+R.h*0.23)}" r="${n(R.h*0.045)}" fill="#f5d98a"/>`;
      let s = '';
      const kids = r.kids || [];
      if(kids.length > 1){
        s += fBed({x:R.x, y:R.y, w:R.w*0.5, h:R.h}, false, [kids[0]]);
        s += fBed({x:R.x+R.w*0.5, y:R.y, w:R.w*0.5, h:R.h}, false, [kids[1]]);
      } else s += fBed(R, false, kids);
      /* toy box */
      s += `<rect x="${n(R.x+R.w*0.28)}" y="${n(R.y+R.h-R.h*0.16)}" width="${n(R.w*0.34)}" height="${n(R.h*0.11)}" rx="1.2" fill="#b4794a"/>`;
      return s;
    }
    default: return '';
  }
}

/* ---------- clutter when the house is unhappy ---------- */
function clutterArt(plan, w, h){
  const t = tidiness();
  if(t > 0.55) return '';
  const amount = Math.round((0.55 - t) * 26);
  let s = '';
  for(let i=0;i<amount;i++){
    const r = plan.rooms[Math.floor(hash(i*4.7)*plan.rooms.length)] || plan.rooms[0];
    const x = (r.x + 0.12*r.w + hash(i*2.1)*r.w*0.76) * w;
    const y = (r.y + 0.12*r.h + hash(i*3.3)*r.h*0.76) * h;
    s += `<rect x="${n(x)}" y="${n(y)}" width="${n(1.6+hash(i)*2.4)}" height="${n(1.2+hash(i*1.7)*1.8)}"
      rx="0.6" fill="${['#8a6a45','#7f8fa6','#b45b4a','#6b8b72'][i%4]}" opacity=".55"/>`;
  }
  return s;
}

/* ---------- comfort ----------
   Sims' idea, kept small: a room is worth something for what is in it and
   whether it suits the people using it, and the house average eases the
   needs that already exist rather than adding a new one. */
function roomComfort(r){
  let c = 0.5;
  if(r.t === 'living')  c = 0.72;
  if(r.t === 'kitchen') c = 0.66;
  if(r.t === 'bed')     c = r.kids && r.kids.length > 1 ? 0.52 : 0.70;
  if(r.t === 'bath')    c = 0.62;
  if(r.t === 'office')  c = 0.68;
  if(r.t === 'pantry' || r.t === 'store' || r.t === 'util') c = 0.55;
  if(r.t === 'hall')    c = 0.45;
  const fin = (homeInfo().finish || '').toLowerCase();
  if(fin.indexOf('arch') >= 0) c += 0.10;
  else if(fin.indexOf('solar') >= 0) c += 0.04;
  return Math.max(0, Math.min(1, c));
}
function houseComfort(){
  const plan = assignRooms();
  if(!plan.rooms.length) return 0.5;
  let sum = 0; plan.rooms.forEach(r=>sum += roomComfort(r));
  let c = sum / plan.rooms.length;
  /* overcrowding is felt: more people than beds pulls it down */
  const beds = plan.rooms.filter(r=>r.t === 'bed').length;
  const people = 1 + (S.family || []).length;
  if(people > beds * 2) c -= 0.12;
  c = c * 0.75 + tidiness() * 0.25;
  return Math.max(0, Math.min(1, c));
}

/* the small effect: rest and social ease a little faster in a good house */
if(typeof tickHumanNeeds === 'function'){
  const _tickNeedsComfort = tickHumanNeeds;
  tickHumanNeeds = function(dt){
    const r = _tickNeedsComfort.apply(this, arguments);
    try{
      const c = houseComfort();
      const bonus = (c - 0.5) * 0.10 * dt;          /* +-5% of the base ease */
      if(bonus !== 0){
        (S.family || []).forEach(p=>{
          if(!p.need) return;
          if(/asleep|sitting|resting|fire|together|read/i.test(p.act || '')){
            p.need.rest   = Math.max(0, p.need.rest   - bonus);
            p.need.social = Math.max(0, p.need.social - bonus*0.6);
          }
        });
      }
    }catch(e){}
    return r;
  };
}
/* and it shows up in morale over a day, gently */
if(typeof advanceDay === 'function'){
  const _advComfort = advanceDay;
  advanceDay = function(){
    const r = _advComfort.apply(this, arguments);
    try{
      const c = houseComfort();
      S.morale = Math.max(0, Math.min(1, (S.morale === undefined ? 0.6 : S.morale) + (c - 0.55) * 0.02));
    }catch(e){}
    return r;
  };
}

/* ---------- the drawing ---------- */
if(typeof interiorArt === 'function'){
  interiorArt = function(w, h){
    const plan = (typeof syncROOMS === 'function') ? syncROOMS() : assignRooms();
    const W = wallSpec();
    const R = (r)=>({ x:r.x*w, y:r.y*h, w:r.w*w, h:r.h*h });
    let s = '';

    /* the shell, as a ring so the corners mitre */
    s += `<path d="M0 0 H${n(w)} V${n(h)} H0 Z
      M${n(W.ext)} ${n(W.ext)} V${n(h-W.ext)} H${n(w-W.ext)} V${n(W.ext)} Z"
      fill="${W.c}" fill-rule="evenodd"/>`;
    s += `<rect x="0.4" y="0.4" width="${n(w-0.8)}" height="${n(h-0.8)}" rx="2" fill="none"
      stroke="${W.s}" stroke-width="0.7" opacity=".7"/>`;

    /* floors and skirting, then furniture */
    plan.rooms.forEach(r=>{ const q = R(r); s += roomFloor(q, r.t) + skirting(q); });

    /* partitions: drawn as filled bars round each room, thinner than the shell */
    plan.rooms.forEach(r=>{
      const q = R(r);
      s += `<rect x="${n(q.x - W.int/2)}" y="${n(q.y - W.int/2)}" width="${n(q.w + W.int)}" height="${n(q.h + W.int)}"
        rx="1" fill="none" stroke="${W.c}" stroke-width="${n(W.int)}"/>`;
    });

    plan.rooms.forEach(r=>{ s += fRoom(r, R(r), W); });

    /* Doorways. Each room opens onto the nearest circulation space, not
       onto whichever hall happens to be first in the list - a five bed
       house has a landing as well as a hall, and its back bedrooms belong
       to the landing. */
    const halls = plan.rooms.filter(r=>r.t === 'hall');
    if(halls.length){
      plan.rooms.forEach(r=>{
        if(r.t === 'hall') return;
        const q = R(r);
        let best = null, bestD = Infinity, bestBelow = true;
        halls.forEach(hl=>{
          const hq = R(hl);
          const dTop = Math.abs(q.y - (hq.y + hq.h));      /* hall is above */
          const dBot = Math.abs(hq.y - (q.y + q.h));       /* hall is below */
          if(dTop < bestD){ bestD = dTop; best = hq; bestBelow = true; }
          if(dBot < bestD){ bestD = dBot; best = hq; bestBelow = false; }
        });
        if(!best) return;
        s += doorGap(q.x, bestBelow ? q.y : q.y + q.h, q.w, true, W.int, floorTone(r.t));
      });
      /* the front door, in the exterior wall beside the main hall */
      const hq = R(halls[0]);
      s += `<rect x="${n(-0.4)}" y="${n(hq.y + hq.h*0.18)}" width="${n(W.ext+0.8)}" height="${n(hq.h*0.64)}"
        fill="#4b3520"/>`;
      s += `<path d="M${n(W.ext)} ${n(hq.y + hq.h*0.82)} A${n(hq.h*0.64)} ${n(hq.h*0.64)} 0 0 0 ${n(W.ext + hq.h*0.64)} ${n(hq.y + hq.h*0.18)}"
        fill="none" stroke="#6b563c" stroke-opacity=".4" stroke-width="0.7" stroke-dasharray="1.6 1.4"/>`;
    }

    s += clutterArt(plan, w, h);

    /* lamplight, per room, after dark */
    const night = (typeof isNight === 'function') ? isNight() : false;
    if(night){
      s += `<rect x="0" y="0" width="${n(w)}" height="${n(h)}" rx="3" fill="#1b2740" opacity=".34"/>`;
      plan.rooms.forEach(r=>{
        if(r.t === 'hall' || r.t === 'store' || r.t === 'pantry') return;
        const q = R(r);
        s += `<ellipse cx="${n(q.x+q.w*0.5)}" cy="${n(q.y+q.h*0.45)}" rx="${n(q.w*0.55)}" ry="${n(q.h*0.5)}"
          fill="#ffd489" opacity="${r.t==='bed' ? '.10' : '.17'}"/>`;
      });
    } else {
      s += `<rect x="0" y="0" width="${n(w)}" height="${n(h)}" rx="3" fill="#ffd489" opacity=".06"/>`;
    }
    return s;
  };
}

/* ---------- handle ---------- */
G.interiorAudit = function(){
  const plan = assignRooms();
  return {
    rooms: plan.rooms.map(r=>`${r.label} [${r.t}] comfort ${roomComfort(r).toFixed(2)}`),
    houseComfort: +houseComfort().toFixed(3),
    tidiness: +tidiness().toFixed(2),
    hearthLit: hearthLit(),
    anyoneEating: anyoneEating(),
    asleep: (S.family||[]).filter(personAsleep).map(p=>p.name),
    walls: wallSpec(),
    effect: 'comfort eases rest/social slightly and nudges morale each day',
  };
};
