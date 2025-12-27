// Summary behavior only.
// Reads assets/current_status.json and renders the page.

document.addEventListener("DOMContentLoaded", () => {
  fetch("/assets/current_status.json", { cache: "no-store" })
    .then(res => {
      if (!res.ok) throw new Error("Failed to load current_status.json");
      return res.json();
    })
    .then(data => {
      const frame = document.getElementById("currentFrame");
      const countEl = document.getElementById("summary-count");

      if (frame && data.current_haiku && data.current_haiku.path_html) {
        frame.src = data.current_haiku.path_html + "?embed=1";
      }

      if (countEl && typeof data.current_count === "number") {
        countEl.textContent =
          `${data.current_count.toLocaleString()} haiku in the hall`;
      }
    })
    .catch(err => {
      // Quiet failure: summary should never break the page
      console.error(err);
    });
});
