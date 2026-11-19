/**
 * Digital Invitation API Backend - Naozi Printing Multi-Tenant Edition
 * Supports: Multi-Event Isolation (Events, Settings, Guests, Wishes),
 *           PIN/Super-Admin Auth, LockService, CacheService, & Auto-Migration.
 */

const DEFAULT_EVENT_ID = 'default';
const DEFAULT_SUPER_ADMIN_KEY = 'naozi-admin-2026';
const CACHE_TTL_SECONDS = 300; // 5 menit

function getSuperAdminKey_() {
  const props = PropertiesService.getScriptProperties();
  return props.getProperty('SUPER_ADMIN_KEY') || DEFAULT_SUPER_ADMIN_KEY;
}

function isSuperAdmin_(key) {
  if (!key) return false;
  return String(key).trim() === getSuperAdminKey_();
}

function normalizeEventId_(raw) {
  const cleaned = String(raw || DEFAULT_EVENT_ID)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '');
  return cleaned || DEFAULT_EVENT_ID;
}

function jsonResponse_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  const params = e && e.parameter ? e.parameter : {};
  const action = params.action || '';
  const eventId = normalizeEventId_(params.event || params.eventId);

  try {
    let result;
    if (action === 'getSettings') {
      result = getSettings(eventId);
    } else if (action === 'getWishes') {
      result = getWishes(eventId);
    } else if (action === 'getGuests') {
      requireEventAuth_(eventId, params.pin, params.superKey);
      result = getGuests(eventId);
    } else if (action === 'listEvents') {
      requireSuperAdmin_(params.superKey);
      result = listEvents();
    } else if (action === 'initSheets') {
      requireSuperAdmin_(params.superKey);
      result = initSheets();
    } else {
      return ContentService
        .createTextOutput('API Active (Multi-Tenant v2)')
        .setMimeType(ContentService.MimeType.TEXT);
    }
    return jsonResponse_(result);
  } catch (err) {
    return jsonResponse_({ status: 'error', error: err.message, message: err.message });
  }
}

function doPost(e) {
  const params = e && e.parameter ? e.parameter : {};
  const action = params.action || '';
  let payload = {};

  try {
    payload = e && e.postData && e.postData.contents
      ? JSON.parse(e.postData.contents)
      : params;
  } catch (err) {
    payload = params;
  }

  const eventId = normalizeEventId_(payload.eventId || payload.event || params.event || params.eventId);
  const pin = payload.pin || params.pin || '';
  const superKey = payload.superKey || params.superKey || '';

  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    let result;

    if (action === 'saveSettings') {
      requireEventAuth_(eventId, pin, superKey);
      const settingsObj = payload.settings || payload;
      result = saveSettings(eventId, settingsObj);
    } else if (action === 'addGuest') {
      requireEventAuth_(eventId, pin, superKey);
      result = addGuest(eventId, payload.name, payload.phone);
    } else if (action === 'deleteGuest') {
      requireEventAuth_(eventId, pin, superKey);
      result = deleteGuest(eventId, payload.id);
    } else if (action === 'sendWish') {
      result = sendWish(eventId, payload.name, payload.message, payload.attendance, payload.guestCount);
    } else if (action === 'verifyPin') {
      result = verifyEventPin(eventId, pin, superKey);
    } else if (action === 'createEvent') {
      requireSuperAdmin_(superKey);
      result = createEvent(payload);
    } else if (action === 'updateEvent') {
      requireSuperAdmin_(superKey);
      result = updateEvent(payload);
    } else if (action === 'initSheets') {
      requireSuperAdmin_(superKey);
      result = initSheets();
    } else {
      throw new Error('Unknown action: ' + action);
    }

    return jsonResponse_({ status: 'success', message: result, data: result });
  } catch (err) {
    return jsonResponse_({ status: 'error', error: err.message, message: err.message });
  } finally {
    lock.releaseLock();
  }
}

function requireSuperAdmin_(superKey) {
  if (!isSuperAdmin_(superKey)) {
    throw new Error('Akses ditolak: Super Admin Key tidak valid.');
  }
}

