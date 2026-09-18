import test from "node:test";
import assert from "node:assert/strict";

import {
  cargarInstitucional, cargarJson, cargarManifiesto, cargarObjeto, olvidar,
} from "../site/app/datos.js";

function falsoTraer(cuerpo, ok = true, estado = 200) {
  const llamadas = [];
  const traer = async (ruta) => {
    llamadas.push(ruta);
    return { ok, status: estado, json: async () => cuerpo };
  };
  return { traer, llamadas };
}

test("lee el archivo una sola vez", async () => {
  olvidar();
  const { traer, llamadas } = falsoTraer({ "88": { n: "Capital Humano" } });
  const primero = await cargarInstitucional(2025, traer);
  const segundo = await cargarInstitucional(2025, traer);
  assert.equal(llamadas.length, 1, "the second read comes from the memory");
  assert.equal(primero, segundo);
});

test("una respuesta que no es ok levanta un error", async () => {
  olvidar();
  const { traer } = falsoTraer(null, false, 404);
  await assert.rejects(() => cargarJson("data/x.json", traer), /404/);
});

test("un 404 deja el estado en su propia propiedad del error", async () => {
  olvidar();
  const { traer } = falsoTraer(null, false, 404);
  await assert.rejects(
    () => cargarJson("data/x.json", traer),
    (error) => error.estadoHttp === 404,
  );
});

test("un 503 deja el estado en su propia propiedad del error", async () => {
  olvidar();
  const { traer } = falsoTraer(null, false, 503);
  await assert.rejects(
    () => cargarJson("data/x.json", traer),
    (error) => error.estadoHttp === 503,
  );
});

test("dos lecturas concurrentes de una misma ruta piden el archivo una sola vez", async () => {
  // Two screens can ask for one route before the first request settles.
  // The memory must hold the promise itself, and not only the settled
  // value, or the second read would start a second request of its own.
  olvidar();
  const llamadas = [];
  let responder;
  const traer = async (ruta) => {
    llamadas.push(ruta);
    await new Promise((seguir) => { responder = seguir; });
    return { ok: true, status: 200, json: async () => ({ "88": { n: "Capital Humano" } }) };
  };
  const ruta = "data/2025/institucional.json";
  const primera = cargarJson(ruta, traer);
  const segunda = cargarJson(ruta, traer);
  responder();
  const [uno, dos] = await Promise.all([primera, segunda]);
  assert.equal(llamadas.length, 1, "one file, one request");
  assert.equal(uno, dos);
});

test("cada cargador construye la ruta que le corresponde", async () => {
  // Two loaders build a route below manifest.json. No earlier test called
  // them. Nothing checked the route they pass to the seam traer.
  olvidar();
  const { traer, llamadas } = falsoTraer({});
  await cargarManifiesto(traer);
  await cargarInstitucional(2025, traer);
  await cargarObjeto(2025, "88-1-0-100-21-0-0-1-0", traer);
  assert.deepEqual(llamadas, [
    "data/manifest.json",
    "data/2025/institucional.json",
    "data/2025/objeto/88-1-0-100-21-0-0-1-0.json",
  ]);
});
