/*
 * Market Scene Module v1
 * Source of truth: uploaded stable market_story_interactive.html.
 * Market owns its Story UI, Hand UI, DOM hit layer and Canvas.
 */
window.MarketSceneModule = window.MarketSceneModule || {
  assetBase:"../../assets/market/",
  storyImage:"../../assets/city/market_scene.png",
  integrated:false,

  configure(options={}){
    if(options.assetBase!==undefined)this.assetBase=options.assetBase;
    if(options.storyImage!==undefined)this.storyImage=options.storyImage;
    if(options.integrated!==undefined)this.integrated=!!options.integrated;
    if(!this.assetBase.endsWith("/"))this.assetBase+="/";
    return this;
  },

  asset(name){ return this.assetBase + name; },

  mountUI(options={}){
    this.configure(options);
    if(document.getElementById("marketStoryLayer"))return;

    const host=document.createElement("div");
    host.id="marketModuleUI";
    host.innerHTML=`
      <div id="marketStoryLayer">
        <div id="marketStoryCard">
          <img src="${this.storyImage}" alt="">
        </div>
      </div>

      <button id="shopBtn" type="button">🧺 买点东西吧</button>
      <button id="checkoutBtn" type="button">🧾 去结账喽</button>
      <button id="handBtn" type="button">✨ INTERACT · OFF</button>
      <div id="handStatus">手势：已关闭</div>
      <div id="handCursor">✨</div>

      <div id="cameraOrientationControl">
        <span>📷 CAMERA</span>
        <select id="cameraOrientationSelect">
          <option value="0">0°</option>
          <option value="90">90°</option>
          <option value="180">180°</option>
          <option value="270">270°</option>
        </select>
      </div>

      <div id="hint">请把镜头对准 Market 识别图</div>

      <div id="holdHitLayer">
        <button id="holdPeach" class="hold-hit" aria-label="Peach"></button>
        <button id="holdCabbage" class="hold-hit" aria-label="Cabbage"></button>
        <button id="holdEgg" class="hold-hit" aria-label="Egg"></button>
        <button id="holdReset" class="hold-hit" aria-label="Reset">再试一次</button>
      </div>

      <canvas id="marketCanvas" class="off" width="768" height="512"></canvas>
    `;
    document.body.appendChild(host);
    document.body.classList.add("market-story");
  },

  bindUI(){
    window.ClassroomCameraOrientation?.init();

    document.getElementById("shopBtn")
      ?.addEventListener("click",()=>window.StandaloneMarketMode.enterShop());

    document.getElementById("checkoutBtn")
      ?.addEventListener("click",()=>window.StandaloneMarketMode.checkout());

    if(!this.integrated){
      document.getElementById("handBtn")
        ?.addEventListener("click",()=>window.StandaloneMarketHandMode.toggle());
    }

    if(window.CityInput && !window.CityInput.__marketHandSleepBound){
      window.CityInput.__marketHandSleepBound=true;
      window.CityInput.register("market-hand-auto-sleep",{
        down:(input)=>{
          if(input.source==="hand")window.StandaloneMarketHandMode.noteInteraction();
        },
        up:(input)=>{
          if(input.source==="hand")window.StandaloneMarketHandMode.noteInteraction();
        }
      });
    }
  },

  install(options={}){
    this.mountUI(options);
    this.bindUI();
  }
};


function roundRect(ctx,x,y,w,h,r){
  ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);
  ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);
  ctx.arcTo(x,y,x+w,y,r);ctx.closePath();
}