function getEventRecord_(eventId) {
  ensureSheetsExist_();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Events');
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim().toLowerCase() === eventId) {
      return {
        rowIndex: i + 1,
        eventId: String(data[i][0]).trim().toLowerCase(),
        title: String(data[i][1] || ''),
        type: String(data[i][2] || 'wedding'),
        status: String(data[i][3] || 'active').toLowerCase(),
        adminPin: String(data[i][4] || ''),
        createdAt: data[i][5] || ''
      };
    }
  }
  return null;
}

function requireEventAuth_(eventId, pin, superKey) {
  if (isSuperAdmin_(superKey)) return true;
  const ev = getEventRecord_(eventId);
  if (!ev) {
    throw new Error('Acara "' + eventId + '" tidak ditemukan.');
  }
  if (!ev.adminPin) return true;
  if (String(pin || '').trim() !== ev.adminPin) {
    throw new Error('PIN akses tidak valid untuk acara ini.');
  }
  return true;
}

function verifyEventPin(eventId, pin, superKey) {
  const ev = getEventRecord_(eventId);
  if (!ev) {
    throw new Error('Acara "' + eventId + '" tidak ditemukan.');
  }
  if (isSuperAdmin_(superKey) || !ev.adminPin || String(pin || '').trim() === ev.adminPin) {
    return { valid: true, eventId: ev.eventId, title: ev.title, status: ev.status };
  }
  throw new Error('PIN salah. Silakan periksa kembali PIN undangan Anda.');
}

function getDefaultSettingsData() {
  return [
    ['type', 'wedding', 'true'],
    ['theme_preset', 'lilac-pink', 'true'],
    ['primary_color', '#8785a2', 'true'],
    ['secondary_color', '#ffc7c7', 'true'],
    ['bg_color', '#ffe2e2', 'true'],
    ['surface_color', '#f6f6f6', 'true'],
    ['theme_font_heading', 'Dancing Script', 'true'],
    ['theme_font_body', 'Open Sans', 'true'],
    ['theme_ornament', 'wave-soft', 'true'],
    ['timezone_label', 'WITA', 'true'],
    ['music_url', 'audio/audio.mp3', 'true'],
    ['hero_image', 'img/img7.png', 'true'],
    ['cover_image', 'img/img3.jpg', 'true'],
    ['closing_image', 'img/img10.jpg', 'true'],
    ['groom_name', 'Muhammad Nazril Mokodompit', 'true'],
    ['groom_nickname', 'Aril', 'true'],
    ['groom_child_number', 'Pertama', 'true'],
    ['groom_address', '', 'true'],
    ['groom_photo', 'img/img9.jpg', 'true'],
    ['groom_father', 'Hamsa Mokodompit', 'true'],
    ['groom_mother', 'Serli Mokodompit', 'true'],
    ['bride_name', 'Cici Puspitasari Dakotalot', 'true'],
    ['bride_nickname', 'Cici', 'true'],
    ['bride_child_number', 'Pertama', 'true'],
    ['bride_address', '', 'true'],
    ['bride_photo', 'img/img8.jpg', 'true'],
    ['bride_father', 'Nopol Dakotalot', 'true'],
    ['bride_mother', 'Rina Buntuan, S.Pd.', 'true'],
    ['khitan_name', 'Nama Anak', 'false'],
    ['khitan_photo', 'img/img9.jpg', 'false'],
    ['khitan_parents', 'Bapak & Ibu', 'false'],
    ['event_1_name', 'Akad Nikah', 'true'],
    ['event_1_date', '2026-05-20T08:00', 'true'],
    ['event_1_date_end', '', 'true'],
    ['event_1_custom_date', '', 'true'],
    ['event_1_custom_time', '', 'true'],
    ['event_1_loc', 'Rumah Mempelai Wanita', 'true'],
    ['event_2_name', 'Resepsi', 'true'],
    ['event_2_date', '2026-05-20T11:00', 'true'],
    ['event_2_date_end', '', 'true'],
    ['event_2_custom_date', '', 'true'],
    ['event_2_custom_time', '', 'true'],
    ['event_2_loc', 'Rumah Mempelai Wanita', 'true'],
    ['event_2_entertainment', 'Electone', 'true'],
    ['location_address', 'Rumah Mempelai Wanita Desa Bai, Kec. Nuangan Boltim', 'true'],
    ['location_url', 'https://maps.app.goo.gl/vrXDtTCL3W9aifYE9', 'true'],
    ['location_embed', 'https://www.google.com/maps/embed?pb=!1m17!1m12!1m3!1d3989.5730308355605!2d124.49512899999999!3d0.6353349999999999!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m2!1m1!2zMMKwMzgnMDcuMiJOIDEyNMKwMjknNDIuNSJF!5e0!3m2!1sid!2sid!4v1738550915310!5m2!1sid!2sid', 'true'],
    ['turut_mengundang', 'Kel. Besar Mempelai Pria | Kel. Besar Mempelai Wanita', 'true'],
    ['wa_message', 'Halo [nama], tanpa mengurangi rasa hormat, kami mengundang Bapak/Ibu/Saudara/i untuk menghadiri acara kami.', 'true'],
    ['gift_bank', 'BSG', 'true'],
    ['gift_acc', '02702090005226', 'true'],
    ['gift_name', 'Rina Buntuan', 'true'],
    ['gallery_1', 'img/img2.jpg', 'true'],
    ['gallery_2', 'img/img12.jpg', 'true'],
    ['gallery_3', 'img/img13.jpg', 'true'],
    ['gallery_4', 'img/img4.jpg', 'true'],
    ['sec_events_v', '', 'true'],
    ['sec_event_2_v', '', 'true'],
    ['sec_gallery_v', '', 'true'],
    ['sec_gift_v', '', 'true'],
    ['sec_wishes_v', '', 'true'],
    ['sec_turut_v', '', 'true']
  ];
}

