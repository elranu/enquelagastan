import test from "node:test";
import assert from "node:assert/strict";

import {
  ancestroQueExiste, direccionEntre, ejercicioDeEntrada, ejerciciosDisponibles, entradaDe,
  escribirRuta, escrituraDe,
  leerRuta, rutaDeEntrada,
} from "../site/app/ruta.js";

const MANIFIESTO = {
  ejercicios: [
    { ejercicio: 2025, en_este_artefacto: true },
    { ejercicio: 2026, en_este_artefacto: false },
    { ejercicio: 2024, en_este_artefacto: true },
  ],
};

test("lee el ejercicio y el camino de la url", () => {
  assert.deepEqual(leerRuta("#/2025/88-1-0"), { ejercicio: 2025, clave: "88-1-0" });
  assert.deepEqual(leerRuta("#/2025"), { ejercicio: 2025, clave: "" });
  assert.deepEqual(leerRuta(""), { ejercicio: null, clave: "" });
});

test("escribe una url que se puede compartir", () => {
  assert.equal(escribirRuta(2025, "88-1-0"), "#/2025/88-1-0");
  assert.equal(escribirRuta(2025, ""), "#/2025");
});

test("un ejercicio que no esta en el artefacto no se ofrece", () => {
  assert.deepEqual(ejerciciosDisponibles(MANIFIESTO), [2024, 2025],
    "the build of that day published no data for 2026");
});

test("la entrada muestra el ultimo ejercicio cerrado", () => {
  // Decision C2 of the spec. The open exercise is not complete, so the entry
  // shows the last one that closed.
  assert.equal(ejercicioDeEntrada([2024, 2025, 2026], 2026), 2025);
  // The build of that day did not publish 2026. The last closed one is still
  // 2025, so a rule of "the one before the last available" would give 2024.
  assert.equal(ejercicioDeEntrada([2024, 2025], 2026), 2025);
  // Nothing is closed yet. Show what there is.
  assert.equal(ejercicioDeEntrada([2026], 2026), 2026);
});

test("sube al ancestro que existe en el otro ejercicio", () => {
  const indice = { "88": { n: "Capital Humano", k: ["1"] },
                   "88-1": { n: "ANSES", k: [] } };
  assert.equal(ancestroQueExiste(indice, "88-1-9-9"), "88-1");
  assert.equal(ancestroQueExiste(indice, "88-1"), "88-1");
  assert.equal(ancestroQueExiste(indice, "77-7"), null);
});

test("la raiz siempre existe", () => {
  const indice = { "88": { n: "Capital Humano", k: [] } };
  assert.equal(ancestroQueExiste(indice, ""), "");
});

test("una url sin ejercicio nunca se escribe como #/null", () => {
  // The screen of a failure is reached from a bare "#/", and its exit
  // carries no exercise. dibujar picks the exercise of entry and rewrites
  // the URL, so the route here only has to stay a route.
  assert.equal(escribirRuta(null, ""), "#/");
  assert.equal(escribirRuta(Number.NaN, "88"), "#/");
});

const ruta = (anio, clave, grupos = [], desde = null) => ({ anio, clave, grupos, desde });

test("la raiz y un nodo tienen su hash, y el estado lleva la ruta", () => {
  assert.deepEqual(entradaDe(ruta(2025, "")), {
    hash: "#/2025",
    estado: { anio: 2025, clave: "", grupos: [], desde: null },
  });
  assert.equal(entradaDe(ruta(2025, "88-1")).hash, "#/2025/88-1");
  assert.deepEqual(entradaDe({ fuentes: true }), { hash: "#/fuentes", estado: { fuentes: true } });
  assert.deepEqual(entradaDe({ info: true }), { hash: "#/info", estado: { info: true } });
});

test("un grupo otros guarda sus claves en el estado y no en la url", () => {
  // W8: a shared link opens the nodo of the group.
  const entrada = entradaDe(ruta(2025, "88", [["88-5", "88-6"]]));
  assert.equal(entrada.hash, "#/2025/88");
  assert.deepEqual(entrada.estado.grupos, [["88-5", "88-6"]]);
});

