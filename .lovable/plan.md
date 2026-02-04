

# Fix Stage Dropdown in Inline Pipeline Form

## Problem

The stage dropdown in the "Add to Pipeline" inline form is unresponsive. When clicking the Stage selector, the dropdown menu appears but cannot be interacted with because it renders **behind** the email drawer.

## Root Cause

**Z-index conflict between the drawer and the Select dropdown:**

| Component | Z-Index | Location |
|-----------|---------|----------|
| `GlobalInboxDrawerOverlay` backdrop | `z-[9997]` | Rendered via Portal |
| `GlobalInboxDrawerOverlay` drawer | `z-[9998]` | Rendered via Portal |
| `SelectContent` (dropdown) | `z-50` | Rendered via Portal |

Since the `SelectContent` from Radix UI is portalled to `document.body` with `z-50`, it appears **behind** the drawer which has `z-9998`. This makes the dropdown visually present but completely unclickable.

## Solution

Reduce the z-index values of `GlobalInboxDrawerOverlay` to be consistent with standard modal/drawer layering patterns. This allows portalled components like Select dropdowns (which use `z-50`) to render on top.

---

## Changes Required

### File: `src/components/inbox/GlobalInboxDrawerOverlay.tsx`

**Line 83** - Backdrop z-index:
```tsx
// Before
className="fixed inset-0 z-[9997] bg-black/20 dark:bg-black/40"

// After
className="fixed inset-0 z-[48] bg-black/20 dark:bg-black/40"
```

**Line 94** - Drawer z-index:
```tsx
// Before
className="fixed inset-y-0 right-0 z-[9998] flex"

// After
className="fixed inset-y-0 right-0 z-[49] flex"
```

---

## Why These Z-Index Values

- `z-[48]` for backdrop and `z-[49]` for drawer matches the pattern already used in `TriageInboxDrawer.tsx`
- `z-50` is the standard for popovers, dropdowns, and selects in shadcn/ui
- This layering ensures: backdrop (48) < drawer (49) < dropdowns (50)
- Any dropdown, popover, or tooltip inside the drawer will correctly render on top

---

## Files Changed

| File | Change |
|------|--------|
| `src/components/inbox/GlobalInboxDrawerOverlay.tsx` | Update backdrop z-index from `z-[9997]` to `z-[48]`, drawer z-index from `z-[9998]` to `z-[49]` |

---

## Testing

After this change:
1. Open an email in the Inbox
2. Click "Add to Pipeline" action
3. Click the Stage dropdown
4. Verify dropdown appears and options can be selected
5. Verify selecting a different stage (e.g., "Series A") updates the form

