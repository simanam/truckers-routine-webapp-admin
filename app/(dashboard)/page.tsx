"use client";

import { Dumbbell, Layers, Users, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useExerciseStats } from "@/lib/hooks/use-exercises";
import { useBlueprintCoverage } from "@/lib/hooks/use-blueprints";

// ---------------------------------------------------------------------------
// StatCard
// ---------------------------------------------------------------------------
function StatCard({
  title,
  value,
  icon: Icon,
  description,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  description?: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-6">
        <div className="rounded-lg bg-navy/10 p-3">
          <Icon className="h-6 w-6 text-navy" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// CoverageBar
// ---------------------------------------------------------------------------
function CoverageBar({
  type,
  active,
  threshold,
  ready,
}: {
  type: string;
  active: number;
  threshold: number;
  ready: boolean;
}) {
  const percentage = Math.min((active / threshold) * 100, 100);
  return (
    <div className="flex items-center gap-4">
      <span className="w-20 text-sm font-medium capitalize">{type}</span>
      <div className="relative h-4 flex-1 rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            ready ? "bg-green-500" : "bg-orange"
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="w-24 text-sm text-muted-foreground">
        {active}/{threshold}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dashboard Page
// ---------------------------------------------------------------------------
export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useExerciseStats();
  const { data: coverage, isLoading: coverageLoading } =
    useBlueprintCoverage();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-navy">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">
          Overview of exercises, blueprints, and coverage.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statsLoading ? (
          <>
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="flex items-center gap-4 p-6">
                  <Skeleton className="h-12 w-12 rounded-lg" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-7 w-16" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </>
        ) : (
          <>
            <StatCard
              title="Total Exercises"
              value={
                stats?.total_count != null
                  ? Number(stats.total_count)
                  : "--"
              }
              icon={Dumbbell}
              description="Across all categories"
            />
            <StatCard
              title="Active Blueprints"
              value={coverage?.totalActive ?? "--"}
              icon={Layers}
              description="Ready for workouts"
            />
            <StatCard
              title="Total Users"
              value={
                stats?.total_users != null
                  ? Number(stats.total_users)
                  : "--"
              }
              icon={Users}
            />
            <StatCard
              title="Today's Workout Status"
              value={
                stats?.today_status != null
                  ? String(stats.today_status)
                  : "--"
              }
              icon={Calendar}
            />
          </>
        )}
      </div>

      {/* Blueprint Coverage */}
      <Card>
        <CardContent className="space-y-6 p-6">
          <div>
            <h2 className="text-lg font-semibold text-navy">
              Blueprint Coverage
            </h2>
            <p className="text-sm text-muted-foreground">
              Active blueprints per workout type vs. required threshold.
            </p>
          </div>

          {coverageLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 flex-1 rounded-full" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          ) : Array.isArray(coverage?.coverage) && coverage.coverage.length > 0 ? (
            <div className="space-y-4">
              {coverage.coverage.map((item) => (
                <CoverageBar
                  key={item.workoutType}
                  type={item.workoutType}
                  active={item.active}
                  threshold={item.threshold}
                  ready={item.ready}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No coverage data available.
            </p>
          )}

          {coverage && (
            <div className="flex gap-6 border-t pt-4 text-sm text-muted-foreground">
              <span>
                Total Active:{" "}
                <strong className="text-foreground">
                  {coverage.totalActive}
                </strong>
              </span>
              <span>
                Total Inactive:{" "}
                <strong className="text-foreground">
                  {coverage.totalInactive}
                </strong>
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
