/* =====================================================================
   FOUR SPECIES THAT WERE ONLY HALF ADDED

   The new pens registered, priced and placed correctly, and then the
   animals in them turned out to be nothing of the sort. Measured:
   quail, turkey and alpaca all rendered the same 199-character fallback
   shape - literally identical art - and every one of them spoke sheep.
   A pig said "baa".

   Adding a blueprint with animal:'pig' is only a third of adding a pig.
   The other two thirds are a body in beast3d and an entry in every
   per-species table: TONGUE, OUT_ACTS, IN_ACTS, ANIMAL_VOICE, the panic
   cries, SPECIES for herd movement, and the stray scale.
   ===================================================================== */

/* ---------- 1. bodies ---------- */
if(typeof beast3d === 'function'){
  const _beast3dNew = beast3d;
  beast3d = function(kind, x, y, sc, idle){
    sc = sc || 1;

    if(kind === 'quail'){
      /* a fat thumb with a topknot */
      const S0 = sc * 0.85;
      let s = `<ellipse cx="${n(x+0.5*S0)}" cy="${n(y+2.2*S0)}" rx="${n(3.2*S0)}" ry="${n(1.2*S0)}" fill="#16240c" opacity=".26"/>`;
      s += `<g class="a3-body">`;
      s += `<ellipse cx="${n(x)}" cy="${n(y)}" rx="${n(2.9*S0)}" ry="${n(2.2*S0)}" fill="#a98d68"/>`;
      s += `<ellipse cx="${n(x-0.6*S0)}" cy="${n(y-0.5*S0)}" rx="${n(2.3*S0)}" ry="${n(1.5*S0)}" fill="#c4a97f"/>`;
      s += `<path d="M${n(x+1.4*S0)} ${n(y-0.4*S0)} l${n(2.2*S0)} ${n(1.0*S0)} l${n(-2.0*S0)} ${n(0.7*S0)} Z" fill="#8d7452"/>`;
      s += `<g class="a3-head">`;
      s += `<circle cx="${n(x-2.4*S0)}" cy="${n(y-1.8*S0)}" r="${n(1.5*S0)}" fill="#b99a72"/>`;
      s += `<path d="M${n(x-2.6*S0)} ${n(y-3.1*S0)} q${n(-0.4*S0)} ${n(-1.6*S0)} ${n(1.1*S0)} ${n(-1.2*S0)}"
              fill="none" stroke="#3a2c1c" stroke-width="${n(0.6*S0)}" stroke-linecap="round"/>`;
      s += `<path d="M${n(x-3.7*S0)} ${n(y-1.7*S0)} l${n(-1.1*S0)} ${n(0.4*S0)} l${n(1.1*S0)} ${n(0.4*S0)} Z" fill="#d8a24a"/>`;
      s += `<circle cx="${n(x-2.8*S0)}" cy="${n(y-2.0*S0)}" r="${n(0.3*S0)}" fill="#1d1408"/>`;
      s += `</g></g>`;
      return s;
    }

    if(kind === 'pig'){
      const S0 = sc * 1.05;
      let s = `<ellipse cx="${n(x+0.7*S0)}" cy="${n(y+3.0*S0)}" rx="${n(5.0*S0)}" ry="${n(1.7*S0)}" fill="#16240c" opacity=".26"/>`;
      s += `<g class="a3-body">`;
      [-2.2,-0.9,1.2,2.4].forEach(lx=>{
        s += `<rect x="${n(x+lx*S0)}" y="${n(y+1.0*S0)}" width="${n(0.9*S0)}" height="${n(2.0*S0)}" rx="${n(0.45*S0)}" fill="#c98f92"/>`; });
      s += `<ellipse cx="${n(x)}" cy="${n(y)}" rx="${n(4.0*S0)}" ry="${n(2.5*S0)}" fill="#e0a3a6"/>`;
      s += `<ellipse cx="${n(x-0.5*S0)}" cy="${n(y-0.8*S0)}" rx="${n(3.3*S0)}" ry="${n(1.6*S0)}" fill="#efbcbe"/>`;
      s += `<path class="a3-tail" d="M${n(x+4.0*S0)} ${n(y-0.6*S0)} q${n(1.4*S0)} ${n(-0.9*S0)} ${n(0.4*S0)} ${n(-1.7*S0)}"
              fill="none" stroke="#c98f92" stroke-width="${n(0.7*S0)}" stroke-linecap="round"/>`;
      s += `<g class="a3-head">`;
      s += `<ellipse cx="${n(x-4.0*S0)}" cy="${n(y-0.5*S0)}" rx="${n(2.1*S0)}" ry="${n(1.8*S0)}" fill="#e6adb0"/>`;
      s += `<ellipse cx="${n(x-5.5*S0)}" cy="${n(y-0.2*S0)}" rx="${n(1.0*S0)}" ry="${n(0.85*S0)}" fill="#c9787c"/>`;
      s += `<circle cx="${n(x-5.7*S0)}" cy="${n(y-0.4*S0)}" r="${n(0.2*S0)}" fill="#7a4448"/>`;
      s += `<circle cx="${n(x-5.2*S0)}" cy="${n(y-0.4*S0)}" r="${n(0.2*S0)}" fill="#7a4448"/>`;
      s += `<path d="M${n(x-4.7*S0)} ${n(y-2.0*S0)} l${n(0.9*S0)} ${n(-1.3*S0)} l${n(0.9*S0)} ${n(1.2*S0)} Z" fill="#d9989b"/>`;
      s += `<circle cx="${n(x-4.2*S0)}" cy="${n(y-0.9*S0)}" r="${n(0.32*S0)}" fill="#1d1408"/>`;
      s += `</g></g>`;
      return s;
    }

    if(kind === 'turkey'){
      const S0 = sc * 1.0;
      let s = `<ellipse cx="${n(x+0.6*S0)}" cy="${n(y+2.8*S0)}" rx="${n(4.2*S0)}" ry="${n(1.5*S0)}" fill="#16240c" opacity=".26"/>`;
      s += `<g class="a3-body">`;
      /* the fan first, behind everything */
      for(let i=0;i<7;i++){
        const a = -1.15 + i*0.38;
        s += `<ellipse cx="${n(x + 2.2*S0 + Math.cos(a)*2.4*S0)}" cy="${n(y - 0.4*S0 + Math.sin(a)*2.6*S0)}"
                rx="${n(1.5*S0)}" ry="${n(0.75*S0)}" fill="${i%2?'#5a4632':'#6d573f'}"
                transform="rotate(${n(a*57)} ${n(x+2.2*S0)} ${n(y-0.4*S0)})"/>`;
      }
      s += `<ellipse cx="${n(x)}" cy="${n(y)}" rx="${n(3.1*S0)}" ry="${n(2.4*S0)}" fill="#3f3226"/>`;
      s += `<ellipse cx="${n(x-0.5*S0)}" cy="${n(y-0.6*S0)}" rx="${n(2.4*S0)}" ry="${n(1.5*S0)}" fill="#584535"/>`;
      s += `<g class="a3-head">`;
      s += `<path d="M${n(x-2.4*S0)} ${n(y-1.2*S0)} q${n(-0.9*S0)} ${n(-2.0*S0)} ${n(0.3*S0)} ${n(-2.9*S0)}"
              fill="none" stroke="#c9787c" stroke-width="${n(1.2*S0)}" stroke-linecap="round"/>`;
      s += `<circle cx="${n(x-2.2*S0)}" cy="${n(y-4.3*S0)}" r="${n(1.1*S0)}" fill="#d38f92"/>`;
      s += `<path d="M${n(x-2.9*S0)} ${n(y-4.6*S0)} q${n(-0.7*S0)} ${n(1.0*S0)} ${n(0.2*S0)} ${n(1.6*S0)}"
              fill="none" stroke="#c04a52" stroke-width="${n(0.6*S0)}" stroke-linecap="round"/>`;
      s += `<circle cx="${n(x-2.5*S0)}" cy="${n(y-4.5*S0)}" r="${n(0.26*S0)}" fill="#1d1408"/>`;
      s += `</g></g>`;
      return s;
    }

    if(kind === 'alpaca'){
      const S0 = sc * 1.15;
      const fleece = '#e7dcc6';
      let s = `<ellipse cx="${n(x+0.6*S0)}" cy="${n(y+3.4*S0)}" rx="${n(4.6*S0)}" ry="${n(1.7*S0)}" fill="#16240c" opacity=".26"/>`;
      s += `<g class="a3-body">`;
      [-1.9,-0.7,1.1,2.2].forEach(lx=>{
        s += `<rect x="${n(x+lx*S0)}" y="${n(y+0.9*S0)}" width="${n(0.8*S0)}" height="${n(2.7*S0)}" rx="${n(0.4*S0)}" fill="#cdbfa4"/>`; });
      s += `<ellipse cx="${n(x)}" cy="${n(y)}" rx="${n(3.5*S0)}" ry="${n(2.3*S0)}" fill="${fleece}"/>`;
      /* fleece texture: a few soft scallops rather than an outline */
      for(let i=0;i<4;i++)
        s += `<circle cx="${n(x-2.1*S0+i*1.4*S0)}" cy="${n(y-1.2*S0)}" r="${n(1.1*S0)}" fill="#f2ebda"/>`;
      s += `<g class="a3-head">`;
      s += `<rect x="${n(x-3.6*S0)}" y="${n(y-5.4*S0)}" width="${n(1.5*S0)}" height="${n(4.6*S0)}" rx="${n(0.75*S0)}" fill="${fleece}"/>`;
      s += `<ellipse cx="${n(x-2.9*S0)}" cy="${n(y-6.0*S0)}" rx="${n(1.5*S0)}" ry="${n(1.1*S0)}" fill="#f2ebda"/>`;
      s += `<path d="M${n(x-3.6*S0)} ${n(y-6.9*S0)} l${n(0.3*S0)} ${n(-1.4*S0)} l${n(0.7*S0)} ${n(1.2*S0)} Z" fill="${fleece}"/>`;
      s += `<path d="M${n(x-2.5*S0)} ${n(y-6.9*S0)} l${n(0.3*S0)} ${n(-1.3*S0)} l${n(0.7*S0)} ${n(1.1*S0)} Z" fill="${fleece}"/>`;
      s += `<circle cx="${n(x-3.4*S0)}" cy="${n(y-6.1*S0)}" r="${n(0.3*S0)}" fill="#1d1408"/>`;
      s += `<ellipse cx="${n(x-4.0*S0)}" cy="${n(y-5.8*S0)}" rx="${n(0.5*S0)}" ry="${n(0.4*S0)}" fill="#b9a98c"/>`;
      s += `</g></g>`;
      return s;
    }

    return _beast3dNew.apply(this, arguments);
  };
}

