import type { LoginCredentials, RegisterPayload, TokenResponse } from "@/types/auth.types";
import type { UserPublic } from "@/types/user.types";

import { apiFetch, apiJson, throwIfNotOk } from "./http";

export async function loginRequest(
  credentials: LoginCredentials,
): Promise<TokenResponse> {
  const body = new URLSearchParams();
  body.set("username", credentials.email);
  body.set("password", credentials.password);
  const res = await throwIfNotOk(
    await apiFetch("/auth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    }),
  );
  return res.json() as Promise<TokenResponse>;
}

export async function registerRequest(
  payload: RegisterPayload,
): Promise<UserPublic> {
  return apiJson<UserPublic>("/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: payload.email,
      password: payload.password,
    }),
  });
}

export async function fetchCurrentUser(token: string): Promise<UserPublic> {
  return apiJson<UserPublic>("/users/me", { token });
}
