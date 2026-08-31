/*
 * Egg Interactive Magic Scene v1
 * Standalone target: ../../targets/egg.mind, targetIndex:0
 * Assets: ../../assets/egg/
 *
 * Interaction:
 * - story: egg gently rocks and occasionally hops
 * - click "孵化它"
 * - mouse/touch click egg OR hand cursor touches egg
 * - 3 touches: crack1 -> crack2 -> hatch -> animal
 * - hand touch requires leave/re-enter, plus cooldown, so one hover cannot skip stages
 */

window.EggSceneModule = window.EggSceneModule || {
  config:{
    assetBase:"../../assets/egg/",
    targetIndex:0,
    mirrorAR:true,
    mirrorHand:true,
    handFps:15,
    sleepMs:3000,
    integrated:false,
    onActivate:null,
    onLeave:null
  },

  configure(options={}){
    Object.assign(this.config, options);
    if(!this.config.assetBase.endsWith("/")) this.config.assetBase += "/";
    return this;
  },

  asset(name){ return this.config.assetBase + name; },

  activateHost(){
    if(typeof this.config.onActivate === "function") this.config.onActivate("egg");
  },

  leaveHost(){
    if(typeof this.config.onLeave === "function"){
      this.config.onLeave("egg");
      return;
    }
    this.resetStandalone();
  },

  ensureUI(){
    const make=(html)=>{
      const wrap=document.createElement("div");
      wrap.innerHTML=html.trim();
      const el=wrap.firstElementChild;
      document.body.appendChild(el);
      return el;
    };

    if(!document.getElementById("eggHatchBtn")) make('<button id="eggHatchBtn" type="button">🥚 孵化它</button>');
    if(!document.getElementById("eggRetryBtn")) make('<button id="eggRetryBtn" type="button">↻ 再试一次</button>');
    if(!document.getElementById("eggLeaveBtn")) make('<button id="eggLeaveBtn" type="button">✅ 离开</button>');
    if(!document.getElementById("eggProgress")) make('<div id="eggProgress">轻轻碰一碰这颗蛋 ✨</div>');
    if(!document.getElementById("eggCanvas")){
      const c=make('<canvas id="eggCanvas" class="off" width="768" height="768"></canvas>');
      c.style.display="none";
    }

    // Shared standalone Hand UI. Integrated DIY can provide these already.
    if(!document.getElementById("handBtn")){
      const b=make('<button id="handBtn" type="button">✨ INTERACT · OFF</button>');
      b.className="egg-shared-hand";
    }
    if(!document.getElementById("handStatus")){
      const d=make('<div id="handStatus">手势：已关闭</div>');
      d.className="egg-shared-hand";
    }
    if(!document.getElementById("handCursor")){
      const d=make('<div id="handCursor">☝️</div>');
      d.className="egg-shared-hand";
    }
  },

  bindUI(){
    const bind=(id,key,fn)=>{
      const el=document.getElementById(id);
      if(!el || el.dataset[key]) return;
      el.dataset[key]="1";
      el.addEventListener("click",fn);
    };

    bind("eggHatchBtn","eggBound",()=>window.EggMode.enterGame());
    bind("eggRetryBtn","eggBound",()=>window.EggMode.retry());
    bind("eggLeaveBtn","eggBound",()=>window.EggMode.leave());

    if(!this.config.integrated){
      bind("handBtn","eggBound",()=>window.StandaloneEggHandMode.toggle());
    }
  },

  install(options={}){
    this.configure(options);
    this.ensureUI();
    this.bindUI();
    window.StandaloneEggHandMode.sleepMs=this.config.sleepMs;
  },

  resetStandalone(){
    window.StandaloneEggHandMode?.sleep();
    window.EggMode.mode="waiting";
    window.EggMode.stage=0;

    ["eggHatchBtn","eggRetryBtn","eggLeaveBtn","eggProgress","handBtn","handStatus"].forEach(id=>{
      const el=document.getElementById(id);
      if(el) el.style.display="none";
    });

    const cursor=document.getElementById("handCursor");
    if(cursor) cursor.style.display="none";

    const ctrl=document.querySelector("[egg-controller]")?.components?.["egg-controller"];
    ctrl?.hideWorld?.();

    const comp=document.getElementById("eggDisplay")?.components?.["egg-canvas"];
    comp?.reset?.();

    const hint=document.getElementById("hint");
    if(hint) hint.textContent="请把镜头对准 EGG 卡";
  }
};

