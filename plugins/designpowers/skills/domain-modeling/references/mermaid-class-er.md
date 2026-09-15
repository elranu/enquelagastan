# Aggregates, entities and states in Mermaid

## Level 2: aggregates as subgraphs

```mermaid
flowchart LR
  subgraph PaymentLink["Payment link (aggregate)<br/>INV-01 payments never exceed amount<br/>INV-02 no payment after expiry"]
    direction TB
    C1[Create payment link]:::command --> E1[Payment link created]:::event
    C2[Register payment]:::command --> E2[Payment registered]:::event
    C3[Expire link]:::command --> E3[Link expired]:::event
  end
  subgraph Receipt["Receipt (aggregate)"]
    C4[Issue receipt]:::command --> E4[Receipt issued]:::event
  end
  E2 -.->|process: whenever payment registered, issue receipt| C4
  classDef command fill:#4a90e2,color:#fff
  classDef event fill:#f5a623,color:#000
```

A process is a dotted edge from an event of one aggregate to a command of another.

## Level 3: classDiagram per aggregate

```mermaid
classDiagram
  class PaymentLink {
    <<aggregate root>>
    LinkId id
    Money amount
    Date expiry
    LinkStatus status
    create(amount, expiry)
    registerPayment(payment)
    expire()
  }
  class Payment {
    <<entity>>
    PaymentId id
    Money amount
    DateTime paidAt
  }
  class Money {
    <<value object>>
    Decimal value
    Currency currency
  }
  class MerchantId {
    <<value object>>
  }
  PaymentLink "1" *-- "0..*" Payment : payments
  PaymentLink --> MerchantId : owned by
  Payment --> Money
  PaymentLink --> Money
```

Rules:

- Stereotypes: `<<aggregate root>>`, `<<entity>>`, `<<value object>>`.
- Composition `*--` inside the aggregate. A plain arrow with an ID type for a reference to
  another aggregate (`MerchantId`), never the other aggregate's class.
- Attribute types in domain terms: `Money`, `Email`, `Date`, `Percentage`.
- Methods are the commands the root accepts. Optional at this level.

## State machine of a root

States come from the events. Transitions are the commands.

```mermaid
stateDiagram-v2
  [*] --> Draft: create
  Draft --> Published: publish
  Published --> PartiallyPaid: registerPayment
  PartiallyPaid --> Paid: registerPayment [total reached]
  Published --> Paid: registerPayment [total reached]
  Published --> Expired: expire
  PartiallyPaid --> Expired: expire
  Paid --> [*]
  Expired --> [*]
```

Guards in brackets are invariants. Name them: `[INV-01]`.

## erDiagram, optional

Only for a user who thinks in this notation. It still describes the domain, not the
tables.

```mermaid
erDiagram
  PAYMENT_LINK ||--o{ PAYMENT : receives
  PAYMENT_LINK }o--|| MERCHANT : "owned by"
  PAYMENT_LINK {
    LinkId id
    Money amount
    Date expiry
    LinkStatus status
  }
  PAYMENT {
    PaymentId id
    Money amount
    DateTime paidAt
  }
```

## In the conversation

```
PaymentLink (root)  id, amount: Money, expiry: Date, status
  |-- 0..* Payment (entity)  id, amount: Money, paidAt
  |-- MerchantId (reference by ID)
  INV-01 sum(payments.amount) <= amount
  INV-02 no registerPayment after expiry

Draft -create-> Published -registerPayment-> PartiallyPaid -registerPayment[INV-01]-> Paid
                    \-expire-> Expired
```
