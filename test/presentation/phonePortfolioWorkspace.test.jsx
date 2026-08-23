import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PhonePortfolioWorkspace } from "../../src/presentation/features/portfolio/PhonePortfolioWorkspace.jsx";

beforeEach(() => {
  vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("PhonePortfolioWorkspace", () => {
  it("intercala fotos y videos sin abandonar el feed vertical", () => {
    render(<PhonePortfolioWorkspace onBack={vi.fn()} />);

    expect(screen.getByRole("main", { name: "Videos del portafolio" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Videos" }).getAttribute("aria-pressed")).toBe("true");
    expect(document.querySelectorAll("video")).toHaveLength(3);

    fireEvent.click(screen.getByRole("button", { name: "Fotos" }));

    expect(screen.getByRole("main", { name: "Fotos del portafolio" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Fotos" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getAllByRole("img")).toHaveLength(3);
    expect(document.querySelectorAll("video")).toHaveLength(0);
    expect(document.querySelector(".phone-video-feed")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Activar sonido" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Videos" }));

    expect(screen.getByRole("main", { name: "Videos del portafolio" })).toBeTruthy();
    expect(document.querySelectorAll("video")).toHaveLength(3);
    expect(screen.getByRole("button", { name: "Activar sonido" })).toBeTruthy();
  });

  it("muestra primero el contenido dinámico y conserva los ejemplos fijos", async () => {
    const catalogService = {
      listPortfolio: vi.fn(async () => ({
        records: [
          {
            id: "photo-1",
            type: "PHOTO",
            title: "Foto dinámica",
            category: "Editorial",
            client: "Cliente foto",
            media: { url: "https://example.com/photo.jpg" },
            cover: null,
          },
          {
            id: "video-1",
            type: "VIDEO",
            title: "Video dinámico",
            category: "Campaña",
            client: "Cliente video",
            media: { url: "https://example.com/video.mp4" },
            cover: { url: "https://example.com/cover.jpg" },
          },
        ],
        hasMore: false,
      })),
    };

    render(<PhonePortfolioWorkspace catalogService={catalogService} onBack={vi.fn()} />);

    await waitFor(() => expect(document.querySelectorAll("video")).toHaveLength(4));
    expect(screen.getByLabelText("Video dinámico, Campaña")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Fotos" }));
    await waitFor(() => expect(screen.getAllByRole("img")).toHaveLength(4));
    expect(screen.getByLabelText("Foto dinámica, Editorial")).toBeTruthy();
  });

  it("registra en el observador las piezas que llegan desde el backend", async () => {
    const observers = [];
    class IntersectionObserverMock {
      constructor() {
        this.observe = vi.fn();
        this.disconnect = vi.fn();
        observers.push(this);
      }
    }
    vi.stubGlobal("IntersectionObserver", IntersectionObserverMock);
    const catalogService = {
      listPortfolio: vi.fn(async () => ({
        records: [{
          id: "dynamic-video",
          type: "VIDEO",
          title: "Video observado",
          category: "Comercial",
          client: "Cliente",
          media: { url: "https://example.com/video.mp4" },
          cover: { url: "https://example.com/cover.jpg" },
        }],
        hasMore: false,
      })),
    };

    render(<PhonePortfolioWorkspace catalogService={catalogService} onBack={vi.fn()} />);

    const dynamicSlide = await screen.findByLabelText("Video observado, Comercial");
    await waitFor(() => {
      expect(observers.at(-1).observe).toHaveBeenCalledWith(dynamicSlide);
    });
  });
});
