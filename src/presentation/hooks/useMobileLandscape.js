import { useEffect, useState } from "react";

const PHONE_USER_AGENT = /Android.+Mobile|iPhone|iPod|Windows Phone/i;
const PHONE_MAX_SHORT_EDGE = 600;

export function isPhoneDevice(browser = window) {
  const navigatorRef = browser.navigator ?? {};
  const userAgent = navigatorRef.userAgent ?? "";

  if (typeof navigatorRef.userAgentData?.mobile === "boolean") {
    return navigatorRef.userAgentData.mobile;
  }

  if (PHONE_USER_AGENT.test(userAgent)) return true;

  const screenRef = browser.screen ?? {};
  const shortEdge = Math.min(
    Number(screenRef.width) || Number.POSITIVE_INFINITY,
    Number(screenRef.height) || Number.POSITIVE_INFINITY,
  );
  const hasTouch = (navigatorRef.maxTouchPoints ?? 0) > 0;
  const hasCoarsePointer = browser.matchMedia?.("(pointer: coarse)").matches ?? false;

  return hasTouch && hasCoarsePointer && shortEdge <= PHONE_MAX_SHORT_EDGE;
}

export function isPortraitViewport(browser = window) {
  if (typeof browser.matchMedia === "function") {
    return browser.matchMedia("(orientation: portrait)").matches;
  }

  return browser.innerHeight > browser.innerWidth;
}

export function useMobileLandscape(browser = window) {
  const [state, setState] = useState(() => readOrientationState(browser));

  useEffect(() => {
    const orientationQuery = browser.matchMedia?.("(orientation: portrait)");
    const update = () => setState(readOrientationState(browser));

    update();
    browser.addEventListener?.("resize", update);
    browser.addEventListener?.("orientationchange", update);

    if (orientationQuery?.addEventListener) {
      orientationQuery.addEventListener("change", update);
    } else {
      orientationQuery?.addListener?.(update);
    }

    return () => {
      browser.removeEventListener?.("resize", update);
      browser.removeEventListener?.("orientationchange", update);

      if (orientationQuery?.removeEventListener) {
        orientationQuery.removeEventListener("change", update);
      } else {
        orientationQuery?.removeListener?.(update);
      }
    };
  }, [browser]);

  return state;
}

function readOrientationState(browser) {
  const isPhone = isPhoneDevice(browser);
  const isPortrait = isPortraitViewport(browser);

  return {
    isPhone,
    isPortrait,
    requiresLandscape: isPhone && isPortrait,
  };
}
