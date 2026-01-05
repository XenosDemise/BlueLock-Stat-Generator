const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const dpr = window.devicePixelRatio || 1;
const rect = canvas.getBoundingClientRect() || { width: canvas.width, height: canvas.height };
const cssWidth = rect.width || canvas.width;
const cssHeight = rect.height || canvas.height;

canvas.width = Math.round(cssWidth * dpr);
canvas.height = Math.round(cssHeight * dpr);

canvas.style.width = cssWidth + "px";
canvas.style.height = cssHeight + "px";

ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
ctx.imageSmoothingEnabled = true;

const BLACK = "#343434";
const WHITE = "#ffffff";
const DARKGREY = "#666666";
const GREY = "#bababa";

function regularPolygon(cx, cy, radius, sides, rotation = 0) {
  const points = [];
  for (let i = 0; i < sides; i++) {
    const angle = (2 * Math.PI / sides) * i + rotation;
    points.push([
      cx + Math.cos(angle) * radius,
      cy + Math.sin(angle) * radius
    ]);
  }
  return points;
}

function drawPolygon(points, fill = WHITE, stroke = BLACK, lineWidth = 2) {
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);

  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i][0], points[i][1]);
  }

  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lineWidth;
  ctx.lineJoin = "round";
  ctx.fill();
  ctx.stroke();
}

function drawLine(start, end, color = BLACK, lineWidth = 2) {
  ctx.beginPath();
  ctx.moveTo(start[0], start[1]);
  ctx.lineTo(end[0], end[1]);
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = "round";
  ctx.stroke();
}

function drawCircle(center, radius, fill = null, stroke = BLACK, lineWidth = 1) {
  ctx.beginPath();
  ctx.arc(center[0], center[1], radius, 0, Math.PI * 2);
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
}

ctx.clearRect(0, 0, canvas.width, canvas.height);

const Stats = {
  SPEED: 75,
  DEFENSE: 72,
  PASS: 69,
  DRIBBLE: 65,
  SHOOT: 77,
  OFFENSE: 87
};

const StatsTR = {
  SPEED: "速さ",
  DEFENSE: "守備力",
  PASS: "パス",
  DRIBBLE: "ドリブル",
  SHOOT: "シュート",
  OFFENSE: "攻撃力"
};

const GradeThreshold = {
  90: "S",
  80: "A",
  70: "B",
  60: "C",
  50: "D",
  40: "E",
  30: "F",
  0: "G"
};

const cx = cssWidth / 2;
const cy = cssHeight / 2;

const keys = Object.keys(Stats);
const keysTR = Object.keys(StatsTR);
const theta = 2 * Math.PI / keys.length;
const rotationOffset = theta / 2 + Math.PI;
const radarChartSize = Math.min(cssWidth, cssHeight) / 2;
const maxRadius = radarChartSize / 2;

