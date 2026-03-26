import { useEffect, useRef, useState } from "react";
import { cn } from "../../lib/cn";
import { OpportunityBlockCard } from "./OpportunityCard";
import "./OpportunityBlockSlider.css";

const FEATURED_VARIANT = "leading-featured";

function getClosestItemIndex(rail) {
  const items = Array.from(rail.querySelectorAll("[data-opportunity-block-slider-item='true']"));

  if (!items.length) {
    return 0;
  }

  const leftEdge = rail.scrollLeft;
  let closestIndex = 0;
  let closestDistance = Number.POSITIVE_INFINITY;

  items.forEach((item, index) => {
    const distance = Math.abs(item.offsetLeft - leftEdge);

    if (distance < closestDistance) {
      closestIndex = index;
      closestDistance = distance;
    }
  });

  return closestIndex;
}

export function OpportunityBlockSlider({
  items = [],
  variant = "uniform",
  ariaLabel,
  className,
  surface = "plain",
  size = "md",
  featuredSize = "lg",
  itemWidth = "392px",
  featuredWidth = "468px",
  gap = "14px",
  cardClassName,
  cardPropsBuilder,
  ...props
}) {
  const railRef = useRef(null);
  const frameRef = useRef(0);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setActiveIndex(0);
  }, [items.length, variant]);

  useEffect(() => {
    if (variant !== FEATURED_VARIANT) {
      return undefined;
    }

    const rail = railRef.current;

    if (!rail) {
      return undefined;
    }

    const updateActiveIndex = () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }

      frameRef.current = requestAnimationFrame(() => {
        setActiveIndex(getClosestItemIndex(rail));
      });
    };

    updateActiveIndex();
    rail.addEventListener("scroll", updateActiveIndex, { passive: true });
    window.addEventListener("resize", updateActiveIndex);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }

      rail.removeEventListener("scroll", updateActiveIndex);
      window.removeEventListener("resize", updateActiveIndex);
    };
  }, [items.length, variant]);

  return (
    <div
      className={cn("opportunity-block-slider", `opportunity-block-slider--${variant}`, className)}
      style={{
        "--opportunity-block-slider-gap": gap,
        "--opportunity-block-slider-item-width": itemWidth,
        "--opportunity-block-slider-featured-width": featuredWidth,
      }}
      {...props}
    >
      <div ref={railRef} className="opportunity-block-slider__rail" role={ariaLabel ? "region" : undefined} aria-label={ariaLabel}>
        {items.map((item, index) => {
          const isActive = variant === FEATURED_VARIANT && index === activeIndex;
          const extraCardProps = cardPropsBuilder?.(item, index) ?? {};

          return (
            <div
              key={item?.id ?? item?.title ?? index}
              className={cn("opportunity-block-slider__item", isActive && "is-active")}
              data-opportunity-block-slider-item="true"
            >
              <OpportunityBlockCard
                item={item}
                surface={surface}
                size={isActive ? featuredSize : size}
                className={cn("opportunity-block-slider__card", cardClassName, extraCardProps.className)}
                {...extraCardProps}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
