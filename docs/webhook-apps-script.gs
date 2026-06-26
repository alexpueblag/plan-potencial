/**
 * ############################################################
 * ##  ⚠️  PROYECTO DE APPS SCRIPT NUEVO E INDEPENDIENTE   ##
 * ##  NO pegues esto en el script de Aurum / arquitectura. ##
 * ##  Comparte nombres (doGet, doPost, CRM_ID…) con él;    ##
 * ##  mezclarlos ROMPERÍA ambos. Crea un proyecto NUEVO.   ##
 * ##  Solo agrega pestañas nuevas al Sheet (no toca nada). ##
 * ############################################################
 *
 * ============================================================
 *  WEBHOOK — Despierta tu Terreno (Plan de Potencial · Yodesarrollo)
 * ============================================================
 *  Web App único (un solo /exec) que:
 *   1. GET ?recurso=textos  -> sirve la copy editable de la pestaña
 *      "TEXTOS POTENCIAL" del Sheet "CRM - YOD" (clave / valor).
 *      sembrarTextos() crea y rellena esa pestaña (idempotente).
 *   2. POST (JSON del flujo) -> UPSERT por FOLIO en la pestaña
 *      "LEADS - POTENCIAL" del mismo "CRM - YOD".
 *      Acepta dos tipos:
 *        - tipo:"lead_potencial"  (dueño de terreno, flujo completo)
 *        - tipo:"lead_interes"    (rama capital/colaborar/licencia)
 *
 *  DESPLIEGUE (una vez):
 *   1. script.google.com -> Nuevo proyecto -> pega este archivo.
 *   2. Ejecuta sembrarTextos() (autoriza permisos la 1ª vez).
 *   3. Implementar -> Nueva implementación -> App web:
 *        Ejecutar como: TÚ ·  Acceso: Cualquiera.
 *   4. Copia la URL /exec y pégala en index.html (const WEBHOOK_URL).
 *   Tras cambiar este .gs: Implementar -> Administrar -> Editar ->
 *   Nueva versión (la URL NO cambia).
 *
 *  Pruebas sin la web: testTextos(), testInsertarLead().
 *  NOTA DE FORMATO: líneas <= ~84 columnas para que el copy-paste
 *  no parta strings.
 * ============================================================
 */

// CRM - YOD (el mismo Sheet de los leads de arquitectura)
const CRM_ID = "1z1ZtvcUKnx4MUfxLICo8x5bTihlDY8tBC3j2sYwNvg8";

const TAB_LEADS  = "LEADS - POTENCIAL";   // un renglón por folio
const TAB_TEXTOS = "TEXTOS POTENCIAL";    // copy editable (clave / valor)

// token compartido con la tarea diaria (sólo quien lo conozca marca
// seguimiento). Si lo cambias aquí, cámbialo en el prompt de la tarea.
const TOKEN_TAREA = "YOD-POT-TAREA-5h8x3k";

/* ===================== ROUTER ===================== */

function doGet(e) {
  try {
    if (e && e.parameter && e.parameter.recurso === "textos") {
      return respuesta_({ ok: true, textos: leerTextos_() });
    }
    return respuesta_({
      ok: true,
      servicio: "plan-potencial",
      recursos: ["GET ?recurso=textos", "POST lead JSON"]
    });
  } catch (err) {
    return respuesta_({ ok: false, error: String(err) });
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const datos = JSON.parse(e.postData.contents);
    if (datos && datos.tipo === "estado") {
      return respuesta_(marcarEstado_(datos));
    }
    const resultado = upsertLead_(datos, e.postData.contents);
    return respuesta_({ ok: true, accion: resultado });
  } catch (err) {
    return respuesta_({ ok: false, error: String(err) });
  } finally {
    if (lock.hasLock()) lock.releaseLock();
  }
}

function respuesta_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ===================== LEADS: UPSERT POR FOLIO ===================== */