function getGrade(value) {
  const thresholds = Object.keys(GradeThreshold)
    .map(Number)
    .sort((a, b) => b - a);

  for (const t of thresholds) {
    if (value >= t) {
      return GradeThreshold[t];
    }
  }
  return "G";
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawCircle([cx, cy], radarChartSize * 0.95, null, BLACK, 4);
  drawCircle([cx, cy], radarChartSize * 0.83, null, DARKGREY, 2);
  drawCircle([cx, cy], radarChartSize * 0.71, null, DARKGREY, 2);
  drawCircle([cx, cy], radarChartSize * 0.69, null, DARKGREY, 2);

  const segmentCount = 64;
  const innerFactor = 0.69;
  const outerFactor = 0.83;
  for (let i = 0; i < segmentCount; i++) {
    const angle = (2 * Math.PI / segmentCount) * i;
    const startX = cx + Math.cos(angle) * radarChartSize * innerFactor;
    const startY = cy + Math.sin(angle) * radarChartSize * innerFactor;
    const endX = cx + Math.cos(angle) * radarChartSize * outerFactor;
    const endY = cy + Math.sin(angle) * radarChartSize * outerFactor;
    drawLine([startX, startY], [endX, endY], DARKGREY, 2);
  }

  const polyBack = [];
  const polyFront = [];
  const vecs = [];
  for (let i = 0; i < keys.length; i++) {
    const angle = theta * (i + 1) + rotationOffset;
    const baseX = Math.cos(angle) * maxRadius;
    const baseY = Math.sin(angle) * maxRadius;
    const scale = (Stats[keys[i]] || 0) / 100;

    const bx = cx + baseX;
    const by = cy + baseY;
    polyBack.push([bx, by]);

    const fx = cx + baseX * scale;
    const fy = cy + baseY * scale;
    polyFront.push([fx, fy]);

    const vx = bx - cx;
    const vy = by - cy;
    const dist = Math.hypot(vx, vy) || 1;
    vecs.push({ vx, vy, dist, angle });
  }

  drawPolygon(polyBack, GREY, DARKGREY, 2);

  ctx.font = "19px Digital-7";
  ctx.lineWidth = 3.5;
  ctx.textAlign = "center";
  ctx.fillStyle = DARKGREY;
  ctx.textBaseline = "middle";
  const inward = Math.min(20, radarChartSize * 0.05);
  for (let i = 0; i < keys.length; i++) {
    const [bx, by] = polyBack[i];
    drawLine([cx, cy], [bx, by], DARKGREY, 2);

    const { vx, vy, dist } = vecs[i];
    const labelDist = Math.max(0, dist - 1 * inward);
    const lx = cx + (vx / dist) * labelDist;
    const ly = cy + (vy / dist) * labelDist;
    ctx.strokeStyle = WHITE;
    ctx.strokeText("100", lx, ly);
    ctx.fillText("100", lx, ly);
  }

  drawPolygon(polyFront, WHITE, DARKGREY, 2);

  for (let i = 0; i < keys.length; i++) {
    const [fx, fy] = polyFront[i];
    drawLine([cx, cy], [fx, fy], DARKGREY, 2);

    const { vx, vy, dist, angle } = vecs[i];

    ctx.font = "30px Digital-7";
    ctx.strokeStyle = WHITE;
    ctx.lineWidth = 6;
    ctx.fillStyle = BLACK;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const labelDistStat = Math.max(0, Math.hypot(fx - cx, fy - cy) - 1.4 * inward);
    const statLx = cx + (vx / dist) * labelDistStat;
    const statLy = cy + (vy / dist) * labelDistStat;
    ctx.strokeText(String(Stats[keys[i]]), statLx, statLy);
    ctx.fillText(String(Stats[keys[i]]), statLx, statLy);

    const outward = Math.min(20, radarChartSize * 0.05);
    const labelDistOuter = Math.max(0, dist + 6 * outward);
    let lx = cx + (vx / dist) * labelDistOuter;
    let ly;

    if (keys[i] === "PASS" || keys[i] === "SHOOT" || keys[i] === "DRIBBLE") {
      ly = cy + (vy / dist) * labelDistOuter - 4.5 * outward;
    } else {
      ly = cy + (vy / dist) * labelDistOuter - 0.6 * outward;
    }

    ctx.font = "37px Arial Black";
    ctx.strokeStyle = WHITE;
    ctx.lineWidth = 5;
    ctx.fillStyle = BLACK;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.strokeText(keys[i], lx, ly);
    ctx.fillText(keys[i], lx, ly);

    ctx.font = "23px Hiragino Sans";
    ctx.strokeStyle = WHITE;
    ctx.lineWidth = 4;
    ctx.fillStyle = BLACK;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.strokeText(String(StatsTR[keys[i]]), lx, ly + outward * 1.9);
    ctx.fillText(String(StatsTR[keys[i]]), lx, ly + outward * 1.9);

    ctx.font = "70px Arial Black";
    ctx.strokeStyle = BLACK;
    ctx.lineWidth = 9;
    ctx.fillStyle = WHITE;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.strokeText(getGrade(Stats[keys[i]]), lx, ly + outward * 4.9);
    ctx.fillText(getGrade(Stats[keys[i]]), lx, ly + outward * 4.9);
  }
}

document.querySelectorAll(".control").forEach(control => {
  const key = control.dataset.key;
  const input = control.querySelector("input");
  const value = control.querySelector(".value");

  Stats[key] = parseInt(input.value, 10) || 0;
  value.textContent = input.value;

  input.addEventListener("input", () => {
    const v = parseInt(input.value, 10) || 0;
    Stats[key] = v;
    value.textContent = v;
    render();
  });
});

render();

document.getElementById("download").addEventListener("click", () => {
  const dataURL = canvas.toDataURL("image/png");

  const link = document.createElement("a");
  link.href = dataURL;
  link.download = "Stats.png";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});
