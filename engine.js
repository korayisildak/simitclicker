/** Pure, deterministic game rules. Actions mutate their supplied state; no DOM or timers. */
export const MAX_CURRENCY = 1e100;
export const MAX_OWNED = 1000;
const GROWTH = 1.15;
const GOLDEN_DURATION = 45;

export const BUILDINGS = [
  {
    id: "marti",
    name: "Martı",
    icon: "🕊️",
    img: "img/marti.webp",
    cost: 12,
    sps: 0.4,
    desc: "İlk ortağın hazır. Payına düşen susamla her saniye çalışır.",
    ups: ["Cesur Gaga", "Susam Radarı", "Poyraz Kanadı"],
  },
  {
    id: "tabla",
    name: "Simitçi Tablası",
    icon: "🧺",
    img: "img/tabla.png",
    cost: 75,
    sps: 2.5,
    desc: "Bir tabla, bütün sokağa yayılan taze simit kokusu.",
    ups: ["Dengeli Tabla", "Çifte Tabla", "Babadan Kalma Tabla"],
  },
  {
    id: "araba",
    name: "Kırmızı Simit Arabası",
    icon: "🛒",
    img: "img/araba.png",
    cost: 480,
    sps: 13,
    desc: "Eminönü sabahlarının kırmızı tezgâhı artık senin.",
    ups: ["Parlak Cam", "Yaylı Tekerlek", "Kornalı Araba"],
  },
  {
    id: "firin",
    name: "Mahalle Taş Fırını",
    icon: "🔥",
    cost: 2800,
    sps: 65,
    desc: "Taşlar ısındı. Mahallenin kahvaltısı senden sorulur.",
    ups: ["Meşe Odunu", "Asırlık Maya", "Ustanın Sırrı"],
  },
  {
    id: "cay",
    name: "Çay Ocağı",
    icon: "🫖",
    cost: 16000,
    sps: 300,
    desc: "İnce belli bardaklar doldukça simitler kapışılır.",
    ups: ["İnce Belli Bardak", "Çifte Demlik", "Semaver Filosu"],
  },
  {
    id: "carsi",
    name: "Kapalıçarşı Standı",
    icon: "🏮",
    cost: 95000,
    sps: 1500,
    desc: "Hanlardan dükkânlara, çıtır bir mola taşı.",
    ups: ["Pazarlık Ustası", "Esnaf Dayanışması", "Hanların Ustası"],
  },
  {
    id: "vapur",
    name: "Vapur Büfesi",
    icon: "⛴️",
    cost: 580000,
    sps: 7200,
    desc: "Bir çay, bir simit, iki kıta arasında bir yolculuk.",
    ups: ["Alt Kat Büfe", "Şehir Hatları Anlaşması", "Boğaz Turu Paketi"],
  },
  {
    id: "tramvay",
    name: "Nostaljik Tramvay",
    icon: "🚋",
    cost: 3500000,
    sps: 35000,
    desc: "İstiklal boyunca her durakta yeni bir müdavim.",
    ups: ["Taksim Aktarması", "Çift Vagon", "Tünel Ortaklığı"],
  },
  {
    id: "galata",
    name: "Galata Simit Kulesi",
    icon: "🗼",
    cost: 22000000,
    sps: 170000,
    desc: "Kulenin her katında fırın, tepesinde susam deposu.",
    ups: ["Döner Fırın Katı", "Kule Asansörü", "Hezarfen Teslimatı"],
  },
  {
    id: "kopru",
    name: "Boğaziçi Simit Köprüsü",
    icon: "🌉",
    cost: 140000000,
    sps: 850000,
    desc: "Avrupa yakasından Anadolu’ya uzanan bir simit zinciri.",
    ups: ["Asya Şeridi", "Avrupa Şeridi", "Gece Vardiyası"],
  },
  {
    id: "kiz",
    name: "Kız Kulesi Ar-Ge",
    icon: "🏝️",
    cost: 900000000,
    sps: 4200000,
    desc: "Boğaz’ın ortasında bir sonraki efsane tarif pişiyor.",
    ups: ["Deniz Esintisi", "Efsane Tarifi", "Kuantum Susam"],
  },
  {
    id: "tepe",
    name: "Yedi Tepe İmparatorluğu",
    icon: "👑",
    cost: 6000000000,
    sps: 22000000,
    desc: "Yedi tepede yedi fırın. Bütün şehir seninle uyanıyor.",
    ups: ["Birinci Tepe", "Dördüncü Tepe", "Yedinci Tepe"],
  },
];

