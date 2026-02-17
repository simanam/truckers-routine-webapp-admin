# Phase 3: Reusable Components & Query Hooks

## Overview

Build shared components (data table, exercise picker, tag input, confirm dialog) and TanStack Query hooks for every API module. These are the building blocks used by all pages in Phases 4-6.

**Prerequisites:** Phase 2 complete (API client, types, auth, layout working).

---

## 1. Data Table — `components/data-table.tsx`

A reusable, filterable, paginated data table built on shadcn/ui `<Table>`.

### Features
- Column definitions with custom renderers
- Server-side pagination (page, pageSize)
- Search input with debounce
- Filter dropdowns
- Loading skeleton state
- Empty state message
- Row actions dropdown

### Interface

```typescript
import { ReactNode } from "react";

export interface Column<T> {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;             // Custom render function
  sortable?: boolean;
  className?: string;                       // Column width/alignment
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  isLoading?: boolean;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  filters?: ReactNode;                      // Slot for filter dropdowns
  actions?: ReactNode;                      // Slot for top-right actions (e.g., "New" button)
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
}
```

### Implementation Notes

```typescript
"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

// Component renders:
// ┌──────────────────────────────────────────────────┐
// │ [Search input........]  [Filters]  [Actions btn] │
// ├──────────────────────────────────────────────────┤
// │ Header1  │ Header2  │ Header3  │ Actions         │
// ├──────────┼──────────┼──────────┼─────────────────┤
// │ Cell     │ Cell     │ Cell     │ ⋯ dropdown      │
// │ Cell     │ Cell     │ Cell     │ ⋯ dropdown      │
// │ ...      │ ...      │ ...      │ ...             │
// ├──────────────────────────────────────────────────┤
// │ Showing 1-20 of 100    [◄] Page 1 of 5 [►]     │
// └──────────────────────────────────────────────────┘

// Loading state: Shows 5 skeleton rows
// Empty state: Shows centered message with icon

// Pagination controls:
// - "Previous" and "Next" buttons
// - Current page / total pages display
// - Page size selector (10, 20, 50)
// - "Showing X-Y of Z" text

// Search: Debounced 300ms, calls onSearchChange

// Use this in every list page by defining columns and connecting to query hooks.
```

### Usage Pattern

```typescript
// Example: Blueprint list page
const columns: Column<Blueprint>[] = [
  {
    key: "name",
    header: "Name",
    cell: (row) => <span className="font-medium">{row.name}</span>,
  },
  {
    key: "type",
    header: "Type",
    cell: (row) => <Badge>{row.type}</Badge>,
  },
  {
    key: "isActive",
    header: "Status",
    cell: (row) => (
      <Switch checked={row.isActive} onCheckedChange={() => toggleActive(row)} />
    ),
  },
  {
    key: "actions",
    header: "",
    cell: (row) => <RowActions row={row} />,
    className: "w-12",
  },
];

<DataTable
  columns={columns}
  data={blueprints}
  total={total}
  page={page}
  pageSize={20}
  onPageChange={setPage}
  isLoading={isLoading}
  searchValue={search}
  onSearchChange={setSearch}
  searchPlaceholder="Search blueprints..."
  filters={<BlueprintFilters />}
  actions={<Link href="/blueprints/new"><Button>New Blueprint</Button></Link>}
/>
```

---

## 2. Exercise Picker — `components/exercise-picker.tsx`

Searchable exercise selector used in Blueprint and Preset Reset forms.

### Features
- Search exercises by name (debounced API call)
- Show results in a scrollable list
- Click to add exercise to selection
- Show selected exercises with order numbers
- Remove exercise from selection
- Drag-and-drop reorder (integrates with @hello-pangea/dnd)

### Interface

```typescript
import { Exercise, ExerciseType } from "@/lib/types";

export interface SelectedExercise {
  exerciseId: string;
  exercise: Exercise;      // Full exercise data for display
  order: number;
  type: ExerciseType;      // "timer" | "reps"
  durationSeconds?: number;
  reps?: number;
  restAfterSeconds: number;
}

export interface ExercisePickerProps {
  selected: SelectedExercise[];
  onChange: (exercises: SelectedExercise[]) => void;
  mode?: "blueprint" | "reset";  // Blueprint has reps option, reset is timer-only
}
```

### Layout

