// Turn the data of one exercise into what a screen says, and then into
// elements.
//
// Every decision lives in the functions that give a view. The functions that
// draw hold no decision, so a test reads a view without a browser.

import { colorDe, escenaDe, svgDeEscena } from "./anillos.js";
import {
  hijosDe, migaCorta, migaDePan, nivelDe, NIVELES_INSTITUCIONALES, raices,
  saltarHijoUnico, totalDe,
} from "./arbol.js";
import { cargarObjeto } from "./datos.js";
import { desviacionDe, ejecucionDe, REASIGNACION_INTERNA, SOBRE_LO_APROBADO }
  from "./desviacion.js";
import { fraseDe } from "./frase.js";
import {
  conSigno, fechaCorta, montoCorto, montoLargo, partesDelMonto, porcentaje,
} from "./formato.js";
import { NOMBRE_OTROS, porcionesDe } from "./porciones.js";
import { procedenciaDe } from "./procedencia.js";
import { ancestroQueExiste, contiene, RUTA_DE_FUENTES } from "./ruta.js";
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

export const TITULO_DE_LA_RAIZ = "En qué la gastó el Estado nacional";
export const TITULO_DE_UN_GRUPO = "Otros";

// A screen that shows the slice "otros" describes that group and nothing
// else. Its headline is the total of the group, and a line says what the
// group is a part of. The execution and the deviation of the parent describe
// the parent, so this screen prints neither. A share of 34,7% under the total
// of the country reads as 34,7% of the country.
function vistaDeGrupo(base, grupo, indice, deNombre, raizTotal) {
  const { total, porciones } = porcionesDe(indice, grupo, "d");
  return {
    ...base,
    titulo: TITULO_DE_UN_GRUPO,
    total,
    parteDe: deNombre,
    parteDelTotal: raizTotal > 0 ? total / raizTotal : null,
    ejecucion: null,
    desviacion: null,
    porciones,
  };
}

export function vistaDeRaiz(estado, grupo = null) {
  const { indice, entrada, ejercicio, disponibles } = estado;
  const totales = totalesDeLaRaiz(indice);
  const comoNodo = { n: "", d: totales.d, p: totales.p, v: totales.v, g: totales.g };
  const base = {
    ejercicio,
    anios: disponibles,
    titulo: TITULO_DE_LA_RAIZ,
    // The headline shows the verified total from the manifest, not the sum.
    // Each jurisdiccion below rounds to 6 decimals of a million pesos.
    // Summing 15 of them can drift from the true total by a few pesos.
    // Never replace this line with totales.d for that reason.
    total: entrada.total_devengado / 1_000_000,
    parteDe: null,
    parteDelTotal: null,
    ejecucion: ejecucionDe(comoNodo),
    desviacion: desviacionDe(comoNodo, ""),
    miga: grupo ? [{ clave: "", nombre: NOMBRE_OTROS }] : [],
    migaActual: true,
    porciones: porcionesDe(indice, totales.claves, "d").porciones,
    procedencia: procedenciaDe(entrada, indice, ""),
  };
  if (!grupo) {
    return base;
  }
  return vistaDeGrupo(base, grupo, indice, "del gasto del Estado nacional",
    totales.d);
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
  // A nodo of level 9 lists object codes whose file may be absent. A child
  // that is not in the index is not a part (the same rule as nivelDePila).
  const hijos = hijosDe(indice, clave).filter((hijo) => indice[hijo]);
  const { total, porciones } = hijos.length > 0
    ? porcionesDe(indice, hijos, "d")
    : { total: nodo.d, porciones: [] };
  const raizTotal = totalDe(indice, raices(indice), "d");
  const miga = migaDePan(indice, clave);
  const base = {
    ejercicio,
    anios: disponibles,
    clave,
    titulo: nodo.n,
    total: nodo.d,
    parteDe: null,
    parteDelTotal: raizTotal > 0 ? nodo.d / raizTotal : null,
    ejecucion: ejecucionDe(nodo),
    desviacion: desviacionDe(nodo, clave),
    miga,
    // The last crumb is the screen the visitor is on. A run of equal names
    // collapses to the shallowest clave of that run. A tap on that crumb
    // jumps forward to this same screen, so the crumb is still this one.
    migaActual: miga.length === 0 || miga.at(-1).clave === clave
      || saltarHijoUnico(indice, miga.at(-1).clave) === clave,
    porciones: total > 0 ? porciones : [],
    sinEjecucion: nodo.d === 0,
    procedencia: procedenciaDe(entrada, indice, clave),
  };
  if (!grupo) {
    return base;
  }
  return {
    ...vistaDeGrupo(base, grupo, indice, `de ${nodo.n}`, raizTotal),
    miga: [...miga, { clave, nombre: NOMBRE_OTROS }],
    migaActual: true,
    sinEjecucion: false,
  };
}