export const DISTRICTS = [
  {
    id: "eminonu",
    name: "Eminönü",
    title: "Sokağın simitçisi",
    threshold: 0,
    bonus: 0,
    description:
      "İlk tabla burada açılır. Şehrin hikâyesine bir simitle katıl.",
  },
  {
    id: "karakoy",
    name: "Karaköy",
    title: "Mahallenin tanıdığı",
    threshold: 250,
    bonus: 0.05,
    description: "İskelede herkes kokunu tanıyor. Üretimin %5 daha bereketli.",
  },
  {
    id: "kadikoy",
    name: "Kadıköy",
    title: "Semtin favorisi",
    threshold: 5000,
    bonus: 0.1,
    description: "Karşı yakada yeni müdavimler. Toplam üretim bonusun %10.",
  },
  {
    id: "besiktas",
    name: "Beşiktaş",
    title: "Çarşının ustası",
    threshold: 60000,
    bonus: 0.15,
    description: "Sabah kuyruğu sokağa taşıyor. Toplam üretim bonusun %15.",
  },
  {
    id: "galata",
    name: "Galata",
    title: "Şehrin efsanesi",
    threshold: 750000,
    bonus: 0.2,
    description: "Haberin bütün şehre yayıldı. Toplam üretim bonusun %20.",
  },
  {
    id: "uskudar",
    name: "Üsküdar",
    title: "İki kıtanın fırıncısı",
    threshold: 10000000,
    bonus: 0.3,
    description:
      "Boğaz’ın iki yakasını birleştirdin. Toplam üretim bonusun %30.",
  },
  {
    id: "yedi-tepe",
    name: "Yedi Tepe",
    title: "Simit sultanı",
    threshold: 200000000,
    bonus: 0.5,
    description: "İstanbul seninle kahvaltı ediyor. Toplam üretim bonusun %50.",
  },
];

const CLICK_UPGRADES = [
  {
    id: "c1",
    name: "Susam Serpme",
    icon: "🌰",
    cost: 60,
    type: "click",
    mult: 2,
    desc: "Temel tıklama gücün iki katına çıkar.",
  },
  {
    id: "c2",
    name: "Çıtır Hamur",
    icon: "🥨",
    cost: 1500,
    type: "click",
    mult: 2,
    desc: "Temel tıklama gücün bir kez daha ikiye katlanır.",
  },
  {
    id: "c3",
    name: "Tahinli Dokunuş",
    icon: "🍯",
    cost: 45000,
    type: "click",
    mult: 2,
    desc: "Temel tıklama gücüne bir kat daha ustalık ekle.",
  },
  {
    id: "c4",
    name: "Kaşarlı Kombo",
    icon: "🧀",
    cost: 1000000,
    type: "clickSps",
    pct: 0.04,
    desc: "Her tıklamada saniyelik üretiminin %4’ünü daha kazan.",
  },
  {
    id: "c5",
    name: "Çikolatalı Cesaret",
    icon: "🍫",
    cost: 30000000,
    type: "clickSps",
    pct: 0.04,
    desc: "Tıklamalarına saniyelik üretiminin %4’ü daha eklenir.",
  },
  {
    id: "c6",
    name: "Simit + Ayran",
    icon: "🥛",
    cost: 800000000,
    type: "clickSps",
    pct: 0.08,
    desc: "Her tıklamaya saniyelik üretiminin %8’i daha eklenir.",
  },
];
const TIERS = [
  { need: 1, cost: 6 },
  { need: 10, cost: 35 },
  { need: 25, cost: 180 },
];
export const UPGRADES = [
  ...CLICK_UPGRADES,
  ...BUILDINGS.flatMap((b) =>
    TIERS.map((tier, index) => ({
      id: `${b.id}_u${index}`,
      name: b.ups[index],
      icon: b.icon,
      img: b.img,
      cost: b.cost * tier.cost,
      type: "building",
      target: b.id,
      mult: 2,
      needCount: tier.need,
      desc: `${b.name} üretimi iki katına çıkar.`,
    })),
  ),
];

