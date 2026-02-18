import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ExerciseListParams, Exercise } from "@/lib/types";

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------
export const exerciseKeys = {
  all: ["exercises"] as const,
  lists: () => [...exerciseKeys.all, "list"] as const,
  list: (params: ExerciseListParams) =>
    [...exerciseKeys.lists(), params] as const,
  details: () => [...exerciseKeys.all, "detail"] as const,
  detail: (id: string) => [...exerciseKeys.details(), id] as const,
  stats: () => [...exerciseKeys.all, "stats"] as const,
  categories: () => [...exerciseKeys.all, "categories"] as const,
  muscleGroups: () => [...exerciseKeys.all, "muscle-groups"] as const,
  equipment: () => [...exerciseKeys.all, "equipment"] as const,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function buildQuery(params: Record<string, unknown>): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
  }
  return parts.length ? `?${parts.join("&")}` : "";
}

/** Extract array from paginated wrapper or return as-is if already an array */
function toArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object" && "data" in data && Array.isArray((data as { data: unknown }).data)) {
    return (data as { data: T[] }).data;
  }
  return [];
}

// ---------------------------------------------------------------------------
// Queries (read-only – no mutations)
// ---------------------------------------------------------------------------
export function useExercises(params: ExerciseListParams = {}) {
  return useQuery({
    queryKey: exerciseKeys.list(params),
    queryFn: () =>
      api.fetch<Exercise[]>(
        `/admin/exercises${buildQuery(params as Record<string, unknown>)}`
      ),
    select: (data) => toArray<Exercise>(data),
  });
}

export function useExercise(id: string) {
  return useQuery({
    queryKey: exerciseKeys.detail(id),
    queryFn: () => api.fetch<Exercise>(`/admin/exercises/${id}`),
    enabled: !!id,
  });
}

export function useExerciseStats() {
  return useQuery({
    queryKey: exerciseKeys.stats(),
    queryFn: () =>
      api.fetch<Record<string, unknown>>("/admin/exercises/stats"),
  });
}

export function useExerciseCategories() {
  return useQuery({
    queryKey: exerciseKeys.categories(),
    queryFn: () => api.fetch<string[]>("/admin/exercises/categories"),
    select: (data) => toArray<string>(data),
  });
}

export function useExerciseMuscleGroups() {
  return useQuery({
    queryKey: exerciseKeys.muscleGroups(),
    queryFn: () => api.fetch<string[]>("/admin/exercises/muscle-groups"),
    select: (data) => toArray<string>(data),
  });
}

export function useExerciseEquipment() {
  return useQuery({
    queryKey: exerciseKeys.equipment(),
    queryFn: () => api.fetch<string[]>("/admin/exercises/equipment"),
    select: (data) => toArray<string>(data),
  });
}
