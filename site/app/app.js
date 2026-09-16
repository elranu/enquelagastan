// Join the modules, and answer a change of the URL.
//
// This module holds the DOM and the history, and no rule of the navigator.
// resolverPantalla in pantalla.js holds the decision, so a test reads it.
//
// iniciar takes the document, the window and the history as arguments. The
// module therefore loads without a browser, and a test drives the whole
// routing loop with the fake document of test/falso-documento.mjs.

import { cargarInstitucional, cargarManifiesto } from "./datos.js";
import { montoLargo } from "./formato.js";
import {
  dibujarAusente, dibujarError, dibujarFuentes, dibujarNodo, dibujarRaiz,
  esAusencia, indiceParaClave, resolverPantalla, vistaDeAusente, vistaDeError,
  vistaDeFuentes, vistaDeNodo, vistaDeRaiz,
} from "./pantalla.js";
import {
  ejercicioDeEntrada, ejerciciosDisponibles, escribirRuta, leerRuta,
} from "./ruta.js";

// The sources screen is static and belongs to no exercise. leerRuta cannot
// name it, because its first segment is always a year, so app.js checks the
// raw hash before it asks ruta.js for anything.
const RUTA_DE_FUENTES = "#/fuentes";

function vaciar(elemento) {
  while (elemento.firstChild) {
    elemento.removeChild(elemento.firstChild);
  }
}

