import { useEffect, useId, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLink } from "../app/AppLink";
import { routes } from "../app/routes";
import { cn } from "../shared/lib/cn";
import { Avatar } from "../shared/ui";
import { logoutCurrentAuthUser } from "./api";
import { getCabinetRouteForRole, getRoleLabel, getUserDisplayName } from "./session-utils";
import "./auth-account-menu.css";

function ChevronIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="m4 6 4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function AuthAccountMenu({
  user,
  className,
  triggerClassName,
  panelClassName,
  showText = true,
  avatarSize = "md",
  cabinetLabel = "Открыть кабинет",
  logoutLabel = "Выйти",
}) {
  const navigate = useNavigate();
  const rootRef = useRef(null);
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");

  const displayName = getUserDisplayName(user);
  const roleLabel = getRoleLabel(user?.role);
  const cabinetHref = getCabinetRouteForRole(user?.role);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  async function handleLogout() {
    if (loggingOut) {
      return;
    }

    setLoggingOut(true);
    setLogoutError("");

    try {
      await logoutCurrentAuthUser();
      setOpen(false);
      navigate(routes.home, { replace: true });
    } catch (error) {
      setLogoutError(error instanceof Error && error.message.trim() ? error.message : "Не удалось выйти из аккаунта.");
      setLoggingOut(false);
    }
  }

  return (
    <div ref={rootRef} className={cn("auth-account-menu", className)}>
      <button
        type="button"
        className={cn("auth-account-menu__trigger", open && "is-open", triggerClassName)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => {
          setLogoutError("");
          setOpen((current) => !current);
        }}
      >
        <Avatar
          name={displayName}
          size={avatarSize}
          className="auth-account-menu__avatar"
          aria-hidden="true"
        />
        {showText ? (
          <span className="auth-account-menu__meta">
            <strong>{displayName}</strong>
            <span>{roleLabel}</span>
          </span>
        ) : null}
        <span className="auth-account-menu__chevron" aria-hidden="true">
          <ChevronIcon />
        </span>
        <span className="ui-visually-hidden">Меню аккаунта</span>
      </button>

      {open ? (
        <div id={panelId} className={cn("auth-account-menu__panel", panelClassName)} role="menu">
          <div className="auth-account-menu__summary">
            <strong>{displayName}</strong>
            <span>{user?.email || roleLabel}</span>
          </div>

          <AppLink
            href={cabinetHref}
            className="auth-account-menu__action"
            role="menuitem"
            onClick={() => {
              setOpen(false);
            }}
          >
            {cabinetLabel}
          </AppLink>

          <button
            type="button"
            className="auth-account-menu__action auth-account-menu__action--danger"
            role="menuitem"
            disabled={loggingOut}
            onClick={() => {
              void handleLogout();
            }}
          >
            {loggingOut ? "Выходим..." : logoutLabel}
          </button>

          {logoutError ? <p className="auth-account-menu__error">{logoutError}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
