# The fix of the code review of "En que la gastan"

Branch `init-enquelagastan`. Five commits. 77 tests pass, and one test stays
skipped without `ENQUELAGASTAN_RED=1`.

## A contradiction between the brief and the work

The brief says that the review found six defects. It describes five. It asks
for one test per defect and lists five. I fixed the five that it describes. I
did not invent a sixth. Name it and I fix it.

## Defect 1: a missing column became zero in silence

`build/rows.py`. `camino_de`, `nombre_de` and `medidas_de` read with
`fila.get(...)`. A column that the source renames became an empty string, and
`parse_monto` turned it into zero. The official check reads the total of
`credito_devengado` alone, so a renamed `credito_pagado` published zeros and
every check passed.

`COLUMNAS_NECESARIAS` names the 13 `<eje>_id`, the 13 `<eje>_desc` and the five
`credito_*`. `leer_filas` calls `verificar_cabecera` on `lector.fieldnames`
before it yields the first row. The message names every column that is missing.
The pipeline already turns an exception into a `"fallido"` result, so the other
exercises still publish.

Tests, `tests/test_rows.py::TestCabeceraDelCsv`: a full header passes, a header
with no `credito_pagado` raises and names it, a header with no `programa_id`
raises and names it, an empty file raises.

The fixture of `tests/test_pipeline.py` carried five ejes. It now carries every
column that the build reads.

## Defect 2: INV-04 read one measure and the build published four

`build/verify.py`. `nodos_que_no_suman` compared `credito_devengado` alone.

`MEDIDAS_PUBLICADAS` holds the four measures that `emit._nodo_a_json` writes:
presupuestado, vigente, devengado, pagado. The comprometido stays out, and a
comment says why and says that a measure added to `_nodo_a_json` must enter
this tuple. The check reports the nodo, the measure, the amount of the nodo and
the sum of its children. The tolerance reasoning does not change.
`build/__main__.py` unpacks the fourth field and names the measure.

Test, `tests/test_verify.py::test_atrapa_un_hueco_que_solo_esta_en_el_vigente`:
a camino stops at the servicio with a devengado of zero and a vigente of 40.
The devengado balances. The check reports the vigente alone.

## Defect 3: a failed write left a partial exercise on disk

`build/emit.py`. `escribir_ejercicio` wrote into the destination directly.

The build now computes every file key first, so the guard of the separator
raises before any file lands. It then writes into a staging directory made by
`tempfile.mkdtemp` inside the destination, and it moves that directory into
place with `Path.replace` after the last file. The staging directory sits in
the same parent, so the move stays on one file system. The move removes the
previous directory of that exercise, so a branch that the source removed does
not stay. Any exception removes the staging directory and raises.

Tests, `tests/test_emit.py::TestEscrituraAtomica`: a write that raises on the
second file leaves the bytes of the last good build untouched and leaves no
staging directory; a code that holds the separator writes no file at all; a
file of an earlier run does not survive the next build.

## Defect 4: no timeout

`build/sources.py`. `TIEMPO_LIMITE = 120` seconds, passed to `abrir` in
`leer_cabecera` and in `descargar_y_abrir`, and to `urlopen` in
`_leer_reporte`. The whole build of three exercises takes about 16 seconds,
downloads included. A single read that passes two minutes is a host that
stalled. The comment in the code says this.

Tests: `tests/test_sources.py` asserts that the seam receives
`timeout=TIEMPO_LIMITE` and that a seam which raises `TimeoutError` propagates.
`tests/test_pipeline.py::test_un_tiempo_limite_reporta_el_ejercicio_como_fallido`
patches `build.sources.leer_cabecera` to raise a `TimeoutError`, and `main`
returns `SIN_PUBLICACION` and writes no directory for that exercise. The test
reaches no network, because the build reads the header before any download.

## Defect 5: a header with no date still published

`build/sources.py`. `leer_cabecera` turned a missing `Last-Modified` into an
empty string. It now raises, and the message names INV-03.

A missing `Content-Length` keeps the value 0. It is not part of INV-03. The
manifest records it, and the only reader compares one run against the next. A
host that answers with a chunked encoding sends no length, and that must not
stop an exercise.

Tests: `tests/test_sources.py` covers both, and
`tests/test_pipeline.py::test_una_cabecera_sin_fecha_no_publica` shows that the
exercise fails and writes nothing.

## The real build

    $ python -m build --destino /tmp/verificacion-pr
    2024: publicado
    2025: publicado
    2026: publicado
    exit=0, 15.2 seconds

| Ejercicio | Total devengado, pesos | Nodos |
| --- | --- | --- |
| 2024 | 90,197,486,820,049.50 | 134,623 |
| 2025 | 123,533,955,013,701.50 | 128,558 |
| 2026 | 104,202,402,033,233.89 | 98,809 |

Every number equals the number of the brief. `ENQUELAGASTAN_RED=1 python -m
unittest tests.test_real -v` passes.

INV-04 now reads four measures on the real data, and the three exercises still
publish. So the real files hold no gap in the presupuestado, the vigente or the
pagado today. The check is a gate that is closed, and not a gate that was open.

## Self-review

What I read: every module of `build/` and every test, before any edit.

What the diff does not change: the numbers, the dependencies (standard library
only), the test framework (`unittest`), the Spanish identifiers of the domain,
`comprometido` and `url_recursos`. No test reaches the network except
`tests/test_real.py`.

The risk that stays. A kill signal that the process cannot catch, such as
SIGKILL, leaves the staging directory on disk. Its name starts with a dot and
with the number of the exercise, so it is visible, and an upload that copies
the whole destination would carry it. This is smaller than the defect it
replaces, because the directory is not the directory that the navigator reads.
A deploy that refuses a name starting with a dot would close it.

The second risk. `MEDIDAS_PUBLICADAS` in `build/verify.py` and the keys of
`_nodo_a_json` in `build/emit.py` are two lists of the same four measures. A
measure added to one and not to the other reopens defect 2. The comment on
`MEDIDAS_PUBLICADAS` says so. I did not couple them, because the JSON keys are
one letter and the measure names are words, and a mapping between them would be
more code than the comment.

The third risk. `MEDIDAS` in `build/rows.py` names the five source columns, and
`medidas_de` names the same five in its own order. A rename in one and not in
the other would pass the header check and read the wrong column. The names are
literal in both places, so a reader sees them together.
