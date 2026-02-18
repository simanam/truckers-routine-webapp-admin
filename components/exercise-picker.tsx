"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import { GripVertical, Plus, Search, Trash2, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api";
import type { Exercise, ExerciseType } from "@/lib/types";

export interface SelectedExercise {
  exerciseId: string;
  exercise: Exercise;
  order: number;
  type: ExerciseType;
  durationSeconds?: number;
  reps?: number;
  restAfterSeconds: number;
}

export interface ExercisePickerProps {
  selected: SelectedExercise[];
  onChange: (exercises: SelectedExercise[]) => void;
  mode?: "blueprint" | "reset";
}

export function ExercisePicker({
  selected,
  onChange,
  mode = "blueprint",
}: ExercisePickerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Exercise[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch exercises based on debounced query
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setSearchResults([]);
      return;
    }

    let cancelled = false;

    async function fetchExercises() {
      setIsSearching(true);
      try {
        const params = new URLSearchParams({
          search: debouncedQuery,
          limit: "20",
        });
        const data = await api.fetch<{ data: Exercise[] }>(
          `/exercises?${params.toString()}`
        );
        if (!cancelled) {
          setSearchResults(data.data ?? []);
        }
      } catch {
        if (!cancelled) {
          setSearchResults([]);
        }
      } finally {
        if (!cancelled) {
          setIsSearching(false);
        }
      }
    }

    fetchExercises();

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  const selectedIds = useMemo(
    () => new Set(selected.map((s) => s.exerciseId)),
    [selected]
  );

  const handleAdd = useCallback(
    (exercise: Exercise) => {
      if (selectedIds.has(exercise.id)) return;

      const newExercise: SelectedExercise = {
        exerciseId: exercise.id,
        exercise,
        order: selected.length + 1,
        type: mode === "reset" ? "timer" : "timer",
        durationSeconds: exercise.default_duration ?? 30,
        reps: exercise.default_reps ?? undefined,
        restAfterSeconds: 10,
      };

      onChange([...selected, newExercise]);
    },
    [selected, selectedIds, onChange, mode]
  );

  const handleRemove = useCallback(
    (exerciseId: string) => {
      const updated = selected
        .filter((s) => s.exerciseId !== exerciseId)
        .map((s, idx) => ({ ...s, order: idx + 1 }));
      onChange(updated);
    },
    [selected, onChange]
  );

  const handleUpdate = useCallback(
    (exerciseId: string, fields: Partial<SelectedExercise>) => {
      const updated = selected.map((s) =>
        s.exerciseId === exerciseId ? { ...s, ...fields } : s
      );
      onChange(updated);
    },
    [selected, onChange]
  );

  const handleDragEnd = useCallback(
    (result: DropResult) => {
      if (!result.destination) return;

      const items = Array.from(selected);
      const [moved] = items.splice(result.source.index, 1);
      items.splice(result.destination.index, 0, moved);

      const reordered = items.map((item, idx) => ({
        ...item,
        order: idx + 1,
      }));
      onChange(reordered);
    },
    [selected, onChange]
  );

  // Duration calculator
  const totalDuration = useMemo(() => {
    return selected.reduce((sum, ex) => {
      const exerciseDuration =
        ex.type === "timer"
          ? ex.durationSeconds ?? 0
          : (ex.reps ?? 0) * 3; // ~3s per rep estimate
      return sum + exerciseDuration + ex.restAfterSeconds;
    }, 0);
  }, [selected]);

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  return (
    <div className="space-y-6">
      {/* Search Section */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Search Exercises</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by exercise name..."
            className="pl-9"
          />
        </div>

        {/* Search Results */}
        {debouncedQuery.trim() && (
          <div className="max-h-48 overflow-y-auto rounded-md border">
            {isSearching ? (
              <p className="p-3 text-sm text-muted-foreground">Searching...</p>
            ) : searchResults.length === 0 ? (
              <p className="p-3 text-sm text-muted-foreground">
                No exercises found.
              </p>
            ) : (
              searchResults.map((exercise) => {
                const alreadyAdded = selectedIds.has(exercise.id);
                return (
                  <div
                    key={exercise.id}
                    className="flex items-center justify-between border-b px-3 py-2 last:border-b-0"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {exercise.name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {exercise.category}
                        {exercise.primary_muscles.length > 0 &&
                          ` - ${exercise.primary_muscles.join(", ")}`}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleAdd(exercise)}
                      disabled={alreadyAdded}
                      className="ml-2 shrink-0"
                    >
                      <Plus className="h-4 w-4" />
                      {alreadyAdded ? "Added" : "Add"}
                    </Button>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Selected Exercises with Drag and Drop */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">
          Selected Exercises ({selected.length})
        </Label>

        {selected.length === 0 ? (
          <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
            No exercises added yet. Use the search above to find and add
            exercises.
          </p>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="exercises">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="space-y-2"
                >
                  {selected.map((item, index) => (
                    <Draggable
                      key={item.exerciseId}
                      draggableId={item.exerciseId}
                      index={index}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`rounded-md border bg-card p-3 ${
                            snapshot.isDragging ? "shadow-lg" : ""
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {/* Drag Handle */}
                            <div
                              {...provided.dragHandleProps}
                              className="mt-1 cursor-grab text-muted-foreground"
                            >
                              <GripVertical className="h-4 w-4" />
                            </div>

                            {/* Exercise Info & Config */}
                            <div className="flex-1 space-y-3">
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="mr-2 text-xs font-medium text-muted-foreground">
                                    #{item.order}
                                  </span>
                                  <span className="text-sm font-medium">
                                    {item.exercise.name}
                                  </span>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon-xs"
                                  onClick={() => handleRemove(item.exerciseId)}
                                  className="text-muted-foreground hover:text-destructive"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>

                              {/* Config Fields */}
                              <div className="flex flex-wrap items-end gap-3">
                                {/* Type selector (blueprint mode only) */}
                                {mode === "blueprint" && (
                                  <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">
                                      Type
                                    </Label>
                                    <Select
                                      value={item.type}
                                      onValueChange={(val) =>
                                        handleUpdate(item.exerciseId, {
                                          type: val as ExerciseType,
                                        })
                                      }
                                    >
                                      <SelectTrigger
                                        className="w-[100px]"
                                        size="sm"
                                      >
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="timer">
                                          Timer
                                        </SelectItem>
                                        <SelectItem value="reps">
                                          Reps
                                        </SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                )}

                                {/* Duration (for timer type) */}
                                {item.type === "timer" && (
                                  <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">
                                      Duration (s)
                                    </Label>
                                    <Input
                                      type="number"
                                      min={1}
                                      value={item.durationSeconds ?? ""}
                                      onChange={(e) =>
                                        handleUpdate(item.exerciseId, {
                                          durationSeconds:
                                            Number(e.target.value) || undefined,
                                        })
                                      }
                                      className="h-8 w-[90px]"
                                    />
                                  </div>
                                )}

                                {/* Reps (for reps type) */}
                                {item.type === "reps" && (
                                  <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">
                                      Reps
                                    </Label>
                                    <Input
                                      type="number"
                                      min={1}
                                      value={item.reps ?? ""}
                                      onChange={(e) =>
                                        handleUpdate(item.exerciseId, {
                                          reps:
                                            Number(e.target.value) || undefined,
                                        })
                                      }
                                      className="h-8 w-[90px]"
                                    />
                                  </div>
                                )}

                                {/* Rest After */}
                                <div className="space-y-1">
                                  <Label className="text-xs text-muted-foreground">
                                    Rest After (s)
                                  </Label>
                                  <Input
                                    type="number"
                                    min={0}
                                    value={item.restAfterSeconds}
                                    onChange={(e) =>
                                      handleUpdate(item.exerciseId, {
                                        restAfterSeconds:
                                          Number(e.target.value) || 0,
                                      })
                                    }
                                    className="h-8 w-[90px]"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </div>

      {/* Duration Calculator */}
      {selected.length > 0 && (
        <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-4 py-3">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Estimated duration per round:
          </span>
          <span className="text-sm font-semibold">
            {formatDuration(totalDuration)}
          </span>
          <span className="text-xs text-muted-foreground">
            ({totalDuration}s)
          </span>
        </div>
      )}
    </div>
  );
}
