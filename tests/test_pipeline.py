import json
import pathlib
import tempfile
import unittest
from unittest import mock

from build import verify
from build.__main__ import (
    SIN_PUBLICACION,
    Resultado,
    _leer_manifiesto_anterior,
    _total_anterior,
    construir_ejercicio,
    main,
)
from build.sources import Cabecera, url_credito

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

EJES_DEL_FIXTURE = ("jurisdiccion", "subjurisdiccion", "entidad", "servicio",
                    "programa")
MEDIDAS = ("credito_presupuestado", "credito_vigente", "credito_comprometido",
           "credito_devengado", "credito_pagado")


def fila_csv() -> str:
    """A CSV of two rows. One row holds the full camino of the programa. The
    other row stops at the servicio, which INV-04 must catch."""
    cabeceras = [f"{eje}_{campo}" for eje in EJES_DEL_FIXTURE
                 for campo in ("id", "desc")] + list(MEDIDAS)
    completa = ["88", "Capital Humano", "1", "Capital Humano", "0",
                "Capital Humano", "100", "ANSES", "21", "Jubilaciones"]
    corta = completa[:8] + ["", ""]
    return "\n".join([
        ",".join(cabeceras),
        ",".join(completa + ["999", "999", "60", "60", "60"]),
        ",".join(corta + ["999", "999", "40", "40", "40"]),
    ]) + "\n"


VERIFICACION_QUE_PASA = verify.Verificacion(97_000_000.0, 97_000_000.0, 0.0,
                                            "el reporte oficial", True, "")


class TestPipeline(unittest.TestCase):
    def setUp(self):
        self.temporal = tempfile.TemporaryDirectory()
        self.destino = pathlib.Path(self.temporal.name)
        self.addCleanup(self.temporal.cleanup)

    def _correr(self, reporte, total_anterior=None, bajar=None):
        return construir_ejercicio(
            2025,
            self.destino,
            leer_cabecera=lambda ejercicio: CABECERA,
            bajar_csv=bajar or (lambda ejercicio, carpeta: FIXTURE),
            leer_reporte=lambda ejercicio: reporte,
            total_anterior=total_anterior,
        )

    def test_publica_cuando_la_verificacion_pasa(self):
        resultado = self._correr(REPORTE_QUE_COINCIDE)
        self.assertEqual(resultado.estado, "publicado")
        self.assertTrue(resultado.verificacion.paso)
        self.assertTrue((self.destino / "2025" / "institucional.json").exists())

    def test_publica_aunque_la_cabecera_sea_la_del_build_anterior(self):
        """The build has no short-circuit on the header any more. A run that
        reads the same file as the last run still downloads it, and it still
        writes every file. The workflow checks out a tree with no data file,
        so a run that wrote nothing published an empty site."""
        llamadas = []

        def bajar(ejercicio, carpeta):
            llamadas.append(ejercicio)
            return FIXTURE

        resultado = self._correr(REPORTE_QUE_COINCIDE,
                                 total_anterior=97_000_000.0, bajar=bajar)
        self.assertEqual(resultado.estado, "publicado")
        self.assertEqual(llamadas, [2025])
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

    def test_para_cuando_el_total_cae_debajo_del_anterior(self):
        """This total_anterior comes from a real manifest entry. A drop
        this big means a file that arrived cut, so the build must stop
        and write nothing."""
        resultado = self._correr(REPORTE_QUE_COINCIDE, total_anterior=200_000_000.0)
        self.assertEqual(resultado.estado, "fallido")
        self.assertFalse(resultado.verificacion.paso)
        self.assertFalse((self.destino / "2025").exists())

    def test_no_escribe_nada_cuando_un_nodo_no_suma(self):
        """INV-04, at the gate of the build. The row of the servicio ends its
        camino early, so the servicio holds more money than its children."""
        fixture = self.destino / "corta.csv"
        fixture.write_text(fila_csv(), encoding="utf-8")
        reporte = [{"concepto": "VII GASTOS TOTALES",
                    "administracionNacional": 100_000_000.0}]
        resultado = construir_ejercicio(
            2025, self.destino,
            leer_cabecera=lambda ejercicio: CABECERA,
            bajar_csv=lambda ejercicio, carpeta: fixture,
            leer_reporte=lambda ejercicio: reporte,
        )
        self.assertEqual(resultado.estado, "fallido")
        self.assertIn("INV-04", resultado.verificacion.motivo)
        self.assertFalse((self.destino / "2025").exists())


