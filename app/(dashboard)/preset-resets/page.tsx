"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Star, MoreHorizontal, Plus, Pencil, Trash } from "lucide-react";
import { toast } from "sonner";

import { DataTable, type Column } from "@/components/data-table";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  useResets,
  useDeleteReset,
  useActivateReset,
  useDeactivateReset,
  useFeatureReset,
} from "@/lib/hooks/use-resets";
import {
  RESET_CATEGORY_OPTIONS,
  RESET_DIFFICULTY_OPTIONS,
} from "@/lib/constants";
import type { PresetReset } from "@/lib/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatDuration(seconds: number): string {
  return (
    Math.floor(seconds / 60) +
    ":" +
    (seconds % 60).toString().padStart(2, "0")
  );
}

function formatCategory(value: string): string {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
const PAGE_SIZE_DEFAULT = 10;

export default function PresetResetsPage() {
  // Filters
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_DEFAULT);

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<PresetReset | null>(null);

  // Queries & mutations
  const { data: resets, isLoading } = useResets();
  const deleteMutation = useDeleteReset();
  const activateMutation = useActivateReset();
  const deactivateMutation = useDeactivateReset();
  const featureMutation = useFeatureReset();

  // Client-side filtering
  const filtered = useMemo(() => {
    if (!resets) return [];
    return resets.filter((r) => {
      if (search && !r.name.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      if (categoryFilter !== "all" && r.category !== categoryFilter) {
        return false;
      }
      if (difficultyFilter !== "all" && r.difficulty !== difficultyFilter) {
        return false;
      }
      if (statusFilter === "active" && !r.isActive) return false;
      if (statusFilter === "inactive" && r.isActive) return false;
      return true;
    });
  }, [resets, search, categoryFilter, difficultyFilter, statusFilter]);

  // Client-side pagination
  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  // Reset to page 1 when filters change
  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  // Handlers
  const handleToggleActive = (reset: PresetReset) => {
    const mutation = reset.isActive ? deactivateMutation : activateMutation;
    mutation.mutate(reset.id, {
      onSuccess: () => {
        toast.success(
          `Reset ${reset.isActive ? "deactivated" : "activated"} successfully`
        );
      },
      onError: () => {
        toast.error("Failed to update status");
      },
    });
  };

  const handleToggleFeatured = (reset: PresetReset) => {
    featureMutation.mutate(reset.id, {
      onSuccess: () => {
        toast.success(
          `Reset ${reset.isFeatured ? "unfeatured" : "featured"} successfully`
        );
      },
      onError: () => {
        toast.error("Failed to update featured status");
      },
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success("Reset deleted successfully");
        setDeleteTarget(null);
      },
      onError: () => {
        toast.error("Failed to delete reset");
      },
    });
  };

  // Columns
  const columns: Column<PresetReset>[] = [
    {
      key: "name",
      header: "Name",
      cell: (row) => (
        <Link
          href={`/preset-resets/${row.id}`}
          className="font-medium text-primary hover:underline"
        >
          {row.name}
        </Link>
      ),
    },
    {
      key: "category",
      header: "Category",
      cell: (row) => formatCategory(row.category),
    },
    {
      key: "duration",
      header: "Duration",
      cell: (row) => formatDuration(row.durationSeconds),
    },
    {
      key: "difficulty",
      header: "Difficulty",
      cell: (row) => (
        <Badge variant="outline">{formatCategory(row.difficulty)}</Badge>
      ),
    },
    {
      key: "tier",
      header: "Tier",
      cell: (row) => <Badge variant="secondary">{row.userTier}</Badge>,
    },
    {
      key: "featured",
      header: "Featured",
      cell: (row) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleToggleFeatured(row);
          }}
          className="inline-flex items-center justify-center"
          disabled={featureMutation.isPending}
        >
          <Star
            className={`h-5 w-5 transition-colors ${
              row.isFeatured
                ? "fill-yellow-400 text-yellow-400"
                : "text-muted-foreground hover:text-yellow-400"
            }`}
          />
        </button>
      ),
      className: "text-center",
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => (
        <Switch
          checked={row.isActive}
          onCheckedChange={() => handleToggleActive(row)}
          disabled={
            activateMutation.isPending || deactivateMutation.isPending
          }
          size="sm"
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
            <DropdownMenuItem asChild>
              <Link href={`/preset-resets/${row.id}`}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onClick={() => setDeleteTarget(row)}
            >
              <Trash className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      className: "w-[50px]",
    },
  ];

  // Filter controls
  const filterControls = (
    <>
      <Select
        value={categoryFilter}
        onValueChange={(val) => {
          setCategoryFilter(val);
          setPage(1);
        }}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          {RESET_CATEGORY_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={difficultyFilter}
        onValueChange={(val) => {
          setDifficultyFilter(val);
          setPage(1);
        }}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Difficulty" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Difficulties</SelectItem>
          {RESET_DIFFICULTY_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={statusFilter}
        onValueChange={(val) => {
          setStatusFilter(val);
          setPage(1);
        }}
      >
        <SelectTrigger className="w-[130px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="inactive">Inactive</SelectItem>
        </SelectContent>
      </Select>
    </>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Preset Resets</h1>
          <p className="mt-1 text-muted-foreground">
            Manage preset reset routines for truckers.
          </p>
        </div>
        <Button asChild>
          <Link href="/preset-resets/new">
            <Plus className="mr-2 h-4 w-4" />
            New Preset
          </Link>
        </Button>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={paginatedData}
        total={filtered.length}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
        isLoading={isLoading}
        searchValue={search}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Search resets..."
        filters={filterControls}
        emptyMessage="No preset resets found."
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Delete Preset Reset"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        isLoading={deleteMutation.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