test("una entrada del historial vuelve a dar su ruta", () => {
  const original = ruta(2026, "88-9", [["88-9-1", "88-9-2"]], { anio: 2025, nombre: "Becas", monto: 4 });
  const { hash, estado } = entradaDe(original);
  assert.deepEqual(rutaDeEntrada(hash, estado), original);
  assert.deepEqual(rutaDeEntrada("#/2025/88", estado), ruta(2025, "88"),
    "a state of another place carries no group to this one");
  assert.deepEqual(rutaDeEntrada("#/2025/88", null), ruta(2025, "88"));
  assert.deepEqual(rutaDeEntrada("#/fuentes", null), { fuentes: true });
  assert.deepEqual(rutaDeEntrada("#/info", null), { info: true });
});

test("un paso agrega una entrada y un paso al mismo lugar no agrega nada", () => {
  const raiz = entradaDe(ruta(2025, ""));
  assert.equal(escrituraDe("paso", raiz, entradaDe(ruta(2025, "88"))), "push");
  assert.equal(escrituraDe("paso", raiz, entradaDe(ruta(2025, ""))), null,
    "the name of the site on the root");
  assert.equal(escrituraDe("paso", entradaDe(ruta(2025, "88")),
    entradaDe(ruta(2025, "88", [["88-5"]]))), "push", "a group is a step");
});

test("una carga que cambia el lugar reemplaza la entrada", () => {
  // R12: the link names a nodo with one child, and the navigator lands on
  // its child. Back must not return to the nodo that jumps forward.
  const salto = entradaDe(ruta(2025, "70-1"));
  assert.equal(escrituraDe("carga", { hash: "#/2025/70", estado: null }, salto), "replace");
  // The first load of a good link still writes the state.
  assert.equal(escrituraDe("carga", { hash: "#/2025/70-1", estado: null }, salto), "replace");
  assert.equal(escrituraDe("carga", salto, salto), null, "Back to an entry that holds");
  // A group that the data no longer has: draw the nodo, replace the entry.
  const conGrupo = entradaDe(ruta(2025, "88", [["88-7"]]));
  assert.equal(escrituraDe("carga", conGrupo, entradaDe(ruta(2025, "88"))), "replace");
});

test("la direccion entre dos rutas elige el movimiento", () => {
  assert.equal(direccionEntre(null, ruta(2025, "")), "inicio");
  assert.equal(direccionEntre(ruta(2025, ""), ruta(2025, "88")), "abajo");
  assert.equal(direccionEntre(ruta(2025, "88"), ruta(2025, "88-1-0")), "abajo");
  assert.equal(direccionEntre(ruta(2025, "88"), ruta(2025, "88", [["88-5"]])), "abajo");
  assert.equal(direccionEntre(ruta(2025, "88-1"), ruta(2025, "88")), "arriba");
  assert.equal(direccionEntre(ruta(2025, "", [["20"]]), ruta(2025, "")), "arriba");
  assert.equal(direccionEntre(ruta(2025, "88"), ruta(2026, "88")), "anio");
  assert.equal(direccionEntre(ruta(2025, "88"), ruta(2025, "88")), "igual");
  assert.equal(direccionEntre(ruta(2025, "88"), ruta(2025, "90")), "salto");
  assert.equal(direccionEntre(ruta(2025, "88"), { fuentes: true }), "salto");
  assert.equal(direccionEntre(ruta(2025, "88"), { info: true }), "salto");
  assert.equal(direccionEntre({ info: true }, { info: true }), "igual");
  assert.equal(direccionEntre({ fuentes: true }, { info: true }), "salto");
  assert.equal(direccionEntre(ruta(2025, "88-10"), ruta(2025, "88-1")), "salto",
    "a clave is a camino, not a prefix of text");
});
