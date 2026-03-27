import { Button, Card, SegmentedControl, Tag } from "../components/ui";
import { CANDIDATE_PAGE_ROUTES, CANDIDATE_PORTFOLIO_TABS, PROJECT_ITEMS, RESUME_CARD, RESUME_EDITOR } from "./data";
import { loadStoredProjects, mapProjectRecordToCardItem } from "./project-storage";
import {
  CandidateFrame,
  CandidateProfileHero,
  CandidateProjectCard,
  CandidateSectionHeader,
  CandidateSegmentNav,
  MoreIcon,
} from "./shared";

function ResumeRecordCard() {
  return (
    <article className="candidate-resume-record">
      <div className="candidate-resume-record__head">
        <a href={CANDIDATE_PAGE_ROUTES.resumeEditor} className="candidate-resume-record__copy-link">
          <h3 className="ui-type-h2">{RESUME_CARD.record.title}</h3>
          <p className="ui-type-body">{RESUME_CARD.record.updatedAt}</p>
        </a>
        <a href={CANDIDATE_PAGE_ROUTES.resumeEditor} className="candidate-resume-record__more" aria-label="Действия с резюме">
          <MoreIcon />
        </a>
      </div>

      <div className="candidate-resume-record__tags">
        {RESUME_CARD.record.tags.map((tag) => (
          <Tag key={tag}>{tag}</Tag>
        ))}
      </div>

      <div className="candidate-resume-record__stats">
        <span className="candidate-resume-record__stats-label">{RESUME_CARD.record.statsLabel}</span>
        <div className="candidate-resume-record__stats-values">
          {RESUME_CARD.record.stats.map((item) => (
            <span key={item.label}>
              {item.label} <strong>{item.value}</strong>
            </span>
          ))}
        </div>
      </div>

      <div className="candidate-resume-record__visibility">
        <span>Видимость резюме</span>
        <SegmentedControl
          items={[
            { value: "hidden", label: "Не видно никому" },
            { value: "employers", label: "Видно работодателям" },
          ]}
          value={RESUME_EDITOR.visibility === "Видно работодателям" ? "employers" : "hidden"}
          stretch
        />
      </div>
    </article>
  );
}

function CandidatePortfolioSwitcher({ value }) {
  return (
    <Card className="candidate-switcher-card">
      <CandidateSectionHeader title="Резюме и портфолио" />
      <CandidateSegmentNav items={CANDIDATE_PORTFOLIO_TABS} value={value} />
    </Card>
  );
}

export function CandidateResumeApp() {
  return (
    <CandidateFrame activeKey="portfolio" hero={<CandidateProfileHero />}>
      <CandidatePortfolioSwitcher value="resume" />

      <Card className="candidate-resume-panel">
        <div className="candidate-resume-panel__intro">
          <Tag tone="accent">{RESUME_CARD.typeLabel}</Tag>
          <h2 className="ui-type-h1">{RESUME_CARD.title}</h2>
          <p className="ui-type-body-lg">{RESUME_CARD.description}</p>
        </div>

        <ResumeRecordCard />

        <div className="candidate-resume-panel__actions">
          <Button variant="secondary">Поделиться резюме</Button>
        </div>
      </Card>
    </CandidateFrame>
  );
}

export function CandidateProjectsApp() {
  const projectItems = [...loadStoredProjects().map(mapProjectRecordToCardItem), ...PROJECT_ITEMS];

  return (
    <CandidateFrame activeKey="portfolio" hero={<CandidateProfileHero />}>
      <CandidatePortfolioSwitcher value="projects" />

      <section className="candidate-page-section">
        <CandidateSectionHeader
          title="Портфолио"
          description="Выложи кейсы, которые могут показать твои текущие навыки."
          actions={<Button href={CANDIDATE_PAGE_ROUTES.projectEditor}>Добавить проект</Button>}
        />

        <div className="candidate-page-grid candidate-page-grid--two">
          {projectItems.map((item) => (
            <CandidateProjectCard key={item.id} item={item} />
          ))}
        </div>

        <Button variant="secondary" className="candidate-page-more">
          Больше проектов
        </Button>
      </section>
    </CandidateFrame>
  );
}
