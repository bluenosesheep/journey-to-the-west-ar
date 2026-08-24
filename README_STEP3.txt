CLASSROOM CITY - STEP 3: INPUT ROUTER

Status
------
Step 2 was behavior-verified by the user.
Step 3 changes only the input path.

New architecture
----------------
Before:
  Mouse -> Park / Market directly

Now:
  Mouse -> js/input-router.js -> Park / Market

Future Step 4:
  Mouse ---------\
                  -> CityInput -> Park / Market
  Hand Tracking -/

CityInput API
-------------
CityInput.down(x, y, meta)
CityInput.move(x, y, meta)
CityInput.up(x, y, meta)
CityInput.cancel(x, y, meta)

Current mouse adapter
---------------------
input-router.js listens to browser pointer events and converts them into
the normalized CityInput API.

Park
----
Park no longer installs its own browser pointerdown/pointermove/pointerup
listeners. It registers one Park handler set with CityInput.

Market
------
Market no longer installs direct click listeners on its hit buttons.
It registers a Market input handler with CityInput.

Important
---------
Hand tracking is still NOT enabled.
The visual behavior should remain identical to Step 2.

Test checklist
--------------
Run classroom_city.html and compare with Step 2:

1. Building -> City World works.
2. Park can be selected and scanned.
3. Mouse can drag Tree / Flower / Bench / Fountain.
4. RESET works in Park.
5. Market can be selected and scanned.
6. Mouse can select Peach / Cabbage / Egg.
7. RESET works in Market.
8. RETURN CITY still works.
9. Repeat Park -> City -> Market -> City several times.

If these match Step 2, Step 3 is accepted.

Next
----
Step 4 will implement a separate hand_test.html first.
It will call the SAME CityInput API before being connected to classroom_city.html.
