V19 - PARK RESET AS REAL DOM BUTTON

Why previous fixes failed:
The visible "再试一次" was painted inside the Park canvas, while the clickable area
was a separate invisible HTML button projected over it. The two could drift or
have state-ordering differences.

V19 removes that split.

Now:
- the canvas no longer paints "再试一次"
- #parkDragReset itself is the visible "再试一次" button
- its projected position still follows the Park interaction plane
- direct click/touch listener calls park-canvas.reset()
- existing CityInput hand-pinch hit testing still uses the SAME DOM button rect
- STORY hides the button
- INTERACT shows it
- tree/flower/bench/fountain drag logic is untouched

This makes visible control == clickable control.
