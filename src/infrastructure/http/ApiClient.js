export class ApiError extends Error {
  constructor(message, { status = 0, code = "API_ERROR", details = {} } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export class ApiNetworkError extends ApiError {
  constructor(message = "No se pudo conectar con el servidor.") {
    super(message, { code: "NETWORK_ERROR" });
    this.name = "ApiNetworkError";
  }
}

export class ApiClient {
  constructor({
    baseUrl,
    fetchImplementation = globalThis.fetch,
    tokenProvider = () => null,
    onUnauthorized = () => {},
  }) {
    this.baseUrl = String(baseUrl || "").replace(/\/+$/, "");
    this.fetchImplementation = fetchImplementation;
    this.tokenProvider = tokenProvider;
    this.onUnauthorized = onUnauthorized;
  }

  resolveUrl(path) {
    if (/^https?:\/\//i.test(path)) return path;
    return `${this.baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
  }

  async request(path, {
    method = "GET",
    body,
    headers = {},
    signal,
    authenticated = false,
  } = {}) {
    const requestHeaders = new Headers(headers);
    const token = this.tokenProvider();
    if (authenticated && token) {
      requestHeaders.set("Authorization", `Bearer ${token}`);
    }

    let requestBody = body;
    if (body != null && !(body instanceof FormData) && typeof body !== "string") {
      requestHeaders.set("Content-Type", "application/json");
      requestBody = JSON.stringify(body);
    }
    requestHeaders.set("Accept", "application/json");

    let response;
    try {
      response = await this.fetchImplementation.call(globalThis, this.resolveUrl(path), {
        method,
        body: requestBody,
        headers: requestHeaders,
        signal,
      });
    } catch (error) {
      if (error?.name === "AbortError") throw error;
      throw new ApiNetworkError();
    }

    if (response.status === 401 && authenticated) {
      this.onUnauthorized();
    }
    if (response.status === 204) return null;

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      throw new ApiError(
        payload?.message || "El servidor no pudo completar la operación.",
        {
          status: response.status,
          code: payload?.code,
          details: payload?.details,
        },
      );
    }
    return payload?.data ?? payload;
  }
}
