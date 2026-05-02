import jsPDF from "jspdf";
import { DateTime } from "luxon";
import { toast } from "react-toastify";
import axios from "axios";
import { SMC_HEADER_IMAGE } from "../consts/base_64_images";
import { API_DEPLOYMENT } from "../utils/APIRoutes";

const capitalizeWords = (str) => {
  if (!str) return "";
  return str
    .toLowerCase()
    .split(" ")
    .map((word) =>
      word.includes("(") || word.includes(")")
        ? word.replace(/\b\w/g, (c) => c.toUpperCase())
        : word.charAt(0).toUpperCase() + word.slice(1),
    )
    .join(" ");
};

const formatTruckType = (type) =>
  type ? capitalizeWords(type.replace(/-/g, " ")) : "";

const formatNumber = (value) => {
  if (!value || value === "" || isNaN(value)) return "";
  return parseFloat(value).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
};

/**
 * Generates and downloads a TMO PDF for the given deployment.
 *
 * @param {Object} deployment - The deployment object.
 * @param {Function} onUpdate  - Callback to update deployment state after marking TMO as printed.
 * @param {Function} setEditForm - Setter to sync isTMOPrinted into local edit form state.
 */
export async function exportTMOToPDF(deployment, onUpdate, setEditForm) {
  if (!deployment) return toast.error("No deployment data available");

  try {
    const pickups = deployment.pickups || [];
    if (!pickups.length)
      return toast.error("No pickup stops found on this deployment");

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

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });
    doc.setFont("helvetica");

    const BORDER = [200, 200, 200];
    const MARGIN = 15;
    const PW = 210;
    const CW = PW - MARGIN * 2;
    const LEFT = MARGIN + 2;
    const RIGHT = PW / 2 + 2;
    const FW = CW / 2 - 4;

    const sectionHeader = (title, y) => {
      doc.setFillColor(240, 240, 240);
      doc.rect(MARGIN, y, CW, 6, "F");
      doc.setDrawColor(...BORDER);
      doc.rect(MARGIN, y, CW, 6);
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(title, MARGIN + 2, y + 4.5);
      return y + 6;
    };

    const field = (label, value, x, y, maxW = 80) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(label + ":", x, y);
      const lw = doc.getTextWidth(label + ": ");
      const uw = maxW - lw - 5;
      const ux = x + lw + 3;
      if (value) doc.text(value, ux + uw / 2, y, { align: "center" });
      doc.setLineWidth(0.2);
      doc.line(ux, y + 1, ux + uw, y + 1);
      return y + 6;
    };

    pickups.forEach((pickup, idx) => {
      if (idx > 0) doc.addPage();
      let y = 12;

      try {
        doc.addImage(SMC_HEADER_IMAGE, "PNG", MARGIN, y, 28, 10.5);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0, 0, 160);
        doc.text("A Glocal Company", MARGIN, y + 14.5);
        doc.text('"Global Expertise, Grown Locally"', PW - MARGIN, y + 14.5, {
          align: "right",
        });
        doc.setTextColor(0, 0, 0);
        y += 28;
      } catch {
        console.warn("Could not load logo");
      }

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("TRANSPORT MOVEMENT ORDER", PW / 2, y, { align: "center" });
      y += 6;
      doc.setLineWidth(0.5);
      doc.setDrawColor(...BORDER);
      doc.line(MARGIN, y, PW - MARGIN, y);
      y += 10;

      doc.setFontSize(10);
      const date = DateTime.now()
        .setZone("Asia/Manila")
        .toFormat("MMMM dd, yyyy");
      const RAX = PW - MARGIN;

      doc.setFont("helvetica", "bold");
      doc.text("DP Code:", MARGIN, y);
      doc.setFont("helvetica", "normal");
      const dpVX = MARGIN + doc.getTextWidth("DP Code: ") + 3;
      doc.text(deployment.deploymentCode.toUpperCase(), dpVX, y);
      doc.setLineWidth(0.2);
      doc.line(dpVX, y + 1, MARGIN + CW / 2 - 5, y + 1);

      doc.setFont("helvetica", "bold");
      doc.text("Date:", RAX - 60, y);
      doc.setFont("helvetica", "normal");
      const dateVX = RAX - 60 + doc.getTextWidth("Date: ") + 3;
      doc.text(date, dateVX, y);
      doc.setLineWidth(0.2);
      doc.line(dateVX, y + 1, RAX, y + 1);
      y += 5;

      const tmoLabel = pickup.tmoNo ? pickup.tmoNo.toUpperCase() : "";
      doc.setFont("helvetica", "bold");
      doc.text("TMO No.:", MARGIN, y);
      doc.setFont("helvetica", "normal");
      const tmoVX = MARGIN + doc.getTextWidth("TMO No.: ") + 3;
      doc.text(tmoLabel, tmoVX, y);
      doc.setLineWidth(0.2);
      doc.line(tmoVX, y + 1, MARGIN + CW / 2 - 5, y + 1);
      y += 8;

      // ── Section 1: Pickup Details ──────────────────────────────────────────
      y = sectionHeader("1. PICKUP DETAILS", y);
      let ly = y + 5,
        ry = y + 5;

      ly = field(
        "Farm / Collection Point",
        capitalizeWords(pickup.pickupSite),
        LEFT,
        ly,
        FW,
      );
      ly = field(
        "Municipality",
        capitalizeWords(pickup.municipality),
        LEFT,
        ly,
        FW,
      );
      ly = field(
        "Scheduled Pickup Time",
        pickup.scheduledPickupTime
          ? DateTime.fromISO(pickup.scheduledPickupTime)
              .setZone("Asia/Manila")
              .toFormat("MMM dd, yyyy hh:mm a")
          : "",
        LEFT,
        ly,
        FW,
      );

      ry = field(
        "Field Contact Person",
        capitalizeWords(pickup.fieldContactPerson),
        RIGHT,
        ry,
        FW,
      );
      ry = field("Contact No", pickup.fieldContactPersonNo, RIGHT, ry, FW);
      ry = field(
        "Estimated Quantity (kg)",
        formatNumber(pickup.estimatedWeightKg),
        RIGHT,
        ry,
        FW,
      );

      y = Math.max(ly, ry) + 3;

      // ── Section 2: Truck & Driver Details ─────────────────────────────────
      y = sectionHeader("2. TRUCK & DRIVER DETAILS", y);
      ly = y + 7;
      ry = y + 7;

      const driverName = activeDriver
        ? `${capitalizeWords(activeDriver.firstname)} ${capitalizeWords(
            activeDriver.lastname,
          )}`
        : "";

      ly = field(
        "Truck Plate Number",
        activeTruck?.plateNo?.toUpperCase(),
        LEFT,
        ly,
        FW,
      );
      const hw = FW / 2 - 2;
      field("Truck Type", formatTruckType(activeTruckType), LEFT, ly, hw);
      field(
        "Helper Count",
        deployment.helperCount?.toString(),
        LEFT + FW / 2 + 2,
        ly,
        hw,
      );
      ly += 6;

      ry = field("Driver's Name", driverName, RIGHT, ry, FW);
      ry = field(
        "Driver's License No",
        activeDriver?.licenseNo?.toUpperCase() || "",
        RIGHT,
        ry,
        FW,
      );

      y = Math.max(ly, ry) + 3;

      // ── Section 3: Delivery Details ────────────────────────────────────────
      y = sectionHeader("3. DELIVERY DETAILS", y);
      ly = y + 7;
      ry = y + 7;

      ly = field(
        "Delivery / Tolling Facility",
        capitalizeWords(deployment.destination),
        LEFT,
        ly,
        FW,
      );
      ly = field(
        "Receiving Contact Person",
        capitalizeWords(deployment.receivingContactPerson),
        LEFT,
        ly,
        FW,
      );
      ly = field(
        "Contact No",
        deployment.receivingContactPersonNo,
        LEFT,
        ly,
        FW,
      );
      ly = field(
        "No. of Sacks",
        formatNumber(deployment.totalSacksCount),
        LEFT,
        ly,
        FW,
      );

      ry = field(
        "Territory",
        capitalizeWords(deployment.territory),
        RIGHT,
        ry,
        FW,
      );
      ry = field("Hybrid", capitalizeWords(deployment.hybrid), RIGHT, ry, FW);
      ry = field(
        "Flagging",
        capitalizeWords(deployment.flagging),
        RIGHT,
        ry,
        FW,
      );
      ry = field(
        "Reason of Flagging",
        capitalizeWords(deployment.flaggingRemarks),
        RIGHT,
        ry,
        FW,
      );

      y = Math.max(ly, ry) + 3;

      // ── Section 4: Load Details ────────────────────────────────────────────
      y = sectionHeader("4. LOAD DETAILS (To be completed on-site)", y);
      const colW = CW / 3 - 2;
      const loadY = y + 7;
      field("Gross Weight", "", MARGIN + 2, loadY, colW);
      field("Tare Weight", "", MARGIN + CW / 3 + 1, loadY, colW);
      field("Net Weight", "", MARGIN + (CW / 3) * 2 + 1, loadY, colW);
      y = loadY + 9;

      // ── Section 5: Confirmation ────────────────────────────────────────────
      y = sectionHeader("5. CONFIRMATION", y);
      y += 7;

      const sbW = CW / 2 - 2;
      const sbH = 25;
      doc.setDrawColor(...BORDER);
      doc.setLineWidth(0.3);

      doc.rect(MARGIN, y, sbW, sbH);
      doc.setFont("helvetica", "bold").setFontSize(9);
      doc.text("Loaded by (Field Personnel)", MARGIN + 2, y + 4);
      doc.setFont("helvetica", "normal").setFontSize(8);
      doc.text("Name:", MARGIN + 2, y + 10);
      doc.line(MARGIN + 12, y + 10.5, MARGIN + sbW - 2, y + 10.5);
      doc.text("Signature:", MARGIN + 2, y + 18);
      doc.line(MARGIN + 17, y + 18.5, MARGIN + sbW - 2, y + 18.5);

      const rbx = PW / 2 + 1;
      doc.rect(rbx, y, sbW, sbH);
      doc.setFont("helvetica", "bold").setFontSize(9);
      doc.text("Received by (Plant Personnel)", rbx + 2, y + 4);
      doc.setFont("helvetica", "normal").setFontSize(8);
      doc.text("Name:", rbx + 2, y + 10);
      doc.line(rbx + 12, y + 10.5, rbx + sbW - 2, y + 10.5);
      doc.text("Signature:", rbx + 2, y + 18);
      doc.line(rbx + 17, y + 18.5, rbx + sbW - 2, y + 18.5);

      y += sbH + 8;
      doc.setFont("helvetica", "bold").setFontSize(9);
      doc.text("Unloading Date:", MARGIN, y);
      doc.setFont("helvetica", "normal");
      doc.line(MARGIN + 30, y + 0.5, MARGIN + 80, y + 0.5);
      doc.setFont("helvetica", "bold");
      doc.text("Unloading Time:", PW / 2 + 10, y);
      doc.setFont("helvetica", "normal");
      doc.line(PW / 2 + 40, y + 0.5, PW / 2 + 90, y + 0.5);
      y += 8;

      // ── Section 6: Remarks ─────────────────────────────────────────────────
      y = sectionHeader("6. REMARKS", y);
      y += 5;
      doc.setDrawColor(...BORDER).setLineWidth(0.3);
      doc.rect(MARGIN, y, CW, 20);

      doc
        .setFontSize(7)
        .setFont("helvetica", "italic")
        .setTextColor(100, 100, 100);
      const ts = DateTime.now()
        .setZone("Asia/Manila")
        .toFormat("MMMM dd, yyyy hh:mm a");
      doc.text(`Generated on: ${ts}`, PW / 2, 287, { align: "center" });
    });

    doc.save(`TMO_${deployment.deploymentCode}.pdf`);
    await new Promise((r) => setTimeout(r, 800));

    // Mark as printed if not already
    if (!deployment.isTMOPrinted) {
      try {
        const res = await axios.patch(
          `${API_DEPLOYMENT}/${deployment._id}`,
          { isTMOPrinted: true },
          {
            headers: {
              Authorization: `Bearer ${sessionStorage.getItem("userToken")}`,
            },
          },
        );
        onUpdate(res.data.deployment);
        setEditForm((prev) => ({ ...prev, isTMOPrinted: true }));
      } catch (err) {
        toast.warning(
          `PDF generated but failed to update print status: ${
            err.response?.data?.message || err.message
          }`,
        );
        return;
      }
    }

    toast.success(
      `TMO exported — ${pickups.length} page${
        pickups.length > 1 ? "s" : ""
      } (${deployment.deploymentCode})`,
    );
  } catch (err) {
    toast.error(`Error generating TMO PDF: ${err.message}`);
  }
}