```
┌─ Exercise Picker ───────────────────────────────────┐
│                                                      │
│ ┌─ Search ────────────────────────────────────────┐ │
│ │ 🔍 Search exercises by name...                   │ │
│ └──────────────────────────────────────────────────┘ │
│                                                      │
│ ┌─ Search Results (scrollable) ───────────────────┐ │
│ │ Push-ups          strength  bodyweight  [+ Add]  │ │
│ │ Squats            strength  bodyweight  [+ Add]  │ │
│ │ Neck Rolls        mobility  bodyweight  [+ Add]  │ │
│ │ ...                                              │ │
│ └──────────────────────────────────────────────────┘ │
│                                                      │
│ ┌─ Selected Exercises (drag to reorder) ──────────┐ │
│ │ ≡ 1. Push-ups                                    │ │
│ │   Type: [Timer ▼]  Duration: [40s]  Rest: [20s] │ │
│ │                                         [✕ Remove]│ │
│ │ ────────────────────────────────────────────────  │ │
│ │ ≡ 2. Squats                                      │ │
│ │   Type: [Reps ▼]   Reps: [10]       Rest: [30s] │ │
│ │                                         [✕ Remove]│ │
│ └──────────────────────────────────────────────────┘ │
│                                                      │
│ Estimated per round: 2m 30s                          │
└──────────────────────────────────────────────────────┘
```

### Per-Exercise Configuration Fields

| Field | Type | When Shown | Default |
|-------|------|------------|---------|
| Type | Select: "timer" / "reps" | Blueprint mode only | "timer" |
| Duration (seconds) | Number input | When type = "timer" | 40 |
| Reps | Number input | When type = "reps" | 10 |
| Rest After (seconds) | Number input | Always | 20 |

In **reset mode**, exercises are always timer-based (no reps option).

### Duration Calculator

Display at the bottom of the picker:
```
Estimated per round = sum of (durationSeconds + restAfterSeconds) for all exercises
```

For reps-based exercises, estimate ~3 seconds per rep for the calculation.

---

## 3. Tag Input — `components/tag-input.tsx`

Multi-select tag component with predefined options.

### Interface

```typescript
export interface TagInputProps {
  label: string;
  value: string[];
  onChange: (tags: string[]) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}
```

### Predefined Option Sets

Use these when instantiating the TagInput for different blueprint fields:

