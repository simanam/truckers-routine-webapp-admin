"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TagInput } from "@/components/tag-input";
import {
  ExercisePicker,
  type SelectedExercise,
} from "@/components/exercise-picker";

import { useCreateReset, useUpdateReset } from "@/lib/hooks/use-resets";
import {
  RESET_CATEGORY_OPTIONS,
  RESET_DIFFICULTY_OPTIONS,
  USER_TIER_OPTIONS,
  LOCATION_TAG_OPTIONS,
  TIMING_TAG_OPTIONS,
  PAIN_AREA_TAG_OPTIONS,
} from "@/lib/constants";
import type { PresetReset, PresetResetCreateRequest, ResetExercise } from "@/lib/types";

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------
const resetSchema = z.object({
  name: z.string().min(1, "Name is required"),
  durationSeconds: z.number().min(30, "Min 30 seconds"),
  category: z.enum([
    "neck_shoulders",
    "lower_back",
    "full_body",
    "legs",
    "arms",
    "core",
    "breathing",
    "quick_stretch",
  ]),
  difficulty: z.enum(["easy", "medium", "hard"]),
  description: z.string().min(1, "Description is required"),
  targetAreas: z.array(z.string()).min(1, "At least one target area"),
  locationTags: z.array(z.string()).min(1, "At least one location tag"),
  timingTags: z.array(z.string()).min(1, "At least one timing tag"),
  userTier: z.enum(["FREE", "PRO", "ENTERPRISE"]),
  isActive: z.boolean(),
});

type ResetFormValues = z.infer<typeof resetSchema>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatDuration(seconds: number): string {
  return (
    Math.floor(seconds / 60) +
    ":" +
    (seconds % 60).toString().padStart(2, "0")
  );
}

function mapResetExercisesToSelected(
  exercises: ResetExercise[]
): SelectedExercise[] {
  return exercises.map((ex) => ({
    exerciseId: ex.exerciseId,
    exercise: { id: ex.exerciseId, name: ex.exerciseId } as never,
    order: ex.order,
    type: "timer" as const,
    durationSeconds: ex.durationSeconds,
    restAfterSeconds: ex.restAfterSeconds,
  }));
}