export function vistaDeAusente(estado, clave, origen) {
  const ancestro = ancestroQueExiste(estado.indice, clave);
  return {
    ejercicio: estado.ejercicio,
    anios: estado.disponibles,
    clavePedida: clave,
    nombre: origen.nombre ?? clave.split("-").at(-1),
    origen,
    ancestro,
    // A shared URL can land here with no history behind it. The miga is then
    // the only control that moves the visitor up the tree.
    miga: migaDePan(estado.indice, ancestro ?? ""),
    // The miga names the way up, and never the screen the visitor is on.
    migaActual: false,
    procedencia: procedenciaDe(estado.entrada, estado.indice, ""),
  };
}

export function resolverPantalla(estado, clave, grupoOtros = null) {
  // The one decision of the navigator: what to draw for a requested clave.
  // app.js keeps only the DOM and the history, so a test reads this rule.
  //
  // The group "otros" names no nodo, so the URL cannot carry it. It belongs
  // to one exercise and one clave. The arrow of the year keeps the clave, so
  // a group of another exercise must go, or its claves miss the new index.
  const grupo = grupoOtros
    && grupoOtros.ejercicio === estado.ejercicio
    && grupoOtros.deClave === clave
    ? grupoOtros.claves
    : null;
  if (clave === "") {
    return { tipo: "raiz", clave: "", grupo };
  }
  if (!estado.indice[clave]) {
    return { tipo: "ausente", clave };
  }
  // The visitor never lands on a nodo with one child. A chain that crosses
  // the object level needs a second pass, because the index of the new clave
  // is not loaded yet. app.js repeats until the destino stops moving.
  const destino = saltarHijoUnico(estado.indice, clave);
  if (destino !== clave) {
    return { tipo: "saltar", clave: destino };
  }
  return { tipo: "nodo", clave, grupo };
}

export function esAusencia(error) {
  // Only a 404 means the camino is absent from the exercise. Every other
  // failure is ours: a lost connection, a 503, a bad JSON body.
  // estadoHttp exists so this check reads the real status, not the message.
  // An error with no estadoHttp came from no response, so it is never a 404.
  return error.estadoHttp === 404;
}

