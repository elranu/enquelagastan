// Join the modules, and answer a change of the URL.

import { saltarHijoUnico } from "./arbol.js";
import { cargarInstitucional, cargarManifiesto } from "./datos.js";
import {
  dibujarAusente, dibujarFuentes, dibujarNodo, dibujarRaiz, indiceParaClave,
  vistaDeAusente, vistaDeFuentes, vistaDeNodo, vistaDeRaiz,
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
// not part of the URL: "otros" names no real nodo, only a group of them.
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
  if (ejercicio !== pedido.ejercicio) {
    // A missing or invalid year (a fresh visit with no hash, for one) still
    // draws the right exercise, but the URL must say so too. Every click
    // reads the exercise from the URL, so a click right after this draw
    // would otherwise ask for the exercise "null".
    history.replaceState(null, "", escribirRuta(ejercicio, pedido.clave));
  }
  const entrada = manifiesto.ejercicios
    .find((fila) => fila.ejercicio === ejercicio);
  const indiceInstitucional = await cargarInstitucional(ejercicio);
  const estadoBase = { ejercicio, entrada, indice: indiceInstitucional, disponibles };

  if (grupoOtros && grupoOtros.deClave !== pedido.clave) {
    grupoOtros = null;
  }

  if (pedido.clave === "") {
    const grupo = grupoOtros ? grupoOtros.claves : null;
    app.appendChild(dibujarRaiz(vistaDeRaiz(estadoBase, grupo), document));
    ultimo = { ejercicio, clave: "", nombre: null, monto: null };
    return;
  }

  // A nodo at or below the object level needs its file joined first. A 404
  // there means the clave is absent, same as a miss above that level. Both
  // cases fall through to the screen of the absent camino.
  const indice = await indiceParaClave(ejercicio, indiceInstitucional, pedido.clave)
    .catch(() => indiceInstitucional);
  const estado = { ...estadoBase, indice };

  if (!indice[pedido.clave]) {
    const origen = ultimo && ultimo.clave === pedido.clave
      ? { ejercicio: ultimo.ejercicio, monto: ultimo.monto, nombre: ultimo.nombre }
      : { ejercicio };
    app.appendChild(dibujarAusente(vistaDeAusente(estado, pedido.clave, origen), document));
    return;
  }

  // The visitor never lands on a nodo with one child. When the requested
  // clave is a link in a chain, move on to the first nodo that divides.
  const { destino } = saltarHijoUnico(indice, pedido.clave);
  if (destino !== pedido.clave) {
    window.location.hash = escribirRuta(ejercicio, destino);
    return;
  }

  const grupo = grupoOtros ? grupoOtros.claves : null;
  app.appendChild(dibujarNodo(vistaDeNodo(estado, pedido.clave, grupo), document));
  ultimo = {
    ejercicio, clave: pedido.clave, nombre: indice[pedido.clave].n, monto: indice[pedido.clave].d,
  };
}

async function manejarClick(evento) {
  const anio = evento.target.closest("[data-anio]");
  if (anio) {
    // The arrow changes the exercise and nothing else: keep the clave that
    // is already on screen.
    const clave = leerRuta(window.location.hash).clave;
    window.location.hash = escribirRuta(Number(anio.dataset.anio), clave);
    return;
  }

  const destinoEl = evento.target.closest("[data-destino]");
  if (destinoEl) {
    const destinos = destinoEl.dataset.destino.split(" ").filter(Boolean);
    const pedido = leerRuta(window.location.hash);
    if (destinos.length === 1) {
      const indiceInstitucional = await cargarInstitucional(pedido.ejercicio);
      const indice = await indiceParaClave(pedido.ejercicio, indiceInstitucional, destinos[0]);
      const { destino } = saltarHijoUnico(indice, destinos[0]);
      window.location.hash = escribirRuta(pedido.ejercicio, destino);
    } else {
      // Several destinos mean the slice "otros": stay on this clave and
      // redraw with only that group.
      grupoOtros = { deClave: pedido.clave, claves: destinos };
      await dibujar();
    }
    return;
  }

  const claveEl = evento.target.closest("[data-clave]");
  if (claveEl) {
    grupoOtros = null;
    const pedido = leerRuta(window.location.hash);
    const ruta = escribirRuta(pedido.ejercicio, claveEl.dataset.clave);
    if (ruta === window.location.hash) {
      // The crumb "otros" points at the clave already on screen, so the hash
      // does not change. Redraw here, or the browser fires no hashchange
      // and the click of the visitor does nothing.
      await dibujar();
    } else {
      window.location.hash = ruta;
    }
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
  aviso.textContent = `No pudimos cargar los datos. ${error.message}`;
  app.appendChild(aviso);
}

dibujar().catch(informar);
