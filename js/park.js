// Park renderer and drag interaction.

AFRAME.registerComponent("park-canvas",{
  init:function(){
    this.c=document.getElementById("parkInteractiveCanvas");
    this.ctx=this.c.getContext("2d");

    this.initial={
      tree:{x:245,y:120},
      flower:{x:335,y:120},
      bench:{x:435,y:120},
      fountain:{x:530,y:120}
    };

    this.items={
      tree:{emoji:window.CityAssetConfig.park.tree.emoji,x:245,y:120,scale:1.55},
      flower:{emoji:window.CityAssetConfig.park.flower.emoji,x:335,y:120,scale:.58},
      bench:{emoji:window.CityAssetConfig.park.bench.emoji,x:435,y:120,scale:.72},
      fountain:{emoji:window.CityAssetConfig.park.fountain.emoji,x:530,y:120,scale:1.08}
    };
  },

  setPosition:function(kind,x,y){
    const item=this.items[kind];
    if(!item)return;

    // Keep objects inside the usable park area.
    item.x=Math.max(90,Math.min(678,x));
    item.y=Math.max(85,Math.min(430,y));
  },

  reset:function(){
    Object.entries(this.initial).forEach(([k,p])=>{
      this.items[k].x=p.x;
      this.items[k].y=p.y;
    });
    document.getElementById("hint").textContent="PARK · 拖动这些东西来布置公园吧！🌳";
  },

  tick:function(){
    const ctx=this.ctx,c=this.c,w=c.width,h=c.height;
    ctx.clearRect(0,0,w,h);
    ctx.textAlign="center";
    ctx.textBaseline="middle";

    // Light park environment, while keeping the camera visible behind it.
    // 1) soft grass island
    ctx.save();
    ctx.fillStyle="rgba(126,181,92,.24)";
    ctx.beginPath();
    ctx.ellipse(w/2,390,245,74,0,0,Math.PI*2);
    ctx.fill();

    // 2) a subtle curved walking path
    ctx.strokeStyle="rgba(210,180,125,.46)";
    ctx.lineWidth=30;
    ctx.lineCap="round";
    ctx.beginPath();
    ctx.moveTo(205,425);
    ctx.bezierCurveTo(290,350,455,455,565,370);
    ctx.stroke();

    // soft highlight inside the path
    ctx.strokeStyle="rgba(255,244,211,.34)";
    ctx.lineWidth=12;
    ctx.beginPath();
    ctx.moveTo(205,425);
    ctx.bezierCurveTo(290,350,455,455,565,370);
    ctx.stroke();

    // 3) tiny grass tufts
    ctx.font='30px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
    ctx.globalAlpha=.72;
    ctx.fillText(window.CityAssetConfig.park.sprout.emoji,175,385);
    ctx.fillText(window.CityAssetConfig.park.sprout.emoji,585,410);
    ctx.fillText(window.CityAssetConfig.park.sprout.emoji,305,430);
    ctx.restore();

    // 4) butterfly flies clearly back and forth across the park.
    const bt=performance.now()/1000;
    const travel=(Math.sin(bt*.72)+1)/2; // 0 -> 1 -> 0
    const butterflyX=185+travel*395;
    const butterflyY=245+Math.sin(bt*1.55)*16;
    const butterflyScale=.86+.10*Math.sin(bt*3.1);

    ctx.save();
    ctx.globalAlpha=.86;
    ctx.translate(butterflyX,butterflyY);
    ctx.scale(butterflyScale,butterflyScale);
    ctx.font='38px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
    ctx.fillText(window.CityAssetConfig.park.butterfly.emoji,0,0);
    ctx.restore();

    // Draw movable items.
    Object.values(this.items).forEach(item=>{
      ctx.save();
      ctx.translate(item.x,item.y);
      ctx.scale(item.scale||1,item.scale||1);
      ctx.font='92px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
      ctx.fillText(item.emoji,0,0);
      ctx.restore();
    });

    // RESET button.
    const bx=w/2-86,by=458,bw=172,bh=40,br=20;
    ctx.save();
    roundRect(ctx,bx,by,bw,bh,br);
    ctx.fillStyle="rgba(255,248,220,.96)";
    ctx.fill();
    ctx.lineWidth=3;
    ctx.strokeStyle="#6f8e42";
    ctx.stroke();
    ctx.fillStyle="#56713b";
    ctx.font='700 20px system-ui,sans-serif';
    ctx.fillText("RESET",w/2,by+bh/2+1);
    ctx.restore();

    const mesh=this.el.getObject3D("mesh");
    if(mesh&&mesh.material&&mesh.material.map){
      mesh.material.map.needsUpdate=true;
    }
  }
});

