// A small stand-in for the document, so a test needs no browser.
export function falsoDocumento() {
  const crear = (etiqueta) => ({
    etiqueta,
    atributos: {},
    hijos: [],
    textContent: "",
    setAttribute(nombre, valor) { this.atributos[nombre] = valor; },
    appendChild(hijo) { this.hijos.push(hijo); return hijo; },
  });
  return {
    createElement: crear,
    createElementNS: (espacio, etiqueta) => crear(etiqueta),
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
