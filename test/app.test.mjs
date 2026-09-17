import test from "node:test";
import assert from "node:assert/strict";

import { iniciar } from "../site/app/app.js";
import { cargarJson, olvidar } from "../site/app/datos.js";
import { CLAVE_OSCURO } from "../site/app/tema.js";
import {
  controles, falsaHistoria, falsaVentana, falsoDocumento, textoDe,
} from "./falso-documento.mjs";

// A tree of nine institutional levels, so a clave of level 9 makes the
// navigator read one more file. Every nodo keeps two children, so the
// navigator jumps over none of them.
const CADENA = "88-1-0-1-1-1-1-1-1";

function arbolDe(devengado) {
  const indice = {
    "88": {
      n: "Capital Humano", d: devengado, p: devengado, v: devengado, g: 0,
      k: ["1", "9"],
    },
    "88-9": { n: "Otra area", d: 1, p: 1, v: 1, g: 0, k: [] },
    "90": { n: "Deuda", d: 40, p: 40, v: 40, g: 0, k: [] },
    "50": { n: "Economia", d: 10, p: 10, v: 10, g: 0, k: [] },
    // A chain of one child. The visitor never stops on "70". Its 4 are
    // under 4% of the root, so "70" lives in the group "otros" of the root.
    "70": { n: "Vialidad", d: 4, p: 4, v: 4, g: 0, k: ["1"] },
    "70-1": { n: "Rutas", d: 4, p: 4, v: 4, g: 0, k: ["1", "2"] },
    "70-1-1": { n: "Norte", d: 2, p: 2, v: 2, g: 0, k: [] },
    "70-1-2": { n: "Sur", d: 2, p: 2, v: 2, g: 0, k: [] },
  };
  const codigos = CADENA.split("-");
  for (let corte = 2; corte <= codigos.length; corte += 1) {
    const clave = codigos.slice(0, corte).join("-");
    const hoja = corte === codigos.length;
    indice[clave] = {
      n: `Nivel ${corte}`,
      d: devengado,
      p: devengado,
      v: devengado,
      g: 0,
      k: hoja ? ["1", "2"] : [codigos[corte], "9"],
    };
    if (!hoja) {
      indice[`${clave}-9`] = { n: `Hermano ${corte}`, d: 1, p: 1, v: 1, g: 0, k: [] };
    }
  }
  return indice;
}

// In 2025 the Deuda divides in two. In 2026 it does not, so "90-1" is a
// clave that exists in 2025 only.
const ARBOL_2025 = {
  ...arbolDe(60),
  "90": { n: "Deuda", d: 40, p: 40, v: 40, g: 0, k: ["1", "2"] },
  "90-1": { n: "Intereses", d: 30, p: 30, v: 30, g: 0, k: [] },
  "90-2": { n: "Comisiones", d: 10, p: 10, v: 10, g: 0, k: [] },
};

const OBJETO = {
  [`${CADENA}-1`]: { n: "Personal", d: 30, p: 30, v: 30, g: 0, k: [] },
  [`${CADENA}-2`]: { n: "Bienes", d: 30, p: 30, v: 30, g: 0, k: [] },
};

const MANIFIESTO = {
  ejercicios: [
    {
      ejercicio: 2025,
      archivo: "https://ejemplo/credito-anual-2025.zip",
      publicado: "Wed, 08 Jul 2026 10:39:43 GMT",
      total_devengado: 111_000_000,
      verificado: true,
      en_este_artefacto: true,
    },
    {
      ejercicio: 2026,
      archivo: "https://ejemplo/credito-anual-2026.zip",
      publicado: "Tue, 15 Sep 2026 10:35:57 GMT",
      total_devengado: 222_000_000,
      verificado: true,
      en_este_artefacto: true,
    },
  ],
};

const CUERPOS = {
  "data/manifest.json": MANIFIESTO,
  "data/2025/institucional.json": ARBOL_2025,
  "data/2026/institucional.json": arbolDe(70),
  [`data/2025/objeto/${CADENA}.json`]: OBJETO,
  [`data/2026/objeto/${CADENA}.json`]: OBJETO,
};

