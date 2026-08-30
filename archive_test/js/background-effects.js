// Classroom City - Step 7 background-effects test module.
//
// Standalone experiment only. It is NOT loaded by classroom_city.html.
//
// Modes:
//   original  - raw camera
//   soft      - moderate background blur
//   strong    - stronger background blur
//
// Foreground is kept sharp using a MediaPipe person segmentation mask.
// This test is specifically meant to see whether children's hands and
// held puppets/toys remain visually acceptable.

import {
  FilesetResolver,
  ImageSegmenter
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/+esm";

const WASM_URL =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm";

const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter_landscape/float16/latest/selfie_segmenter_landscape.tflite";

let segmenter = null;
let stream = null;
let running = false;
let rafId = null;
let lastVideoTime = -1;
let lastSegmentationMs = 0;
let latestPersonMask = null;
let latestMaskWidth = 0;
let latestMaskHeight = 0;

function closeMask(mask){
  try{ mask?.close?.(); }catch(_){}
}

async function createSegmenter(onStatus){
  const vision = await FilesetResolver.forVisionTasks(WASM_URL);

  try{
    onStatus?.("正在加载背景分割模型（GPU）…");
    return await ImageSegmenter.createFromOptions(vision,{
      baseOptions:{
        modelAssetPath:MODEL_URL,
        delegate:"GPU"
      },
      runningMode:"VIDEO",
      outputCategoryMask:false,
      outputConfidenceMasks:true
    });
  }catch(err){
    console.warn("GPU ImageSegmenter failed; falling back to CPU.",err);
    onStatus?.("GPU 不可用，切换 CPU…");

    return await ImageSegmenter.createFromOptions(vision,{
      baseOptions:{
        modelAssetPath:MODEL_URL,
        delegate:"CPU"
      },
      runningMode:"VIDEO",
      outputCategoryMask:false,
      outputConfidenceMasks:true
    });
  }
}

function makeMaskCanvas(maskFloats,width,height,threshold,softness){
  const canvas=document.createElement("canvas");
  canvas.width=width;
  canvas.height=height;

  const ctx=canvas.getContext("2d");
  const image=ctx.createImageData(width,height);
  const data=image.data;

  for(let i=0;i<maskFloats.length;i++){
    const p=maskFloats[i];

    // Smooth threshold. This softens hair / hand boundaries compared with
    // a hard category mask.
    const lo=threshold-softness;
    const hi=threshold+softness;
    let a=(p-lo)/Math.max(.001,hi-lo);
    a=Math.max(0,Math.min(1,a));
    a=a*a*(3-2*a); // smoothstep

    const j=i*4;
    data[j]=255;
    data[j+1]=255;
    data[j+2]=255;
    data[j+3]=Math.round(a*255);
  }

  ctx.putImageData(image,0,0);
  return canvas;
}

function choosePersonMask(result,segmenter){
  const masks=result.confidenceMasks || [];
  if(!masks.length)return null;

  // Selfie segmenter may expose a single foreground confidence mask.
  if(masks.length===1)return masks[0];

  let labels=[];
  try{ labels=segmenter.getLabels?.() || []; }catch(_){}

  const personIndex=labels.findIndex(label=>
    /person|foreground|human/i.test(String(label))
  );

  if(personIndex>=0 && masks[personIndex])return masks[personIndex];

  // Fallback: use the last mask, which is commonly foreground/person
  // for two-class person/background segmentation models.
  return masks[masks.length-1];
}

async function start(options={}){
  if(running)return;

  const video=options.video;
  const output=options.output;
  if(!video||!output){
    throw new Error("BackgroundEffects.start requires video and output canvas.");
  }

  const onStatus=options.onStatus || (()=>{});
  const onStats=options.onStats || (()=>{});

  const ctx=output.getContext("2d");
  const personCanvas=document.createElement("canvas");
  const personCtx=personCanvas.getContext("2d");

  let mode=options.mode || "soft";
  let threshold=options.threshold ?? .42;
  let softness=options.softness ?? .18;
  const segmentIntervalMs=1000/(options.segmentationFps || 15);

  const setMode=(next)=>{
    mode=next;
    onStatus(
      next==="original" ? "Original · 原始画面" :
      next==="soft" ? "Soft Blur · 柔和虚化" :
      "Strong Blur · 强虚化"
    );
  };

  const setThreshold=(value)=>{threshold=value;};
  const setSoftness=(value)=>{softness=value;};

  onStatus("正在启动摄像头…");

  stream=await navigator.mediaDevices.getUserMedia({
    video:{
      facingMode:"user",
      width:{ideal:1280},
      height:{ideal:720},
      frameRate:{ideal:30,max:30}
    },
    audio:false
  });

  video.srcObject=stream;
  await video.play();

  // Non-mirrored classroom presentation.
  video.style.transform="none";

  onStatus("正在加载人物分割…");
  segmenter=await createSegmenter(onStatus);

  running=true;

  const resize=()=>{
    const w=video.videoWidth||1280;
    const h=video.videoHeight||720;

    if(output.width!==w||output.height!==h){
      output.width=w;
      output.height=h;
      personCanvas.width=w;
      personCanvas.height=h;
    }
  };

  const render=()=>{
    if(!running)return;
    resize();

    const now=performance.now();
    const w=output.width;
    const h=output.height;

    if(
      video.readyState>=2 &&
      video.currentTime!==lastVideoTime &&
      now-lastSegmentationMs>=segmentIntervalMs
    ){
      lastVideoTime=video.currentTime;
      lastSegmentationMs=now;

      const started=performance.now();

      segmenter.segmentForVideo(video,now,(result)=>{
        const mask=choosePersonMask(result,segmenter);

        if(mask){
          const floats=mask.getAsFloat32Array();
          const mw=mask.width;
          const mh=mask.height;

          latestPersonMask=new Float32Array(floats);
          latestMaskWidth=mw;
          latestMaskHeight=mh;
        }

        // Release MediaPipe mask resources after copying the data.
        (result.confidenceMasks||[]).forEach(closeMask);
        closeMask(result.categoryMask);

        onStats({
          inferenceMs:performance.now()-started,
          maskWidth:latestMaskWidth,
          maskHeight:latestMaskHeight
        });
      });
    }

    ctx.save();
    ctx.clearRect(0,0,w,h);

    if(mode==="original" || !latestPersonMask){
      ctx.filter="none";
      ctx.drawImage(video,0,0,w,h);
      ctx.restore();
      rafId=requestAnimationFrame(render);
      return;
    }

    // Draw blurred full frame.
    ctx.filter=mode==="soft" ? "blur(10px)" : "blur(22px)";
    ctx.drawImage(video,-28,-28,w+56,h+56);
    ctx.filter="none";

    // Build sharp foreground and mask it.
    personCtx.clearRect(0,0,w,h);
    personCtx.globalCompositeOperation="source-over";
    personCtx.drawImage(video,0,0,w,h);

    const maskCanvas=makeMaskCanvas(
      latestPersonMask,
      latestMaskWidth,
      latestMaskHeight,
      threshold,
      softness
    );

    personCtx.globalCompositeOperation="destination-in";
    personCtx.imageSmoothingEnabled=true;
    personCtx.drawImage(maskCanvas,0,0,w,h);
    personCtx.globalCompositeOperation="source-over";

    // Slight feather on the composited edge.
    ctx.drawImage(personCanvas,0,0,w,h);

    ctx.restore();
    rafId=requestAnimationFrame(render);
  };

  rafId=requestAnimationFrame(render);

  return {
    setMode,
    setThreshold,
    setSoftness
  };
}

function stop(){
  running=false;

  if(rafId){
    cancelAnimationFrame(rafId);
    rafId=null;
  }

  if(stream){
    stream.getTracks().forEach(track=>track.stop());
    stream=null;
  }

  if(segmenter){
    try{segmenter.close();}catch(_){}
    segmenter=null;
  }

  latestPersonMask=null;
}

window.ClassroomBackgroundEffects={start,stop};
