"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  CardDescription,
} from "@/components/ui/card";
import { TagInput } from "@/components/tag-input";
import {
  ExercisePicker,
  type SelectedExercise,
} from "@/components/exercise-picker";

import {
  useCreateBlueprint,
  useUpdateBlueprint,
} from "@/lib/hooks/use-blueprints";
import {
  WORKOUT_TYPE_OPTIONS,
  BLUEPRINT_CATEGORY_OPTIONS,
  FOCUS_TYPE_OPTIONS,
  DIFFICULTY_OPTIONS,
  POSITION_TAG_OPTIONS,
  LOCATION_TAG_OPTIONS,
  TIMING_TAG_OPTIONS,
  BODY_FOCUS_TAG_OPTIONS,
  PAIN_AREA_TAG_OPTIONS,
} from "@/lib/constants";
import type { Blueprint, BlueprintCreateRequest, Exercise } from "@/lib/types";

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const blueprintSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Lowercase, numbers, hyphens only"),
  type: z.enum(["ignite", "reset", "unwind"]),
  category: z.enum(["main", "midday_stretch", "evening_recovery"]),
  focus: z.enum(["strength", "cardio", "mobility", "flexibility", "mixed"]),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  equipment: z.string().min(1, "Equipment is required"),
  estimatedSecondsPerRound: z.number().min(1),
  minRounds: z.number().min(1).max(10),
  maxRounds: z.number().min(1).max(10),
  defaultRounds: z.number().min(1).max(10),
  positionTags: z.array(z.string()).min(1, "At least one position tag"),
  locationTags: z.array(z.string()).min(1, "At least one location tag"),
  timingTags: z.array(z.string()).min(1, "At least one timing tag"),
  bodyFocusTags: z.array(z.string()).min(1, "At least one body focus tag"),
  painAreaTags: z.array(z.string()),
  source: z.string().optional(),
  sourceUrl: z.string().url().optional().or(z.literal("")),
  sourceName: z.string().optional(),
  isActive: z.boolean(),
});

