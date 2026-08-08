/* =====================================================================
   THIRTY DAYS OF PEOPLE

   Everyone on the property - you, your partner, the children, hired
   workers, and whoever is staying in the tents and domes - now has two
   things they did not have: a personality that does not change, and a
   day that is not like yesterday.

   The month is a calendar of thirty themed days. Each one carries its
   own small talk, its own work chatter, its own thing for the children
   to be excited about, its own thing for a paying guest to notice, and
   one scripted scene between two people that plays once and only once
   that day. Day 31 starts the cycle again, by which point a season has
   turned and the farm looks different anyway.

   Personality comes from a fixed trait per character, derived from their
   id so it survives a reload without being saved. The trait decides how
   they think when they are on their own, and colours what they say while
   they work. The same day reads differently through a worrier than
   through a joker, which is the point.
   ===================================================================== */

/* ---------- 1. who someone is ---------- */
const TRAITS = {
  practical: { n:'practical',
    think:['💭 That gate will not last the winter.','💭 Two jobs, one trip.','💭 Cheaper to mend it than replace it.','💭 Right. Order of operations.'],
    work: ['Doing it properly this time.','Measure twice.','That will hold now.','One less thing.'] },
  dreamer:   { n:'dreamer',
    think:['💭 We could put an orchard along there.','💭 Imagine this place in ten years.','💭 What if we kept bees on the roof?','💭 Somewhere out past that ridge…'],
    work: ['Wonder what this will look like grown.','I keep picturing it finished.','This is the good part.','Bit of magic in this, really.'] },
  worrier:   { n:'worrier',
    think:['💭 Did I latch it?','💭 That cloud is the wrong colour.','💭 We are one bad week from trouble.','💭 I should check it again.'],
    work: ['Better safe.','I will just double-check.','Not taking chances with this.','That was closer than I liked.'] },
  joker:     { n:'joker',
    think:['💭 If the goat escapes again it can pay rent.','💭 Nobody tell the chickens.','💭 I am basically a farmer now. Basically.','💭 The compost respects me.'],
    work: ['Backbreaking. Character-building.','The soil and I have an understanding.','This is my Roman empire.','Do not tell the sheep I said that.'] },
  tender:    { n:'tender',
    think:['💭 Everyone fed, everyone in.','💭 They looked tired today.','💭 I like it when it is quiet like this.','💭 This was a good idea, wasn’t it.'],
    work: ['Steady does it.','There you go.','No rush, little one.','That is better.'] },
  stoic:     { n:'stoic',
    think:['💭 It will keep.','💭 Weather does what it does.','💭 Work is work.','💭 Fine.'],
    work: ['Mm.','Done.','It will hold.','Next.'] },
  curious:   { n:'curious',
    think:['💭 Why does it always grow better on that side?','💭 What is nesting under there?','💭 I want to know how that works.','💭 Something has changed here.'],
    work: ['Look at this — come and see.','That is not what I expected.','Interesting.','Never seen that before.'] },
  ambitious: { n:'ambitious',
    think:['💭 We could double this by spring.','💭 Next year, the far field.','💭 This should be earning more.','💭 Bigger. Better.'],
    work: ['Faster than last time.','This scales.','Right, what is next.','We are getting somewhere.'] },
};
const TRAIT_KEYS = Object.keys(TRAITS);

/* Stable without being saved: the same person always gets the same
   trait, because it is derived from their id rather than rolled. */
function traitOf(p){
  if(!p) return TRAITS.practical;
  const key = String(p.id || p.name || 'you');
  let h = 0;
  for(let i=0;i<key.length;i++) h = (h*31 + key.charCodeAt(i)) >>> 0;
  return TRAITS[TRAIT_KEYS[h % TRAIT_KEYS.length]];
}
function roleOf(p){
  if(!p) return 'adult';
  if(p === S.you) return 'you';
  if(p.home) return 'guest';
  return p.role === 'child' ? 'child' : (p.role === 'worker' ? 'worker' : 'adult');
}
function nameOf(p){ return (p && p.name) ? p.name : 'You'; }

/* ---------- 2. thirty days ---------- */
/* a: what the adults are on about · k: the children · g: a paying guest
   w: what gets said while working · s: the day's one scripted scene   */
