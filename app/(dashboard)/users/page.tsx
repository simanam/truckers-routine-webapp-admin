"use client";

import { useState, useMemo } from "react";
import { RotateCcw, Trash, CheckCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/data-table";
import { ConfirmDialog } from "@/components/confirm-dialog";

import {
  useSoftDeletedUsers,
  useRestoreUser,
  useHardDeleteUser,
} from "@/lib/hooks/use-users";
import type { SoftDeletedUser } from "@/lib/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ---------------------------------------------------------------------------
// Users Page
// ---------------------------------------------------------------------------
export default function UsersPage() {
  // State
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [deleteTarget, setDeleteTarget] = useState<SoftDeletedUser | null>(
    null
  );

  // Queries
  const { data: users, isLoading } = useSoftDeletedUsers();

  // Mutations
  const restoreMutation = useRestoreUser();
  const hardDeleteMutation = useHardDeleteUser();

  // Client-side filtering
  const filteredData = useMemo(() => {
    if (!users) return [];
    if (!search) return users;

    const lower = search.toLowerCase();
    return users.filter((u) => u.email.toLowerCase().includes(lower));
  }, [users, search]);

  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, page, pageSize]);

  // Handlers
  const handleRestore = (user: SoftDeletedUser) => {
    restoreMutation.mutate(user.id, {
      onSuccess: () => {
        toast.success(`User ${user.email} restored successfully`);
      },
      onError: () => {
        toast.error("Failed to restore user");
      },
    });
  };

  const handleHardDelete = () => {
    if (!deleteTarget) return;
    hardDeleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success("User permanently deleted");
        setDeleteTarget(null);
      },
      onError: () => {
        toast.error("Failed to delete user");
      },
    });
  };

  // Columns
  const columns: Column<SoftDeletedUser>[] = [
    {
      key: "email",
      header: "Email",
      cell: (row) => <span className="font-medium">{row.email}</span>,
    },
    {
      key: "deleted_at",
      header: "Deleted At",
      cell: (row) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(row.deleted_at)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleRestore(row)}
            disabled={restoreMutation.isPending}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Restore
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => setDeleteTarget(row)}
          >
            <Trash className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      ),
      className: "w-[220px]",
    },
  ];

  // Empty state
  const isEmpty = !isLoading && filteredData.length === 0 && !search;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">User Management</h1>
        <p className="mt-1 text-muted-foreground">
          Manage soft-deleted users. Restore accounts or permanently remove
          them.
        </p>
      </div>

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
          <CheckCircle className="h-12 w-12 text-green-500" />
          <p className="mt-4 text-lg font-medium text-foreground">
            No deleted users
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            All users are active and healthy.
          </p>
        </div>
      ) : (
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
          searchPlaceholder="Search by email..."
          emptyMessage="No deleted users found."
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Permanently Delete User"
        description="Permanently delete this user? This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        isLoading={hardDeleteMutation.isPending}
        onConfirm={handleHardDelete}
      />
    </div>
  );
}
