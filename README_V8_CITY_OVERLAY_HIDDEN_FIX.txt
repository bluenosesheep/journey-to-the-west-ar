V8 - CITY MINI PRELOAD BUG FIX

Bug:
On page load, the three CITY overlay images could appear before the Building target
was scanned. This can happen if the HTML arrives before the updated external CSS
is applied/cached.

Fix:
- storyCityMini is hidden directly in HTML with hidden + inline display:none.
- CSS has an additional [hidden] hard rule.
- JS explicitly removes hidden only after Building recognition enters CITY STORY.
- JS restores hidden whenever the mini-city is dismissed.

Expected:
Page open -> no CITY images.
Scan Building -> small CITY appears upper-left.
Click INTERACT -> mini CITY transitions away and real AR CITY appears.
