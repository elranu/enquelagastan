// Turn the data of one exercise into what a screen says, and then into
// elements.
//
// Every decision lives in the functions that give a view. The functions that
// draw hold no decision, so a test reads a view without a browser.

import { raices, totalDe } from "./arbol.js";
import { desviacionDe, ejecucionDe } from "./desviacion.js";
import { conSigno, montoCorto, montoLargo, porcentaje } from "./formato.js";
import { porcionesDe } from "./porciones.js";
import { procedenciaDe } from "./procedencia.js";
import { dibujarTorta } from "./torta.js";

function totalesDeLaRaiz(indice) {
  const claves = raices(indice);
  return {
    claves,
    d: totalDe(indice, claves, "d"),
    p: totalDe(indice, claves, "p"),
    v: totalDe(indice, claves, "v"),
    g: totalDe(indice, claves, "g"),
  };
}

export function vistaDeRaiz(estado) {
  const { indice, entrada, ejercicio, disponibles } = estado;
  const totales = totalesDeLaRaiz(indice);
  const comoNodo = { n: "", d: totales.d, p: totales.p, v: totales.v, g: totales.g };
  return {
    ejercicio,
    anios: disponibles,
    titulo: "En qué la gastó el Estado nacional",
    total: totales.d,
    ejecucion: ejecucionDe(comoNodo),
    desviacion: desviacionDe(comoNodo, "1"),
    porciones: porcionesDe(indice, totales.claves, "d").porciones,
    procedencia: procedenciaDe(entrada, indice, ""),
  };
}

function texto(documento, etiqueta, contenido, clase) {
  const elemento = documento.createElement(etiqueta);
  elemento.textContent = contenido;
  if (clase) {
    elemento.setAttribute("class", clase);
  }
  return elemento;
}

export function dibujarTiraDeAnios(vista, documento) {
  const tira = documento.createElement("nav");
  tira.setAttribute("class", "anios");
  tira.setAttribute("aria-label", "Ejercicio");
  for (const anio of vista.anios) {
    const boton = texto(documento, "button", String(anio), "anio");
    boton.setAttribute("data-anio", String(anio));
    if (anio === vista.ejercicio) {
      boton.setAttribute("aria-current", "true");
    }
    tira.appendChild(boton);
  }
  return tira;
}

export function dibujarProcedencia(procedencia, documento) {
  const pie = documento.createElement("footer");
  pie.setAttribute("class", "procedencia");
  const archivo = procedencia.archivo.split("/").pop();
  pie.appendChild(texto(documento, "p",
    `Fuente: Presupuesto Abierto · ${archivo} · ${procedencia.fecha}`));
  if (procedencia.codigos) {
    const lista = procedencia.codigos
      .map(({ eje, codigo }) => `${eje}_id=${codigo}`)
      .join(" · ");
    pie.appendChild(texto(documento, "p", lista, "codigos"));
  }
  return pie;
}

export function dibujarRaiz(vista, documento = document) {
  const seccion = documento.createElement("section");
  seccion.setAttribute("class", "pantalla pantalla-raiz");
  seccion.appendChild(dibujarTiraDeAnios(vista, documento));
  seccion.appendChild(texto(documento, "h1", vista.titulo));

  const cifra = documento.createElement("p");
  cifra.setAttribute("class", "total");
  cifra.textContent = `${montoLargo(vista.total)} pesos`;
  seccion.appendChild(cifra);

  const detalle = [];
  if (vista.ejecucion !== null) {
    detalle.push(`${porcentaje(vista.ejecucion)} de lo autorizado`);
  }
  if (vista.desviacion) {
    detalle.push(`${conSigno(vista.desviacion.valor)} sobre lo aprobado`);
  }
  seccion.appendChild(texto(documento, "p", detalle.join(" · "), "detalle"));

  seccion.appendChild(dibujarTorta(vista.porciones, documento));

  const leyenda = documento.createElement("ul");
  leyenda.setAttribute("class", "leyenda");
  vista.porciones.forEach((porcion, orden) => {
    const fila = texto(documento, "li",
      `${porcion.nombre} · ${porcentaje(porcion.parte)} · ${montoCorto(porcion.monto)}`,
      `leyenda-${orden}`);
    fila.setAttribute("data-destino", porcion.destino.join(" "));
    leyenda.appendChild(fila);
  });
  seccion.appendChild(leyenda);

  seccion.appendChild(dibujarProcedencia(vista.procedencia, documento));
  return seccion;
}
