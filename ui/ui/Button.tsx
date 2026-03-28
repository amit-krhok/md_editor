import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost";

const variantClass: Record<Variant, string> = {
  primary: "app-btn--primary",
  secondary: "app-btn--secondary",
  ghost: "app-btn--ghost",
};

export function Button({
  variant = "primary",
  type = "button",
  className = "",
  children,
  disabled,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  children: ReactNode;
}) {
  const mergedClass = ["app-btn", variantClass[variant], className]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      {...rest}
      type={type}
      disabled={disabled}
      className={mergedClass}
    >
      {children}
    </button>
  );
}
