/**
 * Theme Engine: Color Presets, Dynamic Google Fonts, & Modular SVG Ornaments
 */
window.NAOZI_THEMES = {
  palettes: {
    "lilac-pink": {
      label: "Lilac Pink (Default)",
      primary: "#8785a2",
      secondary: "#ffc7c7",
      bg: "#ffe2e2",
      surface: "#f6f6f6",
    },
    "sage-green": {
      label: "Sage Botanical",
      primary: "#5f7a61",
      secondary: "#d5e2d5",
      bg: "#eef4ee",
      surface: "#ffffff",
    },
    "navy-gold": {
      label: "Royal Navy & Gold",
      primary: "#1e3a5f",
      secondary: "#d4af37",
      bg: "#f4f6f9",
      surface: "#ffffff",
    },
    "terracotta": {
      label: "Warm Terracotta",
      primary: "#a8573b",
      secondary: "#f0cbb8",
      bg: "#fbf0ea",
      surface: "#ffffff",
    },
    "maroon-classic": {
      label: "Maroon Classic",
      primary: "#7b2d3b",
      secondary: "#ead2d6",
      bg: "#fdf4f5",
      surface: "#ffffff",
    },
  },

  fontPairings: {
    "romantic-classic": {
      label: "Romantic Classic (Dancing Script + Open Sans)",
      heading: "Dancing Script",
      body: "Open Sans",
      googleUrl: "https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;600;700&family=Open+Sans:ital,wght@0,400;0,600;0,700;1,300;1,400&display=swap",
    },
    "modern-editorial": {
      label: "Modern Editorial (Playfair Display + Plus Jakarta Sans)",
      heading: "Playfair Display",
      body: "Plus Jakarta Sans",
      googleUrl: "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,700;1,500&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap",
    },
    "luxury-serif": {
      label: "Luxury Serif (Cormorant Garamond + Montserrat)",
      heading: "Cormorant Garamond",
      body: "Montserrat",
      googleUrl: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,600&family=Montserrat:wght@400;500;600;700&display=swap",
    },
    "heritage-serif": {
      label: "Heritage Classic (Cinzel Decorative + Lora)",
      heading: "Cinzel Decorative",
      body: "Lora",
      googleUrl: "https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700&family=Lora:ital,wght@0,400;0,600;1,400&display=swap",
    },
  },

  ornaments: {
    "wave-soft": "Gelombang Lembut (Default)",
    "floral-botanical": "Floral & Daun Minimalis",
    "islamic-arch": "Lengkung Islami (Arch)",
    "minimal-line": "Garis Geometris Modern",
  },
};

