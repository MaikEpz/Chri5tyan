export const FULLSCREEN_SUGGESTION_KEY = "chris-fullscreen-suggestion-seen-v2";

export function shouldShowFullscreenSuggestion({
  isFullscreen,
  isMobile,
  isSupported,
  monitorOpen,
  suggestionDismissed,
  worldReady,
}) {
  return (
    worldReady
    && isMobile
    && isSupported
    && !isFullscreen
    && !monitorOpen
    && !suggestionDismissed
  );
}

export function shouldShowFullscreenButton({ isSupported, monitorOpen }) {
  return isSupported && !monitorOpen;
}
