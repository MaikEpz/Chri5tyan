import assert from "node:assert/strict";
import test from "node:test";
import { ChrisApiGateway } from "../../src/infrastructure/http/ChrisApiGateway.js";

test("usa endpoints autenticados para consultar la moderación", async () => {
  const calls = [];
  const gateway = new ChrisApiGateway({
    apiClient: {
      request: async (...parameters) => calls.push(parameters),
    },
  });

  await gateway.listCastingAdmin({ status: "PENDING", page: 0 }, "signal");
  await gateway.listLocationsAdmin({ q: "centro", page: 1 }, "signal");

  assert.deepEqual(calls, [
    ["/api/v1/casting/admin?status=PENDING&page=0", { authenticated: true, signal: "signal" }],
    ["/api/v1/locations/admin?q=centro&page=1", { authenticated: true, signal: "signal" }],
  ]);
});

test("envía la decisión administrativa con PATCH y autenticación", async () => {
  const calls = [];
  const gateway = new ChrisApiGateway({
    apiClient: {
      request: async (...parameters) => calls.push(parameters),
    },
  });
  const approval = { status: "APPROVED", reason: null };
  const rejection = { status: "REJECTED", reason: "Falta información" };

  await gateway.moderateCasting("casting-1", approval);
  await gateway.moderateLocation("location-1", rejection);

  assert.deepEqual(calls, [
    ["/api/v1/casting/casting-1/status", {
      method: "PATCH",
      body: approval,
      authenticated: true,
    }],
    ["/api/v1/locations/location-1/status", {
      method: "PATCH",
      body: rejection,
      authenticated: true,
    }],
  ]);
});

test("consulta y actualiza el perfil de casting propio con autenticación", async () => {
  const calls = [];
  const gateway = new ChrisApiGateway({
    apiClient: {
      request: async (...parameters) => calls.push(parameters),
    },
  });
  const image = new File(["image"], "actor.jpg", { type: "image/jpeg" });

  await gateway.listMyCasting({ page: 0, size: 1 }, "signal");
  await gateway.updateCasting("casting-1", { fullName: "Actor" }, [image]);

  assert.deepEqual(calls[0], [
    "/api/v1/casting/mine?page=0&size=1",
    { authenticated: true, signal: "signal" },
  ]);
  assert.equal(calls[1][0], "/api/v1/casting/casting-1");
  assert.equal(calls[1][1].method, "PUT");
  assert.equal(calls[1][1].authenticated, true);
  assert.ok(calls[1][1].body instanceof FormData);
  assert.equal(calls[1][1].body.getAll("images")[0].name, "actor.jpg");
});

test("gestiona equipos y portafolio únicamente mediante llamadas autenticadas", async () => {
  const calls = [];
  const gateway = new ChrisApiGateway({
    apiClient: { request: async (...parameters) => calls.push(parameters) },
  });
  const photo = new File(["photo"], "piece.webp", { type: "image/webp" });

  await gateway.listEquipmentAdmin({ active: true, page: 0 }, "signal");
  await gateway.createEquipment({ name: "FX3" }, [photo]);
  await gateway.listPortfolio({ type: "PHOTO", page: 0 }, "signal");
  await gateway.createPortfolioItem({ type: "PHOTO", title: "Campaña" }, photo, null);
  await gateway.deletePortfolioItem("piece-1");

  assert.deepEqual(calls[0], [
    "/api/v1/equipment/admin?active=true&page=0",
    { authenticated: true, signal: "signal" },
  ]);
  assert.equal(calls[1][1].authenticated, true);
  assert.ok(calls[1][1].body instanceof FormData);
  assert.deepEqual(calls[2], [
    "/api/v1/portfolio?type=PHOTO&page=0",
    { signal: "signal" },
  ]);
  assert.equal(calls[3][1].authenticated, true);
  assert.equal(calls[3][1].body.get("media").name, "piece.webp");
  assert.deepEqual(calls[4], [
    "/api/v1/portfolio/piece-1",
    { method: "DELETE", authenticated: true },
  ]);
});
