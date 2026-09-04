'use strict';

/* =====================================================================
   SimitClicker — İstanbul temalı artımlı oyun
   Mekanik iskelet Cookie Clicker türünden: üstel fiyatlar (x1.15),
   SpS üretimi, yükseltmeler, altın simit olayları, başarımlar.
   ===================================================================== */

// ---------- Binalar (İstanbul odaklı) ----------
const BUILDINGS = [
  { id: 'marti',   name: 'Martı',                  icon: '🕊️', img: 'img/marti.webp', cost: 15, sps: 0.1,
    desc: 'Simidin kenarına konar, ücretini gagayla tahsil eder. Kadim İstanbul kuşu.',
    ups: ['Cesur Gaga', 'Susam Radarı', 'Poyraz Kanadı'] },
  { id: 'tabla',   name: 'Simitçi Tablası',        icon: '🧺', img: 'img/tabla.png', cost: 100, sps: 1,
    desc: 'Başının üstünde elli simitle Galata Köprüsü\'nü geçen usta.',
    ups: ['Dengeli Tabla', 'Çifte Tabla', 'Babadan Kalma Tabla'] },
  { id: 'araba',   name: 'Kırmızı Simit Arabası',  icon: '🛒', img: 'img/araba.png', cost: 1100, sps: 8,
    desc: 'Camlı, kırmızı, klasik. Eminönü\'nün demirbaşı.',
    ups: ['Parlak Cam', 'Yaylı Tekerlek', 'Kornalı Araba'] },
  { id: 'firin',   name: 'Mahalle Taş Fırını',     icon: '🔥', cost: 12000,  sps: 47,
    desc: 'Yüz yıllık taş fırın. Kokusu üç sokak öteden çağırır.',
    ups: ['Meşe Odunu', 'Asırlık Maya', 'Ustanın Sırrı'] },
  { id: 'cay',     name: 'Çay Ocağı',              icon: '🫖', cost: 130000, sps: 260,
    desc: 'Tavşan kanı çay yanında simit: İstanbul\'un resmî kahvaltısı.',
    ups: ['İnce Belli Bardak', 'Çifte Demlik', 'Semaver Filosu'] },
  { id: 'carsi',   name: 'Kapalıçarşı Standı',     icon: '🏮', cost: 1.4e6,  sps: 1400,
    desc: '4.000 dükkânın arasında en çok koklanan tezgâh.',
    ups: ['Pazarlık Ustası', 'Turist Rehberi Anlaşması', 'Han Kirası Muafiyeti'] },
  { id: 'vapur',   name: 'Vapur Büfesi',           icon: '⛴️', cost: 2e7,    sps: 7800,
    desc: 'Karaköy–Kadıköy hattında simit + çay + Boğaz manzarası.',
    ups: ['Alt Kat Büfe', 'Şehir Hatları Sözleşmesi', 'Boğaz Turu Paketi'] },
  { id: 'tramvay', name: 'Nostaljik Tramvay',      icon: '🚋', cost: 3.3e8,  sps: 44000,
    desc: 'İstiklal boyunca her durakta tabla tabla simit satan kırmızı tramvay.',
    ups: ['Taksim Aktarması', 'Çift Vagon', 'Tünel Hattı Ortaklığı'] },
  { id: 'galata',  name: 'Galata Simit Kulesi',    icon: '🗼', cost: 5.1e9,  sps: 260000,
    desc: 'Kulenin her katında bir fırın, tepesinde susam deposu.',
    ups: ['Döner Fırın Katı', 'Kule Asansörü', 'Hezarfen Teslimatı'] },
  { id: 'kopru',   name: 'Boğaziçi Simit Köprüsü', icon: '🌉', cost: 7.5e10, sps: 1.6e6,
    desc: 'İki kıtayı hamurla birleştiren dev üretim bandı.',
    ups: ['Asya Şeridi', 'Avrupa Şeridi', 'Gece Vardiyası Işıkları'] },
  { id: 'kiz',     name: 'Kız Kulesi Ar-Ge',       icon: '🏝️', cost: 1e12,   sps: 1e7,
    desc: 'Denizin ortasındaki gizli laboratuvarda kuantum mayalanma.',
    ups: ['Deniz Suyu Mayası', 'Efsane Tarifi', 'Kuantum Susam'] },
  { id: 'tepe',    name: 'Yedi Tepe İmparatorluğu',icon: '👑', cost: 1.4e13, sps: 6.5e7,
    desc: 'İstanbul\'un yedi tepesinde yedi dev fırın; şehir simite döndü.',
    ups: ['Birinci Tepe', 'Dördüncü Tepe', 'Yedinci Tepe'] },
];

// ---------- Tık yükseltmeleri ----------
const CLICK_UPGRADES = [
  { id: 'c1', name: 'Susam Serpme',      icon: '🌰', img: 'img/sesame.png', cost: 100, type: 'click', mult: 2,
    desc: 'Her tık iki kat simit. Susamsız simit, çaysız sohbet gibi.' },
  { id: 'c2', name: 'Çıtır Hamur',       icon: '🥨', cost: 5000,  type: 'click',    mult: 2,
    desc: 'Dışı çıtır, içi yumuşak. Tık gücü x2.' },
  { id: 'c3', name: 'Tahinli Dokunuş',   icon: '🍯', cost: 500000, type: 'click',   mult: 2,
    desc: 'Tahin sürülünce eller durmak bilmiyor. Tık gücü x2.' },
  { id: 'c4', name: 'Kaşarlı Kombo',     icon: '🧀', cost: 5e7,   type: 'clickSps', pct: 0.01,
    desc: 'Her tık, üretimin %1\'ini de cebe atar.' },
  { id: 'c5', name: 'Çikolatalı Cesaret',icon: '🍫', cost: 5e9,   type: 'clickSps', pct: 0.01,
    desc: 'Gelenekçiler kızsa da satıyor. Tık başına +%1 SpS.' },
  { id: 'c6', name: 'Simit + Ayran',     icon: '🥛', cost: 5e11,  type: 'clickSps', pct: 0.02,
    desc: 'Tartışmalı ama etkili ikili. Tık başına +%2 SpS.' },
];

