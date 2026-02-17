# Phase 4: Content Pages

## Overview

Build all content management pages: Dashboard, Blueprints (list/create/edit), Exercises (search/browse), Preset Resets (list/create/edit), Tips (list/create/edit/templates), and Quotes.

**Prerequisites:** Phase 3 complete (DataTable, ExercisePicker, TagInput, ConfirmDialog, all query hooks, constants).

---

## 1. Dashboard — `app/(dashboard)/page.tsx`

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Dashboard                                                   │
├────────────┬────────────┬────────────┬──────────────────────┤
│ Total      │ Active     │ Total      │ Today's Workout      │
│ Exercises  │ Blueprints │ Active     │ Status: Generated ✓  │
│ 847        │ 30         │ Users: 0   │ or "Not Generated"   │
│ 📊         │ 📋         │ 👥         │ 🏋️                   │
├────────────┴────────────┴────────────┴──────────────────────┤
│                                                              │
│  Blueprint Coverage by Type                                  │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ Ignite  ████████████░░░░░░░░░  12/50 (24%)           │  │
│  │ Reset   ██████████████████░░░  18/50 (36%)           │  │
│  │ Unwind  ████████░░░░░░░░░░░░░   8/50 (16%)          │  │
│  │         ─────────────── 50 threshold line ──────────  │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Components Used
- shadcn `Card` — for stat cards
- Coverage bars — custom CSS or simple div-based progress bars
- Icons from Lucide: `Dumbbell`, `Layers`, `Users`, `Calendar`

### Data Sources
- `useExerciseStats()` — total exercise count
- `useBlueprintCoverage()` — coverage data with threshold
- Stats cards can use hardcoded data initially, then replace with actual API calls

### Stat Card Pattern

```typescript
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  description?: string;
}

function StatCard({ title, value, icon: Icon, description }: StatCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-6">
        <div className="rounded-lg bg-navy/10 p-3">
          <Icon className="h-6 w-6 text-navy" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

### Coverage Bar Pattern

```typescript
interface CoverageBarProps {
  type: string;
  active: number;
  threshold: number;
  ready: boolean;
}

function CoverageBar({ type, active, threshold, ready }: CoverageBarProps) {
  const percentage = Math.min((active / threshold) * 100, 100);
  return (
    <div className="flex items-center gap-4">
      <span className="w-20 text-sm font-medium capitalize">{type}</span>
      <div className="flex-1 h-4 bg-muted rounded-full relative">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            ready ? "bg-success" : "bg-orange"
          )}
          style={{ width: `${percentage}%` }}
        />
        {/* Threshold line */}
        <div className="absolute top-0 bottom-0 w-0.5 bg-navy" style={{ left: "100%" }} />
      </div>
      <span className="text-sm text-muted-foreground w-24">
        {active}/{threshold}
      </span>
    </div>
  );
}
```

---

## 2. Blueprints

### 2.1 Blueprint List — `app/(dashboard)/blueprints/page.tsx`

#### Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Blueprints                                  [+ New Blueprint]│
├─────────────────────────────────────────────────────────────┤
│  Coverage: Ignite 12/50 │ Reset 18/50 │ Unwind 8/50        │
├─────────────────────────────────────────────────────────────┤
│  [🔍 Search...]  [Type ▼] [Category ▼] [Difficulty ▼] [Status ▼]│
├──────┬──────────────┬────────┬──────────┬────────┬─────────┤
│ Name │ Type         │ Focus  │ Difficulty│ Status │ Actions │
├──────┼──────────────┼────────┼──────────┼────────┼─────────┤
│ Trucker│ Ignite 🔵  │Strength│ Intermediate│ 🟢 Active│ ⋯  │
│ Power  │             │        │           │        │         │
├──────┼──────────────┼────────┼──────────┼────────┼─────────┤
│ Calm  │ Unwind 🟣   │Mobility│ Beginner  │ ⚪ Inactive│ ⋯ │
│ Down  │             │        │           │        │         │
├──────┴──────────────┴────────┴──────────┴────────┴─────────┤
│  Showing 1-20 of 45              [◄] Page 1 of 3 [►]      │
└─────────────────────────────────────────────────────────────┘
```

