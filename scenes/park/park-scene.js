/*
 * Park Scene Module v1
 * Extracted from the current stable DIY Park implementation.
 * Supports standalone and integrated use.
 */
window.ParkSceneModule=window.ParkSceneModule||{
  config:{
    assetBase:"../../assets/park/",
    targetIndex:0,
    mirrorAR:true,
    mirrorHand:true,
    handFps:15,
    sleepMs:3000,
    integrated:false,
    sceneSelector:"a-scene",
    onActivate:null,
    onLeave:null
  },

  configure(options={}){
    Object.assign(this.config,options);
    if(!this.config.assetBase.endsWith("/"))this.config.assetBase+="/";
    return this;
  },

  asset(name){return this.config.assetBase+name},

  activateHost(){
    if(typeof this.config.onActivate==="function")this.config.onActivate("park");
  },

  leaveHost(){
    if(typeof this.config.onLeave==="function")this.config.onLeave("park");
    else this.resetStandalone();
  },

  ensureUI(){
    const body=document.body;
    const make=(html)=>{
      const w=document.createElement("div");w.innerHTML=html.trim();
      const el=w.firstElementChild;body.appendChild(el);return el;
    };

    if(!document.getElementById("handBtn")){
      const b=make('<button id="handBtn" type="button">✨ INTERACT · OFF</button>');
      b.style.cssText="position:fixed;right:18px;top:18px;z-index:130;border:0;border-radius:999px;padding:10px 14px;background:rgba(255,248,220,.96);color:#56713b;font:800 13px/1 system-ui;box-shadow:0 5px 18px rgba(0,0,0,.16);cursor:pointer;display:none";
    }
    if(!document.getElementById("handStatus")){
      const d=make('<div id="handStatus">手势：已关闭</div>');
      d.style.cssText="position:fixed;right:18px;top:62px;z-index:130;display:none;padding:8px 12px;border-radius:999px;background:rgba(255,255,255,.90);color:#333;font:700 12px/1.2 system-ui;box-shadow:0 4px 16px rgba(0,0,0,.16)";
    }
    if(!document.getElementById("handCursor")){
      const d=make('<div id="handCursor">✨</div>');
      d.style.cssText="position:fixed;z-index:140;width:68px;height:68px;margin:-34px 0 0 -34px;border-radius:50%;display:none;place-items:center;pointer-events:none;font-size:34px;background:rgba(255,255,255,.90);box-shadow:0 6px 26px rgba(0,0,0,.26)";
    }

    if(!document.getElementById("parkStoryLayer")){
      make('<div id="parkStoryLayer"><div id="parkStoryCard"><img src="../../assets/city/park_scene.png" alt=""></div></div>');
      make('<button id="fixParkBtn" type="button">🌳 一起整理公园吧</button>');
      make('<button id="doneParkBtn" type="button">✅ 整理好啦</button>');

      const layer=make('<div id="dragLayer"></div>');
      layer.innerHTML=`
        <button id="dragTree" class="drag-hit" aria-label="Tree"></button>
        <button id="dragFlower" class="drag-hit" aria-label="Flower"></button>
        <button id="dragBench" class="drag-hit" aria-label="Bench"></button>
        <button id="dragFountain" class="drag-hit" aria-label="Fountain"></button>
        <button id="dragReset" class="drag-hit" aria-label="Reset">再试一次</button>
      `;
      const c=make('<canvas id="parkCanvas" class="off" width="768" height="512"></canvas>');
      c.style.display="none";
    }
  },

  ensureAREntities(){
    const scene=document.querySelector(this.config.sceneSelector);
    if(!scene)throw new Error("ParkSceneModule: a-scene not found");

    if(!document.getElementById("parkWorld")){
      const world=document.createElement("a-entity");
      world.id="parkWorld";world.setAttribute("visible","false");

      const plane=document.createElement("a-plane");
      plane.id="parkDisplay";
      plane.setAttribute("width","2.15");
      plane.setAttribute("height","1.43");
      plane.setAttribute("position","0 0.03 0.02");
      plane.setAttribute("material","shader:flat;src:#parkCanvas;transparent:true;alphaTest:0.01;depthWrite:false;side:double");
      plane.setAttribute("park-canvas","");
      world.appendChild(plane);
      scene.appendChild(world);
    }

    if(!document.querySelector("[park-drag-controller]")){
      const target=document.createElement("a-entity");
      target.setAttribute("mindar-image-target",`targetIndex:${this.config.targetIndex}`);
      target.setAttribute("park-drag-controller","world:#parkWorld");
      scene.appendChild(target);
    }
  },

  bindUI(){
    const fix=document.getElementById("fixParkBtn");
    const done=document.getElementById("doneParkBtn");
    const hand=document.getElementById("handBtn");

    if(fix&&!fix.dataset.parkBound){
      fix.dataset.parkBound="1";
      fix.addEventListener("click",()=>window.StandaloneParkMode.enterFix());
    }
    if(done&&!done.dataset.parkBound){
      done.dataset.parkBound="1";
      done.addEventListener("click",()=>window.StandaloneParkMode.finishFix());
    }
    if(!this.config.integrated&&hand&&!hand.dataset.parkBound){
      hand.dataset.parkBound="1";
      hand.addEventListener("click",()=>window.StandaloneHandMode.toggle());
    }

    if(window.CityInput&&!window.CityInput.__parkSleepBound){
      window.CityInput.__parkSleepBound=true;
      window.CityInput.register("hand-auto-sleep",{
        down:(input)=>{if(input.source==="hand")window.StandaloneHandMode.noteInteraction()},
        up:(input)=>{if(input.source==="hand")window.StandaloneHandMode.noteInteraction()}
      });
    }
  },

  install(options={}){
    this.configure(options);
    this.ensureUI();
    this.ensureAREntities();
    this.bindUI();
    if(window.StandaloneHandMode)window.StandaloneHandMode.sleepMs=this.config.sleepMs;
  },

  resetStandalone(){
    window.StandaloneHandMode?.sleep();
    document.body.classList.remove("park-story");
    ["parkStoryLayer","fixParkBtn","doneParkBtn","dragLayer","handBtn","handStatus"].forEach(id=>{
      const el=document.getElementById(id);if(el)el.style.display="none";
    });
    const ctrl=document.querySelector("[park-drag-controller]")?.components?.["park-drag-controller"];
    if(ctrl){ctrl.tracking=false;ctrl.holding=false;ctrl.dragState=null;ctrl.hideHits?.()}
    const world=document.getElementById("parkWorld");if(world)world.object3D.visible=false;
    const hint=document.getElementById("hint");if(hint)hint.textContent="请把镜头对准 PARK 卡";
  }
};