/* ---------- 2. voices, activities and movement ---------- */
(function newSpeciesTables(){
  if(typeof TONGUE === 'object'){
    TONGUE.quail  = { soft:['pip','prrt','chur'],   loud:['PIPIP','CHURR'], purr:'prrrrr', trill:'pip-pip-pip' };
    TONGUE.pig    = { soft:['oink','hnf','grf'],    loud:['OINK!','SQUEE'], purr:'hrrrnf', trill:'oink-oink' };
    TONGUE.turkey = { soft:['gobl','purr','kut'],   loud:['GOBBLE','GOB-GOB'], purr:'prrrp', trill:'gobble-obble' };
    TONGUE.alpaca = { soft:['mmm','hmn','nnh'],     loud:['MWAAH','ORGLE'], purr:'hmmmmm', trill:'mm-mm-mm' };
  }
  if(typeof OUT_ACTS === 'object'){
    OUT_ACTS.quail  = [['dust-bathing','*fluff*'],['pecking grit','pip'],['hiding in the grass','…'],['scurrying','pip pip!']];
    IN_ACTS.quail   = [['in the hutch','prrrrr'],['at the seed','pip'],['tucked up','💤']];
    OUT_ACTS.pig    = [['rooting','*snuffle*'],['in the wallow','hnf'],['sunbathing','hrrrnf'],['at the trough','oink!']];
    IN_ACTS.pig     = [['in the straw','hrrrnf'],['at the trough','oink'],['flat out','💤']];
    OUT_ACTS.turkey = [['strutting','GOBBLE'],['fanning out','gobl gobl'],['pecking about','kut'],['dozing','prrrp']];
    IN_ACTS.turkey  = [['on the perch','prrrp'],['at the feeder','kut'],['roosting','💤']];
    OUT_ACTS.alpaca = [['grazing','mmm'],['humming','hmmmmm'],['watching you','hmn?'],['sitting cush','nnh']];
    IN_ACTS.alpaca  = [['at the hay','*chew*'],['humming softly','hmmmmm'],['cushed down','💤']];
  }
  if(typeof FEED_VERB === 'object'){
    FEED_VERB.quail = 'pecking grit'; FEED_VERB.pig = 'rooting'; FEED_VERB.turkey = 'pecking about';
  }
  if(typeof ANIMAL_VOICE === 'object' && typeof utter === 'function'){
    ['quail','pig','turkey','alpaca'].forEach(k=>{
      ANIMAL_VOICE[k] = { sfx: k === 'pig' ? 'oink' : k === 'alpaca' ? 'bleat' : 'cluck',
        ok:[utter(k,'content'), utter(k,'content'), utter(k,'affection')],
        hungry:[utter(k,'hungry')+' 🌾', utter(k,'alarm')+' 🌾'],
        dirty:[utter(k,'confused')] };
    });
  }
  if(typeof PANIC_CRY === 'object' && typeof utter === 'function'){
    ['quail','pig','turkey','alpaca'].forEach(k=>{
      PANIC_CRY[k]  = [utter(k,'alarm')+' 😱', utter(k,'alarm')+' 😨'];
      PANIC_CALL[k] = [utter(k,'curious'), utter(k,'sleepy')];
    });
  }
  if(typeof SPECIES === 'object'){
    SPECIES.quail  = { sc:0.7,  walk:6.5, run:19, restless:1.0, sound:'cluck' };
    SPECIES.pig    = { sc:1.05, walk:3.6, run:11, restless:0.5, sound:'oink'  };
    SPECIES.turkey = { sc:1.0,  walk:5.0, run:15, restless:0.8, sound:'cluck' };
    SPECIES.alpaca = { sc:1.1,  walk:3.4, run:12, restless:0.4, sound:'bleat' };
  }
  if(typeof STRAY_SC === 'object'){
    STRAY_SC.quail = 0.7; STRAY_SC.pig = 1.05; STRAY_SC.turkey = 1.0; STRAY_SC.alpaca = 1.1;
  }
  if(typeof STRAY_OUT === 'object' && typeof utter === 'function'){
    ['quail','pig','turkey','alpaca'].forEach(k=>{
      STRAY_OUT[k] = [utter(k,'alarm'), utter(k,'curious')+' 🚪'];
    });
  }
})();