#### Column Definitions

| Column | Key | Renderer |
|--------|-----|----------|
| Name | `name` | `<Link>` to edit page, font-medium |
| Type | `type` | `<Badge>` with color per type (ignite=blue, reset=green, unwind=purple) |
| Category | `category` | Text, formatted (main → "Main", midday_stretch → "Midday Stretch") |
| Focus | `focus` | Capitalized text |
| Difficulty | `difficulty` | `<Badge variant="outline">` |
| Exercises | `exercises.length` | Count number |
| Status | `isActive` | `<Switch>` — toggle calls `useActivateBlueprint()` / `useDeactivateBlueprint()` |
| Actions | — | `<DropdownMenu>`: Edit, Duplicate, Delete |

#### Filter Controls

Using shadcn `Select` dropdowns:
- **Type**: All / Ignite / Reset / Unwind → sets `type` param
- **Category**: All / Main / Midday Stretch / Evening Recovery → sets `category` param
- **Difficulty**: All / Beginner / Intermediate / Advanced → sets `difficulty` param
- **Status**: All / Active / Inactive → sets `isActive` param

#### State Management

```typescript
const [search, setSearch] = useState("");
const [page, setPage] = useState(1);
const [filters, setFilters] = useState({
  type: undefined as WorkoutType | undefined,
  category: undefined as BlueprintCategory | undefined,
  difficulty: undefined as DifficultyLevel | undefined,
  isActive: undefined as boolean | undefined,
});

const { data, isLoading } = useBlueprints({
  search,
  page,
  pageSize: 20,
  ...filters,
});
const { data: coverage } = useBlueprintCoverage();
```

#### Row Actions

```typescript
function BlueprintRowActions({ blueprint }: { blueprint: Blueprint }) {
  const router = useRouter();
  const deleteMutation = useDeleteBlueprint();
  const [showDelete, setShowDelete] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => router.push(`/blueprints/${blueprint.id}`)}>
            <Pencil className="mr-2 h-4 w-4" /> Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setShowDelete(true)}
            className="text-red-600"
          >
            <Trash className="mr-2 h-4 w-4" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        title="Delete Blueprint"
        description={`Delete "${blueprint.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        isLoading={deleteMutation.isPending}
        onConfirm={() => {
          deleteMutation.mutate(blueprint.id, {
            onSuccess: () => {
              setShowDelete(false);
              toast.success("Blueprint deleted");
            },
          });
        }}
      />
    </>
  );
}
```

---

### 2.2 Blueprint Create — `app/(dashboard)/blueprints/new/page.tsx`

#### Form Schema (Zod)

```typescript
const blueprintSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Lowercase, numbers, hyphens only"),
  type: z.enum(["ignite", "reset", "unwind"]),
  category: z.enum(["main", "midday_stretch", "evening_recovery"]),
  focus: z.enum(["strength", "cardio", "mobility", "flexibility", "mixed"]),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  equipment: z.string().min(1, "Equipment is required"),
  estimatedSecondsPerRound: z.number().min(1),
  minRounds: z.number().min(1).max(10),
  maxRounds: z.number().min(1).max(10),
  defaultRounds: z.number().min(1).max(10),
  positionTags: z.array(z.string()).min(1, "At least one position tag"),
  locationTags: z.array(z.string()).min(1, "At least one location tag"),
  timingTags: z.array(z.string()).min(1, "At least one timing tag"),
  bodyFocusTags: z.array(z.string()).min(1, "At least one body focus tag"),
  painAreaTags: z.array(z.string()),
  source: z.string().optional(),
  sourceUrl: z.string().url().optional().or(z.literal("")),
  sourceName: z.string().optional(),
  isActive: z.boolean(),
});
```

#### Form Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Create Blueprint                          [Cancel] [Save]  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─ Basic Info ──────────────────────────────────────────┐  │
│  │ Name: [________________________]                       │  │
│  │ Slug: [________________________] (auto-generate from name) │
│  │                                                        │  │
│  │ Type:       [Ignite ▼]     Category: [Main ▼]         │  │
│  │ Focus:      [Strength ▼]   Difficulty: [Intermediate ▼]│  │
│  │ Equipment:  [Bodyweight__________]                     │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌─ Rounds ──────────────────────────────────────────────┐  │
│  │ Min Rounds: [1]  Max Rounds: [7]  Default: [3]        │  │
│  │ Est. Seconds/Round: [420]  (auto-calculated)           │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌─ Tags ────────────────────────────────────────────────┐  │
│  │ Position:   [Standing ✕] [Sitting ✕] [+ Add]          │  │
│  │ Location:   [Outside ✕] [+ Add]                        │  │
│  │ Timing:     [Pre-Drive ✕] [+ Add]                      │  │
│  │ Body Focus: [Full Body ✕] [+ Add]                      │  │
│  │ Pain Areas: [None selected] [+ Add]                     │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌─ Source (Optional) ───────────────────────────────────┐  │
│  │ Source:      [darebee__________]                       │  │
│  │ Source URL:  [https://darebee.com/...]                 │  │
│  │ Source Name: [Power Circuit____]                       │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌─ Exercises ───────────────────────────────────────────┐  │
│  │                                                        │  │
│  │  [ExercisePicker component — see Phase 3]              │  │
│  │  Full exercise picker with search, add, reorder,       │  │
│  │  per-exercise config (type, reps/duration, rest)        │  │
│  │                                                        │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌─ Status ──────────────────────────────────────────────┐  │
│  │ Active:  [Toggle Switch]                               │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│                                    [Cancel]  [Create Blueprint]│
└─────────────────────────────────────────────────────────────┘
```

