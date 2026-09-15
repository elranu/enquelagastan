# En qué la gastan

A navigable map of the public spending of the Argentine national state.

The data is open already. It arrives as thousands of rows with codes for the
jurisdiccion, the programa and the object of the spending. One exercise, 2025,
is 113,217 rows with 13 levels.

No login. No knowledge of budget terms.

## What this project is today

The build works today. It downloads the open files. It adds up their rows.
It checks the total against the official report. It writes the result as
JSON files. It runs every day.

The screens do not exist yet. Their design lives in
`docs/designpowers/2026-09-14-public-spending-navigator/02-wireframes.md`.

The plan calls for a map of the whole spending on one screen. A tap will
take the reader down, one level at a time, to the object of the spending.

## The numbers are the numbers of the state

Every number here comes from the files that the Ministerio de Economia
publishes. This project adds them up; it does not adjust them.

The build proves that on every run. It computes the total of the exercise and
compares it against the official report "Cuenta Ahorro Inversion
Financiamiento". **When the two do not agree, nothing is published.**

On the exercise 2025, the build compares one number:

| | This project | The official report |
|---|---|---|
| Total spending | 123,533,955,013,702 | 123,533,955,013,702 |

The build reads the spending. It does not read the revenue yet. The revenue
and the fiscal result belong to a screen that does not exist yet.

A person measured the revenue of 2025 by hand on 2026-09-14, and found
134,812,992,323,522 pesos. The same measurement gives a fiscal result of
11,279,037,309,820 pesos. **No check of this project proves those two
numbers.** Read them as notes, and not as a machine check.

## Check a number yourself

Check the headline total today, with no trust in this project:

```bash
curl -O https://dgsiaf-repo.mecon.gob.ar/repository/pa/datasets/2025/credito-anual-2025.zip
unzip credito-anual-2025.zip
python3 -c "
import csv
total = 0.0
for fila in csv.DictReader(open('credito-anual-2025.csv', encoding='utf-8-sig')):
    valor = fila['credito_devengado'].replace('.', '').replace(',', '.')
    total += float(valor or 0)
print(f'{total * 1_000_000:,.0f}')
"
```

It prints `123,533,955,013,702`, the same total the table above gives.

The source stores each amount in millions of pesos. The script multiplies
the total by one million.

The same method works for any branch of the tree, once the reader filters
the file's rows by that branch's codes.

## The measure

This project shows the **credito devengado**: the spending that the state
executed, which means that the obligation was born. The employee worked the
month, the good arrived, the pension became payable. The state owes that money,
whether it paid it or not.

`CONTEXT.md` defines every term of the budget that this product uses.

## Run the build

Python 3.11 or later. **No dependency.**

```bash
python -m unittest discover -s tests -v
python -m build --destino site/data
```

The build downloads the file of every exercise on every run. Three files of
3.5 MB once a day cost nothing.

## The source

Presupuesto Abierto, Ministerio de Economia de la Nacion.
`https://www.presupuestoabierto.gob.ar/`. Licence CC BY 4.0.

This project reads the same files that the official page of open data offers.
The URLs are identical, with no copy and no mirror in the middle.

## How this was designed

- `docs/superpowers/specs/` the design spec
- `docs/designpowers/` the research and the design of the screens and the model
- `docs/adr/` the decisions that are hard to reverse
- `CONTEXT.md` the glossary

## Licence

MIT for the code. The data belongs to the Argentine state, under CC BY 4.0.
