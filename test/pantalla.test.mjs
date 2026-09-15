import test from "node:test";
import assert from "node:assert/strict";

import { dibujarRaiz, vistaDeRaiz } from "../site/app/pantalla.js";
import { falsoDocumento, textoDe } from "./falso-documento.mjs";

const ESTADO = {
  ejercicio: 2025,
  disponibles: [2024, 2025],
  entrada: {
    ejercicio: 2025,
    archivo: "https://dgsiaf-repo.mecon.gob.ar/repository/pa/datasets/2025/credito-anual-2025.zip",
    publicado: "Wed, 08 Jul 2026 10:39:43 GMT",
  },
  indice: {
    "88": { n: "Capital Humano", d: 60, p: 40, v: 62, g: 55, k: ["1"] },
    "88-1": { n: "ANSES", d: 60, p: 40, v: 62, g: 55, k: [] },
    "90": { n: "Deuda", d: 30, p: 30, v: 31, g: 30, k: [] },
    "50": { n: "Economia", d: 10, p: 12, v: 11, g: 10, k: [] },
  },
};

test("la vista suma el total de las jurisdicciones", () => {
  const vista = vistaDeRaiz(ESTADO);
  assert.equal(vista.total, 100);
});

test("la vista da la ejecucion y la desviacion del ejercicio", () => {
  const vista = vistaDeRaiz(ESTADO);
  assert.ok(Math.abs(vista.ejecucion - 100 / 104) < 1e-9);
  assert.ok(Math.abs(vista.desviacion.valor - (100 / 82 - 1)) < 1e-9);
});

test("la vista ofrece solo los ejercicios que estan", () => {
  assert.deepEqual(vistaDeRaiz(ESTADO).anios, [2024, 2025]);
});

test("la procedencia de la raiz no lleva codigos", () => {
  assert.equal(vistaDeRaiz(ESTADO).procedencia.codigos, null);
});

test("la pantalla nombra el ejercicio, el total y la fuente", () => {
  const elemento = dibujarRaiz(vistaDeRaiz(ESTADO), falsoDocumento());
  const texto = textoDe(elemento);
  assert.match(texto, /2025/);
  assert.match(texto, /100\.000\.000/, "the total in full pesos");
  assert.match(texto, /credito-anual-2025/, "UC-06: every screen names its source");
});
