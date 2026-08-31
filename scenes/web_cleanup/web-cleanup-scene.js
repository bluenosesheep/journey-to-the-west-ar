/*
 * Magic 07 · Web Cleanup v1
 * Standalone:
 *   ../../targets/web_cleanup.mind
 *   targetIndex:0
 *   ../../assets/web_cleanup/
 *
 * Reuses project CityInput + ClassroomHandTracking.
 * Mouse/touch and hand pinch share the same drag state.
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
      const c=add('<canvas id="webCanvas" width="768" height="768"></canvas>');
      c.style.display="none";
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
    StandaloneWebHandMode.sleep();
    WebCleanupMode.mode="waiting";
    const c=document.querySelector("[web-cleanup-controller]")?.components?.["web-cleanup-controller"];
    c?.hideWorld();
    ["webStartBtn","webRetryBtn","webLeaveBtn","webProgress","handBtn","handStatus"].forEach(id=>{
      const e=document.getElementById(id);if(e)e.style.display="none";
    });
    const h=document.getElementById("hint");if(h)h.textContent="请把镜头对准 MAGIC 07 卡";
  }
};

window.WebCleanupMode={
  mode:"waiting",
  setHint(t){const e=document.getElementById("hint");if(e)e.textContent=t},
  comp(){return document.getElementById("webDisplay")?.components?.["web-cleanup-canvas"]},
  showStory(){
    this.mode="story";StandaloneWebHandMode.sleep();
    this.comp()?.showStory();
    const start=document.getElementById("webStartBtn"),p=document.getElementById("webProgress");
    if(start)start.style.display="block";
    if(p){p.style.display="block";p.textContent="大蜘蛛虽然走了，城市里还挂满了蜘蛛网……";}
    ["webRetryBtn","webLeaveBtn","handBtn","handStatus"].forEach(id=>{const e=document.getElementById(id);if(e)e.style.display="none"});
    this.setHint("MAGIC 07 · 帮师徒四人清理蜘蛛网");
  },
  enterGame(){
    if(this.mode!=="story"&&this.mode!=="complete")return;
    this.mode="game";
    this.comp()?.startGame();
    const start=document.getElementById("webStartBtn"),hand=document.getElementById("handBtn");
    if(start)start.style.display="none";
    if(hand){hand.style.display="block";hand.textContent="✨ INTERACT · OFF"}
    ["webRetryBtn","webLeaveBtn"].forEach(id=>{const e=document.getElementById(id);if(e)e.style.display="none"});
    this.updateProgress(0,5);
    this.setHint("捏住蜘蛛网，把它们放进篮子里 🧺");
  },
  updateProgress(done,total){
    const p=document.getElementById("webProgress");
    if(p){p.style.display="block";p.textContent=`🕸️ 已清理 ${done} / ${total}`}
  },
  complete(){
    if(this.mode==="complete")return;
    this.mode="complete";StandaloneWebHandMode.sleep();
    this.comp()?.complete();
    const p=document.getElementById("webProgress");if(p)p.textContent="✨ 城市干净啦！";
    const hb=document.getElementById("handBtn"),hs=document.getElementById("handStatus");
    if(hb)hb.style.display="none";if(hs)hs.style.display="none";
    setTimeout(()=>{
      const r=document.getElementById("webRetryBtn"),l=document.getElementById("webLeaveBtn");
      if(r)r.style.display="block";if(l)l.style.display="block";
    },550);
    this.setHint("✨ 蜘蛛网全部收好啦！");
  },
  retry(){
    StandaloneWebHandMode.sleep();this.mode="story";this.comp()?.reset();this.showStory();
  },
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
      onMetrics:d=>{if(status)status.textContent=d.handVisible?"手势：捏住蜘蛛网拖进篮子":"手势：请伸出一只手"}
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
    // Deliberately spread across a large play area, away from the basket.
    const seeds=[
      [145,170,.84,-.25],[382,145,.72,.18],[620,190,.82,-.12],
      [190,420,.76,.13],[500,390,.88,-.20]
    ];
    this.webs=seeds.map((v,i)=>({
      id:i,x:v[0],y:v[1],homeX:v[0],homeY:v[1],scale:v[2],rot:v[3],
      collected:false,dragging:false,dropScale:1,phase:i*1.37
    }));
  },
  complete(){this.mode="complete";this.sparkleAt=performance.now()},
  image(n){return this.images[n]},
  drawImg(img,x,y,w,h,a=1,rot=0,scale=1){
    if(!img?.complete||!img.naturalWidth)return;
    const c=this.ctx;c.save();c.globalAlpha=a;c.translate(x,y);c.rotate(rot);c.scale(scale,scale);
    c.drawImage(img,-w/2,-h/2,w,h);c.restore();
  },
  basketRect(){return{x:548,y:500,w:185,h:185,rimY:455,deepY:525}},
  getWeb(id){return this.webs.find(w=>w.id===id)},
  setWebPos(id,x,y){const w=this.getWeb(id);if(w&&!w.collected){w.x=x;w.y=y}},
  setDragging(id,v){const w=this.getWeb(id);if(w)w.dragging=v},
  tryDrop(id){
    const w=this.getWeb(id);if(!w||w.collected)return false;
    const b=this.basketRect();
    // forgiving basket mouth
    const inMouth=w.x>b.x-b.w*.58&&w.x<b.x+b.w*.58&&w.y>b.rimY-45&&w.y<b.deepY+42;
    if(!inMouth)return false;
    w.collected=true;w.dragging=false;this.done++;
    WebCleanupMode.updateProgress(this.done,this.webs.length);
    if(this.done===this.webs.length)setTimeout(()=>WebCleanupMode.complete(),260);
    return true;
  },
  draw(now){
    const c=this.ctx;c.clearRect(0,0,768,768);
    const t=now/1000;
    if(this.mode==="story"){
      const sway=Math.sin(t*1.7)*.025,bob=Math.sin(t*1.3)*5,pulse=1+Math.sin(t*2.1)*.018;
      this.drawImg(this.image("web_large.png"),384,360+bob,600,430,1,sway,pulse);
      return;
    }
    if(this.mode==="game"||this.mode==="complete"){
      const b=this.basketRect();

      // Draw non-dragged webs first.
      this.webs.forEach(w=>{
        if(w.collected||w.dragging)return;
        const bob=Math.sin(t*1.8+w.phase)*4;
        this.drawImg(this.image("web_small.png"),w.x,w.y+bob,145*w.scale,145*w.scale,1,w.rot+Math.sin(t+w.phase)*.025,1);
      });

      // Basket is above ordinary webs so objects entering it look partially occluded.
      this.drawImg(this.image("web_basket.png"),b.x,b.y,220,220,1,0,1);

      // Dragged web: shrink as it approaches/enters the mouth.
      this.webs.forEach(w=>{
        if(w.collected||!w.dragging)return;
        const dx=(w.x-b.x)/(b.w*.65),dy=(w.y-b.rimY)/115;
        const near=Math.max(0,1-Math.min(1,Math.sqrt(dx*dx+dy*dy)));
        const sc=1-near*.52;
        this.drawImg(this.image("web_small.png"),w.x,w.y,145*w.scale,145*w.scale,1,w.rot,sc);
      });

      if(this.mode==="complete"){
        const e=now-this.sparkleAt;
        const alpha=e<1400?Math.max(.2,1-e/1800):.22;
        const sc=1+Math.sin(t*4)*.05;
        this.drawImg(this.image("web_clean_sparkle.png"),384,340,430,430,alpha,0,sc);
      }
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
    this.world=this.data.world;this.tracking=false;this.holding=false;this.hist=[];this.drag=null;
    this.basePos=new THREE.Vector3();this.baseScale=new THREE.Vector3(1,1,1);
    if(this.world)this.world.object3D.visible=false;

    if(window.CityInput)CityInput.register("web-cleanup-drag",{
      down:i=>this.onDown(i),move:i=>this.onMove(i),up:i=>this.onUp(i)
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
  canvasComp(){return document.getElementById("webDisplay")?.components?.["web-cleanup-canvas"]},
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
  nearestWeb(c){
    const comp=this.canvasComp();if(!comp)return null;
    let best=null,bd=1e9;
    comp.webs.forEach(w=>{
      if(w.collected)return;
      const d=Math.hypot(c.x-w.x,c.y-w.y);
      const radius=72*w.scale;
      if(d<radius&&d<bd){best=w;bd=d}
    });
    return best;
  },
  onDown(i){
    if(WebCleanupMode.mode!=="game")return;
    const c=this.screenToCanvas(i.x,i.y);if(!c)return;
    const w=this.nearestWeb(c);if(!w)return;
    this.drag={id:w.id,offX:c.x-w.x,offY:c.y-w.y,source:i.source||"pointer"};
    this.canvasComp()?.setDragging(w.id,true);
    if(i.source==="hand")StandaloneWebHandMode.note();
    i.nativeEvent?.preventDefault?.();
  },
  onMove(i){
    if(!this.drag||WebCleanupMode.mode!=="game")return;
    const c=this.screenToCanvas(i.x,i.y);if(!c)return;
    const x=Math.max(70,Math.min(698,c.x-this.drag.offX));
    const y=Math.max(70,Math.min(690,c.y-this.drag.offY));
    this.canvasComp()?.setWebPos(this.drag.id,x,y);
    if(i.source==="hand")StandaloneWebHandMode.note();
    i.nativeEvent?.preventDefault?.();
  },
  onUp(i){
    if(!this.drag)return;
    const id=this.drag.id;this.drag=null;
    const comp=this.canvasComp();comp?.setDragging(id,false);
    if(!comp?.tryDrop(id)){
      const w=comp?.getWeb(id);
      if(w){w.x=w.x;w.y=w.y} // stays where released; encourages free play
    }
    if(i.source==="hand")StandaloneWebHandMode.note();
    i.nativeEvent?.preventDefault?.();
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
  hideWorld(){
    this.tracking=false;this.holding=false;this.drag=null;
    if(this.world)this.world.object3D.visible=false;
  },
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
