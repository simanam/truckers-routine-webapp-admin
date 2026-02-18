"use client";

import { useState, useMemo, useCallback } from "react";
import { Plus, MoreHorizontal, Pencil, Trash } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { DataTable, type Column } from "@/components/data-table";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { TagInput } from "@/components/tag-input";

import {
  useQuotes,
  useCreateQuote,
  useUpdateQuote,
  useDeleteQuote,
} from "@/lib/hooks/use-quotes";
import {
  QUOTE_TYPE_OPTIONS,
  QUOTE_CATEGORY_OPTIONS,
  MENTAL_STATE_OPTIONS,
} from "@/lib/constants";
import type {
  Quote,
  QuoteType,
  QuoteCategory,
  MentalState,
} from "@/lib/types";

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------
const quoteSchema = z.object({
  quote_text: z.string().min(1, "Quote text is required"),
  quote_type: z.enum(["motivational", "inspirational", "humorous", "educational"]),
  category: z.enum(["fitness", "health", "mindset", "trucking", "general"]),
  mental_states: z
    .array(z.enum(["positive", "neutral", "negative", "anxious", "tired"]))
    .min(1, "Select at least one mental state"),
  energy_level_min: z.number().min(0).max(10),
  energy_level_max: z.number().min(0).max(10),
  priority: z.number().min(1).max(10),
  is_active: z.boolean(),
});

type QuoteFormValues = z.infer<typeof quoteSchema>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const TYPE_BADGE_COLORS: Record<QuoteType, string> = {
  motivational: "bg-green-100 text-green-700",
  inspirational: "bg-blue-100 text-blue-700",
  humorous: "bg-yellow-100 text-yellow-700",
  educational: "bg-purple-100 text-purple-700",
};

