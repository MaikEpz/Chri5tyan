import assert from "node:assert/strict";
import test from "node:test";
import { DemoGateway } from "../../src/application/demo/DemoGateway.js";

test("permite el acceso administrativo temporal con admin / admin", async () => {
  const gateway = new DemoGateway();
  const session = await gateway.login({ email: "admin", password: "admin" });

  assert.equal(session.user.role, "ADMIN");
  assert.equal(session.user.fullName, "Administrador demo");
  await assert.rejects(
    gateway.login({ email: "admin", password: "incorrecta" }),
    (error) => error.code === "INVALID_CREDENTIALS",
  );
});

test("expone datos de ejemplo y permite moderarlos sin backend", async () => {
  const gateway = new DemoGateway();
  const pending = await gateway.listCastingAdmin({ status: "PENDING", page: 0, size: 20 });

  assert.equal(pending.content.length, 1);
  await gateway.moderateCasting(pending.content[0].id, { status: "APPROVED", reason: null });

  const approved = await gateway.listCastingAdmin({ status: "APPROVED", page: 0, size: 20 });
  assert.equal(approved.content.some((record) => record.id === pending.content[0].id), true);
});

test("las operaciones administrativas de demostración se conservan en memoria", async () => {
  const gateway = new DemoGateway();
  const created = await gateway.createEquipment({
    name: "Grabadora demo",
    category: "Sonido",
    specifications: "32-bit float",
    availability: "Disponible",
    dailyRate: 30,
    active: true,
  });

  assert.equal((await gateway.listEquipmentAdmin({ page: 0, size: 20 })).content.some((item) => item.id === created.id), true);
  await gateway.deleteEquipment(created.id);
  assert.equal((await gateway.listEquipmentAdmin({ page: 0, size: 20 })).content.some((item) => item.id === created.id), false);
});
