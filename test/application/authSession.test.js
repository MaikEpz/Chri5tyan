import assert from "node:assert/strict";
import test from "node:test";
import { AuthSessionService } from "../../src/application/auth/AuthSessionService.js";
import { BrowserSessionStore } from "../../src/infrastructure/browser/BrowserSessionStore.js";

function memoryStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
}

test("persiste la sesión autenticada hasta su expiración", async () => {
  let now = 1_000;
  const store = new BrowserSessionStore({
    storage: memoryStorage(),
    now: () => now,
  });
  const service = new AuthSessionService({
    authGateway: {
      login: async () => ({
        accessToken: "token",
        expiresInSeconds: 60,
        user: { id: "user-1", fullName: "Ana Torres" },
      }),
    },
    sessionStore: store,
    now: () => now,
  });

  await service.login({ email: "ana@example.com", password: "secret123" });
  assert.equal(store.getToken(), "token");

  now += 61_000;
  assert.equal(service.getSession(), null);
});

test("valida una sesión recordada con el backend", async () => {
  const storage = memoryStorage();
  const store = new BrowserSessionStore({ storage, now: () => 1_000 });
  store.set({
    accessToken: "token",
    expiresAt: 20_000,
    user: { id: "old" },
  });
  const service = new AuthSessionService({
    authGateway: {
      me: async () => ({ id: "user-1", fullName: "Cuenta validada" }),
    },
    sessionStore: store,
    now: () => 1_000,
  });

  const restored = await service.restore();
  assert.equal(restored.user.fullName, "Cuenta validada");
  assert.equal(store.get().user.id, "user-1");
});

test("conserva la sesión ante un fallo temporal al restaurarla", async () => {
  const store = new BrowserSessionStore({ storage: memoryStorage(), now: () => 1_000 });
  const session = {
    accessToken: "token",
    expiresAt: 20_000,
    user: { id: "user-1", fullName: "Cuenta local" },
  };
  store.set(session);
  const service = new AuthSessionService({
    authGateway: {
      me: async () => {
        throw Object.assign(new Error("Servidor no disponible"), { status: 503 });
      },
    },
    sessionStore: store,
  });

  assert.deepEqual(await service.restore(), session);
  assert.deepEqual(store.get(), session);
});

test("elimina la sesión cuando el backend rechaza el token", async () => {
  const store = new BrowserSessionStore({ storage: memoryStorage(), now: () => 1_000 });
  store.set({
    accessToken: "invalid-token",
    expiresAt: 20_000,
    user: { id: "user-1" },
  });
  const service = new AuthSessionService({
    authGateway: {
      me: async () => {
        throw Object.assign(new Error("Token inválido"), { status: 401 });
      },
    },
    sessionStore: store,
  });

  assert.equal(await service.restore(), null);
  assert.equal(store.get(), null);
});

test("restaurar sin sesión no entra en un ciclo de notificaciones", async () => {
  const store = new BrowserSessionStore({
    storage: memoryStorage(),
    now: () => 1_000,
  });
  let notifications = 0;
  store.subscribe(() => {
    notifications += 1;
  });
  const service = new AuthSessionService({
    authGateway: {
      me: async () => {
        throw new Error("No debe consultar el backend sin token.");
      },
    },
    sessionStore: store,
    now: () => 1_000,
  });

  assert.equal(await service.restore(), null);
  assert.equal(notifications, 0);
});

test("registrar una cuenta pendiente no crea una sesión local", async () => {
  const store = new BrowserSessionStore({
    storage: memoryStorage(),
    now: () => 1_000,
  });
  const registration = {
    user: { id: "user-1", email: "nuevo@example.com" },
    verificationRequired: true,
  };
  const service = new AuthSessionService({
    authGateway: {
      register: async () => registration,
    },
    sessionStore: store,
    now: () => 1_000,
  });

  assert.equal(
    (await service.register({ email: "nuevo@example.com" })).verificationRequired,
    true,
  );
  assert.equal(store.get(), null);
});

test("verifica y reenvía mediante el gateway sin crear sesión", async () => {
  const store = new BrowserSessionStore({ storage: memoryStorage(), now: () => 1_000 });
  const service = new AuthSessionService({
    authGateway: {
      verifyEmail: async (token) => ({ status: "VERIFIED", token }),
      resendVerification: async (email) => ({ accepted: true, email }),
    },
    sessionStore: store,
  });

  assert.equal((await service.verifyEmail("signed-token")).status, "VERIFIED");
  assert.equal((await service.resendVerification("client@example.com")).accepted, true);
  assert.equal(store.get(), null);
});
