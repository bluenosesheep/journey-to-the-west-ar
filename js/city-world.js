
window.ClassroomHandMode = {
  running:false,

  async startPark(){
    const cursor=document.getElementById("classroomHandCursor");
    const status=document.getElementById("classroomHandStatus");

    if(status){
      status.style.display="block";
      status.textContent="手势：启动中…";
    }

    try{
      if(!window.ClassroomHandTracking){
        if(status)status.textContent="手势模块未就绪";
        return;
      }

      if(this.running){
        if(status)status.textContent="手势：PARK";
        return;
      }

      const video=document.querySelector("video");
      if(!video){
        if(status)status.textContent="手势：找不到相机";
        return;
      }

      await window.ClassroomHandTracking.start({
        video,
        cursor,
        mirror:true,
        maxFps:24,
        smoothing:.38,
        pinchDownRatio:.34,
        pinchUpRatio:.44,
        reuseExistingVideo:true,
        onStatus:(msg)=>{
          if(status)status.textContent="手势："+msg;
        },
        onMetrics:(data)=>{
          if(!status)return;
          if(!data.handVisible){
            status.textContent="手势：请伸出一只手";
          }else{
            status.textContent=data.pinching?"手势：抓住":"手势：PARK";
          }
        }
      });

      this.running=true;
      if(status)status.textContent="手势：PARK";
    }catch(err){
      console.error("Classroom hand tracking failed",err);
      if(status)status.textContent="手势启动失败";
    }
  },

  stop(){
    if(window.ClassroomHandTracking){
      window.ClassroomHandTracking.stop({keepVideo:true});
    }
    this.running=false;

    const cursor=document.getElementById("classroomHandCursor");
    const status=document.getElementById("classroomHandStatus");

    if(cursor)cursor.style.display="none";
    if(status)status.style.display="none";
  }
};

// City World state, focus transitions, target gating, and scene navigation.