// Bina yükseltmeleri: sahip olunan adet eşiği + maliyet çarpanı
const B_UP_TIERS = [
  { need: 1,  costMult: 10 },
  { need: 10, costMult: 60 },
  { need: 25, costMult: 600 },
];

// ---------- Haber bandı ----------
const NEWS = [
  'Martılar Karaköy\'de bir simit tablasına organize baskın düzenledi; usta "helal olsun" dedi.',
  'Uzmanlar açıkladı: Simit çayla içilir. Tartışma kapanmıştır.',
  'Boğaz\'ı simit kokusu sardı; vapur seferleri gecikti, kimse şikâyet etmedi.',
  'Anket: İstanbulluların %97\'si güne simitle başlıyor, kalan %3 poğaçacı çıktı.',
  'Tarihçiler doğruladı: Simit, 1525\'ten beri İstanbul sokaklarında.',
  'Son dakika: Kapalıçarşı\'da susam borsası rekor kırdı.',
  'Kadıköy\'de bir kedi, simitçinin tablasında uyuyakaldı. Satışlar arttı.',
  'Belediye açıkladı: Yeni metro hattının her istasyonuna simitçi kondu.',
  'Meteoroloji: Yarın sabah şehir genelinde yoğun susam yağışı bekleniyor.',
  'Galata Kulesi\'nin tepesinden simit sarkıtan gence turistlerden tam not.',
  'Simit AŞ hisseleri tavan yaptı; yatırımcılar "çıtır çıtır kazanıyoruz" dedi.',
  'Adalar vapurunda simit ikramı başladı; martılar sendika kurdu.',
];
const NEWS_DYNAMIC = [
  { need: 'marti',  min: 1,  text: 'İlk martı göreve başladı: maaşını simidin kenarından gagayla alıyor.' },
  { need: 'marti',  min: 10, text: 'Simidin üstünde martı trafiği yoğun; kule "sıraya girin" anonsu geçti.' },
  { need: 'tabla',  min: 1,  text: 'İlk tabla sokağa çıktı: "Simiiiit! Taze simit!"' },
  { need: 'firin',  min: 1,  text: 'Mahalle fırını tekrar yandı; koku üç sokağı uyandırdı.' },
  { need: 'tramvay',min: 1,  text: 'Nostaljik tramvay seferde: her durakta bir tabla simit.' },
  { need: 'kopru',  min: 1,  text: 'Simit Köprüsü açıldı: iki kıta artık hamurla bağlı.' },
  { need: 'tepe',   min: 1,  text: 'Yedi tepede yedi fırın tütüyor. İstanbul artık bir simit.' },
];

// ---------- Durum ----------
const S = {
  simit: 0,
  total: 0,
  clicks: 0,
  golden: 0,
  owned: {},          // buildingId -> adet
  upgrades: {},       // upgradeId -> true
  achievements: {},   // achId -> true
  buffs: {},          // buffId -> bitiş zamanı (ms)
};
BUILDINGS.forEach(b => S.owned[b.id] = 0);

let buyAmount = 1;
let clickPower = 1;   // hesaplanır
let sps = 0;          // hesaplanır

// ---------- Yardımcılar ----------
const $ = id => document.getElementById(id);
const SCALES = [
  [1e21, 'sekstilyon'], [1e18, 'kentilyon'], [1e15, 'katrilyon'],
  [1e12, 'trilyon'], [1e9, 'milyar'], [1e6, 'milyon'],
];
function fmt(n) {
  if (n < 1000) return (Math.round(n * 10) / 10).toLocaleString('tr-TR');
  for (const [v, name] of SCALES) {
    if (n >= v) return (Math.floor(n / v * 100) / 100).toLocaleString('tr-TR') + ' ' + name;
  }
  return Math.floor(n).toLocaleString('tr-TR');
}

// emoji ya da görsel ikon üret (binalar görsel ikon taşıyabilir)
function iconHTML(o) {
  return o.img ? `<img class="iconImg" src="${o.img}" alt="">` : o.icon;
}

function buildingCost(b, count = 1) {
  let total = 0, owned = S.owned[b.id];
  for (let i = 0; i < count; i++) total += b.cost * Math.pow(1.15, owned + i);
  return Math.ceil(total);
}

// ---------- Yükseltme listesi (tik + bina) ----------
const UPGRADES = [...CLICK_UPGRADES];
BUILDINGS.forEach(b => {
  B_UP_TIERS.forEach((tier, i) => {
    UPGRADES.push({
      id: `${b.id}_u${i}`, name: b.ups[i], icon: b.icon, img: b.img,
      cost: Math.ceil(b.cost * tier.costMult),
      type: 'building', target: b.id, mult: 2, needCount: tier.need,
      desc: `${b.name} üretimi iki katına çıkar.`,
    });
  });
});

function upgradeVisible(u) {
  if (S.upgrades[u.id]) return false;
  if (u.type === 'building') return S.owned[u.target] >= u.needCount;
  return S.total >= u.cost / 2;
}

