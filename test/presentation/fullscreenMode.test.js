import assert from "node:assert/strict";
import test from "node:test";
import { getFullscreenApi } from "../../src/presentation/hooks/useFullscreenMode.js";

test("detecta y ejecuta la API estándar de pantalla completa", async () => {
  let entered = false;
  let exited = false;
  const documentRef = {
    documentElement: {
      requestFullscreen: async () => {
        entered = true;
      },
    },
    exitFullscreen: async () => {
      exited = true;
    },
    fullscreenElement: null,
  };
  const api = getFullscreenApi(documentRef);

  await api.request({ navigationUI: "hide" });
  await api.exit();

  assert.equal(entered, true);
  assert.equal(exited, true);
});

test("conserva compatibilidad con la API WebKit", async () => {
  let entered = false;
  let exited = false;
  const fullscreenElement = {};
  const documentRef = {
    documentElement: {
      webkitRequestFullscreen: async () => {
        entered = true;
      },
    },
    webkitExitFullscreen: async () => {
      exited = true;
    },
    webkitFullscreenElement: fullscreenElement,
  };
  const api = getFullscreenApi(documentRef);

  await api.request();
  await api.exit();

  assert.equal(api.getElement(), fullscreenElement);
  assert.equal(entered, true);
  assert.equal(exited, true);
});
