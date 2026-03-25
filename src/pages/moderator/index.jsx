import { ModeratorCabinetPage } from "./ModeratorCabinetPage";
import { ModeratorCompaniesApp } from "../../moderator-dashboard/ModeratorCompaniesApp";
import { ModeratorDashboardApp } from "../../moderator-dashboard/ModeratorDashboardApp";
import { ModeratorOpportunitiesApp } from "../../moderator-dashboard/ModeratorOpportunitiesApp";
import { ModeratorUsersApp } from "../../moderator-dashboard/ModeratorUsersApp";
import { CabinetContentSection } from "../../widgets/layout";
import { PlaceholderAction, PlaceholderBlock, PlaceholderMedia } from "../../shared/ui";

export { ModeratorCabinetPage };

export function ModeratorDashboardPage() {
  return <ModeratorDashboardApp />;
}

export function ModeratorOpportunitiesPage() {
  return <ModeratorOpportunitiesApp />;
}

export function ModeratorCompaniesPage() {
  return <ModeratorCompaniesApp />;
}

export function ModeratorUsersPage() {
  return <ModeratorUsersApp />;
}

function ModeratorPlaceholderPage({ eyebrow, title, description }) {
  return (
    <>
      <CabinetContentSection eyebrow={eyebrow} title={title} description={description}>
        <PlaceholderBlock
          eyebrow="Shared scaffold"
          title={`${title}: content placeholder`}
          description="Раздел добавлен в структуру кабинета и маршрутизацию, но его функциональный модуль еще не реализован."
          action={<PlaceholderAction label="Placeholder action" description="Будущий shared control для этого раздела." />}
        />
      </CabinetContentSection>

      <PlaceholderMedia
        eyebrow="Scaffold"
        title={`${title}: media placeholder`}
        description="Если разделу понадобится медиа, таблица или визуальный блок, он должен прийти сюда через shared component, а не page-local div."
        actionLabel="Placeholder: future module"
      />
    </>
  );
}

export function ModeratorComplaintsPage() {
  return (
    <ModeratorPlaceholderPage
      eyebrow="Жалобы"
      title="Жалобы и репорты"
      description="Route-backed placeholder для очереди жалоб и системных обращений."
    />
  );
}

export function ModeratorTagsSystemPage() {
  return (
    <ModeratorPlaceholderPage
      eyebrow="Система"
      title="Теги и системные настройки"
      description="Route-backed placeholder для taxonomy, тегов и системных справочников."
    />
  );
}

export function ModeratorLogsPage() {
  return (
    <ModeratorPlaceholderPage
      eyebrow="Логи"
      title="Логи модерации"
      description="Route-backed placeholder для аудита действий и журнала изменений."
    />
  );
}

export function ModeratorSettingsPage() {
  return (
    <ModeratorPlaceholderPage
      eyebrow="Настройки"
      title="Настройки модератора"
      description="Route-backed placeholder для профиля модератора и служебных конфигураций."
    />
  );
}
