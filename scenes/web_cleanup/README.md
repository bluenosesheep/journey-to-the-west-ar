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
