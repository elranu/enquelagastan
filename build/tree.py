"""The tree of one exercise.

One pass over the rows. Each row is a leaf, and the build adds its measures to
every ancestor of its camino.
"""

import sys
from dataclasses import dataclass, field

from build.measures import Medidas, MedidasCero
from build.rows import camino_de, medidas_de, nombre_de


@dataclass
class Nodo:
    camino: tuple
    nombre: str
    medidas: Medidas
    hijos: set = field(default_factory=set)


def nivel(camino: tuple) -> int:
    return len(camino)


def construir(filas, ejercicio: int) -> dict:
    """Make the tree. The key of a nodo is its full camino, and never its last
    code. INV-05."""
    arbol: dict = {}
    avisados: set = set()
    for fila in filas:
        camino = camino_de(fila)
        if not camino:
            continue
        medidas = medidas_de(fila, ejercicio)
        for corte in range(1, len(camino) + 1):
            clave = camino[:corte]
            nodo = arbol.get(clave)
            if nodo is None:
                nodo = Nodo(clave, nombre_de(fila, corte), MedidasCero(ejercicio))
                arbol[clave] = nodo
            else:
                _avisar_de_un_nombre_distinto(nodo, nombre_de(fila, corte),
                                              avisados)
            nodo.medidas = nodo.medidas.mas(medidas)
            if corte > 1:
                arbol[camino[: corte - 1]].hijos.add(camino[corte - 1])
    return arbol


def _avisar_de_un_nombre_distinto(nodo: Nodo, nombre: str,
                                  avisados: set) -> None:
    """Report two rows that give two names to one camino.

    The nodo keeps the name of the row that made it. A second name means that
    the source disagrees with itself. The number stays right, and the label can
    be wrong. This prints one line and does not stop the build.
    """
    if not nombre or nombre == nodo.nombre or nodo.camino in avisados:
        return
    avisados.add(nodo.camino)
    print(f"the camino {nodo.camino} has two names: {nodo.nombre!r} and "
          f"{nombre!r}. The build keeps the first one.", file=sys.stderr)
