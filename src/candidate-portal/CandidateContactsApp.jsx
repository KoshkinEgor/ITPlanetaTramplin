import { useEffect, useMemo, useState } from "react";
import { getCandidateContacts } from "../api/candidate";
import { ApiError } from "../lib/http";
import { Alert, Card, EmptyState, Loader } from "../shared/ui";
import { mapContactToCard } from "./mappers";
import { CandidateContactCard, CandidateSearchBar, CandidateSectionHeader } from "./shared";

export function CandidateContactsApp() {
  const [state, setState] = useState({ status: "loading", contacts: [], error: null });
  const [query, setQuery] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const contacts = await getCandidateContacts(controller.signal);

        setState({
          status: "ready",
          contacts: Array.isArray(contacts) ? contacts : [],
          error: null,
        });
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setState({
          status: error instanceof ApiError && error.status === 401 ? "unauthorized" : "error",
          contacts: [],
          error,
        });
      }
    }

    load();
    return () => controller.abort();
  }, []);

  const visibleItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const items = state.contacts.map(mapContactToCard);

    if (!normalizedQuery) {
      return items;
    }

    return items.filter((item) => `${item.name} ${item.summary} ${item.tags.join(" ")}`.toLowerCase().includes(normalizedQuery));
  }, [query, state.contacts]);

  return (
    <section className="candidate-page-section">
      <CandidateSectionHeader title="Контакты" />

      {state.status === "loading" ? <Loader label="Загружаем контакты" surface /> : null}

      {state.status === "unauthorized" ? (
        <Card>
          <EmptyState
            eyebrow="Доступ ограничен"
            title="Нужно войти как кандидат"
            description="Контакты доступны только авторизованному кандидату."
            tone="warning"
          />
        </Card>
      ) : null}

      {state.status === "error" ? (
        <Alert tone="error" title="Не удалось загрузить контакты" showIcon>
          {state.error?.message ?? "Попробуйте обновить страницу позже."}
        </Alert>
      ) : null}

      {state.status === "ready" ? (
        <>
          <CandidateSearchBar value={query} onChange={setQuery} placeholder="Поиск контактов" />

          {visibleItems.length ? (
            <div className="candidate-page-grid candidate-page-grid--two">
              {visibleItems.map((contact) => (
                <CandidateContactCard key={contact.id} contact={contact} />
              ))}
            </div>
          ) : (
            <Card>
              <EmptyState
                eyebrow="Пусто"
                title="Контакты не найдены"
                description={query ? "Сбросьте поиск или добавьте новые контакты через реальные сценарии платформы." : "У кандидата пока нет сохраненных контактов."}
                tone="neutral"
              />
            </Card>
          )}
        </>
      ) : null}
    </section>
  );
}
