"""One row of the source file.

Every row carries the codes of its own path as columns, so the build needs no
join. A code that is empty ends the path: the levels below it do not apply to
that row.
"""

import csv
from typing import Iterator

from build.measures import Medidas, Monto, parse_monto

EJES = (
    "jurisdiccion",
    "subjurisdiccion",
    "entidad",
    "servicio",
    "programa",
    "subprograma",
    "proyecto",
    "actividad",
    "obra",
    "inciso",
    "principal",
    "parcial",
    "subparcial",
)

MEDIDAS = (
    "credito_presupuestado",
    "credito_vigente",
    "credito_comprometido",
    "credito_devengado",
    "credito_pagado",
)

COLUMNAS_NECESARIAS = tuple(
    [columna for eje in EJES for columna in (f"{eje}_id", f"{eje}_desc")]
    + list(MEDIDAS)
)
"""Every column that the build reads. Section 8 of the design spec: a column
that changed its name makes the parser fail. A missing measure would read as
zero, and the official check sees only the total of credito_devengado. A
missing <eje>_id would cut every camino at that level. Both publish a wrong
number and report nothing."""

NIVEL_DE_CONTROL = 7
"""The level of the proyecto. The credito vigente is a legal limit here and
above it. Below it, the number is an internal distribution. Measured on the
exercise 2025: 0 exceptions in 2,673 nodos, and 12.7% of the actividades break
it."""


def leer_filas(ruta) -> Iterator[dict]:
    """Read the CSV. The file starts with a byte order mark.

    Check the header before the first row. A build that stops here reports a
    failed exercise, and the other exercises still publish.
    """
    with open(ruta, encoding="utf-8-sig", newline="") as archivo:
        lector = csv.DictReader(archivo)
        verificar_cabecera(lector.fieldnames)
        yield from lector


def verificar_cabecera(columnas) -> None:
    """Raise when the header lacks a column that the build reads."""
    presentes = {(columna or "").strip() for columna in (columnas or ())}
    faltantes = [c for c in COLUMNAS_NECESARIAS if c not in presentes]
    if faltantes:
        raise ValueError(
            "the source file lacks the column(s) "
            + ", ".join(faltantes)
            + ". The build reads every one of them. A missing column would "
            "publish a zero or a cut camino, and no check would see it."
        )


def camino_de(fila: dict) -> tuple:
    """The identity of the nodo of this row. INV-05: the full path."""
    codigos = []
    for eje in EJES:
        codigo = (fila.get(f"{eje}_id") or "").strip()
        if codigo == "":
            break
        codigos.append(codigo)
    return tuple(codigos)


def nombre_de(fila: dict, profundidad: int) -> str:
    return (fila.get(f"{EJES[profundidad - 1]}_desc") or "").strip()


def medidas_de(fila: dict, ejercicio: int) -> Medidas:
    def leer(campo: str) -> Monto:
        return parse_monto(fila.get(campo), ejercicio)

    return Medidas(
        leer("credito_presupuestado"),
        leer("credito_vigente"),
        leer("credito_comprometido"),
        leer("credito_devengado"),
        leer("credito_pagado"),
    )
