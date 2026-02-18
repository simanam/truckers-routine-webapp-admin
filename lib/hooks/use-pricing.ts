import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { PricingConfig } from "@/lib/types";

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------
export const pricingKeys = {
  all: ["pricing"] as const,
  lists: () => [...pricingKeys.all, "list"] as const,
  plan: (plan: string) => [...pricingKeys.all, plan] as const,
};

// ---------------------------------------------------------------------------
// Helpers – response normalization
// ---------------------------------------------------------------------------
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
export function usePricing() {
  return useQuery({
    queryKey: pricingKeys.lists(),
    queryFn: () => api.fetch<PricingConfig[]>("/admin/pricing"),
    select: (data) => toArray<PricingConfig>(data),
  });
}

export function usePlanPricing(plan: string) {
  return useQuery({
    queryKey: pricingKeys.plan(plan),
    queryFn: () => api.fetch<PricingConfig>(`/admin/pricing/${plan}`),
    enabled: !!plan,
  });
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------
export function useUpdatePricing(plan: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<PricingConfig>) =>
      api.fetch<PricingConfig>(`/admin/pricing/${plan}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pricingKeys.all });
    },
  });
}

export function useTogglePromotion(plan: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      promotion_text?: string;
      promotion_discount?: number;
    }) =>
      api.fetch<PricingConfig>(`/admin/pricing/${plan}/promotion`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pricingKeys.all });
    },
  });
}

export function useDisablePromotion(plan: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      api.fetch<PricingConfig>(`/admin/pricing/${plan}/promotion`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pricingKeys.all });
    },
  });
}
