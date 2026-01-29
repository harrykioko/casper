

# Global Inbox Drawer with Dual-Pane UI

## Problem Analysis

Currently, the inbox detail view has different implementations:
1. **Dashboard InboxPanel** - Uses `InboxDetailDrawer` in `mode="sheet"` (fixed-width Sheet overlay, single-pane with old header layout)
2. **Inbox page** - Uses `InboxDetailDrawer` in `mode="embedded"` which delegates to `InboxDetailWorkspace` (dual-pane: email content + action rail)
3. **Priority page** - Uses `InboxDetailDrawer` in `mode="embedded"` for inline display
4. **CompanyCommandPane** - Uses `InboxDetailDrawer` in sheet mode

The user wants a **global, draggable, expandable drawer** that displays the **dual-pane UI** (email on left, action rail on right) consistently across all entry points - similar to the floating note window pattern.

## Solution Architecture

Create a new **GlobalInboxDrawer** context and overlay component that:
1. Renders as a fixed overlay using `createPortal` (like FloatingNoteOverlay)
2. Is draggable from the left edge (resize handle)
3. Can be expanded/collapsed with stored preferences
4. Contains the full `InboxDetailWorkspace` dual-pane layout
5. Is accessible globally from any page via context

```text
+-------------------------------------------------------------------+
|                     GlobalInboxDrawer                              |
|  (fixed right-side overlay, z-index 9998)                         |
+-------------------------------------------------------------------+
|     |                                          |                  |
|  R  |        InboxContentPane                  |  InboxActionRail |
|  E  |        (scrollable body)                 |  (sticky rail)   |
|  S  |                                          |                  |
|  I  |  - Header (sender, subject, time)        |  - Take Action   |
|  Z  |  - Email body (cleaned)                  |  - Suggestions   |
|  E  |  - Attachments                           |  - Activity      |
|     |  - Linked entities                       |                  |
+-------------------------------------------------------------------+
```

## Implementation Details

### 1. Create GlobalInboxDrawerContext

New file: `src/contexts/GlobalInboxDrawerContext.tsx`

| Export | Description |
|--------|-------------|
| `GlobalInboxDrawerProvider` | Context provider wrapping App |
| `useGlobalInboxDrawer` | Hook to access drawer state |
| `openInboxDrawer(item, handlers)` | Opens drawer with item |
| `closeInboxDrawer()` | Closes drawer |

Context shape:
```typescript
interface GlobalInboxDrawerContextValue {
  isOpen: boolean;
  item: InboxItem | null;
  handlers: InboxDrawerHandlers | null;
  openDrawer: (item: InboxItem, handlers: InboxDrawerHandlers) => void;
  closeDrawer: () => void;
}

interface InboxDrawerHandlers {
  onCreateTask: (item: InboxItem, suggestionTitle?: string) => void;
  onMarkComplete: (id: string) => void;
  onArchive: (id: string) => void;
  onSnooze?: (id: string, until: Date) => void;
  onAddNote?: (item: InboxItem) => void;
}
```

### 2. Create GlobalInboxDrawerOverlay Component

New file: `src/components/inbox/GlobalInboxDrawerOverlay.tsx`

Features:
- Fixed position on right side of screen
- Glassmorphic styling matching FloatingNoteOverlay
- Left-edge resize handle for width adjustment (min 600px, max 1200px)
- Width persisted to localStorage (`casper:inbox-drawer:width`)
- Semi-transparent backdrop (optional, can be disabled)
- Close button and Escape key handling
- Contains `InboxDetailWorkspace` for dual-pane layout

Layout structure:
```tsx
<div className="fixed inset-y-0 right-0 z-[9998]" style={{ width }}>
  {/* Resize handle on left edge */}
  <div className="absolute left-0 inset-y-0 w-1 cursor-ew-resize" />
  
  {/* Main content */}
  <div className="h-full bg-background border-l shadow-2xl">
    <InboxDetailWorkspace
      item={item}
      onClose={closeDrawer}
      {...handlers}
    />
  </div>
</div>
```

### 3. Update InboxDetailWorkspace Layout

Modify: `src/components/inbox/InboxDetailWorkspace.tsx`

Current width split: Content pane (flex-1) + Action rail (200-220px)

Changes:
- Adjust action rail to be 220px minimum for better suggestion card display
- Ensure the workspace fills height correctly in the new overlay context
- Add top header with close button (currently in InboxContentPane)

### 4. Integrate GlobalInboxDrawerProvider

Modify: `src/App.tsx`

Add provider wrapping the app:
```tsx
<FloatingNoteProvider>
  <GlobalInboxDrawerProvider>
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  </GlobalInboxDrawerProvider>
</FloatingNoteProvider>
```

### 5. Update Dashboard InboxPanel

Modify: `src/components/dashboard/InboxPanel.tsx`

Replace local drawer state with global context:
```typescript
const { openDrawer } = useGlobalInboxDrawer();

const handleOpenEmail = (item: InboxItem) => {
  openDrawer(item, {
    onCreateTask: handleCreateTaskFromEmail,
    onMarkComplete: handleMarkComplete,
    onArchive: handleArchive,
    // ... other handlers
  });
};
```

Remove the local `InboxDetailDrawer` component from render.

### 6. Update Inbox Page

Modify: `src/pages/Inbox.tsx`

For desktop: Continue using embedded mode for the 3-column layout (no change)
For mobile: Use the global drawer via context instead of local Sheet

### 7. Update Priority Page

Modify: `src/pages/Priority.tsx`

Replace local drawer with global drawer for inbox items on mobile.

### 8. Update CompanyCommandPane

Modify: `src/components/command-pane/CompanyCommandPane.tsx`

Use global drawer instead of local Sheet for inbox detail.

## File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `src/contexts/GlobalInboxDrawerContext.tsx` | Create | New context for global drawer state |
| `src/components/inbox/GlobalInboxDrawerOverlay.tsx` | Create | New overlay component with resize |
| `src/App.tsx` | Modify | Add GlobalInboxDrawerProvider |
| `src/components/inbox/InboxDetailWorkspace.tsx` | Modify | Minor adjustments for overlay context |
| `src/components/dashboard/InboxPanel.tsx` | Modify | Use global drawer |
| `src/pages/Priority.tsx` | Modify | Use global drawer for mobile |
| `src/components/command-pane/CompanyCommandPane.tsx` | Modify | Use global drawer |

## Resize Behavior

The drawer will have a resize handle on the left edge:
- Default width: 720px (fits dual-pane nicely)
- Min width: 600px (enough for email + compact rail)
- Max width: 1200px (for ultrawide monitors)
- Persisted to localStorage
- Visual affordance: cursor changes to `ew-resize` on hover

## Keyboard Support

- `Escape` - Close drawer
- Focus trap within drawer when open

## Technical Considerations

1. **Z-index layering**: Global drawer at z-[9998], floating note at z-[9999]
2. **Animation**: Slide-in from right with Framer Motion
3. **Backdrop**: Optional semi-transparent backdrop (can be toggled)
4. **Multiple drawers**: Only one inbox drawer can be open at a time (state reset on new open)

## Why Global Context Pattern?

Following the established pattern from `FloatingNoteContext`:
- Avoids prop drilling through multiple component layers
- Single source of truth for drawer state
- Works from any entry point (dashboard, inbox, priority, company pages)
- Can be extended for future features (command palette integration)

