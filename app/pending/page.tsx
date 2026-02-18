"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuthStore } from "@/lib/auth-store";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Clock, LogOut, RefreshCw } from "lucide-react";
import type { User } from "@/lib/types";

export default function PendingPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const setUser = useAuthStore((s) => s.setUser);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const [isChecking, setIsChecking] = useState(false);

  // If not authenticated, redirect to login
  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isInitialized, isAuthenticated, router]);

  // If already an admin, redirect to dashboard
  useEffect(() => {
    if (isInitialized && isAuthenticated && (user?.role === "admin" || user?.role === "super_admin")) {
      router.replace("/");
    }
  }, [isInitialized, isAuthenticated, user, router]);

  const handleCheckStatus = async () => {
    setIsChecking(true);
    try {
      // Force token refresh to get a new JWT with updated role
      await api.forceRefresh();
      const me = await api.fetch<User>("/auth/me");
      setUser(me);
      if (me.role === "admin" || me.role === "super_admin") {
        router.replace("/");
        return;
      }
    } catch {
      // Ignore errors
    }
    setIsChecking(false);
  };

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  if (!isInitialized || !isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-navy border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-col items-center gap-4 pb-2">
          <Image
            src="/images/logo.png"
            alt="Trucker's Routine"
            width={200}
            height={60}
            priority
          />
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange/10">
            <Clock className="h-8 w-8 text-orange" />
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-bold text-navy">
              Pending Admin Approval
            </h1>
            <p className="text-sm text-muted-foreground">
              Your account <span className="font-medium">{user?.email}</span> has
              been created successfully. You need admin privileges to access the
              dashboard.
            </p>
            <p className="text-sm text-muted-foreground">
              Please contact your administrator to get promoted.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              onClick={handleCheckStatus}
              className="w-full bg-navy text-cream hover:bg-navy/90"
              disabled={isChecking}
            >
              {isChecking ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Check Status
            </Button>

            <Button
              variant="outline"
              onClick={handleLogout}
              className="w-full"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
