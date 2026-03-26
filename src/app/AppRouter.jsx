import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { GuestOnlyRoute } from "../auth/route-guards";
import {
  AuthLoginPage,
  CandidateRegistrationPage,
  CompanyExtendedRegistrationPage,
  CompanyQuickRegistrationPage,
  ConfirmEmailPage,
  ForgotPasswordPage,
  ResetPasswordPage,
} from "../pages/auth/index.jsx";
import {
  CandidateAccessGuard,
  CandidateCabinetPage,
  CandidateCareerPage,
  CandidateContactsPage,
  CandidateOverviewPage,
  CandidateProjectEditPage,
  CandidateProjectsPage,
  CandidateResponsesPage,
  CandidateResumeEditPage,
  CandidateResumePage,
  CandidateSettingsPage,
} from "../pages/candidate/index.jsx";
import {
  CompanyAccessGuard,
  CompanyCabinetPage,
  CompanyDashboardPage,
  CompanyOpportunitiesPage,
  CompanyResponsesPage,
} from "../pages/company/index.jsx";
import { HomePage } from "../pages/home/HomePage";
import {
  ModeratorCabinetPage,
  ModeratorAccessGuard,
  ModeratorCompaniesPage,
  ModeratorComplaintsPage,
  ModeratorDashboardPage,
  ModeratorLogsPage,
  ModeratorOpportunitiesPage,
  ModeratorSettingsPage,
  ModeratorTagsSystemPage,
  ModeratorUsersPage,
} from "../pages/moderator/index.jsx";
import { OpportunitiesCatalogPage, OpportunityDetailPage } from "../pages/opportunities/index.jsx";
import { UiKitPage } from "../pages/ui-kit/UiKitPage";
import { routes } from "./routes";

export function AppRoutes({ uiKitEnabled = import.meta.env.DEV }) {
  return (
    <Routes>
      <Route path={routes.home} element={<HomePage />} />

      <Route element={<GuestOnlyRoute />}>
        <Route path={routes.auth.login} element={<AuthLoginPage />} />
        <Route path={routes.auth.registerCandidate} element={<CandidateRegistrationPage />} />
        <Route path={routes.auth.registerCompany} element={<CompanyQuickRegistrationPage />} />
        <Route path={routes.auth.registerCompanyExtended} element={<CompanyExtendedRegistrationPage />} />
        <Route path={routes.auth.confirmEmail} element={<ConfirmEmailPage />} />
        <Route path={routes.auth.forgotPassword} element={<ForgotPasswordPage />} />
        <Route path={routes.auth.resetPassword} element={<ResetPasswordPage />} />
      </Route>

      <Route path={routes.opportunities.catalog} element={<OpportunitiesCatalogPage />} />
      <Route path={routes.opportunities.detail} element={<OpportunityDetailPage />} />
      <Route path={routes.candidate.career} element={<CandidateCareerPage />} />

      <Route element={<CandidateAccessGuard />}>
        <Route path={routes.candidate.resumeEdit} element={<CandidateResumeEditPage />} />
        <Route path={routes.candidate.projectEdit} element={<CandidateProjectEditPage />} />

        <Route path="candidate" element={<CandidateCabinetPage />}>
          <Route index element={<Navigate to="profile" replace />} />
          <Route path="profile" element={<CandidateOverviewPage />} />
          <Route path="resume" element={<CandidateResumePage />} />
          <Route path="projects" element={<CandidateProjectsPage />} />
          <Route path="responses" element={<CandidateResponsesPage />} />
          <Route path="contacts" element={<CandidateContactsPage />} />
          <Route path="settings" element={<CandidateSettingsPage />} />
        </Route>
      </Route>

      <Route element={<CompanyAccessGuard />}>
        <Route path="company/dashboard" element={<CompanyCabinetPage />}>
          <Route index element={<CompanyDashboardPage />} />
          <Route path="opportunities" element={<CompanyOpportunitiesPage />} />
          <Route path="responses" element={<CompanyResponsesPage />} />
        </Route>
      </Route>

      <Route element={<ModeratorAccessGuard />}>
        <Route path="moderator" element={<ModeratorCabinetPage />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<ModeratorDashboardPage />} />
          <Route path="opportunities" element={<ModeratorOpportunitiesPage />} />
          <Route path="companies" element={<ModeratorCompaniesPage />} />
          <Route path="users" element={<ModeratorUsersPage />} />
          <Route path="complaints" element={<ModeratorComplaintsPage />} />
          <Route path="tags-system" element={<ModeratorTagsSystemPage />} />
          <Route path="logs" element={<ModeratorLogsPage />} />
          <Route path="settings" element={<ModeratorSettingsPage />} />
        </Route>
      </Route>

      {uiKitEnabled ? <Route path={routes.uiKit} element={<UiKitPage />} /> : null}

      <Route path="*" element={<Navigate to={routes.home} replace />} />
    </Routes>
  );
}

export function AppRouter({ uiKitEnabled = import.meta.env.DEV }) {
  return (
    <BrowserRouter>
      <AppRoutes uiKitEnabled={uiKitEnabled} />
    </BrowserRouter>
  );
}
