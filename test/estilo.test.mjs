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
