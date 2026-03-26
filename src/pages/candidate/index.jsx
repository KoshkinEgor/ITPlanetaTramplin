import { CandidateCabinetPage } from "./CandidateCabinetPage";
import { CandidateAccessGuard } from "./CandidateAccessGuard";
import { CandidateCareerPage } from "./CandidateCareerPage";
import { CandidateStandalonePage } from "./CandidateStandalonePage";
import { CandidateContactsApp } from "../../candidate-portal/CandidateContactsApp";
import { CandidateOverviewApp } from "../../candidate-portal/CandidateOverviewApp";
import { CandidateProjectsApp, CandidateResumeApp } from "../../candidate-portal/CandidatePortfolioApps";
import { CandidateProjectEditorApp } from "../../candidate-portal/CandidateProjectEditorApp";
import { CandidateResponsesApp } from "../../candidate-portal/CandidateResponsesApp";
import { CandidateResumeEditorApp } from "../../candidate-portal/CandidateResumeEditorApp";
import { CandidateSettingsApp } from "../../candidate-portal/CandidateSettingsApp";

export { CandidateAccessGuard, CandidateCabinetPage, CandidateCareerPage };

export function CandidateOverviewPage() {
  return <CandidateOverviewApp />;
}

export function CandidateResumePage() {
  return <CandidateResumeApp />;
}

export function CandidateResumeEditPage() {
  return (
    <CandidateStandalonePage>
      <CandidateResumeEditorApp />
    </CandidateStandalonePage>
  );
}

export function CandidateProjectsPage() {
  return <CandidateProjectsApp />;
}

export function CandidateProjectEditPage() {
  return (
    <CandidateStandalonePage>
      <CandidateProjectEditorApp />
    </CandidateStandalonePage>
  );
}

export function CandidateResponsesPage() {
  return <CandidateResponsesApp />;
}

export function CandidateContactsPage() {
  return <CandidateContactsApp />;
}

export function CandidateSettingsPage() {
  return <CandidateSettingsApp />;
}
