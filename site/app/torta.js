// The pie chart, drawn as SVG.
//
// The chart stays at every level. The slice "otros" keeps the number of slices
// low: a real exercise gives a median of 3 slices and never more than 18.

const ESPACIO = "http://www.w3.org/2000/svg";

export const RADIO = 100;
export const CENTRO = 110;

function punto(angulo) {
  return {
    x: CENTRO + RADIO * Math.cos(angulo - Math.PI / 2),
    y: CENTRO + RADIO * Math.sin(angulo - Math.PI / 2),
  };
}

export function caminoDeArco(desde, hasta) {
  const inicio = punto(desde);
  const fin = punto(hasta);
  const grande = hasta - desde > Math.PI ? 1 : 0;
  return [
    `M ${CENTRO} ${CENTRO}`,
    `L ${inicio.x.toFixed(3)} ${inicio.y.toFixed(3)}`,
    `A ${RADIO} ${RADIO} 0 ${grande} 1 ${fin.x.toFixed(3)} ${fin.y.toFixed(3)}`,
    "Z",
  ].join(" ");
}

function porCiento(parte) {
  return `${(parte * 100).toFixed(1)}%`;
}

export function dibujarTorta(porciones, documento = document) {
  const svg = documento.createElementNS(ESPACIO, "svg");
  svg.setAttribute("viewBox", `0 0 ${CENTRO * 2} ${CENTRO * 2}`);
  svg.setAttribute("role", "list");
  svg.setAttribute("class", "torta");

  // One slice fills the circle. An arc of a full turn collapses to a point,
  // so that case draws a circle.
  if (porciones.length === 1) {
    const circulo = documento.createElementNS(ESPACIO, "circle");
    circulo.setAttribute("cx", CENTRO);
    circulo.setAttribute("cy", CENTRO);
    circulo.setAttribute("r", RADIO);
    circulo.setAttribute("class", "porcion porcion-0");
    circulo.setAttribute("data-destino", porciones[0].destino.join(" "));
    circulo.setAttribute("role", "listitem");
    circulo.setAttribute("tabindex", "0");
    const titulo = documento.createElementNS(ESPACIO, "title");
    titulo.textContent = `${porciones[0].nombre}, ${porCiento(1)}`;
    circulo.appendChild(titulo);
    svg.appendChild(circulo);
    return svg;
  }

  let angulo = 0;
  porciones.forEach((porcion, orden) => {
    const hasta = angulo + porcion.parte * Math.PI * 2;
    const forma = documento.createElementNS(ESPACIO, "path");
    forma.setAttribute("d", caminoDeArco(angulo, hasta));
    forma.setAttribute("class", `porcion porcion-${orden}`);
    forma.setAttribute("data-destino", porcion.destino.join(" "));
    forma.setAttribute("role", "listitem");
    forma.setAttribute("tabindex", "0");
    if (porcion.esOtros) {
      forma.setAttribute("data-otros", "si");
    }
    const titulo = documento.createElementNS(ESPACIO, "title");
    titulo.textContent = `${porcion.nombre}, ${porCiento(porcion.parte)}`;
    forma.appendChild(titulo);
    svg.appendChild(forma);
    angulo = hasta;
  });
  return svg;
}
