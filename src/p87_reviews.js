/* =====================================================================
   GUESTS SAY WHAT THEY THOUGHT

   Visitors walked the farm, spent money and left without ever having an
   opinion about it. On a save that is 157 decor items out of 201, that is
   the one piece of feedback the game was not giving: you can see the
   money, but nothing ever told you whether the place was nice.

   Each night a guest may leave a review. It is scored off things you
   actually did - charm, what there is to do, whether the animals are
   looked after, whether the place is tidy - and it says which of those
   pushed it up or down. The farm carries a rating, and the rating is
   visible.

   The point is the sentence, not the number. A review that says "lovely
   spot, but the pens want cleaning" is worth more than a score, because
   it tells you what to go and look at.
   ===================================================================== */

function reviewsInit(){
  if(!S.reviews) S.reviews = [];
  return S.reviews;
}

const REVIEW_NAMES_FALLBACK = ['A guest','A visitor','Someone who stayed'];

/* ---------- what a stay was actually like ---------- */
function stayScore(){
  const st = (typeof stat === 'function') ? stat() : {charm:0};
  const objs = S.objs || [];

  /* how lovely it looks - the thing the player has spent most effort on */
  const charm = Math.min(1, (st.charm || 0) / 220);

  /* something to do: leisure and tourism within the fence */
  const things = objs.filter(o=>{
    const bp = BPMAP[o.bp];
    return bp && (bp.kind === 'rec' || bp.kind === 'tourism' || bp.kind === 'shop');
  }).length;
  const todo = Math.min(1, things / 6);

  /* animals, and whether they are cared for */
  const pens = objs.filter(o=>BPMAP[o.bp] && BPMAP[o.bp].kind === 'animal');
  const care = pens.length
    ? pens.reduce((a,o)=>a + (o.care === undefined ? 1 : o.care), 0) / pens.length
    : 0.7;

  /* whether the place is being kept on top of */
  const tidy = 1 - Math.min(1, (S.decay || 0));

  const score = charm*0.42 + todo*0.2 + care*0.22 + tidy*0.16;
  return { score, charm, todo, care, tidy, things, pens:pens.length };
}

function starsFor(score){ return Math.max(1, Math.min(5, Math.round(score * 5))); }

/* the sentence, built from whichever part stood out */
function reviewText(s, stars, seed){
  const good = [], bad = [];
  if(s.charm > 0.7) good.push('the place is genuinely lovely');
  else if(s.charm < 0.3) bad.push('it is a bit bare');
  if(s.todo > 0.6) good.push('plenty to do without leaving');
  else if(s.todo < 0.25) bad.push('not much to do');
  if(s.care > 0.85 && s.pens) good.push('the animals are clearly well kept');
  else if(s.care < 0.5 && s.pens) bad.push('the pens want cleaning');
  if(s.tidy < 0.6) bad.push('one or two things look neglected');

  /* a few openers a band, picked off the seed, because the score barely
     moves between stays and three identical reviews in a row read as a
     bug rather than as agreement */
  const OPENERS = {
    5:['Did not want to leave.','Best few days we have had.','We are already talking about coming back.'],
    4:['A really good few days.','Thoroughly enjoyed it.','Would happily stay again.'],
    3:['Pleasant enough.','No complaints.','A nice enough stay.'],
    2:['It was all right.','Fine, I suppose.','Did the job.'],
    1:['Would not rush back.','Not for us.','Expected more.'],
  };
  const bank = OPENERS[stars] || OPENERS[3];
  const open = bank[Math.abs(Math.round(seed)) % bank.length];
  const cap = t => t.charAt(0).toUpperCase() + t.slice(1);
  const g = good.length ? ' ' + cap(good[0]) + '.' : '';
  /* capitalised when it starts its own sentence, which it does whenever
     there was nothing good to lead with */
  const b = bad.length
    ? ' ' + (good.length ? 'Only thing \u2014 ' + bad[0] : cap(bad[0])) + '.'
    : '';
  return (open + g + b).replace(/\s+/g,' ').trim();
}

function farmRating(){
  const r = reviewsInit();
  if(!r.length) return null;
  const recent = r.slice(0, 20);
  return +(recent.reduce((a,x)=>a + x.stars, 0) / recent.length).toFixed(1);
}

/* ---------- one a night, at most, and only if anyone is staying ---------- */
function maybeReview(){
  const guests = S.guests || [];
  if(!guests.length) return null;
  /* not every night, so they do not pile up */
  if(Math.random() > 0.45) return null;
  const g = guests[Math.floor(Math.random() * guests.length)];
  const r = reviewsInit();
  /* one review per guest per stay */
  if(r.some(x=>x.guest === g.id && x.day > (S.day - 6))) return null;

  const s = stayScore();
  const stars = starsFor(s.score);
  const rev = {
    id:'r'+Date.now(), guest:g.id,
    who: g.name || REVIEW_NAMES_FALLBACK[Math.floor(Math.random()*3)],
    day: S.day, stars, text: reviewText(s, stars, S.day + (g.id||'').length),
  };
  r.unshift(rev);
  if(r.length > 60) r.length = 60;
  log(`${rev.who} left a review — ${'★'.repeat(stars)}${'☆'.repeat(5-stars)}`,
      stars >= 4 ? 'good' : stars <= 2 ? 'bad' : '', 'home');
  return rev;
}

