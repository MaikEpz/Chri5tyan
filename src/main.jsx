import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/poppins/latin-400.css";
import "@fontsource/poppins/latin-500.css";
import "@fontsource/poppins/latin-600.css";
import "@fontsource/poppins/latin-700.css";
import "@fontsource/poppins/latin-800.css";
import { ModelViewerUseCase } from "./application/ModelViewerUseCase.js";
import { ExportProductionQuoteUseCase } from "./application/production/ExportProductionQuoteUseCase.js";
import { ModelAsset } from "./domain/ModelAsset.js";
import { JsPdfQuoteExporter } from "./infrastructure/pdf/JsPdfQuoteExporter.js";
import { ReactThreeViewport } from "./infrastructure/react-three/ReactThreeViewport.jsx";
import { App } from "./presentation/App.jsx";
import "./presentation/styles.css";

const chrisModel = new ModelAsset({
  name: "Chris",
  source: new URL("../Chris.glb", import.meta.url).href,
});

const modelViewerUseCase = new ModelViewerUseCase({ modelAsset: chrisModel });
const exportProductionQuoteUseCase = new ExportProductionQuoteUseCase({
  quotePdfExporter: new JsPdfQuoteExporter(),
});

createRoot(document.querySelector("#app")).render(
  <StrictMode>
    <App
      exportProductionQuoteUseCase={exportProductionQuoteUseCase}
      modelViewerUseCase={modelViewerUseCase}
      ViewportComponent={ReactThreeViewport}
    />
  </StrictMode>,
);
