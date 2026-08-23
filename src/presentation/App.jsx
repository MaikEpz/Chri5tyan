import { useState } from "react";
import { ViewerPage } from "./components/ViewerPage.jsx";
import { EmailVerificationPage } from "./features/auth/EmailVerificationPage.jsx";

export function App({
  initialAuthRoute,
  authSessionService,
  catalogService,
  createCinemaRequestUseCase,
  exportProductionQuoteUseCase,
  modelViewerUseCase,
  ViewportComponent,
}) {
  const [authRoute, setAuthRoute] = useState(initialAuthRoute);
  const modelAsset = modelViewerUseCase.getModelAsset();

  if (authRoute?.type === "verify-email") {
    return (
      <EmailVerificationPage
        authSessionService={authSessionService}
        token={authRoute.token}
        onContinue={() => setAuthRoute(null)}
      />
    );
  }

  return (
    <ViewerPage
      authSessionService={authSessionService}
      catalogService={catalogService}
      createCinemaRequestUseCase={createCinemaRequestUseCase}
      exportProductionQuoteUseCase={exportProductionQuoteUseCase}
      modelAsset={modelAsset}
      ViewportComponent={ViewportComponent}
    />
  );
}
