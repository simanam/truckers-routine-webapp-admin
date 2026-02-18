import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  AdminUser,
  PromoteDemoteResponse,
  TransferSuperAdminResponse,
  SoftDeletedUser,
  SearchUser,
  SearchUsersParams,
} from "@/lib/types";

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------
export const userKeys = {
  all: ["users"] as const,
  search: (params: SearchUsersParams) => ["users", "search", params] as const,
  admins: ["admins"] as const,
  softDeleted: ["soft-deleted-users"] as const,
};

// ---------------------------------------------------------------------------
// Helpers – response normalization
// ---------------------------------------------------------------------------
function toArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    // Handle wrapped responses like { users: [...] }, { data: [...] }, etc.
    for (const key of ["data", "users", "items", "results"]) {
      if (key in obj && Array.isArray(obj[key])) {
        return obj[key] as T[];
      }
    }
  }
  return [];
}

function buildQuery(params: Record<string, unknown>): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    parts.push(
      `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`
    );
  }
  return parts.length ? `?${parts.join("&")}` : "";
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------
export function useSearchUsers(params: SearchUsersParams = {}) {
  return useQuery({
    queryKey: userKeys.search(params),
    queryFn: () =>
      api.fetch<SearchUser[]>(
        `/admin/users/search${buildQuery(params as Record<string, unknown>)}`
      ),
    select: (data) => toArray<SearchUser>(data),
  });
}

export function useAdmins() {
  return useQuery({
    queryKey: userKeys.admins,
    queryFn: () => api.fetch<AdminUser[]>("/admin/users/admins"),
    select: (data) => toArray<AdminUser>(data),
  });
}

export function useSoftDeletedUsers() {
  return useQuery({
    queryKey: userKeys.softDeleted,
    queryFn: () =>
      api.fetch<SoftDeletedUser[]>("/admin/users/soft-deleted"),
    select: (data) => toArray<SoftDeletedUser>(data),
  });
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------
export function usePromoteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      api.fetch<PromoteDemoteResponse>(`/admin/users/${userId}/promote`, {
        method: "POST",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      queryClient.invalidateQueries({ queryKey: userKeys.admins });
    },
  });
}

export function useDemoteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      api.fetch<PromoteDemoteResponse>(`/admin/users/${userId}/demote`, {
        method: "POST",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      queryClient.invalidateQueries({ queryKey: userKeys.admins });
    },
  });
}

export function useTransferSuperAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      api.fetch<TransferSuperAdminResponse>(
        `/admin/users/transfer-super-admin/${userId}`,
        { method: "POST" }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      queryClient.invalidateQueries({ queryKey: userKeys.admins });
    },
  });
}

export function useHardDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.fetch<void>(`/admin/users/hard-delete/${id}?confirm=true`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.softDeleted });
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });
}

export function useRestoreUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.fetch<{ message: string }>(`/admin/users/restore/${id}`, {
        method: "POST",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.softDeleted });
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });
}
