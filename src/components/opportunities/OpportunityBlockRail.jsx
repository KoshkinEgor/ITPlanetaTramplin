import { cn } from "../../lib/cn";
import { OpportunityBlockCard } from "./OpportunityCard";
import "./OpportunityBlockRail.css";

export function OpportunityBlockRail({
  items = [],
  ariaLabel,
  className,
  itemClassName,
  cardClassName,
  surface = "panel",
  size = "md",
  cardPropsBuilder,
  renderItem,
  ...props
}) {
  return (
    <div
      className={cn("opportunity-block-rail", className)}
      role={ariaLabel ? "region" : undefined}
      aria-label={ariaLabel}
      {...props}
    >
      {items.map((item, index) => {
        const extraCardProps = cardPropsBuilder?.(item, index) ?? {};
        const { className: extraCardClassName, detailAction, ...restCardProps } = extraCardProps;
        const resolvedDetailAction = detailAction
          ? { ...detailAction, width: detailAction.width ?? "full" }
          : detailAction;
        const resolvedCardClassName = cn("opportunity-block-rail__card", cardClassName, extraCardClassName);
        const renderedItem = renderItem?.(item, index, {
          className: resolvedCardClassName,
          cardProps: {
            ...restCardProps,
            detailAction: resolvedDetailAction,
          },
        });

        return (
          <div
            key={item?.id ?? item?.title ?? index}
            className={cn("opportunity-block-rail__item", itemClassName)}
          >
            {renderedItem ?? (
              <OpportunityBlockCard
                item={item}
                surface={surface}
                size={size}
                className={resolvedCardClassName}
                detailAction={resolvedDetailAction}
                {...restCardProps}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