export const ACHIEVEMENTS = [
  ...[
    ["a_t1", "🥯", "İlk Fırın Çıkışı", 100],
    ["a_t2", "🧡", "Mahallenin Gururu", 10000],
    ["a_t3", "🌆", "Semtin Efsanesi", 1e6],
    ["a_t4", "🌉", "İki Kıtanın Fırıncısı", 1e9],
    ["a_t5", "👑", "Simit Sultanı", 1e12],
  ].map(([id, icon, name, target]) => ({
    id,
    icon,
    name,
    desc: `Toplam ${target.toLocaleString("tr-TR")} simit üret.`,
    check: (s) => s.total >= target,
  })),
  ...[
    ["a_c1", "👆", "Parmak Isınıyor", 100],
    ["a_c2", "💪", "Hamur Gibi Yoğur", 1000],
    ["a_c3", "⚡", "Nasır Tutan El", 10000],
  ].map(([id, icon, name, target]) => ({
    id,
    icon,
    name,
    desc: `${target.toLocaleString("tr-TR")} kez tıkla.`,
    check: (s) => s.clicks >= target,
  })),
  ...[
    ["a_g1", "✨", "Kısmet", 1],
    ["a_g2", "🌟", "Yedi Kat Bereket", 7],
    ["a_g3", "💫", "Nazar Değmesin", 27],
  ].map(([id, icon, name, target]) => ({
    id,
    icon,
    name,
    desc: `${target} altın simit yakala.`,
    check: (s) => s.golden >= target,
  })),
  ...BUILDINGS.flatMap((b) => [
    {
      id: `a_${b.id}_1`,
      icon: b.icon,
      name: `İlk ${b.name}`,
      desc: `Bir ${b.name} sahibi ol.`,
      check: (s) => s.owned[b.id] >= 1,
    },
    {
      id: `a_${b.id}_2`,
      icon: b.icon,
      name: `${b.name} Zinciri`,
      desc: `50 ${b.name} sahibi ol.`,
      check: (s) => s.owned[b.id] >= 50,
    },
  ]),
];

