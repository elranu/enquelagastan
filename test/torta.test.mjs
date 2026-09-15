import test from "node:test";
import assert from "node:assert/strict";

import { caminoDeArco, dibujarTorta } from "../site/app/torta.js";
import { falsoDocumento } from "./falso-documento.mjs";

const PORCIONES = [
  { nombre: "Capital Humano", monto: 60, parte: 0.6, esOtros: false, destino: ["88"] },
  { nombre: "Deuda", monto: 30, parte: 0.3, esOtros: false, destino: ["90"] },
  { nombre: "otros", monto: 10, parte: 0.1, esOtros: true, destino: ["1", "2"] },
];

test("un arco de media vuelta lleva la bandera del arco grande en cero", () => {
  const camino = caminoDeArco(0, Math.PI);
  assert.match(camino, / 0 1 /, "half a turn is not the large arc");
});

test("un arco de tres cuartos lleva la bandera en uno", () => {
  const camino = caminoDeArco(0, Math.PI * 1.5);
  assert.match(camino, / 1 1 /);
});

test("dibuja una porcion por cada entrada", () => {
  const svg = dibujarTorta(PORCIONES, falsoDocumento());
  const formas = svg.hijos.filter((hijo) => hijo.etiqueta === "path");
  assert.equal(formas.length, 3);
});

test("cada porcion lleva su destino y su nombre accesible", () => {
  const svg = dibujarTorta(PORCIONES, falsoDocumento());
  const primera = svg.hijos[0];
  assert.equal(primera.atributos["data-destino"], "88");
  assert.match(primera.hijos[0].textContent, /Capital Humano/);
  assert.match(primera.hijos[0].textContent, /60/);
  assert.equal(primera.atributos["role"], "listitem");
  assert.equal(primera.atributos["tabindex"], "0");
});

test("una sola porcion dibuja un circulo y no un arco", () => {
  const sola = [{ nombre: "Unica", monto: 10, parte: 1, esOtros: false, destino: ["9"] }];
  const svg = dibujarTorta(sola, falsoDocumento());
  assert.equal(svg.hijos.filter((h) => h.etiqueta === "circle").length, 1);
  assert.equal(svg.hijos.filter((h) => h.etiqueta === "path").length, 0);
});

test("la porcion otros lleva su marca", () => {
  const svg = dibujarTorta(PORCIONES, falsoDocumento());
  assert.equal(svg.hijos.at(-1).atributos["data-otros"], "si");
});
