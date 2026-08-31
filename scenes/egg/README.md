# Egg Interactive Magic v1

Place this folder at:
scenes/egg/

Expected existing project files:
- targets/egg.mind
- assets/egg/egg.png
- assets/egg/egg_crack1.png
- assets/egg/egg_crack2.png
- assets/egg/egg_hatched.png
- assets/egg/egg_animal.png
- assets/egg/egg_shadow.png
- assets/egg/egg_sparkle.png
- js/input-router.js
- js/hand-tracking-performance.js

Flow:
1. Scan Egg card.
2. Egg rocks and occasionally hops.
3. Click "🥚 孵化它".
4. Mouse/touch: click the egg.
5. Hand: enable INTERACT and move the index-finger cursor onto the egg.
   Hand interaction is touch/hover, NOT pinch.
6. Touch #1 -> crack1.
7. Touch #2 -> crack2.
8. Touch #3 -> sparkle + opened shell + animal.
9. Retry or Leave.

Hand touch requires leaving the egg hit zone before the next touch can trigger.
This prevents one stationary finger from skipping all three stages.
