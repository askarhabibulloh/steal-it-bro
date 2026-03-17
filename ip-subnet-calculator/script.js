(function () {
  const ipInput = document.getElementById("ipInput");
  const maskInput = document.getElementById("maskInput");
  const vlsmInput = document.getElementById("vlsmInput");
  const subnetPrefixInput = document.getElementById("subnetPrefixInput");
  const themeToggle = document.getElementById("themeToggle");
  const navDrawer = document.getElementById("navDrawer");
  const overviewCards = document.getElementById("overviewCards");
  const vlsmTable = document.getElementById("vlsmTable");
  const subnetTable = document.getElementById("subnetTable");
  const subnetCount = document.getElementById("subnetCount");
  const subnetSummary = document.getElementById("subnetSummary");
  const vlsmBaseBlock = document.getElementById("vlsmBaseBlock");
  const vlsmTableText = document.createElement("textarea");
  const subnetTableText = document.createElement("textarea");
  vlsmTableText.id = "vlsmTableText";
  subnetTableText.id = "subnetTableText";
  vlsmTableText.hidden = true;
  subnetTableText.hidden = true;
  document.body.append(vlsmTableText, subnetTableText);

  const presetButtons = Array.from(document.querySelectorAll("[data-mask]"));
  const navButtons = Array.from(
    document.querySelectorAll("[data-mode-target]"),
  );
  const MAX_SUBNET_ROWS = 1024;
  const THEME_STORAGE_KEY = "ip-subnet-theme";
  const MODE_STORAGE_KEY = "ip-subnet-mode";

  let suppressHashUpdate = false;

  function parseIPv4(value) {
    const parts = String(value).trim().split(".");
    if (parts.length !== 4) return null;

    let result = 0;
    for (const part of parts) {
      if (!/^\d+$/.test(part)) return null;
      const octet = Number(part);
      if (octet < 0 || octet > 255) return null;
      result = ((result << 8) >>> 0) + octet;
    }
    return result >>> 0;
  }

  function intToIPv4(value) {
    const unsigned = value >>> 0;
    return [
      unsigned >>> 24,
      (unsigned >>> 16) & 255,
      (unsigned >>> 8) & 255,
      unsigned & 255,
    ].join(".");
  }

  function isPowerOfTwoMinusOne(value) {
    return value >= 0 && ((value + 1) & value) === 0;
  }

  function prefixToMask(prefix) {
    const bits = Number(prefix);
    if (!Number.isInteger(bits) || bits < 0 || bits > 32) return null;
    if (bits === 0) return 0;
    return (0xffffffff << (32 - bits)) >>> 0;
  }

  function maskToPrefix(maskInt) {
    let prefix = 0;
    for (let bit = 31; bit >= 0; bit -= 1) {
      if ((maskInt & (1 << bit)) !== 0) {
        prefix += 1;
      } else {
        break;
      }
    }
    return prefix;
  }

  function maskToPrefixValidated(maskInt) {
    const wildcard = ~maskInt >>> 0;
    if (!isPowerOfTwoMinusOne(wildcard)) return null;
    return maskToPrefix(maskInt);
  }

  function parseMask(value) {
    const raw = String(value).trim();
    if (!raw) return null;

    if (raw.startsWith("/")) {
      const prefix = Number(raw.slice(1));
      const maskInt = prefixToMask(prefix);
      return maskInt === null ? null : { prefix, maskInt };
    }

    if (/^\d{1,2}$/.test(raw)) {
      const prefix = Number(raw);
      const maskInt = prefixToMask(prefix);
      return maskInt === null ? null : { prefix, maskInt };
    }

    const maskInt = parseIPv4(raw);
    if (maskInt === null) return null;
    const prefix = maskToPrefixValidated(maskInt);
    if (prefix === null) return null;
    return { prefix, maskInt };
  }

  function formatLargeNumber(value) {
    return new Intl.NumberFormat("en-US").format(value);
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function buildOverviewCards(model) {
    const cards = [
      {
        label: "Network Address",
        title: model.networkAddress,
        description: `Base of the subnet block. Mask ${model.maskDisplay} isolates ${model.prefix} network bits.`,
        copy: model.networkAddress,
      },
      {
        label: "Broadcast Address",
        title: model.broadcastAddress,
        description:
          "Last address in the subnet boundary. Useful for block validation and range checks.",
        copy: model.broadcastAddress,
      },
      {
        label: "Usable Host Range",
        title: model.usableRange,
        description: model.hostRouteNote,
        copy: model.usableRange,
      },
      {
        label: "Total Hosts",
        title: formatLargeNumber(model.usableHosts),
        description: `${formatLargeNumber(model.totalAddresses)} total addresses in the block.`,
        copy: String(model.usableHosts),
      },
      {
        label: "Wildcard Mask",
        title: model.wildcardAddress,
        description:
          "Inverse of the subnet mask. Frequently used in ACLs and route filters.",
        copy: model.wildcardAddress,
      },
    ];

    overviewCards.innerHTML = cards
      .map(
        (card) => `
      <article class="result-card">
        <div class="metadata-sandwich">
          <div class="meta-label">${card.label}</div>
          <div class="result-value">${escapeHtml(card.title)}</div>
          <div class="result-subtext">${escapeHtml(card.description)}</div>
        </div>
        <div class="result-head">
          <button class="copy-btn" data-copy-value="${escapeHtml(card.copy)}">Copy</button>
        </div>
      </article>
    `,
      )
      .join("");
  }

  function parseHostList(raw) {
    return String(raw)
      .split(/[\n,]+/)
      .map((value) => Number(String(value).trim()))
      .filter((value) => Number.isFinite(value) && value >= 0)
      .map((value) => Math.floor(value));
  }

  function hostsToPrefix(requiredHosts) {
    if (requiredHosts <= 1) return 32;
    if (requiredHosts <= 2) return 31;
    const needed = requiredHosts + 2;
    const size = 2 ** Math.ceil(Math.log2(needed));
    return 32 - Math.log2(size);
  }

  function buildRangeText(start, end) {
    return `${start} - ${end}`;
  }

  function allocateVlsm(model) {
    const requirements = parseHostList(vlsmInput.value).sort((a, b) => b - a);
    const rows = [];
    let cursor = model.networkInt;
    const limit = model.broadcastInt;

    for (const requestedHosts of requirements) {
      const prefix = hostsToPrefix(requestedHosts);
      const blockSize = 2 ** (32 - prefix);
      if (cursor % blockSize !== 0) {
        cursor = ((Math.floor(cursor / blockSize) + 1) * blockSize) >>> 0;
      }

      const network = cursor >>> 0;
      const broadcastNumber = network + blockSize - 1;
      const broadcast = broadcastNumber >>> 0;
      const usableHosts = prefix >= 31 ? blockSize : Math.max(0, blockSize - 2);
      const overflow = broadcastNumber > limit;

      rows.push({
        requestedHosts,
        prefix,
        network,
        broadcast,
        usableHosts,
        overflow,
      });

      cursor = (broadcastNumber + 1) >>> 0;
    }

    return rows;
  }

  function renderVlsm(model) {
    const rows = allocateVlsm(model);
    const textRows = [
      "Requested Hosts | Allocated Subnet | Network | Broadcast | Usable Range | Prefix",
    ];

    vlsmTable.innerHTML = "";
    const fragment = document.createDocumentFragment();

    for (const row of rows) {
      const subnet = `${intToIPv4(row.network)}/${row.prefix}`;
      const rangeStart =
        row.prefix >= 31
          ? intToIPv4(row.network)
          : intToIPv4((row.network + 1) >>> 0);
      const rangeEnd =
        row.prefix >= 31
          ? intToIPv4(row.broadcast)
          : intToIPv4((row.broadcast - 1) >>> 0);
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${row.requestedHosts}</td>
        <td>${subnet}${row.overflow ? " Overflow" : ""}</td>
        <td>${intToIPv4(row.network)}</td>
        <td>${intToIPv4(row.broadcast)}</td>
        <td>${buildRangeText(rangeStart, rangeEnd)}</td>
        <td>/${row.prefix}</td>
      `;
      fragment.appendChild(tr);
      textRows.push(
        [
          row.requestedHosts,
          subnet,
          intToIPv4(row.network),
          intToIPv4(row.broadcast),
          `${rangeStart} - ${rangeEnd}`,
          `/${row.prefix}`,
        ].join(" | "),
      );
    }

    if (!rows.length) {
      const tr = document.createElement("tr");
      tr.innerHTML = '<td colspan="6">No valid host requests provided.</td>';
      fragment.appendChild(tr);
      textRows.push("No valid host requests provided.");
    }

    vlsmTable.appendChild(fragment);
    vlsmTableText.value = textRows.join("\n");
  }

  function generateSubnetTable(model) {
    const childPrefix = Number(subnetPrefixInput.value);
    const prefix = Number.isInteger(childPrefix)
      ? Math.max(0, Math.min(32, childPrefix))
      : model.prefix + 2;
    subnetPrefixInput.value = String(prefix);
    subnetSummary.textContent = `${intToIPv4(model.networkInt)}/${model.prefix} -> /${prefix}`;

    if (prefix <= model.prefix) {
      subnetCount.textContent = "0";
      subnetTable.innerHTML =
        '<tr><td colspan="6">Child prefix must be more specific than the current network.</td></tr>';
      subnetTableText.value =
        "Child prefix must be more specific than the current network.";
      return;
    }

    const parentSize = 2 ** (32 - model.prefix);
    const childSize = 2 ** (32 - prefix);
    const subnetTotal = parentSize / childSize;
    const rows = [];
    const limit = Math.min(subnetTotal, MAX_SUBNET_ROWS);
    let network = model.networkInt;
    const textRows = ["# | Subnet | Network | Broadcast | Range | Hosts"];

    for (let index = 0; index < limit; index += 1) {
      const broadcast = (network + childSize - 1) >>> 0;
      const rangeStart =
        prefix >= 31 ? intToIPv4(network) : intToIPv4((network + 1) >>> 0);
      const rangeEnd =
        prefix >= 31 ? intToIPv4(broadcast) : intToIPv4((broadcast - 1) >>> 0);
      const hosts = prefix >= 31 ? childSize : Math.max(0, childSize - 2);
      rows.push({
        index: index + 1,
        subnet: `${intToIPv4(network)}/${prefix}`,
        network: intToIPv4(network),
        broadcast: intToIPv4(broadcast),
        range: `${rangeStart} - ${rangeEnd}`,
        hosts,
      });
      textRows.push(
        `${index + 1} | ${intToIPv4(network)}/${prefix} | ${intToIPv4(network)} | ${intToIPv4(broadcast)} | ${rangeStart} - ${rangeEnd} | ${hosts}`,
      );
      network = (broadcast + 1) >>> 0;
    }

    subnetCount.textContent = formatLargeNumber(subnetTotal);
    const fragment = document.createDocumentFragment();
    rows.forEach((row) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${row.index}</td>
        <td>${row.subnet}</td>
        <td>${row.network}</td>
        <td>${row.broadcast}</td>
        <td>${row.range}</td>
        <td>${formatLargeNumber(row.hosts)}</td>
      `;
      fragment.appendChild(tr);
    });

    if (!rows.length) {
      const tr = document.createElement("tr");
      tr.innerHTML =
        '<td colspan="6">No subnets generated for the selected prefix.</td>';
      fragment.appendChild(tr);
      textRows.push("No subnets generated for the selected prefix.");
    }

    if (subnetTotal > MAX_SUBNET_ROWS) {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td colspan="6">Output truncated to ${MAX_SUBNET_ROWS} rows for performance.</td>`;
      fragment.appendChild(tr);
      textRows.push(
        `Output truncated to ${MAX_SUBNET_ROWS} rows for performance.`,
      );
    }

    subnetTable.innerHTML = "";
    subnetTable.appendChild(fragment);
    subnetTableText.value = textRows.join("\n");
  }

  function updateUrlHash(state) {
    if (suppressHashUpdate) return;
    const params = new URLSearchParams();
    params.set("ip", state.ip);
    params.set("mask", state.mask);
    params.set("vlsm", state.vlsm);
    params.set("subnet", state.subnet);
    history.replaceState(null, "", `#${params.toString()}`);
  }

  function getStateFromInputs() {
    return {
      ip: ipInput.value.trim(),
      mask: maskInput.value.trim(),
      vlsm: vlsmInput.value,
      subnet: subnetPrefixInput.value.trim(),
    };
  }

  function applyStateFromHash() {
    const raw = location.hash.replace(/^#/, "");
    if (!raw) return;
    const params = new URLSearchParams(raw);
    suppressHashUpdate = true;
    if (params.has("ip")) ipInput.value = params.get("ip");
    if (params.has("mask")) maskInput.value = params.get("mask");
    if (params.has("vlsm")) vlsmInput.value = params.get("vlsm");
    if (params.has("subnet")) subnetPrefixInput.value = params.get("subnet");
    suppressHashUpdate = false;
  }

  function renderError(message) {
    overviewCards.innerHTML = `
      <article class="result-card" style="grid-column: 1 / -1;">
        <div class="metadata-sandwich">
          <div class="meta-label">Validation Error</div>
          <div class="result-value">${escapeHtml(message)}</div>
          <div class="result-subtext">Correct the input and the calculation will recover automatically.</div>
        </div>
      </article>
    `;
    vlsmTable.innerHTML = '<tr><td colspan="6">-</td></tr>';
    subnetTable.innerHTML = '<tr><td colspan="6">-</td></tr>';
    subnetCount.textContent = "0";
    subnetSummary.textContent = "-";
    vlsmBaseBlock.textContent = "-";
  }

  function compute() {
    const ipInt = parseIPv4(ipInput.value);
    const maskData = parseMask(maskInput.value);

    if (ipInt === null) {
      renderError(
        "Invalid IPv4 address. Use dotted decimal notation with octets between 0 and 255.",
      );
      return;
    }

    if (!maskData) {
      renderError(
        "Invalid subnet mask. Use CIDR like /24 or a valid dotted-decimal mask such as 255.255.255.0.",
      );
      return;
    }

    const { prefix, maskInt } = maskData;
    const wildcardInt = ~maskInt >>> 0;
    const networkInt = (ipInt & maskInt) >>> 0;
    const broadcastInt = (networkInt | wildcardInt) >>> 0;
    const totalAddresses = 2 ** (32 - prefix);
    const usableHosts =
      prefix >= 31 ? totalAddresses : Math.max(0, totalAddresses - 2);
    const usableStart =
      prefix === 32
        ? ipInt
        : prefix >= 31
          ? networkInt
          : (networkInt + 1) >>> 0;
    const usableEnd =
      prefix === 32
        ? ipInt
        : prefix >= 31
          ? broadcastInt
          : (broadcastInt - 1) >>> 0;
    const hostRouteNote =
      prefix === 32
        ? "Host route. Single-address subnet."
        : prefix === 31
          ? "Point-to-point subnet. Both addresses are usable."
          : "Traditional subnet. Network and broadcast are excluded from usable hosts.";

    const model = {
      ipInt,
      maskInt,
      prefix,
      wildcardInt,
      networkInt,
      broadcastInt,
      totalAddresses,
      usableHosts,
      networkAddress: intToIPv4(networkInt),
      broadcastAddress: intToIPv4(broadcastInt),
      wildcardAddress: intToIPv4(wildcardInt),
      maskDisplay: intToIPv4(maskInt),
      usableRange: `${intToIPv4(usableStart)} - ${intToIPv4(usableEnd)}`,
      hostRouteNote,
    };

    buildOverviewCards(model);
    renderVlsm(model);
    generateSubnetTable(model);
    vlsmBaseBlock.textContent = `${model.networkAddress}/${prefix}`;
    updateUrlHash(getStateFromInputs());
  }

  function handleCopy(button) {
    const targetId = button.getAttribute("data-copy-target");
    const value = button.getAttribute("data-copy-value");
    const source = targetId ? document.getElementById(targetId) : null;
    const text = source
      ? source.value || source.dataset.copyText || source.textContent || ""
      : value;

    if (!text) return;

    navigator.clipboard
      .writeText(text)
      .then(() => {
        button.classList.add("is-active");
        const label = button.textContent;
        button.textContent = "Copied";
        window.setTimeout(() => {
          button.textContent = label;
          button.classList.remove("is-active");
        }, 900);
      })
      .catch(() => {
        const fallback = document.createElement("textarea");
        fallback.value = text;
        document.body.appendChild(fallback);
        fallback.select();
        document.execCommand("copy");
        fallback.remove();
      });
  }

  function applyTheme(theme) {
    const nextTheme = theme === "light" ? "light" : "dark";
    document.body.dataset.theme = nextTheme;
    themeToggle.setAttribute("aria-pressed", String(nextTheme === "light"));
    themeToggle.textContent =
      nextTheme === "light" ? "Dark mode" : "Light mode";
    localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
  }

  function setActiveNav(targetMode) {
    navButtons.forEach((button) => {
      button.classList.toggle(
        "is-active",
        button.getAttribute("data-mode-target") === targetMode,
      );
    });
  }

  function applyMode(mode) {
    const nextMode = mode === "vlsm" || mode === "splitter" ? mode : "overview";
    document.body.dataset.mode = nextMode;
    setActiveNav(nextMode);
    localStorage.setItem(MODE_STORAGE_KEY, nextMode);
  }

  function initMode() {
    applyMode(localStorage.getItem(MODE_STORAGE_KEY));
  }

  function initTheme() {
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (storedTheme === "light" || storedTheme === "dark") {
      applyTheme(storedTheme);
      return;
    }

    const prefersLight =
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: light)").matches;
    applyTheme(prefersLight ? "light" : "dark");
  }

  ipInput.addEventListener("input", compute);
  maskInput.addEventListener("input", compute);
  vlsmInput.addEventListener("input", compute);
  subnetPrefixInput.addEventListener("input", compute);

  themeToggle.addEventListener("click", () => {
    applyTheme(document.body.dataset.theme === "light" ? "dark" : "light");
  });

  navButtons.forEach((button) => {
    button.addEventListener("click", () => {
      applyMode(button.getAttribute("data-mode-target"));
    });
  });

  presetButtons.forEach((button) => {
    button.addEventListener("click", () => {
      maskInput.value = button.getAttribute("data-mask");
      compute();
    });
  });

  document.addEventListener("click", (event) => {
    const button = event.target.closest(
      "[data-copy-target], [data-copy-value]",
    );
    if (!button) return;
    handleCopy(button);
  });

  window.addEventListener("hashchange", () => {
    applyStateFromHash();
    compute();
  });

  initMode();
  initTheme();
  applyStateFromHash();
  compute();
})();