function dibujarLeyenda(porciones, documento) {
  // The row is a real button inside its <li>, and never an <li> that carries
  // role="button". A native control answers Enter and Space on its own, and
  // a screen reader reads a list of buttons with no ARIA at all.
  const leyenda = documento.createElement("ul");
  leyenda.setAttribute("class", "leyenda");
  porciones.forEach((porcion, orden) => {
    const fila = documento.createElement("li");
    fila.setAttribute("class", `leyenda-${orden}`);
    const boton = texto(documento, "button",
      `${porcion.nombre} · ${porcentaje(porcion.parte)} · ${montoCorto(porcion.monto)}`,
      "fila");
    boton.setAttribute("data-destino", porcion.destino.join(" "));
    fila.appendChild(boton);
    leyenda.appendChild(fila);
  });
  return leyenda;
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

function comoPaso(documento, boton) {
  // A step stays a control: the <li> only wraps it. A screen reader
  // still reads a list, and a visitor still presses a button.
  const paso = documento.createElement("li");
  paso.appendChild(boton);
  return paso;
}

export function dibujarMiga(vista, documento) {
  const miga = documento.createElement("nav");
  miga.setAttribute("class", "miga");
  miga.setAttribute("aria-label", "Camino");
  // An ordered list tells a screen reader how many steps the camino holds,
  // and which one the visitor is on.
  const pasos = documento.createElement("ol");
  const inicio = texto(documento, "button", "Inicio", "tramo");
  inicio.setAttribute("data-clave", "");
  const botones = [inicio];
  pasos.appendChild(comoPaso(documento, inicio));
  for (const tramo of vista.miga) {
    const paso = texto(documento, "button", tramo.nombre, "tramo");
    paso.setAttribute("data-clave", tramo.clave);
    botones.push(paso);
    pasos.appendChild(comoPaso(documento, paso));
  }
  // The last step is the screen the visitor is on, and the style already
  // says so. The year strip marks its year the same way.
  if (vista.migaActual) {
    botones.at(-1).setAttribute("aria-current", "true");
  }
  miga.appendChild(pasos);
  return miga;
}

export function dibujarProcedencia(procedencia, documento) {
  const pie = documento.createElement("footer");
  pie.setAttribute("class", "procedencia");
  const archivo = procedencia.archivo.split("/").pop();
  pie.appendChild(texto(documento, "p",
    `Fuente: Presupuesto Abierto · ${archivo} · `
    + `${fechaCorta(procedencia.fecha)}`));
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

function dibujarParteDe(seccion, vista, documento) {
  if (vista.parteDe) {
    seccion.appendChild(texto(documento, "p",
      `Parte ${vista.parteDe}.`, "parte-de"));
  }
}

export function dibujarRaiz(vista, documento = document) {
  const seccion = documento.createElement("section");
  seccion.setAttribute("class", "pantalla pantalla-raiz");
  seccion.appendChild(dibujarTiraDeAnios(vista, documento));
  if (vista.miga.length > 0) {
    seccion.appendChild(dibujarMiga(vista, documento));
  }
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
    detalle.push(`${conSigno(vista.desviacion.valor)} sobre lo aprobado`);
  }
  seccion.appendChild(texto(documento, "p", detalle.join(" · "), "detalle"));
  dibujarParteDe(seccion, vista, documento);

  seccion.appendChild(dibujarTorta(vista.porciones, documento));

  seccion.appendChild(dibujarLeyenda(vista.porciones, documento));

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

  seccion.appendChild(dibujarMiga(vista, documento));

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
  dibujarParteDe(seccion, vista, documento);

  if (vista.sinEjecucion) {
    seccion.appendChild(texto(documento, "p",
      "Sin ejecución en este ejercicio.", "sin-ejecucion"));
  } else if (vista.porciones.length > 0) {
    // A leaf with real spending has no child to divide. An empty pie chart
    // and an empty legend say nothing, so draw neither.
    seccion.appendChild(dibujarTorta(vista.porciones, documento));
    seccion.appendChild(dibujarLeyenda(vista.porciones, documento));
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
      // An exercise whose build failed holds no file in this artifact, and
      // the year strip offers no arrow to it. This screen says what the
      // artifact holds, so it must not call that exercise verified.
      enEsteArtefacto: entrada.en_este_artefacto !== false,
    })),
  };
}

export function estadoDeLaFila(fila) {
  if (!fila.enEsteArtefacto) {
    return "no está en esta versión del sitio";
  }
  return fila.verificado ? "verificado" : "sin verificar";
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
    linea.appendChild(texto(documento, "td", fechaCorta(fila.publicado)));
    linea.appendChild(texto(documento, "td", estadoDeLaFila(fila)));
    tabla.appendChild(linea);
  }
  seccion.appendChild(tabla);

  seccion.appendChild(texto(documento, "p",
    "En cada corrida, el build suma el total de cada ejercicio y lo compara "
    + "con el informe oficial Cuenta Ahorro Inversión Financiamiento. El "
    + "ejercicio cuyo total no coincide no se publica, y esta tabla lo dice."));

  const volver = texto(documento, "a", "Volver al inicio", "principal");
  volver.setAttribute("href", "#/");
  seccion.appendChild(volver);

  const codigo = texto(documento, "a", "El código de este proyecto");
  codigo.setAttribute("href", REPOSITORIO);
  seccion.appendChild(codigo);
  return seccion;
}

export function vistaDeError(error) {
  return {
    mensaje: "No pudimos mostrar esta pantalla. Probá de nuevo en un rato.",
    // The technical detail helps a person who reports the fault. It is
    // English inside Spanish copy, so it sits under the message and never
    // reads as the message.
    detalle: error && error.message ? String(error.message) : null,
  };
}

