import { useCallback, useEffect, useState } from "react";

export function getFullscreenApi(documentRef) {
  const root = documentRef.documentElement;
  const request = root.requestFullscreen
    ? (options) => root.requestFullscreen(options)
    : root.webkitRequestFullscreen
      ? () => root.webkitRequestFullscreen()
      : null;
  const exit = documentRef.exitFullscreen
    ? () => documentRef.exitFullscreen()
    : documentRef.webkitExitFullscreen
      ? () => documentRef.webkitExitFullscreen()
      : null;

  return {
    exit,
    getElement: () => (
      documentRef.fullscreenElement
      ?? documentRef.webkitFullscreenElement
      ?? null
    ),
    request,
  };
}

export function useFullscreenMode(documentRef = document) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const api = getFullscreenApi(documentRef);
    const handleChange = () => {
      setIsFullscreen(Boolean(api.getElement()));
      setError(null);
    };
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
    setError(null);

    try {
      if (api.getElement()) {
        if (!api.exit) throw new Error("Fullscreen exit is unavailable.");
        await api.exit();
      } else {
        if (!api.request) throw new Error("Fullscreen request is unavailable.");
        await api.request({ navigationUI: "hide" });
      }
      return true;
    } catch (error) {
      console.warn("No se pudo cambiar el modo de pantalla completa.", error);
      setError("Chrome no pudo activar la pantalla completa. Inténtalo nuevamente o revisa los permisos del navegador.");
      return false;
    }
  }, [documentRef]);

  const clearError = useCallback(() => setError(null), []);

  return { clearError, error, isFullscreen, isSupported, toggle };
}
