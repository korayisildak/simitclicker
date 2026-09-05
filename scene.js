// Istanbul's waterfront is drawn in SVG so it stays crisp on every screen.
// The ferry's movement is nested inside its fixed bridge-side position.
let sceneId = 0;
const imageJobs = new WeakMap();

function townhouse(x, top, width, color, roof = "gable", bay = false) {
  const bottom = 194;
  const center = width / 2;
  const roofline =
    roof === "gable"
      ? `<path d="M-2 ${top}L${center} ${top - 8}L${width + 2} ${top}Z" fill="#7f594c"/>
       <path d="M-2 ${top}L${center} ${top - 8}L${width + 2} ${top}" fill="none" stroke="#573f3b"/>`
      : `<path d="M-1 ${top - 3}H${width + 1}V${top + 1}H-1Z" fill="#52696a"/>`;
  let windows = "";
  for (let y = top + 8; y < bottom - 11; y += 13) {
    for (let col = 0; col < 2; col++) {
      const wx = 5 + col * (width - 13);
      windows += `<rect class="scene-window" x="${wx}" y="${y}" width="4.5" height="6.5" rx=".6"/>
        <path d="M${wx - 1} ${y + 7.5}h6.5" stroke="#f5ebd5" stroke-width="1"/>`;
    }
  }
  return `<g transform="translate(${x} 0)" stroke="#655c4f" stroke-width=".55">
    <path d="M0 ${top}h${width}V${bottom}H0Z" fill="${color}"/>
    <path d="M${width - 4} ${top}h4V${bottom}h-4Z" fill="#3c5151" fill-opacity=".12" stroke="none"/>
    ${roofline}
    <path d="M${width - 7} ${top - 4}v-8h3v10" fill="#a97c62" stroke="#6d5849"/>
    <g fill="#3d6870" stroke="none">${windows}</g>
    ${
      bay
        ? `<path d="M2 ${top + 8}h${width - 4}v17H2Z" fill="${color}"/>
      <path d="M1 ${top + 7}h${width - 2}M4 ${top + 25}l2 4m${width - 12} -4-2 4" fill="none" stroke="#6e5749"/>
      <path d="M6 ${top + 12}h4v8H6Zm${width - 16} 0h4v8h-4Z" class="scene-window" fill="#3d6870" stroke="none"/>`
        : ""
    }
    <path d="M${center - 3} ${bottom}v-10q3-4 6 0v10" fill="#425c5b" stroke="none"/>
    <path d="M0 ${bottom - 1}h${width}" stroke="#9c947c"/>
  </g>`;
}

