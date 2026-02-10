

# Add Background Gradient and Enhanced Card Styling to Home/Focus Mode

## What Changes

The Focus Mode page will get the soft lavender/purple background gradient visible in the reference screenshot, plus more polished card styling for the spotlight card and up-next rows.

## Visual Changes

1. **Page background gradient** -- Replace the flat background with a soft radial lavender-to-white gradient (light mode) that creates the "premium workspace" feel from the reference. Dark mode gets a matching deep purple variant.

2. **Spotlight card** -- Add a subtle elevated white card with slightly more shadow and rounded corners, matching the crisp floating card in the reference.

3. **Up Next rows** -- Each row gets a white card background with border and rounded corners (currently they're transparent with hover-only background), matching the stacked card look in the reference.

4. **Up Next header** -- Style to match the reference with the label on the left and count summary on the right, using consistent uppercase tracking.

## Files to Change

### 1. `src/pages/Home.tsx`
- Update the outer `div` background class from `bg-gradient-to-br from-background via-background to-muted/20` to a richer radial gradient using a custom CSS class.

### 2. `src/index.css`
- Add a `.bg-home-gradient` utility class with a multi-stop radial gradient:
  - Light: soft lavender/lilac fading to white at edges
  - Dark: deep purple/slate tones

### 3. `src/components/home/FocusSpotlight.tsx`
- Increase shadow depth and ensure crisp white background (not semi-transparent)
- Slightly larger padding to match the spacious reference card

### 4. `src/components/home/FocusUpNextRow.tsx`
- Add white card background (`bg-card`), border, and rounded corners to each row
- Add subtle shadow on hover for the premium stacked-card effect
- Increase vertical spacing between rows

### 5. `src/components/home/FocusUpNext.tsx`
- Increase gap between rows from `space-y-0.5` to `space-y-2` for the separated card look