#### Slug Auto-Generation

When the name changes, auto-generate slug:
```typescript
const generateSlug = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

// In the name field's onChange:
const name = e.target.value;
setValue("name", name);
if (!isSlugManuallyEdited) {
  setValue("slug", generateSlug(name));
}
```

#### Form Submission

```typescript
const createMutation = useCreateBlueprint();

const onSubmit = (data: BlueprintFormData) => {
  // Transform exercises from picker format to API format
  const payload = {
    ...data,
    exercises: selectedExercises.map((ex) => ({
      exerciseId: ex.exerciseId,
      order: ex.order,
      type: ex.type,
      durationSeconds: ex.type === "timer" ? ex.durationSeconds : undefined,
      reps: ex.type === "reps" ? ex.reps : undefined,
      restAfterSeconds: ex.restAfterSeconds,
    })),
  };

  createMutation.mutate(payload, {
    onSuccess: () => {
      toast.success("Blueprint created");
      router.push("/blueprints");
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });
};
```

---

### 2.3 Blueprint Edit — `app/(dashboard)/blueprints/[id]/page.tsx`

Same form as Create, but:
- Fetch existing blueprint with `useBlueprint(id)`
- Pre-fill all form fields including exercises
- Use `useUpdateBlueprint(id)` for submission
- Add "Delete" button with `ConfirmDialog`
- Page title: "Edit Blueprint"
- Show loading skeleton while fetching

```typescript
"use client";

import { useParams, useRouter } from "next/navigation";
import { useBlueprint, useUpdateBlueprint, useDeleteBlueprint } from "@/lib/hooks/use-blueprints";

export default function EditBlueprintPage() {
  const { id } = useParams<{ id: string }>();
  const { data: blueprint, isLoading } = useBlueprint(id);

  if (isLoading) return <FormSkeleton />;
  if (!blueprint) return <NotFound />;

  return <BlueprintForm mode="edit" blueprint={blueprint} />;
}
```

**Shared Form Component:** Extract `BlueprintForm` into `components/blueprints/blueprint-form.tsx` to reuse between create and edit pages.

---

