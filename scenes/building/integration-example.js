/*
Building integration example for DIY adapter.

The Building module itself stays independent.
The unified DIY host uses citywithmagic.mind where Building = targetIndex 0.
*/

BuildingSceneModule.install({
  assetBase:"./assets/city/",
  targetSelector:'[diy-building-target]'
});

// In the unified A-Frame host:
const buildingTarget=document.createElement("a-entity");
buildingTarget.setAttribute("mindar-image-target","targetIndex:0");
buildingTarget.setAttribute("diy-building-target","");
buildingTarget.setAttribute("standalone-city","");
scene.appendChild(buildingTarget);
