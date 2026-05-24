import { useState } from "react";
import { getMessagesRouteForRole } from "../api/chats";
import { useAuthSession } from "../auth/api";
import { Button, Modal } from "../shared/ui";
import { ChatApp } from "./ChatApp";

export function ChatDrawerTrigger({ className, children }) {
  const [open, setOpen] = useState(false);
  const authSession = useAuthSession();
  const role = authSession.status === "authenticated" ? authSession.user?.role : "";

  return (
    <>
      <button type="button" className={className} aria-label="Сообщения" aria-haspopup="dialog" onClick={() => setOpen(true)}>
        {children}
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Сообщения"
        description="Быстрый ответ без выхода из текущего раздела."
        size="lg"
        closeLabel="Закрыть сообщения"
        actions={(
          <Button href={getMessagesRouteForRole(role)} variant="secondary">
            Открыть страницу сообщений
          </Button>
        )}
      >
        <ChatApp compact />
      </Modal>
    </>
  );
}