AFRAME.registerComponent("city-world-controller",{
  init:function(){
    this.world=document.getElementById("cityWorld");
    this.building=document.getElementById("cityBuilding");
    this.park=document.getElementById("cityPark");
    this.market=document.getElementById("cityMarket");
    this.hint=document.getElementById("hint");
    this.backBtn=document.getElementById("sceneBackBtn");
    this.backBtn.addEventListener("click",()=>this.exitToCity());

    // STEP 5: RETURN CITY also accepts a fresh hand pinch through CityInput.
    // We intentionally handle hand input only here so the existing mouse
    // click behavior remains untouched and cannot fire twice.
    window.CityInput.register("city-return",{
      down:(input)=>{
        if(input.source!=="hand")return;
        if(!this.backBtn || this.backBtn.style.display==="none")return;

        const r=this.backBtn.getBoundingClientRect();
        const pad=10;

        if(
          input.x>=r.left-pad && input.x<=r.right+pad &&
          input.y>=r.top-pad && input.y<=r.bottom+pad
        ){
          this.exitToCity();
        }
      }
    });

    window.citySelectedScene=null;
    this.parkInteraction=document.getElementById("parkInteractionWorld");
    this.marketInteraction=document.getElementById("marketInteractionWorld");
    this.hitPark=document.getElementById("hitCityPark");
    this.hitMarket=document.getElementById("hitCityMarket");
    this.camera=null;

    this.hitPark.addEventListener("click",()=>this.focusPark());
    this.hitMarket.addEventListener("click",()=>this.focusMarket());

    this.tracking=false;
    this.lastMatrix=new THREE.Matrix4();

    this.world.object3D.visible=false;

    this.el.addEventListener("targetFound",()=>{
      this.tracking=true;
      document.body.classList.add("city-started");

      // First cold load: do not reveal white a-image planes before PNG textures are ready.
      this.world.object3D.visible=false;
      this.hint.textContent="CITY WORLD · 正在加载场景…";

      window.cityAssetsReady.then(()=>{
        if(!this.world)return;
        this.showWorld();
        this.world.object3D.visible=true;
        this.updateHitPositions();
        this.hint.textContent="CITY WORLD · 点击 PARK 或 MARKET 进入场景";
      });
    });

    this.el.addEventListener("targetLost",()=>{
      // City World stays at the last tracked pose once it has actually been loaded.
      this.tracking=false;
    });
  },

  getCamera:function(){
    if(!this.camera){
      const camEl=document.querySelector("a-camera");
      this.camera=camEl&&camEl.getObject3D("camera");
    }
    return this.camera;
  },

  projectWorld:function(v){
    const cam=this.getCamera();
    if(!cam)return null;
    const p=v.clone().project(cam);
    return{
      x:(p.x*.5+.5)*window.innerWidth,
      y:(-p.y*.5+.5)*window.innerHeight
    };
  },

  updateHitPositions:function(){
    if(!this.world || this.hitPark.style.display==="none")return;

    const obj=this.world.object3D;
    obj.updateMatrixWorld(true);

    const placeHit=(el,local,wUnit,hUnit)=>{
      const p=local.clone().applyMatrix4(obj.matrixWorld);
      const s=this.projectWorld(p);
      if(!s)return;

      const c=this.projectWorld(new THREE.Vector3(0,0,0).applyMatrix4(obj.matrixWorld));
      const r=this.projectWorld(new THREE.Vector3(.5,0,0).applyMatrix4(obj.matrixWorld));
      const u=this.projectWorld(new THREE.Vector3(0,.5,0).applyMatrix4(obj.matrixWorld));
      if(!c||!r||!u)return;

      const px=Math.max(1,Math.abs(r.x-c.x)*2);
      const py=Math.max(1,Math.abs(u.y-c.y)*2);
      const bw=Math.max(90,wUnit*px);
      const bh=Math.max(70,hUnit*py);

      el.style.left=(s.x-bw/2)+"px";
      el.style.top=(s.y-bh/2)+"px";
      el.style.width=bw+"px";
      el.style.height=bh+"px";
    };

    placeHit(this.hitPark,new THREE.Vector3(-.72,-.42,.03),1.20,.82);
    placeHit(this.hitMarket,new THREE.Vector3(.72,-.42,.03),1.20,.82);
  },

  tick:function(){
    if(this.tracking && this.world){
      this.el.object3D.updateMatrixWorld(true);
      this.lastMatrix.copy(this.el.object3D.matrixWorld);

      const p=new THREE.Vector3();
      const q=new THREE.Quaternion();
      const s=new THREE.Vector3();
      this.lastMatrix.decompose(p,q,s);

      const obj=this.world.object3D;
      obj.position.copy(p);
      obj.quaternion.identity();
      obj.scale.copy(s);
      obj.updateMatrixWorld(true);
    }

    this.updateHitPositions();
  },
  exitToCity:function(){
    window.ClassroomHandMode?.stop();
    // Stop Park interaction/hold completely.
    const parkTarget=document.querySelector('[mindar-image-target="targetIndex:1"]');
    const parkComp=parkTarget&&parkTarget.components&&parkTarget.components["park-drag-controller"];
    if(parkComp){
      parkComp.tracking=false;
      parkComp.holding=false;
      if(parkComp.timer){clearTimeout(parkComp.timer);parkComp.timer=null;}
      if(parkComp.dragState)parkComp.dragState=null;
      if(parkComp.hideHits)parkComp.hideHits();
    }

    // Stop Market interaction/hold completely.
    const marketTarget=document.querySelector('[mindar-image-target="targetIndex:2"]');
    const marketComp=marketTarget&&marketTarget.components&&marketTarget.components["market-persist"];
    if(marketComp){
      marketComp.tracking=false;
      marketComp.holding=false;
      if(marketComp.timer){clearTimeout(marketComp.timer);marketComp.timer=null;}
      if(marketComp.hideHoldHits)marketComp.hideHoldHits();
    }

    if(this.parkInteraction)this.parkInteraction.object3D.visible=false;
    if(this.marketInteraction)this.marketInteraction.object3D.visible=false;

    const parkBg=document.getElementById("parkDynamicBackground");
    const marketBg=document.getElementById("marketDynamicBackground");
    if(parkBg)parkBg.object3D.visible=false;
    if(marketBg)marketBg.object3D.visible=false;

    const parkLayer=document.getElementById("parkDragLayer");
    const marketLayer=document.getElementById("marketHoldLayer");
    if(parkLayer)parkLayer.style.display="none";
    if(marketLayer)marketLayer.style.display="none";

    this.showWorld();
    this.hint.textContent="CITY WORLD · 点击 PARK 或 MARKET 进入场景";
  },

  showWorld:function(){
    window.ClassroomHandMode?.stop();
    window.citySelectedScene=null;
    if(this.backBtn)this.backBtn.style.display="none";
    this.setPanel(this.building,"0 0.34 0.02","1 1 1",1);
    this.setPanel(this.park,"-0.72 -0.42 0.03",".78 .78 .78",1);
    this.setPanel(this.market,"0.72 -0.42 0.03",".78 .78 .78",1);
    this.hitPark.style.display="block";
    this.hitMarket.style.display="block";
    if(this.parkInteraction)this.parkInteraction.object3D.visible=false;
    if(this.marketInteraction)this.marketInteraction.object3D.visible=false;

    const parkBg=document.getElementById("parkDynamicBackground");
    const marketBg=document.getElementById("marketDynamicBackground");
    if(parkBg)parkBg.object3D.visible=false;
    if(marketBg)marketBg.object3D.visible=false;
    document.getElementById("parkDragLayer").style.display="none";
    document.getElementById("marketHoldLayer").style.display="none";
    this.updateHitPositions();
  },
  setPanel:function(el,pos,scale,opacity){
    el.object3D.visible=true;

    // Clear old animation components first.
    // Otherwise after returning to Building, the previous Park/Market zoom
    // animation can keep controlling transform/material and the second click
    // appears to do nothing.
    el.removeAttribute("animation__pos");
    el.removeAttribute("animation__scale");
    el.removeAttribute("animation__opacity");

    el.setAttribute("position",pos);
    el.setAttribute("scale",scale);
    el.setAttribute("material","opacity",opacity);
  },
  animatePanel:function(el,pos,scale,opacity){
    el.object3D.visible=true;

    el.removeAttribute("animation__pos");
    el.removeAttribute("animation__scale");
    el.removeAttribute("animation__opacity");

    // Force A-Frame to commit the current transform before creating
    // a fresh animation component for this new transition.
    void el.object3D.position.x;

    el.setAttribute("animation__pos","property: position; to: "+pos+"; dur: 760; easing: easeInOutCubic");
    el.setAttribute("animation__scale","property: scale; to: "+scale+"; dur: 760; easing: easeInOutCubic");
    el.setAttribute("animation__opacity","property: material.opacity; to: "+opacity+"; dur: 450; easing: easeInOutCubic");
    if(opacity===0)setTimeout(()=>{el.object3D.visible=false;},520);
  },
  focusPark:function(){
    window.citySelectedScene="park";
    if(this.backBtn){this.backBtn.style.display="block";alignBackButtonWithHint();}
    this.animatePanel(this.park,"0 0.08 0.03","1.95 1.95 1.95",1);
    this.animatePanel(this.building,"0 0.38 0.01",".8 .8 .8",0);
    this.animatePanel(this.market,"0.72 -0.42 0.01",".7 .7 .7",0);
    this.hitPark.style.display="none";
    this.hitMarket.style.display="none";
    this.hint.textContent="PARK 已放大 · 现在扫描 PARK 识别图";alignBackButtonWithHint();
  },
  activateParkInteraction:function(){
    if(this.backBtn){this.backBtn.style.display="block";alignBackButtonWithHint();}
    if(!this.parkInteraction)return;

    // First shrink the focused Park scene so the transition reads clearly.
    const parkScene=this.park;
    parkScene.object3D.visible=true;
    parkScene.removeAttribute("animation__scale");
    parkScene.removeAttribute("animation__pos");

    parkScene.setAttribute("animation__scale",
      "property:scale;to:.62 .62 .62;dur:520;easing:easeInOutCubic");
    parkScene.setAttribute("animation__pos",
      "property:position;to:-0.62 0.34 -0.15;dur:520;easing:easeInOutCubic");

    // Keep interaction hidden during the shrink.
    this.parkInteraction.object3D.visible=false;
    if(this.marketInteraction)this.marketInteraction.object3D.visible=false;

    const p=document.getElementById("parkDragLayer");
    const m=document.getElementById("marketHoldLayer");
    if(p)p.style.display="none";
    if(m)m.style.display="none";

    // Then reveal the Park interaction.
    setTimeout(()=>{
      // Transition finished: remove the CityWorld Park copy.
      parkScene.object3D.visible=false;

      // Reveal the single dynamic Park mini scene at the tracked Park pose.
      const parkBg=document.getElementById("parkDynamicBackground");
      if(parkBg)parkBg.object3D.visible=true;

      // Then reveal the interaction.
      this.parkInteraction.object3D.visible=true;
      this.parkInteraction.setAttribute("position","0.22 -0.24 0.24");
      this.parkInteraction.setAttribute("scale",".74 .74 .74");

      if(p)p.style.display="block";
      if(m)m.style.display="none";

      window.ClassroomHandMode?.startPark();
    },540);
  },

  activateMarketInteraction:function(){
    if(this.backBtn){this.backBtn.style.display="block";alignBackButtonWithHint();}
    if(!this.marketInteraction)return;

    // First shrink the focused Market scene.
    const marketScene=this.market;
    marketScene.object3D.visible=true;
    marketScene.removeAttribute("animation__scale");
    marketScene.removeAttribute("animation__pos");

    marketScene.setAttribute("animation__scale",
      "property:scale;to:.62 .62 .62;dur:520;easing:easeInOutCubic");
    marketScene.setAttribute("animation__pos",
      "property:position;to:-0.62 0.34 -0.15;dur:520;easing:easeInOutCubic");

    // Keep interaction hidden until the scene has finished shrinking.
    this.marketInteraction.object3D.visible=false;
    if(this.parkInteraction)this.parkInteraction.object3D.visible=false;

    const p=document.getElementById("parkDragLayer");
    const m=document.getElementById("marketHoldLayer");
    if(p)p.style.display="none";
    if(m)m.style.display="none";

    setTimeout(()=>{
      // Transition finished: remove the CityWorld Market copy.
      marketScene.object3D.visible=false;

      // Reveal the single dynamic Market mini scene.
      const marketBg=document.getElementById("marketDynamicBackground");
      if(marketBg)marketBg.object3D.visible=true;

      // Then reveal the interaction.
      this.marketInteraction.object3D.visible=true;
      this.marketInteraction.setAttribute("position","0.24 -0.22 0.22");
      this.marketInteraction.setAttribute("scale",".72 .72 .72");

      if(p)p.style.display="none";
      if(m)m.style.display="block";
    },540);
  },
  focusMarket:function(){
    window.ClassroomHandMode?.stop();
    window.citySelectedScene="market";
    if(this.backBtn){this.backBtn.style.display="block";alignBackButtonWithHint();}

    // Start from a clean state so Market can zoom every time.
    [this.market,this.park,this.building].forEach(el=>{
      if(!el)return;
      el.removeAttribute("animation__pos");
      el.removeAttribute("animation__scale");
      el.removeAttribute("animation__opacity");
      el.object3D.visible=true;
    });

    this.animatePanel(this.market,"0 0 0.03","1.28 1.28 1.28",1);
    this.animatePanel(this.building,"0 0.38 0.01",".8 .8 .8",0);
    this.animatePanel(this.park,"-0.72 -0.42 0.01",".7 .7 .7",0);

    this.hitPark.style.display="none";
    this.hitMarket.style.display="none";
    this.hint.textContent="MARKET 已放大 · 现在扫描 MARKET 识别图";
    alignBackButtonWithHint();
  },


});

