// Classroom City - unified input router.
//
// STEP 3 goal:
// Mouse input no longer talks directly to Park / Market logic.
// Instead:
//
//   Mouse -> CityInput -> Park / Market
//
// STEP 4 can add:
//
//   Hand Tracking -> CityInput -> Park / Market
//
// without changing the interaction state machines again.

(function(){
  const handlers = new Map();

  function normalizePayload(x, y, meta){
    return {
      x,
      y,
      pointerId: meta?.pointerId ?? "virtual",
      source: meta?.source ?? "virtual",
      nativeEvent: meta?.nativeEvent ?? null
    };
  }

  function emit(type, x, y, meta){
    const payload = normalizePayload(x, y, meta);

    handlers.forEach((sceneHandlers)=>{
      const fn = sceneHandlers && sceneHandlers[type];
      if(typeof fn === "function"){
        fn(payload);
      }
    });
  }

  window.CityInput = {
    register(sceneName, sceneHandlers){
      handlers.set(sceneName, sceneHandlers || {});
    },

    unregister(sceneName){
      handlers.delete(sceneName);
    },

    down(x, y, meta={}){
      emit("down", x, y, meta);
    },

    move(x, y, meta={}){
      emit("move", x, y, meta);
    },

    up(x, y, meta={}){
      emit("up", x, y, meta);
    },

    cancel(x, y, meta={}){
      emit("cancel", x, y, meta);
    }
  };

  // Desktop / mouse / pointer adapter.
  // It only converts browser pointer events into CityInput events.
  // Scene logic decides whether the coordinates actually hit an object.
  window.addEventListener("pointerdown",(e)=>{
    window.CityInput.down(e.clientX,e.clientY,{
      source:"pointer",
      pointerId:e.pointerId,
      nativeEvent:e
    });
  },{passive:false});

  window.addEventListener("pointermove",(e)=>{
    window.CityInput.move(e.clientX,e.clientY,{
      source:"pointer",
      pointerId:e.pointerId,
      nativeEvent:e
    });
  },{passive:false});

  window.addEventListener("pointerup",(e)=>{
    window.CityInput.up(e.clientX,e.clientY,{
      source:"pointer",
      pointerId:e.pointerId,
      nativeEvent:e
    });
  },{passive:false});

  window.addEventListener("pointercancel",(e)=>{
    window.CityInput.cancel(e.clientX,e.clientY,{
      source:"pointer",
      pointerId:e.pointerId,
      nativeEvent:e
    });
  },{passive:false});
})();