function getSettings(eventId) {
  const id = normalizeEventId_(eventId);
  const cache = CacheService.getScriptCache();
  const cacheKey = 'settings_v2_' + id;
  const cached = cache.get(cacheKey);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (e) {
      // Abaikan cache korup dan baca ulang dari sheet
    }
  }

  ensureSheetsExist_();
  const ev = getEventRecord_(id);
  if (!ev) {
    throw new Error('Undangan "' + id + '" tidak ditemukan.');
  }
  if (ev.status === 'expired' || ev.status === 'inactive') {
    throw new Error('Undangan "' + id + '" sedang tidak aktif.');
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Settings');
  const data = sheet.getDataRange().getValues();
  const tz = ss.getSpreadsheetTimeZone() || Session.getScriptTimeZone() || 'Asia/Jakarta';
  const settings = {};

  for (let i = 1; i < data.length; i++) {
    const rowEventId = String(data[i][0] || '').trim().toLowerCase();
    const key = String(data[i][1] || '').trim();
    if (rowEventId === id && key) {
      let val = data[i][2];
      if (Object.prototype.toString.call(val) === '[object Date]' && !isNaN(val.getTime())) {
        val = Utilities.formatDate(val, tz, "yyyy-MM-dd'T'HH:mm");
      } else {
        val = val !== null && val !== undefined ? val.toString() : '';
      }
      settings[key] = {
        value: val,
        visible: String(data[i][3]).toLowerCase() === 'true'
      };
    }
  }

  // Fallback key default jika event baru belum memiliki seluruh key
  const defaults = getDefaultSettingsData();
  for (let i = 0; i < defaults.length; i++) {
    const defKey = defaults[i][0];
    if (!settings[defKey]) {
      settings[defKey] = {
        value: defaults[i][1],
        visible: defaults[i][2] === 'true'
      };
    }
  }

  settings._meta = {
    value: { eventId: ev.eventId, title: ev.title, status: ev.status },
    visible: true
  };

  try {
    cache.put(cacheKey, JSON.stringify(settings), CACHE_TTL_SECONDS);
  } catch (e) {
    // Abaikan jika ukuran melebihi batas CacheService
  }
  return settings;
}