function mapSelectedToResetExercises(
  exercises: SelectedExercise[]
): ResetExercise[] {
  return exercises.map((ex) => ({
    exerciseId: ex.exerciseId,
    order: ex.order,
    durationSeconds: ex.durationSeconds ?? 30,
    restAfterSeconds: ex.restAfterSeconds,
  }));
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export interface ResetFormProps {
  mode: "create" | "edit";
  reset?: PresetReset;
}

export function ResetForm({ mode, reset }: ResetFormProps) {
  const router = useRouter();
  const createMutation = useCreateReset();
  const updateMutation = useUpdateReset(reset?.id ?? "");

  const [exercises, setExercises] = useState<SelectedExercise[]>(
    reset?.exercises ? mapResetExercisesToSelected(reset.exercises) : []
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      name: reset?.name ?? "",
      durationSeconds: reset?.durationSeconds ?? 60,
      category: reset?.category ?? "neck_shoulders",
      difficulty: reset?.difficulty ?? "easy",
      description: reset?.description ?? "",
      targetAreas: reset?.targetAreas ?? [],
      locationTags: reset?.locationTags ?? [],
      timingTags: reset?.timingTags ?? [],
      userTier: reset?.userTier ?? "FREE",
      isActive: reset?.isActive ?? false,
    },
  });

  const durationSeconds = watch("durationSeconds");
  const category = watch("category");
  const difficulty = watch("difficulty");
  const userTier = watch("userTier");
  const targetAreas = watch("targetAreas");
  const locationTags = watch("locationTags");
  const timingTags = watch("timingTags");
  const isActive = watch("isActive");

  const isPending = createMutation.isPending || updateMutation.isPending;

  const onSubmit = (values: ResetFormValues) => {
    const payload = {
      ...values,
      exercises: mapSelectedToResetExercises(exercises),
    } as PresetResetCreateRequest;

    const mutation = mode === "create" ? createMutation : updateMutation;

    mutation.mutate(payload, {
      onSuccess: () => {
        toast.success(
          mode === "create"
            ? "Preset reset created successfully"
            : "Preset reset updated successfully"
        );
        router.push("/preset-resets");
      },
      onError: () => {
        toast.error(
          mode === "create"
            ? "Failed to create preset reset"
            : "Failed to update preset reset"
        );
      },
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">
            {mode === "create" ? "Create Preset Reset" : "Edit Preset Reset"}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {mode === "create"
              ? "Add a new preset reset routine."
              : "Update the preset reset details."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/preset-resets")}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === "create" ? "Create" : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="e.g. Quick Neck Relief"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe this reset routine..."
              rows={3}
              {...register("description")}
            />
            {errors.description && (
              <p className="text-sm text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Category */}
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={category}
                onValueChange={(val) =>
                  setValue("category", val as ResetFormValues["category"])
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {RESET_CATEGORY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && (
                <p className="text-sm text-destructive">
                  {errors.category.message}
                </p>
              )}
            </div>

            {/* Difficulty */}
            <div className="space-y-2">
              <Label>Difficulty</Label>
              <Select
                value={difficulty}
                onValueChange={(val) =>
                  setValue("difficulty", val as ResetFormValues["difficulty"])
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  {RESET_DIFFICULTY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.difficulty && (
                <p className="text-sm text-destructive">
                  {errors.difficulty.message}
                </p>
              )}
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <Label htmlFor="durationSeconds">
                Duration{" "}
                <span className="text-muted-foreground">
                  ({formatDuration(durationSeconds)})
                </span>
              </Label>
              <Input
                id="durationSeconds"
                type="number"
                min={30}
                {...register("durationSeconds", { valueAsNumber: true })}
              />
              {errors.durationSeconds && (
                <p className="text-sm text-destructive">
                  {errors.durationSeconds.message}
                </p>
              )}
            </div>

            {/* User Tier */}
            <div className="space-y-2">
              <Label>User Tier</Label>
              <Select
                value={userTier}
                onValueChange={(val) =>
                  setValue("userTier", val as ResetFormValues["userTier"])
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select tier" />
                </SelectTrigger>
                <SelectContent>
                  {USER_TIER_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.userTier && (
                <p className="text-sm text-destructive">
                  {errors.userTier.message}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tags */}
      <Card>
        <CardHeader>
          <CardTitle>Tags</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <TagInput
                label="Target Areas"
                value={targetAreas}
                onChange={(val) => setValue("targetAreas", val)}
                options={PAIN_AREA_TAG_OPTIONS}
                placeholder="Select target areas..."
              />
              {errors.targetAreas && (
                <p className="mt-1 text-sm text-destructive">
                  {errors.targetAreas.message}
                </p>
              )}
            </div>

            <div>
              <TagInput
                label="Location Tags"
                value={locationTags}
                onChange={(val) => setValue("locationTags", val)}
                options={LOCATION_TAG_OPTIONS}
                placeholder="Select locations..."
              />
              {errors.locationTags && (
                <p className="mt-1 text-sm text-destructive">
                  {errors.locationTags.message}
                </p>
              )}
            </div>

            <div>
              <TagInput
                label="Timing Tags"
                value={timingTags}
                onChange={(val) => setValue("timingTags", val)}
                options={TIMING_TAG_OPTIONS}
                placeholder="Select timings..."
              />
              {errors.timingTags && (
                <p className="mt-1 text-sm text-destructive">
                  {errors.timingTags.message}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Exercises */}
      <Card>
        <CardHeader>
          <CardTitle>Exercises</CardTitle>
        </CardHeader>
        <CardContent>
          <ExercisePicker
            selected={exercises}
            onChange={setExercises}
            mode="reset"
          />
        </CardContent>
      </Card>

      {/* Status */}
      <Card>
        <CardHeader>
          <CardTitle>Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Switch
              checked={isActive}
              onCheckedChange={(checked) => setValue("isActive", checked)}
            />
            <Label>
              {isActive ? "Active" : "Inactive"} &mdash; This reset is{" "}
              {isActive
                ? "visible to users"
                : "hidden from users"}
            </Label>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
