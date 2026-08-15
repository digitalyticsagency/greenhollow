/* =====================================================================
   THREE THINGS TO DO UP THERE

   The ride had one game — fly low and slow enough to be seen — and it
   rewarded looking at the scenery, which was right for the first one. It
   is not enough for five destinations. Each place now has its own reason
   to go, chosen by where the dragon takes you rather than by a menu:

     the high passes    RINGS. Stone arches strung between the peaks at
                        different heights. Thread them. They come in runs
                        of three or four and the last of a run is worth
                        double, so it is about committing to a line
                        rather than grabbing the easy one.

     the storm front    THERMALS. Columns of rising and falling air. An
                        updraft lifts you and gives you speed; a downdraft
                        drops you and takes it away. You cannot see them
                        directly - you read the rain, which bends. Ride
                        the good ones for distance.

     everywhere else    DELIVERY. You load a crate from your own barn at
                        take-off and carry it to the settlement out
                        there. It pays over market and it raises the
                        village's opinion of you, which is the same
                        reputation that decides how many of them walk up
                        on market day. Carrying it to them beats waiting
                        for them to come to you.

   The greeting from p110 still runs underneath all three, because the
   people below should always notice a dragon.
   ===================================================================== */

/* which game a place gets */
function rideGameFor(sceneId){
  if(sceneId === 'passes') return 'rings';
  if(sceneId === 'storm')  return 'thermals';
  return 'delivery';
}

/* ---------- set up on take-off ---------- */
if(typeof G.rideDragon === 'function'){
  const _rideGames = G.rideDragon;
  G.rideDragon = function(){
    const r = _rideGames.apply(this, arguments);
    try{
      if(typeof RIDE === 'undefined' || !RIDE) return r;
      const R = RIDE;
      R.game = rideGameFor(R.scene.id);
      R.rings = []; R.thermals = []; R.score = 0; R.run = 0;

      if(R.game === 'rings'){
        /* runs of three or four, the last one high and worth double */
        let x = 700;
        while(x < 9000){
          const len = 3 + (Math.random() < 0.4 ? 1 : 0);
          const baseY = 0.28 + Math.random()*0.3;
          for(let i=0;i<len;i++){
            R.rings.push({ x: x + i*230, y: baseY + (i/len)*0.16*(Math.random()<0.5?-1:1),
              last: i === len-1, hit:0 });
          }
          x += len*230 + 520 + Math.random()*400;
        }
      }
      if(R.game === 'thermals'){
        let x = 600;
        while(x < 9000){
          R.thermals.push({ x, w: 130 + Math.random()*90, up: Math.random() < 0.58 });
          x += 320 + Math.random()*420;
        }
      }
      if(R.game === 'delivery'){
        /* load whatever the barn can spare */
        const keys = Object.keys(S.store||{}).filter(k=>S.store[k] > 2);
        if(keys.length){
          const k = keys[Math.floor(Math.random()*keys.length)];
          const q = Math.min(S.store[k], 4 + Math.floor(Math.random()*5));
          S.store[k] -= q; if(S.store[k] <= 0) delete S.store[k];
          R.cargo = { k, q };
          R.dropAt = 3200 + Math.random()*1800;
          if(typeof log === 'function')
            log(`Loaded ${q} × ${GOODS[k].n} to run out to the settlement.`, '', 'farm');
        } else {
          R.cargo = null;
          if(typeof log === 'function')
            log('Nothing in the barn worth carrying, so it is a pleasure flight.', '', 'farm');
        }
      }
      if(typeof toast === 'function'){
        const t = R.game === 'rings' ? 'Thread the arches'
                : R.game === 'thermals' ? 'Ride the updrafts'
                : R.cargo ? `Carry the ${GOODS[R.cargo.k].n.toLowerCase()} out` : 'A look round';
        toast(t, '');
      }
    }catch(e){}
    return r;
  };
}

