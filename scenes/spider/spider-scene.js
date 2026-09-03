/*
 * Spider Scene Module v2
 * Full Spider story + small-spider interaction extracted from the stable DIY build.
 */
window.SpiderSceneModule = window.SpiderSceneModule || {
  config:{
    assetBase:"../../assets/spider/",
    targetIndex:0,
    mirrorAR:true,
    mirrorHand:true,
    handFps:15,
    sleepMs:3000,
    integrated:false,
    sceneSelector:"a-scene",
    onActivate:null,
    onLeave:null
  },

  configure(options={}){
    Object.assign(this.config,options);
    if(!this.config.assetBase.endsWith("/"))this.config.assetBase+="/";
    return this;
  },

  asset(name){ return this.config.assetBase + name; },

  activateHost(){
    if(typeof this.config.onActivate==="function") this.config.onActivate("spider");
  },

  leaveHost(){
    if(typeof this.config.onLeave==="function"){
      this.config.onLeave("spider");
      return;
    }
    this.resetStandalone();
  },

  ensureUI(){
    const body=document.body;
    const make=(html)=>{
      const wrap=document.createElement("div");
      wrap.innerHTML=html.trim();
      const el=wrap.firstElementChild;
      body.appendChild(el);
      return el;
    };

    if(!document.getElementById("handBtn")){
      const b=make('<button id="handBtn" type="button">✨ INTERACT · OFF</button>');
      b.style.cssText="position:fixed;right:18px;top:18px;z-index:130;border:0;border-radius:999px;padding:10px 14px;background:rgba(255,248,220,.96);color:#56713b;font:800 13px/1 system-ui;box-shadow:0 5px 18px rgba(0,0,0,.16);cursor:pointer;display:none";
    }
    if(!document.getElementById("handStatus")){
      const d=make('<div id="handStatus">手势：已关闭</div>');
      d.style.cssText="position:fixed;right:18px;top:62px;z-index:130;display:none;padding:8px 12px;border-radius:999px;background:rgba(255,255,255,.90);color:#333;font:700 12px/1.2 system-ui;box-shadow:0 4px 16px rgba(0,0,0,.16)";
    }
    if(!document.getElementById("handCursor")){
      const d=make('<div id="handCursor">✨</div>');
      d.style.cssText="position:fixed;z-index:140;width:68px;height:68px;margin:-34px 0 0 -34px;border-radius:50%;display:none;place-items:center;pointer-events:none;font-size:34px;background:rgba(255,255,255,.90);box-shadow:0 6px 26px rgba(0,0,0,.26)";
    }

    if(!document.getElementById("spiderFightBtn")){
      make('<button id="spiderFightBtn" type="button">💪 赶走它</button>');
      make('<button id="spiderRetryBtn" type="button">↻ 再试一次</button>');
      make('<button id="spiderLeaveBtn" type="button">✅ 离开</button>');
      make('<div id="spiderProgress">🕷️ 0 / 4</div>');
      const c=make('<canvas id="spiderCanvas" class="off" width="768" height="512"></canvas>');
      c.style.display="none";
    }
  },

  ensureAREntities(){
    const scene=document.querySelector(this.config.sceneSelector);
    if(!scene) throw new Error("SpiderSceneModule: a-scene not found");

    if(!document.getElementById("spiderWorld")){
      const world=document.createElement("a-entity");
      world.id="spiderWorld";
      world.setAttribute("visible","false");

      const plane=document.createElement("a-plane");
      plane.id="spiderDisplay";
      plane.setAttribute("width","2.15");
      plane.setAttribute("height","2.15");
      plane.setAttribute("position","0 0.03 0.02");
      plane.setAttribute("material","shader:flat;src:#spiderCanvas;transparent:true;alphaTest:0.01;depthWrite:false;side:double");
      plane.setAttribute("spider-canvas","");
      world.appendChild(plane);
      scene.appendChild(world);
    }

    if(!document.querySelector("[spider-controller]")){
      const target=document.createElement("a-entity");
      target.setAttribute("mindar-image-target",`targetIndex:${this.config.targetIndex}`);
      target.setAttribute("spider-controller","world:#spiderWorld");
      scene.appendChild(target);
    }
  },

  bindUI(){
    const fight=document.getElementById("spiderFightBtn");
    const retry=document.getElementById("spiderRetryBtn");
    const leave=document.getElementById("spiderLeaveBtn");
    const hand=document.getElementById("handBtn");

    if(fight&&!fight.dataset.bound){
      fight.dataset.bound="1";
      fight.addEventListener("click",()=>window.SpiderMode.enterGame());
    }
    if(retry&&!retry.dataset.bound){
      retry.dataset.bound="1";
      retry.addEventListener("click",()=>window.SpiderMode.retry());
    }
    if(leave&&!leave.dataset.bound){
      leave.dataset.bound="1";
      leave.addEventListener("click",()=>window.SpiderMode.leave());
    }
    if(!this.config.integrated && hand && !hand.dataset.bound){
      hand.dataset.bound="1";
      hand.addEventListener("click",()=>window.StandaloneSpiderHandMode.toggle());
    }
  },

  install(options={}){
    this.configure(options);
    this.ensureUI();
    this.ensureAREntities();
    this.bindUI();
    if(window.StandaloneSpiderHandMode){
      window.StandaloneSpiderHandMode.sleepMs=this.config.sleepMs;
    }
  },

  resetStandalone(){
    window.StandaloneSpiderHandMode?.sleep();
    if(window.SpiderMode)window.SpiderMode.mode="waiting";
    ["spiderFightBtn","spiderRetryBtn","spiderLeaveBtn","spiderProgress","handStatus"].forEach(id=>{
      const el=document.getElementById(id);
      if(el)el.style.display="none";
    });
    const hand=document.getElementById("handBtn");
    if(hand){hand.style.display="none";hand.textContent="✨ INTERACT · OFF";}
    const ctrl=document.querySelector("[spider-controller]")?.components?.["spider-controller"];
    ctrl?.hideWorld?.();
    const comp=document.getElementById("spiderDisplay")?.components?.["spider-canvas"];
    comp?.setMode("waiting");
    comp?.resetGame();
    const hint=document.getElementById("hint");
    if(hint)hint.textContent="请把镜头对准 SPIDER 卡";
  }
};