const DAYS = [
 {t:'Settling in',      a:['Feels like ours now.','Still finding where things live.','I slept properly for once.'],
  k:['Can this be my room forever?','I found a beetle!','Are we staying here always?'],
  g:['So this is the place.','Quieter than the photos.','I could get used to this.'],
  w:['Unpacking as I go.','Everything needs a home.','Slowly, slowly.'],
  s:{a:'adult',b:'child',l:['We live here now, properly.','Forever forever?','Forever forever.']}},

 {t:'The fence line',   a:['Walked the whole boundary today.','Three posts want replacing.','Wire is looser than it looks.'],
  k:['I walked the WHOLE fence.','There is a gap down the bottom!','My legs hurt.'],
  g:['Miles of fence out there.','You walk all that?','Proper land, this.'],
  w:['Tamping this one in.','Strainer post first.','That will stop them.'],
  s:{a:'adult',b:'adult',l:['Bottom corner is going.','I know. It is on the list.','It is always on the list.']}},

 {t:'Water',            a:['Tank is lower than I would like.','We need to catch more of it.','Every drop, from now on.'],
  k:['Can I water something?','The tank makes a noise!','I am a watering machine.'],
  g:['You collect all your own water?','That is the whole supply?','Makes you think, that.'],
  w:['Deep and slow, not little and often.','Mulch holds it better.','Checking the lines for leaks.'],
  s:{a:'adult',b:'child',l:['Careful — that is drinking water too.','Sorry!','Not cross. Just careful.']}},

 {t:'First eggs',       a:['Two this morning.','Still warm when I found them.','That is breakfast sorted.'],
  k:['I FOUND ONE!','It was warm!','Can I hold it? Please?'],
  g:['Fresh eggs? Actually fresh?','Best breakfast I have had.','You cannot buy that.'],
  w:['Nest boxes want fresh straw.','Collecting before the crows do.','Two today, three tomorrow.'],
  s:{a:'child',b:'adult',l:['I found an egg!','Show me. Careful now.','It was WARM.']}},

 {t:'Mud',              a:['Everything is mud.','Boots off at the door. Boots OFF.','I have given up on the floor.'],
  k:['Look how deep it is!','My boot came off!','*squelch*'],
  g:['Should have brought better boots.','Worth it for the view.','I am filthy and delighted.'],
  w:['Boards down over the worst of it.','Gravel on this bit, eventually.','Sliding about a fair bit.'],
  s:{a:'adult',b:'child',l:['Boots. Off.','But I am going straight back out!','Boots. Off.']}},

 {t:'The neighbour',    a:['Neighbour came by with a cutting.','Nice of them, actually.','Small kindnesses out here.'],
  k:['Who was that?','They gave us a PLANT.','Are they our friend now?'],
  g:['People are friendly round here.','Someone waved at me on the track.','Not like the city.'],
  w:['Putting the cutting in somewhere sheltered.','Give it a season and we will see.','Good soil for it here.'],
  s:{a:'adult',b:'adult',l:['They brought a cutting.','From their mother’s garden, apparently.','We should take them something back.']}},

 {t:'Market prep',      a:['Sorting what is worth taking.','Best of it goes on the front of the stall.','Early start tomorrow.'],
  k:['Can I come to the market?','Can I have a job?','Can I do the money?'],
  g:['You sell at the market?','I will look out for your stall.','Save me something good.'],
  w:['Grading as I pack.','Bruised ones stay home.','Boxes by the door.'],
  s:{a:'child',b:'adult',l:['Can I do the money?','You can do the money.','YES.']}},

 {t:'Bread',            a:['Whole house smells of it.','Second loaf came out better.','Do not touch it for ten minutes.'],
  k:['Can I have the end bit?','It is TOO HOT.','I want the crust.'],
  g:['Is that bread I can smell?','I would pay for that alone.','Right out of the oven.'],
  w:['Knocking it back.','Wants another hour to prove.','Oven is finally the right heat.'],
  s:{a:'child',b:'adult',l:['Can I have the end bit?','Wait for it to cool.','I am waiting. I am waiting HARD.']}},

 {t:'A missing tool',   a:['Has anyone seen the good secateurs?','They were in my hand an hour ago.','They will turn up. They always do.'],
  k:['Not me!','I did not touch them!','…maybe by the shed?'],
  g:['Everything all right?','Lost something?','They are always in the last place.'],
  w:['Retracing my steps.','Third time round the same beds.','Found the trowel. Not the secateurs.'],
  s:{a:'adult',b:'child',l:['Have you had the secateurs?','No! …maybe.','Maybe is not no.']}},

 {t:'The big wind',     a:['Blowing a gale out there.','Everything loose is now everywhere.','Listen to it.'],
  k:['I can LEAN on it!','My hat went!','It is trying to push me over!'],
  g:['The tent is holding, just.','Wild out here, isn’t it.','I quite like it, actually.'],
  w:['Tying down what I can.','Lids on, doors shut.','Bringing that in before it goes.'],
  s:{a:'adult',b:'adult',l:['Did you get the cover on?','Just.','Good. Come in.']}},

 {t:'Mending',          a:['Pile of things needing fixed.','Working through it slowly.','Cheaper than buying new.'],
  k:['Can I hold the string?','Is it broken forever?','I fixed mine!'],
  g:['You mend everything yourselves?','Nobody does that any more.','Skill, that.'],
  w:['Bit of wire and patience.','Not pretty, but it works.','That will see out the year.'],
  s:{a:'child',b:'adult',l:['Is it broken forever?','Nothing is broken forever.','…the mug was.']}},

 {t:'A visitor',        a:['Someone came up the track.','Stayed for tea, in the end.','Good to see a new face.'],
  k:['Who is THAT?','They knew my name!','Are they staying?'],
  g:['Busy here today.','Nice to see the place used.','Sociable spot.'],
  w:['Kettle on twice this morning.','Tidied up a bit first.','Back to it now.'],
  s:{a:'adult',b:'child',l:['Say hello properly.','Hello properly.','…close enough.']}},

 {t:'Compost',          a:['Heap is steaming.','That is good, that means it is working.','Turned the lot of it.'],
  k:['It is WARM!','It smells like the forest.','There are a million worms.'],
  g:['You make your own soil?','It is genuinely hot.','That is a bit magic.'],
  w:['Layering green and brown.','Turning it through.','Six weeks and this is soil.'],
  s:{a:'child',b:'adult',l:['It is WARM!','That is it working.','It is ALIVE.']}},

 {t:'Stargazing',       a:['No light out here at all.','You can see the whole band of it.','Neck is going to ache.'],
  k:['That one is MINE.','Is that a plane or a star?','I saw one move!'],
  g:['I have never seen stars like this.','No light pollution at all.','Worth the drive on its own.'],
  w:['Last job, then I am looking up.','Torch off — you see more.','Clear night for it.'],
  s:{a:'child',b:'adult',l:['I saw one move!','That is a satellite.','…still counts.']}},

 {t:'The broken gate',  a:['Gate is off its hinge.','Propped for now.','That is tomorrow’s job.'],
  k:['I can climb it though!','It goes WONK.','Can I help fix it?'],
  g:['Need a hand with that?','Looks heavy.','I used to do a bit of joinery.'],
  w:['Hinge has pulled clean out.','Wants a longer screw and a bit of packing.','Swings true now.'],
  s:{a:'adult',b:'adult',l:['Gate is off.','Propped or fixed?','Propped. Do not lean on it.']}},

 {t:'Bees',             a:['Hives are busy today.','You can hear them from here.','Good sign, that.'],
  k:['Are they cross?','They are DANCING.','I stood very still.'],
  g:['Can I watch from here?','They are not bothered by us at all.','Mesmerising.'],
  w:['Standing well back and just watching.','Plenty going in heavy.','Leave them to it.'],
  s:{a:'child',b:'adult',l:['Are they cross?','Not unless you are.','Then I am extremely calm.']}},

 {t:'Washing day',      a:['Line is full.','Perfect drying weather.','Do not let it rain.'],
  k:['I ran through the sheets!','It smells like outside!','I helped peg!'],
  g:['Washing on the line. Proper.','Smells better than any machine.','Rare sight now.'],
  w:['Pegging as fast as I can.','Turning it before the sun goes.','All dry by four.'],
  s:{a:'adult',b:'child',l:['Do not run through the sheets.','Too late.','…they were clean.']}},

 {t:'A birthday',       a:['Cake is in.','Do not say anything yet.','One year older out here.'],
  k:['Is it TODAY?','I smelled cake!','Am I allowed to guess?'],
  g:['Something going on up at the house.','Heard singing.','Lovely to hear.'],
  w:['Getting the jobs done early today.','Nothing urgent enough to miss it.','Done. That will do.'],
  s:{a:'child',b:'adult',l:['I smelled cake.','You smelled nothing.','I SMELLED CAKE.']}},

 {t:'Rain on the roof', a:['Nothing better than this sound.','Tanks are filling.','Inside day, I think.'],
  k:['It is so LOUD.','Can we go out in it?','I like the drumming.'],
  g:['On the canvas it is incredible.','Best sleep of my life coming.','I could listen to this all night.'],
  w:['Jobs that can be done under cover.','Water going where it should, for once.','Checking the gutters hold.'],
  s:{a:'child',b:'adult',l:['Can we go out in it?','Coats.','YES.']}},

 {t:'The long walk',    a:['Went right up to the top today.','You can see the whole place from there.','Worth the climb.'],
  k:['I got to the top FIRST.','You can see our house!','Carry me back?'],
  g:['Went up the hill. Extraordinary.','Took a hundred photos.','Legs know about it now.'],
  w:['Left the tools for a couple of hours.','It will keep.','Good to see it from up there.'],
  s:{a:'child',b:'adult',l:['You can see our house!','That little one there.','It looks like a toy.']}},

 {t:'Preserving',       a:['Jars everywhere.','If it is not eaten it is bottled.','Winter will thank us.'],
  k:['Can I stir?','It is bubbling!','Can I lick the spoon?'],
  g:['Is that jam?','You made all of it?','Shelves full of summer.'],
  w:['Sterilising the jars first.','Waiting for the setting point.','Labels on while I remember.'],
  s:{a:'adult',b:'child',l:['Careful, that pan is molten.','Can I lick the spoon?','When it is cool. Not before.']}},

 {t:'A quiet day',      a:['Nothing urgent for once.','Sat down in daylight. Unheard of.','Just pottering.'],
  k:['I am BORED.','Can we do something?','…fine, I will make a den.'],
  g:['Not doing a single thing today.','That is the point of coming, isn’t it.','Bliss.'],
  w:['Small jobs, no rush.','Tidying rather than building.','Nice change.'],
  s:{a:'child',b:'adult',l:['I am BORED.','Good. Bored is where the ideas are.','…I will make a den.']}},

 {t:'The stubborn goat',a:['Goat has opinions today.','It got into the veg. Again.','I respect it and I resent it.'],
  k:['It looked right at me!','It is EVIL.','I love it.'],
  g:['Is the goat supposed to be there?','It has such a face on it.','Escapologist, that one.'],
  w:['Blocking the gap it found.','It will find another.','Round two.'],
  s:{a:'adult',b:'adult',l:['Goat is out.','Where this time?','The veg. Where else.']}},

 {t:'Firewood',         a:['Stacking for later in the year.','Split what I could.','Arms are done.'],
  k:['I carried THREE.','It smells nice when it splits.','Can I stack?'],
  g:['That is a proper woodpile.','Warms you twice, they say.','Satisfying to look at.'],
  w:['Along the grain, not across.','Stack it so the wind goes through.','Season it a year, burn it clean.'],
  s:{a:'child',b:'adult',l:['I carried THREE.','Three is a good number.','I will do four tomorrow.']}},

 {t:'Letters',          a:['Post finally came.','Two bills and something nice.','Someone wrote by hand.'],
  k:['Is any of it for ME?','I want a letter.','I will write one back!'],
  g:['You get post all the way out here?','Once a week, is it?','Charming, that.'],
  w:['Reading it standing up, as usual.','Filing the boring ones.','Will answer that one properly.'],
  s:{a:'child',b:'adult',l:['Is any of it for me?','This one is.','It IS?!']}},

 {t:'The shortcut',     a:['Found a better way round the back.','Saves ten minutes every trip.','Why did nobody think of it sooner.'],
  k:['I knew about it AGES ago.','It goes past the big tree.','It is my secret path.'],
  g:['Took the little path. Lovely.','Is that a way through?','Felt like I was discovering it.'],
  w:['Trimming it back so it stays open.','Boots have made it already.','That is a path now, officially.'],
  s:{a:'child',b:'adult',l:['I knew about it ages ago.','You did not.','I DID.']}},

 {t:'Something in the night',a:['Something was out there.','Everything is accounted for, mind.','Fox, probably.'],
  k:['I HEARD it.','Was it a monster?','I was not scared. Much.'],
  g:['Something went past the tent.','Heard it snuffling about.','Thrilling, honestly.'],
  w:['Counting everything twice this morning.','All present.','Latching things properly tonight.'],
  s:{a:'child',b:'adult',l:['Was it a monster?','It was a fox.','A monster fox.']}},

 {t:'Repairs',          a:['Big fixing day.','Half of it is done properly now.','The other half is string.'],
  k:['Can I have the broken bit?','I am fixing MY thing.','Mine is better.'],
  g:['Always something to do here.','You never stop, do you.','Good honest work.'],
  w:['Properly this time, not a bodge.','That should outlast me.','One down.'],
  s:{a:'adult',b:'adult',l:['Did you fix it or string it?','…string.','Thought so.']}},

 {t:'Taking stock',     a:['Went round and counted everything.','Better than I thought, actually.','We are further on than last month.'],
  k:['I counted the chickens!','I got a different number every time.','There are LOTS.'],
  g:['Place has really come together.','You must be pleased.','Long way from bare land.'],
  w:['Writing it all down for once.','Numbers on paper make it real.','Right. Next month.'],
  s:{a:'adult',b:'adult',l:['We are further on than last month.','Are we?','Look at it. We are.']}},

 {t:'The month turns',  a:['Feels like a chapter closing.','Same land, different place.','On to the next one.'],
  k:['Is it a new month?','Do we start again?','I am taller than last month.'],
  g:['Sad to be packing up.','I will be back.','Best thing I have done all year.'],
  w:['Finishing the last of it.','Clean slate tomorrow.','Good month, this.'],
  s:{a:'adult',b:'child',l:['New month tomorrow.','Do we start again?','We carry on. That is better.']}},
];

