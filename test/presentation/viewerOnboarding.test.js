import assert from "node:assert/strict";
import test from "node:test";
import {
  createViewerOnboardingStore,
  shouldShowViewerOnboarding,
  VIEWER_ONBOARDING_KEY,
} from "../../src/presentation/viewerOnboarding.js";

function createStorage({ throws = false } = {}) {
  const values = new Map();
  return {
    getItem(key) {
      if (throws) throw new Error("Storage unavailable");
      return values.get(key) ?? null;
    },
    setItem(key, value) {
      if (throws) throw new Error("Storage unavailable");
      values.set(key, value);
    },
  };
}

test("persiste la guía completada en el dispositivo", () => {
  const persistentStorage = createStorage();
  const store = createViewerOnboardingStore({ persistentStorage });

  assert.equal(store.hasSeen(), false);
  store.markSeen();
  assert.equal(persistentStorage.getItem(VIEWER_ONBOARDING_KEY), "seen");
  assert.equal(store.hasSeen(), true);
});

test("usa la sesión cuando el almacenamiento persistente falla", () => {
  const sessionStorage = createStorage();
  const store = createViewerOnboardingStore({
    persistentStorage: createStorage({ throws: true }),
    sessionStorage,
  });

  store.markSeen();
  assert.equal(sessionStorage.getItem(VIEWER_ONBOARDING_KEY), "seen");
  assert.equal(store.hasSeen(), true);
});

test("muestra la guía solo cuando el mundo está listo y el monitor cerrado", () => {
  const readyState = {
    monitorOpen: false,
    onboardingRequested: true,
    worldReady: true,
  };

  assert.equal(shouldShowViewerOnboarding(readyState), true);
  assert.equal(shouldShowViewerOnboarding({ ...readyState, worldReady: false }), false);
  assert.equal(shouldShowViewerOnboarding({ ...readyState, monitorOpen: true }), false);
  assert.equal(shouldShowViewerOnboarding({ ...readyState, onboardingRequested: false }), false);
});
