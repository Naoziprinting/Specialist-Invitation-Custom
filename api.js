/**
 * Unified API Client untuk Google Apps Script Multi-Tenant Backend
 */
async function apiGet(action, params) {
  const url = new URL(window.NAOZI_CONFIG.GAS_API_URL);
  url.searchParams.set("action", action);
  if (params && typeof params === "object") {
    Object.keys(params).forEach((k) => {
      if (params[k] !== undefined && params[k] !== null && params[k] !== "") {
        url.searchParams.set(k, params[k]);
      }
    });
  }

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: Gagal menghubungi server.`);
  }
  const data = await res.json();
  if (data && data.status === "error") {
    throw new Error(data.error || data.message || "Terjadi kesalahan pada server.");
  }
  return data;
}

async function apiPost(action, payload, params) {
  const url = new URL(window.NAOZI_CONFIG.GAS_API_URL);
  url.searchParams.set("action", action);
  if (params && typeof params === "object") {
    Object.keys(params).forEach((k) => {
      if (params[k] !== undefined && params[k] !== null && params[k] !== "") {
        url.searchParams.set(k, params[k]);
      }
    });
  }

  const res = await fetch(url.toString(), {
    method: "POST",
    body: JSON.stringify(payload || {}),
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: Gagal menyimpan ke server.`);
  }
  const data = await res.json();
  if (data && data.status === "error") {
    throw new Error(data.error || data.message || "Terjadi kesalahan pada server.");
  }
  return data;
}