```typescript
// lib/constants.ts

export const POSITION_TAG_OPTIONS = [
  { value: "sitting", label: "Sitting" },
  { value: "standing", label: "Standing" },
  { value: "lying", label: "Lying" },
  { value: "any", label: "Any" },
];

export const LOCATION_TAG_OPTIONS = [
  { value: "in_cab", label: "In Cab" },
  { value: "outside", label: "Outside" },
  { value: "rest_stop", label: "Rest Stop" },
  { value: "anywhere", label: "Anywhere" },
];

export const TIMING_TAG_OPTIONS = [
  { value: "pre_drive", label: "Pre-Drive" },
  { value: "break", label: "Break" },
  { value: "post_drive", label: "Post-Drive" },
  { value: "anytime", label: "Anytime" },
];

export const BODY_FOCUS_TAG_OPTIONS = [
  { value: "upper_body", label: "Upper Body" },
  { value: "lower_body", label: "Lower Body" },
  { value: "core", label: "Core" },
  { value: "full_body", label: "Full Body" },
];

export const PAIN_AREA_TAG_OPTIONS = [
  { value: "lower_back", label: "Lower Back" },
  { value: "neck", label: "Neck" },
  { value: "shoulders", label: "Shoulders" },
  { value: "hips", label: "Hips" },
  { value: "knees", label: "Knees" },
  { value: "wrists", label: "Wrists" },
  { value: "ankles", label: "Ankles" },
];

export const WORKOUT_TYPE_OPTIONS = [
  { value: "ignite", label: "Ignite" },
  { value: "reset", label: "Reset" },
  { value: "unwind", label: "Unwind" },
];

export const BLUEPRINT_CATEGORY_OPTIONS = [
  { value: "main", label: "Main" },
  { value: "midday_stretch", label: "Midday Stretch" },
  { value: "evening_recovery", label: "Evening Recovery" },
];

export const FOCUS_TYPE_OPTIONS = [
  { value: "strength", label: "Strength" },
  { value: "cardio", label: "Cardio" },
  { value: "mobility", label: "Mobility" },
  { value: "flexibility", label: "Flexibility" },
  { value: "mixed", label: "Mixed" },
];

export const DIFFICULTY_OPTIONS = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

export const TIP_CATEGORY_OPTIONS = [
  { value: "nutrition", label: "Nutrition" },
  { value: "exercise", label: "Exercise" },
  { value: "mental_health", label: "Mental Health" },
  { value: "sleep", label: "Sleep" },
  { value: "driving_posture", label: "Driving Posture" },
  { value: "hydration", label: "Hydration" },
  { value: "stretching", label: "Stretching" },
  { value: "general_wellness", label: "General Wellness" },
];

export const RESET_CATEGORY_OPTIONS = [
  { value: "neck_shoulders", label: "Neck & Shoulders" },
  { value: "lower_back", label: "Lower Back" },
  { value: "full_body", label: "Full Body" },
  { value: "legs", label: "Legs" },
  { value: "arms", label: "Arms" },
  { value: "core", label: "Core" },
  { value: "breathing", label: "Breathing" },
  { value: "quick_stretch", label: "Quick Stretch" },
];

export const RESET_DIFFICULTY_OPTIONS = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];

export const USER_TIER_OPTIONS = [
  { value: "FREE", label: "Free" },
  { value: "PRO", label: "Pro" },
  { value: "ENTERPRISE", label: "Enterprise" },
];

export const MENTAL_STATE_OPTIONS = [
  { value: "positive", label: "Positive" },
  { value: "neutral", label: "Neutral" },
  { value: "negative", label: "Negative" },
  { value: "anxious", label: "Anxious" },
  { value: "tired", label: "Tired" },
];

export const QUOTE_TYPE_OPTIONS = [
  { value: "motivational", label: "Motivational" },
  { value: "inspirational", label: "Inspirational" },
  { value: "humorous", label: "Humorous" },
  { value: "educational", label: "Educational" },
];

export const QUOTE_CATEGORY_OPTIONS = [
  { value: "fitness", label: "Fitness" },
  { value: "health", label: "Health" },
  { value: "mindset", label: "Mindset" },
  { value: "trucking", label: "Trucking" },
  { value: "general", label: "General" },
];

export const API_KEY_SCOPE_OPTIONS = [
  { value: "exercises:read", label: "Exercises (Read)" },
  { value: "blueprints:read", label: "Blueprints (Read)" },
  { value: "blueprints:write", label: "Blueprints (Write)" },
  { value: "workouts:read", label: "Workouts (Read)" },
  { value: "workouts:write", label: "Workouts (Write)" },
  { value: "users:read", label: "Users (Read)" },
  { value: "*", label: "All Scopes (*)" },
];
```

### Layout

```
┌─ Position Tags ─────────────────────────┐
│ [Standing ✕] [Sitting ✕]               │
│ ┌──────────────────────────────────────┐│
│ │ Select tags...              ▼        ││
│ │  ☑ Standing                          ││
│ │  ☑ Sitting                           ││
│ │  ☐ Lying                             ││
│ │  ☐ Any                               ││
│ └──────────────────────────────────────┘│
└─────────────────────────────────────────┘
```

Uses shadcn `Popover` + `Command` for searchable multi-select with checkboxes.

---

## 4. Confirm Dialog — `components/confirm-dialog.tsx`

Reusable confirmation dialog for destructive actions.

### Interface

```typescript
export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;     // Default: "Confirm"
  cancelLabel?: string;      // Default: "Cancel"
  variant?: "destructive" | "default";
  isLoading?: boolean;
  onConfirm: () => void;
}
```

### Usage

```typescript
<ConfirmDialog
  open={showDeleteDialog}
  onOpenChange={setShowDeleteDialog}
  title="Delete Blueprint"
  description="Are you sure you want to delete this blueprint? This action cannot be undone."
  confirmLabel="Delete"
  variant="destructive"
  isLoading={isDeleting}
  onConfirm={handleDelete}
/>
```

Uses shadcn `AlertDialog` internally.

---

## 5. TanStack Query Hooks — `lib/hooks/`

Every API module gets its own hooks file. Each hook wraps the API client and provides:
- **Queries**: `useQuery` for GET requests with caching
- **Mutations**: `useMutation` for POST/PUT/DELETE with cache invalidation

### Pattern

