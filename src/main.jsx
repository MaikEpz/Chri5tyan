import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ModelViewerUseCase } from "./application/ModelViewerUseCase.js";
import { ModelAsset } from "./domain/ModelAsset.js";
import { ReactThreeViewport } from "./infrastructure/react-three/ReactThreeViewport.jsx";
import { App } from "./presentation/App.jsx";
import "./presentation/styles.css";

const chrisModel = new ModelAsset({
  name: "Chris",
  source: new URL("../Chris.glb", import.meta.url).href,
});

const modelViewerUseCase = new ModelViewerUseCase({ modelAsset: chrisModel });

createRoot(document.querySelector("#app")).render(
  <StrictMode>
    <App modelViewerUseCase={modelViewerUseCase} ViewportComponent={ReactThreeViewport} />
  </StrictMode>,
);
