// Join the modules, and answer a change of the URL.

import { cargarInstitucional, cargarManifiesto } from "./datos.js";
import { dibujarRaiz, vistaDeRaiz } from "./pantalla.js";
import {
  ejercicioDeEntrada, ejerciciosDisponibles, escribirRuta, leerRuta,
} from "./ruta.js";

const app = document.getElementById("app");

function vaciar(elemento) {
  while (elemento.firstChild) {
    elemento.removeChild(elemento.firstChild);
  }
}

async function dibujar() {
  const manifiesto = await cargarManifiesto();
  const disponibles = ejerciciosDisponibles(manifiesto);
  const pedido = leerRuta(window.location.hash);
  const ejercicio = disponibles.includes(pedido.ejercicio)
    ? pedido.ejercicio
    : ejercicioDeEntrada(disponibles);

  const entrada = manifiesto.ejercicios
    .find((fila) => fila.ejercicio === ejercicio);
  const indice = await cargarInstitucional(ejercicio);
  const estado = { ejercicio, entrada, indice, disponibles };

  vaciar(app);
  app.appendChild(dibujarRaiz(vistaDeRaiz(estado), document));
}

app.addEventListener("click", (evento) => {
  const anio = evento.target.closest("[data-anio]");
  if (anio) {
    window.location.hash = escribirRuta(Number(anio.dataset.anio), "");
  }
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
