import { useCallback, useEffect, useState } from "react";

export function getFullscreenApi(documentRef) {
  const root = documentRef.documentElement;

  return {
    exit: documentRef.exitFullscreen
      ? () => documentRef.exitFullscreen()
      : documentRef.webkitExitFullscreen
        ? () => documentRef.webkitExitFullscreen()
        : null,
    getElement: () => (
      documentRef.fullscreenElement
      ?? documentRef.webkitFullscreenElement
      ?? null
    ),
    request: root.requestFullscreen
      ? (options) => root.requestFullscreen(options)
      : root.webkitRequestFullscreen
        ? () => root.webkitRequestFullscreen()
        : null,
  };
}

export function useFullscreenMode(documentRef = document) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    const api = getFullscreenApi(documentRef);
    const handleChange = () => setIsFullscreen(Boolean(api.getElement()));

    setIsSupported(Boolean(api.request && api.exit));
    handleChange();
    documentRef.addEventListener("fullscreenchange", handleChange);
    documentRef.addEventListener("webkitfullscreenchange", handleChange);

    return () => {
      documentRef.removeEventListener("fullscreenchange", handleChange);
      documentRef.removeEventListener("webkitfullscreenchange", handleChange);
    };
  }, [documentRef]);

  const toggle = useCallback(async () => {
    const api = getFullscreenApi(documentRef);

    try {
      if (api.getElement()) {
        if (!api.exit) {
          throw new Error("Fullscreen exit is unavailable.");
        }
        await api.exit();
      } else {
        if (!api.request) {
          throw new Error("Fullscreen request is unavailable.");
        }
        await api.request({ navigationUI: "hide" });
      }
      return true;
    } catch (error) {
      console.warn("No se pudo cambiar el modo de pantalla completa.", error);
      return false;
    }
  }, [documentRef]);

  return { isFullscreen, isSupported, toggle };
}
