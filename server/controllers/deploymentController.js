const createError = require("http-errors");
const { validateFields } = require("../utils/validationFields");
const Deployment = require("../models/deploymentModel");
const Truck = require("../models/truckModel");
const Driver = require("../models/driverModel");
const ActivityLog = require("../models/activityLogsModel");
const TimelineLog = require("../models/timelineLogsModel");
const { DateTime } = require("luxon");
const validateDeploymentTimeline = require("../utils/validateDeploymentTimeline");

const MANILA_TZ = "Asia/Manila";

// ─── Replacement helpers ───────────────────────────────────────────────────────

// Returns the latest populated replacement truck (populated or raw ObjectId)
const getActiveReplacementTruck = (deployment) =>
  deployment.replacements
    ?.slice()
    .reverse()
    .find((r) => r.replacementTruckId)?.replacementTruckId || null;

// Returns the latest populated replacement driver
const getActiveReplacementDriver = (deployment) =>
  deployment.replacements
    ?.slice()
    .reverse()
    .find((r) => r.replacementDriverId)?.replacementDriverId || null;

// Helper: get active subcon (latest replacement truck takes priority)
const getActiveSubcon = (deployment) => {
  const activeTruck = getActiveReplacementTruck(deployment);
  if (activeTruck?.subcon) return activeTruck.subcon;
  return deployment.truckId?.subcon || "";
};

// Helper: map a pickup object, preserving tmoNo if it exists
const mapPickup = (p) => ({
  tmoNo: p.tmoNo || undefined,
  pickupSite: p.pickupSite,
  municipality: p.municipality,
  fieldContactPerson: p.fieldContactPerson,
  fieldContactPersonNo: p.fieldContactPersonNo,
  scheduledPickupTime: p.scheduledPickupTime,
  estimatedWeightKg: p.estimatedWeightKg,
  fieldWeightKg: p.fieldWeightKg || "",
  plantWeightKg: p.plantWeightKg || "",
  pickupIn: p.pickupIn || "",
  pickupOut: p.pickupOut || "",
  sacksCount:
    p.sacksCount !== undefined && p.sacksCount !== ""
      ? Number(p.sacksCount)
      : 0,
  hybrid: p.hybrid,
  territory: p.territory,
  flagging: p.flagging,
  flaggingRemarks: p.flaggingRemarks || "",
});

// Helper: apply a date range filter.
const applyDateRange = (query, field, from, to, isISO = false) => {
  if (from) {
    const [year, month, day] = from.split("-").map(Number);
    const start = DateTime.fromObject(
      { year, month, day, hour: 0, minute: 0, second: 0, millisecond: 0 },
      { zone: MANILA_TZ },
    );
    if (!start.isValid) return query;
    query = query.where(field).gte(isISO ? start.toISO() : start.toJSDate());
  }
  if (to) {
    const [year, month, day] = to.split("-").map(Number);
    const end = DateTime.fromObject(
      { year, month, day, hour: 23, minute: 59, second: 59, millisecond: 999 },
      { zone: MANILA_TZ },
    );
    if (!end.isValid) return query;
    query = query.where(field).lte(isISO ? end.toISO() : end.toJSDate());
  }
  return query;
};

// Helper: apply a simple string equality filter (skips if value is empty)
const applyStringFilter = (query, field, value) => {
  if (!value || value === "") return query;
  return query.where(field).equals(value);
};

// ─── Shared populate config ────────────────────────────────────────────────────

const FULL_POPULATE = [
  {
    path: "truckId",
    select: "plateNo truckType condition status imageUrl subcon",
  },
  { path: "driverId", select: "firstname lastname licenseNo contact subcon" },
  {
    path: "replacements.replacementTruckId",
    select: "plateNo truckType condition status imageUrl subcon",
  },
  {
    path: "replacements.replacementDriverId",
    select: "firstname lastname licenseNo contact subcon",
  },
];

const COUNT_POPULATE = [
  { path: "truckId", select: "subcon plateNo" },
  { path: "replacements.replacementTruckId", select: "subcon plateNo" },
  { path: "replacements.replacementDriverId", select: "firstname lastname" },
];

// ─── Create deployment ─────────────────────────────────────────────────────────

const createDeployment = async (req, res, next) => {
  try {
    const {
      pickups,
      truckId,
      driverId,
      truckType,
      helperCount,
      destination,
      receivingContactPerson,
      receivingContactPersonNo,
      totalSacksCount,
      totalWeightKg,
      departed,
      destArrival,
      destDeparture,
      isTMOPrinted = false,
      isPaySlipPrinted = false,
    } = req.body;

    if (!["head_admin", "admin"].includes(req.user.role)) {
      return next(createError(403, "Access denied"));
    }

    const company =
      req.user.role === "head_admin" ? req.body.company : req.user.company;

    validateFields({
      truckId,
      driverId,
      truckType,
      helperCount,
      destination,
      receivingContactPerson,
      receivingContactPersonNo,
      company,
    });

    if (!pickups || !Array.isArray(pickups) || pickups.length === 0) {
      return next(createError(400, "At least one pickup is required"));
    }

    for (let i = 0; i < pickups.length; i++) {
      const p = pickups[i];
      validateFields({
        [`pickups[${i}].pickupSite`]: p.pickupSite,
        [`pickups[${i}].municipality`]: p.municipality,
        [`pickups[${i}].fieldContactPerson`]: p.fieldContactPerson,
        [`pickups[${i}].fieldContactPersonNo`]: p.fieldContactPersonNo,
        [`pickups[${i}].scheduledPickupTime`]: p.scheduledPickupTime,
        [`pickups[${i}].estimatedWeightKg`]: p.estimatedWeightKg,
        [`pickups[${i}].hybrid`]: p.hybrid,
        [`pickups[${i}].territory`]: p.territory,
        [`pickups[${i}].flagging`]: p.flagging,
      });
    }

    const timelineErrors = validateDeploymentTimeline({
      pickups,
      departed,
      destArrival,
      destDeparture,
    });
    if (timelineErrors.length > 0) {
      return next(createError(400, timelineErrors.join(", ")));
    }

    const truck = await Truck.findById(truckId);
    if (!truck) return next(createError(404, "Truck not found"));

    const driver = await Driver.findById(driverId);
    if (!driver) return next(createError(404, "Driver not found"));

    const newDeployment = await Deployment.create({
      pickups: pickups.map(mapPickup),
      truckId,
      driverId,
      truckType,
      helperCount,
      destination,
      receivingContactPerson,
      receivingContactPersonNo,
      totalSacksCount: totalSacksCount || 0,
      totalWeightKg: totalWeightKg || 0,
      departed: departed || "",
      destArrival: destArrival || "",
      destDeparture: destDeparture || "",
      isTMOPrinted,
      isSoftDeleted: false,
      replacements: [],
      company,
    });

    await Promise.all([
      Truck.findByIdAndUpdate(truckId, { status: "deployed" }),
      Driver.findByIdAndUpdate(driverId, { status: "deployed" }),
    ]);

    const initialStatus = departed ? "ongoing" : "preparing";

    await TimelineLog.create({
      performedBy: req.user._id,
      action: "Truck assigned for deployment",
      status: initialStatus,
      timestamp: DateTime.now().setZone(MANILA_TZ).toISO(),
      targetDeployment: newDeployment._id,
    });

    await ActivityLog.create({
      type: "deployment",
      performedBy: req.user._id,
      action: `${
        newDeployment.deploymentCode
      }: Assigned ${truck.plateNo.toUpperCase()} to deployment`,
      targetDeployment: newDeployment._id,
    });

    const populatedDeployment = await Deployment.findById(newDeployment._id)
      .populate("truckId")
      .populate("driverId");

    res.status(201).json({
      message: "Deployment created successfully",
      deployment: populatedDeployment,
    });
  } catch (error) {
    next(error);
  }
};

