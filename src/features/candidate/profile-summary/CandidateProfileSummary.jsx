import { buildCandidateSettingsRoute } from "../../../app/routes";
import { Avatar, Button, Card, PlaceholderAction, Tag } from "../../../shared/ui";
import { cn } from "../../../shared/lib/cn";
import { getCandidateDisplayName, getCandidateInitials, getCandidateMeta, getCandidateSkills } from "../../../candidate-portal/mappers";
import { CandidateProgressCard, CandidateStatTiles } from "../../../candidate-portal/shared";
import "./CandidateProfileSummary.css";

export function CandidateProfileSummary({
  profile,
  stats = [],
  completion = 0,
  variant = "compact",
}) {
  const displayName = getCandidateDisplayName(profile);
  const meta = getCandidateMeta(profile);
  const skills = getCandidateSkills(profile);
  const isFull = variant === "full";

  return (
    <Card className={cn("candidate-profile-summary", isFull ? "candidate-profile-summary--full" : "candidate-profile-summary--compact")}>
      <div className="candidate-profile-summary__cover">
        <PlaceholderAction
          className="candidate-profile-summary__cover-action"
          label="Слот шапки профиля"
          description="Будущий shared uploader для обложки."
        />

        <div className="candidate-profile-summary__badges">
          <Tag tone="accent">Профиль соискателя</Tag>
          <Tag tone="success">Ищу работу</Tag>
          <Tag tone="neutral">Онлайн</Tag>
        </div>
      </div>

      <div className="candidate-profile-summary__body">
        <div className="candidate-profile-summary__main">
          <div className="candidate-profile-summary__identity">
            <Avatar
              initials={getCandidateInitials(profile)}
              size="xl"
              shape="rounded"
              tone="neutral"
              className="candidate-profile-summary__avatar"
            />

            <div className="candidate-profile-summary__copy">
              <h1 className="ui-type-h1 candidate-profile-summary__title">{displayName}</h1>
              <p className="ui-type-body candidate-profile-summary__meta">{meta}</p>
            </div>
          </div>

          {isFull ? (
            <p className="ui-type-body candidate-profile-summary__description">
              {profile?.description?.trim() || "Краткое описание профиля появится здесь после заполнения раздела личной информации."}
            </p>
          ) : null}

          {skills.length ? (
            <div className="candidate-profile-summary__skills">
              {skills.slice(0, isFull ? 6 : 4).map((skill) => (
                <Tag key={skill} tone="accent">
                  {skill}
                </Tag>
              ))}
            </div>
          ) : null}
        </div>

        <div className="candidate-profile-summary__aside">
          <CandidateProgressCard
            value={completion}
            note={isFull ? "Чем полнее профиль, тем точнее рекомендации и отклики работодателей." : undefined}
            className="candidate-profile-summary__progress"
          />
          <CandidateStatTiles items={stats.slice(0, isFull ? 4 : 3)} className="candidate-profile-summary__stats" />
          {isFull ? (
            <Button href={buildCandidateSettingsRoute("settings-profile")} variant="secondary">
              Редактировать профиль
            </Button>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
