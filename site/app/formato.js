// Write a number for a reader of Argentina.
//
// The source holds millions of pesos. The copy of this product is in Spanish,
// so a thousand separator is a point and a decimal separator is a comma. The
// scale is the long one of Spanish: a billon is a million millions.

const LOCAL = "es-AR";

export function pesosDe(millones) {
  return Math.round(millones * 1_000_000);
}

export function montoLargo(millones) {
  return new Intl.NumberFormat(LOCAL).format(pesosDe(millones));
}

export function montoCorto(millones) {
  const pesos = pesosDe(millones);
  const escalas = [
    [1e12, "billones"],
    [1e6, "millones"],
  ];
  for (const [tamanio, nombre] of escalas) {
    if (Math.abs(pesos) >= tamanio) {
      const valor = new Intl.NumberFormat(LOCAL, {
        minimumFractionDigits: 1, maximumFractionDigits: 1,
      }).format(pesos / tamanio);
      return `${valor} ${nombre}`;
    }
  }
  return new Intl.NumberFormat(LOCAL).format(pesos);
}

export function porcentaje(parte, decimales = 1) {
  return `${new Intl.NumberFormat(LOCAL, {
    minimumFractionDigits: decimales, maximumFractionDigits: decimales,
  }).format(parte * 100)}%`;
}

export function conSigno(parte) {
  const redondo = Math.round(parte * 100);
  const signo = redondo > 0 ? "+" : "";
  return `${signo}${new Intl.NumberFormat(LOCAL).format(redondo)}%`;
}
