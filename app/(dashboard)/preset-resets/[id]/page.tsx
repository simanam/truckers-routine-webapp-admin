"use client";

import { useParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { ResetForm } from "@/components/preset-resets/reset-form";
import { useReset } from "@/lib/hooks/use-resets";

export default function EditPresetResetPage() {
  const params = useParams();
  const id = params.id as string;
  const { data: reset, isLoading } = useReset(id);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-32" />
          </div>
        </div>

        <Card>
          <CardContent className="space-y-4 p-6">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-20 w-full" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 p-6">
            <Skeleton className="h-5 w-24" />
            <div className="grid gap-4 sm:grid-cols-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!reset) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-navy">
            Preset Reset Not Found
          </h2>
          <p className="mt-2 text-muted-foreground">
            The preset reset you are looking for does not exist or has been
            deleted.
          </p>
        </div>
      </div>
    );
  }

  return <ResetForm mode="edit" reset={reset} />;
}
