# Trucker's Routine Admin App — Next.js Implementation Guide

## Overview

A Next.js admin dashboard for managing all backend content: workouts, blueprints, exercises, tips, users, corporate accounts, help center, quotes, pricing, and API keys.

**Backend Base URL:** `https://your-api.railway.app/api/v1`

---

## Tech Stack (Recommended)

```
Next.js 14+ (App Router)
TypeScript
Tailwind CSS
shadcn/ui (component library)
TanStack Query (data fetching + caching)
Zustand (auth state)
next-auth or custom JWT auth
```

---

## Project Structure

```
admin-app/
├── app/
│   ├── layout.tsx              # Root layout with sidebar
│   ├── page.tsx                # Dashboard home
│   ├── login/
│   │   └── page.tsx            # Login page (email + Google + Apple)
│   ├── blueprints/
│   │   ├── page.tsx            # Blueprint list + coverage dashboard
│   │   ├── new/page.tsx        # Create blueprint form
│   │   └── [id]/page.tsx       # Edit blueprint
│   ├── exercises/
│   │   └── page.tsx            # Exercise search + browse
│   ├── workouts/
│   │   └── page.tsx            # Daily workout generation controls
│   ├── tips/
│   │   ├── page.tsx            # Tips list + generate
│   │   ├── new/page.tsx        # Create tip
│   │   ├── [id]/page.tsx       # Edit tip
│   │   └── templates/page.tsx  # Tip templates
│   ├── preset-resets/
│   │   ├── page.tsx            # Preset reset list
│   │   ├── new/page.tsx        # Create preset
│   │   └── [id]/page.tsx       # Edit preset
│   ├── users/
│   │   ├── page.tsx            # User management + roles
│   │   └── admins/page.tsx     # Admin list + promote/demote
│   ├── corporate/
│   │   ├── page.tsx            # Corporate accounts list
│   │   └── [id]/page.tsx       # Corporate account detail
│   ├── help-center/
│   │   └── page.tsx            # Categories + articles
│   ├── quotes/
│   │   └── page.tsx            # Motivational quotes
│   ├── pricing/
│   │   └── page.tsx            # Pricing config + promotions
│   ├── api-keys/
│   │   └── page.tsx            # API key management
│   └── settings/
│       └── page.tsx            # App settings
├── lib/
│   ├── api.ts                  # API client with auth interceptor + session expiry events
│   ├── auth.ts                 # Auth state + token management
│   ├── cloudinary.ts           # Cloudinary video → thumbnail URL helper
│   └── types.ts                # TypeScript types from API schemas
├── components/
│   ├── layout/
│   │   ├── sidebar.tsx         # Navigation sidebar
│   │   └── header.tsx          # Top bar with user info
│   ├── exercise-picker.tsx     # Reusable exercise search + select
│   ├── tag-input.tsx           # Multi-tag input for blueprint tags
│   └── data-table.tsx          # Reusable data table
└── middleware.ts               # Auth guard for all routes
```

---

## Authentication

### How It Works

Admin users sign up normally (email/password or Google/Apple OAuth), then get promoted to admin by a super_admin. The admin app uses the same auth endpoints as the iOS app.

### Auth Endpoints

#### Email Login
```
POST /auth/login
```
```json
// Request
{ "email": "admin@example.com", "password": "SecureP@ssw0rd" }

// Response
{
  "user": { "id": "uuid", "email": "...", "tier": "free" },
  "session": {
    "access_token": "eyJ...",
    "refresh_token": "eyJ...",
    "token_type": "bearer",
    "expires_in": 3600
  }
}
```

#### Email Registration
```
POST /auth/register
```
```json
// Request
{ "email": "new@example.com", "password": "SecureP@ssw0rd" }

// Response: Same structure as login
// Note: New users get role="user". A super_admin must promote them.
```

Password requirements: 8+ chars, 1 digit, 1 uppercase, 1 lowercase, 1 special char.

#### Google OAuth Login
```
POST /auth/oauth/login
```
```json
// Request
{ "provider": "google", "id_token": "eyJ...", "access_token": "ya29..." }

// Response: Same structure as login
```

#### Apple OAuth Login
```
POST /auth/oauth/login
```
```json
// Request
{ "provider": "apple", "id_token": "eyJ...", "nonce": "abc123" }

// Response: Same structure as login
```

#### Refresh Token
```
POST /auth/refresh
```
```json
// Request
{ "refresh_token": "eyJ..." }

// Response
{ "access_token": "eyJ...", "refresh_token": "eyJ...", "token_type": "bearer", "expires_in": 3600 }
```
**Important:** Token rotation — always save the NEW refresh_token returned.