export function dibujarError(vista, documento = document) {
  const seccion = documento.createElement("section");
  seccion.setAttribute("class", "pantalla pantalla-error");
  seccion.appendChild(texto(documento, "p", vista.mensaje, "error"));

  // The exit is a button and never a link to "#/". From the home route a
  // link to "#/" changes no hash, fires no event, and does nothing.
  const salida = texto(documento, "button", "Volver al inicio", "principal");
  salida.setAttribute("data-clave", "");
  seccion.appendChild(salida);

  if (vista.detalle) {
    seccion.appendChild(texto(documento, "p", vista.detalle, "detalle-tecnico"));
  }

  // Every screen of this product names where its numbers come from. This one
  // read no manifest, so it names the source and nothing more.
  const pie = documento.createElement("footer");
  pie.setAttribute("class", "procedencia");
  pie.appendChild(texto(documento, "p", "Fuente: Presupuesto Abierto"));
  const fuentes = texto(documento, "a", "De dónde salen estos números");
  fuentes.setAttribute("href", "#/fuentes");
  pie.appendChild(fuentes);
  seccion.appendChild(pie);
  return seccion;
}

export function dibujarAusente(vista, documento = document) {
  const seccion = documento.createElement("section");
  seccion.setAttribute("class", "pantalla pantalla-ausente");
  seccion.appendChild(dibujarTiraDeAnios(vista, documento));
  seccion.appendChild(dibujarMiga(vista, documento));

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
  if (vista.origen.ejercicio !== vista.ejercicio) {
    // A shared URL gives no exercise of origin, so origen falls back to the
    // one on screen. A button that returns to the exercise of the screen
    // says nothing and does nothing. The miga above is the exit there.
    const volver = texto(documento, "button",
      `Volver a ${vista.origen.ejercicio}`, "secundario");
    volver.setAttribute("data-anio", String(vista.origen.ejercicio));
    volver.setAttribute("data-clave", vista.clavePedida);
    seccion.appendChild(volver);
  }

  seccion.appendChild(dibujarProcedencia(vista.procedencia, documento));
  return seccion;
}

// ---- The views of the frame ---------------------------------------------
//
// The pila holds one level per screen, from the root to the screen on view:
// { clave, grupo, nombre, hoja, porciones, elegida }. A group "otros" is a
// level of its own, on the clave of its nodo. The rings, the breadcrumb and
// "Volver" all read the pila.

const NOMBRE_DE_LA_RAIZ = "Inicio";

function mismoGrupo(uno, otro) {
  return uno.length === otro.length && uno.every((clave, orden) => clave === otro[orden]);
}

function nivelDePila(indice, clave, grupo) {
  if (grupo) {
    return {
      clave, grupo, nombre: TITULO_DE_UN_GRUPO, hoja: false, elegida: null,
      porciones: porcionesDe(indice, grupo, "d").porciones,
    };
  }
  if (clave === "") {
    return {
      clave, grupo: null, nombre: NOMBRE_DE_LA_RAIZ, hoja: false, elegida: null,
      porciones: porcionesDe(indice, raices(indice), "d").porciones,
    };
  }
  const nodo = indice[clave];
  // A nodo of level 9 lists object codes whose file may be absent. A child
  // that is not in the index is not a part.
  const hijos = hijosDe(indice, clave).filter((hijo) => indice[hijo]);
  if (hijos.length === 0) {
    // The last level: one full ring and one row, the nodo itself (UC-02).
    return {
      clave, grupo: null, nombre: nodo.n, hoja: true, elegida: null,
      porciones: nodo.d > 0
        ? [{ nombre: nodo.n, monto: nodo.d, parte: 1, esOtros: false, destino: [clave] }]
        : [],
    };
  }
  return {
    clave, grupo: null, nombre: nodo.n, hoja: false, elegida: null,
    porciones: porcionesDe(indice, hijos, "d").porciones,
  };
}

export function pilaDe(indice, clave, grupos = []) {
  // Walk down from the root through the parts, as a visitor taps them. A
  // clave inside a group "otros" passes through that group.
  const pila = [nivelDePila(indice, "", null)];
  for (;;) {
    const arriba = pila.at(-1);
    if (arriba.clave === clave && !arriba.grupo) {
      break;
    }
    const orden = arriba.porciones
      .findIndex((porcion) => porcion.destino.some((destino) => contiene(destino, clave)));
    const porcion = arriba.porciones[orden];
    const siguiente = porcion && !porcion.esOtros
      ? saltarHijoUnico(indice, porcion.destino[0])
      : arriba.clave;
    if (!porcion || !contiene(siguiente, clave)) {
      // No part leads there: a group with no spending, or a clave that the
      // walk cannot reach. Show the clave itself, with no lit arc above it.
      pila.push(nivelDePila(indice, clave, null));
      break;
    }
    arriba.elegida = orden;
    pila.push(nivelDePila(indice, siguiente, porcion.esOtros ? porcion.destino : null));
  }
  // The groups that the visitor opened over the nodo, in order. A group that
  // the data no longer has ends the walk, and rutaDePila then drops it.
  for (const grupo of grupos) {
    const arriba = pila.at(-1);
    const orden = arriba.porciones
      .findIndex((porcion) => porcion.esOtros && mismoGrupo(porcion.destino, grupo));
    if (orden === -1) {
      break;
    }
    arriba.elegida = orden;
    pila.push(nivelDePila(indice, arriba.clave, arriba.porciones[orden].destino));
  }
  return pila;
}

