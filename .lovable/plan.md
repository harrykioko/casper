

# Add Hover Animations to Focus Mode Cards

## Changes

Add smooth lift and scale hover effects using Framer Motion's `whileHover` to the spotlight card and up-next row cards, creating a polished interactive feel.

## Files to Change

### 1. `src/components/home/FocusSpotlight.tsx`
- Add `whileHover={{ y: -2, scale: 1.005 }}` and `transition` props to the existing `motion.div`

### 2. `src/components/home/FocusUpNextRow.tsx`
- Convert the outer `div` to a `motion.div` (from framer-motion)
- Add `whileHover={{ y: -1, scale: 1.01 }}` and `whileTap={{ scale: 0.995 }}` for a subtle lift + press effect
- Keep existing shadow hover from CSS classes

