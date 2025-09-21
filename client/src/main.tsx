import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./i18n";
import { I18nextProvider } from "react-i18next";
import i18n from "./i18n";
import { Suspense } from "react";

createRoot(document.getElementById("root")!).render(
  <I18nextProvider i18n={i18n}>
    <Suspense fallback={<div>Loading...</div>}>
      <App />
    </Suspense>
  </I18nextProvider>
);