const ownedQuest = (id, title, building, reward) => ({
  id,
  title,
  description: `Dükkândan bir ${BUILDINGS.find((b) => b.id === building).name} al.`,
  target: 1,
  value: (s) => s.owned[building],
  reward,
});
export const QUESTS = [
  {
    id: "first-batch",
    title: "İlk parti sıcak!",
    description: "Büyük simide 10 kez dokun.",
    target: 10,
    value: (s) => s.clicks,
    reward: 5,
  },
  ownedQuest("first-partner", "Bir kanat da sana", "marti", 12),
  {
    id: "hundred",
    title: "Koku sokağa yayıldı",
    description: "Toplam 100 simit üret.",
    target: 100,
    value: (s) => s.total,
    reward: 30,
  },
  ownedQuest("first-tray", "Tablanı aç", "tabla", 40),
  {
    id: "team",
    title: "Mahalle ekibi",
    description: "Toplam 8 işletme ve yardımcı edin.",
    target: 8,
    value: (s) => BUILDINGS.reduce((sum, b) => sum + s.owned[b.id], 0),
    reward: 100,
  },
  ownedQuest("first-cart", "Kırmızı bir hayal", "araba", 150),
  {
    id: "thousand",
    title: "Bin simit, bin selam",
    description: "Toplam 1.000 simit üret.",
    target: 1000,
    value: (s) => s.total,
    reward: 200,
  },
  {
    id: "first-upgrade",
    title: "Ustalık dokunuşu",
    description: "Bir yükseltme satın al.",
    target: 1,
    value: (s) => UPGRADES.filter((u) => s.upgrades[u.id]).length,
    reward: 300,
  },
  ownedQuest("first-oven", "Taş fırını yak", "firin", 750),
  {
    id: "hundred-second",
    title: "Her saniye bereket",
    description: "Saniyede 100 simitlik kalıcı üretime ulaş.",
    target: 100,
    value: (s) => derive(s).baseSps,
    reward: 1000,
  },
  ownedQuest("first-tea", "Çaylar senden", "cay", 2500),
  ownedQuest("first-bazaar", "Çarşı seni konuşuyor", "carsi", 12000),
  ownedQuest("first-ferry", "Karşıya bir simit", "vapur", 75000),
  ownedQuest("first-tram", "İstiklal’e çık", "tramvay", 300000),
  ownedQuest("first-tower", "Galata’dan selam", "galata", 2000000),
  ownedQuest("first-bridge", "İki kıta, tek tarif", "kopru", 10000000),
  ownedQuest("first-maiden", "Efsaneyi pişir", "kiz", 60000000),
  ownedQuest("seven-hills", "Yedi tepe, bir usta", "tepe", 400000000),
];

const BUILDING_BY_ID = new Map(BUILDINGS.map((b) => [b.id, b]));
const UPGRADE_BY_ID = new Map(UPGRADES.map((u) => [u.id, u]));
const record = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);
const number = (value, fallback = 0, max = MAX_CURRENCY) =>
  typeof value === "number" && Number.isFinite(value)
    ? Math.min(max, Math.max(0, value))
    : fallback;
const integer = (value, max = Number.MAX_SAFE_INTEGER) =>
  Math.floor(number(value, 0, max));
const own = (obj, key) =>
  record(obj) && Object.hasOwn(obj, key) ? obj[key] : undefined;

export function createState(now = Date.now()) {
  return {
    v: 3,
    simit: 0,
    total: 0,
    clicks: 0,
    golden: 0,
    owned: Object.fromEntries(BUILDINGS.map((b) => [b.id, 0])),
    upgrades: {},
    achievements: {},
    questIndex: 0,
    activeSeconds: 0,
    goldenUntil: 0,
    settings: { motion: true, sound: false },
    ts: number(now, 0, Number.MAX_SAFE_INTEGER),
  };
}

/** Accept only known data fields. Old wall-clock buffs and elapsed time never earn currency. */
export function normalizeSave(input, now = Date.now()) {
  const state = createState(now);
  if (!record(input)) return state;
  state.simit = number(own(input, "simit"));
  state.total = Math.max(state.simit, number(own(input, "total")));
  state.clicks = integer(own(input, "clicks"));
  state.golden = integer(own(input, "golden"));
  const version = integer(own(input, "v")) || 1;
  const oldId = (id) =>
    version < 2 ? { marti: "el", tramvay: "marti" }[id] || id : id;
  for (const b of BUILDINGS)
    state.owned[b.id] = integer(
      own(own(input, "owned"), oldId(b.id)),
      MAX_OWNED,
    );
  for (const u of UPGRADES) {
    const old =
      u.type === "building" ? `${oldId(u.target)}_u${u.id.slice(-1)}` : u.id;
    if (own(own(input, "upgrades"), old) === true) state.upgrades[u.id] = true;
  }
  for (const a of ACHIEVEMENTS) {
    const match = a.id.match(/^a_([a-z]+)_([12])$/);
    const old = match ? `a_${oldId(match[1])}_${match[2]}` : a.id;
    if (own(own(input, "achievements"), old) === true)
      state.achievements[a.id] = true;
  }
  if (version >= 3) {
    state.questIndex = integer(own(input, "questIndex"), QUESTS.length);
    state.activeSeconds = number(own(input, "activeSeconds"), 0, 1e12);
    state.goldenUntil = Math.min(
      state.activeSeconds + GOLDEN_DURATION,
      number(own(input, "goldenUntil"), 0, 1e12 + GOLDEN_DURATION),
    );
  }
  const settings = own(input, "settings");
  for (const key of ["motion", "sound"])
    if (typeof own(settings, key) === "boolean")
      state.settings[key] = settings[key];
  unlockAchievements(state);
  return state;
}

