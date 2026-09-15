# Data sources: the public spending of the Argentine national state

Research note. It is not a decision. The design spec makes the decisions.

Date of the research: 2026-09-14. A fact that has a date can change. Read the
"How to check this again" section before you trust a number here.

## Summary

The data is open and it needs no token, if you read the bulk files. The token
API is a second path with more friction and no more data. One exercise year is
113,217 rows and 3.5 MB compressed. This is small.

The fiscal result is a different problem. The public API does not serve it.

## 1. The two paths to the same data

| Path | Token | Format | Where |
|---|---|---|---|
| Bulk files (recommended) | No | ZIP with CSV | `https://dgsiaf-repo.mecon.gob.ar/repository/pa/datasets/<year>/` |
| datos.gob.ar catalog | No | The same ZIP files | CKAN API, one dataset per year, 1995 to 2025 |
| Presupuesto Abierto API | Yes | JSON, CSV, ZIP | `POST https://www.presupuestoabierto.gob.ar/api/v1/<resource>` |

Both paths read the same database of DGSIAF. The bulk files are the physical
files behind the catalog and behind the site.

### The token API

Four endpoints, all POST: `/credito`, `/recurso`, `/pef`,
`/transversal_financiero`. The query parameter `format` accepts `json`, `csv`
or `zip`.

A request without the header `Authorization` returns HTTP 401. The registration
form asks for a name and an email address, and nothing more.

The documentation has gaps. The list of accepted columns in the OpenAPI file
does not contain `inciso_id`, `finalidad_id` or any of the five measures, but
one example of the same file uses `credito_vigente` as a column. The document
is stale. The accepted columns are probably the columns of the CSV files.
**Unverified.**

There is no documented rate limit, and there is no pagination parameter.

## 2. The hierarchy

The field names below are the literal column headers of
`credito-anual-2025.csv`.

**Important: the codes are not unique.** `programa_id` repeats under a
different `servicio_id`. A key must be the full path, not the last code.

| Level | Field of the code | Field of the name | Distinct values in 2025 |
|---|---|---|---|
| Jurisdiccion | `jurisdiccion_id` | `jurisdiccion_desc` | 15 with execution, 17 in the classifier |
| Subjurisdiccion | `subjurisdiccion_id` | `subjurisdiccion_desc` | 16 |
| Entidad | `entidad_id` | `entidad_desc` | 84 paths |
| Servicio | `servicio_id` | `servicio_desc` | 122 |
| Programa | `programa_id` | `programa_desc` | 491 paths |
| Subprograma | `subprograma_id` | `subprograma_desc` | 705 paths |
| Proyecto | `proyecto_id` | `proyecto_desc` | not counted |
| Actividad | `actividad_id` | `actividad_desc` | 1,990 paths |
| Obra | `obra_id` | `obra_desc` | not counted |

The object of the spending is a second axis, not a deeper level of the first
one:

| Level | Field of the code | Field of the name | Distinct values in 2025 |
|---|---|---|---|
| Inciso | `inciso_id` | `inciso_desc` | 8 |
| Principal | `principal_id` | `principal_desc` | 48 paths |
| Parcial | `parcial_id` | `parcial_desc` | 215 paths |
| Subparcial | `subparcial_id` | `subparcial_desc` | 526 |

The same rows also carry three more axes: `finalidad_id` and `funcion_id` (what
the state spends it for), `fuente_financiamiento_id` (where the money comes
from), and `ubicacion_geografica_id` (where it goes).

## 3. The measures

Tail of the header of the file of the spending:

```
credito_presupuestado, credito_vigente, credito_comprometido,
credito_devengado, credito_pagado, ultima_actualizacion_fecha
```

Tail of the header of the file of the revenue:

```
recurso_inicial, recurso_vigente, recurso_ingresado_percibido,
ultima_actualizacion_fecha
```

There is no field with the name `credito_inicial`. The candidate for that
concept is `credito_presupuestado`, because its value is lower than
`credito_vigente` in every sampled row. The glossary of the site describes the
two terms in a way that does not agree with that order. **Unverified: ask
`info@presupuestoabierto.gob.ar` which glossary term `credito_presupuestado`
holds.**

## 4. Volume and freshness

| File of 2025 | Compressed | CSV | Rows |
|---|---|---|---|
| `credito-anual-2025.zip` | 3.5 MB | 102 MB | 113,217 |
| `credito-mensual-2025.zip` | 14.4 MB | 418 MB | 470,940 |
| `credito-diario-2025.zip` | 36.6 MB | not measured | not measured |
| `recursos-anual-2025.zip` | 26 KB | — | 563 |
| `d-objeto-gasto-2025.zip` | 20 KB | — | 945 |
| `d-apertura-programatica-2025.zip` | 78 KB | — | 2,455 |
| `d-institucion-2025.zip` | 2.6 KB | — | 103 |

