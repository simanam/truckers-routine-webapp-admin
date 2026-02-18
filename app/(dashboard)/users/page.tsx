"use client";

import { useState, useMemo, useCallback } from "react";
import { RotateCcw, Trash, CheckCircle, ShieldPlus, ShieldMinus } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable, type Column } from "@/components/data-table";
import { ConfirmDialog } from "@/components/confirm-dialog";

import {
  useSearchUsers,
  useSoftDeletedUsers,
  usePromoteUser,
  useDemoteUser,
  useRestoreUser,
  useHardDeleteUser,
} from "@/lib/hooks/use-users";
import { useAuthStore } from "@/lib/auth-store";
import type { SearchUser, SoftDeletedUser } from "@/lib/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatDate(dateString?: string): string {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const ROLE_BADGE: Record<string, { label: string; className: string }> = {
  super_admin: { label: "Super Admin", className: "bg-amber-100 text-amber-700" },
  admin: { label: "Admin", className: "bg-blue-100 text-blue-700" },
  user: { label: "User", className: "bg-gray-100 text-gray-700" },
};

const TIER_BADGE: Record<string, { label: string; className: string }> = {
  free: { label: "Free", className: "bg-gray-100 text-gray-700" },
  pro: { label: "Pro", className: "bg-green-100 text-green-700" },
  enterprise: { label: "Enterprise", className: "bg-purple-100 text-purple-700" },
};

