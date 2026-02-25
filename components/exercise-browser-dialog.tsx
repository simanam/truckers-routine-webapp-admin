"use client";

import { useState, useMemo, useEffect } from "react";
import { Search, Dumbbell, Plus, Check } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useExercises, useExerciseCategories } from "@/lib/hooks/use-exercises";
import { getCloudinaryThumbnail } from "@/lib/cloudinary";
import type { Exercise } from "@/lib/types";

// ---------------------------------------------------------------------------
// Debounce hook
// ---------------------------------------------------------------------------
function useDebounce(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

// ---------------------------------------------------------------------------
// Browse Exercise Card
// ---------------------------------------------------------------------------
function BrowseExerciseCard({
  exercise,
  alreadyAdded,
  onAdd,
}: {
  exercise: Exercise;
  alreadyAdded: boolean;
  onAdd: (exercise: Exercise) => void;
}) {
  const [imgError, setImgError] = useState(false);

  const thumbnailUrl =
    exercise.thumbnail_url ||
    getCloudinaryThumbnail(
      exercise.video_urls?.mp4 ||
        exercise.video_urls?.webm ||
        exercise.external_video_url
    );

  return (
    <Card className={alreadyAdded ? "opacity-60" : ""}>
      <CardContent className="relative space-y-2 p-3">
        {/* Thumbnail */}
        <div className="flex h-28 items-center justify-center overflow-hidden rounded-md bg-muted">
          {thumbnailUrl && !imgError ? (
            <img
              src={thumbnailUrl}
              alt={exercise.name}
              className="h-full w-full object-cover"
              loading="lazy"
              onError={() => setImgError(true)}
            />
          ) : (
            <Dumbbell className="h-8 w-8 text-muted-foreground" />
          )}
        </div>

        {/* Name */}
        <p className="truncate text-sm font-medium">{exercise.name}</p>

        {/* Badges */}
        <div className="flex flex-wrap gap-1">
          <Badge variant="secondary" className="text-xs">
            {exercise.category}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {exercise.difficulty}
          </Badge>
          {exercise.is_bodyweight && (
            <Badge variant="outline" className="text-xs">
              BW
            </Badge>
          )}
        </div>

        {/* Add button */}
        <Button
          type="button"
          variant={alreadyAdded ? "secondary" : "default"}
          size="sm"
          className="w-full"
          disabled={alreadyAdded}
          onClick={() => onAdd(exercise)}
        >
          {alreadyAdded ? (
            <>
              <Check className="mr-1 h-3.5 w-3.5" />
              Added
            </>
          ) : (
            <>
              <Plus className="mr-1 h-3.5 w-3.5" />
              Add
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Exercise Browser Dialog
// ---------------------------------------------------------------------------
export interface ExerciseBrowserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIds: Set<string>;
  onAdd: (exercise: Exercise) => void;
}

export function ExerciseBrowserDialog({
  open,
  onOpenChange,
  selectedIds,
  onAdd,
}: ExerciseBrowserDialogProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("");
  const [difficulty, setDifficulty] = useState<string>("");
  const [isBodyweight, setIsBodyweight] = useState(false);

  const debouncedSearch = useDebounce(search, 300);

  const params = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      category: category || undefined,
      difficulty:
        (difficulty as "beginner" | "intermediate" | "advanced") || undefined,
      is_bodyweight: isBodyweight || undefined,
      limit: 100,
    }),
    [debouncedSearch, category, difficulty, isBodyweight]
  );

  const { data: exercises, isLoading } = useExercises(params);
  const { data: categories } = useExerciseCategories();

  // Reset filters when dialog opens
  useEffect(() => {
    if (open) {
      setSearch("");
      setCategory("");
      setDifficulty("");
      setIsBodyweight(false);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex! max-h-[85vh] flex-col sm:max-w-4xl">
        <DialogHeader className="shrink-0">
          <DialogTitle>Browse Exercises</DialogTitle>
          <DialogDescription>
            Search and filter the exercise library. Click Add to include an
            exercise.
          </DialogDescription>
        </DialogHeader>

        {/* Filters */}
        <div className="flex shrink-0 flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-60">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search exercises..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select
            value={category}
            onValueChange={(v) => setCategory(v === "__all__" ? "" : v)}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Categories</SelectItem>
              {categories?.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={difficulty}
            onValueChange={(v) => setDifficulty(v === "__all__" ? "" : v)}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Levels</SelectItem>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>

          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={isBodyweight}
              onCheckedChange={(v) => setIsBodyweight(v === true)}
            />
            Bodyweight only
          </label>
        </div>

        {/* Results grid */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="grid gap-3 p-1 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="space-y-3 p-3">
                    <Skeleton className="h-28 w-full rounded-md" />
                    <Skeleton className="h-4 w-3/4" />
                    <div className="flex gap-2">
                      <Skeleton className="h-4 w-14 rounded-full" />
                      <Skeleton className="h-4 w-18 rounded-full" />
                    </div>
                    <Skeleton className="h-8 w-full rounded-md" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : exercises && exercises.length > 0 ? (
            <div className="grid gap-3 p-1 sm:grid-cols-2 lg:grid-cols-3">
              {exercises.map((exercise) => (
                <BrowseExerciseCard
                  key={exercise.id}
                  exercise={exercise}
                  alreadyAdded={selectedIds.has(exercise.id)}
                  onAdd={onAdd}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Dumbbell className="mb-3 h-8 w-8" />
              <p className="text-sm font-medium">No exercises found</p>
              <p className="text-xs">Try adjusting your filters.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
