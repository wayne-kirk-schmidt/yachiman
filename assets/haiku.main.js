// Main Page behavior only.
// Reads data/current_status.json and renders the page.

document.addEventListener("DOMContentLoaded", () => {
  fetch("/data/current_status.json", { cache: "no-store" })
    .then(res => {
      if (!res.ok) throw new Error("Failed to load current_status.json");
      return res.json();
    })
    .then(data => {
      const display = document.querySelector(".homepage-display");
      const countEl = document.getElementById("homepage-count");

      if (display && data.current_haiku && data.current_haiku.path_html) {
        fetch("/" + data.current_haiku.path_html)
          .then(r => r.text())
          .then(html => {
            const cleaned = html
              .replaceAll("{{tags}}", "")
              .replace(/^Tags:.*$/gmi, "");
            display.innerHTML = cleaned;
          })
          .catch(err => console.error(err));
      }

      if (countEl && typeof data.current_count === "number") {
        countEl.textContent =
          `${data.current_count.toLocaleString()} haiku in the hall`;
      }
    })
    .catch(err => {
      // Quiet failure: this script should never break the page
      console.error(err);
    });
});
