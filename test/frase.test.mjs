import test from "node:test";
import assert from "node:assert/strict";

import { deCadaCien, fraseDe } from "../site/app/frase.js";

const parte = (nombre, monto, total, esOtros = false) => ({
  nombre, monto, parte: monto / total, esOtros, destino: [nombre],
});

const leer = ({ antes, cifra, despues }) => `${antes}${cifra}${despues}`;

test("en la raiz el nodo es el Estado nacional", () => {
  const frase = fraseDe({
    anio: 2025,
    nodo: null,
    porciones: [parte("Ministerio de Capital Humano", 59.8, 100), parte("Deuda", 40.2, 100)],
    total: 100,
    totalNacional: 100,
  });
  assert.equal(frase.cifra, "$60", "59,8 rounds to 60");
  assert.equal(leer(frase),
    "De cada $100 que gastó el Estado nacional en 2025, $60 fueron a Ministerio de Capital Humano.");
});

test("la parte mayor con el nombre del nodo lo gasto en forma directa", () => {
  const frase = fraseDe({
    anio: 2025,
    nodo: "Secretaría de Educación",
    porciones: [parte("Secretaria de Educacion", 78, 100), parte("Becas", 22, 100)],
    total: 100,
    totalNacional: 1000,
  });
  assert.equal(leer(frase),
    "De cada $100 que gastó Secretaría de Educación en 2025, $78 los gastó "
    + "Secretaría de Educación en forma directa.");
});

test("un nodo sin partes se compara con el total nacional", () => {
  const frase = fraseDe({
    anio: 2024, nodo: "Becas", porciones: [], total: 0.5, totalNacional: 100,
  });
  // 0,5 of 100 is 0,5%: 50 centavos of every $100.
  assert.equal(leer(frase),
    "De cada $100 que gastó el Estado nacional en 2024, 50 centavos fueron a Becas.");
});

test("otros puede ser la parte mayor aunque vaya al final", () => {
  const frase = fraseDe({
    anio: 2025,
    nodo: "Vialidad",
    porciones: [parte("Rutas", 5, 100), parte("otros", 95, 100, true)],
    total: 100,
    totalNacional: 1000,
  });
  assert.equal(frase.cifra, "$95");
  assert.equal(frase.despues, " fueron a otros gastos chicos.");
});

test("menos de un peso se dice en centavos", () => {
  assert.equal(deCadaCien(0.0099), "99 centavos");
  assert.equal(deCadaCien(0.0001), "1 centavo");
  assert.equal(deCadaCien(0.00995), "$1", "99,5 centavos round to one peso");
  assert.equal(deCadaCien(0.00001), "menos de 1 centavo");
  assert.equal(deCadaCien(0), "menos de 1 centavo");
});
