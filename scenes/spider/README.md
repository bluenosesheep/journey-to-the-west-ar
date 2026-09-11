# Spider module 

Files:
- `spider-scene.js` — Spider story/game/hand/controller logic.
- `spider-style.css` — Spider-only UI styles.
- `spider_interactive_standalone.html` — standalone test page using `targets/spider.mind`.

Expected project placement:

```
scenes/
  spider/
    spider-scene.js
    spider-style.css
    spider_interactive_standalone.html

assets/spider/
targets/spider.mind
targets/citywithmagic.mind
js/input-router.js
js/hand-tracking-performance.js
```

Standalone:
- open `scenes/spider/spider_interactive_standalone.html`
- uses `../../targets/spider.mind`
- uses `../../assets/spider/`

Integrated:
- unified host keeps `./targets/citywithmagic.mind`
- Spider is installed as `targetIndex:7`
- host callbacks own scene activation and leaving
