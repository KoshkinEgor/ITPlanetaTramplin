import { PortalHeader } from "../components/layout/PortalHeader";
import { OpportunityBlockCard } from "../components/opportunities";
import { Avatar, Button, Card, SectionHeader, Tag } from "../components/ui";

const NAV_ITEMS = [
  { key: "opportunities", label: "Возможности", href: "./opportunities-catalog.html" },
  { key: "career", label: "Карьера", href: "../candidate/candidate-profile.html" },
  { key: "about", label: "О платформе", href: "../home/index.html#about" },
];

const DETAIL_FACTS = [
  { label: "Зарплата", value: "30 000 ₽ / мес" },
  { label: "Выплаты", value: "2 раза / мес" },
  { label: "Опыт работы", value: "Не требуется" },
  { label: "График", value: "5/2 или свободный" },
  { label: "Рабочие часы", value: "8 ч" },
  { label: "Формат работы", value: "Гибрид, офис, онлайн" },
];

const INTRO_PARAGRAPHS = [
  "White Tiger Soft — официально аккредитованная IT-компания по разработке мобильных приложений под ключ, входящая в топ-10 по версии Rating Runeta.",
  "С более чем 15-летним опытом в индустрии команда стремится к качеству в каждом проекте. Здесь собраны специалисты, которые любят технологии и хотят видеть в дизайне не только эстетику, но и понятную продуктовую логику.",
  "У White Tiger Soft больше ста завершенных мобильных приложений, и сейчас команда расширяет направление UI/UX. На позицию ищут внимательного джуниора, которому интересно расти в продуктовой среде и работать рядом с наставником.",
];

const RESPONSIBILITIES = [
  "Отрисовка интерфейсов мобильных приложений в Figma.",
  "Подготовка UI-kit и систематизация компонентов вместе с командой.",
  "Доработка существующих интерфейсов по итогам обратной связи и тестов.",
  "Поиск визуальных референсов, иконок и графики для продуктовых сценариев.",
  "Подготовка презентационных материалов для внутренних и внешних коммуникаций.",
];

const EXPECTATIONS = [
  "Опыт работы хотя бы в одном графическом или векторном редакторе: Figma, Adobe Photoshop, Sketch, Adobe XD.",
  "Наличие актуального портфолио на Behance, Dribbble или личном сайте с примерами веб- и мобильных интерфейсов.",
  "Умение грамотно презентовать свои решения и объяснять логику интерфейса.",
  "Понимание базовых UX-принципов, композиции, типографики и поведения мобильных паттернов.",
  "Внимание к деталям и спокойная коммуникация внутри команды.",
];

const CONDITIONS = [
  "Готовы рассматривать начинающих дизайнеров без коммерческого опыта и специалистов с практикой до 1,5–3 лет.",
  "Обучение как при наличии практического опыта, так и без него.",
  "Постепенное погружение в профессию, продуктовую область и специфику mobile-first интерфейсов.",
  "Официальное трудоустройство и гибкий график 5/2.",
  "Отсутствие переработок: команда не практикует вечерние и выходные смены.",
  "Корпоративные встречи, дополнительные тренинги и групповое обучение на реальных кейсах.",
  "Социальная поддержка сотрудников в важных жизненных событиях.",
];

const SKILL_TAGS = [
  "Adobe Photoshop",
  "Веб-дизайн",
  "Дизайн интерфейсов",
  "UX",
  "UI",
  "Adobe XD",
  "Прототипирование",
  "Sketch",
  "Дизайн",
  "CorelDRAW",
  "Design",
];

const RELATED_CARDS = [
  {
    type: "Вакансия",
    status: "Активно",
    tone: "success",
    title: "Веб-дизайнер",
    meta: "Яндекс Крауд · Контент · Москва + онлайн",
    accent: "От 90 000 ₽",
    chips: ["Junior", "Figma", "UI"],
  },
  {
    type: "Мероприятие",
    status: "Ожидание",
    tone: "warning",
    title: "IT - Планета",
    meta: "IT - Планета · Москва + онлайн",
    accent: "155 регистраций",
    chips: ["Студенты", "Мероприятие"],
  },
];

function HeartIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M10 16.2s-5.2-3.5-6.7-6.6C2.1 7.2 3.2 4.5 6 4.5c1.5 0 2.7.8 4 2.3 1.3-1.5 2.5-2.3 4-2.3 2.8 0 3.9 2.7 2.7 5.1-1.5 3.1-6.7 6.6-6.7 6.6Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <rect x="3" y="4" width="16" height="14" rx="3" stroke="currentColor" strokeWidth="1.7" />
      <path d="m5.5 7 5.5 4.5L16.5 7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MoreIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="4" cy="10" r="1.6" fill="currentColor" />
      <circle cx="10" cy="10" r="1.6" fill="currentColor" />
      <circle cx="16" cy="10" r="1.6" fill="currentColor" />
    </svg>
  );
}

function StarIcon({ active = true }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="m8 1.8 1.9 3.9 4.3.6-3.1 3 0.7 4.3L8 11.6l-3.8 2 0.7-4.3-3.1-3 4.3-.6L8 1.8Z"
        fill={active ? "currentColor" : "transparent"}
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconButton({ label, href, className = "", children }) {
  const classNames = `opportunity-card-icon-button ${className}`.trim();

  if (href) {
    return (
      <a className={classNames} href={href} aria-label={label}>
        {children}
      </a>
    );
  }

  return (
    <button type="button" className={classNames} aria-label={label}>
      {children}
    </button>
  );
}

function StorySection({ title, items }) {
  return (
    <section className="opportunity-story-section">
      <h2 className="ui-type-h3">{title}</h2>
      <ul className="opportunity-story-list">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

function CompanySpotlight() {
  return (
    <Card className="company-spotlight opportunity-card-fade-up opportunity-card-fade-up--delay-1">
      <div className="company-spotlight__company">
        <Avatar
          initials="wts"
          size="lg"
          shape="rounded"
          className="company-spotlight__avatar company-spotlight__avatar--brand"
        />
        <div className="company-spotlight__copy">
          <h2 className="ui-type-h3">White Tiger Soft</h2>
          <div className="company-spotlight__rating">
            <span>4.2</span>
            <div className="company-spotlight__stars" aria-label="Рейтинг 4.2 из 5">
              <StarIcon />
              <StarIcon />
              <StarIcon />
              <StarIcon />
              <StarIcon active={false} />
            </div>
            <a href="../contacts/contact-profile.html" className="company-spotlight__link">
              3 отзыва
            </a>
          </div>
        </div>
      </div>

      <div className="company-spotlight__company company-spotlight__company--compact">
        <Avatar initials="IT" shape="rounded" tone="neutral" />
        <div className="company-spotlight__copy">
          <p className="ui-type-body">IT-компания</p>
          <p className="ui-type-caption">У работодателя есть аккредитация</p>
        </div>
      </div>

      <div className="company-spotlight__footer">
        <Button as="a" href="../contacts/contact-profile.html" variant="secondary" className="company-spotlight__recommend">
          Рекомендовать возможность
        </Button>
        <IconButton label="Написать компании" href="../contacts/contact-profile.html" className="company-spotlight__message">
          <MailIcon />
        </IconButton>
      </div>
    </Card>
  );
}

export function OpportunityDetailCardApp() {
  return (
    <main className="opportunity-card-page">
      <div className="opportunity-card-page__shell">
        <PortalHeader
          navItems={NAV_ITEMS}
          currentKey="opportunities"
          actionHref="../candidate/candidate-profile.html"
          actionLabel="Профиль"
          className="opportunity-card-header opportunity-card-fade-up"
        />

        <div className="opportunity-card-page__grid">
          <div className="opportunity-card-page__main">
            <Card className="opportunity-focus-card opportunity-card-fade-up">
              <div className="opportunity-focus-card__eyebrow">
                <Tag>Стажировка</Tag>
              </div>

              <div className="opportunity-focus-card__copy">
                <h1 className="ui-type-h1">Дизайнер интерфейсов мобильных приложений UI/UX</h1>
                <p className="ui-type-body">White Tiger Soft · Москва + онлайн</p>
              </div>

              <dl className="opportunity-focus-card__facts">
                {DETAIL_FACTS.map((item) => (
                  <div key={item.label} className="opportunity-focus-card__fact">
                    <dt>{item.label}:</dt>
                    <dd>{item.value}</dd>
                  </div>
                ))}
              </dl>

              <p className="ui-type-body opportunity-focus-card__summary">
                Стажировка для студентов 3–4 курса: продуктовые метрики, SQL, A/B-тесты и работа с наставником в
                growth-команде.
              </p>

              <div className="opportunity-focus-card__chips">
                <Tag tone="accent">
                  Figma
                </Tag>
                <Tag tone="accent">
                  UI / UX
                </Tag>
              </div>

              <div className="opportunity-focus-card__footer">
                <div className="opportunity-focus-card__watchers">Сейчас эту вакансию смотрят 8 человек</div>
                <div className="opportunity-focus-card__actions">
                  <Button className="opportunity-focus-card__apply">Откликнуться</Button>
                  <IconButton label="Добавить в избранное">
                    <HeartIcon />
                  </IconButton>
                  <IconButton label="Другие действия">
                    <MoreIcon />
                  </IconButton>
                </div>
              </div>
            </Card>

            <Card className="opportunity-media-panel opportunity-card-fade-up opportunity-card-fade-up--delay-1">
              <SectionHeader
                eyebrow="Медиа"
                title="Программа стажировки"
                description="Команда ищет дизайнера, который быстро схватывает продуктовый контекст и любит аккуратные интерфейсы."
                size="md"
                className="opportunity-media-panel__header"
              />

              <div className="opportunity-media-panel__preview" aria-hidden="true">
                <span className="opportunity-media-panel__glow opportunity-media-panel__glow--lime" />
                <span className="opportunity-media-panel__glow opportunity-media-panel__glow--blue" />
                <Tag className="opportunity-media-panel__badge">
                  Программа стажировки
                </Tag>
              </div>
            </Card>

            <Card className="opportunity-story-card opportunity-card-fade-up opportunity-card-fade-up--delay-2">
              <SectionHeader
                eyebrow="О роли"
                title="Почему эта возможность стоит внимания"
                description="Позиция рассчитана на быстрый вход в мобильный продуктовый дизайн: с наставничеством, понятным ритмом и реальными задачами."
                size="md"
              />

              <div className="opportunity-story-card__intro">
                {INTRO_PARAGRAPHS.map((paragraph) => (
                  <p key={paragraph} className="ui-type-body-lg">
                    {paragraph}
                  </p>
                ))}
              </div>

              <StorySection title="Основные задачи" items={RESPONSIBILITIES} />
              <StorySection title="Что ожидают от кандидата" items={EXPECTATIONS} />
              <StorySection title="Что предлагает команда" items={CONDITIONS} />

              <section className="opportunity-story-section" id="skills">
                <SectionHeader
                  eyebrow="Навыки"
                  title="Ключевые навыки"
                  description="Вакансия опубликована 27 февраля 2026 в Йошкар-Оле."
                  size="sm"
                  className="opportunity-story-section__header"
                />

                <div className="opportunity-skill-cloud">
                  {SKILL_TAGS.map((skill) => (
                    <Tag key={skill} tone="accent">
                      {skill}
                    </Tag>
                  ))}
                </div>

                <div className="opportunity-story-card__bottom-actions">
                  <Button size="lg" className="opportunity-story-card__bottom-primary">
                    Откликнуться
                  </Button>
                  <Button size="lg" variant="secondary" className="opportunity-story-card__bottom-secondary">
                    Пожаловаться на вакансию
                  </Button>
                </div>
              </section>
            </Card>
          </div>

          <aside className="opportunity-card-page__side">
            <CompanySpotlight />

            <div className="opportunity-card-page__matches">
              <p className="ui-type-caption opportunity-card-page__matches-label">Вам могут подойти</p>
              {RELATED_CARDS.map((item, index) => (
                <OpportunityBlockCard
                  key={item.title}
                  item={item}
                  surface="panel"
                  size="md"
                  className={`related-opportunity-entry opportunity-card-fade-up opportunity-card-fade-up--delay-${index + 2}`.trim()}
                  detailAction={{
                    href: "./opportunity-detail-card.html",
                    label: "Подробнее",
                    variant: "secondary",
                  }}
                />
              ))}
              <a href="./opportunities-catalog.html" className="opportunity-card-page__more-link">
                Еще 1 000 подходящих вакансий
              </a>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