// A fetch that never touches the network, and that holds a route open until
// the test lets it answer. That is how a slow file becomes a window in which
// a second navigation starts.
function falsoTraer(demorados = []) {
  const llamadas = [];
  const esperando = new Map();
  const sueltos = new Set();
  const traer = (ruta) => {
    llamadas.push(ruta);
    const respuesta = {
      ok: CUERPOS[ruta] !== undefined,
      status: CUERPOS[ruta] === undefined ? 404 : 200,
      json: async () => CUERPOS[ruta],
    };
    if (!demorados.includes(ruta) || sueltos.has(ruta)) {
      return Promise.resolve(respuesta);
    }
    return new Promise((responder) => {
      const cola = esperando.get(ruta) ?? [];
      cola.push(() => responder(respuesta));
      esperando.set(ruta, cola);
    });
  };
  // Open a route, now and from now on. A run that has not reached the fetch
  // yet must not wait for ever.
  const soltar = (ruta) => {
    sueltos.add(ruta);
    for (const responder of esperando.get(ruta) ?? []) {
      responder();
    }
    esperando.set(ruta, []);
  };
  const contar = (ruta) => llamadas.filter((una) => una === ruta).length;
  return { traer, llamadas, soltar, contar };
}

function montar(hash, { demorados = [], estado = null, ventanaExtra = {} } = {}) {
  olvidar();
  const red = falsoTraer(demorados);
  globalThis.fetch = red.traer;
  const documento = falsoDocumento();
  const ventana = { ...falsaVentana(hash), ...ventanaExtra };
  const historia = falsaHistoria(ventana, estado);
  const navegador = iniciar({ documento, ventana, historia });
  const parte = (id) => documento.getElementById(id);
  return {
    ...red,
    documento,
    navegador,
    ventana,
    historia,
    parte,
    titulo: () => parte("titulo").textContent,
    // A click on a painted control, as a mouse or a tap fires it. detail 1
    // marks it as a pointer click, never a keyboard one (detail 0).
    pulsar: (elemento) => {
      documento.disparar("click", { target: elemento, detail: 1, preventDefault() {} });
      return navegador.listo();
    },
    tecla: (key) => {
      documento.disparar("keydown", { key, target: parte("titulo") });
      return navegador.listo();
    },
  };
}

// The row of the tape whose name is nombre.
function fila(sitio, nombre) {
  const lista = sitio.parte("renglones").hijos[0];
  return lista.hijos.map((item) => item.hijos[0])
    .find((control) => textoDe(control).includes(nombre));
}

// Let every promise that is already settled run its continuations.
function respirar() {
  return new Promise((seguir) => setImmediate(seguir));
}

test("la pantalla de la raiz escribe el total del ejercicio", async () => {
  const sitio = montar("#/2025");
  await sitio.navegador.listo();
  assert.equal(sitio.titulo(), "En qué la gastó el Estado nacional");
  assert.equal(sitio.parte("total-texto").textContent, "111.000.000 pesos");
});

test("una segunda navegacion no deja la pantalla de la primera", async () => {
  // A visitor on a nodo of level 8 goes down, and the object file takes
  // 250 ms. 30 ms later the visitor goes to the root. The first run must
  // not paint over the second one when its file arrives.
  const objeto = `data/2025/objeto/${CADENA}.json`;
  const sitio = montar(`#/2025/${CADENA}`, { demorados: [objeto] });
  await respirar();
  await respirar();

  await sitio.navegador.ir({ anio: 2025, clave: "", grupos: [], desde: null }, "paso");
  sitio.soltar(objeto);
  await respirar();
  await respirar();

  assert.equal(sitio.titulo(), "En qué la gastó el Estado nacional");
  assert.doesNotMatch(textoDe(sitio.parte("renglones")), /Personal/,
    "nothing of the run it left");
});

test("un pedido abandonado que despues falla no borra la pantalla vigente", async () => {
  // The object file fails instead of arriving, after the visitor went to
  // the root. The failure of the first run must not erase the second run.
  olvidar();
  const objeto = `data/2025/objeto/${CADENA}.json`;
  let rechazar;
  const pendiente = new Promise((_resolver, reject) => { rechazar = reject; });
  globalThis.fetch = async (ruta) => (ruta === objeto ? pendiente : {
    ok: CUERPOS[ruta] !== undefined,
    status: CUERPOS[ruta] === undefined ? 404 : 200,
    json: async () => CUERPOS[ruta],
  });
  const documento = falsoDocumento();
  const ventana = falsaVentana(`#/2025/${CADENA}`);
  const historia = falsaHistoria(ventana);
  const navegador = iniciar({ documento, ventana, historia });
  const primera = navegador.listo();
  await respirar();
  await respirar();

  await navegador.ir({ anio: 2025, clave: "", grupos: [], desde: null }, "paso");
  rechazar(new Error("Failed to fetch"));
  await primera;

  assert.equal(documento.getElementById("titulo").textContent, "En qué la gastó el Estado nacional");
  assert.doesNotMatch(textoDe(documento.getElementById("titulo")), /No pudimos/);
});

