V13 - PARK STORY VISIBILITY BOOST

Problem
-------
In STORY mode, the global Actor-First treatment lowers AR opacity so the physical
puppet remains visually dominant. That made the messy Park story state too faint.

Change
------
Only while BOTH conditions are true:
- STORY mode
- hand-park / Park scene

the A-Frame AR canvas opacity is raised to 82%.

Result
------
- messy Park clues are much clearer
- physical puppet camera remains 100% visible underneath
- CITY STORY keeps its softer AR look
- MARKET is unchanged
- INTERACT remains 100% AR as before
- no Park drag/reset/gesture logic was changed
