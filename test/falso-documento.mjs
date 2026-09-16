// A small stand-in for the document, so a test needs no browser.
export function falsoDocumento() {
  const crear = (etiqueta) => ({
    etiqueta,
    atributos: {},
    hijos: [],
    textContent: "",
    setAttribute(nombre, valor) { this.atributos[nombre] = valor; },
    appendChild(hijo) { this.hijos.push(hijo); return hijo; },
    removeChild(hijo) { this.hijos = this.hijos.filter((otro) => otro !== hijo); },
    get firstChild() { return this.hijos[0] ?? null; },
    addEventListener() {},
  });
  // app.js asks the document for #app and for #aviso. The same element comes
  // back for one id, so a test reads what the navigator wrote there.
  const porId = new Map();
  return {
    createElement: crear,
    createElementNS: (espacio, etiqueta) => crear(etiqueta),
    getElementById(id) {
      if (!porId.has(id)) {
        porId.set(id, crear("div"));
      }
      return porId.get(id);
    },
  };
}

// A stand-in for the window and the history. The hash is a plain value, so a
// test moves the visitor with one assignment and no browser.
export function falsaVentana(hash = "#/") {
  return {
    location: { hash },
    addEventListener() {},
  };
}

export function falsaHistoria() {
  const escrituras = [];
  return {
    escrituras,
    replaceState(estado, titulo, ruta) { escrituras.push(ruta); },
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