test("el ejercicio que se abandona no escribe en el historial", async () => {
  const objeto = `data/2025/objeto/${CADENA}.json`;
  const sitio = montar(`#/2025/${CADENA}`, { demorados: [objeto] });
  await respirar();
  await respirar();
  await sitio.navegador.ir({ anio: 2025, clave: "", grupos: [], desde: null }, "paso");
  sitio.soltar(objeto);
  await respirar();
  await respirar();
  assert.deepEqual(sitio.historia.escrituras, [["push", "#/2025"]],
    "the history never names the screen the visitor left");
});

test("dos lecturas de una misma ruta hacen un solo pedido", async () => {
  // A visitor taps the arrow of 2026, a file of 1,1 MB, and taps again
  // before it arrives. Both runs read the same file.
  const lento = "data/2026/institucional.json";
  const sitio = montar("#/2026", { demorados: [lento] });
  const segunda = sitio.navegador.ir({ anio: 2026, clave: "", grupos: [], desde: null }, "carga");
  await respirar();
  sitio.soltar(lento);
  await segunda;
  assert.equal(sitio.contar(lento), 1, "one file, one request");
  assert.equal(sitio.titulo(), "En qué la gastó el Estado nacional");
});

test("un pedido que falla no queda guardado", async () => {
  const sitio = montar("#/2025");
  await sitio.navegador.listo();
  const ausente = "data/2025/objeto/99-9-9-9-9-9-9-9-9.json";
  await assert.rejects(() => cargarJson(ausente, sitio.traer));
  await assert.rejects(() => cargarJson(ausente, sitio.traer));
  assert.equal(sitio.contar(ausente), 2, "a failure is asked for again");
});

test("un enlace a un nodo de un solo hijo reemplaza la entrada", async () => {
  // R12: Back must never return to a nodo that jumps forward again.
  const sitio = montar("#/2025/70");
  await sitio.navegador.listo();
  assert.deepEqual(sitio.historia.escrituras, [["replace", "#/2025/70-1"]]);
  assert.equal(sitio.titulo(), "Rutas");
});

test("un nodo cuyo unico hijo falta en el indice termina y se pinta a si mismo", async () => {
  // "88" declares one child in k ("88-1"), but the index holds no entry for
  // it. saltarHijoUnico must stop on "88", and never send the navigator to
  // a clave with no nodo behind it. That kind of clave calls itself absent,
  // and with no exercise of origin the loop returns here for ever.
  olvidar();
  const indice = { "88": { n: "Capital Humano", d: 60, p: 60, v: 60, g: 0, k: ["1"] } };
  const cuerpos = {
    "data/manifest.json": {
      ejercicios: [{
        ejercicio: 2025, archivo: "https://ejemplo/credito-anual-2025.zip",
        publicado: "Wed, 08 Jul 2026 10:39:43 GMT", total_devengado: 60_000_000,
        verificado: true, en_este_artefacto: true,
      }],
    },
    "data/2025/institucional.json": indice,
  };
  globalThis.fetch = async (ruta) => ({
    ok: cuerpos[ruta] !== undefined,
    status: cuerpos[ruta] === undefined ? 404 : 200,
    json: async () => cuerpos[ruta],
  });
  const documento = falsoDocumento();
  const ventana = falsaVentana("#/2025/88");
  const historia = falsaHistoria(ventana);
  const navegador = iniciar({ documento, ventana, historia });
  await navegador.listo();
  assert.equal(documento.getElementById("titulo").textContent, "Capital Humano",
    "the nodo paints itself, and never P2b");
  assert.deepEqual(historia.escrituras, [["replace", "#/2025/88"]]);
});

test("una hoja del objeto nombra cada codigo de su camino", async () => {
  const sitio = montar(`#/2025/${CADENA}-1`);
  await sitio.navegador.listo();
  assert.equal(sitio.titulo(), "Personal");
  const codigos = sitio.parte("codigos").textContent;
  assert.match(codigos, /jurisdiccion_id=88/);
  assert.match(codigos, /inciso_id=1/,
    "the source names every code, or the number is not reproducible");
});

