# Paridad de datos — Plan de Potencial v2

Garantiza que el nuevo flujo "Despierta tu terreno" captura **todo** lo de los dos Google Forms que reemplaza.

## Form A — "Planificación de Potencial para tu Propiedad" (13 campos)

| # | Campo viejo (Google Form) | Dónde se captura ahora | Clave en payload |
|---|---|---|---|
| 1 | Correo | Gate (toggle correo / extra al WhatsApp) | `email` |
| 2 | Dirección completa | Paso 2 · textarea | `direccion` |
| 3 | Enlace de geolocalización | Paso 2 · botón Maps + input | `geo` |
| 4 | Tamaño del terreno m² | Paso 3 · stepper superficie | `m2` |
| 5 | m² construidos | Paso 3 · stepper (si "tiene construcción") | `m2_construido` |
| 6 | Precio de venta esperado | Paso 4 · input opcional | `precio_esperado` |
| 7 | Metros de frente | Paso 3 · stepper frente | `frente` |
| 8 | Metros de fondo | Paso 3 · stepper fondo | `fondo` |
| 9 | Nombre propietario/intermediario | Gate (`nombre`) + Paso 4 (rol) | `nombre` + `rol` |
| 10 | ¿Cómo llamamos a tu propiedad? | Paso 4 · input apodo | `apodo` |
| 11 | ¿Deseas propuesta de co-desarrollo? (5 op.) | Paso 1 · intención (hook) | `intencion` |
| 12 | Teléfono | Gate (WhatsApp default) | `tel` |
| 13 | Subir imágenes | (Diferido) se piden en la videollamada / WhatsApp | — |

> **Nota campo 13:** subir binarios desde una página estática a Apps Script añade fricción y peso. Decisión: NO se pierde el dato — las fotos se piden en la sesión o por WhatsApp. Si Alejandro lo quiere en el form, se agrega un input file → upload a Drive vía el .gs en una iteración posterior.

## Form B — "Desarrollemos juntos" (4 intenciones)

| Intención vieja | Dónde va ahora |
|---|---|
| Aportar mi terreno para desarrollar | Paso 1 · intención `codesarrollo` (entra al flujo completo) |
| Aportar capital (asoc. en participación 20%) | Rama "otra forma" · `capital` |
| Colaborar con el equipo | Rama "otra forma" · `colaborar` |
| Ser Masterdeveloper (licencia) | Rama "otra forma" · `licencia` |

Campos del Form B (nombre, teléfono, correo) → capturados en el gate corto de la rama "otra forma".

## Mejora sobre los forms viejos (info nueva)
- `tipo_terreno` (baldío / con construcción) — no existía.
- `rol` (dueño / intermediario) — explícito.
- `aprovechamiento` (niveles estimados) — derivado, viaja al CRM.
- `origen` (UTM/fbclid/referrer) — atribución de campaña que el Google Form no daba.
- `folio` único POT-YYYYMMDD-INI-XXXXX.
