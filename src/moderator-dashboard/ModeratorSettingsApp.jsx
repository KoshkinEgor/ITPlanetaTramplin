import { Card, Tag } from "../components/ui";
import { ModeratorFrame, ModeratorPageIntro } from "./shared";

const SETTINGS_COLUMNS = [
  {
    key: "sla",
    eyebrow: "SLA",
    title: "Сроки обработки",
    items: [
      {
        title: "Возможности",
        description: "Цель обработки публикаций не позднее 4 часов с момента отправки.",
        value: "4 часа",
      },
      {
        title: "Компании",
        description: "Первичный ответ на заявку компании в течение рабочего дня.",
        value: "1 день",
      },
      {
        title: "Возможности",
        description: "Эскалация критичных жалоб сразу после подтверждения нарушения.",
        value: "Приоритет",
      },
    ],
  },
  {
    key: "alerts",
    eyebrow: "Уведомления",
    title: "Каналы оповещений",
    items: [
      {
        title: "Срочные жалобы",
        description: "Отправлять уведомление при повторных жалобах на один объект.",
      },
      {
        title: "Новые компании",
        description: "Пинг в начале дня по всем новым запросам на верификацию.",
      },
      {
        title: "Еженедельная сводка",
        description: "Собирать отчёт по одобрениям, отклонениям и доработкам.",
      },
    ],
  },
  {
    key: "templates",
    eyebrow: "Шаблоны",
    title: "Причины и комментарии",
    items: [
      {
        title: "Отклонение публикации",
        description: "Используйте обязательный комментарий: что нарушено и что нужно исправить.",
      },
      {
        title: "Запрос данных у компании",
        description: "Шаблон письма включает сайт, домен, контакт и подтверждение деятельности.",
      },
      {
        title: "Блокировка пользователя",
        description: "Применяется только через подтверждение с указанием причины действия.",
      },
    ],
  },
];

function SettingsColumn({ column, delayIndex }) {
  return (
    <Card className={`moderator-panel moderator-settings-column moderator-fade-up moderator-fade-up--delay-${delayIndex}`.trim()}>
      <div className="moderator-panel__copy">
        <Tag tone="accent">
          {column.eyebrow}
        </Tag>
        <h2 className="ui-type-h1">{column.title}</h2>
      </div>

      <div className="moderator-settings-column__items">
        {column.items.map((item) => (
          <article key={item.title} className="moderator-setting-card">
            <div className="moderator-setting-card__head">
              <h3 className="ui-type-h3">{item.title}</h3>
              {item.value ? <span className="moderator-setting-card__value">{item.value}</span> : null}
            </div>
            <p className="ui-type-body moderator-setting-card__description">{item.description}</p>
          </article>
        ))}
      </div>
    </Card>
  );
}

export function ModeratorSettingsApp() {
  return (
    <ModeratorFrame activeKey="settings">
      <ModeratorPageIntro
        title="Параметры кабинета"
        description="Настройки SLA, уведомлений и сценариев ручной проверки для кураторской команды."
      />

      <section className="moderator-settings-grid">
        {SETTINGS_COLUMNS.map((column, index) => (
          <SettingsColumn key={column.key} column={column} delayIndex={index + 1} />
        ))}
      </section>
    </ModeratorFrame>
  );
}