const CATEGORY_BADGE_COLORS: Record<QuoteCategory, string> = {
  fitness: "bg-orange-100 text-orange-700",
  health: "bg-emerald-100 text-emerald-700",
  mindset: "bg-indigo-100 text-indigo-700",
  trucking: "bg-amber-100 text-amber-700",
  general: "bg-gray-100 text-gray-700",
};

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ---------------------------------------------------------------------------
// Quote Dialog
// ---------------------------------------------------------------------------
function QuoteDialog({
  open,
  onOpenChange,
  quote,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quote?: Quote | null;
}) {
  const isEdit = !!quote;
  const createMutation = useCreateQuote();
  const updateMutation = useUpdateQuote();

  const form = useForm<QuoteFormValues>({
    resolver: zodResolver(quoteSchema),
    defaultValues: {
      quote_text: quote?.quote_text ?? "",
      quote_type: quote?.quote_type ?? "motivational",
      category: quote?.category ?? "general",
      mental_states: quote?.mental_states ?? [],
      energy_level_min: quote?.energy_level_min ?? 0,
      energy_level_max: quote?.energy_level_max ?? 10,
      priority: quote?.priority ?? 5,
      is_active: quote?.is_active ?? true,
    },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  const onSubmit = (values: QuoteFormValues) => {
    if (isEdit && quote) {
      updateMutation.mutate(
        { id: quote.id, ...values },
        {
          onSuccess: () => {
            toast.success("Quote updated successfully");
            onOpenChange(false);
          },
          onError: () => {
            toast.error("Failed to update quote");
          },
        }
      );
    } else {
      createMutation.mutate(values, {
        onSuccess: () => {
          toast.success("Quote created successfully");
          onOpenChange(false);
          form.reset();
        },
        onError: () => {
          toast.error("Failed to create quote");
        },
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Quote" : "New Quote"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 py-2"
          >
            {/* Quote Text */}
            <FormField
              control={form.control}
              name="quote_text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quote Text</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter the quote..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Type & Category */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="quote_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {QUOTE_TYPE_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {QUOTE_CATEGORY_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Mental States */}
            <FormField
              control={form.control}
              name="mental_states"
              render={({ field }) => (
                <FormItem>
                  <TagInput
                    label="Mental States"
                    value={field.value}
                    onChange={field.onChange}
                    options={MENTAL_STATE_OPTIONS}
                    placeholder="Select mental states..."
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Energy Levels & Priority */}
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="energy_level_min"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Energy Min</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        max={10}
                        value={field.value}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="energy_level_max"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Energy Max</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        max={10}
                        value={field.value}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority (1-10)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={10}
                        value={field.value}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Active */}
            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex items-center gap-3">
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="!mt-0">Active</FormLabel>
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
                {isPending ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Quotes Page
// ---------------------------------------------------------------------------
export default function QuotesPage() {
  // State
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");

  // Dialogs
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Quote | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Quote | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Queries
  const { data: quotes, isLoading } = useQuotes();

  // Mutations
  const deleteMutation = useDeleteQuote();
  const updateMutation = useUpdateQuote();

  // Client-side filtering
  const filteredData = useMemo(() => {
    if (!quotes) return [];
    let result = quotes;

    if (categoryFilter) {
      result = result.filter((q) => q.category === categoryFilter);
    }
    if (typeFilter) {
      result = result.filter((q) => q.quote_type === typeFilter);
    }
    if (search) {
      const lower = search.toLowerCase();
      result = result.filter((q) =>
        q.quote_text.toLowerCase().includes(lower)
      );
    }

    return result;
  }, [quotes, categoryFilter, typeFilter, search]);

  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, page, pageSize]);

  // Handlers
  const handleOpenCreate = () => {
    setEditTarget(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (quote: Quote) => {
    setEditTarget(quote);
    setDialogOpen(true);
  };

  const handleCloseDialog = (open: boolean) => {
    if (!open) {
      setDialogOpen(false);
      setEditTarget(null);
    }
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success("Quote deleted successfully");
        setDeleteTarget(null);
      },
      onError: () => {
        toast.error("Failed to delete quote");
      },
    });
  };

  const handleToggleStatus = useCallback(
    (quote: Quote) => {
      setTogglingId(quote.id);
      updateMutation.mutate(
        { id: quote.id, is_active: !quote.is_active },
        {
          onSuccess: () => {
            toast.success(
              `Quote ${quote.is_active ? "deactivated" : "activated"} successfully`
            );
            setTogglingId(null);
          },
          onError: () => {
            toast.error("Failed to update quote status");
            setTogglingId(null);
          },
        }
      );
    },
    [updateMutation]
  );

  // Columns
  const columns: Column<Quote>[] = [
    {
      key: "quote_text",
      header: "Quote",
      cell: (row) => (
        <span className="text-sm">
          {row.quote_text.length > 60
            ? row.quote_text.slice(0, 60) + "..."
            : row.quote_text}
        </span>
      ),
    },
    {
      key: "quote_type",
      header: "Type",
      cell: (row) => (
        <Badge
          variant="secondary"
          className={TYPE_BADGE_COLORS[row.quote_type]}
        >
          {capitalize(row.quote_type)}
        </Badge>
      ),
    },
    {
      key: "category",
      header: "Category",
      cell: (row) => (
        <Badge
          variant="secondary"
          className={CATEGORY_BADGE_COLORS[row.category]}
        >
          {capitalize(row.category)}
        </Badge>
      ),
    },
    {
      key: "priority",
      header: "Priority",
      cell: (row) => row.priority,
      className: "text-center",
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => (
        <Switch
          checked={row.is_active}
          onCheckedChange={() => handleToggleStatus(row)}
          disabled={togglingId === row.id}
        />
      ),
    },
    {
      key: "actions",
      header: "",
      cell: (row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-xs">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleOpenEdit(row)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => setDeleteTarget(row)}
            >
              <Trash className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      className: "w-10",
    },
  ];

  // Filters
  const filters = (
    <>
      <Select
        value={categoryFilter}
        onValueChange={(val) => {
          setCategoryFilter(val === "all" ? "" : val);
          setPage(1);
        }}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          {QUOTE_CATEGORY_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={typeFilter}
        onValueChange={(val) => {
          setTypeFilter(val === "all" ? "" : val);
          setPage(1);
        }}
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          {QUOTE_TYPE_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );

  // Actions
  const actions = (
    <Button onClick={handleOpenCreate}>
      <Plus className="mr-2 h-4 w-4" />
      New Quote
    </Button>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">Motivational Quotes</h1>
        <p className="mt-1 text-muted-foreground">
          Manage motivational quotes shown to truckers based on their mental
          state and energy level.
        </p>
      </div>

      <DataTable
        columns={columns}
        data={paginatedData}
        total={filteredData.length}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
        isLoading={isLoading}
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        searchPlaceholder="Search quotes..."
        filters={filters}
        actions={actions}
        emptyMessage="No quotes found."
      />

      {dialogOpen && (
        <QuoteDialog
          open={dialogOpen}
          onOpenChange={handleCloseDialog}
          quote={editTarget}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Delete Quote"
        description="Are you sure you want to delete this quote? This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        isLoading={deleteMutation.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