// ---------------------------------------------------------------------------
// Users Page
// ---------------------------------------------------------------------------
export default function UsersPage() {
  const currentUser = useAuthStore((s) => s.user);
  const isSuperAdmin = currentUser?.role === "super_admin";

  // ---------- All Users tab state ----------
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Build query params
  const searchParams = useMemo(
    () => ({
      email: search || undefined,
      role: roleFilter || undefined,
      limit: pageSize,
      offset: (page - 1) * pageSize,
    }),
    [search, roleFilter, page, pageSize]
  );

  const { data: users, isLoading: usersLoading } = useSearchUsers(searchParams);

  // ---------- Deleted Users tab state ----------
  const [deletedSearch, setDeletedSearch] = useState("");
  const [deletedPage, setDeletedPage] = useState(1);
  const [deletedPageSize, setDeletedPageSize] = useState(20);
  const { data: deletedUsers, isLoading: deletedLoading } = useSoftDeletedUsers();

  const filteredDeleted = useMemo(() => {
    if (!deletedUsers) return [];
    if (!deletedSearch) return deletedUsers;
    const lower = deletedSearch.toLowerCase();
    return deletedUsers.filter((u) => u.email.toLowerCase().includes(lower));
  }, [deletedUsers, deletedSearch]);

  const paginatedDeleted = useMemo(() => {
    const start = (deletedPage - 1) * deletedPageSize;
    return filteredDeleted.slice(start, start + deletedPageSize);
  }, [filteredDeleted, deletedPage, deletedPageSize]);

  // ---------- Mutations ----------
  const promoteMutation = usePromoteUser();
  const demoteMutation = useDemoteUser();
  const restoreMutation = useRestoreUser();
  const hardDeleteMutation = useHardDeleteUser();

  // ---------- Confirm dialog state ----------
  const [promoteTarget, setPromoteTarget] = useState<SearchUser | null>(null);
  const [demoteTarget, setDemoteTarget] = useState<SearchUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SoftDeletedUser | null>(null);

  // ---------- Handlers ----------
  const handlePromote = useCallback(() => {
    if (!promoteTarget) return;
    promoteMutation.mutate(promoteTarget.id, {
      onSuccess: () => {
        toast.success(`${promoteTarget.email} promoted to admin`);
        setPromoteTarget(null);
      },
      onError: () => toast.error("Failed to promote user"),
    });
  }, [promoteTarget, promoteMutation]);

  const handleDemote = useCallback(() => {
    if (!demoteTarget) return;
    demoteMutation.mutate(demoteTarget.id, {
      onSuccess: () => {
        toast.success(`${demoteTarget.email} demoted to user`);
        setDemoteTarget(null);
      },
      onError: () => toast.error("Failed to demote user"),
    });
  }, [demoteTarget, demoteMutation]);

  const handleRestore = useCallback(
    (user: SoftDeletedUser) => {
      restoreMutation.mutate(user.id, {
        onSuccess: () => toast.success(`${user.email} restored`),
        onError: () => toast.error("Failed to restore user"),
      });
    },
    [restoreMutation]
  );

  const handleHardDelete = useCallback(() => {
    if (!deleteTarget) return;
    hardDeleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success("User permanently deleted");
        setDeleteTarget(null);
      },
      onError: () => toast.error("Failed to delete user"),
    });
  }, [deleteTarget, hardDeleteMutation]);

  // ---------- All Users columns ----------
  const userColumns: Column<SearchUser>[] = [
    {
      key: "email",
      header: "Email",
      cell: (row) => <span className="font-medium">{row.email}</span>,
    },
    {
      key: "role",
      header: "Role",
      cell: (row) => {
        const badge = ROLE_BADGE[row.role] || ROLE_BADGE.user;
        return (
          <Badge variant="secondary" className={badge.className}>
            {badge.label}
          </Badge>
        );
      },
    },
    {
      key: "tier",
      header: "Tier",
      cell: (row) => {
        const badge = TIER_BADGE[row.tier] || TIER_BADGE.free;
        return (
          <Badge variant="outline" className={badge.className}>
            {badge.label}
          </Badge>
        );
      },
    },
    {
      key: "created_at",
      header: "Joined",
      cell: (row) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(row.created_at)}
        </span>
      ),
    },
    ...(isSuperAdmin
      ? [
          {
            key: "actions",
            header: "Actions",
            cell: (row: SearchUser) => {
              const isCurrentUser = row.id === currentUser?.id;
              const isSA = row.role === "super_admin";
              if (isCurrentUser || isSA) return null;

              return row.role === "user" ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPromoteTarget(row)}
                >
                  <ShieldPlus className="mr-2 h-4 w-4" />
                  Promote
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDemoteTarget(row)}
                >
                  <ShieldMinus className="mr-2 h-4 w-4" />
                  Demote
                </Button>
              );
            },
            className: "w-[140px]",
          } as Column<SearchUser>,
        ]
      : []),
  ];

  // ---------- Deleted Users columns ----------
  const deletedColumns: Column<SoftDeletedUser>[] = [
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

  // ---------- Filters for All Users ----------
  const userFilters = (
    <Select
      value={roleFilter}
      onValueChange={(v) => {
        setRoleFilter(v === "all" ? "" : v);
        setPage(1);
      }}
    >
      <SelectTrigger className="w-[140px]">
        <SelectValue placeholder="Role" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Roles</SelectItem>
        <SelectItem value="user">User</SelectItem>
        <SelectItem value="admin">Admin</SelectItem>
        <SelectItem value="super_admin">Super Admin</SelectItem>
      </SelectContent>
    </Select>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">User Management</h1>
        <p className="mt-1 text-muted-foreground">
          View all users, manage roles, and handle deleted accounts.
        </p>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Users</TabsTrigger>
          <TabsTrigger value="deleted">
            Deleted Users
            {deletedUsers && deletedUsers.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {deletedUsers.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* All Users Tab */}
        <TabsContent value="all" className="mt-4">
          <DataTable
            columns={userColumns}
            data={users || []}
            total={users?.length || 0}
            page={page}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
            isLoading={usersLoading}
            searchValue={search}
            onSearchChange={(val) => {
              setSearch(val);
              setPage(1);
            }}
            searchPlaceholder="Search by email..."
            filters={userFilters}
            emptyMessage="No users found."
          />
        </TabsContent>

        {/* Deleted Users Tab */}
        <TabsContent value="deleted" className="mt-4">
          {!deletedLoading && filteredDeleted.length === 0 && !deletedSearch ? (
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
              columns={deletedColumns}
              data={paginatedDeleted}
              total={filteredDeleted.length}
              page={deletedPage}
              pageSize={deletedPageSize}
              onPageChange={setDeletedPage}
              onPageSizeChange={(size) => {
                setDeletedPageSize(size);
                setDeletedPage(1);
              }}
              isLoading={deletedLoading}
              searchValue={deletedSearch}
              onSearchChange={(val) => {
                setDeletedSearch(val);
                setDeletedPage(1);
              }}
              searchPlaceholder="Search by email..."
              emptyMessage="No deleted users found."
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Promote Confirm Dialog */}
      <ConfirmDialog
        open={!!promoteTarget}
        onOpenChange={(open) => {
          if (!open) setPromoteTarget(null);
        }}
        title="Promote to Admin"
        description={`Promote ${promoteTarget?.email ?? "this user"} to admin? They will gain access to all admin endpoints.`}
        confirmLabel="Promote"
        isLoading={promoteMutation.isPending}
        onConfirm={handlePromote}
      />

      {/* Demote Confirm Dialog */}
      <ConfirmDialog
        open={!!demoteTarget}
        onOpenChange={(open) => {
          if (!open) setDemoteTarget(null);
        }}
        title="Demote Admin"
        description={`Remove admin privileges from ${demoteTarget?.email ?? "this user"}? They will become a regular user.`}
        confirmLabel="Demote"
        variant="destructive"
        isLoading={demoteMutation.isPending}
        onConfirm={handleDemote}
      />

      {/* Hard Delete Confirm Dialog */}
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
