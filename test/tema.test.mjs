import test from "node:test";
import assert from "node:assert/strict";

import {
  aplicarTema, cambiarTema, CLAVE_BILLETES, CLAVE_OSCURO, etiquetaDelAspecto, leerTema,
} from "../site/app/tema.js";

function almacen(datos = {}) {
  return {
    datos,
    getItem: (clave) => datos[clave] ?? null,
    setItem: (clave, valor) => { datos[clave] = valor; },
  };
}

const roto = {
  getItem() { throw new Error("SecurityError"); },
  setItem() { throw new Error("QuotaExceededError"); },
};

test("sin valor guardado el aspecto es sistema", () => {
  assert.deepEqual(leerTema(almacen()), { aspecto: "sistema", billetes: false });
});

test("un valor guardado gana al valor por defecto", () => {
  const guardado = almacen({ [CLAVE_OSCURO]: "oscuro", [CLAVE_BILLETES]: "true" });
  assert.deepEqual(leerTema(guardado), { aspecto: "oscuro", billetes: true });
});

test("un valor que ya no es uno de los tres estados vuelve a sistema", () => {
  // A key written by an earlier version ("true"/"false") is none of the
  // three states, and the default wins.
  const guardado = almacen({ [CLAVE_OSCURO]: "true" });
  assert.deepEqual(leerTema(guardado), { aspecto: "sistema", billetes: false });
});

test("un almacen que falla da el aspecto por defecto", () => {
  assert.deepEqual(leerTema(roto), { aspecto: "sistema", billetes: false });
  // The getter of window.localStorage can throw too. app.js then passes null.
  assert.deepEqual(leerTema(null), { aspecto: "sistema", billetes: false });
});

function elemento() {
  return {
    atributos: {},
    setAttribute(nombre, valor) { this.atributos[nombre] = valor; },
  };
}

test("el aspecto vive en data-tema, y billetes en data-vista y su interruptor", () => {
  const partes = { html: elemento(), tema: elemento(), billetes: elemento() };
  const documento = { documentElement: partes.html, getElementById: (id) => partes[id] };
  aplicarTema(documento, { aspecto: "oscuro", billetes: false });
  assert.equal(partes.html.atributos["data-tema"], "oscuro");
  assert.equal(partes.html.atributos["data-vista"], "simple");
  assert.equal(partes.billetes.atributos["aria-checked"], "false");
  assert.match(partes.tema.atributos["aria-label"], /^Tema: oscuro\. /);
  aplicarTema(documento, { aspecto: "sistema", billetes: true });
  assert.equal(partes.html.atributos["data-tema"], "sistema");
  assert.equal(partes.html.atributos["data-vista"], "billetes");
  assert.equal(partes.billetes.atributos["aria-checked"], "true");
});

test("la etiqueta del tema dice el estado y el proximo toque, en espanol", () => {
  assert.equal(etiquetaDelAspecto("sistema"), "Tema: sistema. Tocar para el tema claro.");
  assert.equal(etiquetaDelAspecto("claro"), "Tema: claro. Tocar para el tema oscuro.");
  assert.equal(etiquetaDelAspecto("oscuro"), "Tema: oscuro. Tocar para el tema del sistema.");
});

test("un toque del tema avanza sistema, claro, oscuro y vuelve a sistema", () => {
  const lugar = almacen();
  let tema = { aspecto: "sistema", billetes: false };
  tema = cambiarTema(tema, "tema", lugar);
  assert.equal(tema.aspecto, "claro");
  tema = cambiarTema(tema, "tema", lugar);
  assert.equal(tema.aspecto, "oscuro");
  assert.equal(lugar.datos[CLAVE_OSCURO], "oscuro");
  tema = cambiarTema(tema, "tema", lugar);
  assert.equal(tema.aspecto, "sistema");
});

test("billetes guarda su eleccion, y un almacen que falla no rompe", () => {
  const lugar = almacen();
  const tema = cambiarTema({ aspecto: "sistema", billetes: false }, "billetes", lugar);
  assert.deepEqual(tema, { aspecto: "sistema", billetes: true });
  assert.equal(lugar.datos[CLAVE_BILLETES], "true");
  assert.deepEqual(cambiarTema(tema, "tema", roto), { aspecto: "claro", billetes: true },
    "the look changes for this visit");
});
