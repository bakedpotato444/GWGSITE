# UI and motion refinement — 5 September 2026

Preserves the agreed physical target, centred bullseye, range retraction, overlapping story sweep, event note and gallery stack. The linked planning conversation is “mums site” (conversation ID `6a967b09-2ddc-83ec-8690-a8c271179999`) and is the reference point for earlier site decisions. Event details and unbuilt destinations remain prototype content.

## Changes

- Clipped the target image to the physical carrier; proportional live typography stays on the paper.
- Rebalanced the pinned event note and gallery prints, with restrained hover motion.
- Replaced the mobile nested story scroller with normal document flow using a measured sticky scene.
- Target scales around the printed bullseye towards the range vanishing point. Story sweep starts before target opacity fades.
- Added a 1.15-second guided scroll, reverse navigation, adaptive header, keyboard-safe mobile menu and effects pause control.
- Refined impact arrival and retirement, with three active desktop holes and two on mobile (one extra during the 620 ms retirement).
- Preserved reduced-motion static layout and stopped impact generation when hidden, paused, reduced-motion or outside the hero.
- Full-dimension WebP target and range assets total 354,200 bytes, down from 4,474,712 bytes. Original PNG sources retained.

## Verification

- Production build and TypeScript check passed.
- Visually inspected desktop at 1440 × 900 and 1280 × 720, and mobile at 390 × 844.
- Inspected manual-scroll retreat/sweep overlap and final story composition.
- Guided navigation reaches story x=0 and moves focus to story; home navigation reverses to the hero.
- Mobile story continued with document scroll (story top moved to -380 px); no horizontal overflow at 390 px.
- Mobile menu blocks underlying content, cycles focus to its first link and restores the toggle on Escape.
- Corrected native smooth-scroll / GSAP conflict and refreshed timeline accessibility/header state after resize.
- Reduced-motion path reviewed in source; operating-system preference emulation was not available in this browser session.

## Interim real media

- Until approved Pronto footage is supplied, the story frame uses the Bendigo participant portrait.
- The gallery stack uses separate Bendigo range, Bendigo target-group and Beaconsfield group images.
- These are used only in the private prototype pending final participant and photographer usage confirmation.