AFRAME.registerComponent("market-persist",{
  schema:{
    seconds:{type:"number",default:15},
    world:{type:"selector"}
  },

  init:function(){
    this.world=this.data.world;
    this.tracking=false;
    this.timer=null;
    this.camera=null;

    this.lastMatrix=new THREE.Matrix4();
    this.holding=false;
    this.holdStart=0;
    this.basePos=new THREE.Vector3();
    this.baseQuat=new THREE.Quaternion();
    this.baseScale=new THREE.Vector3(1,1,1);

    // Keep a short history of stable tracked poses.
    // When the card is moved away, MindAR can briefly report a distorted pose.
    // We freeze from an earlier stable sample instead of the very last frame.
    this.poseHistory=[];
    this.maxPoseHistory=24;

    this.hits={
      peach:document.getElementById("holdPeach"),
      cabbage:document.getElementById("holdCabbage"),
      egg:document.getElementById("holdEgg"),
      reset:document.getElementById("holdReset"),
      checkout:document.getElementById("checkoutBtn")
    };

    this.localPoints={
      peach:new THREE.Vector3(-0.38,0.35,0.10),
      cabbage:new THREE.Vector3(0,0.38,0.10),
      egg:new THREE.Vector3(0.38,0.35,0.10),
      reset:new THREE.Vector3(0,-0.62,0.14)
    };

    this.localSizes={
      peach:[0.58,0.58],
      cabbage:[0.58,0.58],
      egg:[0.58,0.58],
      reset:[0.74,0.30]
    };

    const comp=()=>document.getElementById("marketDisplay")?.components?.["market-canvas"];

    window.CityInput.register("market-standalone",{
      down:(input)=>this.handleInputDown(input)
    });

    if(this.world){
      this.world.object3D.visible=false;
    }

    this.el.addEventListener("targetFound",()=>{
      this.tracking=true;
      this.holding=false;
      this.poseHistory=[];
      this.hideHoldHits();

      if(this.timer){
        clearTimeout(this.timer);
        this.timer=null;
      }

      if(window.StandaloneMarketMode?.mode==="story"){
        if(this.world)this.world.object3D.visible=false;
        window.StandaloneMarketMode.showStory();
      }else if(this.world){
        this.world.object3D.visible=true;
      }
    });

    this.el.addEventListener("targetLost",()=>{
      this.tracking=false;
      this.holding=true;
      this.holdStart=performance.now();

      if(this.world){
        const obj=this.world.object3D;

        // Use a pose from roughly 250-350ms BEFORE targetLost.
        // That avoids freezing the bad skew/tilt that often happens while the card is being pulled away.
        let stablePose=null;
        const now=performance.now();
        for(let i=this.poseHistory.length-1;i>=0;i--){
          const age=now-this.poseHistory[i].time;
          if(age>=280){
            stablePose=this.poseHistory[i];
            break;
          }
        }

        // Fallback to the oldest available recent pose, then finally current pose.
        if(!stablePose && this.poseHistory.length){
          stablePose=this.poseHistory[0];
        }

        if(stablePose){
          this.basePos.copy(stablePose.pos);
          this.baseQuat.copy(stablePose.quat);
          this.baseScale.copy(stablePose.scale);

          obj.position.copy(this.basePos);
          obj.quaternion.copy(this.baseQuat);
          obj.scale.copy(this.baseScale);
          obj.updateMatrixWorld(true);
        }else{
          this.basePos.copy(obj.position);
          this.baseQuat.copy(obj.quaternion);
          this.baseScale.copy(obj.scale);
        }

        obj.visible=true;
      }

      // A-Frame raycaster is unreliable after targetLost on some mobile browsers.
      // Switch interaction to DOM hit zones and keep them synced to the idle motion.
      if(window.StandaloneMarketMode?.mode==="story"){
        this.holding=false;this.hideHoldHits();
        if(this.world)this.world.object3D.visible=false;
        document.getElementById("hint").textContent="继续讲故事吧 🧺";
      }else{
        this.updateHoldHits();this.showHoldHits();
      }

      if(this.timer){clearTimeout(this.timer);this.timer=null;}
    });
  },

  hitKindAt:function(x,y,source){
    const checkoutEl=this.hits.checkout;
    if(
      checkoutEl &&
      checkoutEl.style.display!=="none"
    ){
      const r=checkoutEl.getBoundingClientRect();
      const pad=source==="hand"?12:4;
      if(
        x>=r.left-pad && x<=r.right+pad &&
        y>=r.top-pad && y<=r.bottom+pad
      ){
        return "checkout";
      }
    }

    const resetEl=this.hits.reset;
    if(resetEl && resetEl.style.display!=="none"){
      const r=resetEl.getBoundingClientRect();
      const pad=source==="hand"?10:4;
      if(x>=r.left-pad&&x<=r.right+pad&&y>=r.top-pad&&y<=r.bottom+pad){
        return "reset";
      }
    }

    for(const [kind,el] of Object.entries(this.hits)){
      if(kind==="reset"||kind==="checkout"||!el||el.style.display==="none")continue;
      const r=el.getBoundingClientRect();
      const pad=source==="hand"?8:0;
      if(x>=r.left-pad&&x<=r.right+pad&&y>=r.top-pad&&y<=r.bottom+pad){
        return kind;
      }
    }
    return null;
  },

  handleInputDown:function(input){
    const kind=this.hitKindAt(input.x,input.y,input.source);
    if(!kind)return;

    if(input.nativeEvent)input.nativeEvent.preventDefault();

    const comp=document.getElementById("marketDisplay")
      ?.components?.["market-canvas"];
    if(!comp)return;

    if(kind==="checkout"){
      window.StandaloneMarketMode?.checkout();
      return;
    }

    if(kind==="reset"){
      comp.reset();
      document.getElementById("hint").textContent="MARKET · 已清空篮筐 🧺";
    }else{
      comp.pick(kind);
    }
  },

  getCamera:function(){
    if(!this.camera){
      const camEl=document.querySelector("a-camera");
      this.camera=camEl && camEl.getObject3D("camera");
    }
    return this.camera;
  },

  projectWorld:function(v){
    const cam=this.getCamera();
    if(!cam)return null;
    const p=v.clone().project(cam);
    return {
      x:window.innerWidth-(p.x*0.5+0.5)*window.innerWidth,
      y:(-p.y*0.5+0.5)*window.innerHeight
    };
  },

  updateHoldHits:function(){
    if(!this.world)return;

    const obj=this.world.object3D;
    obj.updateMatrixWorld(true);

    const centerWorld=new THREE.Vector3(0,0,0).applyMatrix4(obj.matrixWorld);
    const rightWorld=new THREE.Vector3(0.5,0,0).applyMatrix4(obj.matrixWorld);
    const upWorld=new THREE.Vector3(0,0.5,0).applyMatrix4(obj.matrixWorld);

    const center=this.projectWorld(centerWorld);
    const right=this.projectWorld(rightWorld);
    const up=this.projectWorld(upWorld);
    if(!center||!right||!up)return;

    const pxPerUnitX=Math.max(1,Math.abs(right.x-center.x)*2);
    const pxPerUnitY=Math.max(1,Math.abs(up.y-center.y)*2);

    Object.entries(this.localPoints).forEach(([key,local])=>{
      const worldPoint=local.clone().applyMatrix4(obj.matrixWorld);
      const screen=this.projectWorld(worldPoint);
      if(!screen)return;

      const [wu,hu]=this.localSizes[key];
      const bw=Math.max(key==="reset"?96:54,(key==="reset"?.46:wu)*pxPerUnitX);
      const bh=Math.max(key==="reset"?26:54,(key==="reset"?.095:hu)*pxPerUnitY);

      const b=this.hits[key];
      b.style.left=(screen.x-bw/2)+"px";
      b.style.top=(screen.y-bh/2)+"px";
      b.style.width=bw+"px";
      b.style.height=bh+"px";
    });

    // Place checkout immediately to the right of the real Reset button.
    const reset=this.hits.reset;
    const checkout=document.getElementById("checkoutBtn");
    if(reset&&checkout&&reset.style.display!=="none"){
      const rr=reset.getBoundingClientRect();
      const gap=10;
      const cw=Math.max(112,rr.width*.92);
      checkout.style.left=(rr.right+gap)+"px";
      checkout.style.top=rr.top+"px";
      checkout.style.width=cw+"px";
      checkout.style.height=rr.height+"px";
    }
  },

  showHoldHits:function(){
    ["peach","cabbage","egg","reset"].forEach(k=>{
      const b=this.hits[k];
      if(b)b.style.display="block";
    });
  },

  hideHoldHits:function(){
    ["peach","cabbage","egg","reset"].forEach(k=>{
      const b=this.hits[k];
      if(b)b.style.display="none";
    });
  },

  tick:function(){
    if(!this.world)return;
    if(window.StandaloneMarketMode?.mode==="story"&&!this.tracking)return;
    const now=performance.now(),frameMs=this.tracking?33:67;
    if(this._lastControllerTick&&now-this._lastControllerTick<frameMs)return;
    this._lastControllerTick=now;
    const obj=this.world.object3D;

    if(this.tracking){
      this.el.object3D.updateMatrixWorld(true);
      this.lastMatrix.copy(this.el.object3D.matrixWorld);

      const pos=new THREE.Vector3();
      const quat=new THREE.Quaternion();
      const scale=new THREE.Vector3();
      this.lastMatrix.decompose(pos,quat,scale);

      // Save recent poses. About 20-24 frames gives us a few hundred ms of history.
      this.poseHistory.push({
        pos:pos.clone(),
        quat:quat.clone(),
        scale:scale.clone(),
        time:performance.now()
      });
      if(this.poseHistory.length>this.maxPoseHistory){
        this.poseHistory.shift();
      }

      this.basePos.copy(pos);this.baseScale.copy(scale);
      if(window.StandaloneMarketMode?.mode!=="story"){
        obj.position.copy(pos);obj.quaternion.copy(quat);obj.scale.copy(scale);obj.updateMatrixWorld(true);
      }
      return;
    }

    if(this.holding){
      // Very small, slow motion so the AR still feels "alive" after the card is removed.
      // It is intentionally much steadier than real tracking jitter.
      const t=(performance.now()-this.holdStart)/1000;
      const bob=Math.sin(t*1.45)*0.022;
      const sway=Math.sin(t*1.05)*0.014;
      const roll=Math.sin(t*1.18)*THREE.MathUtils.degToRad(1.4);

      obj.position.copy(this.basePos);
      obj.position.x+=sway;
      obj.position.y+=bob;

      const qRoll=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1),roll);
      // Integrated SHOP is a screen-facing activity. Do not inherit the physical
      // Market card's rotation after it is removed.
      obj.quaternion.identity().multiply(qRoll);
      obj.scale.copy(this.baseScale);
      obj.updateMatrixWorld(true);

      // Re-project DOM hit zones only while hand tracking is active.
      // Mouse keeps using the last stable positions while hand inference sleeps.
      if(window.StandaloneMarketHandMode?.running){
        this.updateHoldHits();
      }
    }
  }
});

