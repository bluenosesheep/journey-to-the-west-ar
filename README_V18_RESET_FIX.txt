V18 - PARK RESET FIX

Bug:
V17 restored the stable drag interaction, but "再试一次" did not respond.

Cause:
In STORY, park-drag-controller showHits() correctly hid the reset hit target.
When switching to INTERACT, V17 made the reset artwork visible again but never
re-enabled the invisible reset hit target.

Fix:
- STORY: reset artwork hidden + reset hit target hidden
- INTERACT: reset artwork visible + reset hit target restored
- reset hit position recalculated immediately
- tree / flower / bench / fountain hit zones are NOT changed
- stable drag interaction remains untouched

This is a very narrow fix only for the reset button.
