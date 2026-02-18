"use client";

import { useState } from "react";
import { Loader2, Zap, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ConfirmDialog } from "@/components/confirm-dialog";

import {
  useGenerateDaily,
  useGenerateImmediate,
  useRegenerateWorkout,
  useCleanupWorkouts,
} from "@/lib/hooks/use-workouts";

// ---------------------------------------------------------------------------
// Workouts Page
// ---------------------------------------------------------------------------
export default function WorkoutsPage() {
  // Generate section state
  const [generateDate, setGenerateDate] = useState("");

  // Regenerate section state
  const [regenerateDate, setRegenerateDate] = useState("");
  const [forceRegenerate, setForceRegenerate] = useState(false);

  // Cleanup confirm dialog
  const [cleanupOpen, setCleanupOpen] = useState(false);

  // Mutations
  const generateDaily = useGenerateDaily();
  const generateImmediate = useGenerateImmediate();
  const regenerateWorkout = useRegenerateWorkout();
  const cleanupWorkouts = useCleanupWorkouts();

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  const handleGenerateDaily = () => {
    generateDaily.mutate(undefined, {
      onSuccess: (data) => {
        toast.success(data?.message ?? "Daily workouts queued successfully");
      },
      onError: () => {
        toast.error("Failed to queue daily workout generation");
      },
    });
  };

  const handleGenerateImmediate = () => {
    generateImmediate.mutate(
      generateDate ? { type: generateDate } : {},
      {
        onSuccess: () => {
          toast.success("Workouts generated successfully");
        },
        onError: () => {
          toast.error("Failed to generate workouts");
        },
      }
    );
  };

  const handleRegenerate = () => {
    if (!regenerateDate) {
      toast.error("Please select a target date");
      return;
    }
    regenerateWorkout.mutate(regenerateDate, {
      onSuccess: () => {
        toast.success("Workout regenerated successfully");
        setRegenerateDate("");
        setForceRegenerate(false);
      },
      onError: () => {
        toast.error("Failed to regenerate workout");
      },
    });
  };

  const handleCleanup = () => {
    cleanupWorkouts.mutate(undefined, {
      onSuccess: (data) => {
        toast.success(data?.message ?? "Old workouts cleaned up successfully");
        setCleanupOpen(false);
      },
      onError: () => {
        toast.error("Failed to clean up workouts");
        setCleanupOpen(false);
      },
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">Workout Generation</h1>
        <p className="mt-1 text-muted-foreground">
          Generate, regenerate, and manage daily workouts for all users.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Card 1 – Generate Workouts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-orange" />
              Generate Workouts
            </CardTitle>
            <CardDescription>
              Queue asynchronous daily generation or generate workouts
              immediately.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="generate-date">Date (optional)</Label>
              <Input
                id="generate-date"
                type="date"
                value={generateDate}
                onChange={(e) => setGenerateDate(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Button
                onClick={handleGenerateDaily}
                disabled={generateDaily.isPending}
                variant="outline"
                className="w-full"
              >
                {generateDaily.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Queue Daily (Async)
              </Button>
              <Button
                onClick={handleGenerateImmediate}
                disabled={generateImmediate.isPending}
                className="w-full"
              >
                {generateImmediate.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Generate Now (Sync)
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Card 2 – Regenerate */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-navy" />
              Regenerate
            </CardTitle>
            <CardDescription>
              Regenerate workouts for a specific date. Optionally force
              overwrite existing workouts.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="regenerate-date">Target Date</Label>
              <Input
                id="regenerate-date"
                type="date"
                value={regenerateDate}
                onChange={(e) => setRegenerateDate(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="force-regenerate"
                checked={forceRegenerate}
                onCheckedChange={(checked) =>
                  setForceRegenerate(checked === true)
                }
              />
              <Label htmlFor="force-regenerate" className="cursor-pointer">
                Force (overwrite existing workouts)
              </Label>
            </div>

            <Button
              onClick={handleRegenerate}
              disabled={regenerateWorkout.isPending || !regenerateDate}
              className="w-full"
            >
              {regenerateWorkout.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Regenerate
            </Button>
          </CardContent>
        </Card>

        {/* Card 3 – Cleanup */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              Cleanup
            </CardTitle>
            <CardDescription>
              Remove old, expired, or unused workout data to keep the system
              running efficiently.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This action will permanently delete old workout records that are no
              longer needed. This helps reduce storage usage and improve query
              performance.
            </p>

            <Button
              variant="destructive"
              onClick={() => setCleanupOpen(true)}
              disabled={cleanupWorkouts.isPending}
              className="w-full"
            >
              {cleanupWorkouts.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Clean Up Old Workouts
            </Button>
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={cleanupOpen}
        onOpenChange={setCleanupOpen}
        title="Clean Up Old Workouts"
        description="Are you sure you want to clean up old workouts? This will permanently remove expired workout data and cannot be undone."
        confirmLabel="Clean Up"
        variant="destructive"
        isLoading={cleanupWorkouts.isPending}
        onConfirm={handleCleanup}
      />
    </div>
  );
}
