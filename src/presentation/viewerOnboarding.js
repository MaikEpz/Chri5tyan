export const VIEWER_ONBOARDING_KEY = "chris.viewer.onboarding.v1";

function readSeen(storage) {
  try {
    return storage?.getItem(VIEWER_ONBOARDING_KEY) === "seen";
  } catch {
    return false;
  }
}

function writeSeen(storage) {
  try {
    storage?.setItem(VIEWER_ONBOARDING_KEY, "seen");
    return Boolean(storage);
  } catch {
    return false;
  }
}

function getWindowStorage(name) {
  try {
    return typeof window === "undefined" ? null : window[name];
  } catch {
    return null;
  }
}

export function createViewerOnboardingStore({
  persistentStorage = null,
  sessionStorage = null,
} = {}) {
  let memorySeen = false;

  return Object.freeze({
    hasSeen() {
      return memorySeen || readSeen(persistentStorage) || readSeen(sessionStorage);
    },
    markSeen() {
      memorySeen = true;
      if (!writeSeen(persistentStorage)) writeSeen(sessionStorage);
    },
  });
}

export const viewerOnboardingStore = createViewerOnboardingStore({
  persistentStorage: getWindowStorage("localStorage"),
  sessionStorage: getWindowStorage("sessionStorage"),
});

export function shouldShowViewerOnboarding({
  monitorOpen,
  onboardingRequested,
  worldReady,
}) {
  return Boolean(worldReady && onboardingRequested && !monitorOpen);
}
