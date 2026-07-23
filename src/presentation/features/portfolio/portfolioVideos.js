import movimientoVideoUrl from "../../../assets/examples/portfolio/videos/movimiento.mp4";
import origenVideoUrl from "../../../assets/examples/portfolio/videos/origen.mp4";
import ultimaLuzVideoUrl from "../../../assets/examples/portfolio/videos/ultima-luz.mp4";

const PORTFOLIO_VIDEOS = Object.freeze({
  "reference-reel-movimiento": movimientoVideoUrl,
  "reference-spot-origen": origenVideoUrl,
  "reference-cinema-ultima-luz": ultimaLuzVideoUrl,
});

export function getPortfolioVideo(referenceId) {
  return PORTFOLIO_VIDEOS[referenceId] ?? null;
}
