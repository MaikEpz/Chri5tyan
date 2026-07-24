import assert from "node:assert/strict";
import test from "node:test";
import { getFullscreenApi } from "../../src/presentation/hooks/useFullscreenMode.js";

test("detecta la API estándar sin depender de fullscreenEnabled", async () => {
  let requestedOptions = null;
  const documentRef = {
    documentElement: {
      requestFullscreen: async (options) => {
        requestedOptions = options;
      },
    },
    exitFullscreen: async () => {},
    fullscreenEnabled: false,
    fullscreenElement: null,
  };

  const api = getFullscreenApi(documentRef);

  assert.equal(typeof api.request, "function");
  assert.equal(typeof api.exit, "function");
  await api.request({ navigationUI: "hide" });
  assert.deepEqual(requestedOptions, { navigationUI: "hide" });
});

test("usa la variante WebKit cuando la API estándar no existe", async () => {
  let requested = false;
  let exited = false;
  const documentRef = {
    documentElement: {
      webkitRequestFullscreen: async () => {
        requested = true;
      },
    },
    webkitExitFullscreen: async () => {
      exited = true;
    },
    webkitFullscreenElement: null,
  };

  const api = getFullscreenApi(documentRef);

  await api.request();
  await api.exit();
  assert.equal(requested, true);
  assert.equal(exited, true);
});

test("informa que la API no existe sin impedir que la interfaz muestre el botón", () => {
  const api = getFullscreenApi({ documentElement: {} });

  assert.equal(api.request, null);
  assert.equal(api.exit, null);
  assert.equal(api.getElement(), null);
});
