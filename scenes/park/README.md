# Park module v4

This rebuild fixes the previous module extraction.

The key difference:
- `park-scene.js` now contains the COMPLETE Park script from the stable DIY build:
  - StandaloneParkMode
  - StandaloneHandMode
  - park-canvas
  - park-drag-controller
- Standalone declares its MindAR target directly in HTML.
- Standalone uses `../../targets/park.mind`
- Standalone Park targetIndex = 0
- Park assets use `../../assets/park/`

Integrated later:
- reuse the same Park logic
- host uses `citywithmagic.mind`
- Park targetIndex = 1
