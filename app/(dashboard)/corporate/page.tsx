"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { Plus, MoreHorizontal, Pencil, Eye, Power } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  useCorporateAccounts,
  useCreateCorporateAccount,
  useUpdateCorporateAccount,
  useActivateCorporateAccount,
  useDeactivateCorporateAccount,
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
// Corporate Account Dialog (Create / Edit)
// ---------------------------------------------------------------------------
function CorporateAccountDialog({
  open,
  onOpenChange,
  account,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account?: CorporateAccount | null;
}) {
  const isEdit = !!account;
  const createMutation = useCreateCorporateAccount();
  const updateMutation = useUpdateCorporateAccount(account?.id ?? "");

  const form = useForm<CorporateAccountFormValues>({
    resolver: zodResolver(corporateAccountSchema),
    defaultValues: {
      name: account?.name ?? "",
      contact_email: account?.contact_email ?? "",
      max_users: account?.max_users ?? 10,
    },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  const onSubmit = (values: CorporateAccountFormValues) => {
    if (isEdit && account) {
      updateMutation.mutate(values, {
        onSuccess: () => {
          toast.success("Account updated successfully");
          onOpenChange(false);
        },
        onError: () => {
          toast.error("Failed to update account");
        },
      });
    } else {
      createMutation.mutate(values, {
        onSuccess: () => {
          toast.success("Account created successfully");
          onOpenChange(false);
          form.reset();
        },
        onError: () => {
          toast.error("Failed to create account");
        },
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Corporate Account" : "New Corporate Account"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 py-2"
          >
            {/* Company Name */}
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

            {/* Contact Email */}
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

            {/* Max Users */}
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
// Corporate Accounts Page
// ---------------------------------------------------------------------------
export default function CorporateAccountsPage() {
  // State
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Dialogs
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<CorporateAccount | null>(null);
  const [deactivateTarget, setDeactivateTarget] =
    useState<CorporateAccount | null>(null);

  // Queries
  const { data: accounts, isLoading } = useCorporateAccounts();

  // Mutations
  const activateMutation = useActivateCorporateAccount();
  const deactivateMutation = useDeactivateCorporateAccount();

  // Client-side filtering
  const filteredData = useMemo(() => {
    if (!accounts) return [];
    if (!search) return accounts;

    const lower = search.toLowerCase();
    return accounts.filter(
      (a) =>
        a.name.toLowerCase().includes(lower) ||
        a.contact_email.toLowerCase().includes(lower)
    );
  }, [accounts, search]);

  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, page, pageSize]);

  // Handlers
  const handleOpenCreate = () => {
    setEditTarget(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (account: CorporateAccount) => {
    setEditTarget(account);
    setDialogOpen(true);
  };

  const handleCloseDialog = (open: boolean) => {
    if (!open) {
      setDialogOpen(false);
      setEditTarget(null);
    }
  };

  const handleActivate = useCallback(
    (account: CorporateAccount) => {
      activateMutation.mutate(account.id, {
        onSuccess: () => {
          toast.success(`${account.name} activated successfully`);
        },
        onError: () => {
          toast.error("Failed to activate account");
        },
      });
    },
    [activateMutation]
  );

  const handleDeactivate = () => {
    if (!deactivateTarget) return;
    deactivateMutation.mutate(deactivateTarget.id, {
      onSuccess: () => {
        toast.success(`${deactivateTarget.name} deactivated successfully`);
        setDeactivateTarget(null);
      },
      onError: () => {
        toast.error("Failed to deactivate account");
      },
    });
  };

  // Columns
  const columns: Column<CorporateAccount>[] = [
    {
      key: "name",
      header: "Company Name",
      cell: (row) => (
        <Link
          href={`/corporate/${row.id}`}
          className="font-medium text-navy hover:underline"
        >
          {row.name}
        </Link>
      ),
    },
    {
      key: "contact_email",
      header: "Contact Email",
      cell: (row) => (
        <span className="text-sm text-muted-foreground">
          {row.contact_email}
        </span>
      ),
    },
    {
      key: "users",
      header: "Users",
      cell: (row) => (
        <span className="text-sm">
          {row.users?.length ?? 0}/{row.max_users}
        </span>
      ),
      className: "text-center",
    },
    {
      key: "status",
      header: "Status",
      cell: (row) =>
        row.is_active ? (
          <Badge className="bg-green-100 text-green-700">Active</Badge>
        ) : (
          <Badge variant="secondary" className="bg-gray-100 text-gray-600">
            Inactive
          </Badge>
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
              <Link href={`/corporate/${row.id}`}>
                <Eye className="mr-2 h-4 w-4" />
                View
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleOpenEdit(row)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {row.is_active ? (
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => setDeactivateTarget(row)}
              >
                <Power className="mr-2 h-4 w-4" />
                Deactivate
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => handleActivate(row)}>
                <Power className="mr-2 h-4 w-4" />
                Activate
              </DropdownMenuItem>
            )}
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
      New Account
    </Button>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">Corporate Accounts</h1>
        <p className="mt-1 text-muted-foreground">
          Manage corporate accounts and their users.
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
        searchPlaceholder="Search accounts..."
        actions={actions}
        emptyMessage="No corporate accounts found."
      />

      {dialogOpen && (
        <CorporateAccountDialog
          open={dialogOpen}
          onOpenChange={handleCloseDialog}
          account={editTarget}
        />
      )}

      <ConfirmDialog
        open={!!deactivateTarget}
        onOpenChange={(open) => {
          if (!open) setDeactivateTarget(null);
        }}
        title="Deactivate Account"
        description={`Are you sure you want to deactivate "${deactivateTarget?.name}"? Users in this account will lose access.`}
        confirmLabel="Deactivate"
        variant="destructive"
        isLoading={deactivateMutation.isPending}
        onConfirm={handleDeactivate}
      />
    </div>
  );
}
