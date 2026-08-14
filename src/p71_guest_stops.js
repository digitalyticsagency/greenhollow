/* =====================================================================
   GUESTS COULD NOT SEE ANYTHING NEW

   The guests walk to a stop chosen from GUEST_STOPS, and that was a
   hand-written list of eight art names: tea_kiosk, gift_shop,
   farm_stand, deck, firepit, playground, pond, orchard. The cafe, the
   honesty box, the pick-your-own gate and every new leisure item were
   simply not in it, so a guest would walk past a A$620 cafe to queue at
   the tea kiosk.

   The list is the bug, not its contents. A hand-maintained table of
   place names means every item added from here on is invisible to
   guests until somebody remembers to come back and add it. So the stops
   are derived from the blueprints instead: anything that takes money
   from a visitor, or that an adult would plausibly go and look at, is a
   stop automatically. The bespoke lines below are then decoration on top
   of a list that maintains itself.

   Two things are deliberately NOT stops. Lodging - the tent, the dome,
   the bunkhouse, the shepherd's hut - is where guests live, and having
   one pay to visit another's bed is nonsense. And anything with no charm
   and no income, like a signal relay, which nobody would cross a field
   to look at.
   ===================================================================== */

/* where a guest will not go */
const GUEST_LODGING = ['glamping','dome','bunkhouse','shepherd_hut'];

/* Lines and prices for the places that deserve their own voice. Anything
   not listed still becomes a stop - it just gets a generic line and a
   price worked out from its blueprint. */
const GUEST_STOP_LINES = {
  cafe:        { act:'in the cafe',            say:['Table for two?','That cake is enormous.','Best coffee for miles.'] },
  honesty_box: { act:'at the honesty box',     say:['No one here at all.','I have left the money in the tin.'] },
  pickyourown: { act:'picking their own',      say:['Right down the rows we go.','These are still warm.','One for the punnet, one for me.'] },
  tea_kiosk:   { act:'at the tea kiosk',       say:['Two teas, please.','Proper scone, this.'] },
  gift_shop:   { act:'in the gift shop',       say:['I am buying this.','One for my sister.'] },
  farm_stand:  { act:'at the farm stand',      say:['All this is from here?','I will take a dozen.'] },
  deck:        { act:'on the yoga deck',       say:['Breathe out…','Best class I have had.'] },
  firepit:     { act:'at the fire circle',     say:['Budge up.','Marshmallows?'] },
  firepit_seats:{act:'round the fire',         say:['Room for one more?','This is the best bit of the day.'] },
  playground:  { act:'watching the kids',      say:['They will sleep well tonight.'] },
  zipline:     { act:'watching the zip line',  say:['Go on, have a go.','Rather them than me.'] },
  climbing_frame:{act:'by the climbing frame', say:['Careful at the top!'] },
  plunge_pool: { act:'at the plunge pool',     say:['Cold. Very cold.','Bracing, that.'] },
  bird_hide:   { act:'in the bird hide',       say:['*whispering*','There — did you see it?','Shh.'] },
  pond:        { act:'down by the pond',       say:['Look at the light on that water.'] },
  orchard:     { act:'walking the orchard',    say:['Can you smell the blossom?'] },
  vine_row:    { act:'along the vines',        say:['You make wine too?','These are nearly ready.'] },
  dam:         { act:'up at the dam',          say:['That is a lot of water.','Good spot, this.'] },
  wildflower:  { act:'in the wildflowers',     say:['Listen to the bees.','I could photograph this all day.'] },
  pergola:     { act:'under the pergola',      say:['Out of the sun at last.','Smells wonderful.'] },
  sauna:       { act:'in the sauna',           say:['Ten more minutes.'] },
  hottub:      { act:'in the hot tub',         say:['This water is perfect.','Worth every cent.'] },
  cinema:      { act:'at the outdoor cinema',  say:['Have you seen this one?','Pass the popcorn.'] },
};

/* What a visit costs, taken from the blueprint rather than invented:
   a tourism building charges a share of its daily income, a shop takes a
   basket, and anything free stays free. */
function guestSpendFor(bp){
  if(!bp) return 0;
  if(GUEST_LODGING.indexOf(bp.art) >= 0) return 0;
  if(bp.kind === 'tourism') return Math.max(4, Math.round((bp.income || 10) * 0.55));
  if(bp.kind === 'shop')    return Math.max(4, Math.round((bp.rate || 1) * 6));
  return 0;                                   /* look, do not pay */
}

/* Is this worth crossing a field for? Anything that takes money, plus
   anything with real charm - which is the game's own measure of "nice to
   look at" - plus recreation meant for adults. */
function isGuestStop(bp){
  if(!bp) return false;
  if(GUEST_LODGING.indexOf(bp.art) >= 0) return false;
  /* The homestead has charm 12, which qualified it under the charm rule
     and sent paying guests wandering into the family's kitchen. Anywhere
     the household lives or works privately is out. */
  if(bp.kind === 'home' || bp.kind === 'housing' || bp.kind === 'hub') return false;
  if(bp.kind === 'tourism' || bp.kind === 'shop') return true;
  if(bp.kind === 'rec') return true;
  if(GUEST_STOP_LINES[bp.art] || GUEST_STOP_LINES[bp.art.replace(/^rec_/, '')]) return true;
  return (bp.charm || 0) >= 10;               /* ponds, orchards, big planting */
}

/* ---------- rebuild guestStops() from the world, every time ---------- */
if(typeof guestStops === 'function'){
  guestStops = function(){
    const out = [];
    (S.objs || []).forEach(o=>{
      const bp = BPMAP[o.bp];
      if(!isGuestStop(bp)) return;
      const f = footprint(bp, o.rot);
      /* leisure art is named rec_<id>, so a bespoke entry keyed on the
         plain id - plunge_pool, bird_hide - never matched and every new
         leisure item fell through to the generic line */
      const key = bp.art.replace(/^rec_/, '');
      const custom = GUEST_STOP_LINES[bp.art] || GUEST_STOP_LINES[key];
      out.push({
        art: bp.art,
        o,
        x: (o.tx + f.w * 0.5) * T,
        y: (o.ty + f.h * 0.78) * T,
        act: custom ? custom.act : `looking at the ${bp.name.toLowerCase()}`,
        say: custom ? custom.say : null,
        spend: guestSpendFor(bp),
      });
    });
    return out;
  };
}

/* pickGuestStop reads .spend and .say off whatever guestStops returns, so
   it needs no changes - but it did assume `say` was always present */
if(typeof pickGuestStop === 'function'){
  const _pickBase = pickGuestStop;
  pickGuestStop = function(g){
    const t = _pickBase.apply(this, arguments);
    /* a stop with no bespoke lines should still get the occasional
       remark, or the new places feel mute next to the old ones */
    if(t && !t.say && Math.random() < 0.4){
      const generic = ['Worth the walk.','I like this.','Have you been over here?','Lovely, this bit.'];
      if(typeof speak === 'function')
        setTimeout(()=>{ if(g.trip) speak(g, generic[Math.floor(Math.random()*generic.length)]); }, 2400);
    }
    return t;
  };
}

/* ---------- handles ---------- */
G.guestStops = function(){
  const stops = guestStops();
  return {
    count: stops.length,
    stops: stops.map(s=>({ art:s.art, act:s.act, spend:s.spend, bespoke: !!s.say })),
    ignored: (S.objs||[]).filter(o=>!isGuestStop(BPMAP[o.bp]))
              .map(o=>BPMAP[o.bp].art)
              .filter((v,i,a)=>a.indexOf(v)===i).slice(0,12),
  };
};
