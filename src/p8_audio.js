/* =====================================================================
   AUDIO — everything synthesised in-browser so the file stays standalone.
   Action SFX + ambient farm bed + weather layer + slow generative music.
   ===================================================================== */
const SND = (function(){
  let ac=null, master=null, sfxG=null, ambG=null, wxG=null, musG=null;
  let started=false, muted=false, noiseBuf=null;
  let wind=null, rain=null, rainF=null, rainLP=null, birdTimer=0, musTimer=0, musStep=0, muteHold=0;
  const vol = {master:0.75, sfx:0.9, amb:0.35, wx:0.17, mus:0.22};

  function ctx(){
    if(ac) return ac;
    const AC = window.AudioContext||window.webkitAudioContext;
    if(!AC) return null;
    ac = new AC();
    master = ac.createGain(); master.gain.value = vol.master; master.connect(ac.destination);
    sfxG = ac.createGain(); sfxG.gain.value = vol.sfx; sfxG.connect(master);
    ambG = ac.createGain(); ambG.gain.value = 0;        ambG.connect(master);
    wxG  = ac.createGain(); wxG.gain.value  = 0;        wxG.connect(master);
    musG = ac.createGain(); musG.gain.value = 0;        musG.connect(master);
    /* one shared noise buffer */
    const len = ac.sampleRate*2;
    noiseBuf = ac.createBuffer(1, len, ac.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for(let i=0;i<len;i++) d[i] = Math.random()*2-1;
    return ac;
  }
  function noiseSrc(){ const s=ctx().createBufferSource(); s.buffer=noiseBuf; s.loop=true; return s; }

  /* --- primitive voices --- */
  function tone(freq, dur, type, gain, dest, slideTo){
    const c=ctx(); if(!c) return;
    const o=c.createOscillator(), g=c.createGain();
    o.type=type||'sine'; o.frequency.setValueAtTime(freq, c.currentTime);
    if(slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(20,slideTo), c.currentTime+dur);
    g.gain.setValueAtTime(0, c.currentTime);
    g.gain.linearRampToValueAtTime(gain||0.2, c.currentTime+0.012);
    g.gain.exponentialRampToValueAtTime(0.0008, c.currentTime+dur);
    o.connect(g); g.connect(dest||sfxG); o.start(); o.stop(c.currentTime+dur+0.05);
  }
  function noiseHit(dur, f0, f1, gain, q, dest){
    const c=ctx(); if(!c) return;
    const s=noiseSrc(), f=c.createBiquadFilter(), g=c.createGain();
    f.type='bandpass'; f.Q.value=q||1.2;
    f.frequency.setValueAtTime(f0, c.currentTime);
    f.frequency.exponentialRampToValueAtTime(Math.max(40,f1||f0), c.currentTime+dur);
    g.gain.setValueAtTime(0, c.currentTime);
    g.gain.linearRampToValueAtTime(gain||0.2, c.currentTime+0.01);
    g.gain.exponentialRampToValueAtTime(0.0008, c.currentTime+dur);
    s.connect(f); f.connect(g); g.connect(dest||sfxG); s.start(); s.stop(c.currentTime+dur+0.05);
  }

  /* --- the sound set --- */
  const FX = {
    place(){ noiseHit(0.13, 420, 130, 0.34, 0.9); tone(150, 0.16, 'triangle', 0.2, null, 84); },
    build(){ noiseHit(0.2, 700, 180, 0.28, 0.8); tone(196, 0.3, 'triangle', 0.16, null, 147);
             setTimeout(()=>tone(294, 0.26, 'sine', 0.12), 90); },
    plant(){ noiseHit(0.22, 2600, 900, 0.14, 0.7); tone(520, 0.1, 'sine', 0.06, null, 700); },
    water(){ const c=ctx(); if(!c) return;
             noiseHit(0.5, 1500, 400, 0.2, 0.5);
             for(let i=0;i<4;i++) setTimeout(()=>tone(680+Math.random()*500, 0.1, 'sine', 0.05, null, 300), i*70); },
    harvest(){ tone(660, 0.14, 'triangle', 0.2, null, 880); noiseHit(0.16, 3200, 1200, 0.12, 0.8);
               setTimeout(()=>tone(990, 0.16, 'sine', 0.13), 70); },
    collect(){ tone(740, 0.11, 'sine', 0.16, null, 900); setTimeout(()=>tone(1100, 0.13, 'sine', 0.11), 60); },
    coin(){ [1046,1318,1568].forEach((f,i)=> setTimeout(()=>tone(f, 0.2, 'triangle', 0.15), i*55)); },
    sell(){ [784,988,1174,1568].forEach((f,i)=> setTimeout(()=>tone(f, 0.24, 'sine', 0.13), i*60)); },
    level(){ [523,659,784,1046,1318].forEach((f,i)=> setTimeout(()=>tone(f, 0.42, 'triangle', 0.17), i*95)); },
    /* the all-clear after a scare: a warm major phrase with a low root
       under it. Deliberately gentle rather than a fanfare - it is relief,
       not a victory. */
    huddle(){
      [523.25, 659.25, 783.99, 1046.50, 987.77, 783.99].forEach((f,i)=>
        setTimeout(()=>tone(f, 0.9, 'triangle', 0.13), i*180));
      setTimeout(()=>tone(261.63, 2.4, 'sine', 0.10), 120);   // root underneath
      setTimeout(()=>tone(392.00, 2.2, 'sine', 0.07), 420);   // fifth
    },
    fright(){ tone(320, 0.14, 'triangle', 0.10, null, 180); },
    error(){ tone(196, 0.2, 'square', 0.11, null, 130); },
    click(){ noiseHit(0.05, 2400, 1400, 0.1, 1.6); },
    rotate(){ noiseHit(0.09, 1100, 2200, 0.13, 1.2); },
    remove(){ noiseHit(0.26, 300, 90, 0.26, 0.7); },
    upgrade(){ [392,523,659,880].forEach((f,i)=> setTimeout(()=>tone(f, 0.36, 'triangle', 0.16), i*80));
               setTimeout(()=>noiseHit(0.4, 4000, 1200, 0.1, 0.6), 240); },
    cluck(){ const b=430+Math.random()*120;
             tone(b, 0.07, 'square', 0.05, null, b*1.5);
             setTimeout(()=>tone(b*0.8, 0.09, 'square', 0.04, null, b*0.6), 80); },
    bleat(){ tone(320, 0.3, 'sawtooth', 0.045, null, 250); },
    /* the dog. A bark is a hard consonant then a falling vowel, which is
       a noise transient and a dropping square — pitched a little
       differently each time so a run of them is not a machine. */
    bark(){ const b = 230 + Math.random()*70;
            noiseHit(0.06, 1900, 700, 0.09, 0.9);
            tone(b, 0.10, 'square', 0.065, null, b*0.55);
            setTimeout(()=>tone(b*0.78, 0.07, 'sawtooth', 0.035, null, b*0.5), 72); },
    growl(){ const b = 88 + Math.random()*22;
             tone(b, 0.55, 'sawtooth', 0.05, null, b*0.82);
             noiseHit(0.5, 280, 110, 0.045, 0.6); },
    whine(){ const b = 520 + Math.random()*80;
             tone(b, 0.42, 'sine', 0.05, null, b*1.7); },
    bee(){ tone(220, 0.5, 'sawtooth', 0.02, null, 210); },
    /* the rest of the yard. Kept small and soft - these fire often, so
       anything with a sharp attack becomes irritating within a minute. */
    moo(){ const b = 155 + Math.random()*20;
           tone(b, 0.55, 'sawtooth', 0.055, null, b*0.72);
           setTimeout(()=>tone(b*0.86, 0.35, 'sine', 0.03, null, b*0.7), 260); },
    quack(){ const b = 380 + Math.random()*70;
             tone(b, 0.09, 'square', 0.045, null, b*0.6);
             setTimeout(()=>tone(b*0.9, 0.08, 'square', 0.035, null, b*0.55), 110); },
    oink(){ const b = 240 + Math.random()*40;
            tone(b, 0.12, 'sawtooth', 0.05, null, b*1.6);
            setTimeout(()=>tone(b*1.1, 0.10, 'sawtooth', 0.035, null, b*0.6), 130); },
    thump(){ tone(120, 0.10, 'sine', 0.05, null, 90); },
    /* Thunder, shaped by how far away the strike was. Every strike used to
       sound identical - one soft low rumble - which made lightning feel
       like weather wallpaper rather than something happening nearby.
       dist runs 0 (overhead) to 1 (across the valley). */
    thunder(dist){ const c=ctx(); if(!c) return;
      const d = Math.max(0, Math.min(1, dist===undefined ? 0.6 : dist));
      const t = c.currentTime;
      const near = 1 - d;

      /* the initial crack: only a close strike has one, and it is brief,
         bright and hard-edged */
      if(near > 0.35){
        const cs = noiseSrc(), hp = c.createBiquadFilter(), cg = c.createGain();
        hp.type = 'highpass';
        hp.frequency.setValueAtTime(900 + near*2200, t);
        hp.frequency.exponentialRampToValueAtTime(320, t + 0.22);
        cg.gain.setValueAtTime(0, t);
        cg.gain.linearRampToValueAtTime(0.30 * near, t + 0.004);
        cg.gain.exponentialRampToValueAtTime(0.001, t + 0.30 + near*0.2);
        cs.connect(hp); hp.connect(cg); cg.connect(wxG);
        cs.start(t); cs.stop(t + 0.6);
      }

      /* the body: closer strikes are tighter and louder, distant ones
         longer, softer and rolled further off at the top */
      const len = 1.6 + d*2.8;
      const s = noiseSrc(), f = c.createBiquadFilter(), g = c.createGain();
      f.type = 'lowpass';
      f.frequency.setValueAtTime(120 + near*520, t);
      f.frequency.exponentialRampToValueAtTime(40 + d*30, t + len*0.85);
      f.Q.value = 0.7;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.10 + near*0.20, t + 0.05 + d*0.14);
      /* two swells so it rolls rather than fading flat */
      g.gain.exponentialRampToValueAtTime(0.04 + near*0.08, t + len*0.42);
      g.gain.linearRampToValueAtTime(0.06 + near*0.10, t + len*0.58);
      g.gain.exponentialRampToValueAtTime(0.001, t + len);
      s.connect(f); f.connect(g); g.connect(wxG);
      s.start(t); s.stop(t + len + 0.2); },
  };

  /* --- ambient wind bed + birds --- */
  function startAmbient(){
    const c=ctx(); if(!c || wind) return;
    const s=noiseSrc(), f=c.createBiquadFilter(), g=c.createGain(), lfo=c.createOscillator(), lg=c.createGain();
    f.type='lowpass'; f.frequency.value=420; f.Q.value=0.5;
    g.gain.value=0.5;
    lfo.frequency.value=0.07; lg.gain.value=180;
    lfo.connect(lg); lg.connect(f.frequency); lfo.start();
    s.connect(f); f.connect(g); g.connect(ambG); s.start();
    wind = {s,f,g};
    scheduleBird();
  }
  function scheduleBird(){
    clearTimeout(birdTimer);
    birdTimer = setTimeout(()=>{
      if(!muted && ac && ac.state==='running' && ambG && ambG.gain.value>0.01){
        const base = 1800+Math.random()*1400, n = 2+Math.floor(Math.random()*3);
        for(let i=0;i<n;i++)
          setTimeout(()=> tone(base*(1+Math.random()*0.3), 0.07, 'sine', 0.035, ambG, base*1.6), i*90);
      }
      scheduleBird();
    }, 5000+Math.random()*11000);
  }

  /* --- weather layer --- */
  function setWeather(kind){
    const c=ctx(); if(!c) return;
    const wet = kind==='rain'||kind==='storm';
    const snowy = kind==='frost';
    if((wet||snowy) && !rain){
      /* rain was a bright bandpass hiss — soften it to a lowpassed patter
         with the high end rolled off so it can sit under everything else */
      const s=noiseSrc(), f=c.createBiquadFilter(), lp=c.createBiquadFilter(), g=c.createGain();
      f.type='bandpass'; f.frequency.value = kind==='storm'?520:760; f.Q.value=0.25;
      lp.type='lowpass'; lp.frequency.value = 1100; lp.Q.value=0.4;
      g.gain.value=0.34;
      s.connect(f); f.connect(lp); lp.connect(g); g.connect(wxG); s.start();
      rain={s,g}; rainF=f; rainLP=lp;
    }
    if(rainF) rainF.frequency.setTargetAtTime(kind==='storm'?480:820, c.currentTime, 1.5);
    if(rainLP) rainLP.frequency.setTargetAtTime(kind==='storm'?900:1200, c.currentTime, 1.5);
    const stw = (S&&S.settings)||{};
    const wv = stw.volWeather===undefined ? 60 : stw.volWeather;
    const target = (muted || stw.wx===false) ? 0
      : (kind==='storm'?vol.wx:kind==='rain'?vol.wx*0.6:0) * (wv/60);
    wxG.gain.setTargetAtTime(target, c.currentTime, 1.6);
    if(kind==='storm'){
      const boom=()=>{ if(S && S.weather==='storm' && !muted){ FX.thunder();
        setTimeout(boom, 18000+Math.random()*26000); } };
      setTimeout(boom, 2500+Math.random()*6000);
    }
  }

  /* --- slow generative music: pentatonic pad, one note every couple of seconds --- */
  const SCALE = [0,2,4,7,9,12,14,16,19,21];
  function startMusic(){
    if(musTimer) return;
    const step = ()=>{
      const c=ctx();
      if(c && !muted && ac.state==='running' && musG.gain.value>0.005){
        const root = 174.61;                       // F3
        const deg = SCALE[Math.floor(Math.random()*SCALE.length)];
        const f = root*Math.pow(2, deg/12);
        const o=c.createOscillator(), g=c.createGain(), lp=c.createBiquadFilter();
        o.type = musStep%4===0 ? 'triangle' : 'sine';
        o.frequency.value = f;
        lp.type='lowpass'; lp.frequency.value=1400;
        g.gain.setValueAtTime(0, c.currentTime);
        g.gain.linearRampToValueAtTime(0.22, c.currentTime+0.5);
        g.gain.exponentialRampToValueAtTime(0.001, c.currentTime+3.2);
        o.connect(lp); lp.connect(g); g.connect(musG);
        o.start(); o.stop(c.currentTime+3.4);
        if(musStep%4===0){                          // soft bass root
          const b=c.createOscillator(), bg=c.createGain();
          b.type='sine'; b.frequency.value=root/2;
          bg.gain.setValueAtTime(0, c.currentTime);
          bg.gain.linearRampToValueAtTime(0.16, c.currentTime+0.7);
          bg.gain.exponentialRampToValueAtTime(0.001, c.currentTime+4);
          b.connect(bg); bg.connect(musG); b.start(); b.stop(c.currentTime+4.2);
        }
        musStep++;
      }
      musTimer = setTimeout(step, 1900+Math.random()*1500);
    };
    musTimer = setTimeout(step, 1200);
  }

  function unlock(){
    if(started) return;
    const c=ctx(); if(!c) return;
    if(c.state==='suspended') c.resume();
    started=true;
    startAmbient(); startMusic();
    applyMix();
  }
  function applyMix(){
    const c=ctx(); if(!c) return;
    if(muted){
      /* setTargetAtTime only ever approaches zero, so a continuous noise bed
         stays faintly audible. Ramp to a true zero, then stop the clock. */
      [master, ambG, wxG, musG, sfxG].forEach(g=>{
        g.gain.cancelScheduledValues(c.currentTime);
        g.gain.setValueAtTime(g.gain.value, c.currentTime);
        g.gain.linearRampToValueAtTime(0, c.currentTime+0.12);
        g.gain.setValueAtTime(0, c.currentTime+0.13);
      });
      clearTimeout(birdTimer);
      if(muteHold) clearTimeout(muteHold);
      muteHold = setTimeout(()=>{ if(muted && ac && ac.state==='running') ac.suspend(); }, 220);
      return;
    }
    if(muteHold){ clearTimeout(muteHold); muteHold=0; }
    if(ac.state==='suspended') ac.resume();
    const st = (S&&S.settings)||{};
    const mv = st.volMaster===undefined ? 75 : st.volMaster;
    const mus2 = st.volMusic===undefined ? 22 : st.volMusic;
    vol.master = mv/100; vol.mus = mus2/100;
    if(st.amb === false) vol.amb = 0; else vol.amb = 0.35*(mv/100);
    if(st.wx  === false) vol.wx  = 0; else vol.wx  = 0.17*(mv/100);
    if(st.mus === false) vol.mus = 0;
    [master, sfxG].forEach(g=> g.gain.cancelScheduledValues(c.currentTime));
    master.gain.setTargetAtTime(vol.master, c.currentTime, 0.2);
    sfxG.gain.setTargetAtTime(vol.sfx, c.currentTime, 0.1);
    ambG.gain.cancelScheduledValues(c.currentTime);
    musG.gain.cancelScheduledValues(c.currentTime);
    ambG.gain.setTargetAtTime(vol.amb, c.currentTime, 0.8);
    musG.gain.setTargetAtTime(vol.mus, c.currentTime, 1.2);
    scheduleBird();
    if(S) setWeather(S.weather);
  }

  return {
    unlock, applyMix,
    play(name, arg){
      if(muted||!started) return;
      const st = (S&&S.settings)||{};
      if(st.sfx === false) return;
      if(st.animalSfx === false && ['cluck','bleat','bee'].includes(name)) return;
      const f=FX[name]; if(f) try{ f(arg); }catch(e){}
    },
    weather(k){ if(started) setWeather(k); },
    /* The music bus was wired up and left at zero — the Music setting in
       Settings has never had anything to turn on. Exposed so a score can
       be played through the same mixer, mute and volume as everything
       else rather than opening a second AudioContext beside it. */
    music(){ const c = ctx(); if(!c) return null;
      musG.gain.setTargetAtTime(muted || (S.snd && S.snd.mus === false) ? 0 : vol.mus,
        c.currentTime, 0.4);
      return { ctx:c, bus:musG }; },
    musicOff(){ const c = ctx(); if(c) musG.gain.setTargetAtTime(0, c.currentTime, 0.5); },
    setMuted(m){ muted=m; applyMix(); },
    isMuted(){ return muted; },
    debug(){ return ac ? {state:ac.state, master:+master.gain.value.toFixed(4),
      amb:+ambG.gain.value.toFixed(4), wx:+wxG.gain.value.toFixed(4),
      mus:+musG.gain.value.toFixed(4), muted} : {state:'none', muted}; },
    toggleLayer(k,on){ if(!S.snd) S.snd={}; S.snd[k]=on; applyMix(); },
    seasonTint(){ /* birds thin out in winter */
      if(!ambG) return;
      const c=ctx(); if(!c) return;
      const s = S ? S.season : 0;
      ambG.gain.setTargetAtTime(muted?0:(S.snd&&S.snd.amb===false?0:vol.amb*(s===2?0.5:1)), c.currentTime, 2);
    }
  };
})();
function sfx(n){ SND.play(n); }
