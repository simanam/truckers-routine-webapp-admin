import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  BlueprintListParams,
  Blueprint,
  BlueprintCreateRequest,
  BlueprintCoverageResponse,
  PaginatedResponse,
} from "@/lib/types";

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------
export const blueprintKeys = {
  all: ["blueprints"] as const,
  lists: () => [...blueprintKeys.all, "list"] as const,
  list: (params: BlueprintListParams) =>
    [...blueprintKeys.lists(), params] as const,
  details: () => [...blueprintKeys.all, "detail"] as const,
  detail: (id: string) => [...blueprintKeys.details(), id] as const,
  coverage: () => [...blueprintKeys.all, "coverage"] as const,
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
// Queries
// ---------------------------------------------------------------------------
/** Normalize response to PaginatedResponse shape.
 *  The API returns the array under a "blueprints" key, not "data". */
function toPaginated<T>(raw: unknown): PaginatedResponse<T> {
  if (Array.isArray(raw)) {
    return { data: raw, total: raw.length, page: 1, pageSize: raw.length, totalPages: 1 };
  }
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    // Support both { data: [...] } and { blueprints: [...] }
    const items = (Array.isArray(obj.data) ? obj.data : Array.isArray(obj.blueprints) ? obj.blueprints : null) as T[] | null;
    if (items) {
      return {
        data: items,
        total: typeof obj.total === "number" ? obj.total : items.length,
        page: typeof obj.page === "number" ? obj.page : 1,
        pageSize: typeof obj.pageSize === "number" ? obj.pageSize : items.length,
        totalPages: typeof obj.totalPages === "number" ? obj.totalPages : 1,
      };
    }
  }
  return { data: [], total: 0, page: 1, pageSize: 20, totalPages: 0 };
}

export function useBlueprints(params: BlueprintListParams = {}) {
  return useQuery({
    queryKey: blueprintKeys.list(params),
    queryFn: () =>
      api.fetch<PaginatedResponse<Blueprint>>(
        `/admin/blueprints${buildQuery(params as Record<string, unknown>)}`
      ),
    select: (data) => toPaginated<Blueprint>(data),
  });
}

export function useBlueprint(id: string) {
  return useQuery({
    queryKey: blueprintKeys.detail(id),
    queryFn: () => api.fetch<Blueprint>(`/admin/blueprints/${id}`),
    enabled: !!id,
  });
}

export function useBlueprintCoverage() {
  return useQuery({
    queryKey: blueprintKeys.coverage(),
    queryFn: () =>
      api.fetch<BlueprintCoverageResponse>("/admin/blueprints/coverage"),
  });
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------
export function useCreateBlueprint() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: BlueprintCreateRequest) =>
      api.fetch<Blueprint>("/admin/blueprints", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: blueprintKeys.all });
    },
  });
}

export function useUpdateBlueprint(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<BlueprintCreateRequest>) =>
      api.fetch<Blueprint>(`/admin/blueprints/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: blueprintKeys.all });
    },
  });
}

export function useDeleteBlueprint() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.fetch<void>(`/admin/blueprints/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: blueprintKeys.all });
    },
  });
}

export function useActivateBlueprint() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.fetch<Blueprint>(`/admin/blueprints/${id}/activate`, {
        method: "POST",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: blueprintKeys.all });
    },
  });
}

export function useDeactivateBlueprint() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.fetch<Blueprint>(`/admin/blueprints/${id}/deactivate`, {
        method: "POST",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: blueprintKeys.all });
    },
  });
}

export function useSeedBlueprints() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      api.fetch<{ message: string }>("/admin/blueprints/seed", {
        method: "POST",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: blueprintKeys.all });
    },
  });
}
