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
SEPARADOR = "-"


def clave_de_archivo(camino: tuple) -> str:
    """Join the camino into one file key.

    The separator makes this encoding lossy when a code holds the separator
    itself. The caminos ("88", "1-0", "100") and ("88", "1", "0-100") would
    give one key, and one file would overwrite the other. INV-05 would die at
    the boundary of the file system. No code of the source holds a hyphen
    today, so this guard stops a future change of the source.
    """
    for codigo in camino:
        if SEPARADOR in codigo:
            raise ValueError(
                f"the code {codigo!r} of the camino {camino} holds "
                f"{SEPARADOR!r}, which the file key uses to join the codes. "
                "INV-05 needs another separator."
            )
    return SEPARADOR.join(camino)


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
        # A camino with no hijos ends its path early. It still counts
        # as a hoja. It has no descendant. Its group in `grupos` stays
        # empty. It gets no object file.
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

    The workflow commits this file on every change. The history becomes a
    public record of every change in the official numbers. Only a change of
    the official numbers writes here. The heartbeat keeps its own file, so it
    does not drown that signal.
    """
    _escribir(destino / "manifest.json", {"ejercicios": entradas})


def escribir_latido(destino: pathlib.Path, fecha: str) -> None:
    """Write the date of this run in UTC.

    GitHub disables a scheduled workflow after 60 days with no activity in a
    public repository. The workflow commits this file every day, so the
    repository never goes quiet. The manifest cannot do this job: it changes
    only when the official numbers change, and a closed exercise never
    changes.
    """
    _escribir(destino / "heartbeat.json", {"ultima_corrida_utc": fecha})
