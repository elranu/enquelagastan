// The rings of the chart, as pure geometry.
//
// The disc in the center shows the amount of the nodo. The main ring holds
// the parts of the nodo. The thin ring shows the previous level, and the
// hairline ring shows level 1. Only a lit arc of an outer ring navigates.
//
// The SVG uses a viewBox of -1 -1 2 2, so a radius of 1 touches the edge.
// An angle starts at 12 o'clock and grows clockwise. This module touches no
// DOM, so a test reads every number.

export const VUELTA = Math.PI * 2;

export const RADIOS = {
  principal: [0.44, 0.80],
  previo: [0.845, 0.895],
  primero: [0.94, 0.955],
};

export const RADIO_DEL_DISCO = RADIOS.principal[0];
export const OPACIDAD_TENUE = 0.28;
export const MARGEN_DEL_DISCO = 0.12;

const COLORES = 7;

export function colorDe(porcion, orden, cantidad) {
  // W14: the colours restart at every level, by size. "otros" is always
  // neutral. porcionesDe sorts the parts by size and puts "otros" last.
  if (porcion.esOtros) {
    return "var(--otros)";
  }
  let indice = orden % COLORES;
  // The last part touches the first part of the ring. With 8 or 15 parts
  // and no "otros", both would take --c0, and the two arcs would look like
  // one arc.
  if (orden > 0 && orden === cantidad - 1 && indice === 0) {
    indice = 1;
  }
  return `var(--c${indice})`;
}

export function angulosDe(porciones) {
  let angulo = 0;
  return porciones.map((porcion) => {
    const a0 = angulo;
    angulo += porcion.parte * VUELTA;
    return { a0, a1: angulo };
  });
}

// Five decimals are enough for a viewBox of 2 units. Number() drops the
// trailing zeros and turns -0 into 0, so a test can write the path by hand.
function numero(valor) {
  return String(Number(valor.toFixed(5)));
}

function punto(radio, angulo) {
  return `${numero(radio * Math.sin(angulo))} ${numero(-radio * Math.cos(angulo))}`;
}

export function caminoDeAnillo({ r0, r1, a0, a1 }) {
  const abertura = a1 - a0;
  if (abertura <= 0 || r1 <= r0) {
    return "";
  }
  const [interior, exterior] = [numero(r0), numero(r1)];
  if (abertura >= VUELTA - 1e-4) {
    // An SVG arc from a point to the same point draws nothing. A full ring
    // is two half turns outside, clockwise, and two half turns inside,
    // counterclockwise. The opposite directions leave the hole empty.
    return `M0 ${numero(-r1)}A${exterior} ${exterior} 0 1 1 0 ${exterior}`
      + `A${exterior} ${exterior} 0 1 1 0 ${numero(-r1)}Z`
      + `M0 ${numero(-r0)}A${interior} ${interior} 0 1 0 0 ${interior}`
      + `A${interior} ${interior} 0 1 0 0 ${numero(-r0)}Z`;
  }
  const grande = abertura > Math.PI ? 1 : 0;
  return `M${punto(r1, a0)}A${exterior} ${exterior} 0 ${grande} 1 ${punto(r1, a1)}`
    + `L${punto(r0, a1)}A${interior} ${interior} 0 ${grande} 0 ${punto(r0, a0)}Z`;
}

function llaveDe(nivel, porcion) {
  return `${nivel}:${porcion.destino.join("|")}`;
}

export function escenaDe(pila) {
  // pila holds one level per screen from the root to the screen on view:
  // { porciones, elegida, hoja }. elegida is the order of the part that
  // leads to the next level, or null on the last level.
  const arcos = [];
  const cantidad = pila.length;

  function anillo(nivel, rol, subir) {
    const { porciones, elegida, hoja } = pila[nivel];
    const angulos = angulosDe(porciones);
    const arriba = pila[nivel - 1];
    const padre = arriba && arriba.elegida !== null
      ? llaveDe(nivel - 1, arriba.porciones[arriba.elegida])
      : null;
    porciones.forEach((porcion, orden) => {
      const encendido = rol !== "principal" && orden === elegida;
      arcos.push({
        llave: llaveDe(nivel, porcion),
        nivel,
        rol,
        padre,
        orden,
        color: colorDe(porcion, orden, porciones.length),
        r0: RADIOS[rol][0],
        r1: RADIOS[rol][1],
        a0: angulos[orden].a0,
        a1: angulos[orden].a1,
        opacidad: rol === "principal" || encendido ? 1 : OPACIDAD_TENUE,
        // A part of the last level has no child to open.
        abrir: rol === "principal" && !hoja ? orden : null,
        // W7: only a lit arc navigates. A dim arc carries no destination.
        subir: encendido ? subir : null,
      });
    });
  }

  anillo(cantidad - 1, "principal", null);
  if (cantidad >= 2) {
    // A12: the lit arc of the thin ring goes to the previous level.
    anillo(cantidad - 2, "previo", cantidad - 2);
  }
  if (cantidad >= 3) {
    // A13: the lit arc of the hairline ring goes to level 1.
    anillo(0, "primero", 1);
  }
  return arcos;
}

