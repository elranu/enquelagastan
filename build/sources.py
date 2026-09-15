"""The open files of the national spending.

These files need no token. The official site offers these same URLs. A reader
can check any number of this product against the file that the state
publishes. Licence CC BY 4.0.
"""

import pathlib
import shutil
import urllib.request
import zipfile
from dataclasses import dataclass

REPOSITORIO = "https://dgsiaf-repo.mecon.gob.ar/repository/pa/datasets"
URL_REPORTE_OFICIAL = (
    "https://www.presupuestoabierto.gob.ar/sici/rest-api/reporte"
    "/cta-aif-base-devengado/{ejercicio}"
)


def url_credito(ejercicio: int) -> str:
    return f"{REPOSITORIO}/{ejercicio}/credito-anual-{ejercicio}.zip"


def url_recursos(ejercicio: int) -> str:
    """The file of the revenue. The screen of the fiscal result needs it, and
    that screen is future work. See the design spec, P3."""
    return f"{REPOSITORIO}/{ejercicio}/recursos-anual-{ejercicio}.zip"


TIEMPO_LIMITE = 120
"""The limit in seconds of one read of the network.

The whole build of three exercises takes about 16 seconds, downloads included.
So a single read that passes two minutes is a host that stalled, and not a slow
day. Without a limit the scheduled job runs until the platform kills it, the
heartbeat never lands, and nobody reads the failure. This limit makes the
failure loud and fast. Raise it only if a real download ever needs more.
"""


@dataclass(frozen=True)
class Cabecera:
    last_modified: str
    largo: int


def leer_cabecera(url: str, abrir=urllib.request.urlopen) -> Cabecera:
    """Read the header of the file. The manifest records Last-Modified and
    Content-Length, so a reader can see which file made a published number.

    Raise when the header carries no Last-Modified. INV-03 needs that date.
    """
    peticion = urllib.request.Request(url, method="HEAD")
    with abrir(peticion, timeout=TIEMPO_LIMITE) as respuesta:
        cabeceras = respuesta.headers
    last_modified = (cabeceras.get("Last-Modified") or "").strip()
    if not last_modified:
        raise ValueError(
            f"{url} gives no Last-Modified. INV-03: every number of this "
            "product names the file that made it and the date of that file. "
            "A number with no date has no provenance, so this exercise fails."
        )
    # Content-Length is not part of INV-03. The manifest records it, and the
    # only reader compares one run against the next. A host that answers with
    # a chunked encoding sends no length. That must not stop an exercise, so a
    # missing length stays 0.
    return Cabecera(last_modified,
                    int(cabeceras.get("Content-Length", 0) or 0))


def descargar_y_abrir(url: str, destino: pathlib.Path,
                      abrir=urllib.request.urlopen) -> pathlib.Path:
    """Download the ZIP and unzip its only CSV. Give the path of the CSV."""
    destino.mkdir(parents=True, exist_ok=True)
    zip_local = destino / url.rsplit("/", 1)[-1]
    peticion = urllib.request.Request(url)
    with abrir(peticion, timeout=TIEMPO_LIMITE) as respuesta, \
            open(zip_local, "wb") as archivo:
        shutil.copyfileobj(respuesta, archivo)
    with zipfile.ZipFile(zip_local) as comprimido:
        nombres = [n for n in comprimido.namelist() if n.lower().endswith(".csv")]
        if len(nombres) != 1:
            raise ValueError(f"{url} holds {len(nombres)} CSV files, it needs 1")
        comprimido.extract(nombres[0], destino)
    return destino / nombres[0]
