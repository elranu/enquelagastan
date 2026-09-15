import unittest

from build.measures import Medidas, MedidasCero, Monto, parse_monto


class TestMonto(unittest.TestCase):
    def test_suma_del_mismo_ejercicio(self):
        self.assertEqual(
            Monto(10.0, 2025) + Monto(5.0, 2025),
            Monto(15.0, 2025),
        )

    def test_la_suma_de_dos_ejercicios_falla(self):
        with self.assertRaises(ValueError) as caught:
            Monto(10.0, 2025) + Monto(5.0, 2026)
        self.assertIn("2025", str(caught.exception))
        self.assertIn("2026", str(caught.exception))

    def test_parse_de_la_coma_decimal(self):
        self.assertEqual(parse_monto("114914,626039", 2025),
                         Monto(114914.626039, 2025))

    def test_parse_del_texto_vacio(self):
        self.assertEqual(parse_monto("", 2025), Monto(0.0, 2025))
        self.assertEqual(parse_monto(None, 2025), Monto(0.0, 2025))

    def test_parse_sin_coma(self):
        self.assertEqual(parse_monto("42", 2025), Monto(42.0, 2025))

    def test_medidas_suman_campo_por_campo(self):
        uno = Medidas(Monto(1.0, 2025), Monto(2.0, 2025), Monto(3.0, 2025),
                      Monto(4.0, 2025), Monto(5.0, 2025))
        total = MedidasCero(2025).mas(uno).mas(uno)
        self.assertEqual(total.devengado, Monto(8.0, 2025))
        self.assertEqual(total.presupuestado, Monto(2.0, 2025))


if __name__ == "__main__":
    unittest.main()