AFRAME.registerComponent("market-events",{init:function(){
  const h=document.getElementById("hint");
  this.el.addEventListener("targetFound",()=>h.textContent="MARKET · 点一个食物放进篮筐吧！🧺");
  this.el.addEventListener("targetLost",()=>h.textContent="Market 还会停留 15 秒，可以继续选择 🧺");
}});

AFRAME.registerComponent("market-canvas",{
  init:function(){
    this.peachImage=new Image();this.peachImage.src=window.MarketSceneModule.asset("peach.png?v=1");
    this.cabbageImage=new Image();this.cabbageImage.src=window.MarketSceneModule.asset("cabbage.png?v=1");
    this.eggImage=new Image();this.eggImage.src=window.MarketSceneModule.asset("egg.png?v=1");
    this.c=document.getElementById("marketCanvas");
    this.ctx=this.c.getContext("2d");
    this.items={
      peach:{emoji:"🍑",x:250,y:135,tx:348,ty:320,selected:false,start:0},
      cabbage:{emoji:"🥬",x:384,y:118,tx:384,ty:312,selected:false,start:0},
      egg:{emoji:"🥚",x:518,y:135,tx:420,ty:320,selected:false,start:0}
    };
  },
  pick:function(kind){
    const item=this.items[kind];
    if(!item||item.selected)return;
    item.selected=true;
    item.start=performance.now();
    document.getElementById("hint").textContent="放进篮筐里！";
  },

  reset:function(){
    Object.entries(this.items).forEach(([kind,item])=>{
      item.selected=false;
      item.start=0;
    });
    document.getElementById("hint").textContent="选一个食物放进篮筐吧！🧺";
  },
  tick:function(){
    if(window.StandaloneMarketMode?.mode==="story")return;
    const now=performance.now();
    const animating=Object.values(this.items).some(item=>item.selected&&now-item.start<700);
    const frameMs=animating?33:67;
    if(this._lastDraw&&now-this._lastDraw<frameMs)return;this._lastDraw=now;
    const ctx=this.ctx,c=this.c,w=c.width,h=c.height;
    ctx.clearRect(0,0,w,h); // fully transparent canvas

    ctx.textAlign="center";ctx.textBaseline="middle";

    Object.entries(this.items).forEach(([kind,item])=>{
      let x=item.x,y=item.y,s=1;
      if(item.selected){
        const p=Math.min(1,(performance.now()-item.start)/650);
        const e=1-Math.pow(1-p,3);
        const arc=Math.sin(Math.PI*p)*75;
        x=item.x+(item.tx-item.x)*e;
        y=item.y+(item.ty-item.y)*e-arc;
        s=1-.50*e;
      }
      ctx.save();ctx.translate(x,y);ctx.scale(s,s);
      const img=kind==="peach"?this.peachImage:kind==="cabbage"?this.cabbageImage:this.eggImage;
      if(img&&img.complete&&img.naturalWidth)ctx.drawImage(img,-48,-48,96,96);
      else{ctx.font='96px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';ctx.fillText(item.emoji,0,0)}
      ctx.restore();
    });

    // Draw a consistent basket ourselves instead of using the system 🧺 emoji.
    // This keeps the basket shape identical on iPhone, Android and desktop.
    const basketCx=w/2;
    const basketTop=330;
    const basketW=220;
    const basketH=105;

    // handle
    ctx.save();
    ctx.lineWidth=18;
    ctx.lineCap="round";
    ctx.strokeStyle="#c88435";
    ctx.beginPath();
    ctx.arc(basketCx, basketTop-8, 58, Math.PI, 0);
    ctx.stroke();

    // basket body
    const left=basketCx-basketW/2;
    const right=basketCx+basketW/2;
    const bottom=basketTop+basketH;
    ctx.beginPath();
    ctx.moveTo(left+18,basketTop);
    ctx.lineTo(right-18,basketTop);
    ctx.lineTo(right-38,bottom);
    ctx.quadraticCurveTo(basketCx,bottom+14,left+38,bottom);
    ctx.closePath();
    ctx.fillStyle="#d9a45a";
    ctx.fill();
    ctx.lineWidth=5;
    ctx.strokeStyle="#a96f2b";
    ctx.stroke();

    // rim
    ctx.fillStyle="#e7b66d";
    roundRect(ctx,left,basketTop-14,basketW,28,14);
    ctx.fill();
    ctx.lineWidth=4;
    ctx.strokeStyle="#b7772e";
    ctx.stroke();

    // woven lines
    ctx.save();
    ctx.beginPath();
    ctx.rect(left+20,basketTop+10,basketW-40,basketH-24);
    ctx.clip();
    ctx.strokeStyle="rgba(150,92,35,.55)";
    ctx.lineWidth=4;
    for(let x=left-40;x<right+40;x+=32){
      ctx.beginPath();ctx.moveTo(x,basketTop+10);ctx.lineTo(x+90,bottom);ctx.stroke();
      ctx.beginPath();ctx.moveTo(x+90,basketTop+10);ctx.lineTo(x,bottom);ctx.stroke();
    }
    ctx.restore();
    ctx.restore();

    // RESET UI is provided by the DOM button #holdReset.

    const mesh=this.el.getObject3D("mesh");
    if(mesh&&mesh.material&&mesh.material.map)mesh.material.map.needsUpdate=true;
  }
});

