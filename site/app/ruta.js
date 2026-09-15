// The URL of one view, and the movement between exercises.
//
// The URL carries the exercise and the camino, so a shared link always opens
// what its author saw. Only the arrow crosses exercises.
//
// The arrow changes the exercise and nothing else. It never moves the visitor
// in the tree. A rule that moved the exercise and the position at the same time
// would make one action produce two changes.

export function leerRuta(hash) {
  const partes = (hash || "").replace(/^#\/?/, "").split("/");
  const ejercicio = Number.parseInt(partes[0], 10);
  return {
    ejercicio: Number.isFinite(ejercicio) ? ejercicio : null,
    clave: partes[1] || "",
  };
}

export function escribirRuta(ejercicio, clave) {
  return clave === "" ? `#/${ejercicio}` : `#/${ejercicio}/${clave}`;
}

export function ejerciciosDisponibles(manifiesto) {
  // An exercise whose build failed that day holds no file in the artifact. Its
  // entry stays in the manifest, because its total is the baseline of the next
  // build, and the navigator must not offer it.
  return manifiesto.ejercicios
    .filter((entrada) => entrada.en_este_artefacto !== false)
    .map((entrada) => entrada.ejercicio)
    .sort((uno, otro) => uno - otro);
}

export function ejercicioDeEntrada(disponibles, hoy = new Date().getFullYear()) {
  // The entry shows the last closed exercise. The open one is not complete, so
  // its pie chart is smaller by the calendar and not by a policy.
  //
  // The rule reads the year and not the position in the list. An exercise that
  // failed its build that day is absent from the list, so a rule of "the one
  // before the last" would step back one year too far.
  const cerrados = disponibles.filter((ejercicio) => ejercicio < hoy);
  return cerrados.at(-1) ?? disponibles.at(-1);
}

export function vecino(disponibles, ejercicio, paso) {
  const posicion = disponibles.indexOf(ejercicio);
  if (posicion < 0) {
    return null;
  }
  return disponibles[posicion + paso] ?? null;
}

export function ancestroQueExiste(indice, clave) {
  const codigos = clave.split("-");
  for (let corte = codigos.length; corte > 0; corte -= 1) {
    const parcial = codigos.slice(0, corte).join("-");
    if (indice[parcial]) {
      return parcial;
    }
  }
  return null;
}