## 3. Exercises — `app/(dashboard)/exercises/page.tsx`

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Exercises                                                   │
├─────────────────────────────────────────────────────────────┤
│  [🔍 Search exercises...]                                    │
│  [Category ▼] [Difficulty ▼] [☐ Bodyweight only]            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐              │
│  │ 🏋️     │ │ 🏋️     │ │ 🏋️     │ │ 🏋️     │              │
│  │Push-ups│ │Squats  │ │Plank   │ │Lunges  │              │
│  │strength│ │strength│ │core    │ │strength│              │
│  │beginner│ │beginner│ │beginner│ │intermed│              │
│  │[CopyID]│ │[CopyID]│ │[CopyID]│ │[CopyID]│              │
│  └────────┘ └────────┘ └────────┘ └────────┘              │
│                                                              │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐              │
│  │ ...    │ │ ...    │ │ ...    │ │ ...    │              │
│  └────────┘ └────────┘ └────────┘ └────────┘              │
│                                                              │
│  Showing 1-100 of 847                                        │
└─────────────────────────────────────────────────────────────┘
```

### Features
- **Search**: Debounced 300ms, searches name + instructions via `search` param
- **Filters**: Category dropdown, difficulty dropdown, bodyweight checkbox
- **Grid Layout**: Responsive grid of exercise cards (4 cols desktop, 2 tablet, 1 mobile)
- **Copy ID Button**: Copies exercise UUID to clipboard, shows toast "ID copied"
- **Click Card**: Opens detail `Sheet` (right-side panel)

### Exercise Card Component — `components/exercises/exercise-card.tsx`

```typescript
interface ExerciseCardProps {
  exercise: Exercise;
  onClick: () => void;
}

// Card shows:
// - Thumbnail image (or placeholder icon if no thumbnail)
// - Exercise name
// - Category badge
// - Difficulty badge
// - Equipment tags
// - "Copy ID" button (bottom-right)
```

### Exercise Detail Sheet

When clicking an exercise card, open a shadcn `Sheet` (side panel) showing:

```
┌─ Exercise Detail ──────────────────────┐
│                                         │
│ [Video player / thumbnail]              │
│                                         │
│ Push-ups                                │
│ Category: Strength                      │
│ Difficulty: Beginner                    │
│ Equipment: Bodyweight                   │
│                                         │
│ Primary Muscles:                        │
│ [Chest] [Triceps]                       │
│                                         │
│ Instructions:                           │
│ Place hands shoulder-width apart...     │
│ ...                                     │
│                                         │
│ Defaults:                               │
│ Reps: 10 | Duration: -                  │
│                                         │
│ ID: abc123-def456-...  [📋 Copy]        │
│                                         │
└─────────────────────────────────────────┘
```

### State

```typescript
const [search, setSearch] = useState("");
const [category, setCategory] = useState<string | undefined>();
const [difficulty, setDifficulty] = useState<string | undefined>();
const [isBodyweight, setIsBodyweight] = useState<boolean | undefined>();
const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

const { data: exercises, isLoading } = useExercises({
  search,
  category,
  difficulty,
  is_bodyweight: isBodyweight,
  limit: 100,
});
```

---

## 4. Preset Resets

### 4.1 Preset Reset List — `app/(dashboard)/preset-resets/page.tsx`

#### Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Preset Resets                              [+ New Preset]   │
├─────────────────────────────────────────────────────────────┤
│  [🔍 Search...] [Category ▼] [Difficulty ▼] [Status ▼]     │
├──────┬──────────┬──────────┬────────┬────────┬──────┬──────┤
│ Name │ Category │ Duration │Difficulty│ Tier  │Status│Actions│
├──────┼──────────┼──────────┼────────┼────────┼──────┼──────┤
│ Neck │ Neck &   │ 3:00     │ Easy   │ Free  │ 🟢  │ ⋯    │
│Release│Shoulders│          │        │       │Active│      │
├──────┼──────────┼──────────┼────────┼────────┼──────┼──────┤
│ Full │ Full Body│ 5:00     │ Medium │ Pro   │ ⚪  │ ⋯    │
│Stretch│         │          │        │       │Inactive│    │
└──────┴──────────┴──────────┴────────┴────────┴──────┴──────┘
```

#### Column Definitions

| Column | Key | Renderer |
|--------|-----|----------|
| Name | `name` | `<Link>` to edit page |
| Category | `category` | Formatted text |
| Duration | `durationSeconds` | Format as "M:SS" |
| Difficulty | `difficulty` | `<Badge>` |
| Tier | `userTier` | `<Badge>` |
| Featured | `isFeatured` | Star icon toggle |
| Status | `isActive` | `<Switch>` |
| Actions | — | Edit, Delete dropdown |

