import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const sourceRoot = path.resolve("src");
const STATIC_IMPORT_PATTERN = /(?:import|export)\s+(?:[^"']*?\s+from\s+)?["']([^"']+)["']/g;
const DYNAMIC_IMPORT_PATTERN = /import\s*\(\s*["']([^"']+)["']\s*\)/g;

async function javascriptFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return javascriptFiles(entryPath);
    return /\.[jt]sx?$/.test(entry.name) ? [entryPath] : [];
  }));
  return nested.flat();
}

function importedSpecifiers(source) {
  return [STATIC_IMPORT_PATTERN, DYNAMIC_IMPORT_PATTERN].flatMap((pattern) => (
    [...source.matchAll(pattern)].map((match) => match[1])
  ));
}

function resolveLocalImport(importer, specifier, sourceFiles) {
  if (!specifier.startsWith(".")) return null;
  const candidate = path.resolve(path.dirname(importer), specifier);
  const variants = [
    candidate,
    `${candidate}.js`,
    `${candidate}.jsx`,
    path.join(candidate, "index.js"),
    path.join(candidate, "index.jsx"),
  ];
  return variants.find((variant) => sourceFiles.has(path.normalize(variant))) ?? null;
}

async function findForbiddenSpecifiers(layer, isForbidden) {
  const files = await javascriptFiles(path.join(sourceRoot, layer));
  const violations = [];
  for (const file of files) {
    const source = await readFile(file, "utf8");
    importedSpecifiers(source)
      .filter(isForbidden)
      .forEach((specifier) => {
        violations.push(`${path.relative(sourceRoot, file)} -> ${specifier}`);
      });
  }
  return violations;
}

test("el dominio no depende de frameworks ni capas externas", async () => {
  const violations = await findForbiddenSpecifiers("domain", (specifier) => {
    if (!specifier.startsWith(".") && !specifier.startsWith("/")) return true;
    return /(^|[/\\])(application|infrastructure|presentation)([/\\]|$)/.test(specifier);
  });
  assert.deepEqual(violations, []);
});

test("la aplicación solo depende del dominio", async () => {
  const violations = await findForbiddenSpecifiers("application", (specifier) => {
    if (!specifier.startsWith(".") && !specifier.startsWith("/")) return true;
    return /(^|[/\\])(infrastructure|presentation)([/\\]|$)/.test(specifier);
  });
  assert.deepEqual(violations, []);
});

test("presentación no importa adaptadores de infraestructura", async () => {
  const violations = await findForbiddenSpecifiers(
    "presentation",
    (specifier) => /(^|[/\\])infrastructure([/\\]|$)/.test(specifier),
  );
  assert.deepEqual(violations, []);
});

test("presentación solo usa SDK externos aprobados", async () => {
  const allowedExternalPackages = ["react", "@fontsource/"];
  const violations = await findForbiddenSpecifiers("presentation", (specifier) => {
    if (specifier.startsWith(".") || specifier.startsWith("/")) return false;
    return !allowedExternalPackages.some((allowed) => (
      specifier === allowed || specifier.startsWith(allowed)
    ));
  });
  assert.deepEqual(violations, []);
});

test("infraestructura no depende de presentación", async () => {
  const violations = await findForbiddenSpecifiers(
    "infrastructure",
    (specifier) => /(^|[/\\])presentation([/\\]|$)/.test(specifier),
  );
  assert.deepEqual(violations, []);
});

test("los features de presentación no dependen de features hermanos", async () => {
  const featuresRoot = path.join(sourceRoot, "presentation", "features");
  const files = await javascriptFiles(featuresRoot);
  const violations = [];

  for (const file of files) {
    const relative = path.relative(featuresRoot, file).replaceAll("\\", "/");
    if (relative === "workspace/ProductionWorkspace.jsx") continue;
    const currentFeature = relative.split("/")[0];
    const source = await readFile(file, "utf8");

    importedSpecifiers(source).forEach((specifier) => {
      const siblingMatch = specifier.match(/^\.\.\/(?!\.\.\/)([^/]+)\//);
      if (siblingMatch && siblingMatch[1] !== currentFeature) {
        violations.push(`${relative} -> ${specifier}`);
      }
    });
  }

  assert.deepEqual(violations, []);
});

test("el grafo interno de módulos no contiene dependencias circulares", async () => {
  const files = await javascriptFiles(sourceRoot);
  const sourceFiles = new Set(files.map((file) => path.normalize(file)));
  const graph = new Map();

  for (const file of files) {
    const source = await readFile(file, "utf8");
    const dependencies = importedSpecifiers(source)
      .map((specifier) => resolveLocalImport(file, specifier, sourceFiles))
      .filter(Boolean);
    graph.set(path.normalize(file), dependencies);
  }

  const visiting = new Set();
  const visited = new Set();
  const stack = [];
  const cycles = [];

  function visit(file) {
    if (visiting.has(file)) {
      const cycleStart = stack.indexOf(file);
      cycles.push([...stack.slice(cycleStart), file]
        .map((entry) => path.relative(sourceRoot, entry))
        .join(" -> "));
      return;
    }
    if (visited.has(file)) return;

    visiting.add(file);
    stack.push(file);
    graph.get(file)?.forEach(visit);
    stack.pop();
    visiting.delete(file);
    visited.add(file);
  }

  graph.keys().forEach(visit);
  assert.deepEqual(cycles, []);
});