function roundRect(ctx,x,y,w,h,r){
  ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);
  ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();
}

window.ParkCameraOrientation={
  angle:0,
  init(){
    const select=document.getElementById("cameraOrientationSelect");
    this.angle=Number(localStorage.getItem("parkCameraAngle")||0);
    if(select){
      select.value=String(this.angle);
      select.addEventListener("change",()=>{
        this.angle=Number(select.value)||0;
        localStorage.setItem("parkCameraAngle",String(this.angle));
        this.apply();
      });
    }
    this.apply();
  },
  apply(){
    const video=document.querySelector("video");
    if(!video){setTimeout(()=>this.apply(),120);return}
    const a=this.angle;
    video.style.transformOrigin="50% 50%";
    video.style.transform=`rotate(${a}deg) scaleX(-1)`;
    if(a===90||a===270){
      const scale=Math.max(innerWidth/innerHeight,innerHeight/innerWidth);
      video.style.transform=`rotate(${a}deg) scale(${scale}) scaleX(-1)`;
    }
  },
  mapPoint(x,y,width,height){
    const a=this.angle;
    if(a===90)return{x:width-(y/height)*width,y:(x/width)*height};
    if(a===180)return{x:width-x,y:height-y};
    if(a===270)return{x:(y/height)*width,y:height-(x/width)*height};
    return{x,y};
  }
};