function saveSettings(eventId, settingsObj) {
  const id = normalizeEventId_(eventId);
  ensureSheetsExist_();

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Settings');
  const data = sheet.getDataRange().getValues();

  // Map baris yang sudah ada untuk eventId ini
  const existingRowMap = {};
  for (let i = 1; i < data.length; i++) {
    const rowEventId = String(data[i][0] || '').trim().toLowerCase();
    const rowKey = String(data[i][1] || '').trim();
    if (rowEventId === id && rowKey) {
      existingRowMap[rowKey] = i;
    }
  }

  const newRows = [];
  let updatedExisting = false;

  for (const key in settingsObj) {
    if (!Object.prototype.hasOwnProperty.call(settingsObj, key)) continue;
    if (key === '_meta' || key === 'eventId' || key === 'pin' || key === 'superKey') continue;

    const item = settingsObj[key];
    if (!item || typeof item !== 'object') continue;

    const valStr = item.value !== null && item.value !== undefined ? item.value.toString() : '';
    const visBool = Boolean(item.visible);

    if (Object.prototype.hasOwnProperty.call(existingRowMap, key)) {
      const idx = existingRowMap[key];
      data[idx][2] = valStr;
      data[idx][3] = visBool;
      updatedExisting = true;
    } else {
      newRows.push([id, key, valStr, visBool]);
    }
  }

  // Batch update baris yang sudah ada sekaligus
  if (updatedExisting && data.length > 1) {
    const valueRange = sheet.getRange(2, 3, data.length - 1, 1);
    valueRange.setNumberFormat('@');
    sheet.getRange(2, 1, data.length - 1, 4).setValues(data.slice(1));
  }

  // Append baris baru sekaligus
  if (newRows.length > 0) {
    const startRow = sheet.getLastRow() + 1;
    sheet.getRange(startRow, 3, newRows.length, 1).setNumberFormat('@');
    sheet.getRange(startRow, 1, newRows.length, 4).setValues(newRows);
  }

  CacheService.getScriptCache().remove('settings_v2_' + id);
  return 'Tersimpan';
}

function getWishes(eventId) {
  const id = normalizeEventId_(eventId);
  const cache = CacheService.getScriptCache();
  const cacheKey = 'wishes_v2_' + id;
  const cached = cache.get(cacheKey);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (e) {
      // Lanjut baca dari sheet
    }
  }

  ensureSheetsExist_();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Wishes');
  const data = sheet.getDataRange().getValues();
  const wishes = [];

  for (let i = data.length - 1; i > 0; i--) {
    const rowEventId = String(data[i][0] || '').trim().toLowerCase();
    if (rowEventId === id && (data[i][2] || data[i][3])) {
      wishes.push({
        id: data[i][1] ? data[i][1].toString() : String(i),
        name: data[i][2] ? data[i][2].toString() : 'Anonim',
        message: data[i][3] ? data[i][3].toString() : '',
        attendance: data[i][4] ? data[i][4].toString() : '',
        guestCount: Number(data[i][5]) || 1,
        time: data[i][6] || ''
      });
      if (wishes.length >= 60) break;
    }
  }

  try {
    cache.put(cacheKey, JSON.stringify(wishes), 120);
  } catch (e) {
    // Abaikan jika melebihi batas ukuran cache
  }
  return wishes;
}

