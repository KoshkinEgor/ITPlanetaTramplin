import React from "react";
import ReactDOM from "react-dom/client";
import "../styles/tokens.css";
import "../styles/globals.css";
import "../components/ui/index.css";
import "./opportunity-detail-card.css";
import { OpportunityDetailCardApp } from "./OpportunityDetailCardApp";

const rootElement = document.getElementById("root");

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <OpportunityDetailCardApp />
    </React.StrictMode>
  );
}