export function rutaDePila(pila) {
  // The inverse of pilaDe: the last level that is not a group gives the
  // clave, and the groups above it give grupos.
  let ultimo = pila.length - 1;
  while (pila[ultimo].grupo) {
    ultimo -= 1;
  }
  return { clave: pila[ultimo].clave, grupos: pila.slice(ultimo + 1).map((nivel) => nivel.grupo) };
}

export function aniosVecinos(disponibles, ejercicio) {
  // R11: the arrow at an end has no year, and the screen disables it.
  const orden = disponibles.indexOf(ejercicio);
  return {
    anterior: orden > 0 ? disponibles[orden - 1] : null,
    siguiente: orden !== -1 && orden < disponibles.length - 1 ? disponibles[orden + 1] : null,
  };
}

export function lineaDeDetalle(vista) {
  // R18: the part of the total, the execution and the deviation. A group
  // "otros" has only the part of the total.
  const partes = [];
  if (vista.parteDelTotal !== null) {
    partes.push(`${porcentaje(vista.parteDelTotal)} del gasto total`);
  }
  if (vista.ejecucion !== null) {
    partes.push(`${porcentaje(vista.ejecucion)} de lo autorizado`);
  }
  if (vista.desviacion) {
    const palabra = PALABRA_DE_LA_DESVIACION[vista.desviacion.tipo];
    partes.push(`${conSigno(vista.desviacion.valor)} ${palabra}`);
  }
  return partes.join(" · ");
}

export function vistaDeNavegador(estado, pila) {
  const { indice, ejercicio, disponibles } = estado;
  const arriba = pila.at(-1);
  const enLaRaiz = arriba.clave === "";
  const base = enLaRaiz
    ? vistaDeRaiz(estado, arriba.grupo)
    : vistaDeNodo(estado, arriba.clave, arriba.grupo);
  const deQuien = enLaRaiz ? "del Estado nacional" : `de ${indice[arriba.clave].n}`;
  let nodo = enLaRaiz ? null : indice[arriba.clave].n;
  if (arriba.grupo) {
    nodo = `el grupo otros ${deQuien}`;
  }
  let subtitulo = "";
  if (arriba.grupo) {
    subtitulo = `Parte ${base.parteDe}.`;
  } else if (enLaRaiz) {
    // R8: the measure is named here and in the foot of the tape only.
    subtitulo = `Crédito devengado del ejercicio ${ejercicio}, por jurisdicción`;
  }
  let mensajeVacio = null;
  if (arriba.porciones.length === 0) {
    mensajeVacio = arriba.grupo
      ? `Estas partidas no gastaron nada en ${ejercicio}.`
      : `Este nivel no gastó nada en ${ejercicio}.`;
  }
  return {
    ...base,
    porciones: arriba.porciones,
    hoja: arriba.hoja,
    nivel: pila.length - 1,
    pila,
    miga: migaCorta(pila.map((nivel) => nivel.nombre)),
    ...aniosVecinos(disponibles, ejercicio),
    subtitulo,
    detalle: lineaDeDetalle(base),
    rotulo: enLaRaiz && !arriba.grupo ? `Total devengado ${ejercicio}` : "Suma de estas partidas",
    mensajeVacio,
    frase: fraseDe({
      anio: ejercicio,
      nodo,
      // The last level shows the nodo itself as its one part. The sentence
      // compares that nodo with the national total instead.
      porciones: arriba.hoja ? [] : arriba.porciones,
      total: base.total,
      totalNacional: totalDe(indice, raices(indice), "d"),
    }),
    escena: escenaDe(pila),
  };
}