// ---------- Başarımlar ----------
const ACHIEVEMENTS = [
  { id: 'a_t1', icon: '🥯', img: 'img/simit-icon.png', name: 'İlk Fırın Çıkışı', desc: 'Toplam 100 simit piştir.', check: () => S.total >= 100 },
  { id: 'a_t2', icon: '🧡', name: 'Mahallenin Gururu',  desc: 'Toplam 10.000 simit piştir.',     check: () => S.total >= 1e4 },
  { id: 'a_t3', icon: '🌆', name: 'Semtin Efsanesi',    desc: 'Toplam 1 milyon simit piştir.',   check: () => S.total >= 1e6 },
  { id: 'a_t4', icon: '🌉', name: 'İki Kıtanın Fırıncısı', desc: 'Toplam 1 milyar simit piştir.', check: () => S.total >= 1e9 },
  { id: 'a_t5', icon: '👑', name: 'Simit Sultanı',      desc: 'Toplam 1 trilyon simit piştir.',  check: () => S.total >= 1e12 },
  { id: 'a_c1', icon: '👆', name: 'Parmak Isınıyor',    desc: '100 kez tıkla.',                  check: () => S.clicks >= 100 },
  { id: 'a_c2', icon: '💪', name: 'Hamur Gibi Yoğur',   desc: '1.000 kez tıkla.',                check: () => S.clicks >= 1000 },
  { id: 'a_c3', icon: '⚡', name: 'Nasır Tutan El',     desc: '10.000 kez tıkla.',               check: () => S.clicks >= 10000 },
  { id: 'a_g1', icon: '✨', name: 'Kısmet',             desc: 'Bir altın simit yakala.',         check: () => S.golden >= 1 },
  { id: 'a_g2', icon: '🌟', name: 'Yedi Kat Bereket',   desc: '7 altın simit yakala.',           check: () => S.golden >= 7 },
  { id: 'a_g3', icon: '💫', name: 'Nazar Değmesin',     desc: '27 altın simit yakala.',          check: () => S.golden >= 27 },
];
BUILDINGS.forEach(b => {
  ACHIEVEMENTS.push({ id: `a_${b.id}_1`, icon: b.icon, img: b.img, name: `İlk ${b.name}`,
    desc: `Bir ${b.name} sahibi ol.`, check: () => S.owned[b.id] >= 1 });
  ACHIEVEMENTS.push({ id: `a_${b.id}_2`, icon: b.icon, img: b.img, name: `${b.name} Zinciri`,
    desc: `50 ${b.name} sahibi ol.`, check: () => S.owned[b.id] >= 50 });
});

// ---------- Hesaplama ----------
function recalc() {
  let total = 0;
  BUILDINGS.forEach(b => {
    let m = 1;
    UPGRADES.forEach(u => {
      if (u.type === 'building' && u.target === b.id && S.upgrades[u.id]) m *= u.mult;
    });
    total += b.sps * S.owned[b.id] * m;
  });
  if (S.buffs.frenzy && S.buffs.frenzy > Date.now()) total *= 7;
  sps = total;

  let cp = 1;
  let spsPct = 0;
  CLICK_UPGRADES.forEach(u => {
    if (!S.upgrades[u.id]) return;
    if (u.type === 'click') cp *= u.mult;
    else if (u.type === 'clickSps') spsPct += u.pct;
  });
  clickPower = cp + sps * spsPct;
  if (S.buffs.clickFrenzy && S.buffs.clickFrenzy > Date.now()) clickPower *= 777;
}

// ---------- Büyük simit SVG ----------
function drawSimit(svg, size, seedCount) {
  const c = size / 2, R = size * 0.36, W = size * 0.30;
  svg.innerHTML = `
    <defs>
      <radialGradient id="g${size}" cx="40%" cy="35%" r="75%">
        <stop offset="0%" stop-color="#f0c060"/>
        <stop offset="55%" stop-color="#c8853a"/>
        <stop offset="100%" stop-color="#8a5220"/>
      </radialGradient>
    </defs>
    <circle cx="${c}" cy="${c}" r="${R}" fill="none" stroke="url(#g${size})" stroke-width="${W}"/>
    <circle cx="${c}" cy="${c}" r="${R + W / 2 - 2}" fill="none" stroke="#7a4718" stroke-width="3" opacity="0.5"/>
    <circle cx="${c}" cy="${c}" r="${R - W / 2 + 2}" fill="none" stroke="#7a4718" stroke-width="3" opacity="0.5"/>`;
  // burgu dokusu: simidin örgülü halkasını çağrıştıran eğik çizgiler
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    const tilt = 0.34; // burgu eğimi
    const x1 = c + Math.cos(a) * (R - W * 0.42), y1 = c + Math.sin(a) * (R - W * 0.42);
    const x2 = c + Math.cos(a + tilt) * (R + W * 0.42), y2 = c + Math.sin(a + tilt) * (R + W * 0.42);
    const mx = c + Math.cos(a + tilt * 0.6) * (R + W * 0.06);
    const my = c + Math.sin(a + tilt * 0.6) * (R + W * 0.06);
    const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('d', `M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`);
    p.setAttribute('fill', 'none');
    p.setAttribute('stroke', '#8a5220');
    p.setAttribute('stroke-width', size * 0.014);
    p.setAttribute('stroke-linecap', 'round');
    p.setAttribute('opacity', '0.45');
    svg.appendChild(p);
  }
  // susamlar
  let seed = 42;
  const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  for (let i = 0; i < seedCount; i++) {
    const a = rnd() * Math.PI * 2;
    const r = R + (rnd() - 0.5) * W * 0.82;
    const x = c + Math.cos(a) * r, y = c + Math.sin(a) * r;
    const e = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    e.setAttribute('cx', x); e.setAttribute('cy', y);
    e.setAttribute('rx', size * 0.012); e.setAttribute('ry', size * 0.006);
    e.setAttribute('transform', `rotate(${rnd() * 180} ${x} ${y})`);
    e.setAttribute('fill', rnd() > 0.25 ? '#f5e6c8' : '#6b4416');
    svg.appendChild(e);
  }
}

// ---------- Simit fotoğrafı: beyaz arka planı saydamlaştır ----------
let simitURL = null; // işlenmiş görselin dataURL'i (altın simit de kullanır)
function processSimit() {
  const big = $('bigSimit');
  const img = new Image();
  img.src = big.src;
  img.onload = () => {
    try {
      const c = document.createElement('canvas');
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      const ctx = c.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const d = ctx.getImageData(0, 0, c.width, c.height);
      const p = d.data;
      for (let i = 0; i < p.length; i += 4) {
        if (p[i + 3] === 0) continue;
        // sıcak tonları korumak için en düşük kanala (mavi) göre anahtarla
        const w = Math.min(p[i], p[i + 1], p[i + 2]);
        if (w > 248) p[i + 3] = 0;
        else if (w > 230) p[i + 3] = Math.min(p[i + 3], Math.round((248 - w) / 18 * 255));
      }
      ctx.putImageData(d, 0, 0);
      simitURL = c.toDataURL('image/png');
      big.src = simitURL;
    } catch (e) {
      console.warn('Görsel işlenemedi, ham hali kullanılıyor', e);
    }
    big.classList.add('ready');
  };
  img.onerror = () => big.classList.add('ready');
}

