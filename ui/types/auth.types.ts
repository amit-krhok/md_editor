import type { UserPublic } from "./user.types";

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
}

export interface AuthStateSnapshot {
  token: string | null;
  user: UserPublic | null;
  hydrated: boolean;
}
