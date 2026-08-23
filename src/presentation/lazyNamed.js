import { lazy } from "react";

export function lazyNamed(loadModule, exportName) {
  return lazy(() => (
    loadModule().then((module) => ({ default: module[exportName] }))
  ));
}
