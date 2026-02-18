"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { api } from "@/lib/api";

export function AuthProvider({ children }: { children: ReactNode }) {
  const initialize = useAuthStore((s) => s.initialize);
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const router = useRouter();

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Listen for session expiration from the API client
  useEffect(() => {
    const unsubscribe = api.onSessionExpired(() => {
      const state = useAuthStore.getState();
      if (state.isAuthenticated) {
        useAuthStore.setState({
          user: null,
          isAuthenticated: false,
        });
      }
      router.replace("/login");
    });

    return unsubscribe;
  }, [router]);

  // Redirect to login if not authenticated after initialization
  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      const publicRoutes = ["/login", "/pending"];
      const isPublic = publicRoutes.some((route) =>
        window.location.pathname.startsWith(route)
      );
      if (!isPublic) {
        router.replace("/login");
      }
    }
  }, [isInitialized, isAuthenticated, router]);

  if (!isInitialized) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-navy border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