// ---- The painters of the frame --------------------------------------------
//
// index.html holds the frame once: the top bar, the chart pane and the tape
// pane. A painter writes the parts of the frame for one place, and it holds
// no decision. Every part is found by its id.

const FUENTE_SIN_DATOS = "Fuente: Presupuesto Abierto";

const METODO = [
  "Los datos son de Presupuesto Abierto, del Ministerio de Economía de la "
  + "Nación, bajo licencia CC BY 4.0. Este proyecto lee los mismos archivos "
  + "que ofrece la página oficial de datos abiertos. Las URLs son idénticas.",
  "En cada corrida, el build suma el total de cada ejercicio y lo compara "
  + "con el informe oficial Cuenta Ahorro Inversión Financiamiento. El "
  + "ejercicio cuyo total no coincide no se publica, y esta tabla lo dice.",
];

function parte(documento, id) {
  return documento.getElementById(id);
}

function vaciar(elemento) {
  while (elemento.firstChild) {
    elemento.removeChild(elemento.firstChild);
  }
}

function escribir(documento, id, contenido) {
  const elemento = parte(documento, id);
  elemento.textContent = contenido;
  elemento.hidden = contenido === "";
  return elemento;
}

function boton(documento, contenido, clase) {
  const elemento = texto(documento, "button", contenido, clase);
  elemento.setAttribute("type", "button");
  return elemento;
}

function pasoDeMiga(documento, tramo, oculto) {
  // A crumb stays a control inside its <li>, as in the navigator before.
  const item = documento.createElement("li");
  item.hidden = oculto;
  const control = boton(documento, tramo.nombre, "tramo");
  control.setAttribute("data-subir", String(tramo.nivel));
  item.appendChild(control);
  return item;
}

export function pintarBarra(documento, barra) {
  // W2: one top bar on every place. A place with no exercise passes null.
  parte(documento, "anio").textContent = barra.ejercicio === null ? "" : String(barra.ejercicio);
  for (const [id, anio] of [["anio-anterior", barra.anterior], ["anio-siguiente", barra.siguiente]]) {
    const flecha = parte(documento, id);
    flecha.disabled = anio === null;
    flecha.setAttribute("data-anio", anio === null ? "" : String(anio));
  }
  const miga = parte(documento, "miga");
  vaciar(miga);
  miga.hidden = barra.miga.length === 0;
  if (miga.hidden) {
    return;
  }
  const lista = documento.createElement("ol");
  for (const tramo of barra.miga) {
    if (!tramo.ocultos) {
      lista.appendChild(pasoDeMiga(documento, tramo, false));
      continue;
    }
    // A4: "…" opens the hidden levels in place. They wait after it, hidden.
    const puntos = documento.createElement("li");
    puntos.setAttribute("class", "puntos");
    const abrir = boton(documento, "…", "tramo");
    abrir.setAttribute("data-expandir", "");
    abrir.setAttribute("aria-label", `Mostrar ${tramo.ocultos.length} niveles intermedios`);
    puntos.appendChild(abrir);
    lista.appendChild(puntos);
    for (const oculto of tramo.ocultos) {
      lista.appendChild(pasoDeMiga(documento, oculto, true));
    }
  }
  miga.appendChild(lista);
}

export function expandirMiga(control) {
  // The browser runs this, and the walk of the plan checks it: the fake
  // document of the tests has no querySelectorAll.
  const puntos = control.closest("li");
  const ocultos = [...puntos.parentElement.querySelectorAll("li[hidden]")];
  for (const item of ocultos) {
    item.hidden = false;
  }
  puntos.hidden = true;
  ocultos[0]?.querySelector("button")?.focus();
}

