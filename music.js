// An original, quiet 16-bar D-minor tune, synthesized locally. No audio downloads.
const TEMPO = 90;
const STEP_SECONDS = 60 / TEMPO / 2;
const MELODY = [
  [74, 0, 77, 76, 74, 0, 69, 72],
  [74, 77, 81, 0, 79, 77, 76, 0],
  [70, 0, 74, 77, 79, 77, 74, 0],
  [72, 76, 79, 0, 77, 76, 72, 0],
  [74, 0, 77, 81, 79, 77, 74, 0],
  [72, 0, 76, 77, 79, 0, 76, 72],
  [69, 73, 76, 0, 77, 76, 73, 0],
  [74, 0, 0, 69, 72, 73, 74, 0],
  [81, 0, 79, 77, 74, 77, 76, 0],
  [79, 77, 76, 72, 76, 0, 79, 0],
  [77, 0, 74, 70, 74, 77, 79, 0],
  [79, 0, 76, 72, 74, 76, 72, 0],
  [77, 81, 79, 77, 74, 0, 72, 74],
  [70, 0, 74, 77, 76, 74, 70, 0],
  [69, 0, 73, 76, 79, 77, 73, 0],
  [74, 0, 77, 76, 74, 0, 0, 0],
];
const BASS_ROOTS = [
  38, 38, 34, 36, 38, 36, 33, 38, 38, 36, 34, 36, 38, 34, 33, 38,
];

/**
 * Music starts only from the music button or setEnabled(true, true) in a gesture.
 * `enabled` is the saved preference; `playing` is reflected in the button text.
 * Only gesture-driven preference changes call onChange.
 */