if(typeof advanceDay === 'function'){
  const _advRev = advanceDay;
  advanceDay = function(){
    const r = _advRev.apply(this, arguments);
    try{ maybeReview(); }catch(e){}
    return r;
  };
}

/* a good rating brings more people, which is the loop closing */
if(typeof charmMul === 'function'){
  const _charmRev = charmMul;
  charmMul = function(){
    const base = _charmRev.apply(this, arguments);
    const rt = farmRating();
    if(rt === null) return base;
    /* 3 stars is neutral; 5 is +12%, 1 is -12% */
    return base * (1 + (rt - 3) * 0.06);
  };
}

/* ---------- the panel ---------- */
G.openReviews = function(){
  const r = reviewsInit();
  const rt = farmRating();
  let h = `<h2>What guests said</h2>`;
  h += rt === null
    ? `<p class="sub">Nobody has stayed long enough to have an opinion yet.
       Put up somewhere for a visitor to sleep and they will.</p>`
    : `<p class="sub">Your farm is rated <b>${rt}</b> out of 5, over the last
       ${Math.min(20, r.length)} ${r.length === 1 ? 'stay' : 'stays'}.
       ${rt >= 4.2 ? 'Word gets round.' : rt <= 2.5 ? 'There is work to do.' : ''}</p>`;

  const s = stayScore();
  const bar = (label, v)=>`<div style="display:flex;gap:8px;align-items:center;margin:3px 0">
      <span class="muted" style="width:92px;font-size:12px">${label}</span>
      <div class="bar" style="flex:1;height:5px"><i style="transform:scaleX(${v.toFixed(3)});
        background:linear-gradient(90deg,#6d9445,#9dc46a)"></i></div></div>`;
  h += `<h4 style="margin:12px 0 4px">What they are judging</h4>`
     + bar('How it looks', s.charm) + bar('Things to do', s.todo)
     + bar('The animals', s.care)   + bar('Upkeep', s.tidy);

  if(r.length){
    h += `<h4 style="margin:14px 0 4px">Recent</h4>`;
    r.slice(0, 12).forEach(x=>{
      h += `<div style="padding:8px 0;border-top:1px solid var(--line)">
        <div style="display:flex;gap:8px;align-items:baseline">
          <b style="flex:1">${x.who}</b>
          <span style="color:#f0c14b;letter-spacing:1px">${'★'.repeat(x.stars)}${'☆'.repeat(5-x.stars)}</span>
          <span class="muted" style="font-size:11px">day ${x.day}</span></div>
        <div class="muted" style="font-size:12px;margin-top:2px">${x.text}</div></div>`;
    });
  }
  h += `<div class="mfoot"><button class="btn ghost" onclick="G.closeModal()">Close</button></div>`;
  modal(h);
};

setTimeout(()=>{
  const bar = document.querySelector('.tbtn') && document.querySelector('.tbtn').parentElement;
  if(!bar || document.getElementById('revbtn')) return;
  const b = document.createElement('button');
  b.id = 'revbtn'; b.className = 'tbtn';
  b.addEventListener('click', ()=>G.openReviews());
  bar.appendChild(b);
  const refresh = ()=>{
    const rt = farmRating();
    b.textContent = rt === null ? '★ Reviews' : `★ ${rt}`;
    b.dataset.tip = rt === null
      ? '<b>Reviews</b>What guests thought of the place. Nobody has stayed yet.'
      : `<b>Reviews</b>Rated ${rt} out of 5 by the people who stayed.`;
  };
  refresh();
  const _uiRev = ui;
  ui = function(){ const r = _uiRev.apply(this, arguments); try{ refresh(); }catch(e){} return r; };
}, 720);

/* ---------- handle ---------- */
G.reviewAudit = function(){
  const s = stayScore();
  return {
    rating: farmRating(),
    count: reviewsInit().length,
    scoreNow: +s.score.toFixed(3),
    starsNow: starsFor(s.score),
    wouldSay: reviewText(s, starsFor(s.score), S.day),
    parts: { charm:+s.charm.toFixed(2), todo:+s.todo.toFixed(2),
             care:+s.care.toFixed(2), tidy:+s.tidy.toFixed(2) },
    guestsStaying: (S.guests||[]).length,
    charmMulWithRating: +charmMul().toFixed(2),
  };
};