window.EggMode={
  mode:"waiting",   // waiting | story | game | complete
  stage:0,          // 0 intact, 1 crack1, 2 crack2, 3 hatched
  lastTouch:0,
  cooldownMs:700,

  setHint(text){
    const h=document.getElementById("hint");
    if(h) h.textContent=text;
  },

  showStory(){
    this.mode="story";
    this.stage=0;
    window.StandaloneEggHandMode?.sleep();

    const hatch=document.getElementById("eggHatchBtn");
    const progress=document.getElementById("eggProgress");
    if(hatch) hatch.style.display="block";
    if(progress){
      progress.style.display="block";
      progress.textContent="这颗蛋好像在动……";
    }

    ["eggRetryBtn","eggLeaveBtn","handBtn","handStatus"].forEach(id=>{
      const el=document.getElementById(id);
      if(el) el.style.display="none";
    });

    const comp=document.getElementById("eggDisplay")?.components?.["egg-canvas"];
    comp?.setStage?.(0);
    comp?.setMode?.("story");
    this.setHint("MAGIC 06 · 蛋里有什么？");
  },

  enterGame(){
    if(this.mode!=="story" && this.mode!=="complete") return;
    this.mode="game";
    this.stage=0;
    this.lastTouch=0;

    const hatch=document.getElementById("eggHatchBtn");
    const hand=document.getElementById("handBtn");
    const progress=document.getElementById("eggProgress");

    if(hatch) hatch.style.display="none";
    if(hand){
      hand.style.display="block";
      hand.textContent="✨ INTERACT · OFF";
    }
    if(progress){
      progress.style.display="block";
      progress.textContent="☝️ 用手指碰一碰蛋 · 0 / 3";
    }

    ["eggRetryBtn","eggLeaveBtn"].forEach(id=>{
      const el=document.getElementById(id);
      if(el) el.style.display="none";
    });

    const comp=document.getElementById("eggDisplay")?.components?.["egg-canvas"];
    comp?.setStage?.(0);
    comp?.setMode?.("game");
    this.setHint("轻轻碰一下蛋，看看会发生什么 ✨");
  },

  touch(source="mouse"){
    if(this.mode!=="game") return false;
    const now=performance.now();
    if(now-this.lastTouch<this.cooldownMs) return false;
    this.lastTouch=now;

    this.stage++;
    window.StandaloneEggHandMode?.noteInteraction();

    const comp=document.getElementById("eggDisplay")?.components?.["egg-canvas"];
    const progress=document.getElementById("eggProgress");

    if(this.stage===1){
      comp?.setStage?.(1);
      comp?.impact?.();
      if(progress) progress.textContent="咔！出现第一道裂纹 · 1 / 3";
      this.setHint("它裂开了一点！再碰一下 👆");
    }else if(this.stage===2){
      comp?.setStage?.(2);
      comp?.impact?.();
      if(progress) progress.textContent="咔嚓！裂纹越来越多 · 2 / 3";
      this.setHint("快孵出来了！再碰最后一下 ✨");
    }else{
      this.stage=3;
      comp?.hatch?.();
      this.complete();
    }
    return true;
  },

  complete(){
    this.mode="complete";
    window.StandaloneEggHandMode?.sleep();

    const hand=document.getElementById("handBtn");
    const status=document.getElementById("handStatus");
    const progress=document.getElementById("eggProgress");
    if(hand) hand.style.display="none";
    if(status) status.style.display="none";
    if(progress){
      progress.style.display="block";
      progress.textContent="🎉 孵化成功！";
    }

    setTimeout(()=>{
      const retry=document.getElementById("eggRetryBtn");
      const leave=document.getElementById("eggLeaveBtn");
      if(retry) retry.style.display="block";
      if(leave) leave.style.display="block";
    },650);

    this.setHint("🎉 哇！小家伙孵出来了！");
  },

  retry(){
    window.StandaloneEggHandMode?.sleep();
    this.mode="story";
    this.stage=0;
    const comp=document.getElementById("eggDisplay")?.components?.["egg-canvas"];
    comp?.reset?.();
    this.showStory();
  },

  leave(){
    window.StandaloneEggHandMode?.sleep();
    window.EggSceneModule.leaveHost();
  }
};

