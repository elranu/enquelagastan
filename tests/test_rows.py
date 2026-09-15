import pathlib
import unittest

from build.measures import Monto
from build.rows import EJES, camino_de, leer_filas, medidas_de, nombre_de

FIXTURE = pathlib.Path(__file__).parent / "fixtures" / "mini.csv"


class TestRows(unittest.TestCase):
    def setUp(self):
        self.filas = list(leer_filas(FIXTURE))

    def test_lee_las_tres_filas_y_saca_el_bom(self):
        self.assertEqual(len(self.filas), 3)
        self.assertEqual(self.filas[0]["jurisdiccion_id"], "88")

    def test_el_camino_tiene_los_trece_ejes(self):
        self.assertEqual(len(EJES), 13)
        self.assertEqual(
            camino_de(self.filas[0]),
            ("88", "1", "0", "100", "21", "0", "0", "1", "0", "1", "1", "1", "1"),
        )

    def test_el_camino_corta_en_el_primer_codigo_vacio(self):
        fila = dict(self.filas[0])
        fila["programa_id"] = ""
        self.assertEqual(camino_de(fila), ("88", "1", "0", "100"))

    def test_el_nombre_por_profundidad(self):
        self.assertEqual(nombre_de(self.filas[0], 1), "Capital Humano")
        self.assertEqual(nombre_de(self.filas[0], 4), "ANSES")

    def test_las_medidas_llevan_el_ejercicio(self):
        medidas = medidas_de(self.filas[0], 2025)
        self.assertEqual(medidas.devengado, Monto(55.0, 2025))
        self.assertEqual(medidas.vigente, Monto(60.0, 2025))


if __name__ == "__main__":
    unittest.main()
