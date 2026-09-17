import test from "node:test";
import assert from "node:assert/strict";

import {
  angulosDe, caminoDeAnillo, colorDe, desdeCero, escenaDe, interpolar,
  OPACIDAD_TENUE, RADIOS, svgDeEscena, tamanioDelDisco, VUELTA,
} from "../site/app/anillos.js";

const parte = (nombre, valor, destino, esOtros = false) => ({
  nombre, monto: valor * 100, parte: valor, esOtros, destino,
});

// The root: two parts and a group "otros". Every share is a power of two,
// so every angle is exact in binary.
const RAIZ = [
  parte("Capital Humano", 0.5, ["1"]),
  parte("Deuda", 0.25, ["2"]),
  parte("otros", 0.25, ["3", "4"], true),
];
const NIVEL_1 = [parte("Educacion", 0.75, ["1-1"]), parte("Salud", 0.25, ["1-2"])];
const NIVEL_2 = [parte("Becas", 0.5, ["1-1-1"]), parte("Escuelas", 0.5, ["1-1-2"])];
const NIVEL_3 = [parte("Norte", 1, ["1-1-1-1"])];

const nivel = (porciones, elegida = null, hoja = false) => ({ porciones, elegida, hoja });

function cerca(real, esperado, mensaje) {
  assert.ok(Math.abs(real - esperado) < 1e-9, `${mensaje}: ${real} != ${esperado}`);
}

const buscar = (arcos, llave) => arcos.find((arco) => arco.llave === llave);

test("los angulos empiezan a las doce y suman una vuelta", () => {
  const angulos = angulosDe(RAIZ);
  cerca(angulos[0].a0, 0, "the first part starts at 12 o'clock");
  cerca(angulos[0].a1, Math.PI, "half of the total is half a turn");
  cerca(angulos[1].a1, 1.5 * Math.PI, "clockwise, one part after the other");
  cerca(angulos[2].a1, VUELTA, "the parts add up to one turn");
});

test("un cuarto de anillo es un arco afuera, una recta y un arco adentro", () => {
  assert.equal(caminoDeAnillo({ r0: 0.5, r1: 1, a0: 0, a1: Math.PI / 2 }),
    "M0 -1A1 1 0 0 1 1 0L0.5 0A0.5 0.5 0 0 0 0 -0.5Z");
});

test("un arco de mas de media vuelta lleva la bandera del arco grande", () => {
  assert.equal(caminoDeAnillo({ r0: 0.5, r1: 1, a0: 0, a1: 0.6 * VUELTA }),
    "M0 -1A1 1 0 1 1 -0.58779 0.80902L-0.29389 0.40451A0.5 0.5 0 1 0 0 -0.5Z");
});

test("una sola parte dibuja un anillo entero", () => {
  // An arc from a point to the same point draws nothing, so a full turn is
  // two half turns outside and two half turns inside.
  assert.equal(caminoDeAnillo({ r0: 0.44, r1: 0.8, a0: 0, a1: VUELTA }),
    "M0 -0.8A0.8 0.8 0 1 1 0 0.8A0.8 0.8 0 1 1 0 -0.8Z"
    + "M0 -0.44A0.44 0.44 0 1 0 0 0.44A0.44 0.44 0 1 0 0 -0.44Z");
});

test("un arco sin abertura o sin grosor no dibuja nada", () => {
  assert.equal(caminoDeAnillo({ r0: 0.5, r1: 1, a0: 1, a1: 1 }), "");
  assert.equal(caminoDeAnillo({ r0: 0.8, r1: 0.8, a0: 0, a1: 1 }), "");
});

test("los colores empiezan en cada nivel y otros es neutro", () => {
  assert.equal(colorDe(RAIZ[0], 0, 3), "var(--c0)");
  assert.equal(colorDe(RAIZ[1], 1, 3), "var(--c1)");
  assert.equal(colorDe(RAIZ[2], 2, 3), "var(--otros)");
  assert.equal(colorDe(NIVEL_1[0], 0, 2), "var(--c0)", "W14: no hue from the parent");
});

test("la ultima parte no repite el color de la primera", () => {
  // Eight parts and no "otros": the eighth part touches the first one.
  assert.equal(colorDe(parte("Octava", 0.1, ["8"]), 7, 8), "var(--c1)");
  assert.equal(colorDe(parte("Octava", 0.1, ["8"]), 7, 9), "var(--c0)",
    "with a ninth part, the eighth touches no first part");
});

test("la escena de la raiz es un solo anillo que abre cada parte", () => {
  const arcos = escenaDe([nivel(RAIZ)]);
  assert.equal(arcos.length, 3);
  assert.deepEqual(arcos.map((arco) => arco.rol), ["principal", "principal", "principal"]);
  assert.deepEqual(arcos.map((arco) => arco.abrir), [0, 1, 2]);
  assert.deepEqual(arcos.map((arco) => arco.subir), [null, null, null]);
  assert.deepEqual([arcos[0].r0, arcos[0].r1], RADIOS.principal);
});

test("la escena de un nodo enciende el arco del camino en el anillo fino", () => {
  const arcos = escenaDe([nivel(RAIZ, 0), nivel(NIVEL_1)]);
  const principal = arcos.filter((arco) => arco.rol === "principal");
  const previo = arcos.filter((arco) => arco.rol === "previo");
  assert.deepEqual(principal.map((arco) => arco.llave), ["1:1-1", "1:1-2"]);
  assert.equal(previo.length, 3);
  assert.equal(arcos.filter((arco) => arco.rol === "primero").length, 0,
    "the hairline ring starts at depth 2");
  const encendido = buscar(arcos, "0:1");
  assert.equal(encendido.opacidad, 1);
  assert.equal(encendido.subir, 0, "the lit arc goes to the previous level");
  assert.equal(encendido.abrir, null);
  assert.equal(encendido.color, "var(--c0)", "W14: the lit arc keeps its colour");
  const tenue = buscar(arcos, "0:2");
  assert.equal(tenue.opacidad, OPACIDAD_TENUE);
  assert.equal(tenue.subir, null, "W7: a dim arc goes nowhere");
});

