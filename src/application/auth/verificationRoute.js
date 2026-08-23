export function parseVerificationRoute(hash) {
  const value = String(hash || "").replace(/^#/, "");
  const [path, query = ""] = value.split("?", 2);
  if (path !== "/verify-email") return null;
  const token = new URLSearchParams(query).get("token") || "";
  return { type: "verify-email", token };
}

export function consumeVerificationRoute(browserWindow = window) {
  const route = parseVerificationRoute(browserWindow.location.hash);
  if (!route) return null;
  browserWindow.history.replaceState(
    null,
    "",
    `${browserWindow.location.pathname}${browserWindow.location.search}#/verify-email`,
  );
  return route;
}