AFRAME.registerComponent("pick-item",{
  schema:{kind:{type:"string"}},
  init:function(){
    this.el.addEventListener("click",()=>{console.log("market click",this.data.kind);
      const anchor=this.el.parentElement;
      const display=anchor.querySelector("#marketDisplay");
      const comp=display&&display.components["market-canvas"];
      if(comp)comp.pick(this.data.kind);
    });
  }
});

AFRAME.registerComponent("reset-market",{
  init:function(){
    this.el.addEventListener("click",()=>{
      const anchor=this.el.parentElement;
      const display=anchor.querySelector("#marketDisplay");
      const comp=display&&display.components["market-canvas"];
      if(comp)comp.reset();
    });
  }
});

window.ClassroomCameraOrientation={
  angle:0,
  init(){
    const select=document.getElementById("cameraOrientationSelect");
    this.angle=Number(localStorage.getItem("marketCameraAngle")||0);
    if(select){
      select.value=String(this.angle);
      select.addEventListener("change",()=>{
        this.angle=Number(select.value)||0;
        localStorage.setItem("marketCameraAngle",String(this.angle));
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

window.StandaloneMarketMode={
  mode:"story",
  showStory(){
    this.mode="story";
    document.body.classList.add("market-story");
    document.getElementById("marketStoryLayer").style.display="block";
    document.getElementById("shopBtn").style.display="block";
    document.getElementById("checkoutBtn").style.display="none";
    const w=document.getElementById("marketWorld");if(w)w.object3D.visible=false;
    document.getElementById("hint").textContent="讲讲这里发生了什么吧 🧺";
  },
  checkout(){
    window.StandaloneMarketHandMode?.sleep();

    this.mode="story";
    document.body.classList.add("market-story");

    document.getElementById("marketStoryLayer").style.display="block";
    document.getElementById("shopBtn").style.display="block";
    document.getElementById("checkoutBtn").style.display="none";

    const persist=document.querySelector('[market-persist]')?.components?.["market-persist"];
    if(persist){
      persist.tracking=false;
      persist.holding=false;
      persist.hideHoldHits();
    }

    const world=document.getElementById("marketWorld");
    if(world)world.object3D.visible=false;

    document.getElementById("hint").textContent="买好东西啦，继续讲故事吧 🧺";
  },

  enterShop(){
    this.mode="shop";
    document.body.classList.remove("market-story");
    document.getElementById("marketStoryLayer").style.display="none";
    document.getElementById("shopBtn").style.display="none";
    document.getElementById("checkoutBtn").style.display="block";
    const c=document.querySelector('[market-persist]')?.components?.["market-persist"];
    const w=document.getElementById("marketWorld");
    if(c&&w){
      const o=w.object3D;o.position.copy(c.basePos);o.quaternion.identity();o.scale.copy(c.baseScale);o.visible=true;o.updateMatrixWorld(true);
      c.tracking=false;c.holding=true;c.holdStart=performance.now();c.showHoldHits();c.updateHoldHits();
    }
    document.getElementById("hint").textContent="选点东西放进篮筐吧！🧺";
  }
};

window.StandaloneMarketHandMode={
  running:false,
  sleeping:false,
  timer:null,
  sleepMs:3000,

  clearTimer(){
    if(this.timer){clearTimeout(this.timer);this.timer=null}
  },

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

    if(status){
      status.style.display="block";
      status.textContent="手势：启动中…";
    }

    await window.ClassroomHandTracking.start({
      video,
      cursor,
      mirror:true,
      maxFps:15,
      smoothing:.38,
      pinchDownRatio:.34,
      pinchUpRatio:.44,
      reuseExistingVideo:true,
      viewport:()=>({width:innerWidth,height:innerHeight}),
      onStatus:(msg)=>{
        if(status)status.textContent="手势："+msg;
      },
      onArmedChange:(armed)=>{
        if(status)status.textContent=armed?"手势：MARKET":"放下识别卡，张开手 ✋";
      },
      onMetrics:(data)=>{
        if(!status)return;
        if(!data.handVisible)status.textContent="手势：请伸出一只手";
        else if(data.armed===false)status.textContent="放下识别卡，张开手 ✋";
        else if(data.pinching)status.textContent="手势：选择";
        else status.textContent="手势：MARKET";
      }
    });

    this.running=true;
    this.sleeping=false;
    this.noteInteraction();
    window.ClassroomHandTracking.requireReleaseToArm(300);

    const btn=document.getElementById("handBtn");
    if(btn)btn.textContent="✨ INTERACT · ON";
  },

  sleep(){
    if(!this.running)return;

    this.clearTimer();
    window.ClassroomHandTracking?.stop({keepVideo:true,keepModel:true});
    this.running=false;
    this.sleeping=true;

    const cursor=document.getElementById("handCursor");
    const status=document.getElementById("handStatus");
    const btn=document.getElementById("handBtn");

    if(cursor)cursor.style.display="none";
    if(status){
      status.style.display="block";
      status.textContent="手势：已关闭 · 再点 INTERACT 唤醒";
    }
    if(btn)btn.textContent="✨ INTERACT · OFF";
  },

  toggle(){
    this.running?this.sleep():this.start();
  }
};