// ─── Get all deployments ───────────────────────────────────────────────────────

const getAllDeployments = async (req, res, next) => {
  try {
    let {
      status,
      search,
      sort = "latest",
      assignedAtFrom,
      assignedAtTo,
      departedAtFrom,
      departedAtTo,
      completedAtFrom,
      completedAtTo,
      perPage = 200,
      page = 1,
      includeDeleted = false,
      subcon,
      territory,
      hybrid,
      flagging,
    } = req.query;

    if (completedAtFrom || completedAtTo) status = "completed";

    const subconFilter =
      req.user.role === "subcon" && req.user.subcon
        ? req.user.subcon.toLowerCase()
        : subcon && subcon !== ""
          ? subcon.toLowerCase()
          : null;

    let baseQuery = Deployment.find();

    // ── Company isolation: admins only see their own company's deployments ──
    if (req.user.role === "admin") {
      baseQuery = baseQuery.where("company").equals(req.user.company);
    }

    if (includeDeleted !== "true")
      baseQuery = baseQuery.where("isSoftDeleted").ne(true);
    if (status && status !== "")
      baseQuery = baseQuery.where("status").equals(status);

    baseQuery = applyDateRange(
      baseQuery,
      "createdAt",
      assignedAtFrom,
      assignedAtTo,
      false,
    );
    baseQuery = applyDateRange(
      baseQuery,
      "departed",
      departedAtFrom,
      departedAtTo,
      true,
    );
    baseQuery = applyDateRange(
      baseQuery,
      "destDeparture",
      completedAtFrom,
      completedAtTo,
      true,
    );

    const sortOptions = { oldest: { createdAt: 1 }, latest: { createdAt: -1 } };
    baseQuery = baseQuery.sort(sortOptions[sort] || sortOptions.latest);

    const limit = parseInt(perPage);
    const skip = (parseInt(page) - 1) * limit;
    baseQuery = baseQuery.skip(skip).limit(limit).populate(FULL_POPULATE);

    let deployments = await baseQuery;

    if (subconFilter) {
      deployments = deployments.filter(
        (d) => getActiveSubcon(d).toLowerCase() === subconFilter,
      );
    }

    if (territory && territory !== "") {
      deployments = deployments.filter((d) =>
        (d.pickups || []).some((p) => p.territory === territory),
      );
    }
    if (hybrid && hybrid !== "") {
      deployments = deployments.filter((d) =>
        (d.pickups || []).some((p) => p.hybrid === hybrid),
      );
    }
    if (flagging && flagging !== "") {
      deployments = deployments.filter((d) =>
        (d.pickups || []).some(
          (p) => p.flagging?.toUpperCase() === flagging.toUpperCase(),
        ),
      );
    }

    if (search && search !== "") {
      const s = search.toLowerCase();
      deployments = deployments.filter((deployment) => {
        const activeTruck = getActiveReplacementTruck(deployment);
        const activeDriver = getActiveReplacementDriver(deployment);

        const plate = (
          activeTruck?.plateNo ||
          deployment.truckId?.plateNo ||
          ""
        ).toLowerCase();
        const firstName = (
          activeDriver?.firstname ||
          deployment.driverId?.firstname ||
          ""
        ).toLowerCase();
        const lastName = (
          activeDriver?.lastname ||
          deployment.driverId?.lastname ||
          ""
        ).toLowerCase();

        const matchesPickup = (deployment.pickups || []).some((p) =>
          [
            p.tmoNo,
            p.pickupSite,
            p.municipality,
            p.fieldContactPerson,
            p.territory,
            p.hybrid,
            p.flagging,
          ]
            .map((v) => (v || "").toLowerCase())
            .some((v) => v.includes(s)),
        );

        return (
          plate.includes(s) ||
          firstName.includes(s) ||
          lastName.includes(s) ||
          (deployment.destination || "").toLowerCase().includes(s) ||
          (deployment.truckType || "").toLowerCase().includes(s) ||
          (deployment.deploymentCode || "").toLowerCase().includes(s) ||
          getActiveSubcon(deployment).toLowerCase().includes(s) ||
          matchesPickup
        );
      });
    }

    const buildCountQuery = () => {
      let q = Deployment.find();
      // ── Company isolation for count query ──
      if (req.user.role === "admin") {
        q = q.where("company").equals(req.user.company);
      }
      if (includeDeleted !== "true") q = q.where("isSoftDeleted").ne(true);
      if (status && status !== "") q = q.where("status").equals(status);
      q = applyDateRange(q, "createdAt", assignedAtFrom, assignedAtTo, false);
      q = applyDateRange(q, "departed", departedAtFrom, departedAtTo, true);
      q = applyDateRange(
        q,
        "destDeparture",
        completedAtFrom,
        completedAtTo,
        true,
      );
      return q;
    };

    let total;

    if (
      subconFilter ||
      (search && search !== "") ||
      territory ||
      hybrid ||
      flagging
    ) {
      const allForCount = await buildCountQuery().populate(COUNT_POPULATE);

      let filtered = allForCount;

      if (subconFilter) {
        filtered = filtered.filter(
          (d) => getActiveSubcon(d).toLowerCase() === subconFilter,
        );
      }
      if (territory && territory !== "") {
        filtered = filtered.filter((d) =>
          (d.pickups || []).some((p) => p.territory === territory),
        );
      }
      if (hybrid && hybrid !== "") {
        filtered = filtered.filter((d) =>
          (d.pickups || []).some((p) => p.hybrid === hybrid),
        );
      }
      if (flagging && flagging !== "") {
        filtered = filtered.filter((d) =>
          (d.pickups || []).some(
            (p) => p.flagging?.toUpperCase() === flagging.toUpperCase(),
          ),
        );
      }

      if (search && search !== "") {
        const s = search.toLowerCase();
        filtered = filtered.filter((deployment) => {
          const activeTruck = getActiveReplacementTruck(deployment);
          const plate = (
            activeTruck?.plateNo ||
            deployment.truckId?.plateNo ||
            ""
          ).toLowerCase();

          const matchesPickup = (deployment.pickups || []).some((p) =>
            [
              p.tmoNo,
              p.pickupSite,
              p.municipality,
              p.fieldContactPerson,
              p.territory,
              p.hybrid,
              p.flagging,
            ]
              .map((v) => (v || "").toLowerCase())
              .some((v) => v.includes(s)),
          );

          return (
            plate.includes(s) ||
            (deployment.destination || "").toLowerCase().includes(s) ||
            (deployment.truckType || "").toLowerCase().includes(s) ||
            (deployment.deploymentCode || "").toLowerCase().includes(s) ||
            getActiveSubcon(deployment).toLowerCase().includes(s) ||
            matchesPickup
          );
        });
      }

      total = filtered.length;
    } else {
      total = await buildCountQuery().countDocuments();
    }

    return res.status(200).json({
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
      deployments,
    });
  } catch (error) {
    next(error);
  }
};

