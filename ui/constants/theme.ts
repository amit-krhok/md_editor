/**
 * Design tokens mirrored in `app/globals.css` (@theme).
 * Use these when you need the same values in TS (e.g. charts, inline styles).
 */
export const theme = {
  radius: {
    sm: "0.375rem",
    md: "0.5rem",
    lg: "0.75rem",
    full: "9999px",
  },
  spacing: {
    section: "2rem",
    pagePadding: "1.5rem",
    stack: "1rem",
  },
  motion: {
    fast: "150ms",
    base: "200ms",
  },
} as const;
