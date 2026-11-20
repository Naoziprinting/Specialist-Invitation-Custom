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

    // Izin sensor gyroscope untuk Safari iOS 13+ (wajib di dalam user gesture)
    if (
      typeof DeviceOrientationEvent !== "undefined" &&
      typeof DeviceOrientationEvent.requestPermission === "function"
    ) {
      DeviceOrientationEvent.requestPermission().catch(() => {});
    }

    const modalEl = document.getElementById("exampleModal");
    const coverEl = document.getElementById("cover");
    if (coverEl) coverEl.classList.add("hero-entered");

    if (modalEl && typeof bootstrap !== "undefined") {
      modalEl.classList.add("stage-doors-opening");
      setTimeout(() => {
        const instance = bootstrap.Modal.getOrCreateInstance(modalEl);
        instance.hide();
        modalEl.classList.remove("stage-doors-opening");
      }, 780);
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
      const turutEl = document.getElementById("turut-mengundang-text");
      if (turutEl) {
        turutEl.innerText = settings.turut_mengundang.value;
        formatTurutMengundang();
      }
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
    // Aktifkan Mode 3D Realistic Pop-Up Book Diorama (Low-Angle POV)
    document.body.classList.add("diorama-book-mode");
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
        nextBtn.textContent = idx >= scenes.length - 1 ? "Akhir" : "Lanjut ›";
      }

      document.querySelectorAll(".bottom-nav a").forEach((link) => {
        link.classList.toggle("active", link.getAttribute("href") === "#" + active.id);
      });
    }

    const BACKDROP_PLANES = {
      gate: {
        far: '<svg viewBox="0 0 560 150" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18,146 Q110,84 210,108 T410,92 T542,146 Z" fill="var(--color-secondary)" stroke="var(--paper-ivory)" stroke-width="2.5"/><ellipse cx="140" cy="48" rx="46" ry="18" fill="var(--paper-ivory)" opacity="0.88"/><ellipse cx="420" cy="42" rx="40" ry="15" fill="var(--paper-ivory)" opacity="0.82"/></svg>',
        mid: '<svg viewBox="0 0 560 150" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M195,148 L195,62 C195,22 235,12 280,12 C325,12 365,22 365,62 L365,148 Z" fill="var(--paper-edge-2)" transform="translate(0,3)"/><path d="M195,146 L195,62 C195,22 235,12 280,12 C325,12 365,22 365,62 L365,146 Z" fill="var(--color-surface)" stroke="var(--paper-ivory)" stroke-width="3"/><path d="M222,146 L222,72 C222,44 248,34 280,34 C312,34 338,44 338,72 L338,146 Z" fill="var(--color-bg)" stroke="var(--color-primary)" stroke-width="2"/></svg>',
        near: '<svg viewBox="0 0 560 150" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="106" cy="96" r="28" fill="var(--color-primary)" stroke="var(--paper-ivory)" stroke-width="2.5"/><circle cx="142" cy="110" r="22" fill="var(--color-primary)" stroke="var(--paper-ivory)" stroke-width="2"/><circle cx="454" cy="96" r="28" fill="var(--color-primary)" stroke="var(--paper-ivory)" stroke-width="2.5"/><circle cx="418" cy="110" r="22" fill="var(--color-primary)" stroke="var(--paper-ivory)" stroke-width="2"/></svg>',
      },
      garden: {
        far: '<svg viewBox="0 0 560 140" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14,136 Q130,68 270,96 T546,136 Z" fill="var(--color-secondary)" stroke="var(--paper-ivory)" stroke-width="2.5"/></svg>',
        mid: '<svg viewBox="0 0 560 140" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="280" cy="64" r="24" fill="var(--color-surface)" stroke="var(--paper-ivory)" stroke-width="2.5"/><path d="M238,136 C252,96 308,96 322,136 Z" fill="var(--color-primary)" stroke="var(--paper-ivory)" stroke-width="2"/></svg>',
        near: '<svg viewBox="0 0 560 140" fill="none" xmlns="http://www.w3.org/2000/svg"><ellipse cx="92" cy="84" rx="44" ry="34" fill="var(--color-primary)" stroke="var(--paper-ivory)" stroke-width="2.5"/><ellipse cx="468" cy="84" rx="44" ry="34" fill="var(--color-primary)" stroke="var(--paper-ivory)" stroke-width="2.5"/></svg>',
      },
      arch: {
        far: '<svg viewBox="0 0 560 148" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M30,144 Q140,86 280,104 T530,144 Z" fill="var(--color-secondary)" stroke="var(--paper-ivory)" stroke-width="2.5"/></svg>',
        mid: '<svg viewBox="0 0 560 148" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M165,146 L165,54 C165,18 215,10 280,10 C345,10 395,18 395,54 L395,146 Z" fill="var(--paper-edge-2)" transform="translate(0,3)"/><path d="M165,144 L165,54 C165,18 215,10 280,10 C345,10 395,18 395,54 L395,144 Z" fill="var(--color-surface)" stroke="var(--paper-ivory)" stroke-width="3"/><path d="M196,144 L196,66 C196,38 232,28 280,28 C328,28 364,38 364,66 L364,144 Z" fill="var(--color-bg)" stroke="var(--color-primary)" stroke-width="2"/></svg>',
        near: '<svg viewBox="0 0 560 148" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="128" cy="96" r="24" fill="var(--color-primary)" stroke="var(--paper-ivory)" stroke-width="2"/><circle cx="432" cy="96" r="24" fill="var(--color-primary)" stroke="var(--paper-ivory)" stroke-width="2"/></svg>',
      },
      trees: {
        far: '<svg viewBox="0 0 560 140" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20,136 Q150,82 280,104 T540,136 Z" fill="var(--color-secondary)" stroke="var(--paper-ivory)" stroke-width="2.5"/></svg>',
        mid: '<svg viewBox="0 0 560 140" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M235,136 L280,52 L325,136 Z" fill="var(--color-primary)" stroke="var(--paper-ivory)" stroke-width="2.5"/></svg>',
        near: '<svg viewBox="0 0 560 140" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="115" cy="76" r="34" fill="var(--color-primary)" stroke="var(--paper-ivory)" stroke-width="2.5"/><circle cx="155" cy="90" r="24" fill="var(--color-surface)" stroke="var(--paper-ivory)" stroke-width="2"/><circle cx="445" cy="76" r="34" fill="var(--color-primary)" stroke="var(--paper-ivory)" stroke-width="2.5"/><circle cx="405" cy="90" r="24" fill="var(--color-surface)" stroke="var(--paper-ivory)" stroke-width="2"/></svg>',
      },
      pavilion: {
        far: '<svg viewBox="0 0 560 146" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20,142 Q150,92 280,108 T540,142 Z" fill="var(--color-secondary)" stroke="var(--paper-ivory)" stroke-width="2.5"/></svg>',
        mid: '<svg viewBox="0 0 560 146" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M160,64 L280,16 L400,64 Z" fill="var(--color-primary)" stroke="var(--paper-ivory)" stroke-width="2.5"/><rect x="182" y="64" width="196" height="78" fill="var(--color-surface)" stroke="var(--paper-ivory)" stroke-width="2.5"/><rect x="242" y="84" width="76" height="58" rx="38" fill="var(--color-bg)" stroke="var(--color-primary)" stroke-width="2"/></svg>',
        near: '<svg viewBox="0 0 560 146" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="114" cy="94" r="26" fill="var(--color-primary)" stroke="var(--paper-ivory)" stroke-width="2"/><circle cx="446" cy="94" r="26" fill="var(--color-primary)" stroke="var(--paper-ivory)" stroke-width="2"/></svg>',
      },
      city: {
        far: '<svg viewBox="0 0 560 146" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="142" y="34" width="72" height="108" rx="4" fill="var(--color-secondary)" stroke="var(--paper-ivory)" stroke-width="2.5"/><rect x="346" y="38" width="72" height="104" rx="4" fill="var(--color-secondary)" stroke="var(--paper-ivory)" stroke-width="2.5"/></svg>',
        mid: '<svg viewBox="0 0 560 146" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M232,142 L232,48 L280,18 L328,48 L328,142 Z" fill="var(--color-surface)" stroke="var(--paper-ivory)" stroke-width="2.5"/></svg>',
        near: '<svg viewBox="0 0 560 146" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="74" y="54" width="58" height="88" rx="4" fill="var(--color-primary)" stroke="var(--paper-ivory)" stroke-width="2.5"/><rect x="428" y="58" width="58" height="84" rx="4" fill="var(--color-primary)" stroke="var(--paper-ivory)" stroke-width="2.5"/></svg>',
      },
    };

    function formatTurutMengundang() {
      const el = document.getElementById("turut-mengundang-text");
      if (!el) return;
      const raw = (el.textContent || "").trim();
      if (!raw || !raw.includes("|")) return;
      const parts = raw
        .split("|")
        .map((s) => s.trim())
        .filter(Boolean);
      if (parts.length < 2) return;
      const grid = document.createElement("div");
      grid.className = "turut-grid";
      parts.forEach((item) => {
        const pill = document.createElement("div");
        pill.className = "turut-pill";
        pill.textContent = item;
        grid.appendChild(pill);
      });
      el.replaceChildren(grid);
    }

    function injectDioramaBackdrops() {
      document.querySelectorAll(".journey-scene").forEach((scene) => {
        if (scene.id !== "cover" && !scene.querySelector(".scene-chapter-crest")) {
          const container = scene.querySelector(".container");
          const chapter = scene.getAttribute("data-chapter") || "";
          const title = scene.getAttribute("data-scene-title") || "";
          if (chapter && title && container) {
            const crestWrap = document.createElement("div");
            crestWrap.className = "text-center";
            const crest = document.createElement("span");
            crest.className = "scene-chapter-crest popup-layer";
            crest.setAttribute("data-depth", "front");
            crest.textContent = `✦ ${chapter} · ${title} ✦`;
            crestWrap.appendChild(crest);
            container.insertBefore(crestWrap, container.firstChild);
          }
        }

        scene.querySelectorAll(".diorama-module").forEach((mod) => {
          if (!mod.querySelector(".diorama-plane")) {
            const key = mod.getAttribute("data-backdrop") || "garden";
            const planes = BACKDROP_PLANES[key] || BACKDROP_PLANES.garden;
            ["far", "mid", "near"].forEach((layerKey) => {
              const planeDiv = document.createElement("div");
              planeDiv.className = `diorama-plane diorama-plane-${layerKey}`;
              const parsed = new DOMParser().parseFromString(planes[layerKey], "image/svg+xml");
              if (parsed.documentElement && parsed.documentElement.nodeName === "svg") {
                planeDiv.appendChild(document.importNode(parsed.documentElement, true));
              }
              mod.insertBefore(planeDiv, mod.querySelector(".popup-layer") || null);
            });
          }

          if (!mod.querySelector(".paper-strut")) {
            const leftStrut = document.createElement("span");
            leftStrut.className = "paper-strut paper-strut-left";
            const rightStrut = document.createElement("span");
            rightStrut.className = "paper-strut paper-strut-right";
            mod.appendChild(leftStrut);
            mod.appendChild(rightStrut);
          }
        });
      });
    }

    function goToScene(targetIdxOrId) {
      if (isTransitioning3D) return;
      const scenes = getActiveScenes();
      if (scenes.length === 0) return;

      let targetIdx =
        typeof targetIdxOrId === "number"
          ? targetIdxOrId
          : scenes.findIndex((s) => s.id === targetIdxOrId);

      if (targetIdx < 0 || targetIdx >= scenes.length || targetIdx === currentSceneIdx) return;

      const fromEl = scenes[currentSceneIdx];
      const toEl = scenes[targetIdx];
      const isForward = targetIdx > currentSceneIdx;
      isTransitioning3D = true;

      toEl.classList.remove("scene-exit-fold", "scene-active");
      toEl.classList.add("scene-enter-rise");
      toEl.scrollTop = 0;

      // Force reflow agar animasi bangun diorama berjalan mulus
      void toEl.offsetWidth;

      if (fromEl) {
        fromEl.classList.remove("scene-active");
        fromEl.classList.add("scene-exit-fold");
      }

      toEl.classList.remove("scene-enter-rise");
      toEl.classList.add("scene-active");

      currentSceneIdx = targetIdx;
      updateJourneyHud(scenes, currentSceneIdx);

      const pageHint = document.getElementById("page-turn-hint");
      if (pageHint && currentSceneIdx > 0) {
        pageHint.style.display = "none";
      }

      if (toEl.id === "gallery" && typeof initGalleryCarousel === "function") {
        setTimeout(() => initGalleryCarousel(), 120);
      }

      setTimeout(() => {
        if (fromEl) {
          fromEl.classList.remove("scene-exit-fold");
        }
        isTransitioning3D = false;
      }, 920);
    }

    window.refresh3DJourneyState = function () {
      const scenes = getActiveScenes();
      if (currentSceneIdx >= scenes.length) currentSceneIdx = 0;
      scenes.forEach((s, i) => {
        s.classList.toggle("scene-active", i === currentSceneIdx);
      });
      updateJourneyHud(scenes, currentSceneIdx);
    };

    injectDioramaBackdrops();
    formatTurutMengundang();

    const prevBtn = document.getElementById("journey-prev");
    const nextBtn = document.getElementById("journey-next");
    const labelBtn = document.getElementById("journey-label");
    const chapterDrawer = document.getElementById("chapter-drawer");
    if (prevBtn) prevBtn.addEventListener("click", () => goToScene(currentSceneIdx - 1));
    if (nextBtn) nextBtn.addEventListener("click", () => goToScene(currentSceneIdx + 1));
    if (labelBtn && chapterDrawer) {
      labelBtn.addEventListener("click", () => {
        const isOpen = chapterDrawer.classList.toggle("is-open");
        labelBtn.setAttribute("aria-expanded", String(isOpen));
        chapterDrawer.setAttribute("aria-hidden", String(!isOpen));
      });
    }

    document.querySelectorAll(".bottom-nav a").forEach((link) => {
      link.addEventListener("click", function (e) {
        const targetId = (this.getAttribute("href") || "").replace("#", "");
        if (!targetId) return;
        e.preventDefault();
        goToScene(targetId);
        if (chapterDrawer) {
          chapterDrawer.classList.remove("is-open");
          chapterDrawer.setAttribute("aria-hidden", "true");
          if (labelBtn) labelBtn.setAttribute("aria-expanded", "false");
        }
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

    // Navigasi Keyboard ArrowDown/ArrowUp & ArrowLeft/ArrowRight
    window.addEventListener("keydown", (e) => {
      if (!isInvitationOpened || isTransitioning3D) return;
      const tag = (document.activeElement && document.activeElement.tagName) || "";
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "ArrowDown" || e.key === "ArrowRight" || e.key === "PageDown") {
        e.preventDefault();
        goToScene(currentSceneIdx + 1);
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft" || e.key === "PageUp") {
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

  // 60fps Low-Angle Diorama Parallax (Desktop Mouse + Mobile Touch & Gyroscope)
  let tiltTicking = false;
  function applyTilt(nx, ny) {
    if (tiltTicking) return;
    tiltTicking = true;
    window.requestAnimationFrame(function () {
      document.documentElement.style.setProperty("--tilt-y", nx.toFixed(3));
      document.documentElement.style.setProperty("--tilt-x", ny.toFixed(3));
      tiltTicking = false;
    });
  }

  window.addEventListener(
    "mousemove",
    function (e) {
      if (window.innerWidth < 992) return;
      const nx = (e.clientX / Math.max(window.innerWidth, 1) - 0.5) * 2;
      const ny = -(e.clientY / Math.max(window.innerHeight, 1) - 0.5) * 2;
      applyTilt(nx, ny);
    },
    { passive: true }
  );

  window.addEventListener(
    "touchmove",
    function (e) {
      if (!e.touches || !e.touches[0]) return;
      const nx = (e.touches[0].clientX / Math.max(window.innerWidth, 1) - 0.5) * 1.4;
      const ny = -(e.touches[0].clientY / Math.max(window.innerHeight, 1) - 0.5) * 1.4;
      applyTilt(nx, ny);
    },
    { passive: true }
  );

  window.addEventListener(
    "touchend",
    function () {
      applyTilt(0, 0);
    },
    { passive: true }
  );

  window.addEventListener(
    "deviceorientation",
    function (e) {
      if (e.gamma === null || e.beta === null) return;
      const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
      const nx = clamp(e.gamma / 30, -1, 1);
      const ny = -clamp((e.beta - 35) / 30, -1, 1);
      applyTilt(nx, ny);
    },
    { passive: true }
  );

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
