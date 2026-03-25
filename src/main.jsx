import React from "react";
import ReactDOM from "react-dom/client";
import "./shared/styles/index.css";
import "./shared/ui/index.css";
import { AppRouter } from "./app/AppRouter";

const rootElement = document.getElementById("root");

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <AppRouter />
    </React.StrictMode>
  );
}
