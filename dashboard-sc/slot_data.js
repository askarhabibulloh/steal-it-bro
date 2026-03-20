function sendRoomUsageToAPI() {
  return Promise.resolve(null);
}

let apiCallTimeout = null;

function setupDelayedAPICall() {
  return null;
}

document.addEventListener("DOMContentLoaded", () => {
  const section = document.getElementById("recommendation-section");
  const container = document.getElementById("recommendation-container");
  const loadingIndicator = document.getElementById("api-loading");

  if (section) {
    section.style.display = "block";
    section.classList.add("backend-disabled");
  }

  if (loadingIndicator) {
    loadingIndicator.style.display = "none";
  }

  if (container) {
    container.textContent =
      "Fitur rekomendasi backend dinonaktifkan untuk mode static.";
  }
});
