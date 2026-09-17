import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";

import { CLAVE_BILLETES, CLAVE_OSCURO } from "../site/app/tema.js";

const leer = (ruta) => readFileSync(new URL(ruta, import.meta.url), "utf8");

// Every block of tokens of estilo.css, by selector: { ":root": { fondo: "#F2F3EF" } }.
function bloques(css) {
  const salida = {};
  for (const [, selector, cuerpo] of css.matchAll(/(:root(?:\[[^\]]+\])*)\s*\{([^}]*)\}/g)) {
    const tokens = salida[selector] ?? {};
    for (const [, nombre, valor] of cuerpo.matchAll(/--([\w-]+):\s*(#[0-9A-Fa-f]{6})\s*;/g)) {
      tokens[nombre] = valor;
    }
    salida[selector] = tokens;
  }
  return salida;
}

// WCAG 2.x: the relative luminance of an sRGB colour, and the ratio of two.
function luminancia(hex) {
  const [r, g, b] = [1, 3, 5].map((inicio) => {
    const canal = Number.parseInt(hex.slice(inicio, inicio + 2), 16) / 255;
    return canal <= 0.03928 ? canal / 12.92 : ((canal + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contraste(uno, otro) {
  const [claro, oscuro] = [luminancia(uno), luminancia(otro)].sort((a, b) => b - a);
  return (claro + 0.05) / (oscuro + 0.05);
}

const TEMA = ':root[data-tema="oscuro"]';
const VISTA = ':root[data-vista="billetes"]';
const AMBOS = ':root[data-vista="billetes"][data-tema="oscuro"]';

test("las cuatro paletas cumplen el contraste de cada par", () => {
  const css = bloques(leer("../site/estilo.css"));
  const paletas = {
    claro: { ...css[":root"] },
    oscuro: { ...css[":root"], ...css[TEMA] },
    "billetes claro": { ...css[":root"], ...css[VISTA] },
    "billetes oscuro": { ...css[":root"], ...css[TEMA], ...css[VISTA], ...css[AMBOS] },
  };
  const porciones = ["c0", "c1", "c2", "c3", "c4", "c5", "c6", "otros"];
  const fallas = [];
  for (const [nombre, paleta] of Object.entries(paletas)) {
    for (const suelo of ["fondo", "panel"]) {
      // R16: a slice, the swatch of a row and the focus ring hold 3:1.
      for (const token of [...porciones, "foco"]) {
        const razon = contraste(paleta[token], paleta[suelo]);
        if (!(razon >= 3)) {
          fallas.push(`${nombre}: --${token} on --${suelo} is ${razon.toFixed(2)}`);
        }
      }
    }
    for (const suelo of ["fondo", "panel", "hover"]) {
      // Every text holds 4.5:1, on a row under the pointer too.
      for (const token of ["texto", "tenue", "acento"]) {
        const razon = contraste(paleta[token], paleta[suelo]);
        if (!(razon >= 4.5)) {
          fallas.push(`${nombre}: --${token} on --${suelo} is ${razon.toFixed(2)}`);
        }
      }
    }
  }
  assert.deepEqual(fallas, []);
  assert.equal(Object.keys(paletas["billetes oscuro"]).length, 16, "every palette has 16 tokens");
});

test("la pista del interruptor apagado tiene 3:1 contra el fondo de la barra", () => {
  // WCAG 1.4.11: --regla alone gives 1.32:1 in light and 1.54:1 in dark. The
  // off track needs a border or shadow from a token that holds 3:1. The
  // header sets no background of its own, so the ground is --fondo.
  const css = leer("../site/estilo.css");
  const apagada = /\.interruptor\[aria-checked="false"\]\s*\.pista\s*\{([^}]*)\}/.exec(css)?.[1] ?? "";
  const token = /var\(--([\w-]+)\)/.exec(apagada)?.[1];
  assert.ok(token, "the off track needs a border or shadow from a palette token");
  const bloquesCss = bloques(css);
  const paletas = {
    claro: bloquesCss[":root"],
    oscuro: { ...bloquesCss[":root"], ...bloquesCss[TEMA] },
  };
  for (const [nombre, paleta] of Object.entries(paletas)) {
    const razon = contraste(paleta[token], paleta.fondo);
    assert.ok(razon >= 3, `${nombre}: --${token} on --fondo is ${razon.toFixed(2)}`);
  }
});

test("el script de index.html lee las mismas claves que tema.js", () => {
  // The inline script applies the look before the first paint. A key that
  // differs from tema.js would flash the default look on every visit.
  const pagina = leer("../site/index.html");
  assert.ok(pagina.includes(`"${CLAVE_OSCURO}"`));
  assert.ok(pagina.includes(`"${CLAVE_BILLETES}"`));
  assert.match(pagina, /prefers-color-scheme: dark/);
  // A bare matchMedia(...) throws when the browser has none. The call must
  // be guarded, or the script never reaches either setAttribute below it.
  assert.match(pagina, /matchMedia\?\.\(/);
});

test("index.html trae cada id que los pintores y app.js leen, y sus atributos", () => {
  // The fake document of the other suites creates any id on demand, and the
  // app tests add missing attributes by hand. Neither one would notice a real
  // index.html that fell out of step with the code. Read the ids straight
  // from the source, so this test breaks the day a painter reads an id that
  // the page does not carry.
  const pagina = leer("../site/index.html");
  const codigo = leer("../site/app/pantalla.js") + leer("../site/app/app.js");
  const ids = new Set();
  for (const [, id] of codigo.matchAll(/(?:parte\(documento,\s*|getElementById\()"([\w-]+)"/g)) {
    ids.add(id);
  }
  // pintarBarra reads these two from an array of pairs, not a literal call.
  ids.add("anio-anterior");
  ids.add("anio-siguiente");
  assert.ok(ids.size > 20, "the collection itself must find something");
  for (const id of ids) {
    assert.match(pagina, new RegExp(`id="${id}"`), `index.html needs id="${id}"`);
  }

  assert.match(pagina, /id="sitio"[^>]*data-clave="/, "the site name is a data-clave control");
  assert.match(pagina, /id="fuentes-enlace"[^>]*data-fuentes="/, "app.js reads data-fuentes");
  for (const interruptor of ["oscuro", "billetes"]) {
    assert.match(pagina,
      new RegExp(`id="${interruptor}"[^>]*role="switch"[^>]*data-interruptor="${interruptor}"`),
      `${interruptor} must be a switch that names itself`);
  }
  assert.match(pagina, /id="grafico"[^>]*aria-hidden="true"/, "the chart is decorative");
  assert.match(pagina, /id="total"[^>]*aria-hidden="true"/,
    "the odometer is decorative; total-texto reads for it");
  assert.match(pagina, /id="aviso"[^>]*role="status"/, "the live region announces politely");
});

test("la pagina no carga nada de otro servidor", () => {
  // KPI Dependencies: no script, style or font from another server.
  const pagina = leer("../site/index.html");
  const estilo = leer("../site/estilo.css");
  assert.doesNotMatch(pagina, /<(script|link)[^>]+(src|href)="(https?:)?\/\//);
  assert.doesNotMatch(estilo, /url\(\s*["']?(https?:)?\/\//);
  assert.doesNotMatch(estilo, /@import/);
});

test("las tipografias viven en el sitio, cambian con swap y pesan menos de 300 KB", () => {
  // R17 and RQ3. A font file that does not load shows a system font.
  const caras = [...leer("../site/estilo.css").matchAll(/@font-face\s*\{([^}]*)\}/g)]
    .map(([, cuerpo]) => cuerpo);
  const familias = new Set(caras.map((cara) => /font-family: "([^"]+)";/.exec(cara)?.[1]));
  assert.deepEqual([...familias].sort(), ["Archivo", "IBM Plex Mono", "IBM Plex Sans"]);
  let bytes = 0;
  const leidos = new Set();
  for (const cara of caras) {
    assert.match(cara, /font-display: swap;/);
    const ruta = /url\("(fuentes\/[\w-]+\.woff2)"\)/.exec(cara)?.[1];
    assert.ok(ruta, cara);
    // A variable file can serve two faces. It weighs once.
    if (!leidos.has(ruta)) {
      leidos.add(ruta);
      bytes += statSync(new URL(`../site/${ruta}`, import.meta.url)).size;
    }
  }
  assert.ok(bytes < 300_000, `RQ3: the three families weigh ${bytes} bytes`);
  for (const licencia of ["ibm-plex-sans-ofl.txt", "ibm-plex-mono-ofl.txt", "archivo-ofl.txt"]) {
    assert.match(leer(`../site/fuentes/${licencia}`), /SIL OPEN FONT LICENSE/i);
  }
});
