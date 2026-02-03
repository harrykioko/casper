
## Fix: Empty Select Value Error in Obligation Form

### Problem
When creating a new obligation, the app crashes with:
```
Error: A <Select.Item /> must have a value prop that is not an empty string.
```

This is caused by the "Implied urgency" dropdown in `CommitmentForm.tsx` at line 324, which uses an empty string as a value for the "No urgency set" option. Radix UI's Select component reserves the empty string for indicating "no selection" (to show the placeholder), so it cannot be used as an item value.

### Root Cause
In `src/components/commitments/CommitmentForm.tsx`:
- **Line 324**: `<SelectItem value="">No urgency set</SelectItem>` - Uses empty string as value
- **Line 317**: `value={impliedUrgency || ""}` - Falls back to empty string

### Solution
Replace the empty string with a placeholder value like `"none"`, and update the state management accordingly.

### Changes Required

**File: `src/components/commitments/CommitmentForm.tsx`**

1. Update the Select value fallback (line 317):
   - Change `value={impliedUrgency || ""}` to `value={impliedUrgency || "none"}`

2. Update the onValueChange handler (line 318):
   - Change `onValueChange={(v) => setImpliedUrgency(v as ImpliedUrgency || undefined)}`
   - To: `onValueChange={(v) => setImpliedUrgency(v === "none" ? undefined : v as ImpliedUrgency)}`

3. Update the SelectItem value (line 324):
   - Change `<SelectItem value="">No urgency set</SelectItem>`
   - To: `<SelectItem value="none">No urgency set</SelectItem>`

### Technical Details
The fix uses `"none"` as a sentinel value that gets converted to `undefined` when setting state. This matches the pattern already used in the company selector (line 101-104, line 259) which correctly uses `value="none"` and handles it appropriately.
