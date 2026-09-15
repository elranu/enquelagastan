// Join the modules, and answer a change of the URL.
//
// This module holds the DOM and the history, and no rule of the navigator.
// resolverPantalla in pantalla.js holds the decision, so a test reads it.

import { cargarInstitucional, cargarManifiesto } from "./datos.js";
import {
  dibujarAusente, dibujarFuentes, dibujarNodo, dibujarRaiz, esAusencia,
  indiceParaClave, resolverPantalla, vistaDeAusente, vistaDeFuentes,
  vistaDeNodo, vistaDeRaiz,
} from "./pantalla.js";
import {
  ejercicioDeEntrada, ejerciciosDisponibles, escribirRuta, leerRuta,
} from "./ruta.js";

const app = document.getElementById("app");

// The last nodo the visitor actually saw. The arrow of the year keeps the
// clave and only changes the exercise. This is the exercise of origin when
// the new exercise lacks that clave.
let ultimo = null;

// The children of the slice "otros" that the visitor opened, if any. It is
// not part of the URL: "otros" names no real nodo, only a group of them. It
// belongs to one exercise and one clave, and resolverPantalla drops it when
// the screen shows another one.
let grupoOtros = null;

function vaciar(elemento) {
  while (elemento.firstChild) {
    elemento.removeChild(elemento.firstChild);
  }
}

// The sources screen is static and belongs to no exercise. leerRuta cannot
// name it, because its first segment is always a year, so app.js checks the
// raw hash before it asks ruta.js for anything.
const RUTA_DE_FUENTES = "#/fuentes";

async function irA(ruta) {
  // A route equal to the one on screen fires no hashchange. The crumb "otros"
  // and the arrow back to the exercise of origin both do that, so draw here
  // or the click of the visitor does nothing.
  if (ruta === window.location.hash) {
    await dibujar();
    return;
  }
  window.location.hash = ruta;
}

async function indiceDe(ejercicio, institucional, clave) {
  // esAusencia in pantalla.js holds the rule. A test reads it there, since
  // this module cannot be imported without a DOM.
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
  const manifiesto = await cargarManifiesto();

  vaciar(app);
  if (window.location.hash === RUTA_DE_FUENTES) {
    app.appendChild(dibujarFuentes(vistaDeFuentes(manifiesto), document));
    return;
  }

  const disponibles = ejerciciosDisponibles(manifiesto);
  const pedido = leerRuta(window.location.hash);
  const ejercicio = disponibles.includes(pedido.ejercicio)
    ? pedido.ejercicio
    : ejercicioDeEntrada(disponibles);
  const entrada = manifiesto.ejercicios
    .find((fila) => fila.ejercicio === ejercicio);
  const institucional = await cargarInstitucional(ejercicio);
  const base = { ejercicio, entrada, indice: institucional, disponibles };

  // The visitor never lands on a nodo with one child. A chain that crosses
  // the object level needs more than one pass, because the index of the next
  // clave is not loaded yet. Repeat until the destino stops moving.
  let clave = pedido.clave;
  let estado = base;
  let decision = null;
  for (;;) {
    estado = { ...base, indice: await indiceDe(ejercicio, institucional, clave) };
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
  if (ruta !== window.location.hash) {
    history.replaceState(null, "", ruta);
  }

  if (decision.tipo === "raiz") {
    app.appendChild(dibujarRaiz(vistaDeRaiz(estado, decision.grupo), document));
    ultimo = { ejercicio, clave: "", nombre: null, monto: null };
    return;
  }

  if (decision.tipo === "ausente") {
    const origen = ultimo && ultimo.clave === clave
      ? { ejercicio: ultimo.ejercicio, monto: ultimo.monto, nombre: ultimo.nombre }
      : { ejercicio };
    app.appendChild(dibujarAusente(vistaDeAusente(estado, clave, origen), document));
    return;
  }

  app.appendChild(dibujarNodo(vistaDeNodo(estado, clave, decision.grupo), document));
  ultimo = {
    ejercicio, clave, nombre: estado.indice[clave].n, monto: estado.indice[clave].d,
  };
}

async function manejarClick(evento) {
  const anio = evento.target.closest("[data-anio]");
  if (anio) {
    // The arrow changes the exercise and nothing else: keep the clave that
    // is already on screen.
    const clave = leerRuta(window.location.hash).clave;
    await irA(escribirRuta(Number(anio.dataset.anio), clave));
    return;
  }

  const destinoEl = evento.target.closest("[data-destino]");
  if (destinoEl) {
    const destinos = destinoEl.dataset.destino.split(" ").filter(Boolean);
    const pedido = leerRuta(window.location.hash);
    if (destinos.length === 1) {
      await irA(escribirRuta(pedido.ejercicio, destinos[0]));
    } else {
      // Several destinos mean the slice "otros": stay on this clave and
      // redraw with only that group.
      grupoOtros = { ejercicio: pedido.ejercicio, deClave: pedido.clave, claves: destinos };
      await dibujar();
    }
    return;
  }

  const claveEl = evento.target.closest("[data-clave]");
  if (claveEl) {
    grupoOtros = null;
    const pedido = leerRuta(window.location.hash);
    await irA(escribirRuta(pedido.ejercicio, claveEl.dataset.clave));
  }
}

app.addEventListener("click", (evento) => {
  manejarClick(evento).catch(informar);
});

window.addEventListener("hashchange", () => {
  dibujar().catch(informar);
});

function informar(error) {
  vaciar(app);
  const aviso = document.createElement("p");
  aviso.className = "error";
  aviso.textContent = "No pudimos mostrar esta pantalla. "
    + `Probá de nuevo en un rato. (${error.message})`;
  app.appendChild(aviso);
  const salida = document.createElement("a");
  salida.className = "principal";
  salida.href = "#/";
  salida.textContent = "Volver al inicio";
  app.appendChild(salida);
}

dibujar().catch(informar);
