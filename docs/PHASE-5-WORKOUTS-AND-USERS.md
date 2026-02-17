# Phase 5: Workouts & Users

## Overview

Build workout generation controls, exercise alternatives management, user management, admin roles, and corporate accounts.

**Prerequisites:** Phase 4 complete (all content pages working, data table and form patterns established).

---

## 1. Daily Generation — `app/(dashboard)/workouts/page.tsx`

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Workout Generation                                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─ Generate Workouts ───────────────────────────────────┐  │
│  │                                                        │  │
│  │  Generate daily workouts for a specific date.          │  │
│  │  The system selects blueprints from the active pool    │  │
│  │  and creates workout instances for all users.          │  │
│  │                                                        │  │
│  │  Target Date: [📅 Feb 18, 2026      ]                  │  │
│  │                                                        │  │
│  │  [Queue Daily (Async)]   [Generate Now (Sync)]         │  │
│  │                                                        │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌─ Regenerate ──────────────────────────────────────────┐  │
│  │                                                        │  │
│  │  Regenerate workouts for a date that already has them. │  │
│  │                                                        │  │
│  │  Target Date: [📅 ______________]                      │  │
│  │  ☐ Force (overwrite existing workouts)                 │  │
│  │                                                        │  │
│  │  [Regenerate]                                          │  │
│  │                                                        │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌─ Cleanup ─────────────────────────────────────────────┐  │
│  │                                                        │  │
│  │  Remove old workout data to free up storage.           │  │
│  │                                                        │  │
│  │  [Clean Up Old Workouts]                               │  │
│  │                                                        │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Components Used
- shadcn `Card` for each section
- shadcn `Calendar` + `Popover` for date picker
- shadcn `Checkbox` for force option
- shadcn `Button` for actions
- `ConfirmDialog` for cleanup action

### Implementation Details

```typescript
"use client";

import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  useGenerateDaily,
  useGenerateImmediate,
  useRegenerateWorkout,
  useCleanupWorkouts,
} from "@/lib/hooks/use-workouts";

export default function WorkoutsPage() {
  const [generateDate, setGenerateDate] = useState<Date>(new Date());
  const [regenDate, setRegenDate] = useState<Date | undefined>();
  const [forceRegen, setForceRegen] = useState(false);
  const [showCleanupConfirm, setShowCleanupConfirm] = useState(false);

  const generateDaily = useGenerateDaily();
  const generateImmediate = useGenerateImmediate();
  const regenerate = useRegenerateWorkout();
  const cleanup = useCleanupWorkouts();

  const handleGenerateDaily = () => {
    const targetDate = format(generateDate, "yyyy-MM-dd");
    generateDaily.mutate(
      { target_date: targetDate },
      {
        onSuccess: () => toast.success("Daily generation queued"),
        onError: (err) => toast.error(err.message),
      }
    );
  };

  const handleGenerateImmediate = () => {
    const targetDate = format(generateDate, "yyyy-MM-dd");
    generateImmediate.mutate(
      { target_date: targetDate },
      {
        onSuccess: () => toast.success("Workouts generated"),
        onError: (err) => toast.error(err.message),
      }
    );
  };

  const handleRegenerate = () => {
    if (!regenDate) return;
    const targetDate = format(regenDate, "yyyy-MM-dd");
    regenerate.mutate(
      { target_date: targetDate, force: forceRegen },
      {
        onSuccess: () => toast.success("Workouts regenerated"),
        onError: (err) => toast.error(err.message),
      }
    );
  };

  const handleCleanup = () => {
    cleanup.mutate(undefined, {
      onSuccess: () => {
        toast.success("Old workouts cleaned up");
        setShowCleanupConfirm(false);
      },
      onError: (err) => toast.error(err.message),
    });
  };

  // ... render cards with buttons and date pickers
}
```

### API Calls

