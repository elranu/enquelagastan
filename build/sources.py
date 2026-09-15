"""The open files of the national spending.

These files need no token. The official site offers the same URLs on its own
page of open data, so the number that this project shows can be checked against
the file that the state publishes. Licence CC BY 4.0.
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
    return f"{REPOSITORIO}/{ejercicio}/recursos-anual-{ejercicio}.zip"


@dataclass(frozen=True)
class Cabecera:
    last_modified: str
    largo: int


def leer_cabecera(url: str, abrir=urllib.request.urlopen) -> Cabecera:
    """Read the header of the file. The build downloads nothing when the value
    of Last-Modified did not change, so it needs no knowledge of the cadence of
    the publisher."""
    peticion = urllib.request.Request(url, method="HEAD")
    with abrir(peticion) as respuesta:
        cabeceras = respuesta.headers
        return Cabecera(
            cabeceras.get("Last-Modified", ""),
            int(cabeceras.get("Content-Length", 0) or 0),
        )


def descargar_y_abrir(url: str, destino: pathlib.Path,
                      abrir=urllib.request.urlopen) -> pathlib.Path:
    """Download the ZIP and unzip its only CSV. Give the path of the CSV."""
    destino.mkdir(parents=True, exist_ok=True)
    zip_local = destino / url.rsplit("/", 1)[-1]
    peticion = urllib.request.Request(url)
    with abrir(peticion) as respuesta, open(zip_local, "wb") as archivo:
        shutil.copyfileobj(respuesta, archivo)
    with zipfile.ZipFile(zip_local) as comprimido:
        nombres = [n for n in comprimido.namelist() if n.lower().endswith(".csv")]
        if len(nombres) != 1:
            raise ValueError(f"{url} holds {len(nombres)} CSV files, it needs 1")
        comprimido.extract(nombres[0], destino)
    return destino / nombres[0]
