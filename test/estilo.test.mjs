import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";

import { CLAVE_BILLETES, CLAVE_OSCURO } from "../site/app/tema.js";

const leer = (ruta) => readFileSync(new URL(ruta, import.meta.url), "utf8");

// Every block of tokens of estilo.css, by selector: { ":root": { fondo: "#F2F3EF" } }.
// A value can be a literal hex or a var(--otro-nombre); resolverPaleta below
// follows the reference.
function bloques(css) {
  const salida = {};
  for (const [, selector, cuerpo] of css.matchAll(/(:root(?:\[[^\]]+\])*)\s*\{([^}]*)\}/g)) {
    const tokens = salida[selector] ?? {};
    for (const [, nombre, valor] of cuerpo.matchAll(/--([\w-]+):\s*(#[0-9A-Fa-f]{6}|var\(--[\w-]+\))\s*;/g)) {
      tokens[nombre] = valor;
    }
    salida[selector] = tokens;
  }
  return salida;
}

// R24: the dark palette lives once, under html { --nombre-oscuro: #hex; },
// on purpose outside the selectors that bloques() reads (see estilo.css).
// This reads every custom property of the file, by name, with no regard for
// its selector, so a var(--x-oscuro) reference can resolve to its value.
function variablesGlobales(css) {
  const mapa = {};
  for (const [, nombre, valor] of css.matchAll(/--([\w-]+):\s*(#[0-9A-Fa-f]{6})\s*;/g)) {
    mapa[nombre] = valor;
  }
  return mapa;
}

function resolverPaleta(paleta, variables) {
  const resuelta = {};
  for (const [nombre, valor] of Object.entries(paleta)) {
    const referencia = /^var\(--([\w-]+)\)$/.exec(valor);
    resuelta[nombre] = referencia ? variables[referencia[1]] : valor;
  }
  return resuelta;
}

// The four palettes of R16, resolved to literal hex values. Shared by the
// two tests that need them, so a token that only a "billetes" block touches
// never slips past either one (fold-in item 2).
function construirPaletas(css) {
  const bloquesCss = bloques(css);
  const variables = variablesGlobales(css);
  const paleta = (...partes) => resolverPaleta(
    partes.reduce((todo, parte) => ({ ...todo, ...bloquesCss[parte] }), {}), variables,
  );
  return {
    claro: paleta(":root"),
    oscuro: paleta(":root", TEMA),
    "billetes claro": paleta(":root", VISTA),
    "billetes oscuro": paleta(":root", TEMA, VISTA, AMBOS),
    // The order matters: SISTEMA_BILLETES must resolve last, exactly as its
    // higher CSS specificity makes it win over the plain VISTA block.
    "billetes sistema oscuro": paleta(":root", SISTEMA_OSCURO, VISTA, SISTEMA_BILLETES),
  };
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
const SISTEMA_OSCURO = ':root[data-tema="sistema"]';
const VISTA = ':root[data-vista="billetes"]';
const AMBOS = ':root[data-vista="billetes"][data-tema="oscuro"]';
// R16 (review, fix round 1): a fifth palette. "sistema" on a dark system,
// with "Billetes" on, must give the same dark bill colours as the forced
// dark look, and never the light ones. Its selector needs the specificity
// of two attributes, like AMBOS, or a later light-only block wins instead.
const SISTEMA_BILLETES = ':root[data-tema="sistema"][data-vista="billetes"]';

test("las cuatro paletas cumplen el contraste de cada par", () => {
  const css = leer("../site/estilo.css");
  const paletas = construirPaletas(css);
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
      // Every text holds 4.5:1, on a row under the pointer too. R25: --dato
      // (the line of the execution and the deviation) holds it too.
      for (const token of ["texto", "tenue", "acento", "dato"]) {
        const razon = contraste(paleta[token], paleta[suelo]);
        if (!(razon >= 4.5)) {
          fallas.push(`${nombre}: --${token} on --${suelo} is ${razon.toFixed(2)}`);
        }
      }
    }
  }
  assert.deepEqual(fallas, []);
  assert.equal(Object.keys(paletas["billetes oscuro"]).length, 17, "every palette has 17 tokens");

  // R24: the system dark path gives the same tokens as the forced dark path,
  // because both only read the dark palette that html {} holds once.
  const bloquesCss = bloques(css);
  const variables = variablesGlobales(css);
  const sistemaOscuro = resolverPaleta({ ...bloquesCss[":root"], ...bloquesCss[SISTEMA_OSCURO] }, variables);
  assert.deepEqual(sistemaOscuro, paletas.oscuro);
});

test("la pista del interruptor apagado tiene 3:1 contra el fondo de la barra", () => {
  // WCAG 1.4.11: --regla alone gives 1.32:1 in light and 1.54:1 in dark. The
  // off track needs a border or shadow from a token that holds 3:1. The
  // header sets no background of its own, so the ground is --fondo.
  const css = leer("../site/estilo.css");
  const apagada = /\.interruptor\[aria-checked="false"\]\s*\.pista\s*\{([^}]*)\}/.exec(css)?.[1] ?? "";
  const token = /var\(--([\w-]+)\)/.exec(apagada)?.[1];
  assert.ok(token, "the off track needs a border or shadow from a palette token");
  // Fold-in item 2: reuse the four-palette map, so a later token in a
  // "billetes" block cannot slip past.
  const paletas = construirPaletas(css);
  for (const [nombre, paleta] of Object.entries(paletas)) {
    const razon = contraste(paleta[token], paleta.fondo);
    assert.ok(razon >= 3, `${nombre}: --${token} on --fondo is ${razon.toFixed(2)}`);
  }
});

test("el subrayado de la fuente usa el color del texto, no --regla", () => {
  // Review, fix round 1, item 4: --regla alone holds well under 3:1 against
  // both grounds (1.42:1 on --panel light, 1.32:1 on --fondo, 1.37:1 on
  // --panel dark), so the underline of the one control the foot now has
  // must take its colour from the text itself, already verified at 4.5:1.
  const css = leer("../site/estilo.css");
  const cuerpo = /\.fuente-control\s*\{([^}]*)\}/.exec(css)?.[1] ?? "";
  assert.match(cuerpo, /text-decoration-color:\s*currentColor\s*;/);
});

