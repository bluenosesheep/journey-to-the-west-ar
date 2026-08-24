CLASSROOM CITY - STEP 2

Purpose
-------
Modularize the classroom branch while preserving the Stable City behavior.

DO NOT replace play_city.html yet.
Use classroom_city.html for classroom-development testing.

Stable snapshot
---------------
play_city_stable_v8.html
This file remains untouched.

Loaded module order
-------------------
1. js/asset-config.js
2. js/city-core.js
3. js/park.js
4. js/market.js
5. js/city-world.js

What changed
------------
- The former js/city-app.js has been split into focused modules.
- Park and Market Emoji references now come from js/asset-config.js.
- Scene PNG paths used by the preload logic also come from asset-config.js.
- No hand tracking is enabled yet.
- No new interaction behavior is intended in Step 2.

Why asset-config.js exists
--------------------------
Today:
  renderMode = "emoji"

Later:
  tree.image = "./assets/park/tree.webp"
  peach.image = "./assets/market/peach.webp"
  etc.

The next renderer refactor will make Park/Market choose Emoji or image assets
without changing drag/pick/reset state logic.

Test checklist
--------------
Test classroom_city.html against play_city_stable_v8.html:

1. Building opens City World.
2. Scanning UI hides after Building is recognized.
3. Park / Market cannot unlock until selected.
4. Park focus and Market focus behave normally.
5. Park drag interaction works.
6. Market basket interaction works.
7. RETURN CITY works before scanning and during interaction.
8. Park / Market interaction stays until RETURN CITY.
9. Re-enter Park and Market multiple times.

If all nine match Stable, Step 2 is accepted.

Next step
---------
Step 3 will introduce a real input-router abstraction while retaining mouse
behavior. Only after that is stable will hand tracking be connected.