// ---------- Simidi tırtıklayan martılar ----------
const GULL_CAP = 18;
// deterministik titreşim: martılar her yeniden çizimde aynı yerde kalsın
function gullJitter(i, salt) {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
}
function gullImage() {
  return '<img class="gullBody" src="img/marti.webp" alt="">';
}
let gullCount = -1;
function updateGulls() {
  const owned = S.owned.marti || 0;
  const n = Math.min(owned, GULL_CAP);
  const badge = $('gullBadge');
  badge.hidden = owned <= GULL_CAP;
  if (!badge.hidden) badge.innerHTML = `${iconHTML(BUILDINGS[0])} ×${owned.toLocaleString('tr-TR')} martı`;
  if (n === gullCount) return;
  gullCount = n;
  const ring = $('gullRing');
  ring.innerHTML = '';
  for (let i = 0; i < n; i++) {
    const spot = document.createElement('div');
    spot.className = 'gullSpot';
    // altın açı dizilimi: yeni martı gelince eskiler yerinden oynamaz
    const angle = (i * 137.508 + (gullJitter(i, 1) - 0.5) * 16) % 360;
    const size = Math.max(26, 40 - n * 0.6) + gullJitter(i, 2) * 6;
    spot.style.setProperty('--a', angle + 'deg');
    spot.style.setProperty('--s', size.toFixed(1) + 'px');
    spot.style.setProperty('--dur', (1.6 + gullJitter(i, 3) * 1.6).toFixed(2) + 's');
    spot.style.setProperty('--d', (-gullJitter(i, 4) * 3).toFixed(2) + 's');
    spot.innerHTML = gullImage();
    ring.appendChild(spot);
  }
  layoutGulls();
}
function layoutGulls() {
  const stage = $('simitStage');
  // martılar simidin dış kenarına konar
  $('gullRing').style.setProperty('--R', (stage.clientWidth / 2 * 0.93).toFixed(0) + 'px');
}

