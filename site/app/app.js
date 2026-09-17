// Join the modules, and answer the history of the browser.
//
// This module holds the DOM, the history and the switches, and no rule of
// the navigator. pantalla.js holds the views, and ruta.js holds the model of
// the history, so a test reads every rule there.
//
// iniciar takes the document, the window and the history as arguments. The
// module therefore loads without a browser, and a test drives the whole
// loop with the fakes of test/falso-documento.mjs.

import { cargarInstitucional, cargarManifiesto } from "./datos.js";
import { montoLargo } from "./formato.js";
import { crearMotor } from "./movimiento.js";
import {
  ajustarDisco, deslizar, esAusencia, ESPERA_DE_CARGA, expandirMiga, indiceParaClave,
  moverNavegador, pilaDe, pintarAusente, pintarCargando, pintarError, pintarFuentes,
  pintarNavegador, resolverPantalla, rutaDePila, vistaDeAusente, vistaDeError,
  vistaDeFuentes, vistaDeNavegador,
} from "./pantalla.js";
import {
  ancestroQueExiste, direccionEntre, ejercicioDeEntrada, ejerciciosDisponibles,
  entradaDe, escrituraDe, rutaDeEntrada,
} from "./ruta.js";
import { aplicarTema, cambiarTema, leerTema } from "./tema.js";

function almacenDe(ventana) {
  // The getter of localStorage throws when the browser blocks the storage.
  try {
    return ventana.localStorage ?? null;
  } catch {
    return null;
  }
}

