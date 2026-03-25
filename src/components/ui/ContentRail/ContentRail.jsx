import { Children, forwardRef } from "react";
import { cn } from "../../../lib/cn";
import "./ContentRail.css";

export const ContentRail = forwardRef(function ContentRail(
  { as = "section", ariaLabel, itemWidth = "320px", gap = "16px", className, children, ...props },
  ref
) {
  const Element = as;
  const items = Children.toArray(children).filter(Boolean);

  return (
    <Element
      ref={ref}
      className={cn("ui-content-rail", className)}
      style={{ "--ui-content-rail-item-width": itemWidth, "--ui-content-rail-gap": gap }}
      role={ariaLabel ? "region" : undefined}
      aria-label={ariaLabel}
      {...props}
    >
      {items.map((item, index) => (
        <div key={index} className="ui-content-rail__item">
          {item}
        </div>
      ))}
    </Element>
  );
});
