# Phase 2: Authentication & Layout

## Overview

Build the auth system (API client, token management, login page, route protection) and the app shell (sidebar, header, dashboard layout). After this phase, users can log in and see a protected dashboard with navigation.

**Prerequisites:** Phase 1 complete (project initialized, dependencies installed, theme configured).

---

## 1. TypeScript Types — `lib/types.ts`

All types derived from the API guide. This file is the single source of truth for all API data shapes.

```typescript
// ============================================================
// AUTH TYPES
// ============================================================

export interface User {
  id: string;
  email: string;
  tier: "free" | "pro" | "enterprise";
  role?: "user" | "admin" | "super_admin";
  created_at?: string;
  updated_at?: string;
}

export interface Session {
  access_token: string;
  refresh_token: string;
  token_type: "bearer";
  expires_in: number;
}

export interface AuthResponse {
  user: User;
  session: Session;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface OAuthLoginRequest {
  provider: "google" | "apple";
  id_token: string;
  access_token?: string; // Google only
  nonce?: string;        // Apple only
}

export interface RefreshRequest {
  refresh_token: string;
}

export interface RefreshResponse {
  access_token: string;
  refresh_token: string;
  token_type: "bearer";
  expires_in: number;
}

// ============================================================
// BLUEPRINT TYPES
// ============================================================

export type WorkoutType = "ignite" | "reset" | "unwind";
export type BlueprintCategory = "main" | "midday_stretch" | "evening_recovery";
export type FocusType = "strength" | "cardio" | "mobility" | "flexibility" | "mixed";
export type DifficultyLevel = "beginner" | "intermediate" | "advanced";
export type PositionTag = "sitting" | "standing" | "lying" | "any";
export type LocationTag = "in_cab" | "outside" | "rest_stop" | "anywhere";
export type TimingTag = "pre_drive" | "break" | "post_drive" | "anytime";
export type BodyFocusTag = "upper_body" | "lower_body" | "core" | "full_body";
export type PainAreaTag = "lower_back" | "neck" | "shoulders" | "hips" | "knees" | "wrists" | "ankles";
export type ExerciseType = "timer" | "reps";

export interface BlueprintExercise {
  exerciseId: string;
  order: number;
  type: ExerciseType;
  durationSeconds?: number;
  reps?: number;
  restAfterSeconds: number;
}

export interface Blueprint {
  id: string;
  name: string;
  slug: string;
  type: WorkoutType;
  category: BlueprintCategory;
  focus: FocusType;
  difficulty: DifficultyLevel;
  equipment: string;
  estimatedSecondsPerRound: number;
  minRounds: number;
  maxRounds: number;
  defaultRounds: number;
  positionTags: PositionTag[];
  locationTags: LocationTag[];
  timingTags: TimingTag[];
  bodyFocusTags: BodyFocusTag[];
  painAreaTags: PainAreaTag[];
  source?: string;
  sourceUrl?: string;
  sourceName?: string;
  isActive: boolean;
  exercises: BlueprintExercise[];
  created_at?: string;
  updated_at?: string;
}

export interface BlueprintCreateRequest {
  name: string;
  slug: string;
  type: WorkoutType;
  category: BlueprintCategory;
  focus: FocusType;
  difficulty: DifficultyLevel;
  equipment: string;
  estimatedSecondsPerRound: number;
  minRounds: number;
  maxRounds: number;
  defaultRounds: number;
  positionTags: PositionTag[];
  locationTags: LocationTag[];
  timingTags: TimingTag[];
  bodyFocusTags: BodyFocusTag[];
  painAreaTags: PainAreaTag[];
  source?: string;
  sourceUrl?: string;
  sourceName?: string;
  isActive: boolean;
  exercises: BlueprintExercise[];
}

export interface BlueprintCoverageItem {
  workoutType: WorkoutType;
  active: number;
  inactive: number;
  total: number;
  ready: boolean;
  threshold: number;
}

export interface BlueprintCoverageResponse {
  coverage: BlueprintCoverageItem[];
  totalActive: number;
  totalInactive: number;
}

export interface BlueprintListParams {
  type?: WorkoutType;
  category?: BlueprintCategory;
  focus?: FocusType;
  difficulty?: DifficultyLevel;
  positionTag?: PositionTag;
  locationTag?: LocationTag;
  isActive?: boolean;
  userTier?: string;
  source?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

// ============================================================
// EXERCISE TYPES
// ============================================================

export interface Exercise {
  id: string;
  name: string;
  category: string;
  primary_muscles: string[];
  equipment: string[];
  instructions: string;
  is_bodyweight: boolean;
  difficulty: DifficultyLevel;
  default_reps: number | null;
  default_duration: number | null;
  external_video_url: string | null;
  thumbnail_url: string | null;
  video_urls: {
    mp4?: string;
    webm?: string;
  } | null;
}

export interface ExerciseListParams {
  search?: string;
  category?: string;
  difficulty?: DifficultyLevel;
  is_bodyweight?: boolean;
  limit?: number;
  offset?: number;
}

// ============================================================
// WORKOUT & ALTERNATIVES TYPES
// ============================================================

export interface ExerciseAlternative {
  id: string;
  primary_exercise_id: string;
  alternate_exercise_id: string;
  alternate_order: number;
  reason: string;
  created_at?: string;
}

export interface AlternativeCreateRequest {
  primary_exercise_id: string;
  alternate_exercise_id: string;
  alternate_order: number;
  reason: string;
}

// ============================================================
// TIP TYPES
// ============================================================

export type TipCategory =
  | "nutrition"
  | "exercise"
  | "mental_health"
  | "sleep"
  | "driving_posture"
  | "hydration"
  | "stretching"
  | "general_wellness";

export interface Tip {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  category: TipCategory;
  tags: string[];
  duration_minutes?: number;
  media_type?: string;
  media_url?: string;
  audio_url?: string;
  date: string;
  min_tier: "free" | "pro" | "enterprise";
  is_active: boolean;
  is_ai_generated?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface TipCreateRequest {
  title: string;
  content: string;
  excerpt?: string;
  category: TipCategory;
  tags: string[];
  duration_minutes?: number;
  media_type?: string;
  date: string;
  min_tier: "free" | "pro" | "enterprise";
  is_active: boolean;
}

export interface TipListParams {
  skip?: number;
  limit?: number;
  category?: TipCategory;
  scheduled_date?: string;
  is_ai_generated?: boolean;
  is_active?: boolean;
  search?: string;
}

export interface TipGenerateRequest {
  dates: string[];
  categories: TipCategory[];
}

export interface TipTemplate {
  id: string;
  name?: string;
  category?: TipCategory;
  template_text?: string;
  created_at?: string;
  updated_at?: string;
}

// ============================================================
// PRESET RESET TYPES
// ============================================================

export type ResetCategory =
  | "neck_shoulders"
  | "lower_back"
  | "full_body"
  | "legs"
  | "arms"
  | "core"
  | "breathing"
  | "quick_stretch";

export type ResetDifficulty = "easy" | "medium" | "hard";

export interface ResetExercise {
  exerciseId: string;
  order: number;
  durationSeconds: number;
  restAfterSeconds: number;
}

export interface PresetReset {
  id: string;
  name: string;
  durationSeconds: number;
  category: ResetCategory;
  difficulty: ResetDifficulty;
  description: string;
  targetAreas: string[];
  locationTags: LocationTag[];
  timingTags: TimingTag[];
  userTier: "FREE" | "PRO" | "ENTERPRISE";
  isActive: boolean;
  isFeatured?: boolean;
  exercises: ResetExercise[];
  created_at?: string;
  updated_at?: string;
}

export interface PresetResetCreateRequest {
  name: string;
  durationSeconds: number;
  category: ResetCategory;
  difficulty: ResetDifficulty;
  description: string;
  targetAreas: string[];
  locationTags: LocationTag[];
  timingTags: TimingTag[];
  userTier: "FREE" | "PRO" | "ENTERPRISE";
  isActive: boolean;
  exercises: ResetExercise[];
}

// ============================================================
// USER & ADMIN TYPES
// ============================================================

export interface AdminUser {
  user_id: string;
  email: string;
  role: "admin" | "super_admin";
}

export interface PromoteDemoteResponse {
  message: string;
  user_id: string;
  email: string;
  role: string;
}

export interface TransferSuperAdminResponse {
  message: string;
  new_super_admin: AdminUser;
  previous_super_admin: AdminUser;
}

export interface SoftDeletedUser {
  id: string;
  email: string;
  deleted_at: string;
}

// ============================================================
// CORPORATE TYPES
// ============================================================

export interface CorporateAccount {
  id: string;
  name: string;
  contact_email: string;
  max_users: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  users?: CorporateUser[];
}

export interface CorporateUser {
  user_id: string;
  email: string;
  joined_at: string;
}

export interface CorporateAccountCreateRequest {
  name: string;
  contact_email: string;
  max_users: number;
}

// ============================================================
// HELP CENTER TYPES
// ============================================================

export interface HelpCategory {
  id: string;
  name: string;
  slug: string;
  order?: number;
  created_at?: string;
}

export interface HelpArticle {
  id: string;
  title: string;
  content: string;
  category_id: string;
  order?: number;
  is_published?: boolean;
  created_at?: string;
  updated_at?: string;
}

// ============================================================
// QUOTE TYPES
// ============================================================

export type QuoteType = "motivational" | "inspirational" | "humorous" | "educational";
export type QuoteCategory = "fitness" | "health" | "mindset" | "trucking" | "general";
export type MentalState = "positive" | "neutral" | "negative" | "anxious" | "tired";

export interface Quote {
  id: string;
  quote_text: string;
  quote_type: QuoteType;
  category: QuoteCategory;
  mental_states: MentalState[];
  energy_level_min: number;
  energy_level_max: number;
  is_active: boolean;
  priority: number;
  created_at?: string;
}

export interface QuoteCreateRequest {
  quote_text: string;
  quote_type: QuoteType;
  category: QuoteCategory;
  mental_states: MentalState[];
  energy_level_min: number;
  energy_level_max: number;
  is_active: boolean;
  priority: number;
}

// ============================================================
// PRICING TYPES
// ============================================================

export interface PricingConfig {
  plan: string;
  price_monthly?: number;
  price_yearly?: number;
  features: string[];
  is_promoted?: boolean;
  promotion_text?: string;
  promotion_discount?: number;
}

// ============================================================
// API KEY TYPES
// ============================================================

export type ApiKeyScope =
  | "exercises:read"
  | "blueprints:read"
  | "blueprints:write"
  | "workouts:read"
  | "workouts:write"
  | "users:read"
  | "*";

export interface ApiKey {
  id: string;
  key?: string;          // Only returned on creation
  key_prefix: string;
  name: string;
  scopes: ApiKeyScope[];
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}

export interface ApiKeyCreateRequest {
  name: string;
  scopes: ApiKeyScope[];
  expires_at?: string | null;
}

// ============================================================
// COMMON TYPES
// ============================================================

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiError {
  detail: string;
}
```