window.SpiderMode={
  mode:"waiting",

  setHint(text){
    const h=document.getElementById("hint");
    if(h)h.textContent=text;
  },

  showStory(){
    this.mode="story";
    window.StandaloneSpiderHandMode?.sleep();

    document.getElementById("spiderFightBtn").style.display="block";
    document.getElementById("spiderLeaveBtn").style.display="none";
    document.getElementById("spiderRetryBtn").style.display="none";
    document.getElementById("handBtn").style.display="none";
    document.getElementById("handStatus").style.display="none";
    document.getElementById("spiderProgress").style.display="none";

    const comp=document.getElementById("spiderDisplay")?.components?.["spider-canvas"];
    comp?.setMode("story");

    this.setHint("大蜘蛛出现了！🕷️");
  },

  enterGame(){
    if(this.mode!=="story")return;
    this.mode="boss";

    document.getElementById("spiderFightBtn").style.display="none";
    document.getElementById("spiderLeaveBtn").style.display="none";
    document.getElementById("handBtn").style.display="block";
    document.getElementById("handBtn").textContent="✨ INTERACT · OFF";
    document.getElementById("spiderProgress").style.display="block";

    const comp=document.getElementById("spiderDisplay")?.components?.["spider-canvas"];
    comp?.setMode("boss");
    comp?.resetBoss();

    this.setHint("找到大蜘蛛身上的发光点，命中 3 次！🎯");
  },

  enterSpiderGame(){
    if(this.mode!=="boss")return;
    this.mode="game";

    const comp=document.getElementById("spiderDisplay")?.components?.["spider-canvas"];
    comp?.setMode("game");
    comp?.resetGame();

    document.getElementById("spiderProgress").style.display="block";
    this.setHint("大蜘蛛逃走了！抓住 4 只小蜘蛛放进垃圾筐！🗑️");
  },

  complete(){
    if(this.mode!=="game")return;
    this.mode="complete";
    window.StandaloneSpiderHandMode?.sleep();

    const comp=document.getElementById("spiderDisplay")?.components?.["spider-canvas"];
    comp?.setMode("complete");

    document.getElementById("handBtn").style.display="none";
    document.getElementById("handStatus").style.display="none";
    document.getElementById("spiderProgress").style.display="none";
    document.getElementById("spiderLeaveBtn").style.display="block";
    document.getElementById("spiderRetryBtn").style.display="block";
    this.positionCompleteButtons();

    this.setHint("🎉 任务完成！");
  },

  positionCompleteButtons(){
    const retry=document.getElementById("spiderRetryBtn");
    const leave=document.getElementById("spiderLeaveBtn");
    if(!retry||!leave)return;

    // Put the pair centered as one group: retry on the left, leave on the right.
    retry.style.left="calc(50% - 72px)";
    retry.style.bottom="max(76px,calc(env(safe-area-inset-bottom) + 58px))";
    retry.style.transform="translateX(-50%)";

    leave.style.left="calc(50% + 72px)";
    leave.style.bottom="max(76px,calc(env(safe-area-inset-bottom) + 58px))";
    leave.style.transform="translateX(-50%)";
  },

  retry(){
    if(this.mode!=="complete")return;

    window.StandaloneSpiderHandMode?.sleep();
    this.mode="boss";

    document.getElementById("spiderRetryBtn").style.display="none";
    document.getElementById("spiderLeaveBtn").style.display="none";
    document.getElementById("handBtn").style.display="block";
    document.getElementById("handBtn").textContent="✨ INTERACT · OFF";
    document.getElementById("handStatus").style.display="none";
    document.getElementById("spiderProgress").style.display="block";

    const comp=document.getElementById("spiderDisplay")?.components?.["spider-canvas"];
    comp?.setMode("boss");
    comp?.resetBoss();

    const ctrl=document.querySelector("[spider-controller]")?.components?.["spider-controller"];
    if(ctrl)ctrl.dragState=null;

    this.setHint("再来一次！找到发光点，先赶走大蜘蛛！🎯");
  },

  leave(){
    // Spider is part of the unified DIY scene manager. Leaving Spider must
    // reset the shared scene state too; otherwise the shared INTERACT button
    // can remain hidden when the next PARK / MARKET scene starts.
    window.StandaloneSpiderHandMode?.sleep();
    this.mode="waiting";

    const comp=document.getElementById("spiderDisplay")?.components?.["spider-canvas"];
    comp?.setMode("waiting");
    comp?.resetGame();

    const ctrl=document.querySelector("[spider-controller]")?.components?.["spider-controller"];
    if(ctrl){
      ctrl.dragState=null;
      ctrl.hideWorld();
    }

    window.SpiderSceneModule.leaveHost();
  }
};

window.StandaloneSpiderHandMode={
  running:false,
  sleeping:false,
  timer:null,
  sleepMs:3000,

  clearTimer(){
    if(this.timer){clearTimeout(this.timer);this.timer=null}
  },

  noteInteraction(){
    if(!this.running)return;
    this.clearTimer();
    this.timer=setTimeout(()=>this.sleep(),this.sleepMs);
  },

  async start(){
    if(this.running || !["boss","game"].includes(window.SpiderMode.mode))return;

    const status=document.getElementById("handStatus");
    const cursor=document.getElementById("handCursor");
    const video=document.querySelector("video");
    if(!video||!window.ClassroomHandTracking)return;

    status.style.display="block";
    status.textContent="手势：启动中…";

    await window.ClassroomHandTracking.start({
      video,
      cursor,
      mirror:window.SpiderSceneModule.config.mirrorHand,
      maxFps:window.SpiderSceneModule.config.handFps,
      smoothing:.38,
      pinchDownRatio:.34,
      pinchUpRatio:.44,
      reuseExistingVideo:true,
      viewport:()=>({width:innerWidth,height:innerHeight}),
      onStatus:(msg)=>{if(status)status.textContent="手势："+msg},
      onArmedChange:(armed)=>{
        if(!status)return;
        const boss=window.SpiderMode.mode==="boss";
        status.textContent=armed?(boss?"手势：瞄准发光点":"手势：抓小蜘蛛"):"张开手 ✋";
      },
      onMetrics:(data)=>{
        if(!status)return;
        if(!data.handVisible)status.textContent="手势：请伸出一只手";
        else if(data.pinching)status.textContent=window.SpiderMode.mode==="boss"?"手势：命中":"手势：抓住";
        else status.textContent=window.SpiderMode.mode==="boss"?"手势：瞄准发光点":"手势：抓小蜘蛛";
      }
    });

    this.running=true;
    this.sleeping=false;
    this.noteInteraction();
    window.ClassroomHandTracking.requireReleaseToArm(300);
    document.getElementById("handBtn").textContent="✨ INTERACT · ON";
  },

  sleep(){
    this.clearTimer();
    if(this.running){
      window.ClassroomHandTracking?.stop({keepVideo:true,keepModel:true});
    }
    this.running=false;
    this.sleeping=true;

    const cursor=document.getElementById("handCursor");
    const status=document.getElementById("handStatus");
    const btn=document.getElementById("handBtn");

    if(cursor)cursor.style.display="none";
    if(["boss","game"].includes(window.SpiderMode.mode)){
      if(status){
        status.style.display="block";
        status.textContent="手势：已关闭 · 再点 INTERACT 唤醒";
      }
      if(btn)btn.textContent="✨ INTERACT · OFF";
    }else{
      if(status)status.style.display="none";
    }
  },

  toggle(){
    this.running?this.sleep():this.start();
  }
};

