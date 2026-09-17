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
    // A click on a painted control, as a browser fires it.
    pulsar: (elemento) => {
      documento.disparar("click", { target: elemento, preventDefault() {} });
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
