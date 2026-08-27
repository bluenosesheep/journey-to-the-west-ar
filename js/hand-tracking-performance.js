// Classroom City - Step 4 hand tracking module.
//
// This module is independent from Park / Market.
// It turns MediaPipe hand landmarks into the SAME CityInput API used by mouse:
//
//   index fingertip movement -> CityInput.move()
//   pinch begins             -> CityInput.down()
//   pinch ends               -> CityInput.up()
//
// The module exposes:
//   ClassroomHandTracking.start(options)
//   ClassroomHandTracking.stop()
//
// MediaPipe input is processed on-device in the browser.

import {
  FilesetResolver,
  HandLandmarker
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/+esm";

const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

const WASM_URL =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm";

let handLandmarker = null;
let stream = null;
let ownsStream = false;
let running = false;
let rafId = null;
let lastVideoTime = -1;
let lastDetectMs = 0;

let pinching = false;
let smoothX = null;
let smoothY = null;

// Gesture safety state.
// When a recognition card is being held, the hand often looks like a pinch.
// Interactions are therefore "disarmed" until we see an open/non-pinching
// hand continuously for a short period.
let inputArmed = true;
let requireRelease = false;
let releaseSince = null;
let releaseHoldMs = 300;
let onArmedChange = null;

const HAND_POINTER_ID = "hand-1";

function dist(a,b){
  return Math.hypot(a.x-b.x,a.y-b.y);
}

function mapTipToScreen(tip, video, viewportWidth, viewportHeight, mirror){
  // MediaPipe landmarks are normalized to the source video.
  // The preview is mirrored for a natural "mirror" classroom experience,
  // so screen X must be mirrored as well.
  const nx = mirror ? (1-tip.x) : tip.x;
  return {
    x: nx * viewportWidth,
    y: tip.y * viewportHeight
  };
}

function updateCursor(cursor,x,y,isPinching,visible,armed=true){
  if(!cursor)return;
  cursor.style.display = visible ? "grid" : "none";
  if(!visible)return;

  cursor.style.left = x + "px";
  cursor.style.top = y + "px";

  cursor.classList.toggle("pinching",armed && isPinching);
  cursor.classList.toggle("gesture-locked",!armed);

  if(!armed)cursor.textContent="✋";
  else cursor.textContent = isPinching ? "🤏" : "✨";
}

async function createLandmarker(onStatus){
  const vision = await FilesetResolver.forVisionTasks(WASM_URL);

  const baseOptions = {
    modelAssetPath: MODEL_URL,
    delegate: "GPU"
  };

  try{
    onStatus?.("正在加载手势模型（GPU）…");
    return await HandLandmarker.createFromOptions(vision,{
      baseOptions,
      runningMode:"VIDEO",
      numHands:1,
      minHandDetectionConfidence:0.55,
      minHandPresenceConfidence:0.55,
      minTrackingConfidence:0.55
    });
  }catch(err){
    console.warn("GPU HandLandmarker failed; falling back to CPU.",err);
    onStatus?.("GPU 不可用，切换 CPU…");
    return await HandLandmarker.createFromOptions(vision,{
      baseOptions:{
        modelAssetPath:MODEL_URL,
        delegate:"CPU"
      },
      runningMode:"VIDEO",
      numHands:1,
      minHandDetectionConfidence:0.55,
      minHandPresenceConfidence:0.55,
      minTrackingConfidence:0.55
    });
  }
}

async function start(options={}){
  if(running)return;

  const video = options.video;
  if(!video)throw new Error("ClassroomHandTracking.start requires a video element.");

  const cursor = options.cursor || null;
  const mirror = options.mirror !== false;
  const onStatus = options.onStatus || (()=>{});
  const onMetrics = options.onMetrics || (()=>{});
  const viewport = options.viewport || (()=>({
    width:window.innerWidth,
    height:window.innerHeight
  }));

  // Detection is deliberately capped. 30fps is enough for child-friendly
  // pointing/pinching and leaves CPU/GPU headroom for MindAR later.
  const detectIntervalMs = 1000 / (options.maxFps || 30);

  // Pinch threshold is normalized by hand size rather than raw pixels.
  // Hysteresis prevents rapid down/up flicker around the threshold.
  const pinchDownRatio = options.pinchDownRatio || 0.34;
  const pinchUpRatio = options.pinchUpRatio || 0.44;

  // Coordinate smoothing reduces hand jitter on a large classroom display.
  const smoothing = options.smoothing ?? 0.35;
  onArmedChange = options.onArmedChange || null;

  if(options.reuseExistingVideo){
    stream = video.srcObject || null;
    ownsStream = false;

    if(video.readyState < 2){
      onStatus("等待 AR 相机…");
      await new Promise((resolve)=>{
        const done=()=>resolve();
        video.addEventListener("loadeddata",done,{once:true});
      });
    }
  }else{
    onStatus("正在启动摄像头…");

    stream = await navigator.mediaDevices.getUserMedia({
      video:{
        facingMode:"user",
        width:{ideal:1280},
        height:{ideal:720},
        frameRate:{ideal:30,max:30}
      },
      audio:false
    });

    ownsStream = true;
    video.srcObject = stream;
    await video.play();
  }

  if(!handLandmarker){
    onStatus("正在加载手势识别…");
    handLandmarker = await createLandmarker(onStatus);
  }

  running = true;
  lastVideoTime = -1;
  lastDetectMs = 0;
  pinching = false;
  smoothX = null;
  smoothY = null;
  inputArmed = true;
  requireRelease = false;
  releaseSince = null;

  onStatus("请把一只手伸到镜头前");

  const loop = ()=>{
    if(!running)return;

    const now = performance.now();

    if(
      video.readyState >= 2 &&
      video.currentTime !== lastVideoTime &&
      now-lastDetectMs >= detectIntervalMs
    ){
      lastVideoTime = video.currentTime;
      lastDetectMs = now;

      const result = handLandmarker.detectForVideo(video,now);
      const hand = result.landmarks && result.landmarks[0];

      if(hand){
        const indexTip = hand[8];
        const thumbTip = hand[4];

        // Wrist -> middle-finger MCP is a useful stable hand-size reference.
        const palmSize = Math.max(0.001,dist(hand[0],hand[9]));
        const pinchRatio = dist(indexTip,thumbTip)/palmSize;

        const vp = viewport();
        let raw = mapTipToScreen(
          indexTip,
          video,
          vp.width,
          vp.height,
          mirror
        );

        // Keep hand cursor / pinch coordinates aligned with the selected
        // camera orientation (0 / 90 / 180 / 270 degrees).
        if(window.ClassroomCameraOrientation?.mapPoint){
          raw=window.ClassroomCameraOrientation.mapPoint(
            raw.x,
            raw.y,
            vp.width,
            vp.height
          );
        }

        if(smoothX===null){
          smoothX=raw.x;
          smoothY=raw.y;
        }else{
          smoothX += (raw.x-smoothX)*smoothing;
          smoothY += (raw.y-smoothY)*smoothing;
        }

        const wasPinching = pinching;
        if(!pinching && pinchRatio < pinchDownRatio){
          pinching=true;
        }else if(pinching && pinchRatio > pinchUpRatio){
          pinching=false;
        }

        // Always emit move while a hand is visible. Move alone cannot activate
        // Park/Market actions; it only moves the cursor / active drag.
        window.CityInput?.move(smoothX,smoothY,{
          source:"hand",
          pointerId:HAND_POINTER_ID
        });

        // Release-to-arm safety:
        // after a recognition card transition, ignore all pinch-down actions
        // until the hand has been clearly open for releaseHoldMs.
        if(requireRelease){
          if(!pinching){
            if(releaseSince===null)releaseSince=now;

            if(now-releaseSince>=releaseHoldMs){
              requireRelease=false;
              inputArmed=true;
              releaseSince=null;
              onArmedChange?.(true);
            }
          }else{
            releaseSince=null;
          }
        }

        if(inputArmed && !requireRelease){
          if(!wasPinching && pinching){
            window.CityInput?.down(smoothX,smoothY,{
              source:"hand",
              pointerId:HAND_POINTER_ID
            });
          }else if(wasPinching && !pinching){
            window.CityInput?.up(smoothX,smoothY,{
              source:"hand",
              pointerId:HAND_POINTER_ID
            });
          }
        }

        updateCursor(cursor,smoothX,smoothY,pinching,true,inputArmed&&!requireRelease);
        onMetrics({
          handVisible:true,
          pinching,
          armed:inputArmed&&!requireRelease,
          pinchRatio,
          x:smoothX,
          y:smoothY
        });
      }else{
        if(pinching){
          pinching=false;
          window.CityInput?.up(
            smoothX ?? window.innerWidth/2,
            smoothY ?? window.innerHeight/2,
            {source:"hand",pointerId:HAND_POINTER_ID}
          );
        }

        updateCursor(cursor,0,0,false,false,inputArmed&&!requireRelease);
        onMetrics({
          handVisible:false,
          pinching:false,
          armed:inputArmed&&!requireRelease,
          pinchRatio:null,
          x:null,
          y:null
        });
      }
    }

    rafId=requestAnimationFrame(loop);
  };

  rafId=requestAnimationFrame(loop);
}

function arm(){
  requireRelease=false;
  inputArmed=true;
  releaseSince=null;
  onArmedChange?.(true);
}

function requireReleaseToArm(ms=300){
  releaseHoldMs=Math.max(120,ms);
  requireRelease=true;
  inputArmed=false;
  releaseSince=null;

  // If an interaction was active, end it cleanly before locking.
  window.CityInput?.up(
    smoothX ?? window.innerWidth/2,
    smoothY ?? window.innerHeight/2,
    {source:"hand",pointerId:HAND_POINTER_ID}
  );

  onArmedChange?.(false);
}

function isArmed(){
  return inputArmed && !requireRelease;
}

function stop(options={}){
  running=false;

  if(rafId){
    cancelAnimationFrame(rafId);
    rafId=null;
  }

  if(pinching){
    pinching=false;
    window.CityInput?.up(
      smoothX ?? window.innerWidth/2,
      smoothY ?? window.innerHeight/2,
      {source:"hand",pointerId:HAND_POINTER_ID}
    );
  }

  if(stream && ownsStream && !options.keepVideo){
    stream.getTracks().forEach(track=>track.stop());
  }

  stream=null;
  ownsStream=false;

  if(handLandmarker && !options.keepModel){
    try{ handLandmarker.close(); }catch(_){}
    handLandmarker=null;
  }
}

window.ClassroomHandTracking = {start,stop,arm,requireReleaseToArm,isArmed};
