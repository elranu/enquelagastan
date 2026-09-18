# En qué la gastan

Un mapa navegable del gasto público del Estado nacional argentino.

Los datos ya son abiertos. Llegan como miles de filas con códigos para la
jurisdicción, el programa y el objeto del gasto. Un ejercicio, el 2025, tiene
113.217 filas con 13 niveles.

Sin login. Sin necesidad de conocer los términos del presupuesto.

## Qué es este proyecto hoy

El sitio está publicado en **https://elranu.github.io/enquelagastan/**.
GitHub Pages lo sirve, y cada corrida del build que publica datos nuevos lo
actualiza.

El build corre todos los días. Descarga los archivos abiertos. Suma sus
filas. Compara el total contra el informe oficial. Escribe el resultado como
archivos JSON.

Las pantallas leen esos archivos. La primera pantalla muestra el total del
ejercicio como un gráfico de anillos, con una cinta de filas al lado. Una
parte del anillo principal es una jurisdicción. Quien lee toca una parte, o
su fila, y esa parte crece hasta ocupar el todo: entidad, programa,
actividad, y el objeto del gasto. Los anillos exteriores mantienen el camino
a la vista.

"Volver", la tecla Escape, la miga de pan y el botón Atrás del navegador suben
un nivel. Las flechas de la barra superior cambian el año, y el camino se
mantiene. Cada paso es una entrada del historial, así que un link abre el
mismo nodo.

Un botón cambia el aspecto, con tres estados: sistema, claro y oscuro. Un
interruptor, "Billetes", da los colores de los billetes de peso, y una
frase: cuántos pesos de cada 100 fueron a la parte más grande. Los dos
controles son iconos.

El pie de la cinta nombra el archivo y la fecha de la que viene el número.
Ese pie está siempre visible.

El sitio no necesita login ni conocer los términos del presupuesto. No carga
ninguna tipografía ni ningún script de otro servidor. Las tipografías viven
bajo `site/fuentes/`.

El diseño de las pantallas vive en
`docs/superpowers/specs/2026-09-17-navigator-redesign-design.md` y
`docs/designpowers/2026-09-17-navigator-redesign/02-wireframes.md`.

Todavía faltan dos cosas. La pantalla del resultado fiscal espera los
ingresos, porque el build solo lee el gasto. El botón que quita la inflación
espera un plan futuro.

## Los números son los números del Estado

Cada número de acá viene de los archivos que publica el Ministerio de
Economía. Este proyecto los suma; no los ajusta.

El build lo prueba en cada corrida. Calcula el total del ejercicio y lo
compara contra el informe oficial "Cuenta Ahorro Inversión Financiamiento".
**Cuando los dos no coinciden, no se publica nada.**

En el ejercicio 2025, el build compara un número:

| | Este proyecto | El informe oficial |
|---|---|---|
| Gasto total | 123.533.955.013.702 | 123.533.955.013.702 |

El build lee el gasto. Todavía no lee los ingresos. Los ingresos y el
resultado fiscal pertenecen a una pantalla que todavía no existe.

Una persona midió a mano los ingresos de 2025 el 2026-09-14, y encontró
134.812.992.323.522 pesos. La misma medición da un resultado fiscal de
11.279.037.309.820 pesos. **Ninguna verificación de este proyecto prueba
esos dos números.** Leelos como notas, no como una verificación automática.

## Comprobá un número por tu cuenta

Comprobá hoy el total principal, sin confiar en este proyecto:

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

Imprime `123.533.955.013.702`, el mismo total que da la tabla de arriba.

La fuente guarda cada monto en millones de pesos. El script multiplica el
total por un millón.

El mismo método funciona para cualquier rama del árbol, una vez que quien
lee filtra las filas del archivo por los códigos de esa rama.

## La medida

Este proyecto muestra el **crédito devengado**: el gasto que el Estado
ejecutó, es decir, el gasto cuya obligación ya nació. El empleado trabajó el
mes, el bien llegó, la jubilación se volvió pagadera. El Estado debe esa
plata, la haya pagado o no.

`CONTEXT.md` define todos los términos del presupuesto que usa este
producto.

## Corré el build

Python 3.11 o posterior. **Sin dependencias.**

```bash
python -m unittest discover -s tests -v
python -m build --destino site/data
```

Las pruebas de las pantallas no necesitan el build. Correlas con Node 22.7
o posterior. El repositorio no tiene `package.json`, así que Node tiene que
detectar los módulos de `site/app/*.js` por su cuenta, y eso solo lo hace
desde esa versión:

```bash
node --test
```

Las pantallas leen lo que escribe el build, así que corré el build primero.
`site/data/manifest.json` está vacío en un clon nuevo, y un servidor que
arranca antes del build muestra la pantalla de una falla:

```bash
python -m build --destino site/data
python3 -m http.server 8000 --directory site
```

El comando `node --test` no lleva ninguna ruta. Node 26 lee un directorio
suelto como una ruta de módulo, así que `node --test test/` falla ahí.

El build descarga el archivo de cada ejercicio en cada corrida. Tres
archivos de 3,5 MB una vez al día no cuestan nada.

## La fuente

Presupuesto Abierto, Ministerio de Economía de la Nación.
`https://www.presupuestoabierto.gob.ar/`. Licencia CC BY 4.0.

Este proyecto lee los mismos archivos que ofrece la página oficial de datos
abiertos. Las URLs son idénticas, sin copia y sin espejo en el medio.

## Cómo se diseñó esto

- `docs/superpowers/specs/` la especificación de diseño
- `docs/designpowers/` la investigación y el diseño de las pantallas y el modelo
- `docs/adr/` las decisiones difíciles de revertir
- `CONTEXT.md` el glosario

## Licencia

MIT para el código. Los datos pertenecen al Estado argentino, bajo CC BY 4.0.
