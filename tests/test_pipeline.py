import pathlib
import tempfile
import unittest

from build.__main__ import construir_ejercicio
from build.sources import Cabecera

FIXTURE = pathlib.Path(__file__).parent / "fixtures" / "mini.csv"
CABECERA = Cabecera("Wed, 08 Jul 2026 10:39:43 GMT", 100)
REPORTE_QUE_COINCIDE = [
    {"concepto": "VII GASTOS TOTALES  ( II + V )",
     "administracionNacional": 97_000_000.0}
]
REPORTE_QUE_NO_COINCIDE = [
    {"concepto": "VII GASTOS TOTALES  ( II + V )",
     "administracionNacional": 55_000_000.0}
]


class TestPipeline(unittest.TestCase):
    def setUp(self):
        self.temporal = tempfile.TemporaryDirectory()
        self.destino = pathlib.Path(self.temporal.name)
        self.addCleanup(self.temporal.cleanup)

    def _correr(self, reporte, cabecera_anterior=None):
        return construir_ejercicio(
            2025,
            self.destino,
            leer_cabecera=lambda ejercicio: CABECERA,
            bajar_csv=lambda ejercicio, carpeta: FIXTURE,
            leer_reporte=lambda ejercicio: reporte,
            cabecera_anterior=cabecera_anterior,
        )

    def test_no_hace_nada_cuando_la_cabecera_no_cambio(self):
        resultado = self._correr(REPORTE_QUE_COINCIDE, cabecera_anterior=CABECERA)
        self.assertEqual(resultado.estado, "sin-cambios")
        self.assertFalse((self.destino / "2025").exists())

    def test_publica_cuando_la_verificacion_pasa(self):
        resultado = self._correr(REPORTE_QUE_COINCIDE)
        self.assertEqual(resultado.estado, "publicado")
        self.assertTrue(resultado.verificacion.paso)
        self.assertTrue((self.destino / "2025" / "institucional.json").exists())

    def test_no_escribe_nada_cuando_la_verificacion_falla(self):
        """INV-02, and the hard rule of the build: an exercise reaches the
        visitor only after a verification that passed."""
        resultado = self._correr(REPORTE_QUE_NO_COINCIDE)
        self.assertEqual(resultado.estado, "fallido")
        self.assertFalse(resultado.verificacion.paso)
        self.assertFalse(
            (self.destino / "2025").exists(),
            "a build that does not verify writes nothing, so the previous "
            "publication stays",
        )


if __name__ == "__main__":
    unittest.main()