type BlueprintFormValues = z.infer<typeof blueprintSchema>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const generateSlug = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface BlueprintFormProps {
  mode: "create" | "edit";
  blueprint?: Blueprint;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BlueprintForm({ mode, blueprint }: BlueprintFormProps) {
  const router = useRouter();
  const slugManuallyEdited = useRef(false);

  // Mutations
  const createMutation = useCreateBlueprint();
  const updateMutation = useUpdateBlueprint(blueprint?.id ?? "");

  // Exercises state (separate from form)
  const initialExercises = useMemo<SelectedExercise[]>(() => {
    if (!blueprint?.exercises) return [];
    return blueprint.exercises.map((ex) => ({
      exerciseId: ex.exerciseId,
      exercise: {
        id: ex.exerciseId,
        name: ex.exerciseId,
        category: "",
        primary_muscles: [],
        equipment: [],
        instructions: "",
        is_bodyweight: false,
        difficulty: "beginner",
        default_reps: null,
        default_duration: null,
        external_video_url: null,
        thumbnail_url: null,
        video_urls: null,
      } as Exercise,
      order: ex.order,
      type: ex.type,
      durationSeconds: ex.durationSeconds,
      reps: ex.reps,
      restAfterSeconds: ex.restAfterSeconds,
    }));
  }, [blueprint]);

  const [selectedExercises, setSelectedExercises] =
    useState<SelectedExercise[]>(initialExercises);

  // Reset exercises when blueprint changes (edit mode)
  useEffect(() => {
    setSelectedExercises(initialExercises);
  }, [initialExercises]);

  // Form
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BlueprintFormValues>({
    resolver: zodResolver(blueprintSchema),
    defaultValues: {
      name: blueprint?.name ?? "",
      slug: blueprint?.slug ?? "",
      type: blueprint?.type ?? "ignite",
      category: blueprint?.category ?? "main",
      focus: blueprint?.focus ?? "mixed",
      difficulty: blueprint?.difficulty ?? "beginner",
      equipment: blueprint?.equipment ?? "none",
      estimatedSecondsPerRound: blueprint?.estimatedSecondsPerRound ?? 300,
      minRounds: blueprint?.minRounds ?? 1,
      maxRounds: blueprint?.maxRounds ?? 3,
      defaultRounds: blueprint?.defaultRounds ?? 1,
      positionTags: blueprint?.positionTags ?? [],
      locationTags: blueprint?.locationTags ?? [],
      timingTags: blueprint?.timingTags ?? [],
      bodyFocusTags: blueprint?.bodyFocusTags ?? [],
      painAreaTags: blueprint?.painAreaTags ?? [],
      source: blueprint?.source ?? "",
      sourceUrl: blueprint?.sourceUrl ?? "",
      sourceName: blueprint?.sourceName ?? "",
      isActive: blueprint?.isActive ?? false,
    },
  });

  // Watch values
  const nameValue = watch("name");
  const typeValue = watch("type");
  const categoryValue = watch("category");
  const focusValue = watch("focus");
  const difficultyValue = watch("difficulty");
  const isActiveValue = watch("isActive");
  const positionTags = watch("positionTags");
  const locationTags = watch("locationTags");
  const timingTags = watch("timingTags");
  const bodyFocusTags = watch("bodyFocusTags");
  const painAreaTags = watch("painAreaTags");

  // Auto-generate slug from name
  useEffect(() => {
    if (!slugManuallyEdited.current) {
      setValue("slug", generateSlug(nameValue));
    }
  }, [nameValue, setValue]);

  // Auto-calculate estimated seconds per round from exercises
  const calculatedDuration = useMemo(() => {
    return selectedExercises.reduce((sum, ex) => {
      const exerciseDuration =
        ex.type === "timer"
          ? ex.durationSeconds ?? 0
          : (ex.reps ?? 0) * 3;
      return sum + exerciseDuration + ex.restAfterSeconds;
    }, 0);
  }, [selectedExercises]);

  // Submit handler
  const onSubmit = (values: BlueprintFormValues) => {
    const exercises = selectedExercises.map((ex) => ({
      exerciseId: ex.exerciseId,
      order: ex.order,
      type: ex.type,
      durationSeconds: ex.type === "timer" ? ex.durationSeconds : undefined,
      reps: ex.type === "reps" ? ex.reps : undefined,
      restAfterSeconds: ex.restAfterSeconds,
    }));

    const payload = {
      ...values,
      exercises,
    } as BlueprintCreateRequest;

    if (mode === "create") {
      createMutation.mutate(payload, {
        onSuccess: () => {
          toast.success("Blueprint created successfully");
          router.push("/blueprints");
        },
        onError: () => {
          toast.error("Failed to create blueprint");
        },
      });
    } else {
      updateMutation.mutate(payload, {
        onSuccess: () => {
          toast.success("Blueprint updated successfully");
          router.push("/blueprints");
        },
        onError: () => {
          toast.error("Failed to update blueprint");
        },
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">
            {mode === "create" ? "New Blueprint" : "Edit Blueprint"}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {mode === "create"
              ? "Create a new workout blueprint."
              : `Editing "${blueprint?.name}"`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/blueprints")}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === "create" ? "Create Blueprint" : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Section 1: Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Info</CardTitle>
          <CardDescription>
            Core details about this workout blueprint.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="e.g. Morning Ignite Full Body"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Slug */}
          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              placeholder="auto-generated-slug"
              {...register("slug", {
                onChange: () => {
                  slugManuallyEdited.current = true;
                },
              })}
            />
            {errors.slug && (
              <p className="text-sm text-destructive">{errors.slug.message}</p>
            )}
          </div>

          {/* Type */}
          <div className="space-y-2">
            <Label>Type</Label>
            <Select
              value={typeValue}
              onValueChange={(val) =>
                setValue("type", val as BlueprintFormValues["type"])
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {WORKOUT_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.type && (
              <p className="text-sm text-destructive">{errors.type.message}</p>
            )}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              value={categoryValue}
              onValueChange={(val) =>
                setValue("category", val as BlueprintFormValues["category"])
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {BLUEPRINT_CATEGORY_OPTIONS.map((opt) => (
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

          {/* Focus */}
          <div className="space-y-2">
            <Label>Focus</Label>
            <Select
              value={focusValue}
              onValueChange={(val) =>
                setValue("focus", val as BlueprintFormValues["focus"])
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select focus" />
              </SelectTrigger>
              <SelectContent>
                {FOCUS_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.focus && (
              <p className="text-sm text-destructive">{errors.focus.message}</p>
            )}
          </div>

          {/* Difficulty */}
          <div className="space-y-2">
            <Label>Difficulty</Label>
            <Select
              value={difficultyValue}
              onValueChange={(val) =>
                setValue("difficulty", val as BlueprintFormValues["difficulty"])
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select difficulty" />
              </SelectTrigger>
              <SelectContent>
                {DIFFICULTY_OPTIONS.map((opt) => (
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

          {/* Equipment */}
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="equipment">Equipment</Label>
            <Input
              id="equipment"
              placeholder="e.g. none, resistance band, dumbbells"
              {...register("equipment")}
            />
            {errors.equipment && (
              <p className="text-sm text-destructive">
                {errors.equipment.message}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Rounds */}
      <Card>
        <CardHeader>
          <CardTitle>Rounds</CardTitle>
          <CardDescription>
            Configure round counts and estimated duration.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="minRounds">Min Rounds</Label>
            <Input
              id="minRounds"
              type="number"
              min={1}
              max={10}
              {...register("minRounds", { valueAsNumber: true })}
            />
            {errors.minRounds && (
              <p className="text-sm text-destructive">
                {errors.minRounds.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxRounds">Max Rounds</Label>
            <Input
              id="maxRounds"
              type="number"
              min={1}
              max={10}
              {...register("maxRounds", { valueAsNumber: true })}
            />
            {errors.maxRounds && (
              <p className="text-sm text-destructive">
                {errors.maxRounds.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="defaultRounds">Default Rounds</Label>
            <Input
              id="defaultRounds"
              type="number"
              min={1}
              max={10}
              {...register("defaultRounds", { valueAsNumber: true })}
            />
            {errors.defaultRounds && (
              <p className="text-sm text-destructive">
                {errors.defaultRounds.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="estimatedSecondsPerRound">
              Seconds / Round
            </Label>
            <Input
              id="estimatedSecondsPerRound"
              type="number"
              min={1}
              {...register("estimatedSecondsPerRound", {
                valueAsNumber: true,
              })}
            />
            {calculatedDuration > 0 && (
              <p className="text-xs text-muted-foreground">
                Calculated from exercises: {calculatedDuration}s
              </p>
            )}
            {errors.estimatedSecondsPerRound && (
              <p className="text-sm text-destructive">
                {errors.estimatedSecondsPerRound.message}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Section 3: Tags */}
      <Card>
        <CardHeader>
          <CardTitle>Tags</CardTitle>
          <CardDescription>
            Categorize this blueprint with tags for filtering and
            recommendations.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2">
          <TagInput
            label="Position Tags"
            value={positionTags}
            onChange={(tags) => setValue("positionTags", tags, { shouldValidate: true })}
            options={POSITION_TAG_OPTIONS}
            placeholder="Select positions..."
          />
          {errors.positionTags && (
            <p className="text-sm text-destructive sm:col-span-2">
              {errors.positionTags.message}
            </p>
          )}

          <TagInput
            label="Location Tags"
            value={locationTags}
            onChange={(tags) => setValue("locationTags", tags, { shouldValidate: true })}
            options={LOCATION_TAG_OPTIONS}
            placeholder="Select locations..."
          />
          {errors.locationTags && (
            <p className="text-sm text-destructive sm:col-span-2">
              {errors.locationTags.message}
            </p>
          )}

          <TagInput
            label="Timing Tags"
            value={timingTags}
            onChange={(tags) => setValue("timingTags", tags, { shouldValidate: true })}
            options={TIMING_TAG_OPTIONS}
            placeholder="Select timing..."
          />
          {errors.timingTags && (
            <p className="text-sm text-destructive sm:col-span-2">
              {errors.timingTags.message}
            </p>
          )}

          <TagInput
            label="Body Focus Tags"
            value={bodyFocusTags}
            onChange={(tags) => setValue("bodyFocusTags", tags, { shouldValidate: true })}
            options={BODY_FOCUS_TAG_OPTIONS}
            placeholder="Select body focus..."
          />
          {errors.bodyFocusTags && (
            <p className="text-sm text-destructive sm:col-span-2">
              {errors.bodyFocusTags.message}
            </p>
          )}

          <TagInput
            label="Pain Area Tags"
            value={painAreaTags}
            onChange={(tags) => setValue("painAreaTags", tags, { shouldValidate: true })}
            options={PAIN_AREA_TAG_OPTIONS}
            placeholder="Select pain areas..."
          />
        </CardContent>
      </Card>

      {/* Section 4: Source (Optional) */}
      <Card>
        <CardHeader>
          <CardTitle>Source</CardTitle>
          <CardDescription>
            Optional attribution for this blueprint.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="source">Source</Label>
            <Input
              id="source"
              placeholder="e.g. internal, community"
              {...register("source")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sourceName">Source Name</Label>
            <Input
              id="sourceName"
              placeholder="e.g. Coach John"
              {...register("sourceName")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sourceUrl">Source URL</Label>
            <Input
              id="sourceUrl"
              type="url"
              placeholder="https://..."
              {...register("sourceUrl")}
            />
            {errors.sourceUrl && (
              <p className="text-sm text-destructive">
                {errors.sourceUrl.message}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Section 5: Exercises */}
      <Card>
        <CardHeader>
          <CardTitle>Exercises</CardTitle>
          <CardDescription>
            Add and order exercises for this blueprint.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ExercisePicker
            selected={selectedExercises}
            onChange={setSelectedExercises}
            mode="blueprint"
          />
        </CardContent>
      </Card>

      {/* Section 6: Status */}
      <Card>
        <CardHeader>
          <CardTitle>Status</CardTitle>
          <CardDescription>
            Control whether this blueprint is active and available for
            workouts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Switch
              checked={isActiveValue}
              onCheckedChange={(checked) => setValue("isActive", checked)}
            />
            <Label>{isActiveValue ? "Active" : "Inactive"}</Label>
          </div>
        </CardContent>
      </Card>

      {/* Submit buttons (bottom) */}
      <div className="flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/blueprints")}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {mode === "create" ? "Create Blueprint" : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
