"use client";

import { useState, useMemo } from "react";
import { Plus, MoreHorizontal, Pencil, Trash } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

import {
  useTipTemplates,
  useCreateTipTemplate,
  useUpdateTipTemplate,
  useDeleteTipTemplate,
} from "@/lib/hooks/use-tips";
import { TIP_CATEGORY_OPTIONS } from "@/lib/constants";
import type { TipTemplate } from "@/lib/types";

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------
const templateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z
    .enum([
      "nutrition",
      "exercise",
      "mental_health",
      "sleep",
      "driving_posture",
      "hydration",
      "stretching",
      "general_wellness",
    ])
    .optional(),
  template_text: z.string().optional(),
});

type TemplateFormValues = z.infer<typeof templateSchema>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatCategory(category: string): string {
  return category
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// ---------------------------------------------------------------------------
// Template Dialog
// ---------------------------------------------------------------------------
function TemplateDialog({
  open,
  onOpenChange,
  template,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: TipTemplate | null;
}) {
  const isEdit = !!template;
  const createMutation = useCreateTipTemplate();
  const updateMutation = useUpdateTipTemplate(template?.id ?? "");

  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: template?.name ?? "",
      category: template?.category ?? undefined,
      template_text: template?.template_text ?? "",
    },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  const onSubmit = (values: TemplateFormValues) => {
    const payload = {
      name: values.name,
      category: values.category,
      template_text: values.template_text || undefined,
    };

    if (isEdit) {
      updateMutation.mutate(payload, {
        onSuccess: () => {
          toast.success("Template updated successfully");
          onOpenChange(false);
        },
        onError: () => {
          toast.error("Failed to update template");
        },
      });
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          toast.success("Template created successfully");
          onOpenChange(false);
          form.reset();
        },
        onError: () => {
          toast.error("Failed to create template");
        },
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Template" : "New Template"}
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
                    <Input placeholder="Template name" {...field} />
                  </FormControl>
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
                    value={field.value ?? ""}
                    onValueChange={(val) =>
                      field.onChange(val === "__none__" ? undefined : val)
                    }
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category (optional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="__none__">None</SelectItem>
                      {TIP_CATEGORY_OPTIONS.map((opt) => (
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
              name="template_text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Template Text</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Template content (optional)"
                      rows={4}
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
// Templates Page
// ---------------------------------------------------------------------------
export default function TipTemplatesPage() {
  // State
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState("");

  // Dialogs
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<TipTemplate | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TipTemplate | null>(null);

  // Queries
  const { data: templates, isLoading } = useTipTemplates();

  // Mutations
  const deleteMutation = useDeleteTipTemplate();

  // Client-side search + pagination
  const filteredData = useMemo(() => {
    if (!templates) return [];
    if (!search) return templates;
    const lower = search.toLowerCase();
    return templates.filter(
      (t) =>
        t.name?.toLowerCase().includes(lower) ||
        t.template_text?.toLowerCase().includes(lower) ||
        t.category?.toLowerCase().includes(lower)
    );
  }, [templates, search]);

  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, page, pageSize]);

  // Handlers
  const handleOpenCreate = () => {
    setEditTarget(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (template: TipTemplate) => {
    setEditTarget(template);
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
        toast.success("Template deleted successfully");
        setDeleteTarget(null);
      },
      onError: () => {
        toast.error("Failed to delete template");
      },
    });
  };

  // Columns
  const columns: Column<TipTemplate>[] = [
    {
      key: "name",
      header: "Name",
      cell: (row) => (
        <span className="font-medium">{row.name ?? "—"}</span>
      ),
    },
    {
      key: "category",
      header: "Category",
      cell: (row) =>
        row.category ? (
          <Badge variant="secondary">
            {formatCategory(row.category)}
          </Badge>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: "template_text",
      header: "Template Text",
      cell: (row) => (
        <span className="text-sm text-muted-foreground">
          {row.template_text
            ? row.template_text.length > 80
              ? row.template_text.slice(0, 80) + "..."
              : row.template_text
            : "—"}
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

  // Actions
  const actions = (
    <Button onClick={handleOpenCreate}>
      <Plus className="mr-2 h-4 w-4" />
      New Template
    </Button>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">Tip Templates</h1>
        <p className="mt-1 text-muted-foreground">
          Manage reusable templates for tip generation.
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
        searchPlaceholder="Search templates..."
        actions={actions}
        emptyMessage="No templates found."
      />

      {dialogOpen && (
        <TemplateDialog
          open={dialogOpen}
          onOpenChange={handleCloseDialog}
          template={editTarget}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Delete Template"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        isLoading={deleteMutation.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
