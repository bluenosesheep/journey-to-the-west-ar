// Shared utilities, preload state, and cross-scene cleanup.

function roundRect(ctx,x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();}


window.cityAssetsReady = new Promise((resolve)=>{
  const urls=[
    window.CityAssetConfig.sceneImages.building,
    window.CityAssetConfig.sceneImages.park,
    window.CityAssetConfig.sceneImages.market
  ];
  let done=0;
  urls.forEach(src=>{
    const img=new Image();
    img.onload=img.onerror=()=>{
      done++;
      if(done===urls.length)resolve();
    };
    img.src=src;
  });
});

function alignBackButtonWithHint(){
  const hint=document.getElementById("hint");
  const btn=document.getElementById("sceneBackBtn");
  if(!hint||!btn||btn.style.display==="none")return;

  requestAnimationFrame(()=>{
    const r=hint.getBoundingClientRect();
    const gap=8;
    const bw=btn.offsetWidth;
    const bh=btn.offsetHeight;

    let left=r.right+gap;
    if(left+bw>window.innerWidth-8){
      left=Math.max(8,r.left-bw-gap);
    }

    btn.style.left=left+"px";
    btn.style.top=(r.top+(r.height-bh)/2)+"px";
    btn.style.bottom="auto";
    btn.style.transform="none";
  });
}
window.addEventListener("resize",alignBackButtonWithHint);



function clearOtherInteractiveScene(active){
  const parkWorld=document.getElementById("parkInteractionWorld");
  const parkBg=document.getElementById("parkDynamicBackground");
  const marketWorld=document.getElementById("marketInteractionWorld");
  const marketBg=document.getElementById("marketDynamicBackground");

  if(active!=="park"){
    if(parkWorld)parkWorld.object3D.visible=false;
    if(parkBg)parkBg.object3D.visible=false;

    const parkTarget=document.querySelector('[mindar-image-target="targetIndex:1"]');
    const parkComp=parkTarget && parkTarget.components && parkTarget.components["park-drag-controller"];
    if(parkComp){
      parkComp.tracking=false;
      parkComp.holding=false;
      if(parkComp.timer){clearTimeout(parkComp.timer);parkComp.timer=null;}
      if(parkComp.dragState)parkComp.dragState=null;
      if(parkComp.hideHits)parkComp.hideHits();
    }
  }

  if(active!=="market"){
    if(marketWorld)marketWorld.object3D.visible=false;
    if(marketBg)marketBg.object3D.visible=false;

    const marketTarget=document.querySelector('[mindar-image-target="targetIndex:2"]');
    const marketComp=marketTarget && marketTarget.components && marketTarget.components["market-persist"];
    if(marketComp){
      marketComp.tracking=false;
      marketComp.holding=false;
      if(marketComp.timer){clearTimeout(marketComp.timer);marketComp.timer=null;}
      if(marketComp.hideHoldHits)marketComp.hideHoldHits();
    }
  }
}