test("el anillo fino va al nivel previo y el de un pelo al nivel 1", () => {
  const arcos = escenaDe([
    nivel(RAIZ, 0), nivel(NIVEL_1, 0), nivel(NIVEL_2, 0), nivel(NIVEL_3, null, true),
  ]);
  assert.equal(buscar(arcos, "2:1-1-1").rol, "previo");
  assert.equal(buscar(arcos, "2:1-1-1").subir, 2);
  assert.equal(buscar(arcos, "0:1").rol, "primero");
  assert.equal(buscar(arcos, "0:1").subir, 1);
  assert.equal(arcos.filter((arco) => arco.nivel === 1).length, 0,
    "the rings between level 1 and the previous level do not draw");
});

test("la parte del ultimo nivel no abre nada", () => {
  const arcos = escenaDe([nivel(RAIZ, 0), nivel(NIVEL_3, null, true)]);
  const principal = arcos.filter((arco) => arco.rol === "principal");
  assert.equal(principal.length, 1);
  assert.equal(principal[0].abrir, null);
  cerca(principal[0].a1, VUELTA, "one part is one full ring");
});

test("bajar empieza en la escena de antes y termina en la de despues", () => {
  const antes = escenaDe([nivel(RAIZ)]);
  const despues = escenaDe([nivel(RAIZ, 0), nivel(NIVEL_1)]);
  const paso = interpolar(antes, despues);

  const alInicio = paso(0);
  const tocada = buscar(alInicio, "0:1");
  assert.deepEqual([tocada.r0, tocada.r1], RADIOS.principal);
  cerca(tocada.a1, Math.PI, "the tapped part starts where it was");
  const hija = buscar(alInicio, "1:1-1");
  assert.deepEqual([hija.r0, hija.r1], RADIOS.principal);
  cerca(hija.a0, 0, "the child is born inside the angle of its parent");
  cerca(hija.a1, 0.75 * Math.PI, "75% of a part of half a turn");

  const alFinal = paso(1);
  cerca(buscar(alFinal, "0:1").r0, RADIOS.previo[0], "the old main ring moves out");
  cerca(buscar(alFinal, "0:1").r1, RADIOS.previo[1], "and it gets thin");
  cerca(buscar(alFinal, "1:1-1").a1, 1.5 * Math.PI, "the child fills its share of the ring");
  assert.ok(alFinal.every((arco) => arco.abrir === null && arco.subir === null),
    "an arc in motion carries no destination");
});

test("subir es el mismo movimiento al reves", () => {
  const antes = escenaDe([nivel(RAIZ, 0), nivel(NIVEL_1)]);
  const despues = escenaDe([nivel(RAIZ)]);
  const alFinal = interpolar(antes, despues)(1);
  const hija = buscar(alFinal, "1:1-1");
  cerca(hija.a1, 0.75 * Math.PI, "the child goes back into the angle of its parent");
  cerca(hija.r1, RADIOS.principal[1], "at the radii of the main ring");
  cerca(buscar(alFinal, "0:1").r0, RADIOS.principal[0], "the parent is the main ring again");
});

test("en la primera carga el anillo crece desde las doce", () => {
  const arcos = escenaDe([nivel(RAIZ)]);
  const mitad = interpolar(desdeCero(arcos), arcos)(0.5);
  cerca(mitad[0].a1, Math.PI / 2, "half of the motion, half of the angle");
  cerca(mitad[1].a0, Math.PI / 2, "every arc grows from 12 o'clock");
});

test("el svg da un area de toque y un destino a cada arco que navega", () => {
  const svg = svgDeEscena(escenaDe([nivel(RAIZ, 0), nivel(NIVEL_1)]));
  // Two parts of the main ring and one lit arc navigate. The two dim arcs
  // of the thin ring do not.
  assert.equal(svg.match(/class="golpe"/g).length, 3);
  assert.equal(svg.match(/data-abrir="\d"/g).length, 4, "a hit area and an arc per part");
  assert.equal(svg.match(/data-subir="0"/g).length, 2);
  assert.equal(svg.match(/ ciego"/g).length, 2);
  assert.match(svg, /vector-effect="non-scaling-stroke"/, "R3: the hit area is in screen pixels");
});

test("un nivel sin partes dibuja un anillo vacio", () => {
  const svg = svgDeEscena(escenaDe([nivel([])]));
  assert.ok(svg.startsWith('<path class="contorno"'));
});

test("el texto del disco entra en el agujero con un margen del 12%", () => {
  // A block of 300 by 400 px at 100 px has a diagonal of 500 px. A radius
  // of 100 px leaves a circle of 176 px across, so 100 * 176 / 500 = 35.2.
  cerca(tamanioDelDisco({ ancho: 300, alto: 400, radio: 100 }), 35.2, "the size");
  assert.equal(tamanioDelDisco({ ancho: 300, alto: 400, radio: 1000 }), 56, "a cap");
  assert.equal(tamanioDelDisco({ ancho: 0, alto: 0, radio: 100 }), null,
    "a block that is not on screen has no size");
});
