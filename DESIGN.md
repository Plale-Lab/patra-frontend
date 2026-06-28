# PATRA Public Catalog Design System

## 1. Visual Theme & Atmosphere

PATRA is a calm, public research catalog—not an admin dashboard. Use a warm paper-like canvas, near-black editorial typography, one structural blue, and documentary photography that makes AI resources feel connected to real environments.

The homepage should feel like a museum or library catalog with technical depth: image-led at first glance, precise and quiet when users begin scanning metadata.

## 2. Color Palette & Roles

- Canvas: `#f4f1ea`
- Soft canvas: `#f6f5f2`
- Surface: `#ffffff`
- Primary ink: `#171918`
- Secondary ink: `#555952`
- Muted ink: `#858881`
- Hairline: `#deded9`
- Strong hairline: `#cfcfca`
- Structural blue: `#1769e0`
- Active blue: `#0d56bd`

Blue is reserved for search/actions, links, focus, active navigation, and small state indicators. Photography supplies all other color.

## 3. Typography Rules

- Use Inter and the existing system fallback stack.
- Display: 700 weight, line height `0.92–1.05`, tight negative tracking.
- Section heading: 700 weight, `2–2.8rem`, tight tracking.
- Body: 400 weight, `0.95–1.08rem`, line height `1.55–1.65`.
- Eyebrow: `0.68–0.74rem`, 700 weight, uppercase, moderate tracking.
- Never use decorative fonts or multiple display families.

## 4. Component Styling

- Hero: full workspace width, one photograph, direct text overlay, no framed hero card.
- Search: white compact field with an 8px action button; minimum 44px touch height.
- Story cards: cards are allowed because the whole card navigates. Imagery dominates; metadata supports.
- Browse links: plain editorial rows with number, title, description, and arrow.
- Profile menu: quiet white popover with hairlines and minimal shadow.
- Inputs: 4–8px radius; do not use oversized pill inputs.
- Category badges: small translucent pills only over photography.

## 5. Layout Principles

- Full-width hero inside the application workspace.
- Hero spans the full workspace after the public sidebar; never cap the homepage workspace itself.
- Main editorial content is centered at approximately 1440px.
- Desktop stories: three equal-width representative stories.
- Tablet/mobile: stories collapse to one column without losing image priority.
- Use whitespace before borders; use borders before shadows.

## 6. Depth & Elevation

- Default surfaces use a 1px warm-gray hairline.
- Hover surfaces use a broad low-opacity shadow and a maximum 3px lift.
- Photography uses dark gradient overlays for contrast, never opaque decorative panels.
- Avoid heavy drop shadows and gradients outside image readability.

## 7. Motion & Interaction

- Hero image settles from a subtle scale on first paint.
- Hero copy enters with a short vertical reveal.
- Story photography scales approximately 3% on hover/focus.
- Arrow controls rotate or translate subtly to reinforce navigation.
- Respect `prefers-reduced-motion`.

## 8. Responsive Behavior

- At `1220px`, the editorial story grid collapses to image-and-content rows.
- At `760px`, the hero search action moves below the input and resource chains become readable vertical sequences.
- Maintain 44px minimum interactive targets.
- Keep essential subjects visible using explicit `object-position`.

## 9. Do / Don't Guardrails

Do:

- Lead with public content and search.
- Use real photography with documented licensing.
- Keep one structural accent.
- Make model cards one resource type among many.
- Preserve visible focus and semantic headings.

Don't:

- Reintroduce greetings, vanity counts, or dashboard mosaics.
- Use fake metrics.
- Fill every region with a card.
- Add decorative gradients behind routine UI.
- Use photography without source documentation.

## 10. Agent Prompt Guide

When extending PATRA UI, describe it as: “A warm editorial AI resource catalog with image-led public discovery, Notion-like restraint, documentary photography, one ICICLE blue action color, whisper borders, and connected-resource metadata.”
