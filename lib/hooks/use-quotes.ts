import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Quote, QuoteCreateRequest } from "@/lib/types";

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------
export const quoteKeys = {
  all: ["quotes"] as const,
  lists: () => [...quoteKeys.all, "list"] as const,
  categories: () => [...quoteKeys.all, "categories"] as const,
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
export function useQuotes() {
  return useQuery({
    queryKey: quoteKeys.lists(),
    queryFn: () => api.fetch<Quote[]>("/admin/quotes"),
    select: (data) => toArray<Quote>(data),
  });
}

export function useQuoteCategories() {
  return useQuery({
    queryKey: quoteKeys.categories(),
    queryFn: () => api.fetch<string[]>("/admin/quotes/categories"),
    select: (data) => toArray<string>(data),
  });
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------
export function useCreateQuote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: QuoteCreateRequest) =>
      api.fetch<Quote>("/admin/quotes", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quoteKeys.all });
    },
  });
}

export function useUpdateQuote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { id: string } & Partial<QuoteCreateRequest>) => {
      const { id, ...body } = data;
      return api.fetch<Quote>(`/admin/quotes/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quoteKeys.all });
    },
  });
}

export function useDeleteQuote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.fetch<void>(`/admin/quotes/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quoteKeys.all });
    },
  });
}
