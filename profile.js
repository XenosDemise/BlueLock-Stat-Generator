(function () {
  const profileCanvas = document.getElementById("profile");
  if (!profileCanvas) return;
  const profileCtx = profileCanvas.getContext("2d");

  const dpr = window.devicePixelRatio || 1;
  const rect = profileCanvas.getBoundingClientRect() || { width: profileCanvas.width, height: profileCanvas.height };
  const cssWidth = rect.width || profileCanvas.width;
  const cssHeight = rect.height || profileCanvas.height;

  profileCanvas.width = Math.round(cssWidth * dpr);
  profileCanvas.height = Math.round(cssHeight * dpr);

  profileCanvas.style.width = cssWidth + "px";
  profileCanvas.style.height = cssHeight + "px";

  profileCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  profileCtx.imageSmoothingEnabled = true;

  const BLACK = "#343434";
  const WHITE = "#ffffff";
  const DARKGREY = "#666666";
  const GREY = "#bababa";

  function drawLine(start, end, color = BLACK, lineWidth = 2) {
    profileCtx.beginPath();
    profileCtx.moveTo(start[0], start[1]);
    profileCtx.lineTo(end[0], end[1]);
    profileCtx.strokeStyle = color;
    profileCtx.lineWidth = lineWidth;
    profileCtx.lineCap = "round";
    profileCtx.stroke();
  }

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

  function drawTextWithStroke(text, x, y, options = {}) {
    const {
      font = "16px sans-serif",
      fill = BLACK,
      stroke = WHITE,
      strokeWidth = 3,
      align = "center",
      baseline = "middle"
    } = options;
    profileCtx.font = font;
    profileCtx.textAlign = align;
    profileCtx.textBaseline = baseline;
    profileCtx.lineWidth = strokeWidth;
    profileCtx.strokeStyle = stroke;
    profileCtx.fillStyle = fill;
    profileCtx.strokeText(text, x, y);
    profileCtx.fillText(text, x, y);
  }

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

  function drawPolygon(points, fill = null, stroke = BLACK, lineWidth = 2) {
    profileCtx.beginPath();
    profileCtx.moveTo(points[0][0], points[0][1]);

    for (let i = 1; i < points.length; i++) {
      profileCtx.lineTo(points[i][0], points[i][1]);
    }

    profileCtx.closePath();

    if (fill !== null) {
      profileCtx.fillStyle = fill;
      profileCtx.fill();
    }

    profileCtx.strokeStyle = stroke;
    profileCtx.lineWidth = lineWidth;
    profileCtx.lineJoin = "round";
    profileCtx.stroke();
  }

  function drawImageInPolygon(img, points, options = {}) {
    const {
      padding = 0,
      scale = 1.0
    } = options;

    if (!img || !img.complete) return;

    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    points.forEach(([x, y]) => {
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    });

    const boxW = maxX - minX;
    const boxH = maxY - minY;

    const imgRatio = img.width / img.height;
    const boxRatio = boxW / boxH;

    let drawW, drawH;

    if (imgRatio > boxRatio) {
      drawH = boxH * scale;
      drawW = drawH * imgRatio;
    } else {
      drawW = boxW * scale;
      drawH = drawW / imgRatio;
    }

    drawW -= padding * 2;
    drawH -= padding * 2;

    const x = minX + (boxW - drawW) / 2 + padding;
    const y = minY + (boxH - drawH) / 2 + padding + 15;

    profileCtx.save();

    profileCtx.beginPath();
    points.forEach(([px, py], i) => {
      if (i === 0) profileCtx.moveTo(px, py);
      else profileCtx.lineTo(px, py);
    });
    profileCtx.closePath();
    profileCtx.clip();

    profileCtx.drawImage(img, x, y, drawW, drawH);

    profileCtx.restore();
  }

  function sizeAndSetup() {
    const r = profileCanvas.getBoundingClientRect() || { width: profileCanvas.width, height: profileCanvas.height };
    const cssW = r.width || profileCanvas.width;
    const cssH = r.height || profileCanvas.height;
    profileCanvas.width = Math.round(cssW * dpr);
    profileCanvas.height = Math.round(cssH * dpr);
    profileCanvas.style.width = cssW + "px";
    profileCanvas.style.height = cssH + "px";
    profileCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    profileCtx.imageSmoothingEnabled = true;
    return { cssW, cssH };
  }
  
  const nameInput = document.getElementById("playerName");

  const iconImg = new Image();
  let currentIconPath = "";

  window.setIcon = function setIcon(path) {
    if (!path || path === currentIconPath) return;

    currentIconPath = path;
    iconImg.src = path;

    iconImg.onload = () => {
      if (typeof window.renderProfile === "function") {
        window.renderProfile();
      }
    };
  };


  function render() {
    if (!profileCanvas) return;
    const { cssW, cssH } = sizeAndSetup();
    const cx = cssW / 2;
    const cy = cssH / 2;
    const radius = Math.min(cssW, cssH) * 0.36;

    profileCtx.clearRect(0, 0, profileCanvas.width, profileCanvas.height);
    profileCtx.fillStyle = WHITE;
    profileCtx.fillRect(0, 0, cssW, cssH);

    let avg = 70;
    if (window._statsTouched && typeof window.StatsAverage === "number" && !isNaN(window.StatsAverage)) {
      avg = window.StatsAverage;
    }

    const bigFontSize = Math.max(28, Math.round(radius * 0.8));

    const rawName = (nameInput && nameInput.value)
      ? String(nameInput.value).trim()
      : "";

    const name = rawName.length ? rawName : "";

    const baseSize = 40;
    const maxChars = 4;
    const shrinkPerChar = 5;

    const extraChars = Math.max(0, name.length - maxChars);
    const nameSize = Math.max(23, baseSize - extraChars * shrinkPerChar*0.8);

    drawLine([cx,cy*1.05], [cx, cy*0.01], GREY, 2);
    const sf = 0.225;
    for (i = 0; i < 3; i++) {
      drawLine([cx*(1+i*sf),cy*1.05], [cx*(1+i*sf), cy*0.01], GREY, 2);
      drawLine([cx*(1-i*sf),cy*1.05], [cx*(1-i*sf), cy*0.01], GREY, 2);
    }
    drawLine([cx*(1+3*sf),cy*1.05], [cx*(1+3*sf), cy*0.01], GREY, 2);
    drawLine([cx*(1-3*sf),cy*1.05], [cx*(1-3*sf), cy*0.05], GREY, 2);

    const sf1 = 0.0695;
    drawLine([cx*0.2,cy*(0.08+0*sf1)], [cx*1.9, cy*(0.08+0*sf1)], GREY, 2);
    for (i = 1; i < 14; i++) {
      drawLine([cx*0.1,cy*(0.08+i*sf1)], [cx*1.9, cy*(0.08+i*sf1)], GREY, 2);
    }

    const iconPentagon = regularPolygon(
      cx,
      cy * 0.34,
      62,
      5,
      -Math.PI / 2
    );

    // Background + outline
    drawPolygon(iconPentagon, WHITE, WHITE, 7);

    // Image inside
    drawImageInPolygon(iconImg, iconPentagon, {
      scale: 0.75,
      padding: 0
    });

    drawPolygon(iconPentagon, null, DARKGREY, 2);

    // Tiny triangle thing
    drawPolygon([[cx*1.84,cy*0.025],[cx*1.73,cy*0.025],[cx*1.84,cy*0.05]], BLACK, BLACK, 2);

    // Overall grade stroke
    drawPolygon([[cx*0.23, cy*1.02], [cx*1.77, cy*1.02], [cx*1.77, cy*0.551], [cx*1.4, cy*0.49], [cx*0.6, cy*0.49], [cx*0.23, cy*0.55]], WHITE, WHITE, 7);
    // Overall grade outline
    drawPolygon([[cx*0.23, cy*1.02], [cx*1.77, cy*1.02], [cx*1.77, cy*0.551], [cx*1.4, cy*0.49], [cx*0.6, cy*0.49], [cx*0.23, cy*0.55]], WHITE, DARKGREY, 2);

    drawLine([cx*0.29, cy*1.007], [cx*1.71, cy*1.007], GREY, 2)
    drawLine([cx*0.25, cy*0.995], [cx*0.29, cy*1.007], GREY, 2)
    drawLine([cx*1.75, cy*0.995], [cx*1.71, cy*1.007], GREY, 2)

    drawTextWithStroke(String(name), cx, cy * 0.12, {
      font: `bold ${nameSize}px "Arial Black", Arial`,
      fill: BLACK,
      stroke: WHITE,
      strokeWidth: Math.max(6, Math.round(nameSize * 0.06)),
      align: "center",
      baseline: "middle"
    });

    drawTextWithStroke("総合評価", cx, cy*0.55, {
      font: `bold 14px "Arial Black", Arial`,
      fill: BLACK,
      stroke: WHITE,
      strokeWidth: Math.max(2, Math.round(bigFontSize * 0.06)),
      align: "center",
      baseline: "middle"
    });

    drawTextWithStroke("TOTAL", cx, cy*0.61, {
      font: `bold 15px "Arial Black", Arial`,
      fill: BLACK,
      stroke: WHITE,
      strokeWidth: Math.max(2, Math.round(bigFontSize * 0.06)),
      align: "center",
      baseline: "middle"
    });

    drawTextWithStroke(String(avg), cx, cy*0.7, {
      font: `bold ${bigFontSize}px "Digital-7", Arial`,
      fill: BLACK,
      stroke: WHITE,
      strokeWidth: Math.max(2, Math.round(bigFontSize * 0.06)),
      align: "center",
      baseline: "middle"
    });

    const grade = getGrade(avg);
    drawTextWithStroke(String(grade), cx, cy*0.9, {
      font: `bold ${bigFontSize*1.9}px "Arial Black", Arial`,
      fill: BLACK,
      stroke: WHITE,
      strokeWidth: Math.max(2, Math.round(bigFontSize * 0.06)),
      align: "center",
      baseline: "middle"
    });

    drawLine([cy*0.12, cy*0.01], [cx*1.9, cy*0.01], BLACK, 4);
    drawLine([cy*0.12, cy*0.01], [cx*0.1, cy*0.1], BLACK, 4);

    drawLine([cx*0.1,cy*1.05], [cx*0.1, cy*0.1], BLACK, 4); // | L
    drawLine([cx*1.9,cy*1.05], [cx*1.9, cy*0.01], BLACK, 4); // | R
    drawLine([cx*0.1,cy*1.05], [cx*1.9, cy*1.05], BLACK, 4); // _

    // bottom half

    const letters = ["S", "A", "B", "C", "D", "E", "F", "G"];
    for (i = 0; i < 8; i++) {
      drawTextWithStroke(`${letters[i]}`, cx-cx*0.6, cy*1.47 + (i - 3) * 38, {
        font: "37px Arial Black",
        fill: BLACK,
        stroke: WHITE,
        strokeWidth: 2,
        align: "center",
        baseline: "middle"
      });
    }
    drawLine([cx*0.1,cy*1.96], [cx*0.1, cy*1.1], BLACK, 4);
    drawLine([cx*0.1,cy*1.96], [cx*1.9, cy*1.96], BLACK, 4);

    const Ranges = [["90","80","70","60","50","40","30","0"],["~","~","~","~","~","~","~","~"],["100","89","79","69","59","49","39","29"]];
    
    for (i = 0; i < 3; i++) {
      for (j = 0; j < 8; j++) {
          drawTextWithStroke(`${Ranges[i][j]}`, cx*(0.85 + i * 0.37), cy*1.47 + (j - 3) * 38, {
          font: "28px Arial Rounded MT Bold",
          fill: DARKGREY,
          stroke: WHITE,
          strokeWidth: 2,
          align: "center",
          baseline: "middle"
        });
      }
    }
  }

  document.querySelectorAll(".control input").forEach(input => {
    input.addEventListener("input", () => {
      render();
    }, { passive: true });
  });

  render();

  window.renderProfile = render;
})();