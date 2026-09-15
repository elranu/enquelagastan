import io
import pathlib
import tempfile
import unittest
import zipfile

from build.sources import (
    Cabecera,
    descargar_y_abrir,
    leer_cabecera,
    url_credito,
    url_recursos,
)


def zip_en_memoria(nombres_y_contenidos):
    """Build a ZIP in memory and give the bytes it holds."""
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w") as comprimido:
        for nombre, contenido in nombres_y_contenidos:
            comprimido.writestr(nombre, contenido)
    return buffer.getvalue()


class FalsaRespuesta:
    def __init__(self, cabeceras):
        self.headers = cabeceras

    def __enter__(self):
        return self

    def __exit__(self, *_):
        return False


class TestSources(unittest.TestCase):
    def test_las_urls_del_ejercicio(self):
        self.assertEqual(
            url_credito(2025),
            "https://dgsiaf-repo.mecon.gob.ar/repository/pa/datasets/2025"
            "/credito-anual-2025.zip",
        )
        self.assertEqual(
            url_recursos(2026),
            "https://dgsiaf-repo.mecon.gob.ar/repository/pa/datasets/2026"
            "/recursos-anual-2026.zip",
        )

    def test_lee_la_cabecera_sin_bajar_el_archivo(self):
        def abrir(peticion):
            self.assertEqual(peticion.get_method(), "HEAD")
            return FalsaRespuesta(
                {"Last-Modified": "Wed, 08 Jul 2026 10:39:43 GMT",
                 "Content-Length": "3641337"}
            )

        cabecera = leer_cabecera(url_credito(2025), abrir=abrir)
        self.assertEqual(cabecera,
                         Cabecera("Wed, 08 Jul 2026 10:39:43 GMT", 3641337))

    def test_una_cabecera_sin_last_modified(self):
        def abrir(peticion):
            return FalsaRespuesta({})

        self.assertEqual(leer_cabecera("http://x", abrir=abrir),
                         Cabecera("", 0))

    def test_descarga_y_abre_el_unico_csv(self):
        contenido = b"jurisdiccion;monto\n001;1000\n"
        cuerpo_zip = zip_en_memoria([("gastos.csv", contenido)])

        def abrir(peticion):
            return io.BytesIO(cuerpo_zip)

        with tempfile.TemporaryDirectory() as directorio:
            destino = pathlib.Path(directorio)
            ruta = descargar_y_abrir("http://x/datos.zip", destino,
                                      abrir=abrir)
            self.assertEqual(ruta, destino / "gastos.csv")
            self.assertEqual(ruta.read_bytes(), contenido)

    def test_descarga_falla_sin_ningun_csv(self):
        cuerpo_zip = zip_en_memoria([("notas.txt", b"esto no es un csv")])

        def abrir(peticion):
            return io.BytesIO(cuerpo_zip)

        with tempfile.TemporaryDirectory() as directorio:
            destino = pathlib.Path(directorio)
            with self.assertRaisesRegex(ValueError, "0 CSV"):
                descargar_y_abrir("http://x/datos.zip", destino, abrir=abrir)

    def test_descarga_falla_con_dos_csv(self):
        cuerpo_zip = zip_en_memoria([
            ("credito.csv", b"1"),
            ("recursos.csv", b"2"),
        ])

        def abrir(peticion):
            return io.BytesIO(cuerpo_zip)

        with tempfile.TemporaryDirectory() as directorio:
            destino = pathlib.Path(directorio)
            with self.assertRaisesRegex(ValueError, "2 CSV"):
                descargar_y_abrir("http://x/datos.zip", destino, abrir=abrir)


if __name__ == "__main__":
    unittest.main()
