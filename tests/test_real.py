"""A test that reaches the real source.

It is not part of the normal run, because it downloads 3.5 MB. Run it with:
    ENQUELAGASTAN_RED=1 python -m unittest tests.test_real -v
"""

import os
import pathlib
import tempfile
import unittest

from build.__main__ import construir_ejercicio

SIN_RED = os.environ.get("ENQUELAGASTAN_RED") != "1"


@unittest.skipIf(SIN_RED, "set ENQUELAGASTAN_RED=1 to reach the network")
class TestReal(unittest.TestCase):
    def test_el_ejercicio_2025_coincide_con_el_reporte_oficial(self):
        with tempfile.TemporaryDirectory() as temporal:
            resultado = construir_ejercicio(2025, pathlib.Path(temporal))
        self.assertEqual(resultado.estado, "publicado")
        self.assertLessEqual(resultado.verificacion.diferencia, 1000.0)
        self.assertAlmostEqual(
            resultado.verificacion.total_propio, 123_533_955_013_702, delta=1e6
        )
        self.assertEqual(resultado.resumen["nodos"], 128_558)


if __name__ == "__main__":
    unittest.main()
