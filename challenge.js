import { openShare, challengeTarget } from "./sharing.js?v=3.1.0";
const $ = (id) => document.getElementById(id);
const DURATION = 30_000;
let running = false,
  score = 0,
  deadline = 0,
  timer;

export function isRacing() {
  return running;
}

function finish() {
  if (!running) return;
  running = false;
  clearInterval(timer);
  $("challengeBake").disabled = true;
  $("challengeTime").textContent = "0,0";
  $("challengeStart").disabled = false;
  $("challengeStart").textContent = "Bir tur daha";
  $("challengeShare").hidden = false;
  const target = challengeTarget();
  const outcome =
    target === null
      ? "Arkadaşlarına meydan oku!"
      : score > target
        ? "Meydan okumayı kazandın!"
        : score === target
          ? "Berabere! Bir tur daha?"
          : `Hedefe ${target - score} simit kaldı.`;
  $("challengeResult").textContent = `${score} simit pişirdin. ${outcome}`;
}

export function initChallenge() {
  const target = challengeTarget();
  if (target !== null) {
    $("challengeInvite").hidden = false;
    $("inviteText").textContent =
      `Bir arkadaşın 30 saniyede ${target} simit pişirmiş. Geçebilir misin?`;
    $("challengeDescription").textContent =
      `Hedef: 30 saniyede ${target} simidi geç. Her dokunuş 1 simit; dükkân bonusları yarışa katılmaz.`;
  }
  const open = () => $("challengeDialog").showModal();
  $("challengeOpen").addEventListener("click", open);
  $("acceptChallenge").addEventListener("click", open);
  $("challengeStart").addEventListener("click", () => {
    score = 0;
    running = true;
    deadline = performance.now() + DURATION;
    $("challengeScore").textContent = "0";
    $("challengeTime").textContent = "30,0";
    $("challengeResult").textContent = "Taze simitler senden sorulur. Dokun!";
    $("challengeStart").disabled = true;
    $("challengeShare").hidden = true;
    $("challengeBake").disabled = false;
    $("challengeBake").focus();
    clearInterval(timer);
    timer = setInterval(() => {
      const remaining = deadline - performance.now();
      if (remaining <= 0) finish();
      else
        $("challengeTime").textContent = (remaining / 1000)
          .toFixed(1)
          .replace(".", ",");
    }, 50);
  });
  $("challengeBake").addEventListener("keydown", (event) => {
    if (event.repeat && [" ", "Enter"].includes(event.key))
      event.preventDefault();
  });
  $("challengeBake").addEventListener("click", () => {
    if (!running) return;
    if (performance.now() >= deadline) {
      finish();
      return;
    }
    score = Math.min(9999, score + 1);
    $("challengeScore").textContent = String(score);
  });
  $("challengeShare").addEventListener("click", () => {
    $("challengeDialog").close();
    openShare({ score, challenge: true });
  });
  $("challengeDialog").addEventListener("close", () => {
    if (!running) return;
    running = false;
    clearInterval(timer);
    $("challengeBake").disabled = true;
    $("challengeStart").disabled = false;
    $("challengeShare").hidden = true;
    $("challengeResult").textContent =
      "Yarış yarıda kaldı. Hazır olduğunda yeniden başlayabilirsin.";
  });
}
