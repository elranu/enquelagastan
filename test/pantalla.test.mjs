import test from "node:test";
import assert from "node:assert/strict";

import {
  aniosVecinos, pilaDe, pintarAusente, pintarBarra, pintarError, pintarFuentes,
  pintarNavegador, rutaDePila, vistaDeError, vistaDeNavegador,
  dibujarAusente, dibujarFuentes, dibujarMiga, dibujarNodo, dibujarRaiz,
  esAusencia, estadoDeLaFila, indiceParaClave, resolverPantalla,
  vistaDeAusente, vistaDeFuentes, vistaDeNodo, vistaDeRaiz,
} from "../site/app/pantalla.js";
import { migaCorta } from "../site/app/arbol.js";
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

test("un grupo otros en la raiz describe al grupo y no al pais", () => {
  // UC-03: the visitor can open the slice "otros" from the root. The
  // headline is then the total of the group. A total of the country over a
  // share of the group would read as a share of the country.
  const vista = vistaDeRaiz(ESTADO, ["90", "50"]);
  assert.deepEqual(vista.porciones.map((porcion) => porcion.nombre), ["Deuda", "Economia"]);
  assert.equal(vista.total, 40);
  assert.equal(vista.parteDe, "del gasto del Estado nacional");
  assert.ok(Math.abs(vista.parteDelTotal - 0.4) < 1e-9);
  assert.equal(vista.ejecucion, null, "the execution describes the whole");
  assert.equal(vista.desviacion, null, "the deviation describes the whole");
});

