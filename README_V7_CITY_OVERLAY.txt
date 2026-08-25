V7 - RELIABLE CITY STORY MINIATURE

Why previous attempts failed:
The CITY scene lives in A-Frame/MindAR world space, so changing its transforms
was still affected by target tracking and world pose updates.

V7 solution:
STORY mode no longer tries to make the tracked AR city "look far away."

Instead:
- the real A-Frame cityWorld is hidden in CITY STORY mode
- a separate fixed HTML mini-city is shown in the upper-left
- it is always small and stable on screen

When INTERACT is clicked:
- the mini-city animates toward center and fades out
- the real A-Frame cityWorld is revealed at full centered size
- Park/Market hit areas become active

This makes the narrative beat deterministic:
"猴儿看到远处的城市" -> "去看看" -> INTERACT -> CITY comes forward.

Park/Market interaction logic is unchanged.
