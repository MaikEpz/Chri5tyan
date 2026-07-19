export function getDevicePerformanceProfile(browser = window) {
  const { navigator, screen } = browser;
  const userAgent = navigator.userAgent;
  const platform = navigator.platform || "";
  const maxTouchPoints = navigator.maxTouchPoints || 0;
  const appleIdentity = `${userAgent} ${platform}`;
  const isAppleMobile =
    /iPhone|iPad|iPod/i.test(appleIdentity)
    || (/Macintosh|MacIntel/i.test(appleIdentity) && maxTouchPoints > 1);
  const isAndroidPhone = /Android/i.test(userAgent) && /Mobile/i.test(userAgent);
  const screenLongEdge = Math.max(screen.width, screen.height);
  const pixelRatio = browser.devicePixelRatio || 1;
  const cpuCores = navigator.hardwareConcurrency || 0;
  const deviceMemory = navigator.deviceMemory || 0;

  const highEndAppleMobile =
    isAppleMobile
    && screenLongEdge >= 844
    && pixelRatio >= 3;
  const highEndAndroid =
    isAndroidPhone
    && screenLongEdge >= 800
    && pixelRatio >= 2.5
    && cpuCores >= 8
    && deviceMemory >= 6;
  const unrestrictedMobile = highEndAppleMobile || highEndAndroid;
  const mobileLayout = browser
    .matchMedia("(pointer: coarse), (max-width: 768px)")
    .matches;

  return {
    lowPowerMode: mobileLayout && !unrestrictedMobile,
    unrestrictedMobile,
    maximumPixelRatio: Math.min(
      pixelRatio || 2,
      unrestrictedMobile ? 3 : 2,
    ),
  };
}