function todayBeat(){
  const d = Math.max(1, S.day || 1);
  return DAYS[(d - 1) % DAYS.length];
}

/* ---------- 3. what they say ---------- */
/* Night, storms and the kitchen still win - a scripted scene about
   firewood in the middle of a thunderstorm would be worse than the
   generic line it replaced. */
if(typeof chatPool === 'function'){
  const _chatPoolBase = chatPool;
  chatPool = function(){
    const f = (typeof dayFrac === 'function') ? dayFrac() : 0.5;
    if(S.weather === 'storm') return CHAT.storm;
    if(f < 0.24 || f > 0.88)  return CHAT.night;
    if(f < 0.30 || (f > 0.78 && f < 0.86)) return CHAT.kitchen;
    return todayBeat().a;
  };
}

/* children talk about the day too, not just the same four play lines */
if(typeof tickChat === 'function'){
  const _tickChatBeat = tickChat;
  tickChat = function(dt){
    const beat = todayBeat();
    const kept = CHAT.play;
    /* mix today's children's lines in with the evergreen ones */
    CHAT.play = kept.concat(beat.k);
    try{ return _tickChatBeat.apply(this, arguments); }
    finally{ CHAT.play = kept; }
  };
}

/* ---------- 4. the day's one scene ---------- */
/* Plays once per day, when two people who fit the roles happen to be
   near each other. If it never gets the chance it simply does not play -
   forcing people to teleport together to deliver dialogue would look
   far worse than missing a scene. */
