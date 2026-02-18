"use client";

import { useState } from "react";
import { Crown, Shield, UserMinus, ArrowRightLeft } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/confirm-dialog";

import {
  useAdmins,
  usePromoteUser,
  useDemoteUser,
  useTransferSuperAdmin,
} from "@/lib/hooks/use-users";
import { useAuthStore } from "@/lib/auth-store";
import type { AdminUser } from "@/lib/types";

// ---------------------------------------------------------------------------
// Admin Roles Page
// ---------------------------------------------------------------------------
export default function AdminRolesPage() {
  // Auth
  const user = useAuthStore((s) => s.user);
  const isSuperAdmin = user?.role === "super_admin";

  // Queries
  const { data: admins, isLoading } = useAdmins();

  // Mutations
  const promoteMutation = usePromoteUser();
  const demoteMutation = useDemoteUser();
  const transferMutation = useTransferSuperAdmin();

  // State
  const [promoteEmail, setPromoteEmail] = useState("");
  const [demoteTarget, setDemoteTarget] = useState<AdminUser | null>(null);
  const [transferTarget, setTransferTarget] = useState<AdminUser | null>(null);

  // Handlers
  const handlePromote = () => {
    if (!promoteEmail.trim()) return;
    promoteMutation.mutate(
      { email: promoteEmail.trim() },
      {
        onSuccess: () => {
          toast.success(`${promoteEmail.trim()} promoted to admin`);
          setPromoteEmail("");
        },
        onError: () => {
          toast.error("Failed to promote user");
        },
      }
    );
  };

  const handleDemote = () => {
    if (!demoteTarget) return;
    demoteMutation.mutate(
      { email: demoteTarget.email },
      {
        onSuccess: () => {
          toast.success(`${demoteTarget.email} demoted successfully`);
          setDemoteTarget(null);
        },
        onError: () => {
          toast.error("Failed to demote user");
        },
      }
    );
  };

  const handleTransfer = () => {
    if (!transferTarget) return;
    transferMutation.mutate(
      { new_super_admin_email: transferTarget.email },
      {
        onSuccess: () => {
          toast.success(
            `Super admin role transferred to ${transferTarget.email}`
          );
          setTransferTarget(null);
          // Force re-initialization to refresh current user state
          useAuthStore.setState({ isInitialized: false });
          useAuthStore.getState().initialize();
        },
        onError: () => {
          toast.error("Failed to transfer super admin role");
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">Admin Roles</h1>
        <p className="mt-1 text-muted-foreground">
          View and manage administrator roles and permissions.
        </p>
      </div>

      {/* Section 1: Current Admins */}
      <Card>
        <CardHeader>
          <CardTitle>Current Admins</CardTitle>
          <CardDescription>
            All users with administrative privileges.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  {isSuperAdmin && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={`skeleton-${i}`}>
                      <TableCell>
                        <Skeleton className="h-5 w-full" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-20" />
                      </TableCell>
                      {isSuperAdmin && (
                        <TableCell>
                          <Skeleton className="h-5 w-32" />
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                ) : !admins || admins.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={isSuperAdmin ? 3 : 2}
                      className="h-24 text-center text-muted-foreground"
                    >
                      No admins found.
                    </TableCell>
                  </TableRow>
                ) : (
                  admins.map((admin) => {
                    const isCurrentUser = admin.user_id === user?.id;
                    const isAdminSuperAdmin = admin.role === "super_admin";

                    return (
                      <TableRow key={admin.user_id}>
                        <TableCell className="font-medium">
                          {admin.email}
                        </TableCell>
                        <TableCell>
                          {isAdminSuperAdmin ? (
                            <Badge
                              variant="secondary"
                              className="bg-amber-100 text-amber-700"
                            >
                              <Crown className="mr-1 h-3 w-3" />
                              Super Admin
                            </Badge>
                          ) : (
                            <Badge
                              variant="secondary"
                              className="bg-blue-100 text-blue-700"
                            >
                              <Shield className="mr-1 h-3 w-3" />
                              Admin
                            </Badge>
                          )}
                        </TableCell>
                        {isSuperAdmin && (
                          <TableCell>
                            {isCurrentUser ? null : (
                              <div className="flex items-center gap-2">
                                {!isAdminSuperAdmin && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setDemoteTarget(admin)}
                                  >
                                    <UserMinus className="mr-2 h-4 w-4" />
                                    Demote
                                  </Button>
                                )}
                                {!isAdminSuperAdmin && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setTransferTarget(admin)}
                                  >
                                    <Crown className="mr-2 h-4 w-4" />
                                    Transfer
                                  </Button>
                                )}
                              </div>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Promote New Admin */}
      {isSuperAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Promote New Admin</CardTitle>
            <CardDescription>
              Grant admin privileges to an existing user by email.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Input
                type="email"
                placeholder="user@example.com"
                value={promoteEmail}
                onChange={(e) => setPromoteEmail(e.target.value)}
                className="max-w-sm"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handlePromote();
                  }
                }}
              />
              <Button
                onClick={handlePromote}
                disabled={!promoteEmail.trim() || promoteMutation.isPending}
              >
                {promoteMutation.isPending
                  ? "Promoting..."
                  : "Promote to Admin"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

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

      {/* Transfer Super Admin Confirm Dialog */}
      <ConfirmDialog
        open={!!transferTarget}
        onOpenChange={(open) => {
          if (!open) setTransferTarget(null);
        }}
        title="Transfer Super Admin"
        description={`WARNING: Transfer super admin role to ${transferTarget?.email ?? "this user"}? You will be demoted to regular admin. This action is irreversible.`}
        confirmLabel="Transfer"
        variant="destructive"
        isLoading={transferMutation.isPending}
        onConfirm={handleTransfer}
      />
    </div>
  );
}
