"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Plus,
  LayoutTemplate,
  MoreHorizontal,
  Pencil,
  Trash,
  Bot,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
import { DataTable, type Column } from "@/components/data-table";
import { ConfirmDialog } from "@/components/confirm-dialog";

import {
  useTips,
  useUpdateTip,
  useDeleteTip,
  useGenerateTips,
} from "@/lib/hooks/use-tips";
import { TIP_CATEGORY_OPTIONS } from "@/lib/constants";
import type { Tip, TipCategory } from "@/lib/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const CATEGORY_BADGE_COLORS: Record<TipCategory, string> = {
  nutrition: "bg-green-100 text-green-700",
  exercise: "bg-blue-100 text-blue-700",
  mental_health: "bg-purple-100 text-purple-700",
  sleep: "bg-indigo-100 text-indigo-700",
  driving_posture: "bg-orange-100 text-orange-700",
  hydration: "bg-cyan-100 text-cyan-700",
  stretching: "bg-yellow-100 text-yellow-700",
  general_wellness: "bg-pink-100 text-pink-700",
};

const TIER_BADGE_COLORS: Record<string, string> = {
  free: "bg-gray-100 text-gray-700",
  pro: "bg-amber-100 text-amber-700",
  enterprise: "bg-violet-100 text-violet-700",
};

function formatCategory(category: string): string {
  return category
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

// ---------------------------------------------------------------------------
// AI Generate Dialog
// ---------------------------------------------------------------------------
function AIGenerateDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<TipCategory[]>(
    []
  );

  const generateMutation = useGenerateTips();

  const handleToggleCategory = (category: TipCategory) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const handleGenerate = () => {
    if (!startDate || !endDate) {
      toast.error("Please select both start and end dates");
      return;
    }
    if (selectedCategories.length === 0) {
      toast.error("Please select at least one category");
      return;
    }

    // Build date array from start to end
    const dates: string[] = [];
    const current = new Date(startDate);
    const end = new Date(endDate);
    while (current <= end) {
      dates.push(current.toISOString().split("T")[0]);
      current.setDate(current.getDate() + 1);
    }

    generateMutation.mutate(
      { dates, categories: selectedCategories },
      {
        onSuccess: () => {
          toast.success("Tips generated successfully");
          onOpenChange(false);
          setStartDate("");
          setEndDate("");
          setSelectedCategories([]);
        },
        onError: () => {
          toast.error("Failed to generate tips");
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>AI Generate Tips</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Categories</Label>
            <div className="grid grid-cols-2 gap-2">
              {TIP_CATEGORY_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className="flex items-center gap-2 text-sm"
                >
                  <Checkbox
                    checked={selectedCategories.includes(
                      opt.value as TipCategory
                    )}
                    onCheckedChange={() =>
                      handleToggleCategory(opt.value as TipCategory)
                    }
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={generateMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={generateMutation.isPending}
          >
            {generateMutation.isPending ? "Generating..." : "Generate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Status Toggle (separate component so useUpdateTip hook is valid)
// ---------------------------------------------------------------------------
function TipStatusToggle({ tip }: { tip: Tip }) {
  const updateMutation = useUpdateTip(tip.id);

  return (
    <Switch
      checked={tip.is_active}
      onCheckedChange={(checked) => {
        updateMutation.mutate(
          { is_active: checked },
          {
            onSuccess: () => {
              toast.success(
                `Tip ${checked ? "activated" : "deactivated"} successfully`
              );
            },
            onError: () => {
              toast.error("Failed to update tip status");
            },
          }
        );
      }}
      disabled={updateMutation.isPending}
    />
  );
}

// ---------------------------------------------------------------------------
// Tips Page
// ---------------------------------------------------------------------------
export default function TipsPage() {
  const router = useRouter();

  // State
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [aiFilter, setAiFilter] = useState<string>("");

  // Dialogs
  const [generateOpen, setGenerateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Tip | null>(null);

  // Queries
  const { data: tips, isLoading } = useTips({
    category: (categoryFilter || undefined) as TipCategory | undefined,
    is_active:
      statusFilter === "active"
        ? true
        : statusFilter === "inactive"
          ? false
          : undefined,
    is_ai_generated:
      aiFilter === "yes" ? true : aiFilter === "no" ? false : undefined,
  });

  // Mutations
  const deleteMutation = useDeleteTip();

  // Client-side search + pagination
  const filteredData = useMemo(() => {
    if (!tips) return [];
    if (!search) return tips;
    const lower = search.toLowerCase();
    return tips.filter(
      (tip) =>
        tip.title.toLowerCase().includes(lower) ||
        tip.content.toLowerCase().includes(lower) ||
        tip.category.toLowerCase().includes(lower)
    );
  }, [tips, search]);

  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, page, pageSize]);

  // Handlers
  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success("Tip deleted successfully");
        setDeleteTarget(null);
      },
      onError: () => {
        toast.error("Failed to delete tip");
      },
    });
  };

  // Columns
  const columns: Column<Tip>[] = [
    {
      key: "title",
      header: "Title",
      cell: (row) => (
        <Link
          href={`/tips/${row.id}`}
          className="font-medium text-primary hover:underline"
        >
          {row.title}
        </Link>
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
          {formatCategory(row.category)}
        </Badge>
      ),
    },
    {
      key: "date",
      header: "Date",
      cell: (row) => formatDate(row.date),
    },
    {
      key: "tier",
      header: "Tier",
      cell: (row) =>
        row.min_tier ? (
          <Badge
            variant="secondary"
            className={TIER_BADGE_COLORS[row.min_tier]}
          >
            {row.min_tier.charAt(0).toUpperCase() + row.min_tier.slice(1)}
          </Badge>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: "ai_generated",
      header: "AI",
      cell: (row) =>
        row.is_ai_generated ? (
          <Bot className="h-4 w-4 text-muted-foreground" />
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
      className: "text-center w-12",
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => <TipStatusToggle tip={row} />,
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
            <DropdownMenuItem
              onClick={() => router.push(`/tips/${row.id}`)}
            >
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
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          {TIP_CATEGORY_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={statusFilter}
        onValueChange={(val) => {
          setStatusFilter(val === "all" ? "" : val);
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

      <Select
        value={aiFilter}
        onValueChange={(val) => {
          setAiFilter(val === "all" ? "" : val);
          setPage(1);
        }}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="AI Generated" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          <SelectItem value="yes">AI Generated</SelectItem>
          <SelectItem value="no">Manual</SelectItem>
        </SelectContent>
      </Select>
    </>
  );

  // Actions
  const actions = (
    <>
      <Button variant="outline" onClick={() => setGenerateOpen(true)}>
        <Sparkles className="mr-2 h-4 w-4" />
        AI Generate
      </Button>
      <Button variant="outline" asChild>
        <Link href="/tips/templates">
          <LayoutTemplate className="mr-2 h-4 w-4" />
          Templates
        </Link>
      </Button>
      <Button asChild>
        <Link href="/tips/new">
          <Plus className="mr-2 h-4 w-4" />
          New Tip
        </Link>
      </Button>
    </>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">Tips</h1>
        <p className="mt-1 text-muted-foreground">
          Manage daily health and wellness tips for truckers.
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
        searchPlaceholder="Search tips..."
        filters={filters}
        actions={actions}
        emptyMessage="No tips found."
      />

      <AIGenerateDialog open={generateOpen} onOpenChange={setGenerateOpen} />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Delete Tip"
        description={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        isLoading={deleteMutation.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