const HEADERS_LEADS = [
  "Primer contacto", "Última actualización", "Folio", "Tipo",
  "Nombre", "Email", "WhatsApp", "Canal", "Apodo",
  "Intención", "Rol", "Forma interés",
  "Dirección", "Geo (Maps)", "Tipo terreno",
  "Terreno m2", "Frente m", "Fondo m", "M2 construido",
  "Precio esperado", "Aprovechamiento",
  "Estado", "Análisis enviado", "Sesión agendada",
  "UTM source", "UTM medium", "UTM campaign", "UTM content",
  "UTM term", "fbclid", "gclid", "Referrer", "URL",
  "Consentimiento", "Consentimiento fecha", "Versión aviso",
  "Notas", "JSON"
];

function upsertLead_(lead, rawJson) {
  const email  = String(lead.email || "").trim().toLowerCase();
  const emailOk = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
  const telDig = String(lead.tel || "").replace(/\D/g, "");
  // gate de 1 contacto: basta email O WhatsApp (>=10 dígitos)
  if (!emailOk && telDig.length < 10) {
    return "descartado: sin contacto válido (email o WhatsApp)";
  }

  const hoja = obtenerHojaLeads_();
  const headers = hoja.getRange(1, 1, 1, hoja.getLastColumn())
    .getValues()[0];
  const col = function (nombre) {
    const i = headers.indexOf(nombre);
    if (i < 0) throw new Error("Falta columna en " + TAB_LEADS + ": " + nombre);
    return i + 1;
  };

  const ahora  = new Date();
  const o      = lead.origen || {};
  const folio  = String(lead.folio || "").trim();
  const datos = {
    "Folio": folio,
    "Tipo": lead.tipo || "",
    "Nombre": lead.nombre || "",
    "Email": (emailOk ? email : ""),
    "WhatsApp": lead.tel || "",
    "Canal": lead.contacto_canal || "",
    "Apodo": lead.apodo || "",
    "Intención": lead.intencion_txt || lead.intencion || "",
    "Rol": lead.rol || "",
    "Forma interés": lead.forma || "",
    "Dirección": lead.direccion || "",
    "Geo (Maps)": lead.geo || "",
    "Tipo terreno": lead.tipo_terreno || "",
    "Terreno m2": lead.m2 || "",
    "Frente m": lead.frente || "",
    "Fondo m": lead.fondo || "",
    "M2 construido": lead.m2_construido || "",
    "Precio esperado": lead.precio_esperado || "",
    "Aprovechamiento": lead.aprovechamiento || "",
    "UTM source": o.utm_source || "",
    "UTM medium": o.utm_medium || "",
    "UTM campaign": o.utm_campaign || "",
    "UTM content": o.utm_content || "",
    "UTM term": o.utm_term || "",
    "fbclid": o.fbclid || "",
    "gclid": o.gclid || "",
    "Referrer": o.ref || "",
    "URL": o.url || "",
    "Consentimiento": lead.consent ? "Sí" : "",
    "Consentimiento fecha": lead.consent_ts || "",
    "Versión aviso": lead.version_aviso || "",
    "JSON": rawJson || JSON.stringify(lead)
  };

  // buscar renglón existente por FOLIO (evita duplicado en doble-envío)
  const fila = buscarFilaPorFolio_(hoja, col("Folio"), folio);
  if (fila > 0) {
    Object.keys(datos).forEach(function (k) {
      if (datos[k] !== "") hoja.getRange(fila, col(k)).setValue(datos[k]);
    });
    hoja.getRange(fila, col("Última actualización")).setValue(ahora);
    return "actualizado";
  }

  // nuevo renglón
  const fin = hoja.getLastRow() + 1;
  hoja.getRange(fin, col("Primer contacto")).setValue(ahora);
  hoja.getRange(fin, col("Última actualización")).setValue(ahora);
  hoja.getRange(fin, col("Estado")).setValue("NUEVO");
  Object.keys(datos).forEach(function (k) {
    if (datos[k] !== "") hoja.getRange(fin, col(k)).setValue(datos[k]);
  });
  return "insertado";
}

function buscarFilaPorFolio_(hoja, colFolio, folio) {
  if (!folio) return -1;
  const ultima = hoja.getLastRow();
  if (ultima < 2) return -1;
  const vals = hoja.getRange(2, colFolio, ultima - 1, 1).getValues();
  for (var i = 0; i < vals.length; i++) {
    if (String(vals[i][0]).trim() === folio) return i + 2;
  }
  return -1;
}

