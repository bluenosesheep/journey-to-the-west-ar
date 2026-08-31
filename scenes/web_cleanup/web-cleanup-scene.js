/*
 * Magic 07 · Web Cleanup v2
 * Market-style interaction: point at a web + pinch once -> web automatically flies into basket.
 * No dragging.
 */
window.WebCleanupSceneModule={
  config:{
    assetBase:"../../assets/web_cleanup/",
    mirrorAR:true,mirrorHand:true,handFps:15,sleepMs:3000,integrated:false,
    onActivate:null,onLeave:null
  },
  configure(o={}){
    Object.assign(this.config,o);
    if(!this.config.assetBase.endsWith("/"))this.config.assetBase+="/";
    return this;
  },
  asset(n){return this.config.assetBase+n},
  ensureUI(){
    const add=(html)=>{
      const w=document.createElement("div");w.innerHTML=html.trim();
      const e=w.firstElementChild;document.body.appendChild(e);return e;
    };
    if(!document.getElementById("webStartBtn"))add('<button id="webStartBtn">🧹 开始清理</button>');
    if(!document.getElementById("webRetryBtn"))add('<button id="webRetryBtn">↻ 再试一次</button>');
    if(!document.getElementById("webLeaveBtn"))add('<button id="webLeaveBtn">✅ 离开</button>');
    if(!document.getElementById("webProgress"))add('<div id="webProgress">蜘蛛网到处都是……</div>');
    if(!document.getElementById("webCanvas")){
      const c=add('<canvas id="webCanvas" width="768" height="768"></canvas>');c.style.display="none";
    }
    if(!document.getElementById("handBtn"))add('<button id="handBtn" class="web-shared">✨ INTERACT · OFF</button>');
    if(!document.getElementById("handStatus"))add('<div id="handStatus" class="web-shared">手势：已关闭</div>');
    if(!document.getElementById("handCursor"))add('<div id="handCursor" class="web-shared">✨</div>');
  },
  bindUI(){
    const once=(id,fn)=>{
      const e=document.getElementById(id);if(!e||e.dataset.webBound)return;
      e.dataset.webBound="1";e.addEventListener("click",fn);
    };
    once("webStartBtn",()=>WebCleanupMode.enterGame());
    once("webRetryBtn",()=>WebCleanupMode.retry());
    once("webLeaveBtn",()=>WebCleanupMode.leave());
    if(!this.config.integrated)once("handBtn",()=>StandaloneWebHandMode.toggle());
  },
  install(o={}){
    this.configure(o);this.ensureUI();this.bindUI();
    StandaloneWebHandMode.sleepMs=this.config.sleepMs;
  },
  leave(){
    if(typeof this.config.onLeave==="function")return this.config.onLeave("web_cleanup");
    StandaloneWebHandMode.sleep();WebCleanupMode.mode="waiting";
    document.querySelector("[web-cleanup-controller]")?.components?.["web-cleanup-controller"]?.hideWorld();
    ["webStartBtn","webRetryBtn","webLeaveBtn","webProgress","handBtn","handStatus"].forEach(id=>{
      const e=document.getElementById(id);if(e)e.style.display="none";
    });
    const h=document.getElementById("hint");if(h)h.textContent="请把镜头对准 MAGIC 07 卡";
  }
};

