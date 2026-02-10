

# Casper Logo System Design

## Overview

Design and implement a cohesive logo system for Casper, replacing the current gradient text and colored circle with purpose-built logo assets. The system includes an abstract geometric icon, a lowercase wordmark, and a combined lockup, all optimized for dark UI contexts.

## Current State

- **Sidebar collapsed**: Gradient circle with "C" letter (no real icon)
- **Sidebar expanded**: Gradient text "Casper" (no wordmark design)
- **Auth page**: Uppercase "CASPER" in muted-foreground with letter-spacing
- **Favicon**: Default `favicon.ico` (no custom icon)
- **OG image**: Points to lovable.dev default

## Design Direction

### Concept: "Control Surface Frame"

An abstract geometric "C" formed by a rounded square frame with an opening on the right side, evoking a command center viewport or control surface. The negative space creates the letter "C" while the geometric form suggests precision and structure.

### Style References
- **Notion**: Simple geometric mark, works at all sizes
- **Linear**: Clean edges, monochrome-first
- **Raycast**: Geometric abstraction, dark-UI native

### Color Strategy
- Primary rendering: **white on dark** (matches the dark glassmorphic UI)
- Monochrome solid: works in pure white or pure black
- Optional accent: the existing primary blue (`hsl(210 100% 72%)`) as a subtle gradient on hover states only, not baked into the mark

## Asset Generation Plan

Using AI image generation (Gemini), produce:

1. **App Icon** (512x512 PNG)
   - Abstract geometric "C" mark
   - Clean vector-like rendering on transparent/dark background
   - Must read clearly when scaled to 16x16

2. **Wordmark** (wide format PNG)
   - "casper" in lowercase
   - Clean sans-serif (similar to Inter/Geist weight 500-600)
   - White on transparent

3. **Favicon** (from the icon, exported/cropped to work at 16x16 and 32x32)

## Code Integration

### Files to Update

| File | Change |
|------|--------|
| `src/components/layout/SidebarBrand.tsx` | Replace gradient circle/text with icon image (collapsed) and wordmark image (expanded) |
| `src/components/auth/AuthHeader.tsx` | Replace uppercase text with wordmark image |
| `index.html` | Update favicon link, add apple-touch-icon, update OG meta |
| `public/favicon.ico` | Replace with generated icon |

### SidebarBrand Changes
- **Collapsed**: Render the geometric icon at 28x28px (currently a gradient circle)
- **Expanded**: Render the wordmark at ~120px wide (currently gradient text)
- Both use `img` tags pointing to uploaded assets in `public/lovable-uploads/`
- Dark mode: white assets render natively
- Light mode: apply CSS `filter: invert(1)` or serve a dark variant

### AuthHeader Changes
- Replace the `CASPER` text with the wordmark image
- Maintain the Framer Motion fade-in animation
- Size: ~200px wide, centered

### Favicon and Meta
- Add `<link rel="icon" type="image/png" href="/lovable-uploads/[icon].png">` to `index.html`
- Add `<link rel="apple-touch-icon" href="/lovable-uploads/[icon].png">`
- Update OG image reference (optional, separate task)

## Implementation Steps

1. Generate the geometric icon using AI image generation (dark background, white mark)
2. Generate the lowercase wordmark using AI image generation
3. Upload both to `public/lovable-uploads/`
4. Update `SidebarBrand.tsx` to use the new assets
5. Update `AuthHeader.tsx` to use the wordmark
6. Update `index.html` with new favicon and meta tags
7. Test at sidebar collapsed (16-28px), sidebar expanded (~120px), and auth page (~200px) sizes

## Design Constraints Checklist

- No mascots, ghosts, brains, checkmarks, or literal productivity symbols
- Legible at 16x16 favicon size
- Works in solid monochrome (white or black)
- Calm, precise, durable, premium
- Dark-UI native aesthetic

