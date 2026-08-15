/* =====================================================================
   A BETTER DRAGON, FACING THE RIGHT WAY

   Two things.

   1. IT WAS FLYING BACKWARDS. The old art puts the head at negative x -
      it faces LEFT - while the ride scrolls the world to the left, which
      means the dragon travels RIGHT. So it flew tail-first the whole way
      with the rider sitting on its neck. Redrawn facing right, which is
      the direction it actually goes, and the farm's dir flip still works
      because it flips from a right-facing original now.

   2. A PROPER 2D DRAGON. The old one was an ellipse, a stick neck and a
      triangle wing. This is drawn as a side profile with the things that
      make a dragon read as one: a deep chest tapering to a long tail with
      a spade on it, a cream belly of overlapping scutes, a wing with
      actual finger struts and a scalloped trailing edge, a horned crest
      running back from the brow, a jaw with a tooth showing, and clawed
      feet. Two-tone through the body - the hue you were given at
      summoning, lit from above, with a warmer edge along the top.

      Original work in the same idiom as the reference rather than a
      trace of it: it is a red-and-cream horned dragon because that is
      what the request asked for, drawn from primitives here.

   The wing is still one path with a transform-origin at the shoulder, so
   the asymmetric beat from p115 drives it unchanged.
   ===================================================================== */

