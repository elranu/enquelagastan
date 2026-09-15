import pathlib
import tempfile
import unittest

from build.measures import Monto
from build.rows import (
    COLUMNAS_NECESARIAS,
    EJES,
    camino_de,
    leer_filas,
    medidas_de,
    nombre_de,
)

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


class TestCabeceraDelCsv(unittest.TestCase):
    """Section 8 of the design spec: a column that changed its name makes the
    parser fail loudly. A silent zero is worse than a stopped exercise."""

    def escribir(self, cabecera: str) -> pathlib.Path:
        temporal = tempfile.TemporaryDirectory()
        self.addCleanup(temporal.cleanup)
        ruta = pathlib.Path(temporal.name) / "recorte.csv"
        ruta.write_text(cabecera + "\n", encoding="utf-8")
        return ruta

    def cabecera_completa(self) -> list:
        return list(COLUMNAS_NECESARIAS)

    def test_la_cabecera_completa_pasa(self):
        ruta = self.escribir(",".join(self.cabecera_completa()))
        self.assertEqual(list(leer_filas(ruta)), [])

    def test_una_medida_que_falta_para_el_build(self):
        columnas = [c for c in self.cabecera_completa()
                    if c != "credito_pagado"]
        ruta = self.escribir(",".join(columnas))
        with self.assertRaises(ValueError) as capturado:
            list(leer_filas(ruta))
        self.assertIn("credito_pagado", str(capturado.exception))

    def test_un_eje_que_falta_para_el_build(self):
        columnas = [c for c in self.cabecera_completa()
                    if c != "programa_id"]
        ruta = self.escribir(",".join(columnas))
        with self.assertRaises(ValueError) as capturado:
            list(leer_filas(ruta))
        self.assertIn("programa_id", str(capturado.exception))

    def test_un_archivo_vacio_no_pasa(self):
        ruta = self.escribir("")
        with self.assertRaises(ValueError):
            list(leer_filas(ruta))


if __name__ == "__main__":
    unittest.main()