// ---------- Katmanlı, illüstratif İstanbul silueti ----------
function drawSkyline() {
  const svg = $('skyline');
  svg.innerHTML = `
  <defs>
    <linearGradient id="water" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#3f83ae"/><stop offset="1" stop-color="#245d87"/></linearGradient>
    <linearGradient id="hill" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#788ba0"/><stop offset="1" stop-color="#4b6175"/></linearGradient>
    <linearGradient id="stone" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#d7c4a4"/><stop offset="0.55" stop-color="#b9a487"/><stop offset="1" stop-color="#8d7964"/></linearGradient>
    <linearGradient id="dome" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#8999a5"/><stop offset="1" stop-color="#4e606f"/></linearGradient>
    <filter id="soft" x="-10%" y="-20%" width="120%" height="140%"><feGaussianBlur stdDeviation="1.2"/></filter>
  </defs>

  <!-- Uzak, puslu şehir -->
  <g fill="#526b80" opacity=".32" filter="url(#soft)">
    <path d="M0 112V91h10v-9h8v30M28 112V78h13v34M48 112V88h19v24M126 112V80h11v32M142 112V70h16v42M168 112V87h25v25M345 112V76h15v36M365 112V91h23v21M472 112V75h13v37M492 112V86h28v26M540 112V73h17v39M565 112V82h24v30"/>
  </g>

  <!-- Yedi tepenin birbirine geçen kıyı dokusu -->
  <path d="M0 128 Q48 96 101 111 Q150 83 207 112 Q263 86 322 118 Q377 94 430 115 Q495 85 600 112 V146 H0Z" fill="url(#hill)"/>
  <g stroke="#30485c" stroke-width=".7" opacity=".75">
    <path d="M0 132L15 108l16 5 13-17 18 9 12-21 18 18 16-6 17 20 17-25 19 12 15-25 19 23 17-8 14 18 17-33 18 17 14-14 17 28 18-16 15 17 17-29 20 17 15-11 16 24 18-31 16 20 16-13 17 28 18-24 16 9 16-21 18 25 18-14 18 22 18-31 21 28 17-12 25 21v24H0z" fill="#405a70"/>
  </g>

  <!-- Sıra evler: küçük çıkmalar, çatılar ve sıcak pencereler -->
  <g stroke="#3d4955" stroke-width=".8">
    <path d="M0 145v-29l14-7 14 5v31M29 145v-39h25v39M55 145v-31l13-8 15 6v33M116 145v-27l13-8 17 8v27M147 145v-39h23v39M171 145v-27l15-10 16 9v28M304 145v-34l17-8 17 8v34M339 145v-27h25v27M365 145v-33l14-8 15 9v32M461 145v-28l17-10 16 8v30M495 145v-40h25v40M521 145v-31l15-9 16 9v31M553 145v-40h25v40M579 145v-31h21v31" fill="#bd8063"/>
    <path d="M29 106l12-8 13 8M147 106l11-9 12 9M339 118l12-8 13 8M495 105l12-10 13 10M553 105l12-9 13 9" fill="#704e49"/>
    <g fill="#f4c870" class="window-glow" stroke="none" opacity=".8">
      <path d="M8 121h5v7H8zm11-3h5v7h-5zm17-4h5v7h-5zm10 0h5v7h-5zm16 5h5v7h-5zm10-2h5v7h-5zm53 4h5v7h-5zm10 0h5v7h-5zm18-7h5v7h-5zm9 0h5v7h-5zm146 5h5v7h-5zm11-3h5v7h-5zm27 8h5v7h-5zm11 0h5v7h-5zm103-2h5v7h-5zm11-3h5v7h-5zm29-9h5v7h-5zm11 0h5v7h-5zm25 8h5v7h-5zm11-2h5v7h-5zm22-5h5v7h-5zm10 0h5v7h-5z"/>
    </g>
  </g>

  <!-- Galata Kulesi -->
  <g stroke="#5e5145" stroke-width=".8">
    <path d="M83 145l3-79h24l3 79z" fill="url(#stone)"/>
    <path d="M82 66h30l-4-12H86z" fill="#927d67"/><path d="M84 54l14-27 12 27z" fill="#455666"/>
    <path d="M98 27v-6" stroke="#d5ad4e"/><circle cx="98" cy="20" r="1.5" fill="#d5ad4e" stroke="none"/>
    <path d="M89 72h18M88 80h20" fill="none" opacity=".55"/>
    <g fill="#405364"><path d="M90 88q3-5 6 0v8h-6zM100 88q3-5 6 0v8h-6zM91 108q3-5 6 0v8h-6zM100 108q3-5 6 0v8h-6z"/></g>
  </g>

  <!-- Tarihi yarımada: ana kubbe, yarım kubbeler, revaklar -->
  <g>
    <path d="M206 145v-28h82v28z" fill="#c7bca8"/>
    <path d="M215 119q9-20 18 0M261 119q9-20 18 0" fill="url(#dome)"/>
    <path d="M222 116q25-47 50 0z" fill="url(#dome)" stroke="#4c6070"/>
    <path d="M247 73v-7" stroke="#d7ae48"/><circle cx="247" cy="64.5" r="1.7" fill="#d7ae48"/>
    <g fill="#5c6870"><path d="M214 130q4-8 8 0v15h-8zM228 130q4-8 8 0v15h-8zM242 130q4-8 8 0v15h-8zM256 130q4-8 8 0v15h-8zM270 130q4-8 8 0v15h-8z"/></g>
    <g fill="#d8cebb" stroke="#7b756c" stroke-width=".6">
      <path d="M196 145l2-96h7l2 96zM289 145l2-96h7l2 96z"/>
      <path d="M196 49h11l-3-8h-5zM289 49h11l-3-8h-5z" fill="#667683"/>
      <path d="M199 41l3-14 3 14M292 41l3-14 3 14" fill="#536574"/>
      <path d="M195 72h13M288 72h13" fill="none" stroke-width="2"/>
    </g>
  </g>

  <!-- Boğaz Köprüsü; kablolar iki eğriyle daha doğal -->
  <g fill="none" stroke="#445768">
    <path d="M323 132V91h10v41M446 132V91h10v41" stroke-width="3.5"/>
    <path d="M322 99h12M445 99h12" stroke-width="2"/>
    <path d="M328 92Q389 139 451 92M328 94Q389 130 451 94" stroke-width="1.8"/>
    <path d="M344 103v25M360 112v16M376 120v8M392 124v4M408 120v8M424 112v16M440 103v25" stroke-width=".75"/>
    <path d="M312 128Q390 125 468 128" stroke="#2f414f" stroke-width="5"/>
    <path d="M314 126Q390 123 466 126" stroke="#d3a94f" stroke-width=".8" stroke-dasharray="5 4"/>
  </g>

  <!-- Boğaz ve yansımalar -->
  <path d="M0 140Q70 137 140 141T280 140T420 141T600 139V160H0Z" fill="url(#water)"/>
  <g class="water-glint" fill="none" stroke-linecap="round">
    <path d="M14 147h25m9 5h34m35-6h21m22 7h42m64-7h29m76 5h33m43-5h20m44 7h48" stroke="#8fc5dc" stroke-width="1.4" opacity=".7"/>
    <path d="M88 156h50m82-2h26m62 3h55m99-2h40" stroke="#d6e6e8" opacity=".38"/>
  </g>

  <!-- Kız Kulesi adacığı -->
  <g>
    <ellipse cx="510" cy="143" rx="25" ry="3" fill="#263f51"/>
    <path d="M500 142V99h20v43z" fill="#eee4d2" stroke="#776f64" stroke-width=".8"/>
    <path d="M496 99h28l-4-9h-20z" fill="#c8bca7"/>
    <path d="M501 90l9-18 10 18z" fill="#526573"/><path d="M510 72v-5" stroke="#d5ad4e"/>
    <g fill="#6c8391"><path d="M504 106q2.5-4 5 0v7h-5zM512 106q2.5-4 5 0v7h-5zM504 120q2.5-4 5 0v7h-5zM512 120q2.5-4 5 0v7h-5z"/></g>
  </g>

  <!-- Şehir hatları vapuru -->
  <g transform="translate(364 137)">
    <g class="ferry">
      <path d="M0 7h43l-6 7H7z" fill="#f3eee3" stroke="#32495a" stroke-width=".8"/>
      <path d="M8 0h25l5 7H5z" fill="#f7f2e8"/><path d="M15-5h12v5H15z" fill="#f0dfbc"/>
      <path d="M11 3h5m4 0h5m4 0h5" stroke="#447d9a" stroke-width="2"/>
      <path d="M4 9h35" stroke="#c94e3c" stroke-width="1.5"/>
    </g>
  </g>

  <!-- Kalem çizgisi martılar -->
  <g fill="none" stroke="#3f596e" stroke-width="1.35" stroke-linecap="round" opacity=".8">
    <path d="M53 47q6-7 12 0q6-7 12 0M369 54q5-6 10 0q5-6 10 0M479 35q6-7 12 0q6-7 12 0"/>
  </g>`;
}

