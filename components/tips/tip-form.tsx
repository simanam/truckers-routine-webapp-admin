"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { useCreateTip, useUpdateTip } from "@/lib/hooks/use-tips";
import { TIP_CATEGORY_OPTIONS } from "@/lib/constants";
import type { Tip } from "@/lib/types";

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------
const tipSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  content: z.string().min(1, "Content is required"),
  excerpt: z.string().optional(),
  category: z.enum([
    "nutrition",
    "exercise",
    "mental_health",
    "sleep",
    "driving_posture",
    "hydration",
    "stretching",
    "general_wellness",
  ]),
  tags: z.array(z.string()),
  duration_minutes: z.number().optional(),
  media_type: z.string().optional(),
  date: z.string().min(1, "Date is required"),
  min_tier: z.enum(["free", "pro", "enterprise"]),
  is_active: z.boolean(),
});

type TipFormValues = z.infer<typeof tipSchema>;

// ---------------------------------------------------------------------------
// Tier options (lowercase values matching API)
// ---------------------------------------------------------------------------
const TIER_OPTIONS = [
  { value: "free", label: "Free" },
  { value: "pro", label: "Pro" },
  { value: "enterprise", label: "Enterprise" },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export interface TipFormProps {
  mode: "create" | "edit";
  tip?: Tip;
}

export function TipForm({ mode, tip }: TipFormProps) {
  const router = useRouter();
  const [tagInput, setTagInput] = useState("");

  const createMutation = useCreateTip();
  const updateMutation = useUpdateTip(tip?.id ?? "");

  const form = useForm<TipFormValues>({
    resolver: zodResolver(tipSchema),
    defaultValues: {
      title: tip?.title ?? "",
      content: tip?.content ?? "",
      excerpt: tip?.excerpt ?? "",
      category: tip?.category ?? "general_wellness",
      tags: tip?.tags ?? [],
      duration_minutes: tip?.duration_minutes ?? undefined,
      media_type: tip?.media_type ?? "",
      date: tip?.date ?? "",
      min_tier: tip?.min_tier ?? "free",
      is_active: tip?.is_active ?? true,
    },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  const onSubmit = (values: TipFormValues) => {
    // Clean up optional empty strings
    const payload = {
      ...values,
      excerpt: values.excerpt || undefined,
      media_type: values.media_type || undefined,
      duration_minutes: values.duration_minutes || undefined,
    };

    if (mode === "create") {
      createMutation.mutate(payload, {
        onSuccess: () => {
          toast.success("Tip created successfully");
          router.push("/tips");
        },
        onError: () => {
          toast.error("Failed to create tip");
        },
      });
    } else {
      updateMutation.mutate(payload, {
        onSuccess: () => {
          toast.success("Tip updated successfully");
          router.push("/tips");
        },
        onError: () => {
          toast.error("Failed to update tip");
        },
      });
    }
  };

  const handleAddTag = (input: string) => {
    const currentTags = form.getValues("tags");
    const newTags = input
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0 && !currentTags.includes(t));
    if (newTags.length > 0) {
      form.setValue("tags", [...currentTags, ...newTags]);
    }
    setTagInput("");
  };

  const handleRemoveTag = (tag: string) => {
    const currentTags = form.getValues("tags");
    form.setValue(
      "tags",
      currentTags.filter((t) => t !== tag)
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">
            {mode === "create" ? "Create Tip" : "Edit Tip"}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {mode === "create"
              ? "Add a new health and wellness tip."
              : "Update the tip details."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => router.push("/tips")}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={form.handleSubmit(onSubmit)}
            disabled={isPending}
          >
            {isPending ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      {/* Form */}
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="grid gap-6 max-w-2xl"
        >
          {/* Title */}
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input placeholder="Enter tip title" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Excerpt */}
          <FormField
            control={form.control}
            name="excerpt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Excerpt</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Short description (optional)"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Content */}
          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Content</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Full tip content"
                    rows={6}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Category & Date */}
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {TIP_CATEGORY_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Min Tier & Duration */}
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="min_tier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Minimum Tier</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select tier" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {TIER_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="duration_minutes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duration (minutes)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      placeholder="Optional"
                      value={field.value ?? ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        field.onChange(
                          val === "" ? undefined : Number(val)
                        );
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Media Type */}
          <FormField
            control={form.control}
            name="media_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Media Type</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g. image, video, audio (optional)"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Tags */}
          <FormField
            control={form.control}
            name="tags"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tags</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Type tags separated by commas, press Enter to add"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddTag(tagInput);
                      }
                    }}
                    onBlur={() => {
                      if (tagInput.trim()) {
                        handleAddTag(tagInput);
                      }
                    }}
                  />
                </FormControl>
                {field.value.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {field.value.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="gap-1 pr-1"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Active Switch */}
          <FormField
            control={form.control}
            name="is_active"
            render={({ field }) => (
              <FormItem className="flex items-center gap-3">
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel className="!mt-0">Active</FormLabel>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
    </div>
  );
}
