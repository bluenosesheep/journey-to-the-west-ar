CLASSROOM CITY - STEP 7: BACKGROUND TEST

Important
---------
This step DOES NOT modify classroom_city.html.
The current Classroom Stable remains untouched.

Open
----
background_test.html

Purpose
-------
Compare three camera views:

1. Original
2. Soft Blur
3. Strong Blur

The test uses MediaPipe Image Segmenter with the selfie landscape model.
The person mask keeps the detected foreground sharp while the background is
blurred.

Why this is a separate test
---------------------------
The important unknown is not whether person segmentation works on a face/body.
It is whether the real classroom puppets/toys and hands stay visually usable.

Please test:
- toy close to the body
- toy away from the body
- toy beside the face
- toy outside the body silhouette
- fast hand motion
- recognition cards

Controls
--------
Person threshold
  Lower values preserve more uncertain foreground.
  Higher values produce cleaner separation but may cut toys/hands.

Edge softness
  Higher values create softer boundaries.
  Lower values create sharper boundaries.

Decision after testing
----------------------
If toys remain acceptable:
  integrate Soft Blur into a new Classroom branch.

If toys are frequently blurred/cut:
  do NOT integrate person segmentation directly.
  Instead test a different classroom-stage strategy.

Technical
---------
- Non-mirrored camera view.
- MediaPipe Tasks Vision Image Segmenter.
- selfie_segmenter_landscape model.
- On-device inference.
- Segmentation capped around 15 FPS in this standalone test.