function sendWish(eventId, name, message, attendance, guestCount) {
  const id = normalizeEventId_(eventId);
  ensureSheetsExist_();
  const ev = getEventRecord_(id);
  if (!ev) {
    throw new Error('Acara tidak ditemukan.');
  }

  const cleanName = String(name || 'Anonim').trim().slice(0, 80);
  const cleanMsg = String(message || '').trim().slice(0, 500);
  const cleanAttend = String(attendance || 'Hadir').trim().slice(0, 40);
  const cleanCount = Math.min(Math.max(Number(guestCount) || 1, 1), 20);

  if (!cleanMsg) {
    throw new Error('Pesan ucapan tidak boleh kosong.');
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Wishes');
  sheet.appendRow([id, Utilities.getUuid(), cleanName, cleanMsg, cleanAttend, cleanCount, new Date()]);

  CacheService.getScriptCache().remove('wishes_v2_' + id);
  return 'Terkirim';
}

function getGuests(eventId) {
  const id = normalizeEventId_(eventId);
  ensureSheetsExist_();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Guests');
  const data = sheet.getDataRange().getValues();
  const guests = [];

  for (let i = 1; i < data.length; i++) {
    const rowEventId = String(data[i][0] || '').trim().toLowerCase();
    if (rowEventId === id && data[i][2]) {
      guests.push({
        id: data[i][1] ? data[i][1].toString() : String(i + 1),
        name: data[i][2].toString(),
        phone: data[i][3] ? data[i][3].toString() : ''
      });
    }
  }
  return guests;
}

function addGuest(eventId, name, phone) {
  const id = normalizeEventId_(eventId);
  ensureSheetsExist_();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Guests');
  const nextRow = sheet.getLastRow() + 1;
  const guestUuid = Utilities.getUuid();

  sheet.getRange(nextRow, 4).setNumberFormat('@');
  sheet.getRange(nextRow, 1, 1, 5).setValues([[
    id,
    guestUuid,
    String(name || '').trim(),
    phone ? phone.toString().trim() : '',
    new Date()
  ]]);
  return { status: 'Berhasil', id: guestUuid };
}

function deleteGuest(eventId, guestId) {
  const id = normalizeEventId_(eventId);
  ensureSheetsExist_();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Guests');
  const data = sheet.getDataRange().getValues();
  const targetId = String(guestId || '').trim();

  if (!targetId) {
    throw new Error('ID tamu tidak valid.');
  }

  for (let i = data.length - 1; i >= 1; i--) {
    const rowEventId = String(data[i][0] || '').trim().toLowerCase();
    const rowGuestId = String(data[i][1] || '').trim();
    if (rowEventId === id && rowGuestId === targetId) {
      sheet.deleteRow(i + 1);
      return 'Dihapus';
    }
  }
  throw new Error('Tamu tidak ditemukan atau sudah dihapus.');
}

function listEvents() {
  ensureSheetsExist_();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Events');
  const data = sheet.getDataRange().getValues();
  const events = [];

  for (let i = 1; i < data.length; i++) {
    if (data[i][0]) {
      events.push({
        eventId: String(data[i][0]).trim().toLowerCase(),
        title: String(data[i][1] || ''),
        type: String(data[i][2] || 'wedding'),
        status: String(data[i][3] || 'active'),
        adminPin: String(data[i][4] || ''),
        createdAt: data[i][5] || ''
      });
    }
  }
  return events;
}

function createEvent(payload) {
  ensureSheetsExist_();
  const eventId = normalizeEventId_(payload.eventId || payload.slug);
  if (!eventId || eventId.length < 3) {
    throw new Error('Slug acara minimal 3 karakter (huruf, angka, tanda hubung).');
  }

  if (getEventRecord_(eventId)) {
    throw new Error('Slug "' + eventId + '" sudah digunakan acara lain.');
  }

  const title = String(payload.title || eventId).trim();
  const type = String(payload.type || 'wedding').trim().toLowerCase();
  const status = String(payload.status || 'active').trim().toLowerCase();
  const adminPin = String(payload.adminPin || Math.floor(100000 + Math.random() * 900000)).trim();

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const eventsSheet = ss.getSheetByName('Events');
  const nextEvRow = eventsSheet.getLastRow() + 1;
  eventsSheet.getRange(nextEvRow, 5).setNumberFormat('@');
  eventsSheet.getRange(nextEvRow, 1, 1, 6).setValues([[
    eventId, title, type, status, adminPin, new Date()
  ]]);

  // Seed default settings untuk acara baru
  const defaults = getDefaultSettingsData();
  const settingsRows = defaults.map(row => {
    const key = row[0];
    let val = row[1];
    let vis = row[2] === 'true';
    if (key === 'type') val = type;
    if (key === 'music_url') val = type === 'khitan' ? 'assets/music.mp3' : 'audio/audio.mp3';
    if (payload.themePreset && key === 'theme_preset') val = payload.themePreset;
    if (payload.primaryColor && key === 'primary_color') val = payload.primaryColor;
    if (payload.secondaryColor && key === 'secondary_color') val = payload.secondaryColor;
    if (payload.bgColor && key === 'bg_color') val = payload.bgColor;
    if (payload.surfaceColor && key === 'surface_color') val = payload.surfaceColor;
    if (payload.fontHeading && key === 'theme_font_heading') val = payload.fontHeading;
    if (payload.fontBody && key === 'theme_font_body') val = payload.fontBody;
    if (payload.ornament && key === 'theme_ornament') val = payload.ornament;
    return [eventId, key, val, vis];
  });

  const settingsSheet = ss.getSheetByName('Settings');
  const startRow = settingsSheet.getLastRow() + 1;
  settingsSheet.getRange(startRow, 3, settingsRows.length, 1).setNumberFormat('@');
  settingsSheet.getRange(startRow, 1, settingsRows.length, 4).setValues(settingsRows);

  return { eventId: eventId, title: title, type: type, status: status, adminPin: adminPin };
}

function updateEvent(payload) {
  ensureSheetsExist_();
  const eventId = normalizeEventId_(payload.eventId);
  const ev = getEventRecord_(eventId);
  if (!ev) {
    throw new Error('Acara "' + eventId + '" tidak ditemukan.');
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Events');
  if (payload.title !== undefined) sheet.getRange(ev.rowIndex, 2).setValue(String(payload.title).trim());
  if (payload.status !== undefined) sheet.getRange(ev.rowIndex, 4).setValue(String(payload.status).trim().toLowerCase());
  if (payload.adminPin !== undefined) {
    const pinCell = sheet.getRange(ev.rowIndex, 5);
    pinCell.setNumberFormat('@');
    pinCell.setValue(String(payload.adminPin).trim());
  }

  CacheService.getScriptCache().remove('settings_v2_' + eventId);
  return { eventId: eventId, updated: true };
}

/**
 * Pastikan seluruh sheet tersedia tanpa melakukan scan berat di setiap request
 */
function ensureSheetsExist_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss.getSheetByName('Events') || !ss.getSheetByName('Settings') ||
      !ss.getSheetByName('Wishes') || !ss.getSheetByName('Guests')) {
    initSheets();
  }
}

