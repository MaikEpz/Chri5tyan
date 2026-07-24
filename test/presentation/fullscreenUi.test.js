import assert from "node:assert/strict";
import test from "node:test";
import {
  shouldShowFullscreenButton,
  shouldShowFullscreenSuggestion,
} from "../../src/presentation/fullscreenUi.js";

test("la sugerencia no sustituye el botón de pantalla completa", () => {
  const state = {
    isFullscreen: false,
    isMobile: true,
    isSupported: true,
    monitorOpen: false,
    suggestionDismissed: false,
    worldReady: true,
  };

  assert.equal(shouldShowFullscreenSuggestion(state), true);
  assert.equal(shouldShowFullscreenButton(state), true);
});

test("descartar la sugerencia conserva el botón", () => {
  const state = {
    isFullscreen: false,
    isMobile: true,
    isSupported: true,
    monitorOpen: false,
    suggestionDismissed: true,
    worldReady: true,
  };

  assert.equal(shouldShowFullscreenSuggestion(state), false);
  assert.equal(shouldShowFullscreenButton(state), true);
});

test("abrir el monitor oculta temporalmente ambos controles", () => {
  const state = {
    isFullscreen: false,
    isMobile: true,
    isSupported: true,
    monitorOpen: true,
    suggestionDismissed: false,
    worldReady: true,
  };

  assert.equal(shouldShowFullscreenSuggestion(state), false);
  assert.equal(shouldShowFullscreenButton(state), false);
});
