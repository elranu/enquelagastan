import test from "node:test";
import assert from "node:assert/strict";

import {
  cargarInstitucional, cargarJson, caminoDeClave, claveDeCamino, olvidar,
} from "../site/app/datos.js";

function falsoTraer(cuerpo, ok = true, estado = 200) {
  const llamadas = [];
  const traer = async (ruta) => {
    llamadas.push(ruta);
    return { ok, status: estado, json: async () => cuerpo };
  };
  return { traer, llamadas };
}

test("une un camino en una clave", () => {
  assert.equal(claveDeCamino(["88", "1", "0"]), "88-1-0");
  assert.equal(claveDeCamino([]), "");
});

test("parte una clave en un camino", () => {
  assert.deepEqual(caminoDeClave("88-1-0"), ["88", "1", "0"]);
  assert.deepEqual(caminoDeClave(""), []);
});

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
