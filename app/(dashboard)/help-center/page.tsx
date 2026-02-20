"use client";

import { useState, useMemo } from "react";
import { Plus, Pencil, Trash, Check, X } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ConfirmDialog } from "@/components/confirm-dialog";

import {
  useHelpCategories,
  useHelpArticles,
  useCreateHelpCategory,
  useUpdateHelpCategory,
  useDeleteHelpCategory,
  useCreateHelpArticle,
  useUpdateHelpArticle,
  useDeleteHelpArticle,
} from "@/lib/hooks/use-help-center";
import type { HelpCategory, HelpArticle } from "@/lib/types";

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------
const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with dashes"),
  order: z.number().min(0).optional(),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

const articleSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  category_id: z.string().min(1, "Category is required"),
  order: z.number().min(0).optional(),
  is_published: z.boolean(),
});

type ArticleFormValues = z.infer<typeof articleSchema>;

// ---------------------------------------------------------------------------
// Category Dialog
// ---------------------------------------------------------------------------
function CategoryDialog({
  open,
  onOpenChange,
  category,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: HelpCategory | null;
}) {
  const isEdit = !!category;
  const createMutation = useCreateHelpCategory();
  const updateMutation = useUpdateHelpCategory(category?.id ?? "");

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: category?.name ?? "",
      slug: category?.slug ?? "",
      order: category?.order ?? 0,
    },
  });

  const isPending =
    createMutation.isPending || updateMutation.isPending;

  const onSubmit = (values: CategoryFormValues) => {
    if (isEdit) {
      updateMutation.mutate(values, {
        onSuccess: () => {
          toast.success("Category updated");
          onOpenChange(false);
        },
        onError: () => toast.error("Failed to update category"),
      });
    } else {
      createMutation.mutate(values, {
        onSuccess: () => {
          toast.success("Category created");
          onOpenChange(false);
          form.reset();
        },
        onError: () => toast.error("Failed to create category"),
      });
    }
  };

  // Auto-generate slug from name
  const handleNameChange = (value: string) => {
    form.setValue("name", value);
    if (!isEdit) {
      form.setValue(
        "slug",
        value
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "")
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Category" : "New Category"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 py-2"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Getting Started"
                      value={field.value}
                      onChange={(e) => handleNameChange(e.target.value)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug</FormLabel>
                  <FormControl>
                    <Input placeholder="getting-started" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="order"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Order</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      value={field.value ?? 0}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : isEdit ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Article Dialog
// ---------------------------------------------------------------------------
function ArticleDialog({
  open,
  onOpenChange,
  article,
  categories,
  defaultCategoryId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  article?: HelpArticle | null;
  categories: HelpCategory[];
  defaultCategoryId?: string | null;
}) {
  const isEdit = !!article;
  const createMutation = useCreateHelpArticle();
  const updateMutation = useUpdateHelpArticle(article?.id ?? "");

  const form = useForm<ArticleFormValues>({
    resolver: zodResolver(articleSchema),
    defaultValues: {
      title: article?.title ?? "",
      content: article?.content ?? "",
      category_id: article?.category_id ?? defaultCategoryId ?? "",
      order: article?.order ?? 0,
      is_published: article?.is_published ?? false,
    },
  });

  const isPending =
    createMutation.isPending || updateMutation.isPending;

  const onSubmit = (values: ArticleFormValues) => {
    if (isEdit) {
      updateMutation.mutate(values, {
        onSuccess: () => {
          toast.success("Article updated");
          onOpenChange(false);
        },
        onError: () => toast.error("Failed to update article"),
      });
    } else {
      createMutation.mutate(
        values as Omit<HelpArticle, "id" | "created_at" | "updated_at">,
        {
          onSuccess: () => {
            toast.success("Article created");
            onOpenChange(false);
            form.reset();
          },
          onError: () => toast.error("Failed to create article"),
        }
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Article" : "New Article"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 py-2"
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="How to Sign Up" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="order"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Order</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        value={field.value ?? 0}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_published"
                render={({ field }) => (
                  <FormItem className="flex flex-col justify-end">
                    <FormLabel>Published</FormLabel>
                    <div className="flex items-center gap-2 pt-1">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <span className="text-sm text-muted-foreground">
                        {field.value ? "Published" : "Draft"}
                      </span>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content (Markdown)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Write article content here..."
                      rows={10}
                      className="font-mono text-sm"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? "Saving..."
                  : isEdit
                    ? "Update Article"
                    : "Create Article"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------
function HelpCenterSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-[280px_1fr] gap-6">
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function HelpCenterPage() {
  const { data: categories, isLoading: categoriesLoading } =
    useHelpCategories();
  const { data: articles, isLoading: articlesLoading } = useHelpArticles();
  const deleteCategoryMutation = useDeleteHelpCategory();
  const deleteArticleMutation = useDeleteHelpArticle();

  // Selection
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null
  );

  // Category dialogs
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<HelpCategory | null>(null);
  const [deleteCategoryTarget, setDeleteCategoryTarget] =
    useState<HelpCategory | null>(null);

  // Article dialogs
  const [articleDialogOpen, setArticleDialogOpen] = useState(false);
  const [editArticle, setEditArticle] = useState<HelpArticle | null>(null);
  const [deleteArticleTarget, setDeleteArticleTarget] =
    useState<HelpArticle | null>(null);

  const isLoading = categoriesLoading || articlesLoading;

  // Auto-select first category
  const sortedCategories = useMemo(
    () =>
      [...(categories ?? [])].sort(
        (a, b) => (a.order ?? 0) - (b.order ?? 0)
      ),
    [categories]
  );

  const selectedId =
    selectedCategoryId ??
    (sortedCategories.length > 0 ? sortedCategories[0].id : null);

  const filteredArticles = useMemo(
    () =>
      (articles ?? [])
        .filter((a) => a.category_id === selectedId)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [articles, selectedId]
  );

  const selectedCategory = sortedCategories.find((c) => c.id === selectedId);

  // Handlers
  const handleDeleteCategory = () => {
    if (!deleteCategoryTarget) return;
    deleteCategoryMutation.mutate(deleteCategoryTarget.id, {
      onSuccess: () => {
        toast.success("Category deleted");
        setDeleteCategoryTarget(null);
        if (selectedCategoryId === deleteCategoryTarget.id) {
          setSelectedCategoryId(null);
        }
      },
      onError: () => toast.error("Failed to delete category"),
    });
  };

  const handleDeleteArticle = () => {
    if (!deleteArticleTarget) return;
    deleteArticleMutation.mutate(deleteArticleTarget.id, {
      onSuccess: () => {
        toast.success("Article deleted");
        setDeleteArticleTarget(null);
      },
      onError: () => toast.error("Failed to delete article"),
    });
  };

  if (isLoading) return <HelpCenterSkeleton />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Help Center</h1>
          <p className="mt-1 text-muted-foreground">
            Manage help categories and articles.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditCategory(null);
            setCategoryDialogOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Category
        </Button>
      </div>

      {/* Two-panel layout */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-[280px_1fr]">
        {/* Left Panel — Categories */}
        <div className="space-y-1">
          {sortedCategories.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No categories yet. Create one to get started.
            </p>
          ) : (
            sortedCategories.map((cat) => (
              <div
                key={cat.id}
                className={`group flex cursor-pointer items-center justify-between rounded-md border px-3 py-2.5 transition-colors ${
                  cat.id === selectedId
                    ? "border-primary bg-primary/5"
                    : "border-transparent hover:bg-muted/50"
                }`}
                onClick={() => setSelectedCategoryId(cat.id)}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{cat.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {cat.slug}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditCategory(cat);
                      setCategoryDialogOpen(true);
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteCategoryTarget(cat);
                    }}
                  >
                    <Trash className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right Panel — Articles */}
        <div>
          {selectedId && selectedCategory ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                  Articles in &quot;{selectedCategory.name}&quot;
                </h2>
                <Button
                  size="sm"
                  onClick={() => {
                    setEditArticle(null);
                    setArticleDialogOpen(true);
                  }}
                >
                  <Plus className="mr-1 h-4 w-4" />
                  New Article
                </Button>
              </div>

              {filteredArticles.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    No articles in this category yet.
                  </CardContent>
                </Card>
              ) : (
                <div className="overflow-x-auto rounded-md border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="px-4 py-3 text-left font-medium">
                          Title
                        </th>
                        <th className="px-4 py-3 text-center font-medium">
                          Published
                        </th>
                        <th className="px-4 py-3 text-center font-medium">
                          Order
                        </th>
                        <th className="px-4 py-3 text-right font-medium">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredArticles.map((article) => (
                        <tr key={article.id} className="border-b last:border-0">
                          <td className="px-4 py-3 font-medium">
                            {article.title}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {article.is_published ? (
                              <Check className="mx-auto h-4 w-4 text-green-600" />
                            ) : (
                              <X className="mx-auto h-4 w-4 text-red-400" />
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {article.order ?? 0}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => {
                                  setEditArticle(article);
                                  setArticleDialogOpen(true);
                                }}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive"
                                onClick={() => setDeleteArticleTarget(article)}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                {sortedCategories.length === 0
                  ? "Create a category to get started."
                  : "Select a category to view its articles."}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Category Dialog */}
      {categoryDialogOpen && (
        <CategoryDialog
          open={categoryDialogOpen}
          onOpenChange={(open) => {
            if (!open) {
              setCategoryDialogOpen(false);
              setEditCategory(null);
            }
          }}
          category={editCategory}
        />
      )}

      {/* Article Dialog */}
      {articleDialogOpen && (
        <ArticleDialog
          open={articleDialogOpen}
          onOpenChange={(open) => {
            if (!open) {
              setArticleDialogOpen(false);
              setEditArticle(null);
            }
          }}
          article={editArticle}
          categories={sortedCategories}
          defaultCategoryId={selectedId}
        />
      )}

      {/* Delete Category Confirm */}
      <ConfirmDialog
        open={!!deleteCategoryTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteCategoryTarget(null);
        }}
        title="Delete Category"
        description={`Delete category "${deleteCategoryTarget?.name}"? All articles in this category may be affected.`}
        confirmLabel="Delete"
        variant="destructive"
        isLoading={deleteCategoryMutation.isPending}
        onConfirm={handleDeleteCategory}
      />

      {/* Delete Article Confirm */}
      <ConfirmDialog
        open={!!deleteArticleTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteArticleTarget(null);
        }}
        title="Delete Article"
        description={`Delete article "${deleteArticleTarget?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        isLoading={deleteArticleMutation.isPending}
        onConfirm={handleDeleteArticle}
      />
    </div>
  );
}