---

## 2. API Client — `lib/api.ts`

Full API client with automatic token refresh on 401 responses.

```typescript
import { RefreshResponse } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

class ApiClient {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private refreshPromise: Promise<boolean> | null = null;

  constructor() {
    // Restore refresh token from localStorage on init
    if (typeof window !== "undefined") {
      this.refreshToken = localStorage.getItem("refresh_token");
    }
  }

  setTokens(access: string, refresh: string) {
    this.accessToken = access;
    this.refreshToken = refresh;
    if (typeof window !== "undefined") {
      localStorage.setItem("refresh_token", refresh);
    }
  }

  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    if (typeof window !== "undefined") {
      localStorage.removeItem("refresh_token");
    }
  }

  getAccessToken() {
    return this.accessToken;
  }

  hasRefreshToken() {
    return !!this.refreshToken;
  }

  /**
   * Main fetch wrapper with auto-refresh on 401.
   * All API calls go through this method.
   */
  async fetch<T = unknown>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const res = await this.rawFetch(path, options);

    // Auto-refresh on 401
    if (res.status === 401 && this.refreshToken) {
      const refreshed = await this.tryRefresh();
      if (refreshed) {
        const retryRes = await this.rawFetch(path, options);
        if (!retryRes.ok) {
          const error = await retryRes.json().catch(() => ({ detail: "Request failed" }));
          throw new ApiError(retryRes.status, error.detail || "Request failed");
        }
        return retryRes.json() as Promise<T>;
      }
      // Refresh failed — redirect to login
      this.clearTokens();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      throw new ApiError(401, "Session expired");
    }

    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: "Request failed" }));
      throw new ApiError(res.status, error.detail || "Request failed");
    }

    // Handle 204 No Content
    if (res.status === 204) {
      return undefined as T;
    }

    return res.json() as Promise<T>;
  }

  /**
   * Raw fetch without retry logic. Used internally.
   */
  private async rawFetch(path: string, options: RequestInit = {}) {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (this.accessToken) {
      headers["Authorization"] = `Bearer ${this.accessToken}`;
    }

    return fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });
  }

  /**
   * Token refresh with deduplication.
   * If multiple 401s happen simultaneously, only one refresh request is made.
   */
  private async tryRefresh(): Promise<boolean> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.doRefresh();
    const result = await this.refreshPromise;
    this.refreshPromise = null;
    return result;
  }

  private async doRefresh(): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: this.refreshToken }),
      });

      if (!res.ok) return false;

      const data: RefreshResponse = await res.json();
      this.setTokens(data.access_token, data.refresh_token);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Custom error class for API errors.
 * Includes HTTP status code and error message from the backend.
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// Singleton instance
export const api = new ApiClient();
```

