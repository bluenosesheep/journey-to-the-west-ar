# Spider module split

This folder is the first modular extraction from the current stable DIY build.

Files:
- `spider-scene.js` — Spider story/game/hand/controller logic.
- `spider-style.css` — Spider-only UI styles.
- `spider-standalone.html` — standalone test page using `targets/spider.mind`.
- `integration-example.html` — how the same module is mounted into the unified DIY page using `targetIndex:7`.

The current stable `classroom_diy_story...html` was NOT modified.

Expected project placement:

```
scenes/
  spider/
    spider-scene.js
    spider-style.css
    spider-standalone.html
    integration-example.html

assets/spider/
targets/spider.mind
targets/citywithmagic.mind
js/input-router.js
js/hand-tracking-performance.js
```

Standalone:
- open `scenes/spider/spider-standalone.html`
- uses `../../targets/spider.mind`
- uses `../../assets/spider/`

Integrated:
- unified host keeps `./targets/citywithmagic.mind`
- Spider is installed as `targetIndex:7`
- host callbacks own scene activation and leaving

This is intentionally a first extraction. After we verify standalone Spider behaves exactly like the current stable integrated Spider, the next step is to replace the embedded Spider block inside DIY with these module files.
