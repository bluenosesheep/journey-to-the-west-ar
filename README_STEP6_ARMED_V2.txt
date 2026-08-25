STEP 6 ARMED V2 - FIX IMMEDIATE PARK ZOOM

Bug
---
After Building was recognized, PARK could zoom immediately.

Cause
-----
CITY was being armed immediately. If the hand holding the Building card was
already in a pinch-like pose, the first detected pinch could be interpreted as
a CITY selection.

Fix
---
CITY now uses the same release-to-arm safety rule:

Building recognized -> CITY appears -> gesture locked
-> put card down / open hand for 300ms
-> CITY gesture becomes armed
-> only the NEXT fresh pinch can select PARK or MARKET.

The same rule also applies after RETURN CITY, preventing the pinch used to
return from immediately selecting another scene.

No changes were made to Park drag, Park RESET, Market interaction, Market RESET,
or RETURN CITY logic.

All JavaScript files were syntax-checked.
