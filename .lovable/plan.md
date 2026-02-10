

# Dramatic Lavender Gradient + Spotlight Card Glow

## Problem
The current `bg-home-gradient` is too desaturated -- reads as flat gray. The spotlight card lacks a visible background glow to draw focus.

## Changes

### 1. Background Gradient (`src/index.css`)

Replace the muted radial gradient with a more dramatic white-to-lavender sweep:

- **Light**: Multi-stop radial with visible lavender tones centered behind the card area, fading to white at edges
- **Dark**: Deeper purple-blue center fading to near-black

```css
.bg-home-gradient {
  background: 
    radial-gradient(ellipse at 50% 40%, hsl(250 60% 94%) 0%, hsl(240 40% 96%) 30%, hsl(220 20% 98%) 60%, hsl(0 0% 100%) 100%);
}
.dark .bg-home-gradient {
  background: 
    radial-gradient(ellipse at 50% 40%, hsl(255 40% 16%) 0%, hsl(245 30% 11%) 30%, hsl(240 15% 7%) 60%, hsl(240 10% 5%) 100%);
}
```

### 2. Card Glow Effect (`src/components/home/FocusSpotlight.tsx`)

Add a soft lavender glow behind the spotlight card using a pseudo-element approach via a wrapper div or an additional `box-shadow` layer:

- Add a large, soft lavender box-shadow glow: `shadow-[0_0_80px_-20px_rgba(140,100,255,0.15)]` in light mode, `shadow-[0_0_80px_-20px_rgba(140,100,255,0.12)]` in dark
- This creates the "emanating light" effect visible in the reference screenshot
- Keep the existing subtle card shadow for the card edge definition
- Combine both shadows in the className

### Files Changed

| File | Change |
|---|---|
| `src/index.css` | Replace `.bg-home-gradient` with dramatic lavender radial gradient |
| `src/components/home/FocusSpotlight.tsx` | Add large soft lavender glow shadow behind the card |

