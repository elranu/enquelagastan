import json
import pathlib
import tempfile
import unittest
from dataclasses import replace
from unittest import mock

from build import emit

from build.emit import (
    clave_de_archivo,
    escribir_ejercicio,
    escribir_latido,
    escribir_manifiesto,
)
from build.measures import MedidasCero
from build.rows import leer_filas
from build.tree import Nodo, construir

FIXTURE = pathlib.Path(__file__).parent / "fixtures" / "mini.csv"


class TestEmit(unittest.TestCase):
    def setUp(self):
        self.arbol = construir(leer_filas(FIXTURE), 2025)
        self.temporal = tempfile.TemporaryDirectory()
        self.destino = pathlib.Path(self.temporal.name)
        self.addCleanup(self.temporal.cleanup)

    def test_la_clave_de_archivo_une_el_camino(self):
        self.assertEqual(clave_de_archivo(("88", "1", "0")), "88-1-0")

    def test_un_codigo_con_el_separador_para_el_build(self):
        """INV-05 dies at the boundary of the file system when a code holds the
        separator. The caminos ("88", "1-0", "100") and ("88", "1", "0-100")
        give one key, and one file overwrites the other."""
        with self.assertRaises(ValueError):
            clave_de_archivo(("88", "1-0", "100"))

    def test_escribe_el_latido(self):
        escribir_latido(self.destino, "2026-09-15")
        datos = json.loads(
            (self.destino / "heartbeat.json").read_text(encoding="utf-8"))
        self.assertEqual(datos, {"ultima_corrida_utc": "2026-09-15"})

    def test_escribe_el_archivo_institucional(self):
        escribir_ejercicio(self.arbol, 2025, self.destino)
        ruta = self.destino / "2025" / "institucional.json"
        self.assertTrue(ruta.exists())
        datos = json.loads(ruta.read_text(encoding="utf-8"))
        self.assertIn("88", datos)
        self.assertNotIn("88-1-0-100-21-0-0-1-0-1", datos,
                         "the object levels do not belong to this file")
        self.assertEqual(datos["88"]["n"], "Capital Humano")
        self.assertAlmostEqual(datos["88"]["d"], 66.0, places=6)

    def test_escribe_un_archivo_de_objeto_por_hoja(self):
        escribir_ejercicio(self.arbol, 2025, self.destino)
        hoja = self.destino / "2025" / "objeto" / "88-1-0-100-21-0-0-1-0.json"
        self.assertTrue(hoja.exists())
        datos = json.loads(hoja.read_text(encoding="utf-8"))
        self.assertEqual(len(datos), 8, "two incisos of four levels each")

    def test_el_archivo_de_una_hoja_no_lleva_caminos_de_otra_hoja(self):
        escribir_ejercicio(self.arbol, 2025, self.destino)
        hoja = ("88", "1", "0", "100", "21", "0", "0", "1", "0")
        ruta = self.destino / "2025" / "objeto" / f"{clave_de_archivo(hoja)}.json"
        datos = json.loads(ruta.read_text(encoding="utf-8"))
        esperadas = {
            clave_de_archivo(camino)
            for camino in self.arbol
            if len(camino) > len(hoja) and camino[: len(hoja)] == hoja
        }
        self.assertEqual(set(datos.keys()), esperadas)

    def test_una_hoja_institucional_sin_hijos_cuenta_como_hoja(self):
        camino = ("99",)
        arbol = {camino: Nodo(camino, "Sin descendientes", MedidasCero(2025))}
        resumen = escribir_ejercicio(arbol, 2025, self.destino)
        self.assertEqual(resumen["hojas"], 1,
                          "a camino with no hijos ends the institutional axis")
        self.assertFalse((self.destino / "2025" / "objeto").exists(),
                          "a nodo with no descendant writes no object file")

    def test_el_manifiesto_nombra_el_archivo_y_la_fecha(self):
        """INV-03."""
        escribir_manifiesto(self.destino, [{
            "ejercicio": 2025,
            "archivo": "https://x/credito-anual-2025.zip",
            "publicado": "Wed, 08 Jul 2026 10:39:43 GMT",
            "total_devengado": 97000000.0,
            "verificado": True,
        }])
        datos = json.loads((self.destino / "manifest.json").read_text())
        self.assertEqual(datos["ejercicios"][0]["ejercicio"], 2025)
        self.assertTrue(datos["ejercicios"][0]["verificado"])


class TestEscrituraAtomica(unittest.TestCase):
    """An exercise lands whole or it does not land. A half written exercise is
    an index whose leaves name files that are not there."""

    def setUp(self):
        self.arbol = construir(leer_filas(FIXTURE), 2025)
        self.temporal = tempfile.TemporaryDirectory()
        self.destino = pathlib.Path(self.temporal.name)
        self.addCleanup(self.temporal.cleanup)

    def test_una_escritura_que_falla_no_deja_nada(self):
        buena = escribir_ejercicio(self.arbol, 2025, self.destino)
        carpeta = self.destino / "2025"
        antes = {p.relative_to(carpeta): p.read_bytes()
                 for p in carpeta.rglob("*") if p.is_file()}
        self.assertTrue(antes)

        # A second build whose numbers changed. A partial write of it would
        # show, because its bytes differ from the bytes on disk.
        otro = {camino: replace(nodo, nombre=nodo.nombre + " (nuevo)")
                for camino, nodo in self.arbol.items()}

        real = emit._escribir
        llamadas = []

        def fallar(ruta, datos):
            llamadas.append(ruta)
            if len(llamadas) > 1:
                raise OSError("the disk is full")
            real(ruta, datos)

        with mock.patch.object(emit, "_escribir", fallar):
            with self.assertRaises(OSError):
                escribir_ejercicio(otro, 2025, self.destino)

        self.assertEqual(
            {p.relative_to(carpeta): p.read_bytes()
             for p in carpeta.rglob("*") if p.is_file()}, antes,
            "the exercise of the last good build must not change",
        )
        self.assertEqual(
            [p.name for p in self.destino.iterdir()], ["2025"],
            "a failed build leaves no staging directory behind",
        )
        self.assertEqual(escribir_ejercicio(self.arbol, 2025, self.destino),
                         buena)

    def test_un_codigo_con_el_separador_no_escribe_ningun_archivo(self):
        """The guard of the separator runs before the first file lands."""
        camino = ("88", "1-0")
        arbol = {("88",): Nodo(("88",), "Capital Humano", MedidasCero(2025),
                               {"1-0"}),
                 camino: Nodo(camino, "Roto", MedidasCero(2025))}
        with self.assertRaises(ValueError):
            escribir_ejercicio(arbol, 2025, self.destino)
        self.assertEqual(list(self.destino.iterdir()), [])

    def test_la_carpeta_anterior_del_ejercicio_no_sobrevive(self):
        """A branch that the source removed must not stay on disk."""
        escribir_ejercicio(self.arbol, 2025, self.destino)
        viejo = self.destino / "2025" / "objeto" / "de-otra-corrida.json"
        viejo.write_text("{}", encoding="utf-8")
        escribir_ejercicio(self.arbol, 2025, self.destino)
        self.assertFalse(viejo.exists())


if __name__ == "__main__":
    unittest.main()
