# Design spec: the public spending navigator

Date: 2026-09-14. Status: version 1, from `superpowers:brainstorming`.
Next stage: `designpowers:eventstorming`.

Research that supports this spec:
`docs/designpowers/2026-09-14-public-spending-navigator/00-data-sources.md`.
Every number in this spec comes from that note. The note gives the method and
the source of each number.

## 1. The problem

Argentina discusses the spending of the national state every day. The data of
that spending is open, but it arrives as thousands of rows with codes. One
exercise has 113,217 rows and 13 levels of classification. A person who wants
to know where the money goes must first learn what a budget code is.

The data is public. The data is not readable.

## 2. The product

One screen. The user opens it and sees the total spending of the national
state as a pie chart, with the fiscal result beside it. The user taps one
slice and goes one level down. The user goes down to the object of the
spending, which says how much goes to salaries.

The product asks for no login. It asks for no knowledge of budget terms. It
keeps the same URL.

The users are the citizens, the journalists and the researchers of Argentina.

## 3. Decisions

| # | Decision | Value |
|---|---|---|
| 1 | The measure | `credito_devengado`, the spending that the state executed |
| 2 | The exercise on entry | The last closed exercise |
| 3 | Navigation between exercises | Arrows. The open exercise is at the right |
| 4 | The unit | Current pesos, with the part of the total beside it |
| 5 | The mark | A pie chart at every level |
| 6 | Small slices | Below 4% they join one slice with the name "otros" |
| 7 | The slice "otros" | The user opens it. It gives another pie chart |
| 8 | Nodes with one child | The build removes them from the path |
| 9 | The axis | Institution, and then object of the spending |
| 10 | The fiscal result | This project computes it, and it verifies it |
| 11 | The source | The bulk files. They need no token |
| 12 | The exercises of the first version | 2024, 2025 and 2026 |

## 4. Out of scope

These items are deferred. The user asked for each deferral.

- A comparison between exercises that removes the inflation.
- The three other axes: purpose, source of the money, and place.
- The alerts on a branch of the tree.
- The provinces.
- The exercises before 2024.
- A treemap. Section 7 gives the reason.

## 5. The source of the data

The project reads the bulk files of the DGSIAF repository:

```
https://dgsiaf-repo.mecon.gob.ar/repository/pa/datasets/<exercise>/credito-anual-<exercise>.zip
https://dgsiaf-repo.mecon.gob.ar/repository/pa/datasets/<exercise>/recursos-anual-<exercise>.zip
```

These files need no token. The official site offers the same URLs on its own
page of open data. The licence is CC BY 4.0.

The API of Presupuesto Abierto serves the same data, but it asks for a bearer
token. The token gives no more data. The project does not use it.

One exercise is 3.5 MB compressed and 113,217 rows. The unit of the values is
millions of pesos.

**A note on the words for large numbers.** The Spanish word "billon" is
1,000,000,000,000. The English word for that number is "trillion". The copy of
the product is in Spanish, and this spec is in English. Use the number, and not
the word, when the two languages must agree.

**The codes are not unique.** The value of `programa_id` repeats under a
different `servicio_id`. The key of a node is the full path, and never the
last code.

## 6. The shape of the data

The build makes a tree. Each row of the CSV is a leaf. The row carries the 13
codes of its own path as columns, so the build needs no join.

```
for each row of the CSV:
    path = [jurisdiccion, ..., actividad, inciso, ..., subparcial]
    for each prefix of the path:
        node[prefix].devengado += row.credito_devengado
```

One pass. 1.5 million additions for one exercise.

The tree of one exercise has 128,558 nodes. As JSON it is 11.26 MB, and 1.08
MB after gzip.

### The partition

The build cuts the tree where the product changes its question.

| File | Content | Size |
|---|---|---|
| `/data/<exercise>/institucional.json` | The 9 institutional levels, 7,470 nodes | 113 KB gzip |
| `/data/<exercise>/objeto/<path>.json` | The object of the spending under one leaf | 421 B median, 3.8 KB maximum |

One exercise has 1 institutional file and 2,418 object files.

The reason: after 113 KB, every movement inside the institutional axis needs no
network. The page shows the first level immediately, which is 1.3 KB, and it
reads the institutional file behind the first paint.

A closed exercise never changes, so its files can carry a cache of one year.
The open exercise needs a short cache.

## 7. The screen

### The entry

The user sees the last closed exercise. The screen shows the total, the part
of the authorized budget that the state executed, the pie chart, and the
fiscal result.

```
   <-  2024            2025 - closed             2026  ->

   WHERE THE NATIONAL STATE SPENT IT
   123.5 trillion pesos - executed - 96.1% of the authorized budget

       pie chart                   FISCAL RESULT 2025
       Capital Humano 59.8%          revenue     134.8
       Deuda 8.4%                    spending    123.5
       Economia 6.1%                 surplus     +11.3
       Salud 5.6% ... otros 5.6%
```

At the first level the rule of 4% leaves 7 slices and one slice "otros".

### One level down

The user taps a slice. The pie chart of that slice opens. The rule of 4%
applies again, and the parts are a part of the new total.

The measurements support one pie chart at every level:

| Slices after the rule of 4% | Nodes | Part |
|---|---|---|
| 2 | 5,420 | 39.2% |
| 3 | 3,650 | 26.4% |
| 4 | 2,482 | 18.0% |
| 5 | 1,643 | 11.9% |
| 6 to 8 | 608 | 4.4% |
| 9 or more | 10 | 0.1% |

