const input = document.querySelector("#search");
const resultsBox = document.querySelector("#search-results");
let searchIndex = [];

const normalize = (value) => String(value || "")
  .toLocaleLowerCase("de")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/ß/g, "ss");

const escapeHtml = (value) => String(value || "").replace(/[&<>"']/g, c => ({
  "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
}[c]));

function hideResults(){
  if (!resultsBox) return;
  resultsBox.hidden = true;
  resultsBox.innerHTML = "";
}

function showResults(query){
  if (!resultsBox) return;
  const q = normalize(query).trim();
  if (!q){ hideResults(); return; }

  const terms = q.split(/\s+/).filter(Boolean);
  const matches = searchIndex.filter(r => {
    const haystack = normalize([
      r.title, r.category, r.subcategory,
      ...(r.tags || []), ...(r.ingredients || [])
    ].join(" "));
    return terms.every(term => haystack.includes(term));
  }).slice(0, 8);

  if (!matches.length){
    resultsBox.innerHTML = '<div class="search-empty">Kein Rezept gefunden.</div>';
  } else {
    resultsBox.innerHTML = matches.map(r => `
      <a class="search-result" href="${r.url}">
        <strong>${escapeHtml(r.title)}</strong>
        <span>${escapeHtml(r.category)} · ${escapeHtml(r.subcategory)}</span>
      </a>`).join("");
  }
  resultsBox.hidden = false;
}

if (input && resultsBox){
  fetch("/search-index.json", {cache:"no-store"})
    .then(r => r.ok ? r.json() : Promise.reject())
    .then(data => { searchIndex = Array.isArray(data) ? data : []; })
    .catch(() => { searchIndex = []; });

  input.addEventListener("input", () => showResults(input.value));
  input.addEventListener("focus", () => { if (input.value.trim()) showResults(input.value); });
  input.addEventListener("keydown", e => {
    if (e.key === "Escape") hideResults();
    if (e.key === "Enter") {
      const first = resultsBox.querySelector(".search-result");
      if (first) { e.preventDefault(); window.location.href = first.href; }
    }
  });
  document.addEventListener("click", e => {
    if (!e.target.closest(".search-wrap")) hideResults();
  });
}