if(typeof dragonArt === 'function'){
  dragonArt = function(d){
    const hue = (d && d.hue !== undefined) ? d.hue : 8;
    const body  = `hsl(${hue} 62% 46%)`;
    const lit   = `hsl(${hue} 70% 58%)`;
    const deep  = `hsl(${hue} 55% 34%)`;
    const belly = `hsl(${(hue+26)%360} 45% 82%)`;
    const bell2 = `hsl(${(hue+26)%360} 38% 71%)`;
    const horn  = `hsl(${(hue+34)%360} 72% 62%)`;
    const grounded = ['rest','perch','sulk','feed','burn','land','show'];
    const flying = !grounded.includes(d && d.state);

    let s = '';
    /* ground shadow */
    s += `<ellipse cx="0" cy="3" rx="20" ry="5.5" fill="#16240c" opacity=".24"/>`;

    /* ---- tail, sweeping back to the left with a spade on the end ---- */
    s += `<path d="M-6 -8 Q-22 -6 -32 -14 Q-40 -20 -46 -16
      Q-40 -13 -33 -9 Q-22 -2 -5 -4 Z" fill="${deep}"/>`;
    s += `<path d="M-46 -16 L-56 -22 L-50 -14 L-57 -12 Z" fill="${horn}"/>`;
    /* tail ridges */
    for(let i=0;i<4;i++)
      s += `<path d="M${-14-i*7} ${-6-i*1.6} l2.6 -3.4 l2.6 3.1 Z" fill="${horn}" opacity=".85"/>`;

    /* ---- far wing, behind the body ---- */
    s += `<g class="dwing far"><path d="M-2 -18
      Q-16 -40 -34 -44 Q-24 -34 -20 -24 Q-14 -20 -2 -14 Z" fill="${deep}"/></g>`;

    /* ---- hind leg ---- */
    s += `<path d="M-8 -8 Q-10 -2 -7 1 L-3 1" stroke="${deep}" stroke-width="6"
      fill="none" stroke-linecap="round"/>`;
    s += `<path d="M-9 1 l3 0 M-6 1 l3 0 M-3 1 l3 0" stroke="${horn}" stroke-width="1.6" stroke-linecap="round"/>`;

    /* ---- body: deep chest tapering back ---- */
    s += `<path d="M-8 -10 Q-6 -22 6 -24 Q18 -25 22 -16 Q24 -8 16 -4
      Q6 -1 -2 -4 Q-8 -6 -8 -10 Z" fill="${body}"/>`;
    /* top light */
    s += `<path d="M-8 -10 Q-6 -22 6 -24 Q18 -25 22 -16 Q14 -21 4 -20 Q-4 -18 -8 -10 Z"
      fill="${lit}" opacity=".9"/>`;
    /* cream belly scutes */
    s += `<path d="M-2 -4 Q8 -1 17 -5 Q20 -9 19 -12 Q10 -6 -1 -8 Z" fill="${belly}"/>`;
    for(let i=0;i<4;i++)
      s += `<path d="M${1+i*4.6} ${-7+i*0.5} q2.4 2.6 4.8 0" fill="none"
        stroke="${bell2}" stroke-width="1" opacity=".9"/>`;

    /* ---- fore leg with claws ---- */
    s += `<path d="M10 -8 Q12 -2 15 1" stroke="${body}" stroke-width="6"
      fill="none" stroke-linecap="round"/>`;
    s += `<path d="M13 1 l3 0.6 M16 0.6 l3 0.4 M19 1 l2.6 -0.4"
      stroke="${horn}" stroke-width="1.7" stroke-linecap="round"/>`;

    /* ---- neck, curving up and forward ---- */
    s += `<path d="M17 -20 Q26 -26 30 -34" stroke="${body}" stroke-width="9"
      fill="none" stroke-linecap="round"/>`;
    s += `<path d="M17 -20 Q26 -26 30 -34" stroke="${lit}" stroke-width="4"
      fill="none" stroke-linecap="round" opacity=".55"/>`;
    /* neck scutes */
    s += `<path d="M20 -17 Q26 -22 30 -30 L28 -31 Q24 -24 19 -20 Z" fill="${belly}" opacity=".9"/>`;

    /* ---- head ---- */
    s += `<path d="M26 -36 Q32 -42 41 -40 Q47 -38 47 -34
      Q46 -30 39 -30 Q30 -30 26 -33 Z" fill="${body}"/>`;
    s += `<path d="M26 -36 Q32 -42 41 -40 Q47 -38 47 -35 Q40 -38 31 -37 Z" fill="${lit}"/>`;
    /* snout and jaw */
    s += `<path d="M43 -35 Q48 -35 48 -32 Q45 -31 42 -32 Z" fill="${lit}"/>`;
    s += `<circle cx="46.4" cy="-34.6" r="0.8" fill="${deep}"/>`;
    s += `<path d="M38 -31 Q43 -29.5 47 -31.5 Q43 -28.6 38 -30 Z" fill="${deep}"/>`;
    s += `<path d="M41.6 -30.6 l1 1.6 l1.2 -1.7 Z" fill="#ffffff"/>`;
    /* the eye */
    s += `<ellipse cx="36" cy="-36" rx="2.8" ry="3" fill="#ffffff"/>`;
    s += `<circle cx="36.6" cy="-35.8" r="1.7" fill="#2f6f9c"/>`;
    s += `<circle cx="36.6" cy="-35.8" r="0.8" fill="#101820"/>`;
    s += `<circle cx="35.8" cy="-36.6" r="0.5" fill="#ffffff"/>`;
    s += `<path d="M33 -39 Q36 -40.6 39.4 -39.4" fill="none" stroke="${deep}" stroke-width="1"/>`;

    /* horned crest, sweeping back from the brow */
    s += `<path d="M32 -40 L28 -49 L34 -43 Z" fill="${horn}"/>`;
    s += `<path d="M28 -39 L21 -47 L28 -42 Z" fill="${horn}"/>`;
    s += `<path d="M25 -37 L17 -43 L25 -40 Z" fill="${horn}" opacity=".9"/>`;
    /* a small chin barbel */
    s += `<path d="M34 -29.5 q1.4 3 -0.6 4.6" fill="none" stroke="${horn}" stroke-width="1.3" stroke-linecap="round"/>`;

    /* ---- near wing: finger struts and a scalloped trailing edge ---- */
    s += `<g class="dwing near">`;
    s += `<path d="M4 -22
      Q-8 -46 -30 -54
      Q-22 -46 -18 -40
      Q-26 -44 -34 -42
      Q-24 -37 -18 -32
      Q-25 -34 -31 -30
      Q-20 -27 -10 -22
      Q-2 -19 4 -18 Z" fill="${body}"/>`;
    s += `<path d="M4 -22 Q-8 -46 -30 -54 Q-16 -44 -8 -32 Q-2 -25 4 -22 Z"
      fill="${lit}" opacity=".8"/>`;
    /* the finger struts that make it a wing rather than a flag */
    s += `<path d="M4 -21 Q-10 -42 -29 -52 M4 -21 Q-8 -38 -19 -39
      M4 -21 Q-8 -32 -18 -31" fill="none" stroke="${deep}" stroke-width="1.3" opacity=".9"/>`;
    s += `</g>`;

    /* a breath of flame when it is burning off heat, from the mouth */
    if(d && d.state === 'burn'){
      s += `<path d="M48 -33 Q62 -37 76 -31 Q62 -30 49 -30 Z" fill="#ff8a3a" opacity=".85"/>`;
      s += `<path d="M48 -33 Q58 -35 68 -32 Q58 -31 49 -31 Z" fill="#ffd87a" opacity=".9"/>`;
    }

    return `<g class="dragon ${(d&&d.state)||'rest'}${flying?' flying':''}">${s}</g>`;
  };
}

