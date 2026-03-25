import { forwardRef } from "react";
import { Link } from "react-router-dom";
import { isInternalRouteHref } from "./routes";

export const AppLink = forwardRef(function AppLink({ href, to, ...props }, ref) {
  const target = to ?? href;

  if (typeof target === "string" && isInternalRouteHref(target)) {
    return <Link ref={ref} to={target} {...props} />;
  }

  return <a ref={ref} href={target} {...props} />;
});
