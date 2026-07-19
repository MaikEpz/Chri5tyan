import movimientoUrl from "../../../assets/examples/portfolio/movimiento.jpg";
import origenUrl from "../../../assets/examples/portfolio/origen.jpg";
import ultimaLuzUrl from "../../../assets/examples/portfolio/ultima-luz.jpg";

const PORTFOLIO_IMAGES = Object.freeze({
  "reference-reel-movimiento": movimientoUrl,
  "reference-spot-origen": origenUrl,
  "reference-cinema-ultima-luz": ultimaLuzUrl,
});

export function getPortfolioImage(imageId) {
  return PORTFOLIO_IMAGES[imageId] ?? null;
}
