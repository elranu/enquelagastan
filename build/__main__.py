"""The pipeline of the build.

Download, aggregate, verify, and write. Every exercise runs every time. A
verification that fails writes nothing for that exercise, and it does not stop
another exercise.
"""

import argparse
import datetime
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

SIN_PUBLICACION = 2
"""The exit code of a run that published no exercise.

The workflow reads this code. It does not upload the artifact, and it does
not deploy. The live site keeps the data of the last good run. A code of 1
means that one exercise or more published, so the artifact holds data.
"""


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
                        total_anterior=None) -> Resultado:
    """Build one exercise. Verify before writing.

    INV-02: a verification that fails writes nothing.

    The build downloads the file every run. It does not compare the header
    against the last run. The file is 3.5 MB, and three of them cost nothing
    once a day. A build that skipped the work also skipped the write, and the
    workflow then published a site with no data.
    """
    cabecera = leer_cabecera(ejercicio)
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

    no_suman = verify.nodos_que_no_suman(arbol)
    if no_suman:
        camino, propio, suma = no_suman[0]
        motivo = (
            f"{len(no_suman)} nodo(s) do not equal the sum of their children. "
            f"INV-04. The first one is {camino}: the nodo holds {propio} and "
            f"its children add to {suma}, in millions."
        )
        verificacion_suma = replace(verificacion, paso=False, motivo=motivo)
        return Resultado("fallido", verificacion_suma, cabecera=cabecera)

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


def _total_anterior(anteriores: dict, ejercicio: int):
    """Give the total_devengado that the last build published.

    Give None when the manifest holds no entry for this exercise, or an entry
    with no total. The check that reads this value then treats the run as the
    first build.
    """
    entrada = anteriores.get(ejercicio)
    if not isinstance(entrada, dict):
        return None
    total = entrada.get("total_devengado")
    return total if isinstance(total, (int, float)) else None


def _resultado_de_la_excepcion(ejercicio: int, error: Exception) -> Resultado:
    """Turn an exception of one exercise into a failed Resultado."""
    motivo = (
        f"the build of the exercise {ejercicio} raised "
        f"{type(error).__name__}: {error}"
    )
    verificacion = verify.Verificacion(0.0, 0.0, 0.0, "the build of this run",
                                       False, motivo)
    return Resultado("fallido", verificacion)


def main(argv=None) -> int:
    analizador = argparse.ArgumentParser(prog="python -m build")
    analizador.add_argument("--destino", default="site/data")
    analizador.add_argument("--ejercicio", type=int, action="append")
    opciones = analizador.parse_args(argv)

    destino = pathlib.Path(opciones.destino)
    anteriores = _leer_manifiesto_anterior(destino)
    entradas = dict(anteriores)
    fallo = False
    publicados = 0
    for ejercicio in (opciones.ejercicio or EJERCICIOS):
        try:
            resultado = construir_ejercicio(
                ejercicio, destino,
                total_anterior=_total_anterior(anteriores, ejercicio),
            )
        except Exception as error:
            # A download that fails, a ZIP that arrives cut, or a report
            # that is not JSON raises here. The exception stops this
            # exercise alone. The loop goes on, and the heartbeat lands.
            resultado = _resultado_de_la_excepcion(ejercicio, error)
        print(f"{ejercicio}: {resultado.estado}")
        if resultado.estado == "fallido":
            print(f"  {resultado.verificacion.motivo}", file=sys.stderr)
            # This exercise wrote no file in this run. The other exercises
            # still publish. The run exits non-zero, so a person looks.
            print(f"  the exercise {ejercicio} holds no data in this run",
                  file=sys.stderr)
            fallo = True
            entrada = entradas.get(ejercicio)
            if isinstance(entrada, dict):
                # Keep the entry, because total_devengado is the baseline of
                # the next run. Say that this artifact holds no data for it.
                entradas[ejercicio] = {**entrada, "en_este_artefacto": False}
        elif resultado.estado == "publicado":
            publicados += 1
            entradas[ejercicio] = {
                "ejercicio": ejercicio,
                "archivo": sources.url_credito(ejercicio),
                "publicado": resultado.cabecera.last_modified,
                "largo": resultado.cabecera.largo,
                "total_devengado": resultado.verificacion.total_propio,
                "verificado": True,
                "en_este_artefacto": True,
            }

    nuevas = [entradas[ejercicio] for ejercicio in sorted(entradas)]
    viejas = [anteriores[ejercicio] for ejercicio in sorted(anteriores)]
    if nuevas != viejas:
        emit.escribir_manifiesto(destino, nuevas)
    emit.escribir_latido(
        destino,
        datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d"),
    )
    if publicados == 0:
        print("no exercise published. The workflow keeps the live site.",
              file=sys.stderr)
        return SIN_PUBLICACION
    return 1 if fallo else 0


if __name__ == "__main__":
    raise SystemExit(main())