AFRAME.registerComponent("spider-canvas",{
  init(){
    this.c=document.getElementById("spiderCanvas");
    this.ctx=this.c.getContext("2d");
    this.mode="waiting";
    this.start=performance.now();
    this.needsRender=true;
    this.texture=null;

    // Big-spider variant state. The selected Boss is locked for the full Story.
    this.storyVariant=null;
    this.lastStoryVariant=window.SpiderSceneModule._lastStoryVariant||null;
    this.storyAction="idle";
    this.storyActionStart=performance.now();
    this.storyActionDuration=1800;
    this.nextStoryAction=performance.now()+1800;

    // Three readable hit zones for the interactive Boss phase. They sit on
    // visible parts of both the red and gray spider artwork.
    this.bossTargets=[
      {x:.37,y:.45},
      {x:.50,y:.34},
      {x:.63,y:.45}
    ];
    this.bossHits=0;
    this.bossTarget=0;
    this.bossReaction="idle";
    this.bossActionStart=0;
    this.bossActionDuration=0;
    this.bossHitLockUntil=0;

    this.img={};
    this.loaded=0;

    const sources={
      body:window.SpiderSceneModule.asset("spider_body.png"),
      gray:window.SpiderSceneModule.asset("spider_gray.png"),
      shadow:window.SpiderSceneModule.asset("spider_shadow.png"),
      web:window.SpiderSceneModule.asset("spider_web.png"),
      dust:window.SpiderSceneModule.asset("spider_dust.png"),
      lines:window.SpiderSceneModule.asset("spider_attack_lines.png"),
      bin:window.SpiderSceneModule.asset("spider_bin.png")
    };

    const entries=Object.entries(sources);
    this.total=entries.length;

    entries.forEach(([k,src])=>{
      const im=new Image();
      im.onload=()=>{this.img[k]=im;this.loaded++};
      im.src=src;
    });

    this.resetGame();
  },

  setMode(mode){
    this.mode=mode;
    this.start=performance.now();
    this._last=0;
    this.needsRender=true;

    if(mode==="story"){
      this.chooseStoryVariant();
      this.storyAction="enter";
      this.storyActionStart=this.start;
      this.storyActionDuration=2100;
      this.nextStoryAction=this.start+3000;
    }
  },

  chooseStoryVariant(){
    const variants=[
      {key:"red",img:"body",scale:1.04,speed:1.08,attack:1.12,drift:1.00},
      {key:"gray",img:"gray",scale:.98,speed:.94,attack:1.04,drift:1.16}
    ];

    let pool=variants;
    if(this.lastStoryVariant && variants.length>1){
      pool=variants.filter(v=>v.key!==this.lastStoryVariant);
    }
    const picked=pool[Math.floor(Math.random()*pool.length)];
    this.storyVariant=picked;
    this.lastStoryVariant=picked.key;
    window.SpiderSceneModule._lastStoryVariant=picked.key;
  },

  currentSpiderImage(){
    const v=this.storyVariant;
    return this.img?.[v?.img] || this.img?.body;
  },

  resetBoss(){
    this.bossHits=0;
    this.bossTarget=Math.floor(Math.random()*this.bossTargets.length);
    this.bossReaction="idle";
    this.bossActionStart=performance.now();
    this.bossActionDuration=0;
    this.bossHitLockUntil=0;
    this.updateBossProgress();
    this._last=0;
  },

  updateBossProgress(){
    const p=document.getElementById("spiderProgress");
    if(p)p.textContent=`🎯 ${this.bossHits} / 3`;
  },

  bossTargetPoint(){
    const target=this.bossTargets[this.bossTarget]||this.bossTargets[0];
    return{x:this.c.width*target.x,y:this.c.height*target.y};
  },

  hitBoss(x,y,source){
    if(this.mode!=="boss"||this.bossReaction==="escape")return false;
    const now=performance.now();
    if(now<this.bossHitLockUntil)return false;

    const target=this.bossTargetPoint();
    const radius=source==="hand"?82:62;
    if(Math.hypot(x-target.x,y-target.y)>radius){
      window.SpiderMode.setHint("看准蜘蛛身上闪动的光圈！🎯");
      return false;
    }

    this.bossHits++;
    this.updateBossProgress();
    this.bossActionStart=now;
    this.bossHitLockUntil=now+430;

    if(this.bossHits>=3){
      this.bossReaction="escape";
      this.bossActionDuration=1250;
      window.SpiderMode.setHint("成功了！大蜘蛛要逃走啦！💨");
      setTimeout(()=>window.SpiderMode.enterSpiderGame(),this.bossActionDuration+160);
    }else{
      this.bossReaction="hit";
      this.bossActionDuration=520;
      const remaining=3-this.bossHits;
      window.SpiderMode.setHint(`命中了！还要找到 ${remaining} 个发光点`);
      const step=Math.random()<.5?1:2;
      this.bossTarget=(this.bossTarget+step)%this.bossTargets.length;
    }

    this._last=0;
    return true;
  },

  scheduleStoryAction(now){
    const v=this.storyVariant||{speed:1,attack:1,drift:1};
    const r=Math.random();
    if(r<.26){
      this.storyAction=Math.random()<.5?"crawl-left":"crawl-right";
      this.storyActionDuration=(900+Math.random()*650)/v.speed;
    }else if(r<.46){
      this.storyAction="watch";
      this.storyActionDuration=850+Math.random()*650;
    }else{
      this.storyAction="attack";
      this.storyActionDuration=(820+Math.random()*220)/v.attack;
    }
    this.storyActionStart=now;
    this.nextStoryAction=now+this.storyActionDuration+900+Math.random()*1600;
  },

  resetGame(){
    const specs=[
      {x:110,y:105,vx:44,vy:31,phase:.2,scale:.13},
      {x:655,y:115,vx:-41,vy:34,phase:1.4,scale:.12},
      {x:135,y:330,vx:47,vy:-35,phase:2.7,scale:.13},
      {x:635,y:305,vx:-45,vy:-30,phase:4.1,scale:.12}
    ];
    this.spiders=specs.map((s,i)=>({
      ...s,
      id:i,
      caught:false,
      dragging:false,
      wanderPhase:Math.random()*Math.PI*2,
      wanderSpeed:.55+Math.random()*.75,
      turnBias:(Math.random()-.5)*.9,
      nextTurn:performance.now()+700+Math.random()*1400
    }));
    this.lastGameTime=performance.now();
    this.updateProgress();
    this._last=0;
  },

  updateProgress(){
    const caught=this.spiders?.filter(s=>s.caught).length||0;
    const p=document.getElementById("spiderProgress");
    if(p)p.textContent=`🕷️ ${caught} / 4`;
  },

  getSpider(id){
    return this.spiders.find(s=>s.id===id);
  },

  setSpiderPosition(id,x,y){
    const s=this.getSpider(id);
    if(!s||s.caught)return;
    s.x=Math.max(55,Math.min(713,x));
    // v7 moved the bin lower, so allow a dragged spider to travel deep enough
    // into the bin. The previous max Y=400 made the front-rim threshold
    // physically unreachable.
    s.y=Math.max(45,Math.min(495,y));
    s.dragging=true;
    this._last=0;
  },

  releaseSpider(id){
    const s=this.getSpider(id);
    if(!s||s.caught)return false;
    s.dragging=false;

    // IMPORTANT: use the exact same bin geometry as drawGame().
    // In v5 the visual hide threshold and the drop-success threshold were
    // different, so the spider could disappear visually but fail the drop.
    const w=this.c.width,h=this.c.height;
    const binW=220;
    const binRatio=this.img.bin?.naturalHeight/Math.max(1,this.img.bin?.naturalWidth||1);
    const binH=binW*binRatio;
    const binCX=w*.50;
    const binCY=h*.84;
    // The basket opening is near the upper quarter of the image, not the middle.
    // Use the same rim geometry as drawGame() so release success matches the visual mouth.
    const frontRimY=binCY-binH*.34;

    const withinMouthX =
      s.x>=binCX-binW*.44 && s.x<=binCX+binW*.44;

    const belowFrontRim =
      s.y>=frontRimY-6;

    if(withinMouthX && belowFrontRim){
      s.caught=true;
      s.dragging=false;
      this.updateProgress();

      const caught=this.spiders.filter(x=>x.caught).length;

      if(caught>=4){
        setTimeout(()=>window.SpiderMode.complete(),180);
      }else{
        window.SpiderMode.setHint(`抓到了！还有 ${4-caught} 只小蜘蛛`);
      }
      return true;
    }

    window.SpiderMode.setHint("再往下放一点，越过桶口前沿就可以啦！");
    return false;
  },

  drawCentered(img,cx,cy,w,h,r=0,a=1){
    if(!img)return;
    const ctx=this.ctx;
    ctx.save();
    ctx.globalAlpha=a;
    ctx.translate(cx,cy);
    ctx.rotate(r);
    ctx.drawImage(img,-w/2,-h/2,w,h);
    ctx.restore();
  },

  drawStory(now){
    const c=this.c,w=c.width,h=c.height;
    const sec=(now-this.start)/1000;
    const v=this.storyVariant||{key:"red",img:"body",scale:1,speed:1,attack:1,drift:1};

    // Story action state machine.
    // V3 stayed in "enter" forever after the opening animation finished,
    // because the scheduler explicitly skipped "enter". Move into a living
    // idle state when any action completes, then schedule the next random action.
    const elapsedAction=now-this.storyActionStart;
    if(this.storyAction==="enter" && elapsedAction>=this.storyActionDuration){
      this.storyAction="idle";
      this.storyActionStart=now;
      this.storyActionDuration=900;
      this.nextStoryAction=now+700+Math.random()*900;
    }else if(
      this.storyAction!=="idle" &&
      this.storyAction!=="enter" &&
      elapsedAction>=this.storyActionDuration
    ){
      this.storyAction="idle";
      this.storyActionStart=now;
      this.storyActionDuration=700+Math.random()*700;
      this.nextStoryAction=now+450+Math.random()*1050;
    }else if(this.storyAction==="idle" && now>=this.nextStoryAction){
      this.scheduleStoryAction(now);
    }

    // Web reacts to the Boss: subtle breathing plus an impact wave on entrance/attack.
    let webPulse=0;
    if(this.storyAction==="enter"){
      const p=Math.min(1,(now-this.storyActionStart)/this.storyActionDuration);
      webPulse=Math.sin(Math.PI*Math.min(1,p))*1.0;
    }else if(this.storyAction==="attack"){
      const p=Math.min(1,(now-this.storyActionStart)/this.storyActionDuration);
      webPulse=Math.sin(Math.PI*p)*.72;
    }

    this.ctx.save();
    this.ctx.translate(w*.50,h*.61);
    this.ctx.rotate(Math.sin(sec*.9)*.006);
    this.ctx.scale(1+webPulse*.025,1-webPulse*.015);
    this.ctx.globalAlpha=.46;
    this.ctx.drawImage(this.img.web,-w*.43,-h*.245,w*.86,h*.49);
    this.ctx.restore();

    let x=Math.sin(sec*.72*v.drift)*4;
    let y=Math.sin(sec*1.08)*2;
    let sx=1,sy=1,rot=Math.sin(sec*.65)*.35*Math.PI/180;
    let shadowSx=1,shadowSy=.62,shadowA=.48;
    let dustA=0,dustScale=.75,dustX=0;
    let linesA=0,linesScale=.72;

    const actionP=Math.max(0,Math.min(1,(now-this.storyActionStart)/Math.max(1,this.storyActionDuration)));

    if(this.storyAction==="enter"){
      // Boss rushes in from the distance, overshoots, then lands with weight.
      const p=actionP;
      if(p<.62){
        const q=p/.62;
        const e=1-Math.pow(1-q,3);
        const arrive=.18+1.02*e;
        sx=sy=arrive;
        y=-82*(1-e);
        rot=(1-e)*(-2.0*Math.PI/180);
        shadowSx=.55+.48*e;
        shadowSy=.34+.26*e;
        shadowA=.22+.26*e;
      }else{
        const q=(p-.62)/.38;
        const impact=Math.sin(Math.PI*q);
        sx=1.24-impact*.11;
        sy=1.16-impact*.24;
        y=18*impact;
        shadowSx=1.08+impact*.28;
        shadowSy=.54+impact*.10;
        dustA=.88*(1-q);
        dustScale=.78+.40*q;
      }
    }else if(this.storyAction==="crawl-left"||this.storyAction==="crawl-right"){
      const dir=this.storyAction==="crawl-left"?-1:1;
      const p=actionP;
      const smooth=p*p*(3-2*p);
      x+=dir*(10+36*smooth);
      y+=Math.sin(p*Math.PI*4)*3;
      rot+=dir*Math.sin(p*Math.PI)*1.35*Math.PI/180;
      sx=1.01+.012*Math.sin(p*Math.PI*2);
      sy=.99-.010*Math.sin(p*Math.PI*2);
      shadowSx=1.02;shadowSy=.59;
      if(p>.75){
        dustA=.16*(1-p)/.25;
        dustScale=.72+.10*p;
        dustX=-dir*9;
      }
    }else if(this.storyAction==="watch"){
      // Low, tense "watching you" pose.
      const p=Math.sin(Math.PI*actionP);
      y+=8*p;
      sx=1.035-.015*p;
      sy=.97-.055*p;
      rot+=Math.sin(actionP*Math.PI*2)*.55*Math.PI/180;
      shadowSx=.96+.05*p;
      shadowSy=.58-.04*p;
    }else if(this.storyAction==="attack"){
      // Short threatening lunge toward camera, then recover.
      const p=actionP;
      const punch=Math.sin(Math.PI*p);
      const lunge=Math.pow(punch,.72);
      y-=56*lunge*v.attack;
      sx=1+.28*lunge*v.attack;
      sy=1+.20*lunge*v.attack;
      rot+=Math.sin(p*Math.PI*2)*1.1*Math.PI/180;
      linesA=.96*Math.pow(punch,1.15);
      linesScale=.72+.34*lunge;
      dustA=.52*Math.pow(punch,.9);
      dustScale=.80+.18*lunge;
      shadowSx=1.02+.12*lunge;
      shadowSy=.56-.07*lunge;
      shadowA=.48-.08*lunge;
    }else{
      // Organic idle, deliberately non-mechanical and continuously alive.
      x+=Math.sin(sec*1.37)*5*v.drift + Math.sin(sec*.53)*2.5;
      y+=Math.sin(sec*.91)*3 + Math.sin(sec*1.83)*1.2;
      rot+=Math.sin(sec*.74)*.55*Math.PI/180;
      sx=1+.012*Math.sin(sec*1.7);
      sy=1-.010*Math.sin(sec*1.7);
      shadowSx=1+.018*Math.sin(sec*1.4);
      shadowSy=.62-.012*Math.sin(sec*1.4);
    }

    if(linesA>0){
      this.drawCentered(this.img.lines,w*.50,h*.47,w*.94*linesScale,h*.94*linesScale,0,linesA);
    }

    this.drawCentered(this.img.shadow,w*.50,h*.70,w*.49*shadowSx,h*.18*shadowSy,0,shadowA);

    if(dustA>0){
      this.drawCentered(this.img.dust,w*.50+dustX,h*.69,w*.79*dustScale,h*.40*dustScale,0,dustA);
    }

    const body=this.img[v.img]||this.img.body;
    if(body){
      const ratio=body.naturalHeight/body.naturalWidth;
      const bw=w*.58*v.scale,bh=bw*ratio;
      this.ctx.save();
      this.ctx.translate(w*.50+x,h*.47+y);
      this.ctx.rotate(rot);
      this.ctx.scale(sx,sy);
      this.ctx.drawImage(body,-bw/2,-bh/2,bw,bh);
      this.ctx.restore();
    }
  },

  drawBoss(now){
    const c=this.c,w=c.width,h=c.height;
    const sec=(now-this.start)/1000;
    const v=this.storyVariant||{key:"red",img:"body",scale:1};
    const body=this.currentSpiderImage();
    if(!body)return;

    const webPulse=1+Math.sin(sec*1.35)*.012;
    this.ctx.save();
    this.ctx.translate(w*.50,h*.59);
    this.ctx.scale(webPulse,2-webPulse);
    this.ctx.globalAlpha=.44;
    this.ctx.drawImage(this.img.web,-w*.43,-h*.245,w*.86,h*.49);
    this.ctx.restore();

    let cx=w*.50+Math.sin(sec*1.15)*4;
    let cy=h*.47+Math.sin(sec*1.72)*3;
    let sx=1+.014*Math.sin(sec*2.05);
    let sy=1-.012*Math.sin(sec*2.05);
    let rot=Math.sin(sec*.92)*.7*Math.PI/180;
    let alpha=1;
    let linesA=0;
    let dustA=0;
    let trailStrength=0;
    let trailDir=0;
    let escapeBurst=0;
    let escapeBurstX=w*.50;

    const elapsed=now-this.bossActionStart;
    if(this.bossReaction==="hit"){
      const p=Math.min(1,elapsed/Math.max(1,this.bossActionDuration));
      const impact=Math.sin(Math.PI*p);
      cx+=Math.sin(p*Math.PI*9)*(1-p)*18;
      cy+=impact*10;
      sx+=impact*.15;
      sy-=impact*.18;
      rot+=Math.sin(p*Math.PI*5)*4.5*Math.PI/180;
      linesA=.72*(1-p);
      dustA=.55*(1-p);
      if(p>=1)this.bossReaction="idle";
    }else if(this.bossReaction==="escape"){
      const p=Math.min(1,elapsed/Math.max(1,this.bossActionDuration));
      const dir=v.key==="gray"?-1:1;
      if(p<.16){
        const squash=Math.sin(Math.PI*p/.16);
        sx+=squash*.18;
        sy-=squash*.25;
        cy+=squash*14;
        linesA=.82*(1-p/.16);
      }else{
        const q=(p-.16)/.84;
        const dash=Math.min(1,q/.68);
        const e=1-Math.pow(1-dash,3);
        const stride=Math.sin(dash*Math.PI*9);
        const launch=Math.sin(Math.PI*.5*Math.min(1,dash/.22));

        // Stop while the whole spider is still inside the canvas. A foreground
        // dust burst hides the disappearance, so no body part is edge-clipped.
        cx+=dir*w*.18*e;
        escapeBurstX=w*(.50+dir*.18);
        cy+=Math.abs(stride)*6*(1-dash);
        sx*=1+.16*launch*(1-dash)+stride*.028;
        sy*=1-.08*launch*(1-dash)-stride*.020;
        rot+=dir*(.028*launch+stride*.015);
        trailDir=dir;
        trailStrength=Math.sin(Math.PI*dash)*.78;

        // Let the dust build first, then fade the spider gradually behind it.
        // This makes the exit read as a run-away action instead of a cut.
        const vanish=Math.max(0,Math.min(1,(q-.58)/.28));
        alpha=1-vanish;
        dustA=.20*(1-dash);
        escapeBurst=q<.62
          ? Math.max(0,(q-.38)/.24)
          : Math.max(0,1-(q-.62)/.38);
        linesA=Math.max(linesA,(1-dash)*.42);
      }
    }

    this.drawCentered(this.img.shadow,cx,h*.70,w*.49*sx,h*.18*.62,0,.46*alpha);
    if(dustA>0)this.drawCentered(this.img.dust,w*.50,h*.69,w*.68,h*.34,0,dustA);
    if(linesA>0)this.drawCentered(this.img.lines,w*.50,h*.47,w*.88,h*.88,0,linesA);

    const ratio=body.naturalHeight/body.naturalWidth;
    const bw=w*.58*v.scale,bh=bw*ratio;
    if(trailStrength>0){
      for(let i=2;i>=1;i--){
        this.ctx.save();
        this.ctx.globalAlpha=trailStrength*(i===1?.22:.11);
        this.ctx.translate(cx-trailDir*i*38,cy);
        this.ctx.rotate(rot);
        this.ctx.scale(sx*(1-i*.035),sy);
        this.ctx.drawImage(body,-bw/2,-bh/2,bw,bh);
        this.ctx.restore();
      }
    }
    this.ctx.save();
    this.ctx.globalAlpha=alpha;
    this.ctx.translate(cx,cy);
    this.ctx.rotate(rot);
    this.ctx.scale(sx,sy);
    this.ctx.drawImage(body,-bw/2,-bh/2,bw,bh);
    this.ctx.restore();

    if(escapeBurst>0){
      const burstScale=.78+escapeBurst*.34;
      this.drawCentered(this.img.dust,escapeBurstX,h*.67,w*.76*burstScale,h*.38*burstScale,0,.96*escapeBurst);
      this.drawCentered(this.img.dust,escapeBurstX-trailDir*w*.07,h*.62,w*.48*burstScale,h*.25*burstScale,0,.62*escapeBurst);
      this.drawCentered(this.img.lines,escapeBurstX,h*.48,w*.66,h*.66,0,.30*escapeBurst);
    }

    if(this.bossReaction!=="escape"){
      const target=this.bossTargetPoint();
      const pulse=.5+.5*Math.sin(sec*5.4);
      const ring=28+pulse*8;
      this.ctx.save();
      this.ctx.globalCompositeOperation="screen";
      this.ctx.shadowColor="rgba(255,232,72,.95)";
      this.ctx.shadowBlur=16+pulse*10;
      this.ctx.fillStyle=`rgba(255,224,62,${.22+pulse*.16})`;
      this.ctx.strokeStyle=`rgba(255,250,164,${.78+pulse*.22})`;
      this.ctx.lineWidth=4;
      this.ctx.beginPath();
      this.ctx.arc(target.x,target.y,ring,0,Math.PI*2);
      this.ctx.fill();
      this.ctx.stroke();
      this.ctx.lineWidth=2;
      this.ctx.beginPath();
      this.ctx.arc(target.x,target.y,ring+10+pulse*4,0,Math.PI*2);
      this.ctx.stroke();
      this.ctx.restore();
    }
  },

  drawGame(now){
    const c=this.c,w=c.width,h=c.height;
    const dt=Math.min(.05,(now-this.lastGameTime)/1000);
    this.lastGameTime=now;

    // Web extends beyond the full roaming area of all four small spiders.
    // Oversize it deliberately so spiders always appear to be running on the web.
    this.drawCentered(this.img.web,w*.50,h*.48,w*1.48,h*1.08,0,.21);

    // Bin at bottom-center.
    // First draw the whole bin behind the spiders. After the spiders are drawn,
    // redraw only the FRONT wall of the bin so a dragged spider appears to go
    // inside the opening instead of floating in front of the bin.
    const binW=220;
    const binRatio=this.img.bin?.naturalHeight/Math.max(1,this.img.bin?.naturalWidth||1);
    const binH=binW*binRatio;
    const binCX=w*.50;
    const binCY=h*.84;

    // Approximate visible mouth / front-rim positions in canvas space.
    // The visible opening lives much higher than the old values suggested.
    // Start shrinking as the spider reaches the back of the opening, then let the
    // front wall cover it shortly afterwards so it appears to enter from the top.
    const mouthY=binCY-binH*.46;
    const frontRimY=binCY-binH*.34;

    this.drawCentered(this.img.bin,binCX,binCY,binW,binH,0,1);

    for(const s of this.spiders){
      if(s.caught)continue;

      if(!s.dragging){
        // Organic roaming: mild sinusoidal drift plus occasional random turns.
        const nowMs=now;
        if(nowMs>=s.nextTurn){
          const speed=Math.max(34,Math.min(58,Math.hypot(s.vx,s.vy)));
          const angle=Math.atan2(s.vy,s.vx)+(Math.random()-.5)*1.25+s.turnBias*.18;
          s.vx=Math.cos(angle)*speed;
          s.vy=Math.sin(angle)*speed;
          s.nextTurn=nowMs+650+Math.random()*1700;
          s.turnBias=(Math.random()-.5)*.9;
        }

        const drift=Math.sin(nowMs*.001*s.wanderSpeed+s.wanderPhase);
        s.x+=(s.vx+drift*5.5)*dt;
        s.y+=(s.vy+Math.cos(nowMs*.0011*s.wanderSpeed+s.wanderPhase)*4.5)*dt;

        // Use almost the full canvas so they don't bunch up.
        if(s.x<55){s.x=55;s.vx=Math.abs(s.vx)*(0.92+Math.random()*.18)}
        if(s.x>w-55){s.x=w-55;s.vx=-Math.abs(s.vx)*(0.92+Math.random()*.18)}
        if(s.y<45){s.y=45;s.vy=Math.abs(s.vy)*(0.92+Math.random()*.18)}
        if(s.y>h-95){s.y=h-95;s.vy=-Math.abs(s.vy)*(0.92+Math.random()*.18)}

        // Keep a soft no-roam zone around the bin so play starts with some distance.
        const bx=w*.50, by=h*.79;
        const dx=s.x-bx, dy=s.y-by;
        const d=Math.hypot(dx,dy);
        const avoidR=155;
        if(d<avoidR && d>0.001){
          const push=(avoidR-d)/avoidR;
          s.x+=(dx/d)*42*push*dt;
          s.y+=(dy/d)*42*push*dt;
          s.vx+=(dx/d)*18*push;
          s.vy+=(dy/d)*18*push;
        }
      }

      const wiggle=Math.sin(now*.006+s.phase);
      const body=this.currentSpiderImage();
      if(!body)continue;

      let visualScale=1;
      let visualX=s.x;
      let visualY=s.y;
      let visualAlpha=1;

      const insideMouthX =
        Math.abs(s.x-binCX) < binW*.44;

      if(s.dragging && insideMouthX){
        // At the bin opening: gradually shrink.
        if(s.y>=mouthY && s.y<frontRimY){
          const depth=Math.max(0,Math.min(1,(s.y-mouthY)/(frontRimY-mouthY)));
          // Funnel the spider toward the center of the opening while it descends.
          // This gives a diagonal "into the mouth" trajectory instead of sliding
          // straight down across the front of the bin.
          visualX=s.x+(binCX-s.x)*(.62*depth);
          visualScale=1-.46*depth;
          visualY=s.y+2*depth;
        }
        // Once it crosses the front rim, the front-wall occlusion pass hides it.
        else if(s.y>=frontRimY){
          visualX=s.x+(binCX-s.x)*.68;
          visualScale=.54;
          visualY=s.y+2;
          visualAlpha=0;
        }
      }

      const variantScale=this.storyVariant?.key==="gray"?.96:1;
      const size=w*s.scale*variantScale*(1+.025*wiggle)*visualScale;
      const ratio=body.naturalHeight/body.naturalWidth;
      this.drawCentered(body,visualX,visualY,size,size*ratio,wiggle*.045,visualAlpha);
    }

    // Front-wall occlusion pass.
    // Keep the top/opening behind the spider, but paint the lower ~72% of the
    // bin back on top. This creates a convincing "drop into the bin" effect.
    if(this.img.bin){
      const img=this.img.bin;
      // Repaint the front wall from the actual front rim upward enough to
      // occlude the spider as soon as it slips through the opening.
      const srcY=Math.round(img.naturalHeight*.18);
      const srcH=img.naturalHeight-srcY;
      const dstTop=frontRimY;
      const dstH=(binCY+binH/2)-frontRimY;

      this.ctx.save();
      this.ctx.drawImage(
        img,
        0,srcY,img.naturalWidth,srcH,
        binCX-binW/2,dstTop,binW,dstH
      );
      this.ctx.restore();
    }
  },

  prepareTexture(map){
    if(!map||this.texture===map)return;
    map.generateMipmaps=false;
    if(window.THREE?.LinearFilter){
      map.minFilter=THREE.LinearFilter;
      map.magFilter=THREE.LinearFilter;
    }
    this.texture=map;
  },

  tick(){
    if(this.loaded<this.total||this.mode==="waiting")return;

    const animated=this.mode==="story"||this.mode==="boss"||this.mode==="game";
    if(!animated&&!this.needsRender)return;

    const now=performance.now();
    const frameMs=this.mode==="game"||this.mode==="boss"?42:50;
    if(!this.needsRender&&this._last&&now-this._last<frameMs)return;
    this._last=now;
    this.needsRender=false;

    const c=this.c,ctx=this.ctx;
    ctx.clearRect(0,0,c.width,c.height);

    if(this.mode==="story")this.drawStory(now);
    else if(this.mode==="boss")this.drawBoss(now);
    else if(this.mode==="game"||this.mode==="complete")this.drawGame(now);

    const mesh=this.el.getObject3D("mesh"),map=mesh?.material?.map;
    if(map){this.prepareTexture(map);map.needsUpdate=true}
  }
});

