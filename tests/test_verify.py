import pathlib
import unittest

from build.measures import Monto
from build.rows import NIVEL_DE_CONTROL, leer_filas
from build.tree import construir
from build.tree import Nodo
from build.measures import Medidas
from build.verify import (
    comparar_con_el_build_anterior,
    nodos_que_no_suman,
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


def _fila(codigos, devengado):
    """One row of the source, as csv.DictReader gives it."""
    ejes = ("jurisdiccion", "subjurisdiccion", "entidad", "servicio",
            "programa")
    fila = {f"{eje}_id": codigo for eje, codigo in zip(ejes, codigos)}
    fila.update({f"{eje}_desc": "x" for eje in ejes})
    fila["credito_devengado"] = devengado
    return fila


FILAS_CON_UN_CAMINO_CORTO = [
    _fila(("88", "1", "0", "100", "21"), "60,0"),
    # This camino stops at the servicio. The source allows it.
    _fila(("88", "1", "0", "100"), "40,0"),
]


def _pasar_el_vigente(arbol, camino):
    """Make one nodo spend more than its own vigente."""
    medidas = arbol[camino].medidas
    arbol[camino].medidas = Medidas(
        medidas.presupuestado, Monto(1.0, 2025), medidas.comprometido,
        Monto(999.0, 2025), medidas.pagado,
    )


class TestSumaDeLosHijos(unittest.TestCase):
    """INV-04: the sum of the children of a nodo equals the total of the
    nodo."""

    def test_un_arbol_sano_no_reporta_nada(self):
        arbol = construir(leer_filas(FIXTURE), 2025)
        self.assertEqual(nodos_que_no_suman(arbol), [])

    def test_atrapa_un_camino_que_termina_temprano(self):
        """A row whose camino stops at the servicio adds money to a nodo that
        also holds children. INV-01 still passes, because the total of the
        exercise stays right. Only this check sees the gap."""
        arbol = construir(FILAS_CON_UN_CAMINO_CORTO, 2025)
        servicio = ("88", "1", "0", "100")
        self.assertAlmostEqual(arbol[servicio].medidas.devengado.millones,
                               100.0)
        reportados = nodos_que_no_suman(arbol)
        self.assertEqual([camino for camino, _, _ in reportados], [servicio])
        _, del_nodo, de_los_hijos = reportados[0]
        self.assertAlmostEqual(del_nodo, 100.0)
        self.assertAlmostEqual(de_los_hijos, 60.0)

    def test_una_hoja_sin_hijos_no_se_mira(self):
        hoja = ("88", "1", "0", "100", "21", "0", "0", "1", "0", "1", "1", "1",
                "1")
        arbol = {hoja: Nodo(hoja, "Basica", None)}
        self.assertEqual(nodos_que_no_suman(arbol), [])


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

    def test_el_limite_atrapa_una_falta_en_el_nivel_de_control(self):
        """INV-06 at the level of the proyecto, which is NIVEL_DE_CONTROL.
        This test tells `<=` from `<`. A check that used `<` would miss
        this nodo."""
        arbol = construir(leer_filas(FIXTURE), 2025)
        proyecto = ("88", "1", "0", "100", "21", "0", "0")
        self.assertEqual(len(proyecto), NIVEL_DE_CONTROL)
        _pasar_el_vigente(arbol, proyecto)
        self.assertEqual(nodos_que_pasan_el_limite(arbol), [proyecto])

    def test_el_limite_ignora_un_nivel_debajo_del_de_control(self):
        """One level under the proyecto is the actividad. Money moves between
        the actividades of one proyecto, so the check must ignore it."""
        arbol = construir(leer_filas(FIXTURE), 2025)
        actividad = ("88", "1", "0", "100", "21", "0", "0", "1")
        self.assertEqual(len(actividad), NIVEL_DE_CONTROL + 1)
        _pasar_el_vigente(arbol, actividad)
        self.assertEqual(nodos_que_pasan_el_limite(arbol), [])

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
