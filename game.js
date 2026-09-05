import {
  BUILDINGS,
  UPGRADES,
  DISTRICTS,
  ACHIEVEMENTS,
  createState,
  derive,
  priceFor,
  affordableCount,
  buyBuilding,
  buyUpgrade,
  click,
  advance,
  claimQuest,
  currentQuest,
  collectGolden,
} from "./engine.js?v=3.1.0";
import {
  mountScene,
  updateScene,
  prepareSimit,
  updateGulls,
} from "./scene.js?v=3.1.0";
import {
  SAVE_KEY,
  readSave,
  saveState,
  saveBackup,
  replaceSave,
  clearSave,
  downloadBlob,
} from "./storage.js?v=3.1.0";
import { initSharing, openShare } from "./sharing.js?v=3.1.0";
import { initChallenge } from "./challenge.js?v=3.1.0";
import { createMusicController } from "./music.js?v=3.1.0";

const $ = (id) => document.getElementById(id);
const dom = Object.fromEntries(
  [...document.querySelectorAll("[id]")].map((el) => [el.id, el]),
);
const number = new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 1 });
const compact = new Intl.NumberFormat("tr-TR", {
  notation: "compact",
  maximumFractionDigits: 1,
});
const fmt = (n) =>
  n >= 1e15
    ? n.toExponential(1).replace(".", ",")
    : n >= 1e6
      ? compact.format(n)
      : number.format(n);
let state,
  readOnly = false,
  quantity = 1,
  lastFrame = performance.now(),
  lastDetail = 0;
let nextGolden = 45,
  goldenEnd = 0,
  lastSceneLevel = -1,
  lastGulls = -1,
  previousTitle = "";
let audioContext;
let musicController;
let selectedItem = { type: "building", id: "marti" };
let selectedArtKey = "";
const buildingNodes = new Map(),
  upgradeNodes = new Map(),
  achievementNodes = new Map();

function text(id, value) {
  const el = dom[id];
  const next = String(value);
  if (el.textContent !== next) el.textContent = next;
}

function toast(message) {
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = message;
  while (dom.toasts.children.length >= 3) dom.toasts.firstElementChild.remove();
  dom.toasts.append(el);
  setTimeout(() => el.remove(), 4500);
}

function persist(notify = false) {
  if (readOnly) return;
  const ok = saveState(state);
  text("saveStatus", ok ? "● Otomatik kayıt açık" : "⚠ Kayıt yapılamadı");
  dom.saveStatus.classList.toggle("is-error", !ok);
  text(
    "storageDetail",
    ok
      ? "İlerleme bu tarayıcıya kaydediliyor. Cihaz değiştirirken yedek dosyanı kullan."
      : "Tarayıcı depolaması kullanılamıyor. İlerlemeni kaybetmemek için Yedeği indir düğmesini kullan.",
  );
  if (notify)
    toast(
      ok
        ? "Fırının ve ilerlemen kaydedildi."
        : "Kayıt yapılamadı. Ayarlar’dan yedeğini indirebilirsin.",
    );
}

function feedback(result, message, save = true) {
  if (!result?.ok) return;
  if (message) toast(message);
  const earned = result.achievements || [];
  if (earned.length)
    toast(
      earned.length === 1
        ? `Başarım: ${earned[0].name}`
        : `${earned.length} yeni başarım koleksiyonuna eklendi.`,
    );
  if (result.districtChanged)
    toast(
      `${derive(state).district.name} kapılarını açtı. Üretim bonusun arttı!`,
    );
  render(true);
  if (save) persist();
}

function artwork(item, className) {
  const el = document.createElement("span");
  el.className = className;
  el.setAttribute("aria-hidden", "true");
  if (item.img) {
    const img = document.createElement("img");
    img.src = item.img;
    img.alt = "";
    img.draggable = false;
    el.append(img);
  } else el.textContent = item.icon;
  return el;
}