---

## 3. Auth Store — `lib/auth-store.ts`

Zustand store for managing authentication state.

```typescript
import { create } from "zustand";
import { api } from "./api";
import type { User, AuthResponse, LoginRequest } from "./types";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;

  // Actions
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,

  /**
   * Login with email/password.
   * On success: stores tokens, fetches user profile, updates state.
   * On failure: throws error (handled by the login form).
   */
  login: async (credentials: LoginRequest) => {
    set({ isLoading: true });
    try {
      const data = await api.fetch<AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify(credentials),
      });

      api.setTokens(data.session.access_token, data.session.refresh_token);

      // Verify user has admin role
      const me = await api.fetch<User>("/auth/me");
      if (me.role !== "admin" && me.role !== "super_admin") {
        api.clearTokens();
        throw new Error("Access denied. Admin privileges required.");
      }

      set({ user: me, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  /**
   * Logout: call backend, clear tokens, reset state.
   */
  logout: async () => {
    try {
      await api.fetch("/auth/logout", { method: "POST" });
    } catch {
      // Ignore logout errors — clear state regardless
    }
    api.clearTokens();
    set({ user: null, isAuthenticated: false });
  },

  /**
   * Initialize auth on app load.
   * Checks if a refresh token exists and tries to restore the session.
   */
  initialize: async () => {
    if (get().isInitialized) return;

    if (!api.hasRefreshToken()) {
      set({ isInitialized: true });
      return;
    }

    set({ isLoading: true });
    try {
      // Try to refresh and get current user
      const me = await api.fetch<User>("/auth/me");
      if (me.role === "admin" || me.role === "super_admin") {
        set({ user: me, isAuthenticated: true });
      } else {
        api.clearTokens();
      }
    } catch {
      api.clearTokens();
    }
    set({ isLoading: false, isInitialized: true });
  },

  setUser: (user: User) => set({ user }),
}));
```