function peopleAll(){
  const all = (S.family || []).concat(S.workers || []);
  if(S.you) all.push(Object.assign({ id:'you', name:'You', role:'adult' }, { x:S.you.x, y:S.you.y }));
  return all;
}
function matchRole(p, want){
  const r = roleOf(p);
  if(want === 'adult') return r === 'adult' || r === 'you' || r === 'worker';
  return r === want;
}

let sceneCool = 0;
function tickScene(dt){
  if(S.sceneDay === (S.day || 0)) return;
  sceneCool -= dt;
  if(sceneCool > 0) return;
  sceneCool = 2;
  if(S.weather === 'storm') return;
  if(typeof isNight === 'function' && isNight()) return;
  const beat = todayBeat();
  const sc = beat.s; if(!sc) return;
  const all = peopleAll();
  if(all.length < 2) return;

  let A = null, B = null;
  for(let i=0;i<all.length && !A;i++){
    if(!matchRole(all[i], sc.a)) continue;
    for(let j=0;j<all.length;j++){
      if(i === j) continue;
      if(!matchRole(all[j], sc.b)) continue;
      const d = Math.hypot(all[i].x-all[j].x, all[i].y-all[j].y);
      if(d < 70){ A = all[i]; B = all[j]; break; }
    }
  }
  if(!A) return;

  S.sceneDay = S.day || 0;
  const speakers = [A, B, A];
  sc.l.forEach((line, k)=>{
    setTimeout(()=>{
      const who = speakers[k] || A;
      if(typeof speak === 'function') speak({x:who.x, y:who.y}, line);
    }, k * 1500);
  });
  if(typeof log === 'function')
    log(`${nameOf(A)} and ${nameOf(B)}: “${sc.l[0]}”`, '', 'home');
}

