import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { HelpArticle, HelpCategory } from "@/lib/types";

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------
export const helpCenterKeys = {
  articles: ["help-articles"] as const,
  articlesList: () => [...helpCenterKeys.articles, "list"] as const,
  categories: ["help-categories"] as const,
  categoriesList: () => [...helpCenterKeys.categories, "list"] as const,
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
export function useHelpCategories() {
  return useQuery({
    queryKey: helpCenterKeys.categoriesList(),
    queryFn: () =>
      api.fetch<HelpCategory[]>("/admin/help-center/categories"),
    select: (data) => toArray<HelpCategory>(data),
  });
}

export function useHelpArticles() {
  return useQuery({
    queryKey: helpCenterKeys.articlesList(),
    queryFn: () =>
      api.fetch<HelpArticle[]>("/admin/help-center/articles"),
    select: (data) => toArray<HelpArticle>(data),
  });
}

// ---------------------------------------------------------------------------
// Mutations – Articles
// ---------------------------------------------------------------------------
export function useCreateHelpArticle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (
      data: Omit<HelpArticle, "id" | "created_at" | "updated_at">
    ) =>
      api.fetch<HelpArticle>("/admin/help-center/articles", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: helpCenterKeys.articles });
    },
  });
}

export function useUpdateHelpArticle(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (
      data: Partial<Omit<HelpArticle, "id" | "created_at" | "updated_at">>
    ) =>
      api.fetch<HelpArticle>(`/admin/help-center/articles/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: helpCenterKeys.articles });
    },
  });
}

export function useDeleteHelpArticle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.fetch<void>(`/admin/help-center/articles/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: helpCenterKeys.articles });
    },
  });
}

// ---------------------------------------------------------------------------
// Mutations – Categories
// ---------------------------------------------------------------------------
export function useCreateHelpCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<HelpCategory, "id" | "created_at">) =>
      api.fetch<HelpCategory>("/admin/help-center/categories", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: helpCenterKeys.categories,
      });
    },
  });
}

export function useUpdateHelpCategory(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (
      data: Partial<Omit<HelpCategory, "id" | "created_at">>
    ) =>
      api.fetch<HelpCategory>(`/admin/help-center/categories/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: helpCenterKeys.categories,
      });
    },
  });
}

export function useDeleteHelpCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.fetch<void>(`/admin/help-center/categories/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: helpCenterKeys.categories,
      });
    },
  });
}
