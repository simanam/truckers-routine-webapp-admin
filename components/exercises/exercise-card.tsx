"use client";

import { useState } from "react";
import { Dumbbell, Copy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { Exercise } from "@/lib/types";
import { getCloudinaryThumbnail } from "@/lib/cloudinary";

interface ExerciseCardProps {
  exercise: Exercise;
  onClick: () => void;
}

export function ExerciseCard({ exercise, onClick }: ExerciseCardProps) {
  const [imgError, setImgError] = useState(false);

  const handleCopyId = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(exercise.id);
    toast("ID copied");
  };

  const thumbnailUrl =
    exercise.thumbnail_url ||
    getCloudinaryThumbnail(
      exercise.video_urls?.mp4 ||
        exercise.video_urls?.webm ||
        exercise.external_video_url
    );

  return (
    <Card
      className="cursor-pointer transition-shadow hover:shadow-md"
      onClick={onClick}
    >
      <CardContent className="relative space-y-3 p-4">
        {/* Thumbnail */}
        <div className="flex h-36 items-center justify-center overflow-hidden rounded-md bg-muted">
          {thumbnailUrl && !imgError ? (
            <img
              src={thumbnailUrl}
              alt={exercise.name}
              className="h-full w-full object-cover"
              loading="lazy"
              onError={() => setImgError(true)}
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
