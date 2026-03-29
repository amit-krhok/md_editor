import { defaultSlashCommands } from "./default-commands";
import type { SlashCommand } from "./types";

let extra: SlashCommand[] = [];

/** Append commands (e.g. at app startup). First registration of an `id` wins over later duplicates. */
export function registerSlashCommands(commands: SlashCommand[]): void {
  extra = [...extra, ...commands];
}

export function getSlashCommands(): SlashCommand[] {
  const seen = new Set<string>();
  const out: SlashCommand[] = [];
  for (const c of [...defaultSlashCommands, ...extra]) {
    if (seen.has(c.id)) continue;
    seen.add(c.id);
    out.push(c);
  }
  return out;
}

export function filterSlashCommands(
  query: string,
  all: SlashCommand[] = getSlashCommands(),
): SlashCommand[] {
  const q = query.trim().toLowerCase();
  if (!q) return all;
  return all.filter((cmd) => {
    if (cmd.id.toLowerCase().startsWith(q)) return true;
    if (cmd.title.toLowerCase().includes(q)) return true;
    return cmd.aliases?.some((a) => a.toLowerCase().startsWith(q)) ?? false;
  });
}
