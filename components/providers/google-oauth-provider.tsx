"use client";

import { GoogleOAuthProvider as Provider } from "@react-oauth/google";

const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

export function GoogleOAuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!clientId) {
    return <>{children}</>;
  }

  return <Provider clientId={clientId}>{children}</Provider>;
}
