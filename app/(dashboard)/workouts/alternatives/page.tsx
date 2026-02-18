"use client";

import { useState, useMemo } from "react";
import { Plus, MoreHorizontal, Pencil, Trash, Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { ExerciseSearchSelect } from "@/components/exercise-search-select";

import {
  useAlternatives,
  useAlternativeStats,
  useCreateAlternative,
  useUpdateAlternative,
  useDeleteAlternative,
  useBulkCreateAlternatives,
} from "@/lib/hooks/use-workouts";
import { useExercises } from "@/lib/hooks/use-exercises";
import type { ExerciseAlternative, AlternativeCreateRequest, Exercise } from "@/lib/types";

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------
const alternativeSchema = z.object({
  primary_exercise_id: z.string().min(1, "Primary exercise is required"),
  alternate_exercise_id: z.string().min(1, "Alternative exercise is required"),
  alternate_order: z.number().min(1, "Order must be at least 1"),
  reason: z.string().min(1, "Reason is required"),
});

type AlternativeFormValues = z.infer<typeof alternativeSchema>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function capitalize(s: string): string {
  return s
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// ---------------------------------------------------------------------------
// Alternative Dialog (Create / Edit)
// ---------------------------------------------------------------------------
function AlternativeDialog({
  open,
  onOpenChange,
  alternative,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  alternative?: ExerciseAlternative | null;
}) {
  const isEdit = !!alternative;
  const createMutation = useCreateAlternative();
  const updateMutation = useUpdateAlternative(alternative?.id ?? "");

  const form = useForm<AlternativeFormValues>({
    resolver: zodResolver(alternativeSchema),
    defaultValues: {
      primary_exercise_id: alternative?.primary_exercise_id ?? "",
      alternate_exercise_id: alternative?.alternate_exercise_id ?? "",
      alternate_order: alternative?.alternate_order ?? 1,
      reason: alternative?.reason ?? "",
    },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  const onSubmit = (values: AlternativeFormValues) => {
    if (isEdit && alternative) {
      updateMutation.mutate(values, {
        onSuccess: () => {
          toast.success("Alternative updated successfully");
          onOpenChange(false);
        },
        onError: () => {
          toast.error("Failed to update alternative");
        },
      });
    } else {
      createMutation.mutate(values, {
        onSuccess: () => {
          toast.success("Alternative created successfully");
          onOpenChange(false);
          form.reset();
        },
        onError: () => {
          toast.error("Failed to create alternative");
        },
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Alternative" : "New Alternative"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 py-2"
          >
            {/* Primary Exercise */}
            <FormField
              control={form.control}
              name="primary_exercise_id"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <ExerciseSearchSelect
                      label="Primary Exercise"
                      value={field.value || null}
                      onChange={(id) => field.onChange(id)}
                      placeholder="Select primary exercise..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Alternative Exercise */}
            <FormField
              control={form.control}
              name="alternate_exercise_id"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <ExerciseSearchSelect
                      label="Alternative Exercise"
                      value={field.value || null}
                      onChange={(id) => field.onChange(id)}
                      placeholder="Select alternative exercise..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Order & Reason */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="alternate_order"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Order</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
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
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Similar movement" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
// Bulk Create Dialog
// ---------------------------------------------------------------------------
function BulkCreateDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [jsonInput, setJsonInput] = useState("");
  const [parseError, setParseError] = useState<string | null>(null);
  const bulkCreate = useBulkCreateAlternatives();

  const handleSubmit = () => {
    setParseError(null);
    try {
      const parsed = JSON.parse(jsonInput) as AlternativeCreateRequest[];
      if (!Array.isArray(parsed)) {
        setParseError("Input must be a JSON array");
        return;
      }
      // Basic validation
      for (let i = 0; i < parsed.length; i++) {
        const item = parsed[i];
        if (
          !item.primary_exercise_id ||
          !item.alternate_exercise_id ||
          !item.reason
        ) {
          setParseError(
            `Item ${i + 1} is missing required fields (primary_exercise_id, alternate_exercise_id, reason)`
          );
          return;
        }
      }

      bulkCreate.mutate(parsed, {
        onSuccess: () => {
          toast.success(`${parsed.length} alternatives created successfully`);
          onOpenChange(false);
          setJsonInput("");
        },
        onError: () => {
          toast.error("Failed to bulk create alternatives");
        },
      });
    } catch {
      setParseError("Invalid JSON format");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Bulk Create Alternatives</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            Paste a JSON array of alternative objects. Each object must include{" "}
            <code className="rounded bg-muted px-1 text-xs">
              primary_exercise_id
            </code>
            ,{" "}
            <code className="rounded bg-muted px-1 text-xs">
              alternate_exercise_id
            </code>
            ,{" "}
            <code className="rounded bg-muted px-1 text-xs">
              alternate_order
            </code>
            , and{" "}
            <code className="rounded bg-muted px-1 text-xs">reason</code>.
          </p>

          <Textarea
            rows={10}
            placeholder={`[
  {
    "primary_exercise_id": "...",
    "alternate_exercise_id": "...",
    "alternate_order": 1,
    "reason": "Similar movement pattern"
  }
]`}
            value={jsonInput}
            onChange={(e) => {
              setJsonInput(e.target.value);
              setParseError(null);
            }}
          />

          {parseError && (
            <p className="text-sm text-destructive">{parseError}</p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={bulkCreate.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={bulkCreate.isPending || !jsonInput.trim()}
            >
              {bulkCreate.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Import
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Stats Cards
// ---------------------------------------------------------------------------
function StatsCards({ stats }: { stats: Record<string, unknown> | undefined }) {
  if (!stats) return null;

  const entries = Object.entries(stats).filter(
    ([, v]) => typeof v === "number" || typeof v === "string"
  );

  if (entries.length === 0) return null;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {entries.map(([key, val]) => (
        <Card key={key}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {capitalize(key)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-navy">{String(val)}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Alternatives Page
// ---------------------------------------------------------------------------
export default function AlternativesPage() {
  // State
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Dialogs
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ExerciseAlternative | null>(
    null
  );
  const [deleteTarget, setDeleteTarget] = useState<ExerciseAlternative | null>(
    null
  );
  const [bulkOpen, setBulkOpen] = useState(false);

  // Queries
  const { data: alternatives, isLoading } = useAlternatives();
  const { data: stats } = useAlternativeStats();
  const { data: exercises } = useExercises({ limit: 500 });

  // Build exercise name lookup
  const exerciseMap = useMemo(() => {
    const map = new Map<string, string>();
    if (exercises) {
      for (const ex of exercises) {
        map.set(ex.id, ex.name);
      }
    }
    return map;
  }, [exercises]);

  // Mutations
  const deleteMutation = useDeleteAlternative();

  // Client-side filtering
  const filteredData = useMemo(() => {
    if (!alternatives) return [];
    if (!search) return alternatives;

    const lower = search.toLowerCase();
    return alternatives.filter((a) => {
      const primaryName = a.primary_exercise?.name
        || (a.primary_exercise_id && exerciseMap.get(a.primary_exercise_id))
        || "";
      const altName = a.alternate_exercise?.name
        || (a.alternate_exercise_id && exerciseMap.get(a.alternate_exercise_id))
        || "";
      return (
        primaryName.toLowerCase().includes(lower) ||
        altName.toLowerCase().includes(lower) ||
        (a.reason || "").toLowerCase().includes(lower)
      );
    });
  }, [alternatives, search]);

  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, page, pageSize]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  const handleOpenCreate = () => {
    setEditTarget(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (alternative: ExerciseAlternative) => {
    setEditTarget(alternative);
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
        toast.success("Alternative deleted successfully");
        setDeleteTarget(null);
      },
      onError: () => {
        toast.error("Failed to delete alternative");
      },
    });
  };

  // ---------------------------------------------------------------------------
  // Columns
  // ---------------------------------------------------------------------------
  const columns: Column<ExerciseAlternative>[] = [
    {
      key: "primary_exercise_id",
      header: "Primary Exercise",
      cell: (row) => {
        const name = row.primary_exercise?.name
          || (row.primary_exercise_id ? exerciseMap.get(row.primary_exercise_id) : null);
        const id = row.primary_exercise_id || row.primary_exercise?.id;
        return (
          <span className="text-sm truncate max-w-[220px] inline-block" title={id || ""}>
            {name || id || "—"}
          </span>
        );
      },
    },
    {
      key: "alternate_exercise_id",
      header: "Alternative Exercise",
      cell: (row) => {
        const name = row.alternate_exercise?.name
          || (row.alternate_exercise_id ? exerciseMap.get(row.alternate_exercise_id) : null);
        const id = row.alternate_exercise_id || row.alternate_exercise?.id;
        return (
          <span className="text-sm truncate max-w-[220px] inline-block" title={id || ""}>
            {name || id || "—"}
          </span>
        );
      },
    },
    {
      key: "alternate_order",
      header: "Order",
      cell: (row) => row.alternate_order,
      className: "text-center w-20",
    },
    {
      key: "reason",
      header: "Reason",
      cell: (row) => (
        <span className="text-sm">
          {row.reason.length > 50
            ? row.reason.slice(0, 50) + "..."
            : row.reason}
        </span>
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

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------
  const actions = (
    <>
      <Button variant="outline" onClick={() => setBulkOpen(true)}>
        <Upload className="mr-2 h-4 w-4" />
        Bulk Create
      </Button>
      <Button onClick={handleOpenCreate}>
        <Plus className="mr-2 h-4 w-4" />
        New Alternative
      </Button>
    </>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">Exercise Alternatives</h1>
        <p className="mt-1 text-muted-foreground">
          Manage exercise alternative mappings so users can swap exercises in
          their workouts.
        </p>
      </div>

      {/* Stats */}
      <StatsCards stats={stats} />

      {/* Data Table */}
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
        searchPlaceholder="Search alternatives..."
        actions={actions}
        emptyMessage="No exercise alternatives found."
      />

      {/* Create/Edit Dialog */}
      {dialogOpen && (
        <AlternativeDialog
          open={dialogOpen}
          onOpenChange={handleCloseDialog}
          alternative={editTarget}
        />
      )}

      {/* Bulk Create Dialog */}
      {bulkOpen && (
        <BulkCreateDialog open={bulkOpen} onOpenChange={setBulkOpen} />
      )}

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Delete Alternative"
        description="Are you sure you want to delete this exercise alternative mapping? This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        isLoading={deleteMutation.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