#### Duration Formatter

```typescript
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
```

#### Row Actions

- **Edit**: Navigate to `/preset-resets/{id}`
- **Activate/Deactivate**: Switch toggle calls `useActivateReset()` / `useDeactivateReset()`
- **Feature**: Star icon toggle calls `useFeatureReset()` with `?featured=true/false`
- **Delete**: ConfirmDialog → `useDeleteReset()`

---

### 4.2 Preset Reset Create — `app/(dashboard)/preset-resets/new/page.tsx`

#### Form Schema

```typescript
const resetSchema = z.object({
  name: z.string().min(1, "Name is required"),
  durationSeconds: z.number().min(30, "Min 30 seconds"),
  category: z.enum(["neck_shoulders", "lower_back", "full_body", "legs", "arms", "core", "breathing", "quick_stretch"]),
  difficulty: z.enum(["easy", "medium", "hard"]),
  description: z.string().min(1, "Description is required"),
  targetAreas: z.array(z.string()).min(1, "At least one target area"),
  locationTags: z.array(z.string()).min(1),
  timingTags: z.array(z.string()).min(1),
  userTier: z.enum(["FREE", "PRO", "ENTERPRISE"]),
  isActive: z.boolean(),
});
```

#### Form Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Create Preset Reset                       [Cancel] [Save]   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Name:        [________________________]                     │
│  Description: [________________________]                     │
│               [________________________]                     │
│                                                              │
│  Category:    [Neck & Shoulders ▼]                           │
│  Difficulty:  [Easy ▼]                                       │
│  Duration:    [180] seconds  (displays as 3:00)              │
│  Tier:        [Free ▼]                                       │
│                                                              │
│  Target Areas: [Neck ✕] [Shoulders ✕] [+ Add]               │
│  Location:     [In Cab ✕] [Anywhere ✕] [+ Add]              │
│  Timing:       [Break ✕] [Anytime ✕] [+ Add]                │
│                                                              │
│  ┌─ Exercises ───────────────────────────────────────────┐  │
│  │  [ExercisePicker in "reset" mode — timer only]         │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  Active: [Toggle Switch]                                     │
│                                                              │
│                                  [Cancel]  [Create Preset]   │
└─────────────────────────────────────────────────────────────┘
```

### 4.3 Preset Reset Edit — `app/(dashboard)/preset-resets/[id]/page.tsx`

Same as create but pre-filled, uses `useUpdateReset(id)`. Shared form component: `components/preset-resets/reset-form.tsx`.

---

## 5. Tips

### 5.1 Tips List — `app/(dashboard)/tips/page.tsx`

#### Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Tips                       [AI Generate] [Templates] [+ New]│
├─────────────────────────────────────────────────────────────┤
│  [🔍 Search...] [Category ▼] [Status ▼] [AI Generated ▼]   │
├──────┬──────────┬──────────┬────────┬────────┬──────┬──────┤
│ Title│ Category │ Date     │ Tier   │ AI?    │Status│Actions│
├──────┼──────────┼──────────┼────────┼────────┼──────┼──────┤
│ Stay │ Hydration│ Feb 18   │ Free   │ 🤖 Yes │ 🟢  │ ⋯    │
│Hydrated│        │ 2026     │        │        │Active│      │
├──────┼──────────┼──────────┼────────┼────────┼──────┼──────┤
│ Stretch│Exercise│ Feb 19   │ Pro    │ ❌ No  │ ⚪  │ ⋯    │
│ Break │         │ 2026     │        │        │Draft │      │
└──────┴──────────┴──────────┴────────┴────────┴──────┴──────┘
```

#### AI Generate Button

Opens a dialog:

```
┌─ Generate Tips with AI ──────────────────┐
│                                           │
│  Select dates:                            │
│  [📅 Start Date] to [📅 End Date]         │
│                                           │
│  Categories:                              │
│  [☑ Nutrition] [☑ Exercise]               │
│  [☐ Mental Health] [☐ Sleep]              │
│  [☐ Driving Posture] [☐ Hydration]        │
│  [☐ Stretching] [☐ General Wellness]      │
│                                           │
│              [Cancel]  [Generate]          │
└───────────────────────────────────────────┘
```

