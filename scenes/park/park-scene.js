
/*
 * Park Scene Module v5
 * Source of truth: uploaded working park_story_interactive.html.
 * UI + Park behavior live here; standalone HTML is only a host.
 */
window.ParkSceneModule = window.ParkSceneModule || {
  assetBase:"../../assets/park/",
  storyImage:"../../assets/city/park_scene.png",

  configure(options={}){
    if(options.assetBase!==undefined)this.assetBase=options.assetBase;
    if(options.storyImage!==undefined)this.storyImage=options.storyImage;
    if(!this.assetBase.endsWith("/"))this.assetBase+="/";
    return this;
  },

  mountUI(options={}){
    this.configure(options);
    if(document.getElementById("parkStoryLayer"))return;

    const host=document.createElement("div");
    host.id="parkModuleUI";
    host.innerHTML=`
      <div id="parkStoryLayer">
        <div id="parkStoryCard">
          <img src="${this.storyImage}" alt="">
        </div>
      </div>

      <button id="fixParkBtn" type="button">🌳 一起整理公园吧</button>
      <button id="doneParkBtn" type="button">✅ 整理好啦</button>

      <div id="cameraOrientationControl">
        <span>📷 CAMERA</span>
        <select id="cameraOrientationSelect" aria-label="Camera orientation">
          <option value="0">0°</option>
          <option value="90">90°</option>
          <option value="180">180°</option>
          <option value="270">270°</option>
        </select>
      </div>

      <button id="handBtn" type="button">✨ INTERACT · OFF</button>
      <div id="handStatus">手势：已关闭</div>
      <div id="handCursor">✨</div>
      <div id="hint">请把镜头对准 Park 识别图</div>

      <div id="dragLayer">
        <button id="dragTree" class="drag-hit" aria-label="Tree"></button>
        <button id="dragFlower" class="drag-hit" aria-label="Flower"></button>
        <button id="dragBench" class="drag-hit" aria-label="Bench"></button>
        <button id="dragFountain" class="drag-hit" aria-label="Fountain"></button>
        <button id="dragReset" class="drag-hit" aria-label="Reset"></button>
      </div>

      <canvas id="parkCanvas" class="off" width="768" height="512"></canvas>
    `;
    document.body.appendChild(host);
    document.body.classList.add("park-story");
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
    video.style.transform=`rotate(${a}deg)`;
    if(a===90||a===270){
      const scale=Math.max(innerWidth/innerHeight,innerHeight/innerWidth);
      video.style.transform=`rotate(${a}deg) scale(${scale})`;
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
    document.getElementById("hint").textContent="PARK · 公园整理好啦，继续讲故事吧 🌿";
  }
};

window.StandaloneHandMode={
  running:false,
  sleeping:false,
  timer:null,
  sleepMs:5000,
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
      video,cursor,mirror:false,maxFps:18,smoothing:.38,
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

document.addEventListener("DOMContentLoaded",()=>{
  window.ParkCameraOrientation.init();
  document.getElementById("fixParkBtn")?.addEventListener("click",()=>window.StandaloneParkMode.enterFix());
  document.getElementById("doneParkBtn")?.addEventListener("click",()=>window.StandaloneParkMode.finishFix());
  document.getElementById("handBtn").addEventListener("click",()=>window.StandaloneHandMode.toggle());
  window.CityInput.register("hand-auto-sleep",{
    down:(input)=>{if(input.source==="hand")window.StandaloneHandMode.noteInteraction()},
    up:(input)=>{if(input.source==="hand")window.StandaloneHandMode.noteInteraction()}
  });
});

AFRAME.registerComponent("park-canvas",{
  init(){
    this.c=document.getElementById("parkCanvas");this.ctx=this.c.getContext("2d");
    this.images={};
    ["tree","flower","bench","fountain"].forEach(kind=>{
      const img=new Image();img.src=`${window.ParkSceneModule.assetBase}${kind}.png?v=1`;this.images[kind]=img;
    });

    this.initial={
      tree:{x:170,y:165,rotation:-.18,scale:1.0},
      flower:{x:315,y:350,rotation:.25,scale:.82},
      bench:{x:460,y:355,rotation:.24,scale:.86},
      fountain:{x:565,y:215,rotation:-.12,scale:.92}
    };
    this.items={};
    this.resetMessy();
  },
  resetMessy(){
    Object.entries(this.initial).forEach(([k,p])=>this.items[k]={...p});
  },
  setPosition(kind,x,y){
    const item=this.items[kind];if(!item)return;
    item.x=Math.max(90,Math.min(678,x));item.y=Math.max(85,Math.min(430,y));item.rotation=0;
  },
  reset(){
    this.resetMessy();
    document.getElementById("hint").textContent="PARK · 公园又乱了，重新修好它吧！✨";
  },
  tick(){
    if(window.StandaloneParkMode?.mode==="story")return;
    const now=performance.now();
    const active=!!window.ParkDragController?.dragging;
    const frameMs=active?33:67;
    if(this._lastDraw&&now-this._lastDraw<frameMs)return;
    this._lastDraw=now;

    const ctx=this.ctx,c=this.c,w=c.width,h=c.height;
    ctx.clearRect(0,0,w,h);

    ctx.save();
    ctx.fillStyle="rgba(126,181,92,.24)";ctx.beginPath();ctx.ellipse(w/2,390,245,74,0,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle="rgba(210,180,125,.46)";ctx.lineWidth=30;ctx.lineCap="round";ctx.beginPath();
    ctx.moveTo(205,425);ctx.bezierCurveTo(290,350,455,455,565,370);ctx.stroke();
    ctx.strokeStyle="rgba(255,244,211,.34)";ctx.lineWidth=12;ctx.beginPath();
    ctx.moveTo(205,425);ctx.bezierCurveTo(290,350,455,455,565,370);ctx.stroke();
    ctx.font='30px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';ctx.globalAlpha=.72;
    ctx.fillText("🌱",175,385);ctx.fillText("🌱",585,410);ctx.fillText("🌱",305,430);ctx.restore();

    const bt=now/1000,travel=(Math.sin(bt*.72)+1)/2;
    ctx.save();ctx.globalAlpha=.86;ctx.translate(185+travel*395,245+Math.sin(bt*1.55)*16);
    ctx.scale(.86+.10*Math.sin(bt*3.1),.86+.10*Math.sin(bt*3.1));
    ctx.font='38px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';ctx.fillText("🦋",0,0);ctx.restore();

    Object.entries(this.items).forEach(([kind,item])=>{
      ctx.save();ctx.translate(item.x,item.y);ctx.rotate(item.rotation||0);ctx.scale(item.scale||1,item.scale||1);
      const img=this.images[kind];
      if(img&&img.complete&&img.naturalWidth){
        const size=kind==="bench"?118:kind==="tree"?112:kind==="flower"?110:108;
        ctx.drawImage(img,-size/2,-size/2,size,size);
      }
      ctx.restore();
    });

    const mesh=this.el.getObject3D("mesh");
    if(mesh&&mesh.material&&mesh.material.map)mesh.material.map.needsUpdate=true;
  }
});

AFRAME.registerComponent("park-drag-controller",{
  schema:{world:{type:"selector"}},
  init(){
    window.ParkDragController=this;
    this.world=this.data.world;this.tracking=false;this.holding=false;this.dragState=null;
    this.lastMatrix=new THREE.Matrix4();this.basePos=new THREE.Vector3();this.baseScale=new THREE.Vector3(1,1,1);
    this.poseHistory=[];this.maxPoseHistory=24;this.planeWidth=2.15;this.planeHeight=1.43;this.canvasW=768;this.canvasH=512;
    this.hits={
      tree:document.getElementById("dragTree"),flower:document.getElementById("dragFlower"),
      bench:document.getElementById("dragBench"),fountain:document.getElementById("dragFountain"),
      reset:document.getElementById("dragReset")
    };
    this.hits.reset.textContent="再试一次";
    this.hits.reset.addEventListener("click",(e)=>{e.preventDefault();e.stopPropagation();this.getCanvasComp()?.reset()});

    window.CityInput.register("park-standalone",{
      down:(input)=>this.handleDown(input),move:(input)=>this.handleMove(input),
      up:(input)=>this.handleUp(input),cancel:(input)=>this.handleUp(input)
    });

    if(this.world)this.world.object3D.visible=false;

    this.el.addEventListener("targetFound",()=>{
      this.tracking=true;this.holding=false;this.poseHistory=[];
      if(window.StandaloneParkMode?.mode==="story"){
        if(this.world)this.world.object3D.visible=false;
        this.hideHits();
        window.StandaloneParkMode.showStory(true);
      }else{
        if(this.world)this.world.object3D.visible=true;
        this.showHits();this.updateHitPositions();
        document.getElementById("hint").textContent="PARK · 拖动这些东西来修好公园吧！🌳";
      }
    });

    this.el.addEventListener("targetLost",()=>{
      this.tracking=false;this.holding=true;this.holdStart=performance.now();
      if(this.world){
        const obj=this.world.object3D;let stable=null,now=performance.now();
        for(let i=this.poseHistory.length-1;i>=0;i--){if(now-this.poseHistory[i].time>=280){stable=this.poseHistory[i];break}}
        if(!stable&&this.poseHistory.length)stable=this.poseHistory[0];
        if(stable){
          this.basePos.copy(stable.pos);
          this.baseScale.copy(stable.scale);
        }else{
          // Very short scans may not build enough pose history. Use the current
          // target matrix as a fallback so FIX still has a valid position/scale.
          this.el.object3D.updateMatrixWorld(true);
          const p=new THREE.Vector3(),q=new THREE.Quaternion(),sc=new THREE.Vector3();
          this.el.object3D.matrixWorld.decompose(p,q,sc);
          this.basePos.copy(p);
          this.baseScale.copy(sc);
        }

        obj.position.copy(this.basePos);
        obj.quaternion.identity();
        obj.scale.copy(this.baseScale);
        obj.visible=true;
        obj.updateMatrixWorld(true);
      }
      if(window.StandaloneParkMode?.mode==="story"){
        this.holding=false;this.hideHits();
        if(this.world)this.world.object3D.visible=false;
        document.getElementById("hint").textContent="PARK · 继续用玩偶讲故事吧 🌿";
      }else{
        this.showHits();this.updateHitPositions();
        document.getElementById("hint").textContent="PARK · 可以继续拖动，或用玩偶讲故事 🌿";
      }
    });
  },
  get dragging(){return !!this.dragState},
  getCanvasComp(){return document.getElementById("parkDisplay")?.components?.["park-canvas"]},
  getCamera(){if(!this.camera){const e=document.querySelector("a-camera");this.camera=e&&e.getObject3D("camera")}return this.camera},
  projectWorld(v){const cam=this.getCamera();if(!cam)return null;const p=v.clone().project(cam);return{x:(p.x*.5+.5)*innerWidth,y:(-p.y*.5+.5)*innerHeight}},
  canvasToLocal(x,y){return new THREE.Vector3((x/this.canvasW-.5)*this.planeWidth,(.5-y/this.canvasH)*this.planeHeight,.10)},
  getScreenScale(){
    if(!this.world)return null;const obj=this.world.object3D;obj.updateMatrixWorld(true);
    const c=this.projectWorld(new THREE.Vector3(0,0,0).applyMatrix4(obj.matrixWorld));
    const r=this.projectWorld(new THREE.Vector3(.5,0,0).applyMatrix4(obj.matrixWorld));
    const u=this.projectWorld(new THREE.Vector3(0,.5,0).applyMatrix4(obj.matrixWorld));
    if(!c||!r||!u)return null;
    return{pxPerUnitX:Math.max(1,Math.abs(r.x-c.x)*2),pxPerUnitY:Math.max(1,Math.abs(u.y-c.y)*2)}
  },
  hitKindAt(x,y,source){
    const done=document.getElementById("doneParkBtn");
    if(done&&done.style.display!=="none"){
      const r=done.getBoundingClientRect(),pad=source==="hand"?12:4;
      if(x>=r.left-pad&&x<=r.right+pad&&y>=r.top-pad&&y<=r.bottom+pad)return "done";
    }
    for(const kind of ["reset","tree","flower","bench","fountain"]){
      const b=this.hits[kind];if(!b||b.style.display==="none")continue;
      const r=b.getBoundingClientRect(),pad=source==="hand"?8:0;
      if(x>=r.left-pad&&x<=r.right+pad&&y>=r.top-pad&&y<=r.bottom+pad)return kind;
    }
    return null;
  },
  handleDown(input){
    const kind=this.hitKindAt(input.x,input.y,input.source);if(!kind)return;
    if(input.nativeEvent)input.nativeEvent.preventDefault();
    if(kind==="done"){window.StandaloneParkMode?.finishFix();return}
    if(kind==="reset"){this.getCanvasComp()?.reset();return}
    const comp=this.getCanvasComp(),scale=this.getScreenScale();if(!comp||!scale)return;
    const item=comp.items[kind];
    this.dragState={pointerId:input.pointerId,kind,startScreenX:input.x,startScreenY:input.y,
      startCanvasX:item.x,startCanvasY:item.y,pxPerUnitX:scale.pxPerUnitX,pxPerUnitY:scale.pxPerUnitY};
    document.getElementById("hint").textContent="拖到你喜欢的位置！";
  },
  handleMove(input){
    if(!this.dragState||input.pointerId!==this.dragState.pointerId)return;
    if(input.nativeEvent)input.nativeEvent.preventDefault();
    const comp=this.getCanvasComp();if(!comp)return;
    const dx=input.x-this.dragState.startScreenX,dy=input.y-this.dragState.startScreenY;
    const sx=(this.dragState.pxPerUnitX*this.planeWidth)/this.canvasW;
    const sy=(this.dragState.pxPerUnitY*this.planeHeight)/this.canvasH;
    comp.setPosition(this.dragState.kind,this.dragState.startCanvasX+dx/Math.max(.001,sx),this.dragState.startCanvasY+dy/Math.max(.001,sy));
    this.updateHitPositions();
  },
  handleUp(input){
    if(!this.dragState||input.pointerId!==this.dragState.pointerId)return;
    this.dragState=null;document.getElementById("hint").textContent="PARK · 继续拖动来修好公园吧！🌳";
  },
  showHits(){Object.values(this.hits).forEach(b=>b.style.display="block")},
  hideHits(){Object.values(this.hits).forEach(b=>b.style.display="none")},
  updateHitPositions(){
    if(!this.world)return;const comp=this.getCanvasComp();if(!comp)return;
    const obj=this.world.object3D;obj.updateMatrixWorld(true);const scale=this.getScreenScale();if(!scale)return;
    const base=Math.max(52,.46*scale.pxPerUnitX);
    Object.entries(comp.items).forEach(([kind,item])=>{
      const s=this.projectWorld(this.canvasToLocal(item.x,item.y).applyMatrix4(obj.matrixWorld));if(!s)return;
      const b=this.hits[kind],size=base*Math.max(.85,item.scale||1);
      b.style.left=(s.x-size/2)+"px";b.style.top=(s.y-size/2)+"px";b.style.width=size+"px";b.style.height=size+"px";
    });
    const rs=this.projectWorld(this.canvasToLocal(this.canvasW/2,505).applyMatrix4(obj.matrixWorld));
    if(rs){
      const bw=Math.max(96,.46*scale.pxPerUnitX),bh=Math.max(26,.095*scale.pxPerUnitY);
      const b=this.hits.reset;b.style.left=(rs.x-bw/2)+"px";b.style.top=(rs.y-bh/2)+"px";b.style.width=bw+"px";b.style.height=bh+"px";
      const done=document.getElementById("doneParkBtn");
      if(done&&window.StandaloneParkMode?.mode==="fix"){
        const rr=b.getBoundingClientRect();
        done.style.left=(rr.right+10)+"px";
        done.style.top=rr.top+"px";
        done.style.width=Math.max(104,rr.width*.92)+"px";
        done.style.height=rr.height+"px";
      }
    }
  },
  tick(){
    if(!this.world)return;
    if(window.StandaloneParkMode?.mode==="story"&&!this.tracking)return;
    const now=performance.now(),active=this.tracking||this.dragState,frameMs=active?33:67;
    if(this._lastTick&&now-this._lastTick<frameMs)return;this._lastTick=now;
    const obj=this.world.object3D;
    if(this.tracking){
      this.el.object3D.updateMatrixWorld(true);this.lastMatrix.copy(this.el.object3D.matrixWorld);
      const p=new THREE.Vector3(),q=new THREE.Quaternion(),s=new THREE.Vector3();this.lastMatrix.decompose(p,q,s);
      this.poseHistory.push({pos:p.clone(),scale:s.clone(),time:now});if(this.poseHistory.length>this.maxPoseHistory)this.poseHistory.shift();
      this.basePos.copy(p);this.baseScale.copy(s);
      if(window.StandaloneParkMode?.mode!=="story"){
        obj.position.copy(p);obj.quaternion.identity();obj.scale.copy(s);obj.updateMatrixWorld(true);this.updateHitPositions();
      }
      return;
    }
    if(this.holding){
      const t=(now-this.holdStart)/1000;
      obj.position.copy(this.basePos);obj.position.x+=Math.sin(t*.95)*.008;obj.position.y+=Math.sin(t*1.35)*.014;
      obj.quaternion.identity();obj.scale.copy(this.baseScale);obj.updateMatrixWorld(true);
      this.updateHitPositions();
    }
  }
});
