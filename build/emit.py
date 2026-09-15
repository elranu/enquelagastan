"""The JSON files that the navigator reads.

The partition cuts the tree where the product changes its question. One file
holds "who spends it". One small file per leaf holds "what they spend it
on". After the first file, every movement inside the institutional axis needs
no network.
"""

import json
import pathlib

from build.tree import nivel

NIVELES_INSTITUCIONALES = 9


def clave_de_archivo(camino: tuple) -> str:
    return "-".join(camino)


def _nodo_a_json(nodo) -> dict:
    return {
        "n": nodo.nombre,
        "d": round(nodo.medidas.devengado.millones, 6),
        "p": round(nodo.medidas.presupuestado.millones, 6),
        "v": round(nodo.medidas.vigente.millones, 6),
        "g": round(nodo.medidas.pagado.millones, 6),
        "k": sorted(nodo.hijos),
    }


def _escribir(ruta: pathlib.Path, datos: dict) -> None:
    ruta.parent.mkdir(parents=True, exist_ok=True)
    ruta.write_text(
        json.dumps(datos, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )


def escribir_ejercicio(arbol: dict, ejercicio: int,
                       destino: pathlib.Path) -> dict:
    """Write the institutional file. Write one file per leaf. Give a summary."""
    carpeta = destino / str(ejercicio)
    institucional = {
        clave_de_archivo(camino): _nodo_a_json(nodo)
        for camino, nodo in arbol.items()
        if nivel(camino) <= NIVELES_INSTITUCIONALES
    }
    _escribir(carpeta / "institucional.json", institucional)

    hojas = [
        camino for camino in arbol
        if nivel(camino) == NIVELES_INSTITUCIONALES
        # A camino with no hijos ends the institutional axis early. It
        # counts as a hoja, but it gets no object file: it has no
        # descendant, so its group in `grupos` is empty.
        or (nivel(camino) < NIVELES_INSTITUCIONALES and not arbol[camino].hijos)
    ]

    grupos: dict = {}
    for camino, nodo in arbol.items():
        if nivel(camino) > NIVELES_INSTITUCIONALES:
            prefijo = camino[:NIVELES_INSTITUCIONALES]
            grupos.setdefault(prefijo, {})[clave_de_archivo(camino)] = \
                _nodo_a_json(nodo)
    for hoja, debajo in grupos.items():
        _escribir(carpeta / "objeto" / f"{clave_de_archivo(hoja)}.json",
                  debajo)
    return {"nodos": len(arbol), "institucional": len(institucional),
            "hojas": len(hojas)}


def escribir_manifiesto(destino: pathlib.Path, entradas: list) -> None:
    """The manifest names the file of every exercise. It names the date too.
    INV-03.

    The build commits this file on every change. The commit keeps the
    repository active. The scheduled workflow does not stop. The history
    becomes a public record of every change in the official numbers.
    """
    _escribir(destino / "manifest.json", {"ejercicios": entradas})
