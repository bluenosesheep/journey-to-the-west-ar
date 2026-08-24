CLASSROOM CITY - STEP 5

Only Park hand control is enabled in this step.

Flow:
Building -> City World -> Park -> scan Park target -> Park interaction
-> hand tracking starts automatically.

Controls:
- index fingertip moves cursor
- thumb + index pinch grabs
- move while pinching drags
- release drops

Important:
- the existing MindAR video is reused
- no second webcam stream is opened
- RETURN CITY stops hand landmark processing but leaves MindAR camera running
- Market is still mouse-only in Step 5
- play_city.html remains untouched

Test:
1. Building and City World unchanged.
2. Enter Park normally.
3. Hand cursor appears after Park interaction appears.
4. Pinch-drag Tree / Flower / Bench / Fountain.
5. Mouse still works too.
6. RETURN CITY hides hand cursor.
7. Market still behaves exactly like Step 4.
