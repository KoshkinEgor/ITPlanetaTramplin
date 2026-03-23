import { cn } from "../../../lib/cn";
import { SYSTEM_FEEDBACK_TONE_BY_KEY, resolveStatusTone } from "./statusMaps";

const toneClassMap = {
  info: "ui-status-badge--info",
  neutral: "ui-status-badge--neutral",
  warning: "ui-status-badge--warning",
  violet: "ui-status-badge--violet",
  lime: "ui-status-badge--lime",
  success: "ui-status-badge--success",
};

export function StatusBadge({
  label,
  tone,
  statusKey,
  className,
  children,
  ...props
}) {
  const resolvedTone = resolveStatusTone({ tone, statusKey });

  return (
    <span className={cn("ui-status-badge", toneClassMap[resolvedTone], className)} {...props}>
      <span>{label ?? children}</span>
    </span>
  );
}

export function FeedbackBadge({ stateKey, tone, className, ...props }) {
  const feedbackTone = tone ?? SYSTEM_FEEDBACK_TONE_BY_KEY[stateKey] ?? "neutral";

  return <StatusBadge tone={feedbackTone} className={cn("ui-status-badge--feedback", className)} {...props} />;
}
