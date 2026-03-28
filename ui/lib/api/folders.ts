import type { FolderPublic } from "@/types/folder.types";

import { apiJson } from "./http";

export async function listFolders(token: string): Promise<FolderPublic[]> {
  return apiJson<FolderPublic[]>("/folders/", { token });
}

export async function createFolder(
  token: string,
  name: string,
): Promise<FolderPublic> {
  return apiJson<FolderPublic>("/folders/", {
    method: "POST",
    token,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
}

export async function updateFolder(
  token: string,
  folderId: string,
  name: string,
): Promise<FolderPublic> {
  return apiJson<FolderPublic>(`/folders/${folderId}`, {
    method: "PATCH",
    token,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
}

export async function deleteFolder(
  token: string,
  folderId: string,
): Promise<void> {
  await apiJson<void>(`/folders/${folderId}`, {
    method: "DELETE",
    token,
  });
}
