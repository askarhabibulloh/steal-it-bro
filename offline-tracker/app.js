const STORAGE_KEYS = {
  theme: "puretrack-theme",
  accent: "puretrack-accent",
  viewMode: "puretrack-view-mode",
};

function readStoredValue(key, fallbackValue) {
  try {
    return localStorage.getItem(key) || fallbackValue;
  } catch (error) {
    return fallbackValue;
  }
}

function writeStoredValue(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    // Ignore storage write failures and keep the current session working.
  }
}

const state = {
  theme: document.documentElement.dataset.theme || "dark",
  accent:
    document.documentElement.style.getPropertyValue("--accent-color") ||
    "#00ff66",
  viewMode: readStoredValue(STORAGE_KEYS.viewMode, "2d"),
};

let watchId = null;
let startTime = null;
let timerInterval = null;
let pathCoordinates = []; // [{lat, lon, alt, time}]

let totalDistance = 0;
let elevationGain = 0;
let lastAltitude = null;

const canvas = document.getElementById("trailCanvas");
const ctx = canvas.getContext("2d");
const statusBanner = document.getElementById("status-banner");
const viewerBadge = document.getElementById("viewer-badge");
const themeToggle = document.getElementById("theme-toggle");
const viewToggle = document.getElementById("view-toggle");
const accentPicker = document.getElementById("accent-picker");
const themeMeta = document.querySelector('meta[name="theme-color"]');
const exportGpxButton = document.getElementById("export-gpx-btn");
const exportSvgButton = document.getElementById("export-svg-btn");
const exportPngButton = document.getElementById("export-png-btn");

const DEFAULT_ACCENT = "#00ff66";

