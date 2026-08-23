export class AuthSessionService {
  constructor({ authGateway, sessionStore, now = () => Date.now() }) {
    this.authGateway = authGateway;
    this.sessionStore = sessionStore;
    this.now = now;
  }

  getSession() {
    return this.sessionStore.get();
  }

  subscribe(listener) {
    return this.sessionStore.subscribe(listener);
  }

  async restore() {
    const session = this.sessionStore.get();
    if (!session) return null;
    try {
      const user = await this.authGateway.me();
      const restored = { ...session, user };
      this.sessionStore.set(restored);
      return restored;
    } catch (error) {
      if (error?.status === 401 || !this.sessionStore.get()) {
        this.sessionStore.clear();
        return null;
      }
      return session;
    }
  }

  async login(credentials) {
    return this.persist(await this.authGateway.login(credentials));
  }

  async register(account) {
    return this.authGateway.register(account);
  }

  async verifyEmail(token) {
    return this.authGateway.verifyEmail(token);
  }

  async resendVerification(email) {
    return this.authGateway.resendVerification(email);
  }

  logout() {
    this.sessionStore.clear();
  }

  persist(response) {
    const session = {
      accessToken: response.accessToken,
      expiresAt: this.now() + (response.expiresInSeconds * 1000),
      user: response.user,
    };
    this.sessionStore.set(session);
    return session;
  }
}