function buildInterface() {
  for (const [index, item] of BUILDINGS.entries()) {
    const button = document.createElement("button");
    button.className = "building-card";
    button.dataset.building = item.id;
    button.innerHTML = `<span class="item-copy"><strong>${item.name}</strong><span class="item-description">${item.desc}</span><span class="item-rate"></span></span><span class="item-buy"><span class="price"></span><span class="owned"></span></span>`;
    button.prepend(artwork(item, "item-art"));
    const slotIndex = document.createElement("span");
    slotIndex.className = "slot-index";
    slotIndex.setAttribute("aria-hidden", "true");
    slotIndex.textContent = String(index + 1).padStart(2, "0");
    button.append(slotIndex);
    button.addEventListener("click", () => {
      selectedItem = { type: "building", id: item.id };
      render(true);
    });
    buildingNodes.set(item.id, {
      button,
      rate: button.querySelector(".item-rate"),
      price: button.querySelector(".price"),
      owned: button.querySelector(".owned"),
    });
    dom.store.append(button);
  }
  for (const item of [...UPGRADES].sort((a, b) => a.cost - b.cost)) {
    const button = document.createElement("button");
    button.className = "upgrade-card";
    button.dataset.upgrade = item.id;
    button.innerHTML = `<span class="upgrade-copy"><strong>${item.name}</strong><small>${item.desc}</small></span><span class="price">${fmt(item.cost)} simit</span>`;
    button.prepend(artwork(item, "upgrade-icon"));
    button.addEventListener("click", () => {
      selectedItem = { type: "upgrade", id: item.id };
      render(true);
    });
    upgradeNodes.set(item.id, button);
    dom.upgradeShelf.append(button);
  }
  for (const item of ACHIEVEMENTS) {
    const el = document.createElement("article");
    el.className = "achievement-card is-locked";
    el.innerHTML = `<span class="achievement-icon" aria-hidden="true">${item.icon}</span><div><strong>${item.name}</strong><p>${item.desc}</p><small class="achievement-status">Henüz kazanılmadı</small></div>`;
    achievementNodes.set(item.id, el);
    dom.achievements.append(el);
  }
  DISTRICTS.forEach((district, i) => {
    const el = document.createElement("article");
    el.className = "district-card";
    el.innerHTML = `<span class="district-number">${String(i + 1).padStart(2, "0")}</span><div class="district-copy"><h3>${district.name}</h3><p>${district.description}</p><small>${fmt(district.threshold)} toplam simit</small></div><span class="district-state"></span>`;
    dom.districts.append(el);
    const stop = document.createElement("button");
    stop.className = "route-stop";
    stop.innerHTML = `<span class="route-dot" aria-hidden="true">${String(i + 1).padStart(2, "0")}</span><span>${district.name}</span>`;
    stop.setAttribute("aria-label", `${district.name} rotasını göster`);
    stop.addEventListener("click", () => {
      selectTab(dom.journeyTab);
      el.scrollIntoView({
        behavior: motionEnabled() ? "smooth" : "instant",
        block: "nearest",
      });
    });
    dom.routeStops.append(stop);
  });
}

