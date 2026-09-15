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
        self.assertEqual(
            resultado.estado,
            "publicado",
            msg=(
                "The state must be 'publicado' for exercise 2025. "
                "Any other state is a different kind of problem than a number "
                "mismatch. It means a build check stopped the publication. "
                "Read resultado.verificacion.motivo. It names the check that "
                "stopped it."
            ),
        )
        self.assertLessEqual(
            resultado.verificacion.diferencia,
            1000.0,
            msg=(
                "This is the gap in pesos between this build's total and the "
                "official report. A gap of a few pesos is normal rounding in "
                "the CSV decimals. The build already accepts a gap up to "
                "1000 pesos. A gap larger than that is a real mismatch, not "
                "rounding noise."
            ),
        )
        self.assertAlmostEqual(
            resultado.verificacion.total_propio,
            123_533_955_013_702,
            delta=1e6,
            msg=(
                "This is the total pesos spent in exercise 2025, from the "
                "real files of the Ministerio de Economia. The design "
                "measured this value on 2026-09-14. A large mismatch means "
                "the publisher republished the closed exercise 2025. That is "
                "unusual, and it is news. Record the new value here and in "
                "docs/designpowers/2026-09-14-public-spending-navigator/"
                "00-data-sources.md. Never widen this tolerance to make the "
                "test pass."
            ),
        )
        self.assertEqual(
            resultado.resumen["nodos"],
            128_558,
            msg=(
                "This is the count of nodos in the spending tree of exercise "
                "2025. The design measured this value on 2026-09-14. A "
                "different count points at a republication of the closed "
                "exercise 2025. That is unusual, and it is news. Record the "
                "new value here and in "
                "docs/designpowers/2026-09-14-public-spending-navigator/"
                "00-data-sources.md. Never loosen this check to make the "
                "test pass."
            ),
        )


if __name__ == "__main__":
    unittest.main()