/* La tarea diaria marca seguimiento sin degradar (POST {tipo:"estado"}). */
function marcarEstado_(d) {
  if (d.secret !== TOKEN_TAREA) return { ok: false, error: "token inválido" };
  const hoja = obtenerHojaLeads_();
  const headers = hoja.getRange(1, 1, 1, hoja.getLastColumn())
    .getValues()[0];
  const col = function (n) {
    const i = headers.indexOf(n);
    if (i < 0) throw new Error("Falta columna: " + n);
    return i + 1;
  };
  const fila = buscarFilaPorFolio_(hoja, col("Folio"), String(d.folio || ""));
  if (fila < 0) return { ok: false, error: "folio no encontrado" };
  if (d.analisis)  hoja.getRange(fila, col("Análisis enviado")).setValue(d.analisis);
  if (d.sesion)    hoja.getRange(fila, col("Sesión agendada")).setValue(d.sesion);
  if (d.estado)    hoja.getRange(fila, col("Estado")).setValue(d.estado);
  if (d.nota) {
    const celdaNota = hoja.getRange(fila, col("Notas"));
    const prev = celdaNota.getValue();
    celdaNota.setValue((prev ? prev + " · " : "") + d.nota);
  }
  hoja.getRange(fila, col("Última actualización")).setValue(new Date());
  return { ok: true };
}

function obtenerHojaLeads_() {
  const ss = SpreadsheetApp.openById(CRM_ID);
  let hoja = ss.getSheetByName(TAB_LEADS);
  if (!hoja) {
    hoja = ss.insertSheet(TAB_LEADS);
    hoja.appendRow(HEADERS_LEADS);
    hoja.setFrozenRows(1);
    hoja.getRange(1, 1, 1, HEADERS_LEADS.length).setFontWeight("bold");
    return hoja;
  }
  // auto-sanado: agrega al final las columnas de HEADERS_LEADS que falten,
  // así al publicar una versión nueva nunca rompe por columna ausente.
  const hdr = hoja.getRange(1, 1, 1, hoja.getLastColumn()).getValues()[0];
  const faltan = HEADERS_LEADS.filter(function (h) { return hdr.indexOf(h) < 0; });
  if (faltan.length) {
    hoja.getRange(1, hoja.getLastColumn() + 1, 1, faltan.length)
      .setValues([faltan]).setFontWeight("bold");
  }
  return hoja;
}

/* ===================== TEXTOS EDITABLES ===================== */

function leerTextos_() {
  const ss = SpreadsheetApp.openById(CRM_ID);
  const hoja = ss.getSheetByName(TAB_TEXTOS);
  if (!hoja) return {};
  const vals = hoja.getDataRange().getValues();
  const out = {};
  for (var i = 1; i < vals.length; i++) {
    const k = String(vals[i][0] || "").trim();
    const v = vals[i][1];
    if (k) out[k] = (v == null ? "" : String(v));
  }
  return out;
}

/* Lista canónica de claves + valores por defecto.
   DEBE coincidir con los data-txt de index.html. */