function render(full = false) {
  const rates = derive(state);
  text("simitCount", fmt(Math.floor(state.simit)));
  text("spsCount", fmt(rates.sps));
  text("clickPower", `+${fmt(rates.clickPower)}`);
  const quest = currentQuest(state);
  if (quest) {
    text("questTitle", quest.title);
    text("questDescription", quest.description);
    text("questCount", `${quest.index + 1} / ${quest.total}`);
    text("questReward", `+${fmt(quest.reward)} simit ödül`);
    dom.questProgress.value = quest.progress;
    dom.questProgress.setAttribute(
      "aria-valuetext",
      `${fmt(quest.current)} / ${fmt(quest.target)}`,
    );
    dom.claimQuest.disabled = readOnly || !quest.ready;
    text(
      "claimQuest",
      quest.ready
        ? "Ödülü al ↗"
        : `${fmt(Math.min(quest.current, quest.target))} / ${fmt(quest.target)}`,
    );
  } else {
    text("questTitle", "Şehir seninle uyandı.");
    text(
      "questDescription",
      "Bütün görevler tamamlandı. Ekibini büyütmeye ve koleksiyonunu tamamlamaya devam et.",
    );
    text("questReward", "Eline sağlık, usta.");
    text("questCount", "TAMAMLANDI");
    text("claimQuest", "Bütün görevler tamam");
    dom.claimQuest.disabled = true;
    dom.questProgress.value = 1;
  }
  dom.buffBar.hidden = !rates.buffRemaining;
  if (rates.buffRemaining)
    text(
      "buffBar",
      `✦ Bereket: üretim ×2 · ${Math.ceil(rates.buffRemaining)} sn`,
    );
  text("levelTitle", rates.district.title);
  text(
    "levelRemaining",
    rates.nextDistrict
      ? `${rates.nextDistrict.name} için ${fmt(Math.max(0, rates.nextDistrict.threshold - state.total))} simit`
      : "Yedi semtin ustası oldun.",
  );
  dom.levelProgress.value = rates.districtProgress;
  text(
    "locationLabel",
    `${String(rates.districtIndex + 1).padStart(2, "0")} / ${rates.district.name}`,
  );
  text(
    "tapHint",
    state.owned.marti
      ? "Ekibin çalışıyor. Her dokunuş senden bir katkı."
      : state.simit >= BUILDINGS[0].cost
        ? "İlk martını dükkândan al. Birlikte üretin."
        : "İlk simidin için dokun. Martılar kokuyu aldı.",
  );
  if (lastSceneLevel !== rates.districtIndex) {
    updateScene(dom.skyline, rates.districtIndex);
    lastSceneLevel = rates.districtIndex;
    text(
      "levelBadge",
      ["I", "II", "III", "IV", "V", "VI", "VII"][rates.districtIndex],
    );
    dom.levelBadge.setAttribute(
      "aria-label",
      `Seviye ${rates.districtIndex + 1}`,
    );
    text("routeCount", `${rates.districtIndex + 1} / ${DISTRICTS.length} semt`);
    DISTRICTS.forEach((district, i) => {
      for (const el of [
        dom.districts.children[i],
        dom.routeStops.children[i],
      ]) {
        el.classList.toggle("is-current", i === rates.districtIndex);
        el.classList.toggle("is-complete", i < rates.districtIndex);
        if (i === rates.districtIndex) el.setAttribute("aria-current", "step");
        else el.removeAttribute("aria-current");
      }
      dom.districts.children[i].querySelector(".district-state").textContent =
        i < rates.districtIndex
          ? "✓ Keşfedildi"
          : i === rates.districtIndex
            ? "Buradasın"
            : "Sırada";
    });
  }
  if (lastGulls !== state.owned.marti) {
    updateGulls(dom.gullRing, state.owned.marti);
    lastGulls = state.owned.marti;
  }
  if (!full) return;
  BUILDINGS.forEach((item, i) => {
    const node = buildingNodes.get(item.id);
    const known = buildingKnown(item);
    const count =
      quantity === "max" ? affordableCount(state, item.id) : quantity;
    const cost = priceFor(state, item.id, quantity);
    node.button.classList.toggle("is-locked", !known);
    node.button.classList.toggle(
      "is-affordable",
      known &&
        !readOnly &&
        count > 0 &&
        Number.isFinite(cost) &&
        state.simit >= cost,
    );
    const selected =
      selectedItem.type === "building" && selectedItem.id === item.id;
    node.button.classList.toggle("is-selected", selected);
    node.button.setAttribute("aria-pressed", String(selected));
    const displayCost = Number.isFinite(cost)
      ? cost
      : priceFor(state, item.id, 1);
    node.price.textContent = known ? `${fmt(displayCost)} simit` : "Kilitli";
    node.owned.textContent = String(state.owned[item.id]);
    node.rate.textContent = `Tanesi +${fmt(rates.buildingSps[item.id])} / sn`;
    node.button.setAttribute(
      "aria-label",
      `${item.name} — incele. ${known ? `${fmt(displayCost)} simit` : "Henüz açılmadı"}. Sende ${state.owned[item.id]} adet var.`,
    );
  });
  let visibleUpgrades = 0;
  for (const item of UPGRADES) {
    const button = upgradeNodes.get(item.id);
    const learned = !!state.upgrades[item.id];
    const visible = learned || upgradeKnown(item);
    button.hidden = !visible;
    button.classList.toggle(
      "is-affordable",
      !learned && !readOnly && state.simit >= item.cost,
    );
    button.classList.toggle("is-learned", learned);
    button.querySelector(".price").textContent = learned
      ? "✓ Öğrenildi"
      : `${fmt(item.cost)} simit`;
    const selected =
      selectedItem.type === "upgrade" && selectedItem.id === item.id;
    button.classList.toggle("is-selected", selected);
    button.setAttribute("aria-pressed", String(selected));
    button.setAttribute(
      "aria-label",
      `${item.name} tarifini incele. ${learned ? "Öğrenildi" : `${fmt(item.cost)} simit`}.`,
    );
    if (visible) visibleUpgrades++;
  }
  dom.upgradeEmpty.hidden = visibleUpgrades > 0;
  text(
    "inventoryCount",
    `${BUILDINGS.filter((item) => state.owned[item.id] > 0).length} / 12 tür`,
  );
  renderInspector(rates);
  text("statTotal", fmt(state.total));
  text("statClicks", fmt(state.clicks));
  text("statBuildings", fmt(rates.totalBuildings));
  text("statGolden", fmt(state.golden));
  let achieved = 0;
  for (const item of ACHIEVEMENTS) {
    const has = !!state.achievements[item.id];
    const el = achievementNodes.get(item.id);
    el.classList.toggle("is-locked", !has);
    el.querySelector(".achievement-status").textContent = has
      ? "✓ Kazanıldı"
      : "Henüz kazanılmadı";
    if (has) achieved++;
  }
  text("achievementCount", `${achieved} / ${ACHIEVEMENTS.length} küçük gurur`);
  const title = `${fmt(Math.floor(state.simit))} simit · simit.cafe`;
  if (title !== previousTitle) {
    document.title = title;
    previousTitle = title;
  }
}