test("la region de avisos dice lo que cambio, y no la pantalla entera", async () => {
  const sitio = montar("#/2025");
  await sitio.navegador.listo();
  assert.equal(sitio.parte("aviso").textContent,
    "En qué la gastó el Estado nacional. 111.000.000 pesos.");
});

test("la pantalla de un fallo ofrece una salida que sirve siempre", async () => {
  const sitio = montar("#/2025");
  await sitio.navegador.listo();
  sitio.navegador.informar(new Error("Unexpected end of JSON input"));
  const salida = sitio.parte("acciones").hijos[0];
  assert.deepEqual(controles(salida, "data-clave"), [{ texto: "Volver al inicio", valor: "" }]);
  await sitio.pulsar(salida);
  assert.equal(sitio.titulo(), "En qué la gastó el Estado nacional", "the exit works");
});

test("abrir una parte agrega una entrada, y Volver agrega otra", async () => {
  const sitio = montar("#/2025");
  await sitio.navegador.listo();
  await sitio.pulsar(fila(sitio, "Capital Humano"));
  assert.equal(sitio.titulo(), "Capital Humano");
  assert.equal(sitio.ventana.location.hash, "#/2025/88");
  await sitio.pulsar(sitio.parte("volver"));
  assert.equal(sitio.titulo(), "En qué la gastó el Estado nacional");
  // W6: "Volver" is a step, so Back returns to Capital Humano.
  assert.deepEqual(sitio.historia.escrituras,
    [["replace", "#/2025"], ["push", "#/2025/88"], ["push", "#/2025"]]);
});

test("otros agrega una entrada con el mismo hash y sus claves en el estado", async () => {
  const sitio = montar("#/2025");
  await sitio.navegador.listo();
  await sitio.pulsar(fila(sitio, "Otros (1)"));
  assert.equal(sitio.titulo(), "Otros");
  assert.equal(sitio.ventana.location.hash, "#/2025", "W8: the group is not in the URL");
  assert.deepEqual(sitio.historia.state.grupos, [["70"]]);
  assert.equal(sitio.parte("detalle").textContent, "3,5% del gasto total",
    "R18: 4 of 114 is 3,5%, and nothing more");
});

test("Atras vuelve al grupo otros y a su nodo", async () => {
  const sitio = montar("#/2025");
  await sitio.navegador.listo();
  await sitio.pulsar(fila(sitio, "Otros (1)"));
  await sitio.pulsar(fila(sitio, "Vialidad"));
  assert.equal(sitio.titulo(), "Rutas", "the skip of Vialidad lands on Rutas");
  sitio.historia.back();
  await sitio.navegador.listo();
  assert.equal(sitio.titulo(), "Otros", "Back keeps the group");
  sitio.historia.back();
  await sitio.navegador.listo();
  assert.equal(sitio.titulo(), "En qué la gastó el Estado nacional");
  sitio.historia.forward();
  await sitio.navegador.listo();
  assert.equal(sitio.titulo(), "Otros");
  assert.equal(sitio.historia.entradas.length, 3, "Back and Forward write no entry");
});

test("una entrada con un grupo que ya no existe dibuja el nodo y se reemplaza", async () => {
  const sitio = montar("#/2025", {
    estado: { anio: 2025, clave: "", grupos: [["77", "78"]], desde: null },
  });
  await sitio.navegador.listo();
  assert.equal(sitio.titulo(), "En qué la gastó el Estado nacional");
  assert.deepEqual(sitio.historia.state.grupos, []);
  assert.deepEqual(sitio.historia.escrituras, [["replace", "#/2025"]]);
});

test("el arco encendido y la miga suben al nivel que nombran", async () => {
  const sitio = montar("#/2025/88-1-0-1");
  await sitio.navegador.listo();
  // The pila: Inicio, Capital Humano, Nivel 2, Nivel 3, Nivel 4.
  assert.match(sitio.parte("anillos").innerHTML, /data-subir="3"/, "A12: the thin ring");
  assert.match(sitio.parte("anillos").innerHTML, /data-subir="1"/, "A13: the hairline ring");
  const miga = sitio.parte("miga").hijos[0].hijos;
  const nivel1 = miga[1].hijos[0];
  assert.equal(nivel1.textContent, "Capital Humano");
  await sitio.pulsar(nivel1);
  assert.equal(sitio.titulo(), "Capital Humano");
  assert.equal(sitio.historia.escrituras.at(-1)[0], "push");
});