Coverage: one dataset per year, from 1995 to 2025.

Freshness on 2026-09-14: every row of the exercise 2025 carries the text
"Ultima actualizacion del ejercicio 2025: 05 Julio 2026". The HTTP header
`Last-Modified` of the ZIP files agrees. The data was two months old on the day
of this research.

**The publisher sets the ceiling of the freshness of this product.** No page of
the site states an update policy. One third-party document from 2016 says
"weekly", but that document is stale and the evidence does not support it.
**Unverified.**

## 5. The fiscal result

The four public endpoints do not serve a fiscal result. There are three paths,
and each one has a cost.

**a. The internal endpoint of the site.** The visualization "Cuenta Ahorro
Inversion Financiamiento" reads
`GET https://www.presupuestoabierto.gob.ar/sici/rest-api/reporte/cta-aif-base-devengado/<year>`.
It answers HTTP 200 with JSON and it needs no token. It covers the exercises
2017 to 2025. It gives the economic result and the financial result, on the
accrual basis, and it does not give a primary result as a named row.

Risk: the endpoint is not in the public contract. It can change or stop without
a notice. Do not build on it without a question to the publisher.

**b. The monthly report of the Secretaria de Hacienda.** XLSX files at
`https://www.argentina.gob.ar/economia/sechacienda/infoestadistica`, on the cash
basis, from 2020 to July 2026. It holds the primary result and the financial
result. Cost: it is a binary file, and the parser breaks when the layout
changes.

**c. Compute it.** The same bulk files hold the revenue
(`recursos-anual-<year>.zip`) and the spending. The difference of the two is a
financial result on the accrual basis, and it agrees with the spending tree of
this product by construction. Cost: it is our number, not the official number,
and the two can differ.

The dataset `informe-mensual-de-ingresos-y-gastos...` of datos.gob.ar covers
2015 to 2018 only. It is abandoned. Do not use it.

## 6. The licence

Creative Commons Attribution 4.0 (CC BY 4.0). The site says "Creative Commons
4.0". datos.gob.ar states the variant.

## 7. What exists today

| Product | What it does | What it does not do |
|---|---|---|
| presupuestoabierto.gob.ar | Official visualizations with a drill down, and the fiscal result tables | It serves its own visualizations from a private endpoint, and it gates the public export behind a token |
| Argendata (Fundar) | Macro data with a topic of public spending | No line-item drill down of the national budget |
| Chequeado | Articles that explain the budget | Not a navigator |
| ASAP | Analysis and training | Not a navigator |

## 8. How to check this again

1. `curl -I https://dgsiaf-repo.mecon.gob.ar/repository/pa/datasets/2025/credito-anual-2025.zip`
   and read `Last-Modified`.
2. Read the field `ultima_actualizacion_fecha` of any row.
3. Read the OpenAPI file at `https://presupuesto-abierto.argentina.apidocs.ar/openapi.json`.

## 9. Open questions

1. Which glossary term does `credito_presupuestado` hold?
2. What is the real update cadence of the bulk files?
3. Is there a rate limit?
4. Is the internal endpoint of section 5a stable by intent?
5. Is a primary result published as a discrete field anywhere?
6. Does the API accept columns that the OpenAPI file does not list?

Send questions 1, 2, 3 and 4 to `info@presupuestoabierto.gob.ar`.

## 10. Measured baseline (2026-09-14)

The bulk repository holds the exercise 2026. The catalog of datos.gob.ar did
not show it, but the file is there. **The catalog lags behind the repository.
Read the repository.**

The update pattern of the file `credito-anual-<year>.zip`:

| Exercise | Last modification | Size | State |
|---|---|---|---|
| 2023 | 2024-07-07 | 4.2 MB | closed, frozen |
| 2024 | 2025-07-04 | 3.8 MB | closed, frozen |
| 2025 | 2026-07-08 | 3.6 MB | closed, frozen |
| 2026 | 2026-09-13 | 2.7 MB | open, it moves |

A closed exercise gets a final update in July of the next year. Then it stops.
The open exercise moves. The file of 2026 changed one day before this note.

Totals, computed from the files. The unit is millions of pesos. The unit is not
in the header. It comes from the magnitude of the total. **Unverified.**

| Exercise | Rows | Devengado | Vigente | Execution |
|---|---|---|---|---|
| 2025 | 113,217 | 123,533,955 | 128,573,460 | 96.1% |
| 2026 | 82,748 | 104,202,063 | 152,474,969 | 68.3% |

