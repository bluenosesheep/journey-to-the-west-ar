window.DIYCameraOrientation={
  angle:0,
  init(){
    const select=document.getElementById("cameraOrientationSelect");
    this.angle=Number(localStorage.getItem("diyCameraAngle")||0);
    if(select){
      select.value=String(this.angle);
      if(!select.dataset.diyCameraBound){
        select.dataset.diyCameraBound="1";
        select.addEventListener("change",()=>{
          this.angle=Number(select.value)||0;
          localStorage.setItem("diyCameraAngle",String(this.angle));
          this.apply();
        });
      }
    }
    this.apply();
  },
  apply(){
    const video=document.querySelector("video");
    if(!video){setTimeout(()=>this.apply(),120);return}
    const a=this.angle;
    video.style.transformOrigin="50% 50%";
    video.style.transform=`rotate(${a}deg) scaleX(-1)`;
    if(a===90||a===270){
      const scale=Math.max(innerWidth/innerHeight,innerHeight/innerWidth);
      video.style.transform=`rotate(${a}deg) scale(${scale}) scaleX(-1)`;
    }
  }
};

document.addEventListener("DOMContentLoaded",()=>{
  window.DIYCameraOrientation.init();
});