/* ---------- the games run on the ride tick ---------- */
if(typeof tickRide === 'function'){
  const _tickGames = tickRide;
  tickRide = function(dt){
    const r = _tickGames.apply(this, arguments);
    try{
      const R = RIDE; if(!R || R.over) return r;
      const me = { x: R.x + 260, y: R.y };

      if(R.game === 'rings'){
        R.rings.forEach(g=>{
          if(g.hit) return;
          if(Math.abs(g.x - me.x) < 22 && Math.abs(g.y - me.y) < 0.075){
            g.hit = 1;
            const worth = g.last ? 2 : 1;
            R.score += worth;
            R.run = g.last ? 0 : R.run + 1;
            if(typeof G.bang === 'function') try{ G.bang('hit'); }catch(e){}
          } else if(g.x < me.x - 40 && !g.missed){ g.missed = 1; R.run = 0; }
        });
      }

      if(R.game === 'thermals'){
        const inCol = R.thermals.find(t=>Math.abs(t.x - me.x) < t.w/2);
        R.inThermal = inCol ? (inCol.up ? 1 : -1) : 0;
        if(inCol){
          R.y = Math.max(0.14, Math.min(0.72, R.y + (inCol.up ? -0.16 : 0.16) * dt));
          R.speed = Math.max(70, Math.min(320, R.speed + (inCol.up ? 55 : -45) * dt));
          if(inCol.up){ R.score += dt * 4; }
        }
      }

      if(R.game === 'delivery' && R.cargo && !R.delivered){
        if(R.x > R.dropAt){
          R.delivered = 1;
          const g = R.cargo;
          const price = sellPrice(g.k) * 1.5;          /* they pay well for the trouble */
          const paid = Math.round(g.q * price);
          S.cash += paid; S.totalEarned += paid;
          R.score += g.q * 3;
          try{ const V = villInit(); V.rep = Math.min(1, V.rep + 0.06); }catch(e){}
          if(typeof G.bang === 'function') try{ G.bang('roar'); }catch(e){}
          if(typeof log === 'function')
            log(`Dropped ${g.q} × ${GOODS[g.k].n} at the settlement for ${fmt(paid)}. They will remember it.`, 'good', 'money');
          if(typeof toast === 'function') toast(`Delivered — ${fmt(paid)}`, 'good');
        }
      }
    }catch(e){}
    return r;
  };
}

