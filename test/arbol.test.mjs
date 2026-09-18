import test from "node:test";
import assert from "node:assert/strict";

import {
  hijosDe, llano, migaCorta, nivelDe, raices, saltarHijoUnico, totalDe,
} from "../site/app/arbol.js";

// Two jurisdicciones. The 45 is a chain of one child, three levels deep.
const INDICE = {
  "88": { n: "Capital Humano", d: 66, p: 50, v: 70, g: 60, k: ["1", "2"] },
  "88-1": { n: "ANSES", d: 55, p: 40, v: 58, g: 50, k: [] },
  "88-2": { n: "Educacion", d: 11, p: 10, v: 12, g: 10, k: [] },
  "45": { n: "Defensa", d: 31, p: 30, v: 33, g: 30, k: ["1"] },
  "45-1": { n: "Defensa", d: 31, p: 30, v: 33, g: 30, k: ["0"] },
  "45-1-0": { n: "Defensa", d: 31, p: 30, v: 33, g: 30, k: ["7", "8"] },
  "45-1-0-7": { n: "Curso", d: 20, p: 20, v: 21, g: 20, k: [] },
  "45-1-0-8": { n: "Taller", d: 11, p: 10, v: 12, g: 10, k: [] },
};

test("el nivel es el largo del camino", () => {
  assert.equal(nivelDe("88"), 1);
  assert.equal(nivelDe("45-1-0-7"), 4);
  assert.equal(nivelDe(""), 0);
});

test("las raices son las claves sin guion", () => {
  assert.deepEqual(raices(INDICE).sort(), ["45", "88"]);
});

test("los hijos llevan el camino completo", () => {
  assert.deepEqual(hijosDe(INDICE, "88"), ["88-1", "88-2"]);
  assert.deepEqual(hijosDe(INDICE, "88-1"), []);
});

test("salta la cadena hasta el nodo que divide", () => {
  assert.equal(saltarHijoUnico(INDICE, "45"), "45-1-0");
});

test("no salta cuando el nodo ya divide", () => {
  assert.equal(saltarHijoUnico(INDICE, "88"), "88");
});

test("se detiene en el nodo cuyo unico hijo falta en el indice", () => {
  // "9" declares one child in k, but "9-1" holds no entry. The walk must
  // stay on "9", or it hands back a clave with no nodo behind it.
  const conHijoAusente = {
    "9": { n: "Solitario", d: 5, p: 5, v: 5, g: 0, k: ["1"] },
  };
  assert.equal(saltarHijoUnico(conHijoAusente, "9"), "9");
});

test("el total suma la medida que se pide", () => {
  assert.equal(totalDe(INDICE, raices(INDICE), "d"), 97);
  assert.equal(totalDe(INDICE, raices(INDICE), "p"), 80);
});

const CAMINO = [
  "", "Ministerio de Capital Humano", "Secretaría de Educación",
  "Desarrollo de la Educación Superior", "Becas", "Becas Progresar", "Norte",
];

const miga = (profundidad) => migaCorta(CAMINO.slice(0, profundidad + 1));

test("la raiz no tiene miga y el nivel 1 solo tiene Inicio", () => {
  assert.deepEqual(miga(0), []);
  assert.deepEqual(miga(1), [{ nivel: 0, nombre: "Inicio" }]);
});

test("la miga nombra el nivel 1 y el previo, y nunca el actual", () => {
  assert.deepEqual(miga(2), [
    { nivel: 0, nombre: "Inicio" },
    { nivel: 1, nombre: "Ministerio de Capital Humano" },
  ]);
  assert.deepEqual(miga(3), [
    { nivel: 0, nombre: "Inicio" },
    { nivel: 1, nombre: "Ministerio de Capital Humano" },
    { nivel: 2, nombre: "Secretaría de Educación" },
  ]);
});

test("los niveles del medio van detras de los puntos suspensivos", () => {
  assert.deepEqual(miga(4), [
    { nivel: 0, nombre: "Inicio" },
    { nivel: 1, nombre: "Ministerio de Capital Humano" },
    { ocultos: [{ nivel: 2, nombre: "Secretaría de Educación" }] },
    { nivel: 3, nombre: "Desarrollo de la Educación Superior" },
  ]);
  assert.deepEqual(miga(6).map((tramo) => tramo.nombre ?? tramo.ocultos.length),
    ["Inicio", "Ministerio de Capital Humano", 3, "Becas Progresar"]);
  assert.deepEqual(miga(5)[2].ocultos.map((tramo) => tramo.nivel), [2, 3]);
});

test("dos nombres que difieren en acentos o mayusculas son un tramo", () => {
  const nombres = ["", "SALUD", "Salud", "Educacion", "Educación", "Becas"];
  // "SALUD" joins "Salud", and "Educacion" joins "Educación". The deeper
  // crumb stays, because it points nearer to the screen on view.
  assert.deepEqual(migaCorta(nombres), [
    { nivel: 0, nombre: "Inicio" },
    { nivel: 2, nombre: "Salud" },
    { nivel: 4, nombre: "Educación" },
  ]);
  assert.equal(llano("Educación"), llano("EDUCACION"));
});

test("el nivel previo queda aunque se llame como la pantalla", () => {
  assert.deepEqual(migaCorta(["", "Defensa", "Defensa"]).map((tramo) => tramo.nivel),
    [0, 1]);
});