#### Get Current User
```
GET /auth/me
Headers: Authorization: Bearer {access_token}
```

#### Logout
```
POST /auth/logout
Headers: Authorization: Bearer {access_token}
```

### API Client Setup

```typescript
// lib/api.ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL;

class ApiClient {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  setTokens(access: string, refresh: string) {
    this.accessToken = access;
    this.refreshToken = refresh;
    localStorage.setItem('refresh_token', refresh); // Use httpOnly cookie in production
  }

  async fetch(path: string, options: RequestInit = {}) {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(this.accessToken && { Authorization: `Bearer ${this.accessToken}` }),
        ...options.headers,
      },
    });

    // Auto-refresh on 401
    if (res.status === 401 && this.refreshToken) {
      const refreshed = await this.refreshTokens();
      if (refreshed) {
        return this.fetch(path, options); // Retry
      }
    }

    return res;
  }

  private async refreshTokens(): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: this.refreshToken }),
      });
      if (!res.ok) return false;
      const data = await res.json();
      this.setTokens(data.access_token, data.refresh_token);
      return true;
    } catch {
      return false;
    }
  }
}

export const api = new ApiClient();
```

### Token Details
- Access token: 60 minutes expiry
- Refresh token: 7 days expiry, rotates on use
- JWT payload: `{ sub: "user-uuid", email: "...", tier: "free" }`
- Auth header: `Authorization: Bearer {access_token}`

---

## Admin Endpoints — Complete API Reference

All admin endpoints are prefixed with `/api/v1/admin/`. All require admin role authentication unless noted otherwise.

---

### 1. Blueprints — `/admin/blueprints`

The core content management for the workout blueprint pool system.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/blueprints` | List with filters + pagination |
| POST | `/admin/blueprints` | Create blueprint |
| GET | `/admin/blueprints/coverage` | Coverage report per workout type |
| GET | `/admin/blueprints/{id}` | Get detail |
| PUT | `/admin/blueprints/{id}` | Update |
| DELETE | `/admin/blueprints/{id}` | Delete |
| PATCH | `/admin/blueprints/{id}/activate` | Activate |
| PATCH | `/admin/blueprints/{id}/deactivate` | Deactivate |
| POST | `/admin/blueprints/seed` | Bulk import |

**List Query Params:**
`type`, `category`, `focus`, `difficulty`, `positionTag`, `locationTag`, `isActive`, `userTier`, `source`, `search`, `page` (default 1), `pageSize` (default 20)

**Create/Update Body:**
```json
{
  "name": "Trucker Power Circuit",
  "slug": "trucker-power-circuit",
  "type": "ignite",              // ignite | reset | unwind
  "category": "main",            // main | midday_stretch | evening_recovery
  "focus": "strength",           // strength | cardio | mobility | flexibility | mixed
  "difficulty": "intermediate",  // beginner | intermediate | advanced
  "equipment": "bodyweight",
  "estimatedSecondsPerRound": 420,
  "minRounds": 1,
  "maxRounds": 7,
  "defaultRounds": 3,
  "positionTags": ["standing"],       // sitting | standing | lying | any
  "locationTags": ["outside"],        // in_cab | outside | rest_stop | anywhere
  "timingTags": ["pre_drive"],        // pre_drive | break | post_drive | anytime
  "bodyFocusTags": ["full_body"],     // upper_body | lower_body | core | full_body
  "painAreaTags": [],                 // lower_back | neck | shoulders | hips | etc.
  "source": "darebee",
  "sourceUrl": "https://darebee.com/workouts/example.html",
  "sourceName": "Power Circuit",
  "isActive": false,
  "exercises": [
    {
      "exerciseId": "uuid",
      "order": 1,
      "type": "timer",            // timer | reps
      "durationSeconds": 40,
      "restAfterSeconds": 20
    },
    {
      "exerciseId": "uuid",
      "order": 2,
      "type": "reps",
      "reps": 10,
      "restAfterSeconds": 30
    }
  ]
}
```

**Coverage Response:**
```json
{
  "coverage": [
    { "workoutType": "ignite", "active": 12, "inactive": 3, "total": 15, "ready": false, "threshold": 50 }
  ],
  "totalActive": 30,
  "totalInactive": 10
}
```

---

### 2. Exercises — `/admin/exercises`

Search and browse exercises. Supports both admin JWT and API key auth (`exercises:read` scope).

| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/exercises` | List/search exercises |
| GET | `/admin/exercises/stats` | Exercise count stats |
| GET | `/admin/exercises/categories` | List categories |
| GET | `/admin/exercises/muscle-groups` | List muscle groups |
| GET | `/admin/exercises/equipment` | List equipment types |
| GET | `/admin/exercises/{id}` | Get by ID |

