"use client";

import Image from "next/image";
import { Dumbbell, Copy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { Exercise } from "@/lib/types";

interface ExerciseCardProps {
  exercise: Exercise;
  onClick: () => void;
}

export function ExerciseCard({ exercise, onClick }: ExerciseCardProps) {
  const handleCopyId = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(exercise.id);
    toast("ID copied");
  };

  return (
    <Card
      className="cursor-pointer transition-shadow hover:shadow-md"
      onClick={onClick}
    >
      <CardContent className="relative space-y-3 p-4">
        {/* Thumbnail */}
        <div className="flex h-36 items-center justify-center overflow-hidden rounded-md bg-muted">
          {exercise.thumbnail_url ? (
            <Image
              src={exercise.thumbnail_url}
              alt={exercise.name}
              width={320}
              height={144}
              className="h-full w-full object-cover"
            />
          ) : (
            <Dumbbell className="h-10 w-10 text-muted-foreground" />
          )}
        </div>

        {/* Name */}
        <p className="truncate font-medium">{exercise.name}</p>

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5">
          <Badge>{exercise.category}</Badge>
          <Badge variant="outline">{exercise.difficulty}</Badge>
        </div>

        {/* Equipment */}
        {exercise.equipment.length > 0 && (
          <p className="truncate text-xs text-muted-foreground">
            {exercise.equipment.join(", ")}
          </p>
        )}

        {/* Copy ID button */}
        <Button
          variant="ghost"
          size="icon-xs"
          className="absolute right-3 bottom-3"
          onClick={handleCopyId}
          title="Copy ID"
        >
          <Copy className="h-3.5 w-3.5" />
        </Button>
      </CardContent>
    </Card>
  );
}
