// Turn the data of one exercise into what a screen says, and then into
// elements.
//
// Every decision lives in the functions that give a view. The functions that
// draw hold no decision, so a test reads a view without a browser.

import { hijosDe, migaDePan, nivelDe, NIVELES_INSTITUCIONALES, raices, totalDe }
  from "./arbol.js";
import { cargarObjeto } from "./datos.js";
import { desviacionDe, ejecucionDe, REASIGNACION_INTERNA, SOBRE_LO_APROBADO }
  from "./desviacion.js";
import { conSigno, montoCorto, montoLargo, porcentaje } from "./formato.js";
import { NOMBRE_OTROS, porcionesDe } from "./porciones.js";
import { procedenciaDe } from "./procedencia.js";
import { ancestroQueExiste } from "./ruta.js";
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

export function vistaDeRaiz(estado, grupo = null) {
  const { indice, entrada, ejercicio, disponibles } = estado;
  const totales = totalesDeLaRaiz(indice);
  const comoNodo = { n: "", d: totales.d, p: totales.p, v: totales.v, g: totales.g };
  // A visitor who opens the slice "otros" gets the same screen, with the pie
  // chart limited to that group instead of every jurisdiccion. See app.js.
  const claves = grupo ?? totales.claves;
  return {
    ejercicio,
    anios: disponibles,
    titulo: "En qué la gastó el Estado nacional",
    // The headline shows the verified total from the manifest, not the sum.
    // Each jurisdiccion below rounds to 6 decimals of a million pesos.
    // Summing 15 of them can drift from the true total by a few pesos.
    // Never replace this line with totales.d for that reason.
    total: entrada.total_devengado / 1_000_000,
    ejecucion: ejecucionDe(comoNodo),
    desviacion: desviacionDe(comoNodo, ""),
    porciones: porcionesDe(indice, claves, "d").porciones,
    procedencia: procedenciaDe(entrada, indice, ""),
  };
}

export async function indiceParaClave(ejercicio, indice, clave, traer) {
  // A nodo of level 9 declares its children of the object in `k`, and those
  // children live in one file per nodo of that level. Join that file with the
  // institutional index once the visitor reaches or crosses that level.
  if (nivelDe(clave) < NIVELES_INSTITUCIONALES) {
    return indice;
  }
  const hoja = clave.split("-").slice(0, NIVELES_INSTITUCIONALES).join("-");
  const objeto = await cargarObjeto(ejercicio, hoja, traer);
  return { ...indice, ...objeto };
}

export function vistaDeNodo(estado, clave, grupo = null) {
  const { indice, entrada, ejercicio, disponibles } = estado;
  const nodo = indice[clave];
  // A visitor who opens the slice "otros" gets the same nodo, with the pie
  // chart limited to that group instead of every child. See app.js.
  const hijos = grupo ?? hijosDe(indice, clave);
  const { total, porciones } = hijos.length > 0
    ? porcionesDe(indice, hijos, "d")
    : { total: nodo.d, porciones: [] };
  const raizTotal = totalDe(indice, raices(indice), "d");
  return {
    ejercicio,
    anios: disponibles,
    clave,
    titulo: nodo.n,
    total: nodo.d,
    parteDelTotal: raizTotal > 0 ? nodo.d / raizTotal : null,
    ejecucion: ejecucionDe(nodo),
    desviacion: desviacionDe(nodo, clave),
    miga: grupo
      ? [...migaDePan(indice, clave), { clave, nombre: NOMBRE_OTROS }]
      : migaDePan(indice, clave),
    porciones: total > 0 ? porciones : [],
    sinEjecucion: nodo.d === 0,
    procedencia: procedenciaDe(entrada, indice, clave),
  };
}