The first level of 2025, by jurisdiction, as a part of the devengado:

| Jurisdiction | Part |
|---|---|
| Ministerio de Capital Humano | 59.8% |
| Servicio de la Deuda Publica | 8.4% |
| Ministerio de Economia | 6.1% |
| Ministerio de Salud | 5.6% |
| Ministerio de Seguridad Nacional | 5.4% |
| Obligaciones a Cargo del Tesoro | 5.0% |
| Ministerio de Defensa | 4.2% |
| Jefatura de Gabinete de Ministros | 1.9% |
| The other 7 jurisdictions | 3.7% |

One slice holds 59.8% of the first level. The other slices are small. A pie
chart of the first level shows one large part and many small parts.

## 11. The catalog endpoint

The page "Datos abiertos" of presupuestoabierto.gob.ar reads its list of files
from an endpoint that needs no token:

```
GET https://www.presupuestoabierto.gob.ar/sici/rest-api/catalog/site
```

It answers 2.7 MB of JSON. It holds 1,448 links, and every link points to
`dgsiaf-repo.mecon.gob.ar/repository/pa/datasets/`. The catalog contains the
exercise 2026.

This endpoint is the machine-readable index of every published file. **The
alert feature can watch this endpoint to find a new publication.** It has the
same risk as the endpoint of section 5a: it is not in the public API contract.

**Proof of the origin of the data**: the files that this project reads are the
same files that the official site offers on its own page of open data. The URLs
are identical. There is no copy and there is no mirror in the middle.

## 12. Reconciliation against the official report (2025)

The official report "Cuenta Ahorro Inversion Financiamiento" is an aggregation
of the same rows that this project reads. The test below proves it.

Method: sum `credito_devengado` of `credito-anual-2025.csv`, sum
`recurso_ingresado_percibido` of `recursos-anual-2025.csv`, and compare the two
sums with the endpoint `/sici/rest-api/reporte/cta-aif-base-devengado/2025`,
column "Administracion Nacional".

| Item | Computed from the files | Official report | Difference |
|---|---|---|---|
| Total spending | 123,533,955,013,702 | 123,533,955,013,702 | 0 |
| Total revenue | 134,812,992,323,522 | 134,812,992,323,521 | 1 peso |
| Financial result | 11,279,037,309,820 | 11,279,037,309,820 | 0 |

The difference of one peso comes from the decimals of the CSV.

**Three conclusions:**

1. The universe of `credito-anual-<year>.csv` is the Administracion Nacional.
   No filter is necessary to get the official total.
2. The unit is millions of pesos. This is now verified, not inferred.
3. A fiscal result that this project computes is the official fiscal result.
   The endpoint of the official report is a test, not a source.

**Make this test part of the build.** The build computes the result, reads the
official report, and compares the two. A difference that is not zero means the
pipeline is broken. It does not mean the state changed its numbers.

## 13. The five measures of 2025

| Measure | Pesos | Part of the devengado |
|---|---|---|
| `credito_presupuestado` | 94,573,214,036,061 | 76.6% |
| `credito_vigente` | 128,573,459,634,511 | 104.1% |
| `credito_comprometido` | 123,557,153,298,126 | 100.0% |
| `credito_devengado` | 123,533,955,013,702 | 100.0% |
| `credito_pagado` | 121,090,244,437,455 | 98.0% |

Two gaps in this table are facts about the state, not errors:

- **The Congress approved 94.6 and the state spent 123.5.** The modifications
  during the exercise add 36% to the first number.
- **The state owed 123.5 and paid 121.1.** The difference of 2.44 (2.0%) is the
  debt that moves to the next exercise.

## 14. Size of the precomputed tree (2025)

Method: group the 113,217 rows by the full path of the 9 institutional levels
and the 4 object levels. Sum `credito_devengado` at each node. Serialize the
result to JSON and compress it.

| Item | Value |
|---|---|
| Nodes in the tree | 128,558 |
| JSON, not compressed | 11.26 MB |
| JSON, gzip | 1.08 MB |
| The first two levels, gzip | 1.3 KB |

Nodes per level:

| Level | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Nodes | 15 | 40 | 100 | 122 | 489 | 703 | 1,204 | 2,379 | 2,418 | 5,487 | 17,678 | 48,433 | 49,490 |

Levels 1 to 9 are the institutional axis. Levels 10 to 13 are the object of the
spending, under each institutional leaf.

**The full tree of one exercise is 1 MB. The entry screen is 1.3 KB.** A server
that computes an aggregate at the time of the request is not necessary.
