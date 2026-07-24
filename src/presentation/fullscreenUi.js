export function shouldShowFullscreenButton({ monitorOpen }) {
  return !monitorOpen;
}

export function shouldShowFullscreenSuggestion({
  isFullscreen,
  isMobile,
  monitorOpen,
  suggestionDismissed,
  worldReady,
}) {
  return Boolean(
    worldReady
    && isMobile
    && !isFullscreen
    && !monitorOpen
    && !suggestionDismissed
  );
}
