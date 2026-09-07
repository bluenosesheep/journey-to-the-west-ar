import {
  FilesetResolver,
  HandLandmarker
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/+esm";

const MODEL_URL=
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";
const WASM_URL=
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm";

let landmarker=null;
let stream=null;
let running=false;
let rafId=0;
let lastVideoTime=-1;
let lastDetectMs=0;

async function createLandmarker(onStatus){
  const vision=await FilesetResolver.forVisionTasks(WASM_URL);
  const make=delegate=>HandLandmarker.createFromOptions(vision,{
    baseOptions:{modelAssetPath:MODEL_URL,delegate},
    runningMode:"VIDEO",
    numHands:1,
    minHandDetectionConfidence:.55,
    minHandPresenceConfidence:.55,
    minTrackingConfidence:.55
  });

  try{
    onStatus("正在加载手势模型（GPU）…");
    return await make("GPU");
  }catch(error){
    console.warn("GPU HandLandmarker failed; using CPU.",error);
    onStatus("GPU 不可用，切换 CPU…");
    return make("CPU");
  }
}

async function start(options={}){
  if(running)return;
  const video=options.video;
  if(!video)throw new Error("ShadowHandTracking.start requires a video element.");

  const onStatus=options.onStatus||(()=>{});
  const onFrame=options.onFrame||(()=>{});
  const detectInterval=1000/(options.maxFps||20);

  onStatus("正在启动摄像头…");
  stream=await navigator.mediaDevices.getUserMedia({
    video:{
      facingMode:"user",
      width:{ideal:1280},height:{ideal:720},
      frameRate:{ideal:30,max:30}
    },
    audio:false
  });
  video.srcObject=stream;
  await video.play();

  if(!landmarker)landmarker=await createLandmarker(onStatus);

  running=true;
  lastVideoTime=-1;
  lastDetectMs=0;
  onStatus("请把一只手伸到镜头前");

  const loop=()=>{
    if(!running)return;
    const now=performance.now();
    if(video.readyState>=2&&video.currentTime!==lastVideoTime&&now-lastDetectMs>=detectInterval){
      lastVideoTime=video.currentTime;
      lastDetectMs=now;
      const result=landmarker.detectForVideo(video,now);
      const landmarks=result.landmarks?.[0]||null;
      const handedness=result.handednesses?.[0]?.[0]?.categoryName||null;
      onFrame({visible:!!landmarks,landmarks,handedness,now});
    }
    rafId=requestAnimationFrame(loop);
  };
  rafId=requestAnimationFrame(loop);
}

function stop(options={}){
  running=false;
  if(rafId){cancelAnimationFrame(rafId);rafId=0}
  if(stream){stream.getTracks().forEach(track=>track.stop());stream=null}
  if(options.video)options.video.srcObject=null;
  if(landmarker&&!options.keepModel){
    try{landmarker.close()}catch(_){/* already closed */}
    landmarker=null;
  }
}

export const ShadowHandTracking={start,stop,get running(){return running}};
