import assert from "node:assert/strict";
import test from "node:test";
import { CatalogService } from "../../src/application/catalog/CatalogService.js";

test("adapta un seed de API al ejemplo visual sin duplicarlo", async () => {
  const service = new CatalogService({
    catalogGateway: {
      listCasting: async () => ({
        content: [
          {
            id: "api-id",
            sampleKey: "casting-ana-torres",
            fullName: "Ana Torres",
            images: [],
          },
        ],
        last: true,
      }),
    },
  });

  const result = await service.listCasting({ page: 0 });
  assert.equal(result.records.length, 1);
  assert.equal(result.records[0].id, "api-id");
  assert.equal(result.records[0].imageId, "casting-ana-torres");
  assert.equal(result.records[0].rates.daily.value, 120);
  assert.equal(result.records[0].isSample, true);
  assert.equal(result.fallback, false);
});

test("usa los ejemplos locales cuando el catálogo no está disponible", async () => {
  const service = new CatalogService({
    catalogGateway: {
      listEquipment: async () => {
        throw Object.assign(new Error("offline"), { code: "NETWORK_ERROR" });
      },
    },
  });

  const result = await service.listEquipment({
    page: 0,
    q: "Sony",
    category: "Cámara",
  });
  assert.deepEqual(result.records.map((record) => record.name), ["Sony FX3"]);
  assert.equal(result.hasMore, false);
  assert.equal(result.fallback, true);
});

test("no oculta errores de validación del servidor con datos locales", async () => {
  const service = new CatalogService({
    catalogGateway: {
      listLocations: async () => {
        throw Object.assign(new Error("Filtro inválido"), { status: 400 });
      },
    },
  });

  await assert.rejects(
    service.listLocations({ page: 0 }),
    /Filtro inválido/,
  );
});

test("obtiene provincias y ciudades desde el gateway", async () => {
  const service = new CatalogService({
    catalogGateway: {
      getProvinces: async () => [{ id: "loja", name: "Loja" }],
      getCities: async (provinceId) => [
        { id: "loja-city", provinceId, name: "Loja" },
      ],
    },
  });

  assert.deepEqual(await service.getProvinces(), [{ id: "loja", name: "Loja" }]);
  assert.deepEqual(await service.getCities("loja"), [
    { id: "loja-city", provinceId: "loja", name: "Loja" },
  ]);
});

test("separa textos narrativos de los datos compactos del catálogo público", async () => {
  const service = new CatalogService({
    catalogGateway: {
      listCasting: async () => ({
        content: [{
          id: "casting-long",
          fullName: "Ana Torres",
          age: 27,
          heightCm: 168,
          experience: "Experiencia extensa en publicidad, cine y producciones internacionales.",
          availability: "Fines de semana",
          rates: {},
          images: [],
        }],
        last: true,
      }),
      resolveMediaUrl: (path) => path,
    },
  });

  const result = await service.listCasting({ page: 0 });
  assert.equal(result.records[0].summary, "Experiencia extensa en publicidad, cine y producciones internacionales.");
  assert.deepEqual(result.records[0].cardDetails, ["27 años", "1.68 m"]);
  assert.ok(result.records[0].details.includes(result.records[0].summary));
});

test("usa el catálogo geográfico local solamente como respaldo recuperable", async () => {
  const networkError = Object.assign(new Error("offline"), { code: "NETWORK_ERROR" });
  const service = new CatalogService({
    catalogGateway: {
      getProvinces: async () => { throw networkError; },
      getCities: async () => { throw networkError; },
    },
  });

  assert.ok((await service.getProvinces()).some(({ id }) => id === "guayas"));
  assert.ok((await service.getCities("guayas")).some(({ id }) => id === "guayaquil"));
});

test("adapta la cola administrativa y resuelve sus archivos en orden", async () => {
  const gateway = {
    listCastingAdmin: async () => ({
      content: [{
        id: "casting-1",
        fullName: "Ana Torres",
        status: "PENDING",
        images: [
          { id: "media-2", url: "/media/2.jpg", sortOrder: 2 },
          { id: "media-1", url: "/media/1.jpg", sortOrder: 1 },
        ],
      }],
      page: 0,
      totalElements: 21,
      totalPages: 2,
      last: false,
    }),
    resolveMediaUrl: (path) => `https://api.example.com${path}`,
  };
  const service = new CatalogService({ catalogGateway: gateway });

  const result = await service.listCastingModeration({ status: "PENDING" });

  assert.equal(result.records[0].kind, "casting");
  assert.deepEqual(
    result.records[0].media.map((item) => item.url),
    ["https://api.example.com/media/1.jpg", "https://api.example.com/media/2.jpg"],
  );
  assert.equal(result.totalElements, 21);
  assert.equal(result.hasMore, true);
});

test("delega las decisiones administrativas al recurso correcto", async () => {
  const calls = [];
  const service = new CatalogService({
    catalogGateway: {
      moderateCasting: async (id, decision) => calls.push(["casting", id, decision]),
      moderateLocation: async (id, decision) => calls.push(["location", id, decision]),
    },
  });
  const approval = { status: "APPROVED", reason: null };
  const rejection = { status: "REJECTED", reason: "Imagen incompleta" };

  await service.moderateCasting("casting-1", approval);
  await service.moderateLocation("location-1", rejection);

  assert.deepEqual(calls, [
    ["casting", "casting-1", approval],
    ["location", "location-1", rejection],
  ]);
});

test("obtiene el perfil propio más reciente con sus archivos resueltos", async () => {
  const service = new CatalogService({
    catalogGateway: {
      listMyCasting: async () => ({
        content: [{
          id: "casting-own",
          fullName: "Perfil propio",
          status: "APPROVED",
          images: [{ id: "media-1", url: "/media/1", sortOrder: 0 }],
        }],
      }),
      resolveMediaUrl: (path) => `https://api.example.com${path}`,
    },
  });

  const profile = await service.getMyCasting();

  assert.equal(profile.id, "casting-own");
  assert.equal(profile.kind, "casting");
  assert.equal(profile.media[0].url, "https://api.example.com/media/1");
});

test("informa que la cuenta todavía no tiene perfil de casting", async () => {
  const service = new CatalogService({
    catalogGateway: {
      listMyCasting: async () => ({ content: [] }),
    },
  });

  assert.equal(await service.getMyCasting(), null);
});

test("resuelve los archivos de equipos administrativos y piezas de portafolio", async () => {
  const gateway = {
    listEquipmentAdmin: async () => ({
      content: [{ id: "equipment-1", images: [{ id: "image-1", url: "/media/equipment" }] }],
      page: 0,
      totalElements: 1,
      totalPages: 1,
      last: true,
    }),
    listPortfolio: async () => ({
      content: [{
        id: "piece-1",
        type: "VIDEO",
        media: { id: "video-1", url: "/media/video" },
        cover: { id: "cover-1", url: "/media/cover" },
      }],
      page: 0,
      totalElements: 1,
      totalPages: 1,
      last: true,
    }),
    resolveMediaUrl: (path) => `https://api.example.com${path}`,
  };
  const service = new CatalogService({ catalogGateway: gateway });

  const equipment = await service.listEquipmentAdmin({ page: 0 });
  const portfolio = await service.listPortfolio({ page: 0 });

  assert.equal(equipment.records[0].images[0].url, "https://api.example.com/media/equipment");
  assert.equal(portfolio.records[0].media.url, "https://api.example.com/media/video");
  assert.equal(portfolio.records[0].cover.url, "https://api.example.com/media/cover");
});
