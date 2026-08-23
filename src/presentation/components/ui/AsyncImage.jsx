import { useCallback, useEffect, useRef, useState } from "react";
import { classNames } from "./classNames.js";

export function AsyncImage({
  alt = "",
  className = "",
  errorMessage = "No se pudo cargar la imagen",
  onError,
  onLoad,
  onReady,
  src,
  wrapperClassName = "",
  ...imageProps
}) {
  const imageRef = useRef(null);
  const callbacksRef = useRef({ onError, onLoad, onReady });
  const [status, setStatus] = useState(src ? "loading" : "error");
  callbacksRef.current = { onError, onLoad, onReady };

  const resolveCachedImage = useCallback((image) => {
    imageRef.current = image;
    if (!image || !src || !image.complete) return;
    const nextStatus = image.naturalWidth > 0 ? "loaded" : "error";
    setStatus(nextStatus);
    if (nextStatus === "loaded") callbacksRef.current.onReady?.(image);
  }, [src]);

  useEffect(() => {
    setStatus(src ? "loading" : "error");
    resolveCachedImage(imageRef.current);
  }, [resolveCachedImage, src]);

  const handleLoad = (event) => {
    setStatus("loaded");
    callbacksRef.current.onReady?.(event.currentTarget);
    callbacksRef.current.onLoad?.(event);
  };
  const handleError = (event) => {
    setStatus("error");
    callbacksRef.current.onError?.(event);
  };

  return (
    <span
      className={classNames("async-image-frame", wrapperClassName)}
      data-image-state={status}
      aria-busy={status === "loading" || undefined}
    >
      {status === "loading" && <span className="async-image-skeleton" aria-hidden="true" />}
      {status === "error" && <span className="async-image-error" role="img" aria-label={errorMessage}>{errorMessage}</span>}
      {src && (
        <img
          {...imageProps}
          key={src}
          ref={resolveCachedImage}
          className={classNames("async-image-content", className)}
          src={src}
          alt={alt}
          aria-hidden={status === "error" || undefined}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}
    </span>
  );
}

export function AsyncVideo({
  className = "",
  errorMessage = "No se pudo cargar el video",
  onError,
  onLoadedData,
  poster,
  src,
  wrapperClassName = "",
  ...videoProps
}) {
  const videoRef = useRef(null);
  const [status, setStatus] = useState(src ? "loading" : "error");

  const resolveCachedVideo = useCallback((video) => {
    videoRef.current = video;
    if (!video || !src || video.readyState < 2) return;
    setStatus("loaded");
  }, [src]);

  useEffect(() => {
    setStatus(src ? "loading" : "error");
    resolveCachedVideo(videoRef.current);
  }, [poster, resolveCachedVideo, src]);

  return (
    <span className={classNames("async-image-frame", wrapperClassName)} data-image-state={status} aria-busy={status === "loading" || undefined}>
      {status === "loading" && <span className="async-image-skeleton" aria-hidden="true" />}
      {status === "error" && <span className="async-image-error" role="img" aria-label={errorMessage}>{errorMessage}</span>}
      {src && <video {...videoProps} key={`${src}:${poster || ""}`} ref={resolveCachedVideo} className={classNames("async-image-content", className)} src={src} poster={poster} onLoadedData={(event) => { setStatus("loaded"); onLoadedData?.(event); }} onError={(event) => { setStatus("error"); onError?.(event); }} />}
    </span>
  );
}
