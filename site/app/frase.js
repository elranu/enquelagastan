// The sentence of the view "Billetes" (R15).
//
// "De cada $100 que gastó <nodo> en <año>, $<n> fueron a <parte mayor>." The
// sentence comes back in three pieces, so the screen writes the amount in
// bold with textContent and never parses a name from the data as HTML.

import { llano } from "./arbol.js";

export const NODO_DE_LA_RAIZ = "el Estado nacional";

export function deCadaCien(parte) {
  const centavos = parte * 10000;
  if (centavos < 1) {
    return "menos de 1 centavo";
  }
  const redondo = Math.round(centavos);
  if (redondo < 100) {
    return redondo === 1 ? "1 centavo" : `${redondo} centavos`;
  }
  return `$${Math.round(parte * 100)}`;
}

export function fraseDe({ anio, nodo, porciones, total, totalNacional }) {
  // nodo is null at the root.
  const quien = nodo ?? NODO_DE_LA_RAIZ;
  if (porciones.length === 0) {
    // A nodo with no part to show: compare it with the national total.
    const parte = totalNacional > 0 ? total / totalNacional : 0;
    return {
      antes: `De cada $100 que gastó ${NODO_DE_LA_RAIZ} en ${anio}, `,
      cifra: deCadaCien(parte),
      despues: ` fueron a ${quien}.`,
    };
  }
  // "otros" goes last in the list, and it can still be the largest part.
  const mayor = porciones.reduce((uno, otro) => (otro.monto > uno.monto ? otro : uno));
  const antes = `De cada $100 que gastó ${quien} en ${anio}, `;
  const cifra = deCadaCien(mayor.parte);
  if (!mayor.esOtros && nodo !== null && llano(mayor.nombre) === llano(nodo)) {
    // W15: DGSIAF repeats the name of the parent on its largest child.
    return { antes, cifra, despues: ` los gastó ${quien} en forma directa.` };
  }
  const destino = mayor.esOtros ? "otros gastos chicos" : mayor.nombre;
  return { antes, cifra, despues: ` fueron a ${destino}.` };
}
