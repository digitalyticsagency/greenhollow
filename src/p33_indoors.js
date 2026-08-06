/* =====================================================================
   LIFE INDOORS

   homeSpot() returned a point 0.6 tiles below the bottom wall, so
   "going home" put everyone on the grass outside the front door. They
   slept on the lawn every night. This gives the house an actual
   interior with named rooms, sends people to the right room for what
   they are doing, and puts them to bed in an actual bed.

   It also hides people under the roof when the roof is on, because
   seeing the family walk across the roofline is what gave the old
   behaviour away in the first place.
   ===================================================================== */

function houseRect(){
  const ho = S.objs.find(o => BPMAP[o.bp] && BPMAP[o.bp].kind === 'home')
          || S.objs.find(o => o.bp === 'cabin');
  if(!ho) return null;
  const f = footprint(BPMAP[ho.bp], ho.rot);
  return { o:ho, x:ho.tx*T, y:ho.ty*T, w:f.w*T, h:f.h*T };
}

/* Rooms as fractions of the footprint, so the plan holds for any house
   size. Kept to a real cottage plan: service along the top, living in
   the middle, sleeping along the bottom. */
const ROOMS = {
  kitchen: {x:0.03, y:0.05, w:0.40, h:0.34},
  living:  {x:0.46, y:0.05, w:0.51, h:0.34},
  hall:    {x:0.03, y:0.41, w:0.94, h:0.12},
  bedMain: {x:0.03, y:0.56, w:0.34, h:0.40},
  bedKids: {x:0.39, y:0.56, w:0.34, h:0.40},
  bath:    {x:0.75, y:0.56, w:0.22, h:0.40},
};

/* a point inside a room, jittered per person so two people do not stack */
function roomPoint(room, seed){
  const H = houseRect(); if(!H) return null;
  const r = ROOMS[room] || ROOMS.living;
  const jx = (hash(seed*3.7)-0.5) * r.w * 0.44;
  const jy = (hash(seed*5.1)-0.5) * r.h * 0.44;
  return { x: H.x + (r.x + r.w/2 + jx)*H.w,
           y: H.y + (r.y + r.h/2 + jy)*H.h };
}

/* beds are fixed spots, not jittered - you sleep in your own bed */
function bedPoint(p, idx){
  const H = houseRect(); if(!H) return null;
  const kid = p.role === 'child';
  const r = kid ? ROOMS.bedKids : ROOMS.bedMain;
  const slot = kid ? (idx % 3) : (idx % 2);
  const fx = kid ? (0.22 + slot*0.28) : (0.32 + slot*0.36);
  return { x: H.x + (r.x + r.w*fx)*H.w,
           y: H.y + (r.y + r.h*0.42)*H.h };
}

function isIndoors(p){
  const H = houseRect(); if(!H) return false;
  return p.x >= H.x && p.x <= H.x+H.w && p.y >= H.y && p.y <= H.y+H.h;
}

/* ---------- the indoor timetable ---------- */
/* Returns a spot+act when the person should be inside, otherwise null so
   the outdoor routine keeps running. */
function indoorRoutine(p, idx){
  const H = houseRect(); if(!H) return null;
  const f = dayFrac();
  const storm = S.weather === 'storm';

  /* asleep: in bed, in the right room */
  if(f < 0.24 || f > 0.90){
    const b = bedPoint(p, idx);
    return b ? {...b, act:'asleep'} : null;
  }

  /* first thing: breakfast in the kitchen */
  if(f < 0.30){
    return {...roomPoint('kitchen', idx+1), act: p.role==='child' ? 'eating breakfast' : 'making breakfast'};
  }

  /* evening: dinner, washing up, then the children are put to bed */
  if(f > 0.78 && f <= 0.90){
    if(f > 0.86 && p.role === 'child')
      return {...bedPoint(p, idx), act:'being read to'};
    if(f > 0.84)
      return {...roomPoint('living', idx+2), act: p.role==='child' ? 'in pyjamas' : 'sitting by the fire'};
    if(f > 0.81)
      return {...roomPoint('kitchen', idx+3), act: p.role==='partner' ? 'washing up' : 'drying the dishes'};
    return {...roomPoint('living', idx), act:'having dinner'};
  }

  /* a storm keeps everyone in, whatever the hour */
  if(storm){
    const acts = p.role === 'child'
      ? ['drawing at the table','reading by the window','playing cards']
      : ['watching the storm','making tea','mending by the fire'];
    const room = (idx % 2) ? 'kitchen' : 'living';
    return {...roomPoint(room, idx+7), act: acts[idx % acts.length]};
  }

  return null;
}