export function vistaDeAusente(estado, clave, origen) {
  return {
    ejercicio: estado.ejercicio,
    anios: estado.disponibles,
    clavePedida: clave,
    nombre: origen.nombre ?? clave.split("-").at(-1),
    origen,
    ancestro: ancestroQueExiste(estado.indice, clave),
    procedencia: procedenciaDe(estado.entrada, estado.indice, ""),
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
  // UC-06 is a must: every screen offers a way to check the source.
  const fuentes = texto(documento, "a", "De dónde salen estos números");
  fuentes.setAttribute("href", "#/fuentes");
  pie.appendChild(fuentes);
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

const PALABRA_DE_LA_DESVIACION = {
  [SOBRE_LO_APROBADO]: "sobre lo aprobado",
  [REASIGNACION_INTERNA]: "de reasignación dentro del proyecto",
};

export function dibujarNodo(vista, documento = document) {
  const seccion = documento.createElement("section");
  seccion.setAttribute("class", "pantalla pantalla-nodo");
  seccion.appendChild(dibujarTiraDeAnios(vista, documento));

  const miga = documento.createElement("nav");
  miga.setAttribute("class", "miga");
  miga.setAttribute("aria-label", "Camino");
  const inicio = texto(documento, "button", "Inicio", "tramo");
  inicio.setAttribute("data-clave", "");
  miga.appendChild(inicio);
  for (const tramo of vista.miga) {
    const paso = texto(documento, "button", tramo.nombre, "tramo");
    paso.setAttribute("data-clave", tramo.clave);
    miga.appendChild(paso);
  }
  seccion.appendChild(miga);

  seccion.appendChild(texto(documento, "h1", vista.titulo));

  const cifra = documento.createElement("p");
  cifra.setAttribute("class", "total");
  cifra.textContent = `${montoLargo(vista.total)} pesos`;
  seccion.appendChild(cifra);

  const detalle = [];
  if (vista.parteDelTotal !== null) {
    detalle.push(`${porcentaje(vista.parteDelTotal)} del gasto total`);
  }
  if (vista.ejecucion !== null) {
    detalle.push(`${porcentaje(vista.ejecucion)} de lo autorizado`);
  }
  if (vista.desviacion) {
    const palabra = PALABRA_DE_LA_DESVIACION[vista.desviacion.tipo];
    detalle.push(`${conSigno(vista.desviacion.valor)} ${palabra}`);
  }
  seccion.appendChild(texto(documento, "p", detalle.join(" · "), "detalle"));

  if (vista.sinEjecucion) {
    seccion.appendChild(texto(documento, "p",
      "Sin ejecución en este ejercicio.", "sin-ejecucion"));
  } else {
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
  }

  seccion.appendChild(dibujarProcedencia(vista.procedencia, documento));
  return seccion;
}

const REPOSITORIO = "https://github.com/elranu/enquelagastan";

export function vistaDeFuentes(manifiesto) {
  return {
    filas: manifiesto.ejercicios.map((entrada) => ({
      ejercicio: entrada.ejercicio,
      archivo: entrada.archivo,
      publicado: entrada.publicado,
      verificado: entrada.verificado === true,
    })),
  };
}

export function dibujarFuentes(vista, documento = document) {
  const seccion = documento.createElement("section");
  seccion.setAttribute("class", "pantalla pantalla-fuentes");
  seccion.appendChild(texto(documento, "h1", "De dónde salen estos números"));

  seccion.appendChild(texto(documento, "p",
    "Los datos son de Presupuesto Abierto, del Ministerio de Economía de la "
    + "Nación, bajo licencia CC BY 4.0. Este proyecto lee los mismos archivos "
    + "que ofrece la página oficial de datos abiertos. Las URLs son idénticas."));

  const tabla = documento.createElement("table");
  tabla.setAttribute("class", "fuentes");
  for (const fila of vista.filas) {
    const linea = documento.createElement("tr");
    linea.appendChild(texto(documento, "td", String(fila.ejercicio)));
    const celda = documento.createElement("td");
    const enlace = texto(documento, "a", fila.archivo.split("/").pop());
    enlace.setAttribute("href", fila.archivo);
    celda.appendChild(enlace);
    linea.appendChild(celda);
    linea.appendChild(texto(documento, "td", fila.publicado));
    linea.appendChild(texto(documento, "td",
      fila.verificado ? "verificado" : "sin verificar"));
    tabla.appendChild(linea);
  }
  seccion.appendChild(tabla);

  seccion.appendChild(texto(documento, "p",
    "En cada corrida, el build suma el total del ejercicio y lo compara con el "
    + "informe oficial Cuenta Ahorro Inversión Financiamiento. Si los dos no "
    + "coinciden, no publica nada."));

  const codigo = texto(documento, "a", "El código de este proyecto");
  codigo.setAttribute("href", REPOSITORIO);
  seccion.appendChild(codigo);
  return seccion;
}

export function dibujarAusente(vista, documento = document) {
  const seccion = documento.createElement("section");
  seccion.setAttribute("class", "pantalla pantalla-ausente");
  seccion.appendChild(dibujarTiraDeAnios(vista, documento));

  seccion.appendChild(texto(documento, "h1",
    `"${vista.nombre}" no existe en el ejercicio ${vista.ejercicio}`));

  if (vista.origen && vista.origen.monto !== undefined) {
    seccion.appendChild(texto(documento, "p",
      `Existió en ${vista.origen.ejercicio}, con ${montoCorto(vista.origen.monto)} de pesos.`,
      "origen"));
  }

  if (vista.ancestro !== null) {
    const subir = texto(documento, "button", "Subir al nivel que sí existe",
      "principal");
    subir.setAttribute("data-clave", vista.ancestro);
    seccion.appendChild(subir);
  }
  const volver = texto(documento, "button",
    `Volver a ${vista.origen.ejercicio}`, "secundario");
  volver.setAttribute("data-anio", String(vista.origen.ejercicio));
  volver.setAttribute("data-clave", vista.clavePedida);
  seccion.appendChild(volver);

  seccion.appendChild(dibujarProcedencia(vista.procedencia, documento));
  return seccion;
}