| Action | Hook | API Endpoint | Query Params |
|--------|------|-------------|-------------|
| Queue Daily | `useGenerateDaily()` | `POST /admin/workouts/generate-daily` | `target_date` (optional) |
| Generate Now | `useGenerateImmediate()` | `POST /admin/workouts/generate-immediate` | `target_date` (optional) |
| Regenerate | `useRegenerateWorkout()` | `POST /admin/workouts/regenerate` | `target_date` (required), `force` (optional) |
| Cleanup | `useCleanupWorkouts()` | `POST /admin/workouts/cleanup` | — |

### Button States

- Show `Loader2` spinner while mutation is pending
- Disable button during loading
- Show success/error toast on completion

---

## 2. Exercise Alternatives — `app/(dashboard)/workouts/alternatives/page.tsx`

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Exercise Alternatives                [Bulk Create] [+ New]  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─ Coverage Stats ──────────────────────────────────────┐  │
│  │ Total Mappings: 45  │  Exercises Covered: 32/847      │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  [🔍 Search...]                                              │
├──────────────┬──────────────┬───────┬────────┬──────────────┤
│ Primary      │ Alternative  │ Order │ Reason │ Actions      │
├──────────────┼──────────────┼───────┼────────┼──────────────┤
│ Push-ups     │ Wall Push-ups│ 1     │ Seated │ ✏️ 🗑         │
│              │              │       │version │              │
├──────────────┼──────────────┼───────┼────────┼──────────────┤
│ Push-ups     │ Knee Push-ups│ 2     │ Easier │ ✏️ 🗑         │
│              │              │       │variant │              │
├──────────────┼──────────────┼───────┼────────┼──────────────┤
│ Squats       │ Chair Squats │ 1     │ Support│ ✏️ 🗑         │
│              │              │       │needed  │              │
└──────────────┴──────────────┴───────┴────────┴──────────────┘
```

### Create Alternative — Dialog

```
┌─ New Alternative Mapping ────────────────┐
│                                           │
│  Primary Exercise:                        │
│  [🔍 Search and select primary exercise...│
│   └─ Push-ups (selected)               ] │
│                                           │
│  Alternative Exercise:                    │
│  [🔍 Search and select alternative...    │
│   └─ Wall Push-ups (selected)          ] │
│                                           │
│  Order:  [1]                              │
│  Reason: [Seated version for in-cab___]   │
│                                           │
│              [Cancel]  [Create]           │
└───────────────────────────────────────────┘
```

### Form Schema

```typescript
const alternativeSchema = z.object({
  primary_exercise_id: z.string().min(1, "Select a primary exercise"),
  alternate_exercise_id: z.string().min(1, "Select an alternative exercise"),
  alternate_order: z.number().min(1),
  reason: z.string().min(1, "Reason is required"),
});
```

### Exercise Search in Dialog

Use a simplified version of the `ExercisePicker` — just the search part that returns a single exercise. Could be built as `components/exercise-search-select.tsx`:

```typescript
interface ExerciseSearchSelectProps {
  value: string | null;           // exercise ID
  onChange: (id: string, exercise: Exercise) => void;
  label: string;
  placeholder?: string;
}
```

Uses shadcn `Popover` + `Command` (combobox pattern):
1. Click to open popover
2. Type to search exercises (debounced)
3. Click result to select
4. Shows selected exercise name when closed

### Bulk Create — Dialog

```
┌─ Bulk Create Alternatives ───────────────┐
│                                           │
│  Upload a JSON array of alternative       │
│  mappings:                                │
│                                           │
│  ┌──────────────────────────────────────┐│
│  │ [                                    ││
│  │   {                                  ││
│  │     "primary_exercise_id": "...",    ││
│  │     "alternate_exercise_id": "...",  ││
│  │     "alternate_order": 1,            ││
│  │     "reason": "..."                  ││
│  │   }                                  ││
│  │ ]                                    ││
│  └──────────────────────────────────────┘│
│                                           │
│              [Cancel]  [Import]           │
└───────────────────────────────────────────┘
```

Uses `useBulkCreateAlternatives()` — accepts JSON array in textarea.

### Coverage Stats

At the top of the page, show stats from `useAlternativeStats()`:
- Total alternative mappings
- Number of exercises with at least one alternative
- Percentage coverage

---

## 3. User Management — `app/(dashboard)/users/page.tsx`

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│  User Management                                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─ Soft-Deleted Users ──────────────────────────────────┐  │
│  │                                                        │  │
│  │  Users who have been soft-deleted and can be           │  │
│  │  restored or permanently removed.                      │  │
│  │                                                        │  │
│  ├──────────────────────┬──────────────┬─────────────────┤  │
│  │ Email                │ Deleted At   │ Actions         │  │
│  ├──────────────────────┼──────────────┼─────────────────┤  │
│  │ user@example.com     │ Feb 15, 2026 │ [Restore] [🗑]  │  │
│  │ old@example.com      │ Jan 20, 2026 │ [Restore] [🗑]  │  │
│  └──────────────────────┴──────────────┴─────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Column Definitions

| Column | Key | Renderer |
|--------|-----|----------|
| Email | `email` | Text |
| Deleted At | `deleted_at` | Formatted date (`format(date, "MMM d, yyyy")`) |
| Actions | — | Restore button + Hard Delete button |

### Actions

#### Restore User
```typescript
const restoreUser = useRestoreUser();