function pintarGrafico(documento, {
  volver = null, titulo, frase = null, subtitulo = "", detalle = "", notas = [],
  acciones = [], anillos = null, disco = null,
}) {
  const controlVolver = parte(documento, "volver");
  const teniaElFoco = documento.activeElement === controlVolver;
  controlVolver.hidden = volver === null;
  if (volver !== null) {
    controlVolver.setAttribute("data-subir", String(volver));
  }
  const encabezado = parte(documento, "titulo");
  encabezado.textContent = titulo;
  if (controlVolver.hidden && teniaElFoco) {
    // R21: a control that disappears must not take the focus with it.
    encabezado.focus();
  }

  const oracion = parte(documento, "frase");
  vaciar(oracion);
  oracion.hidden = frase === null;
  if (frase) {
    // The amount goes in bold, and every piece goes in as text.
    oracion.appendChild(texto(documento, "span", frase.antes));
    oracion.appendChild(texto(documento, "b", frase.cifra));
    oracion.appendChild(texto(documento, "span", frase.despues));
  }
  escribir(documento, "subtitulo", subtitulo);
  escribir(documento, "detalle", detalle);

  const nota = parte(documento, "nota");
  vaciar(nota);
  nota.hidden = notas.length === 0;
  for (const linea of notas) {
    nota.appendChild(texto(documento, "p", linea));
  }
  const lugar = parte(documento, "acciones");
  vaciar(lugar);
  lugar.hidden = acciones.length === 0;
  for (const accion of acciones) {
    lugar.appendChild(accion);
  }

  // A screen with no rings must not keep the rings of the screen before it.
  parte(documento, "anillos").innerHTML = "";
  parte(documento, "disco-numero").textContent = "";
  parte(documento, "disco-unidad").textContent = "";
  parte(documento, "caja").hidden = anillos === null;
  if (anillos !== null) {
    parte(documento, "anillos").innerHTML = svgDeEscena(anillos);
    const { numero, unidad } = disco ?? { numero: "", unidad: "" };
    parte(documento, "disco-numero").textContent = numero;
    parte(documento, "disco-unidad").textContent = unidad;
  }
}

function pintarRenglones(documento, porciones, { hoja = false, mensajeVacio = null } = {}) {
  const lugar = parte(documento, "renglones");
  vaciar(lugar);
  if (mensajeVacio) {
    lugar.appendChild(texto(documento, "p", mensajeVacio, "vacio"));
    return;
  }
  if (porciones.length === 0) {
    return;
  }
  const lista = documento.createElement("ul");
  porciones.forEach((porcion, orden) => {
    const item = documento.createElement("li");
    item.setAttribute("class", "imprime");
    // R5: the rows print in from the top, 30ms apart.
    item.setAttribute("style", `animation-delay:${orden * 30}ms`);
    const nombre = porcion.esOtros ? `Otros (${porcion.destino.length})` : porcion.nombre;
    // A row of the last level opens nothing, so it is not a control.
    const fila = documento.createElement(hoja ? "div" : "button");
    fila.setAttribute("class", "fila");
    if (!hoja) {
      fila.setAttribute("type", "button");
      fila.setAttribute("data-abrir", String(orden));
      fila.setAttribute("aria-label",
        `${nombre}, ${porcentaje(porcion.parte)}, ${montoCorto(porcion.monto)}`);
    }
    const muestra = documento.createElement("span");
    muestra.setAttribute("class", "muestra");
    muestra.setAttribute("style", `background:${colorDe(porcion, orden, porciones.length)}`);
    fila.appendChild(muestra);
    fila.appendChild(texto(documento, "span", nombre, "nombre"));
    fila.appendChild(texto(documento, "span", porcentaje(porcion.parte), "pct"));
    fila.appendChild(texto(documento, "span", montoCorto(porcion.monto), "corto"));
    item.appendChild(fila);
    lista.appendChild(item);
  });
  lugar.appendChild(lista);
}

function textoDeFuente(procedencia) {
  const archivo = procedencia.archivo.split("/").pop();
  return "Fuente: Presupuesto Abierto, Ministerio de Economía. Crédito devengado, "
    + `publicado el ${fechaCorta(procedencia.fecha)} en ${archivo}.`;
}

function textoDeCodigos(procedencia) {
  if (!procedencia.codigos) {
    return "";
  }
  return procedencia.codigos.map(({ eje, codigo }) => `${eje}_id=${codigo}`).join(" · ");
}

function pintarPie(documento, { cuenta = null, fuente, codigos = "", archivo = null }) {
  // INV-03: the source is always visible at the foot of the tape. W3: the
  // link to P4 and the codes of the last level stay.
  parte(documento, "pie").hidden = false;
  // A screen with no rows to sum must not keep the sum of the screen before
  // it.
  parte(documento, "rotulo").textContent = "";
  parte(documento, "total").textContent = "";
  parte(documento, "total-texto").textContent = "";
  parte(documento, "cuenta").hidden = cuenta === null;
  if (cuenta) {
    parte(documento, "rotulo").textContent = cuenta.rotulo;
    parte(documento, "total").textContent = montoLargo(cuenta.total);
    parte(documento, "total-texto").textContent = `${montoLargo(cuenta.total)} pesos`;
  }
  escribir(documento, "fuente", fuente);
  escribir(documento, "codigos", codigos);
  const descargar = parte(documento, "descargar");
  // Same rule: a screen with no file to offer must not keep the link of the
  // screen before it.
  descargar.removeAttribute("href");
  descargar.hidden = archivo === null;
  if (archivo !== null) {
    descargar.setAttribute("href", archivo);
  }
}

