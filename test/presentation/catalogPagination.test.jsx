import { useCallback } from "react";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useCatalogPage } from "../../src/presentation/components/catalog/useCatalogPage.jsx";

function deferred() {
  let resolve;
  const promise = new Promise((nextResolve) => { resolve = nextResolve; });
  return { promise, resolve };
}

function Harness({ filter, loader }) {
  const request = useCallback(
    (page, signal) => loader(filter, page, signal),
    [filter, loader],
  );
  const catalog = useCatalogPage(request, { debounceMs: 0 });
  return (
    <div>
      {catalog.records.map((record) => <span key={record.id}>{record.name}</span>)}
      {catalog.hasMore && <button type="button" onClick={catalog.loadMore}>Más</button>}
    </div>
  );
}

afterEach(cleanup);

describe("useCatalogPage", () => {
  it("descarta una página anterior cuando cambia el filtro", async () => {
    const requests = new Map();
    const loader = vi.fn((filter, page) => {
      const pending = deferred();
      requests.set(`${filter}-${page}`, pending);
      return pending.promise;
    });
    const view = render(<Harness filter="old" loader={loader} />);

    await waitFor(() => expect(requests.has("old-0")).toBe(true));
    await act(async () => requests.get("old-0").resolve({
      records: [{ id: "old-0", name: "Anterior" }],
      hasMore: true,
      fallback: false,
    }));
    fireEvent.click(screen.getByRole("button", { name: "Más" }));
    expect(requests.has("old-1")).toBe(true);

    view.rerender(<Harness filter="new" loader={loader} />);
    await waitFor(() => expect(requests.has("new-0")).toBe(true));
    await act(async () => requests.get("new-0").resolve({
      records: [{ id: "new-0", name: "Actual" }],
      hasMore: false,
      fallback: false,
    }));
    await act(async () => requests.get("old-1").resolve({
      records: [{ id: "old-1", name: "Página anterior" }],
      hasMore: false,
      fallback: false,
    }));

    expect(screen.getByText("Actual")).toBeTruthy();
    expect(screen.queryByText("Página anterior")).toBeNull();
    expect(screen.queryByText("Anterior")).toBeNull();
  });
});
