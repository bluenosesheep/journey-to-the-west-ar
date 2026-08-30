# Market module v1

Source of truth:
- uploaded stable `market_story_interactive.html`

Standalone structure:
```
scenes/
  market/
    market-scene.js
    market-style.css
    market_interactive_standalone.html
```

Standalone dependencies:
- `../../targets/market.mind`
- `../../assets/market/`
- `../../assets/city/market_scene.png`
- `../../js/input-router.js`
- `../../js/hand-tracking-performance.js`

Standalone mapping:
- market.mind
- targetIndex:0

Inherited mirror/performance behavior from the current stable DIY build:
- camera video mirror
- AR canvas mirror
- Hand `mirror:true`
- mirrored DOM hit projection
- Hand 15 FPS
- 3-second auto sleep

Later integrated DIY:
- reuse the same Market module
- host uses citywithmagic.mind
- Market maps to targetIndex:2
