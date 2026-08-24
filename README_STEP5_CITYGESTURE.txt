STEP 5 - CITY GESTURE FIX

This revision fixes the RETURN CITY / City-scene hand behavior.

What changed
------------
1. Hand tracking now stays active when returning from Park to CITY.
2. The cursor is therefore intentional in CITY, not a leftover icon.
3. In CITY, a fresh pinch over PARK selects PARK.
4. In CITY, a fresh pinch over MARKET selects MARKET.
5. Mouse clicks on PARK / MARKET still work exactly as before.
6. RETURN CITY still works by mouse and by a fresh hand pinch.
7. Park drag and Park RESET logic are unchanged.
8. Market interaction remains mouse-only in Step 5.

Important
---------
The hand pointer is not stopped/restarted on Park -> CITY.
It simply changes mode from PARK to CITY, which avoids cursor lifecycle races.

Market
------
Selecting MARKET from CITY by hand works.
After MARKET is focused, Step 5 keeps the previous behavior and stops hand
tracking because Market interaction has not been enabled for hand input yet.

Validation
----------
All JavaScript files were checked with node --check.