test("las flechas del anio conservan el camino y cierran el grupo", async () => {
  const sitio = montar("#/2025/88");
  await sitio.navegador.listo();
  await sitio.pulsar(fila(sitio, "Otros (1)"));
  assert.equal(sitio.titulo(), "Otros");
  await sitio.pulsar(sitio.parte("anio-siguiente"));
  assert.equal(sitio.ventana.location.hash, "#/2026/88", "C17: the path stays");
  assert.equal(sitio.titulo(), "Capital Humano", "W5: the group closes");
  assert.equal(sitio.parte("anio-siguiente").disabled, true, "R11: 2026 is the end");
});

test("un anio donde el camino no existe muestra P2b, y Volver a vuelve", async () => {
  const sitio = montar("#/2025/90-1");
  await sitio.navegador.listo();
  await sitio.pulsar(sitio.parte("anio-siguiente"));
  assert.equal(sitio.ventana.location.hash, "#/2026/90-1");
  assert.equal(sitio.titulo(), "Intereses");
  assert.equal(sitio.parte("volver").hidden, true, "W12");
  assert.match(textoDe(sitio.parte("nota")), /En 2025 gastó 30,0 millones\./);
  const volverA = controles(sitio.parte("acciones"), "data-anio");
  assert.deepEqual(volverA, [{ texto: "Volver a 2025", valor: "2025" }]);
  await sitio.pulsar(sitio.parte("acciones").hijos[1]);
  assert.equal(sitio.ventana.location.hash, "#/2025/90-1");
  assert.equal(sitio.titulo(), "Intereses");
});

test("un enlace a una clave ausente abre el ancestro con un aviso", async () => {
  const sitio = montar("#/2026/90-1");
  await sitio.navegador.listo();
  assert.equal(sitio.titulo(), "Deuda");
  assert.equal(textoDe(sitio.parte("nota")).trim(),
    "Ese nivel no existe en 2026; te llevamos al más cercano.");
  assert.deepEqual(sitio.historia.escrituras, [["replace", "#/2026/90"]]);
});

test("Escape sube un nivel y las flechas del teclado cambian el anio", async () => {
  const sitio = montar("#/2025/88");
  await sitio.navegador.listo();
  await sitio.tecla("ArrowRight");
  assert.equal(sitio.ventana.location.hash, "#/2026/88");
  await sitio.tecla("ArrowRight");
  assert.equal(sitio.ventana.location.hash, "#/2026/88", "K2 does nothing at the end");
  await sitio.tecla("Escape");
  assert.equal(sitio.ventana.location.hash, "#/2026");
  await sitio.tecla("Escape");
  assert.equal(sitio.historia.entradas.length, 3, "Escape at the root does nothing");
});

test("el nombre del sitio vuelve a la raiz del anio en pantalla", async () => {
  const sitio = montar("#/2026/88");
  await sitio.navegador.listo();
  sitio.parte("sitio").setAttribute("data-clave", "");
  await sitio.pulsar(sitio.parte("sitio"));
  assert.equal(sitio.ventana.location.hash, "#/2026");
});

test("el enlace a las fuentes abre P4 y Volver al inicio vuelve", async () => {
  const sitio = montar("#/2026/88");
  await sitio.navegador.listo();
  const enlace = sitio.parte("fuentes-enlace");
  enlace.setAttribute("data-fuentes", "");
  await sitio.pulsar(enlace);
  assert.equal(sitio.ventana.location.hash, "#/fuentes");
  assert.equal(sitio.titulo(), "De dónde salen estos números");
  await sitio.pulsar(sitio.parte("acciones").hijos[0]);
  assert.equal(sitio.ventana.location.hash, "#/2026", "the root of the last year on screen");
});

