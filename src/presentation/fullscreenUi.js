export function shouldShowFullscreenButton({ monitorOpen }) {
  return !monitorOpen;
}

export function shouldShowFullscreenSuggestion({
  hasCompletedFirstInteraction,
  isFullscreen,
  isMobile,
  monitorOpen,
  onboardingVisible,
  suggestionDismissed,
  worldReady,
}) {
  return Boolean(
    worldReady
    && hasCompletedFirstInteraction
    && isMobile
    && !isFullscreen
    && !monitorOpen
    && !onboardingVisible
    && !suggestionDismissed
  );
}
