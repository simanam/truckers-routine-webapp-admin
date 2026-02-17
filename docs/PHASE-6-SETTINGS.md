# Phase 6: Settings Pages

## Overview

Build the settings section: Pricing configuration, Help Center management, and API Key management.

**Prerequisites:** Phase 5 complete (all major features working).

---

## 1. Pricing — `app/(dashboard)/pricing/page.tsx`

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Pricing Configuration                                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─ Free Plan ───────────────────────────────────────────┐  │
│  │                                                        │  │
│  │  Price: Free                                           │  │
│  │                                                        │  │
│  │  Features:                                             │  │
│  │  • Basic workouts                                      │  │
│  │  • Daily tips                                          │  │
│  │  • Community access                                    │  │
│  │                                                        │  │
│  │  Promotion: None                                       │  │
│  │                                                        │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌─ Pro Plan ────────────────────────────────────────────┐  │
│  │                                                        │  │
│  │  Monthly: $[14.99]  /month           [Save]            │  │
│  │  Yearly:  $[99.99]  /year            [Save]            │  │
│  │                                                        │  │
│  │  Features:                                             │  │
│  │  • All free features                                   │  │
│  │  • Advanced workouts                                   │  │
│  │  • Personalized plans                                  │  │
│  │  • Audio tips                                          │  │
│  │                                                        │  │
│  │  Promotion:                                            │  │
│  │  Status: 🟢 Active                                     │  │
│  │  Text: "Save 44% with yearly!"                         │  │
│  │  Discount: 44%                                         │  │
│  │                                                        │  │
│  │  [Toggle Promotion]  [Disable Promotion]               │  │
│  │                                                        │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌─ Enterprise Plan ────────────────────────────────────┐   │
│  │                                                        │  │
│  │  Per Seat: $[9.99]  /month/seat      [Save]            │  │
│  │                                                        │  │
│  │  Features:                                             │  │
│  │  • All pro features                                    │  │
│  │  • Admin dashboard                                     │  │
│  │  • Fleet management                                    │  │
│  │  • Analytics & reporting                               │  │
│  │                                                        │  │
│  │  Promotion: None                                       │  │
│  │  [Toggle Promotion]                                    │  │
│  │                                                        │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Implementation

```typescript
"use client";

import { usePricing, useUpdatePricing, useTogglePromotion, useDisablePromotion } from "@/lib/hooks/use-pricing";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function PricingPage() {
  const { data: plans, isLoading } = usePricing();

  if (isLoading) return <PricingSkeleton />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-navy">Pricing Configuration</h1>
      {plans?.map((plan) => (
        <PlanCard key={plan.plan} plan={plan} />
      ))}
    </div>
  );
}
```

### PlanCard Component

Each plan is rendered as a `Card` with:

1. **Price Inputs**: Inline editable number inputs for `price_monthly` and `price_yearly`
   - Each has its own "Save" button
   - On save, calls `useUpdatePricing(planName)` with the updated value
   - Shows success/error toast

2. **Features List**: Read-only display of plan features as a bulleted list

3. **Promotion Controls**:
   - Show current promotion status (active/inactive badge)
   - Show promotion text and discount if active
   - "Toggle Promotion" button → calls `useTogglePromotion(planName)`
   - "Disable Promotion" button (only when promotion is active) → calls `useDisablePromotion(planName)` with ConfirmDialog

### Price Update Pattern

```typescript
function PriceInput({ plan, field, label }: { plan: string; field: string; label: string }) {
  const [value, setValue] = useState<number>(0);
  const [isDirty, setIsDirty] = useState(false);
  const updatePricing = useUpdatePricing(plan);

  const handleSave = () => {
    updatePricing.mutate(
      { [field]: value },
      {
        onSuccess: () => {
          toast.success(`${label} updated`);
          setIsDirty(false);
        },
        onError: (err) => toast.error(err.message),
      }
    );
  };

  return (
    <div className="flex items-center gap-3">
      <span className="w-24 text-sm font-medium">{label}:</span>
      <span className="text-sm">$</span>
      <Input
        type="number"
        step="0.01"
        value={value}
        onChange={(e) => { setValue(parseFloat(e.target.value)); setIsDirty(true); }}
        className="w-28"
      />
      {isDirty && (
        <Button size="sm" onClick={handleSave} disabled={updatePricing.isPending}>
          Save
        </Button>
      )}
    </div>
  );
}
```

---

## 2. Help Center — `app/(dashboard)/help-center/page.tsx`

### Layout — Two-Panel Design

