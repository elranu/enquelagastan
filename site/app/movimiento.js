// The motion runner, and the wheels of the odometer.
//
// One loop runs at a time. A new motion ends the running one at once, and
// draws its last frame first (R4). The loop takes requestAnimationFrame and
// the clock as arguments, so a test drives the time by hand.

export const DURACION = 500;
export const DURACION_REDUCIDA = 150;
export const ALTO_DE_CIFRA = 1.2;

export function curvaBezier(x1, y1, x2, y2) {
  // The same curve as the CSS function cubic-bezier(). The x of the curve
  // grows with s, so a bisection finds the s of a given x.
  const coordenada = (uno, dos, s) => 3 * uno * s * (1 - s) ** 2 + 3 * dos * s * s * (1 - s) + s ** 3;
  return (x) => {
    if (x <= 0) {
      return 0;
    }
    if (x >= 1) {
      return 1;
    }
    let bajo = 0;
    let alto = 1;
    for (let vuelta = 0; vuelta < 30; vuelta += 1) {
      const medio = (bajo + alto) / 2;
      if (coordenada(x1, x2, medio) < x) {
        bajo = medio;
      } else {
        alto = medio;
      }
    }
    return coordenada(y1, y2, (bajo + alto) / 2);
  };
}

export const suavizar = curvaBezier(0.23, 1, 0.32, 1);

export function crearMotor({ cuadro, ahora } = {}) {
  let corriendo = null;

  function terminar() {
    if (!corriendo) {
      return;
    }
    const propio = corriendo;
    corriendo = null;
    propio.fin();
  }

  function animar({ duracion = DURACION, reducido = false, paso, fin }) {
    terminar();
    if (!cuadro) {
      // No frames: a test, or a page with no rendering. Draw the end.
      paso(1);
      fin();
      return;
    }
    // Reduced motion: a linear crossfade of 150ms, and never a moving ring.
    const largo = reducido ? DURACION_REDUCIDA : duracion;
    const curva = reducido ? (t) => t : suavizar;
    const inicio = ahora();
    const propio = { fin };
    corriendo = propio;
    const tic = (tiempo) => {
      if (corriendo !== propio) {
        return;
      }
      const t = Math.min(1, Math.max(0, (tiempo - inicio) / largo));
      paso(curva(t));
      if (t < 1) {
        cuadro(tic);
        return;
      }
      corriendo = null;
      fin();
    };
    cuadro(tic);
  }

  return { animar, terminar, activo: () => corriendo !== null };
}

export function ruedasDelOdometro(valor, cantidad) {
  // R5: the total rolls like an odometer. A wheel turns only while the wheel
  // below it goes from 9 to 0. The result starts at the largest wheel.
  const positivo = Math.max(0, valor);
  const entero = Math.floor(positivo);
  const posiciones = [];
  for (let potencia = 0; potencia < cantidad; potencia += 1) {
    const digito = Math.floor(entero / 10 ** potencia) % 10;
    const debajo = posiciones[potencia - 1];
    posiciones[potencia] = potencia === 0
      ? digito + (positivo - entero)
      : digito + (debajo > 9 ? debajo - 9 : 0);
  }
  return posiciones
    .map((posicion, potencia) => ({ posicion, visible: potencia === 0 || entero >= 10 ** potencia }))
    .reverse();
}

export function cifrasDe(valor) {
  return String(Math.round(Math.max(0, valor))).length;
}

const TIRA = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((digito) => `<span>${digito}</span>`).join("");

export function htmlDelOdometro(ruedas) {
  // Digits and dots only, never a name from the data.
  return ruedas.map(({ posicion, visible }, orden) => {
    const potencia = ruedas.length - 1 - orden;
    const desplazamiento = (-posicion * ALTO_DE_CIFRA).toFixed(3);
    const rueda = `<span class="rueda"${visible ? "" : " hidden"}>`
      + `<span class="tira" style="transform:translateY(${desplazamiento}em)">${TIRA}</span></span>`;
    const separador = visible && potencia > 0 && potencia % 3 === 0
      ? '<span class="separador">.</span>'
      : "";
    return rueda + separador;
  }).join("");
}
