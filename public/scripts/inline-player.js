const HOUR_LIMIT = 250;
const DAY_LIMIT = 500;

function normalizeUrl(url) {
  try {
    return new URL(url, window.location.href).href;
  } catch {
    return url;
  }
}

function createPlaybackTracker() {
  let setupPromise = null;

  async function setup() {
    if (setupPromise) return setupPromise;

    setupPromise = (async () => {
      const firebaseConfig = window.__EKIMERO_FIREBASE_CONFIG;
      if (!firebaseConfig || !window.firebase) return null;

      if (!window.firebase.apps.length) {
        window.firebase.initializeApp(firebaseConfig);
      }

      const auth = window.firebase.auth();
      const db = window.firebase.database();

      try {
        if (!auth.currentUser) await auth.signInAnonymously();
      } catch (error) {
        console.error("Failed to sign in anonymously for play tracking:", error);
        return null;
      }

      return { auth, db };
    })();

    return setupPromise;
  }

  return async function trackPlay() {
    const services = await setup();
    if (!services) return;

    const { auth, db } = services;
    const user = auth.currentUser;
    if (!user) return;

    const userRef = db.ref(`users/${user.uid}`);
    const counterRef = db.ref("totalPlays");

    try {
      await new Promise((resolve, reject) => {
        userRef.transaction(
          (userData) => {
            const now = Date.now();

            if (!userData) {
              return {
                lastUpdate: now,
                lastHourStart: now,
                lastHourCount: 1,
                lastDayStart: now,
                lastDayCount: 1,
              };
            }

            let hourStart = userData.lastHourStart || now;
            let hourCount = userData.lastHourCount || 0;
            if (now - hourStart > 3600_000) {
              hourStart = now;
              hourCount = 0;
            }
            if (hourCount >= HOUR_LIMIT) return;

            let dayStart = userData.lastDayStart || now;
            let dayCount = userData.lastDayCount || 0;
            if (now - dayStart > 24 * 3600_000) {
              dayStart = now;
              dayCount = 0;
            }
            if (dayCount >= DAY_LIMIT) return;

            return {
              lastUpdate: now,
              lastHourStart: hourStart,
              lastHourCount: hourCount + 1,
              lastDayStart: dayStart,
              lastDayCount: dayCount + 1,
            };
          },
          async (error, committed) => {
            if (error) {
              reject(error);
              return;
            }
            if (!committed) {
              resolve(false);
              return;
            }

            try {
              await counterRef.transaction((current) => (current || 0) + 1);
              resolve(true);
            } catch (transactionError) {
              reject(transactionError);
            }
          }
        );
      });
    } catch (error) {
      console.error("Failed to track melody play:", error);
    }
  };
}

function getPlayerState() {
  if (window.__ekimeroInlinePlayer) return window.__ekimeroInlinePlayer;

  const audio = new Audio();
  audio.loop = true;

  const state = {
    audio,
    currentButton: null,
    trackPlay: createPlaybackTracker(),
  };

  window.__ekimeroInlinePlayer = state;
  return state;
}

function updateUI() {
  const { audio, currentButton } = getPlayerState();
  const isPlaying = !audio.paused;
  const playButtons = document.querySelectorAll("[data-play]");

  playButtons.forEach((btn) => {
    const buttonUrl = btn.getAttribute("data-url");
    const isCurrent =
      currentButton === btn ||
      (buttonUrl && audio.src && normalizeUrl(buttonUrl) === audio.src);

    if (isCurrent) {
      btn.textContent = isPlaying ? "⏸" : "▶";
      btn.setAttribute("data-playing", String(isPlaying));
    } else {
      btn.textContent = "▶";
      btn.removeAttribute("data-playing");
    }
  });
}

function init() {
  const state = getPlayerState();
  const { audio } = state;

  if (!state.eventsBound) {
    document.addEventListener("click", async (e) => {
      const btn = e.target?.closest?.("[data-play]");
      if (!btn) return;

      const url = btn.getAttribute("data-url");
      if (!url) return;

      if (state.currentButton === btn) {
        if (audio.paused) await audio.play();
        else audio.pause();
      } else {
        if (state.currentButton) audio.pause();
        audio.src = normalizeUrl(url);
        state.currentButton = btn;
        await audio.play();
      }

      updateUI();
    });

    audio.addEventListener("play", () => {
      updateUI();
      state.trackPlay();
    });
    audio.addEventListener("pause", updateUI);
    audio.addEventListener("ended", updateUI);

    state.eventsBound = true;
  }

  updateUI();
}

document.addEventListener("astro:page-load", init);
init();
