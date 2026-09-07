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
- The Experience section uses a separate wide Beaconsfield group photo and an Echuca safety-gear detail rather than repeating the hero gallery frames.
- The story portrait uses a higher mobile focal point so the participant's face remains visible in short, wide preview windows as well as normal phone portrait.
- These are used only in the private prototype pending final participant and photographer usage confirmation.

## Homepage section 03 — The Experience

- Added the agreed “Never shot before? Perfect.” message, four beginner reassurances and three-part shoot-day sequence from “mums site”.
- Used a dark editorial break after the calmer story section, with restrained image and content reveals on viewport entry.
- Replaced the soft radial glow and centre seam with matte charcoal grain and a crisp, off-centre scoring-ring motif so the background reads as intentional rather than blurred.
- Kept the complete section visible without animation when reduced motion is preferred.
- The experience CTA remains a prototype anchor until the dedicated experience or events destination is built.

## Homepage section 04 — Explore GWG

- Added the approved editorial navigation for Gallery, 1-on-1 Coaching, Private Events and Shop GWG.
- Desktop uses a visible numbered contents list with a responsive image preview that changes on hover or keyboard focus; mobile places the relevant visual directly inside every destination row.
- The Shop preview remains a typographic brand treatment until approved merch photography is available, avoiding a misleading product placeholder.
- Destination links remain prototype anchors until their dedicated pages are built.
