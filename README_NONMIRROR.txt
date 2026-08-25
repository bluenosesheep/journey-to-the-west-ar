CLASSROOM CITY - NON-MIRRORED CAMERA MODE

Change
------
The classroom camera preview is now shown as a normal camera instead of a selfie mirror.

Result
------
- Child moves left -> audience sees left.
- Child moves right -> audience sees right.
- Hand cursor uses the same non-mirrored coordinate system.
- Park / Market / RESET / RETURN CITY logic is unchanged.
- Gesture anti-accident (release-to-arm) logic is unchanged.

Implementation
--------------
1. css/city.css forces the live video element to transform:none.
2. js/city-world.js starts hand tracking with mirror:false.

All JavaScript files were syntax-checked.
