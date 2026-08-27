// Global narrative magic layer for the desktop classroom demo.
// Magic is independent from CITY/PARK/MARKET and STORY/INTERACT.
// Scan once -> 15s. Scan same card again -> renew. Scan another -> replace.
// Scene change -> clear immediately.
(function(){
  const DURATION=15000;
  const ASSETS={
    cloud:{cloud:'./assets/cloud/cloud.png',wind01:'./assets/cloud/wind_01.png',wind02:'./assets/cloud/wind_02.png',sparkles:'./assets/cloud/sparkles.png'},
    fire:{fire:'./assets/fire/fire_main.png',sparks:'./assets/fire/fire_sparks.png',smoke:'./assets/fire/smoke.png',heat:'./assets/fire/heat_wave.png'},
    rain:{cloud:'./assets/rain/rain_cloud.png',drops:'./assets/rain/rain_drops.png',splash:'./assets/rain/rain_splash.png'},
    grow:{vine:'./assets/grow/grow_vine.png',leaves:'./assets/grow/grow_leaves.png',flower:'./assets/grow/grow_flower.png'}
  };
  const LABEL={cloud:'☁️ CLOUD',fire:'🔥 FIRE',rain:'🌧️ RAIN',grow:'🌱 GROW'};

  const M={active:null,until:0,start:0,canvas:null,ctx:null,images:{},raf:0,lastScene:null};
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const smooth=x=>{x=clamp(x,0,1);return x*x*(3-2*x)};
  const ease=x=>1-Math.pow(1-clamp(x,0,1),3);
  function dc(ctx,img,x,y,w,h,r=0,a=1){if(!img)return;ctx.save();ctx.globalAlpha=a;ctx.translate(x,y);ctx.rotate(r);ctx.drawImage(img,-w/2,-h/2,w,h);ctx.restore()}

  function ensureCanvas(){
    if(M.canvas)return;
    const c=document.createElement('canvas');
    c.id='globalMagicCanvas'; c.width=1024; c.height=768;
    Object.assign(c.style,{position:'fixed',inset:'0',width:'100vw',height:'100vh',zIndex:'47',pointerEvents:'none',display:'none'});
    document.body.appendChild(c); M.canvas=c; M.ctx=c.getContext('2d');
  }
  async function load(kind){
    if(M.images[kind])return M.images[kind];
    const bag={};
    await Promise.all(Object.entries(ASSETS[kind]).map(([k,src])=>new Promise(resolve=>{const im=new Image();im.onload=()=>{bag[k]=im;resolve()};im.onerror=resolve;im.src=src;})));
    M.images[kind]=bag; return bag;
  }
  function hint(text){const h=document.getElementById('hint');if(h)h.textContent=text}
  function clear(reason='timeout'){
    if(!M.active)return;
    M.active=null; M.until=0;
    if(M.canvas){M.ctx.clearRect(0,0,M.canvas.width,M.canvas.height);M.canvas.style.display='none'}
  }
  async function trigger(kind){
    if(!ASSETS[kind])return;
    ensureCanvas();
    await load(kind);
    M.active=kind; M.start=performance.now(); M.until=M.start+DURATION; M.lastDraw=0;
    M.canvas.style.display='block';
    hint(`MAGIC · ${LABEL[kind]} · 魔法出现了！`);
    if(!M.raf)M.raf=requestAnimationFrame(render);
  }
  function drawCloud(I,w,h,t){let z=.92+.08*(.5+.5*Math.sin(t*2.2));dc(M.ctx,I.wind02,w*.72,h*.34,w*.23*z,h*.36*z,(-5+12*(.5+.5*Math.sin(t*1.7)))*Math.PI/180,.82);let cy=h*(.50-.06*Math.sin(t*2)),cr=3*Math.sin(t*1.4)*Math.PI/180;dc(M.ctx,I.cloud,w*.42,cy,w*.43,h*.43,cr,1);let sx=w*(.50+.10*Math.sin(t*2.4));dc(M.ctx,I.wind01,sx,h*.61,w*.68,h*.24,0,.8);let ss=.75+.40*(.5+.5*Math.sin(t*5)),sa=.45+.55*(.5+.5*Math.sin(t*5));dc(M.ctx,I.sparkles,w*.66,h*.28,w*.20*ss,h*.20*ss,0,sa)}
  function drawFire(I,w,h,t){let hs=.94+.10*(.5+.5*Math.sin(t*1.6));dc(M.ctx,I.heat,w*.50,h*.61,w*.78*hs,h*.48*hs,4*Math.sin(t*.9)*Math.PI/180,.58);let sx=w*(.50+.035*Math.sin(t*1.2)),sy=h*(.42-.035*Math.sin(t)),ss=.92+.10*(.5+.5*Math.sin(t*1.4));dc(M.ctx,I.smoke,sx,sy,w*.62*ss,h*.42*ss,2.5*Math.sin(t*1.1)*Math.PI/180,.48);let fy=h*(.54-.06*Math.sin(t*2.2)),fs=.88+.18*(.5+.5*Math.sin(t*2.6));dc(M.ctx,I.fire,w*.47,fy,w*.52*fs,h*.42*fs,3.5*Math.sin(t*1.8)*Math.PI/180,1);let py=h*(.42-.08*Math.sin(t*1.7)),ps=.88+.22*(.5+.5*Math.sin(t*4)),pa=.55+.40*(.5+.5*Math.sin(t*5.2));dc(M.ctx,I.sparks,w*.53,py,w*.66*ps,h*.44*ps,0,pa)}
  function drawRain(I,w,h,t){let cp=(t%2.4)/2.4,rp=(t%.9)/.9;let impact=Math.max(0,1-Math.abs(rp-.84)/.14);dc(M.ctx,I.drops,w*.5+Math.sin(rp*Math.PI*2)*1.2,h*.515+rp*58,w*.88,h*.50,0,.76);dc(M.ctx,I.cloud,w*.5+Math.sin(cp*Math.PI*2)*2,h*.25+Math.sin(cp*Math.PI*2)*6,w*.70,h*.45,0,1);dc(M.ctx,I.splash,w*.5,h*.81,w*.86*(.95+.10*impact),h*.27*(.95+.10*impact),0,.38+.58*impact)}
  function drawGrow(I,w,h,t){let phase=(t%6)/6,vp=ease(phase/.48),lp=smooth((phase-.28)/.34),fp=smooth((phase-.55)/.28),b=1+.018*Math.sin(t*2.2);if(I.vine&&vp>.01){let vw=w*.58,vh=h*.78,sy=I.vine.height*(1-vp),sh=I.vine.height*vp;M.ctx.save();M.ctx.globalAlpha=.98;M.ctx.drawImage(I.vine,0,sy,I.vine.width,sh,w*.21,h*.86-vh*vp,vw,vh*vp);M.ctx.restore()}if(lp>.01){M.ctx.save();M.ctx.translate(w*.5,h*.49);M.ctx.scale(1,b);M.ctx.globalAlpha=.78*lp;M.ctx.drawImage(I.leaves,-w*.56*(.9+.1*lp)/2,-h*.66*(.9+.1*lp)/2,w*.56*(.9+.1*lp),h*.66*(.9+.1*lp));M.ctx.restore()}if(fp>.01){let bs=.70+.30*fp;dc(M.ctx,I.flower,w*.5,h*.44,w*.50*bs,h*.60*bs,0,fp*(.92+.08*Math.sin(t*3)))}}
  function render(now){
    M.raf=0;
    if(!M.active)return;
    if(now>=M.until){clear('timeout');return}

    // PERFORMANCE v8: adaptive Magic FPS.
    // Keep storytelling smooth normally; prioritize gesture response when
    // INTERACT and MediaPipe hand inference are running together.
    const handBusy =
      window.ClassroomActivityMode?.isInteract()===true &&
      window.ClassroomHandMode?.running===true;
    const magicFrameMs=handBusy?67:42; // ~15 FPS busy, ~24 FPS otherwise

    if(M.lastDraw && now-M.lastDraw<magicFrameMs){
      M.raf=requestAnimationFrame(render);
      return;
    }
    M.lastDraw=now;

    const c=M.canvas,ctx=M.ctx,w=c.width,h=c.height,t=(now-M.start)/1000;ctx.clearRect(0,0,w,h);const I=M.images[M.active]||{};

    // Portfolio desktop demo: keep every magic effect at 60% of its original
    // visual size while preserving its internal animation and screen center.
    ctx.save();
    ctx.translate(w*.5,h*.5);
    ctx.scale(.60,.60);
    ctx.translate(-w*.5,-h*.5);

    if(M.active==='cloud')drawCloud(I,w,h,t); else if(M.active==='fire')drawFire(I,w,h,t); else if(M.active==='rain')drawRain(I,w,h,t); else drawGrow(I,w,h,t);

    ctx.restore();
    M.raf=requestAnimationFrame(render);
  }
  // Magic belongs to one narrative beat. Clear it whenever either the scene
  // OR the STORY / INTERACT activity mode changes.
  // PERFORMANCE: pause magic animation when the page is hidden.
  document.addEventListener("visibilitychange",()=>{
    if(document.hidden){
      if(M.raf){cancelAnimationFrame(M.raf);M.raf=0;}
    }else if(M.active && performance.now()<M.until && !M.raf){
      M.lastDraw=0;
      M.raf=requestAnimationFrame(render);
    }
  });

  function sceneKey(){
    return [
      window.citySelectedScene??'city',
      window.ClassroomActivityMode?.scene??'city',
      window.ClassroomActivityMode?.mode??'story'
    ].join('|');
  }
  function watchScene(){
    const k=sceneKey();
    if(M.lastScene===null){
      M.lastScene=k;
    }else if(k!==M.lastScene){
      M.lastScene=k;
      clear('scene-or-mode-change');
    }
    setTimeout(watchScene,150);
  }

  window.ClassroomMagic={trigger,clear,get active(){return M.active},duration:DURATION};
  AFRAME.registerComponent('magic-target',{schema:{kind:{type:'string'}},init:function(){let latched=false;this.el.addEventListener('targetFound',()=>{if(latched)return;latched=true;trigger(this.data.kind)});this.el.addEventListener('targetLost',()=>{latched=false})}});
  document.addEventListener('DOMContentLoaded',()=>{ensureCanvas();watchScene()});
})();
