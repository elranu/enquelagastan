// Turn the children of a nodo into the slices of a pie chart.
//
// A child below the threshold joins one slice with the name "otros". The
// visitor opens that slice and gets another pie chart, where the parts are a
// part of the total of "otros".
//
// The threshold belongs to this module and not to the build. The published
// file holds every child, because the visitor can open "otros", so the build
// would save nothing by grouping first. A change of this value needs no new
// build.

export const UMBRAL = 0.04;
export const NOMBRE_OTROS = "otros";

export function porcionesDe(indice, claves, medida) {
  const valores = claves.map((clave) => ({
    clave,
    nombre: indice[clave].n,
    monto: indice[clave][medida],
  }));
  const total = valores.reduce((suma, valor) => suma + valor.monto, 0);
  if (total <= 0) {
    return { total, porciones: [] };
  }

  let grandes = valores.filter((valor) => valor.monto / total >= UMBRAL);
  let chicas = valores.filter((valor) => valor.monto / total < UMBRAL);
  if (grandes.length === 0) {
    // No child reaches the threshold. Group nothing here, so a tap on this
    // slice never returns the same slice.
    grandes = chicas;
    chicas = [];
  }
  grandes.sort((uno, otro) => otro.monto - uno.monto);

  const porciones = grandes.map((valor) => ({
    nombre: valor.nombre,
    monto: valor.monto,
    parte: valor.monto / total,
    esOtros: false,
    destino: [valor.clave],
  }));

  if (chicas.length > 0) {
    const monto = chicas.reduce((suma, valor) => suma + valor.monto, 0);
    porciones.push({
      nombre: NOMBRE_OTROS,
      monto,
      parte: monto / total,
      esOtros: true,
      destino: chicas.map((valor) => valor.clave),
    });
  }
  return { total, porciones };
}
