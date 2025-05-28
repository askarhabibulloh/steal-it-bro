async function sendRoomUsageToAPI() {
  const now = new Date();
  const utcHours = now.getUTCHours();
  const utcMinutes = now.getUTCMinutes();

  // Hitung waktu dalam menit dari tengah malam UTC
  const totalMinutes = utcHours * 60 + utcMinutes;

  // Rentang waktu yang diperbolehkan: 16:31 (991 menit) hingga 00:29 (29 menit keesokan hari)
  const startMinutes = 0 * 60 + 1; // 991
  const endMinutes = 0 * 60 + 2; // 29

  const inAllowedRange =
    totalMinutes >= startMinutes || totalMinutes <= endMinutes;

  if (!inAllowedRange) {
    return null; // atau return 0;
  }
  const resultContainer = document.getElementById("recommendation-container");
  const loadingIndicator = document.getElementById("api-loading");

  try {
    loadingIndicator.style.display = "block";
    const response = await fetch("http://localhost:8800/api/recommend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roomData: getRoomUsageData(),
        requestTime: new Date().toISOString(),
      }),
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const result = await response.json();
    console.log("API response:", result);

    let slotsHTML = `
      <h3 style="color: #1e40af; margin: 0 0 1rem 0; font-weight: 600;">
(⚠️Fitur Eksperimental⚠️) Informasi Ketersediaan Ruang
      </h3>
      <h4>harap lakukan cek ulang sebelum booking</h4>
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem;">
    `;

    if (result.available_slots) {
      Object.entries(result.available_slots).forEach(([room, slots]) => {
        slotsHTML += `
          <div style="background: #f8fafc; padding: 1rem; border-radius: 8px; border: 1px solid #e5e7eb;">
            <h4 style="color: #1e40af; margin: 0 0 0.5rem 0; font-weight: 500; font-size: 0.95rem;">
              Ruang ${room}
            </h4>
            <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
              ${slots
                .map(
                  (slot) => `
                <div style="
                  background: #e0e7ff;
                  color: #2563eb;
                  padding: 0.4rem 0.6rem;
                  border-radius: 6px;
                  font-weight: 500;
                  font-size: 0.85rem;
                ">
                  ${slot.time}
                </div>
              `
                )
                .join("")}
            </div>
          </div>
        `;
      });
    } else {
      slotsHTML += `
        <p style="color: #64748b; text-align: center; padding: 1rem; grid-column: 1/-1;">
          Tidak ada rekomendasi tersedia
        </p>
      `;
    }
    slotsHTML += `</div>`;

    resultContainer.innerHTML = `
      <div style="background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);margin-bottom:5%;">
        ${slotsHTML}
      </div>
    `;
  } catch (error) {
    resultContainer.innerHTML = `
      <div style="background: #fef2f2; padding: 1rem; border-radius: 8px; color: #b91c1c;">
        Gagal memuat rekomendasi: ${error.message}
      </div>
    `;
  } finally {
    loadingIndicator.style.display = "none";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const apiButton = document.getElementById("recommendBtn");

  setTimeout(sendRoomUsageToAPI, 10000);

  if (apiButton) {
    apiButton.addEventListener("click", async () => {
      try {
        const result = await sendRoomUsageToAPI();
        console.log("API success:", result);
      } catch (error) {
        console.error("API error:", error);
      }
    });
  }
});

let apiCallTimeout = null;

function setupDelayedAPICall() {
  document.getElementById("recommendation-container").innerHTML = "";

  const delay = 10000; // 10 detik

  // Clear timer sebelumnya jika ada
  if (apiCallTimeout) clearTimeout(apiCallTimeout);

  // Mulai timer baru
  apiCallTimeout = setTimeout(() => {
    sendRoomUsageToAPI();
  }, delay);
}

// Pasang event listener ke tombol
document
  .getElementById("nextDate")
  .addEventListener("click", setupDelayedAPICall);
document
  .getElementById("prevDate")
  .addEventListener("click", setupDelayedAPICall);
