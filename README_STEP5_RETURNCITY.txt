STEP 5 - RETURN CITY HAND INPUT

This revision changes only RETURN CITY input.

Behavior:
- Mouse RETURN CITY still uses the existing click handler.
- Hand gesture uses CityInput.
- Move the hand cursor over RETURN CITY and start a fresh pinch.
- That pinch calls exitToCity().
- A Park object already being dragged cannot trigger RETURN CITY merely by
  moving across the button, because CityInput.down only occurs when the pinch begins.
- A small 10px hand hit margin is used.
- Park drag logic, Park RESET logic, Market logic, AR flow, and visuals are unchanged.

Validation:
All JavaScript files were checked with node --check.
