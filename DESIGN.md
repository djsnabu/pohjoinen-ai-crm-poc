---
version: alpha
name: AI CRM Segment Builder POC
colors:
  primary: "#070707"
  secondary: "#111111"
  tertiary: "#B9FF3D"
  neutral: "#F8F8F8"
typography:
  h1:
    fontFamily: ui-sans-serif
    fontSize: 7.6rem
    fontWeight: 800
    lineHeight: 0.86
    letterSpacing: "-0.075em"
  h2:
    fontFamily: ui-sans-serif
    fontSize: 2.4rem
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.045em"
  body-md:
    fontFamily: ui-sans-serif
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.58
  label:
    fontFamily: ui-monospace
    fontSize: 0.73rem
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "0.16em"
rounded:
  none: 0px
  sm: 2px
spacing:
  xs: 8px
  sm: 12px
  md: 18px
  lg: 32px
  xl: 68px
components:
  button-primary:
    backgroundColor: "{colors.tertiary}"
    textColor: "{colors.primary}"
    rounded: "{rounded.none}"
    padding: 14px
  button-secondary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.neutral}"
    rounded: "{rounded.none}"
    padding: 14px
  panel:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.neutral}"
    rounded: "{rounded.none}"
    padding: 32px
---

## Overview

This repository uses a self-contained dark, data-led visual system for a proof-of-concept demo. It is not associated with or derived from any company's official brand guidelines. The goal is a structured, performance-oriented feel appropriate to an analytics/CRM tool.

The UI should feel more like a growth agency operating system than a generic SaaS dashboard.

## Colors

- **Primary #070707:** deep near-black canvas. Avoid pure black unless used for code/output blocks.
- **Secondary #111111:** elevated surface for panels and cards.
- **Tertiary #B9FF3D:** single lime action color for primary CTAs, selected states and data highlights.
- **Neutral #F8F8F8:** high-contrast text.
- **Muted #A7A7A7:** body text and secondary labels.
- **Border #2A2A2A:** subtle structure; avoid heavy shadows.

## Typography

Use system sans for a clean geometric feel. Headlines are very large, tight and direct. Labels use monospace, uppercase and high letter-spacing to create a data/operations feel.

## Layout

Use a centered max-width shell, strong grid structure and clear section rhythm. Hero pages can use asymmetry: large strategic text on one side, data visualization on the other.

Avoid soft green gradients and rounded SaaS cards. Prefer dark flat panels, crisp edges and one strong lime interaction color.

## Elevation & Depth

Depth comes from contrast, borders, spacing and subtle technical texture rather than shadows. Use repeating line patterns and wireframe motifs sparingly.

## Shapes

Use square or nearly-square components. Buttons, cards and panels should be rectangular. If radius is needed for accessibility or browser rendering, keep it at 0–2px.

## Components

- **Primary button:** lime background, near-black text, square corners, bold label.
- **Secondary button:** transparent or black surface, white text, subtle border.
- **Panel:** dark surface, one-pixel border, no heavy shadow.
- **Segment row:** table/card hybrid with strong data columns and selected lime border.
- **Hero visual:** abstract data/growth motif such as a wireframe pyramid, not decorative AI clip art.

## Do's and Don'ts

Do:
- Lead with data and business impact.
- Use one accent color with restraint.
- Keep copy direct and specific.
- Show workflow steps and guardrails clearly.

Don't:
- Use generic neon cyber gradients.
- Use rounded glassmorphism cards.
- Add fake logos, fake testimonials or decorative stats.
- Use any third-party company logo, trademark or brand asset.
