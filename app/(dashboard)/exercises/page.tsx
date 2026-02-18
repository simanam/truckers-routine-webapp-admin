"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { Search, Copy, Dumbbell } from "lucide-react";
import { toast } from "sonner";

import { getCloudinaryThumbnail } from "@/lib/cloudinary";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { useExercises, useExerciseCategories } from "@/lib/hooks/use-exercises";
import { ExerciseCard } from "@/components/exercises/exercise-card";
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
// Exercises Page
// ---------------------------------------------------------------------------
export default function ExercisesPage() {
  // Filter state
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("");
  const [difficulty, setDifficulty] = useState<string>("");
  const [isBodyweight, setIsBodyweight] = useState(false);

  // Detail sheet
  const [selected, setSelected] = useState<Exercise | null>(null);

  const debouncedSearch = useDebounce(search, 300);

  // Build params
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

  const handleCopyId = useCallback((id: string) => {
    navigator.clipboard.writeText(id);
    toast("ID copied");
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-navy">Exercises</h1>
        <p className="mt-1 text-muted-foreground">
          Browse and search the exercise library.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search exercises..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Category */}
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

        {/* Difficulty */}
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

        {/* Bodyweight */}
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={isBodyweight}
            onCheckedChange={(v) => setIsBodyweight(v === true)}
          />
          Bodyweight only
        </label>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="space-y-3 p-4">
                <Skeleton className="h-36 w-full rounded-md" />
                <Skeleton className="h-5 w-3/4" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : exercises && exercises.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {exercises.map((exercise) => (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              onClick={() => setSelected(exercise)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Dumbbell className="mb-3 h-10 w-10" />
          <p className="text-lg font-medium">No exercises found</p>
          <p className="text-sm">Try adjusting your filters.</p>
        </div>
      )}

      {/* Detail Sheet */}
      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent side="right" className="overflow-y-auto sm:max-w-lg">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>{selected.name}</SheetTitle>
              </SheetHeader>

              <div className="space-y-5 px-4 pb-6">
                {/* Video / Thumbnail */}
                {(() => {
                  const videoSrc =
                    selected.video_urls?.mp4 ||
                    selected.video_urls?.webm ||
                    selected.external_video_url;
                  const posterUrl =
                    selected.thumbnail_url ||
                    getCloudinaryThumbnail(videoSrc, {
                      width: 500,
                      height: 400,
                    });

                  if (videoSrc) {
                    return (
                      <div className="overflow-hidden rounded-md bg-muted">
                        <video
                          key={selected.id}
                          src={videoSrc}
                          poster={posterUrl || undefined}
                          controls
                          loop
                          muted
                          autoPlay
                          playsInline
                          className="w-full"
                        />
                      </div>
                    );
                  }

                  if (posterUrl) {
                    return (
                      <div className="overflow-hidden rounded-md bg-muted">
                        <img
                          src={posterUrl}
                          alt={selected.name}
                          className="w-full object-cover"
                        />
                      </div>
                    );
                  }

                  return null;
                })()}

                {/* Meta */}
                <div className="flex flex-wrap gap-2">
                  <Badge>{selected.category}</Badge>
                  <Badge variant="outline">{selected.difficulty}</Badge>
                  {selected.is_bodyweight && (
                    <Badge variant="secondary">Bodyweight</Badge>
                  )}
                </div>

                {/* Equipment */}
                {selected.equipment.length > 0 && (
                  <div>
                    <p className="mb-1 text-sm font-medium">Equipment</p>
                    <p className="text-sm text-muted-foreground">
                      {selected.equipment.join(", ")}
                    </p>
                  </div>
                )}

                {/* Primary Muscles */}
                {selected.primary_muscles.length > 0 && (
                  <div>
                    <p className="mb-1 text-sm font-medium">Primary Muscles</p>
                    <div className="flex flex-wrap gap-1.5">
                      {selected.primary_muscles.map((m) => (
                        <Badge key={m} variant="secondary">
                          {m}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Instructions */}
                {selected.instructions && (
                  <div>
                    <p className="mb-1 text-sm font-medium">Instructions</p>
                    <p className="whitespace-pre-line text-sm text-muted-foreground">
                      {selected.instructions}
                    </p>
                  </div>
                )}

                {/* Defaults */}
                <div className="flex gap-6">
                  {selected.default_reps != null && (
                    <div>
                      <p className="text-sm font-medium">Default Reps</p>
                      <p className="text-sm text-muted-foreground">
                        {selected.default_reps}
                      </p>
                    </div>
                  )}
                  {selected.default_duration != null && (
                    <div>
                      <p className="text-sm font-medium">Default Duration</p>
                      <p className="text-sm text-muted-foreground">
                        {selected.default_duration}s
                      </p>
                    </div>
                  )}
                </div>

                {/* Copy ID */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopyId(selected.id)}
                  className="gap-1.5"
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copy ID
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
