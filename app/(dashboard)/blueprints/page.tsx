"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Plus, Pencil, Trash } from "lucide-react";
import { toast } from "sonner";

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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable, type Column } from "@/components/data-table";
import { ConfirmDialog } from "@/components/confirm-dialog";

import {
  useBlueprints,
  useBlueprintCoverage,
  useActivateBlueprint,
  useDeactivateBlueprint,
  useDeleteBlueprint,
} from "@/lib/hooks/use-blueprints";
import {
  WORKOUT_TYPE_OPTIONS,
  BLUEPRINT_CATEGORY_OPTIONS,
  DIFFICULTY_OPTIONS,
} from "@/lib/constants";
import type {
  Blueprint,
  WorkoutType,
  BlueprintCategory,
  DifficultyLevel,
} from "@/lib/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TYPE_BADGE_COLORS: Record<WorkoutType, string> = {
  ignite: "bg-blue-100 text-blue-700",
  reset: "bg-green-100 text-green-700",
  unwind: "bg-purple-100 text-purple-700",
};

function formatCategory(category: BlueprintCategory): string {
  return category
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ---------------------------------------------------------------------------
// Coverage Mini-Bar
// ---------------------------------------------------------------------------
function CoverageMiniBar() {
  const { data: coverage, isLoading } = useBlueprintCoverage();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center gap-6 p-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-10" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const items = Array.isArray(coverage?.coverage) ? coverage.coverage : [];
  if (items.length === 0) return null;

  return (
    <Card>
      <CardContent className="flex flex-wrap items-center gap-6 p-4">
        {items.map((item) => (
          <div key={item.workoutType} className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className={TYPE_BADGE_COLORS[item.workoutType]}
            >
              {capitalize(item.workoutType)}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {item.active} active / {item.total} total
            </span>
          </div>
        ))}
        <div className="ml-auto text-sm text-muted-foreground">
          Total Active: <strong className="text-foreground">{coverage?.totalActive ?? 0}</strong>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Blueprints Page
// ---------------------------------------------------------------------------
export default function BlueprintsPage() {
  const router = useRouter();

  // State
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<Blueprint | null>(null);

  // Queries
  const { data, isLoading } = useBlueprints({
    search: search || undefined,
    page,
    pageSize,
    type: (typeFilter || undefined) as WorkoutType | undefined,
    category: (categoryFilter || undefined) as BlueprintCategory | undefined,
    difficulty: (difficultyFilter || undefined) as DifficultyLevel | undefined,
    isActive:
      statusFilter === "active"
        ? true
        : statusFilter === "inactive"
          ? false
          : undefined,
  });

  // Mutations
  const activateMutation = useActivateBlueprint();
  const deactivateMutation = useDeactivateBlueprint();
  const deleteMutation = useDeleteBlueprint();

  // Handlers
  const handleToggleStatus = (blueprint: Blueprint) => {
    const mutation = blueprint.isActive ? deactivateMutation : activateMutation;
    mutation.mutate(blueprint.id, {
      onSuccess: () => {
        toast.success(
          `Blueprint ${blueprint.isActive ? "deactivated" : "activated"} successfully`
        );
      },
      onError: () => {
        toast.error("Failed to update blueprint status");
      },
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success("Blueprint deleted successfully");
        setDeleteTarget(null);
      },
      onError: () => {
        toast.error("Failed to delete blueprint");
      },
    });
  };

  // Columns
  const columns: Column<Blueprint>[] = [
    {
      key: "name",
      header: "Name",
      cell: (row) => (
        <Link
          href={`/blueprints/${row.id}`}
          className="font-medium text-primary hover:underline"
        >
          {row.name}
        </Link>
      ),
    },
    {
      key: "type",
      header: "Type",
      cell: (row) => (
        <Badge variant="secondary" className={TYPE_BADGE_COLORS[row.type]}>
          {capitalize(row.type)}
        </Badge>
      ),
    },
    {
      key: "category",
      header: "Category",
      cell: (row) => formatCategory(row.category),
    },
    {
      key: "focus",
      header: "Focus",
      cell: (row) => capitalize(row.focus),
    },
    {
      key: "difficulty",
      header: "Difficulty",
      cell: (row) => (
        <Badge variant="outline">{capitalize(row.difficulty)}</Badge>
      ),
    },
    {
      key: "exercises",
      header: "Exercises",
      cell: (row) => row.exercises?.length ?? 0,
      className: "text-center",
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => (
        <Switch
          checked={row.isActive}
          onCheckedChange={() => handleToggleStatus(row)}
          disabled={
            activateMutation.isPending || deactivateMutation.isPending
          }
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
            <DropdownMenuItem onClick={() => router.push(`/blueprints/${row.id}`)}>
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
      <Select value={typeFilter} onValueChange={(val) => { setTypeFilter(val === "all" ? "" : val); setPage(1); }}>
        <SelectTrigger className="w-[130px]">
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          {WORKOUT_TYPE_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={categoryFilter} onValueChange={(val) => { setCategoryFilter(val === "all" ? "" : val); setPage(1); }}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          {BLUEPRINT_CATEGORY_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={difficultyFilter} onValueChange={(val) => { setDifficultyFilter(val === "all" ? "" : val); setPage(1); }}>
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Difficulty" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Difficulties</SelectItem>
          {DIFFICULTY_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val === "all" ? "" : val); setPage(1); }}>
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

  // Actions
  const actions = (
    <Button asChild>
      <Link href="/blueprints/new">
        <Plus className="mr-2 h-4 w-4" />
        New Blueprint
      </Link>
    </Button>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">Blueprints</h1>
        <p className="mt-1 text-muted-foreground">
          Manage workout blueprints for all workout types.
        </p>
      </div>

      <CoverageMiniBar />

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        total={data?.total ?? 0}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        isLoading={isLoading}
        searchValue={search}
        onSearchChange={(val) => { setSearch(val); setPage(1); }}
        searchPlaceholder="Search blueprints..."
        filters={filters}
        actions={actions}
        emptyMessage="No blueprints found."
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="Delete Blueprint"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        isLoading={deleteMutation.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
