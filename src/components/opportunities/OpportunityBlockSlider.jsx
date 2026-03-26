import { useEffect, useRef, useState } from "react";
import { cn } from "../../lib/cn";
import { OpportunityBlockCard } from "./OpportunityCard";
import "./OpportunityBlockSlider.css";

const FEATURED_VARIANT = "leading-featured";
const RAISED_FEATURED_VARIANT = "raised-featured";
const FEATURED_VARIANTS = new Set([FEATURED_VARIANT, RAISED_FEATURED_VARIANT]);

function SliderArrowIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M4.166 10h11.667" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M10.833 4.167 15.833 10l-5 5.833" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

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
  const dragStateRef = useRef({
    active: false,
    pointerId: null,
    startX: 0,
    startScrollLeft: 0,
  });
  const [activeIndex, setActiveIndex] = useState(0);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(items.length > 1);
  const [isDragging, setIsDragging] = useState(false);
  const isInteractiveVariant = variant === RAISED_FEATURED_VARIANT;

  useEffect(() => {
    setActiveIndex(0);
    setCanScrollPrev(false);
    setCanScrollNext(items.length > 1);
  }, [items.length, variant]);

  useEffect(() => {
    if (!FEATURED_VARIANTS.has(variant)) {
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

        if (isInteractiveVariant) {
          const maxScrollLeft = Math.max(0, rail.scrollWidth - rail.clientWidth);
          setCanScrollPrev(rail.scrollLeft > 2);
          setCanScrollNext(rail.scrollLeft < maxScrollLeft - 2);
        }
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
  }, [isInteractiveVariant, items.length, variant]);

  const scrollToIndex = (nextIndex) => {
    const rail = railRef.current;

    if (!rail) {
      return;
    }

    const itemNodes = Array.from(rail.querySelectorAll("[data-opportunity-block-slider-item='true']"));

    if (!itemNodes.length) {
      return;
    }

    const clampedIndex = Math.max(0, Math.min(nextIndex, itemNodes.length - 1));
    const nextLeft = itemNodes[clampedIndex]?.offsetLeft ?? 0;

    setActiveIndex(clampedIndex);
    setCanScrollPrev(clampedIndex > 0);
    setCanScrollNext(clampedIndex < itemNodes.length - 1);

    if (typeof rail.scrollTo === "function") {
      rail.scrollTo({
        left: nextLeft,
        behavior: "smooth",
      });
      return;
    }

    rail.scrollLeft = nextLeft;
  };

  const stopDragging = (pointerId = null) => {
    const dragState = dragStateRef.current;

    if (!dragState.active) {
      return;
    }

    if (pointerId !== null && dragState.pointerId !== pointerId) {
      return;
    }

    dragState.active = false;
    dragState.pointerId = null;
    setIsDragging(false);
  };

  const handlePointerDown = (event) => {
    if (!isInteractiveVariant || event.pointerType !== "mouse" || event.button !== 0) {
      return;
    }

    if (event.target instanceof Element && event.target.closest("a, button, input, textarea, select, label")) {
      return;
    }

    const rail = railRef.current;

    if (!rail) {
      return;
    }

    dragStateRef.current = {
      active: true,
      pointerId: event.pointerId,
      startX: event.clientX,
      startScrollLeft: rail.scrollLeft,
    };

    setIsDragging(true);
    rail.setPointerCapture?.(event.pointerId);
    event.preventDefault();
  };

  const handlePointerMove = (event) => {
    if (!isInteractiveVariant) {
      return;
    }

    const rail = railRef.current;
    const dragState = dragStateRef.current;

    if (!rail || !dragState.active || dragState.pointerId !== event.pointerId) {
      return;
    }

    const delta = event.clientX - dragState.startX;
    rail.scrollLeft = dragState.startScrollLeft - delta;
  };

  return (
    <div
      className={cn(
        "opportunity-block-slider",
        `opportunity-block-slider--${variant}`,
        isInteractiveVariant && isDragging && "is-dragging",
        className
      )}
      style={{
        "--opportunity-block-slider-gap": gap,
        "--opportunity-block-slider-item-width": itemWidth,
        "--opportunity-block-slider-featured-width": featuredWidth,
      }}
      {...props}
    >
      {isInteractiveVariant ? (
        <div className="opportunity-block-slider__toolbar">
          <div className="opportunity-block-slider__controls" aria-label="Slider navigation">
            <button
              type="button"
              className="opportunity-block-slider__control opportunity-block-slider__control--prev"
              aria-label="Previous card"
              onClick={() => scrollToIndex(activeIndex - 1)}
              disabled={!canScrollPrev}
            >
              <SliderArrowIcon />
            </button>
            <button
              type="button"
              className="opportunity-block-slider__control opportunity-block-slider__control--next"
              aria-label="Next card"
              onClick={() => scrollToIndex(activeIndex + 1)}
              disabled={!canScrollNext}
            >
              <SliderArrowIcon />
            </button>
          </div>
        </div>
      ) : null}

      <div
        ref={railRef}
        className="opportunity-block-slider__rail"
        role={ariaLabel ? "region" : undefined}
        aria-label={ariaLabel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={(event) => stopDragging(event.pointerId)}
        onPointerCancel={(event) => stopDragging(event.pointerId)}
        onLostPointerCapture={(event) => stopDragging(event.pointerId)}
      >
        {items.map((item, index) => {
          const isActive = FEATURED_VARIANTS.has(variant) && index === activeIndex;
          const extraCardProps = cardPropsBuilder?.(item, index) ?? {};
          const { className: extraCardClassName, detailAction, ...restCardProps } = extraCardProps;
          const resolvedDetailAction = detailAction
            ? { ...detailAction, width: detailAction.width ?? "full" }
            : detailAction;

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
                className={cn("opportunity-block-slider__card", cardClassName, extraCardClassName)}
                detailAction={resolvedDetailAction}
                {...restCardProps}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