```
┌─────────────────────────────────────────────────────────────┐
│  Help Center                                [+ New Category] │
├────────────────────┬────────────────────────────────────────┤
│                    │                                         │
│  Categories        │  Articles in "Getting Started"          │
│                    │                            [+ New Article]│
│  ┌──────────────┐  │  ┌─────────────────────────────────┐   │
│  │▸ Getting     │  │  │                                  │   │
│  │  Started  ✏️🗑│  │  │ ┌────────────┬────────┬────────┐│   │
│  │              │  │  │ │ Title      │Published│Actions ││   │
│  │  FAQ         │  │  │ ├────────────┼────────┼────────┤│   │
│  │           ✏️🗑│  │  │ │ How to    │ ✅ Yes │ ✏️ 🗑  ││   │
│  │              │  │  │ │ Sign Up   │        │        ││   │
│  │  Workouts    │  │  │ ├────────────┼────────┼────────┤│   │
│  │           ✏️🗑│  │  │ │ First     │ ✅ Yes │ ✏️ 🗑  ││   │
│  │              │  │  │ │ Workout   │        │        ││   │
│  │  Account     │  │  │ ├────────────┼────────┼────────┤│   │
│  │           ✏️🗑│  │  │ │ Settings  │ ❌ No  │ ✏️ 🗑  ││   │
│  │              │  │  │ │ Guide     │        │        ││   │
│  └──────────────┘  │  │ └────────────┴────────┴────────┘│   │
│                    │  │                                  │   │
│                    │  └─────────────────────────────────┘   │
│                    │                                         │
└────────────────────┴────────────────────────────────────────┘
```

### Left Panel — Categories

```typescript
interface CategoryListProps {
  categories: HelpCategory[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}
```

- List of categories
- Click to select → loads articles in right panel
- Each category has edit (pencil) and delete (trash) icon buttons
- "New Category" button at top

#### Create/Edit Category — Dialog

```
┌─ New Category ───────────────────────────┐
│                                           │
│  Name:  [Getting Started_______________]  │
│  Slug:  [getting-started_______________]  │
│  Order: [1]                               │
│                                           │
│              [Cancel]  [Create]           │
└───────────────────────────────────────────┘
```

Schema:
```typescript
const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/),
  order: z.number().min(0).optional(),
});
```

#### Delete Category
- ConfirmDialog: "Delete category 'Getting Started'? All articles in this category may be affected."
- Calls `useDeleteHelpCategory()`

### Right Panel — Articles

Shows articles for the selected category.

#### Article Table Columns

| Column | Key | Renderer |
|--------|-----|----------|
| Title | `title` | Text, font-medium |
| Published | `is_published` | Green check or red X icon |
| Order | `order` | Number |
| Actions | — | Edit, Delete buttons |

#### Create/Edit Article — Dialog (or full-width modal)

```
┌─ New Article ────────────────────────────────────────────┐
│                                                           │
│  Title:    [How to Sign Up________________________]       │
│  Category: [Getting Started ▼] (pre-selected)            │
│  Order:    [1]                                            │
│                                                           │
│  Content:                                                 │
│  ┌──────────────────────────────────────────────────┐    │
│  │ (Textarea — supports markdown)                    │    │
│  │                                                    │    │
│  │ Welcome to Trucker's Routine! To get started:     │    │
│  │ 1. Download the app from the App Store            │    │
│  │ 2. Create your account with email or Google       │    │
│  │ 3. Complete the onboarding questionnaire          │    │
│  │                                                    │    │
│  └──────────────────────────────────────────────────┘    │
│                                                           │
│  Published: [Toggle Switch]                               │
│                                                           │
│                         [Cancel]  [Create Article]        │
└───────────────────────────────────────────────────────────┘
```

Schema:
```typescript
const articleSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  category_id: z.string().min(1, "Category is required"),
  order: z.number().min(0).optional(),
  is_published: z.boolean(),
});
```

### State Management

```typescript
const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

// Categories come from help-center hooks or are part of articles response
// Articles filtered by selected category
const { data: articles, isLoading: articlesLoading } = useHelpArticles();
const filteredArticles = articles?.filter(a => a.category_id === selectedCategoryId) || [];
```

---

## 3. API Keys — `app/(dashboard)/api-keys/page.tsx`

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│  API Keys                                  [+ Create Key]    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  API keys are used by external services (e.g., n8n           │
│  automations) to access the Trucker's Routine API.           │
│                                                              │
├──────────┬──────────────┬──────────────────┬────────┬──────┤
│ Name     │ Key Prefix   │ Scopes           │ Status │Action│
├──────────┼──────────────┼──────────────────┼────────┼──────┤
│ n8n      │ tr_abc123    │ exercises:read,  │ 🟢     │[Revoke]│
│automation│              │ blueprints:read  │ Active │      │
├──────────┼──────────────┼──────────────────┼────────┼──────┤
│ test key │ tr_xyz789    │ *                │ 🟢     │[Revoke]│
│          │              │                  │ Active │      │
└──────────┴──────────────┴──────────────────┴────────┴──────┘
```

### Create Key — Dialog

```
┌─ Create API Key ─────────────────────────┐
│                                           │
│  Name:  [n8n automation________________]  │
│                                           │
│  Scopes:                                  │
│  [☑ Exercises (Read)]                     │
│  [☑ Blueprints (Read)]                    │
│  [☐ Blueprints (Write)]                   │
│  [☐ Workouts (Read)]                      │
│  [☐ Workouts (Write)]                     │
│  [☐ Users (Read)]                         │
│  [☐ All Scopes (*)]                       │
│                                           │
│  Expires At:                              │
│  [📅 Optional — leave blank for no expiry]│
│                                           │
│              [Cancel]  [Create Key]       │
└───────────────────────────────────────────┘
```

### Key Created — One-Time Display Dialog

**CRITICAL: The full API key is only shown once on creation.**

```
┌─ API Key Created ────────────────────────┐
│                                           │
│  ⚠️  Copy this key now! It won't be       │
│  shown again.                             │
│                                           │
│  ┌──────────────────────────────────────┐│
│  │ tr_abc123def456ghi789jkl012mno345... ││
│  │                              [📋 Copy]││
│  └──────────────────────────────────────┘│
│                                           │
│  Name: n8n automation                     │
│  Scopes: exercises:read, blueprints:read  │
│                                           │
│                            [Done]         │
└───────────────────────────────────────────┘
```

### Form Schema

```typescript
const apiKeySchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  scopes: z.array(z.string()).min(1, "At least one scope required"),
  expires_at: z.string().nullable().optional(),
});
```

### Implementation Details

```typescript
"use client";