function districtIndex(state) {
  let index = 0;
  while (
    index < DISTRICTS.length - 1 &&
    state.total >= DISTRICTS[index + 1].threshold
  )
    index++;
  return index;
}

export function derive(state) {
  const index = districtIndex(state);
  const district = DISTRICTS[index];
  const nextDistrict = DISTRICTS[index + 1] || null;
  const districtMultiplier = 1 + district.bonus;
  const buffRemaining = Math.max(0, state.goldenUntil - state.activeSeconds);
  const buildingSps = {};
  let baseSps = 0;
  let totalBuildings = 0;
  for (const b of BUILDINGS) {
    let multiplier = districtMultiplier;
    for (let tier = 0; tier < TIERS.length; tier++)
      if (state.upgrades[`${b.id}_u${tier}`]) multiplier *= 2;
    buildingSps[b.id] = b.sps * multiplier;
    baseSps += buildingSps[b.id] * state.owned[b.id];
    totalBuildings += state.owned[b.id];
  }
  let manualPower = 1;
  let passiveShare = 0.03;
  for (const u of CLICK_UPGRADES) {
    if (!state.upgrades[u.id]) continue;
    if (u.type === "click") manualPower *= u.mult;
    else passiveShare += u.pct;
  }
  const sps = baseSps * (buffRemaining > 0 ? 2 : 1);
  return {
    sps,
    baseSps,
    clickPower: manualPower + sps * passiveShare,
    totalBuildings,
    buildingSps,
    district,
    districtIndex: index,
    nextDistrict,
    districtProgress: nextDistrict
      ? Math.max(
          0,
          Math.min(
            1,
            (state.total - district.threshold) /
              (nextDistrict.threshold - district.threshold),
          ),
        )
      : 1,
    districtBonus: district.bonus,
    buffRemaining,
  };
}

function quote(state, building, count) {
  if (
    !Number.isInteger(count) ||
    count < 1 ||
    state.owned[building.id] + count > MAX_OWNED
  )
    return Infinity;
  const first = building.cost * GROWTH ** state.owned[building.id];
  return Math.ceil((first * (GROWTH ** count - 1)) / (GROWTH - 1));
}

export function affordableCount(state, id) {
  const building = BUILDING_BY_ID.get(id);
  if (!building) return 0;
  let low = 0;
  let high = MAX_OWNED - state.owned[id];
  while (low < high) {
    const mid = Math.ceil((low + high) / 2);
    if (quote(state, building, mid) <= state.simit) low = mid;
    else high = mid - 1;
  }
  return low;
}

export function priceFor(state, id, count = 1) {
  const building = BUILDING_BY_ID.get(id);
  if (!building) return Infinity;
  return quote(
    state,
    building,
    count === "max" ? affordableCount(state, id) : count,
  );
}

export function upgradeVisible(state, upgradeOrId) {
  const u =
    typeof upgradeOrId === "string"
      ? UPGRADE_BY_ID.get(upgradeOrId)
      : upgradeOrId;
  if (!u || !UPGRADE_BY_ID.has(u.id) || state.upgrades[u.id]) return false;
  return u.type === "building"
    ? state.owned[u.target] >= u.needCount
    : state.total >= u.cost / 2;
}

function unlockAchievements(state) {
  const unlocked = [];
  for (const a of ACHIEVEMENTS) {
    if (!state.achievements[a.id] && a.check(state)) {
      state.achievements[a.id] = true;
      unlocked.push(a);
    }
  }
  return unlocked;
}

