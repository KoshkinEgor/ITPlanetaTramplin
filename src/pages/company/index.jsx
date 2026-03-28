import { CompanyAccessGuard } from "./CompanyAccessGuard";
import { CompanyCabinetPage } from "./CompanyCabinetPage";
import { CompanyPublicPage } from "./CompanyPublicPage";
import { CompanyOpportunitiesSection } from "../../company-dashboard/CompanyOpportunitiesSection";
import { CompanyProfileSection } from "../../company-dashboard/CompanyProfileSection";
import { CompanyResponsesSection } from "../../company-dashboard/CompanyResponsesSection";

export { CompanyAccessGuard, CompanyCabinetPage, CompanyPublicPage };

export function CompanyDashboardPage() {
  return <CompanyProfileSection />;
}

export function CompanyOpportunitiesPage() {
  return <CompanyOpportunitiesSection />;
}

export function CompanyResponsesPage() {
  return <CompanyResponsesSection />;
}
