# Vehicle Diagram Assets

Use this folder to store the base images used by the Ramos Gear vehicle diagram.

Expected files:

- `front.png` for the frontal chassis image
- `back.png` for the rear chassis image

How it works:

- The UI renders each image inside a responsive container.
- Marker positions are defined in percentages in the Angular component.
- This keeps the markers locked to the same relative position, regardless of screen size or image resolution.

Recommended rule:

- Keep both images with the same aspect ratio if possible.
- If the artwork changes, only the percentage coordinates in the component need to be adjusted.

Files placed here are served by Angular from `/assets/vehicle-diagram/`.
