import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  createChatConnection,
  getChatMessages,
  getChatThreads,
  getChatThread,
  markChatRead,
  sendChatMessage,
} from "../api/chats";
import { useAuthSession } from "../auth/api";
import { cn } from "../shared/lib/cn";
import { Alert, Avatar, Button, EmptyState, Loader, Textarea } from "../shared/ui";
import "./chat.css";

function normalizeArray(value) {
  return Array.isArray(value) ? value : [];
}

function getParticipantName(participant) {
  return participant?.displayName || participant?.email || "Участник";
}

function formatMessageTime(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getCounterparty(thread, currentUserId) {
  const participants = normalizeArray(thread?.participants);
  return participants.find((item) => item.userId !== currentUserId) ?? participants[0] ?? null;
}

function mergeThread(threads, nextThread) {
  if (!nextThread?.id) {
    return threads;
  }

  const withoutThread = threads.filter((item) => item.id !== nextThread.id);
  return [nextThread, ...withoutThread].sort((left, right) => {
    const leftTime = new Date(left.lastMessageAt || left.updatedAt || left.createdAt || 0).getTime();
    const rightTime = new Date(right.lastMessageAt || right.updatedAt || right.createdAt || 0).getTime();
    return rightTime - leftTime;
  });
}

function ChatThreadButton({ thread, active, currentUserId, onSelect }) {
  const counterparty = getCounterparty(thread, currentUserId);
  const lastMessage = thread.lastMessage?.body || "Диалог создан";
  const unreadCount = Number(thread.unreadCount) || 0;

  return (
    <button
      type="button"
      className={cn("chat-thread", active && "is-active")}
      onClick={() => onSelect(thread.id)}
    >
      <Avatar name={getParticipantName(counterparty)} src={counterparty?.avatarUrl} size="sm" />
      <span className="chat-thread__copy">
        <span className="chat-thread__top">
          <strong>{getParticipantName(counterparty)}</strong>
          <span>{formatMessageTime(thread.lastMessageAt)}</span>
        </span>
        <span className="chat-thread__bottom">
          <span>{lastMessage}</span>
          {unreadCount ? <b>{unreadCount}</b> : null}
        </span>
      </span>
    </button>
  );
}

function ChatMessage({ message, own }) {
  return (
    <article className={cn("chat-message", own && "chat-message--own")}>
      <div className="chat-message__bubble">
        <p>{message.body}</p>
        <time dateTime={message.createdAt}>{formatMessageTime(message.createdAt)}</time>
      </div>
    </article>
  );
}

export function ChatApp({ compact = false, className }) {
  const authSession = useAuthSession();
  const currentUser = authSession.status === "authenticated" ? authSession.user : null;
  const [searchParams, setSearchParams] = useSearchParams();
  const threadFromSearch = Number(searchParams.get("thread")) || null;
  const [threadsState, setThreadsState] = useState({ status: "loading", items: [], error: null });
  const [messagesState, setMessagesState] = useState({ status: "idle", items: [], error: null });
  const [selectedThreadId, setSelectedThreadId] = useState(threadFromSearch);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const connectionRef = useRef(null);
  const selectedThreadIdRef = useRef(selectedThreadId);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const lastThreadIdRef = useRef(selectedThreadId);

  useEffect(() => {
    selectedThreadIdRef.current = selectedThreadId;
  }, [selectedThreadId]);

  useEffect(() => {
    setSelectedThreadId(threadFromSearch);
  }, [threadFromSearch]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadThreads() {
      try {
        const response = await getChatThreads(controller.signal);
        let items = normalizeArray(response);

        // Fetch selected thread if it is not in the list
        const hasSelected = selectedThreadIdRef.current && items.some((t) => t.id === selectedThreadIdRef.current);
        if (selectedThreadIdRef.current && !hasSelected) {
          try {
            const singleThread = await getChatThread(selectedThreadIdRef.current, controller.signal);
            if (singleThread?.id) {
              items = [singleThread, ...items];
            }
          } catch (e) {
            console.error("Failed to load selected thread details", e);
          }
        }

        setThreadsState({ status: "ready", items, error: null });
        if (!selectedThreadIdRef.current && items[0]?.id) {
          selectThread(items[0].id, false);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setThreadsState({ status: "error", items: [], error });
        }
      }
    }

    loadThreads();
    return () => controller.abort();
  }, [currentUser?.id]);

  useEffect(() => {
    if (!selectedThreadId) {
      setMessagesState({ status: "idle", items: [], error: null });
      return undefined;
    }

    const controller = new AbortController();

    async function loadMessages() {
      try {
        setMessagesState((current) => ({ ...current, status: "loading", error: null }));
        const response = await getChatMessages(selectedThreadId, { take: compact ? 60 : 120 }, controller.signal);
        setMessagesState({ status: "ready", items: normalizeArray(response), error: null });
        await markChatRead(selectedThreadId).catch(() => {});
        setThreadsState((current) => ({
          ...current,
          items: current.items.map((t) =>
            t.id === selectedThreadId ? { ...t, unreadCount: 0 } : t
          ),
        }));
      } catch (error) {
        if (!controller.signal.aborted) {
          setMessagesState({ status: "error", items: [], error });
        }
      }
    }

    loadMessages();
    return () => controller.abort();
  }, [compact, selectedThreadId]);

  useEffect(() => {
    if (!currentUser) {
      return undefined;
    }

    const connection = createChatConnection();
    connectionRef.current = connection;

    connection.on("ThreadUpdated", (thread) => {
      setThreadsState((current) => ({
        status: current.status === "loading" ? "ready" : current.status,
        items: mergeThread(current.items, thread),
        error: current.error,
      }));
    });

    connection.on("MessageCreated", (message) => {
      if (message.threadId !== selectedThreadIdRef.current) {
        return;
      }

      setMessagesState((current) => {
        if (current.items.some((item) => item.id === message.id)) {
          return current;
        }

        return {
          status: "ready",
          items: [...current.items, message],
          error: null,
        };
      });

      if (message.senderUserId !== currentUser?.id) {
        void markChatRead(message.threadId).catch(() => {});
      }
    });

    connection.onreconnected(() => {
      if (selectedThreadIdRef.current) {
        connection.invoke("JoinThread", selectedThreadIdRef.current).catch(() => {});
      }
    });

    connection.start()
      .then(() => {
        if (selectedThreadIdRef.current) {
          return connection.invoke("JoinThread", selectedThreadIdRef.current);
        }

        return null;
      })
      .catch(() => {});

    return () => {
      connectionRef.current = null;
      connection.stop().catch(() => {});
    };
  }, [currentUser]);

  useEffect(() => {
    const connection = connectionRef.current;
    if (!connection || !selectedThreadId) {
      return undefined;
    }

    connection.invoke("JoinThread", selectedThreadId).catch(() => {});
    return () => {
      connection.invoke("LeaveThread", selectedThreadId).catch(() => {});
    };
  }, [selectedThreadId]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) {
      return;
    }

    const isThreadSwitch = lastThreadIdRef.current !== selectedThreadId;
    lastThreadIdRef.current = selectedThreadId;

    const lastMessage = messagesState.items[messagesState.items.length - 1];
    const isOwnMessage = lastMessage?.senderUserId === currentUser?.id;
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150;

    if (isThreadSwitch || isOwnMessage || isNearBottom) {
      messagesEndRef.current?.scrollIntoView({ block: "end" });
    }
  }, [messagesState.items.length, selectedThreadId, currentUser?.id]);

  const selectedThread = useMemo(
    () => threadsState.items.find((item) => item.id === selectedThreadId) ?? null,
    [selectedThreadId, threadsState.items]
  );
  const selectedCounterparty = getCounterparty(selectedThread, currentUser?.id);

  function selectThread(threadId, updateUrl = true) {
    setSelectedThreadId(threadId);
    if (updateUrl && !compact) {
      setSearchParams(threadId ? { thread: String(threadId) } : {});
    }
  }

  function handleKeyDown(event) {
    if (event.key === "Enter" && event.ctrlKey) {
      event.preventDefault();
      void handleSubmit(event);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const body = draft.trim();
    if (!body || !selectedThreadId || sending) {
      return;
    }

    setSending(true);
    setDraft("");

    try {
      const connection = connectionRef.current;
      if (connection?.state === "Connected") {
        await connection.invoke("SendMessage", selectedThreadId, body);
      } else {
        const result = await sendChatMessage(selectedThreadId, { body });
        setThreadsState((current) => ({ ...current, items: mergeThread(current.items, result.thread) }));
        setMessagesState((current) => ({
          status: "ready",
          items: current.items.some((item) => item.id === result.message.id) ? current.items : [...current.items, result.message],
          error: null,
        }));
      }
    } catch (error) {
      setDraft(body);
      setMessagesState((current) => ({ ...current, status: current.status === "idle" ? "ready" : current.status, error }));
    } finally {
      setSending(false);
    }
  }

  if (authSession.status === "loading" || authSession.status === "idle") {
    return <Loader label="Загружаем сообщения" surface />;
  }

  if (!currentUser) {
    return <EmptyState title="Нужно войти" description="Сообщения доступны после авторизации." tone="warning" />;
  }

  return (
    <section className={cn("chat-app", compact && "chat-app--compact", selectedThreadId && "has-selected-thread", className)} data-testid="chat-app">
      <aside className="chat-app__threads" aria-label="Диалоги">
        <div className="chat-app__threads-head">
          <span>Сообщения</span>
          <strong>{threadsState.items.length}</strong>
        </div>

        {threadsState.status === "loading" ? <Loader label="Загружаем диалоги" surface /> : null}
        {threadsState.status === "error" ? (
          <Alert tone="error" title="Не удалось загрузить диалоги" showIcon>
            {threadsState.error?.message ?? "Попробуйте обновить страницу."}
          </Alert>
        ) : null}
        {threadsState.status === "ready" && !threadsState.items.length ? (
          <EmptyState title="Диалогов пока нет" description="Они появятся после отклика, контакта или сообщения от модератора." />
        ) : null}

        <div className="chat-app__thread-list">
          {threadsState.items.map((thread) => (
            <ChatThreadButton
              key={thread.id}
              thread={thread}
              active={thread.id === selectedThreadId}
              currentUserId={currentUser.id}
              onSelect={selectThread}
            />
          ))}
        </div>
      </aside>

      <div className="chat-app__conversation">
        {selectedThread ? (
          <>
            <header className="chat-app__conversation-head">
              <Button
                type="button"
                variant="ghost"
                className="chat-app__mobile-back-button"
                onClick={() => selectThread(null)}
              >
                ← Назад
              </Button>
              <Avatar name={getParticipantName(selectedCounterparty)} src={selectedCounterparty?.avatarUrl} />
              <div>
                <strong>{getParticipantName(selectedCounterparty)}</strong>
                <span>{selectedCounterparty?.role === "company" ? "Компания" : selectedCounterparty?.role === "moderator" ? "Модератор" : "Пользователь"}</span>
              </div>
            </header>

            <div ref={messagesContainerRef} className="chat-app__messages" aria-live="polite">
              {messagesState.status === "loading" ? <Loader label="Загружаем историю" surface /> : null}
              {messagesState.error ? (
                <Alert tone="error" title="Сообщение не отправлено" showIcon>
                  {messagesState.error?.message ?? "Попробуйте еще раз."}
                </Alert>
              ) : null}
              {messagesState.status === "ready" && !messagesState.items.length ? (
                <EmptyState title="Начните переписку" description="Первое сообщение будет видно всем участникам диалога." />
              ) : null}
              {messagesState.items.map((message) => (
                <ChatMessage key={message.id} message={message} own={message.senderUserId === currentUser.id} />
              ))}
              <div ref={messagesEndRef} />
            </div>

            <form className="chat-app__composer" onSubmit={handleSubmit}>
              <Textarea
                value={draft}
                onValueChange={setDraft}
                placeholder={sending ? "Отправка сообщения..." : "Напишите сообщение"}
                maxLength={4000}
                autoResize
                rows={compact ? 2 : 3}
                disabled={sending}
                onKeyDown={handleKeyDown}
              />
              <Button type="submit" loading={sending} disabled={!draft.trim()}>
                Отправить
              </Button>
            </form>
          </>
        ) : (
          <div className="chat-app__empty">
            <EmptyState title="Выберите диалог" description="История и быстрый ответ откроются справа." />
          </div>
        )}
      </div>
    </section>
  );
}
