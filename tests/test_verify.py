import pathlib
import unittest

from build.measures import Monto
from build.rows import leer_filas
from build.tree import construir
from build.verify import (
    comparar_con_el_build_anterior,
    nodos_que_pasan_el_limite,
    total_oficial_del_reporte,
    verificar_total,
)

FIXTURE = pathlib.Path(__file__).parent / "fixtures" / "mini.csv"

REPORTE = [
    {"concepto": "I INGRESOS CORRIENTES", "administracionNacional": 1.0},
    {"concepto": "VII GASTOS TOTALES  ( II + V )",
     "administracionNacional": 97_000_000.0},
    {"concepto": "XI RESULTADOS FINANCIEROS", "administracionNacional": 2.0},
]


class TestVerify(unittest.TestCase):
    def test_saca_el_gasto_total_del_reporte(self):
        self.assertEqual(total_oficial_del_reporte(REPORTE), 97_000_000.0)

    def test_pasa_cuando_los_totales_coinciden(self):
        propio = Monto(97.0, 2025)
        resultado = verificar_total(propio, 97_000_000.0, "http://x")
        self.assertTrue(resultado.paso)
        self.assertEqual(resultado.diferencia, 0.0)

    def test_pasa_con_una_diferencia_de_un_peso(self):
        """The real difference on the exercise 2025 was 1 peso, from the
        decimals of the CSV."""
        resultado = verificar_total(Monto(97.0, 2025), 97_000_001.0, "http://x")
        self.assertTrue(resultado.paso)

    def test_falla_cuando_los_totales_no_coinciden(self):
        resultado = verificar_total(Monto(97.0, 2025), 98_000_000.0, "http://x")
        self.assertFalse(resultado.paso)
        self.assertIn("1,000,000", resultado.motivo)

    def test_el_limite_del_presupuesto_arriba_del_nivel_de_control(self):
        """INV-06. The fixture respects it everywhere."""
        arbol = construir(leer_filas(FIXTURE), 2025)
        self.assertEqual(nodos_que_pasan_el_limite(arbol), [])

    def test_el_total_de_un_ejercicio_nunca_baja(self):
        """The second check. The endpoint of the official report is not in any
        public contract and it can stop. This check needs nobody: the devengado
        of one exercise accumulates, so it never goes down. A drop means a file
        that arrived cut."""
        self.assertTrue(comparar_con_el_build_anterior(Monto(97.0, 2025),
                                                       96_000_000.0).paso)
        self.assertTrue(comparar_con_el_build_anterior(Monto(97.0, 2025),
                                                       None).paso)

    def test_una_caida_grande_frena_el_build(self):
        resultado = comparar_con_el_build_anterior(Monto(50.0, 2025),
                                                   97_000_000.0)
        self.assertFalse(resultado.paso)
        self.assertIn("went down", resultado.motivo)

    def test_una_caida_menor_al_limite_pasa(self):
        """A correction of the publisher can move a total a little."""
        resultado = comparar_con_el_build_anterior(Monto(96.9, 2025),
                                                   97_000_000.0)
        self.assertTrue(resultado.paso)

    def test_el_limite_no_mira_abajo_del_nivel_de_control(self):
        """The build accepts a row where the devengado passes the vigente below
        the proyecto. 45.8% of the real rows do that, and a build that rejected
        them would reject the file every day."""
        arbol = construir(leer_filas(FIXTURE), 2025)
        hoja = ("88", "1", "0", "100", "21", "0", "0", "1", "0", "1")
        arbol[hoja].medidas = arbol[hoja].medidas.__class__(
            arbol[hoja].medidas.presupuestado,
            Monto(0.0, 2025),
            arbol[hoja].medidas.comprometido,
            Monto(999.0, 2025),
            arbol[hoja].medidas.pagado,
        )
        self.assertEqual(nodos_que_pasan_el_limite(arbol), [])


if __name__ == "__main__":
    unittest.main()
