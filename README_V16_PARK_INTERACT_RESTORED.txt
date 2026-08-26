V16 - PARK INTERACT RESTORED

Bug in V15:
STORY correctly hid all Park hit zones, but switching to INTERACT only restored
the reset hit zone. Tree / flower / bench / fountain remained display:none,
so dragging could not start.

Fix:
- STORY -> hideHits()
- INTERACT -> showHits() for ALL Park objects + reset
- immediately recalculate hit positions
- updateHitPositions also restores all hit displays whenever mode is INTERACT

Preserved:
- STORY: no reset, no dragging, messy Park 100% clear
- INTERACT: existing stable drag mechanics
- no changes to drag math / gesture math / target tracking
