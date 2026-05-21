import { ModeratorAccessGuard } from "./ModeratorAccessGuard";
import { ModeratorCabinetPage } from "./ModeratorCabinetPage";
import { ModeratorCompaniesApp } from "../../moderator-dashboard/ModeratorCompaniesApp";
import { ModeratorComplaintsApp } from "../../moderator-dashboard/ModeratorComplaintsApp";
import { ModeratorDashboardApp } from "../../moderator-dashboard/ModeratorDashboardApp";
import { ModeratorInvitationsApp } from "../../moderator-dashboard/ModeratorInvitationsApp";
import { ModeratorLogsApp } from "../../moderator-dashboard/ModeratorLogsApp";
import { ModeratorOpportunitiesApp } from "../../moderator-dashboard/ModeratorOpportunitiesApp";
import { ModeratorSettingsApp } from "../../moderator-dashboard/ModeratorSettingsApp";
import { ModeratorTagsSystemApp } from "../../moderator-dashboard/ModeratorTagsSystemApp";
import { ModeratorUsersApp } from "../../moderator-dashboard/ModeratorUsersApp";

export { ModeratorAccessGuard, ModeratorCabinetPage };

export function ModeratorDashboardPage() {
  return <ModeratorDashboardApp />;
}

export function ModeratorInvitationsPage() {
  return <ModeratorInvitationsApp />;
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

export function ModeratorComplaintsPage() {
  return <ModeratorComplaintsApp />;
}

export function ModeratorTagsSystemPage() {
  return <ModeratorTagsSystemApp />;
}

export function ModeratorLogsPage() {
  return <ModeratorLogsApp />;
}

export function ModeratorSettingsPage() {
  return <ModeratorSettingsApp />;
}