function buildingKnown(item) {
  const index = BUILDINGS.indexOf(item);
  return (
    index < 2 ||
    state.owned[item.id] > 0 ||
    state.owned[BUILDINGS[index - 1].id] > 0 ||
    state.total >= item.cost * 0.35
  );
}

function upgradeKnown(item) {
  return item.type === "building"
    ? state.owned[item.target] >= item.needCount
    : state.total >= item.cost / 2;
}

function renderInspector(rates) {
  const isBuilding = selectedItem.type === "building";
  const item = (isBuilding ? BUILDINGS : UPGRADES).find(
    (item) => item.id === selectedItem.id,
  );
  const known = isBuilding
    ? buildingKnown(item)
    : upgradeKnown(item) || state.upgrades[item.id];
  const purchased = !isBuilding && state.upgrades[item.id];
  const count = isBuilding
    ? quantity === "max"
      ? affordableCount(state, item.id)
      : quantity
    : 1;
  const cost = isBuilding ? priceFor(state, item.id, quantity) : item.cost;
  const displayCost = Number.isFinite(cost)
    ? cost
    : isBuilding
      ? priceFor(state, item.id, 1)
      : item.cost;
  const canBuy =
    !readOnly &&
    known &&
    !purchased &&
    count > 0 &&
    Number.isFinite(cost) &&
    state.simit >= cost;
  const artKey = `${selectedItem.type}:${item.id}`;
  if (selectedArtKey !== artKey) {
    dom.selectedIcon.replaceChildren(artwork(item, "inspector-art"));
    selectedArtKey = artKey;
  }
  text("selectedName", item.name);
  text(
    "selectedType",
    isBuilding
      ? known
        ? `ÜRETİCİ · ${state.owned[item.id]} ADET`
        : "HENÜZ KEŞFEDİLMEDİ"
      : "TARİF · KALICI GELİŞTİRME",
  );
  text("selectedDescription", item.desc);
  text(
    "selectedEffect",
    isBuilding
      ? `Tanesi +${fmt(rates.buildingSps[item.id])}/sn · Toplam ${fmt(rates.buildingSps[item.id] * state.owned[item.id])}/sn`
      : purchased
        ? "✓ Tarif öğrenildi"
        : item.type === "building"
          ? `${BUILDINGS.find((building) => building.id === item.target).name} üretimi ×${fmt(item.mult)}`
          : item.type === "click"
            ? `Temel dokunuş gücü ×${fmt(item.mult)}`
            : `Dokunuşa +%${fmt(item.pct * 100)} üretim`,
  );
  text(
    "selectedCost",
    Number.isFinite(displayCost)
      ? `${fmt(displayCost)} simit`
      : "En yüksek adet",
  );
  text(
    "buySelected",
    purchased
      ? "Öğrenildi"
      : !known
        ? "Kilitli"
        : isBuilding
          ? `Satın al ×${count || 1}`
          : "Tarifi öğren",
  );
  dom.buySelected.disabled = !canBuy;
  dom.buySelected.setAttribute(
    "aria-label",
    `${item.name}: ${isBuilding ? `${count || 1} adet satın al` : "tarifi öğren"}`,
  );
  let requirement = canBuy
    ? "Kalıcı üretim gücü"
    : purchased
      ? "Envanterine eklendi"
      : `Eksik: ${fmt(Math.max(0, displayCost - state.simit))} simit`;
  if (!known && isBuilding) {
    const previous = BUILDINGS[BUILDINGS.indexOf(item) - 1];
    requirement = `Önce ${previous.name} edin veya ${fmt(item.cost * 0.35)} toplam simit üret.`;
  }
  if (!Number.isFinite(displayCost))
    requirement = "Bu üreticinin adet sınırına ulaştın.";
  if (readOnly) requirement = "Oyun diğer sekmede açık.";
  text("selectedRequirement", requirement);
}

