import { useCallback, useEffect, useState } from "react";

export function useFullscreenMode(documentRef = document) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    const handleChange = () => setIsFullscreen(Boolean(documentRef.fullscreenElement));
    setIsSupported(Boolean(
      documentRef.fullscreenEnabled
      && documentRef.documentElement.requestFullscreen,
    ));
    handleChange();
    documentRef.addEventListener("fullscreenchange", handleChange);
    return () => documentRef.removeEventListener("fullscreenchange", handleChange);
  }, [documentRef]);

  const toggle = useCallback(async () => {
    try {
      if (documentRef.fullscreenElement) {
        await documentRef.exitFullscreen();
      } else {
        await documentRef.documentElement.requestFullscreen({ navigationUI: "hide" });
      }
    } catch (error) {
      console.warn("No se pudo cambiar el modo de pantalla completa.", error);
    }
  }, [documentRef]);

  return { isFullscreen, isSupported, toggle };
}