const TEXTOS_SEMILLA = [
  ["clave", "valor", "nota"],
  ["marca_nombre", "YODESARROLLO", "Logo texto línea 1"],
  ["marca_sub", "CO·DESARROLLO INMOBILIARIO", "Logo texto línea 2"],
  ["logo_url", "", "URL de imagen del logo (vacío = marca tipográfica)"],

  ["p0_badge", "Videollamada gratis · 2 min · sin compromiso", ""],
  ["p0_titulo",
   "Tu terreno puede estar <em>dormido</em>. Descubre lo que podría llegar a ser.",
   "Portada · admite <em>"],
  ["p0_sub",
   "Cuéntanos de tu terreno y agenda una videollamada gratis con tu Masterdeveloper. Ahí te explicamos —con ejemplos— tu Plan de Potencial: el análisis que define si tu terreno es candidato al co-desarrollo.",
   ""],
  ["p0_cta", "Descubrir el potencial →", ""],
  ["p0_t1", "Videollamada inicial sin costo", ""],
  ["p0_t2", "Cientos de miles de m² desarrollados", ""],
  ["p0_t3", "Te contactamos en menos de 48 h", ""],

  ["p1_kicker", "Paso 1 · Tu objetivo", ""],
  ["p1_titulo", "¿Qué te gustaría que pasara con <em>tu terreno</em>?", ""],
  ["p1_sub", "Elige lo que más se acerca. No hay respuesta incorrecta.", ""],
  ["p1_otro", "No tengo terreno, me interesa de otra forma →", ""],

  ["p2_kicker", "Paso 2 · Ubicación", ""],
  ["p2_titulo", "¿Dónde está tu terreno?", ""],
  ["p2_sub",
   "Con la ubicación tu Masterdeveloper analiza la zona, su valor y lo que se puede construir.",
   ""],
  ["p2_dir_lbl", "Dirección de la propiedad", ""],
  ["p2_dir_help", "Calle y número, colonia, ciudad. Lo más completo que puedas.", ""],
  ["p2_geo_lbl", "Ubicación exacta en el mapa", ""],
  ["p2_geo_btn", "Buscar mi terreno en Google Maps", ""],
  ["p2_geo_help",
   "Búscalo, mantén presionado el punto exacto, toca \"Compartir\" → \"Copiar enlace\", y pégalo aquí.",
   ""],

  ["p3_kicker", "Paso 3 · El terreno", ""],
  ["p3_titulo", "¿Cómo es tu terreno?", ""],
  ["p3_sub", "Unos cuantos datos y verás el potencial tomar forma abajo.", ""],
  ["p3_tipo_lbl", "¿Cómo está hoy?", ""],
  ["p3_sup_lbl", "Superficie del terreno", ""],
  ["p3_sup_help", "Aproximado está bien.", ""],
  ["p3_frente_lbl", "Metros de frente", ""],
  ["p3_fondo_lbl", "Metros de fondo", ""],
  ["p3_const_lbl", "¿Cuántos m² ya están construidos?", ""],
  ["p3_const_help", "Lo que habría que considerar o demoler.", ""],

  ["p4_kicker", "Paso 4 · Tu expectativa", ""],
  ["p4_titulo", "Lo último sobre el terreno", ""],
  ["p4_sub",
   "Esto nos ayuda a afinar la propuesta. El valor real te lo damos en el análisis.",
   ""],
  ["p4_rol_lbl", "¿Eres el dueño?", ""],
  ["p4_precio_lbl", "¿Lo has pensado vender? ¿en cuánto?", ""],
  ["p4_precio_help",
   "Si tienes una cifra en mente, escríbela. Si no, déjalo en blanco.", ""],
  ["p4_apodo_lbl", "¿Cómo le llamamos a tu propiedad?", ""],
  ["p4_apodo_help",
   "Un nombre corto para tu análisis. Ej. \"El terreno de la loma\".", ""],

  ["p5_kicker", "Paso 5 · Tus datos", ""],
  ["p5_titulo", "¿A dónde te contactamos para agendar tu <em>videollamada</em>?", ""],
  ["p5_sub",
   "Tu Masterdeveloper te contacta en menos de 48 h para coordinar tu videollamada gratis. Sin compromiso.",
   ""],
  ["gate_toggle_correo", "Prefiero por correo →", ""],
  ["gate_btn", "Agendar mi videollamada →", ""],
  ["gate_candado",
   "Usamos tus datos solo para enviarte tu análisis. Nada de spam. <a href=\"aviso-privacidad.html\" target=\"_blank\">Aviso de privacidad</a>.",
   ""],

  ["px_kicker", "Sumarte a Yodesarrollo", ""],
  ["px_titulo", "¿Cómo te gustaría <em>participar</em>?", ""],
  ["px_sub", "No necesitas un terreno para desarrollar con nosotros.", ""],
  ["px_btn", "Quiero que me contacten →", ""],

  ["nav_atras", "← Atrás", ""],
  ["nav_cont", "Continuar →", ""],
  ["lb_lab", "Potencial de tu terreno", ""],

  ["r_kicker", "Tu terreno tiene potencial", ""],
  ["r_l1", "Superficie", ""],
  ["r_l2", "Frente", ""],
  ["r_l3", "Aprovechamiento", ""],
  ["r_sesion_t", "Agenda tu videollamada con tu Masterdeveloper", ""],
  ["r_sesion_1", "Te explicamos qué es el Plan de Potencial, con ejemplos reales", ""],
  ["r_sesion_2",
   "Si tu terreno califica, cómo entrar al co-desarrollo con nuestra cartera", ""],
  ["r_sesion_3", "Sin compromiso · la videollamada es sin costo", ""],
  ["mdev_nombre", "Alejandro Puebla", ""],
  ["mdev_rol", "Tu Masterdeveloper", ""],
  ["mdev_frase",
   "\"Analizo cada terreno para minimizar la inversión y elevar la rentabilidad de quienes lo aportan.\"",
   ""],
  ["r_paso1",
   "<b>Te contactamos en menos de 48 h</b> para confirmar tu videollamada gratis con tu Masterdeveloper.",
   ""],
  ["r_paso2",
   "En la videollamada te explicamos a detalle tu Plan de Potencial y, si los números califican, cómo entrar al co-desarrollo.",
   ""],
  ["r_nota",
   "Lo que ves aquí es una lectura preliminar de tu terreno. El Plan de Potencial es el análisis a detalle que se presenta a partir de la videollamada; el co-desarrollo aplica solo para terrenos que califican. Tu propiedad permanece a tu nombre.",
   ""],

  ["grx_badge", "Recibido", ""],
  ["grx_titulo", "¡Gracias! Te <em>contactamos</em> muy pronto.", ""],
  ["grx_sub",
   "Tu Masterdeveloper revisará tu información y se pondrá en contacto contigo.",
   ""],

  ["cta_agenda_url",
   "https://calendar.app.google/aoxnSs1WVrkhXFLw6",
   "Link de la Página de citas de Google (videollamada)"],
  ["version_aviso", "v1-2026-06", "Versión del aviso de privacidad vigente"]
];