/**
 * Inisialisasi & Auto-Migrasi Skema Single-Tenant -> Multi-Tenant
 */
function initSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const defaultData = getDefaultSettingsData();

  // 1. Sheet Events
  let eventsSheet = ss.getSheetByName('Events');
  if (!eventsSheet) {
    eventsSheet = ss.insertSheet('Events');
    eventsSheet.appendRow(['EventID', 'Title', 'Type', 'Status', 'AdminPin', 'CreatedAt']);
    eventsSheet.getRange(1, 1, 1, 6).setFontWeight('bold');
    eventsSheet.setFrozenRows(1);
    eventsSheet.getRange(2, 5).setNumberFormat('@');
    eventsSheet.getRange(2, 1, 1, 6).setValues([[
      DEFAULT_EVENT_ID, 'Undangan Default', 'wedding', 'active', '123456', new Date()
    ]]);
  }

  // 2. Sheet Settings (Auto-migrate 3 kolom -> 4 kolom dengan EventID)
  let settingsSheet = ss.getSheetByName('Settings');
  if (!settingsSheet) {
    settingsSheet = ss.insertSheet('Settings');
    settingsSheet.appendRow(['EventID', 'Key', 'Value', 'Visible']);
    settingsSheet.getRange(1, 1, 1, 4).setFontWeight('bold');
    settingsSheet.setFrozenRows(1);
    const rows = defaultData.map(r => [DEFAULT_EVENT_ID, r[0], r[1], r[2]]);
    settingsSheet.getRange(2, 3, rows.length, 1).setNumberFormat('@');
    settingsSheet.getRange(2, 1, rows.length, 4).setValues(rows);
  } else if (settingsSheet.getLastRow() > 0) {
    const header = settingsSheet.getRange(1, 1, 1, settingsSheet.getLastColumn()).getValues()[0];
    if (String(header[0]).trim() === 'Key') {
      // Migrasi dari skema lama [Key, Value, Visible]
      const oldData = settingsSheet.getDataRange().getValues();
      const migrated = [['EventID', 'Key', 'Value', 'Visible']];
      for (let i = 1; i < oldData.length; i++) {
        if (oldData[i][0]) {
          migrated.push([DEFAULT_EVENT_ID, oldData[i][0], oldData[i][1], oldData[i][2]]);
        }
      }
      settingsSheet.clearContents();
      if (migrated.length > 1) {
        settingsSheet.getRange(2, 3, migrated.length - 1, 1).setNumberFormat('@');
      }
      settingsSheet.getRange(1, 1, migrated.length, 4).setValues(migrated);
      settingsSheet.getRange(1, 1, 1, 4).setFontWeight('bold');
      settingsSheet.setFrozenRows(1);
    }
  }

  // 3. Sheet Wishes (Auto-migrate 3 kolom -> 7 kolom)
  let wishesSheet = ss.getSheetByName('Wishes');
  if (!wishesSheet) {
    wishesSheet = ss.insertSheet('Wishes');
    wishesSheet.appendRow(['EventID', 'ID', 'Name', 'Message', 'Attendance', 'GuestCount', 'Timestamp']);
    wishesSheet.getRange(1, 1, 1, 7).setFontWeight('bold');
    wishesSheet.setFrozenRows(1);
  } else if (wishesSheet.getLastRow() > 0) {
    const header = wishesSheet.getRange(1, 1, 1, wishesSheet.getLastColumn()).getValues()[0];
    if (String(header[0]).trim() === 'Name') {
      const oldData = wishesSheet.getDataRange().getValues();
      const migrated = [['EventID', 'ID', 'Name', 'Message', 'Attendance', 'GuestCount', 'Timestamp']];
      for (let i = 1; i < oldData.length; i++) {
        if (oldData[i][0] || oldData[i][1]) {
          migrated.push([DEFAULT_EVENT_ID, Utilities.getUuid(), oldData[i][0], oldData[i][1], '', 1, oldData[i][2]]);
        }
      }
      wishesSheet.clearContents();
      wishesSheet.getRange(1, 1, migrated.length, 7).setValues(migrated);
      wishesSheet.getRange(1, 1, 1, 7).setFontWeight('bold');
      wishesSheet.setFrozenRows(1);
    }
  }

  // 4. Sheet Guests (Auto-migrate 3 kolom -> 5 kolom)
  let guestsSheet = ss.getSheetByName('Guests');
  if (!guestsSheet) {
    guestsSheet = ss.insertSheet('Guests');
    guestsSheet.appendRow(['EventID', 'ID', 'Name', 'Phone', 'CreatedAt']);
    guestsSheet.getRange(1, 1, 1, 5).setFontWeight('bold');
    guestsSheet.setFrozenRows(1);
  } else if (guestsSheet.getLastRow() > 0) {
    const header = guestsSheet.getRange(1, 1, 1, guestsSheet.getLastColumn()).getValues()[0];
    if (String(header[0]).trim() === 'ID') {
      const oldData = guestsSheet.getDataRange().getValues();
      const migrated = [['EventID', 'ID', 'Name', 'Phone', 'CreatedAt']];
      for (let i = 1; i < oldData.length; i++) {
        if (oldData[i][1]) {
          migrated.push([DEFAULT_EVENT_ID, oldData[i][0] || Utilities.getUuid(), oldData[i][1], oldData[i][2], '']);
        }
      }
      guestsSheet.clearContents();
      if (migrated.length > 1) {
        guestsSheet.getRange(2, 4, migrated.length - 1, 1).setNumberFormat('@');
      }
      guestsSheet.getRange(1, 1, migrated.length, 5).setValues(migrated);
      guestsSheet.getRange(1, 1, 1, 5).setFontWeight('bold');
      guestsSheet.setFrozenRows(1);
    }
  }

  return {
    status: 'initialized',
    sheets: ['Events', 'Settings', 'Wishes', 'Guests']
  };
}
