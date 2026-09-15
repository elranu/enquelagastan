// Read the files that the build publishes.
// This is the only module that touches the network. Every file is read one
// time. The institutional file of one exercise is about 177 KB after gzip, and
// after it arrives a movement inside that axis needs no request.

export const RUTA_DATOS = "data";

const memoria = new Map();

export function olvidar() {
  memoria.clear();
}

export function claveDeCamino(camino) {
  return camino.join("-");
}

export function caminoDeClave(clave) {
  return clave === "" ? [] : clave.split("-");
}

export async function cargarJson(ruta, traer = fetch) {
  if (memoria.has(ruta)) {
    return memoria.get(ruta);
  }
  const respuesta = await traer(ruta);
  if (!respuesta.ok) {
    const error = new Error(`${ruta} answered ${respuesta.status}`);
    // estadoHttp exists so a reader checks the true status, not this text.
    // A rewrite of the message above must not hide a real failure as absence.
    error.estadoHttp = respuesta.status;
    throw error;
  }
  const datos = await respuesta.json();
  memoria.set(ruta, datos);
  return datos;
}

export function cargarManifiesto(traer) {
  return cargarJson(`${RUTA_DATOS}/manifest.json`, traer);
}

export function cargarInstitucional(ejercicio, traer) {
  return cargarJson(`${RUTA_DATOS}/${ejercicio}/institucional.json`, traer);
}

export function cargarObjeto(ejercicio, claveHoja, traer) {
  return cargarJson(`${RUTA_DATOS}/${ejercicio}/objeto/${claveHoja}.json`, traer);
}
