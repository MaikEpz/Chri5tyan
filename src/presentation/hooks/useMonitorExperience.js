import { useCallback, useState } from "react";

const INITIAL_MONITOR_STATE = Object.freeze({
  open: false,
  closing: false,
  contentVisible: false,
  origin: null,
  ready: false,
  source: "desktop",
  activeView: 0,
});

export function useMonitorExperience() {
  const [state, setState] = useState(INITIAL_MONITOR_STATE);
  const [cameraResetKey, setCameraResetKey] = useState(0);

  const finishClose = useCallback(() => {
    setState(INITIAL_MONITOR_STATE);
    setCameraResetKey((current) => current + 1);
  }, []);

  const requestClose = useCallback(() => {
    if (!state.ready) {
      finishClose();
      return;
    }
    setState((current) => ({ ...current, contentVisible: false }));
    window.requestAnimationFrame(() => {
      setState((current) => ({ ...current, closing: true }));
    });
  }, [finishClose, state.ready]);

  const openMonitor = useCallback((source = "desktop") => {
    setState({
      ...INITIAL_MONITOR_STATE,
      open: true,
      source,
    });
  }, []);

  const markReady = useCallback((origin) => {
    setState((current) => ({ ...current, origin, ready: true }));
  }, []);

  const showContent = useCallback(() => {
    setState((current) => ({ ...current, contentVisible: true }));
  }, []);

  const setActiveView = useCallback((activeView) => {
    setState((current) => ({ ...current, activeView }));
  }, []);

  return {
    ...state,
    cameraResetKey,
    finishClose,
    markReady,
    openMonitor,
    requestClose,
    setActiveView,
    showContent,
  };
}
