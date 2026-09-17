// A small stand-in for the document, the window and the history, so a test
// needs no browser.

function oyentes() {
  const porTipo = new Map();
  return {
    addEventListener(tipo, oyente) {
      porTipo.set(tipo, [...(porTipo.get(tipo) ?? []), oyente]);
    },
    // A test fires an event with one call, as a browser would.
    disparar(tipo, evento = {}) {
      for (const oyente of porTipo.get(tipo) ?? []) {
        oyente(evento);
      }
    },
  };
}

export function falsoDocumento() {
  const crear = (etiqueta) => ({
    etiqueta,
    atributos: {},
    hijos: [],
    textContent: "",
    setAttribute(nombre, valor) { this.atributos[nombre] = valor; },
    removeAttribute(nombre) { delete this.atributos[nombre]; },
    getAttribute(nombre) { return this.atributos[nombre] ?? null; },
    // Only the selectors that app.js uses: one attribute, as "[data-abrir]",
    // or a list of them, as "[data-abrir], [data-subir]". The fake element
    // knows no parent, so it answers for itself.
    closest(selector) {
      const nombres = selector.split(",")
        .map((parte) => /^\s*\[([\w-]+)\]\s*$/.exec(parte)?.[1]);
      return nombres.some((nombre) => nombre && this.atributos[nombre] !== undefined) ? this : null;
    },
    appendChild(hijo) { this.hijos.push(hijo); return hijo; },
    removeChild(hijo) { this.hijos = this.hijos.filter((otro) => otro !== hijo); },
    get firstChild() { return this.hijos[0] ?? null; },
    addEventListener() {},
    focus() {},
  });
  // The frame of index.html holds every part once. The same element comes
  // back for one id, so a test reads what the navigator wrote there.
  const porId = new Map();
  const documento = {
    ...oyentes(),
    documentElement: crear("html"),
    createElement: crear,
    createElementNS: (espacio, etiqueta) => crear(etiqueta),
    getElementById(id) {
      if (!porId.has(id)) {
        porId.set(id, crear("div"));
      }
      return porId.get(id);
    },
    // A test sets this before it fires "pointerdown", as the point of a
    // real gesture would resolve to one element under the finger.
    elementoBajoElPuntero: null,
    elementFromPoint() { return documento.elementoBajoElPuntero; },
  };
  return documento;
}

// The window and the history share one list of entries. pushState and
// replaceState change the hash, and back and forward fire popstate, as a
// browser does.
export function falsaVentana(hash = "#/") {
  return { ...oyentes(), location: { hash } };
}

export function falsaHistoria(ventana, estadoInicial = null) {
  const entradas = [{ hash: ventana.location.hash, estado: estadoInicial }];
  let posicion = 0;
  const escrituras = [];
  const ir = (paso) => {
    const destino = posicion + paso;
    if (destino < 0 || destino >= entradas.length) {
      return;
    }
    posicion = destino;
    ventana.location.hash = entradas[posicion].hash;
    ventana.disparar("popstate", { state: entradas[posicion].estado });
    ventana.disparar("hashchange", {});
  };
  return {
    escrituras,
    entradas,
    get state() { return entradas[posicion].estado; },
    pushState(estado, titulo, hash) {
      entradas.splice(posicion + 1);
      entradas.push({ hash, estado: structuredClone(estado) });
      posicion += 1;
      ventana.location.hash = hash;
      escrituras.push(["push", hash]);
    },
    replaceState(estado, titulo, hash) {
      entradas[posicion] = { hash, estado: structuredClone(estado) };
      ventana.location.hash = hash;
      escrituras.push(["replace", hash]);
    },
    back: () => ir(-1),
    forward: () => ir(1),
  };
}

export function textoDe(elemento) {
  const propio = elemento.textContent || "";
  return [propio, ...elemento.hijos.map(textoDe)].join(" ");
}

// Find every element that carries an attribute, so a test can read the
// controls of a screen and not only its words.
export function controles(elemento, atributo) {
  const propios = elemento.atributos[atributo] === undefined
    ? []
    : [{ texto: elemento.textContent, valor: elemento.atributos[atributo] }];
  return elemento.hijos.reduce(
    (todos, hijo) => todos.concat(controles(hijo, atributo)), propios,
  );
}
