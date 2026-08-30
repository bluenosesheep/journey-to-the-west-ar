/*
 * DIY Scene Adapter v2.1
 *
 * Stable Park / Market / Spider module files are NOT modified.
 * This adapter fixes integrated-host conflicts by:
 *  - keeping only ONE shared CAMERA / INTERACT / cursor / hint UI
 *  - preventing Park standalone listeners from owning the shared INTERACT button
 *  - mounting A-Frame worlds before controllers
 *  - delaying target/controller creation one frame so scene components are ready
 */
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

window.DIYSceneAdapter={
  mounted:false,

  removeModuleSharedDuplicates(moduleRootId){
    const root=document.getElementById(moduleRootId);
    if(!root)return;
    ["cameraOrientationControl","handBtn","handStatus","handCursor","hint"].forEach(id=>{
      const el=root.querySelector(`#${id}`);
      if(el)el.remove();
    });
  },

  mountSceneUI(){
    const cfg=window.DIYSceneRegistry;

    // PARK stable module: configure paths + let it create only its scene UI.
    window.ParkSceneModule?.configure?.({
      assetBase:cfg.park.assetBase,
      storyImage:cfg.park.storyImage
    });
    window.ParkSceneModule?.mountUI?.({
      assetBase:cfg.park.assetBase,
      storyImage:cfg.park.storyImage
    });
    this.removeModuleSharedDuplicates("parkModuleUI");

    // MARKET stable module.
    window.MarketSceneModule?.configure?.({
      assetBase:cfg.market.assetBase,
      storyImage:cfg.market.storyImage,
      integrated:true
    });
    window.MarketSceneModule?.mountUI?.({
      assetBase:cfg.market.assetBase,
      storyImage:cfg.market.storyImage,
      integrated:true
    });
    this.removeModuleSharedDuplicates("marketModuleUI");

    // SPIDER stable module already checks for existing shared controls.
    window.SpiderSceneModule?.configure?.({
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
    window.SpiderSceneModule?.ensureUI?.();
    window.SpiderSceneModule?.bindUI?.();
  },

  bindSceneButtons(){
    const bindOnce=(id,key,fn)=>{
      const el=document.getElementById(id);
      if(!el||el.dataset[key])return;
      el.dataset[key]="1";
      el.addEventListener("click",fn);
    };

    bindOnce("fixParkBtn","diyAdapter",()=>window.StandaloneParkMode?.enterFix());
    bindOnce("doneParkBtn","diyAdapter",()=>window.StandaloneParkMode?.finishFix());
    bindOnce("shopBtn","diyAdapter",()=>window.StandaloneMarketMode?.enterShop());
    bindOnce("checkoutBtn","diyAdapter",()=>window.StandaloneMarketMode?.checkout());

    if(window.CityInput&&!window.CityInput.__diyAdapterSleepBound){
      window.CityInput.__diyAdapterSleepBound=true;

      window.CityInput.register("diy-park-hand-auto-sleep",{
        down:(input)=>{if(input.source==="hand")window.StandaloneHandMode?.noteInteraction()},
        up:(input)=>{if(input.source==="hand")window.StandaloneHandMode?.noteInteraction()}
      });

      window.CityInput.register("diy-market-hand-auto-sleep",{
        down:(input)=>{if(input.source==="hand")window.StandaloneMarketHandMode?.noteInteraction()},
        up:(input)=>{if(input.source==="hand")window.StandaloneMarketHandMode?.noteInteraction()}
      });
    }
  },

  createWorlds(scene){
    const parkWorld=document.createElement("a-entity");
    parkWorld.id="parkWorld";
    parkWorld.setAttribute("visible","false");
    scene.appendChild(parkWorld);

    const parkDisplay=document.createElement("a-plane");
    parkDisplay.id="parkDisplay";
    parkDisplay.setAttribute("width","2.15");
    parkDisplay.setAttribute("height","1.43");
    parkDisplay.setAttribute("position","0 0.03 0.02");
    parkDisplay.setAttribute("material","shader:flat;src:#parkCanvas;transparent:true;alphaTest:0.01;depthWrite:false;side:double");
    parkDisplay.setAttribute("park-canvas","");
    parkWorld.appendChild(parkDisplay);

    const marketWorld=document.createElement("a-entity");
    marketWorld.id="marketWorld";
    marketWorld.setAttribute("visible","false");
    scene.appendChild(marketWorld);

    const marketDisplay=document.createElement("a-plane");
    marketDisplay.id="marketDisplay";
    marketDisplay.setAttribute("width","2.15");
    marketDisplay.setAttribute("height","1.43");
    marketDisplay.setAttribute("position","0 0.03 0.02");
    marketDisplay.setAttribute("material","shader:flat;src:#marketCanvas;transparent:true;alphaTest:0.01;depthWrite:false;side:double");
    marketDisplay.setAttribute("market-canvas","");
    marketWorld.appendChild(marketDisplay);

    const marketParts=[
      ["peach","-0.38 0.35 0.10","0.58","0.58"],
      ["cabbage","0 0.38 0.10","0.58","0.58"],
      ["egg","0.38 0.35 0.10","0.58","0.58"]
    ];
    marketParts.forEach(([kind,pos,w,h])=>{
      const el=document.createElement("a-plane");
      el.classList.add("clickable");
      el.setAttribute("pick-item",`kind:${kind}`);
      el.setAttribute("position",pos);
      el.setAttribute("width",w);
      el.setAttribute("height",h);
      el.setAttribute("material","color:#fff;opacity:0.01;transparent:true;depthWrite:false;side:double");
      marketWorld.appendChild(el);
    });

    const reset=document.createElement("a-plane");
    reset.classList.add("clickable");
    reset.setAttribute("position","0 -0.62 0.14");
    reset.setAttribute("width","0.74");
    reset.setAttribute("height","0.30");
    reset.setAttribute("material","color:#fff;opacity:0.01;transparent:true;depthWrite:false;side:double");
    reset.setAttribute("reset-market","");
    marketWorld.appendChild(reset);

    const spiderWorld=document.createElement("a-entity");
    spiderWorld.id="spiderWorld";
    spiderWorld.setAttribute("visible","false");
    scene.appendChild(spiderWorld);

    const spiderDisplay=document.createElement("a-plane");
    spiderDisplay.id="spiderDisplay";
    spiderDisplay.setAttribute("width","2.15");
    spiderDisplay.setAttribute("height","2.15");
    spiderDisplay.setAttribute("position","0 0.03 0.02");
    spiderDisplay.setAttribute("material","shader:flat;src:#spiderCanvas;transparent:true;alphaTest:0.01;depthWrite:false;side:double");
    spiderDisplay.setAttribute("spider-canvas","");
    spiderWorld.appendChild(spiderDisplay);
  },

  createTargets(scene){
    const cfg=window.DIYSceneRegistry;

    const parkTarget=document.createElement("a-entity");
    parkTarget.setAttribute("mindar-image-target",`targetIndex:${cfg.park.targetIndex}`);
    parkTarget.setAttribute("diy-scene-trigger","kind:park");
    parkTarget.setAttribute("park-drag-controller","world:#parkWorld");
    scene.appendChild(parkTarget);

    const marketTarget=document.createElement("a-entity");
    marketTarget.setAttribute("mindar-image-target",`targetIndex:${cfg.market.targetIndex}`);
    marketTarget.setAttribute("diy-scene-trigger","kind:market");
    marketTarget.setAttribute("market-persist","world:#marketWorld");
    scene.appendChild(marketTarget);

    const spiderTarget=document.createElement("a-entity");
    spiderTarget.setAttribute("mindar-image-target",`targetIndex:${cfg.spider.targetIndex}`);
    spiderTarget.setAttribute("spider-controller","world:#spiderWorld");
    scene.appendChild(spiderTarget);
  },

  sanitizeSharedInteractAfterDOMContentLoaded(){
    /*
      Park stable standalone registers a DOMContentLoaded handler that attaches
      StandaloneHandMode.toggle() directly to #handBtn. In integrated DIY that
      would fight DIYSceneManager.handToggle() and can start two hand modes.

      We cannot edit the stable Park file, so after all DOMContentLoaded handlers
      have run, replace the shared button with a clean clone and bind ONLY the
      unified DIY dispatcher.
    */
    setTimeout(()=>{
      const old=document.getElementById("handBtn");
      if(!old)return;

      const clean=old.cloneNode(true);
      clean.removeAttribute("data-park-bound");
      clean.removeAttribute("data-adapter-bound");
      old.replaceWith(clean);

      clean.addEventListener("click",()=>window.DIYSceneManager?.handToggle());
    },0);
  },

  mount(scene){
    if(this.mounted)return;
    this.mounted=true;

    this.mountSceneUI();
    this.bindSceneButtons();
    this.createWorlds(scene);

    // Give A-Frame one frame to initialize park-canvas/market-canvas/spider-canvas
    // before selector-based controllers are attached.
    requestAnimationFrame(()=>{
      this.createTargets(scene);
    });

    if(document.readyState==="loading"){
      document.addEventListener("DOMContentLoaded",
        ()=>this.sanitizeSharedInteractAfterDOMContentLoaded(),
        {once:true}
      );
    }else{
      this.sanitizeSharedInteractAfterDOMContentLoaded();
    }
  }
};

AFRAME.registerComponent("diy-scene-adapter",{
  init(){
    window.DIYSceneAdapter.mount(this.el);
  }
});
