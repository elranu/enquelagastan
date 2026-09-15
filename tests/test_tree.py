import pathlib
import unittest

from build.measures import Monto
from build.rows import leer_filas
from build.tree import construir, hijos_de, nivel

FIXTURE = pathlib.Path(__file__).parent / "fixtures" / "mini.csv"


class TestTree(unittest.TestCase):
    def setUp(self):
        self.arbol = construir(leer_filas(FIXTURE), 2025)

    def test_dos_programas_con_el_mismo_codigo_no_se_mezclan(self):
        """INV-05. The fixture has programa 21 under servicio 100 and under
        servicio 200. A build that keys a nodo by its last code adds the money
        of two ministries together, and no total looks wrong."""
        jubilaciones = self.arbol[("88", "1", "0", "100", "21")]
        adiestramiento = self.arbol[("45", "1", "0", "200", "21")]
        self.assertEqual(jubilaciones.nombre, "Jubilaciones")
        self.assertEqual(adiestramiento.nombre, "Adiestramiento")
        self.assertEqual(jubilaciones.medidas.devengado, Monto(66.0, 2025))
        self.assertEqual(adiestramiento.medidas.devengado, Monto(31.0, 2025))

    def test_los_hijos_suman_el_padre(self):
        """INV-04."""
        for camino, nodo in self.arbol.items():
            hijos = hijos_de(self.arbol, camino)
            if not hijos:
                continue
            suma = sum(self.arbol[h].medidas.devengado.millones for h in hijos)
            self.assertAlmostEqual(suma, nodo.medidas.devengado.millones, places=6)

    def test_la_raiz_de_cada_jurisdiccion(self):
        self.assertEqual(self.arbol[("88",)].medidas.devengado, Monto(66.0, 2025))
        self.assertEqual(self.arbol[("45",)].medidas.devengado, Monto(31.0, 2025))

    def test_el_nivel_es_el_largo_del_camino(self):
        self.assertEqual(nivel(("88",)), 1)
        self.assertEqual(nivel(("88", "1", "0", "100", "21", "0", "0")), 7)


if __name__ == "__main__":
    unittest.main()
