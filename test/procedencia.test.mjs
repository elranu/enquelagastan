import test from "node:test";
import assert from "node:assert/strict";

import {
  EJES, consultaDe, etiquetarCodigos, procedenciaDe,
} from "../site/app/procedencia.js";

const ENTRADA = {
  ejercicio: 2025,
  archivo: "https://dgsiaf-repo.mecon.gob.ar/repository/pa/datasets/2025/credito-anual-2025.zip",
  publicado: "Wed, 08 Jul 2026 10:39:43 GMT",
};
const INDICE = {
  "88": { n: "Capital Humano", d: 66, k: ["1"] },
  "88-1": { n: "ANSES", d: 66, k: [] },
};

test("los ejes son trece y empiezan por la jurisdiccion", () => {
  assert.equal(EJES.length, 13);
  assert.equal(EJES[0], "jurisdiccion");
  assert.equal(EJES.at(-1), "subparcial");
});

test("un nodo con hijos muestra el archivo y la fecha, sin codigos", () => {
  const procedencia = procedenciaDe(ENTRADA, INDICE, "88");
  assert.equal(procedencia.fecha, ENTRADA.publicado);
  assert.ok(procedencia.archivo.includes("credito-anual-2025.zip"));
  assert.equal(procedencia.codigos, null);
});

test("una hoja muestra los codigos exactos", () => {
  const procedencia = procedenciaDe(ENTRADA, INDICE, "88-1");
  assert.deepEqual(procedencia.codigos, [
    { eje: "jurisdiccion", codigo: "88" },
    { eje: "subjurisdiccion", codigo: "1" },
  ]);
});

test("los codigos llevan los tramos que el navegador saltea", () => {
  const codigos = etiquetarCodigos("40-8-0-349-21-0-0-1-0");
  assert.equal(codigos.length, 9,
    "the visitor saw 2 names and the file needs 9 codes");
  assert.equal(codigos.at(3).eje, "servicio");
  assert.equal(codigos.at(3).codigo, "349");
});

test("la consulta se lee como un filtro del archivo", () => {
  assert.equal(consultaDe("88-1"),
    "jurisdiccion_id=88 AND subjurisdiccion_id=1");
});
