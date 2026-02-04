

# Align Task Categories in Email Drawer with Standard Categories

## Problem

The inline task creation form in the email drawer uses a hardcoded list of categories that does not match the standard categories defined in the database.

**Current hardcoded list** (in `InlineTaskForm.tsx`):
- Personal, Admin, Investing, Travel, Work

**Standard categories** (from database):
- General, Personal, Pipeline, Portfolio

The inference logic in `buildTaskDraft.ts` also maps email intents to the old category names.

---

## Solution

Update both the UI component and the inference logic to use the standard category set, leveraging the existing `useCategories` hook to fetch from the database.

---

## Technical Changes

### 1. Update CategoryOptions Component

**File: `src/components/inbox/inline-actions/InlineTaskForm.tsx`**

Replace the hardcoded array with the `useCategories` hook:

```typescript
// Before (line 197)
const categories = ["Personal", "Admin", "Investing", "Travel", "Work"];

// After
import { useCategories } from "@/hooks/useCategories";

function CategoryOptions({ 
  value, 
  onChange 
}: { 
  value?: string; 
  onChange: (val: string) => void 
}) {
  const { categories, loading } = useCategories();

  if (loading) {
    return <div className="text-xs text-muted-foreground p-2">Loading...</div>;
  }

  return (
    <div className="flex flex-col gap-1">
      {categories.map((cat) => (
        <button
          key={cat.id}
          type="button"
          onClick={() => onChange(cat.name)}
          className={cn(
            "text-left px-2 py-1 text-xs rounded hover:bg-muted transition-colors",
            value === cat.name && "bg-muted font-medium"
          )}
        >
          {cat.name}
          {value === cat.name && <span className="ml-1 text-muted-foreground">*</span>}
        </button>
      ))}
    </div>
  );
}
```

### 2. Update Category Inference Logic

**File: `src/lib/inbox/buildTaskDraft.ts`**

Update `inferCategoryFromIntent` to use the standard categories and add smart inference based on company type:

```typescript
// Before (lines 73-87)
function inferCategoryFromIntent(
  type?: string,
  extractedCategories?: string[] | null
): string | undefined {
  if (type === "CREATE_PERSONAL_TASK") return "Personal";
  if (extractedCategories?.includes("personal")) return "Personal";
  if (extractedCategories?.includes("admin")) return "Admin";
  if (extractedCategories?.includes("investing")) return "Investing";
  if (extractedCategories?.includes("travel")) return "Travel";
  return undefined;
}

// After
function inferCategoryFromIntent(
  type?: string,
  extractedCategories?: string[] | null,
  companyType?: "portfolio" | "pipeline" | null
): string | undefined {
  // Map suggestion type to category
  if (type === "CREATE_PERSONAL_TASK") return "Personal";
  
  // Infer from company type (if email is linked to a company)
  if (companyType === "portfolio") return "Portfolio";
  if (companyType === "pipeline") return "Pipeline";
  
  // Check extracted categories from AI
  if (extractedCategories?.includes("personal")) return "Personal";
  if (extractedCategories?.includes("portfolio")) return "Portfolio";
  if (extractedCategories?.includes("pipeline")) return "Pipeline";
  if (extractedCategories?.includes("investing")) return "Portfolio"; // Legacy mapping
  if (extractedCategories?.includes("admin")) return "General";
  if (extractedCategories?.includes("travel")) return "Personal";
  if (extractedCategories?.includes("work")) return "General";
  
  return undefined;
}
```

Update the function call in `buildTaskDraftFromEmail` to pass company type:

```typescript
// In buildTaskDraftFromEmail, update the call (around line 138)
const inferredCategory = inferCategoryFromIntent(
  suggestion?.type,
  item.extractedCategories,
  draft.companyType || item.relatedCompanyType  // Pass company type for smarter inference
);
```

---

## Files Changed

| File | Change |
|------|--------|
| `src/components/inbox/inline-actions/InlineTaskForm.tsx` | Use `useCategories` hook instead of hardcoded array in `CategoryOptions` component |
| `src/lib/inbox/buildTaskDraft.ts` | Update `inferCategoryFromIntent` to use standard categories (General, Personal, Pipeline, Portfolio) and add company-type-based inference |

---

## Category Mapping Summary

| Email Context | Inferred Category |
|--------------|-------------------|
| Personal task suggestion | Personal |
| Email linked to portfolio company | Portfolio |
| Email linked to pipeline company | Pipeline |
| Extracted "personal" label | Personal |
| Extracted "portfolio" or "investing" | Portfolio |
| Extracted "pipeline" | Pipeline |
| Extracted "admin" or "work" | General |
| Extracted "travel" | Personal |
| No match | No category (user selects) |

---

## Result

After this change:
- The category dropdown in the email drawer will show: General, Personal, Pipeline, Portfolio
- Tasks created from emails linked to portfolio companies will auto-suggest "Portfolio"
- Tasks created from emails linked to pipeline companies will auto-suggest "Pipeline"
- Categories will stay in sync with the database-backed `categories` table

