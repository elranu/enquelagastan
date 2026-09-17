// The theme control ("Tema", R13) and the view control ("Billetes", R14).
//
// The look lives in two attributes on <html>, data-tema and data-vista, and
// estilo.css picks the tokens from them. A control changes the look and
// never the place, so it writes no history entry (W9).
//
// The inline script of index.html applies the stored look before the first
// paint. It reads the same two keys, and a test checks that.

export const CLAVE_OSCURO = "enquelagastan-oscuro";
export const CLAVE_BILLETES = "enquelagastan-billetes";

// R22: three states, in the order a tap moves through them. "sistema" comes
// first and wins: with it, estilo.css follows prefers-color-scheme on its
// own, with no script and no reload.
export const ASPECTOS = ["sistema", "claro", "oscuro"];

const SIGUIENTE_ASPECTO = { sistema: "claro", claro: "oscuro", oscuro: "sistema" };

// One inline SVG per state (R22): a screen, a sun and a moon.
const ICONO_DEL_ASPECTO = {
  sistema: '<svg viewBox="0 0 20 20" aria-hidden="true"><rect x="2" y="3" width="16" height="11" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M7 17h6M10 14v3" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  claro: '<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="4" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M10 1.5v2.4M10 16.1v2.4M18.5 10h-2.4M3.9 10H1.5M15.9 4.1l-1.7 1.7M5.8 14.2l-1.7 1.7M15.9 15.9l-1.7-1.7M5.8 5.8 4.1 4.1" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  oscuro: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M17 12.4A7.5 7.5 0 1 1 7.6 3a6 6 0 0 0 9.4 9.4Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
};

function leer(almacen, clave) {
  // A private window or a blocked site can refuse the storage. The look then
  // falls back to the default, and nothing breaks.
  try {
    return almacen.getItem(clave);
  } catch {
    return null;
  }
}

function guardar(almacen, clave, valor) {
  try {
    almacen.setItem(clave, valor);
  } catch {
    // The look still changes. It lasts for this visit only.
  }
}

// R22: the accessible name says the state and what the next tap does.
export function etiquetaDelAspecto(aspecto) {
  const siguiente = SIGUIENTE_ASPECTO[aspecto];
  const frase = siguiente === "sistema" ? "el tema del sistema" : `el tema ${siguiente}`;
  return `Tema: ${aspecto}. Tocar para ${frase}.`;
}

export function leerTema(almacen) {
  const guardado = leer(almacen, CLAVE_OSCURO);
  return {
    aspecto: ASPECTOS.includes(guardado) ? guardado : "sistema",
    billetes: leer(almacen, CLAVE_BILLETES) === "true",
  };
}

export function aplicarTema(documento, tema) {
  const raiz = documento.documentElement;
  raiz.setAttribute("data-tema", tema.aspecto);
  raiz.setAttribute("data-vista", tema.billetes ? "billetes" : "simple");
  const boton = documento.getElementById("tema");
  boton?.setAttribute("aria-label", etiquetaDelAspecto(tema.aspecto));
  if (boton) {
    boton.innerHTML = ICONO_DEL_ASPECTO[tema.aspecto];
  }
  // Billetes stays a two-state switch, and it says its own state.
  documento.getElementById("billetes")?.setAttribute("aria-checked", String(tema.billetes));
}

export function cambiarTema(tema, interruptor, almacen) {
  // interruptor is "tema" or "billetes".
  if (interruptor === "billetes") {
    const nuevo = { ...tema, billetes: !tema.billetes };
    guardar(almacen, CLAVE_BILLETES, String(nuevo.billetes));
    return nuevo;
  }
  const nuevo = { ...tema, aspecto: SIGUIENTE_ASPECTO[tema.aspecto] };
  guardar(almacen, CLAVE_OSCURO, nuevo.aspecto);
  return nuevo;
}
