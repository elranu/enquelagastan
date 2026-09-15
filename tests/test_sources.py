import unittest

from build.sources import Cabecera, leer_cabecera, url_credito, url_recursos


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


if __name__ == "__main__":
    unittest.main()