/* indoor life takes priority over every outdoor routine */
const _routineIndoor = routine;
routine = function(p){
  const list = S.family.concat(S.workers || []);
  const idx = Math.max(0, list.findIndex(q => q.id === p.id));
  /* Farmhands live in their own cottage, not in the family's beds.
     They are not tagged with a role when tickPeople passes them in, so
     identify them by membership rather than by field. */
  const isWorker = (S.workers || []).some(w => w.id === p.id) || p.role === 'worker';
  if(!isWorker){
    const inside = indoorRoutine(p, idx);
    if(inside) return inside;
  }
  return _routineIndoor(p);
};

/* homeSpot itself was the original bug: it pointed at the grass below
   the house. Anything still calling it now lands in the hall. */
homeSpot = function(){
  const H = houseRect();
  if(!H) return {x:(FARM.x+4)*T, y:(FARM.y+4)*T};
  const r = ROOMS.hall;
  return { x: H.x + (r.x + r.w/2)*H.w, y: H.y + (r.y + r.h/2)*H.h };
};

/* ---------- you cannot see through a roof ---------- */
/* When the roof is on, people inside the footprint are hidden and the
   windows glow instead. That is both realistic and the whole reason the
   roof toggle exists. */
const _paintPeopleIndoor = paintPeople;
paintPeople = function(){
  const r = _paintPeopleIndoor.apply(this, arguments);
  const roofOff = SET('roofOff');
  const all = S.family.concat(S.workers || []);
  let hidden = 0;
  all.forEach(p=>{
    const el = document.querySelector(`[data-p="${p.id}"]`);
    if(!el) return;
    const tuckedIn = !roofOff && isIndoors(p);
    el.style.opacity = tuckedIn ? '0' : '';
    el.style.pointerEvents = tuckedIn ? 'none' : '';
    if(tuckedIn) hidden++;
  });
  const badge = document.getElementById('roofbtn');
  if(badge) badge.classList.toggle('has-people', hidden > 0);
  return r;
};

