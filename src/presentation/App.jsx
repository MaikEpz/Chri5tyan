import { ViewerPage } from "./components/ViewerPage.jsx";

export function App({
  exportProductionQuoteUseCase,
  modelViewerUseCase,
  ViewportComponent,
}) {
  const modelAsset = modelViewerUseCase.getModelAsset();

  return (
    <ViewerPage
      exportProductionQuoteUseCase={exportProductionQuoteUseCase}
      modelAsset={modelAsset}
      ViewportComponent={ViewportComponent}
    />
  );
}