---

## 4. Middleware — `middleware.ts`

Next.js middleware to protect all routes except `/login`.

```typescript
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that don't require authentication
const PUBLIC_ROUTES = ["/login"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Allow static files and API routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/images") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Check for refresh token in cookies or rely on client-side check
  // Since we use localStorage for tokens, the real auth check happens
  // client-side in the dashboard layout. This middleware is a first gate.
  // For a more secure approach, tokens could be stored in httpOnly cookies.

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
```

> **Note:** Since tokens are in localStorage (client-side), the real auth guard is in the dashboard layout component that checks `useAuthStore`. The middleware serves as a structural boundary. For production, consider httpOnly cookies for better security.

---

## 5. Query Provider — `components/providers/query-provider.tsx`

```typescript
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,        // 1 minute
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
```

---

## 6. Auth Provider — `components/providers/auth-provider.tsx`

Initializes auth state on app load.

```typescript
"use client";

import { useEffect, type ReactNode } from "react";
import { useAuthStore } from "@/lib/auth-store";

export function AuthProvider({ children }: { children: ReactNode }) {
  const initialize = useAuthStore((s) => s.initialize);
  const isInitialized = useAuthStore((s) => s.isInitialized);

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Show nothing until auth state is determined
  if (!isInitialized) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-navy border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
```