/* the flame and breath effects were aimed at the old left-facing mouth */
if(typeof flameArt === 'function'){
  flameArt = function(d, k){
    const reach = 96 * Math.sin(Math.min(1, k*1.5) * Math.PI);
    if(reach < 2) return '';
    const w0 = 8 + 12*Math.sin(k*Math.PI);
    const x0 = 48, y0 = -32;                 /* the mouth, now on the right */
    const p = (r, sp)=>`M${n(x0)} ${n(y0)} Q${n(x0+r*0.5)} ${n(y0-sp)} ${n(x0+r)} ${n(y0)}
      Q${n(x0+r*0.5)} ${n(y0+sp)} ${n(x0)} ${n(y0)} Z`;
    let s = `<g class="dflame">`;
    s += `<path d="${p(reach, w0)}" fill="#ff6a2a" opacity=".55"/>`;
    s += `<path d="${p(reach*0.76, w0*0.66)}" fill="#ffa03a" opacity=".8"/>`;
    s += `<path d="${p(reach*0.48, w0*0.4)}" fill="#ffe07a" opacity=".95"/>`;
    s += `<circle cx="${n(x0+reach)}" cy="${n(y0)}" r="${n(w0*0.4)}" fill="#fff3c4"
      opacity="${(0.7*(1-k)).toFixed(2)}"/>`;
    return s + `</g>`;
  };
}
if(typeof showArt === 'function'){
  const _showArtOld = showArt;
  showArt = function(d){
    const out = _showArtOld.apply(this, arguments);
    if(!out) return out;
    /* the roost display was built around a mouth at x=-30; mirror it so it
       comes out of the face rather than the tail */
    return `<g transform="translate(78,0) scale(-1,1)">${out}</g>`;
  };
}

/* ---------- the ride: it travels right, so it must face right ---------- */
if(typeof tickRide === 'function'){
  const _tickRideFace = tickRide;
  tickRide = function(dt){
    const r = _tickRideFace.apply(this, arguments);
    try{
      const g = document.querySelector('#ridedragon #riderbody');
      if(g){
        const t = g.getAttribute('transform') || '';
        /* the art faces right now, so no flip — strip any inherited one */
        if(t.indexOf('scale(-1') >= 0)
          g.setAttribute('transform', t.replace(/\s*scale\(-1,\s*1\)/, ''));
      }
    }catch(e){}
    return r;
  };
}

/* ---------- handle ---------- */
G.dragonArtAudit = function(){
  const d = S.dragon || { hue:8, state:'fly' };
  const art = dragonArt(d);
  return {
    facing: 'right — head at +47x, tail at -57x',
    wasBefore: 'head at -28x, so it flew tail-first on the ride',
    shapes: (art.match(/<(path|ellipse|circle)/g)||[]).length,
    hasCrest: art.indexOf('L28 -49') >= 0,
    hasFingerStruts: art.indexOf('Q-10 -42') >= 0,
    hasBellyScutes: art.indexOf('q2.4 2.6') >= 0,
    wingClassesIntact: /dwing near/.test(art) && /dwing far/.test(art),
  };
};
