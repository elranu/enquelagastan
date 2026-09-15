// Move through the tree of one exercise.
//
// The identity of a nodo is its full camino and never its last code. A code
// such as `programa_id` repeats between ministries, so a key of one code would
// add the money of two ministries together.

export const NIVELES_INSTITUCIONALES = 9;

export function nivelDe(clave) {
  return clave === "" ? 0 : clave.split("-").length;
}

export function raices(indice) {
  return Object.keys(indice).filter((clave) => !clave.includes("-"));
}

export function hijosDe(indice, clave) {
  const nodo = indice[clave];
  if (!nodo) {
    return [];
  }
  return nodo.k.map((codigo) => `${clave}-${codigo}`);
}

export function saltarHijoUnico(indice, clave) {
  // 79% of the nodos of a real exercise hold one child. Such a nodo shows a
  // circle of one colour, and it repeats the screen before it. The names on
  // the way go to the miga de pan, because the number is not reproducible
  // without them: a visitor sees 2 names where the file needs 9 codes.
  const saltados = [];
  let actual = clave;
  while (indice[actual] && indice[actual].k.length === 1) {
    saltados.push(indice[actual].n);
    actual = `${actual}-${indice[actual].k[0]}`;
  }
  return { destino: actual, saltados };
}

export function migaDePan(indice, clave) {
  if (clave === "") {
    return [];
  }
  const codigos = clave.split("-");
  const tramos = [];
  for (let corte = 1; corte <= codigos.length; corte += 1) {
    const parcial = codigos.slice(0, corte).join("-");
    if (indice[parcial]) {
      tramos.push({ clave: parcial, nombre: indice[parcial].n });
    }
  }
  return tramos;
}

export function totalDe(indice, claves, medida) {
  return claves.reduce((suma, clave) => suma + indice[clave][medida], 0);
}
