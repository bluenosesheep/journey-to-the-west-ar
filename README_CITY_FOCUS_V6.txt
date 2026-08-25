PORTFOLIO DEMO V6 - CITY DISTANCE FIX

Why V5 did not look different enough
------------------------------------
V5 only changed the three internal CITY image transforms.
The whole CITY world was still being continuously placed from the Building
target pose by tick(), so the intended "small and far away" staging was not
reliable/obvious.

V6 fix
------
The narrative effect is now applied to the entire cityWorld group.

After Building recognition / STORY:
- whole CITY cluster moves toward upper-left
- whole CITY cluster scales to 38%
- Park/Market cannot be selected yet

Click INTERACT:
- whole CITY cluster animates back toward the Building target center
- whole CITY returns to full size over ~760ms
- Park/Market hit areas become active
- hand interaction is enabled as before

The effect also remains correct while the Building card is still being tracked,
because tick() now reapplies the current narrative pose.

No Park/Market AR interaction logic was changed.
