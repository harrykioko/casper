
# Email Summary Card UI Polish

## Overview

Simple UI refinements to make the email summary card feel calmer and more professional:

1. **Whiter background** - Increase opacity of the card background to make it stand out subtly without being overwhelming
2. **Unbold key points** - Remove font-weight from bullet text for a calmer reading experience

---

## Changes

### File: `src/components/inbox/StructuredSummaryCard.tsx`

**1. Whiter card background (line 60)**

Current:
```tsx
<div className="rounded-lg border border-border/50 bg-card/30 divide-y divide-border/30">
```

Updated:
```tsx
<div className="rounded-lg border border-border/50 bg-white/70 dark:bg-card/50 divide-y divide-border/30">
```

This gives a subtle white tint in light mode and slightly more opaque card in dark mode.

**2. Unbold key points text (line 77-82)**

Current:
```tsx
<li 
  key={index} 
  className="text-sm text-foreground leading-relaxed list-disc marker:text-muted-foreground/60"
>
  {point}
</li>
```

Updated:
```tsx
<li 
  key={index} 
  className="text-sm text-foreground/90 font-normal leading-relaxed list-disc marker:text-muted-foreground/60"
>
  {point}
</li>
```

Adding `font-normal` explicitly ensures no bold weight, and `text-foreground/90` slightly softens the text for a calmer appearance.

---

## Visual Result

**Before:**
- Card blends into background too much
- Bold key points feel heavy

**After:**
- Card has subtle white/light background that stands out gently
- Key points have normal weight, calmer reading experience
- Same structure, same logic - just refined visual presence

---

## Files Changed

| File | Lines | Change |
|------|-------|--------|
| `src/components/inbox/StructuredSummaryCard.tsx` | 60 | Whiter background: `bg-white/70 dark:bg-card/50` |
| `src/components/inbox/StructuredSummaryCard.tsx` | 79 | Unbold bullets: add `font-normal`, soften to `text-foreground/90` |
