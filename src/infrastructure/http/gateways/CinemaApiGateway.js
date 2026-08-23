export class CinemaApiGateway {
  constructor({ apiClient }) { this.apiClient = apiClient; }
  createCinemaRequest(data) { return this.apiClient.request("/api/v1/cinema-requests", { method: "POST", body: data, authenticated: true }); }
}