test("un interruptor cambia el aspecto y no escribe en el historial", async () => {
  const guardado = {};
  const sitio = montar("#/2025", {
    ventanaExtra: {
      localStorage: { getItem: (clave) => guardado[clave] ?? null, setItem: (clave, valor) => { guardado[clave] = valor; } },
      matchMedia: () => ({ matches: false }),
    },
  });
  await sitio.navegador.listo();
  const html = sitio.documento.documentElement;
  assert.equal(html.atributos["data-tema"], "claro");
  const oscuro = sitio.parte("oscuro");
  oscuro.setAttribute("data-interruptor", "oscuro");
  const antes = sitio.historia.escrituras.length;
  await sitio.pulsar(oscuro);
  assert.equal(html.atributos["data-tema"], "oscuro");
  assert.equal(oscuro.atributos["aria-checked"], "true");
  assert.equal(guardado[CLAVE_OSCURO], "true");
  assert.equal(sitio.historia.escrituras.length, antes, "W9: no entry");
});

test("el interruptor de billetes reajusta el disco para el tipo de letra nuevo", async () => {
  // R7: Billetes changes --mono to Archivo, a different width. The fake
  // document has no layout, so ajustarDisco always returns at once; a spy on
  // getElementById shows whether the switch asked it to measure the disc.
  const sitio = montar("#/2025", {
    ventanaExtra: {
      localStorage: { getItem: () => null, setItem: () => {} },
      matchMedia: () => ({ matches: false }),
    },
  });
  await sitio.navegador.listo();
  const pedidos = [];
  const original = sitio.documento.getElementById;
  sitio.documento.getElementById = (id) => {
    pedidos.push(id);
    return original(id);
  };
  const billetes = sitio.parte("billetes");
  billetes.setAttribute("data-interruptor", "billetes");
  await sitio.pulsar(billetes);
  for (const id of ["disco-numero", "disco", "lienzo"]) {
    assert.ok(pedidos.includes(id), `the switch must re-measure the disc (${id})`);
  }
});

test("un toque durante el movimiento lo termina, y la marca sale una vez", async () => {
  const cuadros = [];
  const marcas = [];
  const sitio = montar("#/2025", {
    ventanaExtra: {
      requestAnimationFrame: (funcion) => { cuadros.push(funcion); },
      performance: { now: () => 0, mark: (nombre) => { marcas.push(nombre); } },
    },
  });
  await sitio.navegador.listo();
  assert.doesNotMatch(sitio.parte("anillos").innerHTML, /data-abrir/, "the ring is growing");
  sitio.documento.disparar("pointerdown", {});
  assert.match(sitio.parte("anillos").innerHTML, /data-abrir="0"/, "R4: the motion ends at once");
  await sitio.pulsar(fila(sitio, "Capital Humano"));
  assert.deepEqual(marcas, ["enquelagastan-anillo"]);
});

test("un archivo lento escribe Cargando en el disco", async () => {
  // W10: the object file loads before the motion. After 300ms the disc
  // says so.
  const objeto = `data/2025/objeto/${CADENA}.json`;
  const sitio = montar("#/2025/88-1-0-1-1-1-1-1", { demorados: [objeto] });
  await sitio.navegador.listo();
  const paso = sitio.pulsar(fila(sitio, "Nivel 9"));
  await new Promise((seguir) => setTimeout(seguir, 320));
  assert.equal(sitio.parte("disco-numero").textContent, "Cargando…");
  sitio.soltar(objeto);
  await paso;
  assert.equal(sitio.titulo(), "Nivel 9");
  assert.notEqual(sitio.parte("disco-numero").textContent, "Cargando…");
});

test("un puntero durante el movimiento suelta en la parte, y el click que sigue no repite el paso", async () => {
  // R4: pointerdown only ends the motion and remembers the part; the step
  // itself waits for pointerup of the same gesture. The click that follows
  // lands on the same arc the gesture just opened, so the ignore must hold
  // even when that click alone would also open it.
  const cuadros = [];
  const sitio = montar("#/2025", {
    ventanaExtra: { requestAnimationFrame: (funcion) => { cuadros.push(funcion); } },
  });
  await sitio.navegador.listo();
  const antes = sitio.historia.escrituras.length;
  const control = sitio.documento.createElement("path");
  control.setAttribute("data-abrir", "0");
  sitio.documento.elementoBajoElPuntero = control;
  sitio.documento.disparar("pointerdown", { button: 0, pointerId: 1 });
  sitio.documento.disparar("pointerup", { pointerId: 1 });
  await sitio.navegador.listo();
  // The gesture alone, with no click yet, must already have opened it.
  assert.equal(sitio.titulo(), "Capital Humano");
  assert.equal(sitio.historia.escrituras.length, antes + 1, "pointerup alone opens the part");
  sitio.documento.disparar("click", { target: control, detail: 1, preventDefault() {} });
  await sitio.navegador.listo();
  assert.equal(sitio.titulo(), "Capital Humano");
  assert.equal(sitio.historia.escrituras.length, antes + 1, "the click that follows adds nothing");
});