The median is 3 slices and the maximum is 18. No node has all its children
below 4%, so the slice "otros" is never the full circle.

The user opens the slice "otros" and gets another pie chart. In 22.4% of the
nodes the slice "otros" is not necessary. In 53.3% the user opens it one time.
In 21.2% there is a slice "otros" inside the slice "otros". Only 8 nodes of the
tree need more than 4 openings.

### Why the product has no treemap

A treemap shows many sibling rectangles. The width of a node does not follow
the level in this tree. The median number of children is 1 or 2 at every level
except the root. Only 52 nodes of the tree have more than 12 children, and they
are in 8 different levels.

A rule such as "a treemap below level 2" gives a treemap of one rectangle most
of the time. A rule per node gives two marks and an interface that changes its
shape while the user goes down.

The root is the one node that is always wide, with 15 children. The pie chart
stays there because one slice holds 59.8%, and that number is the message.

### Nodes with one child

The tree has 79,069 nodes with children. 62,462 of them have exactly one child
(79.0%). A pie chart of one child is a full circle of one colour, and it
repeats the screen before it. The longest chain is 7 levels.

**The build removes these nodes from the path.** The path of the breadcrumb
keeps their names. The user goes from a node to the first node that divides.

### The open exercise

The open exercise is not complete, and the screen says so. In 2026 the state
executed 68.3% of the authorized budget. In 2025 it executed 96.1%. The pie
chart of 2026 is smaller because the exercise is not finished, and not because
the state spent less.

## 8. The build

```
HEAD of the ZIP -> no change  -> stop
                -> change     -> download -> tree -> verify -> publish
                                                  -> fail   -> keep the last build
```

The build runs one time per day. It reads the header `Last-Modified` of the
ZIP. If the file did not change, the build stops and downloads nothing.

**This design does not need to know the cadence of the publisher.** The open
exercise moves, and a closed exercise gets a final update in July of the next
year. The check finds a change on any cadence.

### The verification

The official report "Cuenta Ahorro Inversion Financiamiento" is an aggregation
of the same rows. The test of 2025 gives:

| Item | This project | The official report | Difference |
|---|---|---|---|
| Total spending | 123,533,955,013,702 | 123,533,955,013,702 | 0 |
| Total revenue | 134,812,992,323,522 | 134,812,992,323,521 | 1 peso |
| Financial result | 11,279,037,309,820 | 11,279,037,309,820 | 0 |

The build reads
`https://www.presupuestoabierto.gob.ar/sici/rest-api/reporte/cta-aif-base-devengado/<exercise>`
and compares. **The build does not publish a total that is different from the
official total.**

That endpoint is not in the public contract of the API. It can stop. So the
build has a second check that needs nobody: it compares the new total with the
total of the last build. A large movement stops the build.

### The failures

| Failure | The build does this | Reason |
|---|---|---|
| The ZIP gives 404 | It does not publish. It reports | An old page is better than an empty page |
| The ZIP is corrupt | The verification stops it | The total does not agree |
| A column changed its name | The parser fails loudly | A loud failure is better than a silent wrong sum |
| The total is not the official total | It does not publish. It reports to a person | It is our error, or a correction of the publisher |
| The official endpoint does not answer | It publishes with the second check | The product does not depend on an endpoint without a contract |
| A closed exercise changed | It builds it again and records it | A correction of a closed exercise is news |

**The hard rule of the build: do not publish a number that is different from
the official number.** The only asset of this product is that its numbers are
the numbers of the state.

## 9. The tests

| Test | What it protects |
|---|---|
| Two equal codes under a different parent stay separate | The most important test. The total is correct even when the build merges two programs, so no sum reports this error |
| The sum of the tree against a small CSV | The aggregation |
| The removal of a node with one child | The jump to the first node that divides, and the names in the breadcrumb |
| The rule of 4% and the slice "otros" | The group, and the new parts inside the slice "otros" |
| A verification that fails | That a total which does not agree stops the publication |

## 10. Open questions

These questions do not stop the work. Send the first four to
`info@presupuestoabierto.gob.ar`.

1. Which term of the glossary does the field `credito_presupuestado` hold?
2. Is there a rate limit?
3. Is the endpoint of the official report stable by intent?
4. Does the API accept columns that its OpenAPI file does not list?
5. Where does the build run, and where does the site live? Section 11.

## 11. What the next stage decides

- The events of the build and of the navigation: **skipped**. The user asked
  to skip `designpowers:eventstorming` on 2026-09-15. Section 8 of this spec
  already gives the flow of the build. Recover the stage when the work
  reaches the alerts, which section 4 defers.
- The screen, the transition between levels, and the behaviour on a telephone:
  `designpowers:wireframing`.
- The words of the domain, and `CONTEXT.md`: `designpowers:domain-modeling`.
- The host, the scheduler and the deployment: `superpowers:writing-plans`.

## 12. Handoff

| Item | State |
|---|---|
| The source, with URLs and licence | Present, section 5 |
| The field names and the hierarchy | Present, in the research note |
| The measures, verified | Present, section 8 |
| The decisions, with their reasons | Present, section 3 |
| The deferrals | Present, section 4 |
| The sizes and the counts | Present, sections 6 and 7 |
| The failures of the build | Present, section 8 |
| The host and the scheduler | Absent. Section 11 |