/* ---------- 5. thinking, and working ---------- */
/* A person on their own thinks; a person mid-job talks about the job.
   Both are trait-flavoured, so the same day sounds different depending
   on who is having it. */
let thinkCool = 0;
const WORK_STATES = ['busy','work','working'];

function tickThinkWork(dt){
  thinkCool -= dt;
  if(thinkCool > 0) return;
  thinkCool = 6 + Math.random()*7;
  if(typeof SET === 'function' && SET('motion') === false) return;
  const all = peopleAll();
  if(!all.length) return;
  const p = all[Math.floor(Math.random()*all.length)];
  if(!p || p.state === 'sleep') return;

  const tr = traitOf(p);
  const beat = todayBeat();
  const alone = all.every(q => q === p || Math.hypot(q.x-p.x, q.y-p.y) > 60);
  const working = WORK_STATES.indexOf(p.state) >= 0 || (p.act && /ing$/.test(p.act));

  let line;
  if(working) line = Math.random() < 0.5
      ? beat.w[Math.floor(Math.random()*beat.w.length)]
      : tr.work[Math.floor(Math.random()*tr.work.length)];
  else if(alone) line = tr.think[Math.floor(Math.random()*tr.think.length)];
  else return;                       /* in company - tickChat has this */

  if(typeof speak === 'function') speak({x:p.x, y:p.y}, line);
}