// ---------- Arayüz ----------
function buildStore() {
  const store = $('store');
  store.innerHTML = '';
  BUILDINGS.forEach(b => {
    const el = document.createElement('div');
    el.className = 'building hidden';
    el.id = 'b_' + b.id;
    el.innerHTML = `
      <div class="icon">${iconHTML(b)}</div>
      <div class="info">
        <div class="name">${b.name}</div>
        <div class="price"></div>
      </div>
      <div class="owned"></div>`;
    el.addEventListener('click', () => buyBuilding(b));
    el.addEventListener('mousemove', e => showTip(e, () => buildingTip(b)));
    el.addEventListener('mouseleave', hideTip);
    store.appendChild(el);
  });
}

function buildingTip(b) {
  const owned = S.owned[b.id];
  let m = 1;
  UPGRADES.forEach(u => {
    if (u.type === 'building' && u.target === b.id && S.upgrades[u.id]) m *= u.mult;
  });
  const each = b.sps * m;
  return `<b>${b.name}</b> · ${owned} adet
    <div class="tdesc">${b.desc}</div>
    <div class="tnum">Tanesi saniyede ${fmt(each)} simit üretir${owned ? ` — toplam ${fmt(each * owned)}/sn` : ''}.</div>
    <div class="tnum">${buyAmount} adet fiyatı: ${fmt(buildingCost(b, buyAmount))} simit</div>`;
}

function renderStore() {
  BUILDINGS.forEach((b, i) => {
    const el = $('b_' + b.id);
    const cost = buildingCost(b, buyAmount);
    const known = i === 0 || S.owned[b.id] > 0 || S.total >= b.cost * 0.5 ||
                  S.owned[BUILDINGS[i - 1].id] > 0;
    el.classList.toggle('hidden', !known);
    el.classList.toggle('cant', S.simit < cost);
    el.querySelector('.price').textContent = '🥯 ' + fmt(cost);
    el.querySelector('.owned').textContent = S.owned[b.id] || '';
  });
}

function renderUpgrades() {
  const shelf = $('upgradeShelf');
  shelf.innerHTML = '';
  UPGRADES.filter(upgradeVisible)
    .sort((a, b) => a.cost - b.cost)
    .slice(0, 12)
    .forEach(u => {
      const el = document.createElement('div');
      el.className = 'upgrade' + (S.simit < u.cost ? ' cant' : '');
      el.innerHTML = iconHTML(u);
      el.addEventListener('click', () => buyUpgrade(u));
      el.addEventListener('mousemove', e => showTip(e, () =>
        `<b>${u.name}</b><div class="tdesc">${u.desc}</div><div class="tnum">Fiyat: ${fmt(u.cost)} simit</div>`));
      el.addEventListener('mouseleave', hideTip);
      shelf.appendChild(el);
    });
}

function renderAchievements() {
  const wrap = $('achievements');
  wrap.innerHTML = '';
  let got = 0;
  ACHIEVEMENTS.forEach(a => {
    const has = S.achievements[a.id];
    if (has) got++;
    const el = document.createElement('div');
    el.className = 'ach' + (has ? '' : ' locked');
    el.innerHTML = iconHTML(a);
    el.addEventListener('mousemove', e => showTip(e, () =>
      `<b>${has ? a.name : '???'}</b><div class="tdesc">${a.desc}</div>`));
    el.addEventListener('mouseleave', hideTip);
    wrap.appendChild(el);
  });
  $('achCount').textContent = `(${got}/${ACHIEVEMENTS.length})`;
}

function renderCounters() {
  $('simitCount').textContent = fmt(Math.floor(S.simit)) + ' simit';
  $('spsCount').textContent = 'saniyede ' + fmt(sps) + ' simit';
  $('statTotal').textContent = fmt(S.total);
  $('statClicks').textContent = S.clicks.toLocaleString('tr-TR');
  $('statPerClick').textContent = fmt(clickPower);
  $('statGolden').textContent = S.golden;
  document.title = fmt(Math.floor(S.simit)) + ' simit — SimitClicker';
}

function renderBuffs() {
  const bar = $('buffBar');
  bar.innerHTML = '';
  const now = Date.now();
  const names = { frenzy: '🔥 Bereket x7', clickFrenzy: '👆 Tılsımlı El x777' };
  Object.entries(S.buffs).forEach(([k, end]) => {
    if (end > now) {
      const el = document.createElement('div');
      el.className = 'buff';
      el.textContent = `${names[k]} · ${Math.ceil((end - now) / 1000)}sn`;
      bar.appendChild(el);
    }
  });
}

// ---------- Tooltip / toast ----------
function showTip(e, html) {
  const t = $('tooltip');
  t.innerHTML = html();
  t.hidden = false;
  const x = Math.min(e.clientX + 14, innerWidth - t.offsetWidth - 10);
  const y = Math.min(e.clientY + 14, innerHeight - t.offsetHeight - 10);
  t.style.left = x + 'px';
  t.style.top = y + 'px';
}
function hideTip() { $('tooltip').hidden = true; }

function toast(msg) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = msg;
  $('toasts').appendChild(el);
  setTimeout(() => el.remove(), 4200);
}

// ---------- Eylemler ----------
function buyBuilding(b) {
  const cost = buildingCost(b, buyAmount);
  if (S.simit < cost) return;
  S.simit -= cost;
  S.owned[b.id] += buyAmount;
  recalc();
  renderStore();
  renderUpgrades();
  if (b.id === 'marti') updateGulls();
  hideTip();
}

function buyUpgrade(u) {
  if (S.simit < u.cost) return;
  S.simit -= u.cost;
  S.upgrades[u.id] = true;
  recalc();
  renderUpgrades();
  hideTip();
  toast(`${iconHTML(u)} <b>${u.name}</b> alındı!`);
}

