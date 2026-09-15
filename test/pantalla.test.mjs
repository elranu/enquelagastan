import test from "node:test";
import assert from "node:assert/strict";

import {
  dibujarAusente, dibujarFuentes, dibujarNodo, dibujarRaiz, esAusencia,
  indiceParaClave, resolverPantalla, vistaDeAusente, vistaDeFuentes,
  vistaDeNodo, vistaDeRaiz,
} from "../site/app/pantalla.js";
import { SOBRE_LO_APROBADO } from "../site/app/desviacion.js";
import { controles, falsoDocumento, textoDe } from "./falso-documento.mjs";

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

test("un grupo otros en la raiz muestra solo sus claves", () => {
  // UC-03: the visitor can open the slice "otros" from the root too. The
  // total, the ejecucion and the deviation still describe the whole
  // exercise. Only the pie chart narrows to the group.
  const vista = vistaDeRaiz(ESTADO, ["90", "50"]);
  assert.deepEqual(vista.porciones.map((porcion) => porcion.nombre), ["Deuda", "Economia"]);
  assert.equal(vista.total, 105.25);
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

test("la pantalla escribe la palabra que corresponde a cada tipo de desviacion", () => {
  // PALABRA_DE_LA_DESVIACION exists so that no screen shows one concept and
  // names it the other. Assert the rendered word for both types.
  const alto = textoDe(dibujarNodo(vistaDeNodo(CON_CADENA, "45-1-0"), falsoDocumento()));
  assert.match(alto, /sobre lo aprobado/);
  assert.doesNotMatch(alto, /reasignación/);

  const hondo = { ...ESTADO, indice: {
    "1-2-3-4-5-6-7-8": { n: "Actividad", d: 12, p: 10, v: 13, g: 11, k: [] } } };
  const texto = textoDe(
    dibujarNodo(vistaDeNodo(hondo, "1-2-3-4-5-6-7-8"), falsoDocumento()),
  );
  assert.match(texto, /de reasignación dentro del proyecto/);
  assert.doesNotMatch(texto, /sobre lo aprobado/);
});

test("la pantalla del ausente dibuja las dos salidas como controles", () => {
  const vista = vistaDeAusente(ESTADO, "88-9-9", { ejercicio: 2024, monto: 12 });
  const pantalla = dibujarAusente(vista, falsoDocumento());
  // The miga carries "88" and the year strip carries "2024", so a test that
  // looks only at the values passes with no exit at all. Read the controls.
  const subir = controles(pantalla, "data-clave")
    .find((control) => control.texto === "Subir al nivel que sí existe");
  const volver = controles(pantalla, "data-anio")
    .find((control) => control.texto === "Volver a 2024");
  assert.equal(subir.valor, "88", "subir al ancestro que existe");
  assert.equal(volver.valor, "2024", "volver al ejercicio de origen");
});

test("la pantalla del ausente lleva miga de pan", () => {
  // Without it, a P2b reached by a shared URL has no working control.
  const vista = vistaDeAusente(ESTADO, "88-9-9", { ejercicio: 2024, monto: 12 });
  const pantalla = dibujarAusente(vista, falsoDocumento());
  const tramos = controles(pantalla, "data-clave").map((control) => control.texto);
  assert.ok(tramos.includes("Inicio"));
  assert.ok(tramos.includes("Capital Humano"));
});

test("la raiz con un grupo otros nombra el grupo en la miga", () => {
  const pantalla = dibujarRaiz(vistaDeRaiz(ESTADO, ["90", "50"]), falsoDocumento());
  const tramos = controles(pantalla, "data-clave").map((control) => control.texto);
  assert.deepEqual(tramos, ["Inicio", "otros"]);
});

test("la raiz sin grupo no dibuja miga", () => {
  const pantalla = dibujarRaiz(vistaDeRaiz(ESTADO), falsoDocumento());
  assert.equal(controles(pantalla, "data-clave").length, 0);
});

test("la pantalla de fuentes ofrece una salida", () => {
  // The flow diagram draws P4 --> P1, and an article links to P4 directly.
  const pantalla = dibujarFuentes(vistaDeFuentes(MANIFIESTO), falsoDocumento());
  assert.ok(controles(pantalla, "href").some((control) => control.valor === "#/"));
});

test("una hoja con gasto real no dibuja torta vacia", () => {
  // What matters for the chart is "no children", not "no spending".
  const hoja = { ...ESTADO, indice: { "7": { n: "Hoja", d: 9, p: 8, v: 9, g: 8, k: [] } } };
  const pantalla = dibujarNodo(vistaDeNodo(hoja, "7"), falsoDocumento());
  const etiquetas = pantalla.hijos.map((hijo) => hijo.etiqueta);
  assert.ok(!etiquetas.includes("svg"), "no pie chart without children");
  assert.doesNotMatch(textoDe(pantalla), /Sin ejecución/, "it did spend");
});

// resolverPantalla holds the routing decision, so a test reads it without a
// DOM. app.js keeps only the DOM and the history.

test("resolverPantalla salta el nodo de un solo hijo", () => {
  assert.deepEqual(resolverPantalla(CON_CADENA, "45"), { tipo: "saltar", clave: "45-1-0" });
  assert.deepEqual(resolverPantalla(CON_CADENA, "45-1-0", null),
    { tipo: "nodo", clave: "45-1-0", grupo: null });
});

test("resolverPantalla manda a la pantalla del ausente", () => {
  assert.deepEqual(resolverPantalla(ESTADO, "88-9-9"), { tipo: "ausente", clave: "88-9-9" });
});

test("resolverPantalla descarta un grupo otros de otro ejercicio", () => {
  // The arrow of the year keeps the clave, so a group can survive into an
  // exercise whose index does not hold its claves.
  const grupo = { ejercicio: 2024, deClave: "88-1", claves: ["88-1-5", "88-1-6"] };
  const enOtroEjercicio = resolverPantalla(ESTADO, "88-1", grupo);
  assert.equal(enOtroEjercicio.grupo, null);
  const delMismo = resolverPantalla(ESTADO, "88-1",
    { ...grupo, ejercicio: 2025, claves: ["88-1"] });
  assert.deepEqual(delMismo.grupo, ["88-1"]);
});

test("resolverPantalla descarta un grupo otros de otra clave", () => {
  const grupo = { ejercicio: 2025, deClave: "90", claves: ["50"] };
  assert.equal(resolverPantalla(ESTADO, "88-1", grupo).grupo, null);
});

test("el ausente sin ejercicio de origen no ofrece volver al mismo ejercicio", () => {
  // A shared URL gives no origin. "Volver a 2025" while on 2025 is inert.
  const vista = vistaDeAusente(ESTADO, "88-9-9", { ejercicio: 2025 });
  const pantalla = dibujarAusente(vista, falsoDocumento());
  assert.equal(controles(pantalla, "data-anio")
    .filter((control) => control.texto.startsWith("Volver")).length, 0);
  assert.ok(controles(pantalla, "data-clave").length > 0, "the miga is the exit");
});

// esAusencia holds the rule that tells absence from a failure of ours.
// A test reads it here, with no import of app.js.

test("esAusencia es verdadero solo para un 404", () => {
  assert.equal(esAusencia({ estadoHttp: 404 }), true);
  assert.equal(esAusencia({ estadoHttp: 503 }), false);
});

test("un error sin estadoHttp no cuenta como ausencia", () => {
  // No property means no response came back: a lost connection or a bad
  // JSON body. That is our failure, never a missing line of the budget.
  assert.equal(esAusencia(new Error("Failed to fetch")), false);
});