/* ---------- 6. the paying guests get the day too ---------- */
if(typeof GUEST_LINES === 'object'){
  const _guestDay = GUEST_LINES.day;
  Object.defineProperty(GUEST_LINES, 'day', {
    get(){ return _guestDay.concat(todayBeat().g); },
    configurable: true,
  });
}

/* ---------- 7. a line in the log so the day has a name ---------- */
if(typeof advanceDay === 'function'){
  const _advanceDayBeat = advanceDay;
  advanceDay = function(){
    const r = _advanceDayBeat.apply(this, arguments);
    const beat = todayBeat();
    if(typeof log === 'function') log(`Day ${S.day}: ${beat.t}.`, '', 'home');
    S.sceneDay = null;               /* today's scene has not played yet */
    return r;
  };
}

/* ---------- 8. wire in ---------- */
const _tickPeopleLives = tickPeople;
tickPeople = function(dt){
  const r = _tickPeopleLives.apply(this, arguments);
  if(S && S.speed !== 0){ tickScene(dt); tickThinkWork(dt); }
  return r;
};

/* ---------- handles ---------- */
G.today = function(){
  const b = todayBeat();
  return { day:S.day, theme:b.t, scene:b.s, scenePlayed:(S.sceneDay === S.day) };
};
G.whoIs = function(){
  return peopleAll().map(p=>({ name:nameOf(p), role:roleOf(p), trait:traitOf(p).n }));
};
G.playScene = function(){ S.sceneDay = null; sceneCool = 0; return 'scene armed - get two people together'; };
G.dayIs = function(d){ S.day = d; S.sceneDay = null; return G.today(); };
