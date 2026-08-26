V17 - PARK SAFE ROLLBACK

Reason:
V15/V16 tried to hide/restore Park hit zones when switching STORY/INTERACT.
That touched the proven drag infrastructure and caused INTERACT to stop working.

This version rolls Park interaction mechanics back to V14 (last working drag version).

Only one visual rule remains:
- STORY: "再试一次" is not drawn on the Park canvas
- INTERACT: "再试一次" is drawn

Important:
- no hit zones are hidden/restored by mode
- no drag handlers are changed
- no gesture math is changed
- no Park target tracking is changed
- messy STORY visuals remain
- PARK STORY AR remains fully clear

This intentionally prioritizes preserving the stable INTERACT behavior.
