# Web Cleanup v2

New interaction model (Market-style):
- NO dragging.
- 5 small webs appear at different positions.
- Mouse: click a web once.
- Hand: point cursor at a web and PINCH once.
- The selected web automatically flies in an arc toward the basket, shrinks, passes behind the basket rim, and disappears.
- 5/5 -> sparkle -> Retry / Leave.

Expected:
targets/web_cleanup.mind
assets/web_cleanup/web_large.png
assets/web_cleanup/web_small.png
assets/web_cleanup/web_basket.png
assets/web_cleanup/web_clean_sparkle.png

Uses existing:
js/input-router.js
js/hand-tracking-performance.js


## v2.2 pile-at-hole behavior

- Collection hole remains the original 210x210 size.
- A selected web now flies to the actual hole center area.
- It shrinks while flying but does NOT fade out.
- After arrival it remains visible at the hole.
- Each collected web gets a slightly different offset/rotation/scale, so 5 webs visibly pile up around the hole.


## v2.3 sink-to-bottom effect

- Hole remains 210x210.
- Web now uses a two-stage animation:
  1. fly to the hole mouth;
  2. visibly sink downward to the bottom.
- Final web pile is lower, smaller and slightly dimmer to create depth.


## v2.5 varied web appearance

- The 5 small webs now have clearly different visual scales.
- Each web has a different rotation, including stronger tilts.
- Every new round adds a little random position/scale/rotation jitter.
- Small webs keep a forgiving minimum hit area so hand pinch remains easy.
- Sink-to-bottom and 210x210 hole behavior from v2.4 are unchanged.
