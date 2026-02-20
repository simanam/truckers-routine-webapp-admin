"use client";

import { use, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Pencil,
  Power,
  Plus,
  Trash2,
  Users,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  useCorporateAccount,
  useCorporateAnalytics,
  useUpdateCorporateAccount,
  useActivateCorporateAccount,
  useDeactivateCorporateAccount,
  useAddCorporateUsers,
  useRemoveCorporateUser,
} from "@/lib/hooks/use-corporate";
import type { CorporateAccount } from "@/lib/types";

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------
const corporateAccountSchema = z.object({
  name: z.string().min(1, "Company name is required"),
  contact_email: z.string().email("Valid email is required"),
  max_users: z.number().min(1, "Must allow at least 1 user"),
});

type CorporateAccountFormValues = z.infer<typeof corporateAccountSchema>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatDate(dateStr?: string): string {
  if (!dateStr) return "-";
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

function formatMetricLabel(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ---------------------------------------------------------------------------
// Edit Account Dialog
// ---------------------------------------------------------------------------
function EditAccountDialog({
  open,
  onOpenChange,
  account,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: CorporateAccount;
}) {
  const updateMutation = useUpdateCorporateAccount(account.id);

  const form = useForm<CorporateAccountFormValues>({
    resolver: zodResolver(corporateAccountSchema),
    defaultValues: {
      name: account.name,
      contact_email: account.contact_email,
      max_users: account.max_users,
    },
  });

  const onSubmit = (values: CorporateAccountFormValues) => {
    updateMutation.mutate(values, {
      onSuccess: () => {
        toast.success("Account updated successfully");
        onOpenChange(false);
      },
      onError: () => {
        toast.error("Failed to update account");
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Corporate Account</DialogTitle>
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
                  <FormLabel>Company Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Acme Trucking Co." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contact_email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="admin@company.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="max_users"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Max Users</FormLabel>
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

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={updateMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Add Users Dialog
// ---------------------------------------------------------------------------
function AddUsersDialog({
  open,
  onOpenChange,
  accountId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountId: string;
}) {
  const [emailsText, setEmailsText] = useState("");
  const addUsersMutation = useAddCorporateUsers(accountId);

  const handleSubmit = () => {
    const emails = emailsText
      .split("\n")
      .map((e) => e.trim())
      .filter((e) => e.length > 0);

    if (emails.length === 0) {
      toast.error("Please enter at least one email address");
      return;
    }

    addUsersMutation.mutate(
      { emails },
      {
        onSuccess: () => {
          toast.success(`${emails.length} user(s) added successfully`);
          setEmailsText("");
          onOpenChange(false);
        },
        onError: () => {
          toast.error("Failed to add users");
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Users</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Email Addresses (one per line)
            </label>
            <Textarea
              placeholder={"user1@company.com\nuser2@company.com"}
              rows={6}
              value={emailsText}
              onChange={(e) => setEmailsText(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Enter one email address per line.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={addUsersMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={addUsersMutation.isPending}
          >
            {addUsersMutation.isPending ? "Adding..." : "Add Users"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Analytics Section
// ---------------------------------------------------------------------------
function AnalyticsSection({ accountId }: { accountId: string }) {
  const { data: analytics, isLoading } = useCorporateAnalytics(accountId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analytics || Object.keys(analytics).length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No analytics data available for this account.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Analytics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(analytics).map(([key, value]) => (
            <div
              key={key}
              className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm"
            >
              <p className="text-xs font-medium text-muted-foreground">
                {formatMetricLabel(key)}
              </p>
              <p className="mt-1 text-2xl font-bold text-navy">
                {typeof value === "number"
                  ? Number.isInteger(value)
                    ? value.toLocaleString()
                    : value.toFixed(1)
                  : String(value ?? "-")}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Corporate Account Detail Page
// ---------------------------------------------------------------------------
export default function CorporateAccountDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  // Queries
  const { data: account, isLoading } = useCorporateAccount(id);

  // Mutations
  const activateMutation = useActivateCorporateAccount();
  const deactivateMutation = useDeactivateCorporateAccount();
  const removeMutation = useRemoveCorporateUser(id);

  // Dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addUsersDialogOpen, setAddUsersDialogOpen] = useState(false);
  const [deactivateConfirmOpen, setDeactivateConfirmOpen] = useState(false);
  const [removeUserId, setRemoveUserId] = useState<string | null>(null);

  // Handlers
  const handleActivate = () => {
    activateMutation.mutate(id, {
      onSuccess: () => {
        toast.success("Account activated successfully");
      },
      onError: () => {
        toast.error("Failed to activate account");
      },
    });
  };

  const handleDeactivate = () => {
    deactivateMutation.mutate(id, {
      onSuccess: () => {
        toast.success("Account deactivated successfully");
        setDeactivateConfirmOpen(false);
      },
      onError: () => {
        toast.error("Failed to deactivate account");
      },
    });
  };

  const handleRemoveUser = () => {
    if (!removeUserId) return;
    removeMutation.mutate(removeUserId, {
      onSuccess: () => {
        toast.success("User removed successfully");
        setRemoveUserId(null);
      },
      onError: () => {
        toast.error("Failed to remove user");
      },
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-48" />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="space-y-4 p-6">
              <Skeleton className="h-5 w-32" />
              <div className="grid gap-4 sm:grid-cols-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Not found state
  if (!account) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-navy">
            Account not found
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            The corporate account you are looking for does not exist or has been
            removed.
          </p>
          <Button variant="outline" className="mt-4" asChild>
            <Link href="/corporate">Back to Accounts</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" asChild>
            <Link href="/corporate">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-navy">{account.name}</h1>
          </div>
        </div>
      </div>

      {/* Section 1 - Account Info */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Core details for this corporate account.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditDialogOpen(true)}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
            {account.is_active ? (
              <Button
                variant="outline"
                size="sm"
                className="text-destructive"
                onClick={() => setDeactivateConfirmOpen(true)}
              >
                <Power className="mr-2 h-4 w-4" />
                Deactivate
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={handleActivate}
                disabled={activateMutation.isPending}
              >
                <Power className="mr-2 h-4 w-4" />
                {activateMutation.isPending ? "Activating..." : "Activate"}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Company Name
              </p>
              <p className="mt-1 text-sm font-semibold">{account.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Contact Email
              </p>
              <p className="mt-1 text-sm">{account.contact_email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Max Users
              </p>
              <p className="mt-1 text-sm">{account.max_users}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Status
              </p>
              <div className="mt-1">
                {account.is_active ? (
                  <Badge className="bg-green-100 text-green-700">Active</Badge>
                ) : (
                  <Badge
                    variant="secondary"
                    className="bg-gray-100 text-gray-600"
                  >
                    Inactive
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 2 - Analytics */}
      <AnalyticsSection accountId={id} />

      {/* Section 3 - Users */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Users
            </CardTitle>
            <CardDescription>
              {account.users?.length ?? 0} of {account.max_users} users
            </CardDescription>
          </div>
          <Button size="sm" onClick={() => setAddUsersDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Users
          </Button>
        </CardHeader>
        <CardContent>
          {!account.users || account.users.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No users in this account yet.
            </p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {account.users.map((user) => (
                    <TableRow key={user.user_id}>
                      <TableCell className="text-sm">{user.email}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(user.joined_at)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setRemoveUserId(user.user_id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      {editDialogOpen && (
        <EditAccountDialog
          open={editDialogOpen}
          onOpenChange={(open) => {
            if (!open) setEditDialogOpen(false);
          }}
          account={account}
        />
      )}

      {/* Add Users Dialog */}
      {addUsersDialogOpen && (
        <AddUsersDialog
          open={addUsersDialogOpen}
          onOpenChange={(open) => {
            if (!open) setAddUsersDialogOpen(false);
          }}
          accountId={id}
        />
      )}

      {/* Deactivate Confirm */}
      <ConfirmDialog
        open={deactivateConfirmOpen}
        onOpenChange={setDeactivateConfirmOpen}
        title="Deactivate Account"
        description={`Are you sure you want to deactivate "${account.name}"? Users in this account will lose access.`}
        confirmLabel="Deactivate"
        variant="destructive"
        isLoading={deactivateMutation.isPending}
        onConfirm={handleDeactivate}
      />

      {/* Remove User Confirm */}
      <ConfirmDialog
        open={!!removeUserId}
        onOpenChange={(open) => {
          if (!open) setRemoveUserId(null);
        }}
        title="Remove User"
        description="Are you sure you want to remove this user from the corporate account? They will lose access to corporate features."
        confirmLabel="Remove"
        variant="destructive"
        isLoading={removeMutation.isPending}
        onConfirm={handleRemoveUser}
      />
    </div>
  );
}
