// Market renderer and basket interaction.

AFRAME.registerComponent("market-canvas",{
  init:function(){
    // Formal Market artwork: peach PNG replaces peach emoji only.
    this.peachImage=new Image();
    this.peachImage.src="./assets/market/peach.png?v=1";
    this.cabbageImage=new Image();
    this.cabbageImage.src="./assets/market/cabbage.png?v=1";

    this.c=document.getElementById("marketInteractiveCanvas");
    this.ctx=this.c.getContext("2d");
    this.items={
      peach:{emoji:window.CityAssetConfig.market.peach.emoji,x:250,y:135,tx:348,ty:320,selected:false,start:0},
      cabbage:{emoji:window.CityAssetConfig.market.cabbage.emoji,x:384,y:118,tx:384,ty:312,selected:false,start:0},
      egg:{emoji:window.CityAssetConfig.market.egg.emoji,x:518,y:135,tx:420,ty:320,selected:false,start:0}
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
    Object.values(this.items).forEach(item=>{
      item.selected=false;
      item.start=0;
    });
    document.getElementById("hint").textContent="MARKET · 点一个食物放进篮筐吧！🧺";
  },
  tick:function(){
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

      ctx.save();
      ctx.translate(x,y);
      ctx.scale(s,s);

      if(
        kind==="peach" &&
        this.peachImage &&
        this.peachImage.complete &&
        this.peachImage.naturalWidth>0
      ){
        const pw=96;
        const ph=96;
        ctx.drawImage(this.peachImage,-pw/2,-ph/2,pw,ph);
      }else if(
        kind==="cabbage" &&
        this.cabbageImage &&
        this.cabbageImage.complete &&
        this.cabbageImage.naturalWidth>0
      ){
        const cw=96;
        const ch=96;
        ctx.drawImage(this.cabbageImage,-cw/2,-ch/2,cw,ch);
      }else{
        ctx.font='96px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
        ctx.fillText(item.emoji,0,0);
      }

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

    // Friendly rounded RESET button with more space below the basket.
    const bx=w/2-86, by=458, bw=172, bh=40, br=20;
    ctx.save();
    roundRect(ctx,bx,by,bw,bh,br);
    ctx.fillStyle="rgba(255,248,220,.96)";
    ctx.fill();
    ctx.lineWidth=3;
    ctx.strokeStyle="#6f8e42";
    ctx.stroke();

    ctx.fillStyle="#8f2f2a";
    ctx.font='700 20px system-ui, sans-serif';
    ctx.textAlign="center";
    ctx.textBaseline="middle";
    ctx.fillText("RESET",w/2,by+bh/2+1);
    ctx.restore();

    const mesh=this.el.getObject3D("mesh");
    if(mesh&&mesh.material&&mesh.material.map)mesh.material.map.needsUpdate=true;
  }
});


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
      peach:document.getElementById("marketHoldPeach"),
      cabbage:document.getElementById("marketHoldCabbage"),
      egg:document.getElementById("marketHoldEgg"),
      reset:document.getElementById("marketHoldReset")
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

    const comp=()=>document.getElementById("marketInteractiveDisplay")?.components?.["market-canvas"];

    // STEP 3: Market receives normalized input from CityInput.
    window.CityInput.register("market",{
      down:(input)=>this.handleInputDown(input)
    });

    if(this.world){
      this.world.object3D.visible=false;
    }

    this.el.addEventListener("targetFound",()=>{
      if(window.citySelectedScene!=="market"){
        this.tracking=false;
        this.holding=false;
        if(this.world)this.world.object3D.visible=false;
        this.hideHoldHits();
        return;
      }

      this.tracking=true;
      this.holding=false;
      this.poseHistory=[];
      this.hideHoldHits();

      if(this.timer){
        clearTimeout(this.timer);
        this.timer=null;
      }

      if(this.world){
        this.world.object3D.visible=true;
      }
    });

    this.el.addEventListener("targetLost",()=>{
      if(window.citySelectedScene!=="market")return;

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
          obj.quaternion.identity();
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
      this.updateHoldHits();
      this.showHoldHits();

      if(this.timer){clearTimeout(this.timer);this.timer=null;}
      // Manual-exit mode: keep Market interaction visible until RETURN CITY is tapped.
    });
  },

  hitKindAt:function(x,y,source){
    // RESET gets a small dedicated hand margin and is checked first.
    const resetEl=this.hits.reset;
    if(resetEl && resetEl.style.display!=="none"){
      const r=resetEl.getBoundingClientRect();
      const pad=source==="hand"?10:4;
      if(
        x>=r.left-pad && x<=r.right+pad &&
        y>=r.top-pad && y<=r.bottom+pad
      ){
        return "reset";
      }
    }

    for(const [kind,el] of Object.entries(this.hits)){
      if(kind==="reset")continue;
      if(!el || el.style.display==="none")continue;
      const r=el.getBoundingClientRect();
      const pad=source==="hand"?8:0;
      if(
        x>=r.left-pad && x<=r.right+pad &&
        y>=r.top-pad && y<=r.bottom+pad
      ){
        return kind;
      }
    }
    return null;
  },

  handleInputDown:function(input){
    if(window.citySelectedScene!=="market")return;
    if(input.source==="hand" && !window.ClassroomActivityMode?.isInteract())return;

    const kind=this.hitKindAt(input.x,input.y,input.source);
    if(!kind)return;

    if(input.nativeEvent)input.nativeEvent.preventDefault();

    const comp=document.getElementById("marketInteractiveDisplay")
      ?.components?.["market-canvas"];
    if(!comp)return;

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
      x:(p.x*0.5+0.5)*window.innerWidth,
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
      const bw=Math.max(key==="reset"?104:58,wu*pxPerUnitX);
      const bh=Math.max(key==="reset"?50:58,hu*pxPerUnitY);

      const b=this.hits[key];
      b.style.left=(screen.x-bw/2)+"px";
      b.style.top=(screen.y-bh/2)+"px";
      b.style.width=bw+"px";
      b.style.height=bh+"px";
    });
  },

  showHoldHits:function(){
    Object.values(this.hits).forEach(b=>b.style.display="block");
  },

  hideHoldHits:function(){
    Object.values(this.hits).forEach(b=>b.style.display="none");
  },

  tick:function(){
    if(!this.world)return;

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

      obj.position.copy(pos);
      obj.quaternion.identity();
      obj.scale.copy(scale);
      obj.updateMatrixWorld(true);
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
      obj.quaternion.identity().multiply(qRoll);
      obj.scale.copy(this.baseScale);
      obj.updateMatrixWorld(true);

      // Keep the HTML tap zones exactly on top of the gently moving AR UI.
      this.updateHoldHits();
    }
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
