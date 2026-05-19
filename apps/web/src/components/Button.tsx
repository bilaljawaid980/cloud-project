import type { ButtonHTMLAttributes, PropsWithChildren, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const variantClassMap: Record<ButtonVariant, string> = {
  // Primary = the signature maroon gradient CTA
  primary: [
    "relative text-white border border-ember-700/60",
    "bg-[linear-gradient(180deg,#a8313a_0%,#7a1018_55%,#5c0c12_100%)]",
    "shadow-[0_1px_0_rgba(255,255,255,0.25)_inset,0_10px_28px_-8px_rgba(122,16,24,0.55),0_4px_12px_-2px_rgba(122,16,24,0.35)]",
    "hover:-translate-y-[1px] hover:brightness-[1.08]",
    "hover:shadow-[0_1px_0_rgba(255,255,255,0.3)_inset,0_16px_36px_-8px_rgba(122,16,24,0.7),0_6px_18px_-3px_rgba(168,49,58,0.5)]",
    "active:translate-y-0 active:brightness-95",
    "disabled:bg-none disabled:bg-ember-200 disabled:border-ember-200 disabled:text-white/80 disabled:shadow-none disabled:cursor-not-allowed disabled:translate-y-0"
  ].join(" "),
  // Secondary = solid ink (near-black) — classy contrast
  secondary: [
    "bg-ink text-white border border-ink",
    "shadow-[0_1px_0_rgba(255,255,255,0.10)_inset,0_8px_24px_-12px_rgba(26,13,13,0.55)]",
    "hover:-translate-y-[1px] hover:bg-ink-800",
    "active:translate-y-0",
    "disabled:bg-ink-300 disabled:border-ink-300 disabled:cursor-not-allowed disabled:translate-y-0"
  ].join(" "),
  // Ghost = warm white with hairline maroon border on hover
  ghost: [
    "bg-white/70 text-ink border border-ink/10",
    "shadow-[0_1px_0_rgba(255,255,255,0.85)_inset,0_1px_2px_rgba(26,13,13,0.04)]",
    "hover:bg-white hover:border-ember-700/30 hover:-translate-y-[1px] hover:text-ember-700",
    "active:translate-y-0",
    "disabled:text-ink-300 disabled:bg-white/40 disabled:cursor-not-allowed disabled:translate-y-0"
  ].join(" "),
  danger: [
    "text-ember-700 bg-ember-50 border border-ember-200",
    "hover:bg-ember-100 hover:border-ember-300 hover:-translate-y-[1px]",
    "active:translate-y-0",
    "disabled:text-ember-300 disabled:cursor-not-allowed disabled:translate-y-0"
  ].join(" ")
};

const sizeClassMap: Record<ButtonSize, string> = {
  sm: "h-9 px-3.5 text-[13px] gap-1.5 rounded-xl",
  md: "h-11 px-5 text-[14px] gap-2 rounded-xl",
  lg: "h-12 px-6 text-[15px] gap-2 rounded-xl"
};

export const Button = ({
  variant = "primary",
  size = "md",
  className = "",
  children,
  leftIcon,
  rightIcon,
  ...props
}: PropsWithChildren<ButtonProps>): JSX.Element => (
  <button
    className={`group inline-flex select-none items-center justify-center font-semibold tracking-tight transition-all duration-200 ease-out focus-ring ${sizeClassMap[size]} ${variantClassMap[variant]} ${className}`}
    {...props}
  >
    {leftIcon ? <span className="inline-flex shrink-0">{leftIcon}</span> : null}
    <span>{children}</span>
    {rightIcon ? <span className="inline-flex shrink-0">{rightIcon}</span> : null}
  </button>
);
