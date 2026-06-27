# Despierta tu Terreno — Plan de Potencial (Yodesarrollo)

Flujo de captación de leads para dueños de terreno. Reemplaza los dos Google
Forms viejos (Plan de Potencial + "Desarrollemos juntos") con una experiencia
por pasos, marca Yodesarrollo, ~2 minutos. Mismo motor probado de
[aurum-experiencia](https://github.com/alexpueblag/aurum-experiencia).

## El embudo (importante)
1. **Formulario** (este) → capta interés + datos del terreno. Es el primer contacto.
2. **Videollamada GRATIS** → el Masterdeveloper explica qué es el Plan de Potencial, con ejemplos, y su **costo**.
3. **Plan de Potencial (DE PAGO)** → el análisis/diagnóstico a fondo del terreno.
4. **Co-desarrollo** → solo si el Plan de Potencial da números positivos, el dueño **puede ser seleccionado** para co-desarrollar con la cartera de accionistas/co-desarrolladores. **No es automático** — pasa por el filtro.

El formulario NO regala análisis ni muestra costos: su único trabajo es
**agendar la videollamada gratis**. Cero cifras de dinero en pantalla.

## Qué es
HTML estático de un solo archivo (`index.html`), sin build ni dependencias.
- **5 pasos + cierre:** objetivo → ubicación → terreno → expectativa → datos → reveal.
- **Barra viva** con el potencial cualitativo (sin dinero en pantalla).
- **Rama "otra forma"** para capital / colaborar / licencia Masterdeveloper.
- **POST** a un Apps Script → pestaña `LEADS - POTENCIAL` del Sheet `CRM - YOD`.
- **Copy 100% editable** desde la pestaña `TEXTOS POTENCIAL` (sin tocar código).
- Agenda de videollamada responsive (tarjeta + botón a la página de citas).

## Archivos
- `index.html` — la app completa.
- `aviso-privacidad.html` — aviso LFPDPPP.
- `docs/webhook-apps-script.gs` — Web App: GET textos + POST lead (UPSERT por folio).
- `docs/tarea-analisis-potencial.md` — routine diaria (borrador en Gmail para AGENDAR la videollamada; no entrega el Plan de pago).
- `docs/paridad.md` — mapeo de los campos viejos → nuevos (0 huérfanos).

## Puesta en marcha (pasos de Alejandro)
1. **Desplegar el Apps Script:** pega `docs/webhook-apps-script.gs` en un proyecto
   de Apps Script, corre `sembrarTextos()`, publica como App web (acceso:
   cualquiera) y copia la URL `/exec`.
2. **Pegar la URL** en `index.html` → `const WEBHOOK_URL = "…/exec";`.
3. **Publicar** en GitHub Pages (repo `alexpueblag/plan-potencial`).
4. **Cambiar el link** "Plan de Potencial Personalizado" en yodesarrollo.mx por
   la nueva URL.
5. **Instalar la routine** de `docs/tarea-analisis-potencial.md` en Cowork.

## Activar el píxel de Meta (medición del embudo)
1. **Navegador:** en `index.html`, pon el ID del píxel de YODESARROLLO en `const META_PIXEL_ID`. Dispara: `PageView`, `PasoEmbudo {paso}` (cada paso), `Lead` (con `event_id=folio`), `Schedule` (clic en agendar), `Contact` (rama otra-forma).
2. **CAPI server-side (opcional pero recomendado):** en `docs/webhook-apps-script.gs`, pon el MISMO `META_PIXEL_ID` y el `META_CAPI_TOKEN` (Events Manager → Conversions API). Manda `Lead`/`Contact` desde el servidor con el mismo `event_id` → deduplica y resiste iOS/adblock.
3. En Events Manager arma el embudo con el evento `PasoEmbudo`.

## Redespliegue del Apps Script (cuando cambie el .gs)
Tras editar `docs/webhook-apps-script.gs`: pégalo en el proyecto "Plan de Potencial",
Implementar → Administrar → Editar → **Nueva versión**. Luego, una vez:
- `actualizarTextosMapa()` — empuja al Sheet la copy nueva del Paso 2 + aviso simplificado.
- (Las columnas Lat/Lng y las pestañas `ACTIVIDAD POTENCIAL` se crean solas.)

## Board (medición del embudo)
`GET ?recurso=board` devuelve el embudo (server-side, sin pérdida de iOS) + KPIs.
El navegador manda un beacon de actividad en `pagehide`/`visibilitychange`.
Brief para el agente del board en `docs/brief-board-redes.md` (local).

## Identidad
Vino `#703438` · Índigo `#465798` · Petróleo `#013e42` · Crema `#f6f5f2`.
Títulos serif, cuerpo PT Sans.
