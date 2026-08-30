/* ---------- Unified mirrored-hand coordinate calibration ---------- */
window.DIYHandCalibration={
  yScale:1.18,
  yOffset:-10,

  calibratePoint(x,y){
    const cy=window.innerHeight*.5;
    return {
      x:x,
      y:cy+(y-cy)*this.yScale+this.yOffset
    };
  },

  calibrateInput(input){
    if(!input || input.source!=="hand")return input;
    const p=this.calibratePoint(input.x,input.y);
    return {...input,x:p.x,y:p.y};
  }
};

/* Apply the same calibrated point to ALL CityInput hand events. */
if(window.CityInput && !window.CityInput.__diyUnifiedHandCalibration){
  const originalRegister=window.CityInput.register.bind(window.CityInput);

  window.CityInput.register=function(name,handlers){
    const wrapped={};

    ["down","move","up","cancel"].forEach(type=>{
      if(typeof handlers?.[type]!=="function")return;
      wrapped[type]=(input)=>{
        handlers[type](window.DIYHandCalibration.calibrateInput(input));
      };
    });

    Object.keys(handlers||{}).forEach(key=>{
      if(!(key in wrapped))wrapped[key]=handlers[key];
    });

    return originalRegister(name,wrapped);
  };

  window.CityInput.__diyUnifiedHandCalibration=true;
}

/*
  hand-tracking-performance.js positions #handCursor directly.
  Observe those raw left/top values and immediately redraw the cursor at the
  SAME calibrated coordinate used by CityInput. This avoids the previous
  "cursor looks here, hit-test happens somewhere else" problem.
*/
document.addEventListener("DOMContentLoaded",()=>{
  const cursor=document.getElementById("handCursor");
  if(!cursor)return;

  let applying=false;
  let rawLeft=null;
  let rawTop=null;

  const parsePx=(v)=>{
    const n=parseFloat(v);
    return Number.isFinite(n)?n:null;
  };

  const applyCursorCalibration=()=>{
    if(applying)return;

    const left=parsePx(cursor.style.left);
    const top=parsePx(cursor.style.top);
    if(left===null || top===null)return;

    /*
      Only treat coordinates as new "raw" values when they differ from the
      last calibrated output. This prevents the observer from calibrating its
      own calibrated values repeatedly.
    */
    const lastCalX=cursor.dataset.calX!==undefined?Number(cursor.dataset.calX):null;
    const lastCalY=cursor.dataset.calY!==undefined?Number(cursor.dataset.calY):null;

    const isOurPreviousWrite=
      lastCalX!==null && lastCalY!==null &&
      Math.abs(left-lastCalX)<0.25 &&
      Math.abs(top-lastCalY)<0.25;

    if(isOurPreviousWrite)return;

    rawLeft=left;
    rawTop=top;

    const p=window.DIYHandCalibration.calibratePoint(rawLeft,rawTop);

    applying=true;
    cursor.dataset.calX=String(p.x);
    cursor.dataset.calY=String(p.y);
    cursor.style.left=p.x+"px";
    cursor.style.top=p.y+"px";
    applying=false;
  };

  const observer=new MutationObserver((mutations)=>{
    for(const m of mutations){
      if(m.type==="attributes" && m.attributeName==="style"){
        applyCursorCalibration();
        break;
      }
    }
  });

  observer.observe(cursor,{attributes:true,attributeFilter:["style"]});
});