// ─── Update deployment ─────────────────────────────────────────────────────────

const updateDeployment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      pickups,
      pickupUpdates,
      truckId,
      driverId,
      truckType,
      helperCount,
      destination,
      receivingContactPerson,
      receivingContactPersonNo,
      totalSacksCount,
      totalWeightKg,
      replacement,
      departed,
      destArrival,
      destDeparture,
      status,
      cancellationReason,
      isTMOPrinted,
      isPaySlipPrinted,
    } = req.body;

    if (!["head_admin", "admin"].includes(req.user.role)) {
      return next(createError(403, "Access denied"));
    }

    if (
      status === "canceled" &&
      (!cancellationReason || cancellationReason.trim() === "")
    ) {
      return next(
        createError(
          400,
          "Cancellation reason is required when canceling a deployment",
        ),
      );
    }

    const existingDeployment = await Deployment.findOne({
      _id: id,
      isSoftDeleted: { $ne: true },
    });

    if (!existingDeployment)
      return next(createError(404, "Deployment not found"));

    // ── Company isolation: admins can only update deployments in their company ──
    if (
      req.user.role === "admin" &&
      existingDeployment.company !== req.user.company
    ) {
      return next(
        createError(
          403,
          "Access denied: deployment belongs to a different company",
        ),
      );
    }

    if (departed !== undefined && departed !== null && departed.trim() !== "") {
      const currentIsTMOPrinted =
        isTMOPrinted !== undefined
          ? isTMOPrinted
          : existingDeployment.isTMOPrinted;
      if (!currentIsTMOPrinted) {
        return next(
          createError(
            400,
            "TMO must be exported/printed before updating departure time",
          ),
        );
      }
    }

    const deploymentCode = existingDeployment.deploymentCode;
    const extractedTruckId = truckId?._id || truckId;
    const extractedDriverId = driverId?._id || driverId;

    // ── Snapshot active replacements BEFORE any modifications ────────────
    const lastTruckReplacement = existingDeployment.replacements
      ?.slice()
      .reverse()
      .find((r) => r.replacementTruckId);

    const lastDriverReplacement = existingDeployment.replacements
      ?.slice()
      .reverse()
      .find((r) => r.replacementDriverId);

    const hasExistingReplacement = !!lastTruckReplacement;
    const hasExistingDriverReplacement = !!lastDriverReplacement;

    const originalValues = {
      pickups: existingDeployment.pickups,
      truckId: existingDeployment.truckId?.toString(),
      driverId: existingDeployment.driverId?.toString(),
      truckType: existingDeployment.truckType,
      helperCount: existingDeployment.helperCount,
      destination: existingDeployment.destination,
      receivingContactPerson: existingDeployment.receivingContactPerson,
      receivingContactPersonNo: existingDeployment.receivingContactPersonNo,
      totalSacksCount: existingDeployment.totalSacksCount,
      totalWeightKg: existingDeployment.totalWeightKg,
      departed: existingDeployment.departed,
      destArrival: existingDeployment.destArrival,
      destDeparture: existingDeployment.destDeparture,
      status: existingDeployment.status,
      cancellationReason: existingDeployment.cancellationReason,
      isTMOPrinted: existingDeployment.isTMOPrinted,
      isPaySlipPrinted: existingDeployment.isPaySlipPrinted,
      replacementTruckId: lastTruckReplacement?.replacementTruckId?.toString(),
      replacementDriverId:
        lastDriverReplacement?.replacementDriverId?.toString(),
    };

    const originalStatus = existingDeployment.status;

    let performedReplacement = false;
    let performedDriverReplacement = false;
    let replacementTruckDetails = null;
    let replacementDriverDetails = null;

    const createReplacementTimelineLog = async (action, timestamp) => {
      const ts = timestamp
        ? new Date(timestamp).toISOString()
        : DateTime.now().setZone(MANILA_TZ).toISO();
      await TimelineLog.create({
        performedBy: req.user._id,
        action,
        status: existingDeployment.status,
        timestamp: ts,
        targetDeployment: existingDeployment._id,
      });
    };

    // ── Truck + Driver replacement (combined into one entry) ──────────────────────
    if (replacement?.replacementTruckId || replacement?.replacementDriverId) {
      const replacementTruckId =
        replacement.replacementTruckId?._id || replacement.replacementTruckId;
      const replacementDriverId =
        replacement.replacementDriverId?._id || replacement.replacementDriverId;

      const isNewTruckReplacement =
        replacementTruckId &&
        (!hasExistingReplacement ||
          lastTruckReplacement.replacementTruckId.toString() !==
            replacementTruckId.toString());

      const isNewDriverReplacement =
        replacementDriverId &&
        (!hasExistingDriverReplacement ||
          lastDriverReplacement.replacementDriverId.toString() !==
            replacementDriverId.toString());

      // ── Truck side ────────────────────────────────────────────────────────
      if (isNewTruckReplacement) {
        performedReplacement = true;

        const [newTruck, oldTruck, oldReplacementTruck] = await Promise.all([
          Truck.findById(replacementTruckId),
          Truck.findById(existingDeployment.truckId),
          hasExistingReplacement
            ? Truck.findById(lastTruckReplacement.replacementTruckId)
            : Promise.resolve(null),
        ]);

        const oldPlateNo = (oldTruck?.plateNo || "Unknown").toUpperCase();
        const newPlateNo = (newTruck?.plateNo || "Unknown").toUpperCase();
        const oldReplacementPlateNo = (
          oldReplacementTruck?.plateNo || "Unknown"
        ).toUpperCase();

        replacementTruckDetails = {
          oldPlateNo,
          newPlateNo,
          oldReplacementPlateNo,
          newTruck,
          oldTruck,
          oldReplacementTruck,
        };

        const truckUpdates = [
          Truck.findByIdAndUpdate(replacementTruckId, { status: "deployed" }),
        ];
        if (hasExistingReplacement && oldReplacementTruck) {
          truckUpdates.push(
            Truck.findByIdAndUpdate(lastTruckReplacement.replacementTruckId, {
              status: "available",
            }),
          );
        }
        if (!hasExistingReplacement) {
          truckUpdates.push(
            Truck.findByIdAndUpdate(existingDeployment.truckId, {
              status: "available",
            }),
          );
        }
        await Promise.all(truckUpdates);

        await createReplacementTimelineLog(
          hasExistingReplacement
            ? `Truck ${oldReplacementPlateNo} has been replaced to ${newPlateNo}`
            : `Truck ${oldPlateNo} has been replaced to ${newPlateNo}`,
          replacement?.replacedAt || new Date(),
        );
      }

      // ── Driver side ───────────────────────────────────────────────────────
      if (isNewDriverReplacement) {
        performedDriverReplacement = true;

        const [newDriver, oldDriver, oldReplacementDriver] = await Promise.all([
          Driver.findById(replacementDriverId),
          existingDeployment.driverId
            ? Driver.findById(existingDeployment.driverId)
            : null,
          hasExistingDriverReplacement
            ? Driver.findById(lastDriverReplacement.replacementDriverId)
            : Promise.resolve(null),
        ]);

        replacementDriverDetails = {
          oldDriverName: oldDriver
            ? `${oldDriver.firstname} ${oldDriver.lastname}`
            : "Unknown",
          newDriverName: newDriver
            ? `${newDriver.firstname} ${newDriver.lastname}`
            : "Unknown",
          oldReplacementDriverName: oldReplacementDriver
            ? `${oldReplacementDriver.firstname} ${oldReplacementDriver.lastname}`
            : "Unknown",
          newDriver,
          oldDriver,
          oldReplacementDriver,
        };

        const driverUpdates = [
          Driver.findByIdAndUpdate(replacementDriverId, { status: "deployed" }),
        ];
        if (hasExistingDriverReplacement && oldReplacementDriver) {
          driverUpdates.push(
            Driver.findByIdAndUpdate(
              lastDriverReplacement.replacementDriverId,
              { status: "available" },
            ),
          );
        }
        if (!hasExistingDriverReplacement) {
          driverUpdates.push(
            Driver.findByIdAndUpdate(existingDeployment.driverId, {
              status: "available",
            }),
          );
        }
        await Promise.all(driverUpdates);

        await createReplacementTimelineLog(
          hasExistingDriverReplacement
            ? `Driver ${replacementDriverDetails.oldReplacementDriverName} has been replaced to ${replacementDriverDetails.newDriverName}`
            : `Driver ${replacementDriverDetails.oldDriverName} has been replaced to ${replacementDriverDetails.newDriverName}`,
          replacement?.replacedAt || new Date(),
        );
      }

      // ── Single combined push ──────────────────────────────────────────────
      if (isNewTruckReplacement || isNewDriverReplacement) {
        const lastIndex = existingDeployment.replacements.length - 1;

        if (lastIndex >= 0 && !replacement.isNewReplacement) {
          // Edit latest in-place (from DeploymentDetailsModal)
          if (isNewTruckReplacement) {
            existingDeployment.replacements[lastIndex].replacementTruckId =
              replacementTruckId;
            existingDeployment.replacements[lastIndex].replacementTruckType =
              replacement.replacementTruckType || existingDeployment.truckType;
          }
          if (isNewDriverReplacement) {
            existingDeployment.replacements[lastIndex].replacementDriverId =
              replacementDriverId;
          }
        } else {
          // Push new entry (from ReplacementModal or first ever replacement)
          const newEntry = {
            replacedAt: (
              replacement.replacedAt || new Date().toISOString()
            ).substring(0, 16),
            reason: replacement.reason,
            remarks: replacement.remarks,
          };
          if (isNewTruckReplacement) {
            newEntry.replacementTruckId = replacementTruckId;
            newEntry.replacementTruckType =
              replacement.replacementTruckType || existingDeployment.truckType;
          }
          if (isNewDriverReplacement) {
            newEntry.replacementDriverId = replacementDriverId;
          }
          existingDeployment.replacements.push(newEntry);
        }

        existingDeployment.markModified("replacements");
      }
    }

    // ── Regular truck/driver change (non-replacement) ─────────────────────
    if (
      extractedTruckId &&
      extractedTruckId.toString() !== originalValues.truckId &&
      !performedReplacement
    ) {
      const [newTruck, oldTruck] = await Promise.all([
        Truck.findById(extractedTruckId),
        Truck.findById(originalValues.truckId),
      ]);
      if (newTruck) {
        await createReplacementTimelineLog(
          `Truck ${(oldTruck?.plateNo || "Unknown").toUpperCase()} has been changed to ${newTruck.plateNo.toUpperCase()}`,
        );
      }
    }

    if (
      extractedDriverId &&
      extractedDriverId.toString() !== originalValues.driverId &&
      !performedDriverReplacement
    ) {
      const [newDriver, oldDriver] = await Promise.all([
        Driver.findById(extractedDriverId),
        Driver.findById(originalValues.driverId),
      ]);
      if (newDriver) {
        const oldName = oldDriver
          ? `${oldDriver.firstname} ${oldDriver.lastname}`
          : "Unknown";
        await createReplacementTimelineLog(
          `Driver ${oldName} has been changed to ${newDriver.firstname} ${newDriver.lastname}`,
        );
      }
    }

    // ── Determine final status ────────────────────────────────────────────
    const isDepartedSet =
      departed !== undefined && departed !== "" && departed !== null;
    const isDestDepartureSet =
      destDeparture !== undefined &&
      destDeparture !== "" &&
      destDeparture !== null;

    let finalStatus = status || existingDeployment.status;
    if (isDepartedSet && !isDestDepartureSet && finalStatus !== "canceled")
      finalStatus = "ongoing";
    else if (isDestDepartureSet && finalStatus !== "canceled")
      finalStatus = "completed";

    // ── Cancellation reason ───────────────────────────────────────────────
    let finalCancellationReason = existingDeployment.cancellationReason;
    if (originalStatus === "canceled" && finalStatus !== "canceled")
      finalCancellationReason = undefined;
    if (finalStatus === "canceled" && originalStatus !== "canceled")
      finalCancellationReason = cancellationReason;
    if (
      originalStatus === "canceled" &&
      finalStatus === "canceled" &&
      cancellationReason !== undefined
    ) {
      finalCancellationReason = cancellationReason;
    }

    // ── Active IDs after replacement processing ───────────────────────────
    // Re-derive from the (now possibly updated) replacements array
    const updatedLastTruckReplacement = existingDeployment.replacements
      ?.slice()
      .reverse()
      .find((r) => r.replacementTruckId);

    const updatedLastDriverReplacement = existingDeployment.replacements
      ?.slice()
      .reverse()
      .find((r) => r.replacementDriverId);

    const currentActiveTruckId =
      updatedLastTruckReplacement?.replacementTruckId ||
      existingDeployment.truckId;

    const currentActiveDriverId =
      updatedLastDriverReplacement?.replacementDriverId ||
      existingDeployment.driverId;

    // ── Status-based truck/driver availability ────────────────────────────
    const statusUpdates = [];
    if (
      finalStatus === "canceled" ||
      (isDestDepartureSet && finalStatus === "completed")
    ) {
      if (currentActiveTruckId)
        statusUpdates.push(
          Truck.findByIdAndUpdate(currentActiveTruckId, {
            status: "available",
          }),
        );
      if (currentActiveDriverId)
        statusUpdates.push(
          Driver.findByIdAndUpdate(currentActiveDriverId, {
            status: "available",
          }),
        );
    } else if (finalStatus === "ongoing" || finalStatus === "preparing") {
      if (
        currentActiveTruckId &&
        !performedReplacement &&
        (!hasExistingReplacement ||
          currentActiveTruckId.toString() !== originalValues.truckId)
      ) {
        statusUpdates.push(
          Truck.findByIdAndUpdate(currentActiveTruckId, { status: "deployed" }),
        );
      }
      if (
        currentActiveDriverId &&
        !performedDriverReplacement &&
        (!hasExistingDriverReplacement ||
          currentActiveDriverId.toString() !== originalValues.driverId)
      ) {
        statusUpdates.push(
          Driver.findByIdAndUpdate(currentActiveDriverId, {
            status: "deployed",
          }),
        );
      }
    }
    await Promise.all(statusUpdates);

    // ── Truck/driver swap (non-replacement) ───────────────────────────────
    if (
      extractedTruckId &&
      extractedTruckId.toString() !== originalValues.truckId &&
      !hasExistingReplacement &&
      !performedReplacement
    ) {
      const updates = [];
      if (originalValues.truckId)
        updates.push(
          Truck.findByIdAndUpdate(originalValues.truckId, {
            status: "available",
          }),
        );
      if (finalStatus !== "canceled" && finalStatus !== "completed") {
        updates.push(
          Truck.findByIdAndUpdate(extractedTruckId, { status: "deployed" }),
        );
      }
      await Promise.all(updates);
    }

    if (
      extractedDriverId &&
      extractedDriverId.toString() !== originalValues.driverId &&
      !hasExistingDriverReplacement &&
      !performedDriverReplacement
    ) {
      const updates = [];
      if (originalValues.driverId)
        updates.push(
          Driver.findByIdAndUpdate(originalValues.driverId, {
            status: "available",
          }),
        );
      if (finalStatus !== "canceled" && finalStatus !== "completed") {
        updates.push(
          Driver.findByIdAndUpdate(extractedDriverId, { status: "deployed" }),
        );
      }
      await Promise.all(updates);
    }

    // ── Trip count on completion ──────────────────────────────────────────
    if (finalStatus === "completed" && originalStatus !== "completed") {
      try {
        await Promise.all(
          [
            currentActiveDriverId &&
              Driver.findByIdAndUpdate(currentActiveDriverId, {
                $inc: { tripCount: 1 },
              }),
            currentActiveTruckId &&
              Truck.findByIdAndUpdate(currentActiveTruckId, {
                $inc: { tripCount: 1 },
              }),
          ].filter(Boolean),
        );
      } catch (err) {
        console.error("Error incrementing trip counts:", err);
      }
    }

    // ── Pickups ───────────────────────────────────────────────────────────
    if (pickups !== undefined) {
      existingDeployment.pickups = pickups.map(mapPickup);
    }

    if (pickupUpdates && Array.isArray(pickupUpdates)) {
      for (const update of pickupUpdates) {
        const stop = existingDeployment.pickups[update.index];
        if (!stop) continue;
        if (update.pickupIn !== undefined) stop.pickupIn = update.pickupIn;
        if (update.pickupOut !== undefined) stop.pickupOut = update.pickupOut;
        if (update.fieldWeightKg !== undefined)
          stop.fieldWeightKg = update.fieldWeightKg;
        if (update.plantWeightKg !== undefined)
          stop.plantWeightKg = update.plantWeightKg;
        if (update.sacksCount !== undefined)
          stop.sacksCount = Number(update.sacksCount);
        if (update.hybrid !== undefined) stop.hybrid = update.hybrid;
        if (update.territory !== undefined) stop.territory = update.territory;
        if (update.flagging !== undefined) stop.flagging = update.flagging;
        if (update.flaggingRemarks !== undefined)
          stop.flaggingRemarks = update.flaggingRemarks;
      }
      existingDeployment.markModified("pickups");
    }

    const timelineErrors = validateDeploymentTimeline({
      pickups: existingDeployment.pickups,
      departed: departed !== undefined ? departed : existingDeployment.departed,
      destArrival:
        destArrival !== undefined
          ? destArrival
          : existingDeployment.destArrival,
      destDeparture:
        destDeparture !== undefined
          ? destDeparture
          : existingDeployment.destDeparture,
    });
    if (timelineErrors.length > 0) {
      return next(createError(400, timelineErrors.join(", ")));
    }

    const computedSacksCount = existingDeployment.pickups.reduce(
      (sum, p) => sum + (Number(p.sacksCount) || 0),
      0,
    );
    const computedWeightKg = existingDeployment.pickups.reduce(
      (sum, p) => sum + (parseFloat(p.plantWeightKg) || 0),
      0,
    );

    Object.assign(existingDeployment, {
      truckId: extractedTruckId || existingDeployment.truckId,
      driverId: extractedDriverId || existingDeployment.driverId,
      truckType:
        truckType !== undefined ? truckType : existingDeployment.truckType,
      helperCount:
        helperCount !== undefined
          ? helperCount
          : existingDeployment.helperCount,
      destination:
        destination !== undefined
          ? destination
          : existingDeployment.destination,
      receivingContactPerson:
        receivingContactPerson !== undefined
          ? receivingContactPerson
          : existingDeployment.receivingContactPerson,
      receivingContactPersonNo:
        receivingContactPersonNo !== undefined
          ? receivingContactPersonNo
          : existingDeployment.receivingContactPersonNo,
      totalSacksCount: computedSacksCount,
      totalWeightKg: computedWeightKg,
      departed: departed !== undefined ? departed : existingDeployment.departed,
      destArrival:
        destArrival !== undefined
          ? destArrival
          : existingDeployment.destArrival,
      destDeparture:
        destDeparture !== undefined
          ? destDeparture
          : existingDeployment.destDeparture,
      status:
        finalStatus !== undefined ? finalStatus : existingDeployment.status,
      cancellationReason: finalCancellationReason,
      isTMOPrinted:
        isTMOPrinted !== undefined
          ? isTMOPrinted
          : existingDeployment.isTMOPrinted,
      isPaySlipPrinted:
        isPaySlipPrinted !== undefined
          ? isPaySlipPrinted
          : existingDeployment.isPaySlipPrinted,
    });

    await existingDeployment.save();

    // ── Timeline & activity logs ──────────────────────────────────────────
    const timelineLogs = [];
    const activityLogs = [];
    const now = DateTime.now().setZone(MANILA_TZ).toISO();

    const createOrUpdateTimelineLog = async (
      actionType,
      newTimestamp,
      logStatus,
    ) => {
      const actionMap = {
        departed: "Departed from station",
        destArrival: "Arrived at destination",
        destDeparture: "Departed from destination",
        canceled: "Deployment has been canceled",
      };
      const action = actionMap[actionType];
      if (!action) return;

      const existingLog = await TimelineLog.findOne({
        targetDeployment: existingDeployment._id,
        action: { $regex: `^${action}` },
      }).sort({ timestamp: -1 });

      if (existingLog) {
        existingLog.timestamp = newTimestamp;
        existingLog.status = logStatus;
        await existingLog.save();
        timelineLogs.push(`${action} (updated)`);
      } else {
        await TimelineLog.create({
          performedBy: req.user._id,
          action,
          status: logStatus,
          timestamp: newTimestamp,
          targetDeployment: existingDeployment._id,
        });
        timelineLogs.push(action);
      }
    };

    const createActivityLog = async (action) => {
      await ActivityLog.create({
        type: "deployment",
        performedBy: req.user._id,
        action: `${deploymentCode}: ${action}`,
        targetDeployment: existingDeployment._id,
      });
      activityLogs.push(action);
    };

    // ── Pickup timeline logs ──────────────────────────────────────────────
    if (pickups !== undefined && finalStatus !== "canceled") {
      const isMultiStop = pickups.length >= 2;

      for (let i = 0; i < pickups.length; i++) {
        const p = pickups[i];
        const originalStop = p.tmoNo
          ? originalValues.pickups?.find((op) => op.tmoNo === p.tmoNo)
          : originalValues.pickups?.[i];

        const stopLabel = isMultiStop
          ? p.tmoNo
            ? `Stop #${i + 1} (${p.tmoNo})`
            : `Stop #${i + 1}`
          : null;

        if (p.pickupIn && !originalStop?.pickupIn) {
          await TimelineLog.create({
            performedBy: req.user._id,
            action: `Arrived at pickup location${stopLabel ? ` (${stopLabel})` : ""}`,
            status: finalStatus || "ongoing",
            timestamp: p.pickupIn,
            targetDeployment: existingDeployment._id,
          });
          timelineLogs.push(`pickupIn${stopLabel ? ` ${stopLabel}` : ""}`);
          await createActivityLog(
            `Arrived at pickup location${stopLabel ? ` (${stopLabel})` : ""}`,
          );
        }

        if (p.pickupOut && !originalStop?.pickupOut) {
          await TimelineLog.create({
            performedBy: req.user._id,
            action: `Departed from pickup location${stopLabel ? ` (${stopLabel})` : ""}`,
            status: finalStatus || "ongoing",
            timestamp: p.pickupOut,
            targetDeployment: existingDeployment._id,
          });
          timelineLogs.push(`pickupOut${stopLabel ? ` ${stopLabel}` : ""}`);
          await createActivityLog(
            `Departed from pickup location${stopLabel ? ` (${stopLabel})` : ""}`,
          );
        }

        if (originalStop) {
          if (p.hybrid !== undefined && p.hybrid !== originalStop.hybrid)
            await createActivityLog(
              `Hybrid changed to ${p.hybrid}${stopLabel ? ` (${stopLabel})` : ""}`,
            );
          if (
            p.territory !== undefined &&
            p.territory !== originalStop.territory
          )
            await createActivityLog(
              `Territory changed to ${p.territory}${stopLabel ? ` (${stopLabel})` : ""}`,
            );
          if (p.flagging !== undefined && p.flagging !== originalStop.flagging)
            await createActivityLog(
              `Flagging changed to ${p.flagging}${stopLabel ? ` (${stopLabel})` : ""}`,
            );
          if (
            p.flaggingRemarks !== undefined &&
            p.flaggingRemarks !== originalStop.flaggingRemarks
          )
            await createActivityLog(
              `Flagging remarks updated${stopLabel ? ` (${stopLabel})` : ""}`,
            );
        }
      }
    }

    if (pickupUpdates && Array.isArray(pickupUpdates)) {
      const isMultiStop = existingDeployment.pickups.length >= 2;

      for (const update of pickupUpdates) {
        const originalStop = originalValues.pickups[update.index];

        const stopLabel = isMultiStop
          ? originalStop?.tmoNo
            ? `Stop #${update.index + 1} (${originalStop.tmoNo})`
            : `Stop #${update.index + 1}`
          : null;

        if (
          update.pickupIn &&
          update.pickupIn !== (originalStop?.pickupIn || "") &&
          !originalStop?.pickupIn
        ) {
          await TimelineLog.create({
            performedBy: req.user._id,
            action: `Arrived at pickup location${stopLabel ? ` (${stopLabel})` : ""}`,
            status: finalStatus || "ongoing",
            timestamp: update.pickupIn,
            targetDeployment: existingDeployment._id,
          });
          timelineLogs.push(`pickupIn${stopLabel ? ` ${stopLabel}` : ""}`);
          await createActivityLog(
            `Arrived at pickup location${stopLabel ? ` (${stopLabel})` : ""}`,
          );
        }

        if (
          update.pickupOut &&
          update.pickupOut !== (originalStop?.pickupOut || "") &&
          !originalStop?.pickupOut
        ) {
          await TimelineLog.create({
            performedBy: req.user._id,
            action: `Departed from pickup location${stopLabel ? ` (${stopLabel})` : ""}`,
            status: finalStatus || "ongoing",
            timestamp: update.pickupOut,
            targetDeployment: existingDeployment._id,
          });
          timelineLogs.push(`pickupOut${stopLabel ? ` ${stopLabel}` : ""}`);
          await createActivityLog(
            `Departed from pickup location${stopLabel ? ` (${stopLabel})` : ""}`,
          );
        }

        if (
          update.hybrid !== undefined &&
          update.hybrid !== originalStop?.hybrid
        )
          await createActivityLog(
            `Hybrid changed to ${update.hybrid}${stopLabel ? ` (${stopLabel})` : ""}`,
          );
        if (
          update.territory !== undefined &&
          update.territory !== originalStop?.territory
        )
          await createActivityLog(
            `Territory changed to ${update.territory}${stopLabel ? ` (${stopLabel})` : ""}`,
          );
        if (
          update.flagging !== undefined &&
          update.flagging !== originalStop?.flagging
        )
          await createActivityLog(
            `Flagging changed to ${update.flagging}${stopLabel ? ` (${stopLabel})` : ""}`,
          );
        if (
          update.flaggingRemarks !== undefined &&
          update.flaggingRemarks !== originalStop?.flaggingRemarks
        )
          await createActivityLog(
            `Flagging remarks updated${stopLabel ? ` (${stopLabel})` : ""}`,
          );
      }
    }

    // ── Cancellation / resume logs ────────────────────────────────────────
    if (finalStatus === "canceled" && originalStatus !== "canceled") {
      await TimelineLog.create({
        performedBy: req.user._id,
        action: "Deployment has been canceled",
        status: "canceled",
        timestamp: now,
        targetDeployment: existingDeployment._id,
      });
      timelineLogs.push("Deployment has been canceled");
    } else if (finalStatus === "canceled" && originalStatus === "canceled") {
      const latestCancelLog = await TimelineLog.findOne({
        targetDeployment: existingDeployment._id,
        action: "Deployment has been canceled",
        status: "canceled",
      }).sort({ timestamp: -1 });

      let shouldCreateNew = false;
      if (latestCancelLog) {
        const resumedAfter = await TimelineLog.findOne({
          targetDeployment: existingDeployment._id,
          action: /^Deployment resumed as/,
          timestamp: { $gt: latestCancelLog.timestamp },
        });
        if (resumedAfter) shouldCreateNew = true;
      }

      if (shouldCreateNew || !latestCancelLog) {
        await TimelineLog.create({
          performedBy: req.user._id,
          action: "Deployment has been canceled",
          status: "canceled",
          timestamp: now,
          targetDeployment: existingDeployment._id,
        });
        timelineLogs.push("Deployment has been canceled");
      } else {
        latestCancelLog.timestamp = now;
        await latestCancelLog.save();
        timelineLogs.push("Deployment has been canceled (timestamp updated)");
      }
    }

    if (originalStatus === "canceled" && finalStatus !== "canceled") {
      await TimelineLog.create({
        performedBy: req.user._id,
        action: `Deployment resumed as ${finalStatus}`,
        status: finalStatus,
        timestamp: now,
        targetDeployment: existingDeployment._id,
      });
      timelineLogs.push("Deployment resumed");
    }

    if (
      departed !== undefined &&
      departed !== originalValues.departed &&
      departed &&
      !originalValues.departed &&
      finalStatus !== "canceled"
    ) {
      await createOrUpdateTimelineLog(
        "departed",
        departed,
        finalStatus || "ongoing",
      );
      await createActivityLog("Departed from station");
    }

    if (
      destArrival !== undefined &&
      destArrival !== originalValues.destArrival &&
      destArrival &&
      !originalValues.destArrival &&
      finalStatus !== "canceled"
    ) {
      await createOrUpdateTimelineLog(
        "destArrival",
        destArrival,
        finalStatus || "ongoing",
      );
      await createActivityLog("Arrived at destination");
    }

    if (
      destDeparture !== undefined &&
      destDeparture !== originalValues.destDeparture &&
      destDeparture &&
      !originalValues.destDeparture &&
      finalStatus !== "canceled"
    ) {
      await createOrUpdateTimelineLog(
        "destDeparture",
        destDeparture,
        "completed",
      );
      await createActivityLog("Departed from destination");
    }

    if (performedReplacement && replacementTruckDetails) {
      await createActivityLog(
        hasExistingReplacement
          ? `Replacement truck changed from ${replacementTruckDetails.oldReplacementPlateNo} to ${replacementTruckDetails.newPlateNo}`
          : `Truck replaced from ${replacementTruckDetails.oldPlateNo} to ${replacementTruckDetails.newPlateNo}`,
      );
    }

    if (performedDriverReplacement && replacementDriverDetails) {
      await createActivityLog(
        hasExistingDriverReplacement
          ? `Replacement driver changed from ${replacementDriverDetails.oldReplacementDriverName} to ${replacementDriverDetails.newDriverName}`
          : `Driver replaced from ${replacementDriverDetails.oldDriverName} to ${replacementDriverDetails.newDriverName}`,
      );
    }

    if (
      extractedTruckId !== undefined &&
      extractedTruckId.toString() !== originalValues.truckId &&
      !performedReplacement
    ) {
      const newTruck = await Truck.findById(extractedTruckId);
      await createActivityLog(
        `Truck changed to ${(newTruck?.plateNo || "Unknown").toUpperCase()}`,
      );
    }

    if (
      extractedDriverId !== undefined &&
      extractedDriverId.toString() !== originalValues.driverId &&
      !performedDriverReplacement
    ) {
      const newDriver = await Driver.findById(extractedDriverId);
      await createActivityLog(
        `Driver changed to ${
          newDriver ? `${newDriver.firstname} ${newDriver.lastname}` : "Unknown"
        }`,
      );
    }

    if (truckType !== undefined && truckType !== originalValues.truckType)
      await createActivityLog(`Truck type changed to ${truckType}`);
    if (helperCount !== undefined && helperCount !== originalValues.helperCount)
      await createActivityLog(`Helper count changed to ${helperCount}`);
    if (destination !== undefined && destination !== originalValues.destination)
      await createActivityLog(`Destination changed to ${destination}`);
    if (
      receivingContactPerson !== undefined &&
      receivingContactPerson !== originalValues.receivingContactPerson
    )
      await createActivityLog(
        `Receiving contact person changed to ${receivingContactPerson}`,
      );
    if (
      receivingContactPersonNo !== undefined &&
      receivingContactPersonNo !== originalValues.receivingContactPersonNo
    )
      await createActivityLog(`Receiving contact person number changed`);
    if (
      totalSacksCount !== undefined &&
      computedSacksCount !== originalValues.totalSacksCount
    )
      await createActivityLog(`Sacks count changed to ${computedSacksCount}`);
    if (
      totalWeightKg !== undefined &&
      computedWeightKg !== originalValues.totalWeightKg
    )
      await createActivityLog(`Load weight changed to ${computedWeightKg} kg`);
    if (finalStatus !== undefined && finalStatus !== originalStatus)
      await createActivityLog(`Status changed to ${finalStatus}`);

    if (finalCancellationReason !== originalValues.cancellationReason) {
      if (finalStatus === "canceled" && finalCancellationReason)
        await createActivityLog(
          `Cancellation reason: ${finalCancellationReason}`,
        );
      else if (originalStatus === "canceled" && !finalCancellationReason)
        await createActivityLog(`Cancellation reason cleared`);
      else if (finalCancellationReason && originalValues.cancellationReason)
        await createActivityLog(
          `Cancellation reason updated to: ${finalCancellationReason}`,
        );
    }

    if (
      isTMOPrinted !== undefined &&
      isTMOPrinted !== originalValues.isTMOPrinted
    ) {
      await createActivityLog(
        `TMO ${isTMOPrinted ? "exported and printed" : "not exported"}`,
      );
    }

    if (
      isPaySlipPrinted !== undefined &&
      isPaySlipPrinted !== originalValues.isPaySlipPrinted
    ) {
      await createActivityLog(
        `Pay slip ${isPaySlipPrinted ? "exported and printed" : "not exported"}`,
      );
    }

    if (pickups !== undefined) {
      const oldCount = originalValues.pickups?.length || 0;
      const newCount = pickups.length;
      if (newCount > oldCount)
        await createActivityLog(
          `Added ${newCount - oldCount} pickup stop(s) (total: ${newCount})`,
        );
      else if (newCount < oldCount)
        await createActivityLog(
          `Removed ${oldCount - newCount} pickup stop(s) (total: ${newCount})`,
        );
      else await createActivityLog(`Pickup stops updated`);
    }

    const populatedDeployment =
      await Deployment.findById(id).populate(FULL_POPULATE);

    res.status(200).json({
      message: "Deployment updated successfully",
      deployment: populatedDeployment,
      timelineUpdates: timelineLogs.length > 0 ? timelineLogs : undefined,
    });
  } catch (error) {
    next(error);
  }
};

