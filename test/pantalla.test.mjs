import test from "node:test";
import assert from "node:assert/strict";

import { dibujarRaiz, vistaDeRaiz } from "../site/app/pantalla.js";
import { SOBRE_LO_APROBADO } from "../site/app/desviacion.js";
import { falsoDocumento, textoDe } from "./falso-documento.mjs";

const ESTADO = {
  ejercicio: 2025,
  disponibles: [2024, 2025],
  entrada: {
    ejercicio: 2025,
    archivo: "https://dgsiaf-repo.mecon.gob.ar/repository/pa/datasets/2025/credito-anual-2025.zip",
    publicado: "Wed, 08 Jul 2026 10:39:43 GMT",
    // On purpose far from the sum of the jurisdicciones below (100). The
    // headline must read this figure, never the sum. See pantalla.js.
    total_devengado: 105250000,
  },
  indice: {
    "88": { n: "Capital Humano", d: 60, p: 40, v: 62, g: 55, k: ["1"] },
    "88-1": { n: "ANSES", d: 60, p: 40, v: 62, g: 55, k: [] },
    "90": { n: "Deuda", d: 30, p: 30, v: 31, g: 30, k: [] },
    "50": { n: "Economia", d: 10, p: 12, v: 11, g: 10, k: [] },
  },
};

test("la vista toma el total verificado, no la suma de las jurisdicciones", () => {
  const vista = vistaDeRaiz(ESTADO);
  assert.equal(vista.total, 105.25);
});

test("la vista da la ejecucion y la desviacion del ejercicio", () => {
  const vista = vistaDeRaiz(ESTADO);
  assert.ok(Math.abs(vista.ejecucion - 100 / 104) < 1e-9);
  assert.ok(Math.abs(vista.desviacion.valor - (100 / 82 - 1)) < 1e-9);
  assert.equal(vista.desviacion.tipo, SOBRE_LO_APROBADO);
});

test("las porciones de la vista usan lo devengado, no lo aprobado", () => {
  const vista = vistaDeRaiz(ESTADO);
  assert.deepEqual(vista.porciones, [
    { nombre: "Capital Humano", monto: 60, parte: 0.6, esOtros: false, destino: ["88"] },
    { nombre: "Deuda", monto: 30, parte: 0.3, esOtros: false, destino: ["90"] },
    { nombre: "Economia", monto: 10, parte: 0.1, esOtros: false, destino: ["50"] },
  ]);
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
  assert.match(texto, /105\.250\.000/, "the total in full pesos");
  assert.match(texto, /credito-anual-2025/, "UC-06: every screen names its source");
});
