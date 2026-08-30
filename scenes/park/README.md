# Park module v1

Full Park flow extracted from the current stable DIY build.

Standalone:
- `park_interactive_standalone.html`
- scans `../../targets/park.mind`
- story view first
- button: `一起整理公园吧`
- interactive tree / flower / bench / fountain
- Reset + `整理好啦`
- mouse/touch and shared Hand Tracking

Core:
- `park-scene.js`
- `park-style.css`

Integrated later:
- use the same `park-scene.js`
- `targetIndex:1` with `citywithmagic.mind`
- host supplies onActivate/onLeave callbacks