function clickSimit(e) {
  // tık, oyuncunun burada olduğunun kanıtı: olay kaçtıysa bile fırınları yak
  if (paused) resumeGame();
  S.simit += clickPower;
  S.total += clickPower;
  S.clicks++;
  const stage = $('simitStage');
  stage.classList.add('pressed');
  setTimeout(() => stage.classList.remove('pressed'), 90);

  const wrap = $('simitWrap');
  const r = wrap.getBoundingClientRect();
  const f = document.createElement('div');
  f.className = 'floater';
  f.textContent = '+' + fmt(clickPower);
  f.style.left = (e.clientX - r.left - 15) + 'px';
  f.style.top = (e.clientY - r.top - 20) + 'px';
  wrap.appendChild(f);
  setTimeout(() => f.remove(), 1300);

  for (let i = 0; i < 3; i++) {
    const c = document.createElement('div');
    c.className = 'crumb';
    c.style.left = (e.clientX - r.left) + 'px';
    c.style.top = (e.clientY - r.top) + 'px';
    c.style.setProperty('--dx', (Math.random() * 80 - 40) + 'px');
    wrap.appendChild(c);
    setTimeout(() => c.remove(), 900);
  }
}

// ---------- Altın simit ----------
function spawnGolden() {
  const left = $('left');
  let g;
  if (simitURL) {
    g = document.createElement('img');
    g.src = simitURL;
    g.draggable = false;
  } else {
    g = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    g.setAttribute('viewBox', '0 0 300 300');
    drawSimit(g, 300, 30);
  }
  g.id = 'goldenSimit';
  g.style.left = (10 + Math.random() * 70) + '%';
  g.style.top = (12 + Math.random() * 55) + '%';
  g.style.filter = 'drop-shadow(0 0 18px rgba(255,215,100,0.95)) saturate(1.7) brightness(1.35)';
  left.appendChild(g);

  // her simidin kendi ömrü: sonradan çalışsa da kopmuş elemanda remove() zararsız
  const despawn = setTimeout(() => g.remove(), 13000);
  g.addEventListener('click', () => {
    clearTimeout(despawn);
    g.remove();
    S.golden++;
    if (Math.random() < 0.55) {
      // Kısmet: anlık kazanç
      const gain = Math.min(S.simit * 0.15, sps * 900) + 13;
      S.simit += gain; S.total += gain;
      toast(`✨ <b>Kısmet!</b> +${fmt(gain)} simit`);
    } else if (Math.random() < 0.85) {
      S.buffs.frenzy = Date.now() + 77000;
      toast('🔥 <b>Bereket!</b> Üretim 77 saniye boyunca x7!');
    } else {
      S.buffs.clickFrenzy = Date.now() + 13000;
      toast('👆 <b>Tılsımlı El!</b> Tıklar 13 saniye boyunca x777!');
    }
    recalc();
  }, { once: true });

  scheduleGolden();
}
// Zamanlayıcılar hedef zaman tutar: duraklamada kalan süre korunur, sıfırlanmaz
let goldenTimer = null;
let goldenDeadline = 0;
function scheduleGolden(delay) {
  clearTimeout(goldenTimer);
  const ms = delay != null ? delay : (60 + Math.random() * 120) * 1000;
  goldenDeadline = Date.now() + ms;
  goldenTimer = setTimeout(spawnGolden, ms);
}

// ---------- Martı olayı: uçan martıyı yakala, simit bonusu kap ----------
let gullTimer = null;
let gullDeadline = 0;
function scheduleGull(delay) {
  clearTimeout(gullTimer);
  const ms = delay != null ? delay : (90 + Math.random() * 180) * 1000;
  gullDeadline = Date.now() + ms;
  gullTimer = setTimeout(spawnGull, ms);
}
function spawnGull() {
  const left = $('left');
  const g = document.createElement('img');
  g.className = 'gull';
  g.src = 'img/marti.webp';
  g.alt = 'Uçan martı';
  g.draggable = false;
  g.style.top = (8 + Math.random() * 30) + '%';
  left.appendChild(g);
  const despawn = setTimeout(() => g.remove(), 9000);
  g.addEventListener('click', () => {
    clearTimeout(despawn);
    g.remove();
    const gain = Math.max(sps * 60, clickPower * 20);
    S.simit += gain; S.total += gain;
    toast(`${iconHTML(BUILDINGS[0])} Martı ağzındaki simiti bıraktı! +${fmt(gain)}`);
  }, { once: true });
  scheduleGull();
}

// ---------- Duraklatma: fırınlar yalnızca bu sekme görünürken çalışır ----------
let paused = false;
let pauseStart = 0;
let goldenLeft = 0;   // duraklamada donan olay geri sayımları
let gullLeft = 0;
const PAUSED_TITLE = '⏸️ Fırınlar durdu — geri dön!';
// olay dönünce hemen patlamasın; ekrana yerleşecek kadar beklesin
const MIN_EVENT_DELAY = 1500;

function pauseGame() {
  if (paused) return;
  paused = true;
  pauseStart = Date.now();
  // süresi zaten bitmiş buff'ları temizle: dondururken dirilmesinler
  Object.entries(S.buffs).forEach(([k, end]) => {
    if (!end || end <= pauseStart) delete S.buffs[k];
  });
  // olay geri sayımları da donar: dönünce baştan başlamaz, kaldığı yerden sürer
  goldenLeft = Math.max(0, goldenDeadline - pauseStart);
  gullLeft = Math.max(0, gullDeadline - pauseStart);
  clearTimeout(goldenTimer);
  clearTimeout(gullTimer);
  // kimsenin görmediği fırsat ekranda beklemesin
  document.querySelectorAll('#goldenSimit, .gull').forEach(el => el.remove());
  recalc();
  document.title = PAUSED_TITLE;
}

function resumeGame() {
  if (!paused) return;
  const away = Math.max(0, Date.now() - pauseStart);
  paused = false;
  lastTick = Date.now();
  // buff'lar da donmuştu: kalan süreyi aynen geri ver
  Object.keys(S.buffs).forEach(k => { S.buffs[k] += away; });
  recalc();
  scheduleGolden(Math.max(MIN_EVENT_DELAY, goldenLeft));
  scheduleGull(Math.max(MIN_EVENT_DELAY, gullLeft));
  renderCounters();
  renderBuffs();
  if (away > 20000) toast('▶️ Hoş geldin! Fırınlar yeniden çalışıyor.');
}