window.WebCleanupMode={
  mode:"waiting",
  comp(){return document.getElementById("webDisplay")?.components?.["web-cleanup-canvas"]},
  hint(t){const e=document.getElementById("hint");if(e)e.textContent=t},
  showStory(){
    this.mode="story";StandaloneWebHandMode.sleep();this.comp()?.showStory();
    const b=document.getElementById("webStartBtn"),p=document.getElementById("webProgress");
    if(b)b.style.display="block";
    if(p){p.style.display="block";p.textContent="大蜘蛛走了，可城市里还挂满了蜘蛛网……"}
    ["webRetryBtn","webLeaveBtn","handBtn","handStatus"].forEach(id=>{const e=document.getElementById(id);if(e)e.style.display="none"});
    this.hint("MAGIC 07 · 帮师徒四人把蜘蛛网收干净");
  },
  enterGame(){
    if(this.mode!=="story"&&this.mode!=="complete")return;
    this.mode="game";this.comp()?.startGame();
    const b=document.getElementById("webStartBtn"),h=document.getElementById("handBtn");
    if(b)b.style.display="none";
    if(h){h.style.display="block";h.textContent="✨ INTERACT · OFF"}
    ["webRetryBtn","webLeaveBtn"].forEach(id=>{const e=document.getElementById(id);if(e)e.style.display="none"});
    this.progress(0,5);this.hint("把光标对准蜘蛛网，捏一下就能收走它 ✨");
  },
  progress(n,total){
    const p=document.getElementById("webProgress");
    if(p){p.style.display="block";p.textContent=`🕸️ 已清理 ${n} / ${total}`}
  },
  complete(){
    if(this.mode==="complete")return;
    this.mode="complete";StandaloneWebHandMode.sleep();this.comp()?.complete();
    const p=document.getElementById("webProgress");if(p)p.textContent="✨ 城市干净啦！";
    const hb=document.getElementById("handBtn"),hs=document.getElementById("handStatus");
    if(hb)hb.style.display="none";if(hs)hs.style.display="none";
    setTimeout(()=>{
      const r=document.getElementById("webRetryBtn"),l=document.getElementById("webLeaveBtn");
      if(r)r.style.display="block";if(l)l.style.display="block";
    },650);
    this.hint("✨ 蜘蛛网全部收进篮子啦！");
  },
  retry(){StandaloneWebHandMode.sleep();this.mode="story";this.comp()?.reset();this.showStory()},
  leave(){StandaloneWebHandMode.sleep();WebCleanupSceneModule.leave()}
};

window.StandaloneWebHandMode={
  running:false,timer:null,sleepMs:3000,
  clear(){if(this.timer){clearTimeout(this.timer);this.timer=null}},
  note(){if(!this.running)return;this.clear();this.timer=setTimeout(()=>this.sleep(),this.sleepMs)},
  async start(){
    if(this.running||WebCleanupMode.mode!=="game"||!window.ClassroomHandTracking)return;
    const video=document.querySelector("video"),cursor=document.getElementById("handCursor"),status=document.getElementById("handStatus");
    if(!video)return;
    if(status){status.style.display="block";status.textContent="手势：启动中…"}
    await ClassroomHandTracking.start({
      video,cursor,mirror:WebCleanupSceneModule.config.mirrorHand,
      maxFps:WebCleanupSceneModule.config.handFps,smoothing:.38,reuseExistingVideo:true,
      viewport:()=>({width:innerWidth,height:innerHeight}),
      onStatus:m=>{if(status)status.textContent="手势："+m},
      onMetrics:d=>{if(status)status.textContent=d.handVisible?"手势：对准蜘蛛网，捏一下":"手势：请伸出一只手"}
    });
    this.running=true;this.note();
    const b=document.getElementById("handBtn");if(b)b.textContent="✨ INTERACT · ON";
  },
  sleep(){
    this.clear();
    if(this.running)ClassroomHandTracking?.stop({keepVideo:true,keepModel:true});
    this.running=false;
    const c=document.getElementById("handCursor"),s=document.getElementById("handStatus"),b=document.getElementById("handBtn");
    if(c)c.style.display="none";
    if(WebCleanupMode.mode==="game"){
      if(s){s.style.display="block";s.textContent="手势：已关闭 · 点 INTERACT 唤醒"}
      if(b)b.textContent="✨ INTERACT · OFF";
    }else if(s)s.style.display="none";
  },
  toggle(){this.running?this.sleep():this.start()}
};

