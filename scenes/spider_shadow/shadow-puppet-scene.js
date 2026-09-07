import {ShadowHandTracking} from "./shadow-hand-tracking.js";

const video=document.getElementById("camera");
const canvas=document.getElementById("puppetCanvas");
const ctx=canvas.getContext("2d");
const statusEl=document.getElementById("status");
const calibrationBar=document.getElementById("calibrationBar");
const startBtn=document.getElementById("startBtn");
const calibrateBtn=document.getElementById("calibrateBtn");
const endBtn=document.getElementById("endBtn");

// This scene lives at scenes/spider_shadow/, while reusable artwork stays in
// the project's shared assets/spider_shadow/ directory.
const ASSET_BASE="../../assets/spider_shadow/";
const parts={
  head:{file:"spider_shadow_head.png",pivot:[.492,.904]},
  body:{file:"spider_shadow_body.png"},
  armLeft:{file:"spider_shadow_arm_left.png",pivot:[.721,.111]},
  armRight:{file:"spider_shadow_arm_right.png",pivot:[.412,.098]},
  legLeft:{file:"spider_shadow_leg_left.png",pivot:[.753,.112]},
  legRight:{file:"spider_shadow_leg_right.png",pivot:[.230,.113]}
};

let viewW=innerWidth,viewH=innerHeight,dpr=1;
let active=false;
let calibrated=false;
let samples=[];
let neutral=null;
let currentRig=null;
let smoothRig=null;
let lostShown=false;

const TIP_KEYS={head:4,armLeft:8,armRight:12,legLeft:16,legRight:20};
const TIP_ORDER=Object.keys(TIP_KEYS);
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const average=points=>({
  x:points.reduce((sum,p)=>sum+p.x,0)/points.length,
  y:points.reduce((sum,p)=>sum+p.y,0)/points.length
});

function setStatus(text){statusEl.textContent=text}

function loadImage(file){
  return new Promise((resolve,reject)=>{
    const image=new Image();
    image.onload=()=>resolve(image);
    image.onerror=()=>reject(new Error(`无法加载 ${file}`));
    image.src=ASSET_BASE+file;
  });
}

async function loadAssets(){
  await Promise.all(Object.values(parts).map(async part=>{
    part.image=await loadImage(part.file);
  }));
}

function resize(){
  viewW=innerWidth;viewH=innerHeight;dpr=Math.min(2,devicePixelRatio||1);
  canvas.width=Math.round(viewW*dpr);
  canvas.height=Math.round(viewH*dpr);
  canvas.style.width=`${viewW}px`;
  canvas.style.height=`${viewH}px`;
  ctx.setTransform(dpr,0,0,dpr,0,0);
  if(currentRig)draw(currentRig);else draw(makeNeutralRig());
}

function mapLandmark(point){
  const sourceW=video.videoWidth||1280;
  const sourceH=video.videoHeight||720;
  const cover=Math.max(viewW/sourceW,viewH/sourceH);
  const shownW=sourceW*cover,shownH=sourceH*cover;
  const offsetX=(viewW-shownW)/2,offsetY=(viewH-shownH)/2;
  return{
    x:offsetX+(1-point.x)*shownW,
    y:offsetY+point.y*shownH
  };
}

function handGeometry(landmarks){
  const points=landmarks.map(mapLandmark);
  const palm=average([points[0],points[5],points[9],points[13],points[17]]);
  const mcpCenter=average([points[5],points[9],points[13],points[17]]);
  let xAxis={x:points[5].x-points[17].x,y:points[5].y-points[17].y};
  const xLen=Math.max(1,Math.hypot(xAxis.x,xAxis.y));
  xAxis={x:xAxis.x/xLen,y:xAxis.y/xLen};
  let yAxis={x:-xAxis.y,y:xAxis.x};
  const wristDirection={x:points[0].x-mcpCenter.x,y:points[0].y-mcpCenter.y};
  if(yAxis.x*wristDirection.x+yAxis.y*wristDirection.y<0){
    yAxis={x:-yAxis.x,y:-yAxis.y};
  }
  const palmSize=Math.max(34,dist(points[0],points[9]));
  const localPoint=index=>{
    const v={x:points[index].x-palm.x,y:points[index].y-palm.y};
    return{
      x:(v.x*xAxis.x+v.y*xAxis.y)/palmSize,
      y:(v.x*yAxis.x+v.y*yAxis.y)/palmSize
    };
  };
  const local={};
  TIP_ORDER.forEach(key=>{local[key]=localPoint(TIP_KEYS[key])});
  return{points,palm,palmSize,xAxis,yAxis,local};
}

function isOpenHand(points){
  const palm=average([points[0],points[5],points[9],points[13],points[17]]);
  const pairs=[[8,6],[12,10],[16,14],[20,18]];
  const openFingers=pairs.filter(([tip,pip])=>dist(points[tip],palm)>dist(points[pip],palm)*1.12).length;
  return openFingers>=3;
}

function resetCalibration(){
  calibrated=false;neutral=null;samples=[];lostShown=false;
  calibrationBar.style.width="0%";
  setStatus("张开五指并保持一秒，正在准备校准…");
}

