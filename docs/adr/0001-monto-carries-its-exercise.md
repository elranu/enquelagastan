# ADR-0001: A Monto carries the exercise that it belongs to

Status: accepted
Date: 2026-09-15
Deciders: the user, the agent
Stage: domain-modeling, level 3

## Context

The product shows the spending of the national state in pesos of the day. The
visitor moves between exercises with an arrow, so a comparison across exercises
is a central action and not a rare one.

Argentina has a high inflation. The spending of 2025 is 123.5 trillion pesos
and the spending of 2026 is 104.2 trillion pesos on 2026-09-14, but the two
numbers do not share a unit. A comparison between them in pesos of the day
reports a change that the prices produced, and not a change that the state
produced.

The user deferred the button that removes the inflation. The user also said
that the button is the part of this decision that interests them. So the model
must make that button a small change later.

## Decision

The type `Monto` holds an amount in millions of pesos **and the exercise that
the amount belongs to**. An operation that adds or compares two `Monto` values
of different exercises is not a valid operation. The conversion to a constant
peso is a function that takes a `Monto` and a base exercise, and it gives a new
type.

## Alternatives rejected

| Alternative | Why rejected |
|---|---|
| A plain number | Nothing stops a comparison between the pesos of 2024 and the pesos of 2026. The mistake produces a number that looks correct, and no test reports it |
| A comment or a rule in the documentation | A rule that a type does not carry depends on the memory of the next person |
| Store every amount already deflated | The product must show the official number first. A deflated number does not agree with the source, and the credibility of the product depends on that agreement |

## Consequences

- The button that removes the inflation becomes one function and one parameter,
  and not an audit of every place that holds a number.
- Every operation on an amount needs the exercise. This costs more code today.
- A comparison across exercises must say which base it uses. That is a feature,
  because the product must never hide that choice from the reader.
- Revisit when the deflator arrives: the open question D-Q1 asks which price
  index and which base exercise. Nobody has looked for the source of that index
  yet.

## Reversal cost

To remove the exercise from the type is cheap. To add it later is not: every
place that holds, adds or compares an amount must be found and changed, and the
places that are wrong produce numbers that look correct. That asymmetry is the
reason for this record.
