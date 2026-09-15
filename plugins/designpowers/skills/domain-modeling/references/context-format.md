# CONTEXT.md format

`CONTEXT.md` is the ubiquitous language of the project: the terms the business uses, with
one meaning each. Skills read it before they write a design, a plan or a test. The format
follows the glossary discipline of Matt Pocock's `domain-modeling` skill (MIT).

Rules:

- Terms only. No implementation detail: no field names, no table names, no class names, no
  endpoints.
- One term, one meaning. An overloaded term gets one entry per context, or the contexts
  split into their own files.
- Every definition is one or two sentences, in the words a domain expert would use.
- "Not to be confused with" links the terms people mix up.
- Update the file at the moment a term is agreed. Never at the end of a session.

## Single context

```markdown
# Context: <project or context name>

This file holds the ubiquitous language of <project>. Terms only. No implementation detail.

## Actors

### Merchant
A business that creates payment links to collect money from its clients.
Not to be confused with: Payer.

### Payer
The person or business that pays a payment link.

## Events

### Payment link created
A merchant published a link with an amount and an expiry. From this moment a payer can open it.

## Commands

### Create payment link
The merchant's request to publish a new link.

## Aggregates

### Payment link
The thing a merchant creates and a payer pays. It owns the amount, the expiry and the
payments received. Invariants: INV-01, INV-02.

## Terms

### Expiry
The moment after which a link accepts no payment.
Not to be confused with: Cancellation, which the merchant decides.
```

## Several contexts

`CONTEXT-MAP.md` at the repository root:

```markdown
# Context map

| Context | Directory | Upstream of | Downstream of | Pattern |
|---|---|---|---|---|
| Payments | `contexts/payments/CONTEXT.md` | Notifications | Identity | Customer-supplier with Identity |
| Identity | `contexts/identity/CONTEXT.md` | Payments | - | Open host service |
```

One `CONTEXT.md` per context directory, with the single-context format above.
