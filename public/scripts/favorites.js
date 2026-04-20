const KEY = "ekimero:favorites:v1";

function readSet() {
  try {
    const arr = JSON.parse(localStorage.getItem(KEY) || "[]");
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function writeSet(set) {
  localStorage.setItem(KEY, JSON.stringify([...set]));
  window.dispatchEvent(new CustomEvent("ekimero:favorites-changed", { detail: { set } }));
}

function updateButton(btn, set) {
  const id = btn.getAttribute("data-fav-id");
  const active = set.has(id);
  btn.setAttribute("aria-pressed", active ? "true" : "false");
  btn.textContent = active ? "★ Favorite" : "☆ Favorite";
}

function init() {
  let set = readSet();

  function refreshAll() {
    document.querySelectorAll("[data-fav-id]").forEach((btn) => updateButton(btn, set));
  }

  refreshAll();

  document.addEventListener("click", (e) => {
    const btn = e.target?.closest?.("[data-fav-id]");
    if (!btn) return;
    const id = btn.getAttribute("data-fav-id");
    if (!id) return;
    if (set.has(id)) set.delete(id);
    else set.add(id);
    writeSet(set);
    refreshAll();
  });

  window.addEventListener("storage", (e) => {
    if (e.key !== KEY) return;
    set = readSet();
    refreshAll();
  });
}

init();

