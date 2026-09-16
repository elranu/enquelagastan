// Where a number comes from.
//
// The source goes down with the visitor. High in the tree it names the file and
// the date of publication. At the lowest nodo of a branch it names the codes
// that identify the rows.
//
// The codes carry every segment of the camino, and the navigator removed some
// of them from the path. A visitor of the Procuracion del Tesoro sees 2 names,
// and the file needs 9 codes to find those rows. A source that showed only the
// visible path would give a number that nobody can reproduce.

export const EJES = [
  "jurisdiccion", "subjurisdiccion", "entidad", "servicio", "programa",
  "subprograma", "proyecto", "actividad", "obra", "inciso", "principal",
  "parcial", "subparcial",
];

export function etiquetarCodigos(clave) {
  return clave.split("-").map((codigo, posicion) => ({
    eje: EJES[posicion],
    codigo,
  }));
}

export function procedenciaDe(entrada, indice, clave) {
  const nodo = indice[clave];
  const esHoja = Boolean(nodo) && nodo.k.length === 0;
  return {
    archivo: entrada.archivo,
    fecha: entrada.publicado,
    codigos: esHoja ? etiquetarCodigos(clave) : null,
  };
}
