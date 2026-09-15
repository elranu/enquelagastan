"""The pipeline of the build.

Read the header. Stop when nothing changed. Download, aggregate, verify, and
write. A verification that fails writes nothing. The previous publication
stays.
"""

import argparse
import json
import pathlib
import sys
import tempfile
import urllib.request
from dataclasses import dataclass, replace

from build import emit, sources, verify
from build.measures import Monto
from build.rows import NIVEL_DE_CONTROL, leer_filas
from build.tree import construir

EJERCICIOS = (2024, 2025, 2026)


@dataclass
class Resultado:
    """The result of building one exercise."""

    estado: str
    verificacion: object = None
    resumen: dict = None
    cabecera: object = None


def _leer_cabecera(ejercicio: int) -> sources.Cabecera:
    return sources.leer_cabecera(sources.url_credito(ejercicio))


def _bajar_csv(ejercicio: int, carpeta: pathlib.Path) -> pathlib.Path:
    return sources.descargar_y_abrir(sources.url_credito(ejercicio), carpeta)


def _leer_reporte(ejercicio: int) -> list:
    url = sources.URL_REPORTE_OFICIAL.format(ejercicio=ejercicio)
    with urllib.request.urlopen(url) as respuesta:
        return json.loads(respuesta.read().decode("utf-8"))


def _total_del_ejercicio(arbol: dict, ejercicio: int) -> Monto:
    """Sum the devengado of the top-level nodos. They partition every row."""
    total = Monto(0.0, ejercicio)
    for camino, nodo in arbol.items():
        if len(camino) == 1:
            total = total + nodo.medidas.devengado
    return total


def construir_ejercicio(ejercicio, destino, leer_cabecera=_leer_cabecera,
                        bajar_csv=_bajar_csv, leer_reporte=_leer_reporte,
                        cabecera_anterior=None, total_anterior=None) -> Resultado:
    """Build one exercise. Verify before writing.

    INV-02: a verification that fails writes nothing.
    """
    cabecera = leer_cabecera(ejercicio)
    if cabecera_anterior is not None and cabecera == cabecera_anterior:
        return Resultado("sin-cambios", cabecera=cabecera)

    with tempfile.TemporaryDirectory() as temporal:
        ruta_csv = bajar_csv(ejercicio, pathlib.Path(temporal))
        arbol = construir(leer_filas(ruta_csv), ejercicio)

    total = _total_del_ejercicio(arbol, ejercicio)

    reporte = leer_reporte(ejercicio)
    verificacion = verify.verificar_total(
        total,
        verify.total_oficial_del_reporte(reporte),
        sources.URL_REPORTE_OFICIAL.format(ejercicio=ejercicio),
    )
    if not verificacion.paso:
        return Resultado("fallido", verificacion, cabecera=cabecera)

    verificacion_caida = verify.comparar_con_el_build_anterior(
        total, total_anterior,
    )
    if not verificacion_caida.paso:
        return Resultado("fallido", verificacion_caida, cabecera=cabecera)

    pasados = verify.nodos_que_pasan_el_limite(arbol)
    if pasados:
        motivo = (
            f"{len(pasados)} node(s) pass their own vigente limit. "
            f"The control level is {NIVEL_DE_CONTROL}."
        )
        verificacion_limite = replace(verificacion, paso=False, motivo=motivo)
        return Resultado("fallido", verificacion_limite, cabecera=cabecera)

    resumen = emit.escribir_ejercicio(arbol, ejercicio, destino)
    return Resultado("publicado", verificacion, resumen, cabecera)


def _leer_manifiesto_anterior(destino: pathlib.Path) -> dict:
    """Read the manifest of the last build. Map every ejercicio to its entry.

    Give an empty map when the file is absent, so the first build runs with
    no previous state. Give an empty map on a broken file too, and print one
    line, instead of stopping the run.
    """
    ruta = destino / "manifest.json"
    if not ruta.exists():
        return {}
    try:
        datos = json.loads(ruta.read_text(encoding="utf-8"))
        return {entrada["ejercicio"]: entrada for entrada in datos["ejercicios"]}
    except (OSError, ValueError, KeyError, TypeError) as error:
        aviso = f"manifest.json is broken ({error}). No previous state."
        print(aviso, file=sys.stderr)
        return {}


def _valores_anteriores(anteriores: dict, ejercicio: int):
    """Give the cabecera_anterior and total_anterior of one exercise.

    Give (None, None) when the manifest holds no entry for it, or an entry
    that is missing a field this needs.
    """
    entrada = anteriores.get(ejercicio)
    if entrada is None:
        return None, None
    try:
        cabecera_anterior = sources.Cabecera(entrada["publicado"],
                                             entrada["largo"])
        return cabecera_anterior, entrada["total_devengado"]
    except (KeyError, TypeError):
        return None, None


def main(argv=None) -> int:
    analizador = argparse.ArgumentParser(prog="python -m build")
    analizador.add_argument("--destino", default="site/data")
    analizador.add_argument("--ejercicio", type=int, action="append")
    opciones = analizador.parse_args(argv)

    destino = pathlib.Path(opciones.destino)
    anteriores = _leer_manifiesto_anterior(destino)
    entradas = dict(anteriores)
    fallo = False
    for ejercicio in (opciones.ejercicio or EJERCICIOS):
        cabecera_anterior, total_anterior = _valores_anteriores(
            anteriores, ejercicio)
        resultado = construir_ejercicio(
            ejercicio, destino,
            cabecera_anterior=cabecera_anterior,
            total_anterior=total_anterior,
        )
        print(f"{ejercicio}: {resultado.estado}")
        if resultado.estado == "fallido":
            print(f"  {resultado.verificacion.motivo}", file=sys.stderr)
            fallo = True
        elif resultado.estado == "publicado":
            entradas[ejercicio] = {
                "ejercicio": ejercicio,
                "archivo": sources.url_credito(ejercicio),
                "publicado": resultado.cabecera.last_modified,
                "largo": resultado.cabecera.largo,
                "total_devengado": resultado.verificacion.total_propio,
                "verificado": True,
            }

    nuevas = [entradas[ejercicio] for ejercicio in sorted(entradas)]
    viejas = [anteriores[ejercicio] for ejercicio in sorted(anteriores)]
    if nuevas != viejas:
        emit.escribir_manifiesto(destino, nuevas)
    return 1 if fallo else 0


if __name__ == "__main__":
    raise SystemExit(main())
