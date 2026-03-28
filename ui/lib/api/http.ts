import { getApiBaseUrl } from "./config";
import type { ApiErrorBody } from "@/types/api.types";

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function formatDetail(detail: ApiErrorBody["detail"]): string {
  if (detail == null) return "Request failed";
  if (Array.isArray(detail)) return detail.join("; ");
  return String(detail);
}

async function parseErrorMessage(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as ApiErrorBody;
    return formatDetail(body.detail);
  } catch {
    return res.statusText || "Request failed";
  }
}

/** Consume body on failure; return same response if ok. */
export async function throwIfNotOk(res: Response): Promise<Response> {
  if (res.ok) {
    return res;
  }
  throw new ApiError(res.status, await parseErrorMessage(res));
}

export async function apiFetch(
  path: string,
  init: RequestInit & { token?: string | null } = {},
): Promise<Response> {
  const { token, headers: inputHeaders, ...rest } = init;
  const headers = new Headers(inputHeaders);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  const url = `${getApiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
  return fetch(url, { ...rest, headers });
}

export async function apiJson<T>(
  path: string,
  init: RequestInit & { token?: string | null } = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }
  const res = await apiFetch(path, { ...init, headers });
  if (!res.ok) {
    throw new ApiError(res.status, await parseErrorMessage(res));
  }
  if (res.status === 204) {
    return undefined as T;
  }
  return res.json() as Promise<T>;
}
