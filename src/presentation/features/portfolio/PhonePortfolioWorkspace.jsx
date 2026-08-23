import { useCallback, useEffect, useRef, useState } from "react";
import { PRODUCTION_REFERENCES } from "../../../domain/production/productionReferences.js";
import { getPortfolioImage } from "./portfolioImages.js";
import { getPortfolioVideo } from "./portfolioVideos.js";
import { AsyncImage } from "../../components/ui/AsyncImage.jsx";

export function PhonePortfolioWorkspace({ catalogService, onBack }) {
  const feedRef = useRef(null);
  const videoRefs = useRef(new Map());
  const [activeId, setActiveId] = useState(PRODUCTION_REFERENCES[0]?.id ?? null);
  const [failedVideoIds, setFailedVideoIds] = useState(() => new Set());
  const [isMuted, setIsMuted] = useState(true);
  const [mediaType, setMediaType] = useState("videos");
  const [dynamicReferences, setDynamicReferences] = useState([]);
  const references = [
    ...dynamicReferences.filter((reference) => (
      mediaType === "photos" ? reference.portfolioType === "PHOTO" : reference.portfolioType === "VIDEO"
    )),
    ...PRODUCTION_REFERENCES,
  ];
  const referenceKey = references.map((reference) => reference.id).join("|");

  useEffect(() => {
    if (!catalogService?.listPortfolio) return undefined;
    const controller = new AbortController();
    void catalogService.listPortfolio({
      page: 0,
      size: 100,
      sort: "displayOrder,asc",
    }, controller.signal).then((page) => {
      setDynamicReferences(page.records.map((item) => ({
        id: `portfolio-${item.id}`,
        portfolioType: item.type,
        category: item.category,
        title: item.title,
        client: item.client,
        posterUrl: item.type === "PHOTO" ? item.media?.url : item.cover?.url,
        videoUrl: item.type === "VIDEO" ? item.media?.url : null,
      })));
    }).catch((error) => {
      if (error?.name !== "AbortError") setDynamicReferences([]);
    });
    return () => controller.abort();
  }, [catalogService]);

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
  }, [referenceKey]);

  useEffect(() => {
    videoRefs.current.forEach((video, id) => {
      video.muted = isMuted;

      if (
        mediaType !== "videos"
        || id !== activeId
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
  }, [activeId, failedVideoIds, isMuted, mediaType]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        pauseAllVideos();
        return;
      }

      const activeVideo = videoRefs.current.get(activeId);
      if (mediaType === "videos" && activeVideo && !failedVideoIds.has(activeId)) {
        activeVideo.play().catch(() => {});
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      pauseAllVideos();
    };
  }, [activeId, failedVideoIds, mediaType, pauseAllVideos]);

  const handleVideoError = useCallback((id) => {
    const failedVideo = videoRefs.current.get(id);
    failedVideo?.pause();
    setFailedVideoIds((current) => new Set(current).add(id));
  }, []);

  const activeReference = PRODUCTION_REFERENCES.find(
    (reference) => reference.id === activeId,
  ) || dynamicReferences.find((reference) => reference.id === activeId);
  const activeVideoUrl = activeReference
    ? activeReference.videoUrl ?? getPortfolioVideo(activeReference.id)
    : null;
  const activeHasVideo = Boolean(
    mediaType === "videos"
    && activeVideoUrl
    && activeReference
    && !failedVideoIds.has(activeReference.id),
  );
  const handleMediaTypeChange = (nextMediaType) => {
    if (nextMediaType === mediaType) return;
    pauseAllVideos();
    setMediaType(nextMediaType);
    const nextReferences = [
      ...dynamicReferences.filter((reference) => (
        nextMediaType === "photos" ? reference.portfolioType === "PHOTO" : reference.portfolioType === "VIDEO"
      )),
      ...PRODUCTION_REFERENCES,
    ];
    setActiveId(nextReferences[0]?.id ?? null);
  };
  const handleBack = () => {
    pauseAllVideos();
    onBack();
  };

  return (
    <div
      className={`phone-portfolio-workspace is-${mediaType}-mode`}
      data-media-type={mediaType}
    >
      <header className="phone-feed-controls">
        <button className="phone-feed-back" type="button" onClick={handleBack}>
          <span aria-hidden="true">←</span>
          <span>Volver</span>
        </button>

        <div
          className="phone-feed-media-switch"
          role="group"
          aria-label="Tipo de contenido"
        >
          <button
            type="button"
            className={mediaType === "photos" ? "is-active" : ""}
            aria-pressed={mediaType === "photos"}
            onClick={() => handleMediaTypeChange("photos")}
          >
            Fotos
          </button>
          <button
            type="button"
            className={mediaType === "videos" ? "is-active" : ""}
            aria-pressed={mediaType === "videos"}
            onClick={() => handleMediaTypeChange("videos")}
          >
            Videos
          </button>
        </div>

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
        aria-label={
          mediaType === "videos" ? "Videos del portafolio" : "Fotos del portafolio"
        }
      >
        {references.map((reference, index) => (
          <VideoFeedSlide
            key={reference.id}
            index={index}
            mediaType={mediaType}
            reference={reference}
            videoFailed={failedVideoIds.has(reference.id)}
            registerVideo={registerVideo}
            onVideoError={handleVideoError}
            total={references.length}
          />
        ))}
      </main>
    </div>
  );
}

function VideoFeedSlide({
  index,
  mediaType,
  onVideoError,
  reference,
  registerVideo,
  videoFailed,
  total,
}) {
  const posterUrl = reference.posterUrl ?? getPortfolioImage(reference.imageId);
  const videoUrl = reference.videoUrl ?? getPortfolioVideo(reference.id);
  const hasVideo = Boolean(mediaType === "videos" && videoUrl && !videoFailed);

  return (
    <article
      className="phone-video-slide"
      data-reference-id={reference.id}
      aria-label={`${reference.title}, ${reference.category}`}
    >
      {posterUrl && (
        <AsyncImage
          wrapperClassName="phone-video-poster-frame"
          className="phone-video-poster"
          src={posterUrl}
          alt={`Referencia ${reference.title}: ${reference.client}`}
          decoding="async"
          loading={index === 0 ? "eager" : "lazy"}
        />
      )}

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
        {String(total).padStart(2, "0")}
      </span>
    </article>
  );
}
