import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { PresetReset, PresetResetCreateRequest } from "@/lib/types";

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------
export const resetKeys = {
  all: ["resets"] as const,
  lists: () => [...resetKeys.all, "list"] as const,
  list: (params: Record<string, unknown>) =>
    [...resetKeys.lists(), params] as const,
  details: () => [...resetKeys.all, "detail"] as const,
  detail: (id: string) => [...resetKeys.details(), id] as const,
  analytics: () => [...resetKeys.all, "analytics"] as const,
  categorySummary: () => [...resetKeys.all, "category-summary"] as const,
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
// Queries
// ---------------------------------------------------------------------------
export function useResets(params: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: resetKeys.list(params),
    queryFn: () =>
      api.fetch<PresetReset[]>(`/admin/resets${buildQuery(params)}`),
    select: (data) => toArray<PresetReset>(data),
  });
}

export function useReset(id: string) {
  return useQuery({
    queryKey: resetKeys.detail(id),
    queryFn: () => api.fetch<PresetReset>(`/admin/resets/${id}`),
    enabled: !!id,
  });
}

export function useResetAnalytics() {
  return useQuery({
    queryKey: resetKeys.analytics(),
    queryFn: () =>
      api.fetch<Record<string, unknown>>("/admin/resets/analytics"),
  });
}

export function useResetCategorySummary() {
  return useQuery({
    queryKey: resetKeys.categorySummary(),
    queryFn: () =>
      api.fetch<Record<string, unknown>>("/admin/resets/category-summary"),
  });
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------
export function useCreateReset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: PresetResetCreateRequest) =>
      api.fetch<PresetReset>("/admin/resets", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: resetKeys.all });
    },
  });
}

export function useUpdateReset(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<PresetResetCreateRequest>) =>
      api.fetch<PresetReset>(`/admin/resets/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: resetKeys.all });
    },
  });
}

export function useDeleteReset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.fetch<void>(`/admin/resets/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: resetKeys.all });
    },
  });
}

export function useActivateReset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.fetch<PresetReset>(`/admin/resets/${id}/activate`, {
        method: "POST",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: resetKeys.all });
    },
  });
}

export function useDeactivateReset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.fetch<PresetReset>(`/admin/resets/${id}/deactivate`, {
        method: "POST",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: resetKeys.all });
    },
  });
}

export function useFeatureReset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.fetch<PresetReset>(`/admin/resets/${id}/feature`, {
        method: "POST",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: resetKeys.all });
    },
  });
}
