const audio = new Audio();
audio.preload = "none";

function qs(sel) {
  return document.querySelector(sel);
}

function setVisible(el, visible) {
  el.style.display = visible ? "block" : "none";
}

function setText(el, text) {
  if (!el) return;
  el.textContent = text ?? "";
}

function updatePlayPauseButton(btn) {
  if (!btn) return;
  btn.textContent = audio.paused ? "Play" : "Pause";
}

function mountPlayerBar() {
  const bar = qs("[data-playerbar]");
  if (!bar) return;

  const titleEl = bar.querySelector("[data-player-title]");
  const subEl = bar.querySelector("[data-player-sub]");
  const playBtn = bar.querySelector("[data-player-play]");
  const stopBtn = bar.querySelector("[data-player-stop]");

  function refresh() {
    const hasSrc = Boolean(audio.src);
    setVisible(bar, hasSrc);
    updatePlayPauseButton(playBtn);
  }

  playBtn?.addEventListener("click", async () => {
    if (!audio.src) return;
    if (audio.paused) await audio.play();
    else audio.pause();
    refresh();
  });

  stopBtn?.addEventListener("click", () => {
    audio.pause();
    audio.currentTime = 0;
    refresh();
  });

  audio.addEventListener("play", refresh);
  audio.addEventListener("pause", refresh);
  audio.addEventListener("ended", refresh);

  window.addEventListener("ekimero:play", async (ev) => {
    const detail = ev.detail || {};
    const { url, title, subtitle } = detail;
    if (!url) return;

    // Avoid reload if same src
    if (audio.src !== new URL(url, window.location.href).href) audio.src = url;
    setText(titleEl, title || "Playing");
    setText(subEl, subtitle || "");
    await audio.play();
    refresh();
  });

  refresh();
}

function wirePlayButtons() {
  document.addEventListener("click", (e) => {
    const btn = e.target?.closest?.("[data-play]");
    if (!btn) return;

    const url = btn.getAttribute("data-url");
    const title = btn.getAttribute("data-title");
    const subtitle = btn.getAttribute("data-subtitle");
    window.dispatchEvent(new CustomEvent("ekimero:play", { detail: { url, title, subtitle } }));
  });
}

mountPlayerBar();
wirePlayButtons();

