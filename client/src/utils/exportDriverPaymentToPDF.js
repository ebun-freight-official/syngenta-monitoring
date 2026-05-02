import jsPDF from "jspdf";
import { DateTime } from "luxon";
import { PAYSLIP_HEADER } from "../consts/base_64_images";

const fmt = (num) =>
  parseFloat(num || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export const exportDriverPaymentToPDF = (deployment, paymentData) => {
  const { location, driverRate, helperRate, allowance } = paymentData;

  const netWeight = (deployment?.pickups || []).reduce(
    (sum, pickup) => sum + (parseFloat(pickup.fieldWeightKg) || 0),
    0,
  );

  const driverAmount = parseFloat(driverRate) || 0;
  const helperAmount = netWeight * (parseFloat(helperRate) || 0);
  const allowanceAmount = parseFloat(allowance) || 0;
  const total = driverAmount + helperAmount + allowanceAmount;

  const hasReplacement = deployment?.replacement?.replacementTruckId?._id;
  const activeTruck = hasReplacement
    ? deployment.replacement.replacementTruckId
    : deployment.truckId;
  const activeDriver = hasReplacement
    ? deployment.replacement.replacementDriverId
    : deployment.driverId;
  const activeTruckType = hasReplacement
    ? deployment.replacement.replacementTruckType
    : deployment.truckType;

  const driverName = activeDriver
    ? `${activeDriver.firstname} ${activeDriver.lastname}`.toUpperCase()
    : "";
  const plateNo = activeTruck?.plateNo?.toUpperCase() || "";
  const helperCount = deployment.helperCount?.toString() || "0";

  const truckTypeFormatted = activeTruckType
    ? `(${activeTruckType.charAt(0).toUpperCase() + activeTruckType.slice(1).toLowerCase()})`
    : "";
  const plateWithType = truckTypeFormatted
    ? `${plateNo} ${truckTypeFormatted}`
    : plateNo;

  // ── Page setup (A4 portrait) ──────────────────────────────────────────────
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  doc.setFont("helvetica");

  const BORDER = [200, 200, 200];
  const MARGIN = 15;
  const PW = 210;
  const CW = PW - MARGIN * 2;

  const INFO_LABEL_W = 50;
  const INFO_VALUE_W = CW - INFO_LABEL_W;

  const C1 = CW * 0.34;
  const C2 = CW * 0.33;
  const C3 = CW - C1 - C2;

  const ROW_H = 9;
  const HDR_H = 8;

  let y = 12;

  // ── Cell drawing helper ───────────────────────────────────────────────────
  const cell = (x, rowY, w, h, text = "", opts = {}) => {
    const {
      bold = false,
      italic = false,
      align = "left",
      fill = null,
      fontSize = 9,
      textColor = [0, 0, 0],
    } = opts;

    if (fill) {
      doc.setFillColor(...fill);
      doc.rect(x, rowY, w, h, "F");
    }
    doc.setDrawColor(...BORDER);
    doc.setLineWidth(0.3);
    doc.rect(x, rowY, w, h);

    if (!text) return;

    doc.setFont(
      "helvetica",
      bold && italic
        ? "bolditalic"
        : bold
          ? "bold"
          : italic
            ? "italic"
            : "normal",
    );
    doc.setFontSize(fontSize);
    doc.setTextColor(...textColor);

    const ty = rowY + h / 2 + fontSize * 0.18;
    let tx;
    if (align === "center") tx = x + w / 2;
    else if (align === "right") tx = x + w - 3;
    else tx = x + 3;

    doc.text(text, tx, ty, { align });
  };

  const cellFull = (rowY, h, text = "", opts = {}) =>
    cell(MARGIN, rowY, CW, h, text, opts);

  // ── TMO Header (logo centered) ────────────────────────────────────────────
  try {
    const imgW = 98;
    const imgH = 36.75;
    doc.addImage(PAYSLIP_HEADER, "PNG", (PW - imgW) / 2, y, imgW, imgH);
    doc.setTextColor(0, 0, 0);
    y += imgH + 6;
  } catch {
    console.warn("Could not load logo");
  }

  // ── Document title ────────────────────────────────────────────────────────
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text("PAYMENT SLIP", PW / 2, y, { align: "center" });
  y += 6;
  doc.setLineWidth(0.5);
  doc.setDrawColor(...BORDER);
  doc.line(MARGIN, y, PW - MARGIN, y);
  y += 10;

  // ── Info rows ─────────────────────────────────────────────────────────────
  const infoRows = [
    { label: "DRIVER", value: driverName },
    { label: "PLATE NUMBER", value: plateWithType },
    { label: "NO. OF HELPER", value: helperCount },
  ];

  infoRows.forEach(({ label, value }) => {
    cell(MARGIN, y, INFO_LABEL_W, ROW_H, label, { bold: true, fontSize: 9 });
    cell(MARGIN + INFO_LABEL_W, y, INFO_VALUE_W, ROW_H, value, {
      fontSize: 9,
    });
    y += ROW_H;
  });

  // ── DRIVER COMPUTATION ────────────────────────────────────────────────────
  cellFull(y, HDR_H, "DRIVER COMPUTATION", {
    bold: true,
    align: "center",
    fill: [240, 240, 240],
    fontSize: 10,
  });
  y += HDR_H;

  cell(MARGIN, y, C1, ROW_H, "LOCATION", {
    bold: true,
    align: "center",
    fontSize: 9,
  });
  cell(MARGIN + C1, y, C2, ROW_H, "RATE", {
    bold: true,
    align: "center",
    fontSize: 9,
  });
  cell(MARGIN + C1 + C2, y, C3, ROW_H, "AMOUNT", {
    bold: true,
    align: "center",
    fontSize: 9,
  });
  y += ROW_H;

  cell(MARGIN, y, C1, ROW_H, (location || "").toUpperCase(), {
    align: "center",
    fontSize: 9,
  });
  cell(MARGIN + C1, y, C2, ROW_H, fmt(driverRate), {
    align: "center",
    fontSize: 9,
  });
  cell(MARGIN + C1 + C2, y, C3, ROW_H, `PHP  ${fmt(driverAmount)}`, {
    align: "center",
    fontSize: 9,
  });
  y += ROW_H;

  cellFull(y, ROW_H, "");
  y += ROW_H;

  // ── HELPER COMPUTATION ────────────────────────────────────────────────────
  cellFull(y, HDR_H, "HELPER COMPUTATION", {
    bold: true,
    align: "center",
    fill: [240, 240, 240],
    fontSize: 10,
  });
  y += HDR_H;

  cell(MARGIN, y, C1, ROW_H, "NET WEIGHT", {
    bold: true,
    align: "center",
    fontSize: 9,
  });
  cell(MARGIN + C1, y, C2, ROW_H, "RATE", {
    bold: true,
    align: "center",
    fontSize: 9,
  });
  cell(MARGIN + C1 + C2, y, C3, ROW_H, "AMOUNT", {
    bold: true,
    align: "center",
    fontSize: 9,
  });
  y += ROW_H;

  cell(MARGIN, y, C1, ROW_H, fmt(netWeight), { align: "center", fontSize: 9 });
  cell(MARGIN + C1, y, C2, ROW_H, String(helperRate), {
    align: "center",
    fontSize: 9,
  });
  cell(MARGIN + C1 + C2, y, C3, ROW_H, `PHP  ${fmt(helperAmount)}`, {
    align: "center",
    fontSize: 9,
  });
  y += ROW_H;

  cell(MARGIN, y, C1 + C2, ROW_H, "ALLOWANCE", {
    bold: true,
    align: "center",
    fontSize: 9,
  });
  cell(MARGIN + C1 + C2, y, C3, ROW_H, `PHP  ${fmt(allowanceAmount)}`, {
    align: "center",
    fontSize: 9,
  });
  y += ROW_H;

  cell(MARGIN, y, C1 + C2, ROW_H, "TOTAL", {
    bold: true,
    align: "center",
    fill: [0, 48, 87],
    textColor: [255, 255, 255],
    fontSize: 10,
  });
  cell(MARGIN + C1 + C2, y, C3, ROW_H, `PHP  ${fmt(total)}`, {
    bold: true,
    align: "center",
    fill: [0, 48, 87],
    textColor: [255, 255, 255],
    fontSize: 10,
  });
  y += ROW_H;

  // ── DATE / RECEIVED BY / RELEASED BY ─────────────────────────────────────
  y += 8;

  const BOTTOM_LABEL_W = 45;
  const BOTTOM_VALUE_W = CW - BOTTOM_LABEL_W;
  const BOTTOM_ROW_H = 12;
  const SIG_ROW_H = 22;

  cell(MARGIN, y, BOTTOM_LABEL_W, BOTTOM_ROW_H, "DATE", {
    bold: true,
    fontSize: 9,
  });
  cell(
    MARGIN + BOTTOM_LABEL_W,
    y,
    BOTTOM_VALUE_W,
    BOTTOM_ROW_H,
    DateTime.now().setZone("Asia/Manila").toFormat("cccc, d MMMM yyyy"),
    { fontSize: 9, align: "center" },
  );
  y += BOTTOM_ROW_H;

  cell(MARGIN, y, BOTTOM_LABEL_W, SIG_ROW_H, "RECEIVED BY", {
    bold: true,
    fontSize: 9,
  });
  cell(MARGIN + BOTTOM_LABEL_W, y, BOTTOM_VALUE_W, SIG_ROW_H, "");
  doc.setLineWidth(0.3);
  doc.setDrawColor(...BORDER);
  const sigY = y + SIG_ROW_H - 5;
  doc.line(
    MARGIN + BOTTOM_LABEL_W + BOTTOM_VALUE_W * 0.2,
    sigY,
    MARGIN + BOTTOM_LABEL_W + BOTTOM_VALUE_W * 0.8,
    sigY,
  );
  y += SIG_ROW_H;

  cell(MARGIN, y, BOTTOM_LABEL_W, SIG_ROW_H, "RELEASED BY", {
    bold: true,
    fontSize: 9,
  });
  cell(MARGIN + BOTTOM_LABEL_W, y, BOTTOM_VALUE_W, SIG_ROW_H, "");
  doc.setFont("helvetica", "bold").setFontSize(9).setTextColor(0, 0, 0);
  doc.text(
    "JOHN ROBERT M. OCUMEN",
    MARGIN + BOTTOM_LABEL_W + BOTTOM_VALUE_W / 2,
    y + SIG_ROW_H / 2 - 1,
    { align: "center" },
  );
  doc
    .setFont("helvetica", "normal")
    .setFontSize(7.5)
    .setTextColor(100, 100, 100);
  doc.text(
    "PROPRIETOR",
    MARGIN + BOTTOM_LABEL_W + BOTTOM_VALUE_W / 2,
    y + SIG_ROW_H / 2 + 4,
    { align: "center" },
  );
  y += SIG_ROW_H;

  // ── Timestamp footer ──────────────────────────────────────────────────────
  const ts = DateTime.now()
    .setZone("Asia/Manila")
    .toFormat("MMMM dd, yyyy hh:mm a");
  doc.setFontSize(7).setFont("helvetica", "italic").setTextColor(100, 100, 100);
  doc.text(`Generated on: ${ts}`, PW / 2, 287, { align: "center" });

  doc.save(`PaySlip_${deployment.deploymentCode}.pdf`);
};
