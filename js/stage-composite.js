
(function(){
  function create({video,output}){
    const ctx=output.getContext("2d",{willReadFrequently:true});
    const work=document.createElement("canvas");
    const wctx=work.getContext("2d",{willReadFrequently:true});
    const fg=document.createElement("canvas");
    const fctx=fg.getContext("2d",{willReadFrequently:true});
    let stream=null, raf=null, running=false, bgPixels=null;

    const state={cx:.50,cy:.56,width:.54,height:.54,threshold:34,softness:30,stageStyle:"park"};

    function resize(){
      const vw=video.videoWidth||1280, vh=video.videoHeight||720;
      const s=Math.min(1,640/vw);
      const w=Math.max(320,Math.round(vw*s)), h=Math.max(180,Math.round(vh*s));
      if(work.width!==w||work.height!==h){
        work.width=fg.width=w; work.height=fg.height=h;
        output.width=vw; output.height=vh; bgPixels=null;
      }
    }

    function roiPx(){
      const rw=state.width*work.width, rh=state.height*work.height;
      return {x:Math.round(state.cx*work.width-rw/2),y:Math.round(state.cy*work.height-rh/2),w:Math.round(rw),h:Math.round(rh)};
    }

    function roiOut(){
      const rw=state.width*output.width, rh=state.height*output.height;
      return {x:state.cx*output.width-rw/2,y:state.cy*output.height-rh/2,w:rw,h:rh};
    }

    function smoothstep(a,b,x){
      const t=Math.max(0,Math.min(1,(x-a)/Math.max(.001,b-a)));
      return t*t*(3-2*t);
    }

    function drawStage(r){
      let g=ctx.createLinearGradient(r.x,r.y,r.x,r.y+r.h);
      if(state.stageStyle==="market"){
        g.addColorStop(0,"#ffe2ae"); g.addColorStop(.55,"#fff2d7"); g.addColorStop(1,"#e3bf8c");
      }else if(state.stageStyle==="city"){
        g.addColorStop(0,"#b9dcff"); g.addColorStop(.58,"#edf6ff"); g.addColorStop(1,"#d8e3ee");
      }else{
        g.addColorStop(0,"#cce8ff"); g.addColorStop(.58,"#eef8ff"); g.addColorStop(.60,"#c7e7b1"); g.addColorStop(1,"#9bc97e");
      }
      ctx.fillStyle=g; ctx.fillRect(r.x,r.y,r.w,r.h);
      ctx.fillStyle="rgba(255,255,255,.28)";
      ctx.beginPath(); ctx.ellipse(r.x+r.w/2,r.y+r.h*.88,r.w*.38,r.h*.08,0,0,Math.PI*2); ctx.fill();
    }

    function captureBackground(){
      resize();
      wctx.drawImage(video,0,0,work.width,work.height);
      bgPixels=new Uint8ClampedArray(wctx.getImageData(0,0,work.width,work.height).data);
    }

    function makeForeground(){
      const frame=wctx.getImageData(0,0,work.width,work.height);
      const out=fctx.createImageData(work.width,work.height);
      const d=frame.data, od=out.data, r=roiPx();

      if(!bgPixels){ fctx.clearRect(0,0,work.width,work.height); return; }

      for(let y=0;y<work.height;y++){
        for(let x=0;x<work.width;x++){
          const i=(y*work.width+x)*4;
          if(x<r.x||x>=r.x+r.w||y<r.y||y>=r.y+r.h){ od[i+3]=0; continue; }

          const dr=Math.abs(d[i]-bgPixels[i]);
          const dg=Math.abs(d[i+1]-bgPixels[i+1]);
          const db=Math.abs(d[i+2]-bgPixels[i+2]);
          const diff=Math.max(dr,dg,db)*.7+((dr+dg+db)/3)*.3;
          const a=smoothstep(state.threshold,state.threshold+state.softness,diff);

          od[i]=d[i]; od[i+1]=d[i+1]; od[i+2]=d[i+2]; od[i+3]=Math.round(a*255);
        }
      }
      fctx.putImageData(out,0,0);
    }

    function render(){
      if(!running)return;
      resize();

      wctx.drawImage(video,0,0,work.width,work.height);
      makeForeground();

      const vw=output.width,vh=output.height,r=roiOut();
      ctx.clearRect(0,0,vw,vh);

      ctx.save();
      ctx.filter="blur(14px) brightness(.48) saturate(.55)";
      ctx.drawImage(video,-24,-24,vw+48,vh+48);
      ctx.restore();

      ctx.save();
      ctx.beginPath(); ctx.rect(r.x,r.y,r.w,r.h); ctx.clip();
      drawStage(r);
      ctx.imageSmoothingEnabled=true;
      ctx.drawImage(fg,0,0,work.width,work.height,0,0,vw,vh);
      ctx.restore();

      ctx.strokeStyle="rgba(255,244,190,.92)"; ctx.lineWidth=3; ctx.strokeRect(r.x,r.y,r.w,r.h);
      raf=requestAnimationFrame(render);
    }

    async function start(){
      if(running)return;
      stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:"user",width:{ideal:1280},height:{ideal:720},frameRate:{ideal:30,max:30}},audio:false});
      video.srcObject=stream; await video.play(); video.style.transform="none";
      running=true; raf=requestAnimationFrame(render);
    }

    function stop(){
      running=false;
      if(raf)cancelAnimationFrame(raf);
      if(stream)stream.getTracks().forEach(t=>t.stop());
      raf=null; stream=null;
    }

    function update(p){Object.assign(state,p);}
    function resetCalibration(){bgPixels=null;}

    return {start,stop,update,captureBackground,resetCalibration,state};
  }
  window.StageComposite={create};
})();
