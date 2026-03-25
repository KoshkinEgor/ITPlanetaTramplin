import { cn } from "../../../lib/cn";

const toneClassMap = {
  default: "ui-tag-token--tone-default",
  accent: "ui-tag-token--tone-accent ui-tag-token--accent",
  soft: "ui-tag-token--tone-soft ui-tag-token--soft",
  neutral: "ui-tag-token--tone-neutral",
  lime: "ui-tag-token--tone-lime",
  success: "ui-tag-token--tone-success",
  warning: "ui-tag-token--tone-warning",
};

const variantClassMap = {
  surface: "ui-tag-token--variant-surface",
  soft: "ui-tag-token--variant-soft",
  solid: "ui-tag-token--variant-solid",
  outline: "ui-tag-token--variant-outline",
  ghost: "ui-tag-token--variant-ghost",
};

const sizeClassMap = {
  sm: "ui-tag-token--sm",
  md: "ui-tag-token--md",
  lg: "ui-tag-token--lg",
};

function resolveVariant(tone, variant) {
  if (variant) {
    return variant;
  }

  if (tone === "accent" || tone === "soft") {
    return "soft";
  }

  if (tone === "neutral" || tone === "lime" || tone === "success" || tone === "warning") {
    return "solid";
  }

  return "surface";
}

export function Tag({
  as = "span",
  href,
  tone = "default",
  variant,
  size = "md",
  className,
  children,
  ...props
}) {
  const Element = href ? "a" : as;
  const resolvedTone = toneClassMap[tone] ?? toneClassMap.default;
  const resolvedVariant = resolveVariant(tone, variant);
  const variantClassName = variantClassMap[resolvedVariant] ?? variantClassMap.surface;
  const sizeClassName = sizeClassMap[size] ?? sizeClassMap.md;

  return (
    <Element className={cn("ui-tag-token", resolvedTone, variantClassName, sizeClassName, className)} href={href} {...props}>
      <span>{children}</span>
    </Element>
  );
}
