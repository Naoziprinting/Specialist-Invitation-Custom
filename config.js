/**
 * Konfigurasi terpusat & helper keamanan/URL untuk seluruh halaman
 */
window.NAOZI_CONFIG = {
  GAS_API_URL: "https://script.google.com/macros/s/AKfycbx6yWI_7EHwCItqr4GbSAJR5BknsXSFZz2-55f6woutfo3IHKljyoVUvn_4QoXz1IID5g/exec",
  DEFAULT_EVENT_ID: "default",
};

function getEventIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const raw = params.get("event") || params.get("id") || window.NAOZI_CONFIG.DEFAULT_EVENT_ID;
  const cleaned = String(raw).trim().toLowerCase().replace(/[^a-z0-9-_]/g, "");
  return cleaned || window.NAOZI_CONFIG.DEFAULT_EVENT_ID;
}

function toRawUrl(url) {
  if (!url) return "";
  const clean = String(url).trim();
  if (clean.includes("github.com") && clean.includes("/blob/")) {
    return clean.replace("github.com", "raw.githubusercontent.com").replace("/blob/", "/");
  }
  return clean;
}

function sanitizeUrl(url, fallback) {
  const fb = fallback || "";
  if (!url) return fb;
  const clean = toRawUrl(url);
  if (/^(https?:\/\/|img\/|audio\/|assets\/|\.\/)/i.test(clean)) {
    return clean;
  }
  return fb;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str === null || str === undefined ? "" : String(str);
  return div.innerHTML;
}
