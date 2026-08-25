V10 - CITY INTERACT CENTERING

Change:
When CITY switches from STORY to INTERACT, the real CITY no longer reappears at
the Building target's tracked screen position.

Instead:
- CITY is placed at the screen center
- CITY is scaled to about 86% of the previous full size
- transition still takes about 760ms
- CITY stays centered even if the Building card remains visible
- Park / Market remain selectable after the transition

Reason:
In the previous version, the stored Building target pose could place CITY too high,
causing the top of the buildings to be clipped.

Expected:
STORY: small CITY upper-left
INTERACT: CITY moves to center, slightly smaller, fully visible