function addCalibrationSample(geometry){
  if(!isOpenHand(geometry.points)){
    samples=[];calibrationBar.style.width="0%";
    setStatus("请把手掌朝向镜头，并张开五个手指 ✋");
    return;
  }
  samples.push(geometry.local);
  const needed=18;
  calibrationBar.style.width=`${Math.min(100,samples.length/needed*100)}%`;
  setStatus(`保持张开… ${Math.min(100,Math.round(samples.length/needed*100))}%`);
  if(samples.length<needed)return;

  neutral={};
  TIP_ORDER.forEach(key=>{
    neutral[key]={
      x:samples.reduce((sum,s)=>sum+s[key].x,0)/samples.length,
      y:samples.reduce((sum,s)=>sum+s[key].y,0)/samples.length
    };
  });
  calibrated=true;samples=[];calibrationBar.style.width="100%";
  setStatus("校准完成！现在用五个手指自由表演吧 🎭");
}

function rotatePoint(center,x,y,rotation){
  const cos=Math.cos(rotation),sin=Math.sin(rotation);
  return{x:center.x+x*cos-y*sin,y:center.y+x*sin+y*cos};
}

function makeNeutralRig(){
  const bodyH=clamp(Math.min(viewW,viewH)*.28,150,275);
  const bodyW=bodyH*(326/436);
  const center={x:viewW*.5,y:viewH*.52};
  const rotation=0;
  return makeRigFromControls(center,bodyW,bodyH,rotation,{
    head:{x:0,y:0},armLeft:{x:0,y:0},armRight:{x:0,y:0},
    legLeft:{x:0,y:0},legRight:{x:0,y:0}
  });
}

function makeRigFromControls(center,bodyW,bodyH,rotation,delta){
  const localToWorld=(x,y)=>rotatePoint(center,x,y,rotation);
  const neck=localToWorld(0,-bodyH*.42);
  const shoulderLeft=localToWorld(-bodyW*.31,-bodyH*.24);
  const shoulderRight=localToWorld(bodyW*.31,-bodyH*.24);
  const hipLeft=localToWorld(-bodyW*.245,bodyH*.35);
  const hipRight=localToWorld(bodyW*.245,bodyH*.35);

  const controlGain=bodyH*1.30;
  const target=(baseX,baseY,d,gain=1)=>localToWorld(
    baseX+d.x*controlGain*gain,
    baseY+d.y*controlGain*gain
  );
  return{
    center,bodyW,bodyH,rotation,
    neck,
    headOffset:{
      x:delta.head.x*bodyH*.20,
      y:delta.head.y*bodyH*.14,
      rotation:clamp(delta.head.x*.78,-.48,.48)
    },
    shoulderLeft,shoulderRight,hipLeft,hipRight,
    armLeftTarget:target(-bodyW*.88,bodyH*.17,delta.armLeft,1.0),
    armRightTarget:target(bodyW*.88,bodyH*.17,delta.armRight,1.0),
    legLeftTarget:target(-bodyW*.30,bodyH*.95,delta.legLeft,.90),
    legRightTarget:target(bodyW*.30,bodyH*.95,delta.legRight,.90)
  };
}

function rigFromHand(geometry){
  const bodyH=clamp(geometry.palmSize*2.05,145,300);
  const bodyW=bodyH*(326/436);
  const downAngle=Math.atan2(geometry.yAxis.y,geometry.yAxis.x);
  let rotation=downAngle-Math.PI/2;
  while(rotation>Math.PI)rotation-=Math.PI*2;
  while(rotation<-Math.PI)rotation+=Math.PI*2;
  rotation=clamp(rotation,-.42,.42);
  const center={
    x:geometry.palm.x+geometry.yAxis.x*bodyH*.08,
    y:geometry.palm.y+geometry.yAxis.y*bodyH*.08
  };
  const delta={};
  TIP_ORDER.forEach(key=>{
    delta[key]={
      x:clamp(geometry.local[key].x-neutral[key].x,-.72,.72),
      y:clamp(geometry.local[key].y-neutral[key].y,-.72,.72)
    };
  });
  return makeRigFromControls(center,bodyW,bodyH,rotation,delta);
}

function smoothPoint(current,target,t){
  return{x:lerp(current.x,target.x,t),y:lerp(current.y,target.y,t)};
}

function smoothNext(target){
  if(!smoothRig){
    smoothRig=structuredClone(target);
    return smoothRig;
  }
  const t=.30;
  ["center","neck","shoulderLeft","shoulderRight","hipLeft","hipRight",
    "armLeftTarget","armRightTarget","legLeftTarget","legRightTarget"]
    .forEach(key=>{smoothRig[key]=smoothPoint(smoothRig[key],target[key],t)});
  smoothRig.bodyW=lerp(smoothRig.bodyW,target.bodyW,t);
  smoothRig.bodyH=lerp(smoothRig.bodyH,target.bodyH,t);
  smoothRig.rotation=lerp(smoothRig.rotation,target.rotation,t);
  smoothRig.headOffset.x=lerp(smoothRig.headOffset.x,target.headOffset.x,t);
  smoothRig.headOffset.y=lerp(smoothRig.headOffset.y,target.headOffset.y,t);
  smoothRig.headOffset.rotation=lerp(smoothRig.headOffset.rotation,target.headOffset.rotation,t);
  return smoothRig;
}

