import test from "node:test";
import assert from "node:assert/strict";

import { iniciar } from "../site/app/app.js";
import { cargarJson, olvidar } from "../site/app/datos.js";
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
    // A chain of one child. The visitor never stops on "70".
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
  "data/2025/institucional.json": arbolDe(60),
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

function montar(hash, demorados = []) {
  olvidar();
  const red = falsoTraer(demorados);
  globalThis.fetch = red.traer;
  const documento = falsoDocumento();
  const ventana = falsaVentana(hash);
  const historia = falsaHistoria();
  const navegador = iniciar({ documento, ventana, historia });
  return {
    ...red,
    navegador,
    ventana,
    historia,
    app: documento.getElementById("app"),
    aviso: documento.getElementById("aviso"),
  };
}

// Let every promise that is already settled run its continuations.
function respirar() {
  return new Promise((seguir) => setImmediate(seguir));
}

test("la pantalla de la raiz escribe el total del ejercicio", async () => {
  const sitio = montar("#/2025");
  await sitio.navegador.dibujar();
  assert.equal(sitio.app.hijos.length, 1);
  assert.match(textoDe(sitio.app), /111\.000\.000 pesos/);
});

test("una segunda navegacion no deja dos pantallas encima", async () => {
  // A visitor on a nodo of level 8 taps a slice, and the object file takes
  // 250 ms. 30 ms later the visitor taps "Inicio". Both runs used to empty
  // the page early and to append late. The page then carried two headlines,
  // two migas, two strips of years and two feet at once.
  const objeto = `data/2025/objeto/${CADENA}.json`;
  const sitio = montar(`#/2025/${CADENA}`, [objeto]);
  const primera = sitio.navegador.dibujar();
  // The first run reads the hash and reaches the object file. The tap on
  // "Inicio" comes 30 ms later, while that file is still on the way.
  await respirar();
  await respirar();

  sitio.ventana.location.hash = "#/2025";
  await sitio.navegador.dibujar();

  sitio.soltar(objeto);
  await primera;
  await respirar();

  assert.equal(sitio.app.hijos.length, 1, "one screen, and never two");
  const texto = textoDe(sitio.app);
  assert.match(texto, /111\.000\.000 pesos/, "the screen the visitor asked for");
  assert.doesNotMatch(texto, /Personal/, "and nothing of the run it left");
});

test("el ejercicio que se abandona no reescribe la url", async () => {
  const objeto = `data/2025/objeto/${CADENA}.json`;
  const sitio = montar(`#/2025/${CADENA}`, [objeto]);
  const primera = sitio.navegador.dibujar();
  await respirar();
  await respirar();
  sitio.ventana.location.hash = "#/2025";
  await sitio.navegador.dibujar();
  sitio.soltar(objeto);
  await primera;
  await respirar();
  assert.deepEqual(sitio.historia.escrituras, [],
    "history.replaceState must never name the screen the visitor left");
});

test("dos lecturas de una misma ruta hacen un solo pedido", async () => {
  // A visitor on the root of 2025 taps the arrow of 2026, a file of 1,1 MB.
  // 40 ms later the visitor taps a slice. Both runs read the same file, and
  // the memory used to hold the settled value, so both asked for it.
  const lento = "data/2026/institucional.json";
  const sitio = montar("#/2026", [lento]);
  const primera = sitio.navegador.dibujar();
  const segunda = sitio.navegador.dibujar();
  await respirar();
  sitio.soltar(lento);
  await Promise.all([primera, segunda]);
  assert.equal(sitio.contar(lento), 1, "one file, one request");
  assert.equal(sitio.app.hijos.length, 1);
});

test("un pedido que falla no queda guardado", async () => {
  const sitio = montar("#/2025");
  await sitio.navegador.dibujar();
  const ausente = "data/2025/objeto/99-9-9-9-9-9-9-9-9.json";
  await assert.rejects(() => cargarJson(ausente, sitio.traer));
  await assert.rejects(() => cargarJson(ausente, sitio.traer));
  assert.equal(sitio.contar(ausente), 2, "a failure is asked for again");
});

test("el navegador reescribe la url cuando salta un hijo unico", async () => {
  // A nodo of one child repeats the screen before it, so the navigator jumps
  // over it. history.replaceState, and never push: Back would come here
  // again and jump forward again, with no way out.
  const sitio = montar("#/2025/70");
  await sitio.navegador.dibujar();
  assert.deepEqual(sitio.historia.escrituras, ["#/2025/70-1"]);
  assert.match(textoDe(sitio.app), /Rutas/);
});

test("una hoja del objeto nombra cada codigo de su camino", async () => {
  const sitio = montar(`#/2025/${CADENA}-1`);
  await sitio.navegador.dibujar();
  const texto = textoDe(sitio.app);
  assert.match(texto, /Personal/);
  assert.match(texto, /jurisdiccion_id=88/);
  assert.match(texto, /inciso_id=1/,
    "the source names every code, or the number is not reproducible");
});

test("la pantalla de un grupo otros describe al grupo", async () => {
  const sitio = montar("#/2025");
  await sitio.navegador.dibujar();
  await sitio.navegador.manejarClick({
    target: {
      closest: (selector) => (selector === "[data-destino]"
        ? { dataset: { destino: "90 50" } }
        : null),
    },
  });
  const texto = textoDe(sitio.app);
  assert.equal(sitio.app.hijos.length, 1);
  assert.match(texto, /50\.000\.000 pesos/, "the total of the group");
  assert.match(texto, /Parte del gasto del Estado nacional/);
  assert.doesNotMatch(texto, /111\.000\.000/, "and never the total of the country");
});

test("la region de avisos dice lo que cambio, y no la pantalla entera", async () => {
  const sitio = montar("#/2025");
  await sitio.navegador.dibujar();
  assert.equal(sitio.aviso.textContent,
    "En qué la gastó el Estado nacional. 111.000.000 pesos.");
  assert.doesNotMatch(sitio.aviso.textContent, /Fuente/);
});

test("la pantalla de un fallo ofrece una salida que sirve siempre", async () => {
  const sitio = montar("#/");
  sitio.navegador.informar(new Error("Unexpected end of JSON input"));
  const salidas = controles(sitio.app, "data-clave");
  assert.deepEqual(salidas, [{ texto: "Volver al inicio", valor: "" }],
    "a button, and never a link to the route already on screen");
  const texto = textoDe(sitio.app);
  assert.match(texto, /No pudimos mostrar esta pantalla/);
  assert.match(texto, /Fuente: Presupuesto Abierto/, "UC-06 holds here too");
  assert.match(texto, /Unexpected end of JSON input/, "the detail helps a report");
});
