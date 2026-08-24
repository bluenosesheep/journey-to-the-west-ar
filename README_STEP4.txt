CLASSROOM CITY - STEP 4: HAND TEST

Step 3 status
-------------
Verified by the user. Mouse -> CityInput -> Park/Market behaves like Step 2.

Step 4 purpose
--------------
DO NOT connect hand tracking to classroom_city.html yet.

First test hand tracking independently with:

  hand_test.html

What hand_test.html verifies
----------------------------
1. Laptop camera starts.
2. One hand is detected.
3. Index fingertip controls an on-screen cursor.
4. Thumb + index pinch creates CityInput.down().
5. Releasing pinch creates CityInput.up().
6. The same demo star can be dragged by mouse OR hand.

Architecture
------------
Mouse ----------\
                 -> CityInput -> demo interaction
Hand Tracking --/

If this works, the same Hand Tracking module can later feed Park and Market
without rewriting their interaction logic.

Important implementation details
--------------------------------
- MediaPipe Hand Landmarker is loaded from @mediapipe/tasks-vision.
- Hand Landmarker model is downloaded on first use.
- Camera frames are processed locally by the browser.
- Detection is capped at 30 FPS to leave headroom for MindAR later.
- Only one hand is tracked in Step 4.
- The camera preview is mirrored.
- Cursor coordinates are mirrored to match the preview.
- Pinch uses thumb-tip / index-tip distance normalized by palm size.
- Separate pinch-down and pinch-up thresholds reduce flicker.
- Cursor smoothing reduces jitter on a large classroom display.

Files changed
-------------
js/hand-tracking.js
  Real reusable hand tracking module.

hand_test.html
  Standalone hand / pinch / drag test.

classroom_city.html
  UNCHANGED from Step 3.

Testing
-------
Serve the folder through HTTPS or localhost.
Camera access generally will not work correctly from a plain file:// URL.

Open:
  hand_test.html

Then:
- click "开启手势测试"
- allow camera
- move one index finger
- pinch thumb + index
- drag the star

Do NOT replace play_city.html.
Do NOT connect hand tracking to classroom_city.html until this test is accepted.