import { useState } from "react";
import { useApiKeys, useCreateApiKey, useRevokeApiKey } from "@/lib/hooks/use-api-keys";
import { API_KEY_SCOPE_OPTIONS } from "@/lib/constants";
import { toast } from "sonner";

export default function ApiKeysPage() {
  const { data: keys, isLoading } = useApiKeys();
  const createKey = useCreateApiKey();
  const revokeKey = useRevokeApiKey();

  const [showCreate, setShowCreate] = useState(false);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [showKeyDisplay, setShowKeyDisplay] = useState(false);

  const handleCreate = (data: ApiKeyCreateRequest) => {
    createKey.mutate(data, {
      onSuccess: (result) => {
        setShowCreate(false);
        // Show the one-time key display
        setCreatedKey(result.key!);
        setShowKeyDisplay(true);
        toast.success("API key created");
      },
      onError: (err) => toast.error(err.message),
    });
  };

  const handleRevoke = (id: string) => {
    revokeKey.mutate(id, {
      onSuccess: () => toast.success("API key revoked"),
      onError: (err) => toast.error(err.message),
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  // ... render table, dialogs
}
```

### Revoke Key

- Red "Revoke" button per row
- ConfirmDialog: "Revoke API key 'n8n automation'? Any services using this key will lose access immediately."
- Calls `useRevokeApiKey()` with key ID

### Table Columns

| Column | Key | Renderer |
|--------|-----|----------|
| Name | `name` | Text |
| Key Prefix | `key_prefix` | Monospace text (`font-mono`) |
| Scopes | `scopes` | Badge list, wrap |
| Status | `is_active` | Green/red badge |
| Created | `created_at` | Formatted date |
| Actions | — | Revoke button |

### Scope Display

Show scopes as small badges:
```typescript
{key.scopes.map(scope => (
  <Badge key={scope} variant="outline" className="text-xs">
    {scope}
  </Badge>
))}
```

If scope is `*`, show a single badge: "All Scopes".

---

## File Summary

| File | Purpose |
|------|---------|
| `app/(dashboard)/pricing/page.tsx` | Pricing configuration |
| `app/(dashboard)/help-center/page.tsx` | Help center categories + articles |
| `app/(dashboard)/api-keys/page.tsx` | API key management |

---

## Post-Phase 6: Final Polish Checklist

After all 6 phases are complete, verify the entire application:

### Functionality
- [ ] Login/logout flow works end-to-end
- [ ] Session persists on page refresh
- [ ] Sidebar navigation works for all pages
- [ ] All CRUD operations work for every module
- [ ] Error states show toast notifications
- [ ] Loading states show skeletons/spinners
- [ ] Empty states show helpful messages
- [ ] Confirmation dialogs appear for destructive actions
- [ ] Pagination works on all list pages
- [ ] Filters work and combine correctly
- [ ] Search is debounced and responsive

### Auth & Security
- [ ] Non-admin users cannot access admin pages
- [ ] Token refresh works when access token expires
- [ ] super_admin-only actions hidden for regular admins
- [ ] API key is only displayed once on creation

### Responsiveness
- [ ] Sidebar collapses on mobile (if implemented)
- [ ] Tables scroll horizontally on small screens
- [ ] Forms are usable on tablet-sized screens
- [ ] Dialog modals are responsive

### Build
- [ ] `npm run build` completes without errors
- [ ] `npx tsc --noEmit` passes with no TypeScript errors
- [ ] `npm run lint` passes with no ESLint errors
- [ ] No console errors in browser
- [ ] All pages load without 404 errors

---

## Verification Checklist (Phase 6 Specific)

- [ ] Pricing page loads all plans
- [ ] Price inputs update and save correctly
- [ ] Toggle/disable promotion works
- [ ] Help center left panel shows categories
- [ ] Clicking a category loads its articles
- [ ] Create/edit/delete categories via dialogs
- [ ] Create/edit/delete articles via dialogs
- [ ] Article content textarea works (markdown)
- [ ] API keys list loads with key prefix, scopes, status
- [ ] Create API key dialog with scope checkboxes works
- [ ] Created key shows one-time display with copy button
- [ ] Copy to clipboard works
- [ ] Revoke key shows confirmation and removes from list