window.StandaloneEggHandMode={
  running:false,
  timer:null,
  sleepMs:3000,

  clearTimer(){
    if(this.timer){ clearTimeout(this.timer); this.timer=null; }
  },

  noteInteraction(){
    if(!this.running) return;
    this.clearTimer();
    this.timer=setTimeout(()=>this.sleep(),this.sleepMs);
  },

  async start(){
    if(this.running || window.EggMode.mode!=="game") return;

    const status=document.getElementById("handStatus");
    const cursor=document.getElementById("handCursor");
    const video=document.querySelector("video");
    if(!video || !window.ClassroomHandTracking) return;

    if(status){
      status.style.display="block";
      status.textContent="手势：启动中…";
    }

    await window.ClassroomHandTracking.start({
      video,
      cursor,
      mirror:window.EggSceneModule.config.mirrorHand,
      maxFps:window.EggSceneModule.config.handFps,
      smoothing:.38,
      reuseExistingVideo:true,
      viewport:()=>({width:innerWidth,height:innerHeight}),
      onStatus:(msg)=>{
        if(status) status.textContent="手势："+msg;
      },
      onMetrics:(data)=>{
        if(!status) return;
        if(!data.handVisible) status.textContent="手势：请伸出一只手";
        else status.textContent="手势：用食指碰蛋";
      }
    });

    this.running=true;
    this.noteInteraction();
    const btn=document.getElementById("handBtn");
    if(btn) btn.textContent="✨ INTERACT · ON";
  },

  sleep(){
    this.clearTimer();
    if(this.running){
      window.ClassroomHandTracking?.stop({keepVideo:true,keepModel:true});
    }
    this.running=false;

    const cursor=document.getElementById("handCursor");
    const status=document.getElementById("handStatus");
    const btn=document.getElementById("handBtn");

    if(cursor) cursor.style.display="none";
    if(window.EggMode.mode==="game"){
      if(status){
        status.style.display="block";
        status.textContent="手势：已关闭 · 再点 INTERACT 唤醒";
      }
      if(btn) btn.textContent="✨ INTERACT · OFF";
    }else{
      if(status) status.style.display="none";
    }
  },

  toggle(){
    this.running ? this.sleep() : this.start();
  }
};