AFRAME.registerComponent("spider-controller",{
  schema:{world:{type:"selector"}},

  init(){
    this.world=this.data.world;
    this.tracking=false;
    this.holding=false;
    this.dragState=null;
    this.poseHistory=[];
    this.maxPoseHistory=24;
    this.basePos=new THREE.Vector3();
    this.baseScale=new THREE.Vector3(1,1,1);

    this.planeWidth=2.15;
    this.planeHeight=2.15;
    this.canvasW=768;
    this.canvasH=512;

    if(this.world)this.world.object3D.visible=false;

    window.CityInput.register("spider-game",{
      down:(input)=>this.handleDown(input),
      move:(input)=>this.handleMove(input),
      up:(input)=>this.handleUp(input),
      cancel:(input)=>this.handleUp(input)
    });

    window.CityInput.register("spider-hand-auto-sleep",{
      down:(input)=>{if(input.source==="hand")window.StandaloneSpiderHandMode.noteInteraction()},
      up:(input)=>{if(input.source==="hand")window.StandaloneSpiderHandMode.noteInteraction()}
    });

    this.el.addEventListener("targetFound",()=>{
      if(window.SpiderMode.mode!=="waiting")return;

      window.SpiderSceneModule.activateHost();

      this.tracking=true;
      this.holding=false;
      this.poseHistory=[];

      if(this.world)this.world.object3D.visible=true;
      window.SpiderMode.showStory();
    });

    this.el.addEventListener("targetLost",()=>{
      if(window.SpiderMode.mode==="waiting")return;

      this.tracking=false;
      this.holding=true;
      this.holdStart=performance.now();

      let stable=null;
      const now=performance.now();

      for(let i=this.poseHistory.length-1;i>=0;i--){
        if(now-this.poseHistory[i].time>=260){
          stable=this.poseHistory[i];
          break;
        }
      }
      if(!stable&&this.poseHistory.length)stable=this.poseHistory[0];

      if(stable){
        this.basePos.copy(stable.pos);
        this.baseScale.copy(stable.scale);
      }else{
        this.el.object3D.updateMatrixWorld(true);
        const p=new THREE.Vector3(),q=new THREE.Quaternion(),sc=new THREE.Vector3();
        this.el.object3D.matrixWorld.decompose(p,q,sc);
        this.basePos.copy(p);
        this.baseScale.copy(sc);
      }

      if(this.world){
        const o=this.world.object3D;
        o.position.copy(this.basePos);
        o.quaternion.identity();
        o.scale.copy(this.baseScale);
        o.visible=true;
        o.updateMatrixWorld(true);
      }
    });
  },

  getCanvasComp(){
    return document.getElementById("spiderDisplay")?.components?.["spider-canvas"];
  },

  getCamera(){
    if(!this.camera){
      const e=document.querySelector("a-camera");
      this.camera=e&&e.getObject3D("camera");
    }
    return this.camera;
  },

  projectWorld(v){
    const cam=this.getCamera();
    if(!cam)return null;
    const p=v.clone().project(cam);
    const rawX=(p.x*.5+.5)*innerWidth;
    return{x:window.SpiderSceneModule.config.mirrorAR?innerWidth-rawX:rawX,y:(-p.y*.5+.5)*innerHeight};
  },

  canvasToLocal(x,y){
    return new THREE.Vector3(
      (x/this.canvasW-.5)*this.planeWidth,
      (.5-y/this.canvasH)*this.planeHeight,
      .10
    );
  },

  screenToCanvas(x,y){
    if(!this.world)return null;
    const obj=this.world.object3D;
    obj.updateMatrixWorld(true);

    const center=this.projectWorld(new THREE.Vector3(0,0,0).applyMatrix4(obj.matrixWorld));
    const right=this.projectWorld(new THREE.Vector3(.5,0,0).applyMatrix4(obj.matrixWorld));
    const up=this.projectWorld(new THREE.Vector3(0,.5,0).applyMatrix4(obj.matrixWorld));
    if(!center||!right||!up)return null;

    const pxPerUnitX=Math.max(1,Math.abs(right.x-center.x)*2);
    const pxPerUnitY=Math.max(1,Math.abs(up.y-center.y)*2);

    // AR canvas is horizontally mirrored. In Spider we convert screen
    // coordinates back into canvas coordinates, so X must be inverted here.
    // Park/Market don't use this screenToCanvas path, which is why they were
    // already working while Spider mouse picking was not.
    const localX=(window.SpiderSceneModule.config.mirrorAR?-1:1)*(x-center.x)/pxPerUnitX;
    const localY=-(y-center.y)/pxPerUnitY;

    return{
      x:(localX/this.planeWidth+.5)*this.canvasW,
      y:(.5-localY/this.planeHeight)*this.canvasH
    };
  },

  hitSpiderAt(screenX,screenY,source){
    if(window.SpiderMode.mode!=="game")return null;
    const c=this.screenToCanvas(screenX,screenY);
    const comp=this.getCanvasComp();
    if(!c||!comp)return null;

    // generous hit radius for small hands
    let best=null,bestD=Infinity;
    for(const s of comp.spiders){
      if(s.caught)continue;
      const d=Math.hypot(c.x-s.x,c.y-s.y);
      const radius=source==="hand"?78:60;
      if(d<=radius&&d<bestD){best=s.id;bestD=d}
    }
    return best;
  },

  handleDown(input){
    if(input.nativeEvent?.target?.closest?.("button,select"))return;

    if(window.SpiderMode.mode==="boss"){
      const comp=this.getCanvasComp();
      const pt=this.screenToCanvas(input.x,input.y);
      if(!comp||!pt)return;
      if(comp.hitBoss(pt.x,pt.y,input.source)){
        input.nativeEvent?.preventDefault?.();
      }
      return;
    }

    if(window.SpiderMode.mode!=="game")return;
    const id=this.hitSpiderAt(input.x,input.y,input.source);
    if(id===null)return;

    if(input.nativeEvent)input.nativeEvent.preventDefault();

    const comp=this.getCanvasComp();
    const pt=this.screenToCanvas(input.x,input.y);
    const s=comp?.getSpider(id);
    if(!comp||!pt||!s)return;

    this.dragState={
      pointerId:input.pointerId,
      id,
      dx:s.x-pt.x,
      dy:s.y-pt.y
    };
    s.dragging=true;
    window.SpiderMode.setHint("抓住了！把它放进垃圾筐 🗑️");
  },

  handleMove(input){
    if(!this.dragState||input.pointerId!==this.dragState.pointerId)return;
    if(input.nativeEvent)input.nativeEvent.preventDefault();

    const pt=this.screenToCanvas(input.x,input.y);
    const comp=this.getCanvasComp();
    if(!pt||!comp)return;

    comp.setSpiderPosition(
      this.dragState.id,
      pt.x+this.dragState.dx,
      pt.y+this.dragState.dy
    );
  },

  handleUp(input){
    if(!this.dragState||input.pointerId!==this.dragState.pointerId)return;

    const comp=this.getCanvasComp();
    comp?.releaseSpider(this.dragState.id);
    this.dragState=null;
  },

  hideWorld(){
    this.tracking=false;
    this.holding=false;
    this.dragState=null;
    if(this.world)this.world.object3D.visible=false;
  },

  tick(){
    if(!this.world||window.SpiderMode.mode==="waiting")return;

    const now=performance.now();
    const active=this.tracking||this.dragState;
    const frameMs=active?33:67;
    if(this._last&&now-this._last<frameMs)return;
    this._last=now;

    const obj=this.world.object3D;

    if(this.tracking){
      this.el.object3D.updateMatrixWorld(true);
      const p=new THREE.Vector3(),q=new THREE.Quaternion(),sc=new THREE.Vector3();
      this.el.object3D.matrixWorld.decompose(p,q,sc);

      this.poseHistory.push({pos:p.clone(),scale:sc.clone(),time:now});
      if(this.poseHistory.length>this.maxPoseHistory)this.poseHistory.shift();

      this.basePos.copy(p);
      this.baseScale.copy(sc);

      obj.position.copy(p);
      obj.quaternion.identity();
      obj.scale.copy(sc);
      obj.visible=true;
      obj.updateMatrixWorld(true);
    }else if(this.holding){
      // Hold in a stable location after the recognition card is removed.
      obj.position.copy(this.basePos);
      obj.quaternion.identity();
      obj.scale.copy(this.baseScale);
      obj.visible=true;
      obj.updateMatrixWorld(true);
    }
  }
});