Calls `useGenerateTips()` or `useBulkGenerateTips()` depending on date range.

#### Row Actions

- **Edit**: Navigate to `/tips/{id}`
- **Approve/Reject**: For AI-generated tips, calls `useValidateTip(id)` with approve/reject
- **Regenerate Audio**: Calls `useRegenerateTipAudio(id)`
- **Delete**: ConfirmDialog

#### Filter State

```typescript
const [filters, setFilters] = useState({
  category: undefined as TipCategory | undefined,
  is_active: undefined as boolean | undefined,
  is_ai_generated: undefined as boolean | undefined,
  search: "",
});

const { data, isLoading } = useTips({
  ...filters,
  limit: 20,
  skip: (page - 1) * 20,
});
```

---

### 5.2 Tip Create — `app/(dashboard)/tips/new/page.tsx`

#### Form Schema

```typescript
const tipSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  content: z.string().min(1, "Content is required"),
  excerpt: z.string().optional(),
  category: z.enum(["nutrition", "exercise", "mental_health", "sleep", "driving_posture", "hydration", "stretching", "general_wellness"]),
  tags: z.array(z.string()),
  duration_minutes: z.number().optional(),
  media_type: z.string().optional(),
  date: z.string().min(1, "Date is required"),  // YYYY-MM-DD
  min_tier: z.enum(["free", "pro", "enterprise"]),
  is_active: z.boolean(),
});
```

#### Form Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Create Tip                                [Cancel] [Save]   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Title:    [________________________]                        │
│  Excerpt:  [________________________]                        │
│                                                              │
│  Content:                                                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ (Textarea — rich text content)                       │   │
│  │                                                      │   │
│  │                                                      │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  Category:  [Hydration ▼]                                    │
│  Date:      [📅 Feb 18, 2026]                                │
│  Tier:      [Free ▼]                                         │
│  Duration:  [5] minutes                                      │
│  Media:     [Audio ▼]                                        │
│                                                              │
│  Tags:      [hydration ✕] [health ✕] [+ Add tag]            │
│                                                              │
│  Active: [Toggle Switch]                                     │
│                                                              │
│                                   [Cancel]  [Create Tip]     │
└─────────────────────────────────────────────────────────────┘
```

### 5.3 Tip Edit — `app/(dashboard)/tips/[id]/page.tsx`

Same form, pre-filled. Additional actions for AI-generated tips:
- **Approve/Reject** buttons (calls `useValidateTip(id)`)
- **Regenerate Audio** button
- **Upload Media** button (file upload)

Shared form: `components/tips/tip-form.tsx`

---

### 5.4 Tip Templates — `app/(dashboard)/tips/templates/page.tsx`

#### Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Tip Templates                              [+ New Template] │
├──────┬──────────┬──────────────────────────────────┬────────┤
│ Name │ Category │ Template Text                     │Actions │
├──────┼──────────┼──────────────────────────────────┼────────┤
│ Daily│ Nutrition│ "Start your day with a healthy..."│ ✏️ 🗑  │
│Nutrition│       │                                   │        │
└──────┴──────────┴──────────────────────────────────┴────────┘
```

- **Create/Edit**: Dialog-based (not full page)
- Uses `useTipTemplates()`, `useCreateTipTemplate()`, `useUpdateTipTemplate()`, `useDeleteTipTemplate()`

---

