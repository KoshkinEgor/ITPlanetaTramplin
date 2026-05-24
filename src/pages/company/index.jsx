import { useOutletContext } from "react-router-dom";
import { CompanyAccessGuard } from "./CompanyAccessGuard";
import { CompanyCabinetPage } from "./CompanyCabinetPage";
import { CompanyPublicPage } from "./CompanyPublicPage";
import { CompanyOpportunitiesSection } from "../../company-dashboard/CompanyOpportunitiesSection";
import { CompanyProfileSection } from "../../company-dashboard/CompanyProfileSection";
import { CompanyResponsesSection } from "../../company-dashboard/CompanyResponsesSection";
import { CompanySettingsSection } from "../../company-dashboard/CompanySettingsSection";
import { ChatApp } from "../../chat";

export { CompanyAccessGuard, CompanyCabinetPage, CompanyPublicPage };

export function CompanyDashboardPage() {
  const context = useOutletContext();
  return <CompanyProfileSection onSummaryChange={context?.onSummaryChange} />;
}

export function CompanyOpportunitiesPage() {
  return <CompanyOpportunitiesSection />;
}

export function CompanyResponsesPage() {
  return <CompanyResponsesSection />;
}

export function CompanyMessagesPage() {
  return <ChatApp />;
}

export function CompanySettingsPage() {
  return <CompanySettingsSection />;
}
