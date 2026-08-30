/*
 * Building Scene Module v1
 * Source of truth: uploaded working building(2).html.
 * Owns Building UI and far/near behavior.
 */
window.BuildingSceneModule = window.BuildingSceneModule || {
  assetBase:"../../assets/city/",
  ids:{
    mini:"storyCityMini",
    switch:"modeSwitch",
    far:"farBtn",
    near:"nearBtn",
    hint:"hint"
  },

  configure(options={}){
    if(options.assetBase!==undefined)this.assetBase=options.assetBase;
    if(options.ids)Object.assign(this.ids,options.ids);
    if(!this.assetBase.endsWith("/"))this.assetBase+="/";
    return this;
  },

  asset(name){ return this.assetBase + name; },

  mountUI(options={}){
    this.configure(options);
    if(document.getElementById(this.ids.mini))return;

    const host=document.createElement("div");
    host.id="buildingModuleUI";
    host.innerHTML=`
      <div id="${this.ids.mini}" hidden style="display:none;opacity:0">
        <img class="mini-building" src="${this.asset("building_scene.png")}" alt="">
        <img class="mini-park" src="${this.asset("park_scene.png")}" alt="">
        <img class="mini-market" src="${this.asset("market_scene.png")}" alt="">
      </div>

      <div id="${this.ids.switch}">
        <button id="${this.ids.far}" class="active">🌆 远景</button>
        <button id="${this.ids.near}">🔎 近景</button>
      </div>
    `;
    document.body.appendChild(host);
  },

  bindUI(targetSelector="[standalone-city]"){
    const getComp=()=>document.querySelector(targetSelector)?.components?.["standalone-city"];

    const far=document.getElementById(this.ids.far);
    const near=document.getElementById(this.ids.near);

    if(far&&!far.dataset.buildingBound){
      far.dataset.buildingBound="1";
      far.addEventListener("click",()=>getComp()?.enterFar());
    }

    if(near&&!near.dataset.buildingBound){
      near.dataset.buildingBound="1";
      near.addEventListener("click",()=>getComp()?.enterNear());
    }
  },

  install(options={}){
    this.mountUI(options);
    this.bindUI(options.targetSelector||"[standalone-city]");
  }
};

window.cityAssetsReady=Promise.all([
  window.BuildingSceneModule.asset("building_scene.png"),window.BuildingSceneModule.asset("park_scene.png"),window.BuildingSceneModule.asset("market_scene.png")
].map(src=>new Promise(resolve=>{
  const i=new Image();i.onload=()=>resolve();i.onerror=()=>resolve();i.src=src;
})));

AFRAME.registerComponent("standalone-city",{
  init(){
    this.world=document.getElementById("cityWorld");
    this.building=document.getElementById("cityBuilding");
    this.park=document.getElementById("cityPark");
    this.market=document.getElementById("cityMarket");
    this.lastMatrix=new THREE.Matrix4();
    this.mode="far";
    this.tracking=false;
    this.world.object3D.visible=false;

    this.el.addEventListener("targetFound",()=>{
      this.tracking=true;
      this.el.object3D.updateMatrixWorld(true);
      this.lastMatrix.copy(this.el.object3D.matrixWorld);
      document.getElementById(window.BuildingSceneModule.ids.switch).style.display="flex";
      document.getElementById(window.BuildingSceneModule.ids.hint).textContent="CITY WORLD · 正在加载场景…";
      window.cityAssetsReady.then(()=>this.enterFar());
    });
    this.el.addEventListener("targetLost",()=>{this.tracking=false});
  },

  enterFar(){
    this.mode="far";
    this.world.object3D.visible=false;

    const mini=document.getElementById(window.BuildingSceneModule.ids.mini);
    mini.hidden=false;
    mini.style.display="block";
    mini.style.opacity="";
    mini.classList.add("show");
    mini.classList.remove("near");

    document.getElementById(window.BuildingSceneModule.ids.far)?.classList.add("active");
    document.getElementById(window.BuildingSceneModule.ids.near)?.classList.remove("active");
    document.getElementById(window.BuildingSceneModule.ids.hint).textContent="CITY · 🌆 远景 · 用玩偶讲故事";
  },

  enterNear(){
    this.mode="near";
    this.world.object3D.visible=false;

    const mini=document.getElementById(window.BuildingSceneModule.ids.mini);
    mini.hidden=false;
    mini.style.display="block";
    mini.style.opacity="";
    mini.classList.add("show");
    requestAnimationFrame(()=>mini.classList.add("near"));

    document.getElementById(window.BuildingSceneModule.ids.far)?.classList.remove("active");
    document.getElementById(window.BuildingSceneModule.ids.near)?.classList.add("active");
    document.getElementById(window.BuildingSceneModule.ids.hint).textContent="CITY · 🔎 近景 · 城市来到眼前";
  },

  tick(){
    if(this.tracking){
      this.el.object3D.updateMatrixWorld(true);
      this.lastMatrix.copy(this.el.object3D.matrixWorld);
    }
  }
});
