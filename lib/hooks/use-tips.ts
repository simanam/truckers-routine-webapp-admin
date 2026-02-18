import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  TipListParams,
  Tip,
  TipCreateRequest,
  TipGenerateRequest,
  TipTemplate,
} from "@/lib/types";

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------
export const tipKeys = {
  all: ["tips"] as const,
  lists: () => [...tipKeys.all, "list"] as const,
  list: (params: TipListParams) => [...tipKeys.lists(), params] as const,
  details: () => [...tipKeys.all, "detail"] as const,
  detail: (id: string) => [...tipKeys.details(), id] as const,
  templates: ["tip-templates"] as const,
  templateDetail: (id: string) => [...tipKeys.templates, id] as const,
  analytics: ["tip-analytics"] as const,
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
export function useTips(params: TipListParams = {}) {
  return useQuery({
    queryKey: tipKeys.list(params),
    queryFn: () =>
      api.fetch<Tip[]>(
        `/admin/tips${buildQuery(params as Record<string, unknown>)}`
      ),
    select: (data) => toArray<Tip>(data),
  });
}

export function useTip(id: string) {
  return useQuery({
    queryKey: tipKeys.detail(id),
    queryFn: () => api.fetch<Tip>(`/admin/tips/${id}`),
    enabled: !!id,
  });
}

export function useTipTemplates() {
  return useQuery({
    queryKey: tipKeys.templates,
    queryFn: () => api.fetch<TipTemplate[]>("/admin/tips/templates"),
    select: (data) => toArray<TipTemplate>(data),
  });
}

export function useTipAnalytics() {
  return useQuery({
    queryKey: tipKeys.analytics,
    queryFn: () =>
      api.fetch<Record<string, unknown>>("/admin/tips/analytics"),
  });
}

// ---------------------------------------------------------------------------
// Mutations – Tips
// ---------------------------------------------------------------------------
export function useCreateTip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: TipCreateRequest) =>
      api.fetch<Tip>("/admin/tips", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tipKeys.all });
    },
  });
}

export function useUpdateTip(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<TipCreateRequest>) =>
      api.fetch<Tip>(`/admin/tips/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tipKeys.all });
    },
  });
}

export function useDeleteTip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.fetch<void>(`/admin/tips/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tipKeys.all });
    },
  });
}

export function useGenerateTips() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: TipGenerateRequest) =>
      api.fetch<Tip[]>("/admin/tips/generate", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tipKeys.all });
    },
  });
}

export function useBulkGenerateTips() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: TipGenerateRequest) =>
      api.fetch<Tip[]>("/admin/tips/bulk-generate", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tipKeys.all });
    },
  });
}

export function useRegenerateTipAudio(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      api.fetch<Tip>(`/admin/tips/${id}/regenerate-audio`, {
        method: "POST",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tipKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: tipKeys.all });
    },
  });
}

export function useUploadTipMedia(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { media_type: string; media_url: string }) =>
      api.fetch<Tip>(`/admin/tips/${id}/media`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tipKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: tipKeys.all });
    },
  });
}

export function useValidateTip(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      api.fetch<{ valid: boolean; errors?: string[] }>(
        `/admin/tips/${id}/validate`,
        { method: "POST" }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tipKeys.detail(id) });
    },
  });
}

// ---------------------------------------------------------------------------
// Mutations – Tip Templates
// ---------------------------------------------------------------------------
export function useCreateTipTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<TipTemplate, "id" | "created_at" | "updated_at">) =>
      api.fetch<TipTemplate>("/admin/tips/templates", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tipKeys.templates });
    },
  });
}

export function useUpdateTipTemplate(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Omit<TipTemplate, "id" | "created_at" | "updated_at">>) =>
      api.fetch<TipTemplate>(`/admin/tips/templates/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tipKeys.templates });
    },
  });
}

export function useDeleteTipTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.fetch<void>(`/admin/tips/templates/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tipKeys.templates });
    },
  });
}