test("un puntero cancelado no deja nada pendiente, y un toque despues navega una vez", async () => {
  // A pan that starts on a moving ring fires pointercancel, and no click.
  // The gesture must open nothing, and a later, ordinary tap must still
  // work: a stale remembered part must never block it.
  const cuadros = [];
  const sitio = montar("#/2025", {
    ventanaExtra: { requestAnimationFrame: (funcion) => { cuadros.push(funcion); } },
  });
  await sitio.navegador.listo();
  const antes = sitio.historia.escrituras.length;
  const control = sitio.documento.createElement("path");
  control.setAttribute("data-abrir", "0");
  sitio.documento.elementoBajoElPuntero = control;
  sitio.documento.disparar("pointerdown", { button: 0, pointerId: 1 });
  sitio.documento.disparar("pointercancel", { pointerId: 1 });
  // A stray pointerup of the cancelled gesture must find nothing remembered.
  sitio.documento.disparar("pointerup", { pointerId: 1 });
  await sitio.navegador.listo();
  assert.equal(sitio.historia.escrituras.length, antes, "the cancelled gesture opens nothing");
  const filaCapitalHumano = fila(sitio, "Capital Humano");
  await sitio.pulsar(filaCapitalHumano);
  assert.equal(sitio.titulo(), "Capital Humano");
  assert.equal(sitio.historia.escrituras.length, antes + 1, "one step, never two");
});

test("un puntero pendiente no abre nada solo, y un click de teclado en una fila navega despues", async () => {
  // Enter or Space on a focused row fires a real click of detail 0, with no
  // pointerdown of its own. That click must land, whatever a pointerdown
  // with no pointerup and no click left remembered.
  const cuadros = [];
  const sitio = montar("#/2025", {
    ventanaExtra: { requestAnimationFrame: (funcion) => { cuadros.push(funcion); } },
  });
  await sitio.navegador.listo();
  const antes = sitio.historia.escrituras.length;
  const control = sitio.documento.createElement("path");
  control.setAttribute("data-abrir", "0");
  sitio.documento.elementoBajoElPuntero = control;
  sitio.documento.disparar("pointerdown", { button: 0, pointerId: 1 });
  // Let the async chain of a (wrongly) direct navigation run to completion,
  // so a step from pointerdown alone would already show in the history.
  await sitio.navegador.listo();
  assert.equal(sitio.historia.escrituras.length, antes,
    "R4 ends the motion, but a tap opens nothing before pointerup");
  const filaCapitalHumano = fila(sitio, "Capital Humano");
  sitio.documento.disparar("click", { target: filaCapitalHumano, detail: 0, preventDefault() {} });
  await sitio.navegador.listo();
  assert.equal(sitio.titulo(), "Capital Humano");
  assert.equal(sitio.historia.escrituras.length, antes + 1, "one step, from the keyboard click alone");
});

test("un puntero de boton secundario termina el movimiento y no abre nada", async () => {
  const cuadros = [];
  const sitio = montar("#/2025", {
    ventanaExtra: { requestAnimationFrame: (funcion) => { cuadros.push(funcion); } },
  });
  await sitio.navegador.listo();
  assert.doesNotMatch(sitio.parte("anillos").innerHTML, /data-abrir/, "the ring is growing");
  const antes = sitio.historia.escrituras.length;
  const control = sitio.documento.createElement("path");
  control.setAttribute("data-abrir", "0");
  sitio.documento.elementoBajoElPuntero = control;
  // button 2: a right click. R4 still ends the motion.
  sitio.documento.disparar("pointerdown", { button: 2, pointerId: 1 });
  assert.match(sitio.parte("anillos").innerHTML, /data-abrir="0"/, "R4: the motion still ends at once");
  sitio.documento.disparar("pointerup", { pointerId: 1 });
  await sitio.navegador.listo();
  assert.equal(sitio.historia.escrituras.length, antes, "a secondary button never opens a part");
});