export function pintarNavegador(documento, vista) {
  // P1 and P2. vista comes from vistaDeNavegador; app.js adds nota.
  pintarBarra(documento, vista);
  pintarGrafico(documento, {
    volver: vista.nivel > 0 ? vista.nivel - 1 : null,
    titulo: vista.titulo,
    frase: vista.frase,
    subtitulo: vista.subtitulo,
    detalle: vista.detalle,
    notas: vista.nota ? [vista.nota] : [],
    anillos: vista.escena,
    disco: partesDelMonto(vista.total),
  });
  pintarRenglones(documento, vista.porciones, vista);
  pintarPie(documento, {
    cuenta: { rotulo: vista.rotulo, total: vista.total },
    fuente: textoDeFuente(vista.procedencia),
    codigos: textoDeCodigos(vista.procedencia),
    archivo: vista.procedencia.archivo,
  });
}

export function pintarAusente(documento, vista) {
  // P2b. W12: no "Volver", because its two exits already go up and back.
  pintarBarra(documento, vista);
  const acciones = [];
  if (vista.ancestro !== null) {
    const subir = boton(documento, "Subir al nivel que sí existe", "principal");
    subir.setAttribute("data-clave", vista.ancestro);
    acciones.push(subir);
  }
  if (vista.origen.ejercicio !== vista.ejercicio) {
    // A shared link gives no exercise of origin. A button back to the year
    // on screen would do nothing, so the breadcrumb is the exit there.
    const volver = boton(documento, `Volver a ${vista.origen.ejercicio}`, "secundario");
    volver.setAttribute("data-anio", String(vista.origen.ejercicio));
    acciones.push(volver);
  }
  pintarGrafico(documento, { titulo: vista.nombre, notas: vista.lineas, acciones, anillos: [] });
  pintarRenglones(documento, []);
  pintarPie(documento, { fuente: textoDeFuente(vista.procedencia), archivo: vista.procedencia.archivo });
}

export function pintarFuentes(documento, vista) {
  // P4. W13: the method in the chart pane, the table of files in the tape.
  pintarBarra(documento, { ejercicio: null, anterior: null, siguiente: null, miga: [] });
  const inicio = boton(documento, "Volver al inicio", "principal");
  inicio.setAttribute("data-clave", "");
  const codigo = texto(documento, "a", "El código de este proyecto");
  codigo.setAttribute("href", REPOSITORIO);
  pintarGrafico(documento, {
    titulo: "De dónde salen estos números", notas: METODO, acciones: [inicio, codigo],
  });

  const lugar = parte(documento, "renglones");
  vaciar(lugar);
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
    linea.appendChild(texto(documento, "td", fechaCorta(fila.publicado)));
    linea.appendChild(texto(documento, "td", estadoDeLaFila(fila)));
    tabla.appendChild(linea);
  }
  lugar.appendChild(tabla);
  // This place is the source itself.
  parte(documento, "pie").hidden = true;
}

export function pintarError(documento, vista) {
  pintarBarra(documento, { ejercicio: null, anterior: null, siguiente: null, miga: [] });
  // The exit is a button and never a link to "#/". From the home route a
  // link to "#/" changes nothing, and it does nothing.
  const inicio = boton(documento, "Volver al inicio", "principal");
  inicio.setAttribute("data-clave", "");
  const fuentes = texto(documento, "a", "De dónde salen estos números");
  fuentes.setAttribute("href", RUTA_DE_FUENTES);
  fuentes.setAttribute("data-fuentes", "");
  pintarGrafico(documento, {
    titulo: vista.mensaje,
    // The technical detail helps a person who reports the fault.
    notas: vista.detalle ? [vista.detalle] : [],
    acciones: [inicio, fuentes],
  });
  pintarRenglones(documento, []);
  // This screen read no manifest, so it names the source and nothing more.
  pintarPie(documento, { fuente: FUENTE_SIN_DATOS });
}