export function iniciar({ documento, ventana, historia }) {
  // The live region lives outside #app, and it says only what changed.
  const aviso = documento.getElementById("aviso");
  const almacen = almacenDe(ventana);
  const prefiere = (consulta) => Boolean(ventana.matchMedia?.(consulta).matches);
  let tema = leerTema(almacen, prefiere);
  aplicarTema(documento, tema);
  const reducido = () => prefiere("(prefers-reduced-motion: reduce)");
  // With no requestAnimationFrame (a test), a motion draws its end at once.
  const motor = crearMotor({
    cuadro: ventana.requestAnimationFrame?.bind(ventana),
    ahora: () => ventana.performance?.now?.() ?? Date.now(),
  });
  // The KPI of UC-01: a mark when the ring first appears, read in a walk.
  let marcado = false;

  // The place on screen: { ruta, lugar, pila, vista, indice }. lugar is
  // "navegador", "ausente", "fuentes" or "error".
  let actual = null;
  // The last exercise on screen. P4 and the failure screen belong to no
  // exercise, and "Volver al inicio" goes back to this one.
  let ultimoAnio = null;

  // A popstate can start a second run while the first one waits for a file.
  // Both runs would write to the frame. Every run takes a number, and only
  // the newest one writes.
  let generacion = 0;
  let enCurso = Promise.resolve();

  // popstate and hashchange both fire on one change of the hash. The key of
  // the entry that the page answered lets the second event do nothing.
  let atendida = null;
  const llaveDe = (hash, estado) => `${hash}|${JSON.stringify(estado ?? null)}`;

  function anunciar(texto) {
    if (aviso) {
      aviso.textContent = texto;
    }
  }

  function escribirHistoria(modo, ruta) {
    const final = entradaDe(ruta);
    const actualEntrada = { hash: ventana.location.hash, estado: historia.state };
    const escritura = escrituraDe(modo, actualEntrada, final);
    if (escritura === "push") {
      historia.pushState(final.estado, "", final.hash);
    } else if (escritura === "replace") {
      historia.replaceState(final.estado, "", final.hash);
    }
    atendida = llaveDe(final.hash, final.estado);
  }

  async function indiceDe(ejercicio, institucional, clave) {
    // esAusencia in pantalla.js holds the rule, and a test reads it there.
    try {
      return await indiceParaClave(ejercicio, institucional, clave);
    } catch (error) {
      if (esAusencia(error)) {
        return institucional;
      }
      throw error;
    }
  }

  async function correr(pedido, modo, vigente) {
    const manifiesto = await cargarManifiesto();
    if (!vigente()) {
      return;
    }

    if (pedido.fuentes) {
      escribirHistoria(modo, pedido);
      pintarFuentes(documento, vistaDeFuentes(manifiesto));
      anunciar("De dónde salen estos números");
      actual = { ruta: pedido, lugar: "fuentes" };
      return;
    }

    const disponibles = ejerciciosDisponibles(manifiesto);
    const valido = disponibles.includes(pedido.anio);
    const ejercicio = valido ? pedido.anio : ejercicioDeEntrada(disponibles);
    // UC-08: a year that is not published opens the root of the entry year.
    let clave = valido ? pedido.clave : "";
    const grupos = valido ? pedido.grupos : [];
    const entrada = manifiesto.ejercicios.find((fila) => fila.ejercicio === ejercicio);
    const institucional = await cargarInstitucional(ejercicio);
    if (!vigente()) {
      return;
    }
    const base = { ejercicio, entrada, indice: institucional, disponibles };
    // A change of year carries the exercise of origin. Only then does an
    // absent clave show P2b. A link or Back to an absent clave opens the
    // nearest ancestor, with one line that says so.
    const desdeOtroAnio = Boolean(pedido.desde) && pedido.desde.anio !== ejercicio;

    let estado = base;
    let decision = null;
    let nota = "";
    for (;;) {
      estado = { ...base, indice: await indiceDe(ejercicio, institucional, clave) };
      if (!vigente()) {
        return;
      }
      decision = resolverPantalla(estado, clave);
      if (decision.tipo === "saltar") {
        clave = decision.clave;
      } else if (decision.tipo === "ausente" && !desdeOtroAnio) {
        nota = `Ese nivel no existe en ${ejercicio}; te llevamos al más cercano.`;
        clave = ancestroQueExiste(estado.indice, clave) ?? "";
      } else {
        break;
      }
    }
    ultimoAnio = ejercicio;

    if (decision.tipo === "ausente") {
      const ruta = { anio: ejercicio, clave, grupos: [], desde: pedido.desde };
      escribirHistoria(modo, ruta);
      const vista = vistaDeAusente(estado, clave, {
        ejercicio: pedido.desde.anio, nombre: pedido.desde.nombre, monto: pedido.desde.monto,
      });
      pintarAusente(documento, vista);
      if (direccionEntre(actual?.ruta ?? null, ruta) === "anio") {
        deslizar(documento, ejercicio < actual.ruta.anio);
      }
      anunciar(`${vista.nombre} no existe en el ejercicio ${ejercicio}`);
      actual = { ruta, lugar: "ausente", pila: vista.pila, vista, indice: estado.indice };
      return;
    }

    // A group that the data no longer has drops out of the pila. The route
    // of the pila then differs from the entry, and the entry is replaced.
    const pila = pilaDe(estado.indice, clave, grupos);
    const ruta = { anio: ejercicio, ...rutaDePila(pila), desde: null };
    escribirHistoria(modo, ruta);
    const vista = { ...vistaDeNavegador(estado, pila), nota };
    pintarNavegador(documento, vista);
    moverNavegador(documento, vista, {
      motor,
      antes: actual?.vista ?? null,
      direccion: direccionEntre(actual?.ruta ?? null, ruta),
      reducido: reducido(),
    });
    if (!marcado) {
      marcado = true;
      ventana.performance?.mark?.("enquelagastan-anillo");
    }
    anunciar(`${vista.titulo}. ${montoLargo(vista.total)} pesos.`);
    actual = { ruta, lugar: "navegador", pila, vista, indice: estado.indice };
  }

  function ir(pedido, modo) {
    // A new step ends the running motion at once (R4).
    motor.terminar();
    generacion += 1;
    const mia = generacion;
    const vigente = () => mia === generacion;
    const espera = setTimeout(() => {
      if (vigente()) {
        pintarCargando(documento);
      }
    }, ESPERA_DE_CARGA);
    // A stale run must write nothing, whether it succeeds or fails.
    enCurso = correr(pedido, modo, vigente)
      .catch((error) => {
        if (vigente()) {
          informar(error);
        }
      })
      .finally(() => clearTimeout(espera));
    return enCurso;
  }

  function informar(error) {
    pintarError(documento, vistaDeError(error));
    anunciar("No pudimos mostrar esta pantalla.");
    actual = { ruta: null, lugar: "error" };
  }

  // ---- The steps of the visitor. Every step pushes one entry (W6). ----

  function abrir(orden) {
    if (actual?.lugar !== "navegador" || actual.vista.hoja) {
      return enCurso;
    }
    const porcion = actual.pila.at(-1).porciones[orden];
    if (!porcion) {
      return enCurso;
    }
    const { anio, clave, grupos } = actual.ruta;
    // UC-03: a group keeps the hash of its nodo, and its claves go to state.
    return ir(porcion.esOtros
      ? { anio, clave, grupos: [...grupos, porcion.destino], desde: null }
      : { anio, clave: porcion.destino[0], grupos: [], desde: null }, "paso");
  }

  function subir(nivel) {
    // On P2b the pila ends at the nearest ancestor, and every level of it
    // is a way up. On P1 and P2 the last level is the screen on view.
    if (!actual?.pila) {
      return enCurso;
    }
    const limite = actual.lugar === "ausente" ? actual.pila.length : actual.pila.length - 1;
    if (!(nivel >= 0 && nivel < limite)) {
      return enCurso;
    }
    const arriba = rutaDePila(actual.pila.slice(0, nivel + 1));
    return ir({ anio: actual.ruta.anio, ...arriba, desde: null }, "paso");
  }

  function volver() {
    // R10 and K1: one level up, or out of the group. W12: P2b has none.
    if (actual?.lugar !== "navegador" || actual.pila.length < 2) {
      return enCurso;
    }
    return subir(actual.pila.length - 2);
  }

  function cambiarAnio(anio) {
    // R11: the path stays (C17), and W5: an open group closes.
    if ((actual?.lugar !== "navegador" && actual?.lugar !== "ausente") || !anio) {
      return enCurso;
    }
    const { clave } = actual.ruta;
    let desde = null;
    if (actual.lugar === "ausente") {
      desde = actual.ruta.desde;
    } else if (clave !== "") {
      const nodo = actual.indice[clave];
      desde = { anio: actual.ruta.anio, nombre: nodo.n, monto: nodo.d };
    }
    return ir({ anio, clave, grupos: [], desde }, "paso");
  }

  function irAClave(clave) {
    return ir({ anio: ultimoAnio, clave, grupos: [], desde: null }, "paso");
  }

  function conmutar(interruptor) {
    // W9: a switch changes the look, never the place, and writes no entry.
    tema = cambiarTema(tema, interruptor, almacen);
    const aplicar = () => aplicarTema(documento, tema);
    if (!documento.startViewTransition || prefiere("(prefers-reduced-motion: reduce)")) {
      aplicar();
      return;
    }
    // R13: a crossfade of 200ms. A hidden tab skips the transition, and the
    // change still applies. The two promises then reject, and nobody needs
    // to hear it.
    const transicion = documento.startViewTransition(aplicar);
    transicion.ready.catch(() => {});
    transicion.finished.catch(() => {});
  }

  function manejarClick(evento) {
    const objetivo = evento.target;
    if (!objetivo?.closest) {
      return enCurso;
    }
    const control = (atributo) => objetivo.closest(`[${atributo}]`);
    const valor = (atributo) => control(atributo)?.getAttribute(atributo);
    // A link opened with a modifier goes to a new tab, as the visitor asks.
    const enOtraPestania = evento.metaKey || evento.ctrlKey || evento.shiftKey;

    if (control("data-expandir")) {
      expandirMiga(control("data-expandir"));
      return enCurso;
    }
    if (control("data-interruptor")) {
      conmutar(valor("data-interruptor"));
      return enCurso;
    }
    if (control("data-abrir")) {
      return abrir(Number(valor("data-abrir")));
    }
    if (control("data-subir")) {
      return subir(Number(valor("data-subir")));
    }
    if (control("data-anio")) {
      return cambiarAnio(Number(valor("data-anio")));
    }
    if (control("data-clave") && !enOtraPestania) {
      evento.preventDefault?.();
      return irAClave(valor("data-clave"));
    }
    if (control("data-fuentes") && !enOtraPestania) {
      evento.preventDefault?.();
      return ir({ fuentes: true }, "paso");
    }
    return enCurso;
  }

  function manejarTecla(evento) {
    if (evento.altKey || evento.ctrlKey || evento.metaKey || evento.shiftKey) {
      return enCurso;
    }
    if (evento.key === "Escape") {
      return volver();
    }
    // K2: the arrow at an end has no year, so the key does nothing there.
    if (evento.key === "ArrowLeft") {
      return cambiarAnio(actual?.vista?.anterior);
    }
    if (evento.key === "ArrowRight") {
      return cambiarAnio(actual?.vista?.siguiente);
    }
    return enCurso;
  }

  function alCambiarLaEntrada() {
    const llave = llaveDe(ventana.location.hash, historia.state);
    if (llave === atendida) {
      return enCurso;
    }
    atendida = llave;
    return ir(rutaDeEntrada(ventana.location.hash, historia.state), "carga");
  }

  // A finger or a mouse on a moving ring ends the motion before the click,
  // so the click lands on an arc with its destination.
  documento.addEventListener("pointerdown", () => motor.terminar());
  documento.addEventListener("click", (evento) => { manejarClick(evento); });
  documento.addEventListener("keydown", (evento) => { manejarTecla(evento); });
  ventana.addEventListener("popstate", alCambiarLaEntrada);
  ventana.addEventListener("hashchange", alCambiarLaEntrada);

  if (ventana.ResizeObserver) {
    new ventana.ResizeObserver(() => ajustarDisco(documento))
      .observe(documento.getElementById("lienzo"));
  }

  alCambiarLaEntrada();
  return { ir, informar, listo: () => enCurso };
}

if (typeof document !== "undefined") {
  iniciar({ documento: document, ventana: window, historia: history });
}
