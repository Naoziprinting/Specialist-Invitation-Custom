// Inisialisasi Owl Carousel (dapat dipanggil ulang setelah data galeri dinamis dimuat)
function initGalleryCarousel() {
  if (typeof $ === "undefined" || !$.fn.owlCarousel) return;
  const $carousel = $(".owl-carousel");
  if (!$carousel.length) return;

  if ($carousel.hasClass("owl-loaded")) {
    $carousel.trigger("destroy.owl.carousel");
    $carousel.removeClass("owl-loaded owl-drag");
  }

  $carousel.owlCarousel({
    loop: true,
    nav: true,
    margin: 15,
    autoplay: true,
    autoplayHoverPause: true,
    autoplayTimeout: 2500,
    responsive: {
      0: { items: 1, dots: true },
      600: { items: 2, dots: true },
      1000: { items: 3, dots: true },
    },
  });
}

$(document).ready(function () {
  initGalleryCarousel();
});

// Helper salin teks ke clipboard dengan fallback aman untuk mobile & desktop
function copyTextToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
  }
  return Promise.resolve(fallbackCopy(text));
}

function fallbackCopy(text) {
  const temp = document.createElement("textarea");
  temp.value = text;
  temp.style.position = "fixed";
  temp.style.opacity = "0";
  document.body.appendChild(temp);
  temp.focus({ preventScroll: true });
  temp.select();
  try {
    document.execCommand("copy");
  } catch (e) {
    console.warn("Copy failed:", e);
  }
  document.body.removeChild(temp);
}

// Copy nomor rekening
function copyAcc() {
  const rek1 = document.getElementById("rek1");
  const accVal = rek1 ? rek1.value : "";
  if (!accVal) return;

  copyTextToClipboard(accVal).then(() => {
    if (typeof Swal !== "undefined") {
      Swal.fire({
        icon: "success",
        title: "No. Rekening Berhasil Disalin",
        text: accVal,
        showConfirmButton: false,
        timer: 1500,
      });
    } else {
      alert("No. Rekening disalin ke clipboard: " + accVal);
    }
  });
}

// Audio Player Control dengan Auto-Fallback Multi-Sumber
window.currentInvitationType = "wedding";
window.userMutedAudio = false;

function getAudioCandidates(isWedding) {
  const defaults = isWedding
    ? ["audio/audio.mp3", "assets/music.mp3"]
    : ["assets/music.mp3", "audio/audio.mp3"];
  if (window.customMusicUrl && typeof window.customMusicUrl === "string") {
    const clean = window.customMusicUrl.trim();
    if (clean && !defaults.includes(clean)) {
      return [clean, ...defaults];
    }
  }
  return defaults;
}

function updateAudioButtons(isPlaying) {
  const btnPlay = document.getElementById("btn-play-audio");
  const btnStop = document.getElementById("btn-stop-audio");
  if (btnPlay) btnPlay.classList.toggle("active-audio", isPlaying);
  if (btnStop) btnStop.classList.toggle("active-audio", !isPlaying);
}

function setAudioTrackByType(isWedding, shouldAutoPlay, customUrl) {
  window.currentInvitationType = isWedding ? "wedding" : "khitan";
  if (customUrl !== undefined) {
    window.customMusicUrl = customUrl || "";
  }
  const lagu = document.getElementById("lagu");
  if (!lagu) return;

  const candidates = getAudioCandidates(isWedding);
  const targetSrc = candidates[0];
  const currentAttrSrc = (lagu.getAttribute("src") || "").trim();
  const hasLoadError = Boolean(lagu.error) || lagu.networkState === 3;

  // Jangan mengganggu audio yang sudah berjalan jika sumbernya sama
  if (currentAttrSrc === targetSrc && !hasLoadError) {
    if (shouldAutoPlay && lagu.paused && !window.userMutedAudio) {
      playAudio(0);
    }
    return;
  }

  lagu.setAttribute("src", targetSrc);
  lagu.load();
  if (shouldAutoPlay && !window.userMutedAudio) {
    playAudio(0);
  }
}

function playAudio(fallbackIndex) {
  const idx = typeof fallbackIndex === "number" ? fallbackIndex : 0;
  const lagu = document.getElementById("lagu");
  if (!lagu) return;

  window.userMutedAudio = false;
  const isWedding = window.currentInvitationType !== "khitan";
  const candidates = getAudioCandidates(isWedding);
  const currentAttrSrc = (lagu.getAttribute("src") || "").trim();

  const chosenSrc = candidates[idx] || candidates[0];
  if (currentAttrSrc !== chosenSrc) {
    lagu.setAttribute("src", chosenSrc);
    lagu.load();
  }

  lagu.muted = false;
  lagu.volume = 1.0;

  const playPromise = lagu.play();
  if (playPromise !== undefined) {
    playPromise
      .then(() => {
        updateAudioButtons(true);
      })
      .catch((err) => {
        const isSourceError =
          err.name === "NotSupportedError" ||
          err.name === "AbortError" ||
          Boolean(lagu.error) ||
          lagu.networkState === 3;

        if (isSourceError && idx + 1 < candidates.length) {
          console.warn(
            `Sumber audio "${lagu.getAttribute("src")}" gagal dimuat, mencoba cadangan "${candidates[idx + 1]}"...`
          );
          playAudio(idx + 1);
          return;
        }

        // Jika diblokir autoplay policy browser, coba putar lagi pada interaksi sentuh/klik berikutnya
        if (err.name === "NotAllowedError" && !window.userMutedAudio) {
          const resumeOnce = () => {
            if (!window.userMutedAudio && lagu.paused) {
              lagu.play().then(() => updateAudioButtons(true)).catch(() => {});
            }
          };
          document.addEventListener("pointerdown", resumeOnce, { once: true });
        }

        console.warn(
          `Pemutaran audio tertahan pada sumber "${lagu.currentSrc || lagu.getAttribute("src")}":`,
          err
        );
        updateAudioButtons(false);
      });
  } else {
    updateAudioButtons(true);
  }
}

function stopAudio() {
  const lagu = document.getElementById("lagu");
  if (!lagu) return;
  window.userMutedAudio = true;
  lagu.pause();
  updateAudioButtons(false);
}
