import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/poppins/latin-400.css";
import "@fontsource/poppins/latin-500.css";
import "@fontsource/poppins/latin-600.css";
import "@fontsource/poppins/latin-700.css";
import "@fontsource/poppins/latin-800.css";
import { ModelViewerUseCase } from "./application/ModelViewerUseCase.js";
import { AuthSessionService } from "./application/auth/AuthSessionService.js";
import { consumeVerificationRoute } from "./application/auth/verificationRoute.js";
import { CatalogService } from "./application/catalog/CatalogService.js";
import { CreateCinemaRequestUseCase } from "./application/cinema/CreateCinemaRequestUseCase.js";
import { DemoGateway } from "./application/demo/DemoGateway.js";
import { ExportProductionQuoteUseCase } from "./application/production/ExportProductionQuoteUseCase.js";
import { ModelAsset } from "./domain/ModelAsset.js";
import { BrowserSessionStore } from "./infrastructure/browser/BrowserSessionStore.js";
import { ApiClient } from "./infrastructure/http/ApiClient.js";
import { ChrisApiGateway } from "./infrastructure/http/ChrisApiGateway.js";
import { JsPdfQuoteExporter } from "./infrastructure/pdf/JsPdfQuoteExporter.js";
import { App } from "./presentation/App.jsx";
import { lazyNamed } from "./presentation/lazyNamed.js";
import chrisLogoSvg from "./assets/branding/chris-logo.svg?raw";
import "./presentation/tailwind.css";
import "./presentation/styles.css";

const ReactThreeViewport = lazyNamed(
  () => import("./infrastructure/react-three/ReactThreeViewport.jsx"),
  "ReactThreeViewport",
);

const chrisModel = new ModelAsset({
  name: "Chris",
  source: new URL("../Chris.glb", import.meta.url).href,
});

const modelViewerUseCase = new ModelViewerUseCase({ modelAsset: chrisModel });
const exportProductionQuoteUseCase = new ExportProductionQuoteUseCase({
  quotePdfExporter: new JsPdfQuoteExporter({ logoSvg: chrisLogoSvg }),
});
const sessionStore = new BrowserSessionStore();
const apiBaseUrl = String(import.meta.env.VITE_API_BASE_URL || "").trim();
const apiClient = new ApiClient({
  baseUrl: apiBaseUrl,
  tokenProvider: () => sessionStore.getToken(),
  onUnauthorized: () => sessionStore.clear(),
});
const apiGateway = apiBaseUrl ? new ChrisApiGateway({ apiClient }) : new DemoGateway();
const authSessionService = new AuthSessionService({
  authGateway: apiGateway,
  sessionStore,
});
const catalogService = new CatalogService({ catalogGateway: apiGateway });
const createCinemaRequestUseCase = new CreateCinemaRequestUseCase({
  cinemaGateway: apiGateway,
});
const initialAuthRoute = consumeVerificationRoute(window);

createRoot(document.querySelector("#app")).render(
  <StrictMode>
    <App
      initialAuthRoute={initialAuthRoute}
      authSessionService={authSessionService}
      catalogService={catalogService}
      createCinemaRequestUseCase={createCinemaRequestUseCase}
      exportProductionQuoteUseCase={exportProductionQuoteUseCase}
      modelViewerUseCase={modelViewerUseCase}
      ViewportComponent={ReactThreeViewport}
    />
  </StrictMode>,
);