/** Mount once. All architecture is visible from the first level. */
export function mountScene(svg) {
  if (!svg) return;
  const id = `istanbul-${++sceneId}`;
  svg.setAttribute("viewBox", "0 0 800 250");
  svg.setAttribute("preserveAspectRatio", "xMidYMax meet");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  svg.classList.add("istanbul-scene");
  svg.innerHTML = `
    <defs>
      <linearGradient id="${id}-water" x1="0" y1="0" x2="0" y2="1">
        <stop stop-color="#73a8af"/><stop offset="1" stop-color="#b6d2cc"/>
      </linearGradient>
      <linearGradient id="${id}-stone" x1="0" y1="0" x2="1" y2="0">
        <stop stop-color="#d6c3a1"/><stop offset=".42" stop-color="#f0e3c5"/><stop offset="1" stop-color="#b6a789"/>
      </linearGradient>
      <linearGradient id="${id}-lead" x1="0" y1="0" x2="1" y2="1">
        <stop stop-color="#6c8784"/><stop offset="1" stop-color="#344f57"/>
      </linearGradient>
      <pattern id="${id}-masonry" width="14" height="8" patternUnits="userSpaceOnUse">
        <path d="M0 8h14M7 0v4M0 4h14M0 4v4M14 4v4" fill="none" stroke="#80765e" stroke-width=".45" stroke-opacity=".27"/>
      </pattern>
    </defs>
    <style>
      .istanbul-scene .scene-ferry { animation: istanbul-ferry-drift 12s ease-in-out infinite alternate; }
      .istanbul-scene .scene-window { fill: #46686a; transition: fill 1.5s ease; }
      .istanbul-scene[data-level="2"] .scene-window,
      .istanbul-scene[data-level="3"] .scene-window,
      .istanbul-scene[data-level="4"] .scene-window,
      .istanbul-scene[data-level="5"] .scene-window,
      .istanbul-scene[data-level="6"] .scene-window { fill: #e2b35c; }
      .istanbul-scene .scene-light { opacity: 0; transition: opacity 1.5s ease; }
      .istanbul-scene[data-level="3"] .scene-light,
      .istanbul-scene[data-level="4"] .scene-light,
      .istanbul-scene[data-level="5"] .scene-light,
      .istanbul-scene[data-level="6"] .scene-light { opacity: 1; }
      @keyframes istanbul-ferry-drift { from { transform: translateX(-3px); } to { transform: translateX(3px); } }
      .reduce-motion .istanbul-scene *, .istanbul-scene.reduce-motion * { animation: none !important; transition: none !important; }
      @media (prefers-reduced-motion: reduce) { .istanbul-scene * { animation: none !important; transition: none !important; } }
    </style>

    <!-- Each roof belongs to a building; there is no opaque hill or fog layer. -->
    <g stroke-linejoin="round">
      ${townhouse(-8, 160, 27, "#cda67d")}
      ${townhouse(19, 151, 27, "#ba7e64", "flat", true)}
      ${townhouse(47, 163, 25, "#d8c6a4")}
      ${townhouse(73, 145, 29, "#87a197", "gable", true)}
      ${townhouse(144, 151, 26, "#cb977b", "flat")}
      ${townhouse(171, 163, 29, "#b1b69c", "gable", true)}
      ${townhouse(360, 160, 27, "#d7b587")}
      ${townhouse(388, 151, 24, "#c1876c", "flat", true)}
      ${townhouse(413, 166, 24, "#86a29b")}
      ${townhouse(438, 160, 29, "#d5be98", "flat")}
      ${townhouse(685, 177, 23, "#d6b38e", "flat")}
      ${townhouse(710, 169, 25, "#98aca0")}
      ${townhouse(764, 166, 23, "#c79078", "flat")}
      ${townhouse(789, 175, 25, "#c7bca1")}
    </g>

    <!-- Galata: stone courses, circular gallery, copper roof and narrow arches. -->
    <g stroke="#6e6653" stroke-width=".7" stroke-linejoin="round">
      <path d="M105 194l3-65h31l4 65Z" fill="url(#${id}-stone)"/>
      <path d="M105 194l3-65h31l4 65Z" fill="url(#${id}-masonry)" stroke="none"/>
      <path d="M105 132h36l-2-8h-31Z" fill="#b5a384"/>
      <path d="M106 120q18-5 35 0v7q-18 4-35 0Z" fill="#dfcdab"/>
      <path d="M104 119h39v3h-39Z" fill="#7c7a65"/>
      <path d="M107 117l16-28 17 28Z" fill="url(#${id}-lead)"/>
      <path d="M123 90v-7" stroke="#b88b40" stroke-width="1.2"/>
      <circle cx="123" cy="82" r="1.3" fill="#b88b40" stroke="none"/>
      <path d="M123 93l-5 23M124 93l6 23" fill="none" stroke="#8ea097" stroke-width=".6"/>
      <path d="M107 128q17 5 34 0M107 134h33" fill="none"/>
      <path d="M111 121v6m5-7v8m6-8v8m6-8v8m6-8v7m5-7v6" fill="none" stroke-width="1"/>
      <g class="scene-window" stroke="none">
        <path d="M112 147v-5q2.5-5 5 0v5Zm10 0v-5q2.5-5 5 0v5Zm10 0v-5q2.5-5 5 0v5Z"/>
        <path d="M111 166v-7q3-5 6 0v7Zm12 0v-7q3-5 6 0v7Zm11-1v-6q2-4 4 0v6Z"/>
      </g>
      <path d="M120 194v-14q4-7 8 0v14" fill="#536a64"/>
      <path d="M103 192h42v3h-42Z" fill="#ac9f81"/>
    </g>

    <!-- A compact, tiered mosque profile with a courtyard arcade. -->
    <g stroke="#667365" stroke-width=".65" stroke-linejoin="round">
      <path d="M218 192v-31h99v31Z" fill="#d8caaa"/>
      <path d="M226 167v-14h82v14" fill="#e8ddc0"/>
      <path d="M236 153q4-22 19-24h29q15 3 18 24Z" fill="#c8bea1"/>
      <path d="M239 143q3-29 31-31q26 2 29 31Z" fill="url(#${id}-lead)"/>
      <path d="M240 143h59v3h-59Z" fill="#abb39d"/>
      <path d="M270 114v-9m-2 1h4" stroke="#af853b" stroke-width="1.2"/>
      <circle cx="270" cy="103" r="1.4" fill="#bf954b" stroke="none"/>
      <path d="M269 115q-13 5-17 27M271 115q13 5 17 27" fill="none" stroke="#92a398"/>
      <path d="M218 164q1-18 17-20q18 2 19 20Zm70 0q1-18 17-20q17 2 18 20Z" fill="url(#${id}-lead)"/>
      <path d="M208 180q1-14 13-15q13 1 14 15Zm32 0q1-14 13-15q13 1 14 15Zm32 0q1-14 13-15q13 1 14 15Zm32 0q1-14 13-15q13 1 14 15Z" fill="#728a80"/>
      <path d="M203 181h134v13H203Z" fill="#e7dac0"/>
      <g class="scene-window" stroke="none">
        <path d="M211 194v-7q4-7 8 0v7Zm17 0v-7q4-7 8 0v7Zm17 0v-7q4-7 8 0v7Zm17 0v-7q4-7 8 0v7Zm17 0v-7q4-7 8 0v7Zm17 0v-7q4-7 8 0v7Zm17 0v-7q4-7 8 0v7Z"/>
        <path d="M252 153v-4q2-4 4 0v4Zm10 0v-4q2-4 4 0v4Zm10 0v-4q2-4 4 0v4Zm10 0v-4q2-4 4 0v4Z"/>
      </g>
      <g fill="#dfd5b8">
        <path d="M205 194l2-76h6l2 76Zm123 0 2-76h6l2 76Z"/>
        <path d="M205 118h10l-2-5h-6Zm123 0h10l-2-5h-6Z" fill="#b0b69d"/>
        <path d="M207 113l3-17 3 17Zm123 0 3-17 3 17Z" fill="#46646a"/>
        <path d="M203 142h14l-2 4h-10Zm123 0h14l-2 4h-10Z" fill="#b8b59a"/>
        <path d="M205 140h10m-9-3v5m4-5v5m4-5v5M328 140h10m-9-3v5m4-5v5m4-5v5" fill="none" stroke="#758174"/>
        <path d="M210 97v-4m123 4v-4" stroke="#bf954b"/>
      </g>
    </g>

    <!-- A few cypresses and quayside lamps, separated from the rooflines. -->
    <g fill="#446a61">
      <path d="M183 194q-8-10 0-28q8 18 0 28Zm160 0q-8-14 0-36q9 24 0 36Zm12 0q-7-12 0-29q7 17 0 29Zm111 0q-5-10 0-22q6 13 0 22Z"/>
    </g>
    <path d="M0 194h475v5H0Zm683 0h117v5H683Z" fill="#b6b89c"/>
    <path d="M0 194h475m208 0h117" fill="none" stroke="#667c6c" stroke-width="1.5"/>

    <!-- Suspension bridge: calm horizontal deck and physically hung cables. -->
    <g fill="none" stroke="#49666b" stroke-linejoin="round">
      <path d="M491 199V121h9v78M654 199V121h9v78" stroke-width="3.2"/>
      <path d="M491 130h9m154 0h9M491 143h9m154 0h9" stroke-width="1.8"/>
      <path d="M456 179Q481 157 495 122Q577 210 658 122Q678 163 705 179" stroke-width="1.5"/>
      <path d="M466 170v10m14-26v26m28-45v45m15-32v32m15-22v22m15-16v16m15-12v12m15-11v11m15-13v13m15-19v19m15-27v27m15-39v39m27-34v34m15-15v15m13-5v5" stroke-width=".7"/>
      <path d="M452 182h257" stroke-width="4"/>
      <path d="M452 179h257" stroke="#96b2a7" stroke-width="1.2"/>
      <path class="scene-light" d="M455 179h249" stroke="#e9c985" stroke-width="1.2" stroke-dasharray="2 7"/>
    </g>

    <!-- The Bosphorus is open water, not a mist layer. -->
    <path d="M0 199H800V250H0Z" fill="url(#${id}-water)"/>
    <path d="M0 201h470m221 0h109" stroke="#d5dfcb" stroke-width="1"/>
    <g fill="none" stroke="#e6ead6" stroke-linecap="round" stroke-width="1.3">
      <path d="M16 211h39m33 12h31m31-17h26m52 8h56m39 17h28m30-21h43m46 19h47m30-17h24m79 13h39m44-17h29m22 25h36"/>
      <path d="M41 240h61m24-8h43m37 11h27m51-21h33m50 21h59m83-6h31m63 7h51m43-6h43m35 8h18" stroke-width=".8"/>
    </g>
    <g fill="none" stroke="#568f96" stroke-linecap="round" stroke-width="1">
      <path d="M5 227h21m35-9h12m61-4h19m44 13h43m40-18h31m67 11h19m26-15h13m13 35h16m51-18h19m115-15h26m32 28h34m40-17h19m45 6h28"/>
    </g>

    <!-- Maiden's Tower stands on its own small island, at the far right. -->
    <g transform="translate(736 0)" stroke="#69705b" stroke-width=".7" stroke-linejoin="round">
      <path d="M-27 211l10-6h39l9 6Z" fill="#9b9f86"/>
      <path d="M-17 205v-14h37v14Z" fill="#d8cbad"/>
      <path d="M-20 191l8-6h26l10 6Z" fill="#805e50"/>
      <path d="M-6 199v-34h15v34Z" fill="url(#${id}-stone)"/>
      <path d="M-10 165h23v-4h-23Z" fill="#a8a98c"/>
      <path d="M-6 161v-9h15v9Z" fill="#e6d8ba"/>
      <path d="M-8 152l10-6 10 6Z" fill="#496c6d"/>
      <path d="M2 146v-13" stroke="#627564"/>
      <path d="M2 134h8l-2 3H2Z" fill="#bf6550" stroke="none"/>
      <path d="M-7 164v-5m5 5v-5m5 5v-5m5 5v-5m4 5v-5"/>
      <g class="scene-window" stroke="none">
        <path d="M-3 181v-6q2-3 4 0v6Zm7 0v-6q2-3 4 0v6ZM-3 157v-3h3v3Zm7 0v-3h3v3Z"/>
      </g>
      <path d="M-11 205v-8h4v8m16 0v-8h4v8" fill="#687f72" stroke="none"/>
      <path d="M-22 211h48m-18 5h-16m-10 4h34" fill="none" stroke="#598e90"/>
    </g>

    <!-- Fixed under the bridge; the nested motion is only six SVG units wide. -->
    <g transform="translate(550 207)">
      <g class="scene-ferry">
        <path d="M-8 10h80m-66 4h51" stroke="#e8ecda" stroke-linecap="round" fill="none"/>
        <path d="M0 2h65l-9 10H12Z" fill="#f5ead2" stroke="#3e656a" stroke-width=".8"/>
        <path d="M8 3h53l-3 3H11Z" fill="#b7614f"/>
        <path d="M10-10h39l7 12H6Z" fill="#faf1dc" stroke="#557576" stroke-width=".6"/>
        <path d="M16-15h27v5H16Z" fill="#eee0bd"/>
        <path d="M27-22h7v7h-7Z" fill="#e4c17f"/><path d="M26-22h9v3h-9Z" fill="#42656a"/>
        <path d="M45-10v-11m0 2h6" fill="none" stroke="#537776" stroke-width=".8"/>
        <path d="M9-3h43M13-9h37" fill="none" stroke="#526f70" stroke-width="1"/>
        <g fill="#496d77">
          <path d="M14-8h5v4h-5Zm9 0h5v4h-5Zm9 0h5v4h-5Zm9 0h5v4h-5Z"/>
          <path d="M20-14h6v3h-6Zm10 0h6v3h-6Z"/>
        </g>
        <circle cx="49" cy="0" r="2.1" fill="#f4e8ce" stroke="#bf6652" stroke-width="1.2"/>
        <path d="M9 1h39" stroke="#527575" stroke-width=".6"/>
      </g>
    </g>

    <g fill="none" stroke="#65847c" stroke-width="1.2" stroke-linecap="round">
      <path d="M47 120q5-5 10 0q5-5 10 0M372 126q4-4 8 0q4-4 8 0M691 110q5-5 10 0q5-5 10 0"/>
    </g>`;
  updateScene(svg, 0);
}

