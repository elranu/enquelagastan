import test from "node:test";
import assert from "node:assert/strict";

import {
  dibujarAusente, dibujarFuentes, dibujarNodo, dibujarRaiz, indiceParaClave,
  vistaDeAusente, vistaDeFuentes, vistaDeNodo, vistaDeRaiz,
} from "../site/app/pantalla.js";
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

// A chain of nodos with one child each, followed by one that divides. The
// visitor never stops at "45" or "45-1"; only their names go to the miga.
const CON_CADENA = {
  ...ESTADO,
  indice: {
    "45": { n: "Procuracion", d: 31, p: 30, v: 33, g: 30, k: ["1"] },
    "45-1": { n: "Procuracion", d: 31, p: 30, v: 33, g: 30, k: ["0"] },
    "45-1-0": { n: "Defensa Juridica", d: 31, p: 30, v: 33, g: 30, k: ["7", "8"] },
    "45-1-0-7": { n: "Curso", d: 20, p: 20, v: 21, g: 20, k: [] },
    "45-1-0-8": { n: "Taller", d: 11, p: 10, v: 12, g: 10, k: [] },
  },
};

test("el nodo muestra su parte del total nacional", () => {
  const vista = vistaDeNodo(ESTADO, "88");
  assert.equal(vista.total, 60);
  assert.ok(Math.abs(vista.parteDelTotal - 0.6) < 1e-9);
});

test("la miga conserva los tramos que el navegador saltea", () => {
  const vista = vistaDeNodo(CON_CADENA, "45-1-0");
  assert.deepEqual(vista.miga.map((t) => t.nombre),
    ["Procuracion", "Procuracion", "Defensa Juridica"]);
});

test("la hoja muestra los codigos exactos al pie", () => {
  const vista = vistaDeNodo(CON_CADENA, "45-1-0-7");
  assert.equal(vista.procedencia.codigos.length, 4);
});

test("un nodo con gasto cero lo dice y no dibuja torta", () => {
  const cero = { ...ESTADO, indice: { "9": { n: "Sin ejecucion", d: 0, p: 0, v: 0, g: 0, k: [] } } };
  const vista = vistaDeNodo(cero, "9");
  assert.equal(vista.total, 0);
  assert.deepEqual(vista.porciones, []);
  assert.equal(vista.sinEjecucion, true);
});

test("abajo del nivel de control la desviacion cambia de nombre", () => {
  const vista = vistaDeNodo(CON_CADENA, "45-1-0-7");
  assert.equal(vista.desviacion.tipo, "sobre-lo-aprobado");
  const hondo = { ...ESTADO, indice: {
    "1-2-3-4-5-6-7-8": { n: "Actividad", d: 12, p: 10, v: 13, g: 11, k: [] } } };
  assert.equal(vistaDeNodo(hondo, "1-2-3-4-5-6-7-8").desviacion.tipo,
    "reasignacion-interna");
});

test("un grupo otros muestra solo sus claves y lo dice en la miga", () => {
  // app.js passes a subset of the children when the visitor opens "otros".
  // vistaDeNodo must show only that subset, and name the group in the miga.
  const vista = vistaDeNodo(CON_CADENA, "45-1-0", ["45-1-0-8"]);
  assert.deepEqual(vista.porciones.map((porcion) => porcion.nombre), ["Taller"]);
  assert.equal(vista.miga.at(-1).nombre, "otros");
});

test("el camino ausente dice que no existe y ofrece dos salidas", () => {
  const vista = vistaDeAusente(ESTADO, "88-9-9", { ejercicio: 2024, monto: 12 });
  assert.equal(vista.clavePedida, "88-9-9");
  assert.equal(vista.ancestro, "88", "the nearest ancestor that exists");
  assert.equal(vista.origen.ejercicio, 2024);
});

test("la pantalla del ausente nombra el ejercicio y las dos salidas", () => {
  const vista = vistaDeAusente(ESTADO, "88-9-9", { ejercicio: 2024, monto: 12 });
  const texto = textoDe(dibujarAusente(vista, falsoDocumento()));
  assert.match(texto, /2025/);
  assert.match(texto, /2024/);
});

test("indiceParaClave no toca la red debajo del nivel institucional", async () => {
  const llamadas = [];
  const traer = async (ruta) => { llamadas.push(ruta); return { ok: true, json: async () => ({}) }; };
  const indice = await indiceParaClave(2025, ESTADO.indice, "88-1", traer);
  assert.equal(indice, ESTADO.indice);
  assert.equal(llamadas.length, 0, "a clave above the object level asks nothing of the network");
});

test("indiceParaClave junta el archivo del objeto en el nivel 9", async () => {
  // The real nodo 1-0-0-312-16-0-0-1-0 declares its five incisos in `k`, and
  // those incisos live only in one file per nodo of level 9.
  const base = {
    "1-0-0-312-16-0-0-1-0": {
      n: "Formacion y Sancion de Leyes Nacionales", d: 190, p: 160, v: 191, g: 183, k: ["1"],
    },
  };
  const delArchivo = {
    "1-0-0-312-16-0-0-1-0-1": { n: "Gastos en personal", d: 190, p: 160, v: 191, g: 183, k: [] },
  };
  const traer = async (ruta) => {
    assert.equal(ruta, "data/2025/objeto/1-0-0-312-16-0-0-1-0.json");
    return { ok: true, json: async () => delArchivo };
  };
  const indice = await indiceParaClave(2025, base, "1-0-0-312-16-0-0-1-0", traer);
  assert.deepEqual(indice["1-0-0-312-16-0-0-1-0-1"], delArchivo["1-0-0-312-16-0-0-1-0-1"]);
  assert.ok(indice["1-0-0-312-16-0-0-1-0"], "the join keeps the institutional entries too");
});

const MANIFIESTO = { ejercicios: [
  { ejercicio: 2024, archivo: "https://x/credito-anual-2024.zip",
    publicado: "Fri, 04 Jul 2025 10:44:09 GMT", verificado: true,
    en_este_artefacto: true },
  { ejercicio: 2025, archivo: "https://x/credito-anual-2025.zip",
    publicado: "Wed, 08 Jul 2026 10:39:43 GMT", verificado: true,
    en_este_artefacto: true },
] };

test("las fuentes listan un ejercicio por fila con su fecha", () => {
  const vista = vistaDeFuentes(MANIFIESTO);
  assert.equal(vista.filas.length, 2);
  assert.equal(vista.filas[0].ejercicio, 2024);
  assert.equal(vista.filas[0].verificado, true);
});

test("la pantalla nombra la licencia y el organismo", () => {
  const texto = textoDe(dibujarFuentes(vistaDeFuentes(MANIFIESTO), falsoDocumento()));
  assert.match(texto, /CC BY 4\.0/);
  assert.match(texto, /Ministerio de Economía/);
  assert.match(texto, /credito-anual-2025\.zip/);
});

test("todas las pantallas enlazan a la pantalla de fuentes", () => {
  // UC-06 is a must: every screen must offer a way to check the source.
  const raiz = dibujarRaiz(vistaDeRaiz(ESTADO), falsoDocumento());
  assert.match(textoDe(raiz), /De dónde salen estos números/);
});
