"""The verification of a build.

The official report "Cuenta Ahorro Inversion Financiamiento" aggregates the
same rows that this project reads. So a total that this project computes must
equal the official total. On the exercise 2025 the difference was 0 for the
spending and 1 peso for the revenue.

The hard rule: the build does not publish a total that differs from the
official total. The only asset of this product is that its numbers are the
numbers of the state.
"""

from dataclasses import dataclass

from build.measures import Monto
from build.rows import NIVEL_DE_CONTROL
from build.tree import nivel

TOLERANCIA_PESOS = 1000.0
"""The observed difference is 0 to 1 peso. Two causes make it. The CSV keeps a
limited number of decimals. The build also adds about 113,000 float values, and
every addition can lose a fraction. A real error is millions, so this value
separates the two with room. Do not tighten it on the decimals alone."""

CONCEPTO_GASTO = "VII GASTOS TOTALES"


@dataclass(frozen=True)
class Verificacion:
    total_propio: float
    total_oficial: float
    diferencia: float
    fuente: str
    paso: bool
    motivo: str


def total_oficial_del_reporte(reporte: list) -> float:
    for fila in reporte:
        if fila.get("concepto", "").startswith(CONCEPTO_GASTO):
            return float(fila["administracionNacional"])
    raise ValueError(
        f"the official report holds no row that starts with {CONCEPTO_GASTO!r}"
    )


def verificar_total(total_propio: Monto, total_oficial: float,
                    fuente: str) -> Verificacion:
    diferencia = abs(total_propio.pesos - total_oficial)
    paso = diferencia <= TOLERANCIA_PESOS
    motivo = "" if paso else (
        f"the total of this build is {total_propio.pesos:,.0f} and the official "
        f"total is {total_oficial:,.0f}. The difference is {diferencia:,.0f} "
        f"pesos, and the limit is {TOLERANCIA_PESOS:,.0f}."
    )
    return Verificacion(total_propio.pesos, total_oficial, diferencia, fuente,
                        paso, motivo)


CAIDA_MAXIMA = 0.01
"""A drop of more than 1% stops the build. The devengado of one exercise
accumulates through the year. So it grows, and it never goes down. A
correction of the publisher can move a total a little. A file that arrived
cut moves it a lot."""


def comparar_con_el_build_anterior(total_propio: Monto,
                                   total_anterior) -> Verificacion:
    """The second check, which depends on nobody.

    The endpoint of the official report is not in any public contract. It
    can stop without a notice. This check reads the manifest of the last
    publication. So the product does not depend on that endpoint alone.
    """
    if total_anterior is None:
        return Verificacion(total_propio.pesos, 0.0, 0.0, "the first build",
                            True, "")
    caida = total_anterior - total_propio.pesos
    parte = caida / total_anterior if total_anterior else 0.0
    paso = parte <= CAIDA_MAXIMA
    motivo = "" if paso else (
        f"the total went down from {total_anterior:,.0f} to "
        f"{total_propio.pesos:,.0f}, which is {parte:.1%}. The limit is "
        f"{CAIDA_MAXIMA:.0%}. A file that arrived cut does this."
    )
    return Verificacion(total_propio.pesos, total_anterior, caida,
                        "the manifest of the last build", paso, motivo)


def nodos_que_pasan_el_limite(arbol: dict) -> list:
    """INV-06. The credito vigente is a legal limit at the level of the proyecto
    and above it. Below that level, the number is an internal distribution.
    Money moves between the actividades of one proyecto. In 2025, 303
    actividades passed their own vigente. Their parent proyecto respected its
    limit in every one of those 303 cases."""
    return sorted(
        camino
        for camino, nodo in arbol.items()
        if nivel(camino) <= NIVEL_DE_CONTROL
        and nodo.medidas.devengado.mayor_que(nodo.medidas.vigente)
    )


TOLERANCIA_RELATIVA = 1e-9
"""The relative gap that INV-04 accepts between a nodo and its children. The
measures are floats, and the build adds about 113,000 of them. So a sum of
children and its parent can differ in the last bits. A relative limit follows
the size of the amount, which an absolute limit does not."""

TOLERANCIA_MILLONES = 1e-6
"""The absolute floor of the same check, for amounts near zero."""


MEDIDAS_PUBLICADAS = ("presupuestado", "vigente", "devengado", "pagado")
"""The measures that this check compares.

These are exactly the four measures that emit._nodo_a_json writes into the
published JSON. The navigator draws each one of them, so each one of them must
add up. The comprometido stays out, because the build computes it and publishes
it nowhere. A measure that enters _nodo_a_json must enter this tuple too.
"""


def nodos_que_no_suman(arbol: dict) -> list:
    """INV-04. The sum of the children of a nodo equals the total of the nodo.

    A row of the source can end its camino early. The build then adds that
    money to a nodo that also holds children. The nodo is right, its children
    are right, and the two do not agree. Every total above stays right, so no
    other check sees it. The navigator would draw a pie whose slices cover less
    than the parent.

    One measure alone does not see every gap. The exercise 2025 holds 31,470
    rows whose devengado is zero and whose vigente is not. A cut camino among
    those rows keeps the devengado balanced and breaks the vigente.

    Give one tuple per nodo and per measure that does not agree: the camino,
    the name of the measure, the amount of the nodo, and the sum of its
    children. All amounts are in millions.
    """
    malos = []
    for camino, nodo in arbol.items():
        if not nodo.hijos:
            continue
        hijos = [arbol[camino + (codigo,)] for codigo in nodo.hijos]
        for medida in MEDIDAS_PUBLICADAS:
            propio = getattr(nodo.medidas, medida).millones
            suma = sum(getattr(hijo.medidas, medida).millones
                       for hijo in hijos)
            limite = max(TOLERANCIA_MILLONES, abs(propio) * TOLERANCIA_RELATIVA)
            if abs(propio - suma) > limite:
                malos.append((camino, medida, propio, suma))
    return sorted(malos)
