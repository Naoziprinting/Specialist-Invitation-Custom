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

function buildDefaultWaTemplate(type, religion) {
  const isKhitan = String(type || "wedding").trim().toLowerCase().startsWith("khitan");
  const rel = String(religion || "islam").trim().toLowerCase();

  const greetings = {
    islam: { open: "Assalamualaikum Wr. Wb.", close: "Wassalamualaikum Wr. Wb." },
    kristen: { open: "Shalom, Salam Sejahtera.", close: "Tuhan Yesus Memberkati." },
    katolik: { open: "Salam Damai Sejahtera dalam Kristus.", close: "Berkah Dalem, Tuhan Memberkati." },
    hindu: { open: "Om Swastyastu.", close: "Om Shanti, Shanti, Shanti Om." },
    buddha: { open: "Namo Buddhaya.", close: "Sabbe Satta Bhavantu Sukhitatta." },
    khonghucu: { open: "Wei De Dong Tian (Salam Kebajikan).", close: "Shan Zai, Tian You." },
    umum: { open: "Salam Sejahtera.", close: "Terima kasih atas perhatian dan kehadirannya." },
  };
  const g = greetings[rel] || greetings.islam;

  if (isKhitan) {
    return `${g.open}\n\nKepada Yth. [nama],\nTanpa mengurangi rasa hormat, kami mengundang Bapak/Ibu/Saudara/i untuk menghadiri acara Tasyakuran Khitanan putra kami.\n\nMerupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu untuk ananda.\n\n${g.close}`;
  }

  const eventLabel = {
    islam: "pernikahan kami",
    kristen: "pemberkatan dan resepsi pernikahan kami",
    katolik: "sakramen perkawinan dan resepsi kami",
    hindu: "upacara pawiwahan dan resepsi pernikahan kami",
    buddha: "pemberkatan dan resepsi pernikahan kami",
    khonghucu: "upacara dan resepsi pernikahan kami",
    umum: "acara pernikahan kami",
  }[rel] || "acara pernikahan kami";

  return `${g.open}\n\nKepada Yth. [nama],\nTanpa mengurangi rasa hormat, kami mengundang Bapak/Ibu/Saudara/i untuk menghadiri ${eventLabel}.\n\nMerupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir serta memberikan doa restu.\n\n${g.close}`;
}