function setStatus(message = "", tone = "info") {
  statusBanner.textContent = message;
  statusBanner.className = tone === "error" ? "gps-error" : "";
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function lerp(start, end, amount) {
  return start + (end - start) * amount;
}

function formatDistance(distanceKm) {
  return `${distanceKm.toFixed(2)} km`;
}

function formatPace(distanceKm, elapsedMs) {
  if (distanceKm <= 0 || elapsedMs <= 0) return "--:--";

  const paceDecimal = elapsedMs / 60000 / distanceKm;
  const paceMins = Math.floor(paceDecimal);
  const paceSecs = String(Math.floor((paceDecimal - paceMins) * 60)).padStart(
    2,
    "0",
  );

  return `${paceMins}:${paceSecs}`;
}

function getColorForTheme(theme) {
  return theme === "light" ? "#f4f6f8" : "#0c0c0e";
}

function applyTheme(theme) {
  state.theme = theme;
  document.documentElement.dataset.theme = theme;
  writeStoredValue(STORAGE_KEYS.theme, theme);
  themeMeta.setAttribute("content", getColorForTheme(theme));
  themeToggle.textContent = theme === "dark" ? "Light" : "Dark";
}

function applyAccent(accentColor) {
  state.accent = accentColor;
  document.documentElement.style.setProperty("--accent-color", accentColor);
  writeStoredValue(STORAGE_KEYS.accent, accentColor);
  accentPicker.value = accentColor;
}

function applyViewMode(viewMode) {
  state.viewMode = viewMode;
  writeStoredValue(STORAGE_KEYS.viewMode, viewMode);
  viewToggle.textContent = viewMode === "2d" ? "3D" : "2D";
  viewerBadge.textContent = viewMode === "2d" ? "2D trail" : "Ribbon 2.5D";
  drawTrail();
}

function setExportButtonsVisible(isVisible) {
  const displayValue = isVisible ? "inline-flex" : "none";
  exportGpxButton.style.display = displayValue;
  exportSvgButton.style.display = displayValue;
  exportPngButton.style.display = displayValue;
}

function initializePreferences() {
  applyTheme(
    readStoredValue(
      STORAGE_KEYS.theme,
      window.matchMedia("(prefers-color-scheme: light)").matches
        ? "light"
        : "dark",
    ),
  );
  applyAccent(readStoredValue(STORAGE_KEYS.accent, DEFAULT_ACCENT));
  applyViewMode(readStoredValue(STORAGE_KEYS.viewMode, "2d"));
}

function getTrackData() {
  return pathCoordinates.map((point) => ({
    lat: point.lat,
    lon: point.lon,
    alt: Number(point.alt) || 0,
    time: point.time,
    distanceKm: Number(point.distanceKm) || 0,
  }));
}

function getTrackBounds(points) {
  const latitudes = points.map((point) => point.lat);
  const longitudes = points.map((point) => point.lon);
  const altitudes = points.map((point) => Number(point.alt) || 0);

  return {
    minLat: Math.min(...latitudes),
    maxLat: Math.max(...latitudes),
    minLon: Math.min(...longitudes),
    maxLon: Math.max(...longitudes),
    minAlt: Math.min(...altitudes),
    maxAlt: Math.max(...altitudes),
  };
}

function getLocalPoint(point, origin, metersPerLatDegree, metersPerLonDegree) {
  const pointAltitude = Number(point.alt) || 0;
  const originAltitude = Number(origin.alt) || 0;

  return {
    east: ((point.lon - origin.lon) * metersPerLonDegree) / 1000,
    north: ((point.lat - origin.lat) * metersPerLatDegree) / 1000,
    relativeAlt: pointAltitude - originAltitude,
  };
}

function projectRibbonPoint(localPoint, verticalScale) {
  const angleCos = Math.cos(Math.PI / 6);
  const angleSin = Math.sin(Math.PI / 6);
  const isoBaseX = (localPoint.east - localPoint.north) * angleCos;
  const isoBaseY = (localPoint.east + localPoint.north) * angleSin;

  return {
    x: isoBaseX,
    y: isoBaseY - localPoint.relativeAlt * verticalScale,
    groundY: isoBaseY,
    relativeAlt: localPoint.relativeAlt,
  };
}

function buildRibbonEdges(centerline, halfWidth) {
  const leftEdge = [];
  const rightEdge = [];

  for (let index = 0; index < centerline.length; index += 1) {
    const previousPoint = centerline[index - 1] || centerline[index];
    const nextPoint = centerline[index + 1] || centerline[index];
    const deltaX = nextPoint.x - previousPoint.x;
    const deltaY = nextPoint.y - previousPoint.y;
    const length = Math.hypot(deltaX, deltaY) || 1;
    const normalX = -deltaY / length;
    const normalY = deltaX / length;
    const taper = index === 0 || index === centerline.length - 1 ? 0.9 : 1;

    leftEdge.push({
      x: centerline[index].x + normalX * halfWidth * taper,
      y: centerline[index].y + normalY * halfWidth * taper,
    });
    rightEdge.push({
      x: centerline[index].x - normalX * halfWidth * taper,
      y: centerline[index].y - normalY * halfWidth * taper,
    });
  }

  return { leftEdge, rightEdge };
}

function buildRibbonModel(points, width, height, padding = 48) {
  if (points.length < 2) return null;

  const origin = points[0];
  const metersPerLatDegree = 111132;
  const metersPerLonDegree =
    111320 * Math.cos((Number(origin.lat) * Math.PI) / 180);
  const localPoints = points.map((point) =>
    getLocalPoint(point, origin, metersPerLatDegree, metersPerLonDegree),
  );
  const altitudeSpan = Math.max(
    1,
    Math.max(...localPoints.map((point) => Math.abs(point.relativeAlt))),
  );
  const horizontalSpan = Math.max(
    1,
    Math.max(
      ...localPoints.map((point) =>
        Math.max(Math.abs(point.east), Math.abs(point.north)),
      ),
    ),
  );
  const verticalScale = clamp((horizontalSpan / altitudeSpan) * 0.22, 1.8, 7.5);
  const projectedCenterline = localPoints.map((localPoint) =>
    projectRibbonPoint(localPoint, verticalScale),
  );
  const projectedGround = localPoints.map((localPoint) =>
    projectRibbonPoint({ ...localPoint, relativeAlt: 0 }, verticalScale),
  );

  const boundsX = [...projectedCenterline, ...projectedGround].flatMap(
    (point) => point.x,
  );
  const boundsY = [...projectedCenterline, ...projectedGround].flatMap(
    (point) => [point.y, point.groundY],
  );
  const minX = Math.min(...boundsX);
  const maxX = Math.max(...boundsX);
  const minY = Math.min(...boundsY);
  const maxY = Math.max(...boundsY);
  const spanX = maxX - minX || 0.001;
  const spanY = maxY - minY || 0.001;
  const scale = Math.min(
    (width - padding * 2) / spanX,
    (height - padding * 2) / spanY,
  );

  const transform = (point) => ({
    x: padding + (point.x - minX) * scale,
    y: height - (padding + (point.y - minY) * scale),
    groundY: height - (padding + (point.groundY - minY) * scale),
    relativeAlt: point.relativeAlt,
  });

  const centerline = projectedCenterline.map(transform);
  const ground = projectedGround.map(transform);
  const ribbonWidth = clamp(Math.min(width, height) * 0.022, 10, 18);
  const edges = buildRibbonEdges(centerline, ribbonWidth);
  const markerWidth = clamp(Math.min(width, height) * 0.017, 6, 10);
  const kmMarkers = buildKilometerMarkers(points).map((marker) => {
    const localMarker = getLocalPoint(
      marker,
      origin,
      metersPerLatDegree,
      metersPerLonDegree,
    );
    return transform(projectRibbonPoint(localMarker, verticalScale));
  });
  const highlights = getHighlightMarkers(points).map((marker) => {
    const localMarker = getLocalPoint(
      marker,
      origin,
      metersPerLatDegree,
      metersPerLonDegree,
    );
    return transform(projectRibbonPoint(localMarker, verticalScale));
  });

  return {
    centerline,
    ground,
    edges,
    kmMarkers,
    highlights,
    ribbonWidth,
    verticalScale,
    markerWidth,
  };
}

function buildKilometerMarkers(points) {
  if (points.length < 2) return [];

  const markers = [];
  const lastDistance = points[points.length - 1].distanceKm || 0;
  const targetCount = Math.floor(lastDistance);

  for (let targetKm = 1; targetKm <= targetCount; targetKm += 1) {
    let segmentIndex = -1;

    for (let index = 1; index < points.length; index += 1) {
      const previousDistance = points[index - 1].distanceKm || 0;
      const currentDistance = points[index].distanceKm || 0;
      if (previousDistance <= targetKm && currentDistance >= targetKm) {
        segmentIndex = index;
        break;
      }
    }

    if (segmentIndex === -1) continue;

    const previousPoint = points[segmentIndex - 1];
    const currentPoint = points[segmentIndex];
    const previousDistance = previousPoint.distanceKm || 0;
    const currentDistance = currentPoint.distanceKm || 0;
    const ratio =
      currentDistance === previousDistance
        ? 0
        : clamp(
            (targetKm - previousDistance) /
              (currentDistance - previousDistance),
            0,
            1,
          );

    markers.push({
      label: `${targetKm} km`,
      distanceKm: targetKm,
      lat: lerp(previousPoint.lat, currentPoint.lat, ratio),
      lon: lerp(previousPoint.lon, currentPoint.lon, ratio),
      alt: lerp(previousPoint.alt, currentPoint.alt, ratio),
      type: "km",
    });
  }

  return markers;
}

function getHighlightMarkers(points) {
  if (points.length === 0) return [];

  let highestPoint = points[0];
  let lowestPoint = points[0];

  for (const point of points) {
    if ((point.alt || 0) > (highestPoint.alt || 0)) highestPoint = point;
    if ((point.alt || 0) < (lowestPoint.alt || 0)) lowestPoint = point;
  }

  return [
    { ...points[0], type: "start", label: "START" },
    { ...points[points.length - 1], type: "finish", label: "FINISH" },
    { ...highestPoint, type: "peak", label: "HIGH" },
    { ...lowestPoint, type: "valley", label: "LOW" },
  ];
}

function project2D(points, width, height, padding = 40) {
  const bounds = getTrackBounds(points);
  const latRange = bounds.maxLat - bounds.minLat || 0.0001;
  const lonRange = bounds.maxLon - bounds.minLon || 0.0001;
  const scaleX = (width - padding * 2) / lonRange;
  const scaleY = (height - padding * 2) / latRange;
  const scale = Math.min(scaleX, scaleY);

  return points.map((point) => ({
    x:
      padding +
      (point.lon - bounds.minLon) * scale +
      (width - padding * 2 - lonRange * scale) / 2,
    y:
      height -
      (padding +
        (point.lat - bounds.minLat) * scale +
        (height - padding * 2 - latRange * scale) / 2),
  }));
}

function drawBackground(ctxContext, width, height) {
  const background = ctxContext.createLinearGradient(0, 0, 0, height);
  background.addColorStop(
    0,
    getComputedStyle(document.documentElement)
      .getPropertyValue("--canvas-bg")
      .trim() || "#111111",
  );
  background.addColorStop(
    1,
    getComputedStyle(document.documentElement)
      .getPropertyValue("--bg-elevated")
      .trim() || "#121216",
  );
  ctxContext.fillStyle = background;
  ctxContext.fillRect(0, 0, width, height);
}

function drawRoundedLabel(ctxContext, x, y, text, fillStyle, textStyle) {
  ctxContext.font = "600 12px -apple-system, BlinkMacSystemFont, sans-serif";
  const textWidth = ctxContext.measureText(text).width;
  const labelWidth = textWidth + 18;
  const labelHeight = 24;
  const labelX = x - labelWidth / 2;
  const labelY = y - labelHeight - 10;

  ctxContext.fillStyle = fillStyle;
  ctxContext.beginPath();
  if (typeof ctxContext.roundRect === "function") {
    ctxContext.roundRect(labelX, labelY, labelWidth, labelHeight, 999);
  } else {
    ctxContext.moveTo(labelX + 12, labelY);
    ctxContext.lineTo(labelX + labelWidth - 12, labelY);
    ctxContext.quadraticCurveTo(
      labelX + labelWidth,
      labelY,
      labelX + labelWidth,
      labelY + 12,
    );
    ctxContext.lineTo(labelX + labelWidth, labelY + labelHeight - 12);
    ctxContext.quadraticCurveTo(
      labelX + labelWidth,
      labelY + labelHeight,
      labelX + labelWidth - 12,
      labelY + labelHeight,
    );
    ctxContext.lineTo(labelX + 12, labelY + labelHeight);
    ctxContext.quadraticCurveTo(
      labelX,
      labelY + labelHeight,
      labelX,
      labelY + labelHeight - 12,
    );
    ctxContext.lineTo(labelX, labelY + 12);
    ctxContext.quadraticCurveTo(labelX, labelY, labelX + 12, labelY);
  }
  ctxContext.fill();

  ctxContext.fillStyle = textStyle;
  ctxContext.textAlign = "center";
  ctxContext.textBaseline = "middle";
  ctxContext.fillText(text, x, labelY + labelHeight / 2 + 1);
}

function render2DScene(ctxContext, width, height, points) {
  drawBackground(ctxContext, width, height);

  if (points.length < 2) {
    ctxContext.fillStyle = "rgba(255,255,255,0.55)";
    ctxContext.font = "600 14px -apple-system, BlinkMacSystemFont, sans-serif";
    ctxContext.textAlign = "center";
    ctxContext.fillText(
      "Start tracking untuk melihat breadcrumb trail.",
      width / 2,
      height / 2,
    );
    return;
  }

  const trailPoints = project2D(points, width, height);
  const accent =
    getComputedStyle(document.documentElement)
      .getPropertyValue("--accent-color")
      .trim() || DEFAULT_ACCENT;

  ctxContext.beginPath();
  ctxContext.strokeStyle = accent;
  ctxContext.lineWidth = 4;
  ctxContext.lineCap = "round";
  ctxContext.lineJoin = "round";
  trailPoints.forEach((point, index) => {
    if (index === 0) ctxContext.moveTo(point.x, point.y);
    else ctxContext.lineTo(point.x, point.y);
  });
  ctxContext.stroke();

  trailPoints.forEach((point, index) => {
    if (index === 0) {
      ctxContext.fillStyle = "#5ac8fa";
    } else if (index === trailPoints.length - 1) {
      ctxContext.fillStyle = "#ffffff";
    } else {
      return;
    }

    ctxContext.beginPath();
    ctxContext.arc(
      point.x,
      point.y,
      index === trailPoints.length - 1 ? 5.5 : 6.5,
      0,
      Math.PI * 2,
    );
    ctxContext.fill();
  });
}

function drawRibbonPolygon(ctxContext, outerPath, fillStyle) {
  if (!outerPath.length) return;
  ctxContext.beginPath();
  ctxContext.moveTo(outerPath[0].x, outerPath[0].y);
  for (let index = 1; index < outerPath.length; index += 1) {
    ctxContext.lineTo(outerPath[index].x, outerPath[index].y);
  }
  ctxContext.closePath();
  ctxContext.fillStyle = fillStyle;
  ctxContext.fill();
}

function renderRibbonScene(ctxContext, width, height, points) {
  drawBackground(ctxContext, width, height);

  if (points.length < 2) {
    ctxContext.fillStyle = "rgba(255,255,255,0.55)";
    ctxContext.font = "600 14px -apple-system, BlinkMacSystemFont, sans-serif";
    ctxContext.textAlign = "center";
    ctxContext.fillText(
      "2.5D viewer akan aktif setelah ada track.",
      width / 2,
      height / 2,
    );
    return;
  }

  const model = buildRibbonModel(points, width, height);
  const accent =
    getComputedStyle(document.documentElement)
      .getPropertyValue("--accent-color")
      .trim() || DEFAULT_ACCENT;
  const surface =
    getComputedStyle(document.documentElement)
      .getPropertyValue("--surface-border")
      .trim() || "#2c2c2e";
  const ribbonLeft = model.edges.leftEdge;
  const ribbonRight = model.edges.rightEdge;
  const ribbonPath = [...ribbonLeft, ...ribbonRight.slice().reverse()];
  const shadowPath = ribbonPath.map((point) => ({
    x: point.x + 8,
    y: point.y + 10,
  }));
  const ribbonGradient = ctxContext.createLinearGradient(0, 0, width, height);
  ribbonGradient.addColorStop(0, accent);
  ribbonGradient.addColorStop(0.45, accent);
  ribbonGradient.addColorStop(
    1,
    state.theme === "light" ? "#0f1720" : "#0a0d12",
  );
  const ribbonShadow =
    state.theme === "light" ? "rgba(30, 41, 59, 0.20)" : "rgba(0, 0, 0, 0.32)";

  // Ground reference line.
  ctxContext.save();
  ctxContext.strokeStyle =
    state.theme === "light" ? "rgba(17,19,24,0.10)" : "rgba(255,255,255,0.07)";
  ctxContext.lineWidth = 1.5;
  ctxContext.setLineDash([5, 8]);
  ctxContext.beginPath();
  model.ground.forEach((point, index) => {
    if (index === 0) ctxContext.moveTo(point.x, point.groundY);
    else ctxContext.lineTo(point.x, point.groundY);
  });
  ctxContext.stroke();
  ctxContext.restore();

  // Ribbon shadow.
  drawRibbonPolygon(ctxContext, shadowPath, ribbonShadow);

  // Ribbon body.
  drawRibbonPolygon(ctxContext, ribbonPath, ribbonGradient);

  // Ribbon highlight and contour.
  ctxContext.save();
  ctxContext.strokeStyle = "rgba(255,255,255,0.22)";
  ctxContext.lineWidth = 1;
  ctxContext.beginPath();
  ribbonLeft.forEach((point, index) => {
    if (index === 0) ctxContext.moveTo(point.x, point.y);
    else ctxContext.lineTo(point.x, point.y);
  });
  ctxContext.stroke();
  ctxContext.strokeStyle = "rgba(0,0,0,0.18)";
  ctxContext.beginPath();
  ribbonRight.forEach((point, index) => {
    if (index === 0) ctxContext.moveTo(point.x, point.y);
    else ctxContext.lineTo(point.x, point.y);
  });
  ctxContext.stroke();
  ctxContext.restore();

  ctxContext.save();
  ctxContext.strokeStyle = "rgba(255,255,255,0.28)";
  ctxContext.lineWidth = 2.5;
  ctxContext.lineCap = "round";
  ctxContext.lineJoin = "round";
  ctxContext.beginPath();
  model.centerline.forEach((point, index) => {
    if (index === 0) ctxContext.moveTo(point.x, point.y);
    else ctxContext.lineTo(point.x, point.y);
  });
  ctxContext.stroke();
  ctxContext.restore();

  // Kilometer pins.
  for (const marker of model.kmMarkers) {
    const markerColor =
      getComputedStyle(document.documentElement)
        .getPropertyValue("--text-color")
        .trim() || "#ffffff";
    ctxContext.strokeStyle = "rgba(255,255,255,0.28)";
    ctxContext.lineWidth = 1.5;
    ctxContext.beginPath();
    ctxContext.moveTo(marker.x, marker.groundY);
    ctxContext.lineTo(marker.x, marker.y);
    ctxContext.stroke();

    ctxContext.fillStyle = markerColor;
    ctxContext.beginPath();
    ctxContext.arc(marker.x, marker.y, 5.5, 0, Math.PI * 2);
    ctxContext.fill();

    drawRoundedLabel(
      ctxContext,
      marker.x,
      marker.y,
      marker.label,
      "rgba(17,19,24,0.82)",
      "#ffffff",
    );
  }

  // Start/finish and altitude pins.
  for (const marker of model.highlights) {
    let fillColor = accent;
    if (marker.type === "finish") fillColor = "#ffffff";
    if (marker.type === "peak") fillColor = "#ff9f0a";
    if (marker.type === "valley") fillColor = surface;

    ctxContext.strokeStyle = "rgba(255,255,255,0.24)";
    ctxContext.lineWidth = 1.25;
    ctxContext.beginPath();
    ctxContext.moveTo(marker.x, marker.groundY);
    ctxContext.lineTo(marker.x, marker.y);
    ctxContext.stroke();

    ctxContext.fillStyle = fillColor;
    ctxContext.beginPath();
    ctxContext.arc(
      marker.x,
      marker.y,
      marker.type === "start" ? 6.5 : 5.5,
      0,
      Math.PI * 2,
    );
    ctxContext.fill();

    drawRoundedLabel(
      ctxContext,
      marker.x,
      marker.y,
      marker.label,
      marker.type === "peak" ? "rgba(255,159,10,0.92)" : "rgba(17,19,24,0.82)",
      "#ffffff",
    );
  }

  ctxContext.fillStyle = "rgba(255,255,255,0.55)";
  ctxContext.font = "600 11px -apple-system, BlinkMacSystemFont, sans-serif";
  ctxContext.textAlign = "left";
  ctxContext.fillText(
    "Ribbon height starts at zero and follows route elevation.",
    16,
    height - 16,
  );
}

function renderScene(ctxContext, width, height, points) {
  if (state.viewMode === "3d") {
    renderRibbonScene(ctxContext, width, height, points);
  } else {
    render2DScene(ctxContext, width, height, points);
  }
}

function downloadTextFile(filename, text, mimeType) {
  const blob = new Blob([text], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

function exportSvgContent(points) {
  const width = 1440;
  const height = 1080;
  const ribbonModel =
    state.viewMode === "3d" ? buildRibbonModel(points, width, height) : null;
  const model =
    state.viewMode === "3d"
      ? ribbonModel
      : { trail: project2D(points, width, height) };
  const accent = state.accent || DEFAULT_ACCENT;
  const background = state.theme === "light" ? "#f4f6f8" : "#0c0c0e";
  const panel = state.theme === "light" ? "#ffffff" : "#16161a";
  const textColor = state.theme === "light" ? "#111318" : "#ffffff";

  const trailPoints = state.viewMode === "3d" ? model.centerline : model.trail;
  const trailPolyline = trailPoints
    .map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`)
    .join(" ");

  const markerElements = [];
  if (state.viewMode === "3d") {
    const ribbonPath = [
      ...model.edges.leftEdge,
      ...model.edges.rightEdge.slice().reverse(),
    ];
    const ribbonPolygon = ribbonPath
      .map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`)
      .join(" ");
    const shadowPolygon = ribbonPath
      .map(
        (point) => `${(point.x + 8).toFixed(2)},${(point.y + 10).toFixed(2)}`,
      )
      .join(" ");

    markerElements.push(
      `<polygon points="${shadowPolygon}" fill="rgba(0,0,0,0.24)" />`,
      `<polygon points="${ribbonPolygon}" fill="${accent}" opacity="0.92" />`,
      `<polyline points="${model.centerline.map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(" ")}" fill="none" stroke="rgba(255,255,255,0.24)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />`,
    );

    for (const marker of model.kmMarkers) {
      markerElements.push(
        `<line x1="${marker.x.toFixed(2)}" y1="${marker.groundY.toFixed(2)}" x2="${marker.x.toFixed(2)}" y2="${marker.y.toFixed(2)}" stroke="rgba(255,255,255,0.35)" stroke-width="1.5" />`,
      );
      markerElements.push(
        `<circle cx="${marker.x.toFixed(2)}" cy="${marker.y.toFixed(2)}" r="5.5" fill="${textColor}" />`,
      );
      markerElements.push(
        `<rect x="${(marker.x - 42).toFixed(2)}" y="${(marker.y - 34).toFixed(2)}" width="84" height="24" rx="999" fill="rgba(17,19,24,0.84)" />`,
      );
      markerElements.push(
        `<text x="${marker.x.toFixed(2)}" y="${(marker.y - 18).toFixed(2)}" text-anchor="middle" font-size="12" font-family="-apple-system,BlinkMacSystemFont,sans-serif" font-weight="700" fill="#ffffff">${marker.label}</text>`,
      );
    }

    for (const marker of model.highlights) {
      const fillColor =
        marker.type === "peak"
          ? "#ff9f0a"
          : marker.type === "valley"
            ? state.theme === "light"
              ? "#616773"
              : "#2c2c2e"
            : marker.type === "finish"
              ? "#ffffff"
              : accent;
      markerElements.push(
        `<line x1="${marker.x.toFixed(2)}" y1="${marker.groundY.toFixed(2)}" x2="${marker.x.toFixed(2)}" y2="${marker.y.toFixed(2)}" stroke="rgba(255,255,255,0.28)" stroke-width="1.5" />`,
      );
      markerElements.push(
        `<circle cx="${marker.x.toFixed(2)}" cy="${marker.y.toFixed(2)}" r="${marker.type === "start" ? 6.5 : 5.5}" fill="${fillColor}" />`,
      );
    }
  }

  const title =
    state.viewMode === "3d" ? "2.5D Trail Viewer" : "2D Trail Viewer";
  const subtitle = `Distance ${totalDistance.toFixed(2)} km | Pace ${formatPace(totalDistance, Math.max(Date.now() - (startTime || Date.now()), 1))} | Elevation ${Math.round(elevationGain)} m`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${background}" />
      <stop offset="100%" stop-color="${panel}" />
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)" />
  <rect x="28" y="28" width="${width - 56}" height="88" rx="28" fill="${state.theme === "light" ? "#ffffff" : "#16161a"}" stroke="${state.theme === "light" ? "#d9dee7" : "#2c2c2e"}" />
  <text x="56" y="66" font-size="30" font-weight="800" font-family="-apple-system,BlinkMacSystemFont,sans-serif" fill="${textColor}">${title}</text>
  <text x="56" y="96" font-size="18" font-family="-apple-system,BlinkMacSystemFont,sans-serif" fill="${state.theme === "light" ? "#5e6675" : "#8e8e93"}">${subtitle}</text>
  ${state.viewMode === "2d" ? `<polyline points="${trailPolyline}" fill="none" stroke="${accent}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />` : ""}
  ${markerElements.join("\n  ")}
</svg>`;
}

function exportSVG() {
  const points = getTrackData();
  if (points.length < 2) {
    setStatus(
      "Rekam minimal dua titik terlebih dahulu sebelum ekspor SVG.",
      "error",
    );
    return;
  }

  downloadTextFile(
    `puretrack_${Math.floor(Date.now() / 1000)}.svg`,
    exportSvgContent(points),
    "image/svg+xml",
  );
  setStatus("SVG berhasil diekspor.");
}

function exportPNG() {
  const points = getTrackData();
  if (points.length < 2) {
    setStatus(
      "Rekam minimal dua titik terlebih dahulu sebelum ekspor PNG.",
      "error",
    );
    return;
  }

  const exportWidth = 1600;
  const exportHeight = 1200;
  const exportCanvas = document.createElement("canvas");
  exportCanvas.width = exportWidth;
  exportCanvas.height = exportHeight;
  const exportCtx = exportCanvas.getContext("2d");

  renderScene(exportCtx, exportWidth, exportHeight, points);

  exportCanvas.toBlob((blob) => {
    if (!blob) {
      setStatus("Gagal membuat PNG.", "error");
      return;
    }

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `puretrack_${Math.floor(Date.now() / 1000)}.png`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
    setStatus("PNG berhasil diekspor.");
  }, "image/png");
}

function resizeCanvas() {
  updateLayoutMode();
  canvas.width = canvas.parentElement.clientWidth;
  canvas.height = canvas.parentElement.clientHeight;
  drawTrail();
}
window.addEventListener("resize", resizeCanvas);

function updateLayoutMode() {
  document.documentElement.classList.toggle(
    "compact-layout",
    window.innerWidth <= 768,
  );
}
window.addEventListener("resize", updateLayoutMode);

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function startTracking() {
  if (!navigator.geolocation) {
    setStatus("GPS tidak didukung di perangkat atau browser ini.", "error");
    return;
  }

  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }

  clearInterval(timerInterval);

  pathCoordinates = [];
  totalDistance = 0;
  elevationGain = 0;
  lastAltitude = null;
  setStatus("Tracking aktif. Tunggu lock GPS yang akurat.");
  setExportButtonsVisible(false);

  document.getElementById("dist-val").innerText = "0.00 km";
  document.getElementById("elev-val").innerText = "0 m";
  document.getElementById("pace-val").innerText = "--:--";

  resizeCanvas();

  startTime = Date.now();
  timerInterval = setInterval(() => {
    const diff = Date.now() - startTime;
    const hrs = String(Math.floor(diff / 3600000)).padStart(2, "0");
    const mins = String(Math.floor((diff % 3600000) / 60000)).padStart(2, "0");
    const secs = String(Math.floor((diff % 60000) / 1000)).padStart(2, "0");
    document.getElementById("time-val").innerText = `${hrs}:${mins}:${secs}`;

    // Hitung Average Pace
    if (totalDistance > 0) {
      const totalMinutes = diff / 60000;
      const paceDecimal = totalMinutes / totalDistance;
      const paceMins = Math.floor(paceDecimal);
      const paceSecs = String(
        Math.floor((paceDecimal - paceMins) * 60),
      ).padStart(2, "0");
      document.getElementById("pace-val").innerText = `${paceMins}:${paceSecs}`;
    }
  }, 1000);

  watchId = navigator.geolocation.watchPosition(
    (position) => {
      const { latitude, longitude, altitude } = position.coords;
      const accuracy = position.coords.accuracy;

      setStatus(
        accuracy <= 10
          ? `GPS lock akurat: ${Math.round(accuracy)} m.`
          : `GPS aktif. Akurasi saat ini ${Math.round(accuracy)} m.`,
      );

      if (pathCoordinates.length > 0) {
        const lastPt = pathCoordinates[pathCoordinates.length - 1];
        const dist = calculateDistance(
          lastPt.lat,
          lastPt.lon,
          latitude,
          longitude,
        );

        // Akurasi filter pergerakan (> 3 meter)
        if (dist > 0.003) {
          totalDistance += dist;
          document.getElementById("dist-val").innerText =
            formatDistance(totalDistance);
        }
      }

      // Hitung Elev Gain jika sensor altitude tersedia & akurat
      if (altitude !== null) {
        if (lastAltitude !== null && altitude > lastAltitude) {
          elevationGain += altitude - lastAltitude;
          document.getElementById("elev-val").innerText =
            Math.round(elevationGain) + " m";
        }
        lastAltitude = altitude;
      }

      pathCoordinates.push({
        lat: latitude,
        lon: longitude,
        alt: altitude || 0,
        time: new Date().toISOString(),
        distanceKm: totalDistance,
      });

      drawTrail();
    },
    (err) => {
      const errorMessage =
        err.code === err.PERMISSION_DENIED
          ? "Izin lokasi ditolak. Aktifkan akses GPS untuk mulai tracking."
          : err.code === err.POSITION_UNAVAILABLE
            ? "Lokasi tidak tersedia. Coba pindah ke area dengan sinyal GPS lebih baik."
            : err.code === err.TIMEOUT
              ? "GPS timeout. Coba lagi atau tunggu lock yang lebih stabil."
              : `GPS error: ${err.message}`;
      setStatus(errorMessage, "error");
    },
    { enableHighAccuracy: true, maximumAge: 0 },
  );

  document.getElementById("start-btn").style.display = "none";
  document.getElementById("stop-btn").style.display = "block";
}

function stopTracking() {
  if (watchId !== null) navigator.geolocation.clearWatch(watchId);
  watchId = null;
  clearInterval(timerInterval);
  timerInterval = null;
  setStatus(
    pathCoordinates.length > 0
      ? "Tracking dihentikan. Siap ekspor GPX."
      : "Tracking dihentikan.",
  );
  document.getElementById("stop-btn").style.display = "none";
  document.getElementById("start-btn").style.display = "block";
  setExportButtonsVisible(pathCoordinates.length > 0);
}

// Fungsi menggambar trek relatif di Canvas (Auto Center & Scale)
function drawTrail() {
  const points = getTrackData();
  renderScene(ctx, canvas.width, canvas.height, points);
}

function exportGPX() {
  const points = getTrackData();
  if (points.length < 2) {
    setStatus(
      "Rekam minimal dua titik terlebih dahulu sebelum ekspor GPX.",
      "error",
    );
    return;
  }

  let gpxContent = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="PureTrackStatic" xmlns="http://www.topografix.com/GPX/1/1">
  <trk>
    <name>Offline Track No Maps</name>
    <trkseg>`;

  points.forEach((pt) => {
    gpxContent += `\n      <trkpt lat="${pt.lat}" lon="${pt.lon}"><ele>${pt.alt}</ele><time>${pt.time}</time></trkpt>`;
  });

  gpxContent += `\n    </trkseg>\n  </trk>\n</gpx>`;

  downloadTextFile(
    `puretrack_${Math.floor(Date.now() / 1000)}.gpx`,
    gpxContent,
    "application/gpx+xml",
  );
  setStatus("GPX berhasil diekspor.");
}

themeToggle.addEventListener("click", () => {
  applyTheme(state.theme === "dark" ? "light" : "dark");
  drawTrail();
});

viewToggle.addEventListener("click", () => {
  applyViewMode(state.viewMode === "2d" ? "3d" : "2d");
});

accentPicker.addEventListener("input", (event) => {
  applyAccent(event.target.value);
  drawTrail();
});

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./service-worker.js").catch((err) => {
      console.warn("Service worker registration failed:", err);
    });
  }
}

initializePreferences();
window.onload = resizeCanvas;
window.addEventListener("load", registerServiceWorker);
