# En qué la gastan

A navigable map of the public spending of the Argentine national state.

The data is open already. It arrives as thousands of rows with codes for the
jurisdiccion, the programa and the object of the spending: one exercise is
113,217 rows with 13 levels. This project shows it on one screen, and it goes
down with a tap to the place where the money stops.

No login. No knowledge of budget terms.

## The numbers are the numbers of the state

Every number here comes from the files that the Ministerio de Economia
publishes. This project adds them up; it does not adjust them.

The build proves that on every run. It computes the total of the exercise and
compares it against the official report "Cuenta Ahorro Inversion
Financiamiento". **When the two do not agree, nothing is published.**

On the exercise 2025:

| | This project | The official report |
|---|---|---|
| Total spending | 123,533,955,013,702 | 123,533,955,013,702 |
| Total revenue | 134,812,992,323,522 | 134,812,992,323,521 |
| Financial result | 11,279,037,309,820 | 11,279,037,309,820 |

The difference of one peso comes from the decimals of the source file.

## Check a number yourself

Every screen names the file that produced its number, with the date of
publication. At the lowest level of a branch it also names the codes of the
rows.

```bash
curl -O https://dgsiaf-repo.mecon.gob.ar/repository/pa/datasets/2025/credito-anual-2025.zip
unzip credito-anual-2025.zip
```

Then add the column `credito_devengado` over the rows that carry those codes.

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

The build reads the header of the source file first, and it downloads nothing
when the file did not change.

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