function sembrarTextos() {
  const ss = SpreadsheetApp.openById(CRM_ID);
  let hoja = ss.getSheetByName(TAB_TEXTOS);
  if (!hoja) {
    hoja = ss.insertSheet(TAB_TEXTOS);
    hoja.getRange(1, 1, TEXTOS_SEMILLA.length, 3).setValues(TEXTOS_SEMILLA);
    hoja.setFrozenRows(1);
    hoja.getRange(1, 1, 1, 3).setFontWeight("bold");
    return "creada con " + (TEXTOS_SEMILLA.length - 1) + " claves";
  }
  // idempotente: agrega solo las claves que falten, nunca pisa lo editado
  const vals = hoja.getDataRange().getValues();
  const existentes = {};
  for (var i = 1; i < vals.length; i++) {
    existentes[String(vals[i][0] || "").trim()] = true;
  }
  const nuevas = TEXTOS_SEMILLA.slice(1).filter(function (r) {
    return !existentes[r[0]];
  });
  if (nuevas.length) {
    hoja.getRange(hoja.getLastRow() + 1, 1, nuevas.length, 3)
      .setValues(nuevas);
  }
  return "agregadas " + nuevas.length + " claves nuevas";
}

/* ===================== PRUEBAS ===================== */

function testTextos() {
  Logger.log(JSON.stringify(leerTextos_(), null, 2));
}

function testInsertarLead() {
  const r = upsertLead_({
    tipo: "lead_potencial",
    folio: "POT-TEST-" + Date.now(),
    nombre: "Prueba Terreno", tel: "6620000000", contacto_canal: "whatsapp",
    apodo: "Lote de prueba", intencion: "codesarrollo",
    intencion_txt: "Co-desarrollar sin invertir de más", rol: "dueno",
    direccion: "Calle Falsa 123, Hermosillo", geo: "",
    tipo_terreno: "baldio", m2: 600, frente: 12, fondo: 50, m2_construido: 0,
    precio_esperado: "3000000", aprovechamiento: "2 a 3 niveles",
    consent: true, consent_ts: new Date().toISOString(),
    version_aviso: "v1-2026-06",
    origen: { utm_source: "facebook", utm_campaign: "terreno-dormido" }
  }, "{}");
  Logger.log(r);
}