/** Progress brings warm windows and bridge lights, without hiding landmarks. */
export function updateScene(svg, levelIndex = 0) {
  if (!svg) return;
  const level = Math.min(6, Math.max(0, Math.floor(Number(levelIndex) || 0)));
  if (svg.dataset.level !== String(level)) svg.dataset.level = String(level);
}

/** Make the supplied simit photo transparent once; failed image loads stay usable. */
export function prepareSimit(element) {
  if (!element) return Promise.resolve("");
  if (imageJobs.has(element)) return imageJobs.get(element);
  const job = new Promise((resolve) => {
    const source = element.currentSrc || element.src;
    const image = new Image();
    const done = (url = source) => {
      element.classList.add("ready");
      resolve(url);
    };
    image.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const context = canvas.getContext("2d", { willReadFrequently: true });
        if (!context) return done();
        context.drawImage(image, 0, 0);
        const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
        const data = pixels.data;
        for (let i = 0; i < data.length; i += 4) {
          if (!data[i + 3]) continue;
          const white = Math.min(data[i], data[i + 1], data[i + 2]);
          if (white >= 248) data[i + 3] = 0;
          else if (white > 230)
            data[i + 3] = Math.min(
              data[i + 3],
              Math.round(((248 - white) / 18) * 255),
            );
        }
        context.putImageData(pixels, 0, 0);
        const url = canvas.toDataURL("image/png");
        element.src = url;
        done(url);
      } catch {
        done();
      }
    };
    image.onerror = () => done();
    if (source) image.src = source;
    else done("");
  });
  imageJobs.set(element, job);
  return job;
}

/** A quiet, capped flock. The caller places this decorative ring over the simit. */
export function updateGulls(container, count = 0) {
  if (!container) return;
  const visible = Math.min(7, Math.max(0, Math.floor(Number(count) || 0)));
  if (container.dataset.gulls === String(visible)) return;
  container.dataset.gulls = String(visible);
  container.setAttribute("aria-hidden", "true");
  container.style.pointerEvents = "none";
  const fragment = document.createDocumentFragment();
  const angles = [-32, 160, 73, 225, 20, 120, 275];
  for (let i = 0; i < visible; i++) {
    const angle = (angles[i] * Math.PI) / 180;
    const gull = document.createElement("img");
    gull.src = "img/marti.webp";
    gull.alt = "";
    gull.draggable = false;
    gull.className = "scene-gull";
    gull.style.cssText = `position:absolute;left:${50 + Math.cos(angle) * 43}%;top:${50 + Math.sin(angle) * 43}%;width:${i % 2 ? 33 : 38}px;height:auto;transform:translate(-50%,-50%) ${i % 2 ? "scaleX(-1)" : ""};filter:drop-shadow(0 2px 1px #253c3920);`;
    fragment.appendChild(gull);
  }
  container.replaceChildren(fragment);
}
