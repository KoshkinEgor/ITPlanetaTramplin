import { forwardRef } from "react";
import { cn } from "../../../lib/cn";

const sizeClassMap = {
  sm: "ui-map-marker--sm",
  md: "ui-map-marker--md",
  lg: "ui-map-marker--lg",
};

export const MapMarker = forwardRef(function MapMarker(
  {
    as = "div",
    variant = "pin",
    tone = "orange",
    size = "md",
    label = "",
    count = 3,
    className,
    ariaLabel,
    type = "button",
    ...props
  },
  ref
) {
  const Element = as;
  const isButton = Element === "button";
  const isCluster = variant === "cluster";
  const resolvedAriaLabel = ariaLabel ?? (isCluster ? `Cluster marker: ${count}` : label || "Map marker");

  return (
    <Element
      ref={ref}
      className={cn(
        "ui-map-marker",
        isCluster ? "ui-map-marker--cluster" : "ui-map-marker--pin",
        sizeClassMap[size] ?? sizeClassMap.md,
        !isCluster && `ui-map-marker--${tone}`,
        label && !isCluster && "ui-map-marker--with-label",
        className
      )}
      type={isButton ? type : undefined}
      aria-label={resolvedAriaLabel}
      {...props}
    >
      {isCluster ? (
        <span className="ui-map-marker__cluster-count">{count}</span>
      ) : (
        <>
          <span className="ui-map-marker__pin" aria-hidden="true">
            <span className="ui-map-marker__pin-shape" />
          </span>
          {label ? <span className="ui-map-marker__label">{label}</span> : null}
        </>
      )}
    </Element>
  );
});