**Search Query Params:**
`search` (name/instructions ILIKE), `category`, `difficulty`, `is_bodyweight`, `limit` (default 100), `offset`

**Exercise Response:**
```json
{
  "id": "uuid",
  "name": "Push-ups",
  "category": "strength",
  "primary_muscles": ["chest", "triceps"],
  "equipment": ["bodyweight"],
  "instructions": "...",
  "is_bodyweight": true,
  "difficulty": "beginner",
  "default_reps": 10,
  "default_duration": null,
  "external_video_url": "https://...",
  "thumbnail_url": "https://...",
  "video_urls": { "mp4": "...", "webm": "..." }
}
```

---

### 3. Workouts — `/admin/workouts`

Daily workout generation controls and exercise alternative management.

| Method | Path | Description |
|--------|------|-------------|
| POST | `/admin/workouts/generate-daily` | Queue daily generation (async) |
| POST | `/admin/workouts/generate-immediate` | Generate now (sync) |
| POST | `/admin/workouts/regenerate` | Regenerate for a date |
| POST | `/admin/workouts/cleanup` | Clean up old workouts |
| GET | `/admin/workouts/alternatives` | List exercise alternatives |
| POST | `/admin/workouts/alternatives` | Create alternative mapping |
| PUT | `/admin/workouts/alternatives/{id}` | Update alternative |
| DELETE | `/admin/workouts/alternatives/{id}` | Delete alternative |
| POST | `/admin/workouts/alternatives/bulk` | Bulk create alternatives |
| GET | `/admin/workouts/alternatives/stats` | Alternative coverage stats |

**Generate Query Params:** `target_date` (optional, defaults to today)

**Regenerate Query Params:** `target_date` (required), `force` (optional bool)

**Alternative Create Body:**
```json
{
  "primary_exercise_id": "uuid",
  "alternate_exercise_id": "uuid",
  "alternate_order": 1,
  "reason": "Seated version"
}
```

---

### 4. Tips — `/admin/tips`

Content management for daily fitness tips.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/tips` | List with filters |
| POST | `/admin/tips` | Create tip |
| GET | `/admin/tips/{id}` | Get tip detail |
| PUT | `/admin/tips/{id}` | Update tip |
| DELETE | `/admin/tips/{id}` | Delete tip |
| POST | `/admin/tips/generate` | AI-generate tips |
| POST | `/admin/tips/bulk-generate` | Bulk generate for date range |
| GET | `/admin/tips/templates` | List templates |
| POST | `/admin/tips/templates` | Create template |
| PUT | `/admin/tips/templates/{id}` | Update template |
| DELETE | `/admin/tips/templates/{id}` | Delete template |
| GET | `/admin/tips/analytics` | Engagement analytics |
| POST | `/admin/tips/{id}/regenerate-audio` | Regenerate TTS audio |
| POST | `/admin/tips/{id}/upload-media` | Upload custom media |
| POST | `/admin/tips/{id}/validate` | Approve/reject AI-generated tip |

**List Query Params:**
`skip`, `limit` (default 20), `category`, `scheduled_date`, `is_ai_generated`, `is_active`, `search`

**Tip Categories:** `nutrition`, `exercise`, `mental_health`, `sleep`, `driving_posture`, `hydration`, `stretching`, `general_wellness`

**Create Body:**
```json
{
  "title": "Stay Hydrated on Long Hauls",
  "content": "Drink water every 2 hours...",
  "excerpt": "Quick hydration tip",
  "category": "hydration",
  "tags": ["hydration", "health"],
  "duration_minutes": 5,
  "media_type": "audio",
  "date": "2026-02-18",
  "min_tier": "free",
  "is_active": true
}
```

**Generate Body:**
```json
{ "dates": ["2026-02-18", "2026-02-19"], "categories": ["nutrition", "exercise"] }
```

---

### 5. Preset Resets — `/admin/resets`

Quick reset workouts (shorter than full blueprints).

| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/resets` | List with filters |
| POST | `/admin/resets` | Create preset |
| GET | `/admin/resets/analytics` | Analytics |
| GET | `/admin/resets/categories/summary` | Category summary |
| GET | `/admin/resets/{id}` | Get detail |
| PUT | `/admin/resets/{id}` | Update |
| DELETE | `/admin/resets/{id}` | Delete |
| PATCH | `/admin/resets/{id}/activate` | Activate |
| PATCH | `/admin/resets/{id}/deactivate` | Deactivate |
| PATCH | `/admin/resets/{id}/feature` | Toggle featured (`?featured=true`) |

