// The difference between what the state spent and what the Congress approved.
//
// The same arithmetic names two different facts, and the level decides which.
// At the level of the proyecto and above, the credito vigente is a legal
// limit. The difference then says the state spent differently from the vote
// of the Congress. Below that level the number is an internal distribution,
// and money moves between the actividades of one proyecto.
//
// Measured on the exercise 2025: 0 exceptions in 2,673 nodos at the proyecto
// level and above, and 12.7% of the actividades break it. Of the 303
// actividades that pass their own vigente, the parent proyecto respects its
// limit in 303 of 303 cases.
//
// The two values of the type stop a screen from showing one and naming it the
// other.

import { nivelDe } from "./arbol.js";

export const NIVEL_DE_CONTROL = 7;
export const SOBRE_LO_APROBADO = "sobre-lo-aprobado";
export const REASIGNACION_INTERNA = "reasignacion-interna";

export function desviacionDe(nodo, clave) {
  if (!nodo || !nodo.p) {
    return null;
  }
  const tipo = nivelDe(clave) <= NIVEL_DE_CONTROL
    ? SOBRE_LO_APROBADO
    : REASIGNACION_INTERNA;
  return { valor: nodo.d / nodo.p - 1, tipo };
}

export function ejecucionDe(nodo) {
  if (!nodo || !nodo.v) {
    return null;
  }
  return nodo.d / nodo.v;
}
