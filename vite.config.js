import { resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        index: resolve(__dirname, "index.html"),
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