AFRAME.registerComponent("egg-canvas",{
  init(){
    this.canvas=document.getElementById("eggCanvas");
    this.ctx=this.canvas.getContext("2d");
    this.mode="waiting";
    this.stage=0;
    this.startTime=performance.now();
    this.impactUntil=0;
    this.hatchStart=0;
    this.lastFrame=0;

    this.images={};
    [
      "egg.png",
      "egg_crack1.png",
      "egg_crack2.png",
      "egg_hatched.png",
      "egg_animal.png",
      "egg_shadow.png",
      "egg_sparkle.png"
    ].forEach(name=>{
      const img=new Image();
      img.src=window.EggSceneModule.asset(name);
      this.images[name]=img;
    });
  },

  setMode(mode){ this.mode=mode; },
  setStage(stage){ this.stage=stage; },
  impact(){ this.impactUntil=performance.now()+260; },

  hatch(){
    this.stage=3;
    this.hatchStart=performance.now();
    this.impactUntil=this.hatchStart+430;
  },

  reset(){
    this.mode="waiting";
    this.stage=0;
    this.hatchStart=0;
    this.impactUntil=0;
  },

  drawImageContain(img,cx,cy,maxW,maxH,alpha=1,scale=1,rotation=0){
    if(!img?.complete || !img.naturalWidth) return;
    const r=Math.min(maxW/img.naturalWidth,maxH/img.naturalHeight)*scale;
    const w=img.naturalWidth*r,h=img.naturalHeight*r;
    const ctx=this.ctx;
    ctx.save();
    ctx.globalAlpha=alpha;
    ctx.translate(cx,cy);
    ctx.rotate(rotation);
    ctx.drawImage(img,-w/2,-h/2,w,h);
    ctx.restore();
  },

  draw(now){
    const c=this.canvas,ctx=this.ctx;
    ctx.clearRect(0,0,c.width,c.height);

    const story=this.mode==="story";
    const t=(now-this.startTime)/1000;

    // gentle ambient floating aura
    const glow=ctx.createRadialGradient(384,380,60,384,380,280);
    glow.addColorStop(0,"rgba(190,130,255,.18)");
    glow.addColorStop(1,"rgba(190,130,255,0)");
    ctx.fillStyle=glow;
    ctx.fillRect(70,60,628,610);

    // soft shadow
    this.drawImageContain(this.images["egg_shadow.png"],384,615,430,150,.65,1);

    let bob=0,rot=0,eggScale=1;
    if(story){
      rot=Math.sin(t*2.3)*0.035 + Math.sin(t*.71)*0.012;
      bob=Math.sin(t*2.0)*4;
      // occasional little hop
      const cycle=t%4.8;
      if(cycle>3.75 && cycle<4.22){
        const p=(cycle-3.75)/.47;
        bob-=Math.sin(Math.PI*p)*34;
        rot+=Math.sin(Math.PI*2*p)*.045;
      }
    }else if(this.mode==="game"){
      rot=Math.sin(t*1.5)*0.012;
    }

    if(now<this.impactUntil){
      const p=1-(this.impactUntil-now)/260;
      eggScale=1+Math.sin(Math.PI*Math.max(0,Math.min(1,p)))*.06;
      rot+=Math.sin(p*40)*.018;
    }

    if(this.stage<3){
      const file=this.stage===0?"egg.png":this.stage===1?"egg_crack1.png":"egg_crack2.png";
      this.drawImageContain(this.images[file],384,370+bob,440,520,1,eggScale,rot);
    }else{
      const elapsed=now-this.hatchStart;

      // flash first
      if(elapsed<800){
        const sparkleAlpha=Math.max(0,1-elapsed/900);
        this.drawImageContain(this.images["egg_sparkle.png"],384,350,650,650,sparkleAlpha,1.05);
      }

      // opened shell
      const shellAlpha=Math.min(1,Math.max(0,(elapsed-180)/360));
      this.drawImageContain(this.images["egg_hatched.png"],384,405,520,520,shellAlpha,1);

      // animal rises after shell opens
      const animalP=Math.min(1,Math.max(0,(elapsed-420)/600));
      const ease=1-Math.pow(1-animalP,3);
      const y=460-ease*125;
      const sc=.72+ease*.28;
      this.drawImageContain(this.images["egg_animal.png"],384,y,430,430,animalP,sc);

      if(elapsed>950){
        const pulse=1+Math.sin(t*4)*.018;
        this.drawImageContain(this.images["egg_sparkle.png"],384,330,560,560,.18,pulse);
      }
    }
  },

  tick(time){
    const now=performance.now();
    if(this.mode==="waiting") return;
    const frameMs=this.mode==="game"||this.mode==="story"?42:50;
    if(this.lastFrame && now-this.lastFrame<frameMs) return;
    this.lastFrame=now;

    this.draw(now);

    const mesh=this.el.getObject3D("mesh");
    if(mesh?.material?.map) mesh.material.map.needsUpdate=true;
  }
});

