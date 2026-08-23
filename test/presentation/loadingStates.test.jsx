import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CatalogGrid } from "../../src/presentation/components/catalog/CatalogGrid.jsx";
import { ImageCarousel } from "../../src/presentation/components/catalog/ImageCarousel.jsx";
import { CatalogLoadState } from "../../src/presentation/components/catalog/useCatalogPage.jsx";
import { AsyncImage } from "../../src/presentation/components/ui/AsyncImage.jsx";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("estados skeleton", () => {
  it("reemplaza el mensaje textual del catálogo y oculta el aviso de ejemplos", () => {
    const loading = render(<CatalogGrid records={[]} emptyMessage="Vacío" loading />);
    expect(screen.getByRole("status", { name: "Cargando catálogo" })).toBeTruthy();
    expect(screen.queryByText("Cargando catálogo…")).toBeNull();
    loading.unmount();

    render(<CatalogLoadState fallback loading error="" hasMore={false} onLoadMore={vi.fn()} />);
    expect(screen.queryByText(/Mostrando datos de ejemplo/i)).toBeNull();
  });

  it("mantiene resultados y agrega skeletons al cargar otra página", () => {
    const record = {
      id: "camera-1",
      name: "Sony FX3",
      specialty: "Cámara",
      initials: "FX",
      details: [],
      availability: "Disponible",
      budget: "$50",
      images: [],
    };
    render(<CatalogGrid records={[record]} emptyMessage="Vacío" loadingMore />);
    expect(screen.getByText("Sony FX3")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Ver detalles/ })).toBeNull();
    expect(screen.getByRole("status", { name: "Cargando más resultados" })).toBeTruthy();
  });

  it("resume textos narrativos largos sin convertirlos en etiquetas", () => {
    const experience = "Experiencia extensa en producciones audiovisuales, comerciales y largometrajes con equipos internacionales.";
    const view = render(<CatalogGrid records={[{
      id: "casting-1",
      name: "Ana Torres",
      specialty: "Talento audiovisual",
      initials: "AT",
      details: ["27 años", "1.68 m", experience],
      cardDetails: ["27 años", "1.68 m"],
      summary: experience,
      availability: "Tardes y fines de semana",
      budget: "$120 / jornada",
      images: [],
    }]} emptyMessage="Vacío" />);

    const summary = screen.getByText(experience);
    expect(summary.classList.contains("line-clamp-2")).toBe(true);
    expect(view.container.querySelectorAll("li")).toHaveLength(2);
    expect(screen.queryByRole("button", { name: /Ver detalles/ })).toBeNull();
  });
});

describe("imágenes asíncronas", () => {
  it("muestra skeleton, revela la imagen y comunica los errores", () => {
    const view = render(<AsyncImage src="/slow.jpg" alt="Retrato" />);
    const frame = view.container.querySelector(".async-image-frame");
    const image = screen.getByRole("img", { name: "Retrato" });
    expect(frame.dataset.imageState).toBe("loading");
    expect(view.container.querySelector(".async-image-skeleton")).toBeTruthy();

    fireEvent.load(image);
    expect(frame.dataset.imageState).toBe("loaded");
    expect(view.container.querySelector(".async-image-skeleton")).toBeNull();

    view.rerender(<AsyncImage src="/broken.jpg" alt="Retrato" />);
    fireEvent.error(screen.getByRole("img", { name: "Retrato" }));
    expect(screen.getByLabelText("No se pudo cargar la imagen")).toBeTruthy();
  });

  it("detecta una imagen disponible en caché al cambiar la fuente", async () => {
    vi.spyOn(HTMLImageElement.prototype, "complete", "get").mockReturnValue(true);
    vi.spyOn(HTMLImageElement.prototype, "naturalWidth", "get").mockReturnValue(800);
    const view = render(<AsyncImage src="/cached.jpg" alt="Equipo" />);
    await waitFor(() => expect(view.container.querySelector(".async-image-frame").dataset.imageState).toBe("loaded"));
  });

  it("reinicia el skeleton al navegar por el carrusel y conserva sus controles", () => {
    const view = render(<ImageCarousel images={[{ url: "/one.jpg" }, { url: "/two.jpg" }]} alt="Galería" />);
    let image = view.container.querySelector(".media-carousel-image");
    expect(image.getAttribute("aria-disabled")).toBe("true");
    fireEvent.load(image);
    expect(image.getAttribute("aria-disabled")).toBe("false");

    fireEvent.click(screen.getByRole("button", { name: "Imagen siguiente" }));
    image = view.container.querySelector(".media-carousel-image");
    expect(image.getAttribute("src")).toBe("/two.jpg");
    expect(image.getAttribute("aria-disabled")).toBe("true");
    expect(screen.getByRole("button", { name: "Imagen anterior" })).toBeTruthy();
  });
});
