import json
import pathlib
import tempfile
import unittest
from unittest import mock

from build import emit, verify
from build.__main__ import (
    Resultado,
    _leer_manifiesto_anterior,
    _valores_anteriores,
    construir_ejercicio,
    main,
)
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

VERIFICACION_QUE_PASA = verify.Verificacion(97_000_000.0, 97_000_000.0, 0.0,
                                            "el reporte oficial", True, "")


class TestPipeline(unittest.TestCase):
    def setUp(self):
        self.temporal = tempfile.TemporaryDirectory()
        self.destino = pathlib.Path(self.temporal.name)
        self.addCleanup(self.temporal.cleanup)

    def _correr(self, reporte, cabecera_anterior=None, total_anterior=None):
        return construir_ejercicio(
            2025,
            self.destino,
            leer_cabecera=lambda ejercicio: CABECERA,
            bajar_csv=lambda ejercicio, carpeta: FIXTURE,
            leer_reporte=lambda ejercicio: reporte,
            cabecera_anterior=cabecera_anterior,
            total_anterior=total_anterior,
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

    def test_no_descarga_nada_cuando_la_cabecera_no_cambio(self):
        """The point of the header check: it must skip the download, not
        only skip the write."""
        llamadas = []

        def bajar_falso(ejercicio, carpeta):
            llamadas.append(ejercicio)
            return FIXTURE

        resultado = construir_ejercicio(
            2025,
            self.destino,
            leer_cabecera=lambda ejercicio: CABECERA,
            bajar_csv=bajar_falso,
            leer_reporte=lambda ejercicio: REPORTE_QUE_COINCIDE,
            cabecera_anterior=CABECERA,
        )
        self.assertEqual(resultado.estado, "sin-cambios")
        self.assertEqual(llamadas, [])

    def test_para_cuando_el_total_cae_debajo_del_anterior(self):
        """This total_anterior comes from a real manifest entry. A drop
        this big means a file that arrived cut, so the build must stop
        and write nothing."""
        resultado = self._correr(REPORTE_QUE_COINCIDE, total_anterior=200_000_000.0)
        self.assertEqual(resultado.estado, "fallido")
        self.assertFalse(resultado.verificacion.paso)
        self.assertFalse((self.destino / "2025").exists())


class TestValoresAnteriores(unittest.TestCase):
    """The helper that main() uses to read what the last build knew."""

    def setUp(self):
        self.temporal = tempfile.TemporaryDirectory()
        self.destino = pathlib.Path(self.temporal.name)
        self.addCleanup(self.temporal.cleanup)

    def test_leer_manifiesto_anterior_da_vacio_cuando_no_existe(self):
        self.assertEqual(_leer_manifiesto_anterior(self.destino), {})

    def test_leer_manifiesto_anterior_da_vacio_cuando_el_json_es_invalido(self):
        (self.destino / "manifest.json").write_text("{ esto no es json",
                                                     encoding="utf-8")
        self.assertEqual(_leer_manifiesto_anterior(self.destino), {})

    def test_leer_manifiesto_anterior_mapea_por_ejercicio(self):
        entrada = {"ejercicio": 2025, "archivo": "url", "publicado": "old",
                  "largo": 100, "total_devengado": 97_000_000.0,
                  "verificado": True}
        (self.destino / "manifest.json").write_text(
            json.dumps({"ejercicios": [entrada]}), encoding="utf-8")
        self.assertEqual(_leer_manifiesto_anterior(self.destino), {2025: entrada})

    def test_valores_anteriores_reconstruye_la_cabecera_y_el_total(self):
        anteriores = {2025: {"ejercicio": 2025, "archivo": "url",
                             "publicado": "Wed, 08 Jul 2026 10:39:43 GMT",
                             "largo": 100, "total_devengado": 97_000_000.0,
                             "verificado": True}}
        cabecera_anterior, total_anterior = _valores_anteriores(anteriores, 2025)
        self.assertEqual(cabecera_anterior, CABECERA)
        self.assertEqual(total_anterior, 97_000_000.0)

    def test_valores_anteriores_da_none_cuando_no_hay_entrada(self):
        self.assertEqual(_valores_anteriores({}, 2025), (None, None))


class TestMain(unittest.TestCase):
    """main() itself: it reads manifest.json, wires cabecera_anterior and
    total_anterior into every exercise, and writes back a manifest that
    keeps one entry per exercise. No test here reaches the network: each
    test replaces every call to construir_ejercicio."""

    def setUp(self):
        self.temporal = tempfile.TemporaryDirectory()
        self.destino = pathlib.Path(self.temporal.name)
        self.addCleanup(self.temporal.cleanup)

    def _escribir_manifiesto_previo(self, entradas):
        (self.destino / "manifest.json").write_text(
            json.dumps({"ejercicios": entradas}), encoding="utf-8")

    def _manifiesto(self):
        return json.loads((self.destino / "manifest.json").read_text())

    def test_main_conserva_sin_cambios_y_fallido_y_agrega_publicado(self):
        """INV-03: an exercise that did not change, and one whose build
        failed, keep the entry they already had. Only the published one
        gets a new entry."""
        entrada_2023 = {"ejercicio": 2023, "archivo": "url-2023",
                        "publicado": "old-2023", "largo": 10,
                        "total_devengado": 10.0, "verificado": True}
        entrada_2024 = {"ejercicio": 2024, "archivo": "url-2024",
                        "publicado": "old-2024", "largo": 20,
                        "total_devengado": 20.0, "verificado": True}
        self._escribir_manifiesto_previo([entrada_2023, entrada_2024])

        def construir_falso(ejercicio, destino, cabecera_anterior=None,
                            total_anterior=None):
            if ejercicio == 2023:
                return Resultado("sin-cambios", cabecera=CABECERA)
            if ejercicio == 2024:
                return Resultado("fallido", verify.Verificacion(
                    0.0, 0.0, 0.0, "x", False, "no importa"))
            return Resultado("publicado", VERIFICACION_QUE_PASA, {"nodos": 1},
                             Cabecera("new-2025", 999))

        with mock.patch("build.__main__.construir_ejercicio",
                       side_effect=construir_falso):
            codigo = main(["--destino", str(self.destino),
                          "--ejercicio", "2023", "--ejercicio", "2024",
                          "--ejercicio", "2025"])

        self.assertEqual(codigo, 1)
        manifiesto = self._manifiesto()
        por_ejercicio = {e["ejercicio"]: e for e in manifiesto["ejercicios"]}
        self.assertEqual(por_ejercicio[2023], entrada_2023)
        self.assertEqual(por_ejercicio[2024], entrada_2024)
        self.assertEqual(por_ejercicio[2025]["publicado"], "new-2025")
        self.assertEqual(por_ejercicio[2025]["largo"], 999)
        self.assertEqual([e["ejercicio"] for e in manifiesto["ejercicios"]],
                         [2023, 2024, 2025])

    def test_main_no_reescribe_el_manifiesto_cuando_nada_cambio(self):
        """The scheduled workflow commits this file on a change. A run
        that changes nothing must not touch it, or every day would commit
        a diff that says nothing."""
        entrada = {"ejercicio": 2025, "archivo": "url", "publicado": "old",
                  "largo": 100, "total_devengado": 97_000_000.0,
                  "verificado": True}
        self._escribir_manifiesto_previo([entrada])

        def construir_falso(ejercicio, destino, cabecera_anterior=None,
                            total_anterior=None):
            return Resultado("sin-cambios", cabecera=CABECERA)

        with mock.patch("build.__main__.construir_ejercicio",
                       side_effect=construir_falso), \
             mock.patch("build.emit.escribir_manifiesto") as escribir_falso:
            main(["--destino", str(self.destino), "--ejercicio", "2025"])
            escribir_falso.assert_not_called()

    def test_main_no_escribe_nada_cuando_el_total_cae_debajo_del_anterior(self):
        entrada = {"ejercicio": 2025, "archivo": "url", "publicado": "old",
                  "largo": 100, "total_devengado": 200_000_000.0,
                  "verificado": True}
        self._escribir_manifiesto_previo([entrada])
        recibido = {}

        def construir_falso(ejercicio, destino, cabecera_anterior=None,
                            total_anterior=None):
            recibido["total_anterior"] = total_anterior
            return Resultado("fallido", verify.Verificacion(
                97_000_000.0, 200_000_000.0, 103_000_000.0,
                "el manifiesto anterior", False, "cayo demasiado"))

        with mock.patch("build.__main__.construir_ejercicio",
                       side_effect=construir_falso), \
             mock.patch("build.emit.escribir_manifiesto") as escribir_falso:
            codigo = main(["--destino", str(self.destino), "--ejercicio", "2025"])
            escribir_falso.assert_not_called()

        self.assertEqual(codigo, 1)
        self.assertEqual(recibido["total_anterior"], 200_000_000.0)
        self.assertEqual(self._manifiesto()["ejercicios"], [entrada])

    def test_main_trata_un_manifiesto_invalido_como_si_no_hubiera_build_anterior(self):
        (self.destino / "manifest.json").write_text("{ no es json",
                                                     encoding="utf-8")
        recibido = {}

        def construir_falso(ejercicio, destino, cabecera_anterior=None,
                            total_anterior=None):
            recibido["valores"] = (cabecera_anterior, total_anterior)
            return Resultado("publicado", VERIFICACION_QUE_PASA, {"nodos": 1},
                             CABECERA)

        with mock.patch("build.__main__.construir_ejercicio",
                       side_effect=construir_falso):
            codigo = main(["--destino", str(self.destino), "--ejercicio", "2025"])

        self.assertEqual(codigo, 0)
        self.assertEqual(recibido["valores"], (None, None))


if __name__ == "__main__":
    unittest.main()