class TestTotalAnterior(unittest.TestCase):
    """The helper that main() uses to read what the last build published."""

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

    def test_leer_manifiesto_anterior_da_vacio_cuando_el_archivo_esta_vacio(self):
        (self.destino / "manifest.json").write_text("", encoding="utf-8")
        self.assertEqual(_leer_manifiesto_anterior(self.destino), {})

    def test_leer_manifiesto_anterior_mapea_por_ejercicio(self):
        entrada = {"ejercicio": 2025, "archivo": "url", "publicado": "old",
                  "largo": 100, "total_devengado": 97_000_000.0,
                  "verificado": True}
        (self.destino / "manifest.json").write_text(
            json.dumps({"ejercicios": [entrada]}), encoding="utf-8")
        self.assertEqual(_leer_manifiesto_anterior(self.destino), {2025: entrada})

    def test_total_anterior_lee_el_total_de_la_entrada(self):
        anteriores = {2025: {"ejercicio": 2025, "total_devengado": 97_000_000.0}}
        self.assertEqual(_total_anterior(anteriores, 2025), 97_000_000.0)

    def test_total_anterior_da_none_cuando_no_hay_entrada(self):
        self.assertIsNone(_total_anterior({}, 2025))

    def test_total_anterior_da_none_cuando_la_entrada_no_tiene_el_campo(self):
        self.assertIsNone(_total_anterior({2025: {"ejercicio": 2025}}, 2025))


