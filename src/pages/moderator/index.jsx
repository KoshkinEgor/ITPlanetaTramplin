import { ModeratorAccessGuard } from "./ModeratorAccessGuard";
import { ModeratorCabinetPage } from "./ModeratorCabinetPage";
import { ModeratorCompaniesApp } from "../../moderator-dashboard/ModeratorCompaniesApp";
import { ModeratorComplaintsApp } from "../../moderator-dashboard/ModeratorComplaintsApp";
import { ModeratorDashboardApp } from "../../moderator-dashboard/ModeratorDashboardApp";
import { ModeratorLogsApp } from "../../moderator-dashboard/ModeratorLogsApp";
import { ModeratorOpportunitiesApp } from "../../moderator-dashboard/ModeratorOpportunitiesApp";
import { ModeratorUsersApp } from "../../moderator-dashboard/ModeratorUsersApp";
import { DashboardPageHeader, PlaceholderAction, PlaceholderBlock, PlaceholderMedia } from "../../shared/ui";

export { ModeratorAccessGuard, ModeratorCabinetPage };

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

function ModeratorPlaceholderPage({ title, description }) {
  return (
    <>
      <DashboardPageHeader title={title} description={description} />

      <PlaceholderBlock
        eyebrow="Shared scaffold"
        title={`${title}: content placeholder`}
        description="Раздел добавлен в структуру кабинета и маршрутизацию, но его функциональный модуль еще не реализован."
        action={<PlaceholderAction label="Placeholder action" description="Будущий shared control для этого раздела." />}
      />

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
  return <ModeratorComplaintsApp />;
}

export function ModeratorTagsSystemPage() {
  return (
    <ModeratorPlaceholderPage
      title="Теги и системные настройки"
      description="Плейсхолдер для taxonomy, тегов и системных справочников модератора."
    />
  );
}

export function ModeratorLogsPage() {
  return <ModeratorLogsApp />;
}

export function ModeratorSettingsPage() {
  return (
    <ModeratorPlaceholderPage
      title="Настройки модератора"
      description="Плейсхолдер для профиля модератора и служебных конфигураций кабинета."
    />
  );
}