AFRAME.registerComponent("web-cleanup-canvas",{
  init(){
    this.canvas=document.getElementById("webCanvas");this.ctx=this.canvas.getContext("2d");
    this.mode="waiting";this.webs=[];this.done=0;this.sparkleAt=0;this.last=0;
    this.images={};
    ["web_large.png","web_small.png","web_basket.png","web_clean_sparkle.png"].forEach(n=>{
      const i=new Image();i.src=WebCleanupSceneModule.asset(n);this.images[n]=i;
    });
  },
  reset(){this.mode="waiting";this.webs=[];this.done=0;this.sparkleAt=0},
  showStory(){this.mode="story";this.webs=[];this.done=0},
  startGame(){
    this.mode="game";this.done=0;this.sparkleAt=0;
    const seeds=[
      [145,165,.88,-.22],[385,145,.76,.16],[620,190,.84,-.12],
      [175,420,.78,.15],[475,405,.90,-.18]
    ];
    this.webs=seeds.map((v,i)=>({
      id:i,x:v[0],y:v[1],scale:v[2],rot:v[3],phase:i*1.29,
      state:"idle",flyStart:0,fromX:0,fromY:0,flyDuration:560,
      sinkStart:0,sinkDuration:360,
      mouthX:585,mouthY:542,
      pileX:0,pileY:0,pileScale:.26,pileRot:0
    }));
  },
  image(n){return this.images[n]},
  basket(){return{x:585,y:560,w:210,h:210}},
  pileSlot(index){
    // Final positions are deliberately deeper and smaller so the webs
    // look like they have fallen to the bottom of the collection hole.
    const slots=[
      [0,28,.28,-.10],
      [-14,34,.25,.18],
      [15,31,.27,-.22],
      [-8,38,.23,.28],
      [10,41,.24,-.30]
    ];
    const s=slots[index%slots.length];
    return{x:585+s[0],y:560+s[1],scale:s[2],rot:s[3]};
  },
  getWeb(id){return this.webs.find(w=>w.id===id)},
  selectable(){return this.webs.filter(w=>w.state==="idle")},
  collect(id){
    const w=this.getWeb(id);if(!w||w.state!=="idle"||this.mode!=="game")return false;
    const slot=this.pileSlot(w.id);
    w.pileX=slot.x;w.pileY=slot.y;w.pileScale=slot.scale;w.pileRot=slot.rot;
    w.mouthX=585;w.mouthY=542;
    w.state="flying";w.flyStart=performance.now();w.fromX=w.x;w.fromY=w.y;
    return true;
  },
  complete(){this.mode="complete";this.sparkleAt=performance.now()},
  drawImg(img,x,y,w,h,a=1,rot=0,scale=1){
    if(!img?.complete||!img.naturalWidth)return;
    const c=this.ctx;c.save();c.globalAlpha=a;c.translate(x,y);c.rotate(rot);c.scale(scale,scale);
    c.drawImage(img,-w/2,-h/2,w,h);c.restore();
  },
  ease(t){return 1-Math.pow(1-t,3)},
  draw(now){
    const c=this.ctx;c.clearRect(0,0,768,768);const t=now/1000;
    if(this.mode==="story"){
      this.drawImg(this.image("web_large.png"),384,355+Math.sin(t*1.4)*5,610,440,1,Math.sin(t*1.7)*.025,1+Math.sin(t*2)*.015);
      return;
    }
    if(this.mode!=="game"&&this.mode!=="complete")return;

    const b=this.basket();

    // idle webs
    this.webs.forEach(w=>{
      if(w.state!=="idle")return;
      const bob=Math.sin(t*1.75+w.phase)*4;
      this.drawImg(this.image("web_small.png"),w.x,w.y+bob,150*w.scale,150*w.scale,1,w.rot+Math.sin(t+w.phase)*.025);
    });

    // Draw the collection hole first. Collected webs will remain visible on top,
    // building up into a little pile at the hole instead of disappearing.
    this.drawImg(this.image("web_basket.png"),b.x,b.y,b.w,b.h,1);

    // Webs already collected stay deeper inside the hole.
    // Smaller size + lower alpha makes them read as being at the bottom,
    // not floating on the rim.
    this.webs.forEach(w=>{
      if(w.state!=="piled")return;
      this.drawImg(
        this.image("web_small.png"),
        w.pileX,w.pileY,
        150*w.scale,150*w.scale,
        .72,
        w.pileRot,
        w.pileScale
      );
    });

    // Stage 1: fly to the mouth of the hole.
    this.webs.forEach(w=>{
      if(w.state!=="flying")return;
      const p=Math.min(1,(now-w.flyStart)/w.flyDuration),e=this.ease(p);
      const arc=Math.sin(Math.PI*p)*-64;
      const x=w.fromX+(w.mouthX-w.fromX)*e;
      const y=w.fromY+(w.mouthY-w.fromY)*e+arc;
      const mouthScale=.50;
      const sc=1-(1-mouthScale)*e;
      const rot=w.rot+(w.pileRot-w.rot)*e*.45+p*.20;

      this.drawImg(
        this.image("web_small.png"),
        x,y,
        150*w.scale,150*w.scale,
        1,
        rot,
        sc
      );

      if(p>=1){
        w.state="sinking";
        w.sinkStart=now;
      }
    });

    // Stage 2: after reaching the mouth, drop visibly down toward the bottom.
    this.webs.forEach(w=>{
      if(w.state!=="sinking")return;
      const p=Math.min(1,(now-w.sinkStart)/w.sinkDuration);
      // ease-in makes the last part feel like gravity pulling it downward.
      const e=p*p;
      const x=w.mouthX+(w.pileX-w.mouthX)*e;
      const y=w.mouthY+(w.pileY-w.mouthY)*e;
      const sc=.50+(.0 + w.pileScale-.50)*e;
      const alpha=1-.28*e;
      const rot=w.pileRot*.45+w.pileRot*.55*e;

      this.drawImg(
        this.image("web_small.png"),
        x,y,
        150*w.scale,150*w.scale,
        alpha,
        rot,
        sc
      );

      if(p>=1){
        w.state="piled";
        this.done++;
        WebCleanupMode.progress(this.done,this.webs.length);
        if(this.done===this.webs.length)setTimeout(()=>WebCleanupMode.complete(),260);
      }
    });

    if(this.mode==="complete"){
      const e=now-this.sparkleAt;
      const alpha=e<1500?Math.max(.22,1-e/1900):.22;
      this.drawImg(this.image("web_clean_sparkle.png"),384,350,450,450,alpha,0,1+Math.sin(t*4)*.05);
    }
  },
  tick(){
    if(this.mode==="waiting")return;
    const now=performance.now();if(this.last&&now-this.last<42)return;this.last=now;
    this.draw(now);
    const mesh=this.el.getObject3D("mesh");if(mesh?.material?.map)mesh.material.map.needsUpdate=true;
  }
});