window.StandaloneParkMode={
  mode:"story",
  showStory(keepTracking=false){
    this.mode="story";
    document.body.classList.add("park-story");
    window.StandaloneHandMode?.sleep();
    document.getElementById("parkStoryLayer").style.display="block";
    document.getElementById("fixParkBtn").style.display="block";
    document.getElementById("doneParkBtn").style.display="none";
    document.getElementById("dragLayer").style.display="none";

    const c=document.querySelector('[park-drag-controller]')?.components?.["park-drag-controller"];
    if(c){
      // When called from targetFound, keep tracking alive long enough to capture
      // the Park card pose for the later interactive handoff.
      if(!keepTracking)c.tracking=false;
      c.holding=false;
      c.dragState=null;
      c.hideHits();
    }

    const w=document.getElementById("parkWorld");
    if(w)w.object3D.visible=false;

    document.getElementById("hint").textContent="PARK · 先用玩偶讲讲公园里发生了什么吧 🌳";
  },
  enterFix(){
    this.mode="fix";
    document.body.classList.remove("park-story");
    document.getElementById("parkStoryLayer").style.display="none";
    document.getElementById("fixParkBtn").style.display="none";
    document.getElementById("doneParkBtn").style.display="block";
    document.getElementById("dragLayer").style.display="block";
    const c=document.querySelector('[park-drag-controller]')?.components?.["park-drag-controller"];
    const w=document.getElementById("parkWorld");
    if(c&&w){
      const o=w.object3D;o.position.copy(c.basePos);o.quaternion.identity();o.scale.copy(c.baseScale);o.visible=true;o.updateMatrixWorld(true);
      c.tracking=false;c.holding=true;c.holdStart=performance.now();c.showHits();c.updateHitPositions();

      const canvasComp=document.getElementById("parkDisplay")?.components?.["park-canvas"];
      if(canvasComp)canvasComp._lastDraw=0;
    }
    document.getElementById("hint").textContent="PARK · 把乱掉的东西拖回合适的位置吧！🌳";
  },
  finishFix(){
    window.StandaloneHandMode?.sleep();
    const c=document.querySelector('[park-drag-controller]')?.components?.["park-drag-controller"];
    if(c){c.tracking=false;c.holding=false;c.dragState=null;c.hideHits()}
    const w=document.getElementById("parkWorld");if(w)w.object3D.visible=false;
    this.showStory();
    document.getElementById("hint").textContent="PARK · 公园整理好啦，太棒了 🌿";
  }
};

window.StandaloneHandMode={
  running:false,
  sleeping:false,
  timer:null,
  sleepMs:3000,
  clearTimer(){if(this.timer){clearTimeout(this.timer);this.timer=null}},
  noteInteraction(){
    if(!this.running)return;
    this.clearTimer();
    this.timer=setTimeout(()=>this.sleep(),this.sleepMs);
  },
  async start(){
    if(this.running)return;
    const status=document.getElementById("handStatus");
    const cursor=document.getElementById("handCursor");
    const video=document.querySelector("video");
    if(!video||!window.ClassroomHandTracking)return;

    if(status){status.style.display="block";status.textContent="手势：启动中…";}
    await window.ClassroomHandTracking.start({
      video,cursor,mirror:window.ParkSceneModule.config.mirrorHand,maxFps:window.ParkSceneModule.config.handFps,smoothing:.38,
      pinchDownRatio:.34,pinchUpRatio:.44,reuseExistingVideo:true,
      viewport:()=>({width:innerWidth,height:innerHeight}),
      onStatus:(msg)=>{if(status)status.textContent="手势："+msg},
      onArmedChange:(armed)=>{if(status)status.textContent=armed?"手势：PARK":"放下识别卡，张开手 ✋"},
      onMetrics:(data)=>{
        if(!status)return;
        if(!data.handVisible)status.textContent="手势：请伸出一只手";
        else if(data.armed===false)status.textContent="放下识别卡，张开手 ✋";
        else if(data.pinching)status.textContent="手势：抓住";
        else status.textContent="手势：PARK";
      }
    });
    this.running=true;this.sleeping=false;this.noteInteraction();
    window.ClassroomHandTracking.requireReleaseToArm(300);
    document.getElementById("handBtn").textContent="✨ INTERACT · ON";
  },
  sleep(){
    if(!this.running)return;
    this.clearTimer();
    window.ClassroomHandTracking?.stop({keepVideo:true,keepModel:true});
    this.running=false;this.sleeping=true;
    const c=document.getElementById("handCursor"),s=document.getElementById("handStatus");
    if(c)c.style.display="none";
    if(s){s.style.display="block";s.textContent="手势：已关闭 · 再点 INTERACT 唤醒";}
    document.getElementById("handBtn").textContent="✨ INTERACT · OFF";
  },
  toggle(){this.running?this.sleep():this.start()}
};
