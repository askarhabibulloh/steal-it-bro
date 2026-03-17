document.addEventListener("DOMContentLoaded", () => {
  // Theme toggling
  const themeToggleBtn = document.getElementById("theme-toggle");
  const darkIcon = document.getElementById("theme-icon-dark");
  const lightIcon = document.getElementById("theme-icon-light");

  // Default to dark mode if no preference, or respect preference
  if (
    localStorage.theme === "dark" ||
    (!("theme" in localStorage) &&
      window.matchMedia("(prefers-color-scheme: dark)").matches) ||
    !("theme" in localStorage)
  ) {
    document.documentElement.classList.add("dark");
    lightIcon.classList.remove("hidden");
  } else {
    document.documentElement.classList.remove("dark");
    darkIcon.classList.remove("hidden");
  }

  themeToggleBtn.addEventListener("click", () => {
    if (document.documentElement.classList.contains("dark")) {
      document.documentElement.classList.remove("dark");
      localStorage.theme = "light";
      lightIcon.classList.add("hidden");
      darkIcon.classList.remove("hidden");
    } else {
      document.documentElement.classList.add("dark");
      localStorage.theme = "dark";
      darkIcon.classList.add("hidden");
      lightIcon.classList.remove("hidden");
    }
  });

  const ipInput = document.getElementById("ip-input");
  const divideSelect = document.getElementById("divide-select");
  const resultsCards = document.getElementById("results-cards");
  const subnetDetails = document.getElementById("subnet-details");
  const detailedResults = document.getElementById("detailed-results");
  const tableHeading = document.getElementById("table-heading");
  const nameCol = document.getElementById("name-col");
  const cidrGrid = document.getElementById("cidr-grid");

  // Tabs
  const tabBasic = document.getElementById("tab-basic");
  const tabVlsm = document.getElementById("tab-vlsm");
  const basicView = document.getElementById("basic-view");
  const vlsmView = document.getElementById("vlsm-view");
  const vlsmInputsBox = document.getElementById("vlsm-inputs");
  const addReqBtn = document.getElementById("add-req-btn");

  let activeTab = "basic";
  let vlsmReqs = [{ name: "Subnet 1", size: "" }];

  // Render static CIDR Table
  function renderCidrTable() {
    if (!cidrGrid) return;
    let html = "";
    for (let i = 8; i <= 32; i++) {
      html += `<div class="p-3 border border-zinc-200 dark:border-white/5 rounded-lg bg-white/30 dark:bg-black/20 hover:bg-white/50 dark:hover:bg-white/5 transition-colors text-sm flex justify-between shadow-sm">
          <span class="font-mono text-zinc-600 dark:text-zinc-400">/${i}</span>
          <span class="font-mono text-zinc-900 dark:text-zinc-200">${intToIp(maskToInt(i))}</span>
       </div>`;
    }
    cidrGrid.innerHTML = html;
  }
  renderCidrTable();

  if (tabBasic && tabVlsm) {
    tabBasic.addEventListener("click", () => {
      activeTab = "basic";
      tabBasic.className =
        "tab-btn active px-4 py-1.5 text-sm font-medium rounded-md bg-white dark:bg-base-700 text-zinc-900 dark:text-white shadow-sm";
      tabVlsm.className =
        "tab-btn px-4 py-1.5 text-sm font-medium rounded-md text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors";
      basicView.classList.remove("hidden");
      basicView.classList.add("grid");
      vlsmView.classList.add("hidden");
      nameCol.style.display = "none";
      tableHeading.innerText = "Generated Subnets";
      calculateIP(ipInput.value.trim());
    });

    tabVlsm.addEventListener("click", () => {
      activeTab = "vlsm";
      tabVlsm.className =
        "tab-btn active px-4 py-1.5 text-sm font-medium rounded-md bg-white dark:bg-base-700 text-zinc-900 dark:text-white shadow-sm";
      tabBasic.className =
        "tab-btn px-4 py-1.5 text-sm font-medium rounded-md text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors";
      vlsmView.classList.remove("hidden");
      basicView.classList.remove("grid");
      basicView.classList.add("hidden");
      nameCol.style.display = "table-cell";
      tableHeading.innerText = "VLSM Allocation Table";
      renderVlsmInputs();
      calculateIP(ipInput.value.trim());
    });
  }

  function renderVlsmInputs() {
    vlsmInputsBox.innerHTML = "";
    vlsmReqs.forEach((req, idx) => {
      const row = document.createElement("div");
      row.className = "flex items-center gap-3 animate-reveal";
      row.innerHTML = `
             <input type="text" value="${req.name}" data-idx="${idx}" class="vlsm-name w-1/3 form-input py-2 text-sm" placeholder="Name (e.g. LAN A)">
             <input type="number" value="${req.size}" data-idx="${idx}" class="vlsm-size w-1/3 form-input py-2 text-sm" placeholder="Hosts needed">
             ${idx > 0 ? `<button data-idx="${idx}" class="px-3 py-2 text-zinc-400 hover:text-severity-critical transition"><svg class="w-5 h-5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>` : '<div class="w-11"></div>'}
          `;
      vlsmInputsBox.appendChild(row);
    });

    document.querySelectorAll(".vlsm-name").forEach((input) => {
      input.addEventListener("input", (e) => {
        vlsmReqs[e.target.dataset.idx].name = e.target.value;
        calculateIP(ipInput.value.trim());
      });
    });
    document.querySelectorAll(".vlsm-size").forEach((input) => {
      input.addEventListener("input", (e) => {
        vlsmReqs[e.target.dataset.idx].size = e.target.value;
        calculateIP(ipInput.value.trim());
      });
    });
    document.querySelectorAll("button[data-idx]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        vlsmReqs.splice(btn.dataset.idx, 1);
        renderVlsmInputs();
        calculateIP(ipInput.value.trim());
      });
    });
  }

  if (addReqBtn) {
    addReqBtn.addEventListener("click", () => {
      vlsmReqs.push({ name: `Subnet ${vlsmReqs.length + 1}`, size: "" });
      renderVlsmInputs();
    });
  }

  if (divideSelect) {
    divideSelect.addEventListener("change", () => {
      calculateIP(ipInput.value.trim());
    });
  }

  // Real-time calculation on input
  ipInput.addEventListener("input", (e) => {
    const val = e.target.value.trim();
    calculateIP(val);

    // Update URL hash
    if (val) {
      window.history.replaceState(null, null, `#${val}`);
    } else {
      window.history.replaceState(null, null, " ");
    }
  });

  // Check hash on load
  if (window.location.hash) {
    const hashVal = decodeURIComponent(window.location.hash.substring(1));
    if (hashVal) {
      ipInput.value = hashVal;
      calculateIP(hashVal);
    }
  }

  function calculateIP(inputStr) {
    if (!inputStr) {
      clearResults();
      return;
    }

    // Basic parsing logic (simplified for initial implementation)
    let ip = "";
    let mask = 0;

    if (inputStr.includes("/")) {
      const parts = inputStr.split("/");
      ip = parts[0];
      mask = parseInt(parts[1], 10);
    } else if (inputStr.includes(" ")) {
      const parts = inputStr.split(/\s+/);
      ip = parts[0];
      // Convert dotted masking to CIDR
      const maskParts = parts[1].split(".").map(Number);
      if (maskParts.length === 4 && !maskParts.some(isNaN)) {
        const binStr = maskParts
          .map((p) => p.toString(2).padStart(8, "0"))
          .join("");
        mask = binStr.indexOf("0");
        if (mask === -1) mask = 32;
      }
    } else {
      // Default to /24 if only IP entered
      ip = inputStr;
      mask = 24;
    }

    if (!isValidIP(ip) || isNaN(mask) || mask < 0 || mask > 32) {
      clearResults();
      return; // Invalid
    }

    const ipNum = ipToInt(ip);
    const maskNum = maskToInt(mask);
    const networkNum = ipNum & maskNum;
    const wildcardNum = ~maskNum >>> 0;
    const broadcastNum = networkNum | wildcardNum;

    const hostMinNum = mask < 31 ? networkNum + 1 : networkNum;
    const hostMaxNum = mask < 31 ? broadcastNum - 1 : broadcastNum;
    const totalHosts =
      mask < 31 ? Math.pow(2, 32 - mask) - 2 : Math.pow(2, 32 - mask);

    renderCards({
      network: intToIp(networkNum),
      broadcast: intToIp(broadcastNum),
      hostMin: intToIp(hostMinNum),
      hostMax: intToIp(hostMaxNum),
      totalHosts: totalHosts,
      wildcard: intToIp(wildcardNum),
      maskDecimal: intToIp(maskNum),
      cidr: `/${mask}`,
    });

    if (activeTab === "basic") {
      updateDivideSelect(mask);
      const targetMask = parseInt(divideSelect.value, 10);
      if (targetMask && targetMask > mask && targetMask <= 32) {
        generateSubnets(networkNum, mask, targetMask);
      } else {
        detailedResults.innerHTML = `
             <tr class="table-row hover:bg-zinc-100/50 dark:hover:bg-white/5 transition-colors">
                 <td class="px-4 py-3 font-mono text-sm border-b border-zinc-200 dark:border-white/5">${intToIp(networkNum)}/${mask}</td>
                 <td class="px-4 py-3 font-mono text-sm border-b border-zinc-200 dark:border-white/5 text-zinc-600 dark:text-zinc-400">${intToIp(hostMinNum)} - ${intToIp(hostMaxNum)}</td>
                 <td class="px-4 py-3 font-mono text-sm border-b border-zinc-200 dark:border-white/5 text-zinc-600 dark:text-zinc-400">${intToIp(broadcastNum)}</td>
                 <td class="px-4 py-3 font-mono text-sm border-b border-zinc-200 dark:border-white/5">${totalHosts.toLocaleString()}</td>
             </tr>
           `;
        subnetDetails.classList.remove("hidden");
      }
    } else {
      calculateVLSM(networkNum, mask);
    }
  }

  function updateDivideSelect(currentMask) {
    if (!divideSelect) return;
    const currentVal = divideSelect.value;
    let html = '<option value="">Don\'t divide (Single Subnet)</option>';
    for (let i = currentMask + 1; i <= 32; i++) {
      const subnets = Math.pow(2, i - currentMask);
      const hosts = i === 32 ? 1 : i === 31 ? 2 : Math.pow(2, 32 - i) - 2;
      html += `<option value="${i}">/${i} (${subnets.toLocaleString()} subnets, ${hosts.toLocaleString()} hosts/each)</option>`;
    }
    divideSelect.innerHTML = html;
    if (currentVal && parseInt(currentVal, 10) > currentMask) {
      divideSelect.value = currentVal;
    }
  }

  function generateSubnets(networkNum, originalMask, targetMask) {
    const subnetCount = Math.pow(2, targetMask - originalMask);
    const hostsPerSubnet = Math.pow(2, 32 - targetMask);
    let html = "";

    // Limit to 1024 to prevent browser freeze
    const limit = Math.min(subnetCount, 1024);

    for (let i = 0; i < limit; i++) {
      const currentNet = networkNum + i * hostsPerSubnet;
      const currentBcast = currentNet + hostsPerSubnet - 1;
      const hostMin = targetMask < 31 ? currentNet + 1 : currentNet;
      const hostMax = targetMask < 31 ? currentBcast - 1 : currentBcast;
      const usableHosts =
        targetMask < 31 ? hostsPerSubnet - 2 : targetMask === 32 ? 1 : 2;

      html += `
             <tr class="table-row hover:bg-zinc-100/50 dark:hover:bg-white/5 transition-colors">
                 <td class="px-4 py-3 font-mono text-sm border-b border-zinc-200 dark:border-white/5">${intToIp(currentNet)}/${targetMask}</td>
                 <td class="px-4 py-3 font-mono text-sm border-b border-zinc-200 dark:border-white/5 text-zinc-600 dark:text-zinc-400">${intToIp(hostMin)} - ${intToIp(hostMax)}</td>
                 <td class="px-4 py-3 font-mono text-sm border-b border-zinc-200 dark:border-white/5 text-zinc-600 dark:text-zinc-400">${intToIp(currentBcast)}</td>
                 <td class="px-4 py-3 font-mono text-sm border-b border-zinc-200 dark:border-white/5">${usableHosts.toLocaleString()}</td>
             </tr>
          `;
    }

    if (subnetCount > limit) {
      html += `<tr><td colspan="4" class="px-4 py-3 text-center text-sm text-zinc-500 italic">Showing ${limit} of ${subnetCount.toLocaleString()} subnets...</td></tr>`;
    }

    detailedResults.innerHTML = html;
    subnetDetails.classList.remove("hidden");
  }

  function calculateVLSM(baseIpNum, baseMask) {
    // Filter out empty/invalid reqs, parse sizes, sort descending
    const reqs = vlsmReqs
      .map((r, i) => ({ ...r, idx: i, parsedSize: parseInt(r.size, 10) }))
      .filter((r) => !isNaN(r.parsedSize) && r.parsedSize > 0)
      .sort((a, b) => b.parsedSize - a.parsedSize);

    if (reqs.length === 0) {
      detailedResults.innerHTML = `<tr><td colspan="5" class="px-4 py-3 text-center text-sm text-zinc-500">Enter requirements to calculate VLSM</td></tr>`;
      subnetDetails.classList.remove("hidden");
      return;
    }

    let currentIpNum = baseIpNum;
    let html = "";
    let overflow = false;
    const maxIpNum = baseIpNum + Math.pow(2, 32 - baseMask) - 1;

    for (const r of reqs) {
      // Find required mask
      const neededHosts = r.parsedSize + 2; // +2 for net/bcast
      let requiredMask = 32;
      while (Math.pow(2, 32 - requiredMask) < neededHosts && requiredMask > 0) {
        requiredMask--;
      }

      if (requiredMask < baseMask) {
        overflow = true;
      }

      const blockSize = Math.pow(2, 32 - requiredMask);

      if (currentIpNum + blockSize - 1 > maxIpNum) {
        overflow = true;
      }

      if (!overflow) {
        const currentBcast = currentIpNum + blockSize - 1;
        const hostMin = requiredMask < 31 ? currentIpNum + 1 : currentIpNum;
        const hostMax = requiredMask < 31 ? currentBcast - 1 : currentBcast;
        const usableHosts = blockSize - 2;

        html += `
                 <tr class="table-row hover:bg-zinc-100/50 dark:hover:bg-white/5 transition-colors">
                     <td class="px-4 py-3 font-semibold text-sm border-b border-zinc-200 dark:border-white/5 text-accent">${r.name} <span class="text-zinc-500 font-normal text-xs ml-1">(${r.parsedSize} needed)</span></td>
                     <td class="px-4 py-3 font-mono text-sm border-b border-zinc-200 dark:border-white/5">${intToIp(currentIpNum)}/${requiredMask}</td>
                     <td class="px-4 py-3 font-mono text-sm border-b border-zinc-200 dark:border-white/5 text-zinc-600 dark:text-zinc-400">${intToIp(hostMin)} - ${intToIp(hostMax)}</td>
                     <td class="px-4 py-3 font-mono text-sm border-b border-zinc-200 dark:border-white/5 text-zinc-600 dark:text-zinc-400">${intToIp(currentBcast)}</td>
                     <td class="px-4 py-3 font-mono text-sm border-b border-zinc-200 dark:border-white/5 text-severity-low">${usableHosts.toLocaleString()} <span class="text-zinc-500 text-xs">(+${usableHosts - r.parsedSize} spare)</span></td>
                 </tr>
              `;
        currentIpNum += blockSize;
      } else {
        html += `
                 <tr class="table-row bg-severity-critical/10">
                     <td class="px-4 py-3 font-semibold text-sm border-b border-severity-critical/20 text-severity-critical">${r.name}</td>
                     <td colspan="4" class="px-4 py-3 text-sm border-b border-severity-critical/20 text-severity-critical">Not enough space in /${baseMask} network</td>
                 </tr>
              `;
      }
    }

    detailedResults.innerHTML = html;
    subnetDetails.classList.remove("hidden");
  }

  function renderCards(data) {
    resultsCards.innerHTML = `
            <div class="kpi-card glass">
                <span class="kpi-label">Network Address</span>
                <span class="kpi-value text-accent">${data.network}<span class="text-zinc-400 dark:text-zinc-600">${data.cidr}</span></span>
            </div>
            <div class="kpi-card glass">
                <span class="kpi-label">Broadcast Address</span>
                <span class="kpi-value">${data.broadcast}</span>
            </div>
            <div class="kpi-card glass">
                <span class="kpi-label">Usable Host Range</span>
                <span class="kpi-value text-lg mt-3">${data.hostMin} - ${data.hostMax}</span>
            </div>
            <div class="kpi-card glass">
                <span class="kpi-label">Total Usable Hosts</span>
                <span class="kpi-value">${data.totalHosts.toLocaleString()}</span>
            </div>
            <div class="kpi-card glass">
                <span class="kpi-label">Subnet Mask</span>
                <span class="kpi-value">${data.maskDecimal}</span>
            </div>
             <div class="kpi-card glass">
                <span class="kpi-label">Wildcard Mask</span>
                <span class="kpi-value">${data.wildcard}</span>
            </div>
        `;
  }

  function clearResults() {
    resultsCards.innerHTML = "";
    subnetDetails.classList.add("hidden");
    detailedResults.innerHTML = "";
  }

  // IP Utility functions
  function isValidIP(ip) {
    const parts = ip.split(".");
    if (parts.length !== 4) return false;
    return parts.every((p) => {
      const n = parseInt(p, 10);
      return !isNaN(n) && n >= 0 && n <= 255 && p === n.toString();
    });
  }

  function ipToInt(ip) {
    return (
      ip
        .split(".")
        .reduce((acc, part) => (acc << 8) + parseInt(part, 10), 0) >>> 0
    );
  }

  function intToIp(int) {
    return [
      (int >>> 24) & 255,
      (int >>> 16) & 255,
      (int >>> 8) & 255,
      int & 255,
    ].join(".");
  }

  function maskToInt(maskBits) {
    return maskBits === 0 ? 0 : (~0 << (32 - maskBits)) >>> 0;
  }
});
