function renderHaiku() {
  const payloadEl = document.querySelector('#haiku-data[type="application/json"]');
  if (!payloadEl) {
    console.error("No haiku-data script found.");
    return;
  }

  let data = {};
  try { 
    data = JSON.parse(payloadEl.textContent); 
  } catch(e) { 
    console.error("Failed to parse haiku JSON", e);
    return; 
  }

  const date = data.date || "";
  const seq = data.seq || "";
  const index = data.index || "./index.html";
  const lines = Array.isArray(data.lines) ? data.lines : [];

  // Build full haiku content
  const main = document.createElement('main');
  main.innerHTML = `
    <div class="hdr">
      <span class="label">10,000 ARROWS</span>
      <hr class="rule" />
      <div class="meta">${date}${seq ? " · " + String(seq).padStart(2,"0") : ""}</div>
    </div>
    <div class="inner">
      <article class="poem">
        <div class="strip">${lines.map(l => `<p>${l}</p>`).join("")}</div>
      </article>
    </div>
    <div class="bottombar">
      <a href="${index}" target="_top" rel="noopener">Index</a>
    </div>
  `;

  // Replace body but keep haiku-data script for safety
  document.body.innerHTML = "";
  document.body.appendChild(payloadEl); // keep JSON in DOM
  document.body.appendChild(main);

  // Handle embed mode: hide header/footer
  const params = new URLSearchParams(location.search);
  const embedded = (window.top !== window.self) || params.has('embed');
  if (embedded) {
    const hdr = main.querySelector('.hdr');
    if (hdr) hdr.style.display = 'none';

    const bar = main.querySelector('.bottombar');
    if (bar) bar.style.display = 'none';
  }
}

// Always render on normal haiku page load
document.addEventListener("DOMContentLoaded", renderHaiku);
