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

export interface ApiErrorResponse {
  detail: string;
}
