import { ViewerPage } from "./components/ViewerPage.jsx";

export function App({ modelViewerUseCase, SceneComponent }) {
  const modelAsset = modelViewerUseCase.getModelAsset();

  return <ViewerPage modelAsset={modelAsset} SceneComponent={SceneComponent} />;
}
