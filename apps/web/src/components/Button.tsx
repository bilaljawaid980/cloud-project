import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const variantClassMap: Record<ButtonVariant, string> = {
  primary:
    "bg-ink text-white hover:-translate-y-0.5 hover:bg-slate-900 disabled:bg-slate-400 disabled:transform-none",
  secondary:
    "bg-ember text-white hover:-translate-y-0.5 hover:bg-orange-500 disabled:bg-orange-300 disabled:transform-none",
  ghost:
    "bg-white text-ink ring-1 ring-ink/10 hover:-translate-y-0.5 hover:bg-slate-50 disabled:text-slate-400 disabled:transform-none"
};

export const Button = ({
  variant = "primary",
  className = "",
  children,
  ...props
}: PropsWithChildren<ButtonProps>): JSX.Element => (
  <button
    className={`inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition ${variantClassMap[variant]} ${className}`}
    {...props}
  >
    {children}
  </button>
);