---

## 7. Root Layout Update — `app/layout.tsx`

Wrap app with providers.

```typescript
import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import { QueryProvider } from "@/components/providers/query-provider";
import { AuthProvider } from "@/components/providers/auth-provider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Trucker's Routine Admin",
  description: "Admin dashboard for managing Trucker's Routine content and users",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={montserrat.variable}>
      <body>
        <QueryProvider>
          <AuthProvider>
            {children}
            <Toaster position="top-right" richColors />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
```

---

## 8. Login Page — `app/login/page.tsx`

### Design Spec

- Full-screen centered card on a cream/light background
- Logo at top of card
- Email + password fields
- "Sign In" button (navy background, cream text)
- Error message display
- Loading state on submit
- Redirect to `/` on success

### Validation Rules (from API guide)
- Email: required, valid email format
- Password: required, 8+ chars, 1 digit, 1 uppercase, 1 lowercase, 1 special char

### Implementation

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Image from "next/image";
import { useAuthStore } from "@/lib/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setError(null);
    try {
      await login(data);
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-col items-center gap-4 pb-2">
          <Image
            src="/images/logo.png"
            alt="Trucker's Routine"
            width={200}
            height={60}
            priority
          />
          <p className="text-sm text-muted-foreground">Admin Dashboard</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                autoComplete="email"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                autoComplete="current-password"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-navy text-cream hover:bg-navy-dark"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## 9. Sidebar — `components/layout/sidebar.tsx`

### Navigation Structure (from API guide)

```
Dashboard (home icon)
─────────────────────
Content
  ├── Blueprints     (layers icon)
  ├── Exercises      (dumbbell icon)
  ├── Preset Resets  (refresh-cw icon)
  ├── Tips           (lightbulb icon)
  └── Quotes         (quote icon)
─────────────────────
Workouts
  ├── Daily Generation  (calendar icon)
  └── Alternatives      (shuffle icon)
─────────────────────
Users
  ├── User Management   (users icon)
  ├── Admin Roles       (shield icon)
  └── Corporate         (building icon)
─────────────────────
Settings
  ├── Pricing        (credit-card icon)
  ├── Help Center    (help-circle icon)
  └── API Keys       (key icon)
```

### Implementation

```typescript
"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Layers,
  Dumbbell,
  RefreshCw,
  Lightbulb,
  Quote,
  Calendar,
  Shuffle,
  Users,
  Shield,
  Building,
  CreditCard,
  HelpCircle,
  Key,
  ChevronDown,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useState } from "react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: "Content",
    items: [
      { label: "Blueprints", href: "/blueprints", icon: Layers },
      { label: "Exercises", href: "/exercises", icon: Dumbbell },
      { label: "Preset Resets", href: "/preset-resets", icon: RefreshCw },
      { label: "Tips", href: "/tips", icon: Lightbulb },
      { label: "Quotes", href: "/quotes", icon: Quote },
    ],
  },
  {
    title: "Workouts",
    items: [
      { label: "Daily Generation", href: "/workouts", icon: Calendar },
      { label: "Alternatives", href: "/workouts/alternatives", icon: Shuffle },
    ],
  },
  {
    title: "Users",
    items: [
      { label: "User Management", href: "/users", icon: Users },
      { label: "Admin Roles", href: "/users/admins", icon: Shield },
      { label: "Corporate", href: "/corporate", icon: Building },
    ],
  },
  {
    title: "Settings",
    items: [
      { label: "Pricing", href: "/pricing", icon: CreditCard },
      { label: "Help Center", href: "/help-center", icon: HelpCircle },
      { label: "API Keys", href: "/api-keys", icon: Key },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r bg-sidebar text-sidebar-foreground">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-6">
        <Image
          src="/images/logo-alt.png"
          alt="Trucker's Routine"
          width={150}
          height={40}
          className="brightness-0 invert"
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {/* Dashboard link */}
        <Link
          href="/"
          className={cn(
            "mb-2 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            pathname === "/"
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
          )}
        >
          <LayoutDashboard className="h-4 w-4" />
          Dashboard
        </Link>

        {/* Sections */}
        {NAV_SECTIONS.map((section) => (
          <SidebarSection
            key={section.title}
            section={section}
            pathname={pathname}
          />
        ))}
      </nav>
    </aside>
  );
}

function SidebarSection({
  section,
  pathname,
}: {
  section: NavSection;
  pathname: string;
}) {
  const isAnyActive = section.items.some((item) =>
    pathname.startsWith(item.href)
  );
  const [isOpen, setIsOpen] = useState(true);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mb-1">
      <CollapsibleTrigger className="flex w-full items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50 hover:text-sidebar-foreground/70">
        {section.title}
        <ChevronDown
          className={cn(
            "h-3 w-3 transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="space-y-1">
          {section.items.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
```

---

## 10. Header — `components/layout/header.tsx`

```typescript
"use client";

import { useAuthStore } from "@/lib/auth-store";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User } from "lucide-react";

export function Header() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const initials = user?.email
    ? user.email.substring(0, 2).toUpperCase()
    : "AD";

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-background px-6">
      <div>
        {/* Page title will be set by each page via a context or prop */}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-muted">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-navy text-cream text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="hidden text-left sm:block">
            <p className="text-sm font-medium">{user?.email}</p>
            <p className="text-xs text-muted-foreground capitalize">
              {user?.role?.replace("_", " ")}
            </p>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem disabled>
            <User className="mr-2 h-4 w-4" />
            Profile
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="text-red-600">
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
```

---

## 11. Dashboard Layout — `app/(dashboard)/layout.tsx`

The route group `(dashboard)` wraps all authenticated pages.

```typescript
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isInitialized = useAuthStore((s) => s.isInitialized);

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push("/login");
    }
  }, [isInitialized, isAuthenticated, router]);

  if (!isInitialized || !isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-navy border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col pl-64">
        <Header />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
```

---

## 12. Dashboard Home Page — `app/(dashboard)/page.tsx`

Placeholder page to verify the layout works:

```typescript
export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-navy">Dashboard</h1>
      <p className="mt-2 text-muted-foreground">
        Welcome to the Trucker's Routine Admin Dashboard.
      </p>
    </div>
  );
}
```

---

## File Summary

| File | Purpose |
|------|---------|
| `lib/types.ts` | All TypeScript interfaces for API data |
| `lib/api.ts` | API client with auto token refresh |
| `lib/auth-store.ts` | Zustand auth state management |
| `middleware.ts` | Route protection middleware |
| `components/providers/query-provider.tsx` | TanStack Query setup |
| `components/providers/auth-provider.tsx` | Auth initialization on app load |
| `app/layout.tsx` | Root layout with all providers |
| `app/login/page.tsx` | Login page with email/password form |
| `components/layout/sidebar.tsx` | Collapsible sidebar navigation |
| `components/layout/header.tsx` | Header with user dropdown |
| `app/(dashboard)/layout.tsx` | Dashboard layout with auth guard |
| `app/(dashboard)/page.tsx` | Dashboard home placeholder |

---

## Verification Checklist

- [ ] `npm run dev` runs without errors
- [ ] `/login` page renders with logo, email, and password fields
- [ ] Login with valid admin credentials redirects to dashboard
- [ ] Login with non-admin user shows "Access denied" error
- [ ] Invalid credentials show error message
- [ ] Dashboard page shows sidebar with all navigation sections
- [ ] Sidebar links navigate correctly (even if pages are empty)
- [ ] Header shows user email and role
- [ ] Logout redirects to login page
- [ ] Refreshing the page while logged in maintains the session
- [ ] Opening the app with no session redirects to login
