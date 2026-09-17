import test from "node:test";
import assert from "node:assert/strict";

import {
  aplicarTema, cambiarTema, CLAVE_BILLETES, CLAVE_OSCURO, leerTema,
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

const oscuroPreferido = (consulta) => consulta === "(prefers-color-scheme: dark)";
const claroPreferido = () => false;

test("sin valor guardado el oscuro sigue la preferencia del sistema", () => {
  assert.deepEqual(leerTema(almacen(), oscuroPreferido), { oscuro: true, billetes: false });
  assert.deepEqual(leerTema(almacen(), claroPreferido), { oscuro: false, billetes: false });
});

test("un valor guardado gana a la preferencia del sistema", () => {
  const guardado = almacen({ [CLAVE_OSCURO]: "false", [CLAVE_BILLETES]: "true" });
  assert.deepEqual(leerTema(guardado, oscuroPreferido), { oscuro: false, billetes: true });
});

test("un almacen que falla da el aspecto por defecto", () => {
  assert.deepEqual(leerTema(roto, claroPreferido), { oscuro: false, billetes: false });
  // The getter of window.localStorage can throw too. app.js then passes null.
  assert.deepEqual(leerTema(null, oscuroPreferido), { oscuro: true, billetes: false });
});

function elemento() {
  return { atributos: {}, setAttribute(nombre, valor) { this.atributos[nombre] = valor; } };
}

test("el aspecto vive en dos atributos de html y en los dos interruptores", () => {
  const partes = { html: elemento(), oscuro: elemento(), billetes: elemento() };
  const documento = { documentElement: partes.html, getElementById: (id) => partes[id] };
  aplicarTema(documento, { oscuro: true, billetes: false });
  assert.deepEqual(partes.html.atributos, { "data-tema": "oscuro", "data-vista": "simple" });
  assert.equal(partes.oscuro.atributos["aria-checked"], "true");
  assert.equal(partes.billetes.atributos["aria-checked"], "false");
  aplicarTema(documento, { oscuro: false, billetes: true });
  assert.deepEqual(partes.html.atributos, { "data-tema": "claro", "data-vista": "billetes" });
});

test("un interruptor guarda la eleccion, y un almacen que falla no rompe", () => {
  const lugar = almacen();
  const tema = cambiarTema({ oscuro: false, billetes: false }, "billetes", lugar);
  assert.deepEqual(tema, { oscuro: false, billetes: true });
  assert.equal(lugar.datos[CLAVE_BILLETES], "true");
  assert.deepEqual(cambiarTema(tema, "oscuro", roto), { oscuro: true, billetes: true },
    "the look changes for this visit");
});
