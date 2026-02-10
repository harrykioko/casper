

# Fix Casper Logo Assets

## Issues
1. **Wordmark has opaque background** -- the generated PNG has a dark/black background instead of transparency, making it appear as a dark rectangle
2. **Icon/favicon is wrong** -- user has provided a specific crescent moon icon (`casper-favicon-transparent.png`) to use instead of the generated geometric C

## Changes

### 1. Copy the user-provided favicon/icon
- Copy `user-uploads://casper-favicon-transparent.png` to `public/lovable-uploads/casper-icon.png` (overwrite)
- This crescent moon icon will serve as the sidebar collapsed icon and favicon
- Remove the `rounded-md` class from the icon in `SidebarBrand.tsx` since the new icon is a crescent shape, not a square frame

### 2. Regenerate the wordmark with transparent background
- Use AI image generation to create a new "casper" lowercase wordmark with a **transparent background** (white text, no background)
- Overwrite `public/lovable-uploads/casper-wordmark.png`

### 3. Update SidebarBrand.tsx
- Remove `rounded-md` from the icon img class (crescent doesn't need it)
- Keep the `invert` filter for light mode
- Possibly increase icon size slightly since the crescent has more whitespace than a square

### 4. No changes needed to
- `AuthHeader.tsx` (already references the wordmark correctly)
- `index.html` (already points to the icon path)

## Files Modified
| File | Change |
|------|--------|
| `public/lovable-uploads/casper-icon.png` | Replace with user-provided crescent moon |
| `public/lovable-uploads/casper-wordmark.png` | Regenerate with transparent background |
| `src/components/layout/SidebarBrand.tsx` | Remove `rounded-md`, adjust icon sizing |

