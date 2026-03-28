import { theme } from "@/constants/theme";

export function Spinner({
  className = "",
  label = "Loading",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <div
      role="status"
      aria-label={label}
      className={`inline-block size-8 animate-spin rounded-full border-2 border-border border-t-accent ${className}`}
      style={{ animationDuration: theme.motion.base }}
    />
  );
}
