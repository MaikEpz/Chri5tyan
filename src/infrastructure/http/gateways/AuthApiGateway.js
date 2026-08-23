export class AuthApiGateway {
  constructor({ apiClient }) { this.apiClient = apiClient; }
  login(credentials) { return this.apiClient.request("/api/v1/auth/login", { method: "POST", body: credentials }); }
  register(account) { return this.apiClient.request("/api/v1/auth/register", { method: "POST", body: account }); }
  verifyEmail(token) { return this.apiClient.request("/api/v1/auth/verify-email", { method: "POST", body: { token } }); }
  resendVerification(email) { return this.apiClient.request("/api/v1/auth/resend-verification", { method: "POST", body: { email } }); }
  me() { return this.apiClient.request("/api/v1/auth/me", { authenticated: true }); }
}