function syncVisibility() {
  if (document.hidden) pauseGame();
  else resumeGame();
}

// ---------- Haber bandı ----------
let newsIndex = 0;
function rotateNews() {
  const pool = [...NEWS];
  NEWS_DYNAMIC.forEach(n => { if (S.owned[n.need] >= n.min) pool.push(n.text); });
  newsIndex = (newsIndex + 1 + Math.floor(Math.random() * 3)) % pool.length;
  $('tickerText').textContent = '📰 ' + pool[newsIndex];
}

// ---------- Başarım kontrolü ----------
function checkAchievements() {
  let changed = false;
  ACHIEVEMENTS.forEach(a => {
    if (!S.achievements[a.id] && a.check()) {
      S.achievements[a.id] = true;
      changed = true;
      toast(`${iconHTML(a)} Başarım: <b>${a.name}</b>`);
    }
  });
  if (changed) renderAchievements();
}

// ---------- Kaydet / yükle ----------
const SAVE_KEY = 'simitclicker-istanbul';
const SAVE_VERSION = 2;
let wiping = false;
function save(silent) {
  if (wiping) return;
  localStorage.setItem(SAVE_KEY, JSON.stringify({
    v: SAVE_VERSION,
    manual: true,
    simit: S.simit, total: S.total, clicks: S.clicks, golden: S.golden,
    owned: S.owned, upgrades: S.upgrades, achievements: S.achievements,
    ts: Date.now(),
  }));
  if (!silent) toast('💾 Oyun kaydedildi.');
}
// v1 kayıtları: 'el' → 'marti' (yeni Martı binası), 'marti' (eski filo) → 'tramvay'
function migrateSave(d) {
  if ((d.v || 1) >= 2) return d;
  const idMap = { el: 'marti', marti: 'tramvay' };
  const mapId = id => idMap[id] || id;
  const remap = (obj, re, rebuild) => {
    const out = {};
    Object.entries(obj || {}).forEach(([k, v]) => {
      const m = k.match(re);
      out[m ? rebuild(m) : k] = v;
    });
    return out;
  };
  d.owned = remap(d.owned, /^([a-z]+)$/, m => mapId(m[1]));
  d.upgrades = remap(d.upgrades, /^([a-z]+)_u(\d+)$/, m => `${mapId(m[1])}_u${m[2]}`);
  d.achievements = remap(d.achievements, /^a_([a-z]+)_(\d+)$/, m => `a_${mapId(m[1])}_${m[2]}`);
  return d;
}
function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return;
    const d = migrateSave(JSON.parse(raw));
    // Önceki sürümlerde aynı anahtara otomatik kayıt yazılıyordu. Kaynağı
    // ayırt edilemeyen bu kayıtları yükleme; yalnızca Kaydet düğmesiyle
    // oluşturulan yeni kayıtlar bir sonraki oturuma taşınır.
    if (d.manual !== true) return;
    S.simit = d.simit || 0; S.total = d.total || 0;
    S.clicks = d.clicks || 0; S.golden = d.golden || 0;
    Object.assign(S.owned, d.owned || {});
    Object.assign(S.upgrades, d.upgrades || {});
    Object.assign(S.achievements, d.achievements || {});
    // çevrimdışı kazanç yok: fırınlar yalnızca sekme açıkken çalışır
  } catch (e) { console.warn('Kayıt okunamadı', e); }
}
function wipe() {
  if (!confirm('Tüm ilerleme silinecek. Fırınlar sönecek. Emin misin?')) return;
  wiping = true;
  localStorage.removeItem(SAVE_KEY);
  location.reload();
}

// ---------- Döngüler ----------
let lastTick = Date.now();
// döngü dondurulduysa (sekme gizli, bilgisayar uykuda) aradaki boşluk simide dönmesin
const MAX_TICK_DT = 1;
function tick() {
  if (paused) return;
  const now = Date.now();
  // saat geriye giderse (NTP düzeltmesi, uykudan dönüş) eksi kazanç yazmasın
  const dt = Math.max(0, Math.min((now - lastTick) / 1000, MAX_TICK_DT));
  lastTick = now;
  // buff süresi bitince yeniden hesapla
  Object.entries(S.buffs).forEach(([k, end]) => {
    if (end && end <= now) { delete S.buffs[k]; recalc(); }
  });
  const gain = sps * dt;
  S.simit += gain;
  S.total += gain;
  renderCounters();
  renderBuffs();
}

function slowTick() {
  if (paused) return;
  recalc();
  renderStore();
  renderUpgrades();
  checkAchievements();
}

// ---------- Başlat ----------
function init() {
  processSimit();
  drawSkyline();
  buildStore();
  load();
  recalc();
  updateGulls();
  renderStore();
  renderUpgrades();
  renderAchievements();
  renderCounters();
  rotateNews();
  addEventListener('resize', layoutGulls);

  $('bigSimit').addEventListener('click', clickSimit);
  $('btnSave').addEventListener('click', () => save(false));
  $('btnWipe').addEventListener('click', wipe);
  document.querySelectorAll('.amt').forEach(btn => {
    btn.addEventListener('click', () => {
      buyAmount = +btn.dataset.n;
      document.querySelectorAll('.amt').forEach(b => b.classList.toggle('sel', b === btn));
      renderStore();
    });
  });

  setInterval(tick, 100);
  setInterval(slowTick, 500);
  setInterval(() => { if (!paused) rotateNews(); }, 12000);
  // sekme gizlenince / kapanınca her şey donar, geri dönünce kaldığı yerden sürer
  document.addEventListener('visibilitychange', syncVisibility);
  addEventListener('pagehide', pauseGame);
  addEventListener('pageshow', syncVisibility);
  addEventListener('focus', syncVisibility);
  scheduleGolden();
  scheduleGull((45 + Math.random() * 90) * 1000); // ilk martı daha erken uğrar
  syncVisibility();
}

init();
