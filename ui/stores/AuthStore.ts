import { makeAutoObservable, runInAction } from "mobx";

import { STORAGE_KEYS } from "@/constants/storage-keys";
import { fetchCurrentUser, loginRequest, registerRequest } from "@/lib/api/auth";
import type { LoginCredentials, RegisterPayload } from "@/types/auth.types";
import type { UserPublic } from "@/types/user.types";

import type { RootStore } from "./RootStore";

export class AuthStore {
  token: string | null = null;
  user: UserPublic | null = null;
  /** Client-only: true after reading localStorage (avoids SSR / flash). */
  hydrated = false;
  loading = false;
  error: string | null = null;

  constructor(_root: RootStore) {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  get isAuthenticated(): boolean {
    return this.token != null && this.token.length > 0;
  }

  hydrate(): void {
    if (typeof window === "undefined") {
      return;
    }
    const stored = localStorage.getItem(STORAGE_KEYS.accessToken);
    runInAction(() => {
      this.token = stored;
      this.hydrated = true;
    });
    if (stored) {
      void this.fetchUser();
    }
  }

  private persistToken(token: string | null): void {
    if (typeof window === "undefined") {
      return;
    }
    if (token) {
      localStorage.setItem(STORAGE_KEYS.accessToken, token);
    } else {
      localStorage.removeItem(STORAGE_KEYS.accessToken);
    }
  }

  async fetchUser(): Promise<void> {
    if (!this.token) {
      runInAction(() => {
        this.user = null;
      });
      return;
    }
    runInAction(() => {
      this.loading = true;
      this.error = null;
    });
    try {
      const user = await fetchCurrentUser(this.token);
      runInAction(() => {
        this.user = user;
      });
    } catch {
      runInAction(() => {
        this.token = null;
        this.user = null;
        this.persistToken(null);
      });
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  }

  async login(credentials: LoginCredentials): Promise<void> {
    runInAction(() => {
      this.loading = true;
      this.error = null;
    });
    try {
      const { access_token } = await loginRequest(credentials);
      runInAction(() => {
        this.token = access_token;
        this.persistToken(access_token);
      });
      await this.fetchUser();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Login failed";
      runInAction(() => {
        this.error = message;
      });
      throw e;
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  }

  async register(payload: RegisterPayload): Promise<void> {
    runInAction(() => {
      this.loading = true;
      this.error = null;
    });
    try {
      await registerRequest(payload);
      await this.login({
        email: payload.email,
        password: payload.password,
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Registration failed";
      runInAction(() => {
        this.error = message;
      });
      throw e;
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  }

  logout(): void {
    runInAction(() => {
      this.token = null;
      this.user = null;
      this.error = null;
      this.persistToken(null);
    });
  }
}
