# Brandbook — Intentio-inspired POC

This is a small repository-local brandbook for the Pohjoinen AI CRM proof of concept.

Important: this is an Intentio-inspired adaptation for a job application demo, not an official Intentio brand guide.

## Visual direction

- Dark near-black canvas.
- Sharp rectangular panels, not soft rounded SaaS cards.
- Lime green as the only high-emphasis accent.
- Large direct headlines with tight tracking.
- Monospace uppercase labels for service/category/data markers.
- Data visualizations and wireframe motifs instead of generic illustrations.

## Palette

| Token | Hex | Use |
|---|---:|---|
| Background | `#070707` | Page canvas |
| Surface | `#111111` | Panels and rows |
| Surface 2 | `#171717` | Hover/active row state |
| Text | `#F8F8F8` | Main text |
| Muted | `#A7A7A7` | Body and hints |
| Accent | `#B9FF3D` | CTA, selected state, key data |
| Border | `rgba(255,255,255,0.13)` | Structure |

## Typography

- Font: system sans, with Geist-like geometric posture.
- H1: very large, compressed line-height, tight negative tracking.
- Labels: uppercase monospace, small size, high letter spacing.
- Body: calm neutral gray, enough line height for readability.

## Component rules

### Header

Use the provided light Intentio logo asset on the dark canvas with a small neutral qualifier such as `challenge build` so the repo does not imply it is an official company property.

### Buttons

Primary buttons are square-corner lime blocks. Secondary buttons are dark/transparent with a one-pixel border.

### Cards and panels

Use flat dark panels with subtle one-pixel borders. Avoid big box shadows and rounded corners.

### Segment rows

Treat segment cards like operational rows: columns for logic, audience, LTV and score. Selected/hovered rows get a lime border.

### Data motif

Use abstract wireframe shapes to suggest growth systems, funnels and hierarchy. Do not copy exact case-study charts from intentio.fi.

## Files using this brandbook

- `index.html`
- `styles.css`
- `assets/intentio-logo-light.svg`
- `DESIGN.md`
