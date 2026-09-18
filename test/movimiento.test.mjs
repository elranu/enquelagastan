import test from "node:test";
import assert from "node:assert/strict";

import {
  cifrasDe, crearMotor, DURACION, htmlDelOdometro, ruedasDelOdometro, suavizar,
} from "../site/app/movimiento.js";

// A clock that moves only when the test says so.
function reloj() {
  const cola = [];
  let tiempo = 0;
  return {
    cuadro: (funcion) => { cola.push(funcion); },
    ahora: () => tiempo,
    avanzar(ms) {
      tiempo += ms;
      for (const funcion of cola.splice(0)) {
        funcion(tiempo);
      }
    },
  };
}

test("un paso dura entre 450 y 550 ms", () => {
  assert.ok(DURACION >= 450 && DURACION <= 550);
});

test("la curva es cubic-bezier(0.23, 1, 0.32, 1)", () => {
  assert.equal(suavizar(0), 0);
  assert.equal(suavizar(1), 1);
  // The value of the CSS curve at half the time, from a bisection of 200
  // steps outside this module. A curve of 1 - (1 - t)^4 gives 0.9375 here.
  assert.ok(Math.abs(suavizar(0.5) - 0.96598) < 1e-5, String(suavizar(0.5)));
  assert.ok(Math.abs(suavizar(0.1) - 0.39812) < 1e-5, String(suavizar(0.1)));
});

test("el motor sigue el reloj y termina en uno", () => {
  const tiempo = reloj();
  const motor = crearMotor(tiempo);
  const pasos = [];
  let fines = 0;
  motor.animar({ duracion: 500, paso: (t) => pasos.push(t), fin: () => { fines += 1; } });
  tiempo.avanzar(250);
  assert.ok(Math.abs(pasos.at(-1) - suavizar(0.5)) < 1e-12);
  assert.equal(motor.activo(), true);
  tiempo.avanzar(250);
  assert.equal(pasos.at(-1), 1);
  assert.equal(fines, 1);
  assert.equal(motor.activo(), false);
});

test("un toque nuevo termina el movimiento en curso de inmediato", () => {
  const tiempo = reloj();
  const motor = crearMotor(tiempo);
  const orden = [];
  motor.animar({ paso: () => orden.push("paso A"), fin: () => orden.push("fin A") });
  tiempo.avanzar(100);
  motor.animar({ paso: () => orden.push("paso B"), fin: () => orden.push("fin B") });
  assert.deepEqual(orden, ["paso A", "fin A"], "A ends before B starts");
  tiempo.avanzar(100);
  tiempo.avanzar(1000);
  assert.deepEqual(orden, ["paso A", "fin A", "paso B", "paso B", "fin B"],
    "the frame that A asked for draws nothing");
});

test("con movimiento reducido el paso es un fundido lineal de 150 ms", () => {
  const tiempo = reloj();
  const motor = crearMotor(tiempo);
  const pasos = [];
  let fin = false;
  motor.animar({ duracion: 500, reducido: true, paso: (t) => pasos.push(t), fin: () => { fin = true; } });
  tiempo.avanzar(75);
  assert.equal(pasos.at(-1), 0.5);
  tiempo.avanzar(75);
  assert.equal(fin, true);
});

test("sin cuadros el motor dibuja el final de una vez", () => {
  const pasos = [];
  let fin = false;
  crearMotor().animar({ paso: (t) => pasos.push(t), fin: () => { fin = true; } });
  assert.deepEqual(pasos, [1]);
  assert.equal(fin, true);
});

test("cada rueda del odometro gira cuando la de abajo pasa de 9 a 0", () => {
  assert.deepEqual(ruedasDelOdometro(129.5, 3), [
    { posicion: 1, visible: true },
    { posicion: 2.5, visible: true },
    { posicion: 9.5, visible: true },
  ]);
  assert.deepEqual(ruedasDelOdometro(1999.25, 4).map((rueda) => rueda.posicion),
    [1.25, 9.25, 9.25, 9.25]);
  assert.deepEqual(ruedasDelOdometro(42, 4), [
    { posicion: 0, visible: false },
    { posicion: 0, visible: false },
    { posicion: 4, visible: true },
    { posicion: 2, visible: true },
  ]);
  assert.equal(cifrasDe(123533955013701.5), 15);
});

test("el odometro pone un punto cada tres cifras", () => {
  const html = htmlDelOdometro(ruedasDelOdometro(1234, 4));
  assert.equal(html.match(/class="separador"/g).length, 1);
  assert.match(html, /^<span class="rueda"><span class="tira" style="transform:translateY\(-1\.200em\)">/);
  assert.equal(html.match(/class="rueda"/g).length, 4);
});
