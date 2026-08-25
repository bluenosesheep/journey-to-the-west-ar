
(function(){
  function create({video,output}){
    const ctx=output.getContext("2d",{willReadFrequently:true});
    const work=document.createElement("canvas");
    const wctx=work.getContext("2d",{willReadFrequently:true});
    let stream=null,raf=null,running=false;
    let key={r:40,g:180,b:70};

    const state={
      cx:.50,cy:.56,width:.54,height:.54,
      tolerance:58,softness:42,spill:.45,
      stageStyle:"park"
    };

    function resize(){
      const vw=video.videoWidth||1280,vh=video.videoHeight||720;
      const s=Math.min(1,720/vw);
      work.width=Math.max(360,Math.round(vw*s));
      work.height=Math.max(202,Math.round(vh*s));
      if(output.width!==vw||output.height!==vh){output.width=vw;output.height=vh;}
    }

    function roiOut(){
      const rw=state.width*output.width,rh=state.height*output.height;
      return{x:state.cx*output.width-rw/2,y:state.cy*output.height-rh/2,w:rw,h:rh};
    }

    function smoothstep(a,b,x){
      const t=Math.max(0,Math.min(1,(x-a)/Math.max(.001,b-a)));
      return t*t*(3-2*t);
    }

    function rgbToYcbcr(r,g,b){
      return {
        y:.299*r+.587*g+.114*b,
        cb:128-.168736*r-.331264*g+.5*b,
        cr:128+.5*r-.418688*g-.081312*b
      };
    }

    function keyDistance(r,g,b){
      const a=rgbToYcbcr(r,g,b), k=rgbToYcbcr(key.r,key.g,key.b);
      const chroma=Math.hypot(a.cb-k.cb,a.cr-k.cr);
      const lum=Math.abs(a.y-k.y)*.18;
      return chroma+lum;
    }

    function drawStage(r){
      const g=ctx.createLinearGradient(r.x,r.y,r.x,r.y+r.h);
      if(state.stageStyle==="market"){
        g.addColorStop(0,"#ffe0aa");g.addColorStop(.58,"#fff3da");g.addColorStop(1,"#e2bf8c");
      }else if(state.stageStyle==="city"){
        g.addColorStop(0,"#b9dcff");g.addColorStop(.58,"#edf6ff");g.addColorStop(1,"#d7e4ef");
      }else{
        g.addColorStop(0,"#cbe8ff");g.addColorStop(.58,"#eef8ff");g.addColorStop(.60,"#c8e8b4");g.addColorStop(1,"#9dcb82");
      }
      ctx.fillStyle=g;ctx.fillRect(r.x,r.y,r.w,r.h);
      ctx.fillStyle="rgba(255,255,255,.28)";
      ctx.beginPath();ctx.ellipse(r.x+r.w/2,r.y+r.h*.88,r.w*.38,r.h*.08,0,0,Math.PI*2);ctx.fill();
    }

    function render(){
      if(!running)return;
      resize();

      const vw=output.width,vh=output.height,r=roiOut();
      wctx.drawImage(video,0,0,work.width,work.height);
      const img=wctx.getImageData(0,0,work.width,work.height);
      const d=img.data;

      const rx=(state.cx-state.width/2)*work.width;
      const ry=(state.cy-state.height/2)*work.height;
      const rw=state.width*work.width,rh=state.height*work.height;

      for(let y=0;y<work.height;y++){
        for(let x=0;x<work.width;x++){
          const i=(y*work.width+x)*4;
          if(x<rx||x>rx+rw||y<ry||y>ry+rh){d[i+3]=0;continue;}

          const dist=keyDistance(d[i],d[i+1],d[i+2]);
          const keep=smoothstep(state.tolerance,state.tolerance+state.softness,dist);
          d[i+3]=Math.round(keep*255);

          // Basic spill suppression near transparent keyed edges.
          if(keep<.92 && state.spill>0){
            const avg=(d[i]+d[i+2])/2;
            if(d[i+1]>avg){
              d[i+1]=Math.round(d[i+1]*(1-state.spill)+avg*state.spill);
            }
          }
        }
      }

      wctx.putImageData(img,0,0);

      ctx.clearRect(0,0,vw,vh);

      // Outside ROI is deliberately dark/blurred for this demo.
      ctx.save();
      ctx.filter="blur(14px) brightness(.42) saturate(.5)";
      ctx.drawImage(video,-24,-24,vw+48,vh+48);
      ctx.restore();

      ctx.save();
      ctx.beginPath();ctx.rect(r.x,r.y,r.w,r.h);ctx.clip();
      drawStage(r);
      ctx.imageSmoothingEnabled=true;
      ctx.drawImage(work,0,0,work.width,work.height,0,0,vw,vh);
      ctx.restore();

      ctx.strokeStyle="rgba(255,244,190,.92)";ctx.lineWidth=3;ctx.strokeRect(r.x,r.y,r.w,r.h);
      raf=requestAnimationFrame(render);
    }

    async function start(){
      if(running)return;
      stream=await navigator.mediaDevices.getUserMedia({
        video:{facingMode:"user",width:{ideal:1280},height:{ideal:720},frameRate:{ideal:30,max:30}},
        audio:false
      });
      video.srcObject=stream;await video.play();video.style.transform="none";
      running=true;raf=requestAnimationFrame(render);
    }

    function pickKeyFromScreen(clientX,clientY){
      const rect=output.getBoundingClientRect();
      const nx=(clientX-rect.left)/rect.width,ny=(clientY-rect.top)/rect.height;
      const x=Math.max(0,Math.min(work.width-1,Math.round(nx*work.width)));
      const y=Math.max(0,Math.min(work.height-1,Math.round(ny*work.height)));
      wctx.drawImage(video,0,0,work.width,work.height);
      const p=wctx.getImageData(x,y,1,1).data;
      key={r:p[0],g:p[1],b:p[2]};
      return {...key};
    }

    function setKey(rgb){key={...rgb};}
    function update(p){Object.assign(state,p);}
    return{start,update,pickKeyFromScreen,setKey,state,getKey:()=>({...key})};
  }
  window.ChromaStage={create};
})();