test("el script de index.html lee las mismas claves que tema.js", () => {
  // The inline script applies the look before the first paint. A key that
  // differs from tema.js would flash the default look on every visit. R13:
  // "sistema" is a value like the others, and estilo.css alone answers
  // prefers-color-scheme, so the script needs no matchMedia at all.
  const pagina = leer("../site/index.html");
  assert.ok(pagina.includes(`"${CLAVE_OSCURO}"`));
  assert.ok(pagina.includes(`"${CLAVE_BILLETES}"`));
  assert.match(pagina, /data-tema="sistema"/, "sistema is the first value, and it wins");
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
  // escribir(documento, id, ...) also reaches the DOM by id (fold-in item
  // 1): subtitulo, detalle, fuente-dialogo-medida and codigos read no other
  // way, and this alternation missed all four before.
  for (const [, id] of codigo.matchAll(/(?:parte\(documento,\s*|getElementById\(|escribir\(documento,\s*)"([\w-]+)"/g)) {
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
  // R13: "tema" cycles three states, so it is a plain button, not a switch.
  assert.match(pagina, /id="tema"[^>]*data-interruptor="tema"/, "tema names itself");
  assert.doesNotMatch(pagina, /id="tema"[^>]*role="switch"/, "a switch has two states, tema has three");
  // R23: "billetes" keeps its two states and its role.
  assert.match(pagina,
    /id="billetes"[^>]*role="switch"[^>]*data-interruptor="billetes"/,
    "billetes must be a switch that names itself");
  assert.match(pagina, /id="grafico"[^>]*aria-hidden="true"/, "the chart is decorative");
  assert.match(pagina, /id="total"[^>]*aria-hidden="true"/,
    "the odometer is decorative; total-texto reads for it");
  assert.match(pagina, /id="aviso"[^>]*role="status"/, "the live region announces politely");
  // R22: the foot shows one line, always, and it opens the dialog with the
  // rest of the source (INV-03: the name of the source is visible with no
  // action).
  assert.match(pagina,
    /id="fuente-control"[^>]*data-abrir-fuente=""[^>]*>\s*Fuente: Presupuesto Abierto, Ministerio de Economía\.\s*</,
    "the foot names the source in one line, with no action needed to see it");
  assert.match(pagina, /<dialog[^>]*id="fuente-dialogo"/, "R22: a native dialog, no library");
  // Review, fix round 1, item 6: these three were required and asserted
  // nowhere, so deleting any of them kept the suite green.
  assert.match(pagina, /id="billetes"[^>]*aria-label="Billetes"/,
    "R23: billetes loses its word for an accessible name");
  const billetes = /<button[^>]*id="billetes"[\s\S]*?<\/button>/.exec(pagina)?.[0] ?? "";
  assert.match(billetes, /<svg[^>]*>/, "R23: billetes shows an inline icon");
  assert.match(pagina,
    /<button[^>]*id="fuente-dialogo-cerrar"[^>]*data-cerrar-fuente=""[^>]*>Cerrar<\/button>/,
    "R22: the dialog closes with a Cerrar button");
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
