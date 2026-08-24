CLASSROOM CITY - STEP 1

Goal:
Freeze the current stable mobile/touch version and create a safe classroom branch
without changing any City behavior.

Files:
- play_city_stable_v8.html
  Untouched snapshot of the current stable version.

- classroom_city.html
  Same behavior as Stable, but CSS and application JavaScript are external files.

- css/city.css
  Extracted from the Stable HTML.

- js/city-app.js
  Extracted from the Stable HTML. No logic refactor yet.

- js/asset-config.js
  Placeholder for Step 2: separate visual assets from interaction logic.

- js/input-router.js
  Placeholder for later unified mouse / gesture input.

- js/hand-tracking.js
  Placeholder for hand tracking. Not loaded yet.

Important:
Step 1 intentionally does NOT split city-app.js into City/Park/Market modules.
That is the next step. This keeps the first migration low-risk and makes it easy
to compare classroom_city.html against play_city_stable_v8.html.