const handleRestore = (userId: string) => {
  restoreUser.mutate(userId, {
    onSuccess: () => toast.success("User restored"),
    onError: (err) => toast.error(err.message),
  });
};
```
- Button: "Restore" with `RotateCcw` icon
- No confirmation needed (non-destructive)

#### Hard Delete User
```typescript
const hardDelete = useHardDeleteUser();

const handleHardDelete = (userId: string) => {
  hardDelete.mutate(userId, {
    onSuccess: () => {
      toast.success("User permanently deleted");
      setShowConfirm(false);
    },
    onError: (err) => toast.error(err.message),
  });
};
```
- Button: Red trash icon
- **Requires ConfirmDialog**: "Permanently delete this user? This action cannot be undone."
- API call includes `?confirm=true` query param

### Empty State

If no soft-deleted users:
```
┌────────────────────────────────────────┐
│         🎉 No deleted users            │
│   All users are active and healthy.    │
└────────────────────────────────────────┘
```

---

## 4. Admin Roles — `app/(dashboard)/users/admins/page.tsx`

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Admin Roles                                                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─ Current Admins ──────────────────────────────────────┐  │
│  │                                                        │  │
│  ├──────────────────────┬──────────────┬─────────────────┤  │
│  │ Email                │ Role         │ Actions         │  │
│  ├──────────────────────┼──────────────┼─────────────────┤  │
│  │ super@example.com    │ 👑 Super Admin│ —              │  │
│  │ admin1@example.com   │ 🛡 Admin      │ [Demote] [👑]  │  │
│  │ admin2@example.com   │ 🛡 Admin      │ [Demote] [👑]  │  │
│  └──────────────────────┴──────────────┴─────────────────┘  │
│                                                              │
│  ┌─ Promote New Admin ───────────────────────────────────┐  │
│  │                                                        │  │
│  │  User ID: [________________________________]           │  │
│  │                                [Promote to Admin]      │  │
│  │                                                        │  │
│  │  Note: The user must already have an account.          │  │
│  │  Enter their user UUID to promote them to admin.       │  │
│  │                                                        │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Role-Based Actions

The current user's role determines what actions are available:

| Current User | Can See | Can Do |
|-------------|---------|--------|
| `admin` | Admin list | View only |
| `super_admin` | Admin list | Promote, Demote, Transfer |

### Actions (super_admin only)

#### Promote User
```typescript
const promote = usePromoteUser();

// User enters a user ID, clicks "Promote to Admin"
const handlePromote = (userId: string) => {
  promote.mutate(userId, {
    onSuccess: (data) => {
      toast.success(`${data.email} promoted to admin`);
      setUserId("");
    },
    onError: (err) => toast.error(err.message),
  });
};
```

#### Demote Admin
```typescript
const demote = useDemoteUser();

