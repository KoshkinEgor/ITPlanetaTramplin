import React from "react";
import ReactDOM from "react-dom/client";
import "../styles/tokens.css";
import "../styles/globals.css";
import "../components/ui/index.css";
import "./auth.css";
import { AuthApp } from "./AuthApp";

const rootElement = document.getElementById("root");
const page = rootElement?.dataset.authPage || document.body.dataset.authPage || "login";

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <AuthApp page={page} />
    </React.StrictMode>
  );
}
