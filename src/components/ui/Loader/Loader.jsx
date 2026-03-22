import { cn } from "../../../lib/cn";

const sizeClassMap = {
  sm: "ui-loader--sm",
  md: "",
  lg: "ui-loader--lg",
};

const toneClassMap = {
  accent: "",
  neutral: "ui-loader--neutral",
  success: "ui-loader--success",
  warning: "ui-loader--warning",
};

export function Loader({
  label = "Loading",
  size = "md",
  inline = false,
  tone = "accent",
  surface = false,
  className,
  ...props
}) {
  return (
    <div
      className={cn("ui-loader", sizeClassMap[size], toneClassMap[tone], inline && "ui-loader--inline", surface && "ui-loader--surface", className)}
      role="status"
      aria-live="polite"
      {...props}
    >
      <span className="ui-loader__spinner" aria-hidden="true" />
      {label ? <span className="ui-loader__label">{label}</span> : null}
    </div>
  );
}
