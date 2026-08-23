import assert from "node:assert/strict";
import test from "node:test";
import {
  consumeVerificationRoute,
  parseVerificationRoute,
} from "../../src/application/auth/verificationRoute.js";

test("lee el token desde el fragmento y no desde la URL enviada al servidor", () => {
  assert.deepEqual(
    parseVerificationRoute("#/verify-email?token=v2.token.signature"),
    { type: "verify-email", token: "v2.token.signature" },
  );
  assert.equal(parseVerificationRoute("#/otra-ruta?token=secret"), null);
});

test("elimina el token del historial inmediatamente", () => {
  let replacement = "";
  const browserWindow = {
    location: {
      hash: "#/verify-email?token=secret-token",
      pathname: "/",
      search: "",
    },
    history: {
      replaceState: (_state, _title, value) => { replacement = value; },
    },
  };

  const route = consumeVerificationRoute(browserWindow);

  assert.equal(route.token, "secret-token");
  assert.equal(replacement, "/#/verify-email");
  assert.equal(replacement.includes("secret-token"), false);
});