function motionEnabled() {
  return (
    state.settings.motion &&
    !matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}
function applySettings() {
  document.body.classList.toggle("reduce-motion", !state.settings.motion);
  dom.motionSetting.checked = state.settings.motion;
  dom.soundSetting.checked = state.settings.sound;
  dom.cursorSetting.checked = state.settings.cursor;
  document.body.classList.toggle("native-cursor", !state.settings.cursor);
  musicController?.setEnabled(Boolean(state.settings.music));
}

function chime() {
  if (!state.settings.sound) return;
  try {
    audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
    if (audioContext.state === "suspended") audioContext.resume();
    const oscillator = audioContext.createOscillator(),
      gain = audioContext.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(640, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(
      400,
      audioContext.currentTime + 0.06,
    );
    gain.gain.setValueAtTime(0.025, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.001,
      audioContext.currentTime + 0.08,
    );
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.08);
  } catch {
    /* Sound is optional. */
  }
}

function bake(event) {
  if (readOnly) return;
  const result = click(state);
  feedback(result, null, false);
  chime();
  if (!motionEnabled()) return;
  if (dom.floaters.children.length >= 16)
    dom.floaters.firstElementChild.remove();
  const rect = dom.floaters.getBoundingClientRect();
  const particle = document.createElement("span");
  particle.className = "floater";
  particle.textContent = `+${fmt(result.amount)}`;
  particle.style.left = `${event.detail ? event.clientX - rect.left : rect.width / 2}px`;
  particle.style.top = `${event.detail ? event.clientY - rect.top : rect.height / 2}px`;
  dom.floaters.append(particle);
  setTimeout(() => particle.remove(), 900);
}

function selectTab(tab) {
  for (const item of document.querySelectorAll("[role=tab]")) {
    const selected = item === tab;
    item.setAttribute("aria-selected", String(selected));
    item.tabIndex = selected ? 0 : -1;
    $(item.getAttribute("aria-controls")).hidden = !selected;
  }
  render(true);
}

function wireActions() {
  dom.buySelected.addEventListener("click", () => {
    if (readOnly || dom.buySelected.disabled) return;
    if (selectedItem.type === "building") {
      const item = BUILDINGS.find((item) => item.id === selectedItem.id);
      const result = buyBuilding(state, item.id, quantity);
      feedback(
        result,
        result.ok ? `${result.count} ${item.name} envanterine eklendi.` : null,
      );
    } else {
      const item = UPGRADES.find((item) => item.id === selectedItem.id);
      feedback(buyUpgrade(state, item.id), `${item.name} öğrenildi.`);
    }
  });
  const fullscreenState = () => {
    const active = Boolean(
      document.fullscreenElement || document.webkitFullscreenElement,
    );
    dom.fullscreenToggle.setAttribute("aria-pressed", String(active));
    dom.fullscreenToggle.textContent = active ? "⛶ Küçült" : "⛶ Tam ekran";
    dom.fullscreenToggle.setAttribute(
      "aria-label",
      active ? "Tam ekrandan çık" : "Tam ekranı aç",
    );
  };
  dom.fullscreenToggle.addEventListener("click", async () => {
    try {
      if (document.fullscreenElement || document.webkitFullscreenElement) {
        const exit = document.exitFullscreen || document.webkitExitFullscreen;
        await exit.call(document);
      } else {
        const request =
          document.documentElement.requestFullscreen ||
          document.documentElement.webkitRequestFullscreen;
        if (!request) throw new Error("Fullscreen unavailable");
        await request.call(document.documentElement);
      }
      fullscreenState();
    } catch {
      toast(
        "Bu tarayıcı tam ekran geçişine izin vermiyor. Oyun pencerenin tamamında oynanabilir.",
      );
    }
  });
  document.addEventListener("fullscreenchange", fullscreenState);
  document.addEventListener("webkitfullscreenchange", fullscreenState);
  fullscreenState();
  dom.bakeButton.addEventListener("click", bake);
  dom.bakeButton.addEventListener("keydown", (e) => {
    if (e.repeat && [" ", "Enter"].includes(e.key)) e.preventDefault();
  });
  dom.claimQuest.addEventListener("click", () => {
    if (!readOnly) {
      const result = claimQuest(state);
      feedback(
        result,
        result.ok ? `Görev tamam! +${fmt(result.amount)} simit.` : null,
      );
    }
  });
  dom.goldenButton.addEventListener("click", () => {
    if (readOnly || !goldenEnd) return;
    goldenEnd = 0;
    dom.goldenButton.hidden = true;
    feedback(
      collectGolden(state),
      "Bereket geldi! 45 saniye boyunca üretimin iki kat.",
    );
  });
  document.querySelectorAll("[data-quantity]").forEach((button) =>
    button.addEventListener("click", () => {
      quantity =
        button.dataset.quantity === "max"
          ? "max"
          : Number(button.dataset.quantity);
      document
        .querySelectorAll("[data-quantity]")
        .forEach((el) =>
          el.setAttribute("aria-pressed", String(el === button)),
        );
      render(true);
    }),
  );
  const tabs = [...document.querySelectorAll("[role=tab]")];
  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => selectTab(tab));
    tab.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key))
        return;
      event.preventDefault();
      const next =
        event.key === "Home"
          ? 0
          : event.key === "End"
            ? tabs.length - 1
            : (index + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) %
              tabs.length;
      selectTab(tabs[next]);
      tabs[next].focus();
    });
  });
  document
    .querySelectorAll("dialog .close-dialog")
    .forEach((button) =>
      button.addEventListener("click", () => button.closest("dialog").close()),
    );
  dom.settingsOpen.addEventListener("click", () =>
    dom.settingsDialog.showModal(),
  );
  dom.shareOpen.addEventListener("click", () =>
    openShare({ score: state.total, district: derive(state).district.name }),
  );
  dom.saveNow.addEventListener("click", () => persist(true));
  for (const [id, key] of [
    ["motionSetting", "motion"],
    ["soundSetting", "sound"],
    ["cursorSetting", "cursor"],
  ])
    dom[id].addEventListener("change", () => {
      if (readOnly) return;
      state.settings[key] = dom[id].checked;
      applySettings();
      persist();
    });
  dom.exportSave.addEventListener("click", () =>
    downloadBlob(
      new Blob([saveBackup(state)], { type: "application/json" }),
      "simit-cafe-yedek.json",
    ),
  );
  dom.importSave.addEventListener("click", () => {
    if (!readOnly) dom.saveFile.click();
  });
  dom.saveFile.addEventListener("change", async () => {
    const file = dom.saveFile.files[0];
    dom.saveFile.value = "";
    if (!file || readOnly) return;
    try {
      if (file.size > 1_000_000) throw new Error("Yedek dosyası çok büyük.");
      const data = JSON.parse(await file.text());
      if (
        !confirm(
          "Bu yedeği yükleyip mevcut ilerlemenin yerine geçirmek istiyor musun? Mevcut kaydın ayrıca yedeklenecek.",
        )
      )
        return;
      state = replaceSave(data);
      selectedItem = { type: "building", id: "marti" };
      lastSceneLevel = -1;
      lastGulls = -1;
      nextGolden = state.activeSeconds + 45;
      goldenEnd = 0;
      dom.goldenButton.hidden = true;
      applySettings();
      render(true);
      persist();
      toast("Yedeğin yüklendi. Fırın yeniden açık.");
    } catch {
      toast(
        "Yedek yüklenemedi. Geçerli bir SimitClicker JSON dosyası seç. Mevcut ilerlemen korundu.",
      );
    }
  });
  dom.resetGame.addEventListener("click", () => {
    if (
      readOnly ||
      !confirm("Bu tarayıcıdaki tüm oyun ilerlemen sıfırlanacak. Emin misin?")
    )
      return;
    try {
      clearSave();
      state = createState();
      selectedItem = { type: "building", id: "marti" };
      lastSceneLevel = -1;
      lastGulls = -1;
      nextGolden = 45;
      goldenEnd = 0;
      dom.goldenButton.hidden = true;
      applySettings();
      render(true);
      persist();
      dom.settingsDialog.close();
      toast("Fırının sıfırlandı. Yeni hikâyen başlıyor.");
    } catch {
      toast("Tarayıcı kaydı sıfırlanamadı. İlerlemen değiştirilmedi.");
    }
  });
}

