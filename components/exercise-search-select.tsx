"use client";

import { useState, useEffect, useMemo } from "react";
import { ChevronsUpDown, Check, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Label } from "@/components/ui/label";

import { useExercises } from "@/lib/hooks/use-exercises";
import type { Exercise } from "@/lib/types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
export interface ExerciseSearchSelectProps {
  value: string | null;
  onChange: (id: string, exercise: Exercise) => void;
  label: string;
  placeholder?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function ExerciseSearchSelect({
  value,
  onChange,
  label,
  placeholder = "Select exercise...",
}: ExerciseSearchSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search input by 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch exercises based on debounced search
  const { data: exercises, isLoading } = useExercises({
    search: debouncedSearch || undefined,
  });

  // Find selected exercise name for display
  const selectedExercise = useMemo(() => {
    if (!value || !exercises) return null;
    return exercises.find((e) => e.id === value) ?? null;
  }, [value, exercises]);

  // Also fetch the selected exercise if it is not in the current search results
  const { data: allExercises } = useExercises({});
  const displayName = useMemo(() => {
    if (selectedExercise) return selectedExercise.name;
    if (!value || !allExercises) return null;
    const found = allExercises.find((e) => e.id === value);
    return found?.name ?? null;
  }, [selectedExercise, value, allExercises]);

  const handleSelect = (exercise: Exercise) => {
    onChange(exercise.id, exercise);
    setOpen(false);
    setSearch("");
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal"
          >
            <span className="truncate">
              {displayName ?? placeholder}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search exercises..."
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              {isLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-sm text-muted-foreground">
                    Loading...
                  </span>
                </div>
              ) : (
                <>
                  <CommandEmpty>No exercises found.</CommandEmpty>
                  <CommandGroup>
                    {exercises?.map((exercise) => (
                      <CommandItem
                        key={exercise.id}
                        value={exercise.id}
                        onSelect={() => handleSelect(exercise)}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            value === exercise.id
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">
                            {exercise.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {exercise.category}
                          </span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
