import { DateTime } from "luxon";
import ExcelJS from "exceljs";
import { TRUCK_TYPES } from "./generalOptions";

export const exportDeploymentToExcel = async (allDeployments) => {
  if (!allDeployments || allDeployments.length === 0) {
    alert("No data to export");
    return;
  }

  // ─── helpers ────────────────────────────────────────────────────────────────

  const capitalizeWords = (str) => {
    if (!str) return "";
    return str
      .toLowerCase()
      .split(" ")
      .map((word) => {
        if (word.includes("(")) {
          return word
            .replace(/(\()(\w)/g, (_, p1, p2) => p1 + p2.toUpperCase())
            .replace(/^\w/, (c) => c.toUpperCase());
        }
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(" ");
  };

  const formatTruckType = (type) => {
    if (!type) return "";
    const lowerType = type.toLowerCase().trim();
    return TRUCK_TYPES[lowerType] || capitalizeWords(type.replace(/-/g, " "));
  };

  const formatReplacementReason = (reason) => {
    if (!reason) return "";
    return reason
      .replace(/_/g, " ")
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr || dateStr === "Pending") return "";
    try {
      const date = DateTime.fromISO(dateStr).setZone("Asia/Manila");
      const hour = date.hour;
      const minute = date.minute.toString().padStart(2, "0");
      const period = hour >= 12 ? "PM" : "AM";
      const hour12 = hour % 12 || 12;
      return `${date.toFormat("MMM")} ${date.day}, ${date.year} ${hour12}:${minute} ${period}`;
    } catch {
      return "";
    }
  };

  const calculateUnloadingTime = (destArrival, destDeparture) => {
    if (!destArrival || !destDeparture) return "";
    try {
      const arrival = DateTime.fromISO(destArrival);
      const departure = DateTime.fromISO(destDeparture);
      const { hours, minutes } = departure.diff(arrival, ["hours", "minutes"]);
      if (hours === 0) return `${Math.floor(minutes)}m`;
      if (minutes < 1) return `${hours}h`;
      return `${hours}h ${Math.floor(minutes)}m`;
    } catch {
      return "Error";
    }
  };

  // Returns a comma-formatted string e.g. 1000 → "1,000", 1500.5 → "1,500.5"
  // Preserves the sign so negative values show as e.g. "-120.5"
  const formatNumber = (val) => {
    const n = parseFloat(val);
    if (isNaN(n) || n === 0) return "0";
    return n.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  // ─── workbook setup ──────────────────────────────────────────────────────────

  const workbook = new ExcelJS.Workbook();

  const colors = {
    border: "FFD1D5DB",
    headerBg: "FFF0F0F0",
    text: "FF000000",
  };

  const baseBorder = {
    top: { style: "thin", color: { argb: colors.border } },
    left: { style: "thin", color: { argb: colors.border } },
    bottom: { style: "thin", color: { argb: colors.border } },
    right: { style: "thin", color: { argb: colors.border } },
  };

  const styles = {
    header: {
      font: { bold: true, size: 11, color: { argb: colors.text } },
      alignment: { horizontal: "center", vertical: "middle", wrapText: true },
      fill: {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: colors.headerBg },
      },
      border: baseBorder,
    },
    data: (align = "center") => ({
      font: { size: 10, color: { argb: colors.text } },
      alignment: { horizontal: align, vertical: "middle" },
      border: baseBorder,
    }),
  };

  const worksheet = workbook.addWorksheet("Deployments", {
    views: [
      {
        state: "frozen", // freeze header row
        xSplit: 0,
        ySplit: 1,
        showGridLines: false,
      },
    ],
    pageSetup: {
      paperSize: 9,
      orientation: "landscape",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
    },
  });

  // ─── column definitions ───────────────────────────────────────────────────────
  // Each entry: [header label, width, align]
  const COLS = [
    ["DP Code", 12, "center"], //  1
    ["TMO No.", 14, "center"], //  2
    ["Plate No", 12, "center"], //  3
    ["Truck Type", 14, "center"], //  4
    ["Driver", 20, "left"], //  5
    ["Helper Count", 13, "center"], //  6
    ["Pickup Site", 22, "left"], //  7
    ["Municipality", 18, "left"], //  8
    ["Destination", 25, "left"], //  9
    ["Est. Weight (kg)", 15, "center"], // 10  numeric
    ["Field Weight (kg)", 15, "center"], // 11  numeric
    ["Plant Weight (kg)", 15, "center"], // 12  numeric
    ["Variance (kg)", 14, "center"], // 13  numeric — plant minus field
    ["Variance (%)", 13, "center"], // 14  numeric — relative to field weight
    ["Status", 10, "center"], // 15
    ["Sched. Pickup", 18, "center"], // 16
    ["Departed", 18, "center"], // 17
    ["Pick-up In", 18, "center"], // 18
    ["Pick-up Out", 18, "center"], // 19
    ["Dest. Arrival", 18, "center"], // 20
    ["Dest. Departure", 18, "center"], // 21
    ["Unloading Time", 14, "center"], // 22
    ["Territory", 15, "left"], // 23
    ["Hybrid", 15, "left"], // 24
    ["Flagging", 12, "center"], // 25
    ["Flagging Remarks", 22, "left"], // 26
    ["Orig Plate No", 12, "center"], // 27
    ["Orig Truck Type", 14, "center"], // 28
    ["Orig Driver", 20, "left"], // 29
    ["Replaced At", 18, "center"], // 30
    ["Replacement Reason", 20, "left"], // 31
    ["Replacement Remarks", 25, "left"], // 32
  ];

  worksheet.columns = COLS.map(([, width]) => ({ width }));

  // Header row
  const headerRow = worksheet.addRow(COLS.map(([label]) => label));
  headerRow.height = 28;
  for (let col = 1; col <= COLS.length; col++) {
    headerRow.getCell(col).style = styles.header;
  }

  // Auto-filter across all header columns
  worksheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: COLS.length },
  };

  // ─── data rows ───────────────────────────────────────────────────────────────

  allDeployments.forEach((deployment) => {
    const hasReplacement = deployment?.replacement?.replacementTruckId?._id;
    const replacement = deployment?.replacement;

    // Current truck / driver
    const currentPlateNo = hasReplacement
      ? replacement.replacementTruckId?.plateNo || ""
      : deployment.truckId?.plateNo || "";
    const currentTruckType = hasReplacement
      ? replacement.replacementTruckType
      : deployment.truckType;
    const currentDriverObj = hasReplacement
      ? replacement.replacementDriverId
      : deployment.driverId;
    const currentDriverName = currentDriverObj
      ? `${capitalizeWords(currentDriverObj.firstname)} ${capitalizeWords(currentDriverObj.lastname)}`
      : "";
    const currentHelperCount = deployment.helperCount || "";

    // Original truck / driver (only populated when replaced)
    const origPlateNo = hasReplacement ? deployment.truckId?.plateNo || "" : "";
    const origTruckType = hasReplacement ? deployment.truckType || "" : "";
    const origDriverName =
      hasReplacement && deployment.driverId
        ? `${capitalizeWords(deployment.driverId.firstname)} ${capitalizeWords(deployment.driverId.lastname)}`
        : "";

    const replacementDate = hasReplacement
      ? formatDateTime(replacement.replacedAt)
      : "";
    const replacementReason = hasReplacement
      ? formatReplacementReason(replacement.reason || "")
      : "";
    const replacementRemarks = hasReplacement
      ? capitalizeWords(replacement.remarks || "")
      : "";

    const isCanceled = deployment.status === "canceled";
    const statusLabel = capitalizeWords(deployment.status || "");

    // Shared values written on every pickup row
    const shared = {
      dpCode: deployment.deploymentCode || "",
      plateNo: currentPlateNo.toUpperCase(),
      truckType: formatTruckType(currentTruckType),
      driver: currentDriverName,
      helperCount: currentHelperCount,
      destination: capitalizeWords(deployment.destination),
      status: statusLabel,
      departed: isCanceled ? "" : formatDateTime(deployment.departed),
      destArrival: isCanceled ? "" : formatDateTime(deployment.destArrival),
      destDeparture: isCanceled ? "" : formatDateTime(deployment.destDeparture),
      unloadingTime: isCanceled
        ? ""
        : calculateUnloadingTime(
            deployment.destArrival,
            deployment.destDeparture,
          ),
      territory: capitalizeWords(deployment.territory || ""),
      hybrid: capitalizeWords(deployment.hybrid || ""),
      flagging: capitalizeWords(deployment.flagging || ""),
      flaggingRemarks: capitalizeWords(deployment.flaggingRemarks || ""),
      origPlateNo: origPlateNo.toUpperCase(),
      origTruckType: formatTruckType(origTruckType),
      origDriver: origDriverName,
      replacementDate,
      replacementReason,
      replacementRemarks,
    };

    const pickups = deployment.pickups?.length ? deployment.pickups : [{}];

    pickups.forEach((pickup) => {
      const field = parseFloat(pickup.fieldWeightKg || 0);
      const plant = parseFloat(pickup.plantWeightKg || 0);

      // Variance = plant − field
      // Negative = weight lost in transit (typical due to drying/humidity)
      // Positive = weight gained in transit (unusual)
      const varianceKg = plant - field;
      const variancePct = field !== 0 ? (varianceKg / field) * 100 : null;

      const varianceKgStr = isCanceled ? "" : formatNumber(varianceKg);

      const variancePctStr = (() => {
        if (isCanceled || variancePct === null) return "";
        const formatted = variancePct.toLocaleString("en-US", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        });
        // Always show the sign explicitly so the reader knows if it's a gain or loss
        return `${formatted}%`;
      })();

      const row = worksheet.addRow([
        shared.dpCode, //  1
        pickup.tmoNo || "", //  2
        shared.plateNo, //  3
        shared.truckType, //  4
        shared.driver, //  5
        shared.helperCount, //  6
        capitalizeWords(pickup.pickupSite || ""), //  7
        capitalizeWords(pickup.municipality || ""), //  8
        shared.destination, //  9
        isCanceled ? "" : formatNumber(pickup.estimatedWeightKg), // 10
        isCanceled ? "" : formatNumber(pickup.fieldWeightKg), // 11
        isCanceled ? "" : formatNumber(pickup.plantWeightKg), // 12
        varianceKgStr, // 13 variance kg  (plant − field, signed)
        variancePctStr, // 14 variance %   (relative to field, signed)
        shared.status, // 15
        isCanceled ? "" : formatDateTime(pickup.scheduledPickupTime || ""), // 16
        shared.departed, // 17
        isCanceled ? "" : formatDateTime(pickup.pickupIn || ""), // 18
        isCanceled ? "" : formatDateTime(pickup.pickupOut || ""), // 19
        shared.destArrival, // 20
        shared.destDeparture, // 21
        shared.unloadingTime, // 22
        shared.territory, // 23
        shared.hybrid, // 24
        shared.flagging, // 25
        shared.flaggingRemarks, // 26
        shared.origPlateNo, // 27
        shared.origTruckType, // 28
        shared.origDriver, // 29
        shared.replacementDate, // 30
        shared.replacementReason, // 31
        shared.replacementRemarks, // 32
      ]);

      row.height = 20;

      COLS.forEach(([, , align], i) => {
        row.getCell(i + 1).style = styles.data(align);
      });
    });
  });

  // ─── export ──────────────────────────────────────────────────────────────────

  const timestamp = DateTime.now().toFormat("yyyy-MM-dd_HHmmss");
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.download = `Deployments_Export_${timestamp}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
