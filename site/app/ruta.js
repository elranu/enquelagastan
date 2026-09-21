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
  // A bare "#/" carries no exercise, and a failed screen is reached from it.
  // A route of "#/null" is not a route: it must never go to the URL bar, and
  // never to a link that somebody shares.
  if (!Number.isFinite(ejercicio)) {
    return "#/";
  }
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
  // The rule reads the year and not the position in the list. An exercise
  // that failed its build that day is absent from the list. A rule of "the
  // one before the last" would then step back one year too far.
  const cerrados = disponibles.filter((ejercicio) => ejercicio < hoy);
  return cerrados.at(-1) ?? disponibles.at(-1);
}

export function ancestroQueExiste(indice, clave) {
  if (clave === "") {
    // The root always exists. It carries no code to look up.
    return "";
  }
  const codigos = clave.split("-");
  for (let corte = codigos.length; corte > 0; corte -= 1) {
    const parcial = codigos.slice(0, corte).join("-");
    if (indice[parcial]) {
      return parcial;
    }
  }
  return null;
}

// ---- The history of the browser (R12) ----------------------------------
//
// A ruta is { anio, clave, grupos, desde }, or { fuentes: true }, or
// { info: true }.
// grupos holds the claves of every open group "otros" over the nodo. W8: a
// group is not in the URL, so it lives in history.state. desde is the
// exercise of origin when a change of year lands on a clave that is absent:
// { anio, nombre, monto }, or null.

export const RUTA_DE_FUENTES = "#/fuentes";
export const RUTA_DE_INFO = "#/info";

export function entradaDe(ruta) {
  if (ruta.fuentes) {
    return { hash: RUTA_DE_FUENTES, estado: { fuentes: true } };
  }
  if (ruta.info) {
    return { hash: RUTA_DE_INFO, estado: { info: true } };
  }
  return {
    hash: escribirRuta(ruta.anio, ruta.clave),
    estado: {
      anio: ruta.anio, clave: ruta.clave, grupos: ruta.grupos ?? [], desde: ruta.desde ?? null,
    },
  };
}

export function rutaDeEntrada(hash, estado) {
  if (hash === RUTA_DE_FUENTES) {
    return { fuentes: true };
  }
  if (hash === RUTA_DE_INFO) {
    return { info: true };
  }
  const { ejercicio, clave } = leerRuta(hash);
  // A state that names another place is not this entry: a shared link, or a
  // hash that the visitor typed. Its groups do not belong here.
  const propio = Boolean(estado) && estado.anio === ejercicio && estado.clave === clave;
  return {
    anio: ejercicio,
    clave,
    grupos: propio && Array.isArray(estado.grupos) ? estado.grupos : [],
    desde: propio ? estado.desde ?? null : null,
  };
}

export function escrituraDe(modo, actual, final) {
  // modo "paso": the visitor took a step, so the final place gets a new
  // entry. W6: "Volver" is a step too.
  // modo "carga": the page read an entry that exists already (the first
  // load, Back, Forward, a link). A skip of a nodo with one child, a clave
  // that is absent, or a group that the data no longer has changes the
  // place. The entry then gets the place that is on screen, with no new
  // entry: Back must never return to a place that jumps forward again.
  const igual = actual.hash === final.hash
    && JSON.stringify(actual.estado ?? null) === JSON.stringify(final.estado);
  if (igual) {
    return null;
  }
  return modo === "paso" ? "push" : "replace";
}

export function contiene(arriba, clave) {
  // The root holds every clave. Past the root, a clave is a camino of codes,
  // so "88-10" is not inside "88-1".
  return arriba === "" || clave === arriba || clave.startsWith(`${arriba}-`);
}

export function direccionEntre(antes, despues) {
  // The direction picks the motion: the rings go down or up, the screen
  // slides for a year, and a jump with no relation fades.
  if (!antes) {
    return "inicio";
  }
  if (antes.fuentes || despues.fuentes || antes.info || despues.info) {
    const mismoLugar = (antes.fuentes && despues.fuentes) || (antes.info && despues.info);
    return mismoLugar ? "igual" : "salto";
  }
  if (antes.anio !== despues.anio) {
    return "anio";
  }
  if (antes.clave === despues.clave) {
    const [uno, otro] = [antes.grupos.length, despues.grupos.length];
    if (uno === otro) {
      return JSON.stringify(antes.grupos) === JSON.stringify(despues.grupos) ? "igual" : "salto";
    }
    return otro > uno ? "abajo" : "arriba";
  }
  if (contiene(antes.clave, despues.clave)) {
    return "abajo";
  }
  if (contiene(despues.clave, antes.clave)) {
    return "arriba";
  }
  return "salto";
}
