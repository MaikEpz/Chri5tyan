import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "../ui/Button.jsx";
import { Notice } from "../ui/Notice.jsx";

export function useCatalogPage(request, { debounceMs = 300, preserveOnError = false } = {}) {
  const [records, setRecords] = useState([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [fallback, setFallback] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const requestRef = useRef(request);
  const generationRef = useRef(0);
  const controllersRef = useRef(new Set());
  requestRef.current = request;

  const load = useCallback(async (requestedPage, signal, generation, requestFunction) => {
    const append = requestedPage > 0;
    append ? setLoadingMore(true) : setLoading(true);
    if (!append) setError("");
    try {
      const result = await requestFunction(requestedPage, signal);
      if (signal.aborted || generation !== generationRef.current) return;
      setRecords((current) => {
        const combined = append ? [...current, ...result.records] : result.records;
        return [...new Map(combined.map((record) => [record.id, record])).values()];
      });
      setPage(requestedPage);
      setHasMore(result.hasMore);
      setFallback(result.fallback);
    } catch (loadError) {
      if (loadError?.name !== "AbortError" && generation === generationRef.current) {
        setError(loadError?.message || "No se pudo cargar el catálogo.");
        if (!append && !preserveOnError) setRecords([]);
      }
    } finally {
      if (generation === generationRef.current) append ? setLoadingMore(false) : setLoading(false);
    }
  }, [preserveOnError]);

  useEffect(() => {
    const generation = generationRef.current + 1;
    generationRef.current = generation;
    controllersRef.current.forEach((controller) => controller.abort());
    controllersRef.current.clear();
    const controller = new AbortController();
    controllersRef.current.add(controller);
    const timeout = window.setTimeout(() => void load(0, controller.signal, generation, request).finally(() => controllersRef.current.delete(controller)), debounceMs);
    return () => {
      window.clearTimeout(timeout);
      controllersRef.current.forEach((activeController) => activeController.abort());
      controllersRef.current.clear();
    };
  }, [request, debounceMs, load]);

  const loadMore = useCallback(() => {
    if (loading || loadingMore || !hasMore) return;
    const controller = new AbortController();
    const generation = generationRef.current;
    controllersRef.current.add(controller);
    void load(page + 1, controller.signal, generation, requestRef.current).finally(() => controllersRef.current.delete(controller));
  }, [hasMore, load, loading, loadingMore, page]);

  return { records, hasMore, fallback, loading, loadingMore, error, loadMore };
}

export function CatalogLoadState({ loading, loadingMore, error, hasMore, onLoadMore }) {
  return <>{error && <Notice className="mt-4" role="alert" tone="danger">{error}</Notice>}{hasMore && !loading && <Button className="mx-auto my-5 flex" variant="secondary" disabled={loadingMore} onClick={onLoadMore}>{loadingMore ? "Cargando…" : "Ver más"}</Button>}</>;
}
