

## Fix: Obligations Not Saving

### Problem
When you create a new obligation and click "Add Commitment," nothing happens. The obligation is not saved to the database and doesn't appear in the list.

### Root Cause
The `CommitmentModal` component in `ObligationsPage.tsx` is **missing the `onSave` callback**. The modal form calls `onSave?.(data)` when submitted, but since `onSave` is not passed as a prop, nothing happens:

```tsx
// Current code (line 244-251) - MISSING onSave!
<CommitmentModal
  open={showCreate}
  onOpenChange={setShowCreate}
  mode="create"
/>
```

Additionally, the view/action modal is missing handlers for complete, snooze, and delegate actions.

### Solution
Wire up the `createCommitment` function from `useCommitments` hook to the modal's `onSave` prop, and ensure the `useObligations` query is refreshed after mutation.

### Changes Required

**File: `src/pages/ObligationsPage.tsx`**

1. Create an `onSave` handler that calls `createCommitment` and then refreshes the obligations list:
   ```tsx
   const handleSave = async (data: CommitmentInsert) => {
     await createCommitment(data);
     refetch(); // Refresh the React Query cache
   };
   ```

2. Pass `onSave` to the create modal:
   ```tsx
   <CommitmentModal
     open={showCreate}
     onOpenChange={setShowCreate}
     mode="create"
     onSave={handleSave}
   />
   ```

3. Pass handlers to the view/action modal for complete, snooze, and delegate:
   ```tsx
   <CommitmentModal
     open={!!selectedCommitment}
     onOpenChange={(open) => { if (!open) setSelectedCommitment(null); }}
     mode={modalMode}
     commitment={selectedCommitment}
     onComplete={async (id, via, notes) => {
       await completeCommitment(id, via, notes);
       refetch();
     }}
     onSnooze={async (id, until) => {
       await snoozeCommitment(id, until);
       refetch();
     }}
     onDelegate={async (id, personId, name) => {
       await delegateCommitment(id, personId, name);
       refetch();
     }}
   />
   ```

### Technical Details
- The `useObligations` hook uses React Query for data fetching
- The `useCommitments` hook handles mutations (create/update/delete)
- After each mutation, `refetch()` must be called to invalidate the React Query cache and refresh the list
- The `CommitmentInsert` type should be imported for proper TypeScript typing