**Create Body:**
```json
{
  "name": "Neck & Shoulder Release",
  "durationSeconds": 180,
  "category": "neck_shoulders",
  "difficulty": "easy",
  "description": "Quick release for neck tension",
  "targetAreas": ["neck", "shoulders"],
  "locationTags": ["in_cab", "anywhere"],
  "timingTags": ["break", "anytime"],
  "userTier": "FREE",
  "isActive": true,
  "exercises": [
    { "exerciseId": "uuid", "order": 1, "durationSeconds": 30, "restAfterSeconds": 10 }
  ]
}
```

---

### 6. Users & Roles — `/admin/users`

User management and admin role assignment.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/admin/users/search` | admin | Search/list all users (paginated) |
| GET | `/admin/users/admins` | admin | List all admins |
| POST | `/admin/users/{id}/promote` | super_admin | Promote to admin |
| POST | `/admin/users/{id}/demote` | super_admin | Demote to user |
| POST | `/admin/users/transfer-super-admin/{id}` | super_admin | Transfer super_admin to another user |
| GET | `/admin/users/soft-deleted` | admin | List deleted users |
| DELETE | `/admin/users/hard-delete/{id}?confirm=true` | admin | Permanent delete |
| POST | `/admin/users/restore/{id}` | admin | Restore deleted user |

**Search Query Params:** `email` (partial match), `role` (user/admin/super_admin), `limit` (default 20), `offset`

**Search Response:**
```json
{
  "users": [
    { "id": "uuid", "email": "user@example.com", "role": "user", "tier": "free", "created_at": "...", "updated_at": "..." }
  ],
  "total": 100,
  "limit": 20,
  "offset": 0
}
```

**Promote/Demote Response:**
```json
{ "message": "User admin@example.com promoted to admin", "user_id": "uuid", "email": "...", "role": "admin" }
```

**Transfer Super Admin Response:**
```json
{
  "message": "super_admin transferred to new@example.com",
  "new_super_admin": { "user_id": "uuid", "email": "new@example.com", "role": "super_admin" },
  "previous_super_admin": { "user_id": "uuid", "email": "old@example.com", "role": "admin" }
}
```

### Admin Signup Flow & Mobile App Compatibility

**How admin onboarding works:**

1. New person signs up on the admin web app (email/password, Google, or Apple OAuth)
2. They get `role = "user"` — cannot access any admin endpoints yet (403)
3. A super_admin promotes them via `POST /admin/users/{id}/promote`
4. They now have `role = "admin"` and can access all `/admin/*` endpoints

**Mobile app compatibility:**

- Admin and mobile app users share the **same account** (same `users` table, same email = same user)
- The `role` field (user/admin/super_admin) is separate from `tier` (free/pro/enterprise)
- An admin can also use the mobile fitness app — no conflict
- If an admin-only user opens the mobile app, they'll see the normal onboarding flow (fitness level, goals, equipment) — this is handled client-side and won't block admin features
- Profile completion is only enforced for **paid-tier** users on fitness endpoints, not admin endpoints
- No data conflicts: subscription fields, profile fields, and admin role are all independent

---

### 7. Corporate — `/admin/corporate`

Corporate account management for fleet/company subscriptions.

| Method | Path | Description |
|--------|------|-------------|
| POST | `/admin/corporate/accounts` | Create account |
| GET | `/admin/corporate/accounts` | List accounts |
| GET | `/admin/corporate/accounts/{id}` | Get detail with users |
| PUT | `/admin/corporate/accounts/{id}` | Update account |
| POST | `/admin/corporate/accounts/{id}/users` | Add users (bulk) |
| DELETE | `/admin/corporate/accounts/{id}/users/{uid}` | Remove user |
| GET | `/admin/corporate/accounts/{id}/analytics` | Account analytics |
| POST | `/admin/corporate/accounts/{id}/activate` | Activate |
| POST | `/admin/corporate/accounts/{id}/deactivate` | Deactivate |

---

### 8. Help Center — `/admin/help`

FAQ categories and articles.

| Method | Path | Description |
|--------|------|-------------|
| POST | `/admin/help-center/categories` | Create category |
| PUT | `/admin/help-center/categories/{id}` | Update category |
| DELETE | `/admin/help-center/categories/{id}` | Delete category |
| GET | `/admin/help-center/articles` | List articles |
| POST | `/admin/help-center/articles` | Create article |
| PUT | `/admin/help-center/articles/{id}` | Update article |
| DELETE | `/admin/help-center/articles/{id}` | Delete article |

---

### 9. Quotes — `/admin/quotes`

Motivational quotes shown in the app.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/quotes` | List quotes |
| POST | `/admin/quotes` | Create quote |
| PATCH | `/admin/quotes/{id}` | Update quote |
| DELETE | `/admin/quotes/{id}` | Soft delete quote |
| GET | `/admin/quotes/categories` | List categories |

**Create Body:**
```json
{
  "quote_text": "Every mile is a chance to move.",
  "quote_type": "motivational",
  "category": "fitness",
  "mental_states": ["neutral", "positive"],
  "energy_level_min": 30,
  "energy_level_max": 100,
  "is_active": true,
  "priority": 5
}
```

---

### 10. Pricing — `/admin/pricing`

Subscription pricing configuration.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/pricing` | Get all pricing configs |
| GET | `/admin/pricing/{plan}` | Get specific plan pricing |
| PATCH | `/admin/pricing/{plan}` | Update pricing |
| POST | `/admin/pricing/{plan}/toggle-promotion` | Toggle promotion |
| POST | `/admin/pricing/{plan}/disable-promotion` | Disable promotion |

---

### 11. API Keys — `/admin/api-keys`

API key management for n8n and external integrations.

| Method | Path | Description |
|--------|------|-------------|
| POST | `/admin/api-keys` | Create key (returns plaintext once) |
| GET | `/admin/api-keys` | List keys |
| DELETE | `/admin/api-keys/{id}` | Revoke key |

**Create Body:**
```json
{
  "name": "n8n automation",
  "scopes": ["exercises:read", "blueprints:read", "blueprints:write"],
  "expires_at": null
}
```

**Valid Scopes:** `exercises:read`, `blueprints:read`, `blueprints:write`, `workouts:read`, `workouts:write`, `users:read`, `*`

**Create Response (key shown ONCE):**
```json
{
  "id": "uuid",
  "key": "tr_abc123...full_key_here",
  "key_prefix": "tr_abc123",
  "name": "n8n automation",
  "scopes": ["exercises:read"],
  "is_active": true,
  "created_at": "2026-02-18T00:00:00"
}
```

---

## Sidebar Navigation Structure

```
Dashboard
├── Content
│   ├── Blueprints        (main content management)
│   ├── Exercises          (search + browse)
│   ├── Preset Resets      (quick resets)
│   ├── Tips               (daily tips)
│   └── Quotes             (motivational quotes)
├── Workouts
│   ├── Daily Generation   (trigger + monitor)
│   └── Alternatives       (exercise swaps)
├── Users
│   ├── User Management    (search all users, promote/demote, delete/restore)
│   ├── Admin Roles        (promote/demote, transfer super admin)
│   └── Corporate          (corporate accounts)
├── Settings
│   ├── Pricing            (subscription pricing)
│   ├── Help Center        (FAQ management)
│   └── API Keys           (key management)
```

---

## Key Pages — Implementation Notes

### Dashboard Home
- Blueprint coverage chart (per type: ignite/reset/unwind, with 50 threshold line)
- Today's workout generation status
- Recent admin activity
- Quick stats: total exercises, active blueprints, active users

### Blueprint List Page
- Data table with filters (type, category, difficulty, active/inactive)
- Coverage summary bar at top
- Activate/deactivate toggle per row
- Search by name
- "New Blueprint" button

### Blueprint Create/Edit Page
- Form with all blueprint fields
- **Exercise picker component** — search exercises by name, click to add to circuit
- Drag-and-drop exercise ordering
- Per-exercise config: type (reps/timer), reps count, duration, rest
- Live preview: estimated duration per round, total duration range
- Tag multi-select inputs (position, location, timing, body focus, pain area)

### Exercise Search Page
- Search bar with instant results
- Filter chips: category, difficulty, bodyweight
- Click exercise to see details (video, muscles, instructions)
- "Copy ID" button for manual blueprint building

### Tips Management
- Calendar view of scheduled tips
- AI generate button with date picker
- Edit/approve AI-generated tips before publishing
- Audio regeneration controls

---

## Error Handling

All API errors follow this format:
```json
{ "detail": "Error message here" }
```

Common status codes:
- `401` — Not authenticated (redirect to login)
- `403` — Not admin / missing scope
- `404` — Resource not found
- `400` — Validation error
- `429` — Rate limited

---

## Environment Variables

```env
NEXT_PUBLIC_API_URL=https://your-api.railway.app/api/v1
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
NEXT_PUBLIC_APPLE_CLIENT_ID=your-apple-bundle-id
```
