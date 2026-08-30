
window.DIYSceneRegistry={
  park:{
    targetIndex:1,
    assetBase:"./assets/park/",
    storyImage:"./assets/city/park_scene.png"
  },
  market:{
    targetIndex:2,
    assetBase:"./assets/market/",
    storyImage:"./assets/city/market_scene.png"
  },
  spider:{
    targetIndex:7,
    assetBase:"./assets/spider/"
  }
};

AFRAME.registerComponent("diy-modular-scenes",{
  init(){
    const cfg=window.DIYSceneRegistry;

    // Modules own scene UI and logic. Shared controls remain host-level.
    window.ParkSceneModule.install({
      integrated:true,
      assetBase:cfg.park.assetBase,
      storyImage:cfg.park.storyImage
    });

    window.MarketSceneModule.install({
      integrated:true,
      assetBase:cfg.market.assetBase,
      storyImage:cfg.market.storyImage
    });

    window.SpiderSceneModule.configure({
      integrated:true,
      targetIndex:cfg.spider.targetIndex,
      assetBase:cfg.spider.assetBase,
      mirrorAR:true,
      mirrorHand:true,
      handFps:15,
      sleepMs:3000,
      onActivate(){
        window.DIYSceneManager?.activate("spider");
      },
      onLeave(){
        window.DIYSceneManager?.leaveCurrent();
      }
    });
    window.SpiderSceneModule.ensureUI();
    window.SpiderSceneModule.bindUI();

    // Create WORLDS first so selector schemas like world:#parkWorld
    // resolve correctly when target/controller components initialize.
    const parkWorld=document.createElement("a-entity");
    parkWorld.id="parkWorld";
    parkWorld.setAttribute("visible","false");
    parkWorld.innerHTML=`
      <a-plane id="parkDisplay"
        width="2.15" height="1.43" position="0 0.03 0.02"
        material="shader:flat;src:#parkCanvas;transparent:true;alphaTest:0.01;depthWrite:false;side:double"
        park-canvas></a-plane>
    `;
    this.el.appendChild(parkWorld);

    const marketWorld=document.createElement("a-entity");
    marketWorld.id="marketWorld";
    marketWorld.setAttribute("visible","false");
    marketWorld.innerHTML=`
      <a-plane id="marketDisplay"
        width="2.15" height="1.43" position="0 0.03 0.02"
        material="shader:flat;src:#marketCanvas;transparent:true;alphaTest:0.01;depthWrite:false;side:double"
        market-canvas></a-plane>

      <a-plane class="clickable" pick-item="kind:peach"
        position="-0.38 0.35 0.10" width="0.58" height="0.58"
        material="color:#fff;opacity:0.01;transparent:true;depthWrite:false;side:double"></a-plane>
      <a-plane class="clickable" pick-item="kind:cabbage"
        position="0 0.38 0.10" width="0.58" height="0.58"
        material="color:#fff;opacity:0.01;transparent:true;depthWrite:false;side:double"></a-plane>
      <a-plane class="clickable" pick-item="kind:egg"
        position="0.38 0.35 0.10" width="0.58" height="0.58"
        material="color:#fff;opacity:0.01;transparent:true;depthWrite:false;side:double"></a-plane>
      <a-plane class="clickable" position="0 -0.62 0.14"
        width="0.74" height="0.30"
        material="color:#fff;opacity:0.01;transparent:true;depthWrite:false;side:double"
        reset-market></a-plane>
    `;
    this.el.appendChild(marketWorld);

    const spiderWorld=document.createElement("a-entity");
    spiderWorld.id="spiderWorld";
    spiderWorld.setAttribute("visible","false");
    spiderWorld.innerHTML=`
      <a-plane id="spiderDisplay"
        width="2.15" height="2.15" position="0 0.03 0.02"
        material="shader:flat;src:#spiderCanvas;transparent:true;alphaTest:0.01;depthWrite:false;side:double"
        spider-canvas></a-plane>
    `;
    this.el.appendChild(spiderWorld);

    // Then create recognition targets/controllers.
    const parkTarget=document.createElement("a-entity");
    parkTarget.setAttribute("mindar-image-target",`targetIndex:${cfg.park.targetIndex}`);
    parkTarget.setAttribute("diy-scene-trigger","kind:park");
    parkTarget.setAttribute("park-drag-controller","world:#parkWorld");
    this.el.appendChild(parkTarget);

    const marketTarget=document.createElement("a-entity");
    marketTarget.setAttribute("mindar-image-target",`targetIndex:${cfg.market.targetIndex}`);
    marketTarget.setAttribute("diy-scene-trigger","kind:market");
    marketTarget.setAttribute("market-persist","world:#marketWorld");
    this.el.appendChild(marketTarget);

    const spiderTarget=document.createElement("a-entity");
    spiderTarget.setAttribute("mindar-image-target",`targetIndex:${cfg.spider.targetIndex}`);
    spiderTarget.setAttribute("spider-controller","world:#spiderWorld");
    this.el.appendChild(spiderTarget);
  }
});
