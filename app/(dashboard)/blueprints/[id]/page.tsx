"use client";

import { useParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { BlueprintForm } from "@/components/blueprints/blueprint-form";
import { useBlueprint } from "@/lib/hooks/use-blueprints";

export default function EditBlueprintPage() {
  const params = useParams();
  const id = params.id as string;
  const { data: blueprint, isLoading } = useBlueprint(id);

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="mt-2 h-4 w-72" />
        </div>

        {/* Card skeletons */}
        {Array.from({ length: 4 }).map((_, i) => (
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

  if (!blueprint) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-navy">
            Blueprint not found
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            The blueprint you are looking for does not exist or has been
            deleted.
          </p>
        </div>
      </div>
    );
  }

  return <BlueprintForm mode="edit" blueprint={blueprint} />;
}
