import type { SlashCommand } from "./types";

function buildTableMarkdown(values: Record<string, string>): string {
  const rows = Math.min(
    50,
    Math.max(1, parseInt(values.rows ?? "2", 10) || 2),
  );
  const cols = Math.min(
    20,
    Math.max(1, parseInt(values.cols ?? "2", 10) || 2),
  );
  const cell = "   ";
  const header = `|${Array(cols).fill(cell).join("|")}|`;
  const sep = `|${Array(cols).fill("---").join("|")}|`;
  const bodyLines: string[] = [];
  for (let r = 1; r < rows; r++) {
    bodyLines.push(`|${Array(cols).fill(cell).join("|")}|`);
  }
  return [header, sep, ...bodyLines].join("\n") + "\n";
}

export const defaultSlashCommands: SlashCommand[] = [
  {
    id: "table",
    title: "Table",
    description: "GFM table with header row",
    aliases: ["grid"],
    fields: [
      {
        key: "rows",
        label: "Rows (including header)",
        placeholder: "e.g. 3",
        type: "number",
        defaultValue: "2",
        min: 1,
        max: 50,
        validate: (v) => {
          const n = parseInt(v.trim(), 10);
          if (Number.isNaN(n) || n < 1 || n > 50) {
            return "Enter a number from 1 to 50";
          }
          return null;
        },
      },
      {
        key: "cols",
        label: "Columns",
        placeholder: "e.g. 3",
        type: "number",
        defaultValue: "2",
        min: 1,
        max: 20,
        validate: (v) => {
          const n = parseInt(v.trim(), 10);
          if (Number.isNaN(n) || n < 1 || n > 20) {
            return "Enter a number from 1 to 20";
          }
          return null;
        },
      },
    ],
    buildMarkdown: buildTableMarkdown,
  },
  {
    id: "image",
    title: "Image",
    description: "Markdown image",
    aliases: ["img", "picture"],
    fields: [
      {
        key: "alt",
        label: "Alt text",
        placeholder: "Description",
        defaultValue: "image",
      },
      {
        key: "url",
        label: "Image URL",
        placeholder: "https://…",
        validate: (v) => {
          const t = v.trim();
          if (!t) return "URL is required";
          return null;
        },
      },
    ],
    buildMarkdown: (values) => {
      const alt = values.alt?.trim() || "image";
      const url = values.url?.trim() ?? "";
      return `![${alt.replace(/]/g, "\\]")}](${url})`;
    },
  },
  {
    id: "link",
    title: "Link",
    description: "Markdown link",
    aliases: ["url", "href"],
    fields: [
      {
        key: "text",
        label: "Link text",
        placeholder: "Visible label",
        defaultValue: "link",
      },
      {
        key: "url",
        label: "URL",
        placeholder: "https://… or /path",
        validate: (v) => {
          if (!v.trim()) return "URL is required";
          return null;
        },
      },
    ],
    buildMarkdown: (values) => {
      const text = values.text?.trim() || "link";
      const url = values.url?.trim() ?? "";
      return `[${text.replace(/]/g, "\\]")}](${url})`;
    },
  },
];
