import { RefreshResponse } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

type SessionExpiredListener = () => void;

class ApiClient {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private refreshPromise: Promise<boolean> | null = null;
  private sessionExpiredListeners: SessionExpiredListener[] = [];

  constructor() {
    if (typeof window !== "undefined") {
      this.refreshToken = localStorage.getItem("refresh_token");
    }
  }

  onSessionExpired(listener: SessionExpiredListener) {
    this.sessionExpiredListeners.push(listener);
    return () => {
      this.sessionExpiredListeners = this.sessionExpiredListeners.filter(
        (l) => l !== listener
      );
    };
  }

  private notifySessionExpired() {
    this.sessionExpiredListeners.forEach((l) => l());
  }

  setTokens(access: string, refresh: string) {
    this.accessToken = access;
    this.refreshToken = refresh;
    if (typeof window !== "undefined") {
      localStorage.setItem("refresh_token", refresh);
    }
  }

  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    if (typeof window !== "undefined") {
      localStorage.removeItem("refresh_token");
    }
  }

  getAccessToken() {
    return this.accessToken;
  }

  hasRefreshToken() {
    return !!this.refreshToken;
  }

  async forceRefresh(): Promise<boolean> {
    if (!this.refreshToken) return false;
    return this.doRefresh();
  }

  async fetch<T = unknown>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    // If we have a refresh token but no access token, refresh first
    if (!this.accessToken && this.refreshToken) {
      await this.tryRefresh();
    }

    const res = await this.rawFetch(path, options);

    // Handle both 401 and 403 as auth failures that can be retried
    if ((res.status === 401 || res.status === 403) && this.refreshToken) {
      const refreshed = await this.tryRefresh();
      if (refreshed) {
        const retryRes = await this.rawFetch(path, options);
        if (!retryRes.ok) {
          const error = await retryRes.json().catch(() => ({ detail: "Request failed" }));
          throw new ApiError(retryRes.status, error.detail || "Request failed");
        }
        return retryRes.json() as Promise<T>;
      }
      // Refresh failed — session is expired
      this.clearTokens();
      this.notifySessionExpired();
      throw new ApiError(401, "Session expired");
    }

    // Handle 401/403 when there's no refresh token at all
    if (res.status === 401 || res.status === 403) {
      this.clearTokens();
      this.notifySessionExpired();
      throw new ApiError(res.status, "Session expired");
    }

    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: "Request failed" }));
      throw new ApiError(res.status, error.detail || "Request failed");
    }

    if (res.status === 204) {
      return undefined as T;
    }

    return res.json() as Promise<T>;
  }

  private async rawFetch(path: string, options: RequestInit = {}) {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (this.accessToken) {
      headers["Authorization"] = `Bearer ${this.accessToken}`;
    }

    return fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });
  }

  private async tryRefresh(): Promise<boolean> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.doRefresh();
    const result = await this.refreshPromise;
    this.refreshPromise = null;
    return result;
  }

  private async doRefresh(): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: this.refreshToken }),
      });

      if (!res.ok) return false;

      const data: RefreshResponse = await res.json();
      this.setTokens(data.access_token, data.refresh_token);
      return true;
    } catch {
      return false;
    }
  }
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// Singleton instance
export const api = new ApiClient();
