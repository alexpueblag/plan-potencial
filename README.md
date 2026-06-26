# Despierta tu Terreno — Plan de Potencial (Yodesarrollo)

Flujo de captación de leads para dueños de terreno. Reemplaza los dos Google
Forms viejos (Plan de Potencial + "Desarrollemos juntos") con una experiencia
por pasos, marca Yodesarrollo, ~2 minutos. Mismo motor probado de
[aurum-experiencia](https://github.com/alexpueblag/aurum-experiencia).

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
- `docs/tarea-analisis-potencial.md` — routine diaria (borrador de análisis en Gmail).
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

## Identidad
Vino `#703438` · Índigo `#465798` · Petróleo `#013e42` · Crema `#f6f5f2`.
Títulos serif, cuerpo PT Sans.
