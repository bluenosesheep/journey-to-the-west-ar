STEP 6 - GESTURE ARMING / ANTI-ACCIDENT

Problem
-------
A child or teacher often holds an AR recognition card with thumb and index
finger close together. Hand tracking can interpret that card-holding pose as
a pinch exactly when Park/Market interaction appears.

Solution: release-to-arm
------------------------
When Park or Market is selected / recognized:
1. Gesture actions are disarmed.
2. Hand tracking may still show the cursor.
3. Pinching does NOT generate CityInput.down().
4. The user must open/release the hand.
5. The hand must remain non-pinching for 300ms.
6. Only then is gesture input armed.
7. The next fresh pinch becomes the first valid action.

Visual feedback
---------------
Locked:
  cursor shows ✋
  status says: 放下识别卡，张开手 ✋

Armed:
  cursor returns to ✨
  status says: 可以开始啦！

CITY
----
Returning to CITY arms gestures immediately so Park/Market can be selected
normally.

No changes
----------
- Park drag state machine unchanged.
- Park RESET unchanged.
- Market food interaction unchanged.
- Market RESET unchanged.
- RETURN CITY behavior unchanged.
- Mouse input unchanged.

All JavaScript files were checked with node --check.