## 6. Quotes — `app/(dashboard)/quotes/page.tsx`

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Motivational Quotes                        [+ New Quote]    │
├─────────────────────────────────────────────────────────────┤
│  [🔍 Search...] [Category ▼] [Type ▼]                       │
├──────────────────────┬──────────┬────────┬────────┬────────┤
│ Quote                │ Type     │Category│Priority│Actions  │
├──────────────────────┼──────────┼────────┼────────┼────────┤
│ "Every mile is a     │Motivat.. │Fitness │ 5      │ ✏️ 🗑   │
│  chance to move."    │          │        │        │         │
├──────────────────────┼──────────┼────────┼────────┼────────┤
│ "Your body is your   │Inspirat..│Health  │ 3      │ ✏️ 🗑   │
│  most important tool"│          │        │        │         │
└──────────────────────┴──────────┴────────┴────────┴────────┘
```

### Create/Edit — Dialog-Based

Clicking "New Quote" or the edit icon opens a dialog:

```
┌─ Create Quote ───────────────────────────┐
│                                           │
│  Quote Text:                              │
│  ┌──────────────────────────────────────┐│
│  │ (Textarea)                           ││
│  └──────────────────────────────────────┘│
│                                           │
│  Type:     [Motivational ▼]               │
│  Category: [Fitness ▼]                    │
│                                           │
│  Mental States:                           │
│  [☑ Neutral] [☑ Positive] [☐ Negative]   │
│  [☐ Anxious] [☐ Tired]                   │
│                                           │
│  Energy Level Range:                      │
│  [30] ──────●────────── [100]             │
│                                           │
│  Priority: [5]                            │
│  Active:   [Toggle Switch]                │
│                                           │
│              [Cancel]  [Create Quote]     │
└───────────────────────────────────────────┘
```

### Form Schema

```typescript
const quoteSchema = z.object({
  quote_text: z.string().min(1, "Quote text is required"),
  quote_type: z.enum(["motivational", "inspirational", "humorous", "educational"]),
  category: z.enum(["fitness", "health", "mindset", "trucking", "general"]),
  mental_states: z.array(z.string()).min(1, "At least one mental state"),
  energy_level_min: z.number().min(0).max(100),
  energy_level_max: z.number().min(0).max(100),
  is_active: z.boolean(),
  priority: z.number().min(1).max(10),
});
```

### Hooks Used
- `useQuotes()` — list
- `useCreateQuote()` — create
- `useUpdateQuote()` — update (PATCH)
- `useDeleteQuote()` — soft delete
- `useQuoteCategories()` — available categories

---

## File Summary

| File | Purpose |
|------|---------|
| `app/(dashboard)/page.tsx` | Dashboard with stats + coverage |
| `app/(dashboard)/blueprints/page.tsx` | Blueprint list with filters |
| `app/(dashboard)/blueprints/new/page.tsx` | Create blueprint |
| `app/(dashboard)/blueprints/[id]/page.tsx` | Edit blueprint |
| `components/blueprints/blueprint-form.tsx` | Shared create/edit form |
| `app/(dashboard)/exercises/page.tsx` | Exercise search + browse |
| `components/exercises/exercise-card.tsx` | Exercise card display |
| `app/(dashboard)/preset-resets/page.tsx` | Preset reset list |
| `app/(dashboard)/preset-resets/new/page.tsx` | Create preset reset |
| `app/(dashboard)/preset-resets/[id]/page.tsx` | Edit preset reset |
| `components/preset-resets/reset-form.tsx` | Shared create/edit form |
| `app/(dashboard)/tips/page.tsx` | Tips list with filters |
| `app/(dashboard)/tips/new/page.tsx` | Create tip |
| `app/(dashboard)/tips/[id]/page.tsx` | Edit tip |
| `app/(dashboard)/tips/templates/page.tsx` | Tip templates |
| `components/tips/tip-form.tsx` | Shared create/edit form |
| `app/(dashboard)/quotes/page.tsx` | Quotes list + dialog CRUD |

---

## Verification Checklist

- [ ] Dashboard loads with stat cards and coverage bars
- [ ] Blueprint list shows data, filters work, pagination works
- [ ] Blueprint create form validates and submits
- [ ] Blueprint edit loads existing data and updates
- [ ] Activate/deactivate toggle works on blueprint list
- [ ] Exercise search returns results, cards display correctly
- [ ] Exercise detail sheet shows all info + Copy ID works
- [ ] Preset reset list/create/edit works end-to-end
- [ ] Tips list filters by category, date, AI-generated
- [ ] AI generate dialog creates tips for selected dates
- [ ] Tip create/edit forms work with date picker
- [ ] Tip templates CRUD via dialogs works
- [ ] Quotes list/create/edit/delete via dialogs works
- [ ] All pages handle loading states (skeletons)
- [ ] All pages handle empty states
- [ ] All pages handle API errors with toast notifications
- [ ] No TypeScript errors: `npx tsc --noEmit`
