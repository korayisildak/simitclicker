import { createState, normalizeSave } from "./engine.js?v=3.0.0";

export const SAVE_KEY = "simitclicker-istanbul";
let canWrite = true;

export function readSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return { state: createState() };
    const data = JSON.parse(raw);
    validateSave(data);
    let backedUp = false;
    if ((data.v || 1) < 3) {
      try {
        if (!localStorage.getItem(`${SAVE_KEY}-before-v3`))
          localStorage.setItem(`${SAVE_KEY}-before-v3`, raw);
        backedUp = true;
      } catch {
        canWrite = false;
      }
    }
    return {
      state: normalizeSave(data),
      migrated: (data.v || 1) < 3,
      backedUp,
    };
  } catch {
    canWrite = false;
    return {
      state: createState(),
      error:
        "Kayıt okunamadı veya depolama kapalı. Mevcut kayıt korunuyor; yedek indirip Ayarlar’dan yükleyebilirsin.",
    };
  }
}

export function validateSave(data) {
  if (
    !data ||
    typeof data !== "object" ||
    Array.isArray(data) ||
    !data.owned ||
    typeof data.owned !== "object" ||
    Array.isArray(data.owned) ||
    typeof data.simit !== "number" ||
    !Number.isFinite(data.simit) ||
    typeof data.total !== "number" ||
    !Number.isFinite(data.total) ||
    (data.v !== undefined && ![1, 2, 3].includes(data.v))
  ) {
    throw new Error("Bu dosya desteklenen bir SimitClicker kaydı değil.");
  }
}

export function saveState(state) {
  if (!canWrite) return false;
  try {
    state.ts = Date.now();
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function replaceSave(data) {
  validateSave(data);
  const state = normalizeSave(data);
  const previous = localStorage.getItem(SAVE_KEY);
  if (previous) localStorage.setItem(`${SAVE_KEY}-before-import`, previous);
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  canWrite = true;
  return state;
}

export function clearSave() {
  localStorage.removeItem(SAVE_KEY);
  canWrite = true;
}

export function saveBackup(state) {
  // Export the live game even when disk writes are blocked; the original stays in storage.
  return JSON.stringify(state, null, 2);
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
