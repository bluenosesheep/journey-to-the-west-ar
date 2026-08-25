V9 - CITY INTERACT HANDOFF FIX

Bug:
After CITY appeared as the small upper-left STORY miniature, clicking INTERACT
made the real CITY flash briefly and then disappear.

Root cause:
The real A-Frame cityWorld was hidden during STORY. While hidden, the previous
tick logic stopped saving the Building target pose. If the recognition card
was removed before INTERACT, cityWorld had no reliable last pose to restore to.

Fix:
- cache Building pose immediately on targetFound
- keep updating lastMatrix while STORY is active, even though cityWorld is hidden
- on INTERACT, restore cityWorld explicitly to the last cached Building pose
- animate cityWorld scale from 52% to full size over ~760ms
- tick no longer fights the transition animation
- after transition, normal CITY tracking behavior resumes

Expected:
Scan Building -> small CITY upper-left
Remove card if desired
Click INTERACT -> CITY grows into the real centered AR scene and stays visible
