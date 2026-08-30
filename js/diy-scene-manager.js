/* ---------- Unified DIY scene state ---------- */
window.DIYSceneManager={
  active:null,

  setHint(text){
    const h=document.getElementById("hint");
    if(h)h.textContent=text;
  },

  stopHands(){
    window.StandaloneHandMode?.sleep();
    window.StandaloneMarketHandMode?.sleep();
    window.StandaloneSpiderHandMode?.sleep();
    const cursor=document.getElementById("handCursor");
    if(cursor)cursor.style.display="none";
  },

  hideBuilding(){
    const mini=document.getElementById("storyCityMini");
    if(mini){
      mini.classList.remove("show","near");
      mini.style.display="none";
      mini.style.opacity="0";
    }

    const sw=document.getElementById("modeSwitch");
    if(sw)sw.style.display="none";

    document.getElementById("farBtn")?.classList.add("active");
    document.getElementById("nearBtn")?.classList.remove("active");
  },

  hidePark(){
    window.StandaloneHandMode?.sleep();
    document.body.classList.remove("park-story");

    ["parkStoryLayer","fixParkBtn","doneParkBtn","dragLayer"].forEach(id=>{
      const el=document.getElementById(id);if(el)el.style.display="none";
    });

    const c=document.querySelector('[park-drag-controller]')?.components?.["park-drag-controller"];
    if(c){
      c.tracking=false;c.holding=false;c.dragState=null;c.hideHits?.();
    }

    const w=document.getElementById("parkWorld");
    if(w)w.object3D.visible=false;
  },

  hideMarket(){
    window.StandaloneMarketHandMode?.sleep();
    document.body.classList.remove("market-story","market-shop");

    ["marketStoryLayer","shopBtn","checkoutBtn","holdHitLayer"].forEach(id=>{
      const el=document.getElementById(id);if(el)el.style.display="none";
    });

    const c=document.querySelector('[market-persist]')?.components?.["market-persist"];
    if(c){
      c.tracking=false;c.holding=false;c.dragState=null;c.hideHoldHits?.();
    }

    const w=document.getElementById("marketWorld");
    if(w)w.object3D.visible=false;
  },

  hideSpider(){
    window.StandaloneSpiderHandMode?.sleep();
    ["spiderFightBtn","spiderRetryBtn","spiderLeaveBtn","spiderProgress"].forEach(id=>{const el=document.getElementById(id);if(el)el.style.display="none"});
    const ctrl=document.querySelector('[spider-controller]')?.components?.["spider-controller"];
    if(ctrl){ctrl.tracking=false;ctrl.holding=false;ctrl.dragState=null;ctrl.hideWorld?.()}
    const comp=document.getElementById("spiderDisplay")?.components?.["spider-canvas"];
    if(comp){comp.setMode("waiting");comp.resetGame()}
    if(window.SpiderMode)window.SpiderMode.mode="waiting";
  },

  resetSharedHandUI(kind){
    const btn=document.getElementById("handBtn");
    const status=document.getElementById("handStatus");
    const cursor=document.getElementById("handCursor");

    // Always start a newly activated scene with hand inference OFF.
    if(status){
      status.style.display="none";
      status.textContent="手势：已关闭";
    }
    if(cursor)cursor.style.display="none";

    if(btn){
      btn.textContent="✨ INTERACT · OFF";
      // PARK/MARKET need the shared switch once they enter interactive mode.
      // Their story CSS can still hide it with !important until that moment.
      btn.style.display=(kind==="park"||kind==="market")?"block":"none";
    }
  },

  hideAll(){
    this.stopHands();
    this.hideBuilding();
    this.hidePark();
    this.hideMarket();
    this.hideSpider();
    document.body.classList.remove("diy-building","diy-park","diy-market","diy-spider");
  },

  activate(kind){
    if(this.active!==kind)this.hideAll();

    this.active=kind;
    document.body.classList.remove("diy-waiting","diy-building","diy-park","diy-market","diy-spider");
    document.body.classList.add("diy-"+kind);
    this.resetSharedHandUI(kind);

    const leave=document.getElementById("leaveSceneBtn");
    if(leave){
      leave.style.display="block";
      leave.textContent=kind==="building"?"← 离开城市":kind==="park"?"← 离开公园":kind==="market"?"← 离开市场":"← 离开蜘蛛挑战";
    }
  },

  showBuilding(){
    this.activate("building");

    const sw=document.getElementById("modeSwitch");
    if(sw)sw.style.display="flex";

    const c=document.querySelector("[diy-building-target]")?.components?.["standalone-city"];
    c?.enterFar();
  },

  setBuildingFar(){
    if(this.active!=="building")return;
    document.querySelector("[diy-building-target]")?.components?.["standalone-city"]?.enterFar();
  },

  setBuildingNear(){
    if(this.active!=="building")return;
    document.querySelector("[diy-building-target]")?.components?.["standalone-city"]?.enterNear();
  },

  leaveCurrent(){
    this.hideAll();
    this.active=null;
    document.body.classList.add("diy-waiting");

    const leave=document.getElementById("leaveSceneBtn");
    if(leave)leave.style.display="none";

    this.resetSharedHandUI(null);
    this.setHint("✨ 扫描 BUILDING / PARK / MARKET / SPIDER 开始一个场景，也可以随时扫描 CLOUD / FIRE / RAIN / GROW");
  },

  handToggle(){
    if(this.active==="park")window.StandaloneHandMode?.toggle();
    else if(this.active==="market")window.StandaloneMarketHandMode?.toggle();
    else if(this.active==="spider")window.StandaloneSpiderHandMode?.toggle();
  }
};

AFRAME.registerComponent("diy-scene-trigger",{
  schema:{kind:{type:"string"}},
  init(){
    this.el.addEventListener("targetFound",()=>{
      const kind=this.data.kind;
      window.DIYSceneManager.activate(kind);
      if(kind==="building")window.DIYSceneManager.showBuilding();
    });
  }
});

document.addEventListener("DOMContentLoaded",()=>{
  document.body.classList.add("diy-waiting");

  document.getElementById("homeBtn")
    ?.addEventListener("click",()=>location.href="./index.html");

  document.getElementById("leaveSceneBtn")
    ?.addEventListener("click",()=>window.DIYSceneManager.leaveCurrent());

  document.getElementById("farBtn")
    ?.addEventListener("click",()=>window.DIYSceneManager.setBuildingFar());

  document.getElementById("nearBtn")
    ?.addEventListener("click",()=>window.DIYSceneManager.setBuildingNear());

  // One shared INTERACT control; dispatch only to the active scene.
  document.getElementById("handBtn")
    ?.addEventListener("click",()=>window.DIYSceneManager.handToggle());

  window.DIYSceneManager.leaveCurrent();
});
