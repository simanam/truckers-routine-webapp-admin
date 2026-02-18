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