function loadDynamicFonts(headingFont, bodyFont) {
  const pairings = Object.values(window.NAOZI_THEMES.fontPairings);
  const matched = pairings.find(
    (p) => p.heading === headingFont || p.body === bodyFont
  );

  let fontUrl = matched ? matched.googleUrl : "";
  if (!fontUrl && (headingFont || bodyFont)) {
    const families = [headingFont, bodyFont]
      .filter(Boolean)
      .map((f) => `family=${encodeURIComponent(f)}:wght@400;600;700`);
    if (families.length > 0) {
      fontUrl = `https://fonts.googleapis.com/css2?${families.join("&")}&display=swap`;
    }
  }

  if (fontUrl) {
    let link = document.getElementById("dynamic-theme-fonts");
    if (!link) {
      link = document.createElement("link");
      link.id = "dynamic-theme-fonts";
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
    if (link.href !== fontUrl) {
      link.href = fontUrl;
    }
  }

  if (headingFont) {
    document.documentElement.style.setProperty("--font-heading", `"${headingFont}", cursive, serif`);
  }
  if (bodyFont) {
    document.documentElement.style.setProperty("--font-body", `"${bodyFont}", sans-serif`);
  }
}

function buildDividerSvg(styleType, variant, flip) {
  const rotateStyle = flip ? "transform: rotate(180deg);" : "";

  if (styleType === "minimal-line") {
    return `<div class="divider-minimal" style="${rotateStyle}"><span></span><i>✦</i><span></span></div>`;
  }

  if (styleType === "floral-botanical") {
    return `
      <svg class="bg-wakwak divider-svg" style="display:block; ${rotateStyle}" viewBox="0 0 1440 90" xmlns="http://www.w3.org/2000/svg">
        <path fill="var(--color-primary)" fill-opacity="0.16" d="M0,45 Q360,90 720,45 T1440,45 L1440,90 L0,90 Z"></path>
        <path fill="none" stroke="var(--color-primary)" stroke-opacity="0.45" stroke-width="2" d="M0,45 Q360,90 720,45 T1440,45"></path>
        <circle cx="720" cy="45" r="7" fill="var(--color-primary)"></circle>
        <ellipse cx="696" cy="42" rx="12" ry="5" transform="rotate(-18 696 42)" fill="var(--color-secondary)"></ellipse>
        <ellipse cx="744" cy="42" rx="12" ry="5" transform="rotate(18 744 42)" fill="var(--color-secondary)"></ellipse>
      </svg>`;
  }

  if (styleType === "islamic-arch") {
    return `
      <svg class="bg-wakwak divider-svg" style="display:block; ${rotateStyle}" viewBox="0 0 1440 100" xmlns="http://www.w3.org/2000/svg">
        <path fill="var(--color-primary)" fill-opacity="0.92" d="M0,100 L0,70 Q360,70 540,45 Q660,28 720,10 Q780,28 900,45 Q1080,70 1440,70 L1440,100 Z"></path>
        <path fill="none" stroke="var(--color-secondary)" stroke-width="3" d="M0,66 Q360,66 540,41 Q660,24 720,6 Q780,24 900,41 Q1080,66 1440,66"></path>
      </svg>`;
  }

  // Default: wave-soft
  if (variant === "secondary") {
    return `
      <svg class="bg-wakwak divider-svg" style="display:block; ${rotateStyle}" viewBox="0 0 1440 120" xmlns="http://www.w3.org/2000/svg">
        <path fill="var(--color-secondary)" d="M0,40 C240,95 480,95 720,48 C960,0 1200,10 1440,56 L1440,120 L0,120 Z"></path>
      </svg>`;
  }

  return `
    <svg class="bg-wakwak divider-svg" style="display:block; ${rotateStyle}" viewBox="0 0 1440 140" xmlns="http://www.w3.org/2000/svg">
      <path fill="url(#sw-grad-0)" d="M0,88 C240,140 480,20 720,64 C960,108 1200,32 1440,72 L1440,140 L0,140 Z"></path>
      <path fill="url(#sw-grad-1)" opacity="0.85" d="M0,108 C300,40 600,130 900,72 C1150,24 1320,88 1440,96 L1440,140 L0,140 Z"></path>
    </svg>`;
}

function renderOrnamentDividers(ornamentType) {
  const type = ornamentType || "wave-soft";
  document.body.classList.remove(
    "theme-wave-soft",
    "theme-floral-botanical",
    "theme-islamic-arch",
    "theme-minimal-line"
  );
  document.body.classList.add("theme-" + type);

  document.querySelectorAll(".ornament-divider").forEach((el) => {
    const variant = el.getAttribute("data-variant") || "primary";
    const flip = el.getAttribute("data-flip") === "true";
    const markup = buildDividerSvg(type, variant, flip);
    const parsed = new DOMParser().parseFromString(markup, "text/html");
    const node = parsed.body.firstElementChild;
    if (node) {
      el.replaceChildren(document.importNode(node, true));
    }
  });
}

function applyThemeFromSettings(settings) {
  const s = settings || {};
  const primary = (s.primary_color && s.primary_color.value) || "#8785a2";
  const secondary = (s.secondary_color && s.secondary_color.value) || "#ffc7c7";
  const bg = (s.bg_color && s.bg_color.value) || "#ffe2e2";
  const surface = (s.surface_color && s.surface_color.value) || "#f6f6f6";

  const root = document.documentElement;
  root.style.setProperty("--color-primary", primary);
  root.style.setProperty("--color-secondary", secondary);
  root.style.setProperty("--color-bg", bg);
  root.style.setProperty("--color-surface", surface);
  root.style.setProperty("--berem", primary);
  root.style.setProperty("--berem-text", primary);
  root.style.setProperty("--kulit", secondary);
  root.style.setProperty("--wakwak", bg);
  root.style.setProperty("--fee", surface);

  document.querySelectorAll(".wave-stop").forEach((stop) => {
    stop.setAttribute("stop-color", primary);
  });

  const headingFont = (s.theme_font_heading && s.theme_font_heading.value) || "Dancing Script";
  const bodyFont = (s.theme_font_body && s.theme_font_body.value) || "Open Sans";
  loadDynamicFonts(headingFont, bodyFont);

  const ornament = (s.theme_ornament && s.theme_ornament.value) || "wave-soft";
  renderOrnamentDividers(ornament);
}
