/**
 * Interactive Adventure Game UI/UX Controller (index.html)
 * Preserves Multi-Tenant Google Apps Script Backend & Dynamic Data Bindings
 */
(function () {
  const EVENT_ID = getEventIdFromUrl();
  const CACHE_KEY = `naozi_inv_settings_${EVENT_ID}`;
  let settings = {};
  let isInvitationOpened = false;
  let activeLoreIdx = 0;
  let loreChapters = [
    {
      tag: "Chapter I • First Encounter",
      title: "Pertemuan Tak Terduga",
      desc: "Setiap petualangan besar bermula dari satu langkah kecil. Di persimpangan waktu yang tak terduga, dua penjelajah saling bertukar sapa dan menyalakan lentera harapan yang pertama.",
      img: "img/img2.jpg",
    },
    {
      tag: "Chapter II • The Journey Together",
      title: "Menapaki Lembah & Waktu",
      desc: "Melalui musim demi musim, tawa dan doa menjadi kompas penuntun. Bersama-sama kami belajar arti kesabaran, kepercayaan, dan keteguhan hati untuk melangkah seiring sejalan.",
      img: "img/img12.jpg",
    },
    {
      tag: "Final Destination • The Sacred Vow",
      title: "Gerbang Babak Baru",
      desc: "Kini tiba saatnya mengikat janji suci di hadapan semesta dan keluarga tercinta. Sebuah awal dari petualangan abadi membangun mahligai rumah tangga yang penuh berkah.",
      img: "img/img13.jpg",
    },
  ];

  function renderLoreChapter(idx) {
    activeLoreIdx = idx;
    const ch = loreChapters[idx] || loreChapters[0];
    const imgEl = document.getElementById("lore-img");
    const tagEl = document.getElementById("lore-tag");
    const titleEl = document.getElementById("lore-title");
    const descEl = document.getElementById("lore-desc");

    if (imgEl && ch.img) imgEl.src = ch.img;
    if (tagEl) tagEl.textContent = ch.tag;
    if (titleEl) titleEl.textContent = ch.title;
    if (descEl) descEl.textContent = ch.desc;
  }

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
      Swal.fire({
        icon: icon,
        title: title,
        text: text,
        background: "#181c1e",
        color: "#f5efe6",
        confirmButtonColor: "#d4af37",
      });
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

  // =========================================================================
  // START ADVENTURE (ENTER REALM)
  // =========================================================================
  window.openInvitation = function () {
    const btn = document.getElementById("btn-open-invitation");
    if (btn) btn.blur();
    isInvitationOpened = true;
    if (typeof playAudio === "function") playAudio();

    const startScreen = document.getElementById("start-screen");
    document.body.classList.remove("start-locked");

    if (startScreen) {
      startScreen.classList.add("is-entering");
      setTimeout(() => {
        startScreen.style.display = "none";
      }, 850);
    }
  };

  // =========================================================================
  // INTERACTIVE TREASURE CHEST (DIGITAL GIFT)
  // =========================================================================
  window.openTreasureChest = function () {
    const closedEl = document.getElementById("chest-closed");
    const openedEl = document.getElementById("chest-opened");
    if (closedEl) closedEl.style.display = "none";
    if (openedEl) openedEl.classList.add("is-open");
  };

  // =========================================================================
  // ADD TO JOURNAL (GOOGLE CALENDAR INTEGRATION)
  // =========================================================================
  window.addToJournal = function (eventNum) {
    const titleEl = document.getElementById(`event-${eventNum}-name`);
    const locEl = document.getElementById(`event-${eventNum}-loc`);
    const dateKey = eventNum === 2 ? "event_2_date" : "event_1_date";
    const endKey = eventNum === 2 ? "event_2_date_end" : "event_1_date_end";

    const rawStart = settings[dateKey] && settings[dateKey].value ? settings[dateKey].value : "2026-05-20T09:00";
    const rawEnd = settings[endKey] && settings[endKey].value ? settings[endKey].value : "";

    const startDate = new Date(rawStart);
    const validStart = isNaN(startDate.getTime()) ? new Date(2026, 4, 20, 9, 0) : startDate;
    const endDate = rawEnd ? new Date(rawEnd) : new Date(validStart.getTime() + 2 * 60 * 60 * 1000);
    const validEnd = isNaN(endDate.getTime()) ? new Date(validStart.getTime() + 2 * 60 * 60 * 1000) : endDate;

    const fmt = (d) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const eventTitle = `${titleEl ? titleEl.innerText : "Acara"} — ${document.getElementById("hero-names").innerText}`;
    const eventLoc = locEl ? locEl.innerText : "";

    const calUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      eventTitle
    )}&dates=${fmt(validStart)}/${fmt(validEnd)}&location=${encodeURIComponent(
      eventLoc
    )}&details=${encodeURIComponent("Undangan Digital — Interactive Adventure Quest")}`;

    window.open(calUrl, "_blank", "noopener,noreferrer");
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

  function finishLoading() {
    const loader = document.getElementById("app-loading");
    if (loader) {
      loader.classList.add("fade-out");
      setTimeout(() => loader.remove(), 550);
    }
  }

  const RELIGION_PRESETS = {
    islam: {
      showBismillah: true,
      openingGreeting: "Assalamualaikum Wr. Wb.",
      closingGreeting: "Wassalamualaikum Wr. Wb.",
      ayat: '"Dan diantara tanda-tanda (kebesaran)-Nya ialah Dia menciptakan pasangan-pasangan untukmu dari jenismu sendiri, agar kamu cenderung dan merasa tenteram kepadanya, dan Dia menjadikan di antaramu rasa kasih dan sayang. Sungguh, pada yang demikian itu benar-benar terdapat tanda-tanda (kebesaran Allah) bagi kaum yang berpikir."',
      source: "- QS. Ar-Rum 21 -",
      defaultEvent1: "Akad Nikah",
    },
    kristen: {
      showBismillah: false,
      openingGreeting: "Shalom, Salam Sejahtera",
      closingGreeting: "Tuhan Yesus Memberkati",
      ayat: '"Demikianlah mereka bukan lagi dua, melainkan satu. Karena itu, apa yang telah dipersatukan Allah, tidak boleh diceraikan manusia."',
      source: "- Matius 19:6 -",
      defaultEvent1: "Pemberkatan Nikah",
    },
    katolik: {
      showBismillah: false,
      openingGreeting: "Salam Damai Sejahtera dalam Kristus",
      closingGreeting: "Berkah Dalem, Tuhan Memberkati",
      ayat: '"Dan di atas semuanya itu: kenakanlah kasih, sebagai pengikat yang mempersatukan dan menyempurnakan."',
      source: "- Kolose 3:14 -",
      defaultEvent1: "Sakramen Perkawinan",
    },
    hindu: {
      showBismillah: false,
      openingGreeting: "Om Swastyastu",
      closingGreeting: "Om Shanti, Shanti, Shanti Om",
      ayat: '"Wahai pasangan suami-istri, semoga kalian tetap bersatu dan tidak pernah terpisahkan. Semoga kalian mencapai hidup penuh kebahagiaan, tinggal di rumah yang penuh kegembiraan bersama seluruh keturunanmu."',
      source: "- Rgveda X.85.42 -",
      defaultEvent1: "Upacara Pawiwahan",
    },
    buddha: {
      showBismillah: false,
      openingGreeting: "Namo Buddhaya",
      closingGreeting: "Sabbe Satta Bhavantu Sukhitatta",
      ayat: '"Dengan saling menjaga keharmonisan, kepercayaan, dan cinta kasih yang tulus, kebahagiaan sejati akan senantiasa menyertai kehidupan berumah tangga."',
      source: "- Dhammapada & Sigalovada Sutta -",
      defaultEvent1: "Pemberkatan Pernikahan",
    },
    khonghucu: {
      showBismillah: false,
      openingGreeting: "Wei De Dong Tian (Salam Kebajikan)",
      closingGreeting: "Shan Zai, Tian You",
      ayat: '"Keharmonisan dalam rumah tangga bagaikan alunan kecapi dan harpa yang merdu; di sanalah benih kebajikan, bakti, dan kebahagiaan tumbuh abadi."',
      source: "- Kitab Shi Jing (Sajak Agung) -",
      defaultEvent1: "Upacara Pernikahan",
    },
    umum: {
      showBismillah: false,
      openingGreeting: "Salam Sejahtera bagi Kita Semua",
      closingGreeting: "Terima Kasih atas Doa Restunya",
      ayat: '"Cinta sejati bukan tentang menemukan seseorang yang sempurna, melainkan belajar melihat seseorang yang tidak sempurna dengan cara yang sempurna."',
      source: "- Untaian Doa & Harapan -",
      defaultEvent1: "Upacara Pernikahan",
    },
  };

  function renderPage() {
    // Terapkan Tema (Warna Aksen, Font, Ornamen & Atmosfer) dari Editor
    if (typeof applyThemeFromSettings === "function") {
      applyThemeFromSettings(settings);
    }

    const rawType = (settings.type && settings.type.value ? String(settings.type.value) : "wedding").trim().toLowerCase();
    const isWedding = rawType !== "khitan" && rawType !== "khitanan";
    const religionKey = (settings.religion && settings.religion.value ? String(settings.religion.value) : "islam").trim().toLowerCase();
    const relCfg = RELIGION_PRESETS[religionKey] || RELIGION_PRESETS.islam;
    const tzLabel = (settings.timezone_label && settings.timezone_label.value) || "WITA";

    const groomFull = (settings.groom_name && settings.groom_name.value) || "Muhammad Nazril Mokodompit";
    const brideFull = (settings.bride_name && settings.bride_name.value) || "Cici Puspitasari Dakotalot";
    const groomNick = (settings.groom_nickname && settings.groom_nickname.value) || groomFull.split(" ")[0];
    const brideNick = (settings.bride_nickname && settings.bride_nickname.value) || brideFull.split(" ")[0];
    const khitanName = (settings.khitan_name && settings.khitan_name.value) || "Nama Anak";

    const shortNames = isWedding ? `${groomNick} & ${brideNick}` : khitanName;

    document.getElementById("page-title").innerText = `${shortNames} | Sacred Quest Invitation`;
    document.getElementById("open-names").innerText = shortNames;
    document.getElementById("hero-names").innerText = shortNames;
    document.getElementById("footer-names").textContent = shortNames;

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

    const bismillahEl = document.getElementById("bismillah-img");
    const openGreetEl = document.getElementById("profile-greeting");
    const closeGreetEl = document.getElementById("closing-greeting");
    const heroQuestTagEl = document.getElementById("hero-quest-tag");
    const wishInputEl = document.getElementById("wish-msg-input");
    const rsvpSubEl = document.getElementById("rsvp-subtitle");

    if (!isWedding) {
      if (bismillahEl) bismillahEl.style.display = religionKey === "islam" ? "block" : "none";
      if (openGreetEl) openGreetEl.innerText = relCfg.openingGreeting;
      if (closeGreetEl) closeGreetEl.innerText = relCfg.closingGreeting;
      if (heroQuestTagEl) heroQuestTagEl.innerText = "✦ Tasyakuran Khitanan ✦";
      if (wishInputEl) wishInputEl.placeholder = "Tuliskan doa dan ucapan terbaik untuk ananda...";
      if (rsvpSubEl) rsvpSubEl.innerText = "Tinggalkan pesan doa restu dan konfirmasikan kehadiran Anda pada acara khitanan putra kami.";

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
      if (bismillahEl) bismillahEl.style.display = relCfg.showBismillah ? "block" : "none";
      if (openGreetEl) openGreetEl.innerText = relCfg.openingGreeting;
      if (closeGreetEl) closeGreetEl.innerText = relCfg.closingGreeting;
      if (heroQuestTagEl) heroQuestTagEl.innerText = "✦ Main Quest Unlocked ✦";
      if (wishInputEl) wishInputEl.placeholder = "Tuliskan doa dan ucapan terbaik untuk kedua mempelai...";
      if (rsvpSubEl) rsvpSubEl.innerText = "Tinggalkan pesan doa restu dan konfirmasikan kehadiran Anda di catatan perjalanan kami.";

      document.getElementById("open-title").innerText = "The Wedding of";
      document.getElementById("hero-title").innerText = "The Wedding of";
      document.getElementById("intro-text").innerText = "Kami mengundang Bapak/Ibu/Saudara/i serta kerabat sekalian untuk menghadiri acara pernikahan kami";
      document.getElementById("ayat-text").innerText = relCfg.ayat;
      document.getElementById("ayat-source").innerText = relCfg.source;

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
    const rawEvent1Name = (settings.event_1_name && settings.event_1_name.value ? settings.event_1_name.value : "").trim();
    if (!isWedding && (!rawEvent1Name || rawEvent1Name === "Akad Nikah")) {
      document.getElementById("event-1-name").innerText = "Walimatul Khitan";
    } else if (isWedding && (!rawEvent1Name || rawEvent1Name === "Akad Nikah")) {
      document.getElementById("event-1-name").innerText = relCfg.defaultEvent1;
    } else if (rawEvent1Name) {
      document.getElementById("event-1-name").innerText = rawEvent1Name;
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
    const rawEvent2Name = (settings.event_2_name && settings.event_2_name.value ? settings.event_2_name.value : "").trim();
    if (!isWedding && (!rawEvent2Name || rawEvent2Name === "Resepsi")) {
      document.getElementById("event-2-name").innerText = "Syukuran Khitanan";
    } else if (rawEvent2Name) {
      document.getElementById("event-2-name").innerText = rawEvent2Name;
    }
    if (settings.event_2_loc && settings.event_2_loc.value) {
      document.getElementById("event-2-loc").innerText = settings.event_2_loc.value;
    }
    if (settings.event_2_entertainment) {
      const entVal = settings.event_2_entertainment.value;
      const entWrap = document.getElementById("event-2-entertainment-wrap");
      if (entVal && isEvent2Active) {
        document.getElementById("event-2-entertainment").innerText = entVal;
        entWrap.style.display = "flex";
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

    // Galeri Foto
    const galleryUrls = ["gallery_1", "gallery_2", "gallery_3", "gallery_4"]
      .map((k) => (settings[k] && settings[k].value ? sanitizeUrl(settings[k].value, "") : ""))
      .filter(Boolean);

    if (galleryUrls.length > 0) {
      const galleryContainer = document.getElementById("gallery-container");
      galleryContainer.innerHTML = "";
      galleryUrls.forEach((safeUrl, idx) => {
        const itemDiv = document.createElement("div");
        itemDiv.className = "item relic-item";

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

    // World Map & Lore (Cerita Cinta Dinamis dari Editor)
    loreChapters = [
      {
        tag: "Chapter I • First Encounter",
        title: (settings.lore_1_title && settings.lore_1_title.value) || "Pertemuan Tak Terduga",
        desc: (settings.lore_1_desc && settings.lore_1_desc.value) || "Setiap petualangan besar bermula dari satu langkah kecil. Di persimpangan waktu yang tak terduga, dua penjelajah saling bertukar sapa dan menyalakan lentera harapan yang pertama.",
        img: sanitizeUrl(settings.lore_1_img && settings.lore_1_img.value, "img/img2.jpg"),
      },
      {
        tag: "Chapter II • The Journey Together",
        title: (settings.lore_2_title && settings.lore_2_title.value) || "Menapaki Lembah & Waktu",
        desc: (settings.lore_2_desc && settings.lore_2_desc.value) || "Melalui musim demi musim, tawa dan doa menjadi kompas penuntun. Bersama-sama kami belajar arti kesabaran, kepercayaan, dan keteguhan hati untuk melangkah seiring sejalan.",
        img: sanitizeUrl(settings.lore_2_img && settings.lore_2_img.value, "img/img12.jpg"),
      },
      {
        tag: "Final Destination • The Sacred Vow",
        title: (settings.lore_3_title && settings.lore_3_title.value) || "Gerbang Babak Baru",
        desc: (settings.lore_3_desc && settings.lore_3_desc.value) || "Kini tiba saatnya mengikat janji suci di hadapan semesta dan keluarga tercinta. Sebuah awal dari petualangan abadi membangun mahligai rumah tangga yang penuh berkah.",
        img: sanitizeUrl(settings.lore_3_img && settings.lore_3_img.value, "img/img13.jpg"),
      },
    ];
    renderLoreChapter(activeLoreIdx);

    // Visibilitas Kolom (pada mode Khitanan, sembunyikan World Map & Lore Cerita Cinta)
    ["sec_lore_v", "sec_events_v", "sec_event_2_v", "sec_gallery_v", "sec_gift_v", "sec_wishes_v", "sec_turut_v"].forEach((key) => {
      const shouldHide = (settings[key] && settings[key].visible === false) || (!isWedding && key === "sec_lore_v");
      if (shouldHide) {
        document.querySelectorAll("." + key).forEach((el) => el.classList.add("hidden"));
      } else {
        document.querySelectorAll("." + key).forEach((el) => el.classList.remove("hidden"));
      }
    });
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

    btn.innerText = "Mengirim ke Guild...";
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
        showAlert("success", "Quest Tercatat!", "Ucapan & konfirmasi kehadiran Anda telah tersimpan.");
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
          container.innerHTML = '<p class="text-center small py-3" style="color: var(--text-muted);">Belum ada catatan petualang. Jadilah yang pertama menulis doa restu!</p>';
          return;
        }
        container.innerHTML = "";
        wishes.forEach((w) => {
          let cleanMsg = w.message || "";
          let statusText = w.attendance || "";
          const gCount = Number(w.guestCount) || 1;

          if (statusText === "Hadir" && gCount > 1) {
            statusText = `Hadir • ${gCount} Party`;
          }

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
              badge.style.background = "#1e7e68";
            } else if (statusText.includes("Tidak Hadir")) {
              badge.style.background = "#9b2c2c";
            } else {
              badge.style.background = "#b7791f";
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

  // =========================================================================
  // INTERACTIVE WORLD MAP & LORE WAYPOINTS
  // =========================================================================
  function initLoreMap() {
    const buttons = document.querySelectorAll(".waypoint-btn");
    buttons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const idx = Number(btn.getAttribute("data-chapter-idx")) || 0;
        buttons.forEach((b) => {
          b.classList.remove("active");
          b.setAttribute("aria-selected", "false");
        });
        btn.classList.add("active");
        btn.setAttribute("aria-selected", "true");
        renderLoreChapter(idx);
      });
    });
    renderLoreChapter(0);
  }

  // =========================================================================
  // CANVAS GOLDEN DUST & FIREFLIES (60FPS)
  // =========================================================================
  function initFirefliesCanvas() {
    const canvas = document.getElementById("fireflies-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const count = Math.min(48, Math.max(20, Math.floor(width / 32)));
    const particles = Array.from({ length: count }, (_, i) => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 2 + 0.8,
      vx: (Math.random() - 0.5) * 0.35,
      vy: -(Math.random() * 0.4 + 0.15),
      alpha: Math.random() * 0.6 + 0.25,
      phase: Math.random() * Math.PI * 2,
      color: i % 4 === 0 ? "79, 209, 197" : "246, 224, 94",
    }));

    window.addEventListener("resize", () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    function tick() {
      ctx.clearRect(0, 0, width, height);
      const pStyle = window.NAOZI_PARTICLE_STYLE || "fireflies";
      const palette =
        Array.isArray(window.NAOZI_PARTICLE_COLORS) && window.NAOZI_PARTICLE_COLORS.length === 2
          ? window.NAOZI_PARTICLE_COLORS
          : ["246, 224, 94", "79, 209, 197"];

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.phase += 0.028;

        if (pStyle === "petals") {
          p.x += Math.sin(p.phase) * 0.45 + 0.15;
          p.y += Math.abs(p.vy) * 1.15;
          if (p.y > height + 12) p.y = -12;
        } else if (pStyle === "sparkles") {
          p.x += p.vx * 0.35;
          p.y += p.vy * 0.45;
          if (p.y < -12) p.y = height + 12;
        } else {
          p.x += p.vx;
          p.y += p.vy;
          if (p.y < -12) p.y = height + 12;
        }

        if (p.x < -12) p.x = width + 12;
        if (p.x > width + 12) p.x = -12;

        const activeColor = i % 4 === 0 ? palette[1] : palette[0];
        const glowAlpha = p.alpha * (0.55 + 0.45 * Math.sin(p.phase));
        ctx.fillStyle = `rgba(${activeColor}, ${glowAlpha.toFixed(2)})`;
        ctx.shadowBlur = pStyle === "sparkles" ? 14 : 10;
        ctx.shadowColor = `rgba(${activeColor}, 0.85)`;

        if (pStyle === "sparkles") {
          const s = p.r * 2.4;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y - s);
          ctx.lineTo(p.x + s * 0.28, p.y - s * 0.28);
          ctx.lineTo(p.x + s, p.y);
          ctx.lineTo(p.x + s * 0.28, p.y + s * 0.28);
          ctx.lineTo(p.x, p.y + s);
          ctx.lineTo(p.x - s * 0.28, p.y + s * 0.28);
          ctx.lineTo(p.x - s, p.y);
          ctx.lineTo(p.x - s * 0.28, p.y - s * 0.28);
          ctx.closePath();
          ctx.fill();
        } else if (pStyle === "petals") {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.phase * 0.7);
          ctx.beginPath();
          ctx.ellipse(0, 0, p.r * 1.9, p.r * 0.95, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, pStyle === "lanterns" ? p.r * 1.35 : p.r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.shadowBlur = 0;
      window.requestAnimationFrame(tick);
    }
    window.requestAnimationFrame(tick);
  }

  // =========================================================================
  // PARALLAX, REVEAL & HUD REGION TRACKING
  // =========================================================================
  function initScrollAndHud() {
    const revealEls = document.querySelectorAll(".reveal-on-scroll");
    if ("IntersectionObserver" in window) {
      const revealObs = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              revealObs.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12 }
      );
      revealEls.forEach((el) => revealObs.observe(el));

      const regionObs = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const label = entry.target.getAttribute("data-hud-label");
              const id = entry.target.id;
              const hudLabelEl = document.getElementById("hud-region-label");
              if (label && hudLabelEl) hudLabelEl.textContent = label;
              document.querySelectorAll(".dock-item").forEach((item) => {
                item.classList.toggle("active", item.getAttribute("data-target") === id);
              });
            }
          });
        },
        { rootMargin: "-35% 0px -45% 0px" }
      );
      document.querySelectorAll(".realm-hud-region").forEach((sec) => regionObs.observe(sec));
    } else {
      revealEls.forEach((el) => el.classList.add("is-visible"));
    }

    let scrollTick = false;
    window.addEventListener(
      "scroll",
      () => {
        if (scrollTick) return;
        scrollTick = true;
        window.requestAnimationFrame(() => {
          const y = window.scrollY || 0;
          const progress = Math.min(y / Math.max(window.innerHeight, 1), 1.5);
          document.documentElement.style.setProperty("--hero-parallax-y", `${(y * 0.24).toFixed(1)}px`);
          document.documentElement.style.setProperty("--hero-zoom", (1.04 + progress * 0.08).toFixed(3));
          scrollTick = false;
        });
      },
      { passive: true }
    );
  }

  // =========================================================================
  // BOOTSTRAP INITIALIZATION
  // =========================================================================
  document.addEventListener("DOMContentLoaded", function () {
    formatTurutMengundang();
    initLoreMap();
    initFirefliesCanvas();
    initScrollAndHud();

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
    function completeInit() {
      try {
        renderPage();
      } catch (e) {
        console.error("Render error:", e);
      } finally {
        finishLoading();
        loadWishes();
      }
    }

    const safetyTimer = setTimeout(function () {
      if (!isDone) {
        isDone = true;
        completeInit();
      }
    }, 4500);

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
          completeInit();
        }
      })
      .catch((err) => {
        if (!isDone) {
          isDone = true;
          clearTimeout(safetyTimer);
          console.warn("Menggunakan pengaturan bawaan tema:", err.message);
          completeInit();
        }
      });
  });
})();
