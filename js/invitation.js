/**
 * Logika Halaman Undangan Digital Multi-Tenant (index.html)
 */
(function () {
  const EVENT_ID = getEventIdFromUrl();
  const CACHE_KEY = `naozi_inv_settings_${EVENT_ID}`;
  let settings = {};
  let isInvitationOpened = false;

  // Ambil nama tamu dari URL (?to= atau ?nama=)
  const urlParams = new URLSearchParams(window.location.search);
  const guestName = urlParams.get("to") || urlParams.get("nama") || "Tamu Undangan";
  const namaTamuEl = document.getElementById("namaTamu");
  if (namaTamuEl) namaTamuEl.innerText = guestName;

  const wishNameInput = document.getElementById("wish-name-input");
  if (wishNameInput) {
    wishNameInput.value = guestName !== "Tamu Undangan" ? guestName : "";
  }

  function showAlert(icon, title, text) {
    if (typeof Swal !== "undefined") {
      Swal.fire({ icon: icon, title: title, text: text });
    } else {
      alert(title + (text ? "\n" + text : ""));
    }
  }

  function updateCountdown(dateStr) {
    const target = dateStr ? new Date(dateStr) : new Date(2026, 4, 20, 11, 0);
    const validDate = isNaN(target.getTime()) ? new Date(2026, 4, 20, 11, 0) : target;
    const wrap = document.querySelector(".simply-countdown");
    if (!wrap || typeof simplyCountdown !== "function") return;
    wrap.replaceChildren();
    simplyCountdown(".simply-countdown", {
      year: validDate.getFullYear(),
      month: validDate.getMonth() + 1,
      day: validDate.getDate(),
      hours: validDate.getHours(),
      minutes: validDate.getMinutes(),
      words: {
        days: { singular: "hari", plural: "hari" },
        hours: { singular: "jam", plural: "jam" },
        minutes: { singular: "menit", plural: "menit" },
        seconds: { singular: "detik", plural: "detik" },
      },
    });
  }

  window.openInvitation = function () {
    const btn = document.getElementById("btn-open-invitation");
    if (btn) btn.blur();
    isInvitationOpened = true;
    if (typeof playAudio === "function") playAudio();

    const modalEl = document.getElementById("exampleModal");
    const coverEl = document.getElementById("cover");
    if (coverEl) coverEl.classList.add("hero-entered");

    if (modalEl && typeof bootstrap !== "undefined") {
      modalEl.classList.add("stage-doors-opening");
      setTimeout(() => {
        const instance = bootstrap.Modal.getOrCreateInstance(modalEl);
        instance.hide();
        modalEl.classList.remove("stage-doors-opening");
        if (typeof AOS !== "undefined") AOS.refresh();
      }, 780);
    } else if (typeof AOS !== "undefined") {
      setTimeout(() => AOS.refresh(), 300);
    }
  };

  function getBankLogo(bankName) {
    if (!bankName) return "img/Bank_BSG.png";
    const upper = bankName.toUpperCase();
    if (upper.includes("BCA")) return "img/Bank_Central_Asia.svg";
    if (upper.includes("BRI")) return "img/BANK_BRI_logo.svg";
    if (upper.includes("BNI")) return "img/bni.png";
    if (upper.includes("MANDIRI")) return "img/mandiri.svg";
    if (upper.includes("BSG") || upper.includes("SULUT")) return "img/Bank_BSG.png";
    return "";
  }

  function formatEventDate(startVal, endVal, customText) {
    if (customText && customText.trim()) return customText.trim();
    if (!startVal) return "";

    const d1 = new Date(startVal);
    if (isNaN(d1.getTime())) return String(startVal).trim();

    const d2 = endVal ? new Date(endVal) : null;
    const isEndValid = d2 && !isNaN(d2.getTime());

    if (!isEndValid || d1.toDateString() === d2.toDateString()) {
      return d1.toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    }

    const dayName1 = d1.toLocaleDateString("id-ID", { weekday: "long" });
    const dayName2 = d2.toLocaleDateString("id-ID", { weekday: "long" });
    const dayNum1 = d1.getDate();
    const dayNum2 = d2.getDate();
    const month1 = d1.toLocaleDateString("id-ID", { month: "long" });
    const month2 = d2.toLocaleDateString("id-ID", { month: "long" });
    const year1 = d1.getFullYear();
    const year2 = d2.getFullYear();

    if (month1 === month2 && year1 === year2) {
      return `${dayName1} - ${dayName2}, ${dayNum1} - ${dayNum2} ${month1} ${year1}`;
    }
    if (year1 === year2) {
      return `${dayName1}, ${dayNum1} ${month1} - ${dayName2}, ${dayNum2} ${month2} ${year1}`;
    }
    return `${dayName1}, ${dayNum1} ${month1} ${year1} - ${dayName2}, ${dayNum2} ${month2} ${year2}`;
  }

  function formatEventTime(startVal, endVal, customText, defaultSuffix) {
    if (customText && customText.trim()) return customText.trim();
    if (!startVal) return "";

    const d1 = new Date(startVal);
    if (isNaN(d1.getTime())) return String(startVal).trim();

    const pad = (n) => String(n).padStart(2, "0");
    const time1 = `${pad(d1.getHours())}:${pad(d1.getMinutes())}`;
    const suffix = defaultSuffix || "";

    const d2 = endVal ? new Date(endVal) : null;
    if (d2 && !isNaN(d2.getTime())) {
      const time2 = `${pad(d2.getHours())}:${pad(d2.getMinutes())}`;
      if (time1 !== time2) {
        return `Pukul ${time1} - ${time2} ${suffix}`.trim();
      }
    }
    return `Pukul ${time1} ${suffix}`.trim();
  }

  function finishLoadingAndShow() {
    const loader = document.getElementById("app-loading");
    if (loader) {
      loader.classList.add("fade-out");
      setTimeout(() => loader.remove(), 550);
    }

    const modalEl = document.getElementById("exampleModal");
    if (modalEl && typeof bootstrap !== "undefined") {
      const coverModal = bootstrap.Modal.getOrCreateInstance(modalEl);
      coverModal.show();
    }
  }

  function renderPage() {
    // 1. Terapkan Tema (Warna, Font, Ornamen)
    if (typeof applyThemeFromSettings === "function") {
      applyThemeFromSettings(settings);
    }

    const rawType = (settings.type && settings.type.value ? String(settings.type.value) : "wedding").trim().toLowerCase();
    const isWedding = rawType !== "khitan" && rawType !== "khitanan";
    const tzLabel = (settings.timezone_label && settings.timezone_label.value) || "WITA";

    const groomFull = (settings.groom_name && settings.groom_name.value) || "Muhammad Nazril Mokodompit";
    const brideFull = (settings.bride_name && settings.bride_name.value) || "Cici Puspitasari Dakotalot";
    const groomNick = (settings.groom_nickname && settings.groom_nickname.value) || groomFull.split(" ")[0];
    const brideNick = (settings.bride_nickname && settings.bride_nickname.value) || brideFull.split(" ")[0];
    const khitanName = (settings.khitan_name && settings.khitan_name.value) || "Nama Anak";

    const shortNames = isWedding ? `${groomNick} & ${brideNick}` : khitanName;

    document.getElementById("page-title").innerText = `${shortNames} | Undangan Digital`;
    const openNamesEl = document.getElementById("open-names");
    if (isWedding) {
      openNamesEl.replaceChildren(
        document.createTextNode(groomNick + " "),
        document.createElement("br"),
        document.createTextNode("&"),
        document.createElement("br"),
        document.createTextNode(" " + brideNick)
      );
    } else {
      openNamesEl.textContent = khitanName;
    }
    document.getElementById("hero-names").innerText = shortNames;
    document.getElementById("footer-names").textContent = shortNames;

    // Gambar Sampul, Hero & Penutup (tersanitasi)
    const heroImgUrl = sanitizeUrl(settings.hero_image && settings.hero_image.value, "img/img7.png");
    const coverImgUrl = sanitizeUrl(
      (settings.cover_image && settings.cover_image.value) || (settings.hero_image && settings.hero_image.value),
      "img/img3.jpg"
    );
    const closingImgUrl = sanitizeUrl(
      (settings.closing_image && settings.closing_image.value) || (settings.hero_image && settings.hero_image.value),
      "img/img10.jpg"
    );

    document.getElementById("hero-bg").style.backgroundImage = `url('${heroImgUrl}')`;
    document.getElementById("front-image-img").src = coverImgUrl;
    document.getElementById("closing-img").src = closingImgUrl;

    // Mode Wedding vs Khitanan
    if (!isWedding) {
      document.getElementById("open-title").innerText = "Tasyakuran Khitanan";
      document.getElementById("hero-title").innerText = "Tasyakuran Khitanan";
      document.getElementById("intro-text").innerText = "Kami mengundang Bapak/Ibu/Saudara/i serta kerabat sekalian untuk menghadiri acara tasyakuran khitanan putra kami:";
      document.getElementById("ayat-text").innerText = '"Ya Tuhanku, jadikanlah aku dan anak cucuku orang-orang yang tetap mendirikan shalat, ya Tuhan kami, perkenankanlah doaku."';
      document.getElementById("ayat-source").innerText = "- QS. Ibrahim 40 -";

      document.getElementById("wedding-ui").classList.add("hidden");
      document.getElementById("khitan-ui").classList.remove("hidden");
      document.getElementById("khitan-name").innerText = khitanName;
      document.getElementById("khitan-parents").innerText = (settings.khitan_parents && settings.khitan_parents.value) || "";
      document.getElementById("khitan-img").src = sanitizeUrl(settings.khitan_photo && settings.khitan_photo.value, "img/img9.jpg");
    } else {
      document.getElementById("open-title").innerText = "The Wedding of";
      document.getElementById("hero-title").innerText = "The Wedding of";
      document.getElementById("intro-text").innerText = "Kami mengundang Bapak/Ibu/Saudara/i serta kerabat sekalian untuk menghadiri acara pernikahan kami";
      document.getElementById("ayat-text").innerText = '"Dan diantara tanda-tanda (kebesaran)-Nya ialah Dia menciptakan pasangan-pasangan untukmu dari jenismu sendiri, agar kamu cenderung dan merasa tenteram kepadanya, dan Dia menjadikan di antaramu rasa kasih dan sayang. Sungguh, pada yang demikian itu benar-benar terdapat tanda-tanda (kebesaran Allah) bagi kaum yang berpikir"';
      document.getElementById("ayat-source").innerText = "- QS. Ar-Rum 21 -";

      document.getElementById("wedding-ui").classList.remove("hidden");
      document.getElementById("khitan-ui").classList.add("hidden");

      document.getElementById("groom-fullname").innerText = groomFull;
      document.getElementById("groom-nickname").innerText = groomNick;
      document.getElementById("groom-father").innerText = (settings.groom_father && settings.groom_father.value) || "";
      document.getElementById("groom-mother").innerText = (settings.groom_mother && settings.groom_mother.value) || "";
      document.getElementById("groom-img").src = sanitizeUrl(settings.groom_photo && settings.groom_photo.value, "img/img9.jpg");

      const groomOrder = (settings.groom_child_number && settings.groom_child_number.value) || "";
      document.getElementById("groom-order").innerText = groomOrder ? `Putra ${groomOrder}` : "Putra";

      const groomAddr = (settings.groom_address && settings.groom_address.value) || "";
      const groomAddrCont = document.getElementById("groom-address-container");
      if (groomAddr) {
        document.getElementById("groom-address").innerText = groomAddr;
        groomAddrCont.style.display = "block";
      } else {
        groomAddrCont.style.display = "none";
      }

      document.getElementById("bride-fullname").innerText = brideFull;
      document.getElementById("bride-nickname").innerText = brideNick;
      document.getElementById("bride-father").innerText = (settings.bride_father && settings.bride_father.value) || "";
      document.getElementById("bride-mother").innerText = (settings.bride_mother && settings.bride_mother.value) || "";
      document.getElementById("bride-img").src = sanitizeUrl(settings.bride_photo && settings.bride_photo.value, "img/img8.jpg");

      const brideOrder = (settings.bride_child_number && settings.bride_child_number.value) || "";
      document.getElementById("bride-order").innerText = brideOrder ? `Putri ${brideOrder}` : "Putri";

      const brideAddr = (settings.bride_address && settings.bride_address.value) || "";
      const brideAddrCont = document.getElementById("bride-address-container");
      if (brideAddr) {
        document.getElementById("bride-address").innerText = brideAddr;
        brideAddrCont.style.display = "block";
      } else {
        brideAddrCont.style.display = "none";
      }
    }

    // Acara 1
    const e1Start = settings.event_1_date ? settings.event_1_date.value : "";
    const e1End = settings.event_1_date_end ? settings.event_1_date_end.value : "";
    const e1CustomDate = settings.event_1_custom_date ? settings.event_1_custom_date.value : "";
    const e1CustomTime = settings.event_1_custom_time ? settings.event_1_custom_time.value : "";
    const date1Str = formatEventDate(e1Start, e1End, e1CustomDate) || "Sabtu, 20 Mei 2026";
    const time1Str = formatEventTime(e1Start, e1End, e1CustomTime, tzLabel) || `Pukul 08:00 ${tzLabel}`;

    document.getElementById("event-1-date").innerText = date1Str;
    document.getElementById("event-1-time").innerText = time1Str;
    if (settings.event_1_name && settings.event_1_name.value) {
      document.getElementById("event-1-name").innerText = settings.event_1_name.value;
    }
    if (settings.event_1_loc && settings.event_1_loc.value) {
      document.getElementById("event-1-loc").innerText = settings.event_1_loc.value;
    }

    // Acara 2
    const isEvent2Active = !settings.sec_event_2_v || settings.sec_event_2_v.visible !== false;
    const card1 = document.getElementById("card-1");
    const card2 = document.getElementById("card-2");
    if (card1 && card2) {
      if (!isEvent2Active) {
        card2.classList.add("hidden");
        card1.classList.remove("col-md-6");
        card1.classList.add("col-md-8", "col-lg-6", "mx-auto");
      } else {
        card2.classList.remove("hidden");
        card1.classList.add("col-md-6");
        card1.classList.remove("col-md-8", "col-lg-6", "mx-auto");
      }
    }

    const e2Start = settings.event_2_date ? settings.event_2_date.value : "";
    const e2End = settings.event_2_date_end ? settings.event_2_date_end.value : "";
    const e2CustomDate = settings.event_2_custom_date ? settings.event_2_custom_date.value : "";
    const e2CustomTime = settings.event_2_custom_time ? settings.event_2_custom_time.value : "";
    const date2Str = formatEventDate(e2Start, e2End, e2CustomDate) || "Sabtu, 20 Mei 2026";
    const time2Str = formatEventTime(e2Start, e2End, e2CustomTime, `${tzLabel} - Selesai`) || `Pukul 11:00 ${tzLabel} - Selesai`;

    document.getElementById("event-2-date").innerText = date2Str;
    document.getElementById("event-2-time").innerText = time2Str;
    if (settings.event_2_name && settings.event_2_name.value) {
      document.getElementById("event-2-name").innerText = settings.event_2_name.value;
    }
    if (settings.event_2_loc && settings.event_2_loc.value) {
      document.getElementById("event-2-loc").innerText = settings.event_2_loc.value;
    }
    if (settings.event_2_entertainment) {
      const entVal = settings.event_2_entertainment.value;
      const entWrap = document.getElementById("event-2-entertainment-wrap");
      if (entVal && isEvent2Active) {
        document.getElementById("event-2-entertainment").innerText = entVal;
        entWrap.style.display = "block";
      } else {
        entWrap.style.display = "none";
      }
    }

    // Tanggal Utama & Countdown
    const mainDateStr = isEvent2Active && e2Start ? date2Str : date1Str;
    const countdownTargetDate = isEvent2Active && e2Start ? e2Start : e1Start || "2026-05-20T11:00";
    document.getElementById("open-date").innerText = mainDateStr;
    document.getElementById("hero-date").innerText = mainDateStr;
    updateCountdown(countdownTargetDate);

    // Lokasi & Google Maps
    if (settings.location_address && settings.location_address.value) {
      document.getElementById("disp-address").innerText = settings.location_address.value;
    }
    if (settings.location_url && settings.location_url.value) {
      const safeMapUrl = sanitizeUrl(settings.location_url.value, "#");
      if (safeMapUrl !== "#") document.getElementById("map-link").href = safeMapUrl;
    }
    if (settings.location_embed && settings.location_embed.value) {
      const safeEmbed = sanitizeUrl(settings.location_embed.value, "");
      if (safeEmbed.startsWith("https://www.google.com/maps") || safeEmbed.startsWith("https://maps.google.com")) {
        document.getElementById("map-iframe").src = safeEmbed;
      }
    } else if (settings.location_address && settings.location_address.value && settings.location_address.value !== "Alamat Lengkap Lokasi") {
      document.getElementById("map-iframe").src = `https://maps.google.com/maps?q=${encodeURIComponent(settings.location_address.value)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
    }

    // Amplop Digital / Gift
    const bankName = (settings.gift_bank && settings.gift_bank.value) || "BSG";
    const accNum = (settings.gift_acc && settings.gift_acc.value) || "02702090005226";
    const accHolder = (settings.gift_name && settings.gift_name.value) || "Rina Buntuan";

    document.getElementById("gift-bank").innerText = bankName;
    document.getElementById("rek1").value = accNum;
    document.getElementById("gift-name").innerText = accHolder;

    const logoSrc = getBankLogo(bankName);
    const logoEl = document.getElementById("gift-bank-logo");
    if (logoSrc) {
      logoEl.src = logoSrc;
      logoEl.style.display = "block";
    } else {
      logoEl.style.display = "none";
    }

    // Galeri Foto (DOM API aman anti-XSS)
    const galleryUrls = ["gallery_1", "gallery_2", "gallery_3", "gallery_4"]
      .map((k) => (settings[k] && settings[k].value ? sanitizeUrl(settings[k].value, "") : ""))
      .filter(Boolean);

    if (galleryUrls.length > 0) {
      const galleryContainer = document.getElementById("gallery-container");
      galleryContainer.innerHTML = "";
      galleryUrls.forEach((safeUrl, idx) => {
        const itemDiv = document.createElement("div");
        itemDiv.className = "item";

        const link = document.createElement("a");
        link.href = safeUrl;
        link.setAttribute("data-lightbox", "gallery");

        const img = document.createElement("img");
        img.src = safeUrl;
        img.alt = `Gallery ${idx + 1}`;
        img.loading = "lazy";

        link.appendChild(img);
        itemDiv.appendChild(link);
        galleryContainer.appendChild(itemDiv);
      });
      if (typeof initGalleryCarousel === "function") initGalleryCarousel();
    }

    // Turut Mengundang
    if (settings.turut_mengundang && settings.turut_mengundang.value) {
      document.getElementById("turut-mengundang-text").innerText = settings.turut_mengundang.value;
    }

    // Musik Latar
    const customMusic = settings.music_url && settings.music_url.value ? sanitizeUrl(settings.music_url.value, "") : "";
    if (typeof setAudioTrackByType === "function") {
      setAudioTrackByType(isWedding, isInvitationOpened, customMusic);
    }

    // Visibilitas Kolom
    ["sec_events_v", "sec_event_2_v", "sec_gallery_v", "sec_gift_v", "sec_wishes_v", "sec_turut_v"].forEach((key) => {
      if (settings[key] && settings[key].visible === false) {
        document.querySelectorAll("." + key).forEach((el) => el.classList.add("hidden"));
      } else {
        document.querySelectorAll("." + key).forEach((el) => el.classList.remove("hidden"));
      }
    });

    if (typeof window.refresh3DJourneyState === "function") {
      window.refresh3DJourneyState();
    }
  }

  window.submitWish = function () {
    const name = document.getElementById("wish-name-input").value.trim();
    const attend = document.getElementById("wish-attend").value;
    const count = Number(document.getElementById("jumlah").value) || 1;
    const msg = document.getElementById("wish-msg-input").value.trim();
    const btn = document.getElementById("btn-submit-wish");

    if (!name || !msg) {
      showAlert("warning", "Data Belum Lengkap", "Harap isi nama dan pesan ucapan Anda.");
      return;
    }

    btn.innerText = "Mengirim...";
    btn.disabled = true;

    apiPost("sendWish", {
      eventId: EVENT_ID,
      name: name,
      message: msg,
      attendance: attend,
      guestCount: count,
    })
      .then(() => {
        document.getElementById("wish-msg-input").value = "";
        btn.innerText = "Kirim RSVP & Ucapan";
        btn.disabled = false;
        if (typeof Swal !== "undefined") {
          Swal.fire({
            icon: "success",
            title: "Terima Kasih!",
            text: "Ucapan & konfirmasi kehadiran Anda telah terkirim.",
            showConfirmButton: false,
            timer: 1800,
          });
        }
        loadWishes();
      })
      .catch((err) => {
        showAlert("error", "Gagal Mengirim", err.message);
        btn.innerText = "Kirim RSVP & Ucapan";
        btn.disabled = false;
      });
  };

  function loadWishes() {
    apiGet("getWishes", { event: EVENT_ID })
      .then((wishes) => {
        const container = document.getElementById("wishes-container");
        if (!Array.isArray(wishes) || wishes.length === 0) {
          container.innerHTML = '<p class="text-center text-muted small py-3">Belum ada ucapan. Jadilah yang pertama memberikan doa restu!</p>';
          return;
        }
        container.innerHTML = "";
        wishes.forEach((w) => {
          let cleanMsg = w.message || "";
          let statusText = w.attendance || "";
          const gCount = Number(w.guestCount) || 1;

          if (statusText === "Hadir" && gCount > 1) {
            statusText = `Hadir - ${gCount} Orang`;
          }

          // Dukungan backward-compatible untuk format lama "[Hadir]"
          if (!statusText) {
            const bracketMatch = cleanMsg.match(/\[(.*?)\]\s*$/);
            if (bracketMatch) {
              statusText = bracketMatch[1];
              cleanMsg = cleanMsg.replace(bracketMatch[0], "").trim();
            }
          }

          const div = document.createElement("div");
          div.className = "wish-box";

          const h4 = document.createElement("h4");
          const nameSpan = document.createElement("span");
          nameSpan.textContent = w.name || "Anonim";
          h4.appendChild(nameSpan);

          if (statusText) {
            const badge = document.createElement("span");
            badge.className = "badge-attend";
            badge.textContent = statusText;
            if (statusText.startsWith("Hadir")) {
              badge.style.background = "#34c759";
            } else if (statusText.includes("Tidak Hadir")) {
              badge.style.background = "#ff3b30";
            } else {
              badge.style.background = "#ffcc00";
              badge.style.color = "#333";
            }
            h4.appendChild(badge);
          }

          const p = document.createElement("p");
          p.textContent = cleanMsg;

          div.appendChild(h4);
          div.appendChild(p);
          container.appendChild(div);
        });
      })
      .catch(() => {
        const container = document.getElementById("wishes-container");
        if (container) container.replaceChildren();
      });
  }

  document.addEventListener("DOMContentLoaded", function () {
    if (typeof AOS !== "undefined") {
      AOS.init({ once: true });
    }

    // Aktifkan Mode Perjalanan Video 3D (Focal-Point Zoom-In Fly-Through)
    document.body.classList.add("journey-3d-mode");
    let currentSceneIdx = 0;
    let isTransitioning3D = false;

    function getActiveScenes() {
      return Array.from(document.querySelectorAll(".journey-scene")).filter(
        (el) => !el.classList.contains("hidden")
      );
    }

    function updateJourneyHud(scenes, idx) {
      const active = scenes[idx];
      if (!active) return;
      const labelEl = document.getElementById("journey-label");
      const prevBtn = document.getElementById("journey-prev");
      const nextBtn = document.getElementById("journey-next");

      if (labelEl) {
        const title = active.getAttribute("data-scene-title") || "";
        labelEl.textContent = `${idx + 1} / ${scenes.length} · ${title}`;
      }
      if (prevBtn) prevBtn.disabled = idx <= 0;
      if (nextBtn) {
        nextBtn.disabled = idx >= scenes.length - 1;
        nextBtn.textContent = idx >= scenes.length - 1 ? "Akhir" : "Terbang ↓";
      }

      document.querySelectorAll(".bottom-nav a").forEach((link) => {
        link.classList.toggle("active", link.getAttribute("href") === "#" + active.id);
      });
    }

    function injectRealisticOrnaments() {
      if (!document.getElementById("scene-ornament-corners")) {
        const cornerWrap = document.createElement("div");
        cornerWrap.id = "scene-ornament-corners";
        cornerWrap.className = "scene-ornament-corners";
        const cornerSvg =
          '<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">' +
          '<path d="M4 40 C4 18, 18 4, 40 4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' +
          '<path d="M12 34 C12 20, 20 12, 34 12" stroke="currentColor" stroke-width="1.2" stroke-opacity="0.65"/>' +
          '<circle cx="40" cy="4" r="2.5" fill="currentColor"/>' +
          '<circle cx="4" cy="40" r="2.5" fill="currentColor"/>' +
          '<circle cx="10" cy="10" r="3" fill="currentColor" fill-opacity="0.7"/>' +
          "</svg>";
        ["tl", "tr", "bl", "br"].forEach((pos) => {
          const holder = document.createElement("div");
          holder.className = `ornament-corner ornament-corner-${pos}`;
          const parsed = new DOMParser().parseFromString(cornerSvg, "image/svg+xml");
          if (parsed.documentElement && parsed.documentElement.nodeName === "svg") {
            holder.appendChild(document.importNode(parsed.documentElement, true));
          }
          cornerWrap.appendChild(holder);
        });
        document.body.appendChild(cornerWrap);
      }

      if (!document.getElementById("ambient-motes")) {
        const motes = document.createElement("div");
        motes.id = "ambient-motes";
        motes.className = "ambient-motes";
        for (let i = 0; i < 12; i++) {
          const dot = document.createElement("span");
          dot.className = "ambient-mote";
          dot.style.left = `${8 + ((i * 7.8) % 86)}%`;
          dot.style.top = `${15 + ((i * 13) % 72)}%`;
          dot.style.animationDelay = `${(i * 0.75).toFixed(2)}s`;
          dot.style.animationDuration = `${7 + (i % 4)}s`;
          motes.appendChild(dot);
        }
        document.body.appendChild(motes);
      }

      // Garis lipatan tengah buku pop-up (book spine crease)
      if (!document.getElementById("book-spine-crease")) {
        const spine = document.createElement("div");
        spine.id = "book-spine-crease";
        document.body.appendChild(spine);
      }

      // Tambahkan plakat bab legenda, engsel lipatan pop-up, & diorama kertas di setiap ruangan
      const dioramaSvg =
        '<svg viewBox="0 0 1440 110" xmlns="http://www.w3.org/2000/svg">' +
        '<path fill="var(--color-secondary)" fill-opacity="0.55" d="M0,78 Q220,24 480,68 T960,52 T1440,74 L1440,110 L0,110 Z"/>' +
        '<path fill="var(--color-primary)" fill-opacity="0.32" d="M0,92 Q320,46 680,84 T1440,68 L1440,110 L0,110 Z"/>' +
        "</svg>";

      document.querySelectorAll(".journey-scene").forEach((scene) => {
        if (scene.id === "cover") return;
        const container = scene.querySelector(".container");

        if (!scene.querySelector(".scene-chapter-crest")) {
          const chapter = scene.getAttribute("data-chapter") || "";
          const title = scene.getAttribute("data-scene-title") || "";
          if (chapter && title && container) {
            const crestWrap = document.createElement("div");
            crestWrap.className = "text-center";
            const crest = document.createElement("span");
            crest.className = "scene-chapter-crest";
            crest.textContent = `✦ ${chapter} · ${title} ✦`;
            crestWrap.appendChild(crest);
            container.insertBefore(crestWrap, container.firstChild);
          }
        }

        // Tandai elemen utama sebagai lipatan kertas pop-up (.popup-fold-item)
        const foldTargets = scene.querySelectorAll(".card, .profile-circle, .owl-carousel, #my-form");
        foldTargets.forEach((el, idx) => {
          el.classList.add("popup-fold-item");
          el.style.setProperty("--popup-delay", `${0.18 + Math.min(idx, 4) * 0.12}s`);
        });

        // Tambahkan diorama kertas bertumpuk di dasar halaman
        if (!scene.querySelector(".popup-paper-diorama")) {
          const diorama = document.createElement("div");
          diorama.className = "popup-paper-diorama";
          const parsed = new DOMParser().parseFromString(dioramaSvg, "image/svg+xml");
          if (parsed.documentElement && parsed.documentElement.nodeName === "svg") {
            diorama.appendChild(document.importNode(parsed.documentElement, true));
          }
          scene.appendChild(diorama);
        }
      });
    }

    function renderLegendMap(scenes, activeIdx) {
      const layer = document.getElementById("legend-waypoints-layer");
      const trail = document.getElementById("legend-flight-trail");
      const trailBg = document.getElementById("legend-flight-trail-bg");
      if (!layer || !trail || !trailBg || scenes.length === 0) return;

      layer.replaceChildren();
      const points = scenes.map((sc, i) => {
        const progress = scenes.length > 1 ? i / (scenes.length - 1) : 0.5;
        const y = 38 + progress * 364;
        const x = 180 + Math.sin(i * 1.15) * 95;
        return { x, y, scene: sc, index: i };
      });

      let pathD = `M ${points[0].x} ${points[0].y}`;
      for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1];
        const curr = points[i];
        const midY = (prev.y + curr.y) / 2;
        pathD += ` C ${prev.x} ${midY}, ${curr.x} ${midY}, ${curr.x} ${curr.y}`;
      }
      trail.setAttribute("d", pathD);
      trailBg.setAttribute("d", pathD);

      points.forEach((pt) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "legend-waypoint" + (pt.index === activeIdx ? " is-current" : "");
        btn.style.left = `${(pt.x / 360) * 100}%`;
        btn.style.top = `${(pt.y / 440) * 100}%`;
        const chapter = pt.scene.getAttribute("data-chapter") || `${pt.index + 1}`;
        const title = pt.scene.getAttribute("data-scene-title") || pt.scene.id;
        btn.textContent = `${chapter} · ${title}`;
        btn.addEventListener("click", () => {
          goToScene(pt.index);
        });
        layer.appendChild(btn);
      });

      const droneMarker = document.getElementById("legend-drone-marker");
      const activePt = points[activeIdx] || points[0];
      if (droneMarker && activePt) {
        droneMarker.style.left = `${(activePt.x / 360) * 100}%`;
        droneMarker.style.top = `${(activePt.y / 440) * 100}%`;
      }
      return points;
    }

    function openLegendMap() {
      const modal = document.getElementById("legend-map-modal");
      const canvas = document.getElementById("legend-map-canvas");
      if (!modal) return;
      if (canvas) canvas.classList.remove("is-zooming-in");
      renderLegendMap(getActiveScenes(), currentSceneIdx);
      modal.classList.add("is-open");
      modal.setAttribute("aria-hidden", "false");
    }

    function closeLegendMap() {
      const modal = document.getElementById("legend-map-modal");
      const canvas = document.getElementById("legend-map-canvas");
      if (canvas) canvas.classList.remove("is-zooming-in");
      if (!modal) return;
      modal.classList.remove("is-open");
      modal.setAttribute("aria-hidden", "true");
    }

    function goToScene(targetIdxOrId) {
      if (isTransitioning3D) return;
      const scenes = getActiveScenes();
      if (scenes.length === 0) return;

      let targetIdx =
        typeof targetIdxOrId === "number"
          ? targetIdxOrId
          : scenes.findIndex((s) => s.id === targetIdxOrId);

      if (targetIdx < 0 || targetIdx >= scenes.length) return;
      if (targetIdx === currentSceneIdx) {
        closeLegendMap();
        return;
      }

      const fromEl = scenes[currentSceneIdx];
      const toEl = scenes[targetIdx];
      const isForward = targetIdx > currentSceneIdx;
      isTransitioning3D = true;

      // 1. Kembali ke Peta Dunia (seperti game level map)
      const mapModal = document.getElementById("legend-map-modal");
      const mapCanvas = document.getElementById("legend-map-canvas");
      const droneMarker = document.getElementById("legend-drone-marker");
      const flightLayer = document.getElementById("drone-flight-layer");
      const flightText = document.getElementById("drone-flight-text");

      const points = renderLegendMap(scenes, currentSceneIdx);
      const targetPt = points[targetIdx];
      const targetXpct = targetPt ? `${(targetPt.x / 360) * 100}%` : "50%";
      const targetYpct = targetPt ? `${(targetPt.y / 440) * 100}%` : "50%";

      if (flightLayer && flightText) {
        const ch = toEl.getAttribute("data-chapter") || "";
        const tt = toEl.getAttribute("data-scene-title") || "";
        flightText.textContent = `Terbang menuju ${ch ? ch + " · " : ""}${tt}`;
        flightLayer.classList.add("is-flying");
      }

      // Buka peta & mundurkan scene lama
      if (fromEl) {
        fromEl.classList.remove("scene-active");
        fromEl.classList.add("scene-exit-zoom-out");
      }
      if (mapCanvas) mapCanvas.classList.remove("is-zooming-in");
      if (mapModal) {
        mapModal.classList.add("is-open");
        mapModal.setAttribute("aria-hidden", "false");
      }

      // 2. Gerakkan marker drone di atas peta menuju titik tujuan
      setTimeout(() => {
        if (droneMarker) {
          droneMarker.style.left = targetXpct;
          droneMarker.style.top = targetYpct;
        }
        document.querySelectorAll(".legend-waypoint").forEach((el, idx) => {
          el.classList.toggle("is-current", idx === targetIdx);
        });
      }, 120);

      // 3. Zoom-in ke titik tujuan pada peta untuk membuka halaman/bagian baru
      setTimeout(() => {
        if (mapCanvas) {
          mapCanvas.style.setProperty("--map-zoom-origin", `${targetXpct} ${targetYpct}`);
          mapCanvas.classList.add("is-zooming-in");
        }

        const flyX = toEl.getAttribute("data-fly-x") || "0px";
        const flyY = toEl.getAttribute("data-fly-y") || "0px";
        const flyTilt = toEl.getAttribute("data-fly-tilt") || "0deg";
        toEl.style.setProperty("--focal-origin", toEl.getAttribute("data-focal") || "50% 50%");
        toEl.style.setProperty("--fly-x", flyX);
        toEl.style.setProperty("--fly-y", flyY);
        toEl.style.setProperty("--fly-tilt", flyTilt);

        toEl.classList.remove("scene-exit-zoom-in", "scene-exit-zoom-out", "scene-active");
        toEl.classList.add(isForward ? "scene-enter-from-deep" : "scene-enter-from-front");
        toEl.scrollTop = 0;
        void toEl.offsetWidth;

        toEl.classList.remove("scene-enter-from-deep", "scene-enter-from-front");
        toEl.classList.add("scene-active", "is-entered");
        toEl.querySelectorAll("[data-aos]").forEach((node) => node.classList.add("aos-animate"));

        currentSceneIdx = targetIdx;
        updateJourneyHud(scenes, currentSceneIdx);

        if (toEl.id === "gallery" && typeof initGalleryCarousel === "function") {
          setTimeout(() => initGalleryCarousel(), 150);
        }
      }, 650);

      // 4. Tutup overlay peta setelah zoom-in selesai
      setTimeout(() => {
        closeLegendMap();
        if (fromEl) {
          fromEl.classList.remove("scene-exit-zoom-in", "scene-exit-zoom-out");
        }
        if (flightLayer) flightLayer.classList.remove("is-flying");
        isTransitioning3D = false;
      }, 1250);
    }

    window.refresh3DJourneyState = function () {
      const scenes = getActiveScenes();
      if (currentSceneIdx >= scenes.length) currentSceneIdx = 0;
      scenes.forEach((s, i) => {
        s.classList.toggle("scene-active", i === currentSceneIdx);
        if (i === currentSceneIdx) s.classList.add("is-entered");
      });
      updateJourneyHud(scenes, currentSceneIdx);
    };

    injectRealisticOrnaments();

    const mapBtn = document.getElementById("journey-map-btn");
    const mapCloseBtn = document.getElementById("legend-map-close");
    const mapModal = document.getElementById("legend-map-modal");
    if (mapBtn) mapBtn.addEventListener("click", openLegendMap);
    if (mapCloseBtn) mapCloseBtn.addEventListener("click", closeLegendMap);
    if (mapModal) {
      mapModal.addEventListener("click", (e) => {
        if (e.target === mapModal) closeLegendMap();
      });
    }

    const prevBtn = document.getElementById("journey-prev");
    const nextBtn = document.getElementById("journey-next");
    if (prevBtn) prevBtn.addEventListener("click", () => goToScene(currentSceneIdx - 1));
    if (nextBtn) nextBtn.addEventListener("click", () => goToScene(currentSceneIdx + 1));

    document.querySelectorAll(".bottom-nav a").forEach((link) => {
      link.addEventListener("click", function (e) {
        const targetId = (this.getAttribute("href") || "").replace("#", "");
        if (!targetId) return;
        e.preventDefault();
        goToScene(targetId);
      });
    });

    // Navigasi Wheel (hanya pindah scene jika sudah di batas atas/bawah scene saat ini)
    let wheelCooldown = 0;
    window.addEventListener(
      "wheel",
      function (e) {
        if (!isInvitationOpened || isTransitioning3D) return;
        const now = Date.now();
        if (now - wheelCooldown < 950) return;

        const scenes = getActiveScenes();
        const active = scenes[currentSceneIdx];
        if (!active) return;

        const atBottom = active.scrollTop + active.clientHeight >= active.scrollHeight - 8;
        const atTop = active.scrollTop <= 4;

        if (e.deltaY > 35 && atBottom) {
          wheelCooldown = now;
          goToScene(currentSceneIdx + 1);
        } else if (e.deltaY < -35 && atTop) {
          wheelCooldown = now;
          goToScene(currentSceneIdx - 1);
        }
      },
      { passive: true }
    );

    // Navigasi Touch Swipe di batas atas/bawah scene (Mobile)
    let touchStartY = 0;
    window.addEventListener(
      "touchstart",
      (e) => {
        if (e.touches && e.touches[0]) touchStartY = e.touches[0].clientY;
      },
      { passive: true }
    );
    window.addEventListener(
      "touchend",
      (e) => {
        if (!isInvitationOpened || isTransitioning3D || !e.changedTouches || !e.changedTouches[0]) return;
        const dy = touchStartY - e.changedTouches[0].clientY;
        const scenes = getActiveScenes();
        const active = scenes[currentSceneIdx];
        if (!active) return;

        const atBottom = active.scrollTop + active.clientHeight >= active.scrollHeight - 10;
        const atTop = active.scrollTop <= 6;

        if (dy > 55 && atBottom) {
          goToScene(currentSceneIdx + 1);
        } else if (dy < -55 && atTop) {
          goToScene(currentSceneIdx - 1);
        }
      },
      { passive: true }
    );

    // Navigasi Keyboard ArrowDown/ArrowUp
    window.addEventListener("keydown", (e) => {
      if (!isInvitationOpened || isTransitioning3D) return;
      const tag = (document.activeElement && document.activeElement.tagName) || "";
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "ArrowDown" || e.key === "PageDown") {
        e.preventDefault();
        goToScene(currentSceneIdx + 1);
      } else if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        goToScene(currentSceneIdx - 1);
      }
    });

    window.refresh3DJourneyState();

    // Stale-while-revalidate: tampilkan cache lokal jika ada sambil sinkronisasi ke backend
    try {
      const cachedRaw = localStorage.getItem(CACHE_KEY);
      if (cachedRaw) {
        settings = JSON.parse(cachedRaw);
        renderPage();
      }
    } catch (e) {
      // Abaikan cache korup
    }

    let isDone = false;
    const safetyTimer = setTimeout(function () {
      if (!isDone) {
        isDone = true;
        renderPage();
        finishLoadingAndShow();
        loadWishes();
      }
    }, 5000);

    apiGet("getSettings", { event: EVENT_ID })
      .then((data) => {
        if (!isDone) {
          isDone = true;
          clearTimeout(safetyTimer);
          if (data && !data.error) {
            settings = data;
            try {
              localStorage.setItem(CACHE_KEY, JSON.stringify(data));
            } catch (e) {
              // Abaikan jika storage penuh
            }
          }
          renderPage();
          finishLoadingAndShow();
          loadWishes();
        }
      })
      .catch((err) => {
        if (!isDone) {
          isDone = true;
          clearTimeout(safetyTimer);
          console.warn("Menggunakan pengaturan bawaan tema:", err.message);
          renderPage();
          finishLoadingAndShow();
          loadWishes();
        }
      });
  });

  // Throttled Scroll Spy + 3D Depth Parallax pada Teras Depan
  let scrollTicking = false;
  window.addEventListener("scroll", function () {
    if (scrollTicking) return;
    scrollTicking = true;
    window.requestAnimationFrame(function () {
      const scrollY = window.scrollY || window.pageYOffset || 0;
      const heroProgress = Math.min(Math.max(scrollY / Math.max(window.innerHeight, 1), 0), 1);
      document.documentElement.style.setProperty("--hero-zoom", (1 + heroProgress * 0.08).toFixed(3));
      document.documentElement.style.setProperty("--hero-shift", `${(heroProgress * 28).toFixed(1)}px`);

      const sections = ["cover", "profile", "events", "gallery", "rsvp"];
      let current = "cover";
      sections.forEach((secId) => {
        const sec = document.getElementById(secId);
        if (sec && !sec.classList.contains("hidden")) {
          const rect = sec.getBoundingClientRect();
          if (rect.top <= window.innerHeight / 2) {
            current = secId;
          }
        }
      });

      document.querySelectorAll(".bottom-nav a").forEach((link) => {
        link.classList.toggle("active", link.getAttribute("href") === "#" + current);
      });
      scrollTicking = false;
    });
  });
})();
