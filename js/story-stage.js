// Fixed Story Stage demo.
// No AI segmentation: the configured stage rectangle remains sharp,
// while the surrounding classroom view is visually de-emphasized.

(function(){
  function create(options={}){
    const video=options.video;
    const canvas=options.canvas;
    const onChange=options.onChange || (()=>{});
    if(!video||!canvas)throw new Error("StoryStage requires video and canvas.");

    const ctx=canvas.getContext("2d");
    let stream=null;
    let raf=null;
    let running=false;

    const state={
      cx:.50,
      cy:.56,
      width:.54,
      height:.54,
      feather:.055,
      blur:16,
      dim:.20,
      saturation:.72,
      mode:"soft"
    };

    function resize(){
      const w=video.videoWidth||1280;
      const h=video.videoHeight||720;
      if(canvas.width!==w||canvas.height!==h){
        canvas.width=w;
        canvas.height=h;
      }
    }

    function stagePixels(){
      const w=canvas.width,h=canvas.height;
      const sw=state.width*w;
      const sh=state.height*h;
      return {
        x:state.cx*w-sw/2,
        y:state.cy*h-sh/2,
        w:sw,h:sh
      };
    }

    function roundedRectPath(c,x,y,w,h,r){
      const rr=Math.min(r,w/2,h/2);
      c.beginPath();
      c.moveTo(x+rr,y);
      c.arcTo(x+w,y,x+w,y+h,rr);
      c.arcTo(x+w,y+h,x,y+h,rr);
      c.arcTo(x,y+h,x,y,rr);
      c.arcTo(x,y,x+w,y,rr);
      c.closePath();
    }

    function render(){
      if(!running)return;
      resize();

      const w=canvas.width,h=canvas.height;
      const s=stagePixels();

      ctx.save();
      ctx.clearRect(0,0,w,h);

      if(state.mode==="original"){
        ctx.filter="none";
        ctx.globalAlpha=1;
        ctx.drawImage(video,0,0,w,h);
      }else{
        // Background layer: blur + slight desaturation/dimming.
        const blur=state.mode==="dark" ? Math.max(20,state.blur) : state.blur;
        const sat=state.mode==="dark" ? Math.min(.55,state.saturation) : state.saturation;
        const brightness=state.mode==="dark" ? .62 : (1-state.dim);

        ctx.filter=`blur(${blur}px) saturate(${sat}) brightness(${brightness})`;
        ctx.drawImage(video,-32,-32,w+64,h+64);
        ctx.filter="none";

        // Sharp stage area.
        ctx.save();
        roundedRectPath(ctx,s.x,s.y,s.w,s.h,20);
        ctx.clip();
        ctx.drawImage(video,0,0,w,h);
        ctx.restore();

        // Soft visual transition around stage boundary.
        const featherPx=Math.max(4,state.feather*Math.min(w,h));
        const grad=ctx.createRadialGradient(
          s.x+s.w/2,s.y+s.h/2,
          Math.max(1,Math.min(s.w,s.h)/2-featherPx),
          s.x+s.w/2,s.y+s.h/2,
          Math.max(s.w,s.h)/1.38
        );
        grad.addColorStop(0,"rgba(255,255,255,0)");
        grad.addColorStop(.72,"rgba(255,255,255,0)");
        grad.addColorStop(1,"rgba(255,255,255,.08)");
        ctx.fillStyle=grad;
        ctx.fillRect(s.x-featherPx,s.y-featherPx,s.w+featherPx*2,s.h+featherPx*2);
      }

      ctx.restore();
      raf=requestAnimationFrame(render);
    }

    async function start(){
      if(running)return;
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
      video.style.transform="none";
      running=true;
      raf=requestAnimationFrame(render);
    }

    function stop(){
      running=false;
      if(raf)cancelAnimationFrame(raf);
      raf=null;
      if(stream)stream.getTracks().forEach(t=>t.stop());
      stream=null;
    }

    function update(patch){
      Object.assign(state,patch);
      onChange({...state});
    }

    function getStageScreenRect(){
      const rect=canvas.getBoundingClientRect();
      return {
        left:rect.left+(state.cx-state.width/2)*rect.width,
        top:rect.top+(state.cy-state.height/2)*rect.height,
        width:state.width*rect.width,
        height:state.height*rect.height
      };
    }

    return {start,stop,update,state,getStageScreenRect};
  }

  window.StoryStage={create};
})();
