import assert from "node:assert/strict";
import test from "node:test";
import { getDevicePerformanceProfile } from "../../src/infrastructure/browser/devicePerformance.js";

function createBrowser({
  userAgent,
  width,
  height,
  pixelRatio,
  cpuCores,
  deviceMemory,
  mobileLayout = true,
}) {
  return {
    devicePixelRatio: pixelRatio,
    navigator: {
      deviceMemory,
      hardwareConcurrency: cpuCores,
      maxTouchPoints: mobileLayout ? 5 : 0,
      platform: "",
      userAgent,
    },
    screen: { width, height },
    matchMedia: () => ({ matches: mobileLayout }),
  };
}

test("activa el modo de bajo consumo en Android modestos", () => {
  const profile = getDevicePerformanceProfile(createBrowser({
    userAgent: "Mozilla/5.0 (Linux; Android 12; Mobile)",
    width: 360,
    height: 780,
    pixelRatio: 2,
    cpuCores: 4,
    deviceMemory: 4,
  }));

  assert.equal(profile.lowPowerMode, true);
  assert.equal(profile.unrestrictedMobile, false);
  assert.equal(profile.maximumPixelRatio, 2);
});

test("mantiene calidad completa en Android de gama alta", () => {
  const profile = getDevicePerformanceProfile(createBrowser({
    userAgent: "Mozilla/5.0 (Linux; Android 16; Mobile)",
    width: 430,
    height: 932,
    pixelRatio: 3,
    cpuCores: 8,
    deviceMemory: 8,
  }));

  assert.equal(profile.lowPowerMode, false);
  assert.equal(profile.unrestrictedMobile, true);
  assert.equal(profile.maximumPixelRatio, 3);
});
