"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/confirm-dialog";

import {
  usePricing,
  useUpdatePricing,
  useTogglePromotion,
  useDisablePromotion,
} from "@/lib/hooks/use-pricing";
import type { PricingConfig } from "@/lib/types";

// ---------------------------------------------------------------------------
// Price Input — editable inline field with Save button
// ---------------------------------------------------------------------------
function PriceInput({
  plan,
  field,
  label,
  initialValue,
  suffix,
}: {
  plan: string;
  field: string;
  label: string;
  initialValue: number | undefined;
  suffix: string;
}) {
  const [value, setValue] = useState<string>(String(initialValue ?? 0));
  const [isDirty, setIsDirty] = useState(false);
  const updatePricing = useUpdatePricing(plan);

  const handleSave = () => {
    const numVal = parseFloat(value);
    if (isNaN(numVal) || numVal < 0) {
      toast.error("Please enter a valid price");
      return;
    }
    updatePricing.mutate(
      { [field]: numVal },
      {
        onSuccess: () => {
          toast.success(`${label} updated`);
          setIsDirty(false);
        },
        onError: () => toast.error(`Failed to update ${label.toLowerCase()}`),
      }
    );
  };

  return (
    <div className="flex items-center gap-3">
      <span className="w-24 text-sm font-medium text-muted-foreground">
        {label}:
      </span>
      <span className="text-sm font-medium">$</span>
      <Input
        type="number"
        step="0.01"
        min="0"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setIsDirty(true);
        }}
        className="w-28"
      />
      <span className="text-sm text-muted-foreground">{suffix}</span>
      {isDirty && (
        <Button
          size="sm"
          onClick={handleSave}
          disabled={updatePricing.isPending}
        >
          {updatePricing.isPending && (
            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
          )}
          Save
        </Button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Plan Card
// ---------------------------------------------------------------------------
function PlanCard({ plan }: { plan: PricingConfig }) {
  const togglePromotion = useTogglePromotion(plan.plan);
  const disablePromotion = useDisablePromotion(plan.plan);
  const [showDisableConfirm, setShowDisableConfirm] = useState(false);

  const isFree = plan.plan.toLowerCase() === "free";
  const isEnterprise = plan.plan.toLowerCase() === "enterprise";

  const handleTogglePromotion = () => {
    togglePromotion.mutate(
      {
        promotion_text: plan.promotion_text || `Special offer on ${plan.plan}!`,
        promotion_discount: plan.promotion_discount || 10,
      },
      {
        onSuccess: () => toast.success("Promotion toggled"),
        onError: () => toast.error("Failed to toggle promotion"),
      }
    );
  };

  const handleDisablePromotion = () => {
    disablePromotion.mutate(undefined, {
      onSuccess: () => {
        toast.success("Promotion disabled");
        setShowDisableConfirm(false);
      },
      onError: () => toast.error("Failed to disable promotion"),
    });
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-lg">
            {capitalize(plan.plan)} Plan
            {plan.is_promoted && (
              <Badge className="bg-green-100 text-green-700">
                Promotion Active
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Pricing */}
          <div className="space-y-3">
            {isFree ? (
              <p className="text-sm font-medium text-muted-foreground">
                Price: Free
              </p>
            ) : isEnterprise ? (
              <PriceInput
                key={`${plan.plan}-monthly-${plan.price_monthly}`}
                plan={plan.plan}
                field="price_monthly"
                label="Per Seat"
                initialValue={plan.price_monthly}
                suffix="/month/seat"
              />
            ) : (
              <>
                <PriceInput
                  key={`${plan.plan}-monthly-${plan.price_monthly}`}
                  plan={plan.plan}
                  field="price_monthly"
                  label="Monthly"
                  initialValue={plan.price_monthly}
                  suffix="/month"
                />
                <PriceInput
                  key={`${plan.plan}-yearly-${plan.price_yearly}`}
                  plan={plan.plan}
                  field="price_yearly"
                  label="Yearly"
                  initialValue={plan.price_yearly}
                  suffix="/year"
                />
              </>
            )}
          </div>

          {/* Features */}
          {plan.features && plan.features.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium">Features:</p>
              <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                {plan.features.map((feature, i) => (
                  <li key={i}>{feature}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Promotion Section */}
          {!isFree && (
            <div className="space-y-3 border-t pt-4">
              <p className="text-sm font-medium">Promotion</p>
              {plan.is_promoted ? (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Text: &quot;{plan.promotion_text}&quot;
                  </p>
                  {plan.promotion_discount != null && (
                    <p className="text-sm text-muted-foreground">
                      Discount: {plan.promotion_discount}%
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">None</p>
              )}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTogglePromotion}
                  disabled={togglePromotion.isPending}
                >
                  {togglePromotion.isPending && (
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                  )}
                  Toggle Promotion
                </Button>
                {plan.is_promoted && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowDisableConfirm(true)}
                    disabled={disablePromotion.isPending}
                  >
                    Disable Promotion
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={showDisableConfirm}
        onOpenChange={setShowDisableConfirm}
        title="Disable Promotion"
        description={`Are you sure you want to disable the promotion for the ${capitalize(plan.plan)} plan?`}
        confirmLabel="Disable"
        variant="destructive"
        isLoading={disablePromotion.isPending}
        onConfirm={handleDisablePromotion}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------
function PricingSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64" />
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-72" />
            <Skeleton className="h-10 w-72" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function PricingPage() {
  const { data: plans, isLoading } = usePricing();

  if (isLoading) return <PricingSkeleton />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">
          Pricing Configuration
        </h1>
        <p className="mt-1 text-muted-foreground">
          Manage subscription plans, pricing, and promotions.
        </p>
      </div>

      {plans && plans.length > 0 ? (
        plans.map((plan) => <PlanCard key={plan.plan} plan={plan} />)
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No pricing plans found.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