function result(state, oldDistrict, extra = {}) {
  return {
    ok: true,
    amount: 0,
    achievements: unlockAchievements(state),
    districtChanged: districtIndex(state) !== oldDistrict,
    ...extra,
  };
}

function addEarnings(state, amount) {
  const accepted = Math.min(number(amount), MAX_CURRENCY - state.simit);
  state.simit += accepted;
  state.total = Math.min(MAX_CURRENCY, state.total + accepted);
  return accepted;
}

export function earn(state, amount) {
  const before = districtIndex(state);
  return result(state, before, { amount: addEarnings(state, amount) });
}

export function click(state) {
  const before = districtIndex(state);
  const amount = addEarnings(state, derive(state).clickPower);
  state.clicks = Math.min(Number.MAX_SAFE_INTEGER, state.clicks + 1);
  return result(state, before, { amount });
}

export function buyBuilding(state, id, count = 1) {
  const b = BUILDING_BY_ID.get(id);
  if (!b) return { ok: false, reason: "unknown-building" };
  const quantity = count === "max" ? affordableCount(state, id) : count;
  const cost = quote(state, b, quantity);
  if (!Number.isFinite(cost)) return { ok: false, reason: "invalid-count" };
  if (cost > state.simit) return { ok: false, reason: "insufficient-funds" };
  const before = districtIndex(state);
  state.simit -= cost;
  state.owned[id] += quantity;
  return result(state, before, { cost, count: quantity });
}

export function buyUpgrade(state, id) {
  const upgrade = UPGRADE_BY_ID.get(id);
  if (!upgrade) return { ok: false, reason: "unknown-upgrade" };
  if (!upgradeVisible(state, upgrade))
    return { ok: false, reason: "unavailable-upgrade" };
  if (state.simit < upgrade.cost)
    return { ok: false, reason: "insufficient-funds" };
  const before = districtIndex(state);
  state.simit -= upgrade.cost;
  state.upgrades[id] = true;
  return result(state, before, { cost: upgrade.cost, upgrade });
}

/** Only visible, active time should be supplied. Clamp gaps to avoid sleep/offline payouts. */
export function advance(state, seconds) {
  const duration = number(seconds, 0, 1);
  const before = districtIndex(state);
  const rates = derive(state);
  const boostedTime = Math.min(duration, rates.buffRemaining);
  const amount = addEarnings(state, rates.baseSps * (duration + boostedTime));
  state.activeSeconds = Math.min(1e12, state.activeSeconds + duration);
  if (state.goldenUntil <= state.activeSeconds) state.goldenUntil = 0;
  return result(state, before, { amount, seconds: duration });
}

export function currentQuest(state) {
  const quest = QUESTS[state.questIndex];
  if (!quest) return null;
  const current = Math.max(0, quest.value(state));
  return {
    id: quest.id,
    title: quest.title,
    description: quest.description,
    target: quest.target,
    current,
    progress: Math.min(1, current / quest.target),
    ready: current >= quest.target,
    reward: quest.reward,
    index: state.questIndex,
    total: QUESTS.length,
  };
}

/** A claim completes precisely one quest, even if its reward satisfies the following one. */
export function claimQuest(state) {
  const quest = currentQuest(state);
  if (!quest || !quest.ready)
    return { ok: false, reason: quest ? "quest-not-ready" : "quests-complete" };
  const before = districtIndex(state);
  state.questIndex++;
  const amount = addEarnings(state, quest.reward);
  return result(state, before, { amount, quest });
}

export function collectGolden(state) {
  const before = districtIndex(state);
  const amount = addEarnings(state, Math.max(15, derive(state).baseSps * 20));
  state.golden = Math.min(Number.MAX_SAFE_INTEGER, state.golden + 1);
  // Refresh, never multiply or stack: duration follows active play, not the wall clock.
  state.goldenUntil = state.activeSeconds + GOLDEN_DURATION;
  return result(state, before, { amount, buffDuration: GOLDEN_DURATION });
}