```typescript
// Example pattern for all hook files:

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { SomeType, SomeCreateRequest } from "@/lib/types";

// Query key factory — keeps keys consistent
const keys = {
  all: ["blueprints"] as const,
  list: (params: Record<string, unknown>) => ["blueprints", "list", params] as const,
  detail: (id: string) => ["blueprints", "detail", id] as const,
  coverage: () => ["blueprints", "coverage"] as const,
};

// GET list
export function useBlueprints(params: BlueprintListParams = {}) {
  return useQuery({
    queryKey: keys.list(params),
    queryFn: () => {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== "") searchParams.set(k, String(v));
      });
      const qs = searchParams.toString();
      return api.fetch<PaginatedResponse<Blueprint>>(
        `/admin/blueprints${qs ? `?${qs}` : ""}`
      );
    },
  });
}

// GET single
export function useBlueprint(id: string) {
  return useQuery({
    queryKey: keys.detail(id),
    queryFn: () => api.fetch<Blueprint>(`/admin/blueprints/${id}`),
    enabled: !!id,
  });
}

// POST create
export function useCreateBlueprint() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: BlueprintCreateRequest) =>
      api.fetch<Blueprint>("/admin/blueprints", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.all });
    },
  });
}

// PUT update
export function useUpdateBlueprint(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<BlueprintCreateRequest>) =>
      api.fetch<Blueprint>(`/admin/blueprints/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.all });
      queryClient.invalidateQueries({ queryKey: keys.detail(id) });
    },
  });
}

