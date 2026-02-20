"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { useAuthStore } from "@/lib/auth-store";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const googleLogin = useAuthStore((s) => s.googleLogin);
  const [error, setError] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleGoogleSuccess = async (response: CredentialResponse) => {
    if (!response.credential) {
      setError("Google sign-in failed: No credential received");
      return;
    }
    setError(null);
    setIsGoogleLoading(true);
    try {
      await googleLogin(response.credential);
      const user = useAuthStore.getState().user;
      if (user?.role === "admin" || user?.role === "super_admin") {
        router.push("/");
      } else {
        router.push("/pending");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in failed");
    } finally {
      setIsGoogleLoading(false);
    }
  };

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
          <p className="text-sm text-muted-foreground">Admin Dashboard</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Google Sign-In */}
          <div className="flex justify-center">
            {isGoogleLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Signing in with Google...
              </div>
            ) : (
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError("Google sign-in failed")}
                theme="outline"
                size="large"
                width={400}
                text="signin_with"
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
