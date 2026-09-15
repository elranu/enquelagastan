This file holds the ubiquitous language of the project. Terms only. No
implementation detail.

The terms of the budget keep their Spanish spelling, because they are the names
that the source data uses. The definition is in English. See
`docs/WRITING_STYLE.md`, "Technical names and technical verbs".

## Terms of the source

### ejercicio

One budget year of the state. The data has one set of files per ejercicio. A
closed ejercicio does not change again. The open ejercicio changes.

### jurisdiccion

The first level of the institutional axis. A ministry, a power of the state, or
the service of the public debt. There are 15 with execution in 2025.

### subjurisdiccion, entidad, servicio

The levels under the jurisdiccion. They divide a ministry into the bodies that
hold a budget.

### programa, subprograma, proyecto, actividad, obra

The levels under the servicio. They say what the body does with the money. The
actividad is the level where most of the spending stops.

### objeto del gasto

The second axis. It says what the state buys, and not who buys it. Its levels
are the inciso, the principal, the parcial and the subparcial. The inciso has 8
values, and "Gastos en personal" is one of them.

### credito presupuestado

The budget that the Congress approved at the start of the ejercicio.

### credito vigente

The budget after the modifications of the ejercicio. It is the limit that the
body can spend. The modifications added 36% to the approved budget in 2025.

### credito comprometido

The part of the budget that the body promised to a supplier.

### credito devengado

The spending that the state executed. The state owes this money, and the
obligation exists. **This is the measure that this product shows.**

### credito pagado

The part of the devengado that left the treasury. The difference between the
devengado and the pagado passes to the next ejercicio.

### recurso ingresado percibido

The revenue that the state received. It is the measure of the revenue that
matches the devengado on the side of the spending.

### resultado financiero

The revenue of the ejercicio minus the spending of the ejercicio. A positive
result is a surplus.

## Terms of this product

### nodo

One position in the tree of the spending. A nodo holds a name, the four
measures, and its children.

### camino

The full list of codes from the jurisdiccion to one nodo. **The camino is the
key of a nodo.** The codes are not unique by themselves, so a code alone names
no nodo.

### otros

The slice that groups every child below 4% of its parent. It is a term of this
product and it does not exist in the source. The visitor can open it.

### procedencia

The source of one number: the file, its date of publication, and, at the lowest
nodo of a branch, the codes of the camino. Every number of this product shows
its procedencia.
