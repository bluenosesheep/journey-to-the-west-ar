# Building module v1

Source of truth:
- uploaded stable `building(2).html`

Standalone:
- `building_standalone.html`
- uses `../../targets/building.mind`
- Building targetIndex = 0
- far/near story behavior is preserved
- full mirror presentation is enabled in the standalone host to match the current DIY experience

Core:
- `building-scene.js`
- `building-style.css`

The Building module owns:
- City miniature UI
- Far / Near buttons
- Building scene behavior

The standalone host owns:
- MindAR scene
- camera orientation control
- hint
- building.mind

Later integrated DIY:
- use the same Building module
- unified target file: `citywithmagic.mind`
- Building targetIndex = 0
- adapter owns mounting into the host