/* ---------- a much better interior ---------- */
function interiorArt(w, h){
  const R = (k)=>({ x:ROOMS[k].x*w, y:ROOMS[k].y*h, w:ROOMS[k].w*w, h:ROOMS[k].h*h });
  let s = '';

  /* floor: boards with staggered end-joints, warmer where the light falls */
  s += `<rect x="0" y="0" width="${n(w)}" height="${n(h)}" rx="3" fill="#c39a6b"/>`;
  const boards = Math.max(6, Math.round(h/9));
  for(let i=0;i<boards;i++){
    const by = h*i/boards;
    s += `<rect x="0" y="${n(by)}" width="${n(w)}" height="${n(h/boards)}"
      fill="${i%2 ? '#c9a273' : '#bd9265'}"/>`;
    s += `<line x1="0" y1="${n(by)}" x2="${n(w)}" y2="${n(by)}" stroke="#a37e52" stroke-width="0.5" opacity=".65"/>`;
    const j = 0.2 + hash(i*2.7)*0.6;
    s += `<line x1="${n(w*j)}" y1="${n(by)}" x2="${n(w*j)}" y2="${n(by + h/boards)}"
      stroke="#a37e52" stroke-width="0.5" opacity=".5"/>`;
  }

  /* walls: a thick shell plus partitions, with door gaps left open */
  const wallC = '#f1e8d9', wallS = '#b9ab95';
  s += `<rect x="0.8" y="0.8" width="${n(w-1.6)}" height="${n(h-1.6)}" rx="3"
    fill="none" stroke="${wallC}" stroke-width="3.2"/>`;
  s += `<rect x="2.6" y="2.6" width="${n(w-5.2)}" height="${n(h-5.2)}" rx="2"
    fill="none" stroke="${wallS}" stroke-width="0.8" opacity=".5"/>`;
  const part = (x1,y1,x2,y2)=>`<line x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}"
    stroke="${wallC}" stroke-width="2.6" stroke-linecap="round"/>`;
  s += part(w*0.445, 2, w*0.445, h*0.40);        // kitchen | living
  s += part(2, h*0.40, w*0.30, h*0.40);          // hall wall, door gap after
  s += part(w*0.42, h*0.40, w*0.98, h*0.40);
  s += part(2, h*0.545, w*0.28, h*0.545);
  s += part(w*0.40, h*0.545, w*0.98, h*0.545);
  s += part(w*0.375, h*0.56, w*0.375, h-2);      // bedroom divider
  s += part(w*0.735, h*0.56, w*0.735, h-2);      // bath divider

  /* ---- kitchen ---- */
  const K = R('kitchen');
  s += `<rect x="${n(K.x+2)}" y="${n(K.y+2)}" width="${n(K.w-4)}" height="${n(K.h*0.26)}" rx="1.6" fill="#8e9aa2"/>`;
  s += `<rect x="${n(K.x+2)}" y="${n(K.y+2)}" width="${n(K.w-4)}" height="${n(K.h*0.09)}" rx="1.6" fill="#aab6bd"/>`;
  s += `<rect x="${n(K.x+K.w*0.10)}" y="${n(K.y+K.h*0.09)}" width="${n(K.w*0.20)}" height="${n(K.h*0.13)}" rx="1" fill="#ccd6dc"/>`;
  [0.52,0.64,0.76,0.88].forEach((fx,i)=>
    s += `<circle cx="${n(K.x+K.w*fx)}" cy="${n(K.y+K.h*0.15)}" r="${n(K.h*0.035)}" fill="#3c454b"/>`);
  s += `<rect x="${n(K.x+K.w*0.72)}" y="${n(K.y+K.h*0.34)}" width="${n(K.w*0.24)}" height="${n(K.h*0.42)}" rx="2" fill="#dfe5e8"/>`;
  s += `<line x1="${n(K.x+K.w*0.72)}" y1="${n(K.y+K.h*0.52)}" x2="${n(K.x+K.w*0.96)}" y2="${n(K.y+K.h*0.52)}" stroke="#b9c2c7" stroke-width="0.8"/>`;
  /* table with chairs and two mugs */
  const tx = K.x+K.w*0.30, ty = K.y+K.h*0.58;
  s += `<ellipse cx="${n(tx+2)}" cy="${n(ty+3)}" rx="${n(K.w*0.24)}" ry="${n(K.h*0.16)}" fill="#000" opacity=".14"/>`;
  s += `<rect x="${n(tx-K.w*0.22)}" y="${n(ty-K.h*0.14)}" width="${n(K.w*0.44)}" height="${n(K.h*0.28)}" rx="2.4" fill="#a9764a"/>`;
  s += `<rect x="${n(tx-K.w*0.22)}" y="${n(ty-K.h*0.14)}" width="${n(K.w*0.44)}" height="${n(K.h*0.09)}" rx="2.4" fill="#c08f5c"/>`;
  [-0.13,0.13].forEach(dx=>{
    s += `<circle cx="${n(tx+K.w*dx)}" cy="${n(ty)}" r="${n(K.h*0.05)}" fill="#f0f4f6"/>`;
    s += `<circle cx="${n(tx+K.w*dx)}" cy="${n(ty)}" r="${n(K.h*0.025)}" fill="#6b4f36"/>`;
  });

  /* ---- living ---- */
  const L = R('living');
  s += `<ellipse cx="${n(L.x+L.w*0.45)}" cy="${n(L.y+L.h*0.58)}" rx="${n(L.w*0.30)}" ry="${n(L.h*0.28)}" fill="#9c5b52"/>`;
  s += `<ellipse cx="${n(L.x+L.w*0.45)}" cy="${n(L.y+L.h*0.58)}" rx="${n(L.w*0.21)}" ry="${n(L.h*0.19)}" fill="none" stroke="#c98a72" stroke-width="1.2" opacity=".8"/>`;
  s += `<ellipse cx="${n(L.x+L.w*0.45)}" cy="${n(L.y+L.h*0.58)}" rx="${n(L.w*0.11)}" ry="${n(L.h*0.10)}" fill="#c98a72" opacity=".5"/>`;
  /* sofa with cushions */
  s += `<rect x="${n(L.x+L.w*0.10)}" y="${n(L.y+L.h*0.06)}" width="${n(L.w*0.44)}" height="${n(L.h*0.20)}" rx="2.6" fill="#57755f"/>`;
  s += `<rect x="${n(L.x+L.w*0.12)}" y="${n(L.y+L.h*0.10)}" width="${n(L.w*0.18)}" height="${n(L.h*0.12)}" rx="1.8" fill="#6b8b72"/>`;
  s += `<rect x="${n(L.x+L.w*0.33)}" y="${n(L.y+L.h*0.10)}" width="${n(L.w*0.18)}" height="${n(L.h*0.12)}" rx="1.8" fill="#6b8b72"/>`;
  /* armchair */
  s += `<rect x="${n(L.x+L.w*0.62)}" y="${n(L.y+L.h*0.10)}" width="${n(L.w*0.17)}" height="${n(L.h*0.18)}" rx="2.4" fill="#5f7a6b"/>`;
  /* hearth on the outer wall, with a glow */
  s += `<rect x="${n(L.x+L.w*0.84)}" y="${n(L.y+L.h*0.30)}" width="${n(L.w*0.14)}" height="${n(L.h*0.30)}" rx="1.6" fill="#7b6f66"/>`;
  s += `<rect x="${n(L.x+L.w*0.865)}" y="${n(L.y+L.h*0.36)}" width="${n(L.w*0.09)}" height="${n(L.h*0.18)}" rx="1.2" fill="#2e2620"/>`;
  s += `<circle class="hearth" cx="${n(L.x+L.w*0.91)}" cy="${n(L.y+L.h*0.45)}" r="${n(L.h*0.10)}" fill="#f0a24b"/>`;
  s += `<circle class="hearth-glow" cx="${n(L.x+L.w*0.91)}" cy="${n(L.y+L.h*0.45)}" r="${n(L.h*0.30)}" fill="#f0a24b" opacity=".18"/>`;
  /* bookshelf and a pot plant */
  s += `<rect x="${n(L.x+L.w*0.06)}" y="${n(L.y+L.h*0.68)}" width="${n(L.w*0.26)}" height="${n(L.h*0.13)}" rx="1.2" fill="#8a6a45"/>`;
  for(let i=0;i<7;i++)
    s += `<rect x="${n(L.x+L.w*(0.075+i*0.033))}" y="${n(L.y+L.h*0.695)}" width="${n(L.w*0.022)}" height="${n(L.h*0.10)}"
      fill="${['#b45b4a','#4f7f96','#c8a44e','#6b8b72'][i%4]}"/>`;
  s += `<circle cx="${n(L.x+L.w*0.44)}" cy="${n(L.y+L.h*0.86)}" r="${n(L.h*0.07)}" fill="#7a5a3c"/>`;
  s += `<circle cx="${n(L.x+L.w*0.44)}" cy="${n(L.y+L.h*0.83)}" r="${n(L.h*0.08)}" fill="#5f9a3c"/>`;

  /* ---- bedrooms ---- */
  const bed = (B, fx, wf, kid)=>{
    const bx = B.x + B.w*fx, by = B.y + B.h*0.16, bw = B.w*wf, bh = B.h*0.56;
    let t = `<rect x="${n(bx+1.4)}" y="${n(by+1.8)}" width="${n(bw)}" height="${n(bh)}" rx="2" fill="#000" opacity=".14"/>`;
    t += `<rect x="${n(bx)}" y="${n(by)}" width="${n(bw)}" height="${n(bh)}" rx="2" fill="#8a6a45"/>`;
    t += `<rect x="${n(bx+0.8)}" y="${n(by+bh*0.20)}" width="${n(bw-1.6)}" height="${n(bh*0.76)}" rx="1.6"
      fill="${kid ? '#7fa8c4' : '#7f8fa6'}"/>`;
    t += `<rect x="${n(bx+0.8)}" y="${n(by+bh*0.20)}" width="${n(bw-1.6)}" height="${n(bh*0.16)}" rx="1.6" fill="#eef3f7"/>`;
    /* folded quilt at the foot */
    t += `<rect x="${n(bx+0.8)}" y="${n(by+bh*0.74)}" width="${n(bw-1.6)}" height="${n(bh*0.18)}" rx="1.4"
      fill="${kid ? '#5f8fb0' : '#66748a'}"/>`;
    /* pillow */
    t += `<rect x="${n(bx+bw*0.18)}" y="${n(by+bh*0.05)}" width="${n(bw*0.64)}" height="${n(bh*0.16)}" rx="2" fill="#fbfdff"/>`;
    return t;
  };
  const BM = R('bedMain'), BK = R('bedKids'), BA = R('bath');
  s += bed(BM, 0.16, 0.68, false);
  s += `<rect x="${n(BM.x+BM.w*0.02)}" y="${n(BM.y+BM.h*0.20)}" width="${n(BM.w*0.11)}" height="${n(BM.h*0.14)}" rx="1" fill="#8a6a45"/>`;
  s += `<circle cx="${n(BM.x+BM.w*0.075)}" cy="${n(BM.y+BM.h*0.24)}" r="${n(BM.h*0.035)}" fill="#f5d98a"/>`;
  s += `<rect x="${n(BM.x+BM.w*0.02)}" y="${n(BM.y+BM.h*0.80)}" width="${n(BM.w*0.90)}" height="${n(BM.h*0.14)}" rx="1.4" fill="#7d5f3c"/>`;
  s += bed(BK, 0.08, 0.36, true);
  s += bed(BK, 0.55, 0.36, true);
  /* toy box */
  s += `<rect x="${n(BK.x+BK.w*0.30)}" y="${n(BK.y+BK.h*0.80)}" width="${n(BK.w*0.36)}" height="${n(BK.h*0.14)}" rx="1.4" fill="#b4794a"/>`;
  s += `<circle cx="${n(BK.x+BK.w*0.40)}" cy="${n(BK.y+BK.h*0.87)}" r="${n(BK.h*0.035)}" fill="#d1462f"/>`;
  s += `<circle cx="${n(BK.x+BK.w*0.52)}" cy="${n(BK.y+BK.h*0.87)}" r="${n(BK.h*0.035)}" fill="#4f8fb0"/>`;

  /* ---- bathroom ---- */
  s += `<rect x="${n(BA.x+BA.w*0.12)}" y="${n(BA.y+BA.h*0.14)}" width="${n(BA.w*0.74)}" height="${n(BA.h*0.34)}" rx="3" fill="#e8f1f5"/>`;
  s += `<rect x="${n(BA.x+BA.w*0.20)}" y="${n(BA.y+BA.h*0.20)}" width="${n(BA.w*0.58)}" height="${n(BA.h*0.22)}" rx="2.4" fill="#bcdbe8"/>`;
  s += `<circle cx="${n(BA.x+BA.w*0.30)}" cy="${n(BA.y+BA.h*0.62)}" r="${n(BA.w*0.16)}" fill="#e8f1f5"/>`;
  s += `<rect x="${n(BA.x+BA.w*0.58)}" y="${n(BA.y+BA.h*0.54)}" width="${n(BA.w*0.26)}" height="${n(BA.h*0.20)}" rx="2" fill="#e8f1f5"/>`;

  /* lamplight pooling in the rooms after dark */
  const night = (typeof isNight === 'function') ? isNight() : false;
  if(night){
    s += `<rect x="0" y="0" width="${n(w)}" height="${n(h)}" rx="3" fill="#1b2740" opacity=".34"/>`;
    [[K.x+K.w*0.5, K.y+K.h*0.4, K.w*0.55],
     [L.x+L.w*0.5, L.y+L.h*0.5, L.w*0.55],
     [BM.x+BM.w*0.4, BM.y+BM.h*0.3, BM.w*0.6]].forEach(g=>{
      s += `<ellipse cx="${n(g[0])}" cy="${n(g[1])}" rx="${n(g[2])}" ry="${n(g[2]*0.7)}"
        fill="#ffd489" opacity=".16"/>`;
    });
  } else {
    s += `<rect x="0" y="0" width="${n(w)}" height="${n(h)}" rx="3" fill="#ffd489" opacity=".07"/>`;
  }
  return s;
}

(function indoorCss(){
  const s = document.createElement('style');
  s.textContent = `
  #cutaway .hearth-glow{ animation: hearthGlow 3.4s ease-in-out infinite; }
  @keyframes hearthGlow{ 0%,100%{opacity:.12} 50%{opacity:.26} }
  .tbtn.has-people::after{ content:''; display:inline-block; width:6px; height:6px;
    margin-left:5px; border-radius:50%; background:#f0c14b; vertical-align:middle; }
  `;
  document.head.appendChild(s);
})();
