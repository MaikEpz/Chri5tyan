import assert from "node:assert/strict";
import test from "node:test";
import { ApiClient } from "../../src/infrastructure/http/ApiClient.js";

test("invoca fetch con el receptor global requerido por el navegador", async () => {
  let called = false;
  const client = new ApiClient({
    baseUrl: "http://localhost:8080",
    fetchImplementation(url) {
      assert.equal(this, globalThis);
      assert.equal(url, "http://localhost:8080/api/v1/auth/login");
      called = true;
      return Promise.resolve({ status: 204 });
    },
  });

  await client.request("/api/v1/auth/login", { method: "POST" });
  assert.equal(called, true);
});
