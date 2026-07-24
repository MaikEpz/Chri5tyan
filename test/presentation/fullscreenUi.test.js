import assert from "node:assert/strict";
import test from "node:test";
import {
  shouldShowFullscreenButton,
  shouldShowFullscreenSuggestion,
} from "../../src/presentation/fullscreenUi.js";

const READY_MOBILE_STATE = {
  isFullscreen: false,
  isMobile: true,
  monitorOpen: false,
  suggestionDismissed: false,
  worldReady: true,
};

test("muestra la sugerencia móvil cuando el mundo está listo", () => {
  assert.equal(shouldShowFullscreenSuggestion(READY_MOBILE_STATE), true);
});

test("oculta la sugerencia después de cualquier decisión", () => {
  assert.equal(shouldShowFullscreenSuggestion({
    ...READY_MOBILE_STATE,
    suggestionDismissed: true,
  }), false);
});

test("no muestra la sugerencia en escritorio ni dentro del monitor", () => {
  assert.equal(shouldShowFullscreenSuggestion({
    ...READY_MOBILE_STATE,
    isMobile: false,
  }), false);
  assert.equal(shouldShowFullscreenSuggestion({
    ...READY_MOBILE_STATE,
    monitorOpen: true,
  }), false);
});

test("el botón solo se oculta mientras el monitor está abierto", () => {
  assert.equal(shouldShowFullscreenButton({ monitorOpen: false }), true);
  assert.equal(shouldShowFullscreenButton({ monitorOpen: true }), false);
});
