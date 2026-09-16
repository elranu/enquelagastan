// Turn the data of one exercise into what a screen says, and then into
// elements.
//
// Every decision lives in the functions that give a view. The functions that
// draw hold no decision, so a test reads a view without a browser.

import {
  hijosDe, migaDePan, nivelDe, NIVELES_INSTITUCIONALES, raices, saltarHijoUnico,
  totalDe,
} from "./arbol.js";
import { cargarObjeto } from "./datos.js";
import { desviacionDe, ejecucionDe, REASIGNACION_INTERNA, SOBRE_LO_APROBADO }
  from "./desviacion.js";
import { conSigno, fechaCorta, montoCorto, montoLargo, porcentaje }
  from "./formato.js";
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
  const hijos = hijosDe(indice, clave);
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
