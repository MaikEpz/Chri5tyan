import { useCallback, useEffect, useRef, useState } from "react";
import "@fontsource/cormorant-garamond/latin-500.css";
import "@fontsource/cormorant-garamond/latin-600.css";
import { PRODUCTION_REFERENCES } from "../../../domain/production/productionReferences.js";
import { getPortfolioImage } from "./portfolioImages.js";
import { getPortfolioVideo } from "./portfolioVideos.js";

export function PhonePortfolioWorkspace({ onBack }) {
  const feedRef = useRef(null);
  const videoRefs = useRef(new Map());
  const [activeId, setActiveId] = useState(PRODUCTION_REFERENCES[0]?.id ?? null);
  const [failedVideoIds, setFailedVideoIds] = useState(() => new Set());
  const [isMuted, setIsMuted] = useState(true);

  const registerVideo = useCallback((id, video) => {
    if (video) {
      videoRefs.current.set(id, video);
    } else {
      videoRefs.current.delete(id);
    }
  }, []);

  const pauseAllVideos = useCallback(() => {
    videoRefs.current.forEach((video) => video.pause());
  }, []);

  useEffect(() => {
    const feed = feedRef.current;
    if (!feed || typeof IntersectionObserver === "undefined") return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visibleEntry?.intersectionRatio >= 0.6) {
          setActiveId(visibleEntry.target.dataset.referenceId);
        }
      },
      {
        root: feed,
        threshold: [0.6, 0.75, 0.9],
      },
    );

    feed.querySelectorAll("[data-reference-id]").forEach((slide) => observer.observe(slide));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    videoRefs.current.forEach((video, id) => {
      video.muted = isMuted;

      if (
        id !== activeId
        || failedVideoIds.has(id)
        || document.visibilityState === "hidden"
      ) {
        video.pause();
        return;
      }

      video.play().catch(() => {
        // Autoplay can still be declined by browser or OS policy.
      });
    });
  }, [activeId, failedVideoIds, isMuted]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        pauseAllVideos();
        return;
      }

      const activeVideo = videoRefs.current.get(activeId);
      if (activeVideo && !failedVideoIds.has(activeId)) {
        activeVideo.play().catch(() => {});
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      pauseAllVideos();
    };
  }, [activeId, failedVideoIds, pauseAllVideos]);

  const handleVideoError = useCallback((id) => {
    const failedVideo = videoRefs.current.get(id);
    failedVideo?.pause();
    setFailedVideoIds((current) => new Set(current).add(id));
  }, []);

  const activeReference = PRODUCTION_REFERENCES.find(
    (reference) => reference.id === activeId,
  );
  const activeVideoUrl = activeReference
    ? activeReference.videoUrl ?? getPortfolioVideo(activeReference.id)
    : null;
  const activeHasVideo = Boolean(
    activeVideoUrl && !failedVideoIds.has(activeReference.id),
  );
  const handleBack = () => {
    pauseAllVideos();
    onBack();
  };

  return (
    <div className="phone-portfolio-workspace">
      <header className="phone-feed-controls">
        <button className="phone-feed-back" type="button" onClick={handleBack}>
          <span aria-hidden="true">←</span>
          <span>Volver</span>
        </button>

        {activeHasVideo && (
          <button
            className="phone-feed-audio"
            type="button"
            aria-label={isMuted ? "Activar sonido" : "Silenciar video"}
            aria-pressed={!isMuted}
            onClick={() => setIsMuted((current) => !current)}
          >
            <span aria-hidden="true">{isMuted ? "🔇" : "🔊"}</span>
          </button>
        )}
      </header>

      <main
        ref={feedRef}
        className="phone-video-feed"
        aria-label="Referencias audiovisuales"
      >
        {PRODUCTION_REFERENCES.map((reference, index) => (
          <VideoFeedSlide
            key={reference.id}
            index={index}
            reference={reference}
            videoFailed={failedVideoIds.has(reference.id)}
            registerVideo={registerVideo}
            onVideoError={handleVideoError}
          />
        ))}
      </main>
    </div>
  );
}

function VideoFeedSlide({
  index,
  onVideoError,
  reference,
  registerVideo,
  videoFailed,
}) {
  const posterUrl = getPortfolioImage(reference.imageId);
  const videoUrl = reference.videoUrl ?? getPortfolioVideo(reference.id);
  const hasVideo = Boolean(videoUrl && !videoFailed);

  return (
    <article
      className="phone-video-slide"
      data-reference-id={reference.id}
      aria-label={`${reference.title}, ${reference.category}`}
    >
      <img
        className="phone-video-poster"
        src={posterUrl}
        alt={`Referencia ${reference.title}: ${reference.client}`}
        decoding="async"
        loading={index === 0 ? "eager" : "lazy"}
      />

      {hasVideo && (
        <video
          ref={(video) => registerVideo(reference.id, video)}
          className="phone-feed-video"
          src={videoUrl}
          poster={posterUrl}
          muted
          playsInline
          loop
          preload="metadata"
          onError={() => onVideoError(reference.id)}
        />
      )}

      <div className="phone-video-shade" aria-hidden="true" />
      <div className="phone-video-copy">
        <span>{reference.category}</span>
        <h1>{reference.title}</h1>
      </div>
      <span className="phone-video-position" aria-hidden="true">
        {String(index + 1).padStart(2, "0")} /{" "}
        {String(PRODUCTION_REFERENCES.length).padStart(2, "0")}
      </span>
    </article>
  );
}
