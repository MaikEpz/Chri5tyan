const DEFAULT_KEY = "chris.auth";

export class BrowserSessionStore {
  constructor({
    storage = globalThis.localStorage,
    key = DEFAULT_KEY,
    now = () => Date.now(),
  } = {}) {
    this.storage = storage;
    this.key = key;
    this.now = now;
    this.listeners = new Set();
  }

  get() {
    try {
      const storedSession = this.storage?.getItem(this.key);
      if (!storedSession) return null;

      const session = JSON.parse(storedSession);
      if (!session?.accessToken || !session?.expiresAt || session.expiresAt <= this.now()) {
        this.storage?.removeItem(this.key);
        return null;
      }
      return session;
    } catch {
      this.storage?.removeItem(this.key);
      return null;
    }
  }

  getToken() {
    return this.get()?.accessToken ?? null;
  }

  set(session) {
    this.storage?.setItem(this.key, JSON.stringify(session));
    this.emit(session);
  }

  clear() {
    this.storage?.removeItem(this.key);
    this.emit(null);
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emit(session = this.get()) {
    this.listeners.forEach((listener) => listener(session));
  }
}
