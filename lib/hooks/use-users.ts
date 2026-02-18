import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  AdminUser,
  PromoteDemoteResponse,
  TransferSuperAdminResponse,
  SoftDeletedUser,
} from "@/lib/types";

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------
export const userKeys = {
  admins: ["admins"] as const,
  softDeleted: ["soft-deleted-users"] as const,
};

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
    mutationFn: (data: { email: string }) =>
      api.fetch<PromoteDemoteResponse>("/admin/users/promote", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.admins });
    },
  });
}

export function useDemoteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { email: string }) =>
      api.fetch<PromoteDemoteResponse>("/admin/users/demote", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.admins });
    },
  });
}

export function useTransferSuperAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { new_super_admin_email: string }) =>
      api.fetch<TransferSuperAdminResponse>(
        "/admin/users/transfer-super-admin",
        {
          method: "POST",
          body: JSON.stringify(data),
        }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.admins });
    },
  });
}

export function useHardDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.fetch<void>(`/admin/users/${id}/hard-delete`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.softDeleted });
      queryClient.invalidateQueries({ queryKey: userKeys.admins });
    },
  });
}

export function useRestoreUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.fetch<{ message: string }>(`/admin/users/${id}/restore`, {
        method: "POST",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.softDeleted });
      queryClient.invalidateQueries({ queryKey: userKeys.admins });
    },
  });
}
