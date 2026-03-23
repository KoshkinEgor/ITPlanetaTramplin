import React from "react";
import ReactDOM from "react-dom/client";
import "../styles/tokens.css";
import "../styles/globals.css";
import "../components/ui/index.css";
import "./moderator-dashboard.css";
import { ModeratorLogsApp } from "./ModeratorLogsApp";

const rootElement = document.getElementById("root");

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <ModeratorLogsApp />
    </React.StrictMode>
  );
}
