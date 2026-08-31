# Magic 07 · Web Cleanup v1

Expected project placement:
scenes/web_cleanup/
  web-cleanup-scene.js
  web-cleanup-style.css
  web_cleanup_standalone.html

Expected:
targets/web_cleanup.mind

assets/web_cleanup/
  web_large.png
  web_small.png
  web_basket.png
  web_clean_sparkle.png

Interaction:
- scan card -> animated large web
- Start Cleaning
- 5 small webs spread over the play field
- mouse/touch drag, or Hand Tracking pinch drag via CityInput
- web shrinks near basket mouth
- release inside basket mouth -> collected
- 5/5 -> cleaning sparkle -> Retry / Leave
- target can be removed after recognition; AR world holds its last pose
- camera + AR + hand coordinates use mirrored presentation
- Hand Tracking runs at 15 FPS and sleeps after 3 seconds idle

If your mind file has a different name, change only imageTargetSrc in the standalone HTML.