AFRAME.registerComponent("park-drag-controller",{
  schema:{
    seconds:{type:"number",default:15},
    world:{type:"selector"}
  },

  init:function(){
    this.world=this.data.world;
    this.tracking=false;
    this.holding=false;
    this.timer=null;
    this.holdStart=0;

    this.lastMatrix=new THREE.Matrix4();
    this.basePos=new THREE.Vector3();
    this.baseQuat=new THREE.Quaternion();
    this.baseScale=new THREE.Vector3(1,1,1);
    this.poseHistory=[];
    this.maxPoseHistory=24;

    this.planeWidth=2.15;
    this.planeHeight=1.43;
    this.canvasW=768;
    this.canvasH=512;

    this.hits={
      tree:document.getElementById("parkDragTree"),
      flower:document.getElementById("parkDragFlower"),
      bench:document.getElementById("parkDragBench"),
      fountain:document.getElementById("parkDragFountain"),
      reset:document.getElementById("parkDragReset")
    };

    this.dragState=null;

    // STEP 3: Park receives normalized input from CityInput.
    // Mouse and future hand tracking share these same callbacks.
    window.CityInput.register("park",{
      down:(input)=>this.handleInputDown(input),
      move:(input)=>this.handleInputMove(input),
      up:(input)=>this.handleInputUp(input),
      cancel:(input)=>this.handleInputUp(input)
    });

    if(this.world)this.world.object3D.visible=false;

    this.el.addEventListener("targetFound",()=>{
      if(window.citySelectedScene!=="park"){
        this.tracking=false;
        this.holding=false;
        if(this.world)this.world.object3D.visible=false;
        this.hideHits();
        return;
      }

      this.tracking=true;
      this.holding=false;
      this.poseHistory=[];

      if(this.timer){
        clearTimeout(this.timer);
        this.timer=null;
      }

      if(this.world)this.world.object3D.visible=true;
      this.showHits();
    });

    this.el.addEventListener("targetLost",()=>{
      if(window.citySelectedScene!=="park")return;

      this.tracking=false;
      this.holding=true;
      this.holdStart=performance.now();

      if(this.world){
        const obj=this.world.object3D;
        let stable=null;
        const now=performance.now();

        for(let i=this.poseHistory.length-1;i>=0;i--){
          if(now-this.poseHistory[i].time>=280){
            stable=this.poseHistory[i];
            break;
          }
        }

        if(!stable&&this.poseHistory.length){
          stable=this.poseHistory[0];
        }

        if(stable){
          this.basePos.copy(stable.pos);
          this.baseQuat.copy(stable.quat);
          this.baseScale.copy(stable.scale);

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

      this.showHits();
      this.updateHitPositions();

      if(this.timer){clearTimeout(this.timer);this.timer=null;}
      // Manual-exit mode: keep Park interaction visible until RETURN CITY is tapped.
    });
  },

  getCanvasComp:function(){
    return document.getElementById("parkInteractiveDisplay")?.components?.["park-canvas"];
  },

  getCamera:function(){
    if(!this.camera){
      const e=document.querySelector("a-camera");
      this.camera=e&&e.getObject3D("camera");
    }
    return this.camera;
  },

  projectWorld:function(v){
    const cam=this.getCamera();
    if(!cam)return null;
    const p=v.clone().project(cam);
    return{
      x:(p.x*.5+.5)*innerWidth,
      y:(-p.y*.5+.5)*innerHeight
    };
  },

  canvasToLocal:function(x,y){
    return new THREE.Vector3(
      (x/this.canvasW-.5)*this.planeWidth,
      (.5-y/this.canvasH)*this.planeHeight,
      .10
    );
  },

  getScreenScale:function(){
    if(!this.world)return null;
    const obj=this.world.object3D;
    obj.updateMatrixWorld(true);

    const c=this.projectWorld(new THREE.Vector3(0,0,0).applyMatrix4(obj.matrixWorld));
    const r=this.projectWorld(new THREE.Vector3(.5,0,0).applyMatrix4(obj.matrixWorld));
    const u=this.projectWorld(new THREE.Vector3(0,.5,0).applyMatrix4(obj.matrixWorld));

    if(!c||!r||!u)return null;

    return{
      pxPerUnitX:Math.max(1,Math.abs(r.x-c.x)*2),
      pxPerUnitY:Math.max(1,Math.abs(u.y-c.y)*2)
    };
  },

  hitKindAt:function(x,y,source){
    // RESET is intentionally forgiving for hand input.
    // A child should not need pixel-perfect pinch accuracy on a classroom display.
    const resetEl=this.hits.reset;
    if(resetEl && resetEl.style.display!=="none"){
      const r=resetEl.getBoundingClientRect();
      const pad=source==="hand"?28:8;
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
      if(x>=r.left && x<=r.right && y>=r.top && y<=r.bottom){
        return kind;
      }
    }
    return null;
  },

  handleInputDown:function(input){
    if(window.citySelectedScene!=="park")return;

    const kind=this.hitKindAt(input.x,input.y,input.source);
    if(!kind)return;

    if(input.nativeEvent)input.nativeEvent.preventDefault();

    if(kind==="reset"){
      const comp=this.getCanvasComp();
      if(comp)comp.reset();
      document.getElementById("hint").textContent="PARK · 已恢复初始位置 🌳";
      return;
    }

    this.startDragInput(input,kind);
  },

  startDragInput:function(input,kind){
    const comp=this.getCanvasComp();
    const scale=this.getScreenScale();
    if(!comp||!scale)return;

    const item=comp.items[kind];
    if(!item)return;

    this.dragState={
      pointerId:input.pointerId,
      source:input.source,
      kind,
      startScreenX:input.x,
      startScreenY:input.y,
      startCanvasX:item.x,
      startCanvasY:item.y,
      pxPerUnitX:scale.pxPerUnitX,
      pxPerUnitY:scale.pxPerUnitY
    };

    document.getElementById("hint").textContent="拖到你喜欢的位置！";
  },

  handleInputMove:function(input){
    if(!this.dragState)return;
    if(this.dragState.pointerId!==input.pointerId)return;

    if(input.nativeEvent)input.nativeEvent.preventDefault();

    const comp=this.getCanvasComp();
    if(!comp)return;

    const dx=input.x-this.dragState.startScreenX;
    const dy=input.y-this.dragState.startScreenY;

    const screenPxPerCanvasX=(this.dragState.pxPerUnitX*this.planeWidth)/this.canvasW;
    const screenPxPerCanvasY=(this.dragState.pxPerUnitY*this.planeHeight)/this.canvasH;

    const canvasDx=dx/Math.max(.001,screenPxPerCanvasX);
    const canvasDy=dy/Math.max(.001,screenPxPerCanvasY);

    comp.setPosition(
      this.dragState.kind,
      this.dragState.startCanvasX+canvasDx,
      this.dragState.startCanvasY+canvasDy
    );

    this.updateHitPositions();
  },

  handleInputUp:function(input){
    if(!this.dragState)return;
    if(this.dragState.pointerId!==input.pointerId)return;

    this.dragState=null;
    document.getElementById("hint").textContent="PARK · 继续拖动来布置公园吧！🌳";
  },

  showHits:function(){
    Object.values(this.hits).forEach(b=>b.style.display="block");
  },

  hideHits:function(){
    Object.values(this.hits).forEach(b=>b.style.display="none");
  },

  updateHitPositions:function(){
    if(!this.world)return;

    const comp=this.getCanvasComp();
    if(!comp)return;

    const obj=this.world.object3D;
    obj.updateMatrixWorld(true);

    const scale=this.getScreenScale();
    if(!scale)return;

    const baseSizePx=Math.max(52,.46*scale.pxPerUnitX);

    Object.entries(comp.items).forEach(([kind,item])=>{
      const local=this.canvasToLocal(item.x,item.y);
      const world=local.applyMatrix4(obj.matrixWorld);
      const s=this.projectWorld(world);
      if(!s)return;

      const b=this.hits[kind];
      const visualScale=item.scale||1;
      const sizePx=baseSizePx*Math.max(.85,visualScale);
      b.style.left=(s.x-sizePx/2)+"px";
      b.style.top=(s.y-sizePx/2)+"px";
      b.style.width=sizePx+"px";
      b.style.height=sizePx+"px";
    });

    const resetLocal=this.canvasToLocal(this.canvasW/2,478);
    const resetWorld=resetLocal.applyMatrix4(obj.matrixWorld);
    const rs=this.projectWorld(resetWorld);

    if(rs){
      // Larger RESET hit area for classroom hand gestures.
      const bw=Math.max(132,1.02*scale.pxPerUnitX);
      const bh=Math.max(60,.42*scale.pxPerUnitY);
      this.hits.reset.style.left=(rs.x-bw/2)+"px";
      this.hits.reset.style.top=(rs.y-bh/2)+"px";
      this.hits.reset.style.width=bw+"px";
      this.hits.reset.style.height=bh+"px";
    }
  },

  tick:function(){
    if(!this.world)return;

    const obj=this.world.object3D;

    if(this.tracking){
      this.el.object3D.updateMatrixWorld(true);
      this.lastMatrix.copy(this.el.object3D.matrixWorld);

      const p=new THREE.Vector3();
      const q=new THREE.Quaternion();
      const s=new THREE.Vector3();
      this.lastMatrix.decompose(p,q,s);

      this.poseHistory.push({
        pos:p.clone(),
        quat:q.clone(),
        scale:s.clone(),
        time:performance.now()
      });

      if(this.poseHistory.length>this.maxPoseHistory){
        this.poseHistory.shift();
      }

      obj.position.copy(p);
      obj.quaternion.identity();
      obj.scale.copy(s);
      obj.updateMatrixWorld(true);

      this.updateHitPositions();
      return;
    }

    if(this.holding){
      const t=(performance.now()-this.holdStart)/1000;

      const bob=Math.sin(t*1.35)*.014;
      const sway=Math.sin(t*.95)*.008;
      const roll=Math.sin(t*1.05)*THREE.MathUtils.degToRad(.8);

      obj.position.copy(this.basePos);
      obj.position.x+=sway;
      obj.position.y+=bob;

      const qr=new THREE.Quaternion()
        .setFromAxisAngle(new THREE.Vector3(0,0,1),roll);

      obj.quaternion.identity().multiply(qr);
      obj.scale.copy(this.baseScale);
      obj.updateMatrixWorld(true);

      this.updateHitPositions();
    }
  }
});