// ConfirmDialog: "Demote admin@example.com to regular user?"
const handleDemote = (userId: string) => {
  demote.mutate(userId, {
    onSuccess: (data) => toast.success(`${data.email} demoted to user`),
    onError: (err) => toast.error(err.message),
  });
};
```

#### Transfer Super Admin
```typescript
const transfer = useTransferSuperAdmin();

// ConfirmDialog with WARNING styling:
// "Transfer super admin role to admin@example.com?
//  You will be demoted to regular admin. This action is irreversible."
const handleTransfer = (targetUserId: string) => {
  transfer.mutate(targetUserId, {
    onSuccess: (data) => {
      toast.success(`Super admin transferred to ${data.new_super_admin.email}`);
      // Refresh user state since current user's role changed
      useAuthStore.getState().initialize();
    },
    onError: (err) => toast.error(err.message),
  });
};
```

### Checking Current User Role

```typescript
const user = useAuthStore((s) => s.user);
const isSuperAdmin = user?.role === "super_admin";
```

Only show promote/demote/transfer buttons if `isSuperAdmin` is true.

### Column Definitions

| Column | Key | Renderer |
|--------|-----|----------|
| Email | `email` | Text |
| Role | `role` | Badge with icon (crown for super_admin, shield for admin) |
| Actions | — | Demote button + Transfer button (super_admin only, not for self) |

---

## 5. Corporate Accounts

### 5.1 Corporate List — `app/(dashboard)/corporate/page.tsx`

#### Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Corporate Accounts                     [+ New Account]      │
├─────────────────────────────────────────────────────────────┤
│  [🔍 Search...]                                              │
├──────────────┬──────────────┬──────┬────────┬──────────────┤
│ Company Name │ Contact Email│ Users│ Status │ Actions      │
├──────────────┼──────────────┼──────┼────────┼──────────────┤
│ Fleet Corp   │ hr@fleet.com │ 12/50│ 🟢 Active│ View ✏️ 🗑 │
│ Truckers Inc │ admin@ti.com │ 5/20 │ ⚪ Inactive│ View ✏️  │
└──────────────┴──────────────┴──────┴────────┴──────────────┘
```

#### Column Definitions

| Column | Key | Renderer |
|--------|-----|----------|
| Name | `name` | `<Link>` to detail page |
| Contact | `contact_email` | Text |
| Users | `users.length / max_users` | "X/Y" format |
| Status | `is_active` | Badge (green=active, gray=inactive) |
| Actions | — | View, Edit (dialog), Activate/Deactivate, Delete |

#### Create Account — Dialog

```
┌─ New Corporate Account ──────────────────┐
│                                           │
│  Company Name:  [________________________]│
│  Contact Email: [________________________]│
│  Max Users:     [50_]                     │
│                                           │
│              [Cancel]  [Create Account]   │
└───────────────────────────────────────────┘
```

Form Schema:
```typescript
const corporateSchema = z.object({
  name: z.string().min(1, "Company name is required"),
  contact_email: z.string().email("Valid email required"),
  max_users: z.number().min(1, "At least 1 user"),
});
```

---

### 5.2 Corporate Detail — `app/(dashboard)/corporate/[id]/page.tsx`

#### Layout