// ─── Soft delete deployment ────────────────────────────────────────────────────

const softDeleteDeployment = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!["head_admin", "admin"].includes(req.user.role)) {
      return next(createError(403, "Access denied"));
    }

    const deployment = await Deployment.findOne({
      _id: id,
      isSoftDeleted: { $ne: true },
    });
    if (!deployment) return next(createError(404, "Deployment not found"));

    // ── Company isolation: admins can only delete deployments in their company ──
    if (req.user.role === "admin" && deployment.company !== req.user.company) {
      return next(
        createError(
          403,
          "Access denied: deployment belongs to a different company",
        ),
      );
    }

    // Walk replacements array backwards to find the active truck and driver
    const lastTruckReplacement = deployment.replacements
      ?.slice()
      .reverse()
      .find((r) => r.replacementTruckId);

    const lastDriverReplacement = deployment.replacements
      ?.slice()
      .reverse()
      .find((r) => r.replacementDriverId);

    const activeTruckId =
      lastTruckReplacement?.replacementTruckId || deployment.truckId;
    const activeDriverId =
      lastDriverReplacement?.replacementDriverId || deployment.driverId;

    await Promise.all(
      [
        activeTruckId &&
          Truck.findByIdAndUpdate(activeTruckId, { status: "available" }),
        activeDriverId &&
          Driver.findByIdAndUpdate(activeDriverId, { status: "available" }),
      ].filter(Boolean),
    );

    const deploymentCode = deployment.deploymentCode;
    let timelineLogsDeleted = 0;

    try {
      const result = await TimelineLog.deleteMany({
        targetDeployment: deployment._id,
      });
      timelineLogsDeleted = result.deletedCount;
    } catch (err) {
      console.error(`Error deleting timeline logs for ${deploymentCode}:`, err);
    }

    deployment.isSoftDeleted = true;
    await deployment.save();

    await ActivityLog.create({
      type: "deployment",
      performedBy: req.user._id,
      action: `${deploymentCode}: Deployment deleted (${timelineLogsDeleted} timeline logs removed)`,
      targetDeployment: deployment._id,
    });

    res.status(200).json({
      message: "Deployment deleted successfully",
      deploymentCode,
      timelineLogsDeleted,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createDeployment,
  getAllDeployments,
  updateDeployment,
  softDeleteDeployment,
};