AFRAME.registerComponent("city-panel-click",{
  schema:{kind:{type:"string"}},
  init:function(){
    this.el.addEventListener("click",()=>{
      const anchor=document.querySelector('[mindar-image-target="targetIndex:0"]');
      const c=anchor&&anchor.components["city-world-controller"];
      if(!c)return;
      if(this.data.kind==="park")c.focusPark();
      if(this.data.kind==="market")c.focusMarket();
    });
  }
});


AFRAME.registerComponent("scene-background-follow",{
  schema:{
    world:{type:"selector"}
  },

  init:function(){
    this.world=this.data.world;
    this.tracking=false;

    if(this.world){
      this.world.object3D.visible=false;
    }

    this.el.addEventListener("targetFound",()=>{
      const idx=this.el.components["mindar-image-target"]?.data?.targetIndex;

      if(idx===1 && window.citySelectedScene!=="park"){
        this.tracking=false;
        if(this.world)this.world.object3D.visible=false;
        return;
      }

      if(idx===2 && window.citySelectedScene!=="market"){
        this.tracking=false;
        if(this.world)this.world.object3D.visible=false;
        return;
      }

      this.tracking=true;
      // Keep the mini background hidden until the shrink transition finishes.
      if(this.world)this.world.object3D.visible=false;
    });

    this.el.addEventListener("targetLost",()=>{
      // Freeze at the last tracked pose. The interaction controller has
      // its own hold logic; keeping the background at the last pose makes
      // the two remain spatially related instead of jumping elsewhere.
      this.tracking=false;
    });
  },

  tick:function(){
    if(!this.tracking || !this.world)return;

    this.el.object3D.updateMatrixWorld(true);

    const p=new THREE.Vector3();
    const q=new THREE.Quaternion();
    const s=new THREE.Vector3();

    this.el.object3D.matrixWorld.decompose(p,q,s);

    const obj=this.world.object3D;
    obj.position.copy(p);
    obj.quaternion.identity();
    obj.scale.copy(s);
    obj.updateMatrixWorld(true);
  }
});




AFRAME.registerComponent("park-target-events",{init:function(){
  const h=document.getElementById("hint");
  this.el.addEventListener("targetFound",()=>{
    if(window.citySelectedScene!=="park")return;
    clearOtherInteractiveScene("park");
    const city=document.querySelector('[mindar-image-target="targetIndex:0"]')?.components?.["city-world-controller"];
    if(city) city.activateParkInteraction();
    h.textContent="PARK · 可以拖动来布置公园啦！🌳";alignBackButtonWithHint();
  });
}});

AFRAME.registerComponent("market-target-events",{init:function(){
  const h=document.getElementById("hint");
  this.el.addEventListener("targetFound",()=>{
    if(window.citySelectedScene!=="market")return;
    clearOtherInteractiveScene("market");
    const city=document.querySelector('[mindar-image-target="targetIndex:0"]')?.components?.["city-world-controller"];
    if(city) city.activateMarketInteraction();
    h.textContent="MARKET · 选一些东西放进篮筐吧！🧺";alignBackButtonWithHint();
  });
}});
