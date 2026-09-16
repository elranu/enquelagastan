import test from "node:test";
import assert from "node:assert/strict";

import {
  ancestroQueExiste, ejercicioDeEntrada, ejerciciosDisponibles, escribirRuta,
  leerRuta,
} from "../site/app/ruta.js";

const MANIFIESTO = {
  ejercicios: [
    { ejercicio: 2025, en_este_artefacto: true },
    { ejercicio: 2026, en_este_artefacto: false },
    { ejercicio: 2024, en_este_artefacto: true },
  ],
};

test("lee el ejercicio y el camino de la url", () => {
  assert.deepEqual(leerRuta("#/2025/88-1-0"), { ejercicio: 2025, clave: "88-1-0" });
  assert.deepEqual(leerRuta("#/2025"), { ejercicio: 2025, clave: "" });
  assert.deepEqual(leerRuta(""), { ejercicio: null, clave: "" });
});

test("escribe una url que se puede compartir", () => {
  assert.equal(escribirRuta(2025, "88-1-0"), "#/2025/88-1-0");
  assert.equal(escribirRuta(2025, ""), "#/2025");
});

test("un ejercicio que no esta en el artefacto no se ofrece", () => {
  assert.deepEqual(ejerciciosDisponibles(MANIFIESTO), [2024, 2025],
    "the build of that day published no data for 2026");
});

test("la entrada muestra el ultimo ejercicio cerrado", () => {
  // Decision C2 of the spec. The open exercise is not complete, so the entry
  // shows the last one that closed.
  assert.equal(ejercicioDeEntrada([2024, 2025, 2026], 2026), 2025);
  // The build of that day did not publish 2026. The last closed one is still
  // 2025, so a rule of "the one before the last available" would give 2024.
  assert.equal(ejercicioDeEntrada([2024, 2025], 2026), 2025);
  // Nothing is closed yet. Show what there is.
  assert.equal(ejercicioDeEntrada([2026], 2026), 2026);
});

test("sube al ancestro que existe en el otro ejercicio", () => {
  const indice = { "88": { n: "Capital Humano", k: ["1"] },
                   "88-1": { n: "ANSES", k: [] } };
  assert.equal(ancestroQueExiste(indice, "88-1-9-9"), "88-1");
  assert.equal(ancestroQueExiste(indice, "88-1"), "88-1");
  assert.equal(ancestroQueExiste(indice, "77-7"), null);
});

test("la raiz siempre existe", () => {
  const indice = { "88": { n: "Capital Humano", k: [] } };
  assert.equal(ancestroQueExiste(indice, ""), "");
});

test("una url sin ejercicio nunca se escribe como #/null", () => {
  // The screen of a failure is reached from a bare "#/", and its exit
  // carries no exercise. dibujar picks the exercise of entry and rewrites
  // the URL, so the route here only has to stay a route.
  assert.equal(escribirRuta(null, ""), "#/");
  assert.equal(escribirRuta(Number.NaN, "88"), "#/");
});
