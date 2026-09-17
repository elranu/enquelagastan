// The two switches of the look: "Oscuro" (R13) and "Billetes" (R14).
//
// The look lives in two attributes on <html>, data-tema and data-vista, and
// estilo.css picks the tokens from them. A switch changes the look and never
// the place, so it writes no history entry (W9).
//
// The inline script of index.html applies the stored look before the first
// paint. It reads the same two keys, and a test checks that.

export const CLAVE_OSCURO = "enquelagastan-oscuro";
export const CLAVE_BILLETES = "enquelagastan-billetes";

const CONSULTA_OSCURA = "(prefers-color-scheme: dark)";

function leer(almacen, clave) {
  // A private window or a blocked site can refuse the storage. The look then
  // falls back to the default, and nothing breaks.
  try {
    return almacen.getItem(clave);
  } catch {
    return null;
  }
}

export function leerTema(almacen, prefiere) {
  const oscuro = leer(almacen, CLAVE_OSCURO);
  return {
    oscuro: oscuro === null ? Boolean(prefiere(CONSULTA_OSCURA)) : oscuro === "true",
    billetes: leer(almacen, CLAVE_BILLETES) === "true",
  };
}

export function aplicarTema(documento, tema) {
  const raiz = documento.documentElement;
  raiz.setAttribute("data-tema", tema.oscuro ? "oscuro" : "claro");
  raiz.setAttribute("data-vista", tema.billetes ? "billetes" : "simple");
  // A switch says its state to a screen reader.
  for (const interruptor of ["oscuro", "billetes"]) {
    documento.getElementById(interruptor)?.setAttribute("aria-checked", String(tema[interruptor]));
  }
}

export function cambiarTema(tema, interruptor, almacen) {
  // interruptor is "oscuro" or "billetes".
  const nuevo = { ...tema, [interruptor]: !tema[interruptor] };
  const clave = interruptor === "oscuro" ? CLAVE_OSCURO : CLAVE_BILLETES;
  try {
    almacen.setItem(clave, String(nuevo[interruptor]));
  } catch {
    // The look still changes. It lasts for this visit only.
  }
  return nuevo;
}
