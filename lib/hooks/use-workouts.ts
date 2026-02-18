import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ExerciseAlternative, AlternativeCreateRequest } from "@/lib/types";

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------
export const workoutKeys = {
  all: ["workouts"] as const,
  alternatives: ["alternatives"] as const,
  alternativesList: () => [...workoutKeys.alternatives, "list"] as const,
  alternativeDetail: (id: string) =>
    [...workoutKeys.alternatives, id] as const,
  alternativeStats: () => [...workoutKeys.alternatives, "stats"] as const,
};

// ---------------------------------------------------------------------------
// Mutations – Workout Generation
// ---------------------------------------------------------------------------
export function useGenerateDaily() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      api.fetch<{ message: string }>("/admin/workouts/generate-daily", {
        method: "POST",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workoutKeys.all });
    },
  });
}

export function useGenerateImmediate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { user_id?: string; type?: string }) =>
      api.fetch<Record<string, unknown>>("/admin/workouts/generate-immediate", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workoutKeys.all });
    },
  });
}

export function useRegenerateWorkout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.fetch<Record<string, unknown>>(
        `/admin/workouts/${id}/regenerate`,
        { method: "POST" }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workoutKeys.all });
    },
  });
}

export function useCleanupWorkouts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      api.fetch<{ message: string }>("/admin/workouts/cleanup", {
        method: "POST",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workoutKeys.all });
    },
  });
}

// ---------------------------------------------------------------------------
// Helpers – response normalization
// ---------------------------------------------------------------------------
/** Extract array from paginated wrapper or return as-is if already an array */
function toArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object" && "data" in data && Array.isArray((data as { data: unknown }).data)) {
    return (data as { data: T[] }).data;
  }
  return [];
}

// ---------------------------------------------------------------------------
// Queries – Alternatives
// ---------------------------------------------------------------------------
export function useAlternatives() {
  return useQuery({
    queryKey: workoutKeys.alternativesList(),
    queryFn: () =>
      api.fetch<ExerciseAlternative[]>("/admin/workouts/alternatives"),
    select: (data) => toArray<ExerciseAlternative>(data),
  });
}

export function useAlternativeStats() {
  return useQuery({
    queryKey: workoutKeys.alternativeStats(),
    queryFn: () =>
      api.fetch<Record<string, unknown>>(
        "/admin/workouts/alternatives/stats"
      ),
  });
}

// ---------------------------------------------------------------------------
// Mutations – Alternatives
// ---------------------------------------------------------------------------
export function useCreateAlternative() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AlternativeCreateRequest) =>
      api.fetch<ExerciseAlternative>("/admin/workouts/alternatives", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workoutKeys.alternatives });
    },
  });
}

export function useUpdateAlternative(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<AlternativeCreateRequest>) =>
      api.fetch<ExerciseAlternative>(
        `/admin/workouts/alternatives/${id}`,
        {
          method: "PUT",
          body: JSON.stringify(data),
        }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workoutKeys.alternatives });
    },
  });
}

export function useDeleteAlternative() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.fetch<void>(`/admin/workouts/alternatives/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workoutKeys.alternatives });
    },
  });
}

export function useBulkCreateAlternatives() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AlternativeCreateRequest[]) =>
      api.fetch<ExerciseAlternative[]>(
        "/admin/workouts/alternatives/bulk",
        {
          method: "POST",
          body: JSON.stringify(data),
        }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workoutKeys.alternatives });
    },
  });
}