function fantasma(arco, otra) {
  // An arc with no partner in the other scene lives inside the arc of its
  // parent there. A child is born inside the angle of the tapped part, and
  // it goes back into that angle on the way up.
  const padre = otra.find((candidato) => candidato.llave === arco.padre);
  if (!padre) {
    return { ...arco, opacidad: 0 };
  }
  const escala = (padre.a1 - padre.a0) / VUELTA;
  return {
    ...arco,
    a0: padre.a0 + arco.a0 * escala,
    a1: padre.a0 + arco.a1 * escala,
    r0: padre.r0,
    r1: padre.r1,
  };
}

function mezcla(desde, hasta, t) {
  return desde + (hasta - desde) * t;
}

export function interpolar(desde, hasta) {
  // R4: pair every arc by its llave. The same llave in both scenes moves
  // from one ring to the other. The rest are born or die inside a parent.
  const pares = new Map();
  for (const arco of desde) {
    pares.set(arco.llave, [arco, null]);
  }
  for (const arco of hasta) {
    const par = pares.get(arco.llave);
    if (par) {
      par[1] = arco;
    } else {
      pares.set(arco.llave, [fantasma(arco, desde), arco]);
    }
  }
  for (const par of pares.values()) {
    if (!par[1]) {
      par[1] = fantasma(par[0], hasta);
    }
  }
  const lista = [...pares.values()];
  // An arc in motion carries no destination: a tap ends the motion first.
  return (t) => lista.map(([uno, otro]) => ({
    ...otro,
    r0: mezcla(uno.r0, otro.r0, t),
    r1: mezcla(uno.r1, otro.r1, t),
    a0: mezcla(uno.a0, otro.a0, t),
    a1: mezcla(uno.a1, otro.a1, t),
    opacidad: mezcla(uno.opacidad, otro.opacidad, t),
    abrir: null,
    subir: null,
  }));
}

export function desdeCero(arcos) {
  // W4: on the first load the main ring grows once from 12 o'clock.
  return arcos.map((arco) => ({ ...arco, a0: 0, a1: 0 }));
}

function accionDe(arco) {
  if (arco.abrir !== null) {
    return `data-abrir="${arco.abrir}"`;
  }
  if (arco.subir !== null) {
    return `data-subir="${arco.subir}"`;
  }
  return "";
}

export function svgDeEscena(arcos) {
  // The markup holds numbers and colour tokens only, never a name from the
  // data, so innerHTML is safe here.
  const vivos = arcos.filter((arco) => arco.opacidad > 0.005);
  const contorno = vivos.some((arco) => arco.rol === "principal")
    ? ""
    : `<path class="contorno" d="${caminoDeAnillo({
      r0: RADIOS.principal[0], r1: RADIOS.principal[1], a0: 0, a1: VUELTA,
    })}"></path>`;
  // R3: a transparent stroke of 24px under every arc that navigates. The
  // thin rings are about 12px wide on a telephone.
  const golpes = vivos.filter(accionDe).map((arco) => `<path class="golpe" `
    + `d="${caminoDeAnillo(arco)}" vector-effect="non-scaling-stroke" `
    + `${accionDe(arco)}></path>`);
  const formas = vivos.map((arco) => `<path class="arco${accionDe(arco) ? "" : " ciego"}" `
    + `d="${caminoDeAnillo(arco)}" style="fill:${arco.color}" `
    + `fill-opacity="${arco.opacidad.toFixed(3)}" ${accionDe(arco)}></path>`);
  return contorno + golpes.join("") + formas.join("");
}

export function tamanioDelDisco({ ancho, alto, radio, referencia = 100, maximo = 56 }) {
  // R7: the text of the disc is measured at a reference size. The size is
  // linear in the font size, so one division gives the size whose corners
  // touch a circle of 88% of the inner radius.
  const diagonal = Math.hypot(ancho, alto);
  if (!diagonal || !radio) {
    return null;
  }
  return Math.min(maximo, (referencia * 2 * radio * (1 - MARGEN_DEL_DISCO)) / diagonal);
}