export function iniciar({ documento, ventana, historia }) {
  const app = documento.getElementById("app");
  // The live region lives outside #app, and it survives every navigation.
  // #app itself carries no aria-live: a screen reader would read the whole
  // new screen, the year strip and the codes included, on every tap.
  const aviso = documento.getElementById("aviso");

  // The last nodo the visitor actually saw. The arrow of the year keeps the
  // clave and only changes the exercise. This is the exercise of origin when
  // the new exercise lacks that clave.
  let ultimo = null;

  // The children of the slice "otros" that the visitor opened, if any. It is
  // not part of the URL: "otros" names no real nodo, only a group of them. It
  // belongs to one exercise and one clave, and resolverPantalla drops it when
  // the screen shows another one.
  let grupoOtros = null;

  // A hashchange can start a second dibujar while the first one waits for a
  // file. Both runs would write to the page, and the visitor would read two
  // screens at once. Every run takes a number, and only the newest one
  // writes.
  let generacion = 0;

  function anunciar(texto) {
    if (aviso) {
      aviso.textContent = texto;
    }
  }

  function mostrar(elemento, texto) {
    vaciar(app);
    app.appendChild(elemento);
    anunciar(texto);
  }

  async function irA(ruta) {
    // A route equal to the one on screen fires no hashchange. The crumb
    // "otros" and the arrow back to the exercise of origin both do that. So
    // draw here, or the click of the visitor does nothing.
    if (ruta === ventana.location.hash) {
      await dibujar();
      return;
    }
    ventana.location.hash = ruta;
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

  async function dibujar() {
    generacion += 1;
    const mia = generacion;
    const vigente = () => mia === generacion;

    const manifiesto = await cargarManifiesto();
    if (!vigente()) {
      return;
    }

    if (ventana.location.hash === RUTA_DE_FUENTES) {
      mostrar(dibujarFuentes(vistaDeFuentes(manifiesto), documento),
        "De dónde salen estos números");
      return;
    }

    const disponibles = ejerciciosDisponibles(manifiesto);
    const pedido = leerRuta(ventana.location.hash);
    const ejercicio = disponibles.includes(pedido.ejercicio)
      ? pedido.ejercicio
      : ejercicioDeEntrada(disponibles);
    const entrada = manifiesto.ejercicios
      .find((fila) => fila.ejercicio === ejercicio);
    const institucional = await cargarInstitucional(ejercicio);
    if (!vigente()) {
      return;
    }
    const base = { ejercicio, entrada, indice: institucional, disponibles };

    // The visitor never lands on a nodo with one child. A chain that crosses
    // the object level needs more than one pass, because the index of the next
    // clave is not loaded yet. Repeat until the destino stops moving.
    let clave = pedido.clave;
    let estado = base;
    let decision = null;
    for (;;) {
      estado = { ...base, indice: await indiceDe(ejercicio, institucional, clave) };
      if (!vigente()) {
        return;
      }
      decision = resolverPantalla(estado, clave, grupoOtros);
      if (decision.tipo !== "saltar") {
        break;
      }
      clave = decision.clave;
    }
    grupoOtros = decision.grupo ? grupoOtros : null;

    // Replace, never push. A jumped clave and a missing year both rewrite the
    // URL. A push would leave the skipped clave in the history, and Back would
    // return there and jump forward again, with no way out.
    const ruta = escribirRuta(ejercicio, clave);
    if (ruta !== ventana.location.hash) {
      historia.replaceState(null, "", ruta);
    }

    if (decision.tipo === "raiz") {
      const vista = vistaDeRaiz(estado, decision.grupo);
      mostrar(dibujarRaiz(vista, documento), resumen(vista));
      ultimo = { ejercicio, clave: "", nombre: null, monto: null };
      return;
    }

    if (decision.tipo === "ausente") {
      const origen = ultimo && ultimo.clave === clave
        ? { ejercicio: ultimo.ejercicio, monto: ultimo.monto, nombre: ultimo.nombre }
        : { ejercicio };
      const vista = vistaDeAusente(estado, clave, origen);
      mostrar(dibujarAusente(vista, documento),
        `${vista.nombre} no existe en el ejercicio ${vista.ejercicio}`);
      return;
    }

    const vista = vistaDeNodo(estado, clave, decision.grupo);
    mostrar(dibujarNodo(vista, documento), resumen(vista));
    ultimo = {
      ejercicio, clave, nombre: estado.indice[clave].n, monto: estado.indice[clave].d,
    };
  }

  async function manejarClick(evento) {
    const anio = evento.target.closest("[data-anio]");
    if (anio) {
      // The arrow changes the exercise and nothing else: keep the clave that
      // is already on screen.
      const clave = leerRuta(ventana.location.hash).clave;
      await irA(escribirRuta(Number(anio.dataset.anio), clave));
      return;
    }

    const destinoEl = evento.target.closest("[data-destino]");
    if (destinoEl) {
      const destinos = destinoEl.dataset.destino.split(" ").filter(Boolean);
      const pedido = leerRuta(ventana.location.hash);
      if (destinos.length === 1) {
        await irA(escribirRuta(pedido.ejercicio, destinos[0]));
      } else {
        // Several destinos mean the slice "otros": stay on this clave and
        // redraw with only that group.
        grupoOtros = {
          ejercicio: pedido.ejercicio, deClave: pedido.clave, claves: destinos,
        };
        await dibujar();
      }
      return;
    }

    const claveEl = evento.target.closest("[data-clave]");
    if (claveEl) {
      grupoOtros = null;
      const pedido = leerRuta(ventana.location.hash);
      await irA(escribirRuta(pedido.ejercicio, claveEl.dataset.clave));
    }
  }

  function informar(error) {
    // The exit of this screen is a button with data-clave, and never a link
    // to "#/". A link to the route that is already on screen fires no event,
    // so a second attempt from the home route would do nothing.
    mostrar(dibujarError(vistaDeError(error), documento),
      "No pudimos mostrar esta pantalla.");
  }

  app.addEventListener("click", (evento) => {
    manejarClick(evento).catch(informar);
  });

  ventana.addEventListener("hashchange", () => {
    dibujar().catch(informar);
  });

  dibujar().catch(informar);
  return { dibujar, manejarClick, informar };
}

function resumen(vista) {
  return `${vista.titulo}. ${montoLargo(vista.total)} pesos.`;
}

if (typeof document !== "undefined") {
  iniciar({ documento: document, ventana: window, historia: history });
}
