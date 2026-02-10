

# Focus Mode Visual Polish -- Material Quality Pass

## Scope

Pure visual refinement. No changes to structure, data, hierarchy, or component architecture.

## Changes

### 1. Background Gradient -- Spotlight Lighting (`src/index.css`)

Replace the current radial gradient with a centered spotlight effect that emanates from behind the spotlight card area. Lower saturation, increase depth contrast.

- Light: `radial-gradient(ellipse at 50% 35%, hsl(250 30% 96%) 0%, hsl(230 20% 97%) 35%, hsl(220 15% 98%) 100%)`
- Dark: `radial-gradient(ellipse at 50% 35%, hsl(250 30% 13%) 0%, hsl(240 20% 8%) 35%, hsl(240 10% 6%) 100%)`
- Gradient reads as subtle lighting focused on the center card, not decoration

### 2. Focus Spotlight Card (`src/components/home/FocusSpotlight.tsx`)

Soften the card's material to feel "placed" rather than floating:

- Increase border-radius from `rounded-2xl` to `rounded-3xl`
- Replace `shadow-xl` with a larger, softer blur shadow: `shadow-[0_8px_40px_-12px_rgba(0,0,0,0.08)]` (light) / `shadow-[0_8px_40px_-12px_rgba(0,0,0,0.3)]` (dark)
- Add subtle inner highlight via `ring-1 ring-white/40 dark:ring-white/[0.06]`
- Soften border from `border-border/50` to `border-border/30`
- Reduce hover lift from `scale: 1.005` to `scale: 1.002` for calmer feel

### 3. Right Time Rail -- Soft Vertical Flow (`src/components/home/TimelineEvent.tsx`)

Redesign to match the screenshot reference -- remove card containers, present as a soft vertical timeline:

- Increase spacing between events from `pb-4` to `pb-6` for wider breathing room
- Past events: reduce opacity from `0.45` to `0.40`, and show title with `line-through` style (closed/completed feel)
- Current "Now" event: add a soft glow ring on the dot (`ring-4 ring-primary/20`) and bold the time text
- Future events: keep as-is (open/upcoming feel)
- Keep the vertical connector line but make it even more subtle: `bg-border/30`

### 4. Nonnegotiables Panel (`src/components/dashboard/Nonnegotiables.tsx`)

Remove the heavy card container to match the Time Rail's soft flow:

- Replace `bg-white/5 backdrop-blur-md rounded-lg p-4 shadow-sm ring-1 ring-white/10` with a simple `space-y-3` container (no background, no border, no shadow)
- Keep the header styling but remove the `border-b`
- The section should feel like a continuation of the timeline, not a separate widget

### 5. Time Rail Container (`src/components/home/TimeRail.tsx`)

Minor spacing adjustment:

- Keep `space-y-8` between Today's Flow and Non-negotiables sections -- no change needed here

## Files Changed

| File | Type of Change |
|---|---|
| `src/index.css` | Adjust `.bg-home-gradient` gradient values |
| `src/components/home/FocusSpotlight.tsx` | Soften shadow, radius, border, inner highlight |
| `src/components/home/TimelineEvent.tsx` | Wider spacing, past strikethrough, Now glow |
| `src/components/dashboard/Nonnegotiables.tsx` | Remove card container, keep content |