class TestMain(unittest.TestCase):
    """main() itself: it reads manifest.json, gives total_anterior to every
    exercise, and writes back a manifest that keeps one entry per exercise.
    No test here reaches the network: each test replaces every call to
    construir_ejercicio."""

    def setUp(self):
        self.temporal = tempfile.TemporaryDirectory()
        self.destino = pathlib.Path(self.temporal.name)
        self.addCleanup(self.temporal.cleanup)

    def _escribir_manifiesto_previo(self, entradas):
        (self.destino / "manifest.json").write_text(
            json.dumps({"ejercicios": entradas}), encoding="utf-8")

    def _manifiesto(self):
        return json.loads((self.destino / "manifest.json").read_text())

    def test_un_ejercicio_fallido_no_frena_a_otro(self):
        """INV-03, and the independence of the exercises. The exercise that
        failed keeps the entry it already had. The other one publishes."""
        entrada_2024 = {"ejercicio": 2024, "archivo": "url-2024",
                        "publicado": "old-2024", "largo": 20,
                        "total_devengado": 20.0, "verificado": True}
        self._escribir_manifiesto_previo([entrada_2024])

        def construir_falso(ejercicio, destino, total_anterior=None):
            if ejercicio == 2024:
                return Resultado("fallido", verify.Verificacion(
                    0.0, 0.0, 0.0, "x", False, "no importa"))
            return Resultado("publicado", VERIFICACION_QUE_PASA, {"nodos": 1},
                             Cabecera("new-2025", 999))

        with mock.patch("build.__main__.construir_ejercicio",
                       side_effect=construir_falso):
            codigo = main(["--destino", str(self.destino),
                          "--ejercicio", "2024", "--ejercicio", "2025"])

        self.assertEqual(codigo, 1)
        por_ejercicio = {e["ejercicio"]: e
                         for e in self._manifiesto()["ejercicios"]}
        self.assertEqual(por_ejercicio[2024],
                         {**entrada_2024, "en_este_artefacto": False})
        self.assertEqual(por_ejercicio[2024]["total_devengado"], 20.0)
        self.assertTrue(por_ejercicio[2025]["en_este_artefacto"])
        self.assertEqual(por_ejercicio[2025]["publicado"], "new-2025")
        self.assertEqual(por_ejercicio[2025]["largo"], 999)

    def test_main_no_reescribe_el_manifiesto_cuando_nada_cambio(self):
        """The workflow commits this file on a change. A run that finds the
        same numbers must not touch it, or every day would commit a diff that
        says nothing. The heartbeat carries the daily commit instead."""
        entrada = {"ejercicio": 2025, "archivo": url_credito(2025),
                  "publicado": "old", "largo": 100,
                  "total_devengado": 97_000_000.0, "verificado": True,
                  "en_este_artefacto": True}
        self._escribir_manifiesto_previo([entrada])

        def construir_falso(ejercicio, destino, total_anterior=None):
            return Resultado("publicado", VERIFICACION_QUE_PASA, {"nodos": 1},
                             Cabecera("old", 100))

        with mock.patch("build.__main__.construir_ejercicio",
                       side_effect=construir_falso), \
             mock.patch("build.emit.escribir_manifiesto") as escribir_falso:
            main(["--destino", str(self.destino), "--ejercicio", "2025"])
            escribir_falso.assert_not_called()

    def test_main_escribe_el_latido_en_cada_corrida(self):
        """The heartbeat lands on every run, and it stays out of the
        manifest. It keeps the scheduled workflow alive."""
        def construir_falso(ejercicio, destino, total_anterior=None):
            return Resultado("fallido", verify.Verificacion(
                0.0, 0.0, 0.0, "x", False, "no importa"))

        with mock.patch("build.__main__.construir_ejercicio",
                       side_effect=construir_falso):
            main(["--destino", str(self.destino), "--ejercicio", "2025"])

        latido = json.loads(
            (self.destino / "heartbeat.json").read_text(encoding="utf-8"))
        self.assertRegex(latido["ultima_corrida_utc"],
                         r"^\d{4}-\d{2}-\d{2}$")
        self.assertFalse((self.destino / "manifest.json").exists())

    def test_main_no_escribe_nada_cuando_el_total_cae_debajo_del_anterior(self):
        entrada = {"ejercicio": 2025, "archivo": "url", "publicado": "old",
                  "largo": 100, "total_devengado": 200_000_000.0,
                  "verificado": True, "en_este_artefacto": False}
        self._escribir_manifiesto_previo([entrada])
        recibido = {}

        def construir_falso(ejercicio, destino, total_anterior=None):
            recibido["total_anterior"] = total_anterior
            return Resultado("fallido", verify.Verificacion(
                97_000_000.0, 200_000_000.0, 103_000_000.0,
                "el manifiesto anterior", False, "cayo demasiado"))

        with mock.patch("build.__main__.construir_ejercicio",
                       side_effect=construir_falso), \
             mock.patch("build.emit.escribir_manifiesto") as escribir_falso:
            codigo = main(["--destino", str(self.destino), "--ejercicio", "2025"])
            escribir_falso.assert_not_called()

        # The only exercise of this run failed, so nothing published.
        self.assertEqual(codigo, SIN_PUBLICACION)
        self.assertEqual(recibido["total_anterior"], 200_000_000.0)
        self.assertEqual(self._manifiesto()["ejercicios"], [entrada])

    def test_una_excepcion_no_frena_a_otro_ejercicio(self):
        """A download that raises stops one exercise alone. The other
        exercise publishes, the heartbeat lands, and the run exits
        non-zero."""
        def construir_falso(ejercicio, destino, total_anterior=None):
            if ejercicio == 2024:
                raise OSError("503 from the server of the source")
            return Resultado("publicado", VERIFICACION_QUE_PASA, {"nodos": 1},
                             Cabecera("new-2025", 999))

        with mock.patch("build.__main__.construir_ejercicio",
                       side_effect=construir_falso):
            codigo = main(["--destino", str(self.destino),
                          "--ejercicio", "2024", "--ejercicio", "2025"])

        self.assertEqual(codigo, 1)
        por_ejercicio = {e["ejercicio"]: e
                         for e in self._manifiesto()["ejercicios"]}
        self.assertEqual(por_ejercicio[2025]["publicado"], "new-2025")
        self.assertNotIn(2024, por_ejercicio)
        self.assertTrue((self.destino / "heartbeat.json").exists())

    def test_una_excepcion_deja_la_entrada_anterior_fuera_del_artefacto(self):
        """The entry keeps total_devengado, because the next run needs that
        baseline. The entry says that this artifact holds no data for it."""
        entrada_2024 = {"ejercicio": 2024, "archivo": "url-2024",
                        "publicado": "old-2024", "largo": 20,
                        "total_devengado": 20.0, "verificado": True,
                        "en_este_artefacto": True}
        self._escribir_manifiesto_previo([entrada_2024])

        def construir_falso(ejercicio, destino, total_anterior=None):
            if ejercicio == 2024:
                raise ValueError("the official report holds no row")
            return Resultado("publicado", VERIFICACION_QUE_PASA, {"nodos": 1},
                             Cabecera("new-2025", 999))

        with mock.patch("build.__main__.construir_ejercicio",
                       side_effect=construir_falso):
            codigo = main(["--destino", str(self.destino),
                          "--ejercicio", "2024", "--ejercicio", "2025"])

        self.assertEqual(codigo, 1)
        por_ejercicio = {e["ejercicio"]: e
                         for e in self._manifiesto()["ejercicios"]}
        self.assertFalse(por_ejercicio[2024]["en_este_artefacto"])
        self.assertEqual(por_ejercicio[2024]["total_devengado"], 20.0)

    def test_una_verificacion_fallida_marca_la_entrada_fuera_del_artefacto(self):
        """A check that fails does the same as an exception. The entry keeps
        its baseline, and it says that it is not in this artifact."""
        entrada_2024 = {"ejercicio": 2024, "archivo": "url-2024",
                        "publicado": "old-2024", "largo": 20,
                        "total_devengado": 20.0, "verificado": True,
                        "en_este_artefacto": True}
        self._escribir_manifiesto_previo([entrada_2024])

        def construir_falso(ejercicio, destino, total_anterior=None):
            if ejercicio == 2024:
                return Resultado("fallido", verify.Verificacion(
                    0.0, 0.0, 0.0, "x", False, "no coincide"))
            return Resultado("publicado", VERIFICACION_QUE_PASA, {"nodos": 1},
                             Cabecera("new-2025", 999))

        with mock.patch("build.__main__.construir_ejercicio",
                       side_effect=construir_falso):
            main(["--destino", str(self.destino),
                 "--ejercicio", "2024", "--ejercicio", "2025"])

        por_ejercicio = {e["ejercicio"]: e
                         for e in self._manifiesto()["ejercicios"]}
        self.assertFalse(por_ejercicio[2024]["en_este_artefacto"])
        self.assertEqual(por_ejercicio[2024]["total_devengado"], 20.0)

    def test_el_codigo_dice_que_ningun_ejercicio_publico(self):
        """Every exercise fails. The guard fires: main gives the code that
        stops the upload and the deploy. The heartbeat still lands."""
        def construir_falso(ejercicio, destino, total_anterior=None):
            raise OSError("503 from the server of the source")

        with mock.patch("build.__main__.construir_ejercicio",
                       side_effect=construir_falso):
            codigo = main(["--destino", str(self.destino),
                          "--ejercicio", "2024", "--ejercicio", "2025"])

        self.assertEqual(codigo, SIN_PUBLICACION)
        self.assertTrue((self.destino / "heartbeat.json").exists())
        self.assertFalse((self.destino / "2024").exists())
        self.assertFalse((self.destino / "2025").exists())

    def test_main_trata_un_manifiesto_invalido_como_si_no_hubiera_build_anterior(self):
        (self.destino / "manifest.json").write_text("{ no es json",
                                                     encoding="utf-8")
        recibido = {}

        def construir_falso(ejercicio, destino, total_anterior=None):
            recibido["total_anterior"] = total_anterior
            return Resultado("publicado", VERIFICACION_QUE_PASA, {"nodos": 1},
                             CABECERA)

        with mock.patch("build.__main__.construir_ejercicio",
                       side_effect=construir_falso):
            codigo = main(["--destino", str(self.destino), "--ejercicio", "2025"])

        self.assertEqual(codigo, 0)
        self.assertIsNone(recibido["total_anterior"])


if __name__ == "__main__":
    unittest.main()