export function createMusicController(
  button,
  { enabled = false, onChange = () => {}, onError = () => {} } = {},
) {
  let desired = Boolean(enabled);
  let context = null;
  let output = null;
  let timer = null;
  let unlocked = false;
  let playing = false;
  let destroyed = false;
  let pageSuspended = false;
  let revision = 0;
  let step = 0;
  let nextNote = 0;
  const voices = new Set();

  function render() {
    if (!button) return;
    const label = !desired
      ? "Müzik: kapalı"
      : playing
        ? "Müzik: açık"
        : unlocked && (document.hidden || pageSuspended)
          ? "Müzik: bekliyor"
          : "Müzik: başlat";
    button.textContent = label;
    button.setAttribute("aria-pressed", String(desired));
    button.setAttribute(
      "aria-label",
      playing ? "8-bit müziği kapat" : "8-bit müziği başlat",
    );
    button.title = playing
      ? "8-bit müziği kapat"
      : desired && !unlocked
        ? "Kaydedilen tercihin açık. Müziği başlatmak için dokun."
        : "Sakin 8-bit müziği aç";
    button.dataset.playing = String(playing);
  }

  function stop() {
    playing = false;
    if (timer !== null) window.clearInterval(timer);
    timer = null;
    for (const voice of voices) {
      try {
        voice.oscillator.stop();
      } catch {
        // A finished oscillator may already have stopped.
      }
      voice.oscillator.disconnect();
      voice.envelope.disconnect();
    }
    voices.clear();
    step = 0;
    if (context?.state === "running") {
      void context.suspend().catch(() => {});
    }
    render();
  }

  function tone(midi, time, duration, type, volume) {
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    oscillator.type = type;
    oscillator.frequency.value = 440 * 2 ** ((midi - 69) / 12);
    envelope.gain.setValueAtTime(0, time);
    envelope.gain.linearRampToValueAtTime(volume, time + 0.015);
    envelope.gain.setValueAtTime(volume * 0.6, time + duration * 0.55);
    envelope.gain.linearRampToValueAtTime(0, time + duration);
    oscillator.connect(envelope);
    envelope.connect(output);
    const voice = { oscillator, envelope };
    voices.add(voice);
    oscillator.onended = () => {
      oscillator.disconnect();
      envelope.disconnect();
      voices.delete(voice);
    };
    oscillator.start(time);
    oscillator.stop(time + duration + 0.02);
  }

  function schedule() {
    if (!playing || !desired || destroyed || document.hidden || pageSuspended)
      return;
    // Skip stalled time instead of bursting queued notes after a slow frame.
    if (nextNote < context.currentTime - STEP_SECONDS) {
      nextNote = context.currentTime + 0.04;
    }
    while (nextNote < context.currentTime + 0.15) {
      const bar = Math.floor(step / 8);
      const beat = step % 8;
      const note = MELODY[bar][beat];
      if (note) tone(note, nextNote, STEP_SECONDS * 0.78, "square", 0.075);
      if (beat === 0 || beat === 4) {
        const root = BASS_ROOTS[bar];
        tone(
          root + (beat === 4 ? 7 : 0),
          nextNote,
          STEP_SECONDS * 3.2,
          "triangle",
          0.2,
        );
      }
      nextNote += STEP_SECONDS;
      step = (step + 1) % (MELODY.length * 8);
    }
  }

  function fail(message, request) {
    if (destroyed || request !== revision) return;
    stop();
    // Keep the user's preference so an explicit click can retry playback.
    onError(message);
  }

  async function start(fromGesture, request) {
    if ((!unlocked && !fromGesture) || document.hidden || pageSuspended) {
      render();
      return;
    }
    try {
      if (!context) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) {
          fail("Bu tarayıcı 8-bit müzik oynatmayı desteklemiyor.", request);
          return;
        }
        context = new AudioContext();
        output = context.createGain();
        output.gain.value = 0.24;
        // Trim the square wave's sharp upper harmonics for a softer game loop.
        const filter = context.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = 2800;
        output.connect(filter);
        filter.connect(context.destination);
      }
      if (context.state !== "running") await context.resume();
      if (
        destroyed ||
        request !== revision ||
        !desired ||
        document.hidden ||
        pageSuspended
      )
        return;
      if (context.state !== "running") {
        fail("Müziği başlatmak için müzik düğmesine yeniden dokun.", request);
        return;
      }
      unlocked = true;
      if (playing) return;
      playing = true;
      nextNote = context.currentTime + 0.05;
      schedule();
      timer = window.setInterval(() => {
        try {
          schedule();
        } catch {
          fail(
            "Müzik durakladı. Yeniden başlatmak için müzik düğmesine dokun.",
            revision,
          );
        }
      }, 40);
      render();
    } catch {
      fail(
        "Müzik başlatılamadı. Yeniden denemek için müzik düğmesine dokun.",
        request,
      );
    }
  }

  async function setEnabled(value, fromGesture = false) {
    if (destroyed) return false;
    const next = Boolean(value);
    const changed = desired !== next;
    desired = next;
    const request = ++revision;
    if (changed && fromGesture) onChange(desired);
    if (!desired) stop();
    else await start(fromGesture, request);
    render();
    return desired;
  }

  function handleClick() {
    void setEnabled(!playing, true).catch(() => {
      // Guard asynchronous event callbacks, including consumer callbacks.
      stop();
    });
  }

  function handleVisibility() {
    const request = ++revision;
    if (document.hidden || pageSuspended) stop();
    else if (desired && unlocked) {
      void start(false, request).catch(() => stop());
    } else render();
  }

  function handlePageHide() {
    // A page can enter the back-forward cache before visibility changes.
    pageSuspended = true;
    revision += 1;
    stop();
  }

  function handlePageShow() {
    pageSuspended = false;
    handleVisibility();
  }

  button?.addEventListener("click", handleClick);
  document.addEventListener("visibilitychange", handleVisibility);
  window.addEventListener("pagehide", handlePageHide);
  window.addEventListener("pageshow", handlePageShow);
  render();

  return {
    setEnabled,
    destroy() {
      if (destroyed) return;
      destroyed = true;
      revision += 1;
      desired = false;
      stop();
      button?.removeEventListener("click", handleClick);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("pagehide", handlePageHide);
      window.removeEventListener("pageshow", handlePageShow);
      if (context && context.state !== "closed") {
        void context.close().catch(() => {});
      }
    },
  };
}