test("un click de teclado nunca se ignora, y el puntero siguiente limpia la marca vieja", async () => {
  // A pointer click clears the mark once it ignores it; a keyboard click
  // never touches the mark at all, so it can stay set with no click of a
  // pointer left to clear it. Any later pointerdown, of any gesture, must
  // still clear it first, or it blocks a normal tap for ever.
  const cuadros = [];
  const sitio = montar("#/2025", {
    ventanaExtra: { requestAnimationFrame: (funcion) => { cuadros.push(funcion); } },
  });
  await sitio.navegador.listo();
  const antes = sitio.historia.escrituras.length;
  const control = sitio.documento.createElement("path");
  control.setAttribute("data-abrir", "0");
  sitio.documento.elementoBajoElPuntero = control;
  sitio.documento.disparar("pointerdown", { button: 0, pointerId: 1 });
  sitio.documento.disparar("pointerup", { pointerId: 1 });
  await sitio.navegador.listo();
  assert.equal(sitio.historia.escrituras.length, antes + 1, "the gesture alone opens the part");

  // Enter or Space on the first row of the new screen: a real click of
  // detail 0, with no pointer at all. It must land, mark or no mark.
  const primeraFila = sitio.parte("renglones").hijos[0].hijos[0].hijos[0];
  sitio.documento.disparar("click", { target: primeraFila, detail: 0, preventDefault() {} });
  await sitio.navegador.listo();
  assert.equal(sitio.historia.escrituras.length, antes + 2, "a keyboard click is never ignored");

  // A pointerdown of an unrelated gesture, over nothing, must still clear
  // whatever the keyboard click above left set.
  sitio.documento.elementoBajoElPuntero = null;
  sitio.documento.disparar("pointerdown", { button: 0, pointerId: 2 });
  const otraFila = sitio.parte("renglones").hijos[0].hijos[0].hijos[0];
  await sitio.pulsar(otraFila);
  assert.equal(sitio.historia.escrituras.length, antes + 3, "one more step, from an ordinary tap");
});

test("un pointerup con otro pointerId no abre nada", async () => {
  // Only the pointerup of the same gesture the pointerdown remembered may
  // open the part it found.
  const cuadros = [];
  const sitio = montar("#/2025", {
    ventanaExtra: { requestAnimationFrame: (funcion) => { cuadros.push(funcion); } },
  });
  await sitio.navegador.listo();
  const antes = sitio.historia.escrituras.length;
  const control = sitio.documento.createElement("path");
  control.setAttribute("data-abrir", "0");
  sitio.documento.elementoBajoElPuntero = control;
  sitio.documento.disparar("pointerdown", { button: 0, pointerId: 1 });
  sitio.documento.disparar("pointerup", { pointerId: 2 });
  await sitio.navegador.listo();
  assert.equal(sitio.historia.escrituras.length, antes, "a pointerup of a different gesture opens nothing");
});

test("un pointerup sobre otro elemento no abre nada", async () => {
  // A mouse drag off the part, or a screen that changed while the press
  // was held, must not open the part remembered at pointerdown, and never
  // the different part the finger now sits over either.
  const cuadros = [];
  const sitio = montar("#/2025", {
    ventanaExtra: { requestAnimationFrame: (funcion) => { cuadros.push(funcion); } },
  });
  await sitio.navegador.listo();
  const antes = sitio.historia.escrituras.length;
  const control = sitio.documento.createElement("path");
  control.setAttribute("data-abrir", "0");
  sitio.documento.elementoBajoElPuntero = control;
  sitio.documento.disparar("pointerdown", { button: 0, pointerId: 1 });
  const otroElemento = sitio.documento.createElement("path");
  otroElemento.setAttribute("data-abrir", "1");
  sitio.documento.elementoBajoElPuntero = otroElemento;
  sitio.documento.disparar("pointerup", { pointerId: 1 });
  await sitio.navegador.listo();
  assert.equal(sitio.historia.escrituras.length, antes, "a moved pointer opens nothing");
});

test("un puntero sin movimiento no hace nada, y el click que sigue navega una vez", async () => {
  const sitio = montar("#/2025");
  await sitio.navegador.listo();
  const antes = sitio.historia.escrituras.length;
  sitio.documento.disparar("pointerdown", {});
  await sitio.pulsar(fila(sitio, "Capital Humano"));
  assert.equal(sitio.titulo(), "Capital Humano");
  assert.equal(sitio.historia.escrituras.length, antes + 1, "one step, never two");
});