/* ---------- drawing ---------- */
if(typeof paintRide === 'function'){
  const _paintGames = paintRide;
  paintRide = function(){
    const r = _paintGames.apply(this, arguments);
    try{
      const R = RIDE; if(!R || R.over) return r;
      const el = document.getElementById('ridelay'); if(!el) return r;
      const box = el.getBoundingClientRect();
      const W = Math.max(320, box.width), H = Math.max(240, box.height);
      let s = '';

      if(R.game === 'rings'){
        R.rings.forEach(g=>{
          const sx = g.x - R.x;
          if(sx < -80 || sx > W+80) return;
          const sy = g.y * H;
          const col = g.hit ? '#7cc24f' : (g.last ? '#ffd24a' : '#e8eef2');
          const op  = g.hit ? 0.35 : 0.95;
          s += `<ellipse cx="${n(sx)}" cy="${n(sy)}" rx="9" ry="34" fill="none"
            stroke="${col}" stroke-opacity="${op}" stroke-width="${g.last?5:3.4}"/>`;
          s += `<ellipse cx="${n(sx)}" cy="${n(sy)}" rx="5" ry="27" fill="none"
            stroke="#ffffff" stroke-opacity="${op*0.45}" stroke-width="1.2"/>`;
        });
      }

      if(R.game === 'thermals'){
        R.thermals.forEach(t=>{
          const sx = t.x - R.x;
          if(sx < -160 || sx > W+160) return;
          const up = t.up;
          for(let i=0;i<5;i++){
            const cx = sx - t.w/2 + (t.w/4)*i;
            const ph = ((R.t*(up?90:70) + i*40) % H);
            const y0 = up ? H - ph : ph;
            s += `<path d="M${n(cx)} ${n(y0)} q6 ${up?-18:18} 0 ${up?-34:34}"
              fill="none" stroke="${up?'#bfe4f4':'#8a94a0'}" stroke-opacity=".45" stroke-width="2"/>`;
          }
        });
      }

      if(R.game === 'delivery' && R.cargo){
        const sx = R.dropAt - R.x;
        if(sx > -100 && sx < W + 300){
          const gy = H*0.90;
          s += `<g opacity=".95"><rect x="${n(sx-26)}" y="${n(gy-30)}" width="52" height="30" fill="#d9cdb4"/>
            <path d="M${n(sx-32)} ${n(gy-28)} L${n(sx)} ${n(gy-46)} L${n(sx+32)} ${n(gy-28)} Z" fill="#8a5a44"/>
            <rect x="${n(sx-6)}" y="${n(gy-16)}" width="12" height="16" fill="#6d5b44"/></g>`;
          s += `<path d="M${n(sx)} ${n(gy-62)} l-6 -10 l12 0 Z" fill="#ffd24a"/>`;
        }
        if(!R.delivered)
          s += `<g><rect x="${n(W*0.30-6)}" y="${n(R.y*H+4)}" width="13" height="10" rx="2" fill="#a9764a"/>
            <rect x="${n(W*0.30-6)}" y="${n(R.y*H+7)}" width="13" height="2" fill="#7d5f3c"/></g>`;
      }

      /* the line under the HUD that says what you are actually doing */
      const note = R.game === 'rings'
          ? `${R.score} through${R.run>1?` · ${R.run} in a row`:''}`
        : R.game === 'thermals'
          ? (R.inThermal>0?'rising':R.inThermal<0?'sinking':'still air') + ` · ${Math.round(R.score)}`
        : R.cargo
          ? (R.delivered ? 'delivered' : `carrying ${R.cargo.q} × ${GOODS[R.cargo.k].n} · ${Math.max(0,Math.round((R.dropAt-R.x)/40))}0m`)
          : 'nothing to carry';
      s += `<g><rect x="10" y="66" width="196" height="22" rx="8" fill="#0d1410" opacity=".62"/>
        <text x="20" y="81" font-size="11" fill="#eaf3e6" style="font-family:inherit">${note}</text></g>`;

      el.innerHTML += s;
    }catch(e){}
    return r;
  };
}

/* ---------- the landing report ---------- */
if(typeof endRide === 'function'){
  const _endGames = endRide;
  endRide = function(){
    try{
      const R = RIDE;
      if(R && !R.over && typeof log === 'function'){
        if(R.game === 'rings' && R.score)
          log(`Threaded ${R.score} arches through the passes.`, 'good', 'farm');
        if(R.game === 'thermals' && R.score > 4)
          log(`Rode the updrafts for ${Math.round(R.score)} of lift over the storm.`, 'good', 'farm');
        if(R.game === 'delivery' && R.cargo && !R.delivered)
          log(`Came home still carrying the ${GOODS[R.cargo.k].n.toLowerCase()} — you turned back too early.`, 'bad', 'farm');
      }
      /* undelivered cargo goes back in the barn rather than vanishing */
      if(R && R.cargo && !R.delivered){
        S.store = S.store || {};
        S.store[R.cargo.k] = (S.store[R.cargo.k]||0) + R.cargo.q;
      }
    }catch(e){}
    return _endGames.apply(this, arguments);
  };
}

/* ---------- handle ---------- */
G.rideGamesAudit = function(){
  const R = (typeof RIDE !== 'undefined') ? RIDE : null;
  if(!R || R.over) return { riding:false,
    games:{ passes:'rings', storm:'thermals', 'everywhere else':'delivery' } };
  return {
    scene:R.scene.n, game:R.game,
    rings: R.game==='rings' ? `${R.rings.filter(g=>g.hit).length} of ${R.rings.length} threaded` : '—',
    thermals: R.game==='thermals' ? `${R.thermals.length} columns, ${R.thermals.filter(t=>t.up).length} rising` : '—',
    cargo: R.cargo ? `${R.cargo.q} × ${GOODS[R.cargo.k].n}${R.delivered?' — delivered':''}` : 'none',
    score: Math.round(R.score||0),
    greeted:R.cheers, scattered:R.scares,
  };
};