/* a pig shed needs a wallow, not a hay net */
if(typeof shedFittings === 'function'){
  const _shedFittingsPig = shedFittings;
  shedFittings = function(kind, b){
    if(kind !== 'pig') return _shedFittingsPig.apply(this, arguments);
    const W = b.w, H = b.h;
    let s = `<rect x="${n(b.x)}" y="${n(b.y)}" width="${n(W)}" height="${n(H)}" rx="3" fill="#d8c48b"/>`;
    for(let i=0;i<10;i++){
      const sx = b.x + 3 + hash(i*3.1)*(W-6), sy = b.y + 3 + hash(i*6.7)*(H-6);
      s += `<line x1="${n(sx)}" y1="${n(sy)}" x2="${n(sx+3)}" y2="${n(sy-1.3)}" stroke="#bfa96c" stroke-width=".7"/>`;
    }
    /* deep straw bed, a long trough, and the wallow */
    s += `<rect x="${n(b.x+W*0.06)}" y="${n(b.y+H*0.46)}" width="${n(W*0.5)}" height="${n(H*0.42)}" rx="3" fill="#e4d2a0"/>`;
    s += `<rect x="${n(b.x+W*0.08)}" y="${n(b.y+H*0.1)}" width="${n(W*0.62)}" height="${n(H*0.14)}" rx="2" fill="#8f9aa2"/>`;
    s += `<rect x="${n(b.x+W*0.095)}" y="${n(b.y+H*0.115)}" width="${n(W*0.59)}" height="${n(H*0.09)}" rx="1.5" fill="#7f6a4a"/>`;
    s += `<ellipse cx="${n(b.x+W*0.78)}" cy="${n(b.y+H*0.66)}" rx="${n(W*0.16)}" ry="${n(H*0.2)}" fill="#6b5334"/>`;
    s += `<ellipse cx="${n(b.x+W*0.78)}" cy="${n(b.y+H*0.66)}" rx="${n(W*0.11)}" ry="${n(H*0.14)}" fill="#54402a"/>`;
    s += `<circle class="fx-bulb" cx="${n(b.x+W*0.5)}" cy="${n(b.y+H*0.04)}" r="2.6" fill="#ffe9a8"/>`;
    return s;
  };
}

/* ---------- handles ---------- */
G.speciesCheck = function(){
  const out = {};
  ['quail','pig','turkey','alpaca','chicken','sheep'].forEach(k=>{
    let art = '';
    try{ art = beast(k, 10, 10, 1) || ''; }catch(e){ art = 'ERR ' + e.message; }
    out[k] = { artLen: art.length,
               tongue: (typeof TONGUE === 'object') && !!TONGUE[k],
               acts:   (typeof OUT_ACTS === 'object') && !!OUT_ACTS[k],
               species:(typeof SPECIES === 'object') && !!SPECIES[k],
               says:   (typeof utter === 'function') ? utter(k,'content') : null };
  });
  return out;
};
