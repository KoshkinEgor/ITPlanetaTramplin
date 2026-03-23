import React from "react";
import { PortalHeader } from "../components/layout/PortalHeader";
import { Badge, Button, Card, SectionHeader } from "../components/ui";

const navItems = [
  { key: "company", label: "Кабинет компании", href: "./company-dashboard.html" },
  { key: "catalog", label: "Каталог возможностей", href: "../opportunities/opportunities-catalog.html" },
  { key: "candidate", label: "Профиль соискателя", href: "../candidate/candidate-profile.html" },
];

const metrics = [
  { value: "21", label: "Активных публикаций", note: "Вакансии, стажировки и события в текущем цикле." },
  { value: "12", label: "Новых откликов за неделю", note: "Быстрый обзор без перехода в отдельный кабинет." },
  { value: "84%", label: "Профиль заполнен", note: "Осталось добавить детали команды и описание процессов." },
];

const opportunityItems = [
  {
    title: "Junior Security Analyst",
    meta: "Москва + гибрид",
    status: "Идет набор",
    description: "Базовая публикация готова, отклики уже приходят из каталога и рекомендательной ленты.",
  },
  {
    title: "Design Systems Meetup",
    meta: "Онлайн + офлайн",
    status: "Скоро старт",
    description: "Карточка события подходит для карьерных активностей и брендовых форматов компании.",
  },
];

const responseItems = [
  {
    name: "Алина Петрова",
    role: "Отклик на Junior Security Analyst",
    note: "Готова к первичному интервью на этой неделе.",
  },
  {
    name: "Илья Смирнов",
    role: "Регистрация на Design Systems Meetup",
    note: "Ожидает письмо с деталями участия и таймингом.",
  },
];

const nextSteps = [
  "Проверить карточки компании и актуализировать описание команды.",
  "Отредактировать поля регистрации работодателя без возврата в архивные страницы.",
  "Перейти в каталог возможностей и сверить публичное отображение карточек.",
];

export function CompanyDashboardApp() {
  return (
    <div className="company-dashboard-page">
      <div className="company-dashboard-page__backdrop" aria-hidden="true" />

      <div className="company-dashboard-page__shell">
        <PortalHeader
          navItems={navItems}
          currentKey="company"
          actionHref="../auth/company-registration-extended.html"
          actionLabel="Редактировать данные"
        />

        <main className="company-dashboard-page__main">
          <section className="ui-card company-dashboard-hero">
            <div className="company-dashboard-hero__copy">
              <div className="company-dashboard-hero__badges">
                <Badge kind="tag" tone="success">Страница восстановлена</Badge>
                <Badge kind="chip" tone="accent" active>Employer flow</Badge>
              </div>

              <h1 className="ui-type-display">Кабинет компании снова доступен по рабочему адресу.</h1>

              <p className="ui-type-body-lg">
                Эта страница закрывает битый переход после входа и регистрации работодателя. Теперь редирект ведет
                в актуальную сборку, а не в отсутствующий HTML из старой структуры.
              </p>
            </div>

            <div className="company-dashboard-hero__actions">
              <Button href="../opportunities/opportunities-catalog.html">Открыть каталог</Button>
              <Button href="../curator/moderator-companies.html" variant="secondary">Проверить модерацию</Button>
            </div>
          </section>

          <section className="company-dashboard-metrics" aria-label="Ключевые показатели">
            {metrics.map((item) => (
              <Card key={item.label} tone="neutral" className="company-dashboard-metric">
                <strong>{item.value}</strong>
                <span className="ui-type-h3">{item.label}</span>
                <p className="ui-type-body">{item.note}</p>
              </Card>
            ))}
          </section>

          <section className="company-dashboard-layout">
            <Card className="company-dashboard-panel company-dashboard-panel--wide">
              <SectionHeader
                eyebrow="Публикации"
                title="Текущие карточки компании"
                description="Блок не уводит в несуществующие страницы и держит навигацию внутри текущего набора экранов."
                actions={<Badge dot>2 активных примера</Badge>}
              />

              <div className="company-dashboard-stack">
                {opportunityItems.map((item) => (
                  <article key={item.title} className="company-dashboard-list-item">
                    <div className="company-dashboard-list-item__top">
                      <div>
                        <h3 className="ui-type-h3">{item.title}</h3>
                        <p className="ui-type-caption">{item.meta}</p>
                      </div>
                      <Badge tone="success">{item.status}</Badge>
                    </div>
                    <p className="ui-type-body">{item.description}</p>
                  </article>
                ))}
              </div>
            </Card>

            <Card className="company-dashboard-panel">
              <SectionHeader
                eyebrow="Отклики"
                title="Последние реакции кандидатов"
                description="Компактная сводка на случай, если нужно быстро проверить поток без отдельного интерфейса."
                size="md"
              />

              <div className="company-dashboard-stack">
                {responseItems.map((item) => (
                  <article key={item.name} className="company-dashboard-response">
                    <div>
                      <h3 className="ui-type-h3">{item.name}</h3>
                      <p className="ui-type-caption">{item.role}</p>
                    </div>
                    <p className="ui-type-body">{item.note}</p>
                  </article>
                ))}
              </div>
            </Card>

            <Card tone="accent" className="company-dashboard-panel">
              <SectionHeader
                eyebrow="Следующие шаги"
                title="Что еще стоит поправить"
                description="В проекте по-прежнему нет полного набора экранов работодателя, поэтому эта страница временно берет на себя роль безопасной точки входа."
                size="md"
              />

              <ul className="company-dashboard-checklist">
                {nextSteps.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>

              <div className="company-dashboard-panel__actions">
                <Button href="../auth/company-registration-extended.html" variant="secondary">
                  Открыть расширенную форму
                </Button>
                <Button href="../home/index.html" variant="ghost">
                  На главную
                </Button>
              </div>
            </Card>
          </section>
        </main>
      </div>
    </div>
  );
}
