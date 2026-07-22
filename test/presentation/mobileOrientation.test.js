import assert from "node:assert/strict";
import test from "node:test";
import {
  getLandscapeViewport,
  isPhoneDevice,
  isPortraitViewport,
} from "../../src/presentation/hooks/useMobileLandscape.js";

function createBrowser({
  coarsePointer = true,
  height = 844,
  maxTouchPoints = 5,
  mobile,
  portrait = true,
  userAgent = "",
  width = 390,
} = {}) {
  return {
    innerHeight: height,
    innerWidth: width,
    navigator: {
      maxTouchPoints,
      userAgent,
      ...(mobile === undefined ? {} : { userAgentData: { mobile } }),
    },
    screen: { height, width },
    matchMedia: (query) => ({
      matches: query.includes("orientation") ? portrait : coarsePointer,
    }),
  };
}

test("reconoce teléfonos móviles por la información del navegador", () => {
  assert.equal(isPhoneDevice(createBrowser({ mobile: true })), true);
  assert.equal(isPhoneDevice(createBrowser({
    mobile: undefined,
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)",
  })), true);
});

test("excluye tablets y equipos de escritorio", () => {
  assert.equal(isPhoneDevice(createBrowser({
    height: 1024,
    mobile: false,
    userAgent: "Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X)",
    width: 768,
  })), false);
  assert.equal(isPhoneDevice(createBrowser({
    coarsePointer: false,
    height: 900,
    maxTouchPoints: 0,
    mobile: undefined,
    width: 1440,
  })), false);
});

test("usa tamaño, tacto y puntero grueso como respaldo para teléfonos", () => {
  assert.equal(isPhoneDevice(createBrowser({ mobile: undefined })), true);
  assert.equal(isPhoneDevice(createBrowser({ mobile: false })), true);
  assert.equal(isPhoneDevice(createBrowser({
    height: 882,
    mobile: false,
    width: 674,
  })), true);
});

test("detecta la orientación actual del viewport", () => {
  assert.equal(isPortraitViewport(createBrowser({ portrait: true })), true);
  assert.equal(isPortraitViewport(createBrowser({ portrait: false })), false);
});

test("mantiene el mismo lienzo horizontal al girar el teléfono", () => {
  const portraitBrowser = createBrowser({ height: 740, portrait: true, width: 360 });
  const landscapeBrowser = createBrowser({ height: 360, portrait: false, width: 740 });

  assert.deepEqual(getLandscapeViewport(portraitBrowser), {
    height: 360,
    scale: 0.4864864864864865,
    width: 740,
  });
  assert.deepEqual(getLandscapeViewport(landscapeBrowser), {
    height: 360,
    scale: 1,
    width: 740,
  });
});

test("permite ampliar el lienzo sin cambiar su proporción interna", () => {
  const browser = createBrowser({ height: 480, portrait: false, width: 980 });
  browser.screen = { height: 360, width: 740 };

  assert.deepEqual(getLandscapeViewport(browser), {
    height: 360,
    scale: 1.3243243243243243,
    width: 740,
  });
});
