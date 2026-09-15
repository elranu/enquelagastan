"""The amounts of the budget.

An amount belongs to one exercise. A peso of 2024 and a peso of 2026 are not
the same unit, because the prices changed. The type carries the exercise so
that a comparison across exercises cannot be written by accident. See
docs/adr/0001-monto-carries-its-exercise.md.
"""

from dataclasses import dataclass

ADR = "docs/adr/0001-monto-carries-its-exercise.md"


@dataclass(frozen=True)
class Monto:
    """An amount in millions of pesos of one exercise."""

    millones: float
    ejercicio: int

    def _mismo_ejercicio(self, otro: "Monto") -> None:
        if self.ejercicio != otro.ejercicio:
            raise ValueError(
                f"the pesos of {self.ejercicio} and the pesos of "
                f"{otro.ejercicio} are not the same unit. See {ADR}."
            )

    def __add__(self, otro: "Monto") -> "Monto":
        self._mismo_ejercicio(otro)
        return Monto(self.millones + otro.millones, self.ejercicio)

    def __sub__(self, otro: "Monto") -> "Monto":
        self._mismo_ejercicio(otro)
        return Monto(self.millones - otro.millones, self.ejercicio)

    def mayor_que(self, otro: "Monto", tolerancia: float = 1e-6) -> bool:
        self._mismo_ejercicio(otro)
        return self.millones > otro.millones + tolerancia

    @property
    def pesos(self) -> float:
        return self.millones * 1_000_000


@dataclass(frozen=True)
class Medidas:
    """The five measures of the spending of one nodo."""

    presupuestado: Monto
    vigente: Monto
    comprometido: Monto
    devengado: Monto
    pagado: Monto

    def mas(self, otras: "Medidas") -> "Medidas":
        return Medidas(
            self.presupuestado + otras.presupuestado,
            self.vigente + otras.vigente,
            self.comprometido + otras.comprometido,
            self.devengado + otras.devengado,
            self.pagado + otras.pagado,
        )


def MedidasCero(ejercicio: int) -> Medidas:
    cero = Monto(0.0, ejercicio)
    return Medidas(cero, cero, cero, cero, cero)


def parse_monto(texto, ejercicio: int) -> Monto:
    """Read a number of the source. The source uses a comma for the decimals."""
    limpio = (texto or "").strip()
    if not limpio:
        return Monto(0.0, ejercicio)
    if "," in limpio:
        limpio = limpio.replace(".", "").replace(",", ".")
    return Monto(float(limpio), ejercicio)
