# ASCII kit for screen sketches

Rules:

- Monospace, at most 40 columns wide. Split a wide screen into two places or two regions.
- One place per code block. Variants as a list under the block.
- Every affordance carries its ID from the level 2 breadboard: `(A4)`.
- Exactly one primary action per screen, drawn as `[ ... ]`. Secondary actions as `( ... )`.
- No colours, no icons, no spacing decisions. Order and grouping only.

## Components

```
+--------------------------------------+   frame and title
| Create payment link                  |
+--------------------------------------+

Amount (A1)                                text field
[ 1200.00                    ] ARS

Description (A2)                           multi-line field
[                            ]
[                            ]

Expiry (A3)                                select or date
[ 2026-09-30            v ]

[x] Send receipt automatically (A9)        checkbox
( ) Fixed amount  (o) Any amount (A10)     radio

[ Create link (A4) ]   ( Cancel (A5) )     primary and secondary actions

Copy link (A6)                             link

+--------------------------------------+   list rows
| Invoice 1042      paid     1,200.00  |
| Invoice 1043      pending    850.00  |
| Invoice 1044      expired    300.00  |
+--------------------------------------+

| Date       | Status  | Amount   |     table header
|------------|---------|----------|

[ Links ] [ Payments ] [ Settings ]      tabs, active in brackets

  +----------------------------+          modal
  | Delete this link?          |
  | ( Keep )   [ Delete (A12) ]|
  +----------------------------+

~ Link copied ~                            toast

  (empty)                                  empty state
  No links yet. [ Create your first link ]

  ... loading                              loading state
```

## A complete sketch

```
+--------------------------------------+
| Create payment link                  |
+--------------------------------------+
| Amount (A1)                          |
| [ 0.00                    ] ARS      |
|                                      |
| Description (A2)                     |
| [                           ]        |
|                                      |
| Expiry (A3)                          |
| [ in 7 days              v ]         |
|                                      |
| [ Create link (A4) ]  ( Cancel (A5) )|
+--------------------------------------+
```

Data shown: none (creation form).
Inputs collected: amount (decimal, required), description (text, optional), expiry (date,
required, default 7 days).
Rules enforced: amount greater than zero; expiry later than today.
Variants: validation error (message under the field, A4 stays enabled); submitting (A4
disabled, "creating...").
