import { resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        index: resolve(__dirname, "index.html"),
        uiKitReact: resolve(__dirname, "ui-kit-react.html"),
        homeIndex: resolve(__dirname, "pages/home/index.html"),
        moderatorDashboard: resolve(__dirname, "pages/curator/moderator-dashboard.html"),
        moderatorOpportunities: resolve(__dirname, "pages/curator/moderator-opportunities.html"),
        moderatorCompanies: resolve(__dirname, "pages/curator/moderator-companies.html"),
        moderatorUsers: resolve(__dirname, "pages/curator/moderator-users.html"),
        moderatorReports: resolve(__dirname, "pages/curator/moderator-reports.html"),
        moderatorLogs: resolve(__dirname, "pages/curator/moderator-logs.html"),
        moderatorSettings: resolve(__dirname, "pages/curator/moderator-settings.html"),
        opportunitiesCatalog: resolve(__dirname, "pages/opportunities/opportunities-catalog.html"),
        opportunityDetailCard: resolve(__dirname, "pages/opportunities/opportunity-detail-card.html"),
        candidateProfile: resolve(__dirname, "pages/candidate/candidate-profile.html"),
        candidateResume: resolve(__dirname, "pages/candidate/candidate-resume.html"),
        candidateResumeEditor: resolve(__dirname, "pages/candidate/candidate-resume-editor.html"),
        candidateProjects: resolve(__dirname, "pages/candidate/candidate-projects.html"),
        candidateProjectEditor: resolve(__dirname, "pages/candidate/candidate-project-editor.html"),
        candidateResponses: resolve(__dirname, "pages/candidate/candidate-responses.html"),
        candidateContacts: resolve(__dirname, "pages/candidate/candidate-contacts.html"),
        candidateSettings: resolve(__dirname, "pages/candidate/candidate-settings.html"),
        authLogin: resolve(__dirname, "pages/auth/login.html"),
        authLoginDetails: resolve(__dirname, "pages/auth/login-details.html"),
        authRegister: resolve(__dirname, "pages/auth/candidate-registration.html"),
        authCompanyQuick: resolve(__dirname, "pages/auth/company-registration.html"),
        authCompanyExtended: resolve(__dirname, "pages/auth/company-registration-extended.html"),
        authConfirm: resolve(__dirname, "pages/auth/email-confirmation.html"),
      },
    },
  },
});