// DELETE
export function useDeleteBlueprint() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.fetch(`/admin/blueprints/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.all });
    },
  });
}
```

---

### 5.1 Blueprints — `lib/hooks/use-blueprints.ts`

| Hook | Type | API Call | Notes |
|------|------|----------|-------|
| `useBlueprints(params)` | Query | `GET /admin/blueprints?...` | List with filters + pagination |
| `useBlueprint(id)` | Query | `GET /admin/blueprints/{id}` | Single blueprint detail |
| `useBlueprintCoverage()` | Query | `GET /admin/blueprints/coverage` | Coverage report |
| `useCreateBlueprint()` | Mutation | `POST /admin/blueprints` | Create new |
| `useUpdateBlueprint(id)` | Mutation | `PUT /admin/blueprints/{id}` | Update existing |
| `useDeleteBlueprint()` | Mutation | `DELETE /admin/blueprints/{id}` | Delete |
| `useActivateBlueprint()` | Mutation | `PATCH /admin/blueprints/{id}/activate` | Set active |
| `useDeactivateBlueprint()` | Mutation | `PATCH /admin/blueprints/{id}/deactivate` | Set inactive |
| `useSeedBlueprints()` | Mutation | `POST /admin/blueprints/seed` | Bulk import |

**Query Keys:** `["blueprints", ...]`
**Invalidation:** All mutations invalidate `["blueprints"]` to refresh lists.

---

### 5.2 Exercises — `lib/hooks/use-exercises.ts`

| Hook | Type | API Call | Notes |
|------|------|----------|-------|
| `useExercises(params)` | Query | `GET /admin/exercises?...` | Search with filters |
| `useExercise(id)` | Query | `GET /admin/exercises/{id}` | Single exercise |
| `useExerciseStats()` | Query | `GET /admin/exercises/stats` | Count stats |
| `useExerciseCategories()` | Query | `GET /admin/exercises/categories` | Available categories |
| `useExerciseMuscleGroups()` | Query | `GET /admin/exercises/muscle-groups` | Available muscle groups |
| `useExerciseEquipment()` | Query | `GET /admin/exercises/equipment` | Available equipment |

**Query Keys:** `["exercises", ...]`
**Note:** Exercises are read-only in the admin (no create/update/delete).

---

### 5.3 Tips — `lib/hooks/use-tips.ts`

| Hook | Type | API Call |
|------|------|----------|
| `useTips(params)` | Query | `GET /admin/tips?...` |
| `useTip(id)` | Query | `GET /admin/tips/{id}` |
| `useCreateTip()` | Mutation | `POST /admin/tips` |
| `useUpdateTip(id)` | Mutation | `PUT /admin/tips/{id}` |
| `useDeleteTip()` | Mutation | `DELETE /admin/tips/{id}` |
| `useGenerateTips()` | Mutation | `POST /admin/tips/generate` |
| `useBulkGenerateTips()` | Mutation | `POST /admin/tips/bulk-generate` |
| `useTipTemplates()` | Query | `GET /admin/tips/templates` |
| `useCreateTipTemplate()` | Mutation | `POST /admin/tips/templates` |
| `useUpdateTipTemplate(id)` | Mutation | `PUT /admin/tips/templates/{id}` |
| `useDeleteTipTemplate()` | Mutation | `DELETE /admin/tips/templates/{id}` |
| `useTipAnalytics()` | Query | `GET /admin/tips/analytics` |
| `useRegenerateTipAudio(id)` | Mutation | `POST /admin/tips/{id}/regenerate-audio` |
| `useUploadTipMedia(id)` | Mutation | `POST /admin/tips/{id}/upload-media` |
| `useValidateTip(id)` | Mutation | `POST /admin/tips/{id}/validate` |

**Query Keys:** `["tips", ...]`, `["tip-templates", ...]`, `["tip-analytics"]`

---

### 5.4 Preset Resets — `lib/hooks/use-resets.ts`

| Hook | Type | API Call |
|------|------|----------|
| `useResets(params)` | Query | `GET /admin/resets?...` |
| `useReset(id)` | Query | `GET /admin/resets/{id}` |
| `useCreateReset()` | Mutation | `POST /admin/resets` |
| `useUpdateReset(id)` | Mutation | `PUT /admin/resets/{id}` |
| `useDeleteReset()` | Mutation | `DELETE /admin/resets/{id}` |
| `useActivateReset()` | Mutation | `PATCH /admin/resets/{id}/activate` |
| `useDeactivateReset()` | Mutation | `PATCH /admin/resets/{id}/deactivate` |
| `useFeatureReset()` | Mutation | `PATCH /admin/resets/{id}/feature?featured=true/false` |
| `useResetAnalytics()` | Query | `GET /admin/resets/analytics` |
| `useResetCategorySummary()` | Query | `GET /admin/resets/categories/summary` |

**Query Keys:** `["resets", ...]`

---

### 5.5 Workouts — `lib/hooks/use-workouts.ts`

| Hook | Type | API Call |
|------|------|----------|
| `useGenerateDaily()` | Mutation | `POST /admin/workouts/generate-daily?target_date=...` |
| `useGenerateImmediate()` | Mutation | `POST /admin/workouts/generate-immediate?target_date=...` |
| `useRegenerateWorkout()` | Mutation | `POST /admin/workouts/regenerate?target_date=...&force=...` |
| `useCleanupWorkouts()` | Mutation | `POST /admin/workouts/cleanup` |
| `useAlternatives()` | Query | `GET /admin/workouts/alternatives` |
| `useCreateAlternative()` | Mutation | `POST /admin/workouts/alternatives` |
| `useUpdateAlternative(id)` | Mutation | `PUT /admin/workouts/alternatives/{id}` |
| `useDeleteAlternative()` | Mutation | `DELETE /admin/workouts/alternatives/{id}` |
| `useBulkCreateAlternatives()` | Mutation | `POST /admin/workouts/alternatives/bulk` |
| `useAlternativeStats()` | Query | `GET /admin/workouts/alternatives/stats` |

**Query Keys:** `["workouts", ...]`, `["alternatives", ...]`

---

### 5.6 Users — `lib/hooks/use-users.ts`

| Hook | Type | API Call | Auth |
|------|------|----------|------|
| `useAdmins()` | Query | `GET /admin/users/admins` | admin |
| `usePromoteUser()` | Mutation | `POST /admin/users/{id}/promote` | super_admin |
| `useDemoteUser()` | Mutation | `POST /admin/users/{id}/demote` | super_admin |
| `useTransferSuperAdmin()` | Mutation | `POST /admin/users/transfer-super-admin/{id}` | super_admin |
| `useSoftDeletedUsers()` | Query | `GET /admin/users/soft-deleted` | admin |
| `useHardDeleteUser()` | Mutation | `DELETE /admin/users/hard-delete/{id}?confirm=true` | admin |
| `useRestoreUser()` | Mutation | `POST /admin/users/restore/{id}` | admin |

**Query Keys:** `["admins"]`, `["soft-deleted-users"]`

---

### 5.7 Corporate — `lib/hooks/use-corporate.ts`

| Hook | Type | API Call |
|------|------|----------|
| `useCorporateAccounts()` | Query | `GET /admin/corporate/accounts` |
| `useCorporateAccount(id)` | Query | `GET /admin/corporate/accounts/{id}` |
| `useCreateCorporateAccount()` | Mutation | `POST /admin/corporate/accounts` |
| `useUpdateCorporateAccount(id)` | Mutation | `PUT /admin/corporate/accounts/{id}` |
| `useAddCorporateUsers(accountId)` | Mutation | `POST /admin/corporate/accounts/{id}/users` |
| `useRemoveCorporateUser(accountId)` | Mutation | `DELETE /admin/corporate/accounts/{id}/users/{uid}` |
| `useCorporateAnalytics(id)` | Query | `GET /admin/corporate/accounts/{id}/analytics` |
| `useActivateCorporateAccount()` | Mutation | `POST /admin/corporate/accounts/{id}/activate` |
| `useDeactivateCorporateAccount()` | Mutation | `POST /admin/corporate/accounts/{id}/deactivate` |

**Query Keys:** `["corporate", ...]`

---

### 5.8 Quotes — `lib/hooks/use-quotes.ts`

| Hook | Type | API Call |
|------|------|----------|
| `useQuotes()` | Query | `GET /admin/quotes/quotes` |
| `useCreateQuote()` | Mutation | `POST /admin/quotes/quotes` |
| `useUpdateQuote()` | Mutation | `PATCH /admin/quotes/quotes/{id}` |
| `useDeleteQuote()` | Mutation | `DELETE /admin/quotes/quotes/{id}` |
| `useQuoteCategories()` | Query | `GET /admin/quotes/quotes/categories` |

**Query Keys:** `["quotes", ...]`

---

### 5.9 Pricing — `lib/hooks/use-pricing.ts`

| Hook | Type | API Call |
|------|------|----------|
| `usePricing()` | Query | `GET /admin/pricing` |
| `usePlanPricing(plan)` | Query | `GET /admin/pricing/{plan}` |
| `useUpdatePricing(plan)` | Mutation | `PATCH /admin/pricing/{plan}` |
| `useTogglePromotion(plan)` | Mutation | `POST /admin/pricing/{plan}/toggle-promotion` |
| `useDisablePromotion(plan)` | Mutation | `POST /admin/pricing/{plan}/disable-promotion` |

**Query Keys:** `["pricing", ...]`

---

### 5.10 API Keys — `lib/hooks/use-api-keys.ts`

| Hook | Type | API Call |
|------|------|----------|
| `useApiKeys()` | Query | `GET /admin/api-keys` |
| `useCreateApiKey()` | Mutation | `POST /admin/api-keys` |
| `useRevokeApiKey()` | Mutation | `DELETE /admin/api-keys/{id}` |

**Query Keys:** `["api-keys"]`

---

### 5.11 Help Center — `lib/hooks/use-help-center.ts`

| Hook | Type | API Call |
|------|------|----------|
| `useHelpArticles()` | Query | `GET /admin/help-center/articles` |
| `useCreateHelpArticle()` | Mutation | `POST /admin/help-center/articles` |
| `useUpdateHelpArticle(id)` | Mutation | `PUT /admin/help-center/articles/{id}` |
| `useDeleteHelpArticle()` | Mutation | `DELETE /admin/help-center/articles/{id}` |
| `useCreateHelpCategory()` | Mutation | `POST /admin/help-center/categories` |
| `useUpdateHelpCategory(id)` | Mutation | `PUT /admin/help-center/categories/{id}` |
| `useDeleteHelpCategory()` | Mutation | `DELETE /admin/help-center/categories/{id}` |

**Query Keys:** `["help-articles"]`, `["help-categories"]`

---

## File Summary

| File | Purpose |
|------|---------|
| `components/data-table.tsx` | Reusable paginated data table |
| `components/exercise-picker.tsx` | Exercise search + select + configure |
| `components/tag-input.tsx` | Multi-select tag input |
| `components/confirm-dialog.tsx` | Destructive action confirmation |
| `lib/constants.ts` | All predefined option sets for dropdowns/tags |
| `lib/hooks/use-blueprints.ts` | Blueprint query hooks |
| `lib/hooks/use-exercises.ts` | Exercise query hooks |
| `lib/hooks/use-tips.ts` | Tips query hooks |
| `lib/hooks/use-resets.ts` | Preset Reset query hooks |
| `lib/hooks/use-workouts.ts` | Workout & alternatives query hooks |
| `lib/hooks/use-users.ts` | User & admin query hooks |
| `lib/hooks/use-corporate.ts` | Corporate account query hooks |
| `lib/hooks/use-quotes.ts` | Quote query hooks |
| `lib/hooks/use-pricing.ts` | Pricing query hooks |
| `lib/hooks/use-api-keys.ts` | API key query hooks |
| `lib/hooks/use-help-center.ts` | Help center query hooks |

---

## Verification Checklist

- [ ] All hook files export correct function names
- [ ] No TypeScript errors: `npx tsc --noEmit`
- [ ] DataTable renders with sample data
- [ ] ExercisePicker searches exercises via API
- [ ] TagInput shows/hides options, adds/removes tags
- [ ] ConfirmDialog opens, shows message, fires onConfirm
- [ ] All constants export correct option arrays
