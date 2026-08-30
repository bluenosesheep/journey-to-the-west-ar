# Park module v5

Source of truth: the uploaded working `park_story_interactive.html`.

Standalone placement:
```
scenes/
  park/
    park-scene.js
    park-style.css
    park_interactive_standalone.html
```

Standalone dependencies:
- `../../targets/park.mind`
- `../../assets/park/`
- `../../assets/city/park_scene.png`
- `../../js/input-router.js`
- `../../js/hand-tracking-performance.js`

Important architecture:
- Park UI is NOT handwritten in the standalone page.
- `ParkSceneModule.mountUI()` owns the Story buttons, Hand UI, drag hit layer, and Park canvas.
- The standalone HTML only owns the MindAR/A-Frame host.
- `park.mind` is standalone-only and uses `targetIndex:0`.

Later integrated DIY:
- same Park module
- unified host uses `citywithmagic.mind`
- Park maps to `targetIndex:1`
