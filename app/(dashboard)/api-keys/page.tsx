"use client";

import { useState } from "react";
import { Plus, Copy, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
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
  useApiKeys,
  useCreateApiKey,
  useRevokeApiKey,
} from "@/lib/hooks/use-api-keys";
import { API_KEY_SCOPE_OPTIONS } from "@/lib/constants";
import type { ApiKey, ApiKeyCreateRequest } from "@/lib/types";

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------
const apiKeySchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  scopes: z.array(z.string()).min(1, "At least one scope is required"),
  expires_at: z.string().nullable().optional(),
});

type ApiKeyFormValues = z.infer<typeof apiKeySchema>;

// ---------------------------------------------------------------------------
// Create Key Dialog
// ---------------------------------------------------------------------------
function CreateKeyDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (key: ApiKey) => void;
}) {
  const createMutation = useCreateApiKey();

  const form = useForm<ApiKeyFormValues>({
    resolver: zodResolver(apiKeySchema),
    defaultValues: {
      name: "",
      scopes: [],
      expires_at: null,
    },
  });

  const onSubmit = (values: ApiKeyFormValues) => {
    const payload: ApiKeyCreateRequest = {
      name: values.name,
      scopes: values.scopes as ApiKeyCreateRequest["scopes"],
      expires_at: values.expires_at || null,
    };

    createMutation.mutate(payload, {
      onSuccess: (result) => {
        toast.success("API key created");
        onOpenChange(false);
        form.reset();
        onCreated(result as ApiKey);
      },
      onError: () => toast.error("Failed to create API key"),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create API Key</DialogTitle>
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
                    <Input placeholder="n8n automation" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="scopes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Scopes</FormLabel>
                  <div className="space-y-2">
                    {API_KEY_SCOPE_OPTIONS.map((scope) => (
                      <label
                        key={scope.value}
                        className="flex cursor-pointer items-center gap-2"
                      >
                        <Checkbox
                          checked={field.value.includes(scope.value)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              field.onChange([...field.value, scope.value]);
                            } else {
                              field.onChange(
                                field.value.filter(
                                  (v: string) => v !== scope.value
                                )
                              );
                            }
                          }}
                        />
                        <span className="text-sm">{scope.label}</span>
                      </label>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="expires_at"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expires At (optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(e.target.value || null)
                      }
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
                disabled={createMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Key"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Key Created Display Dialog
// ---------------------------------------------------------------------------
function KeyCreatedDialog({
  open,
  onOpenChange,
  apiKey,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  apiKey: ApiKey;
}) {
  const copyToClipboard = () => {
    if (apiKey.key) {
      navigator.clipboard.writeText(apiKey.key);
      toast.success("Copied to clipboard");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>API Key Created</DialogTitle>
          <DialogDescription>
            <span className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-4 w-4" />
              Copy this key now! It won&apos;t be shown again.
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex items-center gap-2 rounded-md border bg-muted/50 p-3">
            <code className="flex-1 break-all font-mono text-sm">
              {apiKey.key}
            </code>
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0"
              onClick={copyToClipboard}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-1 text-sm">
            <p>
              <span className="font-medium">Name:</span> {apiKey.name}
            </p>
            <p>
              <span className="font-medium">Scopes:</span>{" "}
              {apiKey.scopes.join(", ")}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------
function ApiKeysSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-10 w-full" />
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-14 w-full" />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function ApiKeysPage() {
  const { data: keys, isLoading } = useApiKeys();
  const revokeMutation = useRevokeApiKey();

  const [showCreate, setShowCreate] = useState(false);
  const [createdKey, setCreatedKey] = useState<ApiKey | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<ApiKey | null>(null);

  const handleCreated = (key: ApiKey) => {
    setCreatedKey(key);
  };

  const handleRevoke = () => {
    if (!revokeTarget) return;
    revokeMutation.mutate(revokeTarget.id, {
      onSuccess: () => {
        toast.success("API key revoked");
        setRevokeTarget(null);
      },
      onError: () => toast.error("Failed to revoke API key"),
    });
  };

  if (isLoading) return <ApiKeysSkeleton />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">API Keys</h1>
          <p className="mt-1 text-muted-foreground">
            API keys are used by external services (e.g., n8n automations) to
            access the Trucker&apos;s Routine API.
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Key
        </Button>
      </div>

      {/* Table */}
      {keys && keys.length > 0 ? (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Name</th>
                <th className="px-4 py-3 text-left font-medium">Key Prefix</th>
                <th className="px-4 py-3 text-left font-medium">Scopes</th>
                <th className="px-4 py-3 text-center font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Created</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {keys.map((key) => (
                <tr key={key.id} className="border-b last:border-0">
                  <td className="px-4 py-3 font-medium">{key.name}</td>
                  <td className="px-4 py-3">
                    <code className="font-mono text-xs">{key.key_prefix}</code>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {key.scopes.map((scope) => (
                        <Badge
                          key={scope}
                          variant="outline"
                          className="text-xs"
                        >
                          {scope === "*" ? "All Scopes" : scope}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge
                      variant="secondary"
                      className={
                        key.is_active
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }
                    >
                      {key.is_active ? "Active" : "Revoked"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(key.created_at)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {key.is_active && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setRevokeTarget(key)}
                      >
                        Revoke
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No API keys created yet.
          </CardContent>
        </Card>
      )}

      {/* Create Dialog */}
      {showCreate && (
        <CreateKeyDialog
          open={showCreate}
          onOpenChange={setShowCreate}
          onCreated={handleCreated}
        />
      )}

      {/* Key Created Display */}
      {createdKey && (
        <KeyCreatedDialog
          open={!!createdKey}
          onOpenChange={(open) => {
            if (!open) setCreatedKey(null);
          }}
          apiKey={createdKey}
        />
      )}

      {/* Revoke Confirm */}
      <ConfirmDialog
        open={!!revokeTarget}
        onOpenChange={(open) => {
          if (!open) setRevokeTarget(null);
        }}
        title="Revoke API Key"
        description={`Revoke API key "${revokeTarget?.name}"? Any services using this key will lose access immediately.`}
        confirmLabel="Revoke"
        variant="destructive"
        isLoading={revokeMutation.isPending}
        onConfirm={handleRevoke}
      />
    </div>
  );
}
