import { ViewerPage } from "./components/ViewerPage.jsx";

export function App({ modelViewerUseCase, ViewportComponent }) {
  const modelAsset = modelViewerUseCase.getModelAsset();

  return <ViewerPage modelAsset={modelAsset} ViewportComponent={ViewportComponent} />;
}