test("la pantalla del grupo escribe el total del grupo", () => {
  const texto = textoDe(dibujarRaiz(vistaDeRaiz(ESTADO, ["90", "50"]),
    falsoDocumento()));
  assert.match(texto, /40\.000\.000 pesos/);
  assert.match(texto, /Parte del gasto del Estado nacional/);
  assert.doesNotMatch(texto, /de lo autorizado/);
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

test("cada fila de la leyenda es un boton de verdad dentro de su li", () => {
  // A wedge can be under two degrees, too small for a finger or an eye. The
  // legend row is the reliable target. A native button answers Enter and
  // Space on its own, and an <li> with role="button" announces neither a
  // list nor a button correctly.
  const pantalla = dibujarRaiz(vistaDeRaiz(ESTADO), falsoDocumento());
  const leyenda = pantalla.hijos.find((hijo) => hijo.atributos.class === "leyenda");
  for (const fila of leyenda.hijos) {
    assert.equal(fila.etiqueta, "li");
    assert.equal(fila.atributos.role, undefined, "no ARIA over a real control");
    const boton = fila.hijos[0];
    assert.equal(boton.etiqueta, "button");
    assert.equal(boton.atributos.tabindex, undefined, "a button is already a stop");
    assert.ok(boton.atributos["data-destino"]);
  }
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
    ["Procuracion", "Defensa Juridica"]);
});

test("la miga de pan es una lista ordenada de pasos", () => {
  // A screen reader must read the camino as a list: how many steps it
  // holds, and which one the visitor is on. A step stays a button.
  const vista = { miga: [{ clave: "88", nombre: "Capital Humano" }] };
  const miga = dibujarMiga(vista, falsoDocumento());
  const lista = miga.hijos.find((hijo) => hijo.etiqueta === "ol");
  assert.ok(lista, "the steps live inside an ordered list");
  assert.deepEqual(lista.hijos.map((item) => item.etiqueta), ["li", "li"]);
  assert.equal(lista.hijos[0].hijos[0].etiqueta, "button", "a step is a control");
  assert.equal(lista.hijos[1].hijos[0].textContent, "Capital Humano");
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

test("la pantalla de fuentes no dice verificado de lo que no esta", () => {
  // The build of one exercise can fail. Its entry stays in the manifest,
  // because its total is the baseline of the next build. The strip of years
  // offers no arrow to it. A journalist who reads "verificado" here looks
  // for a screen that this artifact does not hold.
  const vista = vistaDeFuentes({
    ejercicios: [
      { ejercicio: 2025, archivo: "x/a.zip", publicado: "Wed, 08 Jul 2026 10:39:43 GMT", verificado: true, en_este_artefacto: true },
      { ejercicio: 2026, archivo: "x/b.zip", publicado: "Tue, 15 Sep 2026 10:35:57 GMT", verificado: true, en_este_artefacto: false },
    ],
  });
  assert.deepEqual(vista.filas.map((fila) => estadoDeLaFila(fila)),
    ["verificado", "no está en esta versión del sitio"]);
  const texto = textoDe(dibujarFuentes(vista, falsoDocumento()));
  assert.match(texto, /8 jul 2026/, "the date reads in Spanish");
  assert.doesNotMatch(texto, /GMT/);
});

test("el ultimo tramo de la miga dice que es la pantalla de ahora", () => {
  const conCamino = dibujarMiga(
    { miga: [{ clave: "88", nombre: "Capital Humano" }], migaActual: true },
    falsoDocumento(),
  );
  const pasos = conCamino.hijos[0].hijos;
  assert.equal(pasos.at(-1).hijos[0].atributos["aria-current"], "true");
  assert.equal(pasos[0].hijos[0].atributos["aria-current"], undefined);
});

test("la miga de una pantalla ausente no marca ningun tramo", () => {
  // There the miga names the way up, and never the screen the visitor is on.
  const miga = dibujarMiga(
    { miga: [{ clave: "88", nombre: "Capital Humano" }], migaActual: false },
    falsoDocumento(),
  );
  for (const paso of miga.hijos[0].hijos) {
    assert.equal(paso.hijos[0].atributos["aria-current"], undefined);
  }
});

test("el tramo que junta nombres repetidos sigue siendo el de esta pantalla", () => {
  // The crumb points at the shallowest clave of the run, and a tap on it
  // jumps forward to the screen the visitor is on. So it carries
  // aria-current, and the style that marks it says the truth.
  const vista = vistaDeNodo(CON_CADENA, "45-1-0");
  assert.equal(vista.miga.at(-1).clave, "45-1-0");
  assert.equal(vista.migaActual, true);
});

// ---- The views of the frame ----------------------------------------------

// A root with one large part and a group "otros". "Chica" is 3 of 95, about
// 3,2%, and "Menor" is 2 of 95, about 2,1%. "Chica" divides in two.
const CON_OTROS = {
  ...ESTADO,
  indice: {
    "1": { n: "Grande", d: 90, p: 90, v: 90, g: 90, k: [] },
    "2": { n: "Chica", d: 3, p: 3, v: 3, g: 3, k: ["1", "2"] },
    "2-1": { n: "Chica uno", d: 2, p: 2, v: 2, g: 2, k: [] },
    "2-2": { n: "Chica dos", d: 1, p: 1, v: 1, g: 1, k: [] },
    "3": { n: "Menor", d: 2, p: 2, v: 2, g: 2, k: [] },
  },
};

test("la pila baja por las partes y salta el nodo de un solo hijo", () => {
  const pila = pilaDe(ESTADO.indice, "88-1");
  assert.deepEqual(pila.map((nivel) => nivel.nombre), ["Inicio", "ANSES"]);
  assert.equal(pila[0].elegida, 0, "the part of Capital Humano leads to ANSES");
  assert.equal(pila[1].hoja, true);
  assert.deepEqual(pila[1].porciones, [
    { nombre: "ANSES", monto: 60, parte: 1, esOtros: false, destino: ["88-1"] },
  ], "the last level shows the nodo itself as one full ring");
});

test("una clave dentro de otros pasa por el grupo", () => {
  const pila = pilaDe(CON_OTROS.indice, "2");
  assert.deepEqual(pila.map((nivel) => nivel.nombre), ["Inicio", "Otros", "Chica"]);
  assert.deepEqual(pila[1].grupo, ["2", "3"]);
  assert.deepEqual([pila[0].elegida, pila[1].elegida, pila[2].elegida], [1, 0, null]);
  assert.deepEqual(rutaDePila(pila), { clave: "2", grupos: [] });
  assert.deepEqual(rutaDePila(pila.slice(0, 2)), { clave: "", grupos: [["2", "3"]] },
    "Volver from Chica goes to the group");
});

test("un grupo que los datos ya no tienen deja la pila en el nodo", () => {
  assert.equal(pilaDe(CON_OTROS.indice, "", [["2", "3"]]).length, 2);
  const perdido = pilaDe(CON_OTROS.indice, "", [["9"]]);
  assert.equal(perdido.length, 1);
  assert.deepEqual(rutaDePila(perdido), { clave: "", grupos: [] },
    "the route of the place on screen has no group, so the entry is replaced");
});

test("la vista de la raiz lleva la medida, la linea y la frase", () => {
  const vista = vistaDeNavegador(ESTADO, pilaDe(ESTADO.indice, ""));
  assert.deepEqual(vista.miga, []);
  assert.deepEqual([vista.anterior, vista.siguiente], [2024, null],
    "R11: 2025 is the last year of this manifest");
  assert.equal(vista.subtitulo, "Crédito devengado del ejercicio 2025, por jurisdicción");
  // Execution: 100 of 104 is 96,15%. Deviation: 100 over 82 is +21,95%.
  assert.equal(vista.detalle, "96,2% de lo autorizado · +22% sobre lo aprobado");
  assert.equal(vista.rotulo, "Total devengado 2025");
  assert.equal(`${vista.frase.antes}${vista.frase.cifra}${vista.frase.despues}`,
    "De cada $100 que gastó el Estado nacional en 2025, $60 fueron a Capital Humano.");
  assert.deepEqual(vista.escena.map((arco) => arco.abrir), [0, 1, 2]);
});

test("la vista de la ultima hoja compara el nodo con el total nacional", () => {
  const vista = vistaDeNavegador(ESTADO, pilaDe(ESTADO.indice, "88-1"));
  assert.equal(vista.hoja, true);
  assert.deepEqual(vista.miga, [{ nivel: 0, nombre: "Inicio" }]);
  // 60 of 100 is 60%. Execution 60 of 62 is 96,77%. Deviation 60 over 40.
  assert.equal(vista.detalle, "60,0% del gasto total · 96,8% de lo autorizado · +50% sobre lo aprobado");
  assert.equal(vista.frase.despues, " fueron a ANSES.");
  assert.equal(vista.frase.cifra, "$60");
  assert.equal(vista.subtitulo, "");
  assert.ok(vista.procedencia.codigos, "C16: the codes of the source at the last level");
});

test("un hijo que el k declara pero el indice no tiene no rompe la vista", () => {
  // "88-1" is a child of "88" by its k, but its file is absent from the
  // index (the same case migaDePan and nivelDePila already guard). The nodo
  // must still show as its own hoja, with no exception.
  const sinHijo = { ...ESTADO, indice: {
    "88": { n: "Capital Humano", d: 60, p: 60, v: 60, g: 0, k: ["1"] },
  } };
  const vista = vistaDeNavegador(sinHijo, pilaDe(sinHijo.indice, "88"));
  assert.equal(vista.hoja, true);
  assert.deepEqual(vista.porciones, [
    { nombre: "Capital Humano", monto: 60, parte: 1, esOtros: false, destino: ["88"] },
  ]);
});

test("la vista de un grupo otros solo dice su parte del total", () => {
  const vista = vistaDeNavegador(CON_OTROS, pilaDe(CON_OTROS.indice, "", [["2", "3"]]));
  assert.equal(vista.titulo, "Otros");
  // 5 of 95 is 5,26%.
  assert.equal(vista.detalle, "5,3% del gasto total");
  assert.equal(vista.subtitulo, "Parte del gasto del Estado nacional.");
  assert.equal(vista.rotulo, "Suma de estas partidas");
  assert.equal(vista.frase.antes, "De cada $100 que gastó el grupo otros del Estado nacional en 2025, ");
  assert.deepEqual(vista.miga, [{ nivel: 0, nombre: "Inicio" }]);
});

test("un nivel sin gasto dice que no gasto nada y dibuja un anillo vacio", () => {
  const cero = { ...ESTADO, indice: {
    "9": { n: "Sin gasto", d: 0, p: 0, v: 0, g: 0, k: [] },
    "8": { n: "Con gasto", d: 5, p: 5, v: 5, g: 5, k: [] },
  } };
  const vista = vistaDeNavegador(cero, pilaDe(cero.indice, "9"));
  assert.equal(vista.mensajeVacio, "Este nivel no gastó nada en 2025.");
  assert.equal(vista.escena.filter((arco) => arco.rol === "principal").length, 0);
});

test("los anios vecinos se detienen en las puntas", () => {
  assert.deepEqual(aniosVecinos([2024, 2025, 2026], 2024), { anterior: null, siguiente: 2025 });
  assert.deepEqual(aniosVecinos([2024, 2025, 2026], 2025), { anterior: 2024, siguiente: 2026 });
  assert.deepEqual(aniosVecinos([2024, 2025, 2026], 2026), { anterior: 2025, siguiente: null });
});

// ---- The painters of the frame --------------------------------------------

const enMarco = (documento, id) => documento.getElementById(id);

test("el navegador escribe el titulo, la linea y el total en el marco", () => {
  const documento = falsoDocumento();
  pintarNavegador(documento, vistaDeNavegador(ESTADO, pilaDe(ESTADO.indice, "")));
  assert.equal(enMarco(documento, "titulo").textContent, "En qué la gastó el Estado nacional");
  assert.equal(enMarco(documento, "volver").hidden, true, "the root has no Volver");
  assert.equal(enMarco(documento, "detalle").textContent,
    "96,2% de lo autorizado · +22% sobre lo aprobado");
  assert.equal(enMarco(documento, "total-texto").textContent, "105.250.000 pesos",
    "the verified total, never the sum");
  // R7: 105.250.000 pesos is "105,3 millones", on two lines.
  assert.equal(enMarco(documento, "disco-numero").textContent, "105,3");
  assert.equal(enMarco(documento, "disco-unidad").textContent, "millones");
  assert.equal(enMarco(documento, "frase").hidden, false);
  assert.match(enMarco(documento, "anillos").innerHTML, /data-abrir="2"/);
  assert.match(textoDe(enMarco(documento, "fuente")), /credito-anual-2025\.zip/,
    "UC-06: the foot names its source");
});

test("cada fila de la cinta es un boton que abre su parte", () => {
  const documento = falsoDocumento();
  pintarNavegador(documento, vistaDeNavegador(ESTADO, pilaDe(ESTADO.indice, "")));
  const filas = enMarco(documento, "renglones").hijos[0].hijos;
  assert.equal(filas.length, 3);
  const segunda = filas[1];
  assert.equal(segunda.etiqueta, "li");
  assert.equal(segunda.atributos.style, "animation-delay:30ms", "R5: 30ms apart");
  const control = segunda.hijos[0];
  assert.equal(control.etiqueta, "button", "a native control answers Enter and Space");
  assert.equal(control.atributos["data-abrir"], "1");
  assert.equal(control.atributos["aria-label"], "Deuda, 30,0%, 30,0 millones");
});

test("la fila de otros dice cuantas partes junta y lleva el color neutro", () => {
  const documento = falsoDocumento();
  pintarNavegador(documento, vistaDeNavegador(CON_OTROS, pilaDe(CON_OTROS.indice, "")));
  const otros = enMarco(documento, "renglones").hijos[0].hijos[1].hijos[0];
  assert.equal(otros.hijos[1].textContent, "Otros (2)");
  assert.equal(otros.hijos[0].atributos.style, "background:var(--otros)");
});

test("la ultima hoja muestra una fila que no abre y los codigos al pie", () => {
  const documento = falsoDocumento();
  pintarNavegador(documento, vistaDeNavegador(ESTADO, pilaDe(ESTADO.indice, "88-1")));
  const fila = enMarco(documento, "renglones").hijos[0].hijos[0].hijos[0];
  assert.equal(fila.etiqueta, "div", "a row that opens nothing is not a control");
  assert.equal(fila.atributos["data-abrir"], undefined);
  assert.equal(enMarco(documento, "codigos").textContent, "jurisdiccion_id=88 · subjurisdiccion_id=1");
  assert.equal(enMarco(documento, "volver").hidden, false);
  assert.equal(enMarco(documento, "volver").atributos["data-subir"], "0");
});

test("un nivel sin gasto lo dice en la cinta", () => {
  const cero = { ...ESTADO, indice: {
    "9": { n: "Sin gasto", d: 0, p: 0, v: 0, g: 0, k: [] },
    "8": { n: "Con gasto", d: 5, p: 5, v: 5, g: 5, k: [] },
  } };
  const documento = falsoDocumento();
  pintarNavegador(documento, vistaDeNavegador(cero, pilaDe(cero.indice, "9")));
  assert.equal(textoDe(enMarco(documento, "renglones")).trim(), "Este nivel no gastó nada en 2025.");
  assert.match(enMarco(documento, "anillos").innerHTML, /^<path class="contorno"/);
});

test("la miga pone los niveles del medio detras de los puntos", () => {
  const documento = falsoDocumento();
  pintarBarra(documento, {
    ejercicio: 2025, anterior: 2024, siguiente: null,
    miga: migaCorta(["", "Uno", "Dos", "Tres", "Cuatro", "Cinco"]),
  });
  const items = enMarco(documento, "miga").hijos[0].hijos;
  assert.deepEqual(items.map((item) => textoDe(item).trim()),
    ["Inicio", "Uno", "…", "Dos", "Tres", "Cuatro"]);
  assert.deepEqual(items.map((item) => Boolean(item.hidden)),
    [false, false, false, true, true, false]);
  assert.equal(items[2].hijos[0].atributos["aria-label"], "Mostrar 2 niveles intermedios");
  assert.deepEqual(items.map((item) => item.hijos[0].atributos["data-subir"]),
    ["0", "1", undefined, "2", "3", "4"]);
});

test("las flechas del anio se apagan en las puntas", () => {
  const documento = falsoDocumento();
  pintarBarra(documento, { ejercicio: 2025, anterior: 2024, siguiente: null, miga: [] });
  assert.equal(enMarco(documento, "anio").textContent, "2025");
  assert.equal(enMarco(documento, "anio-anterior").disabled, false);
  assert.equal(enMarco(documento, "anio-anterior").atributos["data-anio"], "2024");
  assert.equal(enMarco(documento, "anio-siguiente").disabled, true);
  assert.equal(enMarco(documento, "miga").hidden, true, "the root has no breadcrumb");
});

test("la pantalla del ausente no tiene Volver y ofrece dos salidas", () => {
  const documento = falsoDocumento();
  pintarAusente(documento, {
    ejercicio: 2025, anterior: 2024, siguiente: null,
    miga: [{ nivel: 0, nombre: "Inicio" }, { nivel: 1, nombre: "Capital Humano" }],
    nombre: "Becas",
    origen: { ejercicio: 2024, monto: 12 },
    ancestro: "88",
    lineas: ["Este nivel no existe en 2025.", "En 2024 gastó 12,0 millones."],
    procedencia: { archivo: ESTADO.entrada.archivo, fecha: ESTADO.entrada.publicado, codigos: null },
  });
  assert.equal(enMarco(documento, "volver").hidden, true, "W12");
  assert.equal(enMarco(documento, "titulo").textContent, "Becas");
  const acciones = enMarco(documento, "acciones");
  assert.deepEqual(controles(acciones, "data-clave"),
    [{ texto: "Subir al nivel que sí existe", valor: "88" }]);
  assert.deepEqual(controles(acciones, "data-anio"), [{ texto: "Volver a 2024", valor: "2024" }]);
  assert.match(textoDe(enMarco(documento, "nota")), /En 2024 gastó 12,0 millones\./);
  assert.match(enMarco(documento, "anillos").innerHTML, /^<path class="contorno"/);
  assert.equal(enMarco(documento, "cuenta").hidden, true, "no rows, so no sum");
  assert.equal(enMarco(documento, "pie").hidden, false, "the foot of the year on screen");
});

test("las fuentes ponen el metodo en el grafico y la tabla en la cinta", () => {
  const documento = falsoDocumento();
  pintarFuentes(documento, vistaDeFuentes(MANIFIESTO));
  assert.match(textoDe(enMarco(documento, "nota")), /CC BY 4\.0/);
  assert.match(textoDe(enMarco(documento, "nota")), /Ministerio de Economía/);
  assert.equal(enMarco(documento, "caja").hidden, true, "W13: no chart on P4");
  const tabla = enMarco(documento, "renglones").hijos[0];
  assert.equal(tabla.etiqueta, "table");
  assert.equal(tabla.hijos.length, 2);
  assert.match(textoDe(tabla), /credito-anual-2025\.zip/);
  assert.deepEqual(controles(enMarco(documento, "acciones"), "data-clave"),
    [{ texto: "Volver al inicio", valor: "" }]);
  assert.ok(controles(enMarco(documento, "acciones"), "href")
    .some((control) => control.texto === "El código de este proyecto"));
});

test("la pantalla de un fallo tiene sus salidas en el marco", () => {
  const documento = falsoDocumento();
  pintarError(documento, vistaDeError(new Error("Unexpected end of JSON input")));
  assert.match(enMarco(documento, "titulo").textContent, /No pudimos mostrar esta pantalla/);
  assert.match(textoDe(enMarco(documento, "nota")), /Unexpected end of JSON input/,
    "the detail helps a report");
  const acciones = enMarco(documento, "acciones");
  assert.deepEqual(controles(acciones, "data-clave"), [{ texto: "Volver al inicio", valor: "" }],
    "a button, and never a link to the route already on screen");
  assert.deepEqual(controles(acciones, "href"),
    [{ texto: "De dónde salen estos números", valor: "#/fuentes" }]);
  assert.equal(enMarco(documento, "fuente").textContent, "Fuente: Presupuesto Abierto");
  assert.equal(enMarco(documento, "descargar").hidden, true);
});
