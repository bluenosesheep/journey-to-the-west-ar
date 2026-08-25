FIXED PUPPET FRONT DEMO

Cause of the previous issue:
Both classroom_city.html and classroom_city_puppet_front_demo.html loaded the same
css/city.css. The demo layer changes were mistakenly appended to that shared CSS,
so classroom_city.html inherited the demo layering too.

Fix:
- css/city.css restored exactly from Classroom Stable.
- classroom_city.html restored exactly from Classroom Stable.
- Demo-only layer rules moved to css/puppet-front-demo.css.
- Only classroom_city_puppet_front_demo.html loads puppet-front-demo.css.

Result:
- classroom_city.html = stable layering
- classroom_city_puppet_front_demo.html = puppet-front demo layering
