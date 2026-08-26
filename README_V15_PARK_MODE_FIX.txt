V15 - PARK STORY / INTERACT MODE FIX

Observed bug:
STORY was selected, but "再试一次" could still remain visible and Park could look
functionally identical to INTERACT.

Root cause:
The reset drawing and hit zones depended partly on cached state and on the order
of targetFound / setScene("park") calls.

Fix:
- reset button drawing now checks ClassroomActivityMode live on EVERY canvas frame
- STORY never draws "再试一次"
- all Park mouse/hand interaction is disabled in STORY
- all invisible Park hit zones are hidden in STORY
- CSS adds a final safety rule for the hidden hit buttons
- INTERACT restores the existing drag/repair behavior without changing its mechanics
- PARK STORY AR remains 100% clear

Expected:
STORY:
  messy Park visible clearly
  no "再试一次"
  no dragging / reset
  no hand cursor

INTERACT:
  same messy Park is ready to repair
  "再试一次" appears
  drag / gesture interaction works normally