AFRAME.registerComponent("egg-controller",{
  schema:{world:{type:"selector"}},

  init(){
    this.world=this.data.world;
    this.tracking=false;
    this.holding=false;
    this.poseHistory=[];
    this.maxPoseHistory=24;
    this.basePos=new THREE.Vector3();
    this.baseScale=new THREE.Vector3(1,1,1);
    this.lastHandInside=false;
    this.lastHandPoll=0;

    this.planeWidth=2.15;
    this.planeHeight=2.15;
    this.canvasW=768;
    this.canvasH=768;

    if(this.world) this.world.object3D.visible=false;

    // Mouse/touch test path.
    if(window.CityInput){
      window.CityInput.register("egg-touch",{
        down:(input)=>{
          if(window.EggMode.mode!=="game") return;
          if(input.source==="hand") return; // hand is hover-touch, not pinch
          if(this.hitEggAt(input.x,input.y,"pointer")){
            input.nativeEvent?.preventDefault?.();
            window.EggMode.touch(input.source||"pointer");
          }
        }
      });
    }

    this.el.addEventListener("targetFound",()=>{
      if(window.EggMode.mode!=="waiting") return;

      window.EggSceneModule.activateHost();
      this.tracking=true;
      this.holding=false;
      this.poseHistory=[];

      if(this.world) this.world.object3D.visible=true;
      window.EggMode.showStory();
    });

    this.el.addEventListener("targetLost",()=>{
      if(window.EggMode.mode==="waiting") return;

      this.tracking=false;
      this.holding=true;

      let stable=null;
      const now=performance.now();
      for(let i=this.poseHistory.length-1;i>=0;i--){
        if(now-this.poseHistory[i].time>=220){
          stable=this.poseHistory[i];
          break;
        }
      }
      if(!stable && this.poseHistory.length) stable=this.poseHistory[0];

      if(stable){
        this.basePos.copy(stable.pos);
        this.baseScale.copy(stable.scale);
      }else{
        this.el.object3D.updateMatrixWorld(true);
        const p=new THREE.Vector3(),q=new THREE.Quaternion(),sc=new THREE.Vector3();
        this.el.object3D.matrixWorld.decompose(p,q,sc);
        this.basePos.copy(p);
        this.baseScale.copy(sc);
      }

      if(this.world){
        const o=this.world.object3D;
        o.position.copy(this.basePos);
        o.quaternion.identity();
        o.scale.copy(this.baseScale);
        o.visible=true;
      }
    });
  },

  getCamera(){
    return document.querySelector("a-camera")?.getObject3D("camera") ||
           document.querySelector("[camera]")?.getObject3D("camera");
  },

  projectWorld(v){
    const cam=this.getCamera();
    if(!cam) return null;
    const p=v.clone().project(cam);
    const rawX=(p.x*.5+.5)*innerWidth;
    return{
      x:window.EggSceneModule.config.mirrorAR ? innerWidth-rawX : rawX,
      y:(-p.y*.5+.5)*innerHeight
    };
  },

  screenToCanvas(x,y){
    if(!this.world) return null;
    const obj=this.world.object3D;
    obj.updateMatrixWorld(true);

    const center=this.projectWorld(new THREE.Vector3(0,0,0).applyMatrix4(obj.matrixWorld));
    const right=this.projectWorld(new THREE.Vector3(.5,0,0).applyMatrix4(obj.matrixWorld));
    const up=this.projectWorld(new THREE.Vector3(0,.5,0).applyMatrix4(obj.matrixWorld));
    if(!center||!right||!up) return null;

    const pxPerUnitX=Math.max(1,Math.abs(right.x-center.x)*2);
    const pxPerUnitY=Math.max(1,Math.abs(up.y-center.y)*2);

    const localX=(window.EggSceneModule.config.mirrorAR?-1:1)*(x-center.x)/pxPerUnitX;
    const localY=-(y-center.y)/pxPerUnitY;

    return{
      x:(localX/this.planeWidth+.5)*this.canvasW,
      y:(.5-localY/this.planeHeight)*this.canvasH
    };
  },

  hitEggAt(screenX,screenY,source){
    const c=this.screenToCanvas(screenX,screenY);
    if(!c) return false;

    // Large, forgiving oval hit zone.
    const dx=(c.x-384)/(source==="hand"?205:185);
    const dy=(c.y-370)/(source==="hand"?255:235);
    return dx*dx+dy*dy<=1;
  },

  pollHandTouch(now){
    if(window.EggMode.mode!=="game" || !window.StandaloneEggHandMode.running){
      this.lastHandInside=false;
      return;
    }
    if(now-this.lastHandPoll<70) return;
    this.lastHandPoll=now;

    const cursor=document.getElementById("handCursor");
    if(!cursor || getComputedStyle(cursor).display==="none"){
      this.lastHandInside=false;
      return;
    }

    const r=cursor.getBoundingClientRect();
    const x=r.left+r.width/2;
    const y=r.top+r.height/2;
    const inside=this.hitEggAt(x,y,"hand");

    // Require exit then re-enter. Prevents a stationary finger from triggering 3 stages.
    if(inside && !this.lastHandInside){
      window.EggMode.touch("hand");
    }
    this.lastHandInside=inside;
  },

  hideWorld(){
    this.tracking=false;
    this.holding=false;
    this.lastHandInside=false;
    if(this.world) this.world.object3D.visible=false;
  },

  tick(){
    if(!this.world || window.EggMode.mode==="waiting") return;

    const now=performance.now();
    this.pollHandTouch(now);

    const obj=this.world.object3D;

    if(this.tracking){
      this.el.object3D.updateMatrixWorld(true);
      const p=new THREE.Vector3(),q=new THREE.Quaternion(),sc=new THREE.Vector3();
      this.el.object3D.matrixWorld.decompose(p,q,sc);

      this.poseHistory.push({pos:p.clone(),scale:sc.clone(),time:now});
      if(this.poseHistory.length>this.maxPoseHistory) this.poseHistory.shift();

      this.basePos.copy(p);
      this.baseScale.copy(sc);

      obj.position.copy(p);
      obj.quaternion.identity();
      obj.scale.copy(sc);
      obj.visible=true;
    }else if(this.holding){
      obj.position.copy(this.basePos);
      obj.quaternion.identity();
      obj.scale.copy(this.baseScale);
      obj.visible=true;
    }
  }
});