function drawLimb(part,joint,target,minRatio=.58,maxRatio=1.28){
  const image=part.image;if(!image)return;
  const pivotX=image.width*part.pivot[0];
  const pivotY=image.height*part.pivot[1];
  const nativeLength=Math.max(1,image.height-pivotY);
  const desiredLength=dist(joint,target);
  const base=currentRig.bodyH/image.height;
  const scale=clamp(desiredLength/nativeLength,base*minRatio,base*maxRatio);
  const angle=Math.atan2(target.y-joint.y,target.x-joint.x)-Math.PI/2;
  ctx.save();
  ctx.translate(joint.x,joint.y);
  ctx.rotate(angle);
  ctx.scale(scale,scale);
  ctx.drawImage(image,-pivotX,-pivotY);
  ctx.restore();
}

function drawBody(rig){
  const image=parts.body.image;if(!image)return;
  const scale=rig.bodyH/image.height;
  ctx.save();
  ctx.translate(rig.center.x,rig.center.y);
  ctx.rotate(rig.rotation);
  ctx.scale(scale,scale);
  ctx.drawImage(image,-image.width/2,-image.height/2);
  ctx.restore();
}

function drawHead(rig){
  const part=parts.head,image=part.image;if(!image)return;
  const scale=rig.bodyW*1.62/image.width;
  const pivotX=image.width*part.pivot[0],pivotY=image.height*part.pivot[1];
  ctx.save();
  ctx.translate(rig.neck.x+rig.headOffset.x,rig.neck.y+rig.headOffset.y);
  ctx.rotate(rig.rotation+rig.headOffset.rotation);
  ctx.scale(scale,scale);
  ctx.drawImage(image,-pivotX,-pivotY);
  ctx.restore();
}

function draw(rig){
  currentRig=rig;
  ctx.clearRect(0,0,viewW,viewH);
  const glow=ctx.createRadialGradient(rig.center.x,rig.center.y,20,rig.center.x,rig.center.y,rig.bodyH*1.8);
  glow.addColorStop(0,"rgba(255,222,158,.16)");
  glow.addColorStop(1,"rgba(255,222,158,0)");
  ctx.fillStyle=glow;ctx.fillRect(0,0,viewW,viewH);

  drawLimb(parts.legLeft,rig.hipLeft,rig.legLeftTarget,.52,1.30);
  drawLimb(parts.legRight,rig.hipRight,rig.legRightTarget,.52,1.30);
  drawLimb(parts.armLeft,rig.shoulderLeft,rig.armLeftTarget,.48,1.35);
  drawLimb(parts.armRight,rig.shoulderRight,rig.armRightTarget,.48,1.35);
  drawBody(rig);
  drawHead(rig);
}

function onHandFrame(frame){
  if(!active)return;
  if(!frame.visible){
    if(!lostShown){setStatus("没有看到手，蛛影小妖保持刚才的姿势");lostShown=true}
    return;
  }
  lostShown=false;
  const geometry=handGeometry(frame.landmarks);
  if(!calibrated){
    addCalibrationSample(geometry);
    draw(smoothNext(makeNeutralRig()));
    return;
  }
  draw(smoothNext(rigFromHand(geometry)));
}

async function startShow(){
  if(active)return;
  active=true;startBtn.disabled=true;calibrateBtn.disabled=true;endBtn.disabled=false;
  resetCalibration();
  try{
    await ShadowHandTracking.start({
      video,maxFps:20,onStatus:setStatus,onFrame:onHandFrame
    });
    calibrateBtn.disabled=false;
  }catch(error){
    console.error(error);
    ShadowHandTracking.stop({video,keepModel:true});
    active=false;startBtn.disabled=false;endBtn.disabled=true;
    setStatus("摄像头或手势模型启动失败，请检查权限和网络");
  }
}

function endShow(){
  if(!active)return;
  active=false;
  ShadowHandTracking.stop({video,keepModel:true});
  calibrated=false;neutral=null;samples=[];smoothRig=null;
  calibrationBar.style.width="0%";
  startBtn.disabled=false;calibrateBtn.disabled=true;endBtn.disabled=true;
  setStatus("表演结束。故事下一幕，由你决定。");
  draw(makeNeutralRig());
}

startBtn.addEventListener("click",startShow);
calibrateBtn.addEventListener("click",()=>{smoothRig=null;resetCalibration()});
endBtn.addEventListener("click",endShow);
addEventListener("resize",resize,{passive:true});
addEventListener("pagehide",()=>ShadowHandTracking.stop({video,keepModel:true}));

startBtn.disabled=true;
setStatus("正在加载蛛影小妖素材…");
loadAssets().then(()=>{
  resize();startBtn.disabled=false;
  setStatus("点击“开始表演”，允许使用摄像头");
}).catch(error=>{
  console.error(error);setStatus("素材加载失败，请检查 assets/spider_shadow 路径");
});
