CLASSROOM CITY - STEP 6: MARKET HAND INPUT

Baseline
--------
Step 5 City/Park hand interaction was accepted as stable.

Step 6 changes
--------------
Market is now connected to the SAME CityInput hand stream.

Flow
----
CITY -> pinch MARKET -> Market focus -> scan Market target
-> Market interaction appears -> hand cursor remains active.

Hand controls
-------------
- Move index fingertip over Peach / Cabbage / Egg.
- Start a fresh thumb+index pinch to select the item.
- The selected item uses the existing Market animation into the basket.
- Pinch RESET to clear the basket.
- Pinch RETURN CITY to exit.
- Mouse continues to work.

Safety / usability
------------------
- RESET is checked first with a small 10px hand margin.
- Food items have only an 8px hand margin.
- This keeps gestures forgiving without creating a large accidental hit zone.
- No Park drag logic was changed.

Expected architecture
---------------------
Mouse ---------\
                -> CityInput -> CITY / Park / Market
Hand Tracking -/

Validation checklist
--------------------
1. CITY hand selection still works for Park and Market.
2. Park hand drag and Park RESET are unchanged.
3. Enter Market with hand or mouse.
4. Hand cursor remains active while waiting for Market target.
5. After Market target is recognized, pinch Peach/Cabbage/Egg.
6. Items animate into basket exactly like mouse clicks.
7. Pinch RESET clears basket.
8. Pinch RETURN CITY exits to CITY.
9. Mouse still works everywhere.
10. Repeat Park -> CITY -> Market -> CITY several times.