function step() {
  const now = performance.now();
  const seconds = Math.min(1, Math.max(0, (now - lastFrame) / 1000));
  lastFrame = now;
  if (document.hidden || readOnly) return;
  const result = advance(state, seconds);
  if (result.achievements?.length || result.districtChanged)
    feedback(result, null);
  if (state.activeSeconds >= nextGolden) {
    goldenEnd = state.activeSeconds + 20;
    nextGolden = goldenEnd + 70 + Math.random() * 40;
    dom.goldenButton.hidden = false;
    text(
      "announcement",
      "Altın simit göründü. Bereket için 20 saniye içinde dokun.",
    );
  }
  if (goldenEnd && state.activeSeconds >= goldenEnd) {
    goldenEnd = 0;
    dom.goldenButton.hidden = true;
  }
  const full = now - lastDetail >= 500;
  if (full) lastDetail = now;
  render(full);
}

function start(writable) {
  readOnly = !writable;
  const loaded = readSave();
  state = loaded.state;
  nextGolden = state.activeSeconds + 45;
  dom.sessionNotice.hidden = !readOnly;
  dom.bakeButton.disabled = readOnly;
  for (const id of [
    "saveNow",
    "importSave",
    "resetGame",
    "motionSetting",
    "soundSetting",
    "cursorSetting",
  ])
    dom[id].disabled = readOnly;
  buildInterface();
  mountScene(dom.skyline);
  applySettings();
  musicController = createMusicController(dom.musicToggle, {
    enabled: state.settings.music,
    onChange: (enabled) => {
      state.settings.music = enabled;
      persist();
    },
    onError: toast,
  });
  wireActions();
  initSharing();
  initChallenge();
  prepareSimit(dom.bigSimit).then(() => {
    dom.challengeBake.querySelector("img").src = dom.bigSimit.src;
  });
  render(true);
  if (loaded.error) {
    toast(loaded.error);
    text("saveStatus", "⚠ Kayıt korunuyor");
  } else if (readOnly) text("saveStatus", "Diğer sekme açık");
  else {
    persist();
    if (loaded.migrated)
      toast(
        loaded.backedUp
          ? "Eski fırının yeni İstanbul’a taşındı. Önceki kaydın yedeklendi."
          : "Eski fırının yüklendi. Otomatik yedek için yer yok; Ayarlar’dan yedeğini indir.",
      );
  }
  setInterval(step, 100);
  setInterval(() => persist(), 10_000);
  const news = [
    "Karaköy’de bir fırın açıldı. İlk müşterisi bir martı.",
    "Kadıköy vapurunda bir simit ikiye bölündü. Muhabbet iki katına çıktı.",
    "Mahalle kedisi fırının önüne yerleşti. Kira olarak gölge istiyor.",
    "Martılar toplantı yaptı: daha çok susam, daha az poğaça.",
    "Çay hazır. Deniz yerinde. Bir simit eksik.",
    "Galata’dan haber var: İstanbul, simidin etrafında dönüyor.",
  ];
  let newsIndex = 0;
  setInterval(() => {
    if (!document.hidden) text("tickerText", news[++newsIndex % news.length]);
  }, 18_000);
  document.addEventListener("visibilitychange", () => {
    lastFrame = performance.now();
    if (document.hidden) {
      persist();
      document.title = "Fırının seni bekliyor · simit.cafe";
      previousTitle = "";
    } else render(true);
  });
  window.addEventListener("pagehide", () => persist());
  // If Web Locks is unavailable, another tab's save stops this writer instead of overwriting it.
  if (!navigator.locks)
    window.addEventListener("storage", (event) => {
      if (event.key !== SAVE_KEY || readOnly) return;
      readOnly = true;
      dom.sessionNotice.hidden = false;
      dom.bakeButton.disabled = true;
      render(true);
    });
}

if (navigator.locks) {
  navigator.locks
    .request(SAVE_KEY, { ifAvailable: true }, async (lock) => {
      start(!!lock);
      if (lock) await new Promise(() => {});
    })
    .catch((error) => {
      console.error("Fırın başlatılamadı", error);
      text("saveStatus", "Fırın açılamadı. Sayfayı yenile.");
    });
} else start(true);
