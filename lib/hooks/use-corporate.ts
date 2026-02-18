import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  CorporateAccount,
  CorporateAccountCreateRequest,
} from "@/lib/types";

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------
export const corporateKeys = {
  all: ["corporate-accounts"] as const,
  lists: () => [...corporateKeys.all, "list"] as const,
  details: () => [...corporateKeys.all, "detail"] as const,
  detail: (id: string) => [...corporateKeys.details(), id] as const,
  analytics: (id: string) =>
    [...corporateKeys.all, "analytics", id] as const,
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
export function useCorporateAccounts() {
  return useQuery({
    queryKey: corporateKeys.lists(),
    queryFn: () =>
      api.fetch<CorporateAccount[]>("/admin/corporate/accounts"),
    select: (data) => toArray<CorporateAccount>(data),
  });
}

export function useCorporateAccount(id: string) {
  return useQuery({
    queryKey: corporateKeys.detail(id),
    queryFn: () =>
      api.fetch<CorporateAccount>(`/admin/corporate/accounts/${id}`),
    enabled: !!id,
  });
}

export function useCorporateAnalytics(id: string) {
  return useQuery({
    queryKey: corporateKeys.analytics(id),
    queryFn: () =>
      api.fetch<Record<string, unknown>>(
        `/admin/corporate/accounts/${id}/analytics`
      ),
    enabled: !!id,
  });
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------
export function useCreateCorporateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CorporateAccountCreateRequest) =>
      api.fetch<CorporateAccount>("/admin/corporate/accounts", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: corporateKeys.all });
    },
  });
}

export function useUpdateCorporateAccount(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CorporateAccountCreateRequest>) =>
      api.fetch<CorporateAccount>(`/admin/corporate/accounts/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: corporateKeys.all });
    },
  });
}

export function useAddCorporateUsers(accountId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { emails: string[] }) =>
      api.fetch<CorporateAccount>(
        `/admin/corporate/accounts/${accountId}/users`,
        {
          method: "POST",
          body: JSON.stringify(data),
        }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: corporateKeys.detail(accountId),
      });
      queryClient.invalidateQueries({ queryKey: corporateKeys.all });
    },
  });
}

export function useRemoveCorporateUser(accountId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      api.fetch<void>(
        `/admin/corporate/accounts/${accountId}/users/${userId}`,
        { method: "DELETE" }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: corporateKeys.detail(accountId),
      });
      queryClient.invalidateQueries({ queryKey: corporateKeys.all });
    },
  });
}

export function useActivateCorporateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.fetch<CorporateAccount>(
        `/admin/corporate/accounts/${id}/activate`,
        { method: "POST" }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: corporateKeys.all });
    },
  });
}

export function useDeactivateCorporateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.fetch<CorporateAccount>(
        `/admin/corporate/accounts/${id}/deactivate`,
        { method: "POST" }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: corporateKeys.all });
    },
  });
}