AFRAME.registerComponent("web-cleanup-controller",{
  schema:{world:{type:"selector"}},
  init(){
    this.world=this.data.world;this.tracking=false;this.holding=false;this.hist=[];
    this.basePos=new THREE.Vector3();this.baseScale=new THREE.Vector3(1,1,1);
    if(this.world)this.world.object3D.visible=false;

    // Market-style: a click or a hand pinch DOWN selects one web. No drag/move/up logic.
    if(window.CityInput)CityInput.register("web-cleanup-pick",{
      down:i=>this.pick(i)
    });

    this.el.addEventListener("targetFound",()=>{
      if(WebCleanupMode.mode!=="waiting")return;
      if(typeof WebCleanupSceneModule.config.onActivate==="function")WebCleanupSceneModule.config.onActivate("web_cleanup");
      this.tracking=true;this.holding=false;this.hist=[];
      if(this.world)this.world.object3D.visible=true;
      WebCleanupMode.showStory();
    });
    this.el.addEventListener("targetLost",()=>this.holdLastPose());
  },
  comp(){return document.getElementById("webDisplay")?.components?.["web-cleanup-canvas"]},
  camera(){return document.querySelector("a-camera")?.getObject3D("camera")||document.querySelector("[camera]")?.getObject3D("camera")},
  project(v){
    const cam=this.camera();if(!cam)return null;const p=v.clone().project(cam);
    const raw=(p.x*.5+.5)*innerWidth;
    return{x:WebCleanupSceneModule.config.mirrorAR?innerWidth-raw:raw,y:(-p.y*.5+.5)*innerHeight};
  },
  screenToCanvas(x,y){
    if(!this.world)return null;const o=this.world.object3D;o.updateMatrixWorld(true);
    const cen=this.project(new THREE.Vector3(0,0,0).applyMatrix4(o.matrixWorld));
    const rx=this.project(new THREE.Vector3(.5,0,0).applyMatrix4(o.matrixWorld));
    const uy=this.project(new THREE.Vector3(0,.5,0).applyMatrix4(o.matrixWorld));
    if(!cen||!rx||!uy)return null;
    const sx=Math.max(1,Math.abs(rx.x-cen.x)*2),sy=Math.max(1,Math.abs(uy.y-cen.y)*2);
    const lx=(WebCleanupSceneModule.config.mirrorAR?-1:1)*(x-cen.x)/sx;
    const ly=-(y-cen.y)/sy;
    return{x:(lx/2.15+.5)*768,y:(.5-ly/2.15)*768};
  },
  nearest(c,source){
    const comp=this.comp();if(!comp)return null;
    let best=null,bd=1e9;
    comp.selectable().forEach(w=>{
      const d=Math.hypot(c.x-w.x,c.y-w.y);
      // Hand gets a slightly larger forgiving target than mouse.
      const r=(source==="hand"?92:78)*w.scale;
      if(d<r&&d<bd){best=w;bd=d}
    });
    return best;
  },
  pick(i){
    if(WebCleanupMode.mode!=="game")return;
    const c=this.screenToCanvas(i.x,i.y);if(!c)return;
    const w=this.nearest(c,i.source);if(!w)return;
    if(this.comp()?.collect(w.id)){
      if(i.source==="hand")StandaloneWebHandMode.note();
      i.nativeEvent?.preventDefault?.();
    }
  },
  holdLastPose(){
    if(WebCleanupMode.mode==="waiting")return;
    this.tracking=false;this.holding=true;
    const stable=this.hist.length?this.hist[Math.max(0,this.hist.length-6)]:null;
    if(stable){this.basePos.copy(stable.p);this.baseScale.copy(stable.s)}
    if(this.world){
      const o=this.world.object3D;o.position.copy(this.basePos);o.quaternion.identity();o.scale.copy(this.baseScale);o.visible=true;
    }
  },
  hideWorld(){this.tracking=false;this.holding=false;if(this.world)this.world.object3D.visible=false},
  tick(){
    if(!this.world||WebCleanupMode.mode==="waiting")return;
    if(this.tracking){
      this.el.object3D.updateMatrixWorld(true);
      const p=new THREE.Vector3(),q=new THREE.Quaternion(),s=new THREE.Vector3();
      this.el.object3D.matrixWorld.decompose(p,q,s);
      this.hist.push({p:p.clone(),s:s.clone(),t:performance.now()});if(this.hist.length>24)this.hist.shift();
      this.basePos.copy(p);this.baseScale.copy(s);
      const o=this.world.object3D;o.position.copy(p);o.quaternion.identity();o.scale.copy(s);o.visible=true;
    }else if(this.holding){
      const o=this.world.object3D;o.position.copy(this.basePos);o.quaternion.identity();o.scale.copy(this.baseScale);o.visible=true;
    }
  }
});
