import { cn } from "../../../lib/cn";

const toneClassMap = {
  accent: "ui-tag-token--accent",
  soft: "ui-tag-token--soft",
};

export function Tag({
  as = "span",
  href,
  tone = "default",
  className,
  children,
  ...props
}) {
  const Element = href ? "a" : as;
  const toneClassName = toneClassMap[tone];

  return (
    <Element className={cn("ui-tag-token", toneClassName, className)} href={href} {...props}>
      <span>{children}</span>
    </Element>
  );
}
