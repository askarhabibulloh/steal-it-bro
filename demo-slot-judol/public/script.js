function updateSlotResult(data) {
  const reels = Array(7)
    .fill()
    .map((_, i) => document.getElementById(`reel-${i}`));

  if (reels[0]) {
    data.reels.forEach((symbol, i) => {
      reels[i].textContent = symbol;
    });
    document.getElementById("result").textContent = data.message;
  }
}

// Logic untuk Player Mode (path: /)
if (window.location.pathname === "/") {
  document.getElementById("spin-btn")?.addEventListener("click", async () => {
    const spinBtn = document.getElementById("spin-btn");
    spinBtn.disabled = true;

    try {
      const response = await fetch("/spin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAdmin: false }),
      });

      if (!response.ok) throw new Error("Spin failed");
      const data = await response.json();
      updateSlotResult(data);
    } catch (error) {
      console.error("Error:", error);
      document.getElementById("result").textContent =
        "Error: Gagal memutar slot";
    } finally {
      spinBtn.disabled = false;
    }
  });
}

// Logic untuk Admin Mode (path: /admin)
if (window.location.pathname === "/admin") {
  document
    .getElementById("save-settings")
    ?.addEventListener("click", async () => {
      const forceWin = document.getElementById("force-win").checked;
      const forceLoss = document.getElementById("force-loss").checked;

      await fetch("/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ forceWin, forceLoss }),
      });

      alert("Pengaturan admin disimpan!");
    });
}
