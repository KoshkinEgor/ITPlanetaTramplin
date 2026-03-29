import { useLocation } from "react-router-dom";
import { PUBLIC_HEADER_NAV_ITEMS, routes } from "../../app/routes";
import { Button, Input } from "../../shared/ui";
import { PortalHeader } from "../../widgets/layout";
import "./not-found.css";

function decodePathname(pathname) {
  try {
    return decodeURIComponent(pathname);
  } catch {
    return pathname;
  }
}

function buildSuggestedQuery(pathname) {
  const normalizedPath = decodePathname(pathname)
    .replace(/^\/+|\/+$/g, "")
    .replace(/[-_/+.]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return normalizedPath || "Трамплин";
}

export function NotFoundPage() {
  const location = useLocation();
  const requestedAddress = `${decodePathname(location.pathname)}${location.search}${location.hash}`;
  const suggestedQuery = buildSuggestedQuery(location.pathname);

  return (
    <div className="not-found-page">
      <div className="ui-page-shell">
        <PortalHeader
          navItems={PUBLIC_HEADER_NAV_ITEMS}
          actionHref={routes.auth.login}
          actionLabel="Войти"
          shellClassName="not-found-page__header-shell"
        />
      </div>

      <main className="not-found-page__main">
        <div className="ui-page-shell">
          <section className="not-found-page__hero">
            <div className="not-found-page__hero-copy">
              <span className="not-found-page__eyebrow">Ошибка маршрута</span>
              <p className="not-found-page__requested-path" aria-label="Запрошенный адрес">
                {requestedAddress}
              </p>
              <p className="not-found-page__code" aria-hidden="true">
                404
              </p>
              <h1 className="ui-type-display">Страница не найдена</h1>
              <p className="ui-type-body-lg not-found-page__lead">
                Если вы искали на ней что-то конкретное, спросите об этом Яндекс:
              </p>

              <div className="not-found-page__actions">
                <Button href={routes.home} size="lg">
                  На главную
                </Button>
                <Button href={routes.opportunities.catalog} variant="secondary" size="lg">
                  Смотреть возможности
                </Button>
              </div>
            </div>

            <aside className="not-found-page__search-card" aria-label="Поиск через Яндекс">
              <p className="not-found-page__search-title">Подсказка для поиска</p>
              <p className="ui-type-body not-found-page__search-description">
                Внешний поиск больше не открывается автоматически. Если нужно, скопируйте запрос и вставьте его в Яндекс вручную.
              </p>

              <div className="not-found-page__search-form">
                <label className="ui-visually-hidden" htmlFor="not-found-yandex-search">
                  Поисковый запрос
                </label>
                <Input
                  id="not-found-yandex-search"
                  value={suggestedQuery}
                  readOnly
                  copyable
                  width="full"
                  copyText="Скопировать"
                  copiedText="Скопировано"
                  copyLabel="Скопировать запрос"
                  className="not-found-page__search-control"
                />
              </div>

              <div className="not-found-page__search-hints" aria-hidden="true">
                <span>Совет: добавьте название компании, вакансии или города.</span>
                <span>Пример: стажировка UX Москва</span>
              </div>
            </aside>
          </section>
        </div>
      </main>
    </div>
  );
}