```
┌─────────────────────────────────────────────────────────────┐
│  ← Back to Accounts     Fleet Corp                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─ Account Info ────────────────────────────────────────┐  │
│  │ Name: Fleet Corp                                       │  │
│  │ Contact: hr@fleet.com                                  │  │
│  │ Max Users: 50                                          │  │
│  │ Status: 🟢 Active    [Deactivate]   [Edit]            │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌─ Analytics ───────────────────────────────────────────┐  │
│  │ ┌──────────┐ ┌──────────┐ ┌──────────┐               │  │
│  │ │ Active   │ │ Total    │ │ Avg      │               │  │
│  │ │ Users: 8 │ │ Workouts:│ │ Workouts/│               │  │
│  │ │          │ │ 156      │ │ User: 19 │               │  │
│  │ └──────────┘ └──────────┘ └──────────┘               │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌─ Users (12/50) ─────────────────────────── [Add Users]┐  │
│  │                                                        │  │
│  ├──────────────────────┬──────────────┬─────────────────┤  │
│  │ Email                │ Joined       │ Actions         │  │
│  ├──────────────────────┼──────────────┼─────────────────┤  │
│  │ driver1@fleet.com    │ Jan 5, 2026  │ [Remove]        │  │
│  │ driver2@fleet.com    │ Jan 10, 2026 │ [Remove]        │  │
│  │ driver3@fleet.com    │ Feb 1, 2026  │ [Remove]        │  │
│  └──────────────────────┴──────────────┴─────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### Add Users — Dialog

```
┌─ Add Users to Fleet Corp ────────────────┐
│                                           │
│  Enter user IDs (one per line):           │
│  ┌──────────────────────────────────────┐│
│  │ user-uuid-1                          ││
│  │ user-uuid-2                          ││
│  │ user-uuid-3                          ││
│  └──────────────────────────────────────┘│
│                                           │
│              [Cancel]  [Add Users]        │
└───────────────────────────────────────────┘
```

Uses `useAddCorporateUsers(accountId)` — sends array of user IDs.

#### Remove User

- Click "Remove" button
- ConfirmDialog: "Remove driver1@fleet.com from Fleet Corp?"
- Calls `useRemoveCorporateUser(accountId)` with user ID

#### Account Actions

| Action | Hook | Confirmation |
|--------|------|-------------|
| Edit | `useUpdateCorporateAccount(id)` | Dialog with form |
| Activate | `useActivateCorporateAccount()` | No confirmation |
| Deactivate | `useDeactivateCorporateAccount()` | ConfirmDialog |
| Add Users | `useAddCorporateUsers(id)` | Dialog |
| Remove User | `useRemoveCorporateUser(id)` | ConfirmDialog |

#### Analytics

Display from `useCorporateAnalytics(id)`:
- Active users count
- Total workouts completed
- Average workouts per user
- (Exact response shape depends on API — render whatever fields are returned)

---

## File Summary

| File | Purpose |
|------|---------|
| `app/(dashboard)/workouts/page.tsx` | Daily generation controls |
| `app/(dashboard)/workouts/alternatives/page.tsx` | Exercise alternatives list + CRUD |
| `components/exercise-search-select.tsx` | Single exercise search/select combobox |
| `app/(dashboard)/users/page.tsx` | Soft-deleted users management |
| `app/(dashboard)/users/admins/page.tsx` | Admin roles + promote/demote |
| `app/(dashboard)/corporate/page.tsx` | Corporate accounts list |
| `app/(dashboard)/corporate/[id]/page.tsx` | Corporate account detail + users |

---

## Verification Checklist

- [ ] Workout generation page loads with date pickers
- [ ] "Queue Daily" shows loading spinner and success toast
- [ ] "Generate Now" works and shows success toast
- [ ] "Regenerate" requires a date, force checkbox works
- [ ] "Cleanup" shows confirmation dialog before executing
- [ ] Alternatives list loads with data table
- [ ] Create alternative dialog with dual exercise search works
- [ ] Edit/delete alternatives work
- [ ] Bulk create parses JSON and submits
- [ ] Alternative stats display at top
- [ ] Soft-deleted users list loads
- [ ] Restore user works with success toast
- [ ] Hard delete shows confirmation and requires confirm=true
- [ ] Admin list shows all admins with roles
- [ ] Promote user by ID works (super_admin only)
- [ ] Demote admin works with confirmation (super_admin only)
- [ ] Transfer super admin shows warning and updates current user state
- [ ] Non-super_admin users cannot see promote/demote/transfer buttons
- [ ] Corporate accounts list loads
- [ ] Create corporate account dialog works
- [ ] Corporate detail page shows account info, analytics, user list
- [ ] Add users (bulk) works
- [ ] Remove user works with confirmation
- [ ] Activate/deactivate corporate account works
- [ ] All pages handle loading/empty/error states
