
# Fix: Move GlobalInboxDrawerOverlay Inside BrowserRouter

## Problem

The `GlobalInboxDrawerOverlay` is rendered **outside** the `<BrowserRouter>` component in `App.tsx`. When `InboxContentPane` uses `useNavigate()` to enable clicking on linked companies, React Router throws an error because it can't find the Router context.

```tsx
// Current (broken) structure
<GlobalInboxDrawerProvider>
  <BrowserRouter>
    <AppContent />
  </BrowserRouter>
  <GlobalInboxDrawerOverlay />  // ← Outside Router context!
</GlobalInboxDrawerProvider>
```

## Solution

Move `<GlobalInboxDrawerOverlay />` inside the `<BrowserRouter>` component so it has access to the Router context.

```tsx
// Fixed structure
<GlobalInboxDrawerProvider>
  <BrowserRouter>
    <AppContent />
    <GlobalInboxDrawerOverlay />  // ← Now inside Router context!
  </BrowserRouter>
</GlobalInboxDrawerProvider>
```

## File Changes

### `src/App.tsx`

**Change lines 49-54 from:**
```tsx
<GlobalInboxDrawerProvider>
  <BrowserRouter>
    <AppContent />
  </BrowserRouter>
  <GlobalInboxDrawerOverlay />
</GlobalInboxDrawerProvider>
```

**To:**
```tsx
<GlobalInboxDrawerProvider>
  <BrowserRouter>
    <AppContent />
    <GlobalInboxDrawerOverlay />
  </BrowserRouter>
</GlobalInboxDrawerProvider>
```

## Why This Works

Even though `GlobalInboxDrawerOverlay` uses `createPortal` to render to `document.body`, the **component itself** still needs to be within the Router context tree. React's context system follows the component tree, not the DOM tree. By moving the component inside `<BrowserRouter>`, `useNavigate()` in `InboxContentPane` will work correctly.

## Expected Result

- Opening emails from the Dashboard inbox panel will work without errors
- Clicking on linked companies in the drawer will navigate to the correct company page
- All other drawer functionality remains unchanged
