import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { routes } from "../app/routes";
import { cn } from "../shared/lib/cn";
import { Button } from "../shared/ui";
import { logoutCurrentAuthUser } from "./api";

export function SessionLogoutButton({
  label = "Выйти из аккаунта",
  className,
  buttonClassName,
}) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogout() {
    if (loading) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      await logoutCurrentAuthUser();
      navigate(routes.home, { replace: true });
    } catch (logoutError) {
      setError(logoutError instanceof Error && logoutError.message.trim() ? logoutError.message : "Не удалось выйти из аккаунта.");
      setLoading(false);
    }
  }

  return (
    <div className={cn("session-logout-button", className)}>
      <Button
        type="button"
        variant="secondary"
        width="full"
        loading={loading}
        className={buttonClassName}
        onClick={() => {
          void handleLogout();
        }}
      >
        {label}
      </Button>
      {error ? <p className="session-logout-button__error">{error}</p> : null}
    </div>
  );
}
