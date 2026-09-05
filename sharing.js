import { downloadBlob } from "./storage.js?v=3.0.0";

export const GAME_URL = "https://korayisildak.github.io/simitclicker/";
const $ = (id) => document.getElementById(id);
let card = null;

export function challengeTarget() {
  const match = location.hash.match(/^#race=(\d{1,4})$/);
  return match ? Math.min(9999, Number(match[1])) : null;
}

export function openShare({ score, district, challenge = false }) {
  const value = Math.floor(score).toLocaleString("tr-TR");
  card = {
    title: "simit.cafe — İstanbul senin fırının.",
    text: challenge
      ? `30 saniyede ${value} simit pişirdim. Geçebilir misin?`
      : `${district}’de ${value} simitlik bir hikâye yazdım. İstanbul senin fırının!`,
    url: challenge
      ? `${GAME_URL}#race=${Math.min(9999, Math.floor(score))}`
      : GAME_URL,
    value,
    label: challenge ? "simit / 30 saniye" : "simitlik bir hikâye.",
    detail: challenge
      ? "Herkes eşit başlar. Rekoru geç, sıra sende."
      : `${district}’den selamlar. Bir simitle başla.`,
  };
  $("shareNumber").textContent = value;
  $("shareLabel").textContent = card.label;
  $("shareDetail").textContent = card.detail;
  $("shareFeedback").textContent =
    "Paylaşım önizlemesi. Sen göndermeden hiçbir şey paylaşılmaz.";
  $("shareDialog").showModal();
}

async function copy() {
  if (!card) return;
  try {
    await navigator.clipboard.writeText(`${card.text}\n${card.url}`);
    $("shareFeedback").textContent = "Mesaj ve oyun bağlantısı kopyalandı.";
  } catch {
    $("shareFeedback").textContent = `Oyun bağlantısı: ${card.url}`;
  }
}

export function initSharing() {
  $("copyShare").addEventListener("click", copy);
  $("nativeShare").addEventListener("click", async () => {
    if (!card) return;
    if (!navigator.share) {
      await copy();
      return;
    }
    try {
      await navigator.share({
        title: card.title,
        text: card.text,
        url: card.url,
      });
      $("shareFeedback").textContent = "Paylaşım tamamlandı.";
    } catch (error) {
      if (error.name !== "AbortError") await copy();
    }
  });
  $("downloadCard").addEventListener("click", async () => {
    if (!card) return;
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1080;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#f7f3e9";
    ctx.fillRect(0, 0, 1080, 1080);
    ctx.strokeStyle = "#183f49";
    ctx.lineWidth = 2;
    ctx.strokeRect(40, 40, 1000, 1000);
    ctx.fillStyle = "#183f49";
    ctx.font = "bold 34px sans-serif";
    ctx.fillText("simit.cafe / İSTANBUL", 100, 135);
    ctx.fillStyle = "#c65332";
    let size = 142;
    do {
      ctx.font = `bold ${size}px Georgia`;
      size -= 4;
    } while (ctx.measureText(card.value).width > 870 && size > 40);
    ctx.fillText(card.value, 100, 340, 875);
    ctx.fillStyle = "#183f49";
    ctx.font = "48px Georgia";
    ctx.fillText(card.label, 100, 415);
    ctx.font = "26px sans-serif";
    ctx.fillText(card.detail, 100, 485, 875);
    try {
      ctx.drawImage($("bigSimit"), 575, 570, 330, 330);
    } catch {
      /* Text-only card remains useful if the photo is unavailable. */
    }
    ctx.font = "italic 54px Georgia";
    ctx.fillText("Sıra sende.", 100, 695);
    ctx.font = "26px sans-serif";
    ctx.fillText("Bir simitle başla. ↗", 100, 750);
    ctx.font = "22px sans-serif";
    ctx.fillText("korayisildak.github.io/simitclicker", 100, 955);
    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/png"),
    );
    if (blob) downloadBlob(blob, "simit-cafe-kartim.png");
  });
}
